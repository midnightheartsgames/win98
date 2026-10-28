/**
 * The Curse of Win 98: A LucasArts SCUMM Point-and-Click Adventure
 * Features classic 9-verb SCUMM console, animated Guybrush Bytepwood,
 * multi-room exploration, inventory combinations, branching dialogue, and puzzles.
 */
class AppScummQuest {
  constructor() {
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Viewport resolution
    this.width = 320;
    this.height = 140;

    // SCUMM State
    this.currentVerb = 'Walk to';
    this.selectedItem = null; // Item from inventory
    this.hoverTarget = null;
    this.sentence = 'Walk to';
    this.pendingAction = null;

    // Guybrush Position & Movement
    this.guybrush = {
      x: 60,
      y: 115,
      targetX: 60,
      targetY: 115,
      speed: 65, // pixels per second
      direction: 'right', // 'left', 'right'
      isWalking: false,
      isTalking: false,
      walkFrame: 0,
      animTimer: 0
    };

    // Subtitle speech bubble
    this.speech = null; // { text, speaker: 'guybrush'|'npc', x, y, duration }

    // Dialogue choices mode
    this.inDialogue = false;
    this.dialogueOptions = [];

    // Current Room: 'lab', 'basement', 'rooftop'
    this.currentRoom = 'lab';

    // Inventory items list
    this.inventory = [
      { id: 'rubber_chicken', name: 'Rubber Chicken', desc: 'A rubber chicken with a pulley in the middle.' }
    ];

    // Game Puzzle Flags
    this.state = {
      coffeeHot: false,
      hasCoffee: false,
      sysadminAwake: false,
      hasAdminDisk: false,
      fuseFixed: false,
      hasWire: false,
      hasPigeonCD: false,
      serverBooted: false
    };

    this.verbs = [
      'Give', 'Open', 'Close',
      'Pick up', 'Look at', 'Talk to',
      'Use', 'Push', 'Pull'
    ];
  }

  open() {
    const winId = 'app_scumm_quest';
    this.win = window.winManager.createWindow({
      id: winId,
      title: 'LucasQuest 98 Demo - The Curse of Win 98',
      icon: 'lucas-quest',
      width: 580,
      height: 440,
      resizable: true,
      content: this.buildHTML()
    });

    this.initGameInstance();
    this.attachEvents();

    if (window.soundSys) {
      window.soundSys.playAdventureMusic();
    }
  }

  buildHTML() {
    return `
      <div class="scumm-container">
        <!-- 1. Visual Viewport -->
        <div class="scumm-viewport">
          <canvas class="scumm-canvas" width="${this.width}" height="${this.height}"></canvas>

          <!-- Floating Speech Subtitles -->
          <div class="scumm-subtitles-overlay" id="scumm-subtitles"></div>

          <!-- Room Title Indicator -->
          <div class="scumm-room-title" id="scumm-room-title">1998 Mainframe Lab</div>

          <!-- Branching Dialogue Choices (when talking) -->
          <div class="scumm-dialogue-overlay" id="scumm-dialogue-overlay"></div>
        </div>

        <!-- 2. SCUMM Console -->
        <div class="scumm-console">
          <!-- Dynamic Action Sentence Line -->
          <div class="scumm-sentence-line" id="scumm-sentence">Walk to</div>

          <!-- Lower Panel: 9 Verbs + Inventory -->
          <div class="scumm-lower-panel">
            <div class="scumm-verbs-grid">
              ${this.verbs.map(v => `<button class="scumm-verb-btn ${v === 'Walk to' ? 'active' : ''}" data-verb="${v}">${v}</button>`).join('')}
            </div>
            <div class="scumm-inventory-box" id="scumm-inventory"></div>
          </div>
        </div>
      </div>
    `;
  }

