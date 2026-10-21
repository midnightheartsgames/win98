(() => {
  const site = window.kovchegSite;
  if (!site) return;
  const proto = Object.getPrototypeOf(site);
  const baseAttach = proto.attachEvents;
  const CREW_KEY = 'win98_kovcheg_crew_v1';
  const SAVE_DIR = ['My Computer', 'C:', 'Games', 'StarRail98'];
  const SAVE_PATH = 'C:\\Games\\StarRail98';

  Object.assign(proto, {
    crewKey: CREW_KEY,

    myCrew() {
      try {
        const data = JSON.parse(this.read(CREW_KEY) || 'null');
        return data && data.chars && typeof data.chars === 'object' ? data : null;
      } catch (e) {
        return null;
      }
    },

    owns(id) {
      const crew = this.myCrew();
      return !!(crew && crew.chars[id]);
    },

    parseSave(text, file) {
      const H = this.game();
      let d = null;
      try { d = JSON.parse(String(text || '')); } catch (e) { d = null; }
      const st = d && d.state;
      if (!st || !st.roster || typeof st.roster !== 'object') return { error: 'Это не сохранение HSR 98: в файле нет экипажа.' };
      const chars = {};
      for (const [key, r] of Object.entries(st.roster)) {
        const id = key === 'trail' ? (st.mcPath === 'trail_p' ? 'trail_p' : 'trail') : key;
        if (!H.CHARS[id] || !r) continue;
        const tr = r.tr && r.tr[id] && r.tr[id].lv;
        chars[id] = { lvl: Math.max(1, Math.min(99, parseInt(r.lvl, 10) || 1)), eid: Math.max(0, Math.min(6, parseInt(r.eid, 10) || 0)), skill: tr ? Math.max(0, Math.min(15, parseInt(tr.skill, 10) || 0)) : 0 };
      }
      if (!Object.keys(chars).length) return { error: 'В сохранении нет ни одного персонажа.' };
      const cones = [...new Set(((st.inv && st.inv.cones) || []).map(c => c && c.id).filter(id => H.CONES[id]))];
      const sum = d.summary || {};
      return {
        file: String(file || '').slice(0, 40),
        date: String(d.date || '').slice(0, 24),
        summary: { name: String(sum.name || '').slice(0, 24), lvl: parseInt(sum.lvl, 10) || 0, where: String(sum.where || '').slice(0, 80) },
        chars,
        cones
      };
    },

    loadCrew(text, file) {
      const crew = this.parseSave(text, file);
      if (crew.error) return crew;
      if (!this.write(CREW_KEY, JSON.stringify(crew))) return { error: 'Браузер не даёт сайту сохранить экипаж.' };
      return crew;
    },

    forgetCrew() {
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem(CREW_KEY); } catch (e) { return false; }
      return true;
    },

    crewCandidates(crew, mode) {
      const H = this.game(), R = this.bench(), K = this.hsrData();
      const sigOf = id => Object.keys(H.CONES).find(k => H.CONES[k].sig === id);
      const sigReady = team => team.every(id => { const c = sigOf(id); return !c || crew.cones.includes(c); });
      const seen = new Map();
      const add = row => {
        row.missing = row.team.filter(id => !crew.chars[id]);
        const key = row.team.slice().sort().join(',');
        const old = seen.get(key);
        if (!old || row.win > old.win || (row.win === old.win && row.cyc < old.cyc)) seen.set(key, row);
      };
      for (const [carrier, c] of Object.entries(R.chars)) {
        if (!c.teams) continue;
        for (const v of ['best', 'std', 'free']) {
          const sig = c.teams[v].sig[mode];
          const cone = sig && sigReady(sig.team) ? 'sig' : 'std';
          const t = c.teams[v][cone][mode];
          if (t && t.team) add({ team: t.team, cyc: t[mode].cyc, win: t[mode].win, carrier, cone });
        }
      }
      for (const t of K.TEAMS) {
        const r = R.teams[t.id];
        if (r && r[mode] && sigReady(t.members)) add({ team: t.members, cyc: r[mode].cyc, win: r[mode].win, carrier: t.members[0], cone: 'sig' });
      }
      const rows = [...seen.values()];
      for (const r of rows) {
        const named = K.TEAMS.find(t => t.members.length === r.team.length && t.members.every(m => r.team.includes(m)));
        if (named) r.named = named;
      }
      return rows.sort((a, b) => b.win - a.win || a.cyc - b.cyc);
    },

    crewPicks(crew, mode) {
      const rows = this.crewCandidates(crew, mode);
      const own = rows.filter(r => !r.missing.length).slice(0, 3);
      const bar = own.length ? own[0] : null;
      const near = [];
      const used = new Set();
      for (const r of rows) {
        if (r.missing.length !== 1 || used.has(r.missing[0])) continue;
        if (bar && (r.win < bar.win || (r.win === bar.win && r.cyc >= bar.cyc))) continue;
        used.add(r.missing[0]);
        near.push(r);
        if (near.length === 3) break;
      }
      return { own, near };
    },

    renderCrewTeam(r, mode) {
      const R = this.bench();
      const goal = mode === 'hall' ? 'h11-1' : 'b-' + R.conditions.boss.encs[0];
      const unit = mode === 'hall' ? 'цикла за этапы 11–15' : 'цикла за пять боссов';
      return `
        <tr>
          <td>${r.team.map(id => this.charChip(id)).join('')}</td>
          <td class="kv-small">${this.num(r.cyc)} ${unit}${r.win < 1 ? `, побед ${Math.round(100 * r.win)}%` : ''}<br>
          ${r.cone === 'sig' ? 'с сигнатурными конусами' : 'со стандартными конусами'}${r.named ? `<br>это отряд ${this.link('/hsr98/team?id=' + r.named.id, '«' + this.esc(r.named.name) + '»')}` : ''}<br>
          ${this.link('/hsr98/builder?team=' + r.team.join(',') + '&goal=' + goal + (r.cone === 'std' ? '&cone=std' : ''), 'в конструктор')}</td>
        </tr>`;
    },

    renderMineForm(error) {
      const vfs = window.vfs;
      const folder = vfs && vfs.resolvePath ? vfs.resolvePath(SAVE_DIR) : null;
      const gm = window.gameManager;
      const installed = !!folder || !!(gm && gm.isInstalled && gm.isInstalled('hsr98'));
      const pick = this.minePick ? this.minePick.name : '';
      return `
        <table class="kv-sheet" width="100%" cellspacing="0" cellpadding="8">
          <tr><td>
            <p class="kv-sheet-head">Загрузить сохранение</p>
            <p class="kv-small">Игра записывает каждое сохранение в папку <b>${SAVE_PATH}</b>: SAVE1.SAV, SAVE2.SAV, SAVE3.SAV и AUTOSAVE.SAV. Сайт прочитает файл у вас на компьютере и никуда его не отправит.</p>
            <input class="kv-mine-file" id="kv-mine-file" size="40" readonly value="${this.esc(pick ? SAVE_PATH + '\\' + pick : '')}">
            <button class="win-btn kv-btn" data-kv-browse="1">Обзор...</button>
            <button class="win-btn kv-btn" data-kv-load="1">Загрузить</button>
            <span class="kv-gb-error" id="kv-mine-error">${this.esc(error || '')}</span>
            ${installed ? '' : `<p class="kv-warn">${this.gif('warn')} Игра не установлена, сохранений пока нет. HSR 98 бесплатна: <button class="win-btn kv-btn" data-kv-steam="hsr98">Открыть в Steam</button></p>`}
          </td></tr>
        </table>`;
    },

    renderMine() {
      const H = this.game(), R = this.bench(), K = this.hsrData();
      const head = `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба HSR 98')} &gt; Мой экипаж</p>
        <h1 class="kv-h1">Мой экипаж</h1>`;
      if (!H || !R) return head + `<p class="kv-warn">${this.gif('warn')} Данные недоступны.</p>`;
      const crew = this.myCrew();
      if (!crew) {
        return head + `
          <p>Загрузите своё сохранение, и сайт отметит ваших персонажей в тир-листе и списке экипажа, а ещё подберёт лучшие отряды только из тех, кто у вас есть.</p>
          ${this.renderMineForm('')}`;
      }
      const ids = Object.keys(crew.chars).filter(id => H.CHARS[id]);
      const cols = K.COLUMNS.map(col => {
        const mine = ids.filter(id => this.primaryCol(id) === col.id);
        if (!mine.length) return '';
        const place = this.placement('hall', 'sig', col.id);
        return `<tr><td class="kv-team-label">${this.esc(col.name)}</td><td>${mine.map(id => `<span class="kv-mine-chip">${this.charChip(id)}<span class="kv-small">ур. ${crew.chars[id].lvl}${crew.chars[id].eid ? ', Э' + crew.chars[id].eid : ''}${crew.chars[id].skill ? ', навык ' + crew.chars[id].skill : ''}${place[id] ? ', ' + this.tierName(place[id]) : ''}</span></span>`).join('')}</td></tr>`;
      }).join('');
      const block = mode => {
        const p = this.crewPicks(crew, mode);
        const title = mode === 'hall' ? 'Зал забвения' : 'Боссы';
        const own = p.own.length
          ? `<table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">${p.own.map(r => this.renderCrewTeam(r, mode)).join('')}</table>`
          : '<p>Ни один отряд стенда не собирается целиком из вашего экипажа. Посмотрите, кого не хватает, ниже.</p>';
        const near = p.near.length
          ? `<p class="kv-small"><b>Не хватает одного:</b></p><table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">${p.near.map(r => {
            const src = this.sources(r.missing[0]);
            return `<tr><td>${r.team.map(id => r.missing.includes(id) ? `<span class="kv-missing-chip">${this.charChip(id)}</span>` : this.charChip(id)).join('')}</td><td class="kv-small">${this.num(r.cyc)} цикла. Нужен ${this.link('/hsr98/char?id=' + r.missing[0], this.esc(this.charName(r.missing[0])))}${src.length ? ': ' + this.esc(src[0]) : ''}.</td></tr>`;
          }).join('')}</table>`
          : '';
        return `<h2 class="kv-h2">Лучшие отряды из вашего экипажа: ${title}</h2>${own}${near}`;
      };
      const s = crew.summary;
      return head + `
        <table class="kv-plate-big" width="100%" cellspacing="0" cellpadding="6">
          <tr><td><b>${this.esc(crew.file)}</b>${crew.date ? `, записано ${this.esc(crew.date)}` : ''}.
          ${s.name ? `Первопроходец ${this.esc(s.name)}` : 'Первопроходец'}${s.lvl ? `, средний уровень ${s.lvl}` : ''}${s.where ? `, ${this.esc(s.where)}` : ''}.<br>
          В экипаже ${ids.length} из ${Object.keys(H.CHARS).length}. В ${this.link('/hsr98/tier?mine=1', 'тир-листе')} ваши персонажи отмечены зелёной рамкой.
          <button class="win-btn kv-btn" data-kv-forget="1">Забыть сохранение</button></td></tr>
        </table>
        <h2 class="kv-h2">Ваши персонажи</h2>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">${cols}</table>
        <p class="kv-small">Тир из Зала забвения с сигнатурными конусами. Числа отрядов взяты из стенда: там персонажи на уровне врагов и с реликвиями +${R.conditions.relic}. Если ваши ниже, циклов будет больше. Числа с сигнатурными конусами сайт берёт, только если в сохранении есть такие конусы для всех участников отряда, иначе считает со стандартными.</p>
        ${block('hall')}
        ${block('boss')}
        <h2 class="kv-h2">Другое сохранение</h2>
        ${this.renderMineForm('')}`;
    },

    attachEvents(win, container, ieInstance) {
      baseAttach.call(this, win, container, ieInstance);
      const ie = ieInstance || window.appIE;
      const on = (sel, fn) => container.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => {
        if (e && e.preventDefault) e.preventDefault();
        fn(el);
      }));
      const rerender = () => { if (ie && win && ie.renderPage) ie.renderPage(win, ie.currentUrl || this.url('/hsr98/mycrew')); };
      const fail = text => {
        const err = container.querySelector('#kv-mine-error');
        if (err) err.textContent = text;
        if (window.soundSys) window.soundSys.playError();
      };
      on('[data-kv-browse]', () => {
        if (!window.fileDialog) return fail('Окно выбора файла недоступно.');
        window.fileDialog.show({
          mode: 'open',
          path: SAVE_DIR.slice(),
          filters: [{ label: 'Сохранения HSR 98 (*.sav)', exts: ['sav'] }, { label: 'Все файлы (*.*)', exts: ['*'] }],
          onOk: (path, name) => {
            this.minePick = { path, name };
            const field = container.querySelector('#kv-mine-file');
            if (field) field.value = (path[0] === 'My Computer' ? path.slice(1) : path).join('\\') + '\\' + name;
          }
        });
      });
      on('[data-kv-load]', () => {
        const pick = this.minePick;
        if (!pick) return fail('Сначала выберите файл кнопкой «Обзор...».');
        const text = window.vfs && window.vfs.readFile ? window.vfs.readFile(pick.path, pick.name) : null;
        if (text == null) return fail('Файл не найден.');
        const crew = this.loadCrew(text, pick.name);
        if (crew.error) return fail(crew.error);
        this.minePick = null;
        if (window.soundSys) window.soundSys.playDing();
        rerender();
      });
      on('[data-kv-forget]', () => {
        if (window.soundSys) window.soundSys.playClick();
        this.forgetCrew();
        rerender();
      });
    }
  });
})();
