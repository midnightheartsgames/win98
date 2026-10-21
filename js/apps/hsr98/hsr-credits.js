(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const BAND = 60, VH = HGT - BAND * 2;

  const CLIPS = {
    konosuba: {
      clip: 'k0n0SuBa3Ed', song: 'konosubaEd', duration: 90.14, title: `${H.BRAND.event}: Обмен отрядами`,
      cuts: [0, 9.76, 14.64, 19.52, 24.4, 29.28, 34.16, 36.83, 39.04, 46.67, 54.05, 59.06, 63.56, 66.36, 68.86, 72.03, 78.54, 83.54],
      cards: [
        [H.BRAND.event, 'Обмен отрядами'],
        ['Сато Казума', 'носильщик Экспресса на один день'],
        ['Мегумин', 'один взрыв в день, сто баллов'],
        ['Аква', 'богиня воды и жрица в клетке'],
        ['Даркнесс', 'крестоносец, которую так никто и не проглотил'],
        ['@', 'командир отряда Акселя на одни сутки'],
        ['Март 7, Дань Хэн, Химико', 'отряд, где никто не промахивается'],
        ['Пом-Пом', 'проводник, который не принимает карточки искателя'],
        ['Кукла Герты', 'считала всё, кроме прикрытия'],
        ['Луна', 'стойка Гильдии искателей приключений'],
        ['Виз и Ванир', 'лавка магических товаров'],
        ['Крис, Даст и Кит', 'гильдия Акселя'],
        ['Чомусуке и головастик', 'жители особняка'],
        ['Прототип Разрушителя', 'спал под Подземельем Киила'],
        ['Аксель', 'королевство Белзерг'],
        ['Песня', '«Ano Hi no Mama no Bokura»'],
        ['Исполняют', 'Сора Амамия, Риэ Такахаси, Ай Каяно'],
        ['Конец', 'спасибо, что поменялись отрядами']
      ]
    }
  };

  function clipScene(def) {
    const P3D = globalThis.P3D, list = globalThis.youvidClips;
    const clip = list && list.find(c => c.id === def.clip);
    if (!P3D || !clip || typeof document === 'undefined') return null;
    try {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = VH;
      const r = new P3D.Renderer(cv), scene = clip.create(r);
      if (scene.warm) scene.warm();
      return { cv, r, scene };
    } catch (e) { return null; }
  }

  Object.assign(H.UI.prototype, {
    openClipCredits(id, fromStory) {
      const ui = this, def = CLIPS[id], au = this.audio, g = this.game;
      if (!def) { if (fromStory) this.finishPending(); return; }
      const play = clipScene(def), url = H.SONGS[def.song] && H.SONGS[def.song].parts.inst;
      const s = {
        full: true, t: 0, live: false, armed: 0, done: false,
        start() {
          if (this.live) return;
          this.live = true; this.t = 0;
          if (au && au.ctx && H.SONGS[def.song]) au.song(def.song);
        },
        time() { const L = au && au.layers; return L && L.id === def.song && au.ctx ? Math.max(0, au.ctx.currentTime - L.t0) : this.t; },
        tick(dt) {
          if (!this.live) { this.wait = (this.wait || 0) + dt; if (this.wait > 4) this.start(); return; }
          this.t += dt;
          if (this.armed > 0) this.armed -= dt;
          if (this.time() >= def.duration + 0.8) this.finish();
        },
        finish() {
          if (this.done) return;
          this.done = true;
          if (au && au.stopSong) au.stopSong(0.8);
          if (play && play.r.dispose) play.r.dispose();
          const i = ui.screens.indexOf(this);
          if (i >= 0) ui.screens.splice(i, 1);
          if (fromStory) ui.finishPending();
        },
        draw(c) {
          const t = this.time();
          c.fillStyle = '#000000'; c.fillRect(0, 0, W, HGT);
          if (!this.live) { ui.text('...', W / 2, HGT / 2 - 8, { align: 'center', size: 14, col: C.sub }); return; }
          if (play) {
            play.scene.render(Math.min(t, def.duration - 0.01));
            c.drawImage(play.cv, 0, BAND, W, VH);
          } else {
            const K = H.Cine && H.Cine.Kit;
            if (K && K.BG.meadow) {
              const buf = s.buf || (s.buf = G.mkCanvas(320, 180)), bg = buf.getContext('2d');
              K.BG.meadow(bg, t, { pond: [160, 160] });
              c.imageSmoothingEnabled = false;
              c.drawImage(buf, 0, BAND, W, VH);
            }
          }
          ui.text(def.title, W / 2, 22, { align: 'center', size: 13, bold: true, serif: true, col: '#f2dc9a' });
          let i = 0;
          while (i + 1 < def.cuts.length && def.cuts[i + 1] <= t) i++;
          const [a, b] = def.cards[i], k = Math.min(1, (t - def.cuts[i]) / 0.6);
          c.save(); c.globalAlpha = k;
          ui.text(a === '@' ? (g ? g.state.name : '') : a, W / 2, HGT - BAND + 10, { align: 'center', size: 15, bold: true, serif: true, col: '#ffffff' });
          ui.text(b, W / 2, HGT - BAND + 32, { align: 'center', size: 11, col: '#c8d4f4' });
          c.restore();
          if (this.armed > 0) ui.text('Ещё раз, чтобы пропустить', W - 12, 8, { align: 'right', size: 10, col: C.sub });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        key(k) {
          if (k !== 'ok' && k !== 'back') return;
          if (!this.live) { this.start(); return; }
          if (this.armed > 0) { this.finish(); return; }
          this.armed = 2;
        }
      };
      this.push(s);
      if (au && au.ctx && url && au.stem) au.stem(url).then(() => s.start(), () => s.start());
      else s.start();
    }
  });

  H.CREDIT_CLIPS = CLIPS;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
