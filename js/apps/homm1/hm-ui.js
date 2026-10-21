(function (H) {
  'use strict';

  const SAVE_KEY = 'win98_homm1_save_v1';

  function inRect(px, py, rect) {
    const [x, y, w, h] = rect;
    return px >= x && py >= y && px < x + w && py < y + h;
  }

  function formatCostShort(cost) {
    if (!cost) return '0 З';
    const parts = [];
    for (const k of H.RES_ORDER) {
      if (cost[k] > 0) {
        parts.push(cost[k] + ' ' + H.RESOURCES[k].short);
      }
    }
    return parts.join(', ') || 'Бесплатно';
  }

  function maxAffordableCount(resources, unitCost, available) {
    let best = 0;
    for (let n = 1; n <= available; n++) {
      if (H.canAfford(resources, H.scaleCost(unitCost, n))) {
        best = n;
      } else {
        break;
      }
    }
    return best;
  }

  class GameUI {
    constructor(canvas, opts) {
      const o = opts || {};
      this.canvas = canvas || null;
      this.ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
      this.audio = new H.AudioEngine();
      if (o.muted) this.audio.setMuted(true);

      this.screen = 'menu';
      this.menuFaction = 'knight';
      this.menuMode = 'campaign';
      this.menuCampaignIdx = 0;
      this.menuStandaloneId = H.STANDALONE_MAPS[0].id;
      this.menuDifficulty = 'normal';

      this.world = null;
      this.activeCombat = null;
      this.pendingCombatSpell = null;
      this.pendingAdventureSpell = null;
      this.camX = 0;
      this.camY = 0;
      this.plannedPath = null;
      this.plannedTarget = null;
      this.isWalking = false;
      this.walkTickCounter = 0;
      this.selectedArmySlot = null;
      this.townSlotSel = null;
      this.modal = null;
      this.statusText = 'Выберите правителя и сценарий для начала похода.';
      this.hoverText = '';
      this.hoverTile = null;
      this.hoverBfCell = null;
      this.hoverBuildingId = null;
      this.tick = 0;
      this.rafId = null;

      if (this.canvas && typeof this.canvas.addEventListener === 'function') {
        this.bindEvents();
      }
    }

    hasSavedGame() {
      try {
        return typeof localStorage !== 'undefined' && !!localStorage.getItem(SAVE_KEY);
      } catch (e) {
        return false;
      }
    }

    saveGame() {
      if (!this.world) return false;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SAVE_KEY, this.world.serialize());
          this.statusText = 'Игра успешно сохранена (F5).';
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    }

    loadGame() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(SAVE_KEY);
          if (raw) {
            this.world = H.World.deserialize(raw);
            this.world.interactiveCombat = true;
            this.world.interactivePrompts = true;
            this.screen = 'adventure';
            this.isWalking = false;
            this.plannedPath = null;
            this.plannedTarget = null;
            this.centerCameraOnSelectedHero();
            this.statusText = 'Сохранённая кампания загружена.';
            this.render();
            return true;
          }
        }
      } catch (e) {
        return false;
      }
      return false;
    }

    startCampaignOrScenario() {
      const worldOpts = {
        humanFaction: this.menuFaction,
        difficulty: this.menuDifficulty,
        interactiveCombat: true,
        interactivePrompts: true,
        seed: 2026 + (this.menuMode === 'campaign' ? this.menuCampaignIdx * 17 : 77)
      };
      if (this.menuMode === 'campaign') {
        worldOpts.campaignIndex = this.menuCampaignIdx;
      } else {
        worldOpts.standaloneId = this.menuStandaloneId;
      }

      this.world = new H.World(worldOpts);
      this.screen = 'adventure';
      this.isWalking = false;
      this.plannedPath = null;
      this.plannedTarget = null;
      this.pendingAdventureSpell = null;
      this.centerCameraOnSelectedHero();
      this.audio.startMusic('adventure');

      if (this.menuMode === 'campaign') {
        const sc = H.CAMPAIGN_SCENARIOS[this.menuCampaignIdx];
        const intro = sc && sc.intros[this.menuFaction];
        if (intro) {
          this.showInfoModal(sc.title, this.wrapText(intro, 52));
        }
      }
      this.render();
    }

    startQuickSkirmish() {
      const att = H.createHero('lord_kilburn', 'blue', new H.RNG(101));
      att.hasSpellbook = true;
      att.power = 3;
      att.knowledge = 3;
      att.spells = { magic_arrow: 3, bless: 2, haste: 2, fireball: 1, cure: 2 };
      att.army = [
        { unit: 'paladin', count: 4 },
        { unit: 'cavalry', count: 8 },
        { unit: 'swordsman', count: 14 },
        { unit: 'archer', count: 24 },
        { unit: 'pikeman', count: 20 }
      ];

      const def = H.createHero('agar', 'red', new H.RNG(202));
      def.power = 3;
      def.knowledge = 3;
      def.army = [
        { unit: 'dragon', count: 2 },
        { unit: 'hydra', count: 5 },
        { unit: 'minotaur', count: 10 },
        { unit: 'griffin', count: 14 },
        { unit: 'centaur', count: 30 }
      ];

      this.world = null;
      this.activeCombat = new H.Combat(att, def, { seed: 404 });
      this.screen = 'combat';
      this.audio.startMusic('combat');
      this.advanceAICombatTurns();
      this.render();
    }

    wrapText(str, maxChars) {
      const words = String(str || '').split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > maxChars) {
          if (cur) lines.push(cur);
          cur = w;
        } else {
          cur = (cur ? cur + ' ' : '') + w;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    }

    showInfoModal(title, lines, onClose, customDraw) {
      const textLines = Array.isArray(lines) ? lines : this.wrapText(lines, 52);
      const mh = Math.max(240, Math.min(420, 120 + textLines.length * 20));
      this.modal = {
        w: 460,
        h: mh,
        title,
        lines: textLines,
        customDraw: customDraw || null,
        buttons: [
          {
            x: 170,
            y: mh - 44,
            w: 120,
            h: 28,
            label: 'Продолжить',
            primary: true,
            onClick: () => {
              this.modal = null;
              if (onClose) onClose();
            }
          }
        ]
      };
    }

    centerCameraOnSelectedHero() {
      if (!this.world) return;
      const h = this.world.getHero(this.world.selectedHeroId);
      const t = this.world.getTown(this.world.selectedTownId);
      const cx = h ? h.x : (t ? t.x : 7);
      const cy = h ? h.y : (t ? t.y : 7);
      this.camX = H.clamp(cx - (H.VIEW_TILES >> 1), 0, Math.max(0, this.world.map.w - H.VIEW_TILES));
      this.camY = H.clamp(cy - (H.VIEW_TILES >> 1), 0, Math.max(0, this.world.map.h - H.VIEW_TILES));
    }

    bindEvents() {
      const toCanvasCoords = e => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = H.W / Math.max(1, rect.width);
        const scaleY = H.H / Math.max(1, rect.height);
        return {
          px: Math.floor((e.clientX - rect.left) * scaleX),
          py: Math.floor((e.clientY - rect.top) * scaleY)
        };
      };

      this._onMouseDown = e => {
        const { px, py } = toCanvasCoords(e);
        if (e.button === 2) {
          this.handleRightClick(px, py);
        } else {
          this.handleClick(px, py, e.shiftKey);
        }
      };
      this._onMouseMove = e => {
        const { px, py } = toCanvasCoords(e);
        this.handleMouseMove(px, py);
      };
      this._onMouseLeave = () => {
        this.hoverText = '';
        this.hoverTile = null;
        this.hoverBfCell = null;
        this.hoverBuildingId = null;
      };
      this._onContext = e => e.preventDefault();
      this._onKeyDown = e => this.handleKeyDown(e.key, e);

      this.canvas.addEventListener('mousedown', this._onMouseDown);
      this.canvas.addEventListener('mousemove', this._onMouseMove);
      this.canvas.addEventListener('mouseleave', this._onMouseLeave);
      this.canvas.addEventListener('contextmenu', this._onContext);
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', this._onKeyDown);
      }
    }

    destroy() {
      this.audio.stopMusic();
      if (this.rafId && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.canvas && this._onMouseDown) {
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
        this.canvas.removeEventListener('contextmenu', this._onContext);
      }
      if (typeof window !== 'undefined' && this._onKeyDown) {
        window.removeEventListener('keydown', this._onKeyDown);
      }
    }

    startLoop() {
      const step = () => {
        this.tick++;
        if (this.isWalking) {
          this.walkTickCounter++;
          if (this.walkTickCounter >= 4) {
            this.walkTickCounter = 0;
            this.stepAnimatedHeroMove();
          }
        }
        this.render();
        if (typeof requestAnimationFrame !== 'undefined') {
          this.rafId = requestAnimationFrame(step);
        }
      };
      step();
    }

    render() {
      if (!this.ctx) return;
      if (this.screen === 'menu') {
        H.renderMenuScreen(this.ctx, this);
      } else if (this.screen === 'town') {
        H.renderTownScreen(this.ctx, this);
      } else if (this.screen === 'combat') {
        H.renderCombatScreen(this.ctx, this);
      } else if (this.world) {
        H.renderAdventureScreen(this.ctx, this);
      }
      if (this.modal) {
        H.renderModalOverlay(this.ctx, this);
      }
    }

    describeOwner(ownerId) {
      if (!ownerId) return 'Нейтралы';
      const p = this.world && this.world.getPlayer(ownerId);
      return p ? `${p.name} (${p.rulerName})` : ownerId;
    }

    describeAdventureTile(tx, ty) {
      const world = this.world;
      if (!world || !H.inBounds(world.map, tx, ty)) return '';
      if (!world.isTileVisible('blue', tx, ty)) {
        return 'Неразведанная территория под туманом войны.';
      }
      const heroAt = world.getHeroAt(tx, ty);
      if (heroAt) {
        return `Полководец ${heroAt.name} (${H.FACTIONS[heroAt.faction].name}, Ур.${heroAt.level}) [${this.describeOwner(heroAt.owner)}]`;
      }
      const town = world.getTownAt(tx, ty);
      if (town) {
        return `${town.name} (${H.FACTIONS[town.faction].name}, ${town.buildings.castle ? 'Замок' : 'Деревня'}) [${this.describeOwner(town.owner)}]`;
      }
      const mine = (world.map.mines || []).find(m => m.x === tx && m.y === ty);
      if (mine) {
        const rDef = H.RESOURCES[mine.res] || H.RESOURCES.gold;
        const guard = H.findGuardMonsterAtOrAdjacent(world, 'blue', tx, ty);
        const gTxt = guard ? ` | Охрана: ${H.troopSizeLabel(guard.count)} (${H.UNITS[guard.unit].name})` : '';
        return `Шахта: ${rDef.name} (+${rDef.daily}/день) [${this.describeOwner(mine.owner)}]${gTxt}`;
      }
      const obj = (world.map.objects || []).find(o => !o.removed && o.x === tx && o.y === ty);
      if (obj) {
        if (obj.type === 'monster') {
          const u = H.UNITS[obj.unit] || H.UNITS.goblin;
          return `Вражеский отряд: ${H.troopSizeLabel(obj.count)} (${u.name}, ${obj.count} шт.). Кликните для атаки!`;
        }
        if (obj.type === 'artifact') {
          const a = H.ARTIFACTS[obj.artifactId];
          return a ? `Артефакт: ${a.name} (${a.desc})` : 'Древний артефакт';
        }
        if (obj.type === 'resource_pile') {
          const r = H.RESOURCES[obj.res] || H.RESOURCES.gold;
          return `Запасы: ${r.name} (+${obj.amount || (obj.res === 'gold' ? 500 : 8)})`;
        }
        if (obj.type === 'shrine') {
          const sp = H.SPELLS[obj.spell];
          return `Святилище магии: обучает заклинанию «${sp ? sp.name : obj.spell}»`;
        }
        const def = H.MAP_OBJECTS[obj.type];
        const selHero = world.getHero(world.selectedHeroId);
        const visited = obj.cleared || (obj.visitedWeek && obj.visitedWeek === world.totalWeeks()) || (selHero && selHero.visited && selHero.visited[obj.id]);
        const vTxt = visited ? ' (Уже посещено)' : '';
        return def ? `${def.name}: ${def.desc}${vTxt}` : obj.type;
      }
      const boat = (world.map.boats || []).find(b => !b.occupied && b.x === tx && b.y === ty);
      if (boat) {
        return 'Свободный парусник (кликните для посадки на борт).';
      }
      const terr = H.terrainAt(world.map, tx, ty);
      const tDef = H.TERRAINS[terr] || H.TERRAINS.grass;
      if (H.isBlockedTile(world.map, tx, ty)) {
        return `Непроходимая преграда (${tDef.name}).`;
      }
      return `Местность: ${tDef.name} (расход очков хода: ${tDef.moveCost}).`;
    }

    handleMouseMove(px, py) {
      this.hoverText = '';
      this.hoverTile = null;
      this.hoverBfCell = null;
      this.hoverBuildingId = null;

      if (this.modal) return;

      if (this.screen === 'adventure' && this.world) {
        const world = this.world;
        const hero = world.getHero(world.selectedHeroId);

        if (inRect(px, py, [H.VIEW_X, H.VIEW_Y, H.VIEW_W, H.VIEW_H])) {
          const tx = this.camX + Math.floor((px - H.VIEW_X) / 32);
          const ty = this.camY + Math.floor((py - H.VIEW_Y) / 32);
          this.hoverTile = { x: tx, y: ty };
          if (this.pendingAdventureSpell === 'dimension_door') {
            this.hoverText = `Выберите клетку для «Двери измерений» (${tx}, ${ty}). Правый клик : отмена.`;
          } else {
            this.hoverText = this.describeAdventureTile(tx, ty);
          }
          return;
        }

        if (hero) {
          for (let s = 0; s < H.ARMY_SLOTS; s++) {
            if (inRect(px, py, [480 + s * 30, 340, 28, 38])) {
              const stack = hero.army[s];
              if (stack && stack.count > 0) {
                const u = H.UNITS[stack.unit];
                this.hoverText = `${u.name} (${stack.count} шт.) : А:${u.atk} З:${u.def} Урон:${u.dmg[0]}-${u.dmg[1]} ОЗ:${u.hp}. ПКМ: инфо, Shift+клик: разделить.`;
              } else {
                this.hoverText = 'Свободный слот армии героя.';
              }
              return;
            }
          }
        }
      } else if (this.screen === 'town' && this.world) {
        const town = this.world.getTown(this.world.selectedTownId);
        if (!town) return;

        if (py >= 16 && py < 352) {
          const defs = H.listTownBuildings(town.faction, town.coastal);
          for (const def of defs) {
            if (!def || !def.rect) continue;
            const [bx, by, bw, bh] = def.rect;
            if (inRect(px, py, [bx, by + 16, bw, bh])) {
              this.hoverBuildingId = def.id;
              const isBuilt = !!town.buildings[def.id];
              if (isBuilt) {
                if (def.tier && def.unit) {
                  const u = H.UNITS[def.unit];
                  const avail = town.available[def.tier] || 0;
                  this.hoverText = `${def.name}: найм «${u.name}» (доступно: ${avail}, цена: ${formatCostShort(u.cost)}). Клик : нанять.`;
                } else {
                  this.hoverText = `${def.name} (Построено) : кликните для открытия.`;
                }
              } else {
                this.hoverText = `${def.name} (Не построено, цена: ${formatCostShort(def.cost)}) : кликните для возведения.`;
              }
              return;
            }
          }
        }

        const visiting = this.world.getHeroAt(town.x, town.y);
        for (let i = 0; i < H.ARMY_SLOTS; i++) {
          if (inRect(px, py, [370 + i * 50, 372, 46, 38])) {
            const st = town.garrison[i];
            if (st && st.count > 0) {
              const u = H.UNITS[st.unit];
              this.hoverText = `Гарнизон: ${u.name} (${st.count}) : Клик: переместить, Shift+клик: разделить, ПКМ: инфо.`;
            }
            return;
          }
          if (visiting && inRect(px, py, [370 + i * 50, 424, 46, 38])) {
            const st = visiting.army[i];
            if (st && st.count > 0) {
              const u = H.UNITS[st.unit];
              this.hoverText = `Армия героя: ${u.name} (${st.count}) : Клик: переместить, Shift+клик: разделить, ПКМ: инфо.`;
            }
            return;
          }
        }
      } else if (this.screen === 'combat') {
        const combat = this.activeCombat || (this.world && this.world.activeCombat);
        if (!combat) return;
        if (inRect(px, py, [H.BF_X, H.BF_Y, H.BF_COLS * H.BF_CELL_W, H.BF_ROWS * H.BF_CELL_H])) {
          const col = Math.floor((px - H.BF_X) / H.BF_CELL_W);
          const row = Math.floor((py - H.BF_Y) / H.BF_CELL_H);
          this.hoverBfCell = { col, row };
          const st = combat.stackAt(col, row);
          const active = combat.activeStack;
          if (st) {
            if (active && active.side === 'attacker' && st.side === 'defender' && !this.pendingCombatSpell) {
              if (combat.canShoot(active)) {
                const est = combat.estimateDamageRange(active, st, true);
                this.hoverText = `Выстрел по «${st.name}» (${st.count}): урон ${est.minDmg}..${est.maxDmg}, погибнет ${est.minKilled}..${est.maxKilled}`;
                return;
              }
              const canMelee = combat.areStacksAdjacent(active, st) || combat.getReachableCells(active).some(c => {
                const fake = { headCol: c.col, tailCol: active.wide ? c.col - active.dir : c.col, row: c.row, wide: active.wide };
                return combat.areStacksAdjacent(fake, st);
              });
              if (canMelee) {
                const est = combat.estimateDamageRange(active, st, false);
                this.hoverText = `Атака по «${st.name}» (${st.count}): урон ${est.minDmg}..${est.maxDmg}, погибнет ${est.minKilled}..${est.maxKilled}`;
                return;
              }
            }
            this.hoverText = `${st.name} (${st.count}) : ОЗ:${st.topHp}/${st.maxHp}, А:${combat.effectiveAtk(st)} З:${combat.effectiveDef(st)} Урон:${st.minDmg}-${st.maxDmg}. ПКМ: инфо.`;
          }
        }
      }
    }

    openUnitInspectModal(unitId, count, stackInCombat) {
      const u = H.UNITS[unitId];
      if (!u) return;
      const lines = [
        `Численность: ${count || 1} | Уровень: ${u.tier} (${H.FACTIONS[u.faction] ? H.FACTIONS[u.faction].name : 'Нейтралы'})`,
        `Атака: ${u.atk} | Защита: ${u.def} | Урон: ${u.dmg[0]}-${u.dmg[1]} | Здоровье: ${stackInCombat ? stackInCombat.topHp + '/' + u.hp : u.hp}`,
        `Скорость: ${(H.SPEED_LABELS && H.SPEED_LABELS[u.speed]) || u.speed} | Выстрелов: ${stackInCombat ? stackInCombat.shots : (u.shots || 0)}`,
        `Стоимость: ${formatCostShort(u.cost)} | Прирост: ${u.growth}/нед.`
      ];
      if (u.abilityText) {
        lines.push(`Особенность: ${u.abilityText}`);
      }
      if (stackInCombat) {
        const bNames = Object.keys(stackInCombat.buffs || {}).map(k => H.SPELLS[k] ? H.SPELLS[k].name : k);
        const dNames = Object.keys(stackInCombat.debuffs || {}).map(k => H.SPELLS[k] ? H.SPELLS[k].name : k);
        if (bNames.length || dNames.length) {
          lines.push(`Чары: ${bNames.concat(dNames).join(', ')}`);
        }
      }
      this.showInfoModal(u.name, lines, null, (ctx, mx, my, mw) => {
        H.drawMarbleFrame(ctx, mx + mw - 76, my + 44, 56, 56, '#18120e');
        H.drawUnitSprite(ctx, unitId, mx + mw - 70, my + 50, 44, 44, false);
      });
      this.render();
    }

    handleRightClick(px, py) {
      if (this.modal) {
        this.modal = null;
        this.render();
        return;
      }

      if (this.screen === 'combat') {
        if (this.pendingCombatSpell) {
          this.pendingCombatSpell = null;
          this.statusText = 'Выбор заклинания отменён.';
          this.render();
          return;
        }
        const combat = this.activeCombat || (this.world && this.world.activeCombat);
        if (combat && inRect(px, py, [H.BF_X, H.BF_Y, H.BF_COLS * H.BF_CELL_W, H.BF_ROWS * H.BF_CELL_H])) {
          const col = Math.floor((px - H.BF_X) / H.BF_CELL_W);
          const row = Math.floor((py - H.BF_Y) / H.BF_CELL_H);
          const st = combat.stackAt(col, row);
          if (st) {
            this.openUnitInspectModal(st.unit, st.count, st);
          }
        }
        return;
      }

      if (this.screen === 'town' && this.world) {
        const town = this.world.getTown(this.world.selectedTownId);
        if (!town) return;
        const visiting = this.world.getHeroAt(town.x, town.y);
        for (let i = 0; i < H.ARMY_SLOTS; i++) {
          if (inRect(px, py, [370 + i * 50, 372, 46, 38]) && town.garrison[i]) {
            this.openUnitInspectModal(town.garrison[i].unit, town.garrison[i].count, null);
            return;
          }
          if (visiting && inRect(px, py, [370 + i * 50, 424, 46, 38]) && visiting.army[i]) {
            this.openUnitInspectModal(visiting.army[i].unit, visiting.army[i].count, null);
            return;
          }
        }
        return;
      }

      if (this.screen === 'adventure' && this.world) {
        if (this.pendingAdventureSpell) {
          this.pendingAdventureSpell = null;
          this.statusText = 'Походное заклинание отменено.';
          this.render();
          return;
        }
        const hero = this.world.getHero(this.world.selectedHeroId);
        if (hero) {
          for (let s = 0; s < H.ARMY_SLOTS; s++) {
            if (inRect(px, py, [480 + s * 30, 340, 28, 38]) && hero.army[s]) {
              this.openUnitInspectModal(hero.army[s].unit, hero.army[s].count, null);
              return;
            }
          }
        }
        if (inRect(px, py, [H.VIEW_X, H.VIEW_Y, H.VIEW_W, H.VIEW_H])) {
          const tx = this.camX + Math.floor((px - H.VIEW_X) / 32);
          const ty = this.camY + Math.floor((py - H.VIEW_Y) / 32);
          this.statusText = this.describeAdventureTile(tx, ty);
          this.render();
        }
      }
    }

    handleClick(px, py, shiftKey) {
      if (this.isWalking) {
        this.isWalking = false;
        this.render();
        return;
      }

      if (this.modal) {
        const mw = this.modal.w || 460;
        const mh = this.modal.h || 320;
        const mx = (H.W - mw) >> 1;
        const my = (H.H - mh) >> 1;
        for (const b of this.modal.buttons || []) {
          if (!b.disabled && inRect(px, py, [mx + b.x, my + b.y, b.w, b.h])) {
            if (b.onClick) b.onClick();
            this.render();
            return;
          }
        }
        return;
      }

      if (this.screen === 'menu') {
        this.handleMenuClick(px, py);
      } else if (this.screen === 'adventure') {
        this.handleAdventureClick(px, py, shiftKey);
      } else if (this.screen === 'town') {
        this.handleTownClick(px, py, shiftKey);
      } else if (this.screen === 'combat') {
        this.handleCombatClick(px, py);
      }
      this.render();
    }

    handleMenuClick(px, py) {
      for (let i = 0; i < H.FACTION_ORDER.length; i++) {
        if (inRect(px, py, [40 + i * 142, 120, 132, 116])) {
          this.menuFaction = H.FACTION_ORDER[i];
          return;
        }
      }
      if (inRect(px, py, [40, 266, 130, 26])) {
        this.menuMode = 'campaign';
        return;
      }
      if (inRect(px, py, [180, 266, 150, 26])) {
        this.menuMode = 'standalone';
        return;
      }
      const list = this.menuMode === 'campaign' ? H.CAMPAIGN_SCENARIOS : H.STANDALONE_MAPS;
      for (let i = 0; i < list.length; i++) {
        const col = i % 2;
        const row = (i / 2) | 0;
        if (inRect(px, py, [40 + col * 280, 300 + row * 26, 270, 22])) {
          if (this.menuMode === 'campaign') this.menuCampaignIdx = i;
          else this.menuStandaloneId = list[i].id;
          return;
        }
      }
      const diffKeys = ['easy', 'normal', 'hard', 'expert', 'impossible'];
      for (let i = 0; i < diffKeys.length; i++) {
        if (inRect(px, py, [350 + i * 50, 266, 48, 26])) {
          this.menuDifficulty = diffKeys[i];
          return;
        }
      }
      if (inRect(px, py, [40, 416, 180, 34])) {
        this.startCampaignOrScenario();
        return;
      }
      if (inRect(px, py, [230, 416, 180, 34])) {
        this.startQuickSkirmish();
        return;
      }
      if (inRect(px, py, [420, 416, 180, 34]) && this.hasSavedGame()) {
        this.loadGame();
      }
    }

    handleAdventureClick(px, py, shiftKey) {
      const world = this.world;
      if (!world) return;
      const hero = world.getHero(world.selectedHeroId);

      if (inRect(px, py, [H.MINIMAP_X, H.MINIMAP_Y, H.MINIMAP_SIZE, H.MINIMAP_SIZE])) {
        const scale = H.MINIMAP_SIZE / world.map.w;
        const tx = Math.floor((px - H.MINIMAP_X) / scale);
        const ty = Math.floor((py - H.MINIMAP_Y) / scale);
        this.camX = H.clamp(tx - (H.VIEW_TILES >> 1), 0, Math.max(0, world.map.w - H.VIEW_TILES));
        this.camY = H.clamp(ty - (H.VIEW_TILES >> 1), 0, Math.max(0, world.map.h - H.VIEW_TILES));
        return;
      }

      if (inRect(px, py, [H.VIEW_X, H.VIEW_Y, H.VIEW_W, H.VIEW_H])) {
        const tx = this.camX + Math.floor((px - H.VIEW_X) / 32);
        const ty = this.camY + Math.floor((py - H.VIEW_Y) / 32);

        if (this.pendingAdventureSpell === 'dimension_door' && hero) {
          this.pendingAdventureSpell = null;
          const res = world.castAdventureSpell(hero, 'dimension_door', { x: tx, y: ty });
          if (res.ok) {
            this.audio.playSfx('spell');
            this.centerCameraOnSelectedHero();
            this.statusText = 'Герой перенёсся сквозь Дверь измерений!';
          } else {
            this.statusText = 'Туда нельзя перенестись (слишком далеко или клетка занята).';
          }
          return;
        }

        const townAt = world.getTownAt(tx, ty);
        if (townAt && townAt.owner === 'blue' && (!hero || (hero.x === tx && hero.y === ty))) {
          world.selectedTownId = townAt.id;
          this.openTownScreen(townAt.id);
          return;
        }

        const clickedHero = world.getHeroAt(tx, ty);
        if (clickedHero && clickedHero.owner === 'blue' && (!hero || clickedHero.id === hero.id)) {
          if (hero && clickedHero.id === hero.id) {
            this.openHeroModal(hero);
          } else {
            world.selectedHeroId = clickedHero.id;
            this.plannedPath = null;
            this.plannedTarget = null;
          }
          return;
        }

        if (hero) {
          if (this.plannedTarget && this.plannedTarget.x === tx && this.plannedTarget.y === ty && this.plannedPath && this.plannedPath.reachable) {
            this.executeHeroMove();
          } else {
            this.plannedTarget = { x: tx, y: ty };
            this.plannedPath = H.findPath(world, hero, tx, ty);
            if (this.plannedPath.reachable) {
              this.statusText = `Маршрут к (${tx}, ${ty}): шагов ${this.plannedPath.steps.length} (дней: ${this.plannedPath.days}). Щёлкните ещё раз для похода.`;
            } else {
              this.statusText = 'Туда нельзя пройти.';
            }
          }
        }
        return;
      }

      const myHeroes = world.getPlayerHeroes('blue');
      for (let i = 0; i < 4; i++) {
        if (inRect(px, py, [476, 180 + i * 27, 74, 24]) && myHeroes[i]) {
          if (world.selectedHeroId === myHeroes[i].id) {
            this.openHeroModal(myHeroes[i]);
          } else {
            world.selectedHeroId = myHeroes[i].id;
            this.plannedPath = null;
            this.plannedTarget = null;
            this.centerCameraOnSelectedHero();
          }
          return;
        }
      }

      const myTowns = world.getPlayerTowns('blue');
      for (let i = 0; i < 4; i++) {
        if (inRect(px, py, [556, 180 + i * 27, 76, 24]) && myTowns[i]) {
          world.selectedTownId = myTowns[i].id;
          this.openTownScreen(myTowns[i].id);
          return;
        }
      }

      if (hero) {
        for (let s = 0; s < H.ARMY_SLOTS; s++) {
          if (inRect(px, py, [480 + s * 30, 340, 28, 38])) {
            if (this.selectedArmySlot === null) {
              if (hero.army[s]) this.selectedArmySlot = s;
            } else {
              if (shiftKey && hero.army[this.selectedArmySlot] && hero.army[this.selectedArmySlot].count > 1) {
                const half = hero.army[this.selectedArmySlot].count >> 1;
                world.splitArmyStack(hero, this.selectedArmySlot, hero, s, half);
              } else {
                world.swapArmySlots(hero, this.selectedArmySlot, hero, s);
              }
              this.selectedArmySlot = null;
            }
            return;
          }
        }
      }

      if (inRect(px, py, [476, 386, 76, 18])) {
        this.executeHeroMove();
      } else if (inRect(px, py, [556, 386, 76, 18])) {
        this.executeDig();
      } else if (inRect(px, py, [476, 406, 76, 18])) {
        if (hero && hero.hasSpellbook) this.openAdventureSpellbook(hero);
      } else if (inRect(px, py, [556, 406, 76, 18])) {
        if (hero) this.openHeroModal(hero);
      } else if (inRect(px, py, [476, 426, 76, 18])) {
        if (world.selectedTownId) this.openTownScreen(world.selectedTownId);
      } else if (inRect(px, py, [556, 426, 76, 18])) {
        this.executeEndTurn();
      } else if (inRect(px, py, [476, 446, 76, 16])) {
        this.openPuzzleMapModal();
      } else if (inRect(px, py, [556, 446, 76, 16])) {
        this.openSystemMenuModal();
      }
    }

    executeHeroMove() {
      const world = this.world;
      const hero = world && world.getHero(world.selectedHeroId);
      if (!hero || !this.plannedPath || !this.plannedPath.reachable || !this.plannedPath.steps.length) return;
      if (hero.move <= 0) {
        this.statusText = 'У героя закончились очки движения на сегодня. Завершите ход (E).';
        return;
      }

      if (this.rafId !== null) {
        this.isWalking = true;
        this.walkTickCounter = 0;
        this.stepAnimatedHeroMove();
        return;
      }

      while (this.plannedPath && this.plannedPath.steps && this.plannedPath.steps.length > 0 && hero.move > 0) {
        const cont = this.stepAnimatedHeroMove();
        if (!cont) break;
      }
    }

    stepAnimatedHeroMove() {
      const world = this.world;
      const hero = world && world.getHero(world.selectedHeroId);
      if (!hero || !this.plannedPath || !this.plannedPath.steps || !this.plannedPath.steps.length || hero.move <= 0) {
        this.isWalking = false;
        return false;
      }

      const nextStep = this.plannedPath.steps[0];
      const isFinal = this.plannedPath.steps.length === 1;
      const res = world.stepHeroTo(hero, nextStep.x, nextStep.y, isFinal);
      if (!res.ok) {
        this.isWalking = false;
        this.statusText = 'На пути возникла преграда.';
        return false;
      }

      this.plannedPath.steps.shift();
      this.audio.playSfx('step');
      this.centerCameraOnSelectedHero();

      if (world.activeCombat) {
        this.isWalking = false;
        this.plannedPath = null;
        this.plannedTarget = null;
        this.activeCombat = world.activeCombat;
        this.screen = 'combat';
        this.audio.startMusic('combat');
        this.advanceAICombatTurns();
        return false;
      }

      if (res.event && res.event !== 'step') {
        this.isWalking = false;
        this.handleMoveEventFeedback(res, hero);
      }

      if (!this.plannedPath || this.plannedPath.steps.length === 0) {
        this.isWalking = false;
        this.plannedPath = null;
        this.plannedTarget = null;
        this.checkWorldEndState();
        return false;
      }

      if (res.stop || hero.move <= 0 || world.gameOver) {
        this.isWalking = false;
        this.checkWorldEndState();
        return false;
      }

      return true;
    }

    formatLevelUpLines(hero, levelUps) {
      if (!levelUps || !levelUps.length) return [];
      const statNames = { atk: 'Атака', def: 'Защита', power: 'Сила магии', knowledge: 'Знание' };
      return levelUps.map(u => `${hero.name} достигает ${u.level}-го уровня (+1 ${statNames[u.stat] || u.stat})!`);
    }

    handleMoveEventFeedback(ev, hero) {
      if (!ev) return;
      if (ev.event === 'prompt_choice') {
        this.openInteractiveObjectPrompt(hero, ev.promptType, ev.obj);
        return;
      }
      if (ev.event === 'meet_hero' && ev.otherHero) {
        this.openHeroExchangeModal(hero, ev.otherHero);
        return;
      }
      if (ev.event === 'visit_town' && ev.town) {
        this.world.selectedTownId = ev.town.id;
        this.openTownScreen(ev.town.id);
        return;
      }
      if (ev.event === 'capture_town' && ev.town) {
        this.audio.playSfx('victory');
        this.world.selectedTownId = ev.town.id;
        this.showInfoModal('Замок захвачен!', [
          `Ваши войска заняли ${ev.town.name}!`
        ], () => {
          this.openTownScreen(ev.town.id);
          this.checkWorldEndState();
        });
        return;
      }
      if (ev.event === 'capture_mine' && ev.mine) {
        this.audio.playSfx('pickup');
        const rDef = H.RESOURCES[ev.mine.res] || H.RESOURCES.gold;
        this.statusText = `Захвачена шахта (${rDef.name}): +${rDef.daily} в день!`;
        return;
      }
      if (ev.event === 'chest_gold') {
        this.audio.playSfx('pickup');
        this.statusText = `В сундуке найдено ${ev.gold} золотых монет!`;
      } else if (ev.event === 'chest_xp') {
        this.audio.playSfx('pickup');
        const lvlLines = this.formatLevelUpLines(hero, ev.levelUps);
        if (lvlLines.length) {
          this.showInfoModal('Новый уровень!', [`Получено ${ev.xp} опыта.`].concat(lvlLines));
        } else {
          this.statusText = `${hero.name} получает ${ev.xp} опыта.`;
        }
      } else if (ev.event === 'campfire') {
        this.audio.playSfx('pickup');
        const rName = H.RESOURCES[ev.bonusRes] ? H.RESOURCES[ev.bonusRes].name : ev.bonusRes;
        this.statusText = `У костра найдено ${ev.gold} золота и +${ev.bonusAmt} (${rName})!`;
      } else if (ev.event === 'resource_pile') {
        this.audio.playSfx('pickup');
        const rName = H.RESOURCES[ev.res] ? H.RESOURCES[ev.res].name : ev.res;
        this.statusText = `Подобраны запасы: +${ev.amount} (${rName}).`;
      } else if (ev.event === 'artifact_picked') {
        this.audio.playSfx('pickup');
        const a = H.ARTIFACTS[ev.artifactId];
        if (a) {
          this.showInfoModal('Найден артефакт!', [
            `${hero.name} находит древнюю реликвию: «${a.name}»!`,
            `Свойство: ${a.desc}`
          ]);
        }
      } else if (ev.event === 'artifact_bag_full') {
        this.showInfoModal('Сумка полна', ['У героя уже 14 артефактов, больше не унести.']);
      } else if (ev.event === 'windmill') {
        this.audio.playSfx('pickup');
        const rName = H.RESOURCES[ev.res] ? H.RESOURCES[ev.res].name : ev.res;
        this.showInfoModal('Ветряная мельница', [`Мельник передаёт вам запасы: +${ev.amount} (${rName}).`]);
      } else if (ev.event === 'water_wheel') {
        this.audio.playSfx('pickup');
        this.showInfoModal('Водяное колесо', [`Водяная мельница приносит казне +${ev.gold} золота!`]);
      } else if (ev.event === 'gazebo') {
        this.audio.playSfx('pickup');
        const lvlLines = this.formatLevelUpLines(hero, ev.levelUps);
        this.showInfoModal('Беседка мудрости', [`Древний наставник делится опытом (+1000 опыта).`].concat(lvlLines));
      } else if (ev.event === 'fort') {
        this.audio.playSfx('pickup');
        this.statusText = `${hero.name} проходит выучку в Горном форте (+1 ${ev.stat === 'def' ? 'Защита' : 'Атака'}).`;
      } else if (ev.event === 'canyon') {
        this.audio.playSfx('pickup');
        this.statusText = `${hero.name} познаёт тайны Каньона (+1 ${ev.stat === 'knowledge' ? 'Знание' : 'Сила магии'}).`;
      } else if (ev.event === 'xanadu') {
        this.audio.playSfx('victory');
        this.showInfoModal('Дворец Ксанаду', [
          `${hero.name} удостаивается приёма в чертогах Ксанаду!`,
          'Все первичные характеристики героя увеличены на +1!'
        ]);
      } else if (ev.event === 'shrine') {
        const sp = H.SPELLS[ev.spell];
        if (ev.learned) {
          this.audio.playSfx('spell');
          this.showInfoModal('Святилище магии', [
            `${hero.name} записывает в книгу заклинание «${sp ? sp.name : ev.spell}»!`,
            `Получено зарядов: ${hero.knowledge}.`
          ]);
        } else {
          this.showInfoModal('Святилище магии', [
            `В святилище начертаны руны заклинания «${sp ? sp.name : ev.spell}».`,
            'У героя нет Книги заклинаний, чтобы переписать чары (купите её в Гильдии магов).'
          ]);
        }
      } else if (ev.event === 'obelisk') {
        this.audio.playSfx('spell');
        this.showInfoModal('Каменный обелиск', [
          `Открыт фрагмент карты-головоломки (${ev.totalVisited} из ${ev.totalObelisks}).`,
          'Откройте окно «Обелиски (P)», чтобы сверить карту раскопок.'
        ], () => this.openPuzzleMapModal());
      } else if (ev.event === 'fountain') {
        this.audio.playSfx('pickup');
        this.statusText = 'Фонтан удачи: +1 к Удаче до следующего боя!';
      } else if (ev.event === 'temple') {
        this.audio.playSfx('pickup');
        this.statusText = 'Храм света: +2 к Боевому духу до следующего боя!';
      } else if (ev.event === 'oasis') {
        this.audio.playSfx('pickup');
        this.statusText = 'Оазис: +1 к Боевому духу и +800 очков хода сегодня!';
      } else if (ev.event === 'watering_hole') {
        this.audio.playSfx('pickup');
        this.statusText = 'Родник: +1 к Боевому духу и +400 очков хода!';
      } else if (ev.event === 'watchtower') {
        this.statusText = 'Со смотровой башни открылся обзор окрестных земель!';
      } else if (ev.event === 'observatory') {
        this.statusText = 'Обсерватория открыла панораму всего края!';
      } else if (ev.event === 'lighthouse') {
        this.audio.playSfx('pickup');
        this.statusText = 'Маяк под вашим флагом: все ваши корабли идут быстрее (+500 хода)!';
      } else if (ev.event === 'graveyard') {
        this.audio.playSfx('pickup');
        const aName = ev.artifactId && H.ARTIFACTS[ev.artifactId] ? H.ARTIFACTS[ev.artifactId].name : 'древний клинок';
        this.showInfoModal('Древний курган', [
          `Обыскав гробницы, отряд находит 2000 золота и артефакт «${aName}».`,
          'Тревога усопших снижает Боевой дух на -1 до ближайшего боя.'
        ]);
      } else if (ev.event === 'shipwreck') {
        this.audio.playSfx('pickup');
        const aName = ev.artifactId && H.ARTIFACTS[ev.artifactId] ? H.ARTIFACTS[ev.artifactId].name : 'морскую реликвию';
        this.showInfoModal('Кораблекрушение', [
          `В трюме разбитого галеона найдено 2500 золота и артефакт «${aName}»!`
        ]);
      } else if (ev.event === 'teleported') {
        this.audio.playSfx('spell');
        this.centerCameraOnSelectedHero();
        this.statusText = `Монолит перенёс героя в точку (${ev.toX}, ${ev.toY}).`;
      } else if (ev.event === 'signpost') {
        this.showInfoModal('Дорожный указатель', this.wrapText(ev.text, 50));
      } else if (ev.event === 'already_visited') {
        this.statusText = 'Это место уже было посещено.';
      }
    }

    openInteractiveObjectPrompt(hero, promptType, obj) {
      if (!hero || !obj) return;
      if (promptType === 'chest') {
        const gold = obj.gold || 1500;
        const xp = obj.xp || 1000;
        this.modal = {
          w: 460,
          h: 230,
          title: 'Сундук с сокровищами',
          lines: [
            'Вы обнаружили кованый сундук с древними монетами.',
            'Забрать золото в казну или раздать войску ради опыта?'
          ],
          buttons: [
            {
              x: 34,
              y: 160,
              w: 190,
              h: 32,
              label: `Забрать ${gold} золота`,
              primary: true,
              onClick: () => {
                this.modal = null;
                const res = this.world.interactWithObject(hero, obj, 'gold');
                this.handleMoveEventFeedback(res, hero);
              }
            },
            {
              x: 236,
              y: 160,
              w: 190,
              h: 32,
              label: `Взять ${xp} опыта`,
              onClick: () => {
                this.modal = null;
                const res = this.world.interactWithObject(hero, obj, 'xp');
                this.handleMoveEventFeedback(res, hero);
              }
            }
          ]
        };
      } else if (promptType === 'fort') {
        this.modal = {
          w: 460,
          h: 230,
          title: 'Горный форт',
          lines: [
            'Мастера оружия в горной твердыне готовы провести тренировку.',
            'Какой навык полководца вы хотите укрепить?'
          ],
          buttons: [
            {
              x: 34,
              y: 160,
              w: 190,
              h: 32,
              label: '+1 к Атаке',
              primary: true,
              onClick: () => {
                this.modal = null;
                const res = this.world.interactWithObject(hero, obj, 'atk');
                this.handleMoveEventFeedback(res, hero);
              }
            },
            {
              x: 236,
              y: 160,
              w: 190,
              h: 32,
              label: '+1 к Защите',
              onClick: () => {
                this.modal = null;
                const res = this.world.interactWithObject(hero, obj, 'def');
                this.handleMoveEventFeedback(res, hero);
              }
            }
          ]
        };
      } else if (promptType === 'canyon') {
        this.modal = {
          w: 460,
          h: 230,
          title: 'Каньон магов',
          lines: [
            'Хранители магического источника предлагают выбор:',
            'усилить мощь чар или расширить запас знаний?'
          ],
          buttons: [
            {
              x: 34,
              y: 160,
              w: 190,
              h: 32,
              label: '+1 к Силе магии',
              primary: true,
              onClick: () => {
                this.modal = null;
                const res = this.world.interactWithObject(hero, obj, 'power');
                this.handleMoveEventFeedback(res, hero);
              }
            },
            {
              x: 236,
              y: 160,
              w: 190,
              h: 32,
              label: '+1 к Знанию',
              onClick: () => {
                this.modal = null;
                const res = this.world.interactWithObject(hero, obj, 'knowledge');
                this.handleMoveEventFeedback(res, hero);
              }
            }
          ]
        };
      } else if (promptType === 'daemon_cave') {
        this.modal = {
          w: 460,
          h: 230,
          title: 'Пещера демона',
          lines: [
            'Из глубин пещеры тянет жаром и слышится звон золота.',
            'Отважитесь ли вы бросить вызов хозяину пещеры?'
          ],
          buttons: [
            {
              x: 34,
              y: 160,
              w: 190,
              h: 32,
              label: 'Войти в пещеру',
              primary: true,
              onClick: () => {
                this.modal = null;
                const pick = this.world.rng.pick(['xp', 'gold_art', 'gold']);
                const res = this.world.interactWithObject(hero, obj, pick);
                if (res.sub === 'xp') {
                  const lvlLines = this.formatLevelUpLines(hero, res.levelUps);
                  this.showInfoModal('Победа над демоном!', ['Вы повергли демона и получили +1000 опыта!'].concat(lvlLines));
                } else {
                  const aName = res.artifactId && H.ARTIFACTS[res.artifactId] ? H.ARTIFACTS[res.artifactId].name : 'сокровище';
                  this.showInfoModal('Сокровища пещеры!', [`Демон повержен! Добыча: 2500 золота и «${aName}»!`]);
                }
              }
            },
            {
              x: 236,
              y: 160,
              w: 190,
              h: 32,
              label: 'Отойти с миром',
              onClick: () => {
                this.modal = null;
              }
            }
          ]
        };
      } else if (promptType === 'sphinx') {
        const rIdx = (obj.riddleIdx || 0) % H.SPHINX_RIDDLES.length;
        const riddle = H.SPHINX_RIDDLES[rIdx];
        const lines = this.wrapText('Сфинкс вопрошает: «' + riddle.q + '»', 50);
        const buttons = riddle.options.map((opt, idx) => ({
          x: 30,
          y: 112 + idx * 34,
          w: 400,
          h: 28,
          label: opt,
          onClick: () => {
            this.modal = null;
            const res = this.world.interactWithObject(hero, obj, idx);
            if (res.event === 'sphinx_correct') {
              this.audio.playSfx('victory');
              const aName = res.artifactId && H.ARTIFACTS[res.artifactId] ? H.ARTIFACTS[res.artifactId].name : 'реликвию';
              this.showInfoModal('Мудрый ответ!', [
                'Сфинкс склоняет голову и открывает сокровищницу:',
                `Вы получаете 3000 золота и артефакт «${aName}»!`
              ]);
            } else {
              this.audio.playSfx('defeat');
              this.showInfoModal('Гнев Сфинкса', [
                'Ответ неверен! Каменный страж сокрушает отряд.'
              ], () => this.checkWorldEndState());
            }
          }
        }));
        buttons.push({
          x: 150,
          y: 224,
          w: 160,
          h: 28,
          label: 'Уйти без ответа',
          primary: true,
          onClick: () => { this.modal = null; }
        });
        this.modal = {
          w: 460,
          h: 268,
          title: 'Загадка Сфинкса',
          lines,
          buttons
        };
      }
    }

    openHeroExchangeModal(heroA, heroB) {
      if (!heroA || !heroB) return;
      this.modal = {
        w: 480,
        h: 280,
        title: `Встреча: ${heroA.name} и ${heroB.name}`,
        lines: [
          `${heroA.name} (А:${heroA.atk} З:${heroA.def}) встречает ${heroB.name} (А:${heroB.atk} З:${heroB.def}).`,
          'Вы можете объединить войска или обменяться артефактами:'
        ],
        buttons: [
          {
            x: 30,
            y: 110,
            w: 420,
            h: 32,
            label: `Передать войска -> ${heroA.name}`,
            onClick: () => {
              for (let i = 0; i < H.ARMY_SLOTS; i++) {
                if (H.countArmyStacks(heroB.army) <= 1) break;
                const st = heroB.army[i];
                if (st && st.count > 0 && H.addStackToArmy(heroA.army, st.unit, st.count)) {
                  heroB.army[i] = null;
                }
              }
              this.world.recalcHeroMaxMove(heroA);
              this.world.recalcHeroMaxMove(heroB);
              this.statusText = `Войска объединены под знаменем ${heroA.name}.`;
              this.modal = null;
            }
          },
          {
            x: 30,
            y: 150,
            w: 420,
            h: 32,
            label: `Передать артефакты -> ${heroA.name}`,
            onClick: () => {
              for (let i = (heroB.artifacts || []).length - 1; i >= 0; i--) {
                this.world.transferArtifactBetweenHeroes(heroB, heroA, i);
              }
              this.statusText = `Артефакты переданы герою ${heroA.name}.`;
              this.modal = null;
            }
          },
          {
            x: 180,
            y: 220,
            w: 120,
            h: 30,
            label: 'Закрыть',
            primary: true,
            onClick: () => { this.modal = null; }
          }
        ]
      };
    }

    openPuzzleMapModal() {
      if (!this.world) return;
      const player = this.world.getPlayer('blue');
      const ult = this.world.map.ultimateArtifact;
      const visited = player ? player.obelisksVisited.length : 0;
      const total = (this.world.map.obelisks || []).length || 4;
      const lines = [
        `Посещено обелисков: ${visited} из ${total}.`,
        visited >= total && ult
          ? `Точное место Конечного Артефакта отмечено крестом: (${ult.x}, ${ult.y})!`
          : 'Откройте все обелиски, чтобы увидеть красный крест на месте клада.'
      ];
      this.modal = {
        w: 460,
        h: 340,
        title: 'Карта-головоломка Обелисков',
        lines,
        customDraw: (ctx, mx, my) => {
          const px = mx + 134;
          const py = my + 98;
          const grid = 7;
          const cell = 26;
          H.drawMarbleFrame(ctx, px - 4, py - 4, grid * cell + 8, grid * cell + 8, '#14100c');
          if (!ult) return;
          const revealRatio = visited / Math.max(1, total);
          for (let gy = 0; gy < grid; gy++) {
            for (let gx = 0; gx < grid; gx++) {
              const idx = gy * grid + gx;
              const sectorOpen = visited >= total || ((idx * 7 + 3) % total) < visited || (revealRatio > 0 && idx % Math.ceil(1 / revealRatio) === 0);
              const sx = px + gx * cell;
              const sy = py + gy * cell;
              if (sectorOpen) {
                const tx = ult.x + (gx - 3);
                const ty = ult.y + (gy - 3);
                const terr = H.terrainAt(this.world.map, tx, ty);
                H.fillRect(ctx, sx, sy, cell - 1, cell - 1, H.TERRAINS[terr] ? H.TERRAINS[terr].color : '#c8a24e');
                if (gx === 3 && gy === 3 && visited >= total) {
                  ctx.strokeStyle = '#ff2020';
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.moveTo(sx + 4, sy + 4);
                  ctx.lineTo(sx + cell - 5, sy + cell - 5);
                  ctx.moveTo(sx + cell - 5, sy + 4);
                  ctx.lineTo(sx + 4, sy + cell - 5);
                  ctx.stroke();
                  ctx.lineWidth = 1;
                }
              } else {
                H.fillRect(ctx, sx, sy, cell - 1, cell - 1, '#2c2218');
                ctx.fillStyle = '#5a4632';
                ctx.fillRect(sx + 10, sy + 10, 4, 4);
              }
            }
          }
        },
        buttons: [
          {
            x: 170,
            y: 296,
            w: 120,
            h: 28,
            label: 'Закрыть',
            primary: true,
            onClick: () => { this.modal = null; }
          }
        ]
      };
    }

    openSystemMenuModal() {
      const world = this.world;
      const inc = world ? world.playerDailyIncome('blue') : H.emptyResources();
      this.modal = {
        w: 440,
        h: 310,
        title: 'Меню похода и Королевство',
        lines: [
          `День ${world ? world.day : 1}, Неделя ${world ? world.week : 1}, Месяц ${world ? world.month : 1}`,
          `Ежедневный доход казны: +${inc.gold} золота, +${inc.wood} дер., +${inc.ore} руды.`
        ],
        buttons: [
          {
            x: 40,
            y: 100,
            w: 360,
            h: 30,
            label: 'Сохранить игру (F5)',
            onClick: () => {
              this.saveGame();
              this.modal = null;
            }
          },
          {
            x: 40,
            y: 138,
            w: 360,
            h: 30,
            label: 'Загрузить сохранение (F9)',
            disabled: !this.hasSavedGame(),
            onClick: () => {
              this.modal = null;
              this.loadGame();
            }
          },
          {
            x: 40,
            y: 176,
            w: 360,
            h: 30,
            label: 'Карта обелисков (P)',
            onClick: () => {
              this.openPuzzleMapModal();
            }
          },
          {
            x: 40,
            y: 214,
            w: 360,
            h: 30,
            label: 'Выйти в главное меню',
            onClick: () => {
              this.modal = null;
              this.screen = 'menu';
              this.audio.startMusic('menu');
            }
          },
          {
            x: 160,
            y: 260,
            w: 120,
            h: 28,
            label: 'Вернуться',
            primary: true,
            onClick: () => { this.modal = null; }
          }
        ]
      };
    }

    executeDig() {
      const world = this.world;
      const hero = world && world.getHero(world.selectedHeroId);
      if (!hero) return;
      const res = world.digAtCurrentTile(hero);
      if (!res.ok) {
        this.statusText = res.reason === 'already_moved'
          ? 'Для раскопок нужен полный запас хода с самого утра.'
          : res.reason === 'already_dug'
          ? 'На этой клетке уже вырыта яма.'
          : 'Здесь копать нельзя.';
        return;
      }
      if (res.found) {
        this.audio.playSfx('victory');
        this.showInfoModal('Конечный Артефакт найден!', [
          `${hero.name} откапывает древнюю реликвию: ${H.ARTIFACTS[res.artifactId].name}!`
        ], () => this.checkWorldEndState());
      } else {
        this.statusText = 'Раскопки завершились к вечеру: здесь ничего нет.';
      }
    }

    executeEndTurn() {
      if (!this.world) return;
      this.isWalking = false;
      const prevWeek = this.world.week;
      this.world.endTurn();
      H.runAllAITurnsUntilHuman(this.world);
      this.centerCameraOnSelectedHero();
      if (this.world.week !== prevWeek && this.world.weekOfUnit) {
        const uName = H.UNITS[this.world.weekOfUnit] ? H.UNITS[this.world.weekOfUnit].name : '';
        this.showInfoModal('Новая неделя', [
          `Наступила Неделя ${this.world.week}, Месяц ${this.world.month}.`,
          `Астрологи объявляют неделю существа «${uName}»: прирост в жилищах увеличен!`
        ]);
      } else {
        this.statusText = `Наступил День ${this.world.day}, Неделя ${this.world.week}, Месяц ${this.world.month}.`;
      }
      this.checkWorldEndState();
    }

    checkWorldEndState() {
      if (!this.world || !this.world.gameOver) return;
      const rating = this.world.calculateRating();
      if (this.world.winner === 'blue') {
        this.audio.playSfx('victory');
        const isCamp = this.world.campaignIndex !== null;
        if (isCamp && this.world.campaignIndex < H.CAMPAIGN_SCENARIOS.length - 1) {
          const nextIdx = this.world.campaignIndex + 1;
          this.showInfoModal('Победа в сценарии!', [
            `Сценарий пройден за ${rating.days} дн. Итоговый счёт: ${rating.score} (${rating.rankName}).`,
            'Ваша армия готова перейти к следующей главе кампании.'
          ], () => {
            this.menuCampaignIdx = nextIdx;
            this.startCampaignOrScenario();
          });
        } else {
          const epilogue = H.CAMPAIGN_EPILOGUES[this.world.humanFaction] || 'Победа!';
          const lines = this.wrapText(epilogue, 52);
          lines.push(`Дней: ${rating.days}. Рейтинг: ${rating.score} (Ранг: ${rating.rankName}).`);
          this.showInfoModal('Триумф в Энроте!', lines, () => {
            this.screen = 'menu';
          });
        }
      } else {
        this.audio.playSfx('defeat');
        this.showInfoModal('Поражение', [
          'Все ваши замки и полководцы пали.',
          'Попробуйте начать сценарий заново.'
        ], () => {
          this.screen = 'menu';
        });
      }
    }

    openHeroModal(hero) {
      const player = this.world.getPlayer(hero.owner);
      const artNames = (hero.artifacts || []).map(id => H.ARTIFACTS[id] ? H.ARTIFACTS[id].name : id);
      const ult = this.world.map.ultimateArtifact;
      const obCount = player ? player.obelisksVisited.length : 0;
      const totalOb = (this.world.map.obelisks || []).length || 4;
      const hint = obCount >= totalOb && ult ? `Координаты клада открыты: (${ult.x}, ${ult.y})` :
        obCount > 0 && ult ? `Район поисков клада: около (${ult.x + 2}, ${ult.y - 1})` :
        'Посетите обелиски, чтобы узнать координаты клада.';

      const spellNames = Object.keys(hero.spells || {}).filter(k => hero.spells[k] > 0).map(k => `${H.SPELLS[k] ? H.SPELLS[k].name : k} (${hero.spells[k]})`);

      this.showInfoModal(`${hero.name} (${H.FACTIONS[hero.faction].name}, Ур. ${hero.level})`, [
        `Атака: ${hero.atk} | Защита: ${hero.def} | Сила магии: ${hero.power} | Знание: ${hero.knowledge}`,
        `Опыт: ${hero.xp} | Боевой дух: ${hero.morale} | Удача: ${hero.luck} | Ход: ${hero.move}/${hero.maxMove}`,
        `Артефакты (${artNames.length}/14): ${artNames.slice(0, 4).join(', ') || 'Нет'}`,
        `Заклинания: ${spellNames.slice(0, 4).join(', ') || (hero.hasSpellbook ? 'Книга пуста' : 'Нет книги')}`,
        `Обелиски: ${obCount}/${totalOb}. ${hint}`
      ], null, (ctx, mx, my, mw) => {
        H.drawHeroPortrait(ctx, hero.id, mx + mw - 64, my + 42, 48, 48);
      });
    }

    openAdventureSpellbook(hero) {
      const advSpells = Object.keys(hero.spells || {}).filter(id => {
        const sp = H.SPELLS[id];
        return sp && sp.category === 'adventure' && hero.spells[id] > 0;
      });
      if (!advSpells.length) {
        this.showInfoModal('Книга заклинаний', ['У героя нет зарядов походных заклинаний. Посетите Гильдию магов.']);
        return;
      }
      const buttons = advSpells.slice(0, 6).map((spId, idx) => {
        const sp = H.SPELLS[spId];
        return {
          x: 30,
          y: 66 + idx * 32,
          w: 400,
          h: 26,
          label: `${sp.name} (зарядов: ${hero.spells[spId]}) : ${sp.desc}`,
          onClick: () => {
            this.modal = null;
            if (spId === 'dimension_door') {
              this.pendingAdventureSpell = 'dimension_door';
              this.statusText = 'Щёлкните по клетке на карте (в радиусе 7 клеток) для переноса.';
              return;
            }
            const res = this.world.castAdventureSpell(hero, spId, null);
            if (res.ok) {
              this.audio.playSfx('spell');
              this.centerCameraOnSelectedHero();
              this.statusText = `Сотворено заклинание «${sp.name}».`;
            } else {
              this.statusText = 'Не удалось применить заклинание (нет подходящей цели или воды).';
            }
          }
        };
      });
      buttons.push({
        x: 170,
        y: 264,
        w: 120,
        h: 28,
        label: 'Закрыть',
        primary: true,
        onClick: () => { this.modal = null; }
      });
      this.modal = {
        w: 460,
        h: 306,
        title: 'Походные заклинания',
        lines: ['Выберите чары для применения на карте мира:'],
        buttons
      };
    }

    openTownScreen(townId) {
      this.world.selectedTownId = townId;
      this.screen = 'town';
      this.townSlotSel = null;
      const t = this.world.getTown(townId);
      if (t) this.audio.startMusic(t.faction);
    }

    handleTownClick(px, py, shiftKey) {
      const world = this.world;
      const town = world.getTown(world.selectedTownId);
      if (!town) return;

      const visiting = world.getHeroAt(town.x, town.y);
      if (visiting && visiting.owner === town.owner && H.countArmyStacks(town.garrison) > 0 && inRect(px, py, [234, 362, 124, 24])) {
        const tr = world.transferAllGarrisonToHero(town.id);
        this.statusText = tr.ok ? `Отряды гарнизона перешли под командование ${visiting.name}.` : 'Не удалось передать отряды (нет свободных слотов).';
        return;
      }

      if (inRect(px, py, [12, 398, 118, 26])) {
        if (town.builtToday) {
          this.statusText = 'В этом замке сегодня уже возведено одно сооружение.';
        } else {
          this.openTownBuildModal(town);
        }
        return;
      }
      if (inRect(px, py, [12, 428, 118, 26])) {
        this.openTownRecruitModal(town);
        return;
      }
      if (inRect(px, py, [136, 398, 112, 26]) && town.buildings.tavern) {
        this.openTavernModal(town);
        return;
      }
      if (inRect(px, py, [136, 428, 112, 26]) && H.townMageGuildLevel(town) >= 1) {
        this.openMageGuildModal(town);
        return;
      }
      if (inRect(px, py, [254, 398, 104, 26]) && town.buildings.thieves_guild) {
        this.openThievesGuildModal();
        return;
      }
      if (inRect(px, py, [254, 428, 104, 26])) {
        this.screen = 'adventure';
        this.audio.startMusic('adventure');
        return;
      }

      for (let i = 0; i < H.ARMY_SLOTS; i++) {
        if (inRect(px, py, [370 + i * 50, 372, 46, 38])) {
          this.handleTownSlotInteraction(town, visiting, 'garrison', i, shiftKey);
          return;
        }
        if (visiting && inRect(px, py, [370 + i * 50, 424, 46, 38])) {
          this.handleTownSlotInteraction(town, visiting, 'hero', i, shiftKey);
          return;
        }
      }

      if (py >= 16 && py < 352) {
        const defs = H.listTownBuildings(town.faction, town.coastal);
        for (const def of defs) {
          if (!def || !def.rect) continue;
          const [bx, by, bw, bh] = def.rect;
          if (inRect(px, py, [bx, by + 16, bw, bh])) {
            if (town.buildings[def.id]) {
              if (def.id === 'castle') this.openTownBuildModal(town);
              else if (def.id === 'tavern') this.openTavernModal(town);
              else if (def.id === 'thieves_guild') this.openThievesGuildModal();
              else if (def.id === 'shipyard') {
                const bRes = world.buildBoatInTown(town.id);
                this.statusText = bRes.ok ? 'Спущен на воду новый корабль!' : 'Недостаточно ресурсов (1000 зол., 10 дер.) или нет свободной воды.';
              } else if (def.guildLevel) this.openMageGuildModal(town);
              else if (def.tier) this.openTownRecruitModal(town);
              else {
                this.statusText = `Здание «${def.name}» уже исправно служит городу.`;
              }
            } else {
              this.openTownBuildModal(town);
            }
            return;
          }
        }
      }
    }

    handleTownSlotInteraction(town, visiting, holderKey, slotIdx, shiftKey) {
      if (!this.townSlotSel) {
        const hCheck = holderKey === 'garrison' ? town.garrison : (visiting ? visiting.army : null);
        if (hCheck && hCheck[slotIdx]) {
          this.townSlotSel = { holder: holderKey, slot: slotIdx };
        }
        return;
      }
      const hA = this.townSlotSel.holder === 'garrison' ? town : visiting;
      const hB = holderKey === 'garrison' ? town : visiting;
      if (hA && hB) {
        const armyA = hA.army || hA.garrison;
        if (shiftKey && armyA[this.townSlotSel.slot] && armyA[this.townSlotSel.slot].count > 1) {
          const half = armyA[this.townSlotSel.slot].count >> 1;
          this.world.splitArmyStack(hA, this.townSlotSel.slot, hB, slotIdx, half);
        } else {
          const sw = this.world.swapArmySlots(hA, this.townSlotSel.slot, hB, slotIdx);
          if (!sw.ok && sw.reason === 'hero_needs_one_stack') {
            this.statusText = 'У героя должен остаться хотя бы один отряд в армии.';
          }
        }
      }
      this.townSlotSel = null;
    }

    openTownBuildModal(town) {
      const player = this.world.getPlayer(town.owner);
      const allDefs = H.listTownBuildings(town.faction, town.coastal).filter(d => d && !town.buildings[d.id]);
      const buttons = allDefs.slice(0, 10).map((def, idx) => {
        const check = H.canBuildInTown(town, def.id, player.resources);
        const col = idx % 2;
        const row = (idx / 2) | 0;
        let sub = formatCostShort(def.cost);
        if (!check.ok && check.reason === 'missing_prereq') {
          const reqDef = H.getTownBuildingDef(town.faction, check.missing);
          sub = 'Нужно: ' + (reqDef ? reqDef.name : check.missing);
        }
        return {
          x: 16 + col * 256,
          y: 62 + row * 40,
          w: 248,
          h: 34,
          label: `${def.name} (${sub})`,
          disabled: !check.ok || town.builtToday,
          onClick: () => {
            const res = this.world.buildInTown(town.id, def.id);
            if (res.ok) {
              this.audio.playSfx('build');
              this.statusText = `В городе ${town.name} построено здание: ${def.name}!`;
            }
            this.modal = null;
          }
        };
      });
      buttons.push({
        x: 210,
        y: 274,
        w: 120,
        h: 28,
        label: 'Закрыть',
        primary: true,
        onClick: () => { this.modal = null; }
      });
      this.modal = {
        w: 540,
        h: 316,
        title: `Строительство : ${town.name}`,
        lines: [town.builtToday ? 'Сегодня в этом замке уже возведено здание.' : 'Выберите сооружение для возведения (1 постройка в день):'],
        buttons
      };
    }

    openTownRecruitModal(town) {
      const f = H.FACTIONS[town.faction];
      const player = this.world.getPlayer(town.owner);
      const visiting = this.world.getHeroAt(town.x, town.y);
      const buttons = [];
      for (let tier = 1; tier <= 6; tier++) {
        const dw = f.dwellings['dwell_' + tier];
        const u = H.UNITS[dw.unit];
        const avail = town.available[tier] || 0;
        const built = !!town.buildings[dw.id];
        const canBuy = built && avail > 0 ? maxAffordableCount(player.resources, u.cost, avail) : 0;
        const buyAmt = canBuy > 0 ? canBuy : avail;
        const rowY = 58 + (tier - 1) * 34;

        buttons.push({
          x: 18,
          y: rowY,
          w: 392,
          h: 28,
          label: !built
            ? `${u.name}: не построено (${dw.name})`
            : avail <= 0
            ? `${u.name} [А:${u.atk} З:${u.def} ОЗ:${u.hp}]: нет в запасе`
            : canBuy > 0
            ? `${u.name} [А:${u.atk} З:${u.def}]: нанять ${canBuy} из ${avail} (${formatCostShort(H.scaleCost(u.cost, canBuy))})`
            : `${u.name}: доступно ${avail} (не хватает: ${formatCostShort(u.cost)} за 1)`,
          disabled: !built || canBuy <= 0,
          onClick: () => {
            const res = this.world.recruitInTown(town.id, tier, buyAmt, !!visiting);
            if (res.ok) {
              this.audio.playSfx('pickup');
              this.statusText = `Нанято существ (${u.name}): ${res.count} (${res.placedIn === 'hero' ? 'в армию героя' : 'в гарнизон'}).`;
              this.openTownRecruitModal(town);
            } else {
              this.statusText = 'Нет свободного слота в армии и гарнизоне.';
              this.modal = null;
            }
          }
        });

        buttons.push({
          x: 416,
          y: rowY,
          w: 76,
          h: 28,
          label: '+1 шт.',
          disabled: !built || canBuy < 1,
          onClick: () => {
            const res = this.world.recruitInTown(town.id, tier, 1, !!visiting);
            if (res.ok) {
              this.audio.playSfx('pickup');
              this.statusText = `Нанят 1 боец (${u.name}).`;
              this.openTownRecruitModal(town);
            }
          }
        });
      }
      buttons.push({
        x: 195,
        y: 270,
        w: 120,
        h: 28,
        label: 'Закрыть',
        primary: true,
        onClick: () => { this.modal = null; }
      });
      this.modal = {
        w: 510,
        h: 312,
        title: 'Наём войск в замке',
        lines: [visiting ? `Войска поступают в отряд героя ${visiting.name} (или в гарнизон):` : 'Войска поступают в гарнизон замка:'],
        buttons
      };
    }

    openTavernModal(town) {
      const player = this.world.getPlayer(town.owner);
      const rumor = H.TAVERN_RUMORS[(this.world.totalDays + town.x) % H.TAVERN_RUMORS.length];
      const gateOccupied = !!this.world.getHeroAt(town.x, town.y);
      const maxHeroes = this.world.getPlayerHeroes(player.id).length >= H.MAX_ACTIVE_HEROES;
      const buttons = (player.tavernHeroes || []).map((h, idx) => ({
        x: 30,
        y: 112 + idx * 40,
        w: 400,
        h: 32,
        label: gateOccupied
          ? `${h.name} (${H.FACTIONS[h.faction].name}) : ворота замка заняты`
          : maxHeroes
          ? `${h.name} (${H.FACTIONS[h.faction].name}) : лимит 8 героев`
          : `Нанять: ${h.name} (${H.FACTIONS[h.faction].name}, А:${h.atk} З:${h.def}) за 2500 зол.`,
        disabled: player.resources.gold < H.HERO_HIRE_COST || gateOccupied || maxHeroes,
        onClick: () => {
          const res = this.world.hireHeroInTown(town.id, idx);
          if (res.ok) {
            this.audio.playSfx('pickup');
            this.statusText = `Нанят полководец ${res.hero.name}!`;
          }
          this.modal = null;
        }
      }));
      buttons.push({
        x: 170,
        y: 210,
        w: 120,
        h: 28,
        label: 'Закрыть',
        primary: true,
        onClick: () => { this.modal = null; }
      });
      this.modal = {
        w: 460,
        h: 256,
        title: 'Таверна',
        lines: this.wrapText('Слух в таверне: ' + rumor, 50),
        buttons
      };
    }

    openMageGuildModal(town) {
      const maxLvl = H.townMageGuildLevel(town);
      const visiting = this.world.getHeroAt(town.x, town.y);
      const lines = [];
      for (let l = 1; l <= maxLvl; l++) {
        const spNames = (town.guildSpells[l] || []).map(id => H.SPELLS[id] ? H.SPELLS[id].name : id);
        lines.push(`Этаж ${l}: ${spNames.join(', ')}`);
      }
      const buttons = [];
      if (visiting && !visiting.hasSpellbook) {
        buttons.push({
          x: 80,
          y: 170,
          w: 300,
          h: 28,
          label: 'Купить Книгу заклинаний (500 зол.)',
          onClick: () => {
            const res = this.world.buySpellbookInTown(town.id, visiting.id);
            if (res.ok) {
              this.audio.playSfx('spell');
              this.statusText = `${visiting.name} приобретает Книгу заклинаний и изучает чары гильдии!`;
            } else {
              this.statusText = 'Не хватает золота (нужно 500 зол.).';
            }
            this.modal = null;
          }
        });
      }
      buttons.push({
        x: 170,
        y: 210,
        w: 120,
        h: 28,
        label: 'Закрыть',
        primary: true,
        onClick: () => { this.modal = null; }
      });
      this.modal = {
        w: 460,
        h: 256,
        title: 'Гильдия Магов',
        lines,
        buttons
      };
    }

    openThievesGuildModal() {
      const rep = this.world.getThievesGuildReport();
      const lines = rep.map(r => `${r.playerName} (${r.rulerName}): замков ${r.castles}, дер. ${r.villages}, зол. ${r.gold}, герой ${r.bestHeroName}`);
      this.showInfoModal('Гильдия Воров: Разведсводка', lines);
    }

    handleCombatClick(px, py) {
      const combat = this.activeCombat || (this.world && this.world.activeCombat);
      if (!combat) return;

      if (inRect(px, py, [12, 414, 118, 24]) && !combat.castUsed.attacker && combat.attackerHero.hasSpellbook) {
        this.openCombatSpellbook(combat);
        return;
      }
      if (inRect(px, py, [136, 414, 118, 24])) {
        combat.waitStack();
        this.advanceAICombatTurns();
        return;
      }
      if (inRect(px, py, [260, 414, 118, 24])) {
        combat.defendStack();
        this.advanceAICombatTurns();
        return;
      }
      if (inRect(px, py, [384, 414, 118, 24])) {
        combat.runAutoCombat();
        this.concludeCombatIfFinished();
        return;
      }
      if (inRect(px, py, [508, 414, 118, 24])) {
        combat.retreat('attacker');
        this.concludeCombatIfFinished();
        return;
      }

      if (inRect(px, py, [H.BF_X, H.BF_Y, H.BF_COLS * H.BF_CELL_W, H.BF_ROWS * H.BF_CELL_H])) {
        const col = Math.floor((px - H.BF_X) / H.BF_CELL_W);
        const row = Math.floor((py - H.BF_Y) / H.BF_CELL_H);
        const targetStack = combat.stackAt(col, row);
        const active = combat.activeStack;

        if (this.pendingCombatSpell) {
          const spId = this.pendingCombatSpell;
          const sp = H.SPELLS[spId];
          let arg = null;
          if (sp.target === 'cell') {
            arg = { col, row };
          } else if (sp.kind === 'teleport') {
            if (!this._teleportStack && targetStack && targetStack.side === 'attacker') {
              this._teleportStack = targetStack;
              this.statusText = `Выберите свободную клетку для телепортации отряда «${targetStack.name}».`;
              return;
            }
            arg = { stack: this._teleportStack || active, col, row };
            this._teleportStack = null;
          } else {
            arg = targetStack;
          }
          this.pendingCombatSpell = null;
          const cRes = combat.castSpell('attacker', spId, arg);
          if (cRes.ok) {
            this.audio.playSfx('spell');
          } else {
            this.statusText = 'Заклинание не может быть наложено на выбранную цель.';
          }
          this.advanceAICombatTurns();
          return;
        }

        if (!active || active.side !== 'attacker') return;

        if (targetStack && targetStack.side === 'defender') {
          if (combat.canShoot(active)) {
            combat.rangedAttack(active, targetStack);
            this.audio.playSfx('shoot');
          } else if (combat.areStacksAdjacent(active, targetStack)) {
            combat.meleeAttack(active, targetStack, null);
            this.audio.playSfx('hit');
          } else {
            const reach = combat.getReachableCells(active);
            const adjCells = reach.filter(cell => {
              const fake = { headCol: cell.col, tailCol: active.wide ? cell.col - active.dir : cell.col, row: cell.row, wide: active.wide };
              return combat.areStacksAdjacent(fake, targetStack);
            });
            if (adjCells.length > 0) {
              adjCells.sort((a, b) => a.dist - b.dist);
              combat.meleeAttack(active, targetStack, adjCells[0]);
              this.audio.playSfx('hit');
            } else {
              this.statusText = 'Цель вне досягаемости этого отряда за один ход.';
              return;
            }
          }
          this.advanceAICombatTurns();
          return;
        }

        if (combat.siege && col === 5 && active.def.siegeSmasher && active.headCol === 4) {
          if (combat.attackWallSegment(row)) {
            this.audio.playSfx('hit');
            this.advanceAICombatTurns();
            return;
          }
        }

        const reach = combat.getReachableCells(active);
        if (reach.some(c => c.col === col && c.row === row)) {
          combat.moveStackTo(active, col, row);
          this.audio.playSfx('step');
          this.advanceAICombatTurns();
        }
      }
    }

    openCombatSpellbook(combat) {
      const hero = combat.attackerHero;
      const combatSpells = Object.keys(hero.spells || {}).filter(id => {
        const sp = H.SPELLS[id];
        return sp && sp.category === 'combat' && hero.spells[id] > 0;
      });
      if (!combatSpells.length) {
        this.showInfoModal('Книга чар', ['У полководца нет зарядов боевых заклинаний.']);
        return;
      }
      const buttons = combatSpells.slice(0, 8).map((spId, idx) => {
        const sp = H.SPELLS[spId];
        const col = idx % 2;
        const row = (idx / 2) | 0;
        return {
          x: 18 + col * 246,
          y: 60 + row * 38,
          w: 236,
          h: 32,
          label: `${sp.name} (${hero.spells[spId]})`,
          onClick: () => {
            this.modal = null;
            this._teleportStack = null;
            if (sp.target === 'all_units') {
              combat.castSpell('attacker', spId);
              this.audio.playSfx('spell');
              this.advanceAICombatTurns();
            } else {
              this.pendingCombatSpell = spId;
            }
          }
        };
      });
      buttons.push({
        x: 200,
        y: 230,
        w: 120,
        h: 28,
        label: 'Отмена',
        primary: true,
        onClick: () => { this.modal = null; }
      });
      this.modal = {
        w: 520,
        h: 274,
        title: `Боевая магия (Сила магии: ${hero.power})`,
        lines: ['Выберите заклинание (1 раз за раунд):'],
        buttons
      };
    }

    advanceAICombatTurns() {
      const combat = this.activeCombat || (this.world && this.world.activeCombat);
      if (!combat) return;
      let guard = 0;
      while (!combat.winner && combat.activeStack && combat.activeStack.side === 'defender' && guard < 100) {
        combat.stepAI();
        guard++;
      }
      this.concludeCombatIfFinished();
    }

    concludeCombatIfFinished() {
      const combat = this.activeCombat || (this.world && this.world.activeCombat);
      if (!combat || !combat.winner) return;

      if (!this.world) {
        const msg = combat.winner === 'attacker' ? 'Атакующая армия одержала победу!' : 'Защитники удержали поле боя!';
        this.showInfoModal('Итог схватки', [msg], () => {
          this.activeCombat = null;
          this.screen = 'menu';
          this.audio.startMusic('menu');
        });
        return;
      }

      const hero = this.world.combatContext ? this.world.combatContext.attackerHero : null;
      const res = this.world.finishActiveCombat();
      this.activeCombat = null;
      this.screen = 'adventure';
      this.audio.startMusic('adventure');

      if (res.winner === 'attacker') {
        this.audio.playSfx('victory');
        this.statusText = `Победа! Получено опыта: ${res.xpGained || 0}.`;
        const lines = [`Вражеский отряд разбит! Получено опыта: +${res.xpGained || 0}.`];
        if (hero && res.levelUps && res.levelUps.length) {
          lines.push(...this.formatLevelUpLines(hero, res.levelUps));
        }
        if (res.capturedArtifacts && res.capturedArtifacts.length) {
          const artNames = res.capturedArtifacts.map(id => H.ARTIFACTS[id] ? H.ARTIFACTS[id].name : id);
          lines.push(`Захвачены трофеи: ${artNames.join(', ')}!`);
        }
        if (!this.world.gameOver) {
          this.showInfoModal('Славная победа!', lines);
        }
      } else {
        this.audio.playSfx('defeat');
        const fled = res.outcome && (res.outcome.includes('retreated') || res.outcome.includes('fled'));
        this.statusText = fled ? 'Полководец отступил с поля боя (доступен для найма в Таверне).' : 'Ваш отряд потерпел поражение в бою.';
      }
      this.checkWorldEndState();
    }

    handleKeyDown(key, e) {
      if (this.isWalking) {
        this.isWalking = false;
        this.render();
        return;
      }

      if (this.modal) {
        if (key === 'Escape' || key === 'Enter') {
          const btn = (this.modal.buttons || []).find(b => b.primary) || (this.modal.buttons && this.modal.buttons[0]);
          if (btn && btn.onClick) btn.onClick();
          this.render();
        }
        return;
      }

      if (this.screen === 'adventure' && this.world) {
        if (key === 'ArrowLeft') this.camX = Math.max(0, this.camX - 1);
        else if (key === 'ArrowRight') this.camX = Math.min(Math.max(0, this.world.map.w - H.VIEW_TILES), this.camX + 1);
        else if (key === 'ArrowUp') this.camY = Math.max(0, this.camY - 1);
        else if (key === 'ArrowDown') this.camY = Math.min(Math.max(0, this.world.map.h - H.VIEW_TILES), this.camY + 1);
        else if (key === 'm' || key === 'M') this.executeHeroMove();
        else if (key === 'd' || key === 'D') this.executeDig();
        else if (key === 'e' || key === 'E') this.executeEndTurn();
        else if (key === 'p' || key === 'P') this.openPuzzleMapModal();
        else if (key === 'Escape') this.openSystemMenuModal();
        else if (key === 't' || key === 'T') {
          if (this.world.selectedTownId) this.openTownScreen(this.world.selectedTownId);
        } else if (key === 'h' || key === 'H') {
          const h = this.world.getHero(this.world.selectedHeroId);
          if (h) this.openHeroModal(h);
        } else if (key === 'c' || key === 'C') {
          const h = this.world.getHero(this.world.selectedHeroId);
          if (h && h.hasSpellbook) this.openAdventureSpellbook(h);
        } else if (key === 'F5') {
          if (e && e.preventDefault) e.preventDefault();
          this.saveGame();
        } else if (key === 'F9') {
          if (e && e.preventDefault) e.preventDefault();
          this.loadGame();
        }
        this.render();
      } else if (this.screen === 'town') {
        if (key === 'Escape') {
          this.screen = 'adventure';
          this.audio.startMusic('adventure');
          this.render();
        }
      } else if (this.screen === 'combat') {
        const combat = this.activeCombat || (this.world && this.world.activeCombat);
        if (!combat) return;
        if (key === 'w' || key === 'W') {
          combat.waitStack();
          this.advanceAICombatTurns();
        } else if (key === ' ' || key === 'd' || key === 'D') {
          combat.defendStack();
          this.advanceAICombatTurns();
        } else if (key === 'a' || key === 'A') {
          combat.runAutoCombat();
          this.concludeCombatIfFinished();
        } else if (key === 'c' || key === 'C') {
          this.openCombatSpellbook(combat);
        } else if (key === 'r' || key === 'R') {
          combat.retreat('attacker');
          this.concludeCombatIfFinished();
        }
        this.render();
      }
    }
  }

  Object.assign(H, {
    SAVE_KEY,
    inRect,
    formatCostShort,
    maxAffordableCount,
    GameUI
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
