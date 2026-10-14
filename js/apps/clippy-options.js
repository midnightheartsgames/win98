class ClippyOptions {
  constructor() {
    this.storageKey = 'win98_clippy_options';
    this.registryKey = 'win98_registry_data';
    this.assistantPath = ['HKEY_CURRENT_USER', 'Software', 'Microslop', 'Office', '8.0', 'Common', 'Assistant'];
    this.registryFile = null;
    this.values = this.load();
    this.readRegistry();
  }

  defaults() {
    return {
      enabled: true,
      respondF1: true,
      letters: true,
      appReactions: true,
      siteReactions: true,
      moveAway: true,
      sounds: true,
      tipOfDay: true,
      tipsMode: 'bulb',
      annoyance: 'normal'
    };
  }

  load() {
    const values = this.defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
      if (saved && typeof saved === 'object') {
        Object.keys(values).forEach(key => {
          if (typeof saved[key] === typeof values[key]) values[key] = saved[key];
        });
      }
    } catch (e) {}
    return this.sanitize(values);
  }

  sanitize(values) {
    if (!['quiet', 'normal', 'chaos'].includes(values.annoyance)) values.annoyance = 'normal';
    if (!['bulb', 'balloon'].includes(values.tipsMode)) values.tipsMode = 'bulb';
    return values;
  }

  save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.values)); } catch (e) {}
  }

  get(name) {
    return this.values[name];
  }

  set(name, value) {
    if (!(name in this.values) || this.values[name] === value) return false;
    this.values[name] = value;
    this.sanitize(this.values);
    this.save();
    this.writeRegistry();
    return true;
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  registryFields() {
    return [
      ['AsstState', 'enabled'],
      ['AsstRespondF1', 'respondF1'],
      ['AsstHelpWithLetters', 'letters'],
      ['AsstProgramTips', 'appReactions'],
      ['AsstWebTips', 'siteReactions'],
      ['AsstMoveWhenInTheWay', 'moveAway'],
      ['AsstSound', 'sounds'],
      ['AsstShowTipOfDay', 'tipOfDay']
    ];
  }

  registryValues() {
    const out = {
      AsstFile: { type: 'REG_SZ', data: 'CLIPPIT.ACT' },
      AsstAnnoyance: { type: 'REG_SZ', data: this.values.annoyance },
      AsstTipsBulb: { type: 'REG_DWORD', data: this.values.tipsMode === 'bulb' ? 1 : 0 }
    };
    this.registryFields().forEach(([reg, key]) => {
      out[reg] = { type: 'REG_DWORD', data: this.values[key] ? 1 : 0 };
    });
    return out;
  }

  storedRegistry() {
    try { return JSON.parse(localStorage.getItem(this.registryKey) || 'null'); } catch (e) { return null; }
  }

  findKey(root, path) {
    let node = root;
    for (const part of path) {
      if (!node || !node.children || !node.children[part]) return null;
      node = node.children[part];
    }
    return node;
  }

  readRegistry() {
    const root = this.storedRegistry();
    const key = root && this.findKey(root, this.assistantPath);
    if (!key || !key.values) return false;
    const vals = key.values;
    this.registryFields().forEach(([reg, name]) => {
      const v = vals[reg];
      if (v && v.type === 'REG_DWORD') this.values[name] = Number(v.data) !== 0;
    });
    const annoyance = vals.AsstAnnoyance && String(vals.AsstAnnoyance.data);
    if (['quiet', 'normal', 'chaos'].includes(annoyance)) this.values.annoyance = annoyance;
    if (vals.AsstTipsBulb && vals.AsstTipsBulb.type === 'REG_DWORD') this.values.tipsMode = Number(vals.AsstTipsBulb.data) ? 'bulb' : 'balloon';
    const file = vals.AsstFile ? String(vals.AsstFile.data || '').trim().toUpperCase() : '';
    this.registryFile = file && file !== 'CLIPPIT.ACT' ? file : null;
    this.save();
    return true;
  }

  withRegistry(fn) {
    const reg = window.appRegEdit;
    if (reg && reg.registry) {
      fn(reg.registry);
      reg.saveRegistry();
      if (reg.win && reg.el && reg.el.isConnected) reg.render();
      return true;
    }
    const root = this.storedRegistry();
    if (!root) return false;
    fn(root);
    try { localStorage.setItem(this.registryKey, JSON.stringify(root)); } catch (e) {}
    return true;
  }

  ensureKey(root, path) {
    let node = root;
    path.forEach(part => {
      node.children = node.children || {};
      if (!node.children[part]) node.children[part] = { children: {}, values: {} };
      node = node.children[part];
    });
    node.values = node.values || {};
    return node;
  }

  writeRegistry() {
    return this.withRegistry(root => {
      Object.assign(this.ensureKey(root, this.assistantPath).values, this.registryValues());
    });
  }

  writeFavorite(name) {
    return this.withRegistry(root => {
      this.ensureKey(root, ['HKEY_CURRENT_USER']).values['Любимый_помощник'] = { type: 'REG_SZ', data: name };
    });
  }

  takeRegistryFile() {
    const file = this.registryFile;
    this.registryFile = null;
    return file;
  }

  actors() {
    return window.clippyActors;
  }

  checkbox(name, label) {
    return `<label class="clippy-opt-check"><input type="checkbox" data-opt="${name}"${this.values[name] ? ' checked' : ''}> ${label}</label>`;
  }

  dialogHtml(tab) {
    const t = (k, ...a) => this.t(k, ...a);
    const tabEl = (id, label) => `<div class="win-tab${tab === id ? ' active' : ''}" data-tab="${id}">${label}</div>`;
    const annoy = ['quiet', 'normal', 'chaos'];
    const annoyLabel = { quiet: t('clippy.annoyQuiet'), normal: t('clippy.annoyNormal'), chaos: t('clippy.annoyChaos') };
    return `
      <div class="clippy-opt">
        <div class="win-tabs">${tabEl('gallery', t('clippy.optTabGallery'))}${tabEl('options', t('clippy.optTabOptions'))}</div>
        <div class="win-tab-panel">
          <div class="clippy-opt-page${tab === 'gallery' ? '' : ' hidden'}" data-page="gallery">
            <div class="clippy-gal-top">
              <div class="clippy-gal-stage"><div class="clippy-gal-art"></div></div>
              <div class="clippy-gal-text">
                <div class="clippy-gal-name"></div>
                <div class="clippy-gal-desc"></div>
                <div class="clippy-gal-status"></div>
              </div>
            </div>
            <div class="clippy-gal-nav">
              <button class="win-btn clippy-gal-prev">${t('clippy.galleryBack')}</button>
              <button class="win-btn clippy-gal-visit">${t('clippy.galleryVisit')}</button>
              <button class="win-btn clippy-gal-next">${t('clippy.galleryNext')}</button>
            </div>
          </div>
          <div class="clippy-opt-page${tab === 'options' ? '' : ' hidden'}" data-page="options">
            ${this.checkbox('enabled', t('clippy.optShow'))}
            <fieldset class="clippy-opt-group">
              <legend>${t('clippy.optAssistGroup')}</legend>
              ${this.checkbox('respondF1', t('clippy.optF1'))}
              ${this.checkbox('letters', t('clippy.optLetters'))}
              ${this.checkbox('appReactions', t('clippy.optAppReactions'))}
              ${this.checkbox('siteReactions', t('clippy.optSiteReactions'))}
              ${this.checkbox('moveAway', t('clippy.optMoveAway'))}
              ${this.checkbox('sounds', t('clippy.optSounds'))}
            </fieldset>
            <fieldset class="clippy-opt-group">
              <legend>${t('clippy.optTipsGroup')}</legend>
              <label class="clippy-opt-check"><input type="radio" name="clippy-tips-mode" value="bulb"${this.values.tipsMode === 'bulb' ? ' checked' : ''}> ${t('clippy.optTipsBulb')}</label>
              <label class="clippy-opt-check"><input type="radio" name="clippy-tips-mode" value="balloon"${this.values.tipsMode === 'balloon' ? ' checked' : ''}> ${t('clippy.optTipsBalloon')}</label>
              ${this.checkbox('tipOfDay', t('clippy.optTipOfDay'))}
              <div class="clippy-opt-row">
                <span>${t('clippy.optAnnoyance')}</span>
                <select class="win-select clippy-opt-annoyance">${annoy.map(a => `<option value="${a}"${this.values.annoyance === a ? ' selected' : ''}>${annoyLabel[a]}</option>`).join('')}</select>
                <button class="win-btn clippy-opt-reset">${t('clippy.optResetTips')}</button>
              </div>
            </fieldset>
          </div>
        </div>
        <div class="win-dialog-buttons clippy-opt-buttons">
          <button class="win-btn is-default clippy-opt-ok">${t('btn.ok')}</button>
          <button class="win-btn clippy-opt-cancel">${t('btn.cancel')}</button>
        </div>
      </div>`;
  }

  openDialog(tab = 'options', actorId = null) {
    const wm = window.winManager;
    if (!wm) return null;
    const id = 'app_clippy_options';
    if (wm.windows.has(id)) wm.closeWindow(id);
    const win = wm.createWindow({
      id,
      title: this.t('clippy.optTitle'),
      icon: 'clippy',
      width: 400,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: this.dialogHtml(tab)
    });
    this.bindDialog(win, actorId);
    return win;
  }

  galleryList() {
    const actors = this.actors();
    return actors ? actors.actors.slice() : [];
  }

  bindDialog(win, actorId) {
    const el = win.element;
    const list = this.galleryList();
    let index = Math.max(0, list.findIndex(a => a.id === actorId));
    const actors = this.actors();
    const renderGallery = () => {
      const actor = list[index];
      if (!actor || !actors) return;
      el.querySelector('.clippy-gal-art').innerHTML = actors.portrait(actor.id, 96);
      el.querySelector('.clippy-gal-name').textContent = actors.pick(actor.name);
      el.querySelector('.clippy-gal-desc').textContent = actors.pick(actor.desc);
      el.querySelector('.clippy-gal-status').textContent = actors.status(actor.id);
      el.querySelector('.clippy-gal-visit').style.display = actor.id === 'rocky' && actors.rockyKnown() ? '' : 'none';
    };
    el.querySelectorAll('.win-tab').forEach(tabEl => tabEl.addEventListener('click', () => {
      el.querySelectorAll('.win-tab').forEach(x => x.classList.toggle('active', x === tabEl));
      el.querySelectorAll('.clippy-opt-page').forEach(p => p.classList.toggle('hidden', p.dataset.page !== tabEl.dataset.tab));
    }));
    el.querySelector('.clippy-gal-prev').addEventListener('click', () => { index = (index - 1 + list.length) % list.length; renderGallery(); });
    el.querySelector('.clippy-gal-next').addEventListener('click', () => { index = (index + 1) % list.length; renderGallery(); });
    el.querySelector('.clippy-gal-visit').addEventListener('click', () => {
      window.winManager.closeWindow(win.id || 'app_clippy_options');
      if (actors) actors.inviteRocky();
    });
    el.querySelector('.clippy-opt-reset').addEventListener('click', () => {
      if (window.clippyTips) window.clippyTips.reset();
      window.winManager.openDialog({ title: this.t('clippy.optTitle'), icon: 'info', message: this.t('clippy.tipsReset') });
    });
    el.querySelector('.clippy-opt-cancel').addEventListener('click', () => window.winManager.closeWindow('app_clippy_options'));
    el.querySelector('.clippy-opt-ok').addEventListener('click', () => {
      const chosen = {};
      el.querySelectorAll('input[data-opt]').forEach(box => { chosen[box.dataset.opt] = box.checked; });
      const mode = el.querySelector('input[name="clippy-tips-mode"]:checked');
      chosen.tipsMode = mode ? mode.value : this.values.tipsMode;
      chosen.annoyance = el.querySelector('.clippy-opt-annoyance').value;
      const actor = list[index];
      window.winManager.closeWindow('app_clippy_options');
      this.apply(chosen, actor && actor.id);
    });
    renderGallery();
  }

  apply(chosen, actorId) {
    const clippy = window.appClippy;
    const enabledBefore = this.values.enabled;
    Object.keys(chosen).forEach(key => {
      if (key === 'enabled' || key === 'annoyance') return;
      this.set(key, chosen[key]);
    });
    if (clippy && chosen.annoyance && chosen.annoyance !== this.values.annoyance) clippy.setAnnoyance(chosen.annoyance);
    else if (chosen.annoyance) this.set('annoyance', chosen.annoyance);
    if (clippy && typeof chosen.enabled === 'boolean' && chosen.enabled !== enabledBefore) {
      clippy.setEnabled(chosen.enabled, 'options');
      return;
    }
    if (actorId && actorId !== 'clippit') this.trySwitch(actorId);
  }

  cdLabel() {
    const vfs = window.vfs;
    if (!vfs || !vfs.isCdRomInserted || !vfs.isCdRomInserted('D:')) return null;
    const state = vfs.cdRomState || {};
    return state.volumeLabel || state.label || 'CD-ROM';
  }

  trySwitch(actorId) {
    const clippy = window.appClippy;
    const actors = this.actors();
    const actor = actors && actors.get(actorId);
    if (!actor || !window.winManager) return false;
    if (actorId === 'rocky') {
      window.winManager.openDialog({ title: this.t('clippy.optTitle'), icon: 'info', message: this.t('clippy.galleryOffice2000') });
      if (clippy) clippy.reactToSwitch(actorId);
      return true;
    }
    const label = this.cdLabel();
    window.winManager.openDialog({
      title: this.t('clippy.optTitle'),
      icon: 'warning',
      message: label ? this.t('clippy.galleryWrongCd', label) : this.t('clippy.galleryInsertCd'),
      buttons: [{ text: 'OK', primary: true, onClick: () => { if (clippy) clippy.reactToSwitch(actorId); } }]
    });
    return true;
  }
}

window.clippyOptions = new ClippyOptions();
