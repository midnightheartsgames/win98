(function (L) {
  'use strict';

  L.Screens = L.Screens || {};

  const h = (tag, attrs, kids) => {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    if (kids != null) {
      for (const c of [].concat(kids)) {
        if (c == null || c === false) continue;
        el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      }
    }
    return el;
  };
  L.h = h;

  class UI {
    constructor(root, host) {
      this.root = root;
      this.host = host || {};
      this.opts = L.Army.loadOpts();
      this.profile = L.Army.load();
      this.audio = new L.Audio();
      this.audio.setVolumes({ music: this.opts.music, sfx: this.opts.sfx, voice: this.opts.voice });
      this.screens = {};
      this.current = null;
      this.last = 0;
      this.dead = false;
      this.build();
      this.bind();
      this.go('menu');
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    build() {
      const el = h('div', { class: 'lga', tabindex: '0' });
      this.el = el;
      this.stageEl = h('div', { style: { position: 'absolute', inset: '0' } });
      this.tipEl = h('div', { class: 'lga-tip' });
      this.modalEl = h('div');
      this.toastEl = h('div', { class: 'lga-toasts' });
      this.loadEl = h('div', { class: 'lga-loading' }, [h('div', { class: 't' }), h('div', { class: 'lga-bar' }, [h('i', { style: { width: '0%' } })]), h('div', { class: 's' }), h('div', { class: 'q' })]);
      el.append(this.stageEl, this.toastEl, this.loadEl, this.modalEl, this.tipEl);
      this.root.appendChild(el);
    }

    active() {
      return this.host.isActive ? this.host.isActive() : true;
    }

    bind() {
      this.onKey = e => {
        if (!this.active() || this.dead) return;
        if (e.code === 'F7') {
          e.preventDefault();
          if (!e.repeat) this.debugGrant();
          return;
        }
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
          if (e.key === 'Escape') t.blur();
          return;
        }
        this.audio.resume();
        if (this.modals && this.modals.length) {
          if (e.key === 'Escape') { this.closeModal(); e.preventDefault(); }
          return;
        }
        if (this.current && this.current.keydown && this.current.keydown(e) === true) e.preventDefault();
      };
      this.onKeyUp = e => {
        if (this.current && this.current.keyup) this.current.keyup(e);
      };
      this.onDown = () => { this.audio.resume(); this.el.focus({ preventScroll: true }); };
      this.el.addEventListener('keydown', this.onKey);
      this.el.addEventListener('keyup', this.onKeyUp);
      this.el.addEventListener('pointerdown', this.onDown, true);
      this.el.addEventListener('contextmenu', e => e.preventDefault());
      this.onBlur = () => { if (this.current && this.current.blur) this.current.blur(); };
      window.addEventListener('blur', this.onBlur);
    }

    screen(name) {
      if (!this.screens[name]) {
        const Cls = L.Screens[name];
        if (!Cls) throw new Error('screen ' + name);
        const s = new Cls(this);
        s.el.classList.add('lga-screen');
        this.stageEl.appendChild(s.el);
        this.screens[name] = s;
      }
      return this.screens[name];
    }

    go(name, params) {
      this.hideTip();
      const next = this.screen(name);
      if (this.current && this.current !== next) {
        if (this.current.hide) this.current.hide();
        this.current.el.classList.remove('on');
      }
      this.current = next;
      this.currentName = name;
      next.el.classList.add('on');
      if (next.show) next.show(params || {});
      this.el.focus({ preventScroll: true });
    }

    frame(t) {
      if (this.dead) return;
      this.raf = requestAnimationFrame(tt => this.frame(tt));
      const dt = this.last ? L.clamp((t - this.last) / 1000, 0, 0.1) : 0.016;
      this.last = t;
      if (this.current && this.current.update) {
        try { this.current.update(dt); } catch (e) { this.fail(e); }
      }
    }

    fail(e) {
      if (this.failed) return;
      this.failed = true;
      if (typeof console !== 'undefined') console.error(e);
      this.alert('Ошибка', 'Произошла ошибка: ' + (e && e.message ? e.message : e) + '. Игра вернется в меню.').then(() => {
        this.failed = false;
        this.go('menu');
      });
    }

    save() {
      if (this.profile) L.Army.save(this.profile);
    }

    saveOpts() {
      L.Army.saveOpts(this.opts);
      this.audio.setVolumes({ music: this.opts.music, sfx: this.opts.sfx, voice: this.opts.voice });
    }

    loading(on, title, sub, frac, quote) {
      this.loadEl.classList.toggle('on', !!on);
      if (!on) return;
      if (title != null) this.loadEl.querySelector('.t').textContent = title;
      if (sub != null) this.loadEl.querySelector('.s').textContent = sub;
      if (frac != null) this.loadEl.querySelector('.lga-bar i').style.width = Math.round(frac * 100) + '%';
      if (quote != null) this.loadEl.querySelector('.q').textContent = quote;
    }

    toast(text, kind, icon) {
      const t = h('div', { class: 'lga-toast' + (kind ? ' ' + kind : '') }, [icon ? L.Icons.img(icon, 22) : null, h('span', { text })]);
      this.toastEl.appendChild(t);
      setTimeout(() => t.remove(), 3500);
      while (this.toastEl.children.length > 4) this.toastEl.firstChild.remove();
    }

    btn(label, onClick, opts) {
      opts = opts || {};
      const b = h('button', { class: 'lga-btn' + (opts.cls ? ' ' + opts.cls : ''), type: 'button' });
      if (opts.icon) b.appendChild(h('img', { src: opts.icon, alt: '' }));
      if (label) b.appendChild(h('span', { text: label }));
      if (opts.cost != null) b.appendChild(typeof opts.cost === 'object' ? h('span', { class: 'cost' }, [L.Icons.img(opts.cost.icon, 14), String(opts.cost.n)]) : h('span', { class: 'cost', text: opts.cost }));
      if (opts.disabled) b.disabled = true;
      b.addEventListener('click', e => {
        if (b.disabled) return;
        this.audio.ui(opts.sound);
        onClick && onClick(e);
      });
      if (opts.tip) this.tip(b, opts.tip);
      return b;
    }

    med(icon, onClick, opts) {
      opts = opts || {};
      const b = h('button', { class: 'lga-med' + (opts.cls ? ' ' + opts.cls : ''), type: 'button', 'aria-label': opts.label || opts.cap || '' }, [L.Icons.img(icon, null), opts.cap ? h('span', { class: 'cap', text: opts.cap }) : null]);
      if (opts.disabled) b.disabled = true;
      b.addEventListener('click', e => {
        if (b.disabled) return;
        this.audio.ui(opts.sound);
        onClick && onClick(e);
      });
      if (opts.tip) this.tip(b, opts.tip);
      return b;
    }

    tip(el, content) {
      el.addEventListener('mouseenter', e => this.showTip(e, typeof content === 'function' ? content() : content));
      el.addEventListener('mousemove', e => this.moveTip(e));
      el.addEventListener('mouseleave', () => this.hideTip());
      return el;
    }

    showTip(e, html) {
      if (!html) return;
      this.tipEl.innerHTML = html;
      this.tipEl.style.display = 'block';
      this.moveTip(e);
    }

    moveTip(e) {
      if (this.tipEl.style.display !== 'block') return;
      const r = this.el.getBoundingClientRect();
      const tw = this.tipEl.offsetWidth, th = this.tipEl.offsetHeight;
      let x = e.clientX - r.left + 16, y = e.clientY - r.top + 18;
      if (x + tw > r.width - 4) x = e.clientX - r.left - tw - 12;
      if (y + th > r.height - 4) y = e.clientY - r.top - th - 12;
      this.tipEl.style.left = Math.max(4, x) + 'px';
      this.tipEl.style.top = Math.max(4, y) + 'px';
    }

    hideTip() {
      this.tipEl.style.display = 'none';
    }

    modal(o) {
      this.modals = this.modals || [];
      const back = h('div', { class: 'lga-modal-back' });
      const box = h('div', { class: 'lga-modal lga-panel', style: { width: o.width || 'auto' } });
      const head = h('div', { class: 'lga-modal-head' }, [h('div', { class: 'lga-plate', text: o.title || '' })]);
      const tools = h('div', { class: 'tools' }, o.tools || []);
      if (o.closable !== false) tools.appendChild(h('button', { class: 'lga-x', type: 'button', text: '×', onclick: () => this.closeModal(), 'aria-label': 'Закрыть' }));
      head.appendChild(tools);
      const body = h('div', { class: 'lga-modal-body' });
      if (typeof o.body === 'string') body.innerHTML = o.body;
      else if (o.body) body.appendChild(o.body);
      box.append(head, body);
      if (o.buttons && o.buttons.length) {
        const foot = h('div', { class: 'lga-modal-foot' });
        for (const b of o.buttons) foot.appendChild(this.btn(b.label, () => { if (b.onClick && b.onClick() === false) return; if (b.close !== false) this.closeModal(); }, { cls: b.cls, disabled: b.disabled }));
        box.appendChild(foot);
        o.foot = foot;
      }
      back.appendChild(box);
      back.addEventListener('pointerdown', e => { if (e.target === back && o.closable !== false) this.closeModal(); });
      this.modalEl.appendChild(back);
      const entry = { back, onClose: o.onClose, body, box };
      this.modals.push(entry);
      this.hideTip();
      return entry;
    }

    closeModal() {
      const m = this.modals && this.modals.pop();
      if (!m) return;
      m.back.remove();
      if (m.onClose) m.onClose();
      this.el.focus({ preventScroll: true });
    }

    closeAllModals() {
      while (this.modals && this.modals.length) this.closeModal();
    }

    alert(title, text) {
      return new Promise(res => this.modal({ title, body: h('div', { style: { maxWidth: '460px', lineHeight: '1.5' }, text }), buttons: [{ label: 'OK', cls: 'primary' }], onClose: res, width: 'min(94%, 520px)' }));
    }

    confirm(title, text, yes, no) {
      return new Promise(res => {
        let result = false;
        this.modal({
          title, width: 'min(94%, 520px)',
          body: h('div', { style: { maxWidth: '460px', lineHeight: '1.5' }, text }),
          buttons: [{ label: no || 'Нет' }, { label: yes || 'Да', cls: 'primary', onClick: () => { result = true; } }],
          onClose: () => res(result)
        });
      });
    }

    prompt(title, label, value, max) {
      return new Promise(res => {
        let result = null;
        const input = h('input', { class: 'lga-input', type: 'text', maxlength: String(max || 28), value: value || '' });
        const body = h('div', {}, [h('div', { style: { marginBottom: '8px' }, text: label }), input]);
        this.modal({
          title, body, width: 'min(94%, 440px)',
          buttons: [{ label: 'Отмена' }, { label: 'OK', cls: 'primary', onClick: () => { result = input.value.trim() || null; } }],
          onClose: () => res(result)
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { result = input.value.trim() || null; this.closeModal(); }
          e.stopPropagation();
        });
        setTimeout(() => { input.focus(); input.select(); }, 30);
      });
    }

    money() {
      const p = this.profile;
      return h('div', { style: { display: 'flex', gap: '8px' } }, [
        this.tip(h('div', { class: 'lga-money' }, [L.Icons.img(L.Icons.glory(), 22), h('span', { 'data-money': 'glory', text: String(p ? p.glory : 0) })]), '<b>Слава</b><br>Очки славы тратятся на найм и пополнение отрядов. Их приносят победы, особенно с медалями.'),
        this.tip(h('div', { class: 'lga-money den' }, [L.Icons.img(L.Icons.denarii(), 22), h('span', { 'data-money': 'denarii', text: String(p ? p.denarii : 0) })]), '<b>Динарии</b><br>Серебро из добычи. Им оплачивается снаряжение: оружие, броня, шлемы, обувь, знамена и реликвии.')
      ]);
    }

    refreshMoney(flash) {
      const p = this.profile;
      if (!p) return;
      this.el.querySelectorAll('[data-money]').forEach(el => {
        el.textContent = String(p[el.dataset.money]);
        const chip = el.parentNode;
        if (flash && chip && chip.classList.contains('lga-money')) {
          chip.classList.remove('flash');
          chip.getBoundingClientRect();
          chip.classList.add('flash');
        }
      });
    }

    debugGrant() {
      const p = this.profile;
      if (!p) { this.toast('Отладка: сначала начните кампанию', 'bad'); return; }
      L.Army.grant(p, 500, 500);
      this.save();
      this.refreshMoney(true);
      this.audio.play('rally', { vol: 0.5, gap: 0.2 });
      this.toast('Отладка: +500 славы и +500 динариев', 'good', L.Icons.glory());
      if (this.current && this.current.moneyChanged) this.current.moneyChanged();
    }

    favourTip(k, battle) {
      const f = L.FAVOURS[k];
      return '<div class="head">' + L.Icons.html(L.Icons.favour(k), 40) + '<div><b>' + f.name + '</b>' + f.dur + ' с</div></div>' + f.desc + '<hr>' + (battle ? 'Выберите свой отряд и нажмите, чтобы призвать милость. Бесплатно, один раз.' : 'Разовая милость за золотую медаль. Призовите ее в бою на выбранный отряд.');
    }

    favours() {
      const p = this.profile;
      const box = h('div', { class: 'lga-favs' });
      if (!p) return box;
      for (const k of p.favours) box.appendChild(this.tip(h('div', { class: 'lga-fav' }, [L.Icons.img(L.Icons.favour(k), null)]), this.favourTip(k)));
      return box;
    }

    destroy() {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      for (const k in this.screens) {
        const s = this.screens[k];
        if (s.destroy) { try { s.destroy(); } catch (e) { } }
      }
      this.audio.destroy();
      this.el.removeEventListener('keydown', this.onKey);
      this.el.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.onBlur);
      this.el.remove();
    }

    exit() {
      if (this.host.onExit) this.host.onExit();
    }
  }

  L.topbar = (ui, title, buttons) => {
    const bar = h('div', { class: 'lga-topbar' }, [h('div', { class: 'lga-plate', text: title })]);
    if (ui.profile) bar.append(ui.money(), ui.favours());
    bar.appendChild(h('div', { class: 'grow' }));
    for (const b of buttons || []) bar.appendChild(b);
    return bar;
  };

  L.UI = UI;
})(globalThis.Legion = globalThis.Legion || {});
