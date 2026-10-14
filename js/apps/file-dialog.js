class FileDialog {
  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  show(options) {
    const opts = Object.assign({
      mode: 'open',
      title: '',
      path: ['My Computer', 'C:', 'My Documents'],
      fileName: '',
      filters: [{ label: this.t('fdlg.allFiles'), exts: ['*'] }],
      onOk: null
    }, options);
    const state = {
      path: this.validPath(opts.path),
      filter: 0,
      view: 'list',
      selected: null
    };
    const save = opts.mode === 'save';
    const id = 'filedlg_' + Date.now();
    const win = window.winManager.createWindow({
      id,
      title: opts.title || this.t(save ? 'fdlg.saveTitle' : 'fdlg.openTitle'),
      icon: 'folder',
      width: 430,
      height: 268,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="fdlg">
          <div class="fdlg-top">
            <label class="fdlg-label">${this.t(save ? 'fdlg.saveIn' : 'fdlg.lookIn')}</label>
            <div class="fdlg-combo">
              <div class="win-select fdlg-folder" tabindex="0"></div>
              <div class="fdlg-combo-list"></div>
            </div>
            <button class="fdlg-tool fdlg-up" title="${this.t('fdlg.up')}">${Icons['tb16-folder-up']}</button>
            <button class="fdlg-tool fdlg-newfolder" title="${this.t('fdlg.newFolder')}">${Icons['tb16-folder-new']}</button>
            <span class="fdlg-tool-gap"></span>
            <button class="fdlg-tool fdlg-view-list pressed" title="${this.t('fdlg.list')}">${Icons['tb16-list']}</button>
            <button class="fdlg-tool fdlg-view-details" title="${this.t('fdlg.details')}">${Icons['tb16-details']}</button>
          </div>
          <div class="fdlg-files" tabindex="0"></div>
          <div class="fdlg-row">
            <label class="fdlg-label">${this.t('fdlg.fileName')}</label>
            <input type="text" class="fdlg-name" value="">
            <button class="win-btn is-default fdlg-ok">${this.t(save ? 'fdlg.save' : 'fdlg.open')}</button>
          </div>
          <div class="fdlg-row">
            <label class="fdlg-label">${this.t(save ? 'fdlg.saveType' : 'fdlg.openType')}</label>
            <select class="win-select fdlg-type">${opts.filters.map((f, i) => `<option value="${i}">${f.label}</option>`).join('')}</select>
            <button class="win-btn fdlg-cancel">${this.t('btn.cancel')}</button>
          </div>
        </div>`
    });
    const el = win.element;
    const q = s => el.querySelector(s);
    const nameInput = q('.fdlg-name');
    nameInput.value = opts.fileName || '';
    const close = () => window.winManager.closeWindow(id);

    const refresh = () => {
      this.fillFolders(q('.fdlg-folder'), q('.fdlg-combo-list'), state.path);
      this.fillFiles(q('.fdlg-files'), state, opts.filters[state.filter]);
      q('.fdlg-up').disabled = state.path.length === 0;
      q('.fdlg-view-list').classList.toggle('pressed', state.view === 'list');
      q('.fdlg-view-details').classList.toggle('pressed', state.view === 'details');
    };

    const enter = (key) => {
      state.path = state.path.concat(key);
      state.selected = null;
      refresh();
    };

    const accept = () => {
      const typed = nameInput.value.trim();
      if (!typed) return;
      const folderNode = window.vfs.resolvePath(state.path);
      const children = folderNode && folderNode.children ? folderNode.children : {};
      const folderKey = Object.keys(children).find(k => k.toLowerCase() === typed.toLowerCase() && children[k].children);
      if (folderKey) {
        enter(folderKey);
        nameInput.value = '';
        return;
      }
      let name = typed;
      const filter = opts.filters[state.filter];
      if (!name.includes('.') && filter.exts[0] !== '*') name += '.' + filter.exts[0];
      const existing = Object.keys(children).find(k => k.toLowerCase() === name.toLowerCase());
      if (!save) {
        if (!existing) {
          window.winManager.openDialog({ title: win.title, icon: 'warning', message: this.t('fdlg.notFound', name) });
          return;
        }
        close();
        if (opts.onOk) opts.onOk(state.path.slice(), existing);
        return;
      }
      if (existing) {
        window.winManager.openDialog({
          title: win.title,
          icon: 'warning',
          message: this.t('fdlg.replace', existing),
          buttons: [
            { text: 'Yes', primary: true, onClick: () => { close(); if (opts.onOk) opts.onOk(state.path.slice(), existing); } },
            { text: 'No' }
          ]
        });
        return;
      }
      close();
      if (opts.onOk) opts.onOk(state.path.slice(), name);
    };

    const combo = q('.fdlg-combo');
    q('.fdlg-folder').addEventListener('mousedown', (e) => {
      e.preventDefault();
      combo.classList.toggle('open');
    });
    q('.fdlg-combo-list').addEventListener('click', (e) => {
      const item = e.target.closest('.fdlg-combo-item');
      if (!item) return;
      combo.classList.remove('open');
      state.path = JSON.parse(item.dataset.path);
      state.selected = null;
      refresh();
    });
    el.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.fdlg-combo')) combo.classList.remove('open');
    });
    q('.fdlg-type').addEventListener('change', (e) => {
      state.filter = Number(e.target.value);
      refresh();
    });
    q('.fdlg-up').addEventListener('click', () => {
      if (!state.path.length) return;
      state.path = state.path.slice(0, -1);
      state.selected = null;
      refresh();
    });
    q('.fdlg-newfolder').addEventListener('click', () => {
      const base = this.t('fdlg.newFolderName');
      const node = window.vfs.resolvePath(state.path);
      if (!node || !node.children || state.path[0] !== 'My Computer') return;
      let name = base;
      for (let i = 2; node.children[name]; i++) name = `${base} (${i})`;
      window.vfs.createFolder(state.path, name);
      state.selected = name;
      refresh();
    });
    q('.fdlg-view-list').addEventListener('click', () => { state.view = 'list'; refresh(); });
    q('.fdlg-view-details').addEventListener('click', () => { state.view = 'details'; refresh(); });
    q('.fdlg-files').addEventListener('click', (e) => {
      const item = e.target.closest('.fdlg-item');
      if (!item) return;
      state.selected = item.dataset.key;
      el.querySelectorAll('.fdlg-item.selected').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      if (item.dataset.folder !== '1') nameInput.value = item.dataset.key;
    });
    q('.fdlg-files').addEventListener('dblclick', (e) => {
      const item = e.target.closest('.fdlg-item');
      if (!item) return;
      if (item.dataset.folder === '1') enter(item.dataset.key);
      else {
        nameInput.value = item.dataset.key;
        accept();
      }
    });
    q('.fdlg-ok').addEventListener('click', accept);
    q('.fdlg-cancel').addEventListener('click', close);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.target.closest('select')) {
        e.preventDefault();
        accept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (combo.classList.contains('open')) combo.classList.remove('open');
        else close();
      }
    });
    refresh();
    setTimeout(() => nameInput.focus(), 0);
    return win;
  }

  validPath(path) {
    let p = Array.isArray(path) ? path.slice() : [];
    if (p[0] === 'Desktop') p = p.slice(1);
    while (p.length && !window.vfs.resolvePath(p)) p.pop();
    return p;
  }

  displayName(path) {
    if (!path.length) return this.t('fdlg.desktop');
    const parent = window.vfs.resolvePath(path.slice(0, -1));
    const key = path[path.length - 1];
    const node = parent && parent.children ? parent.children[key] : null;
    return window.vfs.getNodeDisplayName(node, key) || key;
  }

  iconFor(node) {
    if (!node) return 'folder';
    if (node.icon && Icons[node.icon]) return node.icon;
    return node.children ? 'folder' : 'file-txt';
  }

  folderIcon(path) {
    if (!path.length) return 'show-desktop';
    if (path.length === 1 && path[0] === 'My Computer') return 'my-computer';
    const node = window.vfs.resolvePath(path);
    return this.iconFor(node);
  }

  fillFolders(field, list, path) {
    const entries = [{ path: [], depth: 0 }, { path: ['My Computer'], depth: 1 }];
    const myComputer = window.vfs.resolvePath(['My Computer']);
    Object.keys(myComputer && myComputer.children ? myComputer.children : {}).forEach(key => {
      const node = myComputer.children[key];
      if (node.children && node.type === 'drive') entries.push({ path: ['My Computer', key], depth: 2 });
    });
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    for (let i = 1; i <= path.length; i++) {
      const p = path.slice(0, i);
      if (entries.some(e => same(e.path, p))) continue;
      const parentAt = entries.findIndex(e => same(e.path, p.slice(0, -1)));
      entries.splice(parentAt + 1, 0, { path: p, depth: i });
    }
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const row = (e) => `<span class="fdlg-combo-icon icon-small">${Icons[this.folderIcon(e.path)] || Icons['folder']}</span><span class="fdlg-combo-text">${esc(this.displayName(e.path))}</span>`;
    field.innerHTML = row({ path });
    list.innerHTML = entries.map(e => `<div class="fdlg-combo-item${same(e.path, path) ? ' current' : ''}" data-path="${esc(JSON.stringify(e.path))}" style="padding-left:${2 + e.depth * 10}px">${row(e)}</div>`).join('');
  }

  fillFiles(box, state, filter) {
    const items = window.vfs.list(state.path);
    const matches = (name) => filter.exts[0] === '*' || filter.exts.some(ext => name.toLowerCase().endsWith('.' + ext));
    const folders = items.filter(i => i.children).sort((a, b) => a.displayName.localeCompare(b.displayName));
    const files = items.filter(i => !i.children && i.type !== 'shortcut' && matches(i.key)).sort((a, b) => a.key.localeCompare(b.key));
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const row = (item, folder) => {
      const size = folder ? '' : Math.max(1, Math.ceil(String(item.content || '').length / 1024)) + ' ' + this.t('fdlg.kb');
      const type = folder ? this.t('fdlg.typeFolder') : (item.key.split('.').pop().toUpperCase() + ' ' + this.t('fdlg.typeFile'));
      return `<div class="fdlg-item${state.selected === item.key ? ' selected' : ''}" data-key="${esc(item.key)}" data-folder="${folder ? 1 : 0}">
        <span class="fdlg-item-name"><span class="fdlg-item-icon icon-small">${Icons[this.iconFor(item)] || Icons['folder']}</span><span class="fdlg-item-text">${esc(folder ? item.displayName : item.key)}</span></span>
        ${state.view === 'details' ? `<span class="fdlg-item-size">${size}</span><span class="fdlg-item-type">${esc(type)}</span>` : ''}
      </div>`;
    };
    const head = state.view === 'details'
      ? `<div class="fdlg-head"><span>${this.t('fdlg.colName')}</span><span>${this.t('fdlg.colSize')}</span><span>${this.t('fdlg.colType')}</span></div>`
      : '';
    box.className = 'fdlg-files fdlg-' + state.view;
    box.innerHTML = head + '<div class="fdlg-items">' + folders.map(f => row(f, true)).join('') + files.map(f => row(f, false)).join('') + '</div>';
  }
}

window.fileDialog = new FileDialog();
