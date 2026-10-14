class AppRegEdit {
  constructor() {
    this.storageKey = 'win98_registry_data';
    this.registry = this.loadRegistry();
    this.selectedPath = ['My Computer', 'HKEY_LOCAL_MACHINE', 'HARDWARE'];
    this.expanded = new Set(['My Computer', 'My Computer\\HKEY_LOCAL_MACHINE']);
    this.selectedValue = null;
    this.treeWidth = 200;
    this.find = { text: '', keys: true, values: true, data: true, whole: false };
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  loadRegistry() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: 'My Computer',
      children: {
        'HKEY_CLASSES_ROOT': {
          children: {
            '.txt': { values: { '(Default)': { type: 'REG_SZ', data: 'txtfile' } } },
            '.bmp': { values: { '(Default)': { type: 'REG_SZ', data: 'Paint.Picture' } } },
            '.mid': { values: { '(Default)': { type: 'REG_SZ', data: 'midfile' } } }
          }
        },
        'HKEY_CURRENT_USER': {
          children: {
            'Control Panel': {
              children: {
                'Desktop': {
                  values: {
                    'Wallpaper': { type: 'REG_SZ', data: '(None)' },
                    'TileWallpaper': { type: 'REG_SZ', data: '0' },
                    'ScreenSaveActive': { type: 'REG_SZ', data: '1' },
                    'ScreenSaveTimeOut': { type: 'REG_SZ', data: '60' }
                  }
                },
                'Colors': {
                  values: {
                    'Background': { type: 'REG_SZ', data: '0 128 128' },
                    'ActiveTitle': { type: 'REG_SZ', data: '0 0 128' },
                    'Window': { type: 'REG_SZ', data: '255 255 255' }
                  }
                }
              }
            },
            'Software': {
              children: {
                'Microslop': {
                  children: {
                    'Win': {
                      children: {
                        'CurrentVersion': {
                          values: {
                            'RegisteredOwner': { type: 'REG_SZ', data: 'Alexey Ivanov' },
                            'RegisteredOrganization': { type: 'REG_SZ', data: 'Home Workstation' },
                            'Version': { type: 'REG_SZ', data: 'Win 98 Second Edition 4.10.2222 A' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        'HKEY_LOCAL_MACHINE': {
          children: {
            'HARDWARE': {
              values: {
                'Processor': { type: 'REG_SZ', data: 'Intel Pentium II processor 300MHz' },
                'TotalRAM': { type: 'REG_SZ', data: '64 MB SDRAM' },
                'VideoAdapter': { type: 'REG_SZ', data: '3dfx Voodoo2 12MB 3D Accelerator' },
                'SoundCard': { type: 'REG_SZ', data: 'Creative Sound Blaster 16 AWE64' }
              }
            },
            'SOFTWARE': {
              values: {
                'DirectX': { type: 'REG_SZ', data: 'DirectX 6.1 (4.06.02.0436)' }
              }
            }
          }
        },
        'HKEY_USERS': { children: { '.DEFAULT': { values: {} } } },
        'HKEY_CURRENT_CONFIG': { children: { 'Display': { values: { 'Resolution': { type: 'REG_SZ', data: '800,600' } } } } },
        'HKEY_DYN_DATA': { children: { 'PerfStats': { values: {} } } }
      }
    };
  }

  saveRegistry() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.registry));
    } catch (e) {}
  }

  esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  open() {
    const winId = 'app_regedit';
    if (window.winManager.windows.has(winId)) {
      window.winManager.createWindow({ id: winId });
      return;
    }
    const t = (k, ...a) => this.t(k, ...a);
    const m = (cmd, label, shortcut = '', extra = '') => `<div class="win-dropdown-option${extra}" data-cmd="${cmd}">${label}${shortcut ? ` <span>${shortcut}</span>` : ''}</div>`;
    const sep = '<div class="win-menu-separator"></div>';
    const content = document.createElement('div');
    content.className = 'regedit-window';
    content.innerHTML = `
      <div class="win-menubar regedit-menubar">
        <div class="win-menu-item">${t('regedit.menuRegistry')}
          <div class="win-menu-dropdown">
            ${m('export', t('regedit.menuExport'))}
            ${sep}
            ${m('exit', t('regedit.menuExit'))}
          </div>
        </div>
        <div class="win-menu-item">${t('regedit.menuEdit')}
          <div class="win-menu-dropdown">
            ${m('new-key', t('regedit.menuNewKey'))}
            ${m('new-sz', t('regedit.menuNewString'))}
            ${m('new-bin', t('regedit.menuNewBinary'))}
            ${m('new-dword', t('regedit.menuNewDword'))}
            ${sep}
            ${m('delete', t('regedit.menuDelete'), 'Del')}
            ${m('rename', t('regedit.menuRename'))}
            ${sep}
            ${m('copy-key', t('regedit.menuCopyKey'))}
            ${sep}
            ${m('find', t('regedit.menuFind'), 'Ctrl+F')}
            ${m('find-next', t('regedit.menuFindNext'), 'F3')}
          </div>
        </div>
        <div class="win-menu-item">${t('regedit.menuView')}
          <div class="win-menu-dropdown">
            ${m('status', t('regedit.menuStatusBar'), '', ' is-checked')}
            ${sep}
            ${m('refresh', t('regedit.menuRefresh'), 'F5')}
          </div>
        </div>
        <div class="win-menu-item">${t('regedit.menuHelp')}
          <div class="win-menu-dropdown">
            ${m('help', t('regedit.menuHelpTopics'))}
            ${sep}
            ${m('about', t('regedit.menuAbout'))}
          </div>
        </div>
      </div>
      <div class="regedit-body">
        <div class="regedit-tree-panel" tabindex="0"></div>
        <div class="regedit-splitter"></div>
        <div class="regedit-values-panel" tabindex="0">
          <div class="regedit-head"><span class="rh-name">${t('regedit.colName')}</span><span class="rh-data">${t('regedit.colData')}</span></div>
          <div class="regedit-values"></div>
        </div>
      </div>
      <div class="win-statusbar regedit-status"><div class="win-status-pane grow regedit-status-text"></div></div>
    `;
    this.win = window.winManager.createWindow({
      id: winId,
      title: t('regedit.title'),
      icon: 'regedit',
      width: 600,
      height: 420,
      content
    });
    this.el = content;
    this.bind();
    this.render();
  }

  bind() {
    const el = this.el;
    el.querySelectorAll('.regedit-menubar [data-cmd]').forEach(opt => opt.addEventListener('click', () => this.command(opt.dataset.cmd)));
    const tree = el.querySelector('.regedit-tree-panel');
    tree.addEventListener('mousedown', (e) => {
      const toggle = e.target.closest('.rt-toggle');
      const row = e.target.closest('.rt-row');
      if (!row) return;
      const path = JSON.parse(row.dataset.path);
      const key = path.join('\\');
      if (toggle) {
        if (this.expanded.has(key)) this.expanded.delete(key);
        else this.expanded.add(key);
        this.renderTree();
        return;
      }
      this.selectKey(path);
    });
    tree.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.rt-row');
      if (!row || e.target.closest('.rt-toggle')) return;
      const key = JSON.parse(row.dataset.path).join('\\');
      if (this.expanded.has(key)) this.expanded.delete(key);
      else this.expanded.add(key);
      this.renderTree();
    });
    const values = el.querySelector('.regedit-values-panel');
    values.addEventListener('mousedown', (e) => {
      const row = e.target.closest('.rv-row');
      this.selectedValue = row ? row.dataset.name : null;
      this.renderValues();
    });
    values.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.rv-row');
      if (row) this.editValue(row.dataset.name);
    });
    values.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const row = e.target.closest('.rv-row');
      if (!window.contextMenu) return;
      const items = row
        ? [
          { label: this.t('regedit.ctxModify'), action: () => this.editValue(row.dataset.name) },
          { separator: true },
          { label: this.t('regedit.menuDelete'), action: () => this.command('delete') },
          { label: this.t('regedit.menuRename'), action: () => this.command('rename') }
        ]
        : [
          { label: this.t('regedit.menuNewKey'), action: () => this.command('new-key') },
          { label: this.t('regedit.menuNewString'), action: () => this.command('new-sz') },
          { label: this.t('regedit.menuNewBinary'), action: () => this.command('new-bin') },
          { label: this.t('regedit.menuNewDword'), action: () => this.command('new-dword') }
        ];
      window.contextMenu.show(e.clientX, e.clientY, items);
    });
    el.querySelector('.regedit-splitter').addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = this.treeWidth;
      const move = ev => {
        this.treeWidth = Math.max(80, Math.min(el.clientWidth - 120, startW + ev.clientX - startX));
        el.querySelector('.regedit-tree-panel').style.width = this.treeWidth + 'px';
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
    const onKey = (e) => {
      if (window.winManager.activeWindowId !== 'app_regedit') return;
      if (e.target && e.target.closest && e.target.closest('input')) return;
      if (e.key === 'F3') { e.preventDefault(); this.command('find-next'); }
      else if (e.key === 'F5') { e.preventDefault(); this.command('refresh'); }
      else if (e.key === 'Delete') { e.preventDefault(); this.command('delete'); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'f') { e.preventDefault(); this.command('find'); }
    };
    window.addEventListener('keydown', onKey);
    this.win.onClose = () => {
      window.removeEventListener('keydown', onKey);
      this.win = null;
    };
  }

  getNodeByPath(path) {
    let curr = this.registry;
    for (let i = 1; i < path.length; i++) {
      if (!curr.children || !curr.children[path[i]]) return null;
      curr = curr.children[path[i]];
    }
    return curr;
  }

  displayPath(path) {
    return [this.t('app.myComputer'), ...path.slice(1)].join('\\');
  }

  selectKey(path) {
    this.selectedPath = path.slice();
    this.selectedValue = null;
    for (let i = 1; i < path.length; i++) this.expanded.add(path.slice(0, i).join('\\'));
    this.render();
  }

  render() {
    if (!this.win) return;
    this.el.querySelector('.regedit-tree-panel').style.width = this.treeWidth + 'px';
    this.renderTree();
    this.renderValues();
    this.el.querySelector('.regedit-status-text').textContent = this.displayPath(this.selectedPath);
  }

  renderTree() {
    const tree = this.el.querySelector('.regedit-tree-panel');
    const selected = this.selectedPath.join('\\');
    const rows = [];
    const walk = (node, name, path, ancestors, isLast) => {
      const key = path.join('\\');
      const kids = node.children ? Object.keys(node.children) : [];
      const open = this.expanded.has(key);
      const isRoot = path.length === 1;
      const icon = isRoot ? 'my-computer' : key === selected ? 'folder-open-sm' : 'folder';
      const guides = ancestors.map(hasNext => `<span class="rt-guide${hasNext ? ' line' : ''}"></span>`).join('');
      const toggle = kids.length ? `<span class="rt-toggle">${open ? '−' : '+'}</span>` : '';
      const branch = isRoot ? '' : `<span class="rt-branch${isLast ? ' last' : ''}">${toggle}</span>`;
      const label = this.esc(isRoot ? this.t('app.myComputer') : name);
      rows.push(`<div class="rt-row${key === selected ? ' selected' : ''}" data-path="${this.esc(JSON.stringify(path))}">${guides}${branch}<span class="rt-icon icon-small">${Icons[icon] || Icons.folder}</span><span class="rt-label">${label}</span></div>`);
      if (!open) return;
      kids.forEach((k, i) => walk(node.children[k], k, path.concat(k), isRoot ? [] : ancestors.concat([!isLast]), i === kids.length - 1));
    };
    walk(this.registry, 'My Computer', ['My Computer'], [], true);
    tree.innerHTML = rows.join('');
  }

  formatData(val) {
    if (!val) return this.t('regedit.notSetValue');
    if (val.type === 'REG_DWORD') {
      const n = Number(val.data) >>> 0;
      return `0x${n.toString(16).padStart(8, '0')} (${n})`;
    }
    if (val.type === 'REG_BINARY') {
      const s = String(val.data || '').trim();
      return s || this.t('regedit.binaryEmpty');
    }
    return `"${val.data}"`;
  }

  renderValues() {
    const box = this.el.querySelector('.regedit-values');
    const node = this.getNodeByPath(this.selectedPath);
    if (!node) {
      box.innerHTML = '';
      return;
    }
    const values = node.values || {};
    const names = Object.keys(values).filter(n => n !== '(Default)').sort((a, b) => a.localeCompare(b));
    const rows = [];
    const row = (name, label, val, icon) => rows.push(`<div class="rv-row${this.selectedValue === name ? ' selected' : ''}" data-name="${this.esc(name)}"><span class="rv-name"><span class="rv-icon icon-small">${Icons[icon]}</span><span class="rv-label">${this.esc(label)}</span></span><span class="rv-data">${this.esc(this.formatData(val))}</span></div>`);
    if (this.selectedPath.length > 1) row('(Default)', this.t('regedit.defaultName'), values['(Default)'], 'reg-sz');
    names.forEach(n => row(n, n, values[n], values[n].type === 'REG_SZ' ? 'reg-sz' : 'reg-bin'));
    box.innerHTML = rows.join('');
  }

  uniqueName(obj, base) {
    let i = 1;
    while (obj[`${base} #${i}`]) i++;
    return `${base} #${i}`;
  }

  command(cmd) {
    const node = this.getNodeByPath(this.selectedPath);
    const t = (k, ...a) => this.t(k, ...a);
    const actions = {
      exit: () => window.winManager.closeWindow('app_regedit'),
      export: () => {
        const lines = ['REGEDIT4', ''];
        const walk = (n, path) => {
          lines.push(`[${path.join('\\')}]`);
          Object.entries(n.values || {}).forEach(([k, v]) => {
            const name = k === '(Default)' ? '@' : `"${k}"`;
            if (v.type === 'REG_DWORD') lines.push(`${name}=dword:${(Number(v.data) >>> 0).toString(16).padStart(8, '0')}`);
            else if (v.type === 'REG_BINARY') lines.push(`${name}=hex:${String(v.data).trim().split(/\s+/).join(',')}`);
            else lines.push(`${name}="${String(v.data).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
          });
          lines.push('');
          Object.entries(n.children || {}).forEach(([k, c]) => walk(c, path.concat(k)));
        };
        const target = this.selectedPath.length > 1 ? node : this.registry;
        walk(target, this.selectedPath.length > 1 ? this.selectedPath.slice(1) : []);
        window.fileDialog.show({
          mode: 'save',
          path: ['My Computer', 'C:', 'My Documents'],
          fileName: t('regedit.exportName'),
          filters: [{ label: t('regedit.filterReg'), exts: ['reg'] }],
          onOk: (path, name) => window.vfs.writeFile(path, name, lines.join('\r\n'))
        });
      },
      'new-key': () => {
        if (!node) return;
        node.children = node.children || {};
        const name = this.uniqueName(node.children, t('regedit.newKeyName'));
        node.children[name] = { values: {} };
        this.saveRegistry();
        this.expanded.add(this.selectedPath.join('\\'));
        this.selectKey(this.selectedPath.concat(name));
      },
      'new-sz': () => this.newValue('REG_SZ', ''),
      'new-bin': () => this.newValue('REG_BINARY', ''),
      'new-dword': () => this.newValue('REG_DWORD', 0),
      delete: () => {
        if (this.selectedValue) {
          if (this.selectedValue === '(Default)') return;
          window.winManager.openDialog({
            title: t('regedit.confirmDeleteTitle'), icon: 'warning', message: t('regedit.confirmDeleteValue'),
            buttons: [{ text: 'Yes', primary: true, onClick: () => { delete node.values[this.selectedValue]; this.selectedValue = null; this.saveRegistry(); this.renderValues(); } }, { text: 'No' }]
          });
        } else if (this.selectedPath.length > 2) {
          window.winManager.openDialog({
            title: t('regedit.confirmDeleteTitle'), icon: 'warning', message: t('regedit.confirmDeleteKey'),
            buttons: [{ text: 'Yes', primary: true, onClick: () => {
              const parent = this.getNodeByPath(this.selectedPath.slice(0, -1));
              delete parent.children[this.selectedPath[this.selectedPath.length - 1]];
              this.saveRegistry();
              this.selectKey(this.selectedPath.slice(0, -1));
            } }, { text: 'No' }]
          });
        }
      },
      rename: () => {
        const isValue = !!this.selectedValue && this.selectedValue !== '(Default)';
        if (!isValue && this.selectedPath.length <= 2) return;
        const old = isValue ? this.selectedValue : this.selectedPath[this.selectedPath.length - 1];
        window.winManager.openPromptDialog({
          title: t('regedit.menuRename'), icon: 'regedit', message: t('regedit.renamePrompt'), value: old,
          onOk: (value) => {
            const name = String(value || '').trim();
            if (!name || name === old) return;
            if (isValue) {
              if (node.values[name]) return;
              node.values[name] = node.values[old];
              delete node.values[old];
              this.selectedValue = name;
              this.saveRegistry();
              this.renderValues();
            } else {
              const parent = this.getNodeByPath(this.selectedPath.slice(0, -1));
              if (parent.children[name]) return;
              parent.children[name] = parent.children[old];
              delete parent.children[old];
              this.saveRegistry();
              this.selectKey(this.selectedPath.slice(0, -1).concat(name));
            }
          }
        });
      },
      'copy-key': () => {
        const text = this.selectedPath.slice(1).join('\\');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(() => {});
      },
      find: () => this.openFind(),
      'find-next': () => {
        if (this.find.text) this.findNext();
        else this.openFind();
      },
      status: () => {
        const bar = this.el.querySelector('.regedit-status');
        const hidden = bar.classList.toggle('hidden');
        this.el.querySelector('[data-cmd="status"]').classList.toggle('is-checked', !hidden);
      },
      refresh: () => this.render(),
      help: () => { if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp(); },
      about: () => window.winManager.openDialog({ title: t('regedit.aboutTitle'), icon: 'regedit', message: t('regedit.aboutText') })
    };
    if (actions[cmd]) actions[cmd]();
  }

  newValue(type, data) {
    if (this.selectedPath.length < 2) return;
    const node = this.getNodeByPath(this.selectedPath);
    node.values = node.values || {};
    const name = this.uniqueName(node.values, this.t('regedit.newValueName'));
    node.values[name] = { type, data };
    this.selectedValue = name;
    this.saveRegistry();
    this.renderValues();
  }

  editValue(name) {
    const node = this.getNodeByPath(this.selectedPath);
    if (!node) return;
    node.values = node.values || {};
    const val = node.values[name] || { type: 'REG_SZ', data: '' };
    const id = 'app_regedit_edit';
    if (window.winManager.windows.has(id)) return;
    const t = (k, ...a) => this.t(k, ...a);
    const dword = val.type === 'REG_DWORD';
    const titleKey = dword ? 'regedit.editDwordTitle' : val.type === 'REG_BINARY' ? 'regedit.editBinaryTitle' : 'regedit.editStringTitle';
    const shown = dword ? (Number(val.data) >>> 0).toString(16) : String(val.data || '');
    const dlg = window.winManager.createWindow({
      id,
      title: t(titleKey),
      icon: 'regedit',
      width: 340,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="reg-edit-dlg">
          <label>${t('regedit.valueName')}</label>
          <input type="text" class="re-name" value="${this.esc(name === '(Default)' ? t('regedit.defaultName') : name)}" readonly>
          <label>${t('regedit.valueData')}</label>
          <div class="re-data-row">
            <input type="text" class="re-data" value="${this.esc(shown)}">
            ${dword ? `<fieldset class="re-base"><legend>${t('regedit.base')}</legend><label><input type="radio" name="re-base" value="16" checked> ${t('regedit.hex')}</label><label><input type="radio" name="re-base" value="10"> ${t('regedit.dec')}</label></fieldset>` : ''}
          </div>
          <div class="re-buttons"><button class="win-btn is-default re-ok">${t('btn.ok')}</button><button class="win-btn re-cancel">${t('btn.cancel')}</button></div>
        </div>`
    });
    const input = dlg.element.querySelector('.re-data');
    let base = 16;
    dlg.element.querySelectorAll('input[name="re-base"]').forEach(r => r.addEventListener('change', () => {
      const n = parseInt(input.value, base) >>> 0;
      base = Number(r.value);
      input.value = n.toString(base);
    }));
    const ok = () => {
      let data = input.value;
      if (dword) data = parseInt(data || '0', base) >>> 0;
      node.values[name] = { type: val.type, data };
      this.saveRegistry();
      window.winManager.closeWindow(id);
      this.selectedValue = name;
      this.renderValues();
    };
    dlg.element.querySelector('.re-ok').addEventListener('click', ok);
    dlg.element.querySelector('.re-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') ok();
      if (e.key === 'Escape') window.winManager.closeWindow(id);
    });
    setTimeout(() => input.select(), 0);
  }

  openFind() {
    const id = 'app_regedit_find';
    if (window.winManager.windows.has(id)) return;
    const t = (k, ...a) => this.t(k, ...a);
    const f = this.find;
    const check = (cls, label, on) => `<label><input type="checkbox" class="${cls}"${on ? ' checked' : ''}> ${label}</label>`;
    const dlg = window.winManager.createWindow({
      id,
      title: t('regedit.findTitle'),
      icon: 'find',
      width: 360,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="reg-find-dlg">
          <div class="reg-find-main">
            <div class="reg-find-row"><label>${t('regedit.findWhat')}</label><input type="text" class="rf-text" value="${this.esc(f.text)}"></div>
            <fieldset class="reg-find-group"><legend>${t('regedit.findLookAt')}</legend>
              ${check('rf-keys', t('regedit.findKeys'), f.keys)}
              ${check('rf-values', t('regedit.findValues'), f.values)}
              ${check('rf-data', t('regedit.findData'), f.data)}
            </fieldset>
            ${check('rf-whole', t('regedit.findWhole'), f.whole)}
          </div>
          <div class="reg-find-buttons"><button class="win-btn is-default rf-ok">${t('regedit.menuFindNext')}</button><button class="win-btn rf-cancel">${t('btn.cancel')}</button></div>
        </div>`
    });
    const q = s => dlg.element.querySelector(s);
    const run = () => {
      f.text = q('.rf-text').value;
      f.keys = q('.rf-keys').checked;
      f.values = q('.rf-values').checked;
      f.data = q('.rf-data').checked;
      f.whole = q('.rf-whole').checked;
      if (!f.text) return;
      window.winManager.closeWindow(id);
      this.findNext();
    };
    q('.rf-ok').addEventListener('click', run);
    q('.rf-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
    dlg.element.addEventListener('keydown', e => {
      if (e.key === 'Enter') run();
      if (e.key === 'Escape') window.winManager.closeWindow(id);
    });
    setTimeout(() => q('.rf-text').select(), 0);
  }

  findNext() {
    const f = this.find;
    const needle = f.text.toLowerCase();
    const match = s => {
      const v = String(s).toLowerCase();
      return f.whole ? v === needle : v.includes(needle);
    };
    const hits = [];
    const walk = (node, path) => {
      if (path.length > 1 && f.keys && match(path[path.length - 1])) hits.push({ path, value: null });
      Object.entries(node.values || {}).forEach(([k, v]) => {
        if ((f.values && match(k)) || (f.data && match(v.data))) hits.push({ path, value: k });
      });
      Object.entries(node.children || {}).forEach(([k, c]) => walk(c, path.concat(k)));
    };
    walk(this.registry, ['My Computer']);
    const current = this.selectedPath.join('\\') + '|' + (this.selectedValue || '');
    const idx = hits.findIndex(h => h.path.join('\\') + '|' + (h.value || '') === current);
    const next = hits[idx + 1];
    if (!next) {
      window.winManager.openDialog({ title: this.t('regedit.title'), icon: 'info', message: this.t('regedit.findDone') });
      return;
    }
    this.selectKey(next.path);
    this.selectedValue = next.value;
    this.renderValues();
  }
}

window.appRegEdit = new AppRegEdit();
