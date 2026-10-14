class AppFind {
  constructor() {
    this.results = [];
    this.searching = false;
    this.win = null;
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  locations() {
    return [
      { path: ['My Computer', 'C:', 'My Documents'], label: this.t('app.myDocs'), icon: 'my-documents' },
      { path: ['Desktop'], label: this.t('fdlg.desktop'), icon: 'show-desktop' },
      { path: ['My Computer', 'C:'], label: '(C:)', icon: 'drive-c' },
      { path: ['My Computer'], label: this.t('app.myComputer'), icon: 'my-computer' }
    ].filter(l => window.vfs && window.vfs.resolvePath(l.path));
  }

  open() {
    if (window.winManager.windows.has('app_find')) {
      window.winManager.createWindow({ id: 'app_find' });
      return;
    }
    const t = (k, ...a) => this.t(k, ...a);
    const locs = this.locations();
    const m = (cmd, label, extra = '') => `<div class="win-dropdown-option${extra}" data-cmd="${cmd}">${label}</div>`;
    const sep = '<div class="win-menu-separator"></div>';
    const content = document.createElement('div');
    content.className = 'find-window';
    content.innerHTML = `
      <div class="win-menubar find-menubar">
        <div class="win-menu-item">${t('find.menuFile')}
          <div class="win-menu-dropdown">
            ${m('open', t('find.menuOpen'), ' needs-sel')}
            ${m('open-folder', t('find.menuOpenFolder'), ' needs-sel')}
            ${sep}
            ${m('exit', t('find.menuClose'))}
          </div>
        </div>
        <div class="win-menu-item">${t('find.menuEdit')}
          <div class="win-menu-dropdown">
            ${m('select-all', t('find.menuSelectAll'))}
          </div>
        </div>
        <div class="win-menu-item">${t('find.menuView')}
          <div class="win-menu-dropdown">
            ${m('view-details', t('find.menuDetails'), ' is-radio is-checked')}
            ${m('view-list', t('find.menuList'), ' is-radio')}
          </div>
        </div>
        <div class="win-menu-item">${t('find.menuOptions')}
          <div class="win-menu-dropdown">
            ${m('case', t('find.menuCase'))}
          </div>
        </div>
        <div class="win-menu-item">${t('find.menuHelp')}
          <div class="win-menu-dropdown">
            ${m('help', t('find.menuHelpTopics'))}
          </div>
        </div>
      </div>
      <div class="find-top">
        <div class="find-tabs-area">
          <div class="find-tabs">
            <div class="find-tab active" data-tab="name">${t('find.tabName')}</div>
            <div class="find-tab" data-tab="adv">${t('find.tabAdvanced')}</div>
          </div>
          <div class="find-panel" data-panel="name">
            <div class="find-row"><label>${t('find.named')}</label><input type="text" class="find-name"></div>
            <div class="find-row"><label>${t('find.containing')}</label><input type="text" class="find-text"></div>
            <div class="find-row"><label>${t('find.lookIn')}</label>
              <select class="win-select find-where">${locs.map((l, i) => `<option value="${i}">${this.esc(l.label)}</option>`).join('')}</select>
            </div>
            <div class="find-row find-row-last"><label class="find-check"><input type="checkbox" class="find-sub" checked> ${t('find.subfolders')}</label></div>
          </div>
          <div class="find-panel hidden" data-panel="adv">
            <div class="find-row"><label>${t('find.ofType')}</label>
              <select class="win-select find-type">
                <option value="all">${t('find.typeAll')}</option>
                <option value="txt">${t('find.typeText')}</option>
                <option value="img">${t('find.typeImage')}</option>
                <option value="doc">${t('find.typeDoc')}</option>
                <option value="exe">${t('find.typeApp')}</option>
                <option value="folder">${t('find.typeFolder')}</option>
              </select>
            </div>
            <div class="find-row"><label>${t('find.sizeIs')}</label>
              <select class="win-select find-size-op"><option value="any"></option><option value="min">${t('find.atLeast')}</option><option value="max">${t('find.atMost')}</option></select>
              <input type="text" class="find-size" value="0"><span>${t('fdlg.kb')}</span>
            </div>
          </div>
        </div>
        <div class="find-buttons">
          <button class="win-btn is-default find-go">${t('find.findNow')}</button>
          <button class="win-btn find-stop" disabled>${t('find.stop')}</button>
          <button class="win-btn find-new">${t('find.newSearch')}</button>
          <div class="find-anim">${Icons['find']}</div>
        </div>
      </div>
      <div class="find-results hidden">
        <div class="find-head"><span>${t('find.colName')}</span><span>${t('find.colFolder')}</span><span>${t('find.colSize')}</span><span>${t('find.colType')}</span></div>
        <div class="find-list" tabindex="0"></div>
      </div>
      <div class="win-statusbar find-status hidden"><div class="win-status-pane grow find-status-text"></div></div>
    `;
    this.win = window.winManager.createWindow({
      id: 'app_find',
      title: t('find.title'),
      icon: 'find',
      width: 470,
      height: 'auto',
      minWidth: 420,
      content
    });
    this.el = content;
    this.bind();
    setTimeout(() => content.querySelector('.find-name').focus(), 0);
  }

  bind() {
    const el = this.el;
    el.querySelectorAll('.find-tab').forEach(tab => tab.addEventListener('click', () => {
      el.querySelectorAll('.find-tab').forEach(x => x.classList.toggle('active', x === tab));
      el.querySelectorAll('.find-panel').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== tab.dataset.tab));
    }));
    el.querySelector('.find-go').addEventListener('click', () => this.search());
    el.querySelector('.find-stop').addEventListener('click', () => { this.searching = false; });
    el.querySelector('.find-new').addEventListener('click', () => {
      el.querySelectorAll('input[type="text"]').forEach(i => { i.value = i.classList.contains('find-size') ? '0' : ''; });
      this.results = [];
      this.renderResults(false);
      el.querySelector('.find-name').focus();
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.closest('.find-top')) {
        e.preventDefault();
        this.search();
      }
    });
    el.querySelectorAll('.find-menubar [data-cmd]').forEach(opt => opt.addEventListener('click', () => this.command(opt.dataset.cmd)));
    const list = el.querySelector('.find-list');
    list.addEventListener('mousedown', e => {
      const row = e.target.closest('.find-item');
      list.querySelectorAll('.find-item.selected').forEach(r => r.classList.remove('selected'));
      if (row) row.classList.add('selected');
    });
    list.addEventListener('dblclick', e => {
      const row = e.target.closest('.find-item');
      if (row) this.openResult(this.results[Number(row.dataset.index)]);
    });
    this.win.onClose = () => {
      this.searching = false;
      this.win = null;
    };
  }

  command(cmd) {
    const el = this.el;
    const selected = () => {
      const row = el.querySelector('.find-item.selected');
      return row ? this.results[Number(row.dataset.index)] : null;
    };
    if (cmd === 'open') {
      const r = selected();
      if (r) this.openResult(r);
    } else if (cmd === 'open-folder') {
      const r = selected();
      if (r && window.appExplorer) window.appExplorer.open(r.folder);
    } else if (cmd === 'exit') window.winManager.closeWindow('app_find');
    else if (cmd === 'select-all') el.querySelectorAll('.find-item').forEach(r => r.classList.add('selected'));
    else if (cmd === 'view-details' || cmd === 'view-list') {
      el.querySelector('.find-results').classList.toggle('list-view', cmd === 'view-list');
      el.querySelector('[data-cmd="view-details"]').classList.toggle('is-checked', cmd === 'view-details');
      el.querySelector('[data-cmd="view-list"]').classList.toggle('is-checked', cmd === 'view-list');
    } else if (cmd === 'case') {
      this.matchCase = !this.matchCase;
      el.querySelector('[data-cmd="case"]').classList.toggle('is-checked', this.matchCase);
    } else if (cmd === 'help') {
      if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp();
    }
  }

  wildcard(pattern) {
    const parts = pattern.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    if (!parts.length) return null;
    return parts.map(p => {
      const hasWild = /[*?]/.test(p);
      const body = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
      return new RegExp(hasWild ? `^${body}$` : body, this.matchCase ? '' : 'i');
    });
  }

  typeOf(key, node) {
    if (node.children) return 'folder';
    const ext = (key.split('.').pop() || '').toLowerCase();
    if (node.type === 'executable' || ['exe', 'com', 'bat'].includes(ext)) return 'exe';
    if (['txt', 'ini', 'log', 'sys'].includes(ext)) return 'txt';
    if (['bmp', 'png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'img';
    if (['rtf', 'doc', 'wri', 'xls'].includes(ext)) return 'doc';
    return 'other';
  }

  typeLabel(key, node) {
    if (node.children) return this.t('fdlg.typeFolder');
    if (node.type === 'executable') return this.t('find.typeApp');
    const ext = key.includes('.') ? key.split('.').pop().toUpperCase() : '';
    return ext ? `${ext} ${this.t('fdlg.typeFile')}` : this.t('fdlg.typeFile');
  }

  search() {
    const el = this.el;
    const locs = this.locations();
    const where = locs[Number(el.querySelector('.find-where').value)] || locs[0];
    const names = this.wildcard(el.querySelector('.find-name').value);
    const text = el.querySelector('.find-text').value;
    const sub = el.querySelector('.find-sub').checked;
    const type = el.querySelector('.find-type').value;
    const sizeOp = el.querySelector('.find-size-op').value;
    const sizeKb = Number(el.querySelector('.find-size').value) || 0;
    const needle = this.matchCase ? text : text.toLowerCase();
    const queue = [where.path];
    const found = [];
    const visit = (path) => {
      const node = window.vfs.resolvePath(path);
      if (!node || !node.children) return;
      Object.keys(node.children).forEach(key => {
        const child = node.children[key];
        const display = window.vfs.getNodeDisplayName(child, key) || key;
        const kind = this.typeOf(key, child);
        const size = child.children ? 0 : Math.ceil(String(child.content || '').length / 1024);
        let ok = !names || names.some(r => r.test(key) || r.test(display));
        if (ok && text) ok = !child.children && typeof child.content === 'string' && !child.content.startsWith('data:') && (this.matchCase ? child.content : child.content.toLowerCase()).includes(needle);
        if (ok && type !== 'all') ok = kind === type;
        if (ok && sizeOp === 'min') ok = !child.children && size >= sizeKb;
        if (ok && sizeOp === 'max') ok = !child.children && size <= sizeKb;
        if (ok && (names || text || type !== 'all' || sizeOp !== 'any')) found.push({ key, name: child.children ? display : key, node: child, folder: path, size, kind });
        if (child.children && sub && child.type !== 'shortcut') queue.push(path.concat(key));
      });
    };
    this.searching = true;
    this.results = [];
    el.querySelector('.find-stop').disabled = false;
    el.querySelector('.find-go').disabled = true;
    el.querySelector('.find-anim').classList.add('busy');
    this.renderResults(true);
    const step = () => {
      if (!this.win) return;
      let n = 0;
      while (queue.length && this.searching && n++ < 12) visit(queue.shift());
      this.results = found.slice();
      this.renderResults(true);
      if (queue.length && this.searching) setTimeout(step, 40);
      else this.finish();
    };
    step();
  }

  finish() {
    this.searching = false;
    const el = this.el;
    el.querySelector('.find-stop').disabled = true;
    el.querySelector('.find-go').disabled = false;
    el.querySelector('.find-anim').classList.remove('busy');
    this.renderResults(true);
  }

  folderLabel(path) {
    if (path[0] === 'Desktop') return this.t('fdlg.desktop');
    return path.map((p, i) => {
      if (i === 0) return '';
      const parent = window.vfs.resolvePath(path.slice(0, i));
      const node = parent && parent.children ? parent.children[p] : null;
      return i === 1 ? p : (window.vfs.getNodeDisplayName(node, p) || p);
    }).filter(Boolean).join('\\') || this.t('app.myComputer');
  }

  renderResults(show) {
    const el = this.el;
    el.querySelector('.find-results').classList.toggle('hidden', !show);
    el.querySelector('.find-status').classList.toggle('hidden', !show);
    const win = this.win.element;
    if (show && win.offsetHeight < 380) win.style.height = '400px';
    if (!show) win.style.height = 'auto';
    el.querySelector('.find-list').innerHTML = this.results.map((r, i) => {
      const icon = Icons[r.node.icon] ? r.node.icon : r.node.children ? 'folder' : 'file-txt';
      return `<div class="find-item" data-index="${i}"><span class="fi-name"><span class="fi-icon icon-small">${Icons[icon]}</span><span class="fi-label">${this.esc(r.name)}</span></span><span>${this.esc(this.folderLabel(r.folder))}</span><span class="fi-size">${r.node.children ? '' : r.size + ' ' + this.t('fdlg.kb')}</span><span>${this.esc(this.typeLabel(r.key, r.node))}</span></div>`;
    }).join('');
    el.querySelectorAll('.needs-sel').forEach(o => o.classList.toggle('disabled', !this.results.length));
    el.querySelector('.find-status-text').textContent = this.searching ? this.t('find.searching') : this.t('find.foundCount', this.results.length);
  }

  openResult(r) {
    if (!r) return;
    if (r.node.children) {
      if (window.appExplorer) window.appExplorer.open(r.folder.concat(r.key));
      return;
    }
    const ex = window.appExplorer;
    if (!ex) return;
    const prev = ex.currentPath;
    ex.currentPath = r.folder.slice();
    try {
      ex.openItem(null, { ...r.node, key: r.key, name: r.node.name || r.key });
    } finally {
      ex.currentPath = prev;
    }
  }
}

window.appFind = new AppFind();
