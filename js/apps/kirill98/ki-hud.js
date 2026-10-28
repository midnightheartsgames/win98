(function (K) {
  'use strict';

  const TICKS = 8, GUARD_TICK = { right: 0, up: 2, left: 4, down: 6 };

  const SHAPES = [
    [0, 'ellipse', 32, 11, 8, 9], [1, 'rect', 22, 21, 20, 22], [2, 'rect', 23, 43, 18, 15],
    [3, 'rect', 43, 22, 8, 18], [4, 'rect', 13, 22, 8, 18], [5, 'rect', 46, 40, 7, 19], [6, 'rect', 11, 40, 7, 19],
    [7, 'rect', 33, 58, 8, 18], [8, 'rect', 23, 58, 8, 18], [9, 'rect', 33, 76, 8, 18], [10, 'rect', 23, 76, 8, 18]
  ];
  const PROS_COLOR = { iron: '#8c9198', hinge: '#a7a29a', hook: '#7d828a', carved: '#a07a4a', peg: '#8a6034', willow: '#b89060' };

  function doll(g, kit, sore, blink, life) {
    g.clearRect(0, 0, 64, 96);
    const cut = kit.cut || {}, pros = kit.pros || {}, pale = Math.round(120 + 115 * life);
    const skin = `rgb(${pale},${Math.round(pale * 0.86)},${Math.round(pale * 0.7)})`;
    for (const [p, shape, x, y, w, h] of SHAPES) {
      const name = K.Body.PARTS[p];
      if (cut[name] && !pros[name]) continue;
      g.fillStyle = pros[name] ? PROS_COLOR[pros[name]] || '#8c9198' : sore.has(p) && blink ? '#c01818' : skin;
      if (shape === 'ellipse') { g.beginPath(); g.ellipse(x, y, w, h, 0, 0, Math.PI * 2); g.fill(); }
      else g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(0,0,0,0.55)';
      if (shape === 'rect') { g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h); }
    }
    for (const [k, v] of Object.entries(cut)) {
      if (pros[k] || v === 'healed') continue;
      const p = K.Body.PARTS.indexOf(k), s = SHAPES.find(q => q[0] === p);
      if (!s || p === 0) continue;
      g.fillStyle = v === 'bandaged' ? '#f2efe4' : '#8c0c0c';
      g.fillRect(s[2], s[3], s[4], 3);
    }
    if (!cut.head) {
      const eyes = kit.eyes || {};
      for (const [side, x] of [['r', 28], ['l', 36]]) {
        const v = eyes[side];
        g.fillStyle = !v ? '#2a1c12' : v === 'glass' ? '#e6eef0' : v === 'resin' ? '#e0a020' : v === 'ruby' ? '#d01830' : '#000';
        g.fillRect(x - 1, 9, v && v !== 'glass' && v !== 'resin' && v !== 'ruby' ? 3 : 2, 2);
        if (v === true || v === 'patch') { g.fillStyle = '#000'; g.fillRect(x - 2, 8, 5, 4); }
      }
    }
  }

  class Hud {
    constructor(root) {
      this.el = document.createElement('div');
      this.el.className = 'ki-hud';
      const ticks = Array.from({ length: TICKS }, (v, i) => `<i style="transform: rotate(${-i * 45}deg) translateX(12px)"></i>`).join('');
      this.el.innerHTML = `<div class="ki-flash"></div><div class="ki-banner"><div class="ki-banner-zone"></div><div class="ki-banner-place"></div></div>
        <div class="ki-cross"><b></b>${ticks}</div><div class="ki-body"><canvas class="ki-doll" width="64" height="96"></canvas><div class="ki-bleed"></div></div><div class="ki-stamina"><div></div></div>
        <div class="ki-bind"><div></div></div><div class="ki-ammo"><span></span><i></i></div><div class="ki-marks"></div><div class="ki-orders"></div><div class="ki-toast"></div><div class="ki-prompt"></div>
        <div class="ki-hint">Щёлкните по картинке, чтобы управлять мышью</div><pre class="ki-debug"></pre><div class="ki-goal"></div><div class="ki-alarm"><b class="ki-horn" title="Рог Корней: набег">рог</b><b class="ki-fire" title="Горит дом">огонь</b></div>`;
      root.appendChild(this.el);
      this.banner = this.el.querySelector('.ki-banner');
      this.zoneEl = this.el.querySelector('.ki-banner-zone');
      this.placeEl = this.el.querySelector('.ki-banner-place');
      this.promptEl = this.el.querySelector('.ki-prompt');
      this.hintEl = this.el.querySelector('.ki-hint');
      this.debugEl = this.el.querySelector('.ki-debug');
      this.crossEl = this.el.querySelector('.ki-cross');
      this.tickEls = [...this.crossEl.querySelectorAll('i')];
      this.staminaEl = this.el.querySelector('.ki-stamina');
      this.staminaBar = this.staminaEl.firstElementChild;
      this.flashEl = this.el.querySelector('.ki-flash');
      this.bodyEl = this.el.querySelector('.ki-body');
      this.dollEl = this.el.querySelector('.ki-doll');
      this.dollCtx = this.dollEl.getContext('2d');
      this.bleedEl = this.el.querySelector('.ki-bleed');
      this.bindEl = this.el.querySelector('.ki-bind');
      this.bindBar = this.bindEl.firstElementChild;
      this.marksEl = this.el.querySelector('.ki-marks');
      this.ammoEl = this.el.querySelector('.ki-ammo');
      this.ordersEl = this.el.querySelector('.ki-orders');
      this.ammoText = this.ammoEl.firstElementChild;
      this.ammoBar = this.ammoEl.lastElementChild;
      this.marks = [];
      this.lastDoll = '';
      this.toastEl = this.el.querySelector('.ki-toast');
      this.toastTime = 0;
      this.flashTime = 0;
      this.bannerTime = 0;
      this.lastPrompt = null;
      this.lastTicks = '';
      this.goalEl = this.el.querySelector('.ki-goal');
      this.hornEl = this.el.querySelector('.ki-horn');
      this.fireEl = this.el.querySelector('.ki-fire');
      this.lastGoal = null;
    }

    goal(text) {
      if (text === this.lastGoal) return;
      this.lastGoal = text;
      this.goalEl.textContent = text || '';
      this.goalEl.classList.toggle('on', !!text);
    }

    alarm(horn, fire) {
      this.hornEl.classList.toggle('on', !!horn);
      this.fireEl.classList.toggle('on', !!fire);
    }

    show(zone, place) {
      if (zone !== null) this.zoneEl.textContent = zone;
      this.placeEl.textContent = place || '';
      this.bannerTime = 3.5;
      this.banner.classList.add('on');
    }

    prompt(text) {
      if (text === this.lastPrompt) return;
      this.lastPrompt = text;
      this.promptEl.textContent = text || '';
      this.promptEl.classList.toggle('on', !!text);
    }

    hint(on) {
      this.hintEl.classList.toggle('on', !!on);
    }

    cross(on, fight) {
      this.crossEl.classList.toggle('on', !!on);
      let wind = -1, guard = -1;
      if (on && fight) {
        if (fight.act && fight.act.kind === 'wind') wind = K.Combat.centred(fight) ? 8 : K.Combat.dirOf(fight.steer[0], fight.steer[1], fight.lastDir);
        if (fight.guard) guard = GUARD_TICK[fight.guard.dir];
      }
      const key = wind + ':' + guard;
      if (key === this.lastTicks) return;
      this.lastTicks = key;
      this.crossEl.classList.toggle('aim', wind === 8);
      this.tickEls.forEach((el, i) => {
        el.classList.toggle('wind', i === wind);
        el.classList.toggle('guard', i === guard);
      });
    }

    wounds(on, who, time) {
      this.bodyEl.classList.toggle('on', !!on);
      if (!on) return;
      const F = who.fight, kit = who.kit, b = F.bleed || {}, blink = Math.floor(time * 3) % 2 === 0;
      const sore = new Set(Object.keys(b.at || {}).map(Number));
      for (const [k, v] of Object.entries(kit.cut || {})) if (v === 'fresh') { const p = K.Body.PARTS.indexOf(k), par = K.Body.PARENT[p]; if (par >= 0) sore.add(par); }
      const key = JSON.stringify([kit.cut, kit.pros, kit.eyes, [...sore], blink, Math.round(F.life / 5)]);
      if (key !== this.lastDoll) { this.lastDoll = key; doll(this.dollCtx, kit, sore, blink, K.clamp(F.life / 100, 0, 1)); }
      const left = b.heavy >= 0 && !F.down ? Math.ceil(b.heavy) + ' с до падения' : '';
      this.bleedEl.textContent = left;
      this.bleedEl.classList.toggle('on', !!left);
      const bind = F.binding;
      this.bindEl.classList.toggle('on', !!bind);
      if (bind) this.bindBar.style.width = Math.round(K.clamp(bind.t / bind.time, 0, 1) * 100) + '%';
    }

    ammo(text, k) {
      this.ammoEl.classList.toggle('on', !!text);
      if (!text) return;
      if (this.ammoText.textContent !== text) this.ammoText.textContent = text;
      this.ammoBar.style.width = k >= 0 ? Math.round(k * 60) + 'px' : '0';
    }

    mark(angle, power) {
      const el = document.createElement('i');
      el.style.transform = `rotate(${angle}rad) translateY(-${Math.round(120 + 20 * (1 - K.clamp(power, 0, 1)))}px)`;
      el.style.opacity = String(K.clamp(0.35 + power * 0.5, 0.35, 0.85));
      this.marksEl.appendChild(el);
      this.marks.push({ el, t: 1.2 });
    }

    orders(list) {
      this.ordersEl.classList.toggle('on', !!list);
      if (!list) return;
      this.ordersEl.textContent = '';
      const cap = document.createElement('b');
      cap.textContent = 'Отряду (Q: закрыть)';
      this.ordersEl.appendChild(cap);
      for (const s of list) { const d = document.createElement('div'); d.textContent = s; this.ordersEl.appendChild(d); }
    }

    blind(on) {
      this.marksEl.classList.toggle('on', !!on);
    }

    stamina(on, value, max) {
      this.staminaEl.classList.toggle('on', !!on);
      if (on) this.staminaBar.style.width = Math.round(K.clamp(value / (max || 100), 0, 1) * 100) + '%';
    }

    hurt(power) {
      this.flashTime = Math.max(this.flashTime, 0.25 + 0.35 * K.clamp(power, 0, 1));
      this.flashEl.style.opacity = String(K.clamp(0.25 + power * 0.5, 0, 0.75));
      this.flashEl.classList.add('on');
    }

    toast(text, time) {
      this.toastEl.textContent = text;
      this.toastEl.classList.add('on');
      this.toastTime = time || 2.6;
    }

    debug(text) {
      this.debugEl.textContent = text || '';
      this.debugEl.classList.toggle('on', !!text);
    }

    update(dt) {
      if (this.toastTime > 0) {
        this.toastTime -= dt;
        if (this.toastTime <= 0) this.toastEl.classList.remove('on');
      }
      if (this.flashTime > 0) {
        this.flashTime -= dt;
        if (this.flashTime <= 0) this.flashEl.classList.remove('on');
      }
      for (const m of this.marks) { m.t -= dt; if (m.t <= 0) m.el.remove(); else m.el.style.opacity = String(Math.min(+m.el.style.opacity, m.t)); }
      this.marks = this.marks.filter(m => m.t > 0);
      if (this.bannerTime > 0) {
        this.bannerTime -= dt;
        if (this.bannerTime <= 0) this.banner.classList.remove('on');
      }
    }
  }

  K.Hud = Hud;
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
