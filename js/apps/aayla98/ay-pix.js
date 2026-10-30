(function (A) {
  'use strict';
  const Pix = A.Pix = {};

  const HEADS = {
    twilek: {
      down: ['......oooo......', '.....osssso.....', '....osssssso....', '....otttttto....', '....osssssso....', '....osesseso....', '....osssssso....', '.....osSSso.....', '......osso......', '......oSSo......'],
      up: ['......oooo......', '.....osssso.....', '....osssssso....', '....otttttto....', '....osssssso....', '....osssssso....', '....osssssso....', '.....osssso.....', '......osso......', '......oSSo......'],
      right: ['......oooo......', '.....osssso.....', '.....ossssso....', '.....otttttto...', '.....osssssso...', '.....osssseso...', '.....ossssssso..', '.....osssSso....', '......osso......', '......oSSo......']
    },
    kiffar: {
      down: ['.....oooooo.....', '....ohhhhhho....', '...ohhsssshho...', '...ohssssssho...', '...ohsessesho...', '...ohmmmmmmho...', '...ohssssssho...', '....hosSSsoh....', '....h.osso.h....', '......oSSo......'],
      up: ['.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '....ohhhhhho....', '....h.osso.h....', '......oSSo......'],
      right: ['.....oooooo.....', '....ohhhhhho....', '...ohhhhhhsso...', '...ohhhhhssso...', '...ohhhhssseso..', '...ohhhhmmmmmo..', '...ohhhhsssssso.', '...ohhh.osSso...', '....hh..osso....', '......oSSo......']
    },
    human: {
      down: ['.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '...ohssssssho...', '...ohsessesho...', '...ohssssssho...', '....osssssso....', '.....osSSso.....', '......osso......', '......oSSo......'],
      up: ['.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '....ohhhhhho....', '.....ohhhho.....', '......osso......', '......oSSo......'],
      right: ['.....oooooo.....', '....ohhhhhho....', '...ohhhhhhsso...', '...ohhhhhssso...', '...ohhhhssseso..', '...ohhhhssssso..', '...ohhhhsssssso.', '...ohhh.osSso...', '....hh..osso....', '......oSSo......']
    },
    devaronian: {
      down: ['....k......k....', '....ko....ok....', '.....osssso.....', '....osssssso....', '...osesssseso...', '...osssssssso...', '....osssssso....', '.....osSSso.....', '......osso......', '......oSSo......'],
      up: ['....k......k....', '....ko....ok....', '.....osssso.....', '....osssssso....', '...osssssssso...', '...osssssssso...', '....osssssso....', '.....osssso.....', '......osso......', '......oSSo......'],
      right: ['......k...k.....', '......ko..ko....', '.....osssssso...', '....ossssssso...', '....osssssseso..', '....ossssssssso.', '....osssssssso..', '.....osssSso....', '......osso......', '......oSSo......']
    },
    nikto: {
      down: ['......okko......', '.....okssko.....', '....oksssssko...', '...okssssssko...', '...osessssesso..', '...oksssssssko..', '....oksssssko...', '.....osSSso.....', '......osso......', '......oSSo......'],
      up: ['......okko......', '.....okssko.....', '....okssssko....', '...okssssssko...', '...okssssssko...', '...okssssssko...', '....oksssssko...', '.....osssso.....', '......osso......', '......oSSo......'],
      right: ['......okko......', '.....okssko.....', '....okssssso....', '....oksssssso...', '....okssssseso..', '....okssssssso..', '....oksssssssko.', '.....oksSso.....', '......osso......', '......oSSo......']
    },
    keldor: {
      down: ['.....oooooo.....', '....osssssso....', '...osssssssso...', '...osggssggso...', '...osggssggso...', '...osssssssso...', '....okkkkkko....', '.....okkkko.....', '......osso......', '......oSSo......'],
      up: ['.....oooooo.....', '....osssssso....', '...osssssssso...', '...osssssssso...', '...osssssssso...', '...osssssssso...', '....osssssso....', '.....okkkko.....', '......osso......', '......oSSo......'],
      right: ['.....oooooo.....', '....osssssso....', '...osssssssso...', '...osssssggso...', '...osssssggsso..', '...ossssssssso..', '...osssskkkkko..', '....ossskkko....', '......osso......', '......oSSo......']
    }
  };

  const TORSO_FRONT = ['....oCccccCo....', '...oCccccccCo...', '...oCccccccCo...', '...oCcttttcCo...', '...osccccccso...', '....oCccccCo....', '....oCccccCo....'];
  const TORSO_SIDE = ['.....oCcccCo....', '.....oCcccco....', '.....oCcCCco....', '.....otttCto....', '.....occcsco....', '.....oCcccCo....', '.....oCcccCo....'];
  const LEGS = {
    front: ['.....oCooCo.....', '.....oCo.oCo....', '.....oCo.oCo....', '.....oCo.oCo....', '.....obo.obo....', '....obbo.obbo...', '....oooo.oooo...'],
    frontStep: ['.....oCooCo.....', '.....oCo.oCo....', '.....oCo.obo....', '.....oCo.obbo...', '.....obo.oooo...', '....obbo........', '....oooo........'],
    side: ['......oCCo......', '......oCCo......', '......oCCo......', '......oCCo......', '......obbo......', '......obbbo.....', '......ooooo.....'],
    sideStep: ['.....oCooCo.....', '....oCo..oCo....', '....oCo..oCo....', '...oCo....oCo...', '...obo....obo...', '..obbo....obbo..', '..oooo....oooo..']
  };
  const LEKKU = {
    down: { front: [[2, 5, 10]], back: [[10, 5, 8]] },
    up: { front: [[3, 7, 8], [9, 7, 8]], back: [] },
    right: { front: [], back: [[3, 4, 11]] }
  };
  const TENTACLES = {
    down: { front: [[1, 5, 8], [11, 5, 8]], back: [[3, 6, 7], [9, 6, 7]] },
    up: { front: [[2, 6, 8], [6, 6, 9], [10, 6, 8]], back: [] },
    right: { front: [], back: [[2, 4, 9], [4, 5, 9]] }
  };

  Pix.LOOKS = {
    aayla_padawan: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#8c7a62', C: '#6a5a44', t: '#c9b48a', b: '#3a2a1e', e: '#2a1a10' }, blade: '#e83a2a' },
    twilek_trader: { kind: 'twilek', pal: { o: '#1a1018', s: '#d8885a', S: '#b0663e', c: '#6a3a2a', C: '#4a281c', t: '#d8b060', b: '#2a1a12', e: '#2a1a10' } },
    twilek_woman: { kind: 'twilek', pal: { o: '#1a1018', s: '#c87a9a', S: '#a05a7a', c: '#5a6a4a', C: '#3e4a32', t: '#c8a060', b: '#2a1a12', e: '#2a1a10' } },
    twilek_green: { kind: 'twilek', pal: { o: '#1a1018', s: '#6aa060', S: '#4a7a44', c: '#3a3430', C: '#26221e', t: '#8a6a40', b: '#1a1410', e: '#1a1010' } },
    twilek_child: { kind: 'twilek', pal: { o: '#1a1018', s: '#8ab8e8', S: '#6a98c8', c: '#8a7a5a', C: '#6a5a40', t: '#c8b080', b: '#3a2a1e', e: '#2a1a10' } },
    twilek_guard: { kind: 'twilek', pal: { o: '#1a1018', s: '#5a8ab8', S: '#3e6a98', c: '#3a4a6a', C: '#26324a', t: '#c8a050', b: '#1a1410', e: '#1a1010' } },
    vos_early: { who: 'vos', kind: 'kiffar', pal: { o: '#1a1018', s: '#b0825a', S: '#8a6040', c: '#3a3434', C: '#2a2424', t: '#6a5a4a', b: '#1a1410', e: '#1a1010', h: '#1c1410', m: '#e0c040' }, blade: '#3ad04a' },
    asante_guard: { who: 'asante', kind: 'kiffar', pal: { o: '#1a1018', s: '#b8906a', S: '#94704e', c: '#4a4a5a', C: '#34343e', t: '#a08a4a', b: '#1a1410', e: '#1a1010', h: '#1c1410', m: '#e0c040' } },
    twilek_worker: { kind: 'twilek', pal: { o: '#1a1018', s: '#8a9a80', S: '#6a7a60', c: '#5a4a3a', C: '#3e3428', t: '#7a6a50', b: '#2a1e14', e: '#2a2020' } },
    aayla_dancer: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#7a4a6a', C: '#5a3450', t: '#d8b060', b: '#3a2a1e', e: '#2a1a10' }, blade: '#e83a2a' },
    pol_robe: { who: 'pol', kind: 'twilek', pal: { o: '#1a1018', s: '#7a9ab0', S: '#5a7a90', c: '#5a2a4a', C: '#3e1c32', t: '#d8b060', b: '#2a1a12', e: '#2a1a10' } },
    nima_servant: { who: 'nima', kind: 'twilek', pal: { o: '#1a1018', s: '#e0a070', S: '#c08050', c: '#8a6a4a', C: '#6a4e34', t: '#c8a070', b: '#3a2a1a', e: '#2a1a10' } },
    bala_cook: { who: 'bala', kind: 'twilek', pal: { o: '#1a1018', s: '#8aa070', S: '#6a8050', c: '#6a5a4a', C: '#4a3e32', t: '#a08a6a', b: '#2a1e14', e: '#2a2010' } },
    misra_dancer: { who: 'misra', kind: 'twilek', pal: { o: '#1a1018', s: '#c890b8', S: '#a87098', c: '#6a3a5a', C: '#4a2840', t: '#d8b060', b: '#3a2030', e: '#2a1a20' } },
    envoy_council: { who: 'envoy', kind: 'twilek', pal: { o: '#1a1018', s: '#9a8ad0', S: '#7a6ab0', c: '#3a4a6a', C: '#26324a', t: '#c8a050', b: '#1a1410', e: '#1a1010' } },
    aayla_kiffex: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#6b4a30', C: '#4a3220', t: '#c8a060', b: '#4a2e1a', e: '#2a1a10' }, blade: '#e83a2a' },
    anzat_feral: { who: 'anzat', kind: 'human', pal: { o: '#1a1018', s: '#9a9a90', S: '#7a7a70', c: '#3a3430', C: '#28221e', t: '#5a4a3a', b: '#1a1410', e: '#c8c040', h: '#1a1410' } },
    guardian_black: { who: 'guardian', kind: 'kiffar', pal: { o: '#1a1018', s: '#a87a52', S: '#86603e', c: '#24242a', C: '#18181c', t: '#c8a040', b: '#101014', e: '#1a1010', h: '#1c1410', m: '#e0c040' } },
    prisoner_rags: { who: 'prisoner', kind: 'human', pal: { o: '#1a1018', s: '#c8a080', S: '#a88060', c: '#5a4a3a', C: '#3e3428', t: '#7a6a4a', b: '#2a1e14', e: '#2a1a10', h: '#3a2a1a' } },
    prisoner_merc: { kind: 'twilek', pal: { o: '#1a1018', s: '#c86a5a', S: '#a04a3a', c: '#3a3a3a', C: '#262626', t: '#8a6a3a', b: '#1a1410', e: '#1a1010' } },
    karkko_robe: { who: 'karkko', kind: 'human', pal: { o: '#1a1018', s: '#9a8a5a', S: '#7a6a42', c: '#141016', C: '#0a080c', t: '#3a1a1a', b: '#0a080a', e: '#2a1a10', h: '#141010' }, blade: '#e83a2a' },
    traa_neti: { who: 'traa', kind: 'human', pal: { o: '#1a1018', s: '#c8b040', S: '#a08a2a', c: '#5a4a30', C: '#3a2e1e', t: '#6a4a2a', b: '#3a2a18', e: '#9ac040', h: '#6a4a2a' } },
    clansman_travel: { who: 'clansman', kind: 'kiffar', pal: { o: '#1a1018', s: '#a87a52', S: '#86603e', c: '#4a4a3a', C: '#34342a', t: '#8a7a5a', b: '#1a1410', e: '#1a1010', h: '#1c1410', m: '#e0c040' } },
    tholme_robe: { who: 'tholme', kind: 'human', pal: { o: '#1a1018', s: '#d8b090', S: '#b89070', c: '#6a5a44', C: '#4a3e2e', t: '#3a3024', b: '#2a2018', e: '#3a6a3a', h: '#2a2626' }, blade: '#3ad04a' },
    aayla_servant: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#6a5a4a', C: '#4a3e32', t: '#b89a60', b: '#3a2a1e', e: '#2a1a10' } },
    aayla_robe: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#5a3c26', C: '#3e2a1a', t: '#a07a50', b: '#2a1a10', e: '#2a1a10' }, blade: '#4a8aff' },
    villie_spacer: { who: 'villie', kind: 'devaronian', pal: { o: '#1a1018', s: '#b8402a', S: '#8a2a1a', c: '#3a3a2a', C: '#2a2a1e', t: '#8a7a4a', b: '#1a1410', e: '#f0d020', k: '#e8dcc0' } },
    fenn_guard: { kind: 'twilek', pal: { o: '#1a1018', s: '#d8d4c8', S: '#b0aca0', c: '#6a3a2a', C: '#4a281c', t: '#c8a040', b: '#1a1410', e: '#2a2010' } },
    rofenn_robe: { who: 'rofenn', kind: 'twilek', pal: { o: '#1a1018', s: '#e8e4dc', S: '#c0bcb4', c: '#6a3a2a', C: '#4a281c', t: '#c8a040', b: '#2a1a12', e: '#8a7010' } },
    lon_robe: { who: 'lon', kind: 'twilek', pal: { o: '#1a1018', s: '#6a9ad0', S: '#4a7ab0', c: '#3a4a6a', C: '#26324a', t: '#c8a050', b: '#1a1410', e: '#2a1a10' } },
    maid_servant: { who: 'maid', kind: 'twilek', pal: { o: '#1a1018', s: '#d8a8c8', S: '#b888a8', c: '#6a5a4a', C: '#4a3e32', t: '#a08a6a', b: '#2a1e14', e: '#2a1a20' } },
    overseer_steward: { who: 'overseer', kind: 'twilek', pal: { o: '#1a1018', s: '#c8c0a0', S: '#a8a080', c: '#4a3a2a', C: '#32261c', t: '#c8a050', b: '#1a1410', e: '#2a2010' } },
    tsyr_armor: { who: 'tsyr', kind: 'nikto', pal: { o: '#1a1018', s: '#a0603a', S: '#7a4426', c: '#4a3a2a', C: '#32261c', t: '#8a8a7a', b: '#1a1410', e: '#2a1a10', k: '#d8c8a8' } },
    bok_armor: { who: 'bok', kind: 'nikto', pal: { o: '#1a1018', s: '#a8683a', S: '#80482a', c: '#4a3a2a', C: '#32261c', t: '#8a8a7a', b: '#1a1410', e: '#c02020', k: '#d8c8a8' } },
    nikto_merc: { who: 'nikto', kind: 'nikto', pal: { o: '#1a1018', s: '#9a5a36', S: '#764224', c: '#3a3028', C: '#28201a', t: '#7a6a4a', b: '#1a1410', e: '#2a1a10', k: '#c8b898' } },
    hunter_rifle: { who: 'hunter', kind: 'human', pal: { o: '#1a1018', s: '#c89a78', S: '#a87a58', c: '#4a3a30', C: '#32281e', t: '#7a6a50', b: '#1a1410', e: '#2a1a10', h: '#2a1a10' } },
    hunter_brute: { kind: 'human', pal: { o: '#1a1018', s: '#b88a68', S: '#986a48', c: '#5a4a3a', C: '#3e3226', t: '#8a6a3a', b: '#1a1410', e: '#2a1a10', h: '#5a3a1a' } },
    plo_robe: { who: 'plo', kind: 'keldor', pal: { o: '#1a1018', s: '#c87a3a', S: '#a85e26', c: '#5a4a3a', C: '#3e3428', t: '#2a2a2a', b: '#1e1a16', e: '#101010', g: '#141414', k: '#6a6a70' }, blade: '#4a8aff' },
    aayla_jayzaa: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#26262e', C: '#18181e', t: '#8a8a96', b: '#141418', e: '#2a1a10' }, blade: '#4a8aff' },
    kit_robe: { who: 'kit', kind: 'nautolan', head: 'twilek', pal: { o: '#1a1018', s: '#5aa05a', S: '#3e7a3e', c: '#8a6a44', C: '#5a4026', t: '#5aa05a', b: '#2a1a10', e: '#101010' }, blade: '#3ad04a' },
    vos_cw: { who: 'vos', kind: 'kiffar', pal: { o: '#1a1018', s: '#b0825a', S: '#8a6040', c: '#1e1e22', C: '#141418', t: '#4a3a3a', b: '#101012', e: '#1a1010', h: '#1c1410', m: '#e0c040' }, blade: '#3ad04a' },
    tookarti_rags: { who: 'tookarti', kind: 'chadrafan', head: 'devaronian', pal: { o: '#1a1018', s: '#8a6a52', S: '#6a4e3a', c: '#4a4038', C: '#322a24', t: '#8a7a5a', b: '#1a1410', e: '#141010', k: '#a8826a' } },
    khaleen_thief: { who: 'khaleen', kind: 'human', pal: { o: '#1a1018', s: '#d8b090', S: '#b89070', c: '#2a2a3a', C: '#1e1e2a', t: '#6a4a6a', b: '#141418', e: '#3a2a1a', h: '#3a2a1a' } },
    barkeep_wheel: { who: 'barkeep', kind: 'human', pal: { o: '#1a1018', s: '#c89a78', S: '#a87a58', c: '#3a3430', C: '#26221e', t: '#8a6a3a', b: '#1a1410', e: '#2a1a10', h: '#3a3028' } },
    worker_wheel: { kind: 'human', pal: { o: '#1a1018', s: '#d8b090', S: '#b89070', c: '#5a5a6a', C: '#3e3e4a', t: '#c8a040', b: '#1a1a20', e: '#2a1a10', h: '#5a3a1a' } },
    enforcer_wheel: { kind: 'human', pal: { o: '#1a1018', s: '#b88a68', S: '#986a48', c: '#3a3030', C: '#262020', t: '#7a5a3a', b: '#141010', e: '#2a1a10', h: '#2a1a10' } },
    enforcer_gun: { kind: 'human', pal: { o: '#1a1018', s: '#c8a080', S: '#a88060', c: '#2a3038', C: '#1e242a', t: '#6a6a7a', b: '#141418', e: '#2a1a10', h: '#1a1410' } },
    zenex_boss: { who: 'zenex', kind: 'falleen', head: 'human', pal: { o: '#1a1018', s: '#5a8a4a', S: '#46703a', c: '#2a1a2a', C: '#1e121e', t: '#c8a040', b: '#141014', e: '#4ab04a', h: '#4a2a1a' } },
    sayn_lab: { who: 'sayn', kind: 'kaminoan', head: 'human', pal: { o: '#1a1018', s: '#e0e4e0', S: '#c0c8c4', c: '#e8ecec', C: '#c8d0d0', t: '#9ab0b0', b: '#8a9a9a', e: '#141414', h: '#e0e4e0' } },
    kaminoan_lab: { kind: 'kaminoan', head: 'human', pal: { o: '#1a1018', s: '#d8dcd8', S: '#b8c0bc', c: '#dce4e4', C: '#bcc8c8', t: '#8aa0a0', b: '#7a8a8a', e: '#141414', h: '#d8dcd8' } },
    clone_trooper: { kind: 'clone', head: 'keldor', pal: { o: '#1a1018', s: '#e8e8e0', S: '#c8c8c0', g: '#141418', k: '#d8d8d0', c: '#e0e0d8', C: '#c0c0b8', t: '#9a9a94', b: '#2a2a2e', e: '#141418' } },
    bly_bare: { who: 'bly', kind: 'human', short: true, pal: { o: '#1a1018', s: '#a87a58', S: '#8a5e40', c: '#e0e0d8', C: '#c0c0b8', t: '#e0b020', b: '#2a2a2e', e: '#3a2a1a', h: '#1a1410' } },
    b2_field: { kind: 'droid', head: 'keldor', pal: { o: '#1a1018', s: '#6a7a8a', S: '#4e5a68', g: '#1a1e24', k: '#5a6a7a', c: '#6a7a8a', C: '#4e5a68', t: '#3a4450', b: '#2a3038', e: '#c03020' } },
    kiadi_robe: { who: 'kiadi', kind: 'cerean', head: 'human', pal: { o: '#1a1018', s: '#e0c0a0', S: '#c0a080', c: '#8a7a5a', C: '#5a4a3a', t: '#4a3a2a', b: '#2a1a10', e: '#3a2a1a', h: '#d8d8d0' }, blade: '#4a8aff' },
    shaak_robe: { who: 'shaak', kind: 'togruta', head: 'twilek', pal: { o: '#1a1018', s: '#c8503a', S: '#a03a28', c: '#8a6a44', C: '#5a4026', t: '#c8503a', b: '#2a1a10', e: '#2a1a1a', w: '#f0f0ec', u: '#3a5aa8' }, blade: '#4a8aff' },
    aayla_tuulaa: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#e8e0f0', C: '#c4b4d8', t: '#8a5aa8', b: '#6a4a8a', e: '#2a1a10' }, blade: '#4a8aff' },
    miles_servant: { who: 'miles', kind: 'human', short: true, pal: { o: '#1a1018', s: '#d8b090', S: '#b89070', c: '#4a4a3a', C: '#34342a', t: '#8a7a5a', b: '#1a1410', e: '#3a6a3a', h: '#9a9a9a' } },
    saba_servant: { who: 'saba', kind: 'human', pal: { o: '#1a1018', s: '#e0d0c0', S: '#c0b0a0', c: '#4a3a4a', C: '#342a34', t: '#8a7a6a', b: '#1a1418', e: '#4a6aa0', h: '#c8c8c8' } },
    vien_senator: { who: 'malloc', kind: 'human', pal: { o: '#1a1018', s: '#c06a5a', S: '#a04e40', c: '#4a2a4a', C: '#341c34', t: '#c8a050', b: '#2a1420', e: '#5a3a20', h: '#5a3a20' } },
    devaron_guard: { who: 'dguard', kind: 'devaronian', pal: { o: '#1a1018', s: '#b04a3a', S: '#8a3428', c: '#4a3a3a', C: '#342828', t: '#c8a050', b: '#1a1010', e: '#e0c020', k: '#e8dcc0' } },
    devaron_merchant: { who: 'jeweler', kind: 'devaronian', pal: { o: '#1a1018', s: '#b8503a', S: '#943c2a', c: '#3a2a4a', C: '#281c34', t: '#c8a050', b: '#1a1014', e: '#e0c020', k: '#e8dcc0' } },
    devaron_lady: { kind: 'human', pal: { o: '#1a1018', s: '#c87a5a', S: '#a86040', c: '#6a3a5a', C: '#4a2840', t: '#d8b060', b: '#2a1420', e: '#3a2418', h: '#3a2418' } },
    devaron_guest: { kind: 'devaronian', pal: { o: '#1a1018', s: '#a8483a', S: '#86342a', c: '#3a3a5a', C: '#28283e', t: '#c8a050', b: '#141018', e: '#e0c020', k: '#e8dcc0' } },
    raider_blade: { who: 'raider', kind: 'human', pal: { o: '#1a1018', s: '#c89a78', S: '#a87a58', c: '#4a4030', C: '#322a20', t: '#8a6a3a', b: '#1a1410', e: '#2a1a10', h: '#3a2a1a' } },
    raider_gun: { kind: 'human', pal: { o: '#1a1018', s: '#b88a68', S: '#986a48', c: '#3a3a30', C: '#282820', t: '#6a6a50', b: '#141410', e: '#2a1a10', h: '#1a1410' } },
    raider_heavy: { kind: 'human', short: true, pal: { o: '#1a1018', s: '#a87a58', S: '#885a40', c: '#5a4a3a', C: '#3e3428', t: '#8a8a7a', b: '#1a1410', e: '#2a1a10', h: '#2a2a2a' } },
    aurra_hunter: { who: 'aurra', kind: 'palliduvan', head: 'human', pal: { o: '#1a1018', s: '#ece8e0', S: '#ccc8c0', c: '#8a3a2a', C: '#62281c', t: '#3a2a2a', b: '#2a1a14', e: '#3a9a3a', h: '#a04020', k: '#8a8a90' }, blade: '#e83a2a' },
    shonju_robe: { who: 'shonju', kind: 'human', short: true, pal: { o: '#1a1018', s: '#e0c4a0', S: '#c0a480', c: '#5a4a3a', C: '#3e3428', t: '#2a2a2a', b: '#1a1410', e: '#5a3a20', h: '#1a1410' } },
    duum_merc: { kind: 'human', pal: { o: '#1a1018', s: '#d0a888', S: '#b08868', c: '#3a3a4a', C: '#282834', t: '#8a8a9a', b: '#14141a', e: '#2a1a10', h: '#4a2a1a' } },
    duum_gun: { kind: 'human', short: true, pal: { o: '#1a1018', s: '#c8a080', S: '#a88060', c: '#5a5a66', C: '#3e3e48', t: '#9a3a2a', b: '#1a1a20', e: '#2a1a10', h: '#1a1410' } },
    clone_elite: { kind: 'clone', head: 'keldor', pal: { o: '#1a1018', s: '#e8e8e0', S: '#c8c8c0', g: '#141418', k: '#d8d8d0', c: '#e0e0d8', C: '#c0c0b8', t: '#3a5aa8', b: '#2a2a2e', e: '#141418' } },
    bly_phase2: { who: 'bly', kind: 'clone', head: 'keldor', pal: { o: '#1a1018', s: '#ecece4', S: '#cacac2', g: '#101014', k: '#e0b020', c: '#e4e4dc', C: '#c4c4bc', t: '#e0b020', b: '#26262a', e: '#101014' } },
    clone_327: { who: 'trooper', kind: 'clone', head: 'keldor', pal: { o: '#1a1018', s: '#e8e8e0', S: '#c8c8c0', g: '#141418', k: '#d8d8d0', c: '#e0e0d8', C: '#c0c0b8', t: '#d8a820', b: '#2a2a2e', e: '#141418' } },
    noghri_warrior: { kind: 'human', short: true, pal: { o: '#1a1018', s: '#6a6e76', S: '#4e525a', c: '#2a2a26', C: '#1c1c1a', t: '#5a4a2a', b: '#141410', e: '#d8a020', h: '#3a3e44' } },
    anzat_student: { who: 'anzat', kind: 'human', pal: { o: '#1a1018', s: '#b8b0a0', S: '#988e7e', c: '#4a3a3a', C: '#322626', t: '#8a6a4a', b: '#1a1410', e: '#c02020', h: '#2a2420' } },
    akku_robe: { who: 'akku', kind: 'human', pal: { o: '#1a1018', s: '#c8b8a0', S: '#a89880', c: '#3a2a2a', C: '#261c1c', t: '#7a6a5a', b: '#1a1410', e: '#c02020', h: '#e8e8e8' } },
    gort_houk: { who: 'gort', kind: 'human', pal: { o: '#1a1018', s: '#6a4a8a', S: '#4e366a', c: '#3a3028', C: '#28201a', t: '#6a5a3a', b: '#1a1410', e: '#d8c040', h: '#2a1a3a' } },
    bulq_robe: { who: 'bulq', kind: 'human', short: true, pal: { o: '#1a1018', s: '#8a7a5a', S: '#6a5a40', c: '#2a2a2a', C: '#1c1c1c', t: '#5a3a2a', b: '#141410', e: '#5a3a20', h: '#1a1410' }, blade: '#3ad04a' },
    kelkko_robe: { who: 'kelkko', kind: 'human', pal: { o: '#1a1018', s: '#c8b090', S: '#a89070', c: '#2a2224', C: '#1c1618', t: '#5a3a2a', b: '#141010', e: '#5a3a20', h: '#5a3a20' } },
    anzat_assassin: { kind: 'human', pal: { o: '#1a1018', s: '#a8a094', S: '#888074', c: '#1e1a1e', C: '#141014', t: '#4a2a2a', b: '#0e0a0c', e: '#c02020', h: '#141012' } },
    morgukai_clone: { who: 'bok', kind: 'nikto', pal: { o: '#1a1018', s: '#a8683a', S: '#80482a', c: '#3a2e22', C: '#281e16', t: '#7a7a6a', b: '#141010', e: '#c02020', k: '#c8b898' } },
    bok_cyber: { who: 'bok', kind: 'nikto', pal: { o: '#1a1018', s: '#a8683a', S: '#80482a', c: '#4a3a2a', C: '#32261c', t: '#9aa0a8', b: '#1a1410', e: '#ff3020', k: '#d8c8a8' } },
    shade_tinte: { who: 'tinte', kind: 'kiffar', pal: { o: '#08060e', s: '#3a3a52', S: '#2a2a3e', c: '#1a1a2e', C: '#10101e', t: '#6a5a8a', b: '#08080e', e: '#e0c040', h: '#0a0a12', m: '#8a7ac0' } },
    shade_karkko: { who: 'karkko', kind: 'human', pal: { o: '#08060e', s: '#3a3048', S: '#2a2236', c: '#100c16', C: '#08060c', t: '#4a1a2a', b: '#060408', e: '#ff4040', h: '#0a080e' }, blade: '#e83a2a' },
    ekria_padawan: { who: 'ekria', kind: 'human', pal: { o: '#1a1018', s: '#e8dcd0', S: '#c8bcb0', c: '#6a6a7a', C: '#4a4a5a', t: '#3a3a4a', b: '#1a1a20', e: '#4a4a6a', h: '#3a5ad0' }, blade: '#4a8aff' },
    barriss_robe: { who: 'barriss', kind: 'human', pal: { o: '#1a1018', s: '#b0a060', S: '#908040', c: '#3a2a3a', C: '#281c28', t: '#6a5a7a', b: '#141014', e: '#4a6aa0', h: '#1a1410' }, blade: '#4a8aff' },
    zonder_padawan: { who: 'zonder', kind: 'human', short: true, pal: { o: '#1a1018', s: '#7a5a3a', S: '#5a4028', c: '#6a5a44', C: '#4a3e2e', t: '#3a3024', b: '#1a1410', e: '#2a1a10', h: '#5a4028' }, blade: '#3ad04a' },
    clone501: { who: 'clone501', kind: 'clone', head: 'keldor', pal: { o: '#1a1018', s: '#e8e8e0', S: '#c8c8c0', g: '#141418', k: '#d8d8d0', c: '#e0e0d8', C: '#c0c0b8', t: '#3a5ab0', b: '#2a2a2e', e: '#141418' } },
    b1_field: { who: 'droid', kind: 'droid', head: 'keldor', pal: { o: '#1a1018', s: '#c8b48a', S: '#a8946a', g: '#2a2a2a', k: '#c8b48a', c: '#c8b48a', C: '#a8946a', t: '#8a7a5a', b: '#6a5a40', e: '#2a2a2a' } },
    gossam_commando: { kind: 'human', pal: { o: '#1a1018', s: '#8a9a6a', S: '#6a7a4a', c: '#3a4a5a', C: '#26323e', t: '#c8a040', b: '#141820', e: '#2a1a10', h: '#4a5a3a' } },
    rakatan_field: { kind: 'droid', head: 'keldor', pal: { o: '#1a1018', s: '#8a6a3a', S: '#6a4e2a', g: '#2a1a3a', k: '#7a5a32', c: '#8a6a3a', C: '#6a4e2a', t: '#4a3a22', b: '#3a2a1a', e: '#c070ff' } },
    vos_dark: { who: 'vos', kind: 'kiffar', pal: { o: '#08060e', s: '#6a5a6a', S: '#4a3e4c', c: '#141018', C: '#0c0a10', t: '#3a2a3a', b: '#08060a', e: '#f0d040', h: '#0c0a0e', m: '#c8a030' } }
  };

  Pix.DIRS = ['down', 'up', 'right', 'left'];
  Pix.FIELD_FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3'];
  Pix.FIELD = { w: 16, h: 24 };
  Pix.GRIDS = { HEADS, TORSO_FRONT, TORSO_SIDE, LEGS };

  const paint = (R, rows, pal, dx, dy) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        const col = pal[ch];
        if (!col) throw new Error('no colour for ' + ch);
        R.set(x + dx, y + dy, col);
      }
    });
  };

  const lekRun = (R, pal, x, y0, len, dx) => {
    for (let i = 0; i < len; i++) {
      const y = y0 + i, sx = x + (i > 5 ? dx : 0);
      R.set(sx, y, pal.o);
      R.set(sx + 1, y, pal.S);
      R.set(sx + 2, y, i < 2 ? pal.s : pal.S);
      R.set(sx + 3, y, pal.o);
    }
    const tip = y0 + len, sx = x + (len > 5 ? dx : 0);
    R.set(sx + 1, tip, pal.o);
    R.set(sx + 2, tip, pal.o);
  };

  Pix.field = (lookId, dir, frame) => {
    if (Pix.FIELD_BEASTS[lookId]) return Pix.fieldBeast(lookId, dir, frame);
    const look = Pix.LOOKS[lookId];
    const flip = dir === 'left', d = flip ? 'right' : dir, side = d === 'right';
    const R = new A.Art.Raster(16, 24), pal = look.pal;
    const step = frame === 'walk1' ? 1 : frame === 'walk3' ? 2 : 0;
    const bob = frame === 'idle1' ? 1 : 0;
    const sway = step === 1 ? 1 : step === 2 ? -1 : frame === 'idle1' ? 1 : 0;
    const lek = look.kind === 'twilek' || look.kind === 'togruta' ? LEKKU[d] : look.kind === 'nautolan' ? TENTACLES[d] : null;
    if (lek) lek.back.forEach(r => lekRun(R, pal, r[0], r[1] + bob, r[2], sway));
    let legs = side ? (step ? LEGS.sideStep : LEGS.side) : step ? LEGS.frontStep : LEGS.front;
    if (!side && step === 2) legs = legs.map(row => row.split('').reverse().join(''));
    paint(R, legs, pal, 0, 17);
    paint(R, side ? TORSO_SIDE : TORSO_FRONT, pal, 0, 10 + bob);
    paint(R, HEADS[look.head || look.kind][d], pal, 0, bob);
    if (lek) lek.front.forEach(r => lekRun(R, pal, r[0], r[1] + bob, r[2], sway));
    if (!flip) return R;
    const M = new A.Art.Raster(16, 24);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4, j = (y * 16 + 15 - x) * 4;
      M.data[j] = R.data[i];
      M.data[j + 1] = R.data[i + 1];
      M.data[j + 2] = R.data[i + 2];
      M.data[j + 3] = R.data[i + 3];
    }
    return M;
  };

  const base = { hip: [26, 40], neck: [25, 22], head: [24, 14], fknee: [22, 50], ffoot: [20, 61], bknee: [30, 50], bfoot: [32, 61], fel: [19, 30], fhand: [15, 35], bel: [30, 30], bhand: [29, 37], saber: -120, hand: 'f', lek: 0 };
  const pose = o => Object.assign({}, base, o);
  Pix.POSES = {
    idle0: pose({}),
    idle1: pose({ hip: [26, 41], neck: [25, 23], head: [24, 15], fel: [19, 31], fhand: [15, 36], bel: [30, 31], bhand: [29, 38], lek: 1 }),
    attack0: pose({ neck: [28, 23], head: [28, 15], fel: [27, 22], fhand: [32, 16], saber: -35, lek: 2 }),
    attack1: pose({ hip: [25, 41], neck: [20, 24], head: [17, 17], fknee: [17, 50], ffoot: [11, 61], bknee: [32, 52], bfoot: [39, 61], fel: [14, 27], fhand: [8, 31], bel: [27, 31], bhand: [25, 37], saber: 165, lek: -2 }),
    attack2: pose({ hip: [23, 41], neck: [19, 24], head: [17, 16], fknee: [15, 50], ffoot: [10, 61], bknee: [29, 52], bfoot: [35, 61], fel: [14, 33], fhand: [11, 42], saber: 120, lek: -1 }),
    attack3: pose({}),
    force0: pose({ fel: [15, 26], fhand: [8, 27], bel: [31, 30], bhand: [32, 36], saber: -80, hand: 'b', lek: 1 }),
    force1: pose({ hip: [25, 41], neck: [22, 23], head: [20, 15], fel: [13, 25], fhand: [5, 25], bel: [30, 30], bhand: [31, 36], saber: -80, hand: 'b', lek: 2 }),
    force2: pose({ fel: [15, 26], fhand: [8, 27], bel: [31, 30], bhand: [32, 36], saber: -80, hand: 'b', lek: 1 }),
    hurt: pose({ hip: [28, 40], neck: [30, 23], head: [32, 16], fel: [26, 30], fhand: [22, 37], bel: [34, 30], bhand: [37, 35], saber: -20, lek: 3 }),
    ko: pose({ hip: [28, 58], neck: [15, 57], head: [9, 56], fknee: [35, 58], ffoot: [41, 60], bknee: [36, 60], bfoot: [42, 61], fel: [15, 60], fhand: [21, 61], bel: [19, 61], bhand: [25, 61], saber: 0, lek: 4, down: true })
  };
  Pix.BATTLE_FRAMES = Object.keys(Pix.POSES);
  Pix.BATTLE = { w: 48, h: 64 };

  Pix.saberLine = (p, len) => {
    const hand = p.hand === 'b' ? p.bhand : p.fhand, a = p.saber * Math.PI / 180;
    return [hand, [hand[0] + Math.cos(a) * len, hand[1] + Math.sin(a) * len]];
  };

  const WEAPONS = {
    saber: { len: 5, width: 2, col: '#b0b0b8' },
    vibro: { len: 11, width: 1.5, col: '#c8ccd4', hilt: '#5a4a3a' },
    blaster: { len: 7, width: 2.6, col: '#34343c', tip: '#9a9aa4', grip: '#22222a' },
    staff: { len: 16, width: 2, col: '#7a7a6a', tip: '#c8c8b0', hilt: '#4a3a2a' }
  };
  Pix.WEAPONS = WEAPONS;

  Pix.weapon = (R, p, kind, frame) => {
    if (kind === 'none') return;
    const w = WEAPONS[kind], hand = p.hand === 'b' ? p.bhand : p.fhand;
    const deg = kind === 'blaster' ? (frame.startsWith('attack') ? 180 : 125) : p.saber, a = deg * Math.PI / 180;
    const end = [hand[0] + Math.cos(a) * w.len, hand[1] + Math.sin(a) * w.len];
    if (w.hilt) R.curve(hand, hand, [hand[0] - Math.cos(a) * 3, hand[1] - Math.sin(a) * 3], 2, w.hilt);
    if (w.grip) R.rect(hand[0] - 1, hand[1], 2, 3, w.grip);
    R.curve(hand, [(hand[0] + end[0]) / 2, (hand[1] + end[1]) / 2], end, w.width, w.col);
    if (w.tip) R.set(end[0], end[1], w.tip);
  };

  Pix.battle = (lookId, frame, weapon) => {
    const look = Pix.LOOKS[lookId], pal = look.pal, p = Pix.POSES[frame];
    const R = new A.Art.Raster(48, 64);
    const limb = (a, b2, col) => R.curve(a, [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2], b2, 4, col);
    const sh = [p.neck[0] + (p.down ? 2 : 0), p.neck[1] + 2];
    limb(sh, p.bel, pal.C);
    limb(p.bel, p.bhand, pal.C);
    R.ellipse(p.bhand[0], p.bhand[1], 2, 2, pal.s);
    limb(p.hip, p.bknee, pal.C);
    limb(p.bknee, p.bfoot, pal.C);
    R.rect(p.bfoot[0] - 3, p.bfoot[1] - 2, 5, 3, pal.b);
    if (look.kind === 'twilek') {
      const back = p.down ? [p.head[0] + 2, p.head[1] - 6] : [p.head[0] + 5, p.head[1] + 1];
      const tip = p.down ? [p.head[0] + 14, p.head[1] - 4] : [p.head[0] + 9 + p.lek, p.head[1] + 22];
      R.curve(back, [back[0] + 5, back[1] + 8], tip, t => 2.6 * (1 - t * 0.5), pal.S);
    }
    if (look.kind === 'nautolan') for (let i = 0; i < 4; i++) {
      const back = p.down ? [p.head[0] + 1 + i, p.head[1] - 5] : [p.head[0] + 2 + i * 1.5, p.head[1] - 2 + i];
      const tip = p.down ? [p.head[0] + 10 + i * 1.5, p.head[1] - 3 + i] : [p.head[0] + 4 + i * 1.5 + p.lek * 0.5, p.head[1] + 13 + i * 2];
      R.curve(back, [back[0] + 3, back[1] + 6], tip, t => 1.8 * (1 - t * 0.5), i % 2 ? pal.S : pal.s);
    }
    if (look.kind === 'togruta') for (let i = 0; i < 2; i++) {
      const back = p.down ? [p.head[0] + 2, p.head[1] - 6 + i * 2] : [p.head[0] + 4 - i * 2, p.head[1] + 1];
      const tip = p.down ? [p.head[0] + 13, p.head[1] - 4 + i * 3] : [p.head[0] + 8 - i * 3 + p.lek, p.head[1] + 20];
      const mid = [back[0] + 4, back[1] + 7];
      R.curve(back, mid, tip, t => 2.4 * (1 - t * 0.5), pal.w);
      for (const k of [0.3, 0.6, 0.85]) {
        const q = (1 - k) * (1 - k), w2 = 2 * (1 - k) * k, r2 = k * k;
        R.rect(Math.round(q * back[0] + w2 * mid[0] + r2 * tip[0]) - 1, Math.round(q * back[1] + w2 * mid[1] + r2 * tip[1]), 3, 1, pal.u);
      }
    }
    if (look.kind === 'devaronian' && !p.down) {
      R.poly([[p.head[0] - 4, p.head[1] - 5], [p.head[0] - 6, p.head[1] - 12], [p.head[0] - 1, p.head[1] - 6]], pal.k);
      R.poly([[p.head[0] + 2, p.head[1] - 6], [p.head[0] + 4, p.head[1] - 13], [p.head[0] + 5, p.head[1] - 5]], pal.k);
    }
    if ((look.kind === 'kiffar' || look.kind === 'human') && !p.down && !look.short) for (let i = 0; i < 4; i++) R.curve([p.head[0] + 2 + i, p.head[1] - 5 + i * 2], [p.head[0] + 6 + i, p.head[1] + 2 + i], [p.head[0] + 6 + i + p.lek * 0.5, p.head[1] + 12 + i], 1, pal.h);
    const dx = p.neck[0] - p.hip[0], dy = p.neck[1] - p.hip[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    R.poly([[p.hip[0] + nx * 5, p.hip[1] + ny * 5], [p.hip[0] - nx * 5, p.hip[1] - ny * 5], [p.neck[0] - nx * 6, p.neck[1] - ny * 6], [p.neck[0] + nx * 6, p.neck[1] + ny * 6]], pal.c);
    const belt = [p.hip[0] + dx * 0.15, p.hip[1] + dy * 0.15];
    R.curve([belt[0] + nx * 5, belt[1] + ny * 5], belt, [belt[0] - nx * 5, belt[1] - ny * 5], 2, pal.t);
    limb(p.hip, p.fknee, pal.c);
    limb(p.fknee, p.ffoot, pal.c);
    R.rect(p.ffoot[0] - 4, p.ffoot[1] - 2, 6, 3, pal.b);
    R.ellipse(p.neck[0] - 1, p.neck[1] - 3, 2, 3, pal.s);
    R.ellipse(p.head[0], p.head[1], 6, 7, pal.s);
    if (look.kind === 'twilek') R.rect(p.head[0] - 6, p.head[1] - 4, 12, 2, pal.t);
    if (look.kind === 'cerean' && !p.down) {
      R.ellipse(p.head[0] + 1, p.head[1] - 7, 5, 5, pal.s);
      R.rect(p.head[0] - 5, p.head[1] + 3, 6, 5, pal.h);
    }
    if (look.kind === 'togruta' && !p.down) {
      R.poly([[p.head[0] - 5, p.head[1] - 4], [p.head[0] - 9, p.head[1] - 11], [p.head[0] - 2, p.head[1] - 6]], pal.w);
      R.poly([[p.head[0] + 3, p.head[1] - 5], [p.head[0] + 6, p.head[1] - 12], [p.head[0] + 6, p.head[1] - 4]], pal.w);
      R.rect(p.head[0] - 7, p.head[1] - 8, 3, 1, pal.u);
      R.rect(p.head[0] + 4, p.head[1] - 9, 2, 1, pal.u);
    }
    if (look.kind === 'palliduvan' && !p.down) {
      R.ellipse(p.head[0] + 2, p.head[1] - 6, 3, 3, pal.h);
      R.line(p.head[0] - 2, p.head[1] - 6, p.head[0] - 6, p.head[1] - 10, pal.k);
      R.rect(p.head[0] - 7, p.head[1] - 11, 2, 2, '#d04030');
    }
    if (look.kind === 'clone' && !p.down) {
      R.ellipse(p.head[0], p.head[1], 7, 8, pal.s);
      R.rect(p.head[0] - 6, p.head[1] - 1, 7, 2, pal.g);
      R.rect(p.head[0] - 4, p.head[1] - 1, 2, 6, pal.g);
      R.rect(p.head[0] - 6, p.head[1] - 5, 12, 1, pal.t);
    }
    if (look.kind === 'falleen' && !p.down) {
      R.ellipse(p.head[0] + 3, p.head[1] - 6, 2, 2, pal.h);
      R.curve([p.head[0] + 4, p.head[1] - 6], [p.head[0] + 8, p.head[1] - 2], [p.head[0] + 7, p.head[1] + 9], 1.2, pal.h);
    }
    if (look.kind === 'kiffar' || look.kind === 'human') {
      R.ellipse(p.head[0] + 1, p.head[1] - 4, 6, 4, pal.h);
      if (!p.down && look.kind === 'kiffar') R.rect(p.head[0] - 6, p.head[1] + 1, 7, 1, pal.m);
    }
    if (look.kind === 'nikto' && !p.down) {
      for (const [dx, dy] of [[-5, -4], [-2, -7], [2, -7], [5, -4], [-6, 1]]) R.rect(p.head[0] + dx, p.head[1] + dy, 2, 2, pal.k);
      R.set(p.head[0] - 3, p.head[1] - 1, pal.e);
    } else if (look.kind === 'keldor' && !p.down) {
      R.rect(p.head[0] - 6, p.head[1] - 3, 9, 3, pal.g);
      R.rect(p.head[0] - 5, p.head[1] + 1, 8, 4, pal.k);
      R.set(p.head[0] - 4, p.head[1] - 2, '#5a5a5a');
    } else if (!p.down) R.set(p.head[0] - 3, p.head[1] - 1, pal.e);
    limb(sh, p.fel, pal.C);
    limb(p.fel, p.fhand, pal.C);
    R.ellipse(p.fhand[0], p.fhand[1], 2, 2, pal.s);
    Pix.weapon(R, p, weapon || 'saber', frame);
    R.outline(pal.o);
    return R;
  };

  Pix.BEASTS = {
    spider: { w: 32, h: 24, s: 1, pal: { shell: '#2a1e34', hi: '#4c3c60', leg: '#1c1424', far: '#140e1a', glow: '#5ad8ff', eye: '#c8f6ff', fang: '#d8d0c0' } },
    giant: { w: 80, h: 60, s: 2.5, pal: { shell: '#241a30', hi: '#48385c', leg: '#1a1222', far: '#100a16', glow: '#7ae0ff', eye: '#e8fcff', fang: '#e4d8c0' } },
    lylek: { w: 48, h: 48, s: 1, shape: 'lylek', pal: { shell: '#5a4a3a', hi: '#8a7a5a', dark: '#3a2e22', far: '#2a2018', arm: '#7a5a52', barb: '#e0d8a8', eye: '#e8c040', mouth: '#3a1414' } },
    lylek_young: { w: 40, h: 40, s: 0.8, shape: 'lylek', pal: { shell: '#6a5a40', hi: '#9a8a62', dark: '#463a28', far: '#30261a', arm: '#8a6a5a', barb: '#e8e0b0', eye: '#f0d050', mouth: '#3a1414' } },
    illusion: { w: 56, h: 54, s: 1.15, shape: 'lylek', pal: { shell: '#4a2a6a', hi: '#8a5ac0', dark: '#2a1640', far: '#1e1030', arm: '#a070d0', barb: '#e0c8ff', eye: '#ff60ff', mouth: '#1a0a24' } },
    lylek_old: { w: 72, h: 68, s: 1.45, shape: 'lylek', pal: { shell: '#4a3c30', hi: '#7a6a50', dark: '#2e241a', far: '#201810', arm: '#6a4a46', barb: '#f0e8c0', eye: '#ff9a30', mouth: '#2a0e0e' } },
    challat: { w: 44, h: 40, s: 1, shape: 'swarm', pal: { glow: '#4ac8ff', core: '#c8f4ff', dim: '#1a5a8a', wing: '#8ad8f0', jaw: '#e8f0f0' } },
    axrx: { w: 48, h: 64, s: 1, shape: 'droid', pal: { body: '#9aa4ac', dark: '#4a525a', eye: '#ff4a3a', tool: '#d8dce0', spark: '#8ae0ff' } },
    b1: { w: 32, h: 56, shape: 'b1', pal: { body: '#c8b48a', dark: '#8a7a5a', gun: '#34343a', flash: '#ff7a4a' } },
    b2: { w: 40, h: 60, shape: 'b2', pal: { body: '#5a6a7a', hi: '#7a8a9a', dark: '#2e3640', flash: '#ff7a4a' } },
    droideka: { w: 44, h: 44, shape: 'deka', pal: { body: '#9a7a4a', dark: '#5a4a30', hi: '#c8a870', gun: '#2e2a26', eye: '#e04030', flash: '#ff7a4a' } },
    geonosian: { w: 40, h: 52, shape: 'geo', pal: { body: '#8a6a3a', dark: '#5a4224', hi: '#b08a50', wing: '#c8d8c0', eye: '#e0c040', gun: '#4a4a3a', flash: '#c8f0ff' } },
    dianoga: { w: 64, h: 56, shape: 'dianoga', pal: { body: '#6a6a5a', dark: '#3a3a30', hi: '#8a8a72', eye: '#d84a2a', white: '#f0e8d0', water: '#203030', foam: '#4a6a6a' } },
    grievous: { w: 56, h: 72, shape: 'grievous', pal: { bone: '#e0d8c0', metal: '#8a8a7a', dark: '#44443c', cape: '#3a2a2a', eye: '#e0a020', gut: '#6a4a3a', saberA: '#3ad04a', saberB: '#4a8aff' } },
    secdroid: { w: 44, h: 64, shape: 'secdroid', pal: { body: '#8a8c90', dark: '#46484c', screen: '#2a4a3a', glow: '#7ae08a', claw: '#b8bcc0', flash: '#ff7a4a' } },
    acklay: { w: 64, h: 52, s: 2, pal: { shell: '#3a5a2a', hi: '#6a8a4a', leg: '#2a4020', far: '#1a2a14', glow: '#c8e070', eye: '#ff6a2a', fang: '#e8e0c0' } },
    endor_beast: { w: 76, h: 70, s: 1.5, shape: 'lylek', pal: { shell: '#2a4a2a', hi: '#5a7a4a', dark: '#1a2a1a', far: '#141e12', arm: '#6a5a4a', barb: '#e8d8c0', eye: '#ff7a2a', mouth: '#5a1a2a' } },
    turret: { w: 44, h: 44, shape: 'deka', pal: { body: '#7a7a6a', dark: '#4a4a3e', hi: '#a8a894', gun: '#2a2a26', eye: '#e04030', flash: '#ff7a4a' } },
    rakatan: { w: 44, h: 64, shape: 'secdroid', pal: { body: '#8a6a3a', dark: '#4a3a22', screen: '#2a1a3a', glow: '#c070ff', claw: '#c8a870', flash: '#d88aff' } }
  };
  const BEAST_POSES = { idle0: [0, 0, 0], idle1: [0, -0.6, 1], attack0: [-2, -2.5, 0], attack1: [5, -1, 1], attack2: [3, 0, 0], hurt: [-3, 0.5, 1], ko: [0, 0, 0] };
  Pix.BEAST_FRAMES = Object.keys(BEAST_POSES);

  Pix.lylek = (kind, frame) => {
    const B = Pix.BEASTS[kind], s = B.s, pal = B.pal, R = new A.Art.Raster(B.w, B.h);
    const ground = B.h - 2, [dx, dy, step] = BEAST_POSES[frame] || BEAST_POSES.idle0;
    const seg = (a, b2, w, col) => R.curve(a, [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2], b2, w, col);
    const lw = Math.max(1, 1.6 * s);
    if (frame === 'ko') {
      const cx = B.w * 0.46, cy = ground - 5 * s;
      for (let i = 0; i < 3; i++) seg([cx - 8 * s + i * 8 * s, cy - 2 * s], [cx - 4 * s + i * 8 * s, cy - 9 * s], lw, pal.far);
      R.curve([cx - 12 * s, cy], [cx - 22 * s, cy + s], [cx - 20 * s, ground], 2 * s, pal.dark);
      R.ellipse(cx, cy, 13 * s, 5.5 * s, pal.shell);
      R.ellipse(cx + 13 * s, cy + s, 5 * s, 4 * s, pal.shell);
      R.rect(cx - 9 * s, cy - 3 * s, 16 * s, Math.max(1, s), pal.hi);
      R.outline('#0e0806');
      return R;
    }
    const bx = B.w * 0.42 + dx * s, by = ground - 22 * s + dy * s, hx = bx + 14 * s, hy = by - 9 * s;
    const leg = (hipX, dir, near) => {
      const lift = near && step ? 2 * s : 0, col = near ? pal.dark : pal.far, off = near ? 0 : 2 * s;
      const hip = [hipX + off, by + 5 * s], knee = [hipX + off + dir * 6 * s, by - 3 * s - lift], foot = [hipX + off + dir * 9 * s, ground - lift];
      seg(hip, knee, lw, col);
      seg(knee, foot, Math.max(1, lw * 0.6), col);
    };
    for (const [x, d] of [[bx - 8 * s, -1], [bx, -0.3], [bx + 8 * s, 1]]) leg(x, d, false);
    const strike = frame === 'attack2', tip = strike ? [bx + 16 * s, by - 20 * s] : [bx - 12 * s, by - 27 * s + (frame === 'idle1' ? s : 0)];
    R.curve([bx - 11 * s, by - 2 * s], [bx - 24 * s, by - 16 * s], tip, t2 => (2.6 - t2 * 1.6) * s, pal.dark);
    R.poly([[tip[0] - 2 * s, tip[1]], [tip[0] + 2 * s, tip[1]], [tip[0] + (strike ? 6 : 1) * s, tip[1] + (strike ? 4 : -5) * s]], pal.barb);
    R.ellipse(bx, by, 13 * s, 8 * s, pal.shell);
    R.ellipse(bx - 2 * s, by - 4 * s, 9 * s, 3 * s, pal.hi);
    for (let i = -1; i <= 1; i++) R.rect(bx + i * 6 * s, by - 6 * s, Math.max(1, s * 0.8), 12 * s, pal.dark);
    const reach = frame === 'attack1' ? 9 * s : frame === 'attack0' ? -2 * s : 0;
    for (const k of [0, 1]) R.curve([hx + 3 * s, hy + 4 * s + k * s], [hx + 9 * s + reach * 0.5, hy + 10 * s + k * 2 * s], [hx + 6 * s + reach + k * 2 * s, hy + 16 * s + k * s], Math.max(1, s * 1.2), pal.arm);
    R.ellipse(hx, hy, 6.5 * s, 5 * s, pal.shell);
    R.poly([[hx - 3 * s, hy - 4 * s], [hx - 7 * s, hy - 13 * s], [hx + s, hy - 4 * s]], pal.hi);
    const open = frame === 'attack1' ? 3 * s : s;
    seg([hx + 5 * s, hy], [hx + 11 * s, hy - open], Math.max(1, s), pal.barb);
    seg([hx + 5 * s, hy + 2 * s], [hx + 11 * s, hy + 2 * s + open], Math.max(1, s), pal.barb);
    R.rect(hx + 6 * s, hy, 3 * s, Math.max(1, 2 * s), pal.mouth);
    R.rect(hx + 2 * s, hy - 2 * s, Math.max(1, 1.4 * s), Math.max(1, 1.4 * s), pal.eye);
    for (const [x, d] of [[bx - 8 * s, -1], [bx, -0.3], [bx + 8 * s, 1]]) leg(x, d, true);
    R.outline('#0e0806');
    return R;
  };

  Pix.swarm = (kind, frame) => {
    const B = Pix.BEASTS[kind], pal = B.pal, R = new A.Art.Raster(B.w, B.h);
    const [dx, dy] = BEAST_POSES[frame] || BEAST_POSES.idle0, phase = Pix.BEAST_FRAMES.indexOf(frame);
    const n = frame === 'ko' ? 7 : 18, cx = B.w / 2 + dx, cy = B.h / 2 - 4 + dy * 2;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + phase * 0.7, r = frame === 'ko' ? 3 + (i % 3) * 5 : 4 + (i * 7) % 14;
      const x = frame === 'ko' ? cx + Math.cos(a) * r * 1.4 : cx + Math.cos(a) * r, y = frame === 'ko' ? B.h - 4 - (i % 2) : cy + Math.sin(a) * r * 0.7;
      R.rect(x - 1, y, 3, 1, pal.dim);
      R.set(x, y, frame === 'ko' ? pal.dim : pal.glow);
      if (frame !== 'ko' && i % 3 === 0) { R.set(x - 1, y - 1, pal.wing); R.set(x + 1, y - 1, pal.wing); R.set(x, y + 1, pal.core); }
      if (frame.startsWith('attack') && i % 4 === 0) R.set(x + 2, y, pal.jaw);
    }
    return R;
  };

  Pix.droid = (kind, frame) => {
    const B = Pix.BEASTS[kind], pal = B.pal, R = new A.Art.Raster(B.w, B.h);
    const [dx, dy] = BEAST_POSES[frame] || BEAST_POSES.idle0, cx = 24 + dx, top = 8 + dy * 2;
    if (frame === 'ko') {
      R.rect(8, 54, 30, 6, pal.dark);
      R.rect(10, 52, 18, 4, pal.body);
      R.ellipse(36, 55, 4, 3, pal.body);
      R.outline('#0a0a0e');
      return R;
    }
    R.rect(cx - 2, top + 30, 4, 22, pal.dark);
    R.rect(cx - 8, top + 50, 16, 4, pal.dark);
    R.rect(cx - 6, top + 10, 12, 22, pal.body);
    R.rect(cx - 5, top + 14, 10, 2, pal.dark);
    R.ellipse(cx, top + 5, 6, 6, pal.body);
    R.rect(cx - 4, top + 4, 8, 2, pal.dark);
    R.rect(cx - 2, top + 4, 2, 2, pal.eye);
    const reach = frame === 'attack1' ? 8 : frame === 'attack0' ? -3 : 0;
    for (const [sy, len, side] of [[top + 13, 13, -1], [top + 18, 15, -1], [top + 15, 11, 1]]) {
      const ex = cx + side * (len + (side < 0 ? reach : 0)), ey = sy + 6;
      R.curve([cx + side * 6, sy], [cx + side * (len / 2 + 6), sy - 3], [ex, ey], 1.4, pal.dark);
      R.rect(ex - 1, ey, 3, 2, pal.tool);
    }
    if (frame === 'attack2') for (let i = 0; i < 6; i++) R.set(cx - 18 + i * 3, top + 22 + (i % 2) * 3, pal.spark);
    R.outline('#0a0a0e');
    return R;
  };

  const pose2 = frame => BEAST_POSES[frame] || BEAST_POSES.idle0;
  const beam2 = (R, a, b, col) => {
    R.curve(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b, 1.6, col);
    R.line(Math.round(a[0]), Math.round(a[1]), Math.round(b[0]), Math.round(b[1]), '#f4fff4');
  };

  Pix.b1 = (kind, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(32, 56);
    if (frame === 'ko') {
      R.rect(3, 50, 22, 3, pal.body);
      R.rect(22, 47, 7, 3, pal.body);
      R.rect(6, 47, 3, 3, pal.dark);
      R.rect(13, 46, 5, 4, pal.dark);
      R.outline('#0a0a0e');
      return R;
    }
    const [dx, dy] = pose2(frame), cx = 14 + dx, top = 6 + dy * 2;
    R.line(cx - 2, top + 28, cx - 4, top + 46, pal.body);
    R.line(cx - 1, top + 28, cx - 3, top + 46, pal.body);
    R.line(cx + 2, top + 28, cx + 4, top + 46, pal.dark);
    R.line(cx + 3, top + 28, cx + 5, top + 46, pal.dark);
    R.rect(cx - 6, top + 46, 5, 2, pal.dark);
    R.rect(cx + 3, top + 46, 5, 2, pal.dark);
    R.rect(cx - 3, top + 12, 7, 16, pal.body);
    R.rect(cx - 2, top + 15, 5, 3, pal.dark);
    R.rect(cx - 4, top + 26, 9, 3, pal.dark);
    R.line(cx, top + 8, cx, top + 12, pal.dark);
    R.poly([[cx - 2, top + 1], [cx + 2, top], [cx + 10, top + 4], [cx + 10, top + 6], [cx - 2, top + 8]], pal.body);
    R.set(cx + 2, top + 3, pal.dark);
    const aim = frame.startsWith('attack') ? 0 : 4;
    R.line(cx + 1, top + 14, cx + 7, top + 17 + aim, pal.dark);
    R.rect(cx + 6, top + 16 + aim, 10, 2, pal.gun);
    if (frame === 'attack1') R.rect(cx + 16, top + 16 + aim, 2, 2, pal.flash);
    R.outline('#0a0a0e');
    return R;
  };

  Pix.b2 = (kind, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(40, 60);
    if (frame === 'ko') {
      R.ellipse(18, 52, 13, 5, pal.body);
      R.rect(6, 54, 26, 3, pal.dark);
      R.rect(28, 48, 6, 4, pal.dark);
      R.outline('#0a0a0e');
      return R;
    }
    const [dx, dy] = pose2(frame), cx = 17 + dx, top = 4 + dy * 2;
    R.rect(cx - 13, top + 18, 5, 13, pal.dark);
    R.rect(cx - 7, top + 33, 5, 18, pal.dark);
    R.rect(cx + 2, top + 33, 5, 18, pal.dark);
    R.rect(cx - 9, top + 50, 8, 3, pal.dark);
    R.rect(cx + 1, top + 50, 8, 3, pal.dark);
    R.ellipse(cx, top + 22, 11, 12, pal.body);
    R.rect(cx - 8, top + 15, 16, 4, pal.hi);
    R.rect(cx - 3, top + 6, 7, 7, pal.body);
    R.rect(cx - 2, top + 8, 6, 1, pal.dark);
    const reach = frame === 'attack1' ? 4 : 0;
    R.rect(cx + 8, top + 17, 5, 10, pal.dark);
    R.rect(cx + 9 + reach, top + 25, 10, 6, pal.body);
    R.rect(cx + 18 + reach, top + 26, 3, 3, pal.dark);
    if (frame === 'attack1') R.rect(cx + 21 + reach, top + 26, 2, 2, pal.flash);
    R.outline('#0a0a0e');
    return R;
  };

  Pix.deka = (kind, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(44, 44);
    if (frame === 'ko') {
      R.ellipse(22, 37, 12, 6, pal.body);
      R.ellipse(20, 36, 6, 3, pal.hi);
      R.rect(10, 40, 24, 2, pal.dark);
      R.outline('#0a0a0e');
      return R;
    }
    const [dx, dy] = pose2(frame), cx = 18 + dx, top = 6 + dy;
    R.line(cx - 4, top + 22, cx - 13, top + 35, pal.dark);
    R.line(cx - 3, top + 22, cx - 12, top + 35, pal.dark);
    R.line(cx + 2, top + 22, cx + 10, top + 35, pal.dark);
    R.line(cx, top + 22, cx - 1, top + 35, pal.body);
    R.ellipse(cx - 2, top + 16, 9, 8, pal.body);
    R.ellipse(cx - 4, top + 13, 4, 3, pal.hi);
    R.ellipse(cx + 3, top + 6, 5, 4, pal.body);
    R.set(cx + 6, top + 5, pal.eye);
    R.rect(cx + 4, top + 12, 13, 3, pal.gun);
    R.rect(cx + 4, top + 18, 13, 3, pal.gun);
    if (frame === 'attack1') {
      R.rect(cx + 17, top + 12, 2, 2, pal.flash);
      R.rect(cx + 17, top + 18, 2, 2, pal.flash);
    }
    R.outline('#0a0a0e');
    return R;
  };

  Pix.geo = (kind, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(40, 52);
    if (frame === 'ko') {
      R.ellipse(18, 46, 10, 3, pal.body);
      R.poly([[8, 44], [2, 38], [12, 42]], pal.wing);
      R.ellipse(29, 45, 4, 3, pal.body);
      R.outline('#0a0a0e');
      return R;
    }
    const [dx, dy, step] = pose2(frame), cx = 18 + dx, top = 6 + dy * 2, flap = step ? 5 : 0;
    R.poly([[cx - 2, top + 14], [cx - 17, top + 1 + flap], [cx - 12, top + 21]], pal.wing);
    R.poly([[cx - 1, top + 16], [cx - 14, top + 8 - flap], [cx - 8, top + 24]], pal.hi);
    R.line(cx - 1, top + 30, cx - 4, top + 44, pal.dark);
    R.line(cx + 2, top + 30, cx + 4, top + 44, pal.dark);
    R.line(cx - 4, top + 44, cx - 7, top + 46, pal.dark);
    R.line(cx + 4, top + 44, cx + 7, top + 46, pal.dark);
    R.ellipse(cx, top + 23, 5, 9, pal.body);
    R.ellipse(cx + 1, top + 20, 3, 6, pal.hi);
    R.ellipse(cx + 3, top + 9, 5, 4, pal.body);
    R.rect(cx + 5, top + 7, 2, 2, pal.eye);
    R.line(cx + 2, top + 16, cx + 9, top + 20, pal.dark);
    R.rect(cx + 8, top + 19, 9, 3, pal.gun);
    if (frame === 'attack1') for (let i = 0; i < 3; i++) R.set(cx + 19 + i * 2, top + 20 + (i % 2), pal.flash);
    R.outline('#0a0a0e');
    return R;
  };

  Pix.dianoga = (kind, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(64, 56), base = 44;
    R.dither(0, base, 64, 12, [pal.water, '#142222', pal.water]);
    if (frame === 'ko') {
      for (let i = 0; i < 5; i++) R.rect(10 + i * 10, base + 2 + (i % 2), 6, 1, pal.foam);
      R.ellipse(40, base + 1, 4, 2, pal.white);
      return R;
    }
    const [dx, dy, step] = pose2(frame), cx = 28 + dx, sway = step ? 3 : -2, reach = frame === 'attack1' ? 10 : frame === 'attack0' ? -4 : 0;
    R.ellipse(cx, base, 17, 6, pal.body);
    R.ellipse(cx - 3, base - 2, 9, 3, pal.hi);
    for (let i = 0; i < 4; i++) {
      const sx = cx - 13 + i * 8, up = 30 + (i % 2) * 7;
      R.curve([sx, base - 2], [sx - 6 + i * 4 + sway, base - up / 2], [sx + 4 + i * 3 + (i === 3 ? reach : 0), base - up + dy * 2], t => 3.2 * (1 - t * 0.65), i % 2 ? pal.body : pal.dark);
    }
    R.curve([cx + 6, base - 3], [cx + 10 + sway, base - 22], [cx + 12, base - 38 + dy * 2], 2.6, pal.body);
    R.ellipse(cx + 12, base - 40 + dy * 2, 4, 4, pal.white);
    R.ellipse(cx + 13, base - 40 + dy * 2, 2, 2, pal.eye);
    for (let i = 0; i < 6; i++) R.rect(4 + i * 10, base + 1 + (i % 2), 5, 1, pal.foam);
    R.outline('#0a0a0e');
    return R;
  };

  Pix.grievous = (kind, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(56, 72);
    if (frame === 'ko') {
      R.rect(6, 64, 40, 4, pal.metal);
      R.ellipse(44, 63, 5, 4, pal.bone);
      R.outline('#0a0a0e');
      return R;
    }
    const [dx, dy] = pose2(frame), cx = 24 + dx, top = 4 + dy * 2;
    R.poly([[cx - 6, top + 16], [cx + 5, top + 16], [cx + 8, top + 54], [cx - 15, top + 56]], pal.cape);
    R.line(cx - 3, top + 40, cx - 8, top + 53, pal.metal);
    R.line(cx - 8, top + 53, cx - 5, top + 65, pal.metal);
    R.line(cx + 3, top + 40, cx + 9, top + 52, pal.metal);
    R.line(cx + 9, top + 52, cx + 7, top + 65, pal.metal);
    R.rect(cx - 9, top + 65, 7, 2, pal.dark);
    R.rect(cx + 5, top + 65, 7, 2, pal.dark);
    R.rect(cx - 4, top + 16, 9, 23, pal.bone);
    for (let i = 0; i < 4; i++) R.rect(cx - 3, top + 19 + i * 4, 7, 1, pal.dark);
    R.ellipse(cx, top + 31, 3, 4, pal.gut);
    R.rect(cx - 1, top + 11, 3, 5, pal.metal);
    R.ellipse(cx + 2, top + 7, 5, 7, pal.bone);
    R.rect(cx + 3, top + 5, 3, 2, pal.eye);
    R.rect(cx, top + 5, 2, 2, pal.eye);
    R.rect(cx + 1, top + 11, 4, 1, pal.dark);
    const a = frame === 'attack1' ? 0.2 : frame === 'attack0' ? -1.4 : frame === 'attack2' ? 0.9 : -0.6;
    const h1 = [cx + 12, top + 25], h2 = [cx + 9, top + 30];
    R.line(cx + 3, top + 18, h1[0], h1[1], pal.metal);
    R.line(cx + 2, top + 22, h2[0], h2[1], pal.metal);
    beam2(R, h1, [h1[0] + Math.cos(a) * 18, h1[1] + Math.sin(a) * 18], pal.saberA);
    beam2(R, h2, [h2[0] + Math.cos(a + 0.9) * 17, h2[1] + Math.sin(a + 0.9) * 17], pal.saberB);
    R.outline('#0a0a0e');
    return R;
  };

  Pix.secdroid = (kind, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(44, 64);
    if (frame === 'ko') {
      R.rect(4, 57, 30, 4, pal.body);
      R.rect(30, 53, 8, 6, pal.dark);
      R.rect(32, 55, 4, 2, pal.screen);
      R.outline('#0a0a0e');
      return R;
    }
    const [dx, dy] = pose2(frame), cx = 20 + dx, top = 4 + dy * 2;
    R.line(cx - 3, top + 34, cx - 6, top + 56, pal.dark);
    R.line(cx - 2, top + 34, cx - 5, top + 56, pal.dark);
    R.line(cx + 3, top + 34, cx + 5, top + 56, pal.dark);
    R.line(cx + 4, top + 34, cx + 6, top + 56, pal.dark);
    R.rect(cx - 9, top + 56, 6, 3, pal.dark);
    R.rect(cx + 3, top + 56, 6, 3, pal.dark);
    R.rect(cx - 6, top + 14, 13, 20, pal.body);
    R.rect(cx - 4, top + 18, 9, 2, pal.dark);
    R.rect(cx - 5, top + 2, 11, 10, pal.body);
    R.rect(cx - 3, top + 4, 7, 6, pal.screen);
    R.rect(cx - 1, top + 6, 3, 2, pal.glow);
    const reach = frame === 'attack1' ? 5 : 0;
    R.line(cx + 6, top + 16, cx + 14 + reach, top + 22, pal.dark);
    for (let i = 0; i < 3; i++) R.rect(cx + 13 + reach, top + 20 + i * 2, 7, 1, pal.dark);
    if (frame === 'attack1') R.rect(cx + 20 + reach, top + 21, 2, 3, pal.flash);
    R.line(cx - 6, top + 16, cx - 12, top + 26, pal.dark);
    R.poly([[cx - 14, top + 25], [cx - 9, top + 27], [cx - 13, top + 31]], pal.claw);
    R.outline('#0a0a0e');
    return R;
  };

  Pix.beast = (kind, frame) => {
    const shape = Pix.BEASTS[kind].shape;
    if (shape && Pix[shape] && ['b1', 'b2', 'deka', 'geo', 'dianoga', 'grievous', 'secdroid'].includes(shape)) return Pix[shape](kind, frame);
    if (Pix.BEASTS[kind].shape === 'lylek') return Pix.lylek(kind, frame);
    if (Pix.BEASTS[kind].shape === 'droid') return Pix.droid(kind, frame);
    if (Pix.BEASTS[kind].shape === 'swarm') return Pix.swarm(kind, frame);
    const B = Pix.BEASTS[kind], s = B.s, pal = B.pal, R = new A.Art.Raster(B.w, B.h);
    const ground = B.h - 2, [dx, dy, step] = BEAST_POSES[frame] || BEAST_POSES.idle0;
    const seg = (a, b2, w, col) => R.curve(a, [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2], b2, w, col);
    const lw = Math.max(1, 1.1 * s), dot = Math.max(1, s * 0.8);
    if (frame === 'ko') {
      const cx = B.w * 0.5, cy = ground - 3 * s;
      for (let i = 0; i < 4; i++) {
        const jx = cx + (i - 1.5) * 3 * s, side = i < 2 ? -1 : 1;
        seg([jx, cy - 2 * s], [jx + side * 2 * s, cy - 6 * s], lw, pal.leg);
        seg([jx + side * 2 * s, cy - 6 * s], [jx + side * s, cy - 8 * s], lw, pal.leg);
      }
      R.ellipse(cx - 3 * s, cy, 7 * s, 3.5 * s, pal.shell);
      R.ellipse(cx + 5 * s, cy + 0.5 * s, 4 * s, 2.5 * s, pal.shell);
      R.rect(cx - 6 * s, cy - s, 6 * s, Math.max(1, s * 0.6), pal.hi);
      R.outline('#0a0610');
      return R;
    }
    const cx = B.w * 0.45 + dx * s, cy = ground - 9 * s + dy * s;
    const leg = (i, near) => {
      const jx = cx + (i - 1.5) * 3.2 * s + (near ? 0 : s), jy = cy + 1.5 * s;
      const dir = i < 2 ? -1 : 1, lift = (i + step) % 2 ? 1.2 : 0;
      const knee = [jx + dir * 4 * s, cy - 4 * s - lift * s], foot = [jx + dir * (near ? 7.5 : 6.5) * s, ground - lift * s];
      const col = near ? pal.leg : pal.far;
      seg([jx, jy], knee, lw, col);
      seg(knee, foot, lw, col);
    };
    for (let i = 0; i < 4; i++) leg(i, false);
    R.ellipse(cx - 5 * s, cy - s, 7 * s, 5.5 * s, pal.shell);
    R.ellipse(cx - 6 * s, cy - 3.5 * s, 4 * s, 2 * s, pal.hi);
    R.ellipse(cx + 4 * s, cy + 0.5 * s, 4.5 * s, 3.5 * s, pal.shell);
    for (let i = 0; i < 3; i++) R.rect(cx - 9 * s + i * 3 * s, cy - (1 + (i % 2)) * s, dot, dot, pal.glow);
    R.rect(cx - 8 * s, cy + 2 * s, 6 * s, Math.max(1, s * 0.5), pal.glow);
    R.rect(cx + 6.5 * s, cy - 1.2 * s, dot, dot, pal.eye);
    R.rect(cx + 5 * s, cy - 1.8 * s, Math.max(1, s * 0.6), Math.max(1, s * 0.6), pal.eye);
    seg([cx + 7.5 * s, cy + 1.5 * s], [cx + 9 * s, cy + 3.8 * s], dot, pal.fang);
    seg([cx + 6.5 * s, cy + 2 * s], [cx + 7.4 * s, cy + 4.2 * s], dot, pal.fang);
    for (let i = 0; i < 4; i++) leg(i, true);
    R.outline('#0a0610');
    return R;
  };

  Pix.FIELD_BEASTS = { spider: true, lylek: true, acklay: true };

  Pix.turn = (R, dir) => {
    if (dir === 'right') return R;
    const side = dir === 'left', W = side ? R.w : R.h, H = side ? R.h : R.w, O = new A.Art.Raster(W, H);
    for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) {
      const i = (y * R.w + x) * 4;
      if (!R.data[i + 3]) continue;
      const [nx, ny] = dir === 'left' ? [R.w - 1 - x, y] : dir === 'down' ? [R.h - 1 - y, x] : [y, R.w - 1 - x];
      const j = (ny * W + nx) * 4;
      for (let k = 0; k < 4; k++) O.data[j + k] = R.data[i + k];
    }
    return O;
  };

  Pix.fieldLylek = (dir, frame) => {
    const pal = Pix.BEASTS.lylek.pal, R = new A.Art.Raster(24, 20);
    const step = frame.startsWith('walk') ? (+frame.slice(4)) % 2 : frame === 'idle1' ? 1 : 0;
    for (let i = 0; i < 3; i++) {
      const jx = 6 + i * 4, k = (i + step) % 2 ? 1 : -1;
      for (const side of [-1, 1]) {
        R.line(jx, 10 + side * 3, jx + (i - 1) * 2 + k, 10 + side * 8, pal.dark);
        R.set(jx + (i - 1) * 2 + k, 10 + side * 9, pal.barb);
      }
    }
    R.line(3, 10, 1, 7, pal.dark);
    R.line(1, 7, 2, 4, pal.dark);
    R.set(2, 3, pal.barb);
    R.ellipse(10, 10, 7, 4.5, pal.shell);
    R.ellipse(9, 9, 4.5, 2, pal.hi);
    for (const x of [7, 10, 13]) R.line(x, 7, x, 13, pal.dark);
    R.ellipse(18, 10, 3, 2.5, pal.shell);
    R.set(19, 9, pal.eye);
    R.set(19, 11, pal.eye);
    const w = step ? 1 : 0;
    R.line(21, 9, 23, 8 - w, pal.arm);
    R.line(21, 11, 23, 12 + w, pal.arm);
    R.outline('#0e0806');
    return Pix.turn(R, dir);
  };

  Pix.fieldBeast = (kind, dir, frame) => {
    if (kind === 'lylek') return Pix.fieldLylek(dir, frame);
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(22, 18);
    const step = frame.startsWith('walk') ? (+frame.slice(4)) % 2 : frame === 'idle1' ? 1 : 0;
    for (let i = 0; i < 4; i++) {
      const jx = Math.round(7 + i * 2.5), back = i < 2 ? -1 : 1, k = (i + step) % 2 ? 1 : -1;
      for (const side of [-1, 1]) {
        const knee = [jx + back * 2, 9 + side * 5], foot = [jx + back * 4 + k, 9 + side * 8];
        R.line(jx, 9 + side * 2, knee[0], knee[1], pal.leg);
        R.line(knee[0], knee[1], foot[0], foot[1], pal.leg);
      }
    }
    R.ellipse(8, 9, 5, 4, pal.shell);
    R.ellipse(7, 8, 2.5, 1.5, pal.hi);
    R.ellipse(14.5, 9, 3, 2.6, pal.shell);
    for (const [x, y] of [[5, 9], [8, 11], [10, 7]]) R.set(x, y, pal.glow);
    R.set(16, 8, pal.eye);
    R.set(16, 10, pal.eye);
    R.outline('#0a0610');
    return Pix.turn(R, dir);
  };

  const ICON = (col, rows) => ({ col, rows });
  Pix.ICONS = {
    blade: ICON('#ff7a6a', ['......#', '.....#.', '....#..', '...#...', '..#....', '.o.....', 'o......']),
    strike: ICON('#f0c870', ['...#...', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '...#...']),
    blaster: ICON('#ff5a48', ['.......', '.......', '..####.', '#######', '..####.', '.......', '.......']),
    ion: ICON('#7ab8ff', ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..']),
    shock: ICON('#c8a8ff', ['....##.', '...##..', '..##...', '.#####.', '...##..', '..##...', '.##....']),
    mind: ICON('#f4a8e4', ['.......', '..###..', '.#...#.', '#..#..#', '.#...#.', '..###..', '.......']),
    poison: ICON('#7ad86a', ['...#...', '..###..', '..###..', '.#####.', '.#####.', '..###..', '.......']),
    stun: ICON('#f8e070', ['...#...', '#..#..#', '.#####.', '..###..', '.#####.', '#..#..#', '...#...']),
    fear: ICON('#b898e8', ['..###..', '.#...#.', '....#..', '...#...', '...#...', '.......', '...#...']),
    blind: ICON('#d0d0d0', ['#.....#', '.####..', '#.#.#.#', '#..#..#', '#.#.#.#', '..###..', '#.....#']),
    rage: ICON('#ff4a3a', ['.#...#.', '.#...#.', '.#...#.', '.#...#.', '.#...#.', '.......', '.#...#.']),
    calm: ICON('#8ad0ff', ['.......', '.##....', '#..#..#', '....##.', '.##....', '#..#..#', '....##.']),
    disarmed: ICON('#e0a070', ['#.....#', '.#...#.', '..###..', '.#####.', '..###..', '.#...#.', '#.....#']),
    breach: ICON('#ffa040', ['.#####.', '#..#..#', '#.#...#', '#..#..#', '#...#.#', '.#.#.#.', '..###..']),
    deflect: ICON('#ff8070', ['..###..', '.#...#.', '#.....#', '#.....#', '.......', '.......', '.......']),
    evade: ICON('#a8e8c8', ['..###..', '.#...#.', '#..##.#', '#.#..##', '#..#...', '.#.....', '..##...']),
    guard: ICON('#c8c8d8', ['#######', '#.....#', '#.....#', '.#...#.', '.#...#.', '..#.#..', '...#...']),
    saberOff: ICON('#a0a0a8', ['......#', '.....#.', '.......', '...#...', '..#....', '.o.....', 'o......']),
    slow: ICON('#d8b070', ['#######', '.#...#.', '..#.#..', '...#...', '..###..', '.#####.', '#######']),
    rooted: ICON('#a8d070', ['...#...', '..###..', '...#...', '.#.#.#.', '..###..', '.#.#.#.', '#..#..#']),
    light: ICON('#ffe8a0', ['...#...', '.#.#.#.', '..###..', '###.###', '..###..', '.#.#.#.', '...#...']),
    suppressed: ICON('#e0b020', ['#.#.#.#', '.......', '#.#.#.#', '.......', '..###..', '.#...#.', '#.....#']),
    cover: ICON('#e0b020', ['.#####.', '#######', '#######', '#######', '.#####.', '..###..', '...#...']),
    hacked: ICON('#7ae0ff', ['#.#.#.#', '.#####.', '##...##', '.#.#.#.', '##...##', '.#####.', '#.#.#.#'])
  };

  Pix.icon = id => {
    const ic = Pix.ICONS[id], R = new A.Art.Raster(7, 7);
    ic.rows.forEach((row, y) => {
      for (let x = 0; x < 7; x++) if (row[x] !== '.') R.set(x, y, row[x] === 'o' ? '#8a8a94' : ic.col);
    });
    return R;
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
