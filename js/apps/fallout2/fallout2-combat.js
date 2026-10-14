/**
 * Fallout 2 Turn-Based AP Combat Engine
 * Implements: Action Points (AP), Sequence initiative, Hit Chance formulas,
 * Critical hits/misses, V.A.T.S. targeted strikes, Poison mechanics,
 * Enemy AI, and Cameron's unarmed duel concession check.
 */

class FalloutCombat {
  constructor(char, temple, audio, log) {
    this.char = char;
    this.temple = temple;
    this.audio = audio;
    this.log = log;

    this.inCombat = false;
    this.turn = 'player'; // 'player' | 'enemy'
    this.activeCombatants = [];
    this.selectedTarget = null;
  }

  startCombat(initiatingEnemy = null) {
    if (this.inCombat) return;

    this.inCombat = true;
    if (this.audio) this.audio.playUI('combat');
    this.log('*** НАЧАЛО БОЯ! ВЫ ВСТУПИЛИ В ПОШАГОВЫЙ РЕЖИМ ***');

    // Collect hostile enemies within combat range (8 tiles)
    this.activeCombatants = this.temple.enemies.filter(e => {
      if (e.isDead) return false;
      if (e.state === 'neutral') return false;
      const d = Math.hypot(e.x - this.char.x, e.y - this.char.y);
      return d <= 9;
    });

    if (initiatingEnemy && !this.activeCombatants.includes(initiatingEnemy)) {
      this.activeCombatants.push(initiatingEnemy);
    }

    // Sequence Initiative
    const playerSeq = this.char.getSequence();
    const enemySeq = 10; // Default enemy sequence

    if (playerSeq >= enemySeq) {
      this.turn = 'player';
      this.char.currentAp = this.char.ap;
      this.log('Ваша очередность хода выше! Вы ходите первым.');
    } else {
      this.turn = 'enemy';
      this.log('Враг застал вас врасплох и ходит первым!');
      setTimeout(() => this.processEnemyTurns(), 400);
    }

    if (window.falloutUI) window.falloutUI.updateHUD();
  }

  endCombat() {
    if (!this.inCombat) return;
    this.inCombat = false;
    this.turn = 'player';
    this.activeCombatants = [];
    this.log('Бой завершен. Все ближайшие враги повержены.');
    if (this.audio) this.audio.playUI('open');
    if (window.falloutUI) window.falloutUI.updateHUD();
  }

  // Player clicks tile in combat
  handleCombatTileClick(tx, ty) {
    if (!this.inCombat || this.turn !== 'player') return false;

    // 1. Check if clicked on an enemy (Attack)
    const enemy = this.temple.getEnemyAt(tx, ty);
    if (enemy && !enemy.isDead) {
      this.executePlayerAttack(enemy);
      return true;
    }

    // 2. Clicked on walkable floor (Move AP)
    if (this.temple.isWalkable(tx, ty)) {
      this.executePlayerMove(tx, ty);
      return true;
    }

    return false;
  }

  executePlayerMove(tx, ty) {
    if (this.char.currentAp <= 0) {
      this.log('Недостаточно Очков Действия (ОД) для перемещения!');
      if (this.audio) this.audio.playUI('click');
      return;
    }

    const path = window.falloutEngine.findPath(this.char.x, this.char.y, tx, ty);
    if (!path || path.length === 0) return;

    // Move only up to available AP (1 AP = 1 tile)
    const stepsToTake = Math.min(path.length, this.char.currentAp);
    if (stepsToTake <= 0) return;

    const actualPath = path.slice(0, stepsToTake);
    this.char.currentAp -= stepsToTake;

    // Execute step movement
    let i = 0;
    const stepInterval = setInterval(() => {
      if (i < actualPath.length) {
        const step = actualPath[i];
        const dx = step.x - this.char.x;
        const dy = step.y - this.char.y;
        const dsx = (dx - dy) * 32;
        if (dsx !== 0) this.char.facingLeft = (dsx < 0);

        this.char.x = step.x;
        this.char.y = step.y;
        this.temple.onStepTile(this.char.x, this.char.y);
        i++;
        if (window.falloutUI) window.falloutUI.updateHUD();
      } else {
        clearInterval(stepInterval);
      }
    }, 120);
  }

