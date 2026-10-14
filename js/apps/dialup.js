/**
 * Win 98 Dial-Up Networking (rasphone.exe)
 * Complete 56k V.90 modem dialing simulation, provider selection,
 * connection lifecycle, tray dual monitors, and offline mode integration.
 */
class AppDialUp {
  constructor() {
    this.winId = 'app_dialup';
    this.statusWinId = 'app_dialup_status';
    this.state = 'disconnected'; // 'disconnected', 'dialing', 'handshaking', 'authenticating', 'connected'
    this.isOnline = true; // Default online
    window.isOnline = true;

    this.providers = [
      { id: 'mtu', name: 'МТУ-Интел (MTU-Intel Dial-up 56k)', phone: '232-0000', speed: '48 000 бит/с' },
      { id: 'rol', name: 'РОЛ (Россия-Он-Лайн / ROL)', phone: '995-5555', speed: '50 666 бит/с' },
      { id: 'cityline', name: 'Ситилайн (Cityline 56k V.90)', phone: '755-6565', speed: '45 333 бит/с' },
      { id: 'aol', name: 'AOL (America Online 56k)', phone: '1-800-827-6364', speed: '52 000 бит/с' }
    ];

    this.selectedProviderIndex = 0;
    this.username = 'alexey_98';
    this.password = 'redmond98';
    this.connectionStartTime = Date.now();
    this.bytesSent = 142300;
    this.bytesRecv = 894200;
    this.timer = null;
    this.trayEl = null;

    this.initTray();
    this.startTrafficLoop();
  }

