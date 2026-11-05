(function (H) {
  'use strict';

  const ELEM_SET = { phys: 'champion', fire: 'firesmith', ice: 'glacial', elec: 'thunder', wind: 'eagle', quant: 'genius', imag: 'wastelander' };

  const PRESETS = {
    crit: { set: 'elem', planar: 'station', subs: ['critR', 'critD', 'atkP', 'spd'], mains: { body: ['critR', 'critD'], feet: ['spd', 'atkP'], sphere: ['elem', 'atkP'], rope: ['atkP', 'err'] } },
    burst: { set: 'elem', planar: 'station', subs: ['critR', 'critD', 'atkP', 'spd'], mains: { body: ['critR', 'critD'], feet: ['spd', 'atkP'], sphere: ['elem', 'atkP'], rope: ['atkP', 'err'] } },
    dot: { set: 'elem', planar: 'station', subs: ['atkP', 'ehr', 'spd', 'critR'], mains: { body: ['atkP', 'ehr'], feet: ['spd', 'atkP'], sphere: ['elem', 'atkP'], rope: ['atkP', 'err'] } },
    brk: { set: 'thief', planar: 'station', subs: ['breakE', 'spd', 'atkP', 'critR'], mains: { body: ['atkP', 'critR'], feet: ['spd', 'atkP'], sphere: ['elem', 'atkP'], rope: ['breakE', 'err'] } },
    hp: { set: 'elem', planar: 'station', subs: ['critR', 'critD', 'hpP', 'spd'], mains: { body: ['critR', 'critD', 'hpP'], feet: ['spd', 'hpP'], sphere: ['elem', 'hpP'], rope: ['hpP', 'err'] } },
    amp: { set: 'musketeer', planar: 'vonwacq', subs: ['spd', 'hpP', 'defP', 'res'], mains: { body: ['hpP', 'defP', 'critD'], feet: ['spd'], sphere: ['hpP', 'defP'], rope: ['err'] } },
    ampbrk: { set: 'thief', planar: 'vonwacq', subs: ['breakE', 'spd', 'hpP', 'res'], mains: { body: ['hpP', 'defP'], feet: ['spd'], sphere: ['hpP', 'defP'], rope: ['breakE', 'err'] } },
    debuff: { set: 'musketeer', planar: 'vonwacq', subs: ['spd', 'ehr', 'hpP', 'atkP'], mains: { body: ['ehr', 'critR'], feet: ['spd'], sphere: ['elem', 'hpP', 'defP'], rope: ['err', 'atkP'] } },
    heal: { set: 'passerby', planar: 'vonwacq', subs: ['spd', 'hpP', 'defP', 'res'], mains: { body: ['healP', 'hpP'], feet: ['spd', 'hpP'], sphere: ['hpP'], rope: ['err', 'hpP'] } },
    shield: { set: 'knight', planar: 'vonwacq', subs: ['spd', 'defP', 'hpP', 'res'], mains: { body: ['defP', 'ehr'], feet: ['spd', 'defP'], sphere: ['defP', 'hpP'], rope: ['defP', 'err'] } },
    elation: { set: 'elem', planar: 'vonwacq', subs: ['spd', 'critR', 'critD', 'atkP'], mains: { body: ['critR', 'critD'], feet: ['spd', 'atkP'], sphere: ['elem', 'atkP'], rope: ['atkP', 'err'] } }
  };

  const BUILD_OF = {
    trail: 'crit', trail_p: 'shield', march: 'shield', danheng: 'crit', himeko: 'crit', welt: 'debuff', natasha: 'heal', serval: 'dot', asta: 'amp', arlan: 'crit',
    herta: 'crit', gepard: 'shield', bronya: 'amp', seele: 'crit', sampo: 'dot', hook: 'crit', pela: 'debuff', ruanmei: 'ampbrk', kafka: 'dot', silverwolf: 'debuff',
    blade: 'hp', bailu: 'heal', yanqing: 'crit', clara: 'crit', miyabi: 'crit', yanagi: 'dot', phrolova: 'crit', scar: 'crit', kazuma: 'elation', aqua: 'heal',
    megumin: 'burst', darkness: 'shield', yu: 'crit', yosuke: 'debuff', chie: 'crit', yukiko: 'heal', kanji: 'crit', rise: 'amp', lynx: 'heal', luka: 'dot',
    sushang: 'crit', xueyi: 'brk', tingyun: 'amp', hanya: 'amp', qingque: 'crit', yukong: 'amp', guinaifen: 'dot', makoto: 'crit', amanda: 'shield', talleah: 'crit',
    billy: 'crit', nicole: 'debuff', anby: 'crit', jingyuan: 'crit', luocha: 'heal', imbibitor: 'crit', fuxuan: 'amp', jingliu: 'crit', topaz: 'crit', huohuo: 'heal',
    argenti: 'crit', ratio: 'crit'
  };

  const PATH_PRESET = { destruction: 'crit', hunt: 'crit', erudition: 'crit', remembrance: 'crit', elation: 'elation', harmony: 'amp', nihility: 'debuff', preservation: 'shield', abundance: 'heal' };

  const guideBuild = kit => {
    const ch = H.CHARS[kit], p = PRESETS[BUILD_OF[kit] || PATH_PRESET[ch.path] || 'crit'], ep = ch.elem + 'P';
    const mains = { head: ['hpF'], hands: ['atkF'] };
    for (const [sl, arr] of Object.entries(p.mains || {})) mains[sl] = arr.map(m => m === 'elem' ? ep : m);
    return { preset: BUILD_OF[kit] || PATH_PRESET[ch.path], set: p.set === 'elem' ? ELEM_SET[ch.elem] : p.set, planar: p.planar, subs: p.subs, mains };
  };

  Object.assign(H, { GUIDE_BUILD_OF: BUILD_OF, GUIDE_PRESETS: PRESETS, guideBuild });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
