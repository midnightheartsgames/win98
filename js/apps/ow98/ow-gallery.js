(function (O) {
  'use strict';
  const S = O.Screens;
  const esc = O.esc;
  const pics = new Map();
  const FEMALE = ['tracer', 'widowmaker', 'mercy'];

  function cachedURL(key, make) {
    if (pics.has(key)) return pics.get(key);
    const c = make();
    const u = c ? c.toDataURL() : '';
    pics.set(key, u);
    return u;
  }
  function silhouette(ui, hero, key, type) {
    return cachedURL('sil:' + hero + ':' + type + ':' + key, () => ui.renderer ? ui.renderer.portrait(hero, 'classic', 96, { full: true, pose: type + ':' + key, flat: [1, 1, 1, 1] }) : null);
  }
  function sprayURL(ui, hero, key, size) { return cachedURL('spr:' + hero + ':' + key + ':' + size, () => O.sprayArt(hero, key, size, ui.portrait(hero, 'classic'))); }
  function wallURL() { return cachedURL('wall', () => O.Tex.get('brick')); }

  S.itemPic = function (ui, it, size) {
    if (!it) return S.iconImg('coin', size, '#ffd070');
    if (it.type === 'skin') return `<img class="ip port" src="${S.purl(ui, it.hero, it.key)}" alt="">`;
    if (it.type === 'emote' || it.type === 'pose') return `<img class="ip sil" src="${silhouette(ui, it.hero, it.key, it.type)}" alt="">`;
    if (it.type === 'spray') return `<img class="ip spray" src="${sprayURL(ui, it.hero, it.key, 64)}" alt="">`;
    if (it.type === 'icon') return `<img class="ip picon" src="${O.playerIconURL(+it.key, 64)}" alt="">`;
    const t = O.COSMETIC_TYPES.find(x => x.id === it.type);
    return S.iconImg(t ? t.icon : 'star', size, '#fff');
  };

  S.mountStage = function (ui, slot, cfg) {
    if (!slot) return;
    const c = ui.stageCanvas();
    if (!c) { slot.innerHTML = cfg.still ? cfg.still() : ''; S.stageCfg = null; return; }
    slot.appendChild(c);
    if (S.stageHero !== cfg.hero) { S.stageHero = cfg.hero; S.stageYaw = 0; }
    if (S.stageKey !== cfg.key) { S.stageKey = cfg.key; S.stageT = 0; }
    S.stageCfg = cfg;
    let drag = null;
    slot.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, yaw: S.stageYaw || 0 };
      try { slot.setPointerCapture(e.pointerId); } catch (err) { }
      slot.classList.add('drag');
    });
    slot.addEventListener('pointermove', e => { if (drag) S.stageYaw = drag.yaw + (e.clientX - drag.x) * 0.012; });
    const up = () => { drag = null; slot.classList.remove('drag'); };
    slot.addEventListener('pointerup', up);
    slot.addEventListener('pointercancel', up);
  };

  S.drawStage = function (ui, dt) {
    const cfg = S.stageCfg, c = ui.stageC;
    if (!cfg || !c || !c.isConnected || !ui.stageR) return;
    S.stageT = (S.stageT || 0) + dt;
    const k = O.clamp(ui.renderer ? ui.renderer.h / Math.max(1, ui.H) : 1, 0.35, 1);
    const w = Math.max(16, Math.round(c.clientWidth * k)), h = Math.max(16, Math.round(c.clientHeight * k));
    if (c.width !== w || c.height !== h) { ui.stageR.resize(w, h); c.style.imageRendering = k < 0.75 ? 'pixelated' : 'auto'; }
    let orbit = 0, zoom = cfg.zoom || 1;
    if (cfg.intro) { const f = O.smooth(Math.min(1, (S.stageT % 5) / 2.2)); orbit = 1.1 - 1.3 * f; zoom *= 0.72 + 0.28 * f; }
    const clip = cfg.pose ? O.Clips.get(cfg.hero, cfg.pose) : null;
    const ct = cfg.intro ? S.stageT % 5 : clip && clip.kind === 'emote' && !clip.loop ? S.stageT % (clip.len + 1.2) : S.stageT;
    ui.stageR.showcase({ hero: cfg.hero, skin: cfg.skin, pose: cfg.pose, t: S.stageT, ct, yaw: (cfg.yaw || 0) + (S.stageYaw || 0), orbit, zoom });
  };

  S.s_gallery = function (ui) {
    const p = ui.profile;
    const card = id => {
      const [have, total] = O.Profile.unlockCount(p, id);
      const fresh = p.fresh && p.fresh[id];
      return `<div class="ow-gcard ${fresh ? 'fresh' : ''}" data-h="${id}"><div class="por"><img src="${S.purl(ui, id, O.Profile.equipped(p, id, 'skin'))}" alt=""></div>${fresh ? '<span class="ow-new">NEW!</span>' : ''}<div class="n">${esc(O.HEROES[id].name)}</div><div class="prog"><i style="width:${Math.round(have / total * 100)}%"></i></div><div class="c">${have}/${total}</div></div>`;
    };
    const sum = O.HERO_ORDER.reduce((a, id) => { const c = O.Profile.unlockCount(p, id); return [a[0] + c[0], a[1] + c[1]]; }, [0, 0]);
    ui.layer.innerHTML = `
      <div class="ow-page ow-coll">
        <div class="ow-coll-head"><div class="ow-h1 huge">ГАЛЕРЕЯ ГЕРОЕВ</div><div class="ow-coll-total"><b>${sum[0]}</b>/${sum[1]} предметов в коллекции</div></div>
        <div class="ow-coll-groups">${O.ROLE_ORDER.map(r => `<section class="ow-coll-role" style="--rc:${O.ROLES[r].color}"><div class="rt">${S.iconImg(r, 18, O.ROLES[r].color)}<span>${O.ROLES[r].ru}</span></div><div class="rh">${O.HERO_ORDER.filter(id => O.HEROES[id].role === r).map(card).join('')}</div></section>`).join('')}</div>
        ${S.backBtn()}${S.badge(ui)}${S.credits(ui)}
      </div>`;
    S.bindAll(ui.layer, '[data-h]', el => { S.click(ui); S.show(ui, 'hero', { hero: el.dataset.h }); });
    S.bindBack(ui, 'main');
  };

  S.s_hero = function (ui, arg) {
    const p = ui.profile, id = arg.hero, def = O.HEROES[id];
    if (p.fresh && p.fresh[id]) { delete p.fresh[id]; O.Profile.save(p); }
    const cat = O.catalog(id);
    const types = O.COSMETIC_TYPES.filter(t => t.id !== 'icon');
    const type = types.find(t => t.id === arg.type) || types[0];
    const list = cat.filter(i => i.type === type.id);
    const eqKey = O.Profile.equipped(p, id, type.id);
    const sel = list.find(i => i.id === arg.sel) || list.find(i => i.key === eqKey) || list[0];
    const own = O.Profile.owns(p, sel), on = eqKey === sel.key;
    const have = list.filter(i => O.Profile.owns(p, i)).length;
    const price = O.RARITY[sel.rar].price, rar = O.RARITY[sel.rar];
    const skinEq = O.Profile.equipped(p, id, 'skin');
    const quote = it => it.type === 'voice' ? '«' + it.name + '»' : it.name;
    const act = own
      ? (on ? `<div class="ow-btn big done">${S.iconImg('check', 20, '#1d2a44')} ВЫБРАНО</div>` : '<div class="ow-btn big primary" data-act>ВЫБРАТЬ</div>')
      : p.credits >= price ? `<div class="ow-btn big primary" data-act>КУПИТЬ · ${price} ${S.iconImg('coin', 20, '#fff')}</div>` : `<div class="ow-btn big off">НУЖНО ${price} ${S.iconImg('coin', 18, '#1d2a44')}</div>`;
    const status = own ? (on ? 'Выбрано для героя.' : 'Есть в коллекции.') : `Выпадает из контейнеров. Купить: ${price} кр.`;
    const row = it => {
      const o = O.Profile.owns(p, it), e = eqKey === it.key;
      const right = o ? (e ? `<span class="st">${S.iconImg('check', 16, '#7dff5a')}</span>` : '') : `<span class="pr">${S.iconImg('lock', 11, '#c9d4e4')}${O.RARITY[it.rar].price}</span>`;
      return `<div class="ow-hx-item ${o ? '' : 'locked'} ${it === sel ? 'sel' : ''} ${e ? 'on' : ''}" data-i="${esc(it.id)}" style="--rar:${O.RARITY[it.rar].col}"><span class="pic ${it.type}">${S.itemPic(ui, it, 24)}</span><span class="nm">${esc(quote(it))}</span>${right}</div>`;
    };
    ui.layer.innerHTML = `
      <div class="ow-page ow-hx">
        <div class="ow-hx-stage ow-stage-slot" data-stage></div>
        <div class="ow-hx-head">
          <div class="ow-hx-name">${esc(def.name)}</div>
          <div class="ow-hx-sub">${S.iconImg(def.role, 16, O.ROLES[def.role].color)}<span class="role" style="color:${O.ROLES[def.role].color}">${O.ROLES[def.role].one}</span><b>${type.ru}</b><em>${have}/${list.length}</em></div>
        </div>
        <div class="ow-hx-left">
          <div class="ow-hx-rail">${types.map(t => `<div class="ow-hx-cat ${t === type ? 'on' : ''}" data-t="${t.id}" title="${t.ru}">${S.iconImg(t.icon, 22, t === type ? '#10233c' : '#e8eef8')}</div>`).join('')}</div>
          <div class="ow-hx-list" data-list><div class="ow-hx-lh">${type.ru}</div>${list.map(row).join('')}</div>
        </div>
        <div class="ow-hx-info" style="--rar:${rar.col}">
          <div class="cat">${type.ru}</div>
          <div class="nm">${esc(quote(sel))}</div>
          <div class="ow-rarplate">${rar.g[type.g]} ${type.one}</div>
          <div class="st">${status}</div>
          <div class="btns">${sel.type === 'voice' ? `<div class="ow-btn sm" data-play>${S.iconImg('cVoice', 14, '#1d2a44')} ПРОСЛУШАТЬ</div>` : ''}<div class="ow-btn sm" data-info>ИНФО О ГЕРОЕ</div></div>
        </div>
        <div class="ow-hx-act">${act}</div>
        <div class="ow-hx-keys"><span><span class="ow-key">↑ ↓</span> ПРЕДМЕТ</span><span><span class="ow-key">← →</span> РАЗДЕЛ</span><span><span class="ow-key">ПРОБЕЛ</span> ${own ? 'ВЫБРАТЬ' : 'КУПИТЬ'}</span>${type.id === 'spray' ? '' : '<span><span class="ow-key">ЛКМ</span> ПОВЕРНУТЬ</span>'}</div>
        ${S.badge(ui)}${S.credits(ui)}
        <div class="ow-hx-msg" data-msg></div>
        ${S.backBtn()}
      </div>`;
    const slot = ui.layer.querySelector('[data-stage]');
    if (type.id === 'spray') {
      S.stageCfg = null;
      slot.classList.add('wall');
      slot.innerHTML = `<div class="ow-wall" style="background-image:url(${wallURL()})"><img class="spray" src="${sprayURL(ui, id, sel.key, 128)}" alt=""><div class="tag">${esc(sel.name)}</div></div>`;
    } else {
      const cfg = { key: id + ':' + type.id + ':' + sel.id, hero: id, skin: type.id === 'skin' ? sel.key : skinEq, yaw: -0.3, still: () => S.heroImg(ui, id, type.id === 'skin' ? sel.key : skinEq) };
      if (type.id === 'emote' || type.id === 'pose') cfg.pose = type.id + ':' + sel.key;
      if (type.id === 'intro') { cfg.pose = O.Clips.intro(id, sel.key); cfg.intro = true; }
      S.mountStage(ui, slot, cfg);
      if (type.id === 'voice') slot.insertAdjacentHTML('beforeend', `<div class="ow-hx-quote">${esc(quote(sel))}</div>`);
    }
    const listEl = ui.layer.querySelector('[data-list]');
    if (arg.scroll !== undefined) listEl.scrollTop = arg.scroll;
    const selEl = listEl.querySelector('.sel');
    if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: 'nearest' });
    const say = it => ui.audio.say(it.name, { male: !FEMALE.includes(id), priority: true, rate: 1.05 });
    const go = o => S.show(ui, 'hero', Object.assign({ hero: id, type: type.id, sel: sel.id, scroll: listEl.scrollTop }, o));
    S.bindAll(ui.layer, '[data-t]', el => { S.click(ui); if (el.dataset.t !== type.id) S.show(ui, 'hero', { hero: id, type: el.dataset.t }); });
    S.bindAll(ui.layer, '[data-i]', el => {
      const it = list.find(i => i.id === el.dataset.i);
      if (!it) return;
      S.click(ui);
      if (it.type === 'voice') say(it);
      if (it !== sel || it.type === 'emote' || it.type === 'pose' || it.type === 'intro') { if (it === sel) S.stageT = 0; go({ sel: it.id }); }
    });
    const ab = ui.layer.querySelector('[data-act]');
    if (ab) ab.addEventListener('click', () => {
      if (!own) {
        if (!ab.classList.contains('confirm')) {
          S.click(ui);
          ab.classList.add('confirm');
          ab.innerHTML = `ПОДТВЕРДИТЬ · ${price} ${S.iconImg('coin', 20, '#fff')}`;
          ui.layer.querySelector('[data-msg]').textContent = 'НАЖМИТЕ ЕЩЁ РАЗ, ЧТОБЫ КУПИТЬ ЗА ' + price + ' КРЕДИТОВ';
          return;
        }
        if (!O.Profile.buy(p, sel)) { ui.layer.querySelector('[data-msg]').textContent = 'НЕДОСТАТОЧНО КРЕДИТОВ'; return; }
        ui.audio.play('armorUp');
      } else S.click(ui);
      O.Profile.equip(p, id, sel.type, sel.key);
      O.Profile.save(p);
      if (sel.type === 'voice') say(sel);
      go({});
    });
    const pl = ui.layer.querySelector('[data-play]');
    if (pl) pl.addEventListener('click', () => say(sel));
    ui.layer.querySelector('[data-info]').addEventListener('click', () => {
      S.click(ui);
      const box = document.createElement('div');
      box.className = 'ow-modal';
      box.innerHTML = `<div class="ow-modal-in ow-herocard">
        <div class="hc-top"><img src="${S.purl(ui, id, skinEq)}" alt=""><div><div class="ow-h2">${esc(def.name)}</div><div class="ow-dim">${esc(def.real)} · ${O.ROLES[def.role].one} · сложность ${'★'.repeat(def.stars)}${'☆'.repeat(3 - def.stars)}</div></div></div>
        <div class="ow-hd-bio">${esc(def.bio)}</div>
        <div class="ow-hd-facts"><div>Возраст: <b>${def.age}</b></div><div>Род занятий: <b>${esc(def.job)}</b></div><div>База: <b>${esc(def.base)}</b></div><div>Принадлежность: <b>${esc(def.aff)}</b></div></div>
        <div class="ow-h2">СПОСОБНОСТИ</div>
        ${def.kit.map(k => `<div class="ow-ab">${S.iconImg(k.icon, 34)}<div><div class="nm">${esc(k.name)} <span class="ow-key">${esc(k.key)}</span></div><div class="ds">${esc(k.desc)}</div></div></div>`).join('')}
        <div class="ow-btn" data-close>ЗАКРЫТЬ</div></div>`;
      ui.layer.appendChild(box);
      box.addEventListener('click', e => { if (e.target === box || e.target.closest('[data-close]')) box.remove(); });
    });
    S.bindBack(ui, 'gallery');
  };

  S.heroKey = function (ui, e) {
    const layer = ui.layer;
    if (layer.querySelector('.ow-modal')) return false;
    const step = (sel, cls, dir) => {
      const els = [...layer.querySelectorAll(sel)];
      if (!els.length) return;
      const i = els.findIndex(x => x.classList.contains(cls));
      els[(i + dir + els.length) % els.length].click();
    };
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { step('[data-i]', 'sel', e.code === 'ArrowDown' ? 1 : -1); return true; }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { step('[data-t]', 'on', e.code === 'ArrowRight' ? 1 : -1); return true; }
    if (e.code === 'Space' || e.code === 'Enter') { const b = layer.querySelector('[data-act]'); if (b) b.click(); return true; }
    return false;
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
