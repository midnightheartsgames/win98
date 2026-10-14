/**
 * Fallout 2 Retro UI & Dialog Manager
 * Renders the authentic bottom HUD, AP bulbs, HP, active weapon toggle,
 * V.A.T.S. targeted shot dialog, Cameron dialog tree, Pip-Boy, Inventory,
 * Character Sheet, and Dynamite timer.
 */

class FalloutUI {
  constructor(char, temple, combat, audio, engine, container) {
    this.char = char;
    this.temple = temple;
    this.combat = combat;
    this.audio = audio;
    this.engine = engine;
    this.container = container;

    this.gameStarted = false;
    this.isPaused = false;
    this.activeModal = null; // 'inv', 'cha', 'pip', 'vats', 'dialog', 'timer', 'victory', 'gameover'
    this.timerCountdown = null;
    this.timerInterval = null;

    this.logs = [];
    this.buildUI();
    this.updateHUD();
    this.openMainMenu();
  }

  log(msg) {
    const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    this.logs.push(`[${timestamp}] ${msg}`);
    if (this.logs.length > 50) this.logs.shift();

    const logEl = this.container.querySelector('#fo-log-content');
    if (logEl) {
      logEl.innerHTML = this.logs.map(l => `<div class="fo-log-line">${l}</div>`).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  buildUI() {
    this.container.innerHTML = `
      <div class="fo-wrapper" tabindex="0">
        <!-- Main Game Canvas Container -->
        <div class="fo-canvas-container">
          <canvas id="fo-canvas" width="800" height="460"></canvas>
          <div id="fo-modal-overlay" class="fo-modal-overlay" style="display: none;"></div>
          <!-- Title / Main Menu & Pause Screen Overlay -->
          <div id="fo-menu-overlay" class="fo-menu-overlay" style="display: flex;"></div>
        </div>

        <!-- Classic Fallout Bottom HUD Console -->
        <div class="fo-hud-console">
          <!-- Left: Action Points & HP Display -->
          <div class="fo-hud-section fo-hud-stats">
            <div class="fo-label">ACTION POINTS</div>
            <div id="fo-ap-bulbs" class="fo-ap-bulbs"></div>

            <div class="fo-hp-box">
              <span class="fo-hp-title">HIT POINTS</span>
              <span id="fo-hp-val" class="fo-hp-val">34/34</span>
            </div>
          </div>

          <!-- Middle: Active Weapon & Dual Slot Toggle -->
          <div class="fo-hud-section fo-hud-weapon">
            <div class="fo-slot-indicator" id="fo-slot-indicator">СЛОТ 1</div>
            <div class="fo-weapon-card" id="fo-weapon-btn">
              <div class="fo-weapon-info">
                <span id="fo-weapon-name" class="fo-weapon-name">Копье</span>
                <span id="fo-weapon-ap" class="fo-weapon-ap">4 AP</span>
              </div>
              <div id="fo-vats-badge" class="fo-vats-badge" title="Режим прицельного удара (V.A.T.S.)">
                🎯 ПРИЦЕЛ
              </div>
            </div>
            <div class="fo-weapon-controls">
              <button id="fo-swap-slot-btn" class="fo-retro-btn fo-small-btn" title="Сменить слот оружия (Клавиша B)">СЛОТ [B]</button>
              <button id="fo-cycle-btn" class="fo-retro-btn fo-small-btn" title="Сменить тип атаки">РЕЖИМ</button>
            </div>
          </div>

          <!-- Center-Right: Action Buttons (INV, CHA, PIP, MENU, COMBAT) -->
          <div class="fo-hud-section fo-hud-buttons">
            <button id="fo-btn-inv" class="fo-retro-btn">INV</button>
            <button id="fo-btn-cha" class="fo-retro-btn">CHA</button>
            <button id="fo-btn-pip" class="fo-retro-btn">PIP</button>
            <button id="fo-btn-menu" class="fo-retro-btn">МЕНЮ</button>
            <button id="fo-btn-combat" class="fo-retro-btn fo-btn-red" style="grid-column: span 2;">БОЙ</button>
          </div>

          <!-- Right: CRT Message Terminal Log -->
          <div class="fo-hud-section fo-hud-log">
            <div class="fo-terminal-screen">
              <div id="fo-log-content" class="fo-log-content"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Connect Engine Canvas
    const canvas = this.container.querySelector('#fo-canvas');
    this.engine.canvas = canvas;
    this.engine.ctx = canvas.getContext('2d');
    this.engine.bindEvents();
    this.engine.centerOnPlayer();

    // Dual Slot Swap Handler (0 AP cost)
    const handleSlotSwap = () => {
      const w = this.char.swapActiveSlot(this.combat.inCombat);
      if (this.audio) this.audio.playUI('click');
      this.log(`Выбран СЛОТ ${this.char.activeSlotIndex}: ${w.name}`);
      this.updateHUD();
    };

    // Attach HUD Button Handlers
    this.container.querySelector('#fo-weapon-btn').addEventListener('click', () => {
      const activeItem = this.char.getActiveWeapon();
      if (activeItem.type === 'consumable') {
        if (this.combat.inCombat && this.combat.turn !== 'player') return;
        const apCost = activeItem.apCost || 2;
        if (this.combat.inCombat && this.combat.turn === 'player') {
          if (this.char.currentAp < apCost) {
            this.log(`Недостаточно ОД для применения ${activeItem.name}! Требуется ${apCost} AP (доступно: ${this.char.currentAp}).`);
            if (this.audio) this.audio.playUI('click');
            return;
          }
          this.char.currentAp -= apCost;
        }
        if (activeItem.use) {
          activeItem.use(this.char, (m) => this.log(m));
        }
        this.char.removeItem(activeItem.id, 1);
        if (this.audio) this.audio.playUI('open');
        if (this.engine) {
          this.engine.floatingTexts.push({
            text: '+ОЗ',
            x: this.char.x,
            y: this.char.y,
            color: '#33ff33',
            alpha: 1.0,
            life: 40,
            maxLife: 40
          });
        }
        this.updateHUD();
        return;
      }

      this.char.toggleTargetedMode();
      if (this.audio) this.audio.playUI('click');
      this.log(`Режим атаки: ${this.char.targetedMode ? 'ПРИЦЕЛЬНЫЙ (V.A.T.S.)' : 'ОБЫЧНЫЙ'}`);
      this.updateHUD();
    });

    this.container.querySelector('#fo-swap-slot-btn').addEventListener('click', handleSlotSwap);

    this.container.querySelector('#fo-cycle-btn').addEventListener('click', () => {
      const w = this.char.cycleActiveWeapon();
      this.audio.playUI('click');
      this.log(`Выбрано оружие в слоте ${this.char.activeSlotIndex}: ${w.name}`);
      this.updateHUD();
    });

    this.container.querySelector('#fo-btn-inv').addEventListener('click', () => this.openInventory());
    this.container.querySelector('#fo-btn-cha').addEventListener('click', () => this.openCharacterSheet());
    this.container.querySelector('#fo-btn-pip').addEventListener('click', () => this.openPipBoy());
    this.container.querySelector('#fo-btn-menu').addEventListener('click', () => this.togglePause());

    this.container.querySelector('#fo-btn-combat').addEventListener('click', () => {
      this.combat.toggleOrEndTurn();
      this.updateHUD();
    });

    // Keyboard bindings (Space, Escape, 1, 2, 3, B, F5, F9)
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.activeModal) {
          this.closeModal();
        } else if (this.gameStarted) {
          this.togglePause();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (this.combat.inCombat) {
          this.combat.toggleOrEndTurn();
          this.updateHUD();
        } else if (this.gameStarted && !this.activeModal) {
          this.togglePause();
        }
      } else if (e.key === '1') {
        this.openInventory();
      } else if (e.key === '2') {
        this.openCharacterSheet();
      } else if (e.key === '3') {
        this.openPipBoy();
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') {
        handleSlotSwap();
      } else if (e.key === 'F5') {
        e.preventDefault();
        this.quickSave();
      } else if (e.key === 'F9') {
        e.preventDefault();
        this.quickLoad();
      }
    });
  }

  updateHUD() {
    // 1. AP Bulbs
    const apBox = this.container.querySelector('#fo-ap-bulbs');
    if (apBox) {
      let bulbsHtml = '';
      for (let i = 0; i < this.char.ap; i++) {
        const isLit = i < this.char.currentAp;
        bulbsHtml += `<span class="fo-ap-bulb ${isLit ? 'lit' : 'dim'}"></span>`;
      }
      apBox.innerHTML = bulbsHtml;
    }

    // 2. HP Counter
    const hpVal = this.container.querySelector('#fo-hp-val');
    if (hpVal) {
      hpVal.textContent = `${this.char.hp}/${this.char.maxHp}`;
      hpVal.style.color = (this.char.hp < 10) ? '#ff3333' : '#33ff33';
    }

    // 3. Weapon Card & Dual Slot Indicator
    const slotEl = this.container.querySelector('#fo-slot-indicator');
    if (slotEl) {
      slotEl.textContent = `СЛОТ ${this.char.activeSlotIndex}`;
    }

    const w = this.char.getActiveWeapon();
    const wName = this.container.querySelector('#fo-weapon-name');
    const wAp = this.container.querySelector('#fo-weapon-ap');
    const vatsBadge = this.container.querySelector('#fo-vats-badge');

    if (w.type === 'consumable') {
      const invItem = this.char.inventory.find(i => i.id === w.id);
      const count = invItem ? (invItem.count || 1) : 0;
      if (wName) wName.textContent = `${w.name} (${count})`;
      if (wAp) wAp.textContent = `${w.apCost || 2} AP`;
      if (vatsBadge) {
        vatsBadge.className = 'fo-vats-badge active';
        vatsBadge.textContent = '💊 ПРИМЕНИТЬ';
        vatsBadge.title = 'Нажмите, чтобы использовать предмет';
      }
    } else {
      if (wName) wName.textContent = w.name;
      if (wAp) wAp.textContent = `${w.apCost + (this.char.targetedMode ? 1 : 0)} AP`;
      if (vatsBadge) {
        vatsBadge.className = `fo-vats-badge ${this.char.targetedMode ? 'active' : ''}`;
        vatsBadge.textContent = '🎯 ПРИЦЕЛ';
        vatsBadge.title = 'Режим прицельного удара (V.A.T.S.)';
      }
    }

    // 4. Combat Button
    const combatBtn = this.container.querySelector('#fo-btn-combat');
    if (combatBtn) {
      if (this.combat.inCombat) {
        if (this.combat.turn === 'player') {
          const closeHostile = this.combat.activeCombatants.find(e => !e.isDead && e.state === 'hostile' && Math.hypot(e.x - this.char.x, e.y - this.char.y) <= 4.5);
          if (!closeHostile) {
            combatBtn.textContent = 'ВЫЙТИ ИЗ БОЯ';
            combatBtn.className = 'fo-retro-btn fo-btn-yellow';
          } else {
            combatBtn.textContent = 'КОНЕЦ ХОДА';
            combatBtn.className = 'fo-retro-btn fo-btn-yellow';
          }
        } else {
          combatBtn.textContent = 'ХОД ВРАГА...';
          combatBtn.className = 'fo-retro-btn fo-btn-yellow';
        }
      } else {
        combatBtn.textContent = 'БОЙ';
        combatBtn.className = 'fo-retro-btn fo-btn-red';
      }
    }
  }

  onWorldClick(wx, wy) {
    if (this.activeModal) return;

    // In Combat Mode
    if (this.combat.inCombat) {
      this.combat.handleCombatTileClick(wx, wy);
      return;
    }

    // In Real-Time Exploration Mode:
    // 1. Check if clicked on Door
    const door = this.temple.getDoorAt(wx, wy);
    if (door && !door.isOpen) {
      const dist = Math.hypot(this.char.x - door.x, this.char.y - door.y);
      if (dist <= 1.8) {
        this.temple.unlockDoor(door);
      } else {
        // Automatically approach door
        const targetY = (this.char.y < door.y) ? door.y - 1 : door.y + 1;
        const path = this.engine.findPath(this.char.x, this.char.y, door.x, targetY);
        if (path && path.length > 0) {
          this.engine.currentPath = path;
          this.engine.isMoving = true;
          this.engine.lastStepTime = performance.now();
        } else {
          this.log('Слишком далеко от двери. Подойдите ближе.');
        }
      }
      return;
    }

    // 2. Check if clicked on Container
    const cont = this.temple.getContainerAt(wx, wy);
    if (cont) {
      const dist = Math.hypot(this.char.x - cont.x, this.char.y - cont.y);
      if (dist <= 1.8) {
        this.lootContainer(cont);
      } else {
        this.log(`Подойдите ближе к ${cont.name}.`);
      }
      return;
    }

    // 3. Check if clicked on Trap
    const trap = this.temple.getTrapAt(wx, wy);
    if (trap && trap.revealed && !trap.disarmed) {
      const dist = Math.hypot(this.char.x - trap.x, this.char.y - trap.y);
      if (dist <= 1.8) {
        this.temple.disarmTrap(trap);
      } else {
        this.log('Подойдите ближе для разминирования ловушки.');
      }
      return;
    }

    // 4. Check if clicked on Cameron
    const cameron = this.temple.enemies.find(e => e.id === 'cameron');
    if (cameron && !cameron.isDead && wx === cameron.x && wy === cameron.y) {
      const dist = Math.hypot(this.char.x - cameron.x, this.char.y - cameron.y);
      if (dist <= 2.5) {
        this.openCameronDialogue();
      } else {
        this.log('Подойдите ближе к Камерону для разговора.');
      }
      return;
    }

    // 5. Movement
    const path = this.engine.findPath(this.char.x, this.char.y, wx, wy);
    if (path && path.length > 0) {
      this.engine.currentPath = path;
      this.engine.isMoving = true;
      this.engine.lastStepTime = performance.now();
    }
  }

  onRightClick() {
    // Toggle targeted attack mode
    this.char.toggleTargetedMode();
    this.audio.playUI('click');
    this.log(`Режим курсора: ${this.char.targetedMode ? 'ПРИЦЕЛ' : 'ХОДЬБА'}`);
    this.updateHUD();
  }

  lootContainer(cont) {
    if (cont.looted) {
      this.log(`${cont.name} пуст.`);
      return;
    }

    cont.looted = true;
    this.audio.playUI('open');

    cont.items.forEach(item => {
      this.char.addItem(item.id, item.count || 1);
      this.log(`Вы обыскали ${cont.name} и нашли: ${item.name} (${item.count || 1} шт.)!`);
      if (this.engine) {
        this.engine.addFloatingText(`+${item.name}`, cont.x, cont.y, '#ffff44');
      }
    });

    this.char.addXp(15, this.log);
  }

  // --- MODALS ---
  openVATS(enemy) {
    this.activeModal = 'vats';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    const weapon = this.char.getActiveWeapon();
    const skillName = weapon.subtype === 'melee' ? 'melee' : 'unarmed';
    const baseSkill = this.char.skills[skillName] || 50;
    const targetAC = enemy.ac || 5;

    let rowsHtml = '';
    for (const [key, part] of Object.entries(window.VATS_TARGETS)) {
      const chance = Math.max(5, Math.min(95, baseSkill - targetAC + part.hitMod));
      rowsHtml += `
        <div class="fo-vats-row" data-part="${key}">
          <span class="fo-vats-part-name">${part.name}</span>
          <span class="fo-vats-desc">${part.desc}</span>
          <button class="fo-retro-btn fo-vats-select-btn" data-part="${key}">
            ${chance}%
          </button>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="fo-modal fo-vats-modal">
        <div class="fo-modal-header">
          <span>V.A.T.S. — ПРИЦЕЛЬНЫЙ УДАР: ${enemy.name.toUpperCase()}</span>
          <button id="fo-modal-close" class="fo-close-btn">X</button>
        </div>
        <div class="fo-vats-content">
          <div class="fo-vats-target-info">
            <span>ЗДОРОВЬЕ ЦЕЛИ: ${enemy.hp}/${enemy.maxHp} HP</span>
            <span>КЛАСС БРОНИ: ${enemy.ac} AC</span>
            <span>ЗАТРАТЫ ОД: ${weapon.apCost + 1} AP</span>
          </div>
          <div class="fo-vats-grid">
            ${rowsHtml}
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());
    overlay.querySelectorAll('.fo-vats-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const partKey = e.target.dataset.part;
        this.closeModal();
        this.combat.executePlayerAttack(enemy, partKey);
      });
    });
  }

  openInventory() {
    this.activeModal = 'inv';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    const renderItems = () => {
      const getSlotItem = (slotId) => {
        if (slotId === 'spear') return window.ITEMS_DB.spear;
        if (slotId === 'unarmed_kick') return window.ITEMS_DB.unarmed_kick;
        if (slotId === 'unarmed_punch') return window.ITEMS_DB.unarmed_punch;
        const found = this.char.inventory.find(i => i.id === slotId);
        if (found) return found;
        return window.ITEMS_DB[slotId] || window.ITEMS_DB.unarmed_punch;
      };

      const slot1Item = getSlotItem(this.char.slot1);
      const slot2Item = getSlotItem(this.char.slot2);

      let itemsHtml = '';
      this.char.inventory.forEach(item => {
        const inSlot1 = (this.char.slot1 === item.id);
        const inSlot2 = (this.char.slot2 === item.id);
        const isEquipped = inSlot1 || inSlot2;
        itemsHtml += `
          <div class="fo-inv-item ${isEquipped ? 'equipped' : ''}">
            <div class="fo-inv-item-info">
              <span class="fo-inv-item-title">${item.name} ${item.count > 1 ? `(${item.count})` : ''}</span>
              <span class="fo-inv-item-desc">${item.desc}</span>
            </div>
            <div class="fo-inv-item-actions">
              ${item.type === 'consumable' ? `<button class="fo-retro-btn fo-item-use" data-id="${item.id}">Исп.</button>` : ''}
              ${item.type === 'explosive' ? `<button class="fo-retro-btn fo-item-blast" data-id="${item.id}">Таймер</button>` : ''}
              ${(item.type === 'weapon' || item.type === 'consumable') ? `
                <button class="fo-retro-btn fo-item-slot1" data-id="${item.id}">${inSlot1 ? 'Слот 1 ✓' : 'В Слот 1'}</button>
                <button class="fo-retro-btn fo-item-slot2" data-id="${item.id}">${inSlot2 ? 'Слот 2 ✓' : 'В Слот 2'}</button>
              ` : ''}
            </div>
          </div>
        `;
      });

      overlay.innerHTML = `
        <div class="fo-modal fo-inv-modal">
          <div class="fo-modal-header">
            <span>ИНВЕНТАРЬ (INV)</span>
            <button id="fo-modal-close" class="fo-close-btn">X</button>
          </div>
          <div class="fo-inv-stats">
            <span>ВЕС: ${this.char.getCurrentWeight().toFixed(1)} / ${this.char.getCarryWeight()} ФУНТОВ</span>
            <span>ОЗ: ${this.char.hp}/${this.char.maxHp}</span>
          </div>
          <div class="fo-inv-slots">
            <div class="fo-slot-box ${this.char.activeSlotIndex === 1 ? 'active-slot' : ''}" id="fo-inv-slot1-card" title="Кликните, чтобы сделать Слот 1 активным">
              <span class="fo-slot-title">СЛОТ 1 ${this.char.activeSlotIndex === 1 ? '(АКТИВЕН)' : ''}</span>
              <span class="fo-slot-item-name">${slot1Item.name}${slot1Item.count ? ` (${slot1Item.count})` : ''}</span>
            </div>
            <div class="fo-slot-box ${this.char.activeSlotIndex === 2 ? 'active-slot' : ''}" id="fo-inv-slot2-card" title="Кликните, чтобы сделать Слот 2 активным">
              <span class="fo-slot-title">СЛОТ 2 ${this.char.activeSlotIndex === 2 ? '(АКТИВЕН)' : ''}</span>
              <span class="fo-slot-item-name">${slot2Item.name}${slot2Item.count ? ` (${slot2Item.count})` : ''}</span>
            </div>
          </div>
          <div class="fo-inv-list">
            ${itemsHtml || '<div class="fo-empty-text">Инвентарь пуст</div>'}
          </div>
        </div>
      `;

      overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());

      // Slot Card Clicks (toggle active slot)
      overlay.querySelector('#fo-inv-slot1-card').addEventListener('click', () => {
        this.char.activeSlotIndex = 1;
        this.audio.playUI('click');
        this.updateHUD();
        renderItems();
      });

      overlay.querySelector('#fo-inv-slot2-card').addEventListener('click', () => {
        this.char.activeSlotIndex = 2;
        this.audio.playUI('click');
        this.updateHUD();
        renderItems();
      });

      // Use Item
      overlay.querySelectorAll('.fo-item-use').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          const item = this.char.inventory.find(i => i.id === id);
          if (item && item.use) {
            item.use(this.char, (m) => this.log(m));
            this.char.removeItem(id, 1);
            this.audio.playUI('open');
            this.updateHUD();
            renderItems();
          }
        });
      });

      // Equip to Slot 1
      overlay.querySelectorAll('.fo-item-slot1').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          if (this.char.slot1 === id) {
            this.char.equipToSlot('unarmed_punch', 1);
          } else {
            this.char.equipToSlot(id, 1);
          }
          this.audio.playUI('click');
          this.updateHUD();
          renderItems();
        });
      });

      // Equip to Slot 2
      overlay.querySelectorAll('.fo-item-slot2').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          if (this.char.slot2 === id) {
            this.char.equipToSlot('unarmed_punch', 2);
          } else {
            this.char.equipToSlot(id, 2);
          }
          this.audio.playUI('click');
          this.updateHUD();
          renderItems();
        });
      });

      // Explosive timer
      overlay.querySelectorAll('.fo-item-blast').forEach(btn => {
        btn.addEventListener('click', () => {
          this.closeModal();
          this.openDynamiteTimer();
        });
      });
    };

    renderItems();
  }

  openCharacterSheet() {
    this.activeModal = 'cha';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    const s = this.char.special;
    overlay.innerHTML = `
      <div class="fo-modal fo-cha-modal">
        <div class="fo-modal-header">
          <span>ЛИСТ ПЕРСОНАЖА (S.P.E.C.I.A.L.)</span>
          <button id="fo-modal-close" class="fo-close-btn">X</button>
        </div>
        <div class="fo-cha-body">
          <div class="fo-cha-col">
            <div class="fo-cha-header">ХАРАКТЕРИСТИКИ</div>
            <div class="fo-stat-row"><span>Сила (Strength):</span> <strong>${s.strength}</strong></div>
            <div class="fo-stat-row"><span>Восприятие (Perception):</span> <strong>${this.char.getEffectiveStat('perception')}</strong></div>
            <div class="fo-stat-row"><span>Выносливость (Endurance):</span> <strong>${s.endurance}</strong></div>
            <div class="fo-stat-row"><span>Обаяние (Charisma):</span> <strong>${s.charisma}</strong></div>
            <div class="fo-stat-row"><span>Интеллект (Intelligence):</span> <strong>${s.intelligence}</strong></div>
            <div class="fo-stat-row"><span>Ловкость (Agility):</span> <strong>${s.agility}</strong></div>
            <div class="fo-stat-row"><span>Удача (Luck):</span> <strong>${s.luck}</strong></div>

            <div class="fo-cha-header" style="margin-top: 10px;">БОЕВЫЕ ПАРАМЕТРЫ</div>
            <div class="fo-stat-row"><span>Очки Действия (AP):</span> <strong>${this.char.ap}</strong></div>
            <div class="fo-stat-row"><span>Класс брони (AC):</span> <strong>${this.char.getArmorClass()}</strong></div>
            <div class="fo-stat-row"><span>Бонус рукопашной:</span> <strong>+${this.char.getMeleeDamage()}</strong></div>
            <div class="fo-stat-row"><span>Очередность (Sequence):</span> <strong>${this.char.getSequence()}</strong></div>
            <div class="fo-stat-row"><span>Шанс крит. удара:</span> <strong>${this.char.getCriticalChance()}%</strong></div>
          </div>

          <div class="fo-cha-col">
            <div class="fo-cha-header">НАВЫКИ ХРАМА</div>
            <div class="fo-stat-row"><span>Холодное оружие (Melee):</span> <strong>${this.char.skills.melee}%</strong></div>
            <div class="fo-stat-row"><span>Безоружный бой (Unarmed):</span> <strong>${this.char.skills.unarmed}%</strong></div>
            <div class="fo-stat-row"><span>Взлом (Lockpick):</span> <strong>${this.char.skills.lockpick}%</strong></div>
            <div class="fo-stat-row"><span>Ловушки (Traps):</span> <strong>${this.char.skills.traps}%</strong></div>
            <div class="fo-stat-row"><span>Красноречие (Speech):</span> <strong>${this.char.skills.speech}%</strong></div>
            <div class="fo-stat-row"><span>Воровство (Steal):</span> <strong>${this.char.skills.steal}%</strong></div>

            <div class="fo-cha-header" style="margin-top: 10px;">ИНФОРМАЦИЯ</div>
            <div class="fo-stat-row"><span>Уровень:</span> <strong>${this.char.level}</strong></div>
            <div class="fo-stat-row"><span>Опыт (XP):</span> <strong>${this.char.xp} / ${this.char.nextLevelXp}</strong></div>
            <div class="fo-stat-row"><span>Карма:</span> <strong>Герой племени</strong></div>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());
  }

  openPipBoy() {
    this.activeModal = 'pip';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    const d1 = this.temple.doors.find(d => d.id === 'door_1').isOpen;
    const d2 = this.temple.doors.find(d => d.id === 'door_blast').isOpen;
    const cameron = this.temple.enemies.find(e => e.id === 'cameron');
    const cameronBeaten = cameron.hasSurrendered || cameron.hasGivenKey || !cameron.hasKey;

    overlay.innerHTML = `
      <div class="fo-modal fo-pip-modal">
        <div class="fo-modal-header">
          <span>PIP-BOY 2000 — ЗАДАЧИ АРРОЙО</span>
          <button id="fo-modal-close" class="fo-close-btn">X</button>
        </div>
        <div class="fo-pip-content">
          <div class="fo-pip-location">ЛОКАЦИЯ: ХРАМ ИСПЫТАНИЙ (АРРОЙО)</div>
          <div class="fo-pip-quest">ОСНОВНОЙ КВЕСТ: «ПРОЙТИ ХРАМ ИСПЫТАНИЙ»</div>
          <ul class="fo-pip-task-list">
            <li class="${d1 ? 'done' : 'active'}">1. Зал 1: Взломать ритуальную деревянную дверь отмычкой [${d1 ? 'ВЫПОЛНЕНО' : 'В ПРОЦЕССЕ'}]</li>
            <li class="${d2 ? 'done' : 'active'}">2. Зал 2: Разминировать плиты коридора и взорвать врата динамитом [${d2 ? 'ВЫПОЛНЕНО' : 'В ПРОЦЕССЕ'}]</li>
            <li class="${cameronBeaten ? 'done' : 'active'}">3. Зал 3: Пройти испытание Камерона (дуэль / убеждение / воровство) [${cameronBeaten ? 'ВЫПОЛНЕНО' : 'В ПРОЦЕССЕ'}]</li>
            <li>4. Выйти через ритуальные врата в деревню Арройо</li>
          </ul>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());
  }

  openCameronDialogue() {
    this.activeModal = 'dialog';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    const cameron = this.temple.enemies.find(e => e.id === 'cameron');

    overlay.innerHTML = `
      <div class="fo-modal fo-dialog-modal">
        <div class="fo-modal-header">
          <span>ДИАЛОГ: КАМЕРОН</span>
          <button id="fo-modal-close" class="fo-close-btn">X</button>
        </div>
        <div class="fo-dialog-body">
          <div class="fo-dialog-portrait">
            <div class="fo-portrait-box"></div>
            <span class="fo-portrait-name">КАМЕРОН</span>
          </div>
          <div class="fo-dialog-text-area">
            <div class="fo-npc-speech">
              «Приветствую тебя, Избранный! Ты преодолел ловушки и тварей храма. Но последнее испытание — перед тобой. 
              Чтобы выйти к нашему народу и доказать право на священный костюм Убежища 13, ты должен превзойти меня!»
            </div>
            <div class="fo-dialog-options">
              <button class="fo-dlg-opt" id="dlg-opt-duel">
                1. «Я готов к испытанию! Давай сойдемся в священном кулачном бою.»
              </button>
              <button class="fo-dlg-opt" id="dlg-opt-speech">
                2. [Красноречие] «Камерон, зачем проливать кровь соплеменников? Настоящий вождь защищает племя мудростью, а не бессмысленным насилием.»
              </button>
              <button class="fo-dlg-opt" id="dlg-opt-steal">
                3. [Воровство] (Попробовать незаметно срезать ключ с его пояса, пока он говорит).
              </button>
              <button class="fo-dlg-opt" id="dlg-opt-exit">
                4. «Мне нужно время собраться с духом. Я вернусь.»
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());

    // Option 1: Unarmed Duel
    overlay.querySelector('#dlg-opt-duel').addEventListener('click', () => {
      this.closeModal();
      cameron.hasDuelStarted = true;
      cameron.state = 'hostile';
      this.log('Камерон встает в боевую стойку: "Помни: это бой чести, только на кулаках!"');
      this.combat.startCombat(cameron);
    });

    // Option 2: Speech check
    overlay.querySelector('#dlg-opt-speech').addEventListener('click', () => {
      const speechSkill = this.char.skills.speech;
      const roll = Math.floor(Math.random() * 100) + 1;
      this.closeModal();

      if (roll <= speechSkill) {
        cameron.hasGivenKey = true;
        cameron.hasKey = false;
        cameron.state = 'neutral';
        this.char.addItem('temple_key', 1);
        this.char.addXp(600, this.log);

        if (this.audio) this.audio.playLevelUp();
        this.log('Камерон опускает руки в глубоком раздумье: «Твои слова полны мудрости предков. Ты видишь дальше, чем простой воин. Возьми ключ, Избранный!» (+600 XP)');

        const exitDoor = this.temple.doors.find(d => d.id === 'door_exit');
        if (exitDoor) {
          exitDoor.isOpen = true;
          exitDoor.isLocked = false;
        }
      } else {
        this.log('Камерон качает головой: «Слова красивы, но старейшины требуют доказательства силы духа и кулаков!»');
      }
    });

    // Option 3: Steal check
    overlay.querySelector('#dlg-opt-steal').addEventListener('click', () => {
      const stealSkill = this.char.skills.steal;
      const roll = Math.floor(Math.random() * 100) + 1;
      this.closeModal();

      if (roll <= stealSkill) {
        cameron.hasKey = false;
        this.char.addItem('temple_key', 1);
        this.char.addXp(250, this.log);
        if (this.audio) this.audio.playUI('open');
        this.log('Вы ловко стащили ритуальный ключ с пояса Камерона незаметно для него! (+250 XP)');
      } else {
        cameron.state = 'hostile';
        this.log('Камерон перехватывает вашу руку: «Ты пытаешься обмануть стража храма?! Защищайся!»');
        this.combat.startCombat(cameron);
      }
    });

    // Option 4: Exit
    overlay.querySelector('#dlg-opt-exit').addEventListener('click', () => this.closeModal());
  }

  openDynamiteTimer() {
    this.activeModal = 'timer';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    overlay.innerHTML = `
      <div class="fo-modal fo-timer-modal">
        <div class="fo-modal-header">
          <span>УСТАНОВКА ЧАСОВОГО ВЗРЫВАТЕЛЯ</span>
          <button id="fo-modal-close" class="fo-close-btn">X</button>
        </div>
        <div class="fo-timer-content">
          <p>Выберите время таймера перед закладкой пластиковой взрывчатки (C4):</p>
          <div class="fo-timer-btn-row">
            <button class="fo-retro-btn fo-timer-set" data-sec="5">5 СЕКУНД (Бегите!)</button>
            <button class="fo-retro-btn fo-timer-set" data-sec="10">10 СЕКУНД</button>
            <button class="fo-retro-btn fo-timer-set" data-sec="20">20 СЕКУНД</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());
    overlay.querySelectorAll('.fo-timer-set').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = parseInt(e.target.dataset.sec, 10);
        this.closeModal();
        this.startDynamiteCountdown(sec);
      });
    });
  }

  startDynamiteCountdown(seconds) {
    this.char.removeItem('dynamite', 1);
    const blastDoor = this.temple.doors.find(d => d.id === 'door_blast');

    this.log(`Взрывчатка активирована на таймер ${seconds} сек. и заложена! Отойдите в безопасную зону!`);
    if (this.audio) this.audio.playUI('click');

    let remaining = seconds;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      remaining--;
      if (this.audio) this.audio.playTimerTick();
      if (this.engine) {
        this.engine.addFloatingText(`⏱ ${remaining}...`, blastDoor.x, blastDoor.y, '#ff8800');
      }

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.temple.detonateBlastDoor();
        this.updateHUD();
      }
    }, 1000);
  }

  onVictory() {
    this.activeModal = 'victory';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    if (this.audio) this.audio.playLevelUp();

    overlay.innerHTML = `
      <div class="fo-modal fo-victory-modal">
        <div class="fo-modal-header">
          <span>СВЯЩЕННЫЙ ТРИУМФ — ИЗБРАННЫЙ АРРОЙО</span>
        </div>
        <div class="fo-victory-content">
          <div class="fo-vault-boy-art"></div>
          <h2>ПОЗДРАВЛЯЕМ! ВЫ ПРОШЛИ ХРАМ ИСПЫТАНИЙ!</h2>
          <p>
            Вы преодолели смертоносных скорпионов, разминировали коридор древних,
            взорвали монолитную преграду и доказали свою силу и мудрость Камерону!
          </p>
          <p>
            Старейшина деревни со слезами благословляет вас и вручает священный 
            <strong>Комбинезон Убежища 13</strong>, устройство <strong>PIP-BOY 2000</strong> и флягу со священным номером 13.
          </p>
          <p style="color: #ffdd44;">
            Ваш долг — отправиться в бескрайнюю радиоактивную Пустошь и спасти Арройо от гибели, найдя легендарный G.E.C.K.!
          </p>
          <button id="fo-restart-btn" class="fo-retro-btn" style="margin-top: 15px; font-size: 14px; padding: 6px 18px;">
            ИГРАТЬ СНОВА
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-restart-btn').addEventListener('click', () => {
      this.closeModal();
      if (window.appFallout2) window.appFallout2.restart();
    });
  }

  onPlayerDeath() {
    this.activeModal = 'gameover';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';

    overlay.innerHTML = `
      <div class="fo-modal fo-gameover-modal">
        <div class="fo-modal-header">
          <span>ВЫ ПОГИБЛИ</span>
        </div>
        <div class="fo-gameover-content">
          <h2 style="color: #ff2222;">ЖИЗНЬ ИЗБРАННОГО ОБОРВАЛАСЬ...</h2>
          <p>
            Ваше тело осталось лежать в холодных каменных залах Храма Испытаний.
            Деревня Арройо так и не дождется своего спасения.
          </p>
          <button id="fo-restart-dead" class="fo-retro-btn" style="margin-top: 15px; font-size: 14px; padding: 6px 18px;">
            ПОПРОБОВАТЬ СНОВА
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-restart-dead').addEventListener('click', () => {
      this.closeModal();
      if (window.appFallout2) window.appFallout2.restart();
    });
  }

  closeModal() {
    this.activeModal = null;
    const overlay = this.container.querySelector('#fo-modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
    this.audio.playUI('click');
  }

  openMainMenu() {
    this.gameStarted = false;
    this.isPaused = false;
    const menuEl = this.container.querySelector('#fo-menu-overlay');
    if (!menuEl) return;
    menuEl.style.display = 'flex';

    menuEl.innerHTML = `
      <div class="fo-mainmenu-box">
        <div class="fo-mainmenu-header">
          <div class="fo-mainmenu-logo">FALLOUT 2</div>
          <div class="fo-mainmenu-sub">A POST NUCLEAR ROLE PLAYING GAME</div>
          <div class="fo-mainmenu-trial">ХРАМ ИСПЫТАНИЙ (TEMPLE OF TRIALS)</div>
        </div>
        <div class="fo-mainmenu-lore">
          Арройо, 2241 год. Засуха медленно убивает племя. Чтобы доказать право надеть священный 
          комбинезон Убежища 13 и отправиться на поиски G.E.C.K., преодолейте древний Храм Испытаний.
        </div>
        <div class="fo-mainmenu-buttons">
          <button id="fo-mm-start" class="fo-retro-btn fo-mm-btn">НАЧАТЬ ИСПЫТАНИЕ</button>
          <button id="fo-mm-help" class="fo-retro-btn fo-mm-btn">МЕХАНИКИ ХРАМА</button>
          <button id="fo-mm-ctrl" class="fo-retro-btn fo-mm-btn">УПРАВЛЕНИЕ И ГОРЯЧИЕ КЛАВИШИ</button>
        </div>
      </div>
    `;

    menuEl.querySelector('#fo-mm-start').addEventListener('click', () => {
      this.gameStarted = true;
      this.isPaused = false;
      menuEl.style.display = 'none';
      if (this.audio) {
        this.audio.playUI('open');
        this.audio.startAmbient();
      }
      this.log('ХРАМ ИСПЫТАНИЙ, АРРОЙО (2241 год).');
      this.log('Вы вошли в первый зал. Отыщите путь в Святилище Камерона.');
      this.log('Управление: ЛКМ — движение / действие; ПКМ — прицел (V.A.T.S.); Пробел — ход/пауза; Esc — меню.');
      this.container.querySelector('.fo-wrapper').focus();
    });

    menuEl.querySelector('#fo-mm-help').addEventListener('click', () => this.openHelpModal());
    menuEl.querySelector('#fo-mm-ctrl').addEventListener('click', () => this.openControlsModal());
  }

  togglePause() {
    if (!this.gameStarted) return;
    this.isPaused = !this.isPaused;
    const menuEl = this.container.querySelector('#fo-menu-overlay');
    if (!menuEl) return;

    if (this.isPaused) {
      this.openPauseMenu();
    } else {
      menuEl.style.display = 'none';
      menuEl.innerHTML = '';
      this.container.querySelector('.fo-wrapper').focus();
    }
    if (this.audio) this.audio.playUI('click');
  }

  openPauseMenu() {
    const menuEl = this.container.querySelector('#fo-menu-overlay');
    if (!menuEl) return;
    menuEl.style.display = 'flex';

    menuEl.innerHTML = `
      <div class="fo-pause-box">
        <div class="fo-pause-title">ПАУЗА (GAME PAUSED)</div>
        <div class="fo-pause-buttons">
          <button id="fo-p-resume" class="fo-retro-btn fo-mm-btn">ПРОДОЛЖИТЬ</button>
          <button id="fo-p-quicksave" class="fo-retro-btn fo-mm-btn">БЫСТРОЕ СОХРАНЕНИЕ [F5]</button>
          <button id="fo-p-quickload" class="fo-retro-btn fo-mm-btn">БЫСТРАЯ ЗАГРУЗКА [F9]</button>
          <button id="fo-p-ctrl" class="fo-retro-btn fo-mm-btn">УПРАВЛЕНИЕ</button>
          <button id="fo-p-sound" class="fo-retro-btn fo-mm-btn">ЗВУК: ${this.audio && this.audio.enabled ? 'ВКЛ' : 'ВЫКЛ'}</button>
          <button id="fo-p-restart" class="fo-retro-btn fo-mm-btn">НАЧАТЬ ЗАНОВО</button>
          <button id="fo-p-mainmenu" class="fo-retro-btn fo-mm-btn">ГЛАВНОЕ МЕНЮ</button>
        </div>
      </div>
    `;

    menuEl.querySelector('#fo-p-resume').addEventListener('click', () => this.togglePause());
    menuEl.querySelector('#fo-p-quicksave').addEventListener('click', () => {
      this.quickSave();
      this.togglePause();
    });
    menuEl.querySelector('#fo-p-quickload').addEventListener('click', () => {
      this.quickLoad();
    });
    menuEl.querySelector('#fo-p-ctrl').addEventListener('click', () => this.openControlsModal());
    menuEl.querySelector('#fo-p-sound').addEventListener('click', (e) => {
      if (this.audio) {
        this.audio.enabled = !this.audio.enabled;
        e.target.textContent = `ЗВУК: ${this.audio.enabled ? 'ВКЛ' : 'ВЫКЛ'}`;
      }
    });
    menuEl.querySelector('#fo-p-restart').addEventListener('click', () => {
      menuEl.style.display = 'none';
      if (window.appFallout2) window.appFallout2.restart();
    });
    menuEl.querySelector('#fo-p-mainmenu').addEventListener('click', () => {
      this.openMainMenu();
    });
  }

  quickSave() {
    try {
      const saveData = {
        char: {
          hp: this.char.hp,
          maxHp: this.char.maxHp,
          ap: this.char.ap,
          currentAp: this.char.currentAp,
          level: this.char.level,
          xp: this.char.xp,
          nextLevelXp: this.char.nextLevelXp,
          slot1: this.char.slot1,
          slot2: this.char.slot2,
          activeSlotIndex: this.char.activeSlotIndex,
          x: this.char.x,
          y: this.char.y,
          inventory: this.char.inventory.map(i => ({ id: i.id, count: i.count }))
        },
        temple: {
          doors: this.temple.doors.map(d => ({ id: d.id, isOpen: d.isOpen, isLocked: d.isLocked })),
          traps: this.temple.traps.map(t => ({ x: t.x, y: t.y, revealed: t.revealed, disarmed: t.disarmed })),
          containers: this.temple.containers.map(c => ({ id: c.id, looted: c.looted, items: c.items })),
          enemies: this.temple.enemies.map(e => ({
            id: e.id,
            hp: e.hp,
            isDead: e.isDead,
            state: e.state,
            x: e.x,
            y: e.y,
            hasSurrendered: e.hasSurrendered,
            hasGivenKey: e.hasGivenKey,
            hasDuelStarted: e.hasDuelStarted
          }))
        },
        combat: {
          inCombat: this.combat.inCombat,
          turn: this.combat.turn
        }
      };

      localStorage.setItem('fo2_quicksave', JSON.stringify(saveData));
      this.log('*** ИГРА СОХРАНЕНА [F5] ***');
      if (this.audio) this.audio.playUI('open');
      if (this.engine) {
        this.engine.addFloatingText('СОХРАНЕНО [F5]', this.char.x, this.char.y, '#33ff33');
      }
    } catch (err) {
      console.error('QuickSave error:', err);
      this.log('Ошибка быстрого сохранения!');
    }
  }

  quickLoad() {
    try {
      const raw = localStorage.getItem('fo2_quicksave');
      if (!raw) {
        this.log('Нет данных быстрого сохранения!');
        if (this.audio) this.audio.playUI('click');
        return;
      }
      const data = JSON.parse(raw);
      if (!data || !data.char) {
        this.log('Файл сохранения поврежден!');
        return;
      }

      // Restore Character
      this.char.hp = data.char.hp;
      this.char.maxHp = data.char.maxHp;
      this.char.ap = data.char.ap;
      this.char.currentAp = data.char.currentAp;
      this.char.level = data.char.level;
      this.char.xp = data.char.xp;
      this.char.nextLevelXp = data.char.nextLevelXp;
      this.char.slot1 = data.char.slot1 || 'spear';
      this.char.slot2 = data.char.slot2 || 'unarmed_punch';
      this.char.activeSlotIndex = data.char.activeSlotIndex || 1;
      this.char.x = data.char.x;
      this.char.y = data.char.y;

      // Restore Inventory
      if (data.char.inventory) {
        this.char.inventory = [];
        data.char.inventory.forEach(savedItem => {
          const base = window.ITEMS_DB[savedItem.id];
          if (base) {
            this.char.inventory.push({ ...base, count: savedItem.count || 1 });
          }
        });
      }

      // Restore Temple Doors
      if (data.temple && data.temple.doors) {
        data.temple.doors.forEach(sd => {
          const door = this.temple.doors.find(d => d.id === sd.id);
          if (door) {
            door.isOpen = sd.isOpen;
            door.isLocked = sd.isLocked;
          }
        });
      }

      // Restore Temple Traps
      if (data.temple && data.temple.traps) {
        data.temple.traps.forEach(st => {
          const trap = this.temple.traps.find(t => t.x === st.x && t.y === st.y);
          if (trap) {
            trap.revealed = st.revealed;
            trap.disarmed = st.disarmed;
          }
        });
      }

      // Restore Containers
      if (data.temple && data.temple.containers) {
        data.temple.containers.forEach(sc => {
          const cont = this.temple.containers.find(c => c.id === sc.id);
          if (cont) {
            cont.looted = sc.looted;
            cont.items = sc.items;
          }
        });
      }

      // Restore Enemies
      if (data.temple && data.temple.enemies) {
        data.temple.enemies.forEach(se => {
          const enemy = this.temple.enemies.find(e => e.id === se.id);
          if (enemy) {
            enemy.hp = se.hp;
            enemy.isDead = se.isDead;
            enemy.state = se.state;
            enemy.x = se.x;
            enemy.y = se.y;
            if (se.hasSurrendered !== undefined) enemy.hasSurrendered = se.hasSurrendered;
            if (se.hasGivenKey !== undefined) enemy.hasGivenKey = se.hasGivenKey;
            if (se.hasDuelStarted !== undefined) enemy.hasDuelStarted = se.hasDuelStarted;
          }
        });
      }

      // Restore Combat
      if (data.combat) {
        this.combat.inCombat = data.combat.inCombat;
        this.combat.turn = data.combat.turn;
      }

      if (this.activeModal) {
        this.closeModal();
      }
      if (this.isPaused) {
        this.togglePause();
      }

      this.engine.centerOnPlayer();
      this.updateHUD();
      this.log('*** БЫСТРАЯ ЗАГРУЗКА ВЫПОЛНЕНА [F9] ***');
      if (this.audio) this.audio.playUI('open');
      if (this.engine) {
        this.engine.addFloatingText('ЗАГРУЖЕНО [F9]', this.char.x, this.char.y, '#ffff33');
      }
    } catch (err) {
      console.error('QuickLoad error:', err);
      this.log('Ошибка быстрой загрузки!');
    }
  }

  openHelpModal() {
    this.activeModal = 'help';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    overlay.innerHTML = `
      <div class="fo-modal" style="width: 560px;">
        <div class="fo-modal-header">
          <span>РУКОВОДСТВО: МЕХАНИКИ ХРАМА ИСПЫТАНИЙ</span>
          <button id="fo-modal-close" class="fo-close-btn">X</button>
        </div>
        <div style="padding: 14px; font-size: 11px; line-height: 16px; color: #ddcfbe; max-height: 360px; overflow-y: auto;">
          <h4 style="color: #ffdd44; margin: 0 0 6px 0;">1. ИССЛЕДОВАНИЕ И БОЙ:</h4>
          <p>Вне боя Избранный свободно перемещается в реальном времени. При приближении к врагам (муравьи, скорпионы) автоматически включается пошаговый бой на Очках Действия (AP). Копье бьет на 2 клетки!</p>
          <h4 style="color: #ffdd44; margin: 10px 0 6px 0;">2. V.A.T.S. (ПРИЦЕЛЬНЫЕ УДАРЫ):</h4>
          <p>Кликните ПКМ или кнопку ПРИЦЕЛ на оружии. Вы сможете атаковать глаза (-60% шанса, высокий крит/ослепление), голову, пах или лапы противника (+1 AP затрат).</p>
          <h4 style="color: #ffdd44; margin: 10px 0 6px 0;">3. ДВА СЛОТА ОРУЖИЯ (ITEM 1 / ITEM 2):</h4>
          <p>В Fallout 2 у героя 2 активных слота. Переключайте их клавишей [B] или кнопкой СЛОТ [B]. В бою смена слота стоит 1 AP. В инвентаре можно экипировать любое оружие в Слот 1 или Слот 2.</p>
          <h4 style="color: #ffdd44; margin: 10px 0 6px 0;">4. ЛОВУШКИ И ВЗЛОМ:</h4>
          <p>В коридоре второго зала спрятаны нажимные плиты. Восприятие подсвечивает их, навык Traps позволяет разминировать (+25 XP и дротик). Дверь 1 взламывается навыком Lockpick. В сундуке зала 2 спрятана взрывчатка C4 с таймером для сноса монолитных ворот.</p>
          <h4 style="color: #ffdd44; margin: 10px 0 6px 0;">5. СОХРАНЕНИЯ (F5 / F9):</h4>
          <p>Быстрое сохранение [F5] и быстрая загрузка [F9] в любой момент игры.</p>
          <h4 style="color: #ffdd44; margin: 10px 0 6px 0;">6. ФИНАЛЬНОЕ ИСПЫТАНИЕ (КАМЕРОН):</h4>
          <p>Камерона можно пройти тремя путями: честным кулачным боем до сдачи (при $\le 25\%$ HP он признает силу), дипломатическим убеждением (навык Speech, +600 XP) или воровством ключа (навык Steal).</p>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());
  }

  openControlsModal() {
    this.activeModal = 'controls';
    const overlay = this.container.querySelector('#fo-modal-overlay');
    overlay.style.display = 'flex';
    this.audio.playUI('open');

    overlay.innerHTML = `
      <div class="fo-modal" style="width: 520px;">
        <div class="fo-modal-header">
          <span>УПРАВЛЕНИЕ И ГОРЯЧИЕ КЛАВИШИ</span>
          <button id="fo-modal-close" class="fo-close-btn">X</button>
        </div>
        <div style="padding: 14px; font-size: 11px; line-height: 18px; color: #ddcfbe;">
          <div class="fo-stat-row"><span>ЛКМ (Левый клик):</span> <strong>Ходьба / Атака / Обыск / Открытие</strong></div>
          <div class="fo-stat-row"><span>ПКМ (Правый клик):</span> <strong>Режим прицела (V.A.T.S.)</strong></div>
          <div class="fo-stat-row"><span>Клавиша B:</span> <strong>Смена активного слота (Слот 1 / Слот 2)</strong></div>
          <div class="fo-stat-row"><span>Клавиша F5:</span> <strong>Быстрое сохранение (QuickSave)</strong></div>
          <div class="fo-stat-row"><span>Клавиша F9:</span> <strong>Быстрая загрузка (QuickLoad)</strong></div>
          <div class="fo-stat-row"><span>Пробел (Space):</span> <strong>Конец хода / Выход из боя / Пауза</strong></div>
          <div class="fo-stat-row"><span>Клавиша Esc:</span> <strong>Меню паузы / Закрыть окно</strong></div>
          <div class="fo-stat-row"><span>Клавиша 1:</span> <strong>Инвентарь (INV)</strong></div>
          <div class="fo-stat-row"><span>Клавиша 2:</span> <strong>Характеристики S.P.E.C.I.A.L. (CHA)</strong></div>
          <div class="fo-stat-row"><span>Клавиша 3:</span> <strong>Задачи Арройо (PIP)</strong></div>
          <div class="fo-stat-row"><span>Кнопка «БОЙ»:</span> <strong>Войти в бой / Завершить ход / Выйти</strong></div>
        </div>
      </div>
    `;

    overlay.querySelector('#fo-modal-close').addEventListener('click', () => this.closeModal());
  }
}

window.FalloutUI = FalloutUI;

