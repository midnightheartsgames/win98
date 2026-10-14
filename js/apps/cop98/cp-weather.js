(function (C) {
  'use strict';
  const { clamp, lerp, smoothstep, wrapAngle } = C;
  const DT = C.DT;

  const WEATHER = {
    clear: {
      name: 'Ясно', cover: 0.22, dark: 0.05, cirrus: 0.75, rain: 0, fog: 0, wind: 2.5, span: [90, 220],
      desc: 'Высокое небо, редкие кучевые облака и перистые полосы. Видно далеко, и вас тоже видно издалека.'
    },
    cloudy: {
      name: 'Пасмурно', cover: 0.9, dark: 0.55, cirrus: 0.1, rain: 0, fog: 0.12, wind: 5, span: [60, 160],
      desc: 'Низкий серый потолок, плоский холодный свет, тени пропадают. Облака быстро ползут с запада.'
    },
    rain: {
      name: 'Дождь', cover: 1, dark: 0.82, cirrus: 0, rain: 1, fog: 0.4, wind: 8, span: [40, 110],
      desc: 'Сплошные тучи, ливень, лужи на дорогах и гроза вдали. Дождь глушит шаги, а сквозь пелену враги видят хуже.'
    },
    fog: {
      name: 'Туман', cover: 0.55, dark: 0.3, cirrus: 0, rain: 0, fog: 1, wind: 0.8, span: [40, 120],
      desc: 'Молочный туман лежит в низинах и над водой, холмы торчат из него, как острова. Подкрасться легко, но и мутанта заметишь в последний момент.'
    }
  };
  const WEATHER_KINDS = Object.keys(WEATHER);
  const NEXT = {
    clear: [['clear', 3], ['cloudy', 4], ['fog', 1]],
    cloudy: [['clear', 3], ['cloudy', 1], ['rain', 3], ['fog', 1]],
    rain: [['cloudy', 5], ['rain', 1], ['fog', 2]],
    fog: [['clear', 3], ['cloudy', 3]]
  };
  const CALM = { phase: 'none', t: 0 };
  const BLEND = [['cloud', 'cover', 0.03], ['dark', 'dark', 0.03], ['cirrus', 'cirrus', 0.02], ['fogK', 'fog', 0.025], ['wind', 'wind', 0.05]];

  function makeWeather(kind = 'clear') {
    const T = WEATHER[kind] || WEATHER.clear;
    return {
      kind: WEATHER[kind] ? kind : 'clear', t: 0, next: 60, hold: false,
      cloud: T.cover, dark: T.dark, cirrus: T.cirrus, rain: T.rain, fogK: T.fog, wind: T.wind,
      windDir: 0.6, wet: T.rain ? 0.8 : 0, cloudX: 0, cloudY: 0
    };
  }

  const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const scaleC = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const toC = a => C.rgb(a[0], a[1], a[2]);

  Object.assign(C.Game.prototype, {
    normalizeWeather() {
      const w = this.weather || {}, base = makeWeather(WEATHER[w.kind] ? w.kind : 'clear');
      for (const k of Object.keys(base)) if (typeof w[k] !== typeof base[k] || (typeof w[k] === 'number' && !Number.isFinite(w[k]))) w[k] = base[k];
      w.kind = base.kind;
      this.weather = w;
      return w;
    },

    pickNextWeather() {
      const h = this.hour(), morning = h > 3 && h < 9.5, midday = h > 11 && h < 18.5;
      const pool = NEXT[this.weather.kind].map(([id, wt]) => [id, id === 'fog' ? wt * (morning ? 3 : midday ? 0.3 : 1) : wt]);
      const total = pool.reduce((s, [, wt]) => s + wt, 0);
      let r = this.rng() * total;
      for (const [id, wt] of pool) { r -= wt; if (r <= 0) return id; }
      return pool[0][0];
    },

    setWeather(kind, opts = {}) {
      const T = WEATHER[kind];
      if (!T) return false;
      const w = this.weather;
      w.kind = kind; w.t = 0;
      w.next = T.span[0] + this.rng() * (T.span[1] - T.span[0]);
      if (opts.hold != null) w.hold = !!opts.hold;
      if (opts.instant) {
        for (const [key, src] of BLEND) w[key] = T[src];
        w.rain = T.rain;
        if (T.rain) w.wet = Math.max(w.wet, 0.8);
      }
      return true;
    },

    updateWeather() {
      const w = this.weather, fast = this.player.sleepT > 0 ? 120 : 1, dt = DT * fast;
      w.t += dt * C.GAME_MIN_PER_SEC;
      if (!w.hold && w.t > w.next) this.setWeather(this.pickNextWeather());
      const T = WEATHER[w.kind];
      for (const [key, src, rate] of BLEND) w[key] += (T[src] - w[key]) * Math.min(1, dt * rate);
      const gate = smoothstep(0.72, 0.95, w.cloud);
      w.rain += (T.rain * gate - w.rain) * Math.min(1, dt * 0.06);
      if (w.rain > 0.05) w.wet = Math.min(1, w.wet + w.rain * dt / 45);
      else w.wet = Math.max(0, w.wet - dt / (180 + w.cloud * 420));
      w.windDir = wrapAngle(0.6 + Math.sin(this.realTime * 0.0021) * 0.7 + Math.sin(this.realTime * 0.00053) * 0.9);
      const push = (this.emission.phase === 'none' ? 1 : 5) * w.wind * dt / 1000;
      w.cloudX = (w.cloudX + Math.cos(w.windDir) * push) % 1000;
      w.cloudY = (w.cloudY + Math.sin(w.windDir) * push) % 1000;
      if (w.rain > 0.6 && this.emission.phase === 'none' && C.hash01(this.tickN, 71, 907) < DT * 0.025 * w.rain) this.emitLightning(420 + C.hash01(this.tickN, 72, 907) * 700);
    },

    emitLightning(dist) {
      const r = C.hash01(this.tickN, 73, 911);
      this.emit({ type: 'lightning', az: r * C.TAU, dist, seed: C.hashInt(this.tickN, 74, 913) & 0xffff });
    },

    weatherSight(w = this.weather) { return 1 - w.fogK * 0.5 - w.rain * 0.2; },

    weatherNoise(w = this.weather) { return 1 - w.rain * 0.4; },

    weatherPreview(kind) {
      const w = makeWeather(kind);
      w.cloudX = 0.35; w.cloudY = 0.2;
      return w;
    },

    computeEnv(opts = {}) {
      const h = opts.hour != null ? opts.hour : this.hour();
      const w = opts.weather || this.weather, e = opts.weather ? CALM : this.emission;
      const day = smoothstep(4.8, 7.2, h) * (1 - smoothstep(19.2, 21.6, h));
      const dusk = Math.max(smoothstep(4.8, 6.4, h) * (1 - smoothstep(6.6, 8.5, h)), smoothstep(18, 20, h) * (1 - smoothstep(20.2, 21.8, h)));
      const dawn = smoothstep(3.5, 5.5, h) * (1 - smoothstep(7.5, 9.5, h));
      const cover = w.cloud, dark = w.dark, rain = w.rain, fog = w.fogK;
      const gray = clamp(cover * 0.5 + dark * 0.35 + rain * 0.15, 0, 1);
      const sunH = (h - 6) / 12 * Math.PI;
      const sd = [Math.cos(sunH) * 0.8, -0.45, Math.sin(sunH)], sl = Math.hypot(sd[0], sd[1], sd[2]);
      const sunDir = [sd[0] / sl, sd[1] / sl, sd[2] / sl], moonDir = [-sunDir[0], -sunDir[1], -sunDir[2]];
      const sunUp = smoothstep(-0.06, 0.1, sunDir[2]);
      const shade = C.Sky ? C.Sky.densityAt(w, sunDir) : cover;
      const sunVisible = e.phase === 'none' ? sunUp * (1 - fog * 0.45) : 0;
      const sunLit = sunVisible * (1 - shade);
      let light = mixC([0.13, 0.15, 0.24], [1.05, 1.0, 0.9], day);
      light = mixC(light, [1.0, 0.72, 0.52], dusk * 0.6 * (1 - gray * 0.7));
      const lum = (light[0] + light[1] + light[2]) / 3;
      light = mixC(light, [lum, lum, lum * 1.05], gray * 0.55);
      light = scaleC(light, (1 - dark * 0.26 - rain * 0.08) * (0.84 + 0.16 * (day > 0 ? sunLit + (1 - sunUp) : 1)));
      light = light.map((v, i) => v + [0.03, 0.04, 0.08][i] * (1 - day) * (1 - cover) * (1 - fog));
      const dim = k => 0.2 + day * 0.8 * k;
      let sky = mixC([8, 10, 22], [76, 112, 160], day);
      sky = mixC(sky, [112, 90, 110], dusk * 0.5 * (1 - gray * 0.6));
      sky = mixC(sky, scaleC([118, 122, 128], dim(1 - dark * 0.35)), gray);
      let hor = mixC([22, 26, 38], [188, 190, 182], day);
      hor = mixC(hor, [226, 142, 88], dusk * 0.72 * (1 - gray * 0.6));
      hor = mixC(hor, scaleC([158, 158, 154], dim(1 - dark * 0.3)), gray * 0.85);
      let fogC = mixC([16, 18, 28], [164, 164, 154], day);
      fogC = mixC(fogC, [176, 124, 92], dusk * 0.5 * (1 - gray * 0.6));
      fogC = mixC(fogC, scaleC([138, 140, 138], dim(1 - dark * 0.3)), gray);
      fogC = mixC(fogC, scaleC([200, 202, 198], 0.14 + day * 0.86), fog * 0.75);
      hor = mixC(hor, fogC, fog * 0.8);
      sky = mixC(sky, fogC, fog * 0.4);
      let cloudLit = mixC([46, 50, 64], [248, 244, 234], day);
      cloudLit = scaleC(mixC(cloudLit, [255, 172, 116], dusk * 0.78), 1 - dark * 0.48);
      let cloudShade = mixC([16, 18, 26], [146, 152, 164], day);
      cloudShade = scaleC(mixC(cloudShade, [112, 82, 104], dusk * 0.6), 1 - dark * 0.58);
      let sunColor = mixC([255, 230, 176], [255, 150, 84], dusk);
      let fogEnd = lerp(150, 290, day) * (1 - fog * 0.6) * (1 - rain * 0.25);
      let fogStart = fogEnd * 0.22 * (1 - fog * 0.7);
      let hfog = fog * 0.06 + rain * 0.009 + dawn * (1 - fog) * (1 - rain) * 0.018 * (1 - cover * 0.5);
      let tint = null, tintAmount = 0, storm = 0;
      if (e.phase !== 'none') {
        const k = e.phase === 'warning' ? clamp((e.t - 20) / 70, 0, 1) : e.phase === 'strike' ? 1 : clamp(1 - e.t / 25, 0, 1);
        light = mixC(light, [1.0, 0.45, 0.35], k * 0.7);
        sky = mixC(sky, [150, 40, 30], k);
        hor = mixC(hor, [220, 110, 60], k);
        fogC = mixC(fogC, [140, 60, 40], k);
        cloudLit = mixC(cloudLit, [236, 104, 60], k);
        cloudShade = mixC(cloudShade, [92, 22, 18], k);
        sunColor = mixC(sunColor, [255, 90, 50], k);
        fogEnd = lerp(fogEnd, 170, k);
        hfog *= 1 - k;
        tint = [1.15, 0.8, 0.7]; tintAmount = k * 0.4; storm = k;
      }
      const gust = 1 + 0.25 * Math.sin(this.realTime * 0.9) * Math.sin(this.realTime * 0.37);
      return {
        light, indoor: [0.78 * lerp(0.8, 1, day), 0.7 * lerp(0.8, 1, day), 0.56], fogStart, fogEnd, fogMax: 1,
        fogColor: toC(fogC), skyTop: toC(sky), skyHorizon: toC(hor), waterColor: C.rgb(44 * lerp(0.3, 1, day), 56 * lerp(0.3, 1, day), 48 * lerp(0.35, 1, day)),
        time: this.realTime, sunVisible, sunLit, sunDir, sunColor: toC(sunColor), moonDir, moonVisible: (1 - day) * smoothstep(0.02, 0.2, moonDir[2]),
        stars: (1 - day) * (1 - fog * 0.9) * (1 - rain), fog, cover, cloudDark: dark, cirrus: w.cirrus, cloudX: w.cloudX, cloudY: w.cloudY,
        cloudLit, cloudShade, storm, rain, wet: w.wet, windX: Math.cos(w.windDir) * w.wind * gust, windY: Math.sin(w.windDir) * w.wind * gust,
        hfog, hfogH: lerp(9, 5.5, fog), shafts: sunLit * (0.35 + fog * 0.4 + dawn * 0.4 + dusk * 0.4),
        grade: { sat: 1.07 - gray * 0.28 - fog * 0.12, con: 1.05 - gray * 0.08 - fog * 0.2, tint: [1 + 0.035 * (1 - gray) * day - 0.03 * rain, 1, 1 - 0.035 * (1 - gray) * day + 0.05 * rain] },
        tint, tintAmount, day, night: 1 - day
      };
    }
  });

  C.WEATHER = WEATHER;
  C.WEATHER_KINDS = WEATHER_KINDS;
  C.makeWeather = makeWeather;
})(globalThis.Cop98 = globalThis.Cop98 || {});
