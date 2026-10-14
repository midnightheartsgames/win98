(function (Q) {
  'use strict';

  Q.WP = { GAUNTLET: 1, MACHINEGUN: 2, SHOTGUN: 3, GRENADE: 4, ROCKET: 5, LIGHTNING: 6, RAILGUN: 7, PLASMA: 8, BFG: 9 };

  Q.WEAPONS = [
    null,
    { id: 1, key: 'gauntlet', name: 'Gauntlet', refire: 400, dmg: 50, range: 32, ammo: -1, color: [0.6, 0.8, 1], kick: 0 },
    { id: 2, key: 'machinegun', name: 'Machinegun', refire: 100, dmg: 7, spread: 200, pickup: 40, color: [1, 1, 0.3], kick: 1, ammoName: 'Bullets' },
    { id: 3, key: 'shotgun', name: 'Shotgun', refire: 1000, dmg: 10, pellets: 11, spread: 700, pickup: 10, color: [1, 0.6, 0.2], kick: 5, ammoName: 'Shells' },
    { id: 4, key: 'grenade', name: 'Grenade Launcher', refire: 800, dmg: 100, splash: 100, radius: 150, speed: 700, fuse: 2.5, pickup: 10, color: [0.2, 0.8, 0.3], kick: 3, ammoName: 'Grenades' },
    { id: 5, key: 'rocket', name: 'Rocket Launcher', refire: 800, dmg: 100, splash: 100, radius: 120, speed: 900, pickup: 10, color: [1, 0.2, 0.15], kick: 3, ammoName: 'Rockets' },
    { id: 6, key: 'lightning', name: 'Lightning Gun', refire: 50, dmg: 8, range: 768, pickup: 100, color: [0.8, 0.85, 1], kick: 0, ammoName: 'Lightning' },
    { id: 7, key: 'railgun', name: 'Railgun', refire: 1500, dmg: 100, pickup: 10, color: [0.2, 1, 0.3], kick: 4, ammoName: 'Slugs' },
    { id: 8, key: 'plasma', name: 'Plasma Gun', refire: 100, dmg: 20, splash: 15, radius: 20, speed: 2000, pickup: 50, color: [0.6, 0.3, 1], kick: 1, ammoName: 'Cells' },
    { id: 9, key: 'bfg', name: 'BFG10K', refire: 200, dmg: 100, splash: 100, radius: 120, speed: 2000, pickup: 20, color: [0.3, 1, 0.3], kick: 2, ammoName: 'Bfg Ammo' }
  ];

  Q.MAX_AMMO = 200;
  Q.WEAPON_DROP_TIME = 200;
  Q.WEAPON_RAISE_TIME = 250;
  Q.GIB_HEALTH = -40;
  Q.ARMOR_PROTECTION = 0.66;
  Q.RESPAWN_DELAY = 1.7;
  Q.FORCE_RESPAWN = 20;
  Q.CARNAGE_TIME = 3;
  Q.POWERUP_TIME = 30;

  Q.ITEMS = {
    weapon_shotgun: { type: 'weapon', wp: 3, name: 'Shotgun', respawn: 5 },
    weapon_grenadelauncher: { type: 'weapon', wp: 4, name: 'Grenade Launcher', respawn: 5 },
    weapon_rocketlauncher: { type: 'weapon', wp: 5, name: 'Rocket Launcher', respawn: 5 },
    weapon_lightning: { type: 'weapon', wp: 6, name: 'Lightning Gun', respawn: 5 },
    weapon_railgun: { type: 'weapon', wp: 7, name: 'Railgun', respawn: 5 },
    weapon_plasmagun: { type: 'weapon', wp: 8, name: 'Plasma Gun', respawn: 5 },
    weapon_bfg: { type: 'weapon', wp: 9, name: 'BFG10K', respawn: 5 },
    weapon_machinegun: { type: 'weapon', wp: 2, name: 'Machinegun', respawn: 5 },
    ammo_bullets: { type: 'ammo', wp: 2, amount: 50, name: 'Bullets', respawn: 40 },
    ammo_shells: { type: 'ammo', wp: 3, amount: 10, name: 'Shells', respawn: 40 },
    ammo_grenades: { type: 'ammo', wp: 4, amount: 5, name: 'Grenades', respawn: 40 },
    ammo_rockets: { type: 'ammo', wp: 5, amount: 5, name: 'Rockets', respawn: 40 },
    ammo_lightning: { type: 'ammo', wp: 6, amount: 60, name: 'Lightning', respawn: 40 },
    ammo_slugs: { type: 'ammo', wp: 7, amount: 10, name: 'Slugs', respawn: 40 },
    ammo_cells: { type: 'ammo', wp: 8, amount: 30, name: 'Cells', respawn: 40 },
    ammo_bfg: { type: 'ammo', wp: 9, amount: 15, name: 'Bfg Ammo', respawn: 40 },
    item_health_small: { type: 'health', amount: 5, max: 200, name: '5 Health', respawn: 35, color: [0.3, 1, 0.3] },
    item_health: { type: 'health', amount: 25, max: 100, name: '25 Health', respawn: 35, color: [1, 0.9, 0.2] },
    item_health_large: { type: 'health', amount: 50, max: 100, name: '50 Health', respawn: 35, color: [1, 0.55, 0.1] },
    item_health_mega: { type: 'health', amount: 100, max: 200, name: 'Mega Health', respawn: 35, color: [0.3, 0.5, 1] },
    item_armor_shard: { type: 'armor', amount: 5, name: 'Armor Shard', respawn: 25 },
    item_armor_combat: { type: 'armor', amount: 50, name: 'Armor', respawn: 25, color: [1, 0.85, 0.1] },
    item_armor_body: { type: 'armor', amount: 100, name: 'Heavy Armor', respawn: 25, color: [0.95, 0.15, 0.1] },
    item_quad: { type: 'powerup', pw: 'quad', name: 'Quad Damage', respawn: 120, color: [0.3, 0.45, 1] },
    item_regen: { type: 'powerup', pw: 'regen', name: 'Regeneration', respawn: 120, color: [1, 0.2, 0.2] },
    item_haste: { type: 'powerup', pw: 'haste', name: 'Speed', respawn: 120, color: [1, 0.6, 0.1] },
    item_enviro: { type: 'powerup', pw: 'battlesuit', name: 'Battle Suit', respawn: 120, color: [1, 0.85, 0.2] },
    item_invis: { type: 'powerup', pw: 'invis', name: 'Invisibility', respawn: 120, color: [0.75, 0.75, 0.8] },
    holdable_medkit: { type: 'holdable', hold: 'medkit', name: 'Medkit', respawn: 60 },
    holdable_teleporter: { type: 'holdable', hold: 'teleporter', name: 'Personal Teleporter', respawn: 60 }
  };

  Q.POWERUPS = ['quad', 'battlesuit', 'haste', 'invis', 'regen'];

  Q.SKILLS = ['I Can Win', 'Bring It On', 'Hurt Me Plenty', 'Hardcore', 'Nightmare!'];

  Q.GAMETYPES = { ffa: 'Free For All', tourney: 'Tournament', team: 'Team Deathmatch' };

  Q.MODS = [
    { id: 'baseq3', name: 'Quake III Arena', desc: 'The Arena Eternal as the Vadrigar built it.' },
    { id: 'instagib', name: 'InstaGib', desc: 'Railguns only. Infinite slugs. One hit, one frag. No items.' },
    { id: 'arsenal', name: 'Rocket Arena', desc: 'Spawn with every weapon, 100 health and 100 armor. No items, no self damage.' }
  ];

  const L = (arch, o) => Object.assign({ arch, skin: '#c89070', suit: '#555', armor: '#777', trim: '#aa8844', head: 'bald', hair: '#222', extra: [], scale: 1 }, o);

  Q.BOTS = {
    sarge: { name: 'Sarge', gender: 'm', fav: 5, aggr: 0.8, look: L('armor', { suit: '#5a5a3a', armor: '#6b6b44', trim: '#8a7040', head: 'beret', hair: '#3a3a20', extra: ['cigar', 'pads'] }), tag: 'Veteran of too many wars to count.',
      hello: ['Welcome to my world, soldier.', 'Fall in, maggot.'], kill: ['Stay down, maggot!', 'That is how the Corps does it.', 'Next!'], death: ['Lucky shot, recruit.', 'I have had worse wounds shaving.'] },
    ranger: { name: 'Ranger', gender: 'm', fav: 5, aggr: 0.6, look: L('armor', { suit: '#4a4a44', armor: '#58584e', trim: '#6c8a3a', head: 'helmet', hair: '#333', extra: ['pads'] }), tag: 'The original warrior of the Slipgate war.',
      hello: ['I have walked through worse gates than this one.'], kill: ['Back to the void with you.', 'Rest now.'], death: ['Well played.', 'The gate will spit me back out.'] },
    phobos: { name: 'Phobos', gender: 'm', fav: 3, aggr: 0.75, look: L('armor', { suit: '#7a5a2a', armor: '#c07020', trim: '#503010', head: 'helmet', hair: '#222', extra: ['pads'], helmetColor: '#b86a20' }), tag: 'A marine who never came back from the moons of Mars.',
      hello: ['Another demon to put down.'], kill: ['Rip and tear.', 'Should have stayed on Mars.'], death: ['I have seen worse on Phobos.'] },
    doom: { name: 'Doom', gender: 'm', fav: 3, aggr: 0.8, look: L('armor', { suit: '#3e5a2a', armor: '#5e8a30', trim: '#403010', head: 'helmet', extra: ['pads'], helmetColor: '#6a9a3a' }), tag: 'The last marine standing.',
      hello: ['Ready.'], kill: ['Too easy.', 'Hell was harder.'], death: ['...'] },
    mynx: { name: 'Mynx', gender: 'f', fav: 7, aggr: 0.6, look: L('female', { suit: '#2a2230', armor: '#4a3a50', trim: '#c02030', head: 'longhair', hair: '#b02010', skin: '#e0b090' }), tag: 'Cold, beautiful and very precise.',
      hello: ['Try not to bore me.'], kill: ['Was it good for you?', 'Pathetic.', 'Next time, dance faster.'], death: ['You will pay for that.', 'Hmm. Not bad.'] },
    orbb: { name: 'Orbb', gender: 'n', fav: 6, aggr: 0.7, look: L('orbb', { suit: '#7a7a80', armor: '#9a9aa0', trim: '#d06020', skin: '#e8e0d0' }), tag: 'An eye that never blinks.',
      hello: ['I SEE YOU.'], kill: ['Observed. Terminated.', 'I watched you die.'], death: ['Visual contact... lost.'] },
    hunter: { name: 'Hunter', gender: 'f', fav: 7, aggr: 0.7, look: L('female', { suit: '#3a4a2a', armor: '#6a5a30', trim: '#2a8a4a', head: 'feathers', hair: '#2a1a10', skin: '#c89070' }), tag: 'She tracks her prey across every arena.',
      hello: ['The hunt begins.'], kill: ['Another trophy.', 'You ran well, prey.'], death: ['The prey bites back.'] },
    grunt: { name: 'Grunt', gender: 'm', fav: 2, aggr: 0.9, look: L('armor', { suit: '#5a4a3a', armor: '#7a6a4a', trim: '#3a3a3a', head: 'bald', skin: '#d0a080', extra: ['pads', 'bulk'] }), tag: 'Muscle, sweat and no fear at all.',
      hello: ['Hurr.'], kill: ['GRUNT SMASH.', 'Heh heh.'], death: ['Owww.'] },
    bitterman: { name: 'Bitterman', gender: 'm', fav: 5, aggr: 0.75, look: L('armor', { suit: '#3a3a40', armor: '#5a5a66', trim: '#a02020', head: 'bald', skin: '#b08060', extra: ['pads', 'cyber'] }), tag: 'Veteran of the Strogg invasion, half machine now.',
      hello: ['The Strogg could not kill me. Neither will you.'], kill: ['Stroggified.', 'Clear.'], death: ['Just a scratch.'] },
    hossman: { name: 'Hossman', gender: 'm', fav: 3, aggr: 0.85, look: L('heavy', { suit: '#3a3028', armor: '#5a4a3a', trim: '#303060', head: 'bald', skin: '#d8a888', extra: ['beard', 'vest'] }), tag: 'A biker with a very short fuse.',
      hello: ['Get off my road.'], kill: ['Road kill!', 'Eat my dust.'], death: ['Aw, man. Scratched my paint.'] },
    daemia: { name: 'Daemia', gender: 'f', fav: 5, aggr: 0.7, look: L('female', { suit: '#5a2a18', armor: '#b05020', trim: '#e0a030', head: 'bun', hair: '#1a1010', skin: '#6a4030' }), tag: 'Graceful, fast and utterly merciless.',
      hello: ['I hope you can keep up.'], kill: ['Too slow.', 'Grace wins.'], death: ['A lucky moment. Nothing more.'] },
    klesk: { name: 'Klesk', gender: 'n', fav: 3, aggr: 0.95, look: L('creature', { suit: '#5a6a2a', armor: '#8a9a3a', trim: '#e0c040', skin: '#9aaa40', head: 'insect' }), tag: 'Hive-born killer from a dying world.',
      hello: ['Klesk hungry.'], kill: ['Klesk feeds!', 'Chitter.'], death: ['Hssss...'] },
    anarki: { name: 'Anarki', gender: 'm', fav: 5, aggr: 0.9, look: L('skater', { suit: '#303848', armor: '#4a5a80', trim: '#e0e020', head: 'mohawk', hair: '#20c0e0', skin: '#d0a080' }), tag: 'A punk on a hover board who never stops moving.',
      hello: ['Wooo! Party!'], kill: ['Owned!', 'Wheee!'], death: ['Dude! Not cool!'] },
    xaero: { name: 'Xaero', gender: 'm', fav: 7, aggr: 0.8, look: L('robe', { suit: '#302020', armor: '#5a2020', trim: '#c0a060', head: 'hood', skin: '#806050' }), tag: 'The undefeated master of the arena.',
      hello: ['You are not ready.'], kill: ['Accept your fate.', 'Unworthy.'], death: ['Impossible.'] },
    uriel: { name: 'Uriel', gender: 'm', fav: 8, aggr: 0.75, look: L('winged', { suit: '#6a5040', armor: '#8a7050', trim: '#d0b070', skin: '#c0a080', head: 'bald' }), tag: 'A fallen angel with a cruel streak.',
      hello: ['Pray, mortal.'], kill: ['Heaven will not have you.', 'Fall.'], death: ['My wings...'] },
    slash: { name: 'Slash', gender: 'f', fav: 4, aggr: 0.8, look: L('female', { suit: '#3a3a5a', armor: '#6060a0', trim: '#e04080', head: 'cap', hair: '#e0d040', skin: '#e0b090', extra: ['skates'] }), tag: 'Graffiti queen on roller blades.',
      hello: ['Tag, you are it.'], kill: ['Tagged!', 'Later!'], death: ['Whatever.'] },
    visor: { name: 'Visor', gender: 'm', fav: 5, aggr: 0.7, look: L('armor', { suit: '#2a3a4a', armor: '#4a6a8a', trim: '#e04020', head: 'visor', extra: ['pads'] }), tag: 'Cybernetic eye, perfect aim.',
      hello: ['Target acquired.'], kill: ['Target down.', 'Scanned and deleted.'], death: ['Recalibrating.'] },
    razor: { name: 'Razor', gender: 'm', fav: 8, aggr: 0.85, look: L('armor', { suit: '#3a2a2a', armor: '#6a3a3a', trim: '#c0c0c0', head: 'goggles', extra: ['pads', 'blades'] }), tag: 'He smiles only when he is cutting.',
      hello: ['Sharp enough for you?'], kill: ['Sliced.', 'Clean cut.'], death: ['Dull.'] },
    keel: { name: 'Keel', gender: 'm', fav: 4, aggr: 0.8, look: L('armor', { suit: '#4a4a30', armor: '#8a8a40', trim: '#e0a020', head: 'helmet', extra: ['pads', 'tank'], helmetColor: '#9a9a50' }), tag: 'Demolitions expert with a death wish.',
      hello: ['Fire in the hole!'], kill: ['Boom!', 'Kaboom, baby!'], death: ['Short fuse.'] },
    lucy: { name: 'Lucy', gender: 'f', fav: 3, aggr: 0.85, look: L('heavy', { suit: '#2a2a2a', armor: '#5a5a5a', trim: '#c02020', head: 'bun', hair: '#d0c080', skin: '#e0b090', female: true }), tag: 'A prison guard who loved her job too much.',
      hello: ['Line up, prisoner.'], kill: ['Lights out!', 'Solitary for you.'], death: ['Riot!'] },
    stripe: { name: 'Stripe', gender: 'm', fav: 7, aggr: 0.7, look: L('armor', { suit: '#1a1a1a', armor: '#d0d0d0', trim: '#202020', head: 'bald', skin: '#e8e8e8', extra: ['pads', 'stripes'] }), tag: 'Mind broken, body perfect.',
      hello: ['Hehehe.'], kill: ['Stripes!', 'Hahaha!'], death: ['Hehe... ow.'] },
    major: { name: 'Major', gender: 'f', fav: 5, aggr: 0.75, look: L('female', { suit: '#4a4030', armor: '#8a7040', trim: '#c0c0c0', head: 'cap', hair: '#402010', skin: '#d8a888' }), tag: 'Commanding officer of her own war.',
      hello: ['Soldier, report.'], kill: ['Dismissed.', 'At ease, forever.'], death: ['Tactical retreat.'] },
    tankjr: { name: 'TankJr', gender: 'm', fav: 6, aggr: 0.9, look: L('heavy', { suit: '#6a4020', armor: '#d07020', trim: '#303030', head: 'helmet', skin: '#8a8a8a', helmetColor: '#b86020', extra: ['tank'] }), tag: 'A walking fortress.',
      hello: ['TANK ONLINE.'], kill: ['Crushed.', 'Armor wins.'], death: ['Hull breach.'] },
    bones: { name: 'Bones', gender: 'n', fav: 4, aggr: 0.8, look: L('bones', { suit: '#d8d0b8', armor: '#b8b098', trim: '#402020', skin: '#e8e0c8', head: 'skull' }), tag: 'Nothing left but spite and bone.',
      hello: ['Rattle rattle.'], kill: ['Join me.', 'Bone dry.'], death: ['I will pull myself together.'] },
    sorlag: { name: 'Sorlag', gender: 'n', fav: 5, aggr: 0.9, look: L('creature', { suit: '#3a5a30', armor: '#6a8a40', trim: '#c08020', skin: '#5a8a3a', head: 'reptile', extra: ['tail'] }), tag: 'A scavenger lizard that eats the fallen.',
      hello: ['Ssssmells like dinner.'], kill: ['Tasssty.', 'Crunch.'], death: ['Hsssk!'] },
    crash: { name: 'Crash', gender: 'f', fav: 2, aggr: 0.5, look: L('female', { suit: '#2a3a5a', armor: '#d06020', trim: '#e0e0e0', head: 'cap', hair: '#202020', skin: '#d8a888' }), tag: 'Arena trainer. She has seen every rookie mistake.',
      hello: ['Show me what you have got.'], kill: ['Lesson one: keep moving.', 'Again!'], death: ['Good. You are learning.'] }
  };

  Q.ARENAS = [
    { map: 'q3dm1', name: 'Arena Gate', tier: 1, bots: ['ranger'], fraglimit: 10, timelimit: 15, type: 'ffa' },
    { map: 'q3dm2', name: 'House of Pain', tier: 1, bots: ['phobos'], fraglimit: 15, timelimit: 15, type: 'ffa' },
    { map: 'q3dm3', name: 'Arena of Death', tier: 1, bots: ['mynx', 'orbb'], fraglimit: 15, timelimit: 15, type: 'ffa' },
    { map: 'q3tourney1', name: 'Power Station 0218', tier: 1, bots: ['sarge'], fraglimit: 10, timelimit: 15, type: 'tourney' },
    { map: 'q3dm4', name: 'The Place of Many Deaths', tier: 2, bots: ['grunt', 'bitterman'], fraglimit: 15, timelimit: 15, type: 'ffa' },
    { map: 'q3dm5', name: 'The Forgotten Place', tier: 2, bots: ['hossman', 'daemia'], fraglimit: 15, timelimit: 15, type: 'ffa' },
    { map: 'q3dm6', name: 'The Camping Grounds', tier: 2, bots: ['orbb', 'bitterman', 'grunt', 'daemia'], fraglimit: 20, timelimit: 15, type: 'ffa' },
    { map: 'q3tourney2', name: 'The Proving Grounds', tier: 2, bots: ['hunter'], fraglimit: 10, timelimit: 15, type: 'tourney' }
  ];

  Q.TIERS = [
    { n: 1, name: 'Trainee', maps: ['q3dm1', 'q3dm2', 'q3dm3', 'q3tourney1'] },
    { n: 2, name: 'Skilled', maps: ['q3dm4', 'q3dm5', 'q3dm6', 'q3tourney2'] }
  ];

  Q.arena = map => Q.ARENAS.find(a => a.map === map);

  Q.OBITS = {
    gauntlet: ['was pummeled by', ''],
    machinegun: ['was machinegunned by', ''],
    shotgun: ['was gunned down by', ''],
    grenade: ['ate', "'s grenade"],
    grenade_splash: ['was shredded by', "'s shrapnel"],
    rocket: ['ate', "'s rocket"],
    rocket_splash: ['almost dodged', "'s rocket"],
    plasma: ['was melted by', "'s plasmagun"],
    plasma_splash: ['was melted by', "'s plasmagun"],
    railgun: ['was railed by', ''],
    lightning: ['was electrocuted by', ''],
    bfg: ['was blasted by', "'s BFG"],
    bfg_splash: ['was blasted by', "'s BFG"],
    telefrag: ['tried to invade', "'s personal space"]
  };

  Q.obituary = function (victim, attacker, mod, gender) {
    const him = gender === 'f' ? 'her' : gender === 'n' ? 'it' : 'him';
    const his = gender === 'f' ? 'her' : gender === 'n' ? 'its' : 'his';
    if (!attacker || attacker === victim) {
      const self = {
        suicide: 'suicides', falling: 'cratered', lava: 'does a back flip into the lava', slime: 'melted', trigger_hurt: 'was in the wrong place', crush: 'was squished',
        grenade_splash: 'tripped on ' + his + ' own grenade', rocket_splash: 'blew ' + him + 'self up', plasma_splash: 'melted ' + him + 'self', bfg_splash: 'should have used a smaller gun'
      };
      return victim + ' ' + (self[mod] || 'killed ' + him + 'self') + '.';
    }
    const o = Q.OBITS[mod] || ['was killed by', ''];
    return victim + ' ' + o[0] + ' ' + attacker + o[1];
  };

  Q.AWARDS = {
    excellent: { name: 'Excellent', say: 'excellent' },
    impressive: { name: 'Impressive', say: 'impressive' },
    gauntlet: { name: 'Humiliation', say: 'humiliation' },
    accuracy: { name: 'Accuracy', say: 'accuracy' },
    perfect: { name: 'Perfect', say: 'perfect' },
    frags: { name: 'Frags', say: 'frags' }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