  initGameInstance() {
    const el = this.win.element;
    this.canvas = el.querySelector('.scumm-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.renderInventory();
    this.showRoomTitle();
    this.startGameLoop();

    // Opening Guybrush Monologue
    setTimeout(() => {
      this.sayGuybrush('Ah, Castle Redmond 1998...\nI need to get that server online and escape!');
    }, 600);
  }

  attachEvents() {
    const el = this.win.element;
    const sentenceEl = el.querySelector('#scumm-sentence');

    // Verb buttons click
    el.querySelectorAll('.scumm-verb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cancelPendingAction();
        this.selectedItem = null;
        this.setVerb(btn.dataset.verb);
      });
    });

    // Canvas click & mouse movement
    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this.getCanvasPos(e);
      const hotspot = this.getHotspotAt(pos.x, pos.y);
      this.hoverTarget = hotspot;
      this.updateSentence();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverTarget = null;
      this.updateSentence();
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.inDialogue) return;
      const pos = this.getCanvasPos(e);
      const hotspot = this.getHotspotAt(pos.x, pos.y);

      if (hotspot) {
        this.handleActionOnHotspot(hotspot, pos);
      } else {
        // Walk on floor
        this.cancelPendingAction();
        this.guybrush.targetX = Math.max(20, Math.min(300, pos.x));
        this.guybrush.targetY = Math.max(95, Math.min(130, pos.y));
        this.resetVerb();
      }
    });

    this.win.onClose = () => {
      this.cancelPendingAction();
      if (this.animId) cancelAnimationFrame(this.animId);
      if (window.soundSys) window.soundSys.stopAdventureMusic();
    };
  }

  cancelPendingAction() {
    this.pendingAction = null;
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  setVerb(verb) {
    this.currentVerb = verb;
    const el = this.win.element;
    el.querySelectorAll('.scumm-verb-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.verb === verb);
    });
    this.updateSentence();
    if (window.soundSys) window.soundSys.playClick();
  }

  resetVerb() {
    this.setVerb('Walk to');
    this.selectedItem = null;
  }

  updateSentence() {
    const el = this.win.element;
    if (!el) return;
    const sentenceEl = el.querySelector('#scumm-sentence');
    if (!sentenceEl) return;

    if (this.pendingAction) {
      const { verb, hotspot, item } = this.pendingAction;
      if (item) {
        sentenceEl.textContent = `Use ${item.name} with ${hotspot.name}`;
      } else {
        sentenceEl.textContent = `${verb} ${hotspot.name}`;
      }
      return;
    }

    let text = this.currentVerb;
    if (this.selectedItem) {
      text = `Use ${this.selectedItem.name} with`;
    }

    if (this.hoverTarget) {
      text += ` ${this.hoverTarget.name}`;
    }

    sentenceEl.textContent = text;
  }

  renderInventory() {
    const el = this.win.element;
    const invEl = el.querySelector('#scumm-inventory');
    invEl.innerHTML = '';

    this.inventory.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'scumm-inv-item';
      if (this.selectedItem && this.selectedItem.id === item.id) {
        itemEl.classList.add('active');
      }
      itemEl.textContent = item.name;

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cancelPendingAction();
        if (this.currentVerb === 'Look at') {
          this.sayGuybrush(item.desc);
          this.resetVerb();
        } else if (this.currentVerb === 'Use') {
          this.selectedItem = item;
          this.updateSentence();
        } else {
          // Default: set to Use this item
          this.setVerb('Use');
          this.selectedItem = item;
          this.updateSentence();
        }
      });

      invEl.appendChild(itemEl);
    });
  }

  // Hotspots definition per room
  getHotspots() {
    if (this.currentRoom === 'lab') {
      return [
        {
          id: 'server',
          name: 'Mainframe Server',
          rect: { x: 190, y: 30, w: 45, h: 90 },
          walkPos: { x: 180, y: 115 }
        },
        {
          id: 'coffee_maker',
          name: 'Coffee Maker',
          rect: { x: 260, y: 65, w: 25, h: 30 },
          walkPos: { x: 250, y: 115 }
        },
        {
          id: 'desk_mug',
          name: 'Coffee Mug',
          rect: { x: 145, y: 75, w: 15, h: 15 },
          walkPos: { x: 140, y: 115 },
          visible: !this.state.hasCoffee
        },
        {
          id: 'sysadmin',
          name: 'Sleeping Sysadmin',
          rect: { x: 100, y: 55, w: 35, h: 55 },
          walkPos: { x: 90, y: 115 }
        },
        {
          id: 'door_basement',
          name: 'Door to Basement',
          rect: { x: 10, y: 40, w: 30, h: 75 },
          walkPos: { x: 25, y: 115 }
        }
      ];
    } else if (this.currentRoom === 'basement') {
      return [
        {
          id: 'fusebox',
          name: 'Broken Fusebox',
          rect: { x: 45, y: 40, w: 30, h: 40 },
          walkPos: { x: 55, y: 115 }
        },
        {
          id: 'wire_spool',
          name: 'Copper Wire Spool',
          rect: { x: 120, y: 100, w: 20, h: 18 },
          walkPos: { x: 120, y: 115 },
          visible: !this.state.hasWire
        },
        {
          id: 'tape_racks',
          name: 'Magnetic Tape Racks',
          rect: { x: 180, y: 35, w: 55, h: 80 },
          walkPos: { x: 175, y: 115 }
        },
        {
          id: 'ladder_roof',
          name: 'Ladder to Rooftop',
          rect: { x: 275, y: 25, w: 30, h: 95 },
          walkPos: { x: 275, y: 115 }
        },
        {
          id: 'door_lab',
          name: 'Stairs back to Lab',
          rect: { x: 5, y: 40, w: 25, h: 75 },
          walkPos: { x: 20, y: 115 }
        }
      ];
    } else if (this.currentRoom === 'rooftop') {
      return [
        {
          id: 'dish',
          name: 'Giant 56K Satellite Dish',
          rect: { x: 70, y: 25, w: 75, h: 80 },
          walkPos: { x: 90, y: 115 }
        },
        {
          id: 'pigeon',
          name: 'Cyber-Pigeon holding Boot CD',
          rect: { x: 180, y: 65, w: 30, h: 30 },
          walkPos: { x: 170, y: 115 },
          visible: !this.state.hasPigeonCD
        },
        {
          id: 'skyline',
          name: '1998 Sunset City Skyline',
          rect: { x: 220, y: 20, w: 90, h: 60 },
          walkPos: { x: 240, y: 115 }
        },
        {
          id: 'hatch_down',
          name: 'Roof Hatch to Basement',
          rect: { x: 15, y: 80, w: 35, h: 35 },
          walkPos: { x: 30, y: 115 }
        }
      ];
    }
    return [];
  }

  getHotspotAt(x, y) {
    const list = this.getHotspots();
    for (const h of list) {
      if (h.visible === false) continue;
      const r = h.rect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return h;
      }
    }
    return null;
  }

  handleActionOnHotspot(hotspot, clickPos) {
    if (this.inDialogue) return;

    this.guybrush.targetX = hotspot.walkPos.x;
    this.guybrush.targetY = hotspot.walkPos.y;

    this.pendingAction = {
      hotspot,
      verb: this.currentVerb,
      item: this.selectedItem
    };

    const dx = this.guybrush.targetX - this.guybrush.x;
    const dy = this.guybrush.targetY - this.guybrush.y;
    if (Math.hypot(dx, dy) <= 2) {
      this.executePendingAction();
    } else {
      this.updateSentence();
    }
  }

  executePendingAction() {
    if (!this.pendingAction) return;
    const action = this.pendingAction;
    this.pendingAction = null;

    const g = this.guybrush;
    if (action.hotspot && action.hotspot.rect) {
      const targetCenterX = action.hotspot.rect.x + action.hotspot.rect.w / 2;
      g.direction = targetCenterX >= g.x ? 'right' : 'left';
    }

    this.executeSCUMMCommand(action.verb, action.hotspot, action.item);
    this.resetVerb();
  }

  executeSCUMMCommand(verb, hotspot, item) {
    const id = hotspot.id;

    // 1. Navigation Doors
    if (id === 'door_basement') {
      if (verb === 'Open' || verb === 'Walk to' || verb === 'Use') {
        this.changeRoom('basement', 35, 115);
        return;
      }
    } else if (id === 'door_lab') {
      this.changeRoom('lab', 40, 115);
      return;
    } else if (id === 'ladder_roof') {
      this.changeRoom('rooftop', 40, 115);
      return;
    } else if (id === 'hatch_down') {
      this.changeRoom('basement', 260, 115);
      return;
    }

    // 2. Room 1 Puzzles (Lab)
    if (id === 'desk_mug') {
      if (verb === 'Pick up') {
        this.state.hasCoffee = true;
        this.inventory.push({ id: 'mug', name: 'Coffee Mug', desc: 'An empty ceramic mug with the Win 98 logo.' });
        this.renderInventory();
        if (window.soundSys) window.soundSys.playItemPickup();
        this.sayGuybrush('Got it! A pristine Win 98 coffee mug.');
        return;
      } else if (verb === 'Look at') {
        this.sayGuybrush('It says: "Win 98 - Where do you want to go today?"');
        return;
      }
    }

    if (id === 'coffee_maker') {
      if (verb === 'Use' && item && item.id === 'mug') {
        // Fill mug
        this.state.coffeeHot = true;
        this.inventory = this.inventory.filter(i => i.id !== 'mug');
        this.inventory.push({ id: 'hot_coffee', name: 'Mug of Hot Java', desc: 'Piping hot, heavily caffeinated Columbian brew.' });
        this.renderInventory();
        if (window.soundSys) window.soundSys.playItemPickup();
        this.sayGuybrush('The machine brewed a fresh cup of steaming hot Java!');
        return;
      } else if (verb === 'Look at') {
        this.sayGuybrush('A commercial grade IT office espresso machine.');
        return;
      }
    }

    if (id === 'sysadmin') {
      if (verb === 'Use' && item && item.id === 'hot_coffee') {
        this.state.sysadminAwake = true;
        this.inventory = this.inventory.filter(i => i.id !== 'hot_coffee');
        this.renderInventory();
        if (window.soundSys) window.soundSys.playItemPickup();
        this.sayNpc('YOWZA! That coffee burns! What day is it? Is it Y2K yet?');
        setTimeout(() => {
          this.openSysadminDialogue();
        }, 2200);
        return;
      } else if (verb === 'Talk to') {
        if (!this.state.sysadminAwake) {
          this.sayNpc('Zzzzz... just reboot the server... zzz...');
          setTimeout(() => {
            this.sayGuybrush('He is fast asleep. I need something strong to wake him up.');
          }, 2000);
        } else {
          this.openSysadminDialogue();
        }
        return;
      } else if (verb === 'Look at') {
        this.sayGuybrush(this.state.sysadminAwake ? 'Captain Bob, Senior Network Pirate.' : 'He has been debugging COBOL code for 72 straight hours.');
        return;
      }
    }

    if (id === 'server') {
      if (verb === 'Use' && item && item.id === 'admin_disk') {
        if (!this.state.fuseFixed) {
          this.sayGuybrush('The drive accepted the disk, but the main power is dead!\nI need to check the basement fusebox.');
        } else if (!this.state.hasPigeonCD) {
          this.sayGuybrush('Admin disk verified, but it needs the Win 98 Boot CD from the roof!');
        } else {
          // Win Game!
          this.triggerVictory();
        }
        return;
      } else if (verb === 'Use' && item && item.id === 'boot_cd') {
        if (this.state.hasAdminDisk && this.state.fuseFixed) {
          this.triggerVictory();
        } else {
          this.sayGuybrush('The CD drive needs power and the Admin Floppy Disk first!');
        }
        return;
      } else if (verb === 'Look at') {
        this.sayGuybrush('A massive IBM server rack running Win 98 Server Beta.');
        return;
      }
    }

    // 3. Room 2 Puzzles (Basement)
    if (id === 'wire_spool') {
      if (verb === 'Pick up') {
        this.state.hasWire = true;
        this.inventory.push({ id: 'copper_wire', name: 'Copper Wire', desc: 'Heavy-duty insulated electrical copper cable.' });
        this.renderInventory();
        if (window.soundSys) window.soundSys.playItemPickup();
        this.sayGuybrush('A roll of high-voltage jumper wire.');
        return;
      }
    }

    if (id === 'fusebox') {
      if (verb === 'Use' && item && item.id === 'copper_wire') {
        this.state.fuseFixed = true;
        this.inventory = this.inventory.filter(i => i.id !== 'copper_wire');
        this.renderInventory();
        if (window.soundSys) window.soundSys.playDing();
        this.sayGuybrush('BZZZZT! I bridged the blown fuse! Power is fully restored to the complex!');
        return;
      } else if (verb === 'Look at') {
        this.sayGuybrush(this.state.fuseFixed ? 'The fusebox is humming happily with power.' : 'The main 220V fuse is completely fried. I need some wire.');
        return;
      }
    }

    if (id === 'tape_racks') {
      if (verb === 'Look at') {
        this.sayGuybrush('Rows of magnetic backup tapes containing ancient DOS shareware.');
        return;
      }
    }

    // 4. Room 3 Puzzles (Rooftop)
    if (id === 'dish') {
      if (verb === 'Look at') {
        this.sayGuybrush('A high-gain dial-up parabolic dish pointed at the ISP satellite.');
        return;
      } else if (verb === 'Push' || verb === 'Use') {
        this.sayGuybrush('The dish is locked onto 56.6 Kbps maximum throughput.');
        return;
      }
    }

    if (id === 'pigeon') {
      if (verb === 'Use' && item && item.id === 'rubber_chicken') {
        this.state.hasPigeonCD = true;
        this.inventory.push({ id: 'boot_cd', name: 'Win98 Boot CD', desc: 'The holy grail: Win 98 Second Edition OEM CD-ROM.' });
        this.renderInventory();
        if (window.soundSys) window.soundSys.playItemPickup();
        this.sayGuybrush('I distracted the pigeon with the rubber chicken!\nI snatched the Win 98 Boot CD!');
        return;
      } else if (verb === 'Talk to') {
        this.sayNpc('COO! COO! (The pigeon clutches the shiny CD-ROM defensively)');
        setTimeout(() => {
          this.sayGuybrush('It loves shiny round things. Maybe a bizarre toy would distract it?');
        }, 1800);
        return;
      } else if (verb === 'Pick up') {
        this.sayGuybrush('The cyber-pigeon pecks viciously! I need to distract it.');
        return;
      }
    }

    if (id === 'skyline') {
      this.sayGuybrush('The city lights of 1998... Somewhere out there, people are surfing Yahoo and GeoCities.');
      return;
    }

    // Default SCUMM fallback responses
    if (verb === 'Look at') {
      this.sayGuybrush(`That's a ${hotspot.name}.`);
    } else if (verb === 'Pick up') {
      this.sayGuybrush(`I can't pick up the ${hotspot.name}!`);
    } else if (verb === 'Talk to') {
      this.sayGuybrush(`I don't think the ${hotspot.name} wants to talk to me.`);
    } else if (verb === 'Use') {
      this.sayGuybrush(`That doesn't seem to work.`);
    } else {
      this.sayGuybrush(`I can't ${verb.toLowerCase()} that.`);
    }
  }

  openSysadminDialogue() {
    this.inDialogue = true;
    const el = this.win.element;
    const dlgEl = el.querySelector('#scumm-dialogue-overlay');
    dlgEl.classList.add('active');

    const options = [
      { text: '1. "I need the Admin Floppy Disk to reboot the server!"', action: 'get_disk' },
      { text: '2. "I am Guybrush Bytepwood, a mighty pirate-programmer!"', action: 'pirate' },
      { text: '3. "Have you heard about the Y2K bug?"', action: 'y2k' },
      { text: '4. "Nevermind, go back to sleep."', action: 'leave' }
    ];

    dlgEl.innerHTML = options.map((opt, i) => `
      <div class="scumm-dialogue-choice" data-idx="${i}">${opt.text}</div>
    `).join('');

    dlgEl.querySelectorAll('.scumm-dialogue-choice').forEach(choice => {
      choice.addEventListener('click', (e) => {
        e.stopPropagation();
        const opt = options[choice.dataset.idx];
        dlgEl.classList.remove('active');
        this.inDialogue = false;
        this.handleDialogueChoice(opt.action);
      });
    });
  }

  handleDialogueChoice(action) {
    if (action === 'get_disk') {
      this.sayGuybrush('I need the Admin Floppy Disk to reboot the server!');
      setTimeout(() => {
        this.sayNpc('Arrgh, fine! Take it. It has the root password: "password123".');
        this.state.hasAdminDisk = true;
        this.inventory.push({ id: 'admin_disk', name: 'Admin Floppy Disk', desc: 'A 3.5" HD floppy labeled "ADMIN KEYS - DO NOT FORMAT".' });
        this.renderInventory();
        if (window.soundSys) window.soundSys.playItemPickup();
      }, 2000);
    } else if (action === 'pirate') {
      this.sayGuybrush('I am Guybrush Bytepwood, a mighty pirate-programmer!');
      setTimeout(() => {
        this.sayNpc('How appropriate, you code like a cow!');
      }, 2000);
    } else if (action === 'y2k') {
      this.sayGuybrush('Have you heard about the Y2K bug? The year 2000 is coming!');
      setTimeout(() => {
        this.sayNpc('Bah! Nonsense. Nothing could possibly go wrong with two-digit years.');
      }, 2000);
    } else {
      this.sayGuybrush('Nevermind, carry on.');
    }
  }

  changeRoom(newRoom, spawnX, spawnY) {
    this.cancelPendingAction();
    this.currentRoom = newRoom;
    this.guybrush.x = spawnX;
    this.guybrush.y = spawnY;
    this.guybrush.targetX = spawnX;
    this.guybrush.targetY = spawnY;
    this.guybrush.isWalking = false;
    this.guybrush.walkFrame = 0;
    this.showRoomTitle();
    if (window.soundSys) window.soundSys.playDoor();
  }

  showRoomTitle() {
    const titles = {
      lab: '1998 Mainframe Lab',
      basement: 'Sub-Level Archive & Power Grid',
      rooftop: 'Rooftop Dial-up Satellite Station'
    };
    const titleEl = this.win.element.querySelector('#scumm-room-title');
    titleEl.textContent = titles[this.currentRoom] || 'Castle Redmond';
    titleEl.classList.add('visible');
    setTimeout(() => titleEl.classList.remove('visible'), 2400);
  }

  sayGuybrush(text) {
    this.showSubtitle(text, 'guybrush', this.guybrush.x, this.guybrush.y - 45);
  }

  sayNpc(text) {
    let x = 120, y = 30;
    if (this.currentRoom === 'lab') { x = 115; y = 45; }
    if (this.currentRoom === 'rooftop') { x = 195; y = 50; }
    this.showSubtitle(text, 'npc', x, y);
  }

  showSubtitle(text, speaker, x, y) {
    const overlay = this.win.element.querySelector('#scumm-subtitles');
    overlay.innerHTML = '';

    const bubble = document.createElement('div');
    bubble.className = `scumm-speech-bubble scumm-speech-${speaker}`;
    bubble.textContent = text;

    // Relative to canvas display scale
    const rect = this.canvas.getBoundingClientRect();
    const pctX = (x / this.width) * 100;
    const pctY = (y / this.height) * 100;

    bubble.style.left = `${pctX}%`;
    bubble.style.top = `${pctY}%`;

    overlay.appendChild(bubble);

    if (window.soundSys) {
      window.soundSys.playTalkBlip(speaker === 'guybrush' ? 340 : 220);
    }

    const readTime = Math.max(2200, text.length * 65);
    clearTimeout(this.subtitleTimer);
    this.subtitleTimer = setTimeout(() => {
      bubble.remove();
    }, readTime);
  }

  triggerVictory() {
    this.state.serverBooted = true;
    if (window.soundSys) {
      window.soundSys.playDing();
      window.soundSys.playStartup();
    }

    this.sayGuybrush('DIAL-UP CONNECTION ESTABLISHED!\nWin 98 Server is ONLINE!\nI am the Master of Cyberspace!');

    setTimeout(() => {
      window.winManager.openDialog({
        title: 'You Won! - Quest Completed',
        icon: 'lucas-quest',
        message: `<b>CONGRATULATIONS!</b><br><br>
          Guybrush Bytepwood saved the 1998 network from the Y2K disaster and escaped Castle Redmond!<br><br>
          <i>Thank you for playing this LucasArts SCUMM tribute!</i>`
      });
    }, 3500);
  }

  startGameLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      if (!this.win || this.win.isMinimized) {
        this.animId = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      this.update(dt);
      this.render();

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  update(dt) {
    const g = this.guybrush;
    const dx = g.targetX - g.x;
    const dy = g.targetY - g.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      g.isWalking = true;
      const move = g.speed * dt;
      if (move >= dist) {
        g.x = g.targetX;
        g.y = g.targetY;
        g.isWalking = false;
        g.walkFrame = 0;
        if (this.pendingAction) {
          this.executePendingAction();
        }
      } else {
        g.x += (dx / dist) * move;
        g.y += (dy / dist) * move;
        g.direction = dx > 0 ? 'right' : 'left';

        g.animTimer += dt;
        if (g.animTimer > 0.12) {
          g.animTimer = 0;
          g.walkFrame = (g.walkFrame + 1) % 4;
        }
      }
    } else {
      g.isWalking = false;
      g.walkFrame = 0;
      if (this.pendingAction) {
        this.executePendingAction();
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw Room Background
    if (this.currentRoom === 'lab') {
      this.drawLabBackground(ctx);
    } else if (this.currentRoom === 'basement') {
      this.drawBasementBackground(ctx);
    } else if (this.currentRoom === 'rooftop') {
      this.drawRooftopBackground(ctx);
    }

    // Draw Guybrush Bytepwood
    this.drawGuybrush(ctx);
  }

  drawLabBackground(ctx) {
    // Walls (deep purple/blue vintage SCUMM palette)
    ctx.fillStyle = '#201838';
    ctx.fillRect(0, 0, 320, 95);

    // Stone / Wood Floor
    ctx.fillStyle = '#5c4838';
    ctx.fillRect(0, 95, 320, 45);
    ctx.fillStyle = '#403020';
    for (let x = 0; x < 320; x += 40) {
      ctx.fillRect(x, 95, 2, 45);
    }

    // Poster on wall
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(60, 20, 25, 35);
    ctx.fillStyle = '#0000aa';
    ctx.fillRect(62, 22, 21, 15);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(64, 40, 17, 3);

    // Basement Door
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(10, 40, 30, 75);
    ctx.fillStyle = '#000000';
    ctx.strokeRect(10, 40, 30, 75);
    ctx.fillStyle = '#ffcc00'; // Brass handle
    ctx.fillRect(14, 78, 3, 5);

    // Mainframe Server Rack
    ctx.fillStyle = '#101018';
    ctx.fillRect(190, 28, 45, 92);
    ctx.fillStyle = '#303040';
    ctx.strokeRect(190, 28, 45, 92);
    // LED blinkers
    const blink = Math.floor(Date.now() / 300) % 2 === 0;
    ctx.fillStyle = blink ? '#00ff00' : '#006600';
    ctx.fillRect(196, 38, 5, 5);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(205, 38, 5, 5);
    ctx.fillStyle = blink ? '#ffcc00' : '#665500';
    ctx.fillRect(214, 38, 5, 5);
    // 3.5" Disk slot
    ctx.fillStyle = '#000';
    ctx.fillRect(198, 52, 28, 3);

    // Office Desk & Sleeping Sysadmin
    ctx.fillStyle = '#6b4c35';
    ctx.fillRect(100, 75, 75, 40);

    // CRT Monitor on desk
    ctx.fillStyle = '#dcd8c8';
    ctx.fillRect(145, 50, 24, 25);
    ctx.fillStyle = '#008080'; // Win98 desktop on screen
    ctx.fillRect(148, 53, 18, 16);

    // Coffee Maker
    ctx.fillStyle = '#222';
    ctx.fillRect(260, 65, 25, 30);
    ctx.fillStyle = '#cc8800'; // Glass pot
    ctx.fillRect(263, 76, 16, 16);

    // Desk Mug (if not collected)
    if (!this.state.hasCoffee) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(145, 78, 8, 8);
      ctx.fillStyle = '#0000aa';
      ctx.fillRect(147, 80, 4, 4);
    }

    // Sleeping Sysadmin Pirate (Captain Bob)
    ctx.fillStyle = '#8b0000'; // Red pirate coat
    ctx.fillRect(105, 60, 22, 28);
    ctx.fillStyle = '#ffcc99'; // Head
    ctx.fillRect(108, 48, 16, 14);
    ctx.fillStyle = '#000000'; // Pirate tricorn hat
    ctx.fillRect(104, 44, 24, 6);
    ctx.fillStyle = '#ffffff'; // Beard
    ctx.fillRect(110, 58, 12, 8);
    // Snore Zzz
    if (!this.state.sysadminAwake) {
      ctx.fillStyle = '#ffff55';
      ctx.font = '10px monospace';
      ctx.fillText('Zzz...', 125, 45);
    }
  }

  drawBasementBackground(ctx) {
    // Dark stone dungeon walls
    ctx.fillStyle = '#14141c';
    ctx.fillRect(0, 0, 320, 95);
    ctx.fillStyle = '#2c2830';
    ctx.fillRect(0, 95, 320, 45);

    // Broken Fusebox
    ctx.fillStyle = '#404448';
    ctx.fillRect(45, 40, 30, 40);
    ctx.fillStyle = '#000000';
    ctx.strokeRect(45, 40, 30, 40);
    if (this.state.fuseFixed) {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(57, 56, 6, 8);
    } else {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(57, 56, 6, 8);
      // Spark
      if (Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(59, 66, 3, 3);
      }
    }

    // Magnetic Tape Racks
    ctx.fillStyle = '#202028';
    ctx.fillRect(180, 35, 55, 80);
    // Tape reels spinning
    const rot = (Date.now() / 200) % Math.PI;
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.arc(195, 55, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(220, 55, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wire Spool (if not collected)
    if (!this.state.hasWire) {
      ctx.fillStyle = '#b87333'; // Copper color
      ctx.fillRect(120, 105, 16, 12);
      ctx.fillStyle = '#444';
      ctx.fillRect(124, 103, 8, 16);
    }

    // Ladder to Roof
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(280, 20, 4, 100);
    ctx.fillRect(296, 20, 4, 100);
    for (let y = 30; y < 120; y += 12) {
      ctx.fillRect(280, y, 20, 3);
    }
  }

  drawRooftopBackground(ctx) {
    // Sunset sky gradient (orange to purple 90s aesthetic)
    const sky = ctx.createLinearGradient(0, 0, 0, 95);
    sky.addColorStop(0, '#301848');
    sky.addColorStop(0.5, '#903858');
    sky.addColorStop(1, '#ff8040');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 320, 95);

    // City skyline silhouettes
    ctx.fillStyle = '#181028';
    ctx.fillRect(220, 35, 20, 60);
    ctx.fillRect(245, 20, 25, 75);
    ctx.fillRect(275, 45, 18, 50);
    ctx.fillRect(295, 30, 22, 65);

    // Rooftop concrete floor
    ctx.fillStyle = '#48444c';
    ctx.fillRect(0, 95, 320, 45);

    // Giant 56K Satellite Dish
    ctx.fillStyle = '#d0d4dc';
    ctx.beginPath();
    ctx.arc(110, 65, 35, 0.8 * Math.PI, 1.8 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#80848c';
    ctx.stroke();
    // Dish stand
    ctx.fillStyle = '#333340';
    ctx.fillRect(106, 65, 8, 45);

    // Cyber-Pigeon holding Boot CD (if not collected)
    if (!this.state.hasPigeonCD) {
      ctx.fillStyle = '#808090'; // Pigeon body
      ctx.fillRect(182, 72, 14, 10);
      ctx.fillStyle = '#ff8800'; // Beak
      ctx.fillRect(196, 75, 4, 3);
      // Win 98 Boot CD
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(190, 84, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Roof Hatch
    ctx.fillStyle = '#222';
    ctx.fillRect(15, 90, 30, 20);
    ctx.fillStyle = '#444';
    ctx.fillRect(17, 92, 26, 16);
  }

  drawGuybrush(ctx) {
    const g = this.guybrush;
    const x = Math.floor(g.x);
    const y = Math.floor(g.y);
    const dir = g.direction === 'right' ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);

    // Legs animation
    ctx.fillStyle = '#223366'; // Blue trousers
    if (g.isWalking) {
      const legOffset = (g.walkFrame % 2 === 0) ? 3 : -3;
      ctx.fillRect(-5 + legOffset, -14, 4, 14);
      ctx.fillRect(2 - legOffset, -14, 4, 14);
    } else {
      ctx.fillRect(-5, -14, 4, 14);
      ctx.fillRect(2, -14, 4, 14);
    }

    // Leather Boots
    ctx.fillStyle = '#1a1005';
    ctx.fillRect(-6, -2, 5, 2);
    ctx.fillRect(2, -2, 5, 2);

    // White Pirate Shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -30, 13, 16);

    // Brown Leather Vest
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(-7, -29, 3, 14);
    ctx.fillRect(5, -29, 3, 14);

    // Head / Face
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(-5, -42, 11, 12);

    // Blonde Ponytail & Hair
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-6, -44, 13, 4);
    ctx.fillRect(-8, -42, 3, 10); // Ponytail behind

    // Blue Eyes & Smirk
    ctx.fillStyle = '#0000aa';
    ctx.fillRect(1, -38, 2, 2);

    ctx.restore();
  }
}

window.appScummQuest = new AppScummQuest();