  executePlayerAttack(enemy, targetedPart = null) {
    const weapon = this.char.getActiveWeapon();

    if (weapon.type === 'consumable') {
      this.log(`В активной руке ${weapon.name}! Это не оружие. Нажмите на слот оружия внизу экрана, чтобы применить.`);
      if (this.audio) this.audio.playUI('click');
      return;
    }

    let apCost = weapon.apCost;
    if (targetedPart) apCost += 1; // +1 AP for VATS targeted strike

    // Check Cameron duel rules
    if (enemy.id === 'cameron' && enemy.hasDuelStarted) {
      if (weapon.id === 'spear') {
        this.log('Камерон кричит: "Это священная дуэль на кулаках! Брось оружие, или испытание не будет признано!"');
        if (this.audio) this.audio.playUI('click');
        return;
      }
    }

    if (this.char.currentAp < apCost) {
      this.log(`Недостаточно ОД! Для атаки требуется ${apCost} ОД (доступно: ${this.char.currentAp}).`);
      if (this.audio) this.audio.playUI('click');
      return;
    }

    // Check Distance
    const dist = Math.hypot(enemy.x - this.char.x, enemy.y - this.char.y);
    const reach = weapon.reach || 1;
    if (dist > reach + 0.5) {
      this.log(`Цель вне зоны досягаемости оружия! (Дистанция: ${dist.toFixed(1)}, макс: ${reach}). Подойдите ближе.`);
      if (this.audio) this.audio.playUI('click');
      return;
    }

    // If targeted mode is on and no body part provided, open VATS UI
    if (this.char.targetedMode && !targetedPart) {
      if (window.falloutUI) {
        window.falloutUI.openVATS(enemy);
        return;
      }
    }

    // Spend AP
    this.char.currentAp -= apCost;

    // Calculate Hit Chance
    const skillName = weapon.subtype === 'melee' ? 'melee' : 'unarmed';
    const baseSkill = this.char.skills[skillName] || 50;
    const targetAC = enemy.ac || 5;

    let hitMod = 0;
    let critMod = 0;
    let dmgMod = 1.0;
    let partName = 'Торс';

    if (targetedPart && window.VATS_TARGETS[targetedPart]) {
      const p = window.VATS_TARGETS[targetedPart];
      hitMod = p.hitMod;
      critMod = p.critMod;
      dmgMod = p.dmgMod;
      partName = p.name;
    }

    // Formula: Skill - AC + Modifiers
    let hitChance = Math.max(5, Math.min(95, baseSkill - targetAC + hitMod));
    const roll = Math.floor(Math.random() * 100) + 1;

    if (weapon.id === 'spear') {
      this.audio.playSpear();
    } else {
      this.audio.playPunch();
    }

    if (window.falloutEngine) {
      window.falloutEngine.triggerAttackAnim(this.char, enemy.x - this.char.x, enemy.y - this.char.y);
    }

    if (roll <= hitChance) {
      // Hit Success!
      const critChance = this.char.getCriticalChance() + critMod;
      const isCrit = Math.floor(Math.random() * 100) + 1 <= critChance;

      let baseDmg = Math.floor(Math.random() * (weapon.maxDmg - weapon.minDmg + 1)) + weapon.minDmg;
      baseDmg += this.char.getMeleeDamage();
      let totalDmg = Math.round(baseDmg * dmgMod);

      if (isCrit) {
        totalDmg = Math.round(totalDmg * 2.0);
        this.audio.playCrit();
        this.log(`*** КРИТИЧЕСКИЙ УДАР! Вы поразили (${partName}) ${enemy.name} на ${totalDmg} урона! ***`);
        if (window.falloutEngine) {
          window.falloutEngine.addFloatingText(`КРИТ -${totalDmg} HP`, enemy.x, enemy.y, '#ffff22');
        }
      } else {
        this.log(`Вы нанесли удар (${partName}) в ${enemy.name} на ${totalDmg} урона.`);
        if (window.falloutEngine) {
          window.falloutEngine.addFloatingText(`-${totalDmg} HP`, enemy.x, enemy.y, '#ff4433');
        }
      }

      if (window.falloutEngine) {
        window.falloutEngine.addBloodEffect(enemy.x, enemy.y);
      }

      enemy.hp -= totalDmg;

      // Check Cameron duel surrender condition
      if (enemy.id === 'cameron' && enemy.hp <= 12 && !enemy.hasSurrendered) {
        this.handleCameronSurrender(enemy);
        return;
      }

      // Check Enemy Death
      if (enemy.hp <= 0) {
        this.handleEnemyDeath(enemy);
      }
    } else {
      // Miss
      this.log(`Вы промахнулись по ${enemy.name}! (${roll}% при шансе ${hitChance}%)`);
      if (window.falloutEngine) {
        window.falloutEngine.addFloatingText('ПРОМАХ', enemy.x, enemy.y, '#aaaaaa');
      }
    }

    if (window.falloutUI) window.falloutUI.updateHUD();
  }

