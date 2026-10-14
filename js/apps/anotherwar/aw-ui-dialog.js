(function (AW) {
  'use strict';

  const el = (t, c, p, s) => AW.el(t, c, p, s);
  const WX = 100, WY = 280, WW = 600, WH = 310;

  AW.DialogUI = {
    open(ui, d) {
      AW.DialogUI.close(ui);
      const box = el('div', 'aw-dlg', ui.stage);
      Object.assign(box.style, { left: WX + 'px', top: '600px', width: (WW + 15) + 'px', height: WH + 'px' });
      box.appendChild(AW.windowCanvas(WW + 15, WH));
      const log = el('div', 'aw-dlg-log', box);
      const more = el('div', 'aw-dlg-more', box);
      more.textContent = AW.TEXT.PressSpaceToContinue || 'Нажмите ПРОБЕЛ для продолжения';
      const st = { ui, d, box, log, more, y: 600, answers: [], shown: -1 };
      ui.dlgState = st;
      d.onChange = () => AW.DialogUI.render(st);
      log.addEventListener('wheel', ev => { log.scrollTop += ev.deltaY; ev.stopPropagation(); }, { passive: true });
      box.addEventListener('mousedown', ev => ev.stopPropagation());
      AW.DialogUI.render(st);
      ui.tip('');
      ui.setCursor('CURSOR');
    },

    render(st) {
      const d = st.d;
      if (d.closed) return;
      const log = st.log;
      const hist = d.history;
      for (const a of st.answers) a.remove();
      st.answers = [];
      for (let i = st.shown + 1; i < hist.length; i++) {
        const h = hist[i];
        if (h.who === 'npc') {
          if (!h.text) continue;
          const p = el('div', 'aw-dlg-npc', log);
          p.textContent = h.text;
          if (i > 0) st.anchor = p;
        } else {
          const p = el('div', 'aw-dlg-chosen', log);
          p.textContent = '< ' + h.text;
        }
      }
      st.shown = hist.length - 1;
      const node = d.node;
      if (node) {
        node.answers.forEach((a, i) => {
          const p = el('div', 'aw-dlg-ans', log);
          p.textContent = '> ' + a.text;
          p.addEventListener('mouseenter', () => st.ui.audio.play('icons/click6'));
          p.addEventListener('mousedown', ev => {
            ev.stopPropagation();
            if (ev.button !== 0) return;
            AW.DialogUI.choose(st, i);
          });
          st.answers.push(p);
        });
      }
      const target = st.anchor || log.lastChild;
      requestAnimationFrame(() => {
        if (!target) return;
        const top = target.offsetTop - 6;
        log.scrollTop = Math.max(0, Math.min(top, log.scrollHeight - log.clientHeight));
        AW.DialogUI.moreCheck(st);
      });
    },

    moreCheck(st) {
      const log = st.log;
      st.more.style.display = log.scrollTop + log.clientHeight < log.scrollHeight - 4 ? 'block' : 'none';
    },

    choose(st, i) {
      const d = st.d;
      if (d.closed || !d.node || !d.node.answers[i]) return;
      st.ui.audio.play('menu/click1');
      st.anchor = null;
      d.choose(i);
      if (!d.closed) AW.DialogUI.render(st);
    },

    update(ui, dt) {
      const st = ui.dlgState;
      if (!st) return;
      if (st.d.closed) { AW.DialogUI.close(ui); return; }
      if (st.y > WY) {
        st.y = Math.max(WY, st.y - ((st.y - WY) / 6 + 8) * dt * 30);
        st.box.style.top = st.y + 'px';
      }
      AW.DialogUI.moreCheck(st);
    },

    onKey(ui, ev) {
      const st = ui.dlgState;
      if (!st) return false;
      const k = ev.code;
      if (k === 'Space' || k === 'PageDown') { st.log.scrollTop += st.log.clientHeight - 30; AW.DialogUI.moreCheck(st); return true; }
      if (k === 'PageUp') { st.log.scrollTop -= st.log.clientHeight - 30; return true; }
      if (k === 'ArrowDown') { st.log.scrollTop += 18; return true; }
      if (k === 'ArrowUp') { st.log.scrollTop -= 18; return true; }
      const m = k.match(/^(?:Digit|Numpad)([1-9])$/);
      if (m) { AW.DialogUI.choose(st, parseInt(m[1], 10) - 1); return true; }
      return true;
    },

    close(ui) {
      const st = ui.dlgState;
      if (!st) return;
      ui.dlgState = null;
      st.box.remove();
      if (!st.d.closed) st.d.close();
    }
  };
})(globalThis.AW = globalThis.AW || {});
