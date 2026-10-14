/**
 * Fallout 2: Temple of Trials Map & Mechanics Data
 * Models the three chambers:
 * Area 1: Entrance, Ants, Scorpions, Bones, Locked Door 1 (Lockpick check).
 * Area 2: Trap Corridor (6 pressure plates, perception detection, disarm +25 XP + dart),
 *         Chest with C4 Dynamite, Massive Stone Door (explosive blast).
 * Area 3: Inner Sanctum, Cameron Boss encounter (Duel / Speech / Steal) & Arroyo Exit.
 */

class FalloutTemple {
  constructor(char, audio, log) {
    this.char = char;
    this.audio = audio;
    this.log = log;

    // Grid size: width 17, height 48
    this.width = 17;
    this.height = 48;

    this.map = [];
    this.traps = [];
    this.doors = [];
    this.containers = [];
    this.enemies = [];

    this.buildTemple();
  }

  buildTemple() {
    // 0 = void, 1 = stone wall, 2 = decorative pillar, 3 = floor
    this.map = Array.from({ length: this.height }, () => Array(this.width).fill(0));

    // Helper: carve rectangular room
    const carveRoom = (x1, y1, x2, y2) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x === x1 || x === x2 || y === y1 || y === y2) {
            this.map[y][x] = 1; // Wall
          } else {
            this.map[y][x] = 3; // Walkable Floor
          }
        }
      }
    };

    // Helper: carve corridor
    const carveCorridor = (x1, y1, x2, y2) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          this.map[y][x] = 3;
          // Outer walls
          if (x - 1 >= 0 && this.map[y][x - 1] === 0) this.map[y][x - 1] = 1;
          if (x + 1 < this.width && this.map[y][x + 1] === 0) this.map[y][x + 1] = 1;
        }
      }
    };

    // --- AREA 1: Entrance Hall (y: 1..12, x: 4..12) ---
    carveRoom(4, 1, 12, 12);
    // Columns
    this.map[4][6] = 2;
    this.map[4][10] = 2;
    this.map[9][6] = 2;
    this.map[9][10] = 2;

    // --- AREA 2: Corridor of Traps & Side Chambers (y: 13..28) ---
    // Corridor (x: 7..9, y: 13..27)
    carveCorridor(7, 13, 9, 27);

    // Side Chest Chamber (West: x: 1..6, y: 18..24)
    carveRoom(1, 18, 6, 24);
    // Opening between corridor and side chamber
    this.map[21][6] = 3;

    // --- AREA 3: Inner Sanctum (y: 29..45, x: 3..13) ---
    carveRoom(3, 29, 13, 45);
    // Sanctum pillars
    this.map[33][5] = 2;
    this.map[33][11] = 2;
    this.map[39][5] = 2;
    this.map[39][11] = 2;

    // --- DOORWAYS (Walkable floor 3 under doors) ---
    // Door 1: Between Area 1 and Area 2 at (8, 12)
    this.map[12][8] = 3;
    this.map[12][7] = 1;
    this.map[12][9] = 1;

    // Door 2: Blast Door between Area 2 and Area 3 at (8, 28)
    for (let x = 0; x < this.width; x++) {
      if (x === 8) {
        this.map[28][x] = 3; // Blast door opening
      } else if (x >= 3 && x <= 13) {
        this.map[28][x] = 1; // Wall separating Corridor 2 and Sanctum
      }
    }

    // Door 3: Exit Gate at (8, 45)
    this.map[45][8] = 3;
    this.map[45][7] = 1;
    this.map[45][9] = 1;
    if (this.height > 46) this.map[46][8] = 3;

    // --- DOORS ---
    // Door 1: Between Area 1 and Area 2 (x: 8, y: 12)
    this.doors.push({
      id: 'door_1',
      x: 8,
      y: 12,
      name: 'Массивная деревянная дверь',
      isOpen: false,
      isLocked: true,
      difficulty: 35,
      type: 'lockpick'
    });

    // Door 2: Massive Stone Blast Door between Area 2 and Area 3 (x: 8, y: 28)
    this.doors.push({
      id: 'door_blast',
      x: 8,
      y: 28,
      name: 'Тяжелая каменная плита',
      isOpen: false,
      isLocked: true,
      difficulty: 999, // Cannot be picked, requires dynamite
      type: 'blast'
    });

    // Exit Door: Temple Gate to Arroyo (x: 8, y: 45)
    this.doors.push({
      id: 'door_exit',
      x: 8,
      y: 45,
      name: 'Выход в деревню Арройо',
      isOpen: false,
      isLocked: true,
      difficulty: 999,
      type: 'cameron_key'
    });

    // --- TRAPS (Corridor floor plates in Area 2) ---
    // Traps placed at specific tiles along the narrow corridor
    const trapCoords = [
      { x: 8, y: 15 },
      { x: 7, y: 17 },
      { x: 9, y: 19 },
      { x: 8, y: 22 },
      { x: 7, y: 24 },
      { x: 8, y: 26 }
    ];

    trapCoords.forEach((t, idx) => {
      this.traps.push({
        id: `trap_${idx}`,
        x: t.x,
        y: t.y,
        revealed: false,
        disarmed: false,
        difficulty: 35,
        damage: [4, 9]
      });
    });

    // --- CONTAINERS (Loot) ---
    // Bones near entrance with spear & powder
    this.containers.push({
      id: 'bones_1',
      type: 'bones',
      name: 'Останки павшего послушника',
      x: 6,
      y: 4,
      looted: false,
      items: [
        { id: 'healing_powder', name: 'Целебный порошок', count: 1 }
      ]
    });

    // Urn in Area 1
    this.containers.push({
      id: 'urn_1',
      type: 'urn',
      name: 'Глиняный ритуальный кувшин',
      x: 10,
      y: 3,
      looted: false,
      items: [
        { id: 'healing_powder', name: 'Целебный порошок', count: 1 }
      ]
    });

    // Chest with Dynamite in Side Chamber (Area 2)
    this.containers.push({
      id: 'chest_dynamite',
      type: 'chest',
      name: 'Каменный сундук древних',
      x: 3,
      y: 20,
      looted: false,
      items: [
        { id: 'dynamite', name: 'Пластиковая взрывчатка (C4 / Динамит)', count: 1 }
      ]
    });

    // Urn in Sanctum
    this.containers.push({
      id: 'urn_2',
      type: 'urn',
      name: 'Священный кувшин старейшин',
      x: 11,
      y: 32,
      looted: false,
      items: [
        { id: 'healing_powder', name: 'Целебный порошок', count: 2 }
      ]
    });

    // --- ENEMIES ---
    // Area 1: Giant Ants & Radscorpion (placed at bottom of Area 1 so player can explore entrance hall)
    this.enemies.push(this.createEnemy('ant_1', 'ant', 'Гигантский муравей', 8, 8, 10, 2, 7));
    this.enemies.push(this.createEnemy('ant_2', 'ant', 'Гигантский муравей', 10, 9, 10, 2, 7));
    this.enemies.push(this.createEnemy('scorp_1', 'scorpion', 'Малый радскорпион', 6, 10, 14, 3, 7, true));

    // Area 2: Scorpions in corridor & side room
    this.enemies.push(this.createEnemy('scorp_2', 'scorpion', 'Малый радскорпион', 8, 18, 16, 3, 7, true));
    this.enemies.push(this.createEnemy('ant_3', 'ant', 'Гигантский муравей', 3, 22, 12, 2, 7));

    // Area 3: Cameron (Boss / Arroyo Champion)
    this.enemies.push({
      id: 'cameron',
      type: 'cameron',
      name: 'Камерон',
      title: 'Страж Испытаний Арройо',
      x: 8,
      y: 38,
      hp: 45,
      maxHp: 45,
      ac: 12,
      ap: 9,
      currentAp: 9,
      damageMin: 3,
      damageMax: 7,
      isDead: false,
      state: 'neutral', // Starts neutral until dialogue or attacked
      hasDuelStarted: false,
      hasSurrendered: false,
      hasGivenKey: false,
      hasKey: true
    });
  }

  createEnemy(id, type, name, x, y, hp, dmgMin, dmgMax, hasPoison = false) {
    return {
      id,
      type,
      name,
      x,
      y,
      hp,
      maxHp: hp,
      ac: type === 'scorpion' ? 8 : 4,
      ap: 7,
      currentAp: 7,
      damageMin: dmgMin,
      damageMax: dmgMax,
      hasPoison,
      isDead: false,
      state: 'hostile'
    };
  }

  isFloor(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const tile = this.map[y][x];
    if (tile !== 3) return false;
    const door = this.doors.find(d => d.x === x && d.y === y);
    if (door && !door.isOpen) return false;
    return true;
  }

  isWalkable(x, y, ignorePlayer = false, ignoreEnemy = null) {
    if (!this.isFloor(x, y)) return false;

    // Check living enemies
    const enemy = this.enemies.find(e => e.x === x && e.y === y && !e.isDead && e !== ignoreEnemy);
    if (enemy) return false;

    // Check player
    if (!ignorePlayer && this.char.x === x && this.char.y === y) return false;

    return true;
  }

  getEnemyNear(x, y, radius = 3.5) {
    return this.enemies.find(e => {
      if (e.isDead || e.state === 'neutral') return false;
      const d = Math.hypot(e.x - x, e.y - y);
      return d <= radius;
    });
  }

  getTrapAt(x, y) {
    return this.traps.find(t => t.x === x && t.y === y);
  }

  getDoorAt(x, y) {
    return this.doors.find(d => d.x === x && d.y === y);
  }

  getContainerAt(x, y) {
    return this.containers.find(c => c.x === x && c.y === y);
  }

  getEnemyAt(x, y) {
    return this.enemies.find(e => e.x === x && e.y === y && !e.isDead);
  }

  // Triggered when player steps on a tile
  onStepTile(x, y) {
    // 1. Check trap
    const trap = this.getTrapAt(x, y);
    if (trap && !trap.disarmed) {
      this.triggerTrap(trap);
    }

    // 2. Perception check for nearby hidden traps
    this.checkTrapDetection(x, y);

    // 3. Proximity to Cameron for Dialogue trigger
    const cameron = this.enemies.find(e => e.id === 'cameron');
    if (cameron && !cameron.isDead && !cameron.hasSurrendered && !cameron.hasDuelStarted) {
      const dist = Math.hypot(cameron.x - x, cameron.y - y);
      if (dist <= 3) {
        if (window.falloutUI) {
          window.falloutUI.openCameronDialogue();
        }
      }
    }
  }

  checkTrapDetection(px, py) {
    const per = this.char.getEffectiveStat('perception');
    const trapsSkill = this.char.skills.traps;

    this.traps.forEach(trap => {
      if (trap.revealed || trap.disarmed) return;
      const d = Math.hypot(trap.x - px, trap.y - py);
      if (d <= 3) {
        // Detection roll
        const chance = (per * 10) + Math.floor(trapsSkill / 2);
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll <= chance) {
          trap.revealed = true;
          this.log(`[Восприятие] Вы заметили замаскированную нажимную плиту в полу! (${trap.x}, ${trap.y})`);
          if (this.audio) this.audio.playUI('click');
        }
      }
    });
  }

  triggerTrap(trap) {
    trap.revealed = true;
    if (this.audio) this.audio.playTrapTrigger();

    const dmg = Math.floor(Math.random() * (trap.damage[1] - trap.damage[0] + 1)) + trap.damage[0];
    this.char.hp = Math.max(0, this.char.hp - dmg);

    this.log(`ЩЕЛЧОК! Вы наступили на ловушку! Из стены вылетел дротик и нанес ${dmg} урона!`);

    if (window.falloutEngine) {
      window.falloutEngine.addFloatingText(`-${dmg} HP (Ловушка)`, this.char.x, this.char.y, '#ff3322');
      window.falloutEngine.addBloodEffect(this.char.x, this.char.y);
    }

    if (this.char.hp <= 0 && window.falloutUI) {
      window.falloutUI.onPlayerDeath();
    }
  }

  disarmTrap(trap) {
    if (trap.disarmed) {
      this.log('Эта ловушка уже обезврежена.');
      return;
    }

    const trapsSkill = this.char.skills.traps;
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= trapsSkill) {
      trap.disarmed = true;
      trap.revealed = true;
      if (this.audio) this.audio.playTrapDisarm();

      this.char.addItem('dart', 1);
      this.char.addXp(25, this.log);
      this.log('Ловушка успешно обезврежена! Вы извлекли металлический дротик (+25 XP).');

      if (window.falloutEngine) {
        window.falloutEngine.addFloatingText('+25 XP', trap.x, trap.y, '#55ff55');
      }
    } else if (roll > 90) {
      // Critical failure triggers the trap
      this.log('Критический провал! Ваши пальцы соскользнули, ловушка сработала!');
      this.triggerTrap(trap);
    } else {
      this.log('Не удалось обезвредить ловушку. Попробуйте снова.');
    }
  }

  unlockDoor(door) {
    if (door.isOpen) return;

    if (door.id === 'door_blast') {
      this.log('Каменная дверь монолитна. Отмычки здесь бессильны — нужен мощный взрыв!');
      return;
    }

    if (door.id === 'door_exit') {
      if (this.char.hasItem('temple_key')) {
        door.isOpen = true;
        door.isLocked = false;
        this.log('Вы вставили Ключ Камерона в ритуальный замок. Врата в Арройо распахнулись!');
        if (this.audio) this.audio.playUI('open');
        if (window.falloutUI) window.falloutUI.onVictory();
      } else {
        this.log('Врата Арройо заперты на ритуальный замок. Ключ находится у Камерона.');
      }
      return;
    }

    // Door 1 Lockpicking
    const lockpickSkill = this.char.skills.lockpick;
    const hasLockpicks = this.char.hasItem('lockpick');
    const bonus = hasLockpicks ? 20 : 0;
    const chance = Math.min(95, lockpickSkill + bonus - door.difficulty + 50);

    const roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= chance) {
      door.isOpen = true;
      door.isLocked = false;
      if (this.audio) this.audio.playUI('open');
      this.char.addXp(100, this.log);
      this.log('Замок поддался с тихим щелчком! Дверь открыта (+100 XP).');
      if (window.falloutEngine) {
        window.falloutEngine.addFloatingText('+100 XP', door.x, door.y, '#55ff55');
      }
    } else {
      if (this.audio) this.audio.playUI('click');
      this.log('Замок не поддается. Попробуйте еще раз или используйте отмычки.');
    }
  }

  detonateBlastDoor() {
    const blastDoor = this.doors.find(d => d.id === 'door_blast');
    if (!blastDoor) return;

    blastDoor.isOpen = true;
    blastDoor.isLocked = false;

    if (this.audio) this.audio.playExplosion();
    if (window.falloutEngine) {
      window.falloutEngine.addExplosionEffect(blastDoor.x, blastDoor.y);
      window.falloutEngine.addFloatingText('БУУУМ!', blastDoor.x, blastDoor.y, '#ff4400');
    }

    this.char.addXp(150, this.log);
    this.log('ОГЛУШИТЕЛЬНЫЙ ВЗРЫВ! Каменная плита разлетелась на тысячи осколков! Проход в Святилище свободен (+150 XP)!');

    // Check if player was too close (within 2 tiles of blast)
    const dist = Math.hypot(this.char.x - blastDoor.x, this.char.y - blastDoor.y);
    if (dist <= 2) {
      const blastDmg = Math.floor(Math.random() * 15) + 10;
      this.char.hp = Math.max(0, this.char.hp - blastDmg);
      this.log(`Вас задело взрывной волной! Получено ${blastDmg} урона.`);
      if (window.falloutEngine) {
        window.falloutEngine.addFloatingText(`-${blastDmg} HP (Взрыв)`, this.char.x, this.char.y, '#ff2211');
      }
      if (this.char.hp <= 0 && window.falloutUI) {
        window.falloutUI.onPlayerDeath();
      }
    }
  }
}

window.FalloutTemple = FalloutTemple;

