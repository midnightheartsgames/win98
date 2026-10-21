/**
 * Win 98 Recycle Bin Application
 * Restores deleted files back to the virtual filesystem or desktop,
 * with full application launch integration.
 */
class AppRecycleBin {
  constructor() {
    this.selectedItem = null;
  }

  open() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const winId = 'app_recycle_bin';
    const win = window.winManager.createWindow({
      id: winId,
      title: t('bin.title'),
      icon: 'recycle-bin',
      width: 540,
      height: 350,
      content: this.buildHTML()
    });

    this.selectedItem = null;
    this.attachEvents(win);
    this.renderItems(win);

    if (window.i18n) {
      window.i18n.addListener(() => {
        if (window.winManager && window.winManager.windows.has('app_recycle_bin')) {
          win.titleElement.textContent = t('bin.title');
          this.renderItems(win);
        }
      });
    }
  }

  buildHTML() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    return `
      <div class="explorer-container">
        <!-- Toolbar -->
        <div class="explorer-toolbar" style="gap:4px;">
          <button class="win-btn btn-restore-item" disabled style="min-height:22px; padding:2px 8px;">
            ♻️ ${t('bin.restoreBtn')}
          </button>
          <button class="win-btn btn-restore-all" style="min-height:22px; padding:2px 8px;">
            ${t('bin.restoreAllBtn')}
          </button>
          <div class="taskbar-divider" style="height:18px;"></div>
          <button class="win-btn btn-empty-bin" style="min-height:22px; padding:2px 8px;">
            🗑️ ${t('bin.emptyBtn')}
          </button>
        </div>

        <!-- Files List -->
        <div class="explorer-body" style="flex-direction:column; padding:4px; overflow-y:auto; min-height:0; min-width:0; flex:1;">
          <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:left;">
            <thead>
              <tr style="background:#e0e0e0; border-bottom:1px solid #808080;">
                <th style="padding:4px; border-right:1px solid #c0c0c0;">${t('bin.colName')}</th>
                <th style="padding:4px; border-right:1px solid #c0c0c0;">${t('bin.colLocation')}</th>
                <th style="padding:4px; border-right:1px solid #c0c0c0;">${t('bin.colDate')}</th>
                <th style="padding:4px;">${t('bin.colSize')}</th>
              </tr>
            </thead>
            <tbody class="recycle-items-tbody"></tbody>
          </table>
        </div>

        <!-- Status Bar -->
        <div class="win-statusbar">
          <div class="win-status-pane grow recycle-status">${t('explorer.objectsCount', 0)}</div>
        </div>
      </div>
    `;
  }

  attachEvents(win) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const el = win.element;
    const btnEmpty = el.querySelector('.btn-empty-bin');
    const btnRestoreItem = el.querySelector('.btn-restore-item');
    const btnRestoreAll = el.querySelector('.btn-restore-all');

    btnRestoreItem.addEventListener('click', () => {
      if (this.selectedItem) {
        this.restoreItem(win, this.selectedItem, 'original');
      }
    });

    btnRestoreAll.addEventListener('click', () => {
      const items = window.vfs.getRecycleBinItems();
      if (items.length === 0) {
        window.winManager.openDialog({
          title: t('bin.title'),
          icon: 'info',
          message: t('bin.alreadyEmpty')
        });
        return;
      }

      items.slice().forEach(item => {
        window.vfs.restoreRecycleBinItem(item.name, 'original');
      });

      this.selectedItem = null;
      this.renderItems(win);
      this.updateDesktopBinIcon();

      window.winManager.openDialog({
        title: t('bin.restoredSuccess'),
        icon: 'my-computer',
        message: t('bin.restoreAllSuccess'),
        buttons: [
          {
            text: t('bin.openMyComputer'),
            primary: true,
            onClick: () => {
              if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:']);
            }
          },
          { text: t('btn.ok'), primary: false, onClick: null }
        ]
      });
    });

    btnEmpty.addEventListener('click', () => {
      const items = window.vfs.getRecycleBinItems();
      if (items.length === 0) {
        window.winManager.openDialog({
          title: t('bin.title'),
          icon: 'info',
          message: t('bin.alreadyEmpty')
        });
        return;
      }

      window.winManager.openDialog({
        title: t('explorer.confirmDeleteTitle'),
        icon: 'warning',
        message: t('bin.confirmEmpty'),
        buttons: [
          {
            text: t('btn.yes'),
            primary: true,
            onClick: () => {
              window.vfs.emptyRecycleBin();
              this.selectedItem = null;
              this.renderItems(win);
              this.updateDesktopBinIcon();
            }
          },
          {
            text: t('btn.no'),
            primary: false,
            onClick: null
          }
        ]
      });
    });
  }

  updateDesktopBinIcon() {
    const items = window.vfs.getRecycleBinItems();
    const deskIcon = document.querySelector('.desktop-icon[data-id="recycle-bin"] .desktop-icon-img');
    if (deskIcon) {
      const key = items.length === 0 ? 'recycle-bin-empty' : 'recycle-bin';
      deskIcon.innerHTML = Icons[window.desktop && window.desktop.systemIcon ? window.desktop.systemIcon(key) : key];
    }
  }

  restoreItem(win, item, destinationMode = 'original') {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const res = window.vfs.restoreRecycleBinItem(item.name, destinationMode);

    if (res.success) {
      this.selectedItem = null;
      this.renderItems(win);
      this.updateDesktopBinIcon();

      // Refresh Explorer if open
      if (window.winManager) {
        const expWin = window.winManager.windows.get('app_explorer');
        if (expWin && window.appExplorer) {
          window.appExplorer.renderFolder(expWin);
        }
      }

      const iconName = item.icon || (item.name.endsWith('.exe') ? 'file-virus' : (item.name.endsWith('.bmp') ? 'file-bmp' : (item.name.endsWith('.xls') ? 'file-xls' : 'file-txt')));

      window.winManager.openDialog({
        title: t('bin.restoredSuccess'),
        icon: iconName,
        message: t('bin.restored', item.name, res.fullPathStr),
        buttons: [
          {
            text: t('bin.openFolder'),
            primary: true,
            onClick: () => {
              if (window.appExplorer) {
                window.appExplorer.open(res.targetPathParts);
              }
            }
          },
          {
            text: t('btn.ok'),
            primary: false,
            onClick: null
          }
        ]
      });
    }
  }

  renderItems(win) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const el = win.element;
    const tbody = el.querySelector('.recycle-items-tbody');
    const statusEl = el.querySelector('.recycle-status');
    const btnRestoreItem = el.querySelector('.btn-restore-item');
    const btnRestoreAll = el.querySelector('.btn-restore-all');
    const items = window.vfs.getRecycleBinItems();

    tbody.innerHTML = '';
    statusEl.textContent = t('explorer.objectsCount', items.length);
    btnRestoreAll.disabled = items.length === 0;
    btnRestoreItem.disabled = !this.selectedItem;

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="padding:16px; text-align:center; color:#808080;">
            ${t('bin.emptyMsg')}
          </td>
        </tr>
      `;
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'default';
      const iconKey = item.icon || (item.name.endsWith('.exe') ? 'file-virus' : (item.name.endsWith('.bmp') ? 'file-bmp' : (item.name.endsWith('.xls') ? 'file-xls' : 'file-txt')));

      tr.innerHTML = `
        <td style="padding:4px; display:flex; align-items:center; gap:6px;">
          <div style="width:16px; height:16px; flex-shrink:0;">${Icons[iconKey] || Icons['file-txt']}</div>
          <span style="font-weight:500;">${item.name}</span>
        </td>
        <td style="padding:4px; color:#555;">${item.originalPath}</td>
        <td style="padding:4px; color:#555;">${item.date}</td>
        <td style="padding:4px; color:#555;">${item.size}</td>
      `;

      // Select item on click
      tr.addEventListener('click', () => {
        tbody.querySelectorAll('tr').forEach(r => {
          r.style.backgroundColor = 'transparent';
          r.style.color = '#000000';
        });
        tr.style.backgroundColor = '#000080';
        tr.style.color = '#ffffff';
        this.selectedItem = item;
        btnRestoreItem.disabled = false;
      });

      // Double-click prompts to restore
      tr.addEventListener('dblclick', () => {
        window.winManager.openDialog({
          title: t('bin.promptRestore', item.name),
          icon: iconKey,
          message: t('bin.restorePromptMessage', item.name, item.originalPath),
          buttons: [
            {
              text: t('bin.restoreBtn'),
              primary: true,
              onClick: () => this.restoreItem(win, item, 'original')
            },
            {
              text: t('bin.restoreToDesktop'),
              primary: false,
              onClick: () => this.restoreItem(win, item, 'desktop')
            },
            { text: t('btn.cancel'), onClick: null }
          ]
        });
      });

      // Context menu
      tr.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tbody.querySelectorAll('tr').forEach(r => {
          r.style.backgroundColor = 'transparent';
          r.style.color = '#000000';
        });
        tr.style.backgroundColor = '#000080';
        tr.style.color = '#ffffff';
        this.selectedItem = item;
        btnRestoreItem.disabled = false;

        if (window.contextMenu) {
          window.contextMenu.show(e.clientX, e.clientY, [
            {
              label: t('bin.restoreBtn'),
              bold: true,
              action: () => this.restoreItem(win, item, 'original')
            },
            {
              label: t('bin.restoreToDesktop'),
              action: () => this.restoreItem(win, item, 'desktop')
            },
            { separator: true },
            {
              label: t('menu.delete'),
              action: () => {
                window.winManager.openDialog({
                  title: t('explorer.confirmDeleteTitle'),
                  icon: 'warning',
                  message: t('bin.confirmDeleteOne', item.name),
                  buttons: [
                    {
                      text: t('btn.yes'),
                      primary: true,
                      onClick: () => {
                        const bin = window.vfs.root.children['Recycle Bin'];
                        if (bin && bin.items) {
                          bin.items = bin.items.filter(i => i.name !== item.name);
                          if (bin.items.length === 0) bin.icon = 'recycle-bin-empty';
                          window.vfs.saveToStorage();
                          this.selectedItem = null;
                          this.renderItems(win);
                          this.updateDesktopBinIcon();
                        }
                      }
                    },
                    { text: t('btn.no'), primary: false, onClick: null }
                  ]
                });
              }
            },
            { separator: true },
            {
              label: t('menu.properties'),
              action: () => {
                window.winManager.openDialog({
                  title: `${item.name} ${t('menu.properties')}`,
                  icon: iconKey,
                  message: `<b>${item.name}</b><br>Original Location: ${item.originalPath}<br>Date Deleted: ${item.date}<br>Size: ${item.size}`
                });
              }
            }
          ]);
        }
      });

      tbody.appendChild(tr);
    });

    el.querySelector('.explorer-body').addEventListener('contextmenu', (e) => {
      if (e.target.closest('tr')) return;
      e.preventDefault();
      e.stopPropagation();

      if (window.contextMenu) {
        window.contextMenu.show(e.clientX, e.clientY, [
          {
            label: t('bin.emptyBtn'),
            disabled: items.length === 0,
            action: () => el.querySelector('.btn-empty-bin').click()
          },
          {
            label: t('bin.restoreAllBtn'),
            disabled: items.length === 0,
            action: () => el.querySelector('.btn-restore-all').click()
          },
          { separator: true },
          {
            label: t('menu.properties'),
            action: () => {
              window.winManager.openDialog({
                title: `${t('bin.title')} ${t('menu.properties')}`,
                icon: 'recycle-bin',
                message: `<b>${t('bin.title')}</b><br>${t('explorer.containsItems', items.length)}`
              });
            }
          }
        ]);
      }
    });
  }
}

window.appRecycleBin = new AppRecycleBin();
