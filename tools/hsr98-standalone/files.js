(function () {
  'use strict';
  const PREFIX = 'content/';
  const nativeFetch = globalThis.fetch.bind(globalThis);
  const packs = globalThis.Hsr98Files = globalThis.Hsr98Files || {};
  const pending = {};
  const packPath = url => 'music/' + url.slice(PREFIX.length).replace(/[^A-Za-z0-9.]+/g, '-') + '.js';
  const loadPack = url => pending[url] || (pending[url] = new Promise((ok, fail) => {
    if (packs[url]) { ok(packs[url]); return; }
    const s = document.createElement('script');
    s.src = packPath(url);
    s.onload = () => { s.remove(); if (packs[url]) ok(packs[url]); else fail(new Error('empty ' + url)); };
    s.onerror = () => { s.remove(); delete pending[url]; fail(new Error('404 ' + url)); };
    document.head.appendChild(s);
  }));
  const toBytes = b64 => {
    const bin = atob(b64), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };
  globalThis.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input && input.url;
    if (typeof url !== 'string' || !url.startsWith(PREFIX)) return nativeFetch(input, init);
    return loadPack(url).then(b64 => new Response(toBytes(b64), { status: 200 }));
  };
})();
