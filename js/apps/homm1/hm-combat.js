(function (H) {
  'use strict';

  function cloneHeroForCombat(hero, side, isCastleGarrison) {
    if (!hero) {
      return {
        id: side + '_captain',
        name: side === 'attacker' ? 'Атакующий' : 'Гарнизон',
        faction: 'neutral',
        atk: 0,
        def: 0,
        power: 1,
        knowledge: 1,
        morale: isCastleGarrison ? 1 : 0,
        luck: 0,
        hasSpellbook: false,
        spells: {},
        artifacts: []
      };
    }
    const copySpells = {};
    if (hero.spells) {
      for (const k of Object.keys(hero.spells)) copySpells[k] = hero.spells[k];
    }
    return {
      id: hero.id || (side + '_hero'),
      name: hero.name || 'Герой',
      faction: hero.faction || 'knight',
      owner: hero.owner || (side === 'attacker' ? 'blue' : 'red'),
      atk: hero.atk || 0,
      def: hero.def || 0,
      power: Math.max(1, hero.power || 1),
      knowledge: Math.max(1, hero.knowledge || 1),
      morale: H.clamp((hero.morale || 0) + (isCastleGarrison ? 1 : 0), -3, 3),
      luck: H.clamp(hero.luck || 0, 0, 3),
      hasSpellbook: !!hero.hasSpellbook,
      spells: copySpells,
      artifacts: Array.isArray(hero.artifacts) ? hero.artifacts.slice() : [],
      ref: hero
    };
  }

  class Combat {
    constructor(attacker, defender, opts) {
      const o = opts || {};
      this.rng = new H.RNG(o.seed || 12345);
      this.terrain = o.terrain || 'grass';
      this.siege = !!o.siege;
      this.town = o.town || null;
      this.attackerHero = cloneHeroForCombat(attacker && attacker.hero ? attacker.hero : attacker, 'attacker', false);
      const hasTavern = !!(this.town && this.town.buildings && this.town.buildings.tavern);
      this.defenderHero = cloneHeroForCombat(defender && defender.hero ? defender.hero : defender, 'defender', hasTavern);

      this.attackerSourceArmy = (attacker && attacker.army) ? attacker.army : (attacker && attacker.hero ? attacker.hero.army : []);
      this.defenderSourceArmy = (defender && defender.army) ? defender.army : (defender && defender.hero ? defender.hero.army : []);

      this.stacks = [];
      this.nextStackUid = 1;
      this.initStacks('attacker', this.attackerSourceArmy, this.attackerHero);
      this.initStacks('defender', this.defenderSourceArmy, this.defenderHero);

      this.obstacles = [];
      this.walls = { 0: 0, 1: 0, 3: 0, 4: 0 };
      this.gateHp = 0;
      this.bridgeDown = true;
      this.turretHp = 0;
      this.turretPower = 2;

      if (this.siege) {
        this.walls = { 0: 2, 1: 2, 3: 2, 4: 2 };
        this.gateHp = 2;
        this.bridgeDown = false;
        this.turretHp = 2;
        let builtDwellings = 1;
        if (this.town && this.town.buildings) {
          for (let t = 1; t <= 6; t++) {
            if (this.town.buildings['dwell_' + t]) builtDwellings++;
          }
        }
        this.turretPower = builtDwellings;
      } else if (!o.noObstacles) {
        this.generateObstacles();
      }

      this.round = 0;
      this.turnQueue = [];
      this.activeStack = null;
      this.castUsed = { attacker: false, defender: false };
      this.winner = null;
      this.outcome = null;
      this.xpAwarded = 0;
      this.levelUps = [];
      this.capturedArtifacts = [];
      this.fx = [];
      this.log = [];

      this.startRound();
    }

    addFx(entry) {
      this.fx.push(Object.assign({ ttl: 40 }, entry));
      if (this.fx.length > 12) this.fx.shift();
    }

    initStacks(side, armyArray, hero) {
      const list = Array.isArray(armyArray) ? armyArray : [];
      for (let slot = 0; slot < H.ARMY_SLOTS; slot++) {
        const entry = list[slot];
        if (!entry || !entry.unit || entry.count <= 0) continue;
        const u = H.UNITS[entry.unit];
        if (!u) continue;
        const dir = side === 'attacker' ? 1 : -1;
        const tailCol = side === 'attacker' ? 0 : (H.BF_COLS - 1);
        const headCol = u.wide ? (tailCol + dir) : tailCol;
        this.stacks.push({
          uid: this.nextStackUid++,
          side,
          slot,
          unit: u.id,
          def: u,
          name: u.name,
          count: entry.count | 0,
          initialCount: entry.count | 0,
          tempResurrected: 0,
          maxHp: u.hp,
          topHp: u.hp,
          baseAtk: u.atk,
          baseDef: u.def,
          minDmg: u.dmg[0],
          maxDmg: u.dmg[1],
          baseSpeed: u.speed,
          shots: u.shots || 0,
          maxShots: u.shots || 0,
          wide: !!u.wide,
          flying: !!u.flying,
          ranged: !!u.ranged,
          undead: !!u.undead,
          row: slot,
          headCol,
          tailCol,
          dir,
          retaliationsLeft: u.unlimitedRetaliation ? 999 : 1,
          actedThisRound: false,
          waitedThisRound: false,
          defending: false,
          inMoat: false,
          morale: u.undead ? 0 : hero.morale,
          luck: hero.luck,
          buffs: {},
          debuffs: {}
        });
      }
    }

    generateObstacles() {
      const blockedRows = new Set();
      const count = this.rng.int(2, 4);
      for (let i = 0; i < count; i++) {
        const col = this.rng.int(2, 4);
        const row = this.rng.int(0, H.BF_ROWS - 1);
        if (blockedRows.size >= 3 && !blockedRows.has(row)) continue;
        if (!this.obstacles.some(o => o.col === col && o.row === row)) {
          this.obstacles.push({ col, row });
          blockedRows.add(row);
        }
      }
    }

    heroFor(side) {
      return side === 'attacker' ? this.attackerHero : this.defenderHero;
    }

    enemySide(side) {
      return side === 'attacker' ? 'defender' : 'attacker';
    }

    aliveStacks(side) {
      return this.stacks.filter(s => s.count > 0 && (!side || s.side === side));
    }

    stackCells(s) {
      if (!s || s.count <= 0) return [];
      if (s.wide && s.headCol !== s.tailCol) {
        return [
          { col: s.headCol, row: s.row },
          { col: s.tailCol, row: s.row }
        ];
      }
      return [{ col: s.headCol, row: s.row }];
    }

    stackAt(col, row) {
      for (const s of this.stacks) {
        if (s.count <= 0) continue;
        if (s.row === row && (s.headCol === col || (s.wide && s.tailCol === col))) {
          return s;
        }
      }
      return null;
    }

    isObstacle(col, row) {
      if (col < 0 || col >= H.BF_COLS || row < 0 || row >= H.BF_ROWS) return true;
      if (this.obstacles.some(o => o.col === col && o.row === row)) return true;
      if (this.siege && col === 5) {
        if (row === 2) return !this.bridgeDown;
        return (this.walls[row] || 0) > 0;
      }
      return false;
    }

    isMoatCell(col, row) {
      if (!this.siege || col !== 4) return false;
      if (row === 2 && this.bridgeDown) return false;
      return true;
    }

    effectiveSpeed(s) {
      let spd = s.baseSpeed;
      if (s.buffs.haste > 0) spd = H.shiftSpeed(spd, 1);
      if (s.debuffs.slow > 0) spd = H.shiftSpeed(spd, -1);
      return spd;
    }

    effectiveSpeedRank(s) {
      return H.SPEED_ORDER.indexOf(this.effectiveSpeed(s));
    }

    effectiveAtk(s) {
      const h = this.heroFor(s.side);
      return s.baseAtk + (h ? h.atk : 0);
    }

    effectiveDef(s) {
      const h = this.heroFor(s.side);
      let d = s.baseDef + (h ? h.def : 0);
      if (s.defending) d += 2;
      if (s.buffs.shield > 0) d += 3;
      if (s.buffs.stoneskin > 0) d += 3;
      if (s.buffs.steelskin > 0) d += 5;
      return d;
    }

    canStackAct(s) {
      if (!s || s.count <= 0) return false;
      if (s.debuffs.blind > 0 || s.debuffs.paralyze > 0) return false;
      return true;
    }

    canStackRetaliate(s) {
      if (!s || s.count <= 0) return false;
      if (s.retaliationsLeft <= 0) return false;
      if (s.debuffs.blind > 0 || s.debuffs.paralyze > 0) return false;
      return true;
    }

    areStacksAdjacent(a, b) {
      const cellsA = this.stackCells(a);
      const cellsB = this.stackCells(b);
      for (const ca of cellsA) {
        for (const cb of cellsB) {
          if (Math.abs(ca.col - cb.col) <= 1 && Math.abs(ca.row - cb.row) <= 1) {
            if (ca.col !== cb.col || ca.row !== cb.row) return true;
          }
        }
      }
      return false;
    }

    adjacentEnemies(s) {
      const out = [];
      for (const other of this.stacks) {
        if (other.count <= 0 || other.side === s.side) continue;
        if (this.areStacksAdjacent(s, other)) out.push(other);
      }
      return out;
    }

    canShoot(s) {
      if (!s || s.count <= 0 || !s.ranged || s.shots <= 0) return false;
      if (this.adjacentEnemies(s).length > 0) return false;
      return true;
    }

    hasIntactWallsBetween(attackerStack, targetStack) {
      if (!this.siege) return false;
      const aInside = attackerStack.headCol >= 5;
      const tInside = targetStack.headCol >= 5;
      if (aInside === tInside) return false;
      const anyWallUp = (this.walls[0] > 0) || (this.walls[1] > 0) || (this.walls[3] > 0) || (this.walls[4] > 0) || !this.bridgeDown;
      return anyWallUp;
    }

    startRound() {
      if (this.checkBattleEnd()) return;
      this.round++;
      this.castUsed.attacker = false;
      this.castUsed.defender = false;

      for (const s of this.stacks) {
        if (s.count <= 0) continue;
        if (this.round > 1) {
          this.tickStatusEffects(s);
        }
        s.actedThisRound = false;
        s.waitedThisRound = false;
        s.defending = false;
        s.retaliationsLeft = s.def.unlimitedRetaliation ? 999 : 1;
        if (s.def.regenerates && s.topHp < s.maxHp) {
          s.topHp = s.maxHp;
          this.log.push(s.name + ' восстанавливают полное здоровье.');
        }
      }

      if (this.siege) {
        this.fireCatapult();
        this.fireTurret();
        if (this.checkBattleEnd()) return;
      }

      this.advanceTurn();
    }

    tickStatusEffects(s) {
      for (const k of Object.keys(s.buffs)) {
        if (s.buffs[k] > 0) {
          s.buffs[k]--;
          if (s.buffs[k] <= 0) delete s.buffs[k];
        }
      }
      for (const k of Object.keys(s.debuffs)) {
        if (s.debuffs[k] > 0) {
          s.debuffs[k]--;
          if (s.debuffs[k] <= 0) delete s.debuffs[k];
        }
      }
    }

    fireCatapult() {
      if (!this.siege || this.aliveStacks('attacker').length === 0) return;
      const targets = [];
      if (this.gateHp > 0) targets.push({ kind: 'gate', row: 2 });
      for (const r of [0, 1, 3, 4]) {
        if (this.walls[r] > 0) targets.push({ kind: 'wall', row: r });
      }
      if (this.turretHp > 0) targets.push({ kind: 'turret', row: 2 });
      if (!targets.length) return;

      const roll = this.rng.next();
      if (roll < 0.25) {
        this.log.push('Катапульта промахивается мимо крепостной стены.');
        return;
      }
      const dmg = roll < 0.75 ? 1 : 2;
      const tgt = targets[0];
      if (tgt.kind === 'gate') {
        this.gateHp = Math.max(0, this.gateHp - dmg);
        if (this.gateHp === 0) {
          this.bridgeDown = true;
          this.log.push('Катапульта разбивает цепи подъёмного моста: путь в замок открыт!');
        } else {
          this.log.push('Катапульта повреждает ворота замка.');
        }
      } else if (tgt.kind === 'wall') {
        this.walls[tgt.row] = Math.max(0, this.walls[tgt.row] - dmg);
        if (this.walls[tgt.row] === 0) {
          this.log.push('Катапульта обрушивает секцию крепостной стены!');
        } else {
          this.log.push('Катапульта пробивает брешь в кладке стены.');
        }
      } else if (tgt.kind === 'turret') {
        this.turretHp = Math.max(0, this.turretHp - dmg);
        this.log.push('Катапульта разрушает стрелковую башню замка!');
      }
    }

    fireTurret() {
      if (!this.siege || this.turretHp <= 0) return;
      const enemies = this.aliveStacks('attacker');
      if (!enemies.length) return;
      enemies.sort((a, b) => (b.ranged ? 1000 : 0) + H.unitPower(b.unit) * b.count - ((a.ranged ? 1000 : 0) + H.unitPower(a.unit) * a.count));
      const target = enemies[0];
      const dmg = this.rng.int(2, 3) * this.turretPower;
      const res = this.applyDamageToStack(target, dmg);
      this.log.push('Башня замка обстреливает отряд (' + target.name + '): ' + dmg + ' урона, погибло ' + res.killed + '.');
    }

    pickNextStack() {
      const candidates = this.stacks.filter(s => s.count > 0 && !s.actedThisRound);
      if (!candidates.length) return null;

      candidates.sort((a, b) => {
        if (a.waitedThisRound !== b.waitedThisRound) {
          return a.waitedThisRound ? 1 : -1;
        }
        const srA = this.effectiveSpeedRank(a);
        const srB = this.effectiveSpeedRank(b);
        if (srA !== srB) return srB - srA;
        if (a.slot !== b.slot) return a.slot - b.slot;
        if (a.side !== b.side) return a.side === 'attacker' ? -1 : 1;
        return a.uid - b.uid;
      });
      return candidates[0];
    }

    advanceTurn() {
      if (this.checkBattleEnd()) return;
      while (true) {
        const next = this.pickNextStack();
        if (!next) {
          this.startRound();
          return;
        }
        this.activeStack = next;

        if (!this.canStackAct(next)) {
          next.actedThisRound = true;
          this.log.push(next.name + ' не могут пошевелиться и пропускают ход.');
          continue;
        }

        if (next.morale < 0 && !next.undead) {
          const badChance = Math.abs(next.morale) / 12;
          if (this.rng.chance(badChance)) {
            next.actedThisRound = true;
            this.log.push(next.name + ' цепенеют от дурного предчувствия и теряют ход!');
            continue;
          }
        }

        if (next.debuffs.berserk > 0) {
          this.executeBerserkTurn(next);
          this.finishStackTurn(next, false);
          if (this.checkBattleEnd()) return;
          continue;
        }

        break;
      }
    }

    finishStackTurn(stack, allowGoodMorale) {
      if (!stack) return;
      if (allowGoodMorale && stack.count > 0 && stack.morale > 0 && !stack.undead && !stack.extraMoraleTurn) {
        const goodChance = stack.morale / 12;
        if (this.rng.chance(goodChance)) {
          stack.extraMoraleTurn = true;
          stack.actedThisRound = false;
          this.log.push('Высокий боевой дух воодушевляет отряд (' + stack.name + ') на второй ход!');
          return;
        }
      }
      stack.extraMoraleTurn = false;
      stack.actedThisRound = true;
      if (!this.checkBattleEnd()) {
        this.advanceTurn();
      }
    }

    canUnitStandAt(stack, headCol, row) {
      if (row < 0 || row >= H.BF_ROWS || headCol < 0 || headCol >= H.BF_COLS) return false;
      const tailCol = stack.wide ? (headCol - stack.dir) : headCol;
      if (tailCol < 0 || tailCol >= H.BF_COLS) return false;

      const checkCell = (c, r) => {
        if (this.isObstacle(c, r)) return false;
        const occ = this.stackAt(c, r);
        if (occ && occ.uid !== stack.uid) return false;
        return true;
      };

      if (!checkCell(headCol, row)) return false;
      if (stack.wide && !checkCell(tailCol, row)) return false;
      return true;
    }

    getReachableCells(stack) {
      const s = stack || this.activeStack;
      if (!s || s.count <= 0) return [];
      const maxSteps = s.flying ? 99 : (H.SPEED_COMBAT_RANGE[this.effectiveSpeed(s)] || 2);
      const reachable = [];

      if (s.flying) {
        for (let r = 0; r < H.BF_ROWS; r++) {
          for (let c = 0; c < H.BF_COLS; c++) {
            if (this.canUnitStandAt(s, c, r)) {
              reachable.push({ col: c, row: r, dist: Math.abs(c - s.headCol) + Math.abs(r - s.row) });
            }
          }
        }
        return reachable;
      }

      const distMap = new Map();
      const startKey = s.headCol + ':' + s.row;
      distMap.set(startKey, 0);
      const queue = [{ col: s.headCol, row: s.row, d: 0 }];

      while (queue.length > 0) {
        const cur = queue.shift();
        reachable.push({ col: cur.col, row: cur.row, dist: cur.d });
        if (cur.d >= maxSteps) continue;
        if (cur.d > 0 && this.isMoatCell(cur.col, cur.row)) continue;

        const dirs = [
          [1, 0], [-1, 0], [0, 1], [0, -1],
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        for (const [dc, dr] of dirs) {
          const nc = cur.col + dc;
          const nr = cur.row + dr;
          const key = nc + ':' + nr;
          if (distMap.has(key)) continue;
          if (!this.canUnitStandAt(s, nc, nr)) continue;
          distMap.set(key, cur.d + 1);
          queue.push({ col: nc, row: nr, d: cur.d + 1 });
        }
      }
      return reachable;
    }

    moveStackTo(stack, headCol, row) {
      const s = stack || this.activeStack;
      if (!s || s !== this.activeStack) return false;
      const reach = this.getReachableCells(s);
      const found = reach.find(p => p.col === headCol && p.row === row);
      if (!found) return false;

      const crossedGate = this.siege && !this.bridgeDown && s.side === 'defender' && ((s.headCol >= 5 && headCol <= 4) || (headCol === 5 && row === 2));
      if (crossedGate) {
        this.bridgeDown = true;
        this.log.push('Защитники опускают подъёмный мост замка.');
      }

      s.headCol = headCol;
      s.tailCol = s.wide ? (headCol - s.dir) : headCol;
      s.row = row;
      s.inMoat = this.isMoatCell(s.headCol, s.row) || (s.wide && this.isMoatCell(s.tailCol, s.row));

      this.finishStackTurn(s, true);
      return true;
    }

    waitStack() {
      const s = this.activeStack;
      if (!s) return false;
      if (!s.waitedThisRound) {
        s.waitedThisRound = true;
        this.log.push(s.name + ' выжидают лучшего момента.');
        this.advanceTurn();
        return true;
      }
      return this.defendStack();
    }

    defendStack() {
      const s = this.activeStack;
      if (!s) return false;
      s.defending = true;
      this.log.push(s.name + ' встают в глухую оборону (+2 Защита).');
      this.finishStackTurn(s, false);
      return true;
    }

    rollStackBaseDamage(attackerStack) {
      const n = Math.max(1, attackerStack.count);
      if (attackerStack.buffs.bless > 0 || attackerStack.minDmg === attackerStack.maxDmg) {
        return attackerStack.maxDmg * n;
      }
      if (attackerStack.debuffs.curse > 0) {
        return attackerStack.minDmg * n;
      }
      const samples = Math.min(n, 10);
      let sum = 0;
      for (let i = 0; i < samples; i++) {
        sum += this.rng.int(attackerStack.minDmg, attackerStack.maxDmg);
      }
      return Math.round(sum * (n / samples));
    }

    calcDamage(attackerStack, targetStack, opts) {
      const o = opts || {};
      let base = this.rollStackBaseDamage(attackerStack);
      let lucky = false;
      if (!o.noLuck && attackerStack.luck > 0 && this.rng.chance(attackerStack.luck / 12)) {
        base *= 2;
        lucky = true;
      }
      const A = this.effectiveAtk(attackerStack);
      const D = this.effectiveDef(targetStack);
      let mult = 1.0;
      if (A >= D) {
        mult = 1.0 + Math.min(3.0, 0.10 * (A - D));
      } else {
        mult = Math.max(0.30, 1.0 - 0.05 * (D - A));
      }
      let dmg = base * mult;
      if (o.isRanged) {
        if (this.hasIntactWallsBetween(attackerStack, targetStack)) {
          dmg *= 0.5;
        }
        if (targetStack.buffs.shield > 0) {
          dmg *= 0.5;
        }
      } else if (attackerStack.ranged && !attackerStack.def.noMeleePenalty) {
        dmg *= 0.5;
      }
      return {
        damage: Math.max(1, Math.floor(dmg)),
        lucky
      };
    }

    estimateDamageRange(attackerStack, targetStack, isRanged) {
      if (!attackerStack || !targetStack || attackerStack.count <= 0 || targetStack.count <= 0) {
        return { minDmg: 0, maxDmg: 0, minKilled: 0, maxKilled: 0 };
      }
      const n = Math.max(1, attackerStack.count);
      const lowPerUnit = attackerStack.buffs.bless > 0 ? attackerStack.maxDmg : attackerStack.minDmg;
      const highPerUnit = attackerStack.debuffs.curse > 0 ? attackerStack.minDmg : attackerStack.maxDmg;
      const A = this.effectiveAtk(attackerStack);
      const D = this.effectiveDef(targetStack);
      const mult = A >= D ? (1.0 + Math.min(3.0, 0.10 * (A - D))) : Math.max(0.30, 1.0 - 0.05 * (D - A));
      let pen = 1.0;
      if (isRanged) {
        if (this.hasIntactWallsBetween(attackerStack, targetStack)) pen *= 0.5;
        if (targetStack.buffs.shield > 0) pen *= 0.5;
      } else if (attackerStack.ranged && !attackerStack.def.noMeleePenalty) {
        pen *= 0.5;
      }
      const volleys = (isRanged && attackerStack.def.doubleShot && attackerStack.shots >= 2) ? 2 : ( !isRanged && attackerStack.def.doubleStrike ? 2 : 1 );
      const minDmg = Math.max(1, Math.floor(lowPerUnit * n * mult * pen)) * volleys;
      const maxDmg = Math.max(1, Math.floor(highPerUnit * n * mult * pen)) * volleys;
      const totalHp = (targetStack.count - 1) * targetStack.maxHp + targetStack.topHp;
      const calcKills = d => {
        const remHp = Math.max(0, totalHp - d);
        if (remHp <= 0) return targetStack.count;
        return targetStack.count - Math.ceil(remHp / targetStack.maxHp);
      };
      return {
        minDmg,
        maxDmg,
        minKilled: calcKills(minDmg),
        maxKilled: calcKills(maxDmg)
      };
    }

    applyDamageToStack(target, damage) {
      if (!target || target.count <= 0 || damage <= 0) {
        return { killed: 0, remaining: target ? target.count : 0, brokeCC: false };
      }
      const totalHpBefore = (target.count - 1) * target.maxHp + target.topHp;
      const totalHpAfter = Math.max(0, totalHpBefore - damage);
      const beforeCount = target.count;

      if (totalHpAfter <= 0) {
        target.count = 0;
        target.topHp = 0;
      } else {
        target.count = Math.ceil(totalHpAfter / target.maxHp);
        const rem = totalHpAfter % target.maxHp;
        target.topHp = rem === 0 ? target.maxHp : rem;
      }

      const killed = beforeCount - target.count;
      this.addFx({
        kind: 'damage',
        col: target.headCol,
        row: target.row,
        damage,
        killed,
        text: `-${damage}` + (killed > 0 ? ` (\u2620${killed})` : '')
      });
      if (target.tempResurrected > 0 && killed > 0) {
        target.tempResurrected = Math.max(0, target.tempResurrected - killed);
      }

      let brokeCC = false;
      if (target.debuffs.blind > 0) {
        delete target.debuffs.blind;
        brokeCC = true;
      }
      if (target.debuffs.paralyze > 0) {
        delete target.debuffs.paralyze;
        brokeCC = true;
      }
      return { killed, remaining: target.count, brokeCC };
    }

    performSingleMeleeStrike(attacker, target, allowBreath) {
      if (attacker.count <= 0 || target.count <= 0) return;

      const calc = this.calcDamage(attacker, target, { isRanged: false });
      let dmg = calc.damage;
      if (calc.lucky) {
        this.log.push('Удача сопутствует отряду (' + attacker.name + ')!');
      }

      const res = this.applyDamageToStack(target, dmg);
      let totalKilled = res.killed;

      if (attacker.def.halveChance && target.count >= 2 && !target.def.magicImmune && this.rng.chance(attacker.def.halveChance)) {
        const extraKill = Math.floor(target.count / 2);
        if (extraKill > 0) {
          target.count -= extraKill;
          totalKilled += extraKill;
          this.log.push('Джинны одним касанием уполовинивают отряд (' + target.name + ')!');
        }
      }

      this.log.push(attacker.name + ' атакуют отряд (' + target.name + '): ' + dmg + ' урона, погибло ' + totalKilled + '.');

      if (attacker.def.soulSteal && !target.undead && totalKilled > 0) {
        attacker.count += totalKilled;
        this.log.push(attacker.name + ' обращают павших врагов в ' + totalKilled + ' новых призраков!');
      }

      if (target.count > 0 && !target.undead && !target.def.magicImmune && !target.buffs.antimagic) {
        if (attacker.def.paralyzeChance && this.rng.chance(attacker.def.paralyzeChance)) {
          target.debuffs.paralyze = 3;
          this.log.push(target.name + ' парализованы взглядом Циклопа!');
        }
        if (attacker.def.blindChance && this.rng.chance(attacker.def.blindChance)) {
          target.debuffs.blind = 3;
          this.log.push(target.name + ' ослеплены вспышкой рога Единорога!');
        }
      }

      if (allowBreath && attacker.def.twoHexBreath) {
        const stepCol = target.headCol > attacker.headCol ? 1 : (target.headCol < attacker.headCol ? -1 : attacker.dir);
        const stepRow = target.row > attacker.row ? 1 : (target.row < attacker.row ? -1 : 0);
        const targetCells = this.stackCells(target);
        const checkedUids = new Set([attacker.uid, target.uid]);
        for (const tc of targetCells) {
          const behindCol = tc.col + stepCol;
          const behindRow = tc.row + stepRow;
          const behindStack = this.stackAt(behindCol, behindRow);
          if (behindStack && !checkedUids.has(behindStack.uid)) {
            checkedUids.add(behindStack.uid);
            const bCalc = this.calcDamage(attacker, behindStack, { isRanged: false, noLuck: true });
            const bRes = this.applyDamageToStack(behindStack, bCalc.damage);
            this.log.push('Огненное дыхание (' + attacker.name + ') задевает отряд позади (' + behindStack.name + '): погибло ' + bRes.killed + '.');
          }
        }
      }
    }

    meleeAttack(attacker, target, moveFromCell) {
      const s = attacker || this.activeStack;
      if (!s || !target || s.count <= 0 || target.count <= 0) return false;

      if (moveFromCell) {
        const reach = this.getReachableCells(s);
        const canStand = reach.find(p => p.col === moveFromCell.col && p.row === moveFromCell.row);
        if (!canStand) return false;
        s.headCol = moveFromCell.col;
        s.tailCol = s.wide ? (moveFromCell.col - s.dir) : moveFromCell.col;
        s.row = moveFromCell.row;
      }

      if (!this.areStacksAdjacent(s, target)) return false;

      if (s.def.allAroundAttack) {
        const neighbors = this.adjacentEnemies(s);
        for (const enemy of neighbors) {
          this.performSingleMeleeStrike(s, enemy, false);
        }
        this.finishStackTurn(s, true);
        return true;
      }

      const targetCouldRetaliateBeforeHit = this.canStackRetaliate(target) && !s.def.noRetaliation;
      this.performSingleMeleeStrike(s, target, true);

      if (targetCouldRetaliateBeforeHit && target.count > 0 && this.canStackRetaliate(target)) {
        target.retaliationsLeft--;
        this.performSingleMeleeStrike(target, s, false);
      }

      if (s.def.doubleStrike && s.count > 0 && target.count > 0) {
        this.performSingleMeleeStrike(s, target, true);
      }

      this.finishStackTurn(s, true);
      return true;
    }

    rangedAttack(attacker, target) {
      const s = attacker || this.activeStack;
      if (!s || !target || s.count <= 0 || target.count <= 0) return false;
      if (!this.canShoot(s)) return false;

      const volleys = (s.def.doubleShot && s.shots >= 2) ? 2 : 1;
      for (let v = 0; v < volleys; v++) {
        if (target.count <= 0 || s.shots <= 0) break;
        s.shots--;
        const calc = this.calcDamage(s, target, { isRanged: true });
        if (calc.lucky) {
          this.log.push('Удачный залп отряда (' + s.name + ')!');
        }
        const res = this.applyDamageToStack(target, calc.damage);
        this.log.push(s.name + ' обстреливают отряд (' + target.name + '): ' + calc.damage + ' урона, погибло ' + res.killed + '.');
      }

      this.finishStackTurn(s, true);
      return true;
    }

    attackWallSegment(row) {
      const s = this.activeStack;
      if (!s || !this.siege || !s.def.siegeSmasher) return false;
      if (row === 2 && this.gateHp > 0) {
        this.gateHp = 0;
        this.bridgeDown = true;
        this.log.push(s.name + ' сокрушают ворота замка!');
        this.finishStackTurn(s, true);
        return true;
      }
      if (this.walls[row] > 0) {
        this.walls[row] = 0;
        this.log.push(s.name + ' проламывают крепостную стену!');
        this.finishStackTurn(s, true);
        return true;
      }
      return false;
    }

    canHeroCast(side, spellId) {
      const hero = this.heroFor(side);
      if (!hero || !hero.hasSpellbook || this.castUsed[side]) return false;
      const sp = H.SPELLS[spellId];
      if (!sp || sp.category !== 'combat') return false;
      if (!hero.spells || (hero.spells[spellId] || 0) <= 0) return false;
      return true;
    }

    isTargetSpellImmune(target, spell) {
      if (!target || target.count <= 0) return true;
      if (target.def.magicImmune) return true;
      if (target.buffs.antimagic > 0 && spell.id !== 'dispel') return true;
      if (spell.elemental && target.def.elementalImmune) return true;
      if (spell.undeadImmune && target.undead) return true;
      if (spell.kind === 'damage_undead' && !target.undead) return true;
      return false;
    }

    castSpell(side, spellId, targetArg) {
      if (!this.canHeroCast(side, spellId)) return { ok: false, reason: 'cannot_cast' };
      const hero = this.heroFor(side);
      const sp = H.SPELLS[spellId];
      const power = Math.max(1, hero.power || 1);

      const consume = () => {
        hero.spells[spellId]--;
        if (hero.ref && hero.ref.spells) {
          hero.ref.spells[spellId] = hero.spells[spellId];
        }
        this.castUsed[side] = true;
      };

      const checkHostileResist = target => {
        if (this.isTargetSpellImmune(target, sp)) return true;
        if (target.side !== side && target.def.magicResist && this.rng.chance(target.def.magicResist)) {
          this.log.push(target.name + ' отражают чары (' + sp.name + ')!');
          return true;
        }
        return false;
      };

      if (sp.kind === 'damage' || sp.kind === 'damage_undead') {
        const target = targetArg;
        if (!target || target.count <= 0) return { ok: false, reason: 'bad_target' };
        if (this.isTargetSpellImmune(target, sp)) return { ok: false, reason: 'immune' };
        consume();
        if (checkHostileResist(target)) return { ok: true, resisted: true };
        const dmg = sp.dmgPerPower * power;
        const res = this.applyDamageToStack(target, dmg);
        this.log.push(hero.name + ' творит «' + sp.name + '» на отряд (' + target.name + '): ' + dmg + ' урона, погибло ' + res.killed + '.');
        this.checkBattleEnd();
        return { ok: true, damage: dmg, killed: res.killed };
      }

      if (sp.kind === 'area_damage') {
        const col = targetArg && typeof targetArg.col === 'number' ? targetArg.col : (targetArg ? targetArg.headCol : -1);
        const row = targetArg && typeof targetArg.row === 'number' ? targetArg.row : (targetArg ? targetArg.row : -1);
        if (col < 0 || row < 0) return { ok: false, reason: 'bad_cell' };
        consume();
        const dmg = sp.dmgPerPower * power;
        const hitStacks = new Set();
        for (const s of this.stacks) {
          if (s.count <= 0) continue;
          for (const c of this.stackCells(s)) {
            if (Math.abs(c.col - col) <= sp.radius && Math.abs(c.row - row) <= sp.radius) {
              hitStacks.add(s);
            }
          }
        }
        let totalKilled = 0;
        for (const s of hitStacks) {
          if (checkHostileResist(s)) continue;
          const res = this.applyDamageToStack(s, dmg);
          totalKilled += res.killed;
        }
        this.log.push(hero.name + ' обрушивает «' + sp.name + '»: погибло ' + totalKilled + '.');
        this.checkBattleEnd();
        return { ok: true, damage: dmg, killed: totalKilled };
      }

      if (sp.kind === 'mass_damage') {
        consume();
        const dmg = sp.dmgPerPower * power;
        let totalKilled = 0;
        for (const s of this.stacks) {
          if (s.count <= 0) continue;
          if (checkHostileResist(s)) continue;
          const res = this.applyDamageToStack(s, dmg);
          totalKilled += res.killed;
        }
        this.log.push(hero.name + ' вызывает «' + sp.name + '» на всё поле боя: погибло ' + totalKilled + '.');
        this.checkBattleEnd();
        return { ok: true, damage: dmg, killed: totalKilled };
      }

      if (sp.kind === 'buff') {
        const target = targetArg;
        if (!target || target.count <= 0 || target.side !== side) return { ok: false, reason: 'bad_target' };
        if (this.isTargetSpellImmune(target, sp)) return { ok: false, reason: 'immune' };
        consume();
        const dur = (sp.durationPerPower || 1) * power;
        if (sp.effect === 'bless') delete target.debuffs.curse;
        if (sp.effect === 'haste') delete target.debuffs.slow;
        target.buffs[sp.effect] = dur;
        this.log.push(hero.name + ' накладывает «' + sp.name + '» на отряд (' + target.name + ').');
        return { ok: true, duration: dur };
      }

      if (sp.kind === 'debuff') {
        const target = targetArg;
        if (!target || target.count <= 0 || target.side === side) return { ok: false, reason: 'bad_target' };
        if (this.isTargetSpellImmune(target, sp)) return { ok: false, reason: 'immune' };
        consume();
        if (checkHostileResist(target)) return { ok: true, resisted: true };
        const dur = (sp.durationPerPower || 1) * power;
        if (sp.effect === 'curse') delete target.buffs.bless;
        if (sp.effect === 'slow') delete target.buffs.haste;
        target.debuffs[sp.effect] = dur;
        this.log.push(hero.name + ' накладывает «' + sp.name + '» на отряд (' + target.name + ').');
        return { ok: true, duration: dur };
      }

      if (sp.kind === 'heal') {
        const target = targetArg;
        if (!target || target.count <= 0 || target.side !== side) return { ok: false, reason: 'bad_target' };
        if (this.isTargetSpellImmune(target, sp)) return { ok: false, reason: 'immune' };
        consume();
        const healAmt = (sp.healPerPower || 5) * power;
        target.topHp = Math.min(target.maxHp, target.topHp + healAmt);
        if (sp.cleansesDebuffs) target.debuffs = {};
        this.log.push(hero.name + ' исцеляет отряд (' + target.name + ').');
        return { ok: true, healed: healAmt };
      }

      if (sp.kind === 'dispel') {
        const target = targetArg;
        if (!target || target.count <= 0) return { ok: false, reason: 'bad_target' };
        if (target.def.magicImmune) return { ok: false, reason: 'immune' };
        consume();
        target.buffs = {};
        target.debuffs = {};
        this.log.push(hero.name + ' снимает все чары с отряда (' + target.name + ').');
        return { ok: true };
      }

      if (sp.kind === 'teleport') {
        const target = targetArg && targetArg.stack ? targetArg.stack : null;
        const col = targetArg ? targetArg.col : -1;
        const row = targetArg ? targetArg.row : -1;
        if (!target || target.count <= 0 || target.side !== side) return { ok: false, reason: 'bad_target' };
        if (this.isTargetSpellImmune(target, sp)) return { ok: false, reason: 'immune' };
        if (!this.canUnitStandAt(target, col, row)) return { ok: false, reason: 'cell_blocked' };
        consume();
        target.headCol = col;
        target.tailCol = target.wide ? (col - target.dir) : col;
        target.row = row;
        target.inMoat = this.isMoatCell(target.headCol, target.row);
        this.log.push(hero.name + ' телепортирует отряд (' + target.name + ').');
        return { ok: true };
      }

      if (sp.kind === 'resurrect') {
        const target = targetArg;
        if (!target || target.side !== side || target.undead || target.def.magicImmune) return { ok: false, reason: 'bad_target' };
        if (target.count >= target.initialCount && target.topHp === target.maxHp) return { ok: false, reason: 'full_stack' };
        consume();
        const hpPool = (sp.hpPerPower || 50) * power;
        const maxTotalHp = target.initialCount * target.maxHp;
        const curTotalHp = target.count > 0 ? ((target.count - 1) * target.maxHp + target.topHp) : 0;
        const newTotalHp = Math.min(maxTotalHp, curTotalHp + hpPool);
        const newCount = Math.ceil(newTotalHp / target.maxHp);
        const revived = Math.max(0, newCount - target.count);
        target.count = newCount;
        const rem = newTotalHp % target.maxHp;
        target.topHp = rem === 0 ? target.maxHp : rem;
        if (sp.temporary && revived > 0) {
          target.tempResurrected += revived;
        }
        this.log.push(hero.name + ' воскрешает ' + revived + ' воинов в отряде (' + target.name + ').');
        return { ok: true, revived };
      }

      return { ok: false, reason: 'unsupported' };
    }

    executeBerserkTurn(stack) {
      const others = this.stacks.filter(o => o.count > 0 && o.uid !== stack.uid);
      if (!others.length) return;
      others.sort((a, b) => {
        const da = Math.abs(a.headCol - stack.headCol) + Math.abs(a.row - stack.row);
        const db = Math.abs(b.headCol - stack.headCol) + Math.abs(b.row - stack.row);
        return da - db;
      });
      const victim = others[0];
      if (this.areStacksAdjacent(stack, victim)) {
        this.performSingleMeleeStrike(stack, victim, true);
        if (victim.count > 0 && this.canStackRetaliate(victim) && !stack.def.noRetaliation) {
          victim.retaliationsLeft--;
          this.performSingleMeleeStrike(victim, stack, false);
        }
        return;
      }
      const reach = this.getReachableCells(stack);
      let bestMove = null;
      let bestDist = 999;
      for (const cell of reach) {
        const d = Math.abs(cell.col - victim.headCol) + Math.abs(cell.row - victim.row);
        if (d < bestDist) {
          bestDist = d;
          bestMove = cell;
        }
      }
      if (bestMove) {
        stack.headCol = bestMove.col;
        stack.tailCol = stack.wide ? (bestMove.col - stack.dir) : bestMove.col;
        stack.row = bestMove.row;
        if (this.areStacksAdjacent(stack, victim)) {
          this.performSingleMeleeStrike(stack, victim, true);
        }
      }
    }

    retreat(side) {
      if (this.winner) return false;
      this.winner = this.enemySide(side);
      this.outcome = side + '_retreated';
      for (const s of this.stacks) {
        if (s.side === side) s.count = 0;
      }
      this.finalizeCombat();
      return true;
    }

    flee(side) {
      return this.retreat(side);
    }

    surrender(side) {
      if (this.winner) return false;
      this.winner = this.enemySide(side);
      this.outcome = side + '_surrendered';
      this.finalizeCombat();
      return true;
    }

    checkBattleEnd() {
      if (this.winner) return true;
      const attAlive = this.aliveStacks('attacker').length;
      const defAlive = this.aliveStacks('defender').length;
      if (attAlive > 0 && defAlive > 0) return false;

      if (attAlive > 0) {
        this.winner = 'attacker';
        this.outcome = 'attacker_victory';
      } else {
        this.winner = 'defender';
        this.outcome = 'defender_victory';
      }
      this.finalizeCombat();
      return true;
    }

    finalizeCombat() {
      for (const s of this.stacks) {
        if (s.count > 0 && s.tempResurrected > 0) {
          s.count = Math.max(0, s.count - s.tempResurrected);
          s.tempResurrected = 0;
          if (s.count === 0 && this.aliveStacks(s.side).length === 0) {
            s.count = 1;
            s.topHp = 1;
          }
        }
      }

      const loserSide = this.enemySide(this.winner);
      let xp = 0;
      for (const s of this.stacks) {
        if (s.side === loserSide) {
          const dead = Math.max(0, s.initialCount - s.count);
          xp += dead * s.maxHp;
        }
      }
      if (this.siege && this.winner === 'attacker') xp += 500;
      this.xpAwarded = xp;

      const winHero = this.heroFor(this.winner);
      const loseHero = this.heroFor(loserSide);
      if (winHero && loseHero && loseHero.artifacts && loseHero.artifacts.length > 0 && !this.outcome.endsWith('surrendered')) {
        for (const artId of loseHero.artifacts) {
          const artDef = H.ARTIFACTS[artId];
          if (artDef && !artDef.ultimate) {
            this.capturedArtifacts.push(artId);
            if (winHero.ref) H.giveHeroArtifact(winHero.ref, artId);
          }
        }
      }
      if (winHero && winHero.ref && xp > 0) {
        this.levelUps = H.grantHeroXp(winHero.ref, xp, this.rng);
      }

      this.syncSourceArmy('attacker', this.attackerSourceArmy);
      this.syncSourceArmy('defender', this.defenderSourceArmy);
    }

    syncSourceArmy(side, sourceArmy) {
      if (!Array.isArray(sourceArmy)) return;
      for (let i = 0; i < H.ARMY_SLOTS; i++) {
        const st = this.stacks.find(s => s.side === side && s.slot === i);
        if (!st || st.count <= 0) {
          sourceArmy[i] = null;
        } else {
          sourceArmy[i] = { unit: st.unit, count: st.count };
        }
      }
      const hero = this.heroFor(side);
      if (hero && hero.ref) {
        hero.ref.tempMorale = 0;
        hero.ref.tempLuck = 0;
        H.recalcHeroStats(hero.ref);
      }
    }

    tryAICastSpell(side) {
      const hero = this.heroFor(side);
      if (!hero || !hero.hasSpellbook || this.castUsed[side]) return false;
      const enemies = this.aliveStacks(this.enemySide(side));
      const allies = this.aliveStacks(side);
      if (!enemies.length || !allies.length) return false;

      if (this.canHeroCast(side, 'armageddon')) {
        const allDragons = allies.every(a => a.def.magicImmune);
        const enemyVulnerable = enemies.some(e => !e.def.magicImmune);
        if (allDragons && enemyVulnerable) {
          this.castSpell(side, 'armageddon');
          return true;
        }
      }

      for (const spId of ['resurrect_true', 'resurrect']) {
        if (this.canHeroCast(side, spId)) {
          const wounded = allies.find(a => a.count < a.initialCount && !a.undead && !a.def.magicImmune);
          if (wounded) {
            this.castSpell(side, spId, wounded);
            return true;
          }
        }
      }

      for (const spId of ['paralyze', 'blind', 'berserk', 'slow', 'curse']) {
        if (this.canHeroCast(side, spId)) {
          const valid = enemies.filter(e => !this.isTargetSpellImmune(e, H.SPELLS[spId]) && !e.debuffs[H.SPELLS[spId].effect]);
          if (valid.length) {
            valid.sort((a, b) => H.unitPower(b.unit) * b.count - H.unitPower(a.unit) * a.count);
            this.castSpell(side, spId, valid[0]);
            return true;
          }
        }
      }

      for (const spId of ['lightning_bolt', 'magic_arrow']) {
        if (this.canHeroCast(side, spId)) {
          const valid = enemies.filter(e => !this.isTargetSpellImmune(e, H.SPELLS[spId]));
          if (valid.length) {
            valid.sort((a, b) => (b.ranged ? 500 : 0) + H.unitPower(b.unit) * b.count - ((a.ranged ? 500 : 0) + H.unitPower(a.unit) * a.count));
            this.castSpell(side, spId, valid[0]);
            return true;
          }
        }
      }

      for (const spId of ['haste', 'bless', 'steelskin', 'stoneskin', 'shield']) {
        if (this.canHeroCast(side, spId)) {
          const valid = allies.filter(a => !this.isTargetSpellImmune(a, H.SPELLS[spId]) && !a.buffs[H.SPELLS[spId].effect]);
          if (valid.length) {
            valid.sort((a, b) => H.unitPower(b.unit) * b.count - H.unitPower(a.unit) * a.count);
            this.castSpell(side, spId, valid[0]);
            return true;
          }
        }
      }

      return false;
    }

    stepAI() {
      if (this.checkBattleEnd()) return false;
      const s = this.activeStack;
      if (!s) return false;

      this.tryAICastSpell(s.side);
      if (this.checkBattleEnd()) return false;

      const enemies = this.aliveStacks(this.enemySide(s.side));
      if (!enemies.length) return false;

      if (this.canShoot(s)) {
        enemies.sort((a, b) => {
          const scoreA = (a.ranged ? 2000 : 0) + (a.flying ? 1000 : 0) + H.unitPower(a.unit) * a.count;
          const scoreB = (b.ranged ? 2000 : 0) + (b.flying ? 1000 : 0) + H.unitPower(b.unit) * b.count;
          return scoreB - scoreA;
        });
        return this.rangedAttack(s, enemies[0]);
      }

      const adj = this.adjacentEnemies(s);
      if (adj.length > 0) {
        adj.sort((a, b) => H.unitPower(b.unit) * b.count - H.unitPower(a.unit) * a.count);
        return this.meleeAttack(s, adj[0], null);
      }

      const reach = this.getReachableCells(s);
      let bestAttack = null;
      let bestScore = -1e9;

      for (const cell of reach) {
        const fakeStack = { headCol: cell.col, tailCol: s.wide ? (cell.col - s.dir) : cell.col, row: cell.row, wide: s.wide };
        for (const e of enemies) {
          if (this.areStacksAdjacent(fakeStack, e)) {
            const sc = (e.ranged ? 1500 : 0) + H.unitPower(e.unit) * e.count - cell.dist * 10;
            if (sc > bestScore) {
              bestScore = sc;
              bestAttack = { cell, target: e };
            }
          }
        }
      }

      if (bestAttack) {
        return this.meleeAttack(s, bestAttack.target, bestAttack.cell);
      }

      if (this.siege && s.side === 'attacker' && s.def.siegeSmasher) {
        for (const cell of reach) {
          if (cell.col === 4) {
            if (cell.row === 2 && this.gateHp > 0) {
              this.moveStackTo(s, cell.col, cell.row);
              return true;
            }
          }
        }
      }

      let bestMove = null;
      let minDist = 9999;
      for (const cell of reach) {
        if (cell.col === s.headCol && cell.row === s.row) continue;
        for (const e of enemies) {
          const d = Math.abs(cell.col - e.headCol) + Math.abs(cell.row - e.row);
          if (d < minDist) {
            minDist = d;
            bestMove = cell;
          }
        }
      }

      if (bestMove) {
        return this.moveStackTo(s, bestMove.col, bestMove.row);
      }

      return this.defendStack();
    }

    runAutoCombat(maxSteps) {
      const limit = maxSteps || 600;
      let steps = 0;
      while (!this.winner && steps < limit) {
        this.stepAI();
        steps++;
      }
      if (!this.winner) {
        this.winner = 'defender';
        this.outcome = 'stalemate';
        this.finalizeCombat();
      }
      return {
        winner: this.winner,
        outcome: this.outcome,
        rounds: this.round,
        xpAwarded: this.xpAwarded,
        capturedArtifacts: this.capturedArtifacts
      };
    }
  }

  Object.assign(H, {
    Combat,
    cloneHeroForCombat
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
