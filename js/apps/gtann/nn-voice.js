(function (N) {
  'use strict';

  const word = s => new RegExp('(?<![А-Яа-яЁёA-Za-z])' + s + '(?![А-Яа-яЁёA-Za-z])', 'g');
  const SAY = [
    [/[«»"]/g, ''], [/…/g, '...'], [/\s—\s/g, ', '], [/\+/g, ''],
    [word('СВД'), 'эс-вэ-дэ'], [word('ПМ'), 'пэ-эм'], [word('АК'), 'а-ка'], [word('ДК'), 'дэ-ка'], [word('ГАИ'), 'гаи'], [word('ОВД'), 'о-вэ-дэ'],
    [word('ГСК'), 'гэ-эс-ка'], [word('ОМОН'), 'омон'], [word('ФСБ'), 'эф-эс-бэ'], [word('МВД'), 'эм-вэ-дэ'], [word('БТР'), 'бэ-тэ-эр'], [word('РПГ'), 'эр-пэ-гэ'],
    [word('ГАЗ'), 'газ'], [word('ГАЗа'), 'газа'], [word('ГАЗе'), 'газе'], [word('ГАЗу'), 'газу'], [word('ГАЗом'), 'газом'], [word('ВАЗ'), 'ваз'],
    [word('Ф-1'), 'эф-один'], [word('ЗМЗ'), 'зэ-эм-зэ'], [word('УАЗ'), 'уаз'], [word('ДПС'), 'дэ-пэ-эс']
  ];
  const clean = t => SAY.reduce((s, [re, to]) => s.replace(re, to), String(t));
  N.voiceText = clean;

  const FEM = [/svetlana|светлана/i, /dariya|daria|дария/i, /irina|ирина/i, /ekaterina|екатерина/i, /female|жен/i];
  const PREF = { m: [/dmitry|дмитрий/i, /pavel|павел/i, /maxim|максим|yuri|юрий|male|муж/i], f: FEM };
  const isFem = v => FEM.some(re => re.test(v.name));
  const isNat = v => /natural|online|neural/i.test(v.name);

  class Voice {
    constructor() {
      this.ok = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
      this.on = true;
      this.vol = 0.9;
      this.list = [];
      this.cache = {};
      this.cur = null;
      this.keep = [];
      if (this.ok) {
        this.load();
        try { speechSynthesis.addEventListener('voiceschanged', () => this.load()); } catch (e) { }
      }
    }

    load() {
      try { this.list = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang)); } catch (e) { this.list = []; }
      this.cache = {};
    }

    pick(g, nat) {
      const key = g + (nat ? 'n' : '');
      if (this.cache[key] !== undefined) return this.cache[key];
      const fits = x => (g === 'f' ? isFem(x) : !isFem(x));
      const pool = this.list.filter(fits);
      const groups = nat ? [pool.filter(isNat), pool.filter(x => !isNat(x))] : [pool.filter(x => !isNat(x)), pool.filter(isNat)];
      let v = null;
      for (const grp of groups) {
        for (const re of PREF[g]) { v = grp.find(x => re.test(x.name)); if (v) break; }
        if (!v && grp.length) v = grp[0];
        if (v) break;
      }
      v = v || this.list[0] || null;
      this.cache[key] = v;
      return v;
    }

    profile(sub) {
      const ch = N.CHARS[sub.who];
      if (ch && ch.voice) return ch.voice;
      if (N.VOICES && N.VOICES[sub.who]) return N.VOICES[sub.who];
      const male = sub.look ? sub.look.male !== false : true;
      const h = N.hash2(sub.text.length, sub.text.charCodeAt(0) || 0, 3);
      return { g: male ? 'm' : 'f', pitch: male ? 0.84 + h * 0.3 : 1.04 + h * 0.24, rate: 1.02 + h * 0.12 };
    }

    speak(sub) {
      if (!this.ok || !this.on || this.vol <= 0.01 || !sub.text) return null;
      if (!this.list.length) this.load();
      if (!this.list.length) return null;
      try {
        const pr = this.profile(sub);
        const v = this.pick(pr.g, !!pr.nat);
        const u = new SpeechSynthesisUtterance(clean(sub.text));
        u.lang = 'ru-RU';
        if (v) u.voice = v;
        let pitch = pr.pitch || 1;
        if (v && pr.g === 'm' && isFem(v)) pitch *= 0.6;
        if (v && pr.g === 'f' && !isFem(v)) pitch *= 1.4;
        u.pitch = N.clamp(pitch, 0.1, 2);
        u.rate = N.clamp((pr.rate || 1) * (sub.via ? 1.04 : 1), 0.5, 2);
        u.volume = N.clamp(this.vol * (sub.prio === 0 ? 0.7 : 1) * (sub.via ? 0.85 : 1), 0, 1);
        const h = { u, done: false, started: false, t0: Date.now() };
        u.onstart = () => { h.started = true; };
        u.onend = () => { h.done = true; this.forget(u); };
        u.onerror = () => { h.done = true; this.forget(u); };
        if (this.cur && !this.cur.done) speechSynthesis.cancel();
        this.keep.push(u);
        speechSynthesis.speak(u);
        this.cur = h;
        return h;
      } catch (e) {
        this.ok = false;
        return null;
      }
    }

    alive(h) {
      if (!h || h.done) return !!h;
      if (!h.started && Date.now() - h.t0 > 1500) { h.done = true; h.dead = true; return false; }
      return true;
    }

    forget(u) { const i = this.keep.indexOf(u); if (i >= 0) this.keep.splice(i, 1); }

    stop() {
      if (this.cur) this.cur.done = true;
      this.cur = null;
      if (!this.ok) return;
      try { speechSynthesis.cancel(); } catch (e) { }
      this.keep.length = 0;
    }
  }
  N.Voice = Voice;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
