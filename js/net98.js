(function (root) {
  'use strict';
  const KEY = 'net98.account', URL_KEY = 'net98.url', PROTO = 1;
  const PUBLIC_URL = 'wss://pennygachi.men/api/net';
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const RETRY = [2000, 4000, 8000, 16000, 32000, 60000];
  const PING_MS = 5000, DEAD_MS = 15000, ANSWER_WAIT = 12000, SECRET_LEN = 16, INVITE_MS = 120000;
  const STOPPED = new Set(['outdated', 'replaced', 'denied', 'banned']);
  const SHELL_OPS = new Set(['me', 'friends', 'presence', 'row', 'tables', 'invite']);

  function memoryStorage() {
    const box = new Map();
    return { getItem: k => (box.has(k) ? box.get(k) : null), setItem: (k, v) => box.set(k, String(v)), removeItem: k => box.delete(k) };
  }

  function browserStorage() {
    try { return root.localStorage || memoryStorage(); } catch (err) { return memoryStorage(); }
  }

  function randomBytes(n) {
    return root.crypto.getRandomValues(new Uint8Array(n));
  }

  function newAccount(auto) {
    const b = randomBytes(4), v = (b[0] * 16777216 + b[1] * 65536 + b[2] * 256 + b[3]) % 100000000;
    return { uid: '7' + String(v).padStart(8, '0'), secret: Array.from(randomBytes(SECRET_LEN), x => ALPHABET[x % 32]).join(''), consent: false, auto, confirmed: false };
  }

  function parseCode(text) {
    const s = String(text || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    const uid = s.slice(0, 9), secret = s.slice(9);
    if (!/^7\d{8}$/.test(uid) || secret.length !== SECRET_LEN || /[^0-9A-HJKMNP-TV-Z]/.test(secret)) return null;
    return { uid, secret };
  }

  function createNet98(storage) {
    let acc = null, ws = null, retry = 0, retryTimer = null, pingTimer = null, waitAt = 0, pendingCode = null, pendingDelete = null;

    const net = {
      state: 'off', rtt: null, me: null, table: null, tables: [], seat: -1, tableError: null, onNet: null, codeScreen: null, friends: null, found: null, cards: {}, invites: [], room: null, book: null, gifts: [], awayNames: null, bytesSent: 0, bytesRecv: 0,

      account() {
        if (acc) return acc;
        let stored = null;
        try { stored = JSON.parse(storage.getItem(KEY)); } catch (err) { stored = null; }
        if (stored && /^7\d{8}$/.test(stored.uid) && typeof stored.secret === 'string') acc = stored;
        else { acc = newAccount(true); save(); }
        return acc;
      },
      uid() { return net.account().uid; },
      hasConsent() { return !!net.account().consent; },
      auto() { return net.account().auto !== false; },
      setAuto(on) { net.account().auto = !!on; save(); },

      setConsent(on) {
        net.account().consent = !!on;
        save();
        if (on) net.connect(); else net.disconnect('off');
      },

      url() {
        try { return storage.getItem(URL_KEY) || PUBLIC_URL; } catch (err) { return PUBLIC_URL; }
      },

      code() {
        const a = net.account();
        return a.uid + '-' + a.secret.match(/.{1,4}/g).join('-');
      },

      useCode(text, done) {
        if (pendingCode) { done({ ok: false, text: 'Проверяем код…' }); return; }
        const parsed = parseCode(text);
        if (!parsed) { done({ ok: false, text: 'Код набран неверно' }); return; }
        const prev = Object.assign({}, net.account());
        if (parsed.uid === prev.uid && parsed.secret === prev.secret) { done({ ok: true, text: 'Этот код уже здесь' }); return; }
        const wasOn = net.state !== 'off' && !STOPPED.has(net.state);
        net.disconnect('off');
        acc = { uid: parsed.uid, secret: parsed.secret, consent: true, auto: prev.auto !== false, confirmed: true };
        pendingCode = { prev, done, wasOn, timer: setTimeout(() => finishCode({ ok: false, text: 'Нет связи с сервером' }, true), ANSWER_WAIT) };
        net.connect();
      },

      deleteAccount(done) {
        if (!net.account().confirmed) { resetAccount(); done({ ok: true }); return; }
        if (net.state !== 'online') { done({ ok: false, text: 'Нет связи с сервером' }); return; }
        pendingDelete = { done, timer: setTimeout(() => { pendingDelete = null; done({ ok: false, text: 'Нет связи с сервером' }); }, ANSWER_WAIT) };
        net.send('deleteMe');
      },

      connect() {
        if (!net.hasConsent()) { net.state = 'off'; return; }
        clearTimeout(retryTimer);
        if (ws) return;
        if (root.isOnline === false) { net.state = 'modem'; changed(); return; }
        net.state = 'connecting';
        let sock;
        try { sock = new root.WebSocket(net.url()); } catch (err) { lost(); return; }
        ws = sock;
        sock.onopen = () => {
          if (ws !== sock) return;
          const a = net.account(), H = root.Hsr98;
          net.send('hello', { uid: a.uid, secret: a.secret, proto: PROTO, fresh: !a.confirmed, code: !!pendingCode, sim: H && H.HD ? H.HD.SIM : '', ver: H ? H.BUILD_VERSION : '', src: root.Hsr98Standalone || 'win98' });
        };
        sock.onmessage = e => { if (ws === sock) receive(e.data); };
        sock.onclose = () => { if (ws === sock) { ws = null; stopPing(); lost(); } };
        sock.onerror = () => {};
      },

      disconnect(state) {
        clearTimeout(retryTimer);
        stopPing();
        const sock = ws;
        ws = null;
        net.rtt = null;
        net.me = null;
        clearSocial();
        if (sock) { try { sock.close(); } catch (err) {} }
        net.state = state;
        changed();
      },

      send(op, data) {
        if (!ws || ws.readyState !== 1 || (net.state !== 'online' && op !== 'hello')) return false;
        const text = JSON.stringify(Object.assign({ op }, data));
        net.bytesSent += text.length;
        ws.send(text);
        return true;
      },

      bars() {
        if (net.state !== 'online' || net.rtt == null) return 0;
        return net.rtt <= 120 ? 4 : net.rtt <= 250 ? 3 : net.rtt <= 500 ? 2 : 1;
      },

      boot() {
        if (net.hasConsent() && net.auto()) net.connect();
      },

      hideCode() {
        if (net.codeScreen) net.codeScreen();
      },

      activeInvites() {
        const at = root.performance.now();
        net.invites = net.invites.filter(i => at - i.at < INVITE_MS);
        return net.invites;
      },

      dropInvite(inv) {
        net.invites = net.invites.filter(i => i !== inv);
      },

      modemChanged() {
        if (!net.hasConsent()) return;
        if (root.isOnline === false) { net.disconnect('modem'); return; }
        if (net.state !== 'modem') return;
        if (net.auto()) { retry = 0; net.connect(); } else net.state = 'off';
      }
    };

    function save() {
      try { storage.setItem(KEY, JSON.stringify(acc)); } catch (err) {}
    }

    function changed() {
      if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('net98-changed'));
    }

    function resetAccount() {
      acc = newAccount(net.auto());
      save();
      net.disconnect('off');
    }

    function stopPing() {
      clearInterval(pingTimer);
      pingTimer = null;
      waitAt = 0;
    }

    function pingTick() {
      const t = root.performance.now();
      if (waitAt && t - waitAt > DEAD_MS) {
        const sock = ws;
        ws = null;
        stopPing();
        if (sock) { try { sock.close(); } catch (err) {} }
        lost();
        return;
      }
      if (!waitAt) waitAt = t;
      net.send('echo', { t });
    }

    function finishCode(result, restore) {
      const p = pendingCode;
      if (!p) return;
      pendingCode = null;
      clearTimeout(p.timer);
      if (restore) {
        net.disconnect('off');
        acc = p.prev;
        save();
        if (p.wasOn) { retry = 0; net.connect(); }
      } else save();
      p.done(result);
    }

    function clearSocial() {
      net.friends = null;
      net.found = null;
      net.cards = {};
      net.invites = [];
      net.room = null;
      net.book = null;
      net.gifts = [];
    }

    function roomOfMine() {
      if (!net.room) net.room = { host: acc.uid, peers: new Map() };
      return net.room;
    }

    function lost() {
      net.rtt = null;
      net.me = null;
      clearSocial();
      if (STOPPED.has(net.state) || pendingCode) return;
      if (!net.hasConsent()) { net.state = 'off'; return; }
      if (root.isOnline === false) { net.state = 'modem'; return; }
      net.state = 'offline';
      retryTimer = setTimeout(() => net.connect(), RETRY[Math.min(retry++, RETRY.length - 1)]);
      if (retryTimer.unref) retryTimer.unref();
      changed();
    }

    function receive(text) {
      let m;
      try { m = JSON.parse(text); } catch (err) { return; }
      waitAt = 0;
      net.bytesRecv += text.length;
      switch (m.op) {
        case 'echo': {
          const d = root.performance.now() - m.t;
          net.rtt = net.rtt == null ? d : net.rtt * 0.8 + d * 0.2;
          return;
        }
        case 'me':
          retry = 0;
          acc.uid = m.uid;
          acc.confirmed = true;
          save();
          net.me = m;
          net.state = 'online';
          stopPing();
          pingTick();
          pingTimer = setInterval(pingTick, PING_MS);
          if (pingTimer.unref) pingTimer.unref();
          finishCode({ ok: true, text: 'Аккаунт перенесён' }, false);
          net.send('friends');
          break;
        case 'error':
          if (pendingCode && m.code === 'secret') { finishCode({ ok: false, text: 'Сервер не принял этот код' }, true); return; }
          if (m.code === 'proto') net.state = 'outdated';
          else if (m.code === 'secret') net.state = 'denied';
          else if (m.code === 'banned') net.state = 'banned';
          return;
        case 'replaced':
          net.state = 'replaced';
          return;
        case 'deleted':
          if (pendingDelete) {
            const p = pendingDelete;
            pendingDelete = null;
            clearTimeout(p.timer);
            resetAccount();
            p.done({ ok: true });
          }
          return;
        case 'table':
          m.at = root.performance.now();
          net.table = m;
          net.seat = m.seats.findIndex(s => s && s.uid === acc.uid);
          if (net.me) net.me.table = m.state === 'done' ? null : m.code;
          break;
        case 'tables':
          net.tables = m.list;
          break;
        case 'friends': {
          const at = root.performance.now();
          for (const row of m.list) row.seenAt = at;
          net.friends = m;
          break;
        }
        case 'presence': {
          const row = net.friends && net.friends.list.find(r => r.uid === m.uid);
          if (row) Object.assign(row, { on: m.on, status: m.status, ago: m.ago, seenAt: root.performance.now() });
          break;
        }
        case 'row': {
          const row = net.friends && net.friends.list.find(r => r.uid === m.row.uid);
          if (row) Object.assign(row, m.row, { seenAt: root.performance.now() });
          break;
        }
        case 'found':
          net.found = m;
          break;
        case 'cardOf':
          net.cards[m.uid] = m.card;
          break;
        case 'invite':
          m.at = root.performance.now();
          net.invites = net.invites.filter(i => i.from !== m.from).concat(m);
          break;
        case 'visit':
          net.room = { host: m.uid, name: m.name, gender: m.gender, sign: m.sign, on: m.on, express: m.express, book: m.book, peers: new Map(m.peers.map(p => [p.uid, p])) };
          break;
        case 'peerIn':
          roomOfMine().peers.set(m.peer.uid, m.peer);
          break;
        case 'peerOut':
          if (net.room) {
            net.room.peers.delete(m.uid);
            if (net.room.host === acc.uid && !net.room.peers.size) net.room = null;
          }
          break;
        case 'pos': {
          const peer = net.room && net.room.peers.get(m.uid);
          if (peer) Object.assign(peer, { m: m.m, x: m.x, y: m.y, d: m.d, w: m.w });
          break;
        }
        case 'visitEnd':
          net.room = null;
          break;
        case 'book':
          if (m.uid === acc.uid) net.book = m.list;
          if (net.room && net.room.host === m.uid) net.room.book = m.list;
          break;
        case 'gift':
          if (!net.gifts.some(g => g.id === m.id)) net.gifts.push(m);
          break;
        case 'awayGuests':
          net.awayNames = m.names;
          break;
        case 'visit':
          net.room = { host: m.uid, name: m.name, gender: m.gender, sign: m.sign, on: m.on, express: m.express, book: m.book, peers: new Map(m.peers.map(p => [p.uid, p])) };
          break;
        case 'peerIn':
          roomOfMine().peers.set(m.peer.uid, m.peer);
          break;
        case 'peerOut':
          if (net.room) {
            net.room.peers.delete(m.uid);
            if (net.room.host === acc.uid && !net.room.peers.size) net.room = null;
          }
          break;
        case 'pos': {
          const peer = net.room && net.room.peers.get(m.uid);
          if (peer) Object.assign(peer, { m: m.m, x: m.x, y: m.y, d: m.d, w: m.w });
          break;
        }
        case 'visitEnd':
          net.room = null;
          break;
        case 'book':
          if (m.uid === acc.uid) net.book = m.list;
          if (net.room && net.room.host === m.uid) net.room.book = m.list;
          break;
        case 'gift':
          if (!net.gifts.some(g => g.id === m.id)) net.gifts.push(m);
          break;
        case 'awayGuests':
          net.awayNames = m.names;
          break;
        case 'tableGone':
          net.table = null;
          net.seat = -1;
          if (net.me) net.me.table = m.keep ? m.code : null;
          break;
        case 'tableError':
          net.tableError = m;
          if (m.code === 'none') {
            net.table = null;
            net.seat = -1;
            if (net.me) net.me.table = null;
          }
          break;
        default:
      }
      if (net.onNet) net.onNet(m);
      if (SHELL_OPS.has(m.op)) changed();
    }

    return net;
  }

  root.createNet98 = createNet98;
  root.Net98 = createNet98(browserStorage());
  if (root.addEventListener) {
    root.addEventListener('load', () => root.Net98.boot(), { once: true });
    root.addEventListener('connectivity-changed', () => root.Net98.modemChanged());
  }
})(globalThis);