  handleCameronSurrender(cameron) {
    cameron.hasSurrendered = true;
    cameron.state = 'neutral';
    cameron.hp = 15;
    this.endCombat();

    this.log('Камерон отступает, поднимая ладони: "Стой! Довольно! Я признаю твою силу, Избранный!"');
    this.char.addXp(300, this.log);

    if (this.audio) this.audio.playLevelUp();
    if (window.falloutEngine) {
      window.falloutEngine.addFloatingText('ПОБЕДА В ДУЭЛИ! +300 XP', cameron.x, cameron.y, '#ffff44');
    }

    // Give player the Temple Key
    this.char.addItem('temple_key', 1);
    this.log('Камерон вручает вам Ключ Святилища: "Ты доказал свое право носить мантию Избранного. Врата Арройо открыты!"');

    const exitDoor = this.temple.doors.find(d => d.id === 'door_exit');
    if (exitDoor) {
      exitDoor.isOpen = true;
      exitDoor.isLocked = false;
    }
  }

  handleEnemyDeath(enemy) {
    enemy.isDead = true;
    enemy.hp = 0;
    this.log(`Враг ${enemy.name} уничтожен!`);

    const xp = enemy.type === 'scorpion' ? 60 : 35;
    this.char.addXp(xp, this.log);

    if (window.falloutEngine) {
      window.falloutEngine.addFloatingText(`+${xp} XP`, enemy.x, enemy.y, '#44ff44');
    }

    // Check if any hostile enemies remain in combat
    const remaining = this.activeCombatants.filter(e => !e.isDead);
    if (remaining.length === 0) {
      this.endCombat();
    }
  }

  endPlayerTurn() {
    if (!this.inCombat || this.turn !== 'player') return;

    this.turn = 'enemy';
    this.log('Ход переходит к противникам...');
    if (window.falloutUI) window.falloutUI.updateHUD();

    setTimeout(() => this.processEnemyTurns(), 350);
  }

  processEnemyTurns() {
    const livingEnemies = this.activeCombatants.filter(e => !e.isDead && e.state === 'hostile');

    if (livingEnemies.length === 0) {
      this.endCombat();
      return;
    }

    let enemyIndex = 0;

    const executeSingleEnemy = () => {
      if (enemyIndex >= livingEnemies.length) {
        // End of enemy phase -> Return turn to player
        this.onPlayerTurnStart();
        return;
      }

      const enemy = livingEnemies[enemyIndex];
      this.executeEnemyAI(enemy, () => {
        enemyIndex++;
        setTimeout(executeSingleEnemy, 250);
      });
    };

    executeSingleEnemy();
  }

  executeEnemyAI(enemy, onComplete) {
    enemy.currentAp = enemy.ap;

    const doAction = () => {
      if (enemy.currentAp <= 0 || enemy.isDead || this.char.hp <= 0) {
        onComplete();
        return;
      }

      const dist = Math.hypot(enemy.x - this.char.x, enemy.y - this.char.y);

      // Adjacent? Attack player!
      if (dist <= 1.5) {
        const attackCost = 3;
        if (enemy.currentAp >= attackCost) {
          enemy.currentAp -= attackCost;
          this.enemyAttackPlayer(enemy);
          setTimeout(doAction, 280);
          return;
        } else {
          onComplete();
          return;
        }
      }

      // Not adjacent: Move closer
      const path = window.falloutEngine.findPath(enemy.x, enemy.y, this.char.x, this.char.y, true);
      if (path && path.length > 0) {
        const nextTile = path[0];
        // If next tile is player tile, enemy reached adjacent cell -> attack!
        if (nextTile.x === this.char.x && nextTile.y === this.char.y) {
          const attackCost = 3;
          if (enemy.currentAp >= attackCost) {
            enemy.currentAp -= attackCost;
            this.enemyAttackPlayer(enemy);
            setTimeout(doAction, 280);
            return;
          } else {
            onComplete();
            return;
          }
        } else if (this.temple.isWalkable(nextTile.x, nextTile.y, false, enemy)) {
          enemy.x = nextTile.x;
          enemy.y = nextTile.y;
          enemy.currentAp -= 1;
          setTimeout(doAction, 160);
          return;
        }
      }

      onComplete();
    };

    doAction();
  }

