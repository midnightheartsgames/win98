(() => {
  const site = window.kovchegSite;
  if (!site) return;
  const proto = Object.getPrototypeOf(site);
  const baseAttach = proto.attachEvents;
  const DEFAULT_GOAL = 'h11-1';

  Object.assign(proto, {
    sim() {
      const H = this.game(), K = this.hsrData();
      if (!H || !H.Game || !H.Battle || !window.kovchegSim) return null;
      if (!this.simCache || this.simCache.H !== H) this.simCache = { H, api: window.kovchegSim.create(H, K) };
      return this.simCache.api;
    },

    buildGoals() {
      const H = this.game();
      const out = [];
      for (const st of H.FH.STAGES) {
        st.nodes.forEach((_, ni) => {
          const half = st.nodes.length > 1;
          out.push({ id: 'h' + st.n + (half ? '-' + (ni + 1) : ''), kind: 'hall', n: st.n, ni, name: 'Этап ' + st.n + (half ? ', половина ' + (ni + 1) : '') });
        });
      }
      const lead = this.bossList();
      for (const [foe, meets] of Object.entries(lead)) {
        for (const m of meets) {
          if (m.e.lfTrials) continue;
          const bits = [];
          if (m.e.endAt) bits.push('до ' + this.pct(m.e.endAt) + ' HP');
          if (m.e.allyBuff) bits.push('с подкреплением');
          out.push({ id: 'b-' + m.enc, kind: 'boss', enc: m.enc, foe, name: `${this.foeName(foe)}, ${m.lvl} ур.${bits.length ? ', ' + bits.join(', ') : ''}` });
        }
      }
      return out;
    },

    buildQuery(params) {
      const H = this.game();
      const raw = String(params.team || '').split(',').map(x => x.trim()).filter(Boolean);
      const team = raw.filter(id => H.CHARS[id]).slice(0, 4);
      const unknown = raw.filter(id => !H.CHARS[id]);
      const goals = this.buildGoals();
      const goal = goals.find(g => g.id === params.goal) || goals.find(g => g.id === DEFAULT_GOAL);
      const keys = team.map(id => (id === 'trail_p' ? 'trail' : id));
      const dupes = [...new Set(team.filter((id, i) => keys.indexOf(keys[i]) !== i))];
      return { team, unknown, dupes, goal, cone: params.cone === 'std' ? 'std' : 'sig', asked: params.team != null };
    },

    buildHref(q) {
      const parts = [];
      if (q.team) parts.push('team=' + q.team.join(','));
      if (q.goal) parts.push('goal=' + (q.goal.id || q.goal));
      if (q.cone === 'std') parts.push('cone=std');
      return '/hsr98/builder' + (parts.length ? '?' + parts.join('&') : '');
    },

    goalFoes(goal) {
      const H = this.game();
      if (goal.kind === 'hall') return [...new Set(H.FH.STAGES[goal.n - 1].nodes[goal.ni].flatMap(b => b.waves.flat()))];
      const e = H.ENCOUNTERS[goal.enc];
      return [...new Set((e.waves || [e.enemies]).flat().map(s => String(s).split(':')[0]))];
    },

    buildAnalysis(q) {
      const H = this.game(), K = this.hsrData(), R = this.bench();
      const cols = q.team.flatMap(id => K.CHARS[id].cols);
      const roles = [];
      if (!cols.includes('dps') && !cols.includes('sub')) roles.push({ bad: true, text: 'Нет бойца «Урона» или «Второго урона». Бои затянутся.' });
      if (!cols.includes('sus')) roles.push({ bad: true, text: 'Нет «Выживания». Без лечения и щитов отряд падает на боссах и в длинных боях.' });
      const dps = q.team.filter(id => K.CHARS[id].cols[0] === 'dps').length;
      if (dps > 2) roles.push({ bad: true, text: 'Три и больше бойцов «Урона» делят ходы и очки навыка, усилить их некому.' });
      if (q.team.length < 4) roles.push({ bad: true, text: `В отряде ${q.team.length} из 4 мест.` });
      if (!roles.length) roles.push({ bad: false, text: 'Роли закрыты: есть урон и выживание.' });
      const sp = q.team.reduce((a, id) => a + (R.chars[id] ? R.chars[id].sp.turn : 0), 0);
      const spText = sp >= 0 ? 'очков хватает, их можно тратить свободно' : sp >= -1 ? 'очков впритык, кто-то иногда будет бить базовой атакой' : 'очков не хватит, бойцы будут часто бить базовой атакой';
      const foes = this.goalFoes(q.goal);
      const elems = [...new Set(q.team.map(id => H.CHARS[id].elem))];
      const open = foes.filter(f => !H.ENEMIES[f].weak.some(e => elems.includes(e)));
      const fusions = Object.entries(H.FUSIONS).filter(([, f]) => f.members.every(m => q.team.includes(m)));
      return { roles, sp, spText, foes, elems, open, fusions };
    },

    renderBuilderForm(q) {
      const H = this.game();
      const byPath = Object.keys(H.PATHS).map(p => ({ p, ids: Object.keys(H.CHARS).filter(id => H.CHARS[id].path === p).sort((a, b) => this.charName(a).localeCompare(this.charName(b), 'ru')) })).filter(x => x.ids.length);
      const slot = i => {
        const cur = q.team[i] || '';
        const opts = byPath.map(g => `<optgroup label="${this.esc(H.PATHS[g.p].name)}">${g.ids.map(id => `<option value="${id}"${id === cur ? ' selected' : ''}>${this.esc(this.charName(id))}</option>`).join('')}</optgroup>`).join('');
        return `<tr><td class="kv-sheet-no">${i + 1}</td><td><select class="kv-sel kv-sel-wide" data-kv-b="slot">${'<option value="">(пусто)</option>' + opts}</select></td></tr>`;
      };
      const goals = this.buildGoals();
      const goalOpts = [['hall', 'Зал забвения'], ['boss', 'Боссы, условия стенда']].map(([kind, label]) => `<optgroup label="${label}">${goals.filter(g => g.kind === kind).map(g => `<option value="${g.id}"${g.id === q.goal.id ? ' selected' : ''}>${this.esc(g.name)}</option>`).join('')}</optgroup>`).join('');
      return `
        <table class="kv-sheet" width="100%" cellspacing="0" cellpadding="6">
          <tr>
            <td class="kv-sheet-left" width="55%" valign="top">
              <p class="kv-sheet-head">Отряд</p>
              <table cellspacing="0" cellpadding="3">${[0, 1, 2, 3].map(slot).join('')}</table>
            </td>
            <td valign="top">
              <p class="kv-sheet-head">Куда идём</p>
              <select class="kv-sel kv-sel-wide" data-kv-b="goal">${goalOpts}</select>
              <p class="kv-sheet-head">Конусы</p>
              <label><input type="radio" name="kv-b-cone" value="sig"${q.cone === 'sig' ? ' checked' : ''}> сигнатурные, где есть</label><br>
              <label><input type="radio" name="kv-b-cone" value="std"${q.cone === 'std' ? ' checked' : ''}> только стандартные</label>
              <p><button class="win-btn kv-btn" data-kv-build="1">Рассчитать</button></p>
            </td>
          </tr>
        </table>`;
    },

    renderBuildAnalysis(q, a) {
      const H = this.game();
      const row = (ok, text) => `<tr><td class="kv-check-mark">${this.gif(ok ? 'check' : 'warn')}</td><td>${text}</td></tr>`;
      const n = q.goal.kind === 'boss' ? 1 : 5;
      const fus = a.fusions.length ? a.fusions.map(([, f]) => `«${this.esc(f.name)}»${this.fusionWorth(f, n) ? '' : ' (стенд его не ждёт: абсолютные техники участников сильнее)'}`).join(', ') : 'нет';
      return `
        <h2 class="kv-h2">Разбор отряда</h2>
        <p>${q.team.map(id => this.charChip(id)).join('')}</p>
        <table class="kv-checks" width="100%" cellspacing="0" cellpadding="3">
          ${a.roles.map(r => row(!r.bad, this.esc(r.text))).join('')}
          ${row(a.sp >= -1, `Очки навыка по замеру стенда: ${this.esc((a.sp >= 0 ? '+' : '−') + this.num(Math.abs(a.sp), 2))} за круг ходов, ${this.esc(a.spText)}.`)}
          ${row(!a.open.length, a.open.length ? `Стихии отряда (${this.elemList(a.elems)}) не бьют в уязвимость: ${a.open.map(f => this.esc(this.foeName(f))).join(', ')}.` : `Стихии отряда (${this.elemList(a.elems)}) бьют в уязвимость всех врагов цели.`)}
          ${row(true, `Слияния: ${fus}.`)}
        </table>`;
    },

    runBuild(q) {
      const sim = this.sim(), R = this.bench(), H = this.game();
      if (!sim) throw new Error('движок игры не загружен');
      const C = R.conditions, dmg = {}, g = q.goal;
      let res;
      if (g.kind === 'hall') res = sim.hallRun(q.team, g.n, g.ni, C.seeds, q.cone, C.relic, dmg);
      else {
        const r = sim.bossRun(q.team, g.enc, C.seeds, q.cone, C.relic, C.boss, dmg);
        res = { cyc: r.cyc / r.runs, win: r.wins / r.runs, down: r.down / r.runs };
      }
      const total = Object.values(dmg).reduce((s, v) => s + v, 0) || 1;
      const share = {};
      for (const id of q.team) share[id] = (dmg[id] || 0) / total;
      return Object.assign(res, { share, seeds: C.seeds, fail: g.kind === 'hall' ? H.FH.STAGES[g.n - 1].budget : C.boss.failCycles });
    },

    renderBuildResult(q, res) {
      const H = this.game(), R = this.bench(), g = q.goal;
      const won = Math.round(res.win * res.seeds);
      const lines = [];
      lines.push(`<tr><td class="kv-team-label">Победы</td><td class="kv-num">${won} из ${res.seeds}</td></tr>`);
      lines.push(`<tr><td class="kv-team-label">Циклы</td><td class="kv-num">${this.num(res.cyc)}</td></tr>`);
      lines.push(`<tr><td class="kv-team-label">Пало за бой</td><td class="kv-num">${this.num(res.down)}</td></tr>`);
      const shares = q.team.map(id => `<tr><td>${this.esc(this.charName(id))}</td><td class="kv-num">${this.pct(res.share[id])}</td><td><span class="kv-bar" style="width:${Math.round(160 * res.share[id])}px"></span></td></tr>`).join('');
      let verdict = '';
      if (won === 0) verdict = `<p class="kv-warn">${this.gif('warn')} Отряд не выиграл ни одного боя. Смените отряд или цель: посмотрите, кого советует ${g.kind === 'hall' ? this.link('/hsr98/hall?stage=' + g.n, 'страница этапа') : this.link('/hsr98/bosses?id=' + g.foe, 'страница босса')}.</p>`;
      else if (g.kind === 'hall') {
        const st = H.FH.STAGES[g.n - 1], pick = R.stages[g.n].best;
        const half = st.nodes.length > 1;
        const left = st.budget - res.cyc;
        const stars = (left >= st.goals[0] ? 1 : 0) + (left >= st.goals[1] ? 1 : 0);
        verdict = half
          ? `<p>Это половина этапа. Вторая половина добавит свои циклы к общему бюджету ${st.budget}.</p>`
          : `<p>Бюджет этапа ${st.budget} циклов. Звёзд за циклы: ${stars} из 2.</p>`;
        if (pick) verdict += `<p class="kv-small">Лучший отряд стенда здесь: ${pick.teams[half ? g.ni : 0].map(id => this.charChip(id)).join('')} ${this.num(pick.res[half ? g.ni : 0].cyc)} цикла.</p>`;
      } else verdict = `<p class="kv-small">Босс с HP ×${R.conditions.boss.hp} и атакой ×${R.conditions.boss.atk}, как в тир-листе боссов. В обычном сюжетном бою он гораздо слабее.</p>`;
      return `
        <table class="kv-grid" cellspacing="0" cellpadding="4">${lines.join('')}</table>
        ${won < res.seeds && won > 0 ? `<p class="kv-small">Проигранный бой считается как ${res.fail} циклов.</p>` : ''}
        ${verdict}
        <h3 class="kv-h3">Доля урона</h3>
        <table class="kv-grid kv-shares" cellspacing="0" cellpadding="3">${shares}</table>`;
    },

    renderBuilder(route) {
      const H = this.game(), R = this.bench();
      const head = `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба HSR 98')} &gt; Конструктор отряда</p>
        <h1 class="kv-h1">Конструктор отряда</h1>`;
      if (!H || !R || !R.stages) return head + `<p class="kv-warn">${this.gif('warn')} Данные недоступны.</p>`;
      const q = this.buildQuery(route.params);
      const C = R.conditions;
      const intro = `<p>Соберите отряд, выберите этап Зала или босса и нажмите «Рассчитать». Сайт прогонит бой ${C.seeds} раз тем же движком, что и наш стенд: персонажи на уровне врагов, реликвии +${C.relic}, сборки из личных дел.</p>`;
      let body = '';
      if (q.unknown.length) body += `<p class="kv-warn">${this.gif('warn')} Таких персонажей у нас нет: ${q.unknown.map(x => this.esc(x)).join(', ')}.</p>`;
      if (q.asked && !q.team.length) body += `<p class="kv-warn">${this.gif('warn')} Отряд пуст. Выберите хотя бы одного персонажа.</p>`;
      else if (q.dupes.length) body += `<p class="kv-warn">${this.gif('warn')} ${q.dupes.map(id => this.esc(this.charName(id))).join(', ')}: этот персонаж уже в отряде. Первопроходец тоже идёт только в одной форме.</p>`;
      else if (q.team.length) {
        body += this.renderBuildAnalysis(q, this.buildAnalysis(q));
        body += `
          <h2 class="kv-h2">Расчёт: ${this.esc(q.goal.name)}</h2>
          <div class="kv-sim" data-kv-sim="1"><p class="kv-wait">${this.gif('hammer')} Обработка запроса...</p></div>`;
      }
      return head + intro + this.renderBuilderForm(q) + body;
    },

    attachEvents(win, container, ieInstance) {
      baseAttach.call(this, win, container, ieInstance);
      const ie = ieInstance || window.appIE;
      const route = this.parseUrl(ie && ie.currentUrl ? ie.currentUrl : this.url(''));
      if (route.view !== 'builder') return;
      container.querySelectorAll('[data-kv-build]').forEach(el => el.addEventListener('click', e => {
        if (e && e.preventDefault) e.preventDefault();
        if (window.soundSys) window.soundSys.playClick();
        const team = [...container.querySelectorAll('[data-kv-b="slot"]')].map(s => s.value).filter(Boolean);
        const goal = container.querySelector('[data-kv-b="goal"]');
        const cone = container.querySelector('input[name="kv-b-cone"]:checked');
        const q = { team, goal: goal ? goal.value : DEFAULT_GOAL, cone: cone ? cone.value : 'sig' };
        if (ie && win) ie.navigate(win, this.url(this.buildHref(q)));
      }));
      const box = container.querySelector('[data-kv-sim]');
      if (!box) return;
      const q = this.buildQuery(route.params);
      setTimeout(() => {
        try {
          box.innerHTML = this.renderBuildResult(q, this.runBuild(q));
          box.querySelectorAll('canvas[data-kv-art]').forEach(cv => { try { this.paintArt(cv); } catch (e) { console.warn('kovcheg art', e); } });
          if (window.soundSys) window.soundSys.playDing();
        } catch (err) {
          box.innerHTML = `<p class="kv-warn">${this.gif('warn')} Расчёт сорвался: ${this.esc(err && err.message ? err.message : String(err))}. Смените отряд или цель и попробуйте ещё раз.</p>`;
          if (window.soundSys) window.soundSys.playError();
        }
      }, 60);
    }
  });
})();