  initTray() {
    if (typeof document === 'undefined') return;
    const tray = document.getElementById('taskbar-tray');
    const clock = document.getElementById('tray-clock');
    if (!tray || !clock) return;

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    this.trayEl = document.createElement('div');
    this.trayEl.id = 'tray-dialup-icon';
    this.trayEl.className = 'tray-icon';
    this.trayEl.title = t('dialup.activeOnline', this.providers[0].name, this.providers[0].speed);
    this.trayEl.innerHTML = window.Icons && window.Icons['tray-dialup'] ? window.Icons['tray-dialup'] : '<span style="font-size:10px;">🌐</span>';

    this.trayEl.addEventListener('dblclick', () => {
      if (this.isOnline) this.openStatus();
      else this.open();
    });

    this.trayEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.isOnline) this.openStatus();
      else this.open();
    });

    tray.insertBefore(this.trayEl, clock);
  }

  startTrafficLoop() {
    const loop = setInterval(() => {
      if (!this.isOnline) return;

      // Increment random byte counts to simulate lively network traffic
      const deltaSent = Math.floor(Math.random() * 800) + 120;
      const deltaRecv = Math.floor(Math.random() * 2400) + 350;
      this.bytesSent += deltaSent;
      this.bytesRecv += deltaRecv;

      // Animate tray monitors
      if (this.trayEl) {
        const leftMon = this.trayEl.querySelector('.dialup-mon-screen-left');
        const rightMon = this.trayEl.querySelector('.dialup-mon-screen-right');
        if (leftMon && rightMon) {
          if (Math.random() > 0.4) leftMon.classList.add('active');
          else leftMon.classList.remove('active');

          if (Math.random() > 0.3) rightMon.classList.add('active');
          else rightMon.classList.remove('active');
        }

        const durationSec = Math.floor((Date.now() - this.connectionStartTime) / 1000);
        const mins = String(Math.floor(durationSec / 60)).padStart(2, '0');
        const secs = String(durationSec % 60).padStart(2, '0');
        const prov = this.providers[this.selectedProviderIndex];
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        this.trayEl.title = `${t('dialup.statusConnected', prov.name)}\n${t('dialup.duration', `${mins}:${secs}`)}\n${t('dialup.speed', prov.speed)}\n${t('dialup.bytesSent', Math.round(this.bytesSent / 1024))}, ${t('dialup.bytesRecv', Math.round(this.bytesRecv / 1024))}`;
      }

      // Update status window if open
      if (this.statusInterval) {
        this.updateStatusValues();
      }
    }, 450);
    if (typeof loop === 'object' && loop && typeof loop.unref === 'function') {
      loop.unref();
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const prov = this.providers[this.selectedProviderIndex];

    const content = document.createElement('div');
    content.className = 'dialup-window';
    content.innerHTML = `
      <div class="dialup-header">
        <div class="dialup-header-icon">${window.getIcon ? window.getIcon('dialup', 32) : ''}</div>
        <select id="dialup-provider-select" class="win-select dialup-connection">
          ${this.providers.map((p, i) => `<option value="${i}" ${i === this.selectedProviderIndex ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>

      <div class="dialup-form">
        <div class="dialup-field-row">
          <label for="dialup-user-input">${t('dialup.userName')}</label>
          <input type="text" id="dialup-user-input" value="${this.username}">
        </div>

        <div class="dialup-field-row">
          <label for="dialup-pass-input">${t('dialup.password')}</label>
          <input type="password" id="dialup-pass-input" value="${this.password}">
        </div>

        <div class="dialup-field-row">
          <span></span>
          <label class="dialup-check"><input type="checkbox" id="dialup-save-pass" checked> ${t('dialup.savePassword')}</label>
        </div>

        <div class="dialup-field-row">
          <label for="dialup-phone-input">${t('dialup.phone')}</label>
          <input type="text" id="dialup-phone-input" value="${prov.phone}">
        </div>
      </div>

      <div class="dialup-status-box" id="dialup-box">
        <div class="dialup-anim-monitors">${window.getIcon ? window.getIcon('tray-dialup', 24) : '💻'}</div>
        <div id="dialup-status-msg" style="flex:1; font-weight:normal; line-height:1.4;">
          ${this.isOnline ? t('dialup.connectedMsg') : t('dialup.readyMsg')}
        </div>
      </div>

      <div class="dialup-buttons">
        <button class="win-btn" id="btn-dialup-connect" style="font-weight:bold; min-width:85px;">
          ${this.isOnline ? t('dialup.reconnect') : t('dialup.connect')}
        </button>
        <button class="win-btn" id="btn-dialup-cancel" style="min-width:75px;">${t('btn.cancel')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: t('dialup.connectTo', prov.name),
      icon: 'dialup',
      width: 380,
      height: 'auto',
      resizable: false,
      content
    });

    const sel = win.element.querySelector('#dialup-provider-select');
    const phoneInput = win.element.querySelector('#dialup-phone-input');
    sel.addEventListener('change', (e) => {
      this.selectedProviderIndex = parseInt(e.target.value, 10) || 0;
      phoneInput.value = this.providers[this.selectedProviderIndex].phone;
      win.titleElement.textContent = t('dialup.connectTo', this.providers[this.selectedProviderIndex].name);
    });

    const btnConnect = win.element.querySelector('#btn-dialup-connect');
    btnConnect.addEventListener('click', () => {
      this.username = win.element.querySelector('#dialup-user-input').value;
      const savePass = win.element.querySelector('#dialup-save-pass').checked;
      this.password = savePass ? win.element.querySelector('#dialup-pass-input').value : '';
      this.startDialingProcess(win);
    });

    const btnCancel = win.element.querySelector('#btn-dialup-cancel');
    btnCancel.addEventListener('click', () => {
      this.cancelDialing();
      if (win.close) win.close();
    });
  }

  startDialingProcess(win) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const statusMsg = win.element.querySelector('#dialup-status-msg');
    const btnConnect = win.element.querySelector('#btn-dialup-connect');
    if (btnConnect) btnConnect.disabled = true;

    const prov = this.providers[this.selectedProviderIndex];
    this.state = 'dialing';

    if (statusMsg) statusMsg.textContent = t('dialup.dialing', prov.phone);

    if (window.soundSys) {
      window.soundSys.playDialTone();

      // Play DTMF tones
      const digits = prov.phone.replace(/[^0-9]/g, '').split('');
      digits.forEach((d, idx) => {
        setTimeout(() => {
          if (this.state !== 'dialing') return;
          if (window.soundSys && window.soundSys.ctx) {
            window.soundSys.playDtmfTone(d, window.soundSys.ctx.currentTime);
          }
        }, 800 + idx * 110);
      });

      // Ringback & handshake
      const ringbackDelay = 800 + digits.length * 110 + 400;
      setTimeout(() => {
        if (this.state !== 'dialing') return;
        this.state = 'handshaking';
        if (statusMsg) statusMsg.textContent = t('dialup.waiting');
        if (window.soundSys && window.soundSys.ctx) {
          window.soundSys.playRingbackTone(window.soundSys.ctx.currentTime, 1.8);
        }

        setTimeout(() => {
          if (this.state !== 'handshaking') return;
          if (statusMsg) statusMsg.textContent = t('dialup.handshake');

          if (window.soundSys) {
            window.soundSys.playModemHandshake(() => {
              this.finishConnection(win);
            });
          } else {
            setTimeout(() => this.finishConnection(win), 3000);
          }
        }, 2200);
      }, ringbackDelay);
    } else {
      setTimeout(() => this.finishConnection(win), 2500);
    }
  }

  finishConnection(win) {
    this.state = 'connected';
    this.isOnline = true;
    window.isOnline = true;
    this.connectionStartTime = Date.now();
    try {
      window.dispatchEvent(new CustomEvent('connectivity-changed', { detail: { isOnline: true } }));
    } catch (e) {}

    if (win && win.element) {
      const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
      const statusMsg = win.element.querySelector('#dialup-status-msg');
      const prov = this.providers[this.selectedProviderIndex];
      if (statusMsg) statusMsg.innerHTML = t('dialup.welcome', prov.speed);

      setTimeout(() => {
        if (win.close) win.close();
        this.openStatus();
      }, 900);
    }

    if (this.trayEl) {
      this.trayEl.style.display = 'inline-flex';
    }
  }

  cancelDialing() {
    this.state = 'disconnected';
    if (window.soundSys) {
      window.soundSys.stopModemAudio();
    }
  }

  disconnect() {
    this.cancelDialing();
    this.isOnline = false;
    window.isOnline = false;
    try {
      window.dispatchEvent(new CustomEvent('connectivity-changed', { detail: { isOnline: false } }));
    } catch (e) {}

    if (window.soundSys) {
      window.soundSys.playClick();
    }

    if (window.winManager && window.winManager.windows.has(this.statusWinId)) {
      const w = window.winManager.windows.get(this.statusWinId);
      if (w && w.close) w.close();
    }

    if (this.trayEl) {
      const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
      this.trayEl.title = t('dialup.disconnected');
      const leftMon = this.trayEl.querySelector('.dialup-mon-screen-left');
      const rightMon = this.trayEl.querySelector('.dialup-mon-screen-right');
      if (leftMon) leftMon.classList.remove('active');
      if (rightMon) rightMon.classList.remove('active');
    }
  }

  openStatus() {
    if (window.winManager && window.winManager.windows.has(this.statusWinId)) {
      window.winManager.bringToTop(this.statusWinId);
      return;
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const prov = this.providers[this.selectedProviderIndex];

    const content = document.createElement('div');
    content.className = 'dialup-window';
    content.innerHTML = `
      <div class="dialup-header">
        <div class="dialup-header-icon">${window.getIcon ? window.getIcon('tray-dialup', 32) : '🌐'}</div>
        <div class="dialup-header-text">
          <h3>${t('dialup.statusConnected', '')}</h3>
          <p>${t('dialup.connectTo', prov.name)}</p>
        </div>
      </div>

      <fieldset class="bevel-groove" style="padding:10px; margin-bottom:12px; font-size:11px;">
        <legend>${t('dialup.sessionStats')}</legend>
        <div style="display:grid; grid-template-columns:120px 1fr; gap:6px; margin-bottom:4px;">
          <span>${t('dialup.duration', '').replace(/: ?$/, '')}:</span> <strong id="dialup-stat-time">00:00:00</strong>
          <span>${t('dialup.speed', '').replace(/: ?$/, '')}:</span> <strong>${prov.speed}</strong>
        </div>
        <hr style="border:none; border-top:1px solid #808080; border-bottom:1px solid #fff; margin:6px 0;">
        <div style="display:grid; grid-template-columns:120px 1fr; gap:6px;">
          <span>${t('dialup.bytesSentLabel')}</span> <span id="dialup-stat-sent">${this.bytesSent.toLocaleString()}</span>
          <span>${t('dialup.bytesRecvLabel')}</span> <span id="dialup-stat-recv">${this.bytesRecv.toLocaleString()}</span>
        </div>
      </fieldset>

      <div class="dialup-buttons">
        <button class="win-btn" id="btn-dialup-disconnect" style="min-width:90px; font-weight:bold;">${t('dialup.disconnect')}</button>
        <button class="win-btn" id="btn-dialup-close-status" style="min-width:75px;">${t('dialup.hide')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.statusWinId,
      title: t('dialup.connectTo', prov.name),
      icon: 'tray-dialup',
      width: 340,
      height: 255,
      resizable: false,
      content
    });

    const btnDisc = win.element.querySelector('#btn-dialup-disconnect');
    btnDisc.addEventListener('click', () => {
      this.disconnect();
    });

    const btnClose = win.element.querySelector('#btn-dialup-close-status');
    btnClose.addEventListener('click', () => {
      if (win.close) win.close();
    });

    this.updateStatusDom();
  }

  updateStatusDom() {
    if (!window.winManager || !window.winManager.windows.has(this.statusWinId)) return;
    const win = window.winManager.windows.get(this.statusWinId);
    if (!win || !win.element) return;

    const timeEl = win.element.querySelector('#dialup-stat-time');
    const sentEl = win.element.querySelector('#dialup-stat-sent');
    const recvEl = win.element.querySelector('#dialup-stat-recv');

    if (timeEl) {
      const sec = Math.floor((Date.now() - this.connectionStartTime) / 1000);
      const h = String(Math.floor(sec / 3600)).padStart(2, '0');
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      timeEl.textContent = `${h}:${m}:${s}`;
    }
    if (sentEl) sentEl.textContent = this.bytesSent.toLocaleString();
    if (recvEl) recvEl.textContent = this.bytesRecv.toLocaleString();
  }
}

window.appDialUp = new AppDialUp();