  enemyAttackPlayer(enemy) {
    if (enemy.type === 'scorpion') {
      this.audio.playScorpion();
    } else {
      this.audio.playPunch();
    }

    if (window.falloutEngine) {
      window.falloutEngine.triggerAttackAnim(enemy, this.char.x - enemy.x, this.char.y - enemy.y);
    }

    const playerAC = this.char.getArmorClass();
    const hitChance = Math.max(15, Math.min(85, 65 - playerAC));
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= hitChance) {
      const dmg = Math.floor(Math.random() * (enemy.damageMax - enemy.damageMin + 1)) + enemy.damageMin;
      this.char.hp = Math.max(0, this.char.hp - dmg);
      this.log(`${enemy.name} атаковал вас и нанес ${dmg} урона!`);

      if (window.falloutEngine) {
        window.falloutEngine.addFloatingText(`-${dmg} HP`, this.char.x, this.char.y, '#ff2222');
        window.falloutEngine.addBloodEffect(this.char.x, this.char.y);
      }

      // Scorpion Poison Chance (30%)
      if (enemy.hasPoison && Math.random() < 0.35) {
        this.char.poison += 2;
        this.audio.playGeiger();
        this.log('Вы отравлены ядовитым жалом скорпиона! Уровень яда увеличился.');
        if (window.falloutEngine) {
          window.falloutEngine.addFloatingText('+ЯД!', this.char.x, this.char.y, '#22ff66');
        }
      }

      if (this.char.hp <= 0 && window.falloutUI) {
        window.falloutUI.onPlayerDeath();
      }
    } else {
      this.log(`${enemy.name} промахнулся по вам.`);
      if (window.falloutEngine) {
        window.falloutEngine.addFloatingText('ПРОМАХ', this.char.x, this.char.y, '#aaaaaa');
      }
    }

    if (window.falloutUI) window.falloutUI.updateHUD();
  }

  onPlayerTurnStart() {
    this.turn = 'player';
    this.char.currentAp = this.char.ap;

    // Check if any living hostile enemies are still in combat radius
    const hostilesNear = this.activeCombatants.filter(e => !e.isDead && e.state === 'hostile' && Math.hypot(e.x - this.char.x, e.y - this.char.y) <= 7);
    if (hostilesNear.length === 0) {
      this.endCombat();
      return;
    }

    // Poison Damage Tick
    if (this.char.poison > 0) {
      const pDmg = 1;
      this.char.hp = Math.max(0, this.char.hp - pDmg);
      this.char.poison = Math.max(0, this.char.poison - 1);
      this.log(`Яд разъедает тело: -${pDmg} ОЗ.`);
      if (window.falloutEngine) {
        window.falloutEngine.addFloatingText(`-${pDmg} HP (Яд)`, this.char.x, this.char.y, '#44ff66');
      }
      if (this.char.hp <= 0 && window.falloutUI) {
        window.falloutUI.onPlayerDeath();
      }
    }

    this.log('Ваш ход! Очки действия (ОД) восстановлены.');
    if (window.falloutUI) window.falloutUI.updateHUD();
  }

  toggleOrEndTurn() {
    if (!this.inCombat) {
      this.startCombat();
      return;
    }

    if (this.turn !== 'player') return;

    // If no hostile enemy is close (<= 4.5 tiles), exit combat back to exploration!
    const closeHostile = this.activeCombatants.find(e => !e.isDead && e.state === 'hostile' && Math.hypot(e.x - this.char.x, e.y - this.char.y) <= 4.5);
    if (!closeHostile) {
      this.endCombat();
      this.log('Враги далеко. Вы вышли из режима боя.');
      return;
    }

    this.endPlayerTurn();
  }
}

window.FalloutCombat = FalloutCombat;

