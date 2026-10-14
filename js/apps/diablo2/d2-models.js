(function (D) {
  'use strict';
  const { BASES } = D;
  const TAU = Math.PI * 2;

  const CLASS_LOOK = {
    amazon: { h: 1.8, build: 0.95, skin: '#d8a882', hair: '#c8983c', ponytail: true, torso: '#9a4a2c', legs: '#d8a882', skirt: '#7a3222', boots: '#5a3a20', arms: '#d8a882', bracers: '#6a4a2a', belt: '#5a3a1a', combat: true },
    assassin: { h: 1.74, build: 0.9, skin: '#c89878', hair: '#241414', hairBack: '#241414', torso: '#3a2838', legs: '#2c2230', arms: '#3a2838', boots: '#1a1418', belt: '#6a5040', bracers: '#5a4a50', combat: true },
    necromancer: { h: 1.84, build: 0.9, skin: '#dcd4cc', hair: '#e8e8f0', robe: '#26262e', robeTrim: '#8a8a9a', torso: '#34343e', sleeves: '#34343e', arms: '#34343e', pads: '#d8d0b8', boots: '#1a1a20', staffy: true },
    barbarian: { h: 1.95, build: 1.3, skin: '#c8906a', hair: '#3a2418', hairBack: '#3a2418', torso: '#c8906a', legs: '#c8906a', skirt: '#6a4a2a', hips: '#5a3e22', furLegs: '#7a5a38', boots: '#4a3020', belt: '#5a3a20', bracers: '#5a3a20', pads: '#6a5038', combat: true },
    paladin: { h: 1.88, build: 1.15, skin: '#c89878', hair: '#6a4a2a', torso: '#a8a8b2', plate: true, pads: '#c0c0cc', legs: '#7a7a84', greaves: '#a0a0aa', arms: '#8a8a94', sleeves: '#8a8a94', cape: '#6a1818', boots: '#5a5a62', gloves: '#9a9aa4', combat: true },
    sorceress: { h: 1.78, build: 0.88, skin: '#e0b898', hair: '#1a1210', hairBack: '#1a1210', robe: '#2a6a3a', robeTrim: '#d0b040', torso: '#2a6a3a', arms: '#e0b898', sleeves: '#2a6a3a', belt: '#d0b040', boots: '#3a2a1a', staffy: true },
    druid: { h: 1.88, build: 1.12, skin: '#c89878', hair: '#6a4a2a', beard: '#6a4a2a', torso: '#6a5a3a', legs: '#5a4a30', arms: '#c89878', bracers: '#4a3a24', helm: { type: 'leaves' }, cape: '#4a3a24', boots: '#3a2a1a', belt: '#4a3a24', staffy: true }
  };

  const WEAPON_LOOK = {
    sword: { type: 'sword', len: 0.85, col: '#c8ccd4' }, axe: { type: 'axe', len: 0.7, col: '#b0b4bc' }, mace: { type: 'mace', len: 0.62, col: '#8a8a90' },
    club: { type: 'club', len: 0.65, col: '#6a4a2a' }, hammer: { type: 'hammer', len: 0.75, col: '#8a8a90' }, scepter: { type: 'scepter', len: 0.6, col: '#c0a050' },
    dagger: { type: 'sword', len: 0.38, col: '#d0d4dc', wide: 0.8 }, spear: { type: 'spear', len: 1.5, col: '#c0c4cc', grip: 0.55 }, polearm: { type: 'polearm', len: 1.5, col: '#b0b4bc', grip: 0.6 },
    staff: { type: 'staff', len: 1.2, grip: 0.5, orb: null }, wand: { type: 'wand', len: 0.36 }, claw: { type: 'claw', col: '#d0d4dc' }, orb: { type: 'orb', orb: '#80a0ff' },
    javelin: { type: 'javelin', len: 1.05, col: '#c0c4cc', grip: 0.35 }, bow: { type: 'bow', len: 1.1 }, xbow: { type: 'xbow', len: 0.8 }
  };

  const HELM_LOOK = {
    cap: { type: 'cap', col: '#6a5a44' }, skull_cap: { type: 'cap', col: '#7a7a82' }, helm: { type: 'helm', col: '#8a8a92' }, full_helm: { type: 'full', col: '#9a9aa2' },
    mask: { type: 'mask', col: '#8a6a4a' }, bone_helm: { type: 'bone', col: '#d8d0b8' }, great_helm: { type: 'great', col: '#a0a0a8' }, crown: { type: 'crown' },
    war_hat: { type: 'cap', col: '#5a5a62' }, sallet: { type: 'full', col: '#8a8a98' }, casque: { type: 'full', col: '#9a9aaa' }, death_mask: { type: 'mask', col: '#c8c0a8' },
    winged_helm: { type: 'helm', col: '#b0b0b8', wings: true }, grand_crown: { type: 'crown' }, shako: { type: 'cap', col: '#4a4a52' }, armet: { type: 'great', col: '#b8b8c0' },
    spired_helm: { type: 'great', col: '#909098', horns: true }, circlet: { type: 'circlet' }, coronet: { type: 'circlet', gem: '#40a0ff' }, tiara: { type: 'circlet', gem: '#40ff80' }
  };

  function armorLook(it) {
    const b = BASES[it.base];
    const def = b.def[1];
    const special = it.q === 'unique' || it.q === 'set' || it.q === 'runeword';
    const gold = special ? 0.35 : 0;
    if (def < 26) return { torso: D.mix('#7a5a38', '#a08040', gold), plate: false };
    if (def < 90) return { torso: D.mix('#80828a', '#9a8a60', gold), plate: true, sleeves: '#6a6a72' };
    return { torso: D.mix('#b0b0ba', '#c8b070', gold), plate: true, pads: D.mix('#c8c8d0', '#d8c080', gold), sleeves: '#9a9aa4', greaves: '#a8a8b2' };
  }

  function shieldLook(it) {
    const b = BASES[it.base];
    const special = it.q === 'unique' || it.q === 'set';
    const id = b.id;
    let type = 'round', col = '#7a5a3a', rim = '#a09070', size = 1;
    if (id === 'buckler' || id === 'heater') { type = 'buckler'; size = 0.85; }
    if (/kite|dragon|scutum|heater|monarch/.test(id)) { type = 'kite'; col = '#6a2020'; rim = '#c0b080'; }
    if (/tower|pavise|gothic|aegis|ancient/.test(id)) { type = 'tower'; col = '#4a4a6a'; rim = '#b0b0c0'; size = 1.1; }
    if (/bone/.test(id)) { col = '#d8d0b8'; rim = '#a09880'; }
    if (/spiked/.test(id)) { col = '#5a5a60'; rim = '#c0c0c8'; }
    if (special) rim = '#e0c060';
    return { type, col, rim, size, boss: type !== 'tower', cross: type === 'tower' ? '#c0a040' : null };
  }

  function weaponLook(it) {
    const b = BASES[it.base];
    if (!b) return null;
    if (b.id === 'q_malus') return { type: 'malus', len: 0.6 };
    if (b.type === 'questweapon') return { type: 'club', len: 0.6 };
    const w = Object.assign({}, WEAPON_LOOK[b.type] || WEAPON_LOOK.sword);
    if (b.hands === 2 && (b.type === 'sword' || b.type === 'axe')) { w.len = 1.25; w.wide = 1.3; w.grip = 0.3; }
    if (b.type === 'hammer' && b.hands === 2) w.len = 1.2;
    if (b.tier >= 1) w.col = D.shade(w.col || '#c0c0c8', -0.1);
    if (b.tier >= 2) w.col = '#9aa0c8';
    if (it.q === 'unique' || it.q === 'set' || it.q === 'runeword') w.col = '#d8c080';
    if (b.type === 'staff') w.orb = it.q === 'magic' ? '#6080ff' : it.q === 'unique' || it.q === 'rare' ? '#ffc040' : null;
    if (b.type === 'orb') w.orb = it.q === 'unique' ? '#ffb040' : it.q === 'magic' ? '#6080ff' : '#a0d0ff';
    return w;
  }

  function wclassFor(it) {
    if (!it) return 'hand';
    return D.weaponClass(BASES[it.base]);
  }

  const MON_LOOK = {
    zombie: t => ({ h: 1.76, zombie: true, skin: t, torso: '#4a4030', legs: '#3e3628', arms: t, boots: '#2a2418', eyes: '#ff5020', hair: '#2a2a1a', lean: 0.1 }),
    fallen: t => ({ h: 1.0, build: 0.95, headR: 1.45, skin: t, horns: '#e0d0b0', hunch: true, torso: t, legs: t, arms: t, boots: D.shade(t, -0.3), eyes: '#ffe040', weapon: { type: 'sword', len: 0.5, col: '#a0a0a8' }, combat: true }),
    shaman: t => ({ h: 1.05, build: 0.95, headR: 1.45, skin: t, horns: '#e0d0b0', hunch: true, robe: '#4a3020', robeLen: 'short', torso: '#4a3020', legs: t, arms: t, boots: D.shade(t, -0.3), eyes: '#ffe040', weapon: { type: 'staff', len: 1.0, grip: 0.3, orb: '#ff6020' }, staffy: true }),
    quillrat: t => ({ rig: 'quad', h: 0.55, len: 0.75, legH: 0.32, w: 0.14, fur: t, quills: '#e0d8c0', bodyR: 6, bodyR2: 6.5, headR: 0.9, eyes: '#ff3020', ears: true }),
    rogue_dark: t => ({ h: 1.78, skin: '#c8b0b8', hair: '#1a1018', ponytail: true, torso: t, legs: D.shade(t, -0.2), arms: '#c8b0b8', sleeves: t, boots: '#1a1418', cape: D.shade(t, -0.35), eyes: '#ff3040', combat: true }),
    beast: t => ({ h: 2.5, build: 1.6, hunch: true, skin: t, torso: t, legs: t, arms: t, furLegs: D.shade(t, -0.15), boots: D.shade(t, -0.3), headR: 1.25, eyes: '#ff3020', horns: '#d8c8a0', combat: true }),
    skeleton: t => ({ h: 1.8, build: 0.8, thick: 0.62, skull: true, skin: t, torso: D.shade(t, -0.15), legs: t, arms: t, boots: t, eyes: '#ff3020', combat: true }),
    skelmage: t => ({ h: 1.8, build: 0.8, thick: 0.62, skull: true, skin: t, robe: '#3a2a4a', robeTrim: '#8060a0', torso: '#3a2a4a', arms: t, eyes: '#40ff80', staffy: true }),
    ghost: t => ({ h: 1.85, ghost: true, robe: t, torso: t, arms: D.shade(t, -0.2), sleeves: t, hood: D.shade(t, -0.35), eyes: '#a0ffff', skin: D.shade(t, 0.3) }),
    goatman: t => ({ h: 1.9, build: 1.12, skin: t, head: t, snout: true, horns: '#e0d0b0', hornsBig: true, torso: t, legs: t, furLegs: D.shade(t, -0.2), arms: t, boots: '#2a2018', belt: '#4a3020', eyes: '#ff6020', combat: true }),
    bat: t => ({ rig: 'bird', h: 0.9, fur: t, alt: 1.5, eyes: '#ff3020' }),
    yeti: t => ({ h: 2.35, build: 1.6, hunch: true, skin: t, torso: t, legs: t, arms: t, furLegs: D.shade(t, -0.1), boots: D.shade(t, -0.25), headR: 1.2, eyes: '#40a0ff', combat: true }),
    tainted: t => ({ h: 1.72, build: 0.9, skin: t, torso: D.shade(t, -0.2), legs: t, arms: t, wings: D.shade(t, -0.35), horns: '#1a1a1a', eyes: '#ffff40', hair: '#1a1018', staffy: true }),
    blood_raven: () => ({ h: 1.8, skin: '#e0d0d0', hair: '#b01818', ponytail: true, torso: '#5a1418', legs: '#3a1014', arms: '#e0d0d0', sleeves: '#5a1418', boots: '#1a0a0a', cape: '#2a0808', eyes: '#ff2020', combat: true, weapon: { type: 'bow', len: 1.1 } }),
    griswold: () => ({ h: 2.05, build: 1.45, zombie: true, skin: '#6a7a6a', torso: '#4a3a2a', legs: '#3a3024', arms: '#6a7a6a', boots: '#2a2418', eyes: '#ff4020', weapon: { type: 'hammer', len: 0.85, col: '#8a8a90' } }),
    countess: () => ({ h: 1.82, skin: '#e8c8c8', hair: '#2a0a0a', hairBack: '#2a0a0a', robe: '#8a1020', robeTrim: '#d0a040', torso: '#8a1020', sleeves: '#8a1020', arms: '#e8c8c8', helm: { type: 'crown', gem: '#ff2040' }, eyes: '#ff2020', staffy: true }),
    smith: () => ({ h: 2.6, build: 1.85, belly: true, skin: '#8a5a4a', torso: '#3a2a1a', legs: '#3a2a1a', arms: '#8a5a4a', boots: '#1a1410', horns: '#d8c8a0', eyes: '#ffa020', weapon: { type: 'hammer', len: 1.1, col: '#6a6a70' }, combat: true }),
    andariel: () => ({ h: 2.45, build: 1.1, skin: '#b02848', torso: '#5a1030', legs: '#5a1030', arms: '#b02848', skirt: '#6a1030', spikes: '#e0c8a0', hair: '#e8a0c0', hairBack: '#e8a0c0', eyes: '#ffe040', claws2: true, boots: '#3a0818', combat: true, wclass: 'claw' }),
    golem_clay: t => ({ h: 2.0, build: 1.8, thick: 1.35, skin: t, torso: t, legs: t, arms: t, boots: t, headR: 0.8, eyes: '#ffd060', hunch: true }),
    golem_blood: t => ({ h: 2.0, build: 1.7, thick: 1.3, skin: t, torso: D.shade(t, -0.2), legs: t, arms: t, boots: t, headR: 0.8, eyes: '#ffff80', hunch: true }),
    golem_fire: t => ({ h: 2.2, build: 1.8, thick: 1.35, skin: t, torso: D.shade(t, -0.3), legs: D.shade(t, -0.2), arms: t, boots: '#3a1a0a', headR: 0.85, eyes: '#ffffc0', hunch: true, horns: '#3a1a0a' }),
    valkyrie: () => ({ h: 1.95, build: 1.0, skin: '#e8d8d0', hair: '#e8d898', torso: '#c8d0f0', plate: true, pads: '#e0e8ff', legs: '#b0b8d8', greaves: '#c8d0f0', arms: '#b0b8d8', boots: '#9098b8', helm: { type: 'helm', col: '#d0d8f8', wings: true }, weapon: { type: 'spear', len: 1.5, col: '#e0e8ff', grip: 0.55 }, shield: { type: 'kite', col: '#8090c0', rim: '#e0e8ff' }, combat: true, wclass: 'pole' }),
    wolf: t => ({ rig: 'quad', h: 0.78, len: 1.0, legH: 0.45, w: 0.15, fur: t, bodyR: 5.8, bodyR2: 6.4, headR: 0.95, eyes: '#ffe040', ears: true }),
    bear: t => ({ rig: 'quad', h: 1.25, len: 1.25, legH: 0.55, w: 0.22, fur: t, bodyR: 9, bodyR2: 10, headR: 1.2, legT: 1.6, eyes: '#201010', ears: true, tailC: null, scale: 1.3 }),
    raven: t => ({ rig: 'bird', h: 0.75, fur: t, beak: '#606060', alt: 1.6, eyes: '#ffd040' }),
    rogue: t => ({ h: 1.76, skin: '#e0b090', hair: '#6a3a1a', ponytail: true, torso: t || '#4a5a2a', legs: '#3a3a2a', arms: '#e0b090', sleeves: t || '#4a5a2a', boots: '#2a2018', cape: '#3a4a2a', belt: '#5a3a1a', weapon: { type: 'bow', len: 1.1 }, combat: true, wclass: 'bow' }),
    akara: () => ({ h: 1.72, skin: '#d8b098', robe: '#5a2a6a', robeTrim: '#c0a040', torso: '#5a2a6a', sleeves: '#5a2a6a', arms: '#d8b098', hood: '#4a1a5a', eyes: '#302020', staffy: true }),
    charsi: () => ({ h: 1.78, build: 1.1, skin: '#d8a882', hair: '#e0c070', torso: '#6a4a2a', legs: '#4a3a2a', arms: '#d8a882', boots: '#3a2a1a', belt: '#3a2a1a', weapon: { type: 'hammer', len: 0.6, col: '#7a7a80' } }),
    gheed: () => ({ h: 1.72, build: 1.35, belly: true, skin: '#d8a882', hair: '#3a2a1a', beard: '#3a2a1a', torso: '#4a6a3a', legs: '#5a4a2a', arms: '#4a6a3a', boots: '#3a2a1a', belt: '#8a6a2a', helm: { type: 'cap', col: '#6a2a2a' } }),
    kashya: () => ({ h: 1.8, skin: '#e0b090', hair: '#b83a1a', hairBack: '#b83a1a', torso: '#5a4a2a', legs: '#4a3a2a', arms: '#e0b090', sleeves: '#5a4a2a', cape: '#3a5a2a', boots: '#2a2018', belt: '#3a2a1a', pads: '#6a5a3a', combat: true, weapon: { type: 'bow', len: 1.1 }, wclass: 'bow' }),
    warriv: () => ({ h: 1.82, skin: '#b8805a', robe: '#8a5a2a', robeTrim: '#d0a040', torso: '#8a5a2a', sleeves: '#8a5a2a', arms: '#b8805a', helm: { type: 'turban', col: '#d8c8a0' }, beard: '#2a1a10', boots: '#3a2a1a' }),
    cain: () => ({ h: 1.74, skin: '#e0c0a0', hair: '#e8e8e8', beard: '#e8e8e8', robe: '#7a5a3a', robeTrim: '#c0a060', torso: '#7a5a3a', sleeves: '#7a5a3a', arms: '#e0c0a0', boots: '#3a2a1a', weapon: { type: 'staff', len: 1.2, grip: 0.5 }, staffy: true, lean: 0.1 })
  };

  const DRAWN = {
    spirit: t => ({
      rig: 'draw', h: 1, draw: (c, anim, p, dir, s, ox, oy) => {
        const y = oy - 42 + Math.sin(p * TAU) * 3;
        const g = c.createRadialGradient(ox, y, 1, ox, y, 18);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, t); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(ox, y, 18, 0, TAU); c.fill();
        for (let i = 0; i < 5; i++) { const a = p * TAU + i / 5 * TAU; c.fillStyle = t; c.globalAlpha = 0.6; c.beginPath(); c.arc(ox + Math.cos(a) * 10, y + Math.sin(a) * 5 + 8, 2, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
      }
    }),
    sentry: t => ({
      rig: 'draw', h: 1, draw: (c, anim, p, dir, s, ox, oy) => {
        c.strokeStyle = '#4a4a50'; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; c.beginPath(); c.moveTo(ox, oy - 16); c.lineTo(ox + Math.cos(a) * 9, oy + Math.sin(a) * 4); c.stroke(); }
        D.Sprites.ball(c, { x: ox, y: oy - 18 }, 5, '#6a6a74');
        const g = c.createRadialGradient(ox, oy - 22, 0, ox, oy - 22, 7);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, t); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(ox, oy - 22, 7 + Math.sin(p * TAU) * 1.5, 0, TAU); c.fill();
      }
    }),
    volcano: () => ({
      rig: 'draw', h: 1, scale: 1.2, draw: (c, anim, p, dir, s, ox, oy) => {
        c.fillStyle = '#3a2a22'; c.beginPath(); c.moveTo(ox - 34, oy + 6); c.lineTo(ox - 10, oy - 26); c.lineTo(ox + 10, oy - 26); c.lineTo(ox + 34, oy + 6); c.quadraticCurveTo(ox, oy + 18, ox - 34, oy + 6); c.fill();
        const g = c.createLinearGradient(ox, oy - 30, ox, oy);
        g.addColorStop(0, '#ffd040'); g.addColorStop(1, 'rgba(255,60,0,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(ox - 10, oy - 26); c.lineTo(ox - 4, oy - 4); c.lineTo(ox + 6, oy - 6); c.lineTo(ox + 10, oy - 26); c.fill();
        c.fillStyle = '#ff8020'; c.beginPath(); c.ellipse(ox, oy - 26, 10, 3, 0, 0, TAU); c.fill();
        for (let i = 0; i < 4; i++) { const a = p * TAU + i; c.fillStyle = 'rgba(255,' + (100 + i * 30) + ',0,0.8)'; c.beginPath(); c.arc(ox + Math.sin(a) * 6, oy - 30 - ((p * 40 + i * 10) % 30), 2.2, 0, TAU); c.fill(); }
      }
    })
  };

  const FORMS = {
    werewolf: () => ({ h: 1.9, build: 1.05, hunch: true, skin: '#7a7a82', head: '#7a7a82', snout: true, horns: null, torso: '#6a6a72', legs: '#6a6a72', arms: '#7a7a82', furLegs: '#5a5a62', boots: '#3a3a40', eyes: '#ffd040', claws2: true, combat: true, wclass: 'claw', tail: '#6a6a72' }),
    werebear: () => ({ h: 2.2, build: 1.7, hunch: true, skin: '#6a4a2a', head: '#6a4a2a', snout: true, torso: '#5a3a20', legs: '#5a3a20', arms: '#6a4a2a', furLegs: '#4a3018', boots: '#2a1a10', eyes: '#201010', claws2: true, headR: 1.2, combat: true, wclass: 'claw' })
  };

  const mcache = new Map();

  function finalize(key, m) {
    m.key = key;
    if (!m.rig) m.rig = 'biped';
    if (!m.scale) m.scale = Math.max(1, (m.h || 1.8) / 1.8);
    return m;
  }

  function heroModel(h) {
    const ch = h.char;
    if (h.form) {
      const key = 'form:' + h.form;
      if (!mcache.has(key)) mcache.set(key, finalize(key, FORMS[h.form === 'wolf' ? 'werewolf' : 'werebear']()));
      return mcache.get(key);
    }
    const hands = D.activeHands(ch);
    const eq = ch.equip;
    const parts = [ch.cls, eq.body ? eq.body.base + eq.body.q : '-', eq.head ? eq.head.base : '-', hands.rh ? hands.rh.base + hands.rh.q : '-', hands.lh ? hands.lh.base + hands.lh.q : '-'];
    const key = 'hero:' + parts.join(':');
    let m = mcache.get(key);
    if (m) return m;
    m = Object.assign({}, CLASS_LOOK[ch.cls]);
    if (eq.body) Object.assign(m, armorLook(eq.body));
    if (eq.body && ch.cls === 'sorceress') { m.robe = null; m.skirt = D.shade(m.torso, -0.2); }
    if (eq.body && ch.cls === 'necromancer') { m.robe = D.shade(m.torso, -0.3); }
    if (eq.head && HELM_LOOK[eq.head.base]) m.helm = HELM_LOOK[eq.head.base];
    else if (eq.head) m.helm = { type: 'helm', col: '#8a8a92' };
    if (m.helm && m.helm.type !== 'leaves' && (m.helm.type === 'great' || m.helm.type === 'full')) { m.hair = null; m.hairBack = null; }
    const rh = hands.rh, lh = hands.lh;
    m.weapon = rh ? weaponLook(rh) : null;
    m.wclass = wclassFor(rh);
    if (lh) {
      const lb = BASES[lh.base];
      if (lb.type === 'shield') m.shield = shieldLook(lh);
      else if (lb.cat === 'weapon') m.offWeapon = weaponLook(lh);
    }
    if (m.weapon && (m.weapon.type === 'bow' || m.weapon.type === 'xbow')) m.wclass = m.weapon.type;
    mcache.set(key, finalize(key, m));
    return mcache.get(key);
  }

  function entModel(e) {
    if (e.kind === 'hero') return heroModel(e);
    const id = e.model;
    const tint = e.tint || '#808080';
    const wkey = e.kind === 'mon' && e.mon ? (e.mon.weapon || '') + (e.mon.shield ? 's' : '') : '';
    const key = id + ':' + tint + ':' + wkey + (e.shadowy ? ':sh' : '');
    let m = mcache.get(key);
    if (m) return m;
    if (DRAWN[id]) m = DRAWN[id](tint);
    else if (MON_LOOK[id]) m = MON_LOOK[id](tint);
    else if (CLASS_LOOK[id]) m = Object.assign({}, CLASS_LOOK[id]);
    else m = MON_LOOK.zombie(tint);
    if (e.kind === 'mon' && e.mon) {
      if (e.mon.weapon && !m.weapon) m.weapon = Object.assign({}, WEAPON_LOOK[e.mon.weapon]);
      if (e.mon.weapon) m.wclass = D.weaponClass({ type: e.mon.weapon, hands: e.mon.weapon === 'spear' || e.mon.weapon === 'bow' ? 2 : 1 });
      if (e.mon.shield) m.shield = { type: 'round', col: '#6a5a4a', rim: '#9a8a6a', size: 0.9, boss: true };
      if (e.mon.ai === 'ranged' && e.mon.weapon === 'bow') m.wclass = 'bow';
    }
    if (id === 'skeleton' && e.kind === 'pet') { m.weapon = Object.assign({}, WEAPON_LOOK.sword); m.shield = { type: 'round', col: '#6a5a4a', rim: '#9a8a6a', size: 0.9, boss: true }; }
    if (e.shadowy) { m = Object.assign({}, CLASS_LOOK.assassin, { torso: '#1a1a28', legs: '#141420', arms: '#1a1a28', skin: '#303048', hair: '#101018', hairBack: '#101018', weapon: { type: 'claw', col: '#8080a0' }, wclass: 'claw' }); }
    if (id === 'amazon' && e.unit === 'decoy') m = Object.assign({}, CLASS_LOOK.amazon, { weapon: { type: 'javelin', len: 1.05, col: '#c0c4cc', grip: 0.35 }, wclass: 'thrust' });
    mcache.set(key, finalize(key, m));
    return mcache.get(key);
  }

  function portraitModel(cls) {
    const key = 'portrait:' + cls;
    if (!mcache.has(key)) {
      const m = Object.assign({}, CLASS_LOOK[cls], { combat: false });
      const start = D.CLASSES[cls].start;
      m.weapon = weaponLook({ base: start[0][0], q: 'normal' });
      m.wclass = D.weaponClass(BASES[start[0][0]]);
      if (start[1]) m.shield = shieldLook({ base: start[1][0], q: 'normal' });
      mcache.set(key, finalize(key, m));
    }
    return mcache.get(key);
  }

  D.Models = { heroModel, entModel, portraitModel, CLASS_LOOK, MON_LOOK, WEAPON_LOOK, HELM_LOOK, clear: () => mcache.clear() };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
