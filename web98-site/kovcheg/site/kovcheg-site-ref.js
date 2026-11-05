(() => {
  const site = window.kovchegSite;
  if (!site) return;
  const proto = Object.getPrototypeOf(site);

  Object.assign(proto, {
    articles() { return window.kovchegArticles || null; },

    elemName(e) {
      const H = this.game();
      return H && H.ELEMENTS[e] ? H.ELEMENTS[e].name : e;
    },

    elemList(list) {
      return (list || []).map(e => this.esc(this.elemName(e))).join(', ') || 'нет';
    },

    foeName(id) {
      const H = this.game();
      return H.ENEMIES[id] ? H.ENEMIES[id].name : id;
    },

    foeCell(id) {
      const H = this.game(), e = H.ENEMIES[id];
      const badge = e.boss ? ' <span class="kv-foe-badge">босс</span>' : e.elite ? ' <span class="kv-foe-badge">элита</span>' : '';
      return `
        <td class="kv-foe" valign="top" align="center">
          ${this.art('foe:' + id, 52, e.name)}<br>
          <b>${this.esc(e.name)}</b>${badge}<br>
          <span class="kv-small">Уязвим: ${this.elemList(e.weak)}${e.resist.length ? '<br>Сопротивляется: ' + this.elemList(e.resist) : ''}</span>
        </td>`;
    },

    stageGoals(st) {
      return `${st.budget} циклов. Звёзды: осталось не меньше ${st.goals[0]} циклов, не меньше ${st.goals[1]} циклов, пал не больше одного персонажа`;
    },

    renderHall(route) {
      const H = this.game(), R = this.bench();
      if (!H || !R || !R.stages) return `<h1 class="kv-h1">Зал забвения</h1><p class="kv-warn">${this.gif('warn')} Данные недоступны.</p>`;
      const total = H.FH.STAGES.length;
      const n = Math.max(1, Math.min(total, parseInt(route.params.stage, 10) || 1));
      const st = H.FH.STAGES[n - 1];
      const tabs = H.FH.STAGES.map(s => s.n === n ? `<td class="kv-stage kv-stage-on">${s.n}</td>` : `<td class="kv-stage">${this.link('/hsr98/hall?stage=' + s.n, String(s.n))}</td>`).join('');
      const kind = { one: 'один бой из двух волн', pair: 'два боя одним отрядом', nodes: 'две половины, два отряда без повторов' }[st.kind];
      const nodes = st.nodes.map((node, ni) => {
        const battles = node.map((b, bi) => b.waves.map((w, wi) => `<tr><td class="kv-wave">${node.length > 1 ? 'Бой ' + (bi + 1) + ',<br>в' : 'В'}олна ${wi + 1}</td>${w.map(id => this.foeCell(id)).join('')}</tr>`).join('')).join('');
        return `
          <h2 class="kv-h2">${st.nodes.length > 1 ? 'Половина ' + (ni + 1) : 'Враги'}</h2>
          <p class="kv-small">Рекомендуемые стихии: <b>${this.elemList(st.rec[ni])}</b></p>
          <table class="kv-grid kv-foes" width="100%" cellspacing="0" cellpadding="3">${battles}</table>`;
      }).join('');
      const pick = R.stages[n];
      const names = { best: 'Лучший', std: 'Без пятизвёздочных из событий', free: 'Бесплатный' };
      const rows = ['best', 'std', 'free'].map(v => {
        const p = pick[v];
        if (!p) return `<tr><td class="kv-team-label">${names[v]}</td><td colspan="3">Стенд не нашёл отряд.</td></tr>`;
        const left = st.budget - p.total;
        const stars = (left >= st.goals[0] ? 1 : 0) + (left >= st.goals[1] ? 1 : 0);
        const win = Math.min(...p.res.map(r => r.win));
        return `
          <tr>
            <td class="kv-team-label">${names[v]}</td>
            <td>${p.teams.map((t, i) => `${p.teams.length > 1 ? `<span class="kv-small">Половина ${i + 1}:</span><br>` : ''}${t.map(id => this.charChip(id)).join('')} <span class="kv-small">${this.link('/hsr98/builder?team=' + t.join(',') + '&goal=h' + n + (p.teams.length > 1 ? '-' + (i + 1) : ''), 'в конструктор')}</span>`).join('<br>')}</td>
            <td class="kv-num">${this.num(p.total)}</td>
            <td class="kv-small">${win < 1 ? `побед ${Math.round(100 * win)}%` : `звёзд за циклы: ${stars} из 2`}</td>
          </tr>`;
      }).join('');
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Зал забвения</p>
        <h1 class="kv-h1">Зал забвения: «Наследие Возвышающейся цитадели»</h1>
        <table class="kv-stages" cellspacing="0" cellpadding="0"><tr><td class="kv-stage-label">Этап:</td>${tabs}</tr></table>
        <table class="kv-plate-big" width="100%" cellspacing="0" cellpadding="6">
          <tr><td><b>Этап ${n}.</b> Враги ${st.lvl} уровня, ${this.esc(kind)}. Бюджет ${this.esc(this.stageGoals(st))}.<br>
          <b>Турбулентность памяти:</b> ${this.esc(st.turb.text)}</td></tr>
        </table>
        ${nodes}
        <h2 class="kv-h2">Отряды стенда</h2>
        <p class="kv-small">Стенд перебрал отряды из судовой роли и лучшие отряды всех бойцов: персонажи ${st.lvl} уровня, реликвии +${R.conditions.relic}, ${R.conditions.seeds} прогонов. Циклы суммарно за этап.</p>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">
          <tr><th>Вариант</th><th>Отряд</th><th>Циклы</th><th>Итог</th></tr>
          ${rows}
        </table>`;
    },

    renderSu(route) {
      const H = this.game(), K = this.hsrData(), R = this.bench();
      if (!H || !R) return `<h1 class="kv-h1">Виртуальная вселенная</h1><p class="kv-warn">${this.gif('warn')} Данные недоступны.</p>`;
      const worlds = H.SU.WORLDS;
      const w = worlds.find(x => x.id === (parseInt(route.params.world, 10) || 1)) || worlds[0];
      const tabs = worlds.map(x => x.id === w.id ? `<td class="kv-tab kv-tab-on">${this.esc(x.name)}</td>` : `<td class="kv-tab">${this.link('/hsr98/su?world=' + x.id, this.esc(x.name))}</td>`).join('');
      const DOM = { combat: 'бой', elite: 'элита', respite: 'отдых', event: 'событие', trade: 'торговец', encounter: 'встреча', boss: 'босс' };
      const plan = w.plan.map((step, i) => `<td class="kv-dom"><span class="kv-small">${i + 1}</span><br>${step.map(d => this.esc(DOM[d] || d)).join(' / ')}</td>`).join('');
      const pool = [...new Set(w.pools.normal.flat().concat(w.pools.elite.flat()))];
      const weakCount = {};
      for (const id of pool) for (const e of H.ENEMIES[id].weak) weakCount[e] = (weakCount[e] || 0) + 1;
      const weak = Object.entries(weakCount).sort((a, b) => b[1] - a[1]).map(([e, c]) => `${this.esc(this.elemName(e))} ${c}`).join(', ');
      const bossFoes = [...new Set(w.pools.boss.flatMap(b => b.waves.flat()))];
      const set = w.set && H.RELIC_SETS[w.set];
      const sc = R.scores.su.sig;
      const top = (col, n) => Object.keys(sc[col]).sort((a, b) => sc[col][b] - sc[col][a]).slice(0, n);
      const paths = Object.entries(H.SU.PATHS).map(([id, p]) => {
        const who = Object.keys(K.CHARS).filter(c => K.CHARS[c].su === id);
        return `<tr><td><b>${this.esc(p.name)}</b><br><span class="kv-small">Эон: ${this.esc(p.aeon)}</span></td><td>${this.esc(p.buffText)}</td><td class="kv-small">${this.esc(p.res)}</td><td>${who.map(c => this.link('/hsr98/char?id=' + c, this.esc(this.cardName(c)))).join(', ') || '&nbsp;'}</td></tr>`;
      }).join('');
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Виртуальная вселенная</p>
        <h1 class="kv-h1">Виртуальная вселенная</h1>
        <table class="kv-tabs" cellspacing="0" cellpadding="0"><tr>${tabs}</tr></table>
        <table class="kv-plate-big" width="100%" cellspacing="0" cellpadding="6">
          <tr><td><b>${this.esc(w.title)}.</b> ${this.esc(w.text)}<br>
          Уровень врагов ${w.lvl}. ${w.needText ? this.esc(w.needText) : 'Открывается квестом Герты.'}<br>
          Планарный набор за прохождение: ${set ? `<b>${this.esc(set.name)}</b> (${this.esc(set.text.replace(/\.$/, ''))})` : 'случайный'}.</td></tr>
        </table>
        <h2 class="kv-h2">Маршрут</h2>
        <table class="kv-grid kv-route" width="100%" cellspacing="0" cellpadding="3"><tr>${plan}</tr></table>
        <p>Уязвимости обычных врагов и элиты этого мира (сколько врагов уязвимы): ${weak}.</p>
        <h2 class="kv-h2">Босс: ${this.esc(w.bossName)}</h2>
        <table class="kv-grid kv-foes" cellspacing="0" cellpadding="3"><tr>${bossFoes.map(id => this.foeCell(id)).join('')}</tr></table>
        <h2 class="kv-h2">Пути благословений</h2>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3">
          <tr><th>Путь</th><th>Благословение Эона</th><th>Резонанс</th><th>Каким бойцам берём</th></tr>
          ${paths}
        </table>
        <h2 class="kv-h2">Сильнее всех во Вселенной по замеру</h2>
        <p>Урон: ${top('dps', 5).map(c => this.charChip(c)).join('')}</p>
        <p>Усиление: ${top('amp', 4).map(c => this.charChip(c)).join('')} Выживание: ${top('sus', 3).map(c => this.charChip(c)).join('')}</p>
        <p class="kv-small">Стенд проходит Мир ${R.conditions.su.world} целиком ${R.conditions.su.seeds} раз: HP и атака врагов ×${this.num(R.conditions.su.hp)}, благословения выбираются первыми из предложенных.</p>`;
    },

    bossList() {
      const H = this.game();
      const byFoe = {};
      for (const [enc, e] of Object.entries(H.ENCOUNTERS)) {
        if (!e.boss) continue;
        const waves = e.waves || [e.enemies];
        const lead = waves.flat().map(s => String(s).split(':')).find(([id]) => H.ENEMIES[id] && H.ENEMIES[id].boss);
        if (!lead) continue;
        (byFoe[lead[0]] = byFoe[lead[0]] || []).push({ enc, lvl: +lead[1], e });
      }
      const top = H.CALYX_TIERS[H.CALYX_TIERS.length - 1].lvl + 2;
      for (const c of H.CALYX) {
        if (c.reward !== 'echo' || !c.waves || !H.ENEMIES[c.boss]) continue;
        (byFoe[c.boss] = byFoe[c.boss] || []).push({ enc: c.id, lvl: top, e: { boss: true, waves: c.waves } });
      }
      return byFoe;
    },

    renderBosses(route) {
      const H = this.game(), K = this.hsrData(), R = this.bench();
      if (!H || !R) return `<h1 class="kv-h1">Боссы</h1><p class="kv-warn">${this.gif('warn')} Данные недоступны.</p>`;
      const list = this.bossList();
      const ids = Object.keys(list);
      const id = ids.includes(route.params.id) ? route.params.id : null;
      const echo = H.CALYX.filter(c => c.reward === 'echo');
      if (!id) {
        const cards = ids.map(f => `<td class="kv-wanted" valign="top" align="center">${this.link('/hsr98/bosses?id=' + f, this.art('foe:' + f, 70, this.foeName(f)))}<br><b>${this.link('/hsr98/bosses?id=' + f, this.esc(this.foeName(f)))}</b><br><span class="kv-small">уязвим: ${this.elemList(H.ENEMIES[f].weak)}</span></td>`);
        const rows = [];
        for (let i = 0; i < cards.length; i += 4) rows.push(`<tr>${cards.slice(i, i + 4).join('')}</tr>`);
        return `
          <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Боссы</p>
          <h1 class="kv-h1">Разыскиваются: боссы SR98</h1>
          <p>Все боссы сюжета и Эха войны. На странице босса уязвимости, приёмы, особые условия боя и кого брать по нашему тир-листу.</p>
          <table class="kv-wanted-board" width="100%" cellspacing="8" cellpadding="6">${rows.join('')}</table>
          <h2 class="kv-h2">Эхо войны</h2>
          <ul class="kv-list">${echo.map(c => `<li><b>${this.esc(c.name)}</b>: ${this.esc(c.text)} ${this.link('/hsr98/bosses?id=' + c.boss, 'разбор босса')}</li>`).join('')}</ul>`;
      }
      const f = H.ENEMIES[id], meets = list[id];
      const skills = (f.skills || []).map(s => {
        const kind = { single: 'одна цель', all: 'весь отряд', blast: 'цель и соседи', self: 'на себя', charge: 'подготовка удара', summon: 'призыв', rally: 'клич', lock: 'захват цели' }[s.t] || s.t;
        return `<tr><td><b>${this.esc(s.n)}</b></td><td>${this.esc(kind)}</td><td>${s.m ? this.pct(s.m) + ' атаки' : '&nbsp;'}${s.e ? ', ' + this.esc(this.elemName(s.e).toLowerCase()) : ''}</td><td class="kv-small">${this.esc(s.text || '')}</td></tr>`;
      }).join('');
      const notes = meets.map(m => {
        const bits = [];
        if (m.e.endAt) bits.push(`бой кончается, когда у босса остаётся ${this.pct(m.e.endAt)} HP`);
        if (m.e.hpStart) bits.push(`босс начинает с ${this.pct(m.e.hpStart)} HP`);
        if (m.e.allyBuff) bits.push('отряд получает подкрепление: ' + [...new Set(m.e.allyBuff.map(b => b.name))].join(', '));
        if (m.e.trials) bits.push('на время боя в отряд выдают: ' + m.e.trials.map(t => this.charName(t)).join(', '));
        const ed = K.BOSS_NOTES[m.enc];
        return `<li>Встреча ${m.lvl} уровня${bits.length ? ': ' + this.esc(bits.join('; ')) : ''}.${ed ? ' ' + this.esc(ed) : ''}</li>`;
      }).join('');
      const charge = (f.skills || []).some(s => s.t === 'charge' || s.t === 'lock');
      const fixedParty = meets.every(m => m.e.lfTrials);
      const sc = R.scores.boss.sig;
      const need = [...new Set(meets.flatMap(m => K.BOSS_NEED[m.enc] || []))];
      const fighters = Object.keys(sc.dps).filter(c => f.weak.includes(H.CHARS[c].elem)).sort((a, b) => sc.dps[b] - sc.dps[a]).slice(0, 6);
      const amps = Object.keys(sc.amp).sort((a, b) => sc.amp[b] - sc.amp[a]).slice(0, 3);
      const sus = Object.keys(sc.sus).sort((a, b) => sc.sus[b] - sc.sus[a]).slice(0, 3);
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; ${this.link('/hsr98/bosses', 'Боссы')} &gt; ${this.esc(f.name)}</p>
        <table class="kv-poster" width="100%" cellspacing="0" cellpadding="8">
          <tr>
            <td width="140" align="center" valign="top">${this.art('foe:' + id, 100, f.name)}<p class="kv-poster-head">РАЗЫСКИВАЕТСЯ</p></td>
            <td valign="top">
              <h1 class="kv-h1">${this.esc(f.name)}</h1>
              <table class="kv-passport" cellspacing="0" cellpadding="3">
                <tr><td>Уязвим</td><td>${this.elemList(f.weak)}</td><td>Сопротивляется</td><td>${this.elemList(f.resist)}</td></tr>
                <tr><td>HP</td><td>×${this.num(f.hp)} от обычного врага</td><td>Атака</td><td>×${this.num(f.atk, 2)}</td></tr>
                <tr><td>Стойкость</td><td>${f.tough}</td><td>Скорость</td><td>${f.spd}</td></tr>
              </table>
              <ul class="kv-list">${notes}</ul>
              ${charge ? '<p><b>Совет:</b> когда босс готовит удар, пробейте его. Пробитие отменяет подготовку.</p>' : ''}
            </td>
          </tr>
        </table>
        <h2 class="kv-h2">Приёмы</h2>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Приём</th><th>По кому</th><th>Сила</th><th>Примечание</th></tr>${skills}</table>
        <h2 class="kv-h2">Кого брать</h2>
        ${need.length ? `<p class="kv-warn">${this.gif('warn')} Без этих персонажей бой не пройти:</p><p>${need.map(c => this.charChip(c)).join('')}</p>` : ''}
        ${fixedParty ? '<p>Отряд в этом бою выдаёт сама игра, выбирать некого.</p>' : `<table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">
          <tr><td class="kv-team-label">${need.length ? 'Остальные места' : 'Урон'}</td><td>${fighters.map(c => this.charChip(c)).join('') || 'нет'}<br><span class="kv-small">Бойцы, чья стихия бьёт в уязвимость, по тир-листу боссов.</span></td></tr>
          <tr><td class="kv-team-label">Усиление</td><td>${amps.map(c => this.charChip(c)).join('')}</td></tr>
          <tr><td class="kv-team-label">Выживание</td><td>${sus.map(c => this.charChip(c)).join('')}</td></tr>
        </table>`}`;
    },

    tableBreak() {
      const H = this.game();
      const what = { phys: 'Кровотечение на два хода, до 16% макс. HP обычного врага, у элиты и босса до 5%', fire: 'Горение на два хода', ice: 'Заморозка: враг пропускает ход, потом получает урон', elec: 'Шок на два хода, вдвое сильнее Горения', wind: 'Порыв ветра на два хода, по элите и боссу втрое сильнее', quant: 'Ход отодвигается ещё на 20%, Запутывание на ход', imag: 'Ход отодвигается ещё на 30%, Заточение: скорость \u221210% на ход' };
      return `<table class="kv-grid" cellspacing="0" cellpadding="3"><tr><th>Стихия</th><th>Эффект пробития</th></tr>${Object.keys(H.ELEMENTS).map(e => `<tr><td>${this.esc(this.elemName(e))}</td><td>${this.esc(what[e] || H.BREAK_EFFECT[e])}</td></tr>`).join('')}</table>`;
    },

    tableCoef() {
      const H = this.game();
      return `<table class="kv-grid" cellspacing="0" cellpadding="3"><tr><th>Стихия</th><th>Коэффициент пробития</th><th>Уязвимы врагов</th></tr>${Object.entries(H.ELEMENTS).map(([e, x]) => `<tr><td>${this.esc(x.name)}</td><td class="kv-num">${this.num(x.coef)}</td><td class="kv-num">${Object.values(H.ENEMIES).filter(f => f.weak.includes(e)).length}</td></tr>`).join('')}</table>`;
    },

    bannerOdds(key) {
      const H = this.game(), T = H.TUNING, B = H.BANNERS[key];
      if (key === 'ev') return 'всегда избранный';
      if (key === 'std') return 'случайная из стандартного набора';
      const cone = Object.values(B.stars || {}).some(s => s.cone);
      const rate = cone ? (key === 'forge' ? T.forgeFeatured : T.coneFeatured) : ({ conv: T.convFeatured, guild: T.guildFeatured, mid: T.midFeatured, con: T.conFeatured }[key] || T.sigFeatured);
      if (rate >= 1) return 'всегда избранный';
      const party = B.party ? `, при проигрыше ${Math.round(100 * T.guildParty)}% на другого из отряда` : '';
      return `${Math.round(100 * rate)}%${party}, после проигрыша гарантия`;
    },

    tableBanners() {
      const H = this.game(), T = H.TUNING;
      const rows = Object.entries(H.BANNERS).map(([key, b]) => {
        const stars = b.stars ? Object.entries(b.stars) : [];
        const cone = stars.some(([, s]) => s.cone);
        const five = b.featured ? b.featured.map(id => this.charName(id)) : stars.map(([id, s]) => cone ? (H.CONES[s.cone] ? H.CONES[s.cone].name : s.cone) : this.charName(id));
        const pass = H.ITEMS[b.pass] ? H.ITEMS[b.pass].name : b.pass;
        return `<tr><td><b>${this.esc(b.name)}</b>${b.kind !== b.name ? `<br><span class="kv-small">${this.esc(b.kind)}</span>` : ''}</td><td>${cone ? 'конусы' : 'персонажи'}</td><td>${this.esc(pass)}</td><td class="kv-num">${cone ? T.conePity5 : T.pity5}</td><td class="kv-small">${this.esc(this.bannerOdds(key))}</td><td class="kv-small">${five.map(x => this.esc(x)).join(', ')}</td></tr>`;
      }).join('');
      return `<table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Баннер</th><th>Что</th><th>Валюта</th><th>Гарант</th><th>Избранная пятёрка</th><th>Пятёрки</th></tr>${rows}</table>`;
    },

    tableFree() {
      const K = this.hsrData();
      return `<table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Персонаж</th><th>Откуда</th><th>Роль</th></tr>${K.FREE.map(id => `<tr><td>${this.charChip(id)}</td><td>${this.esc(K.SOURCE[id] || '')}</td><td>${this.esc(K.CHARS[id].cols.map(c => K.COLUMNS.find(x => x.id === c).name).join(', '))}</td></tr>`).join('')}</table>`;
    },

    articleTable(name) {
      return { break: () => this.tableBreak(), coef: () => this.tableCoef(), banners: () => this.tableBanners(), free: () => this.tableFree() }[name]();
    },

    renderGuide(route) {
      const A = this.articles();
      if (!A) return `<h1 class="kv-h1">Статьи</h1><p class="kv-warn">${this.gif('warn')} Статьи недоступны.</p>`;
      const id = A.list.includes(route.params.id) ? route.params.id : null;
      if (!id) {
        return `
          <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Статьи</p>
          <h1 class="kv-h1">Статьи</h1>
          <table class="kv-grid" width="100%" cellspacing="0" cellpadding="6">
            ${A.list.map(a => `<tr><td><b>${this.link('/hsr98/guide?id=' + a, this.esc(A[a].title))}</b><br><span class="kv-small">Пишет ${this.esc(A[a].by)}.</span> ${this.esc(A[a].intro)}</td></tr>`).join('')}
          </table>
          <h2 class="kv-h2">Разборы режимов</h2>
          <ul class="kv-list">
            <li>${this.link('/hsr98/hall', 'Зал забвения по этапам')}</li>
            <li>${this.link('/hsr98/su', 'Виртуальная вселенная по мирам')}</li>
            <li>${this.link('/hsr98/bosses', 'Боссы сюжета и Эхо войны')}</li>
          </ul>`;
      }
      const a = A[id];
      const toc = a.sections.map((s, i) => `<a class="kv-toc" data-kv-jump="kv-art-${i}">${this.esc(s.h)}</a>`).join(' &middot; ');
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; ${this.link('/hsr98/guide', 'Статьи')} &gt; ${this.esc(a.title)}</p>
        <table class="kv-article" width="600" cellspacing="0" cellpadding="0" align="center"><tr><td>
          <h1 class="kv-h1">${this.esc(a.title)}</h1>
          <p class="kv-small">Пишет ${this.esc(a.by)}. Обновлено ${this.data().updated}.</p>
          <p class="kv-lead">${this.renderText(a.intro)}</p>
          <p class="kv-toc-row"><b>Содержание:</b> ${toc}</p>
          ${a.sections.map((s, i) => `<h2 class="kv-h2" id="kv-art-${i}">${this.esc(s.h)}</h2>${s.p.map(x => `<p>${this.renderText(x)}</p>`).join('')}${s.table ? this.articleTable(s.table) : ''}`).join('')}
        </td></tr></table>`;
    },

    renderCones() {
      const H = this.game(), K = this.hsrData();
      const order = Object.keys(H.PATHS);
      const groups = order.map(p => {
        const cones = Object.entries(H.CONES).filter(([, c]) => c.path === p).sort((a, b) => b[1].rarity - a[1].rarity);
        if (!cones.length) return '';
        return `
          <tr><td colspan="4" class="kv-roll-arch"><b>${this.esc(H.PATHS[p].name)}</b></td></tr>
          ${cones.map(([cid, c]) => {
            const who = Object.keys(H.CHARS).filter(id => c.sig === id || (!c.sig && H.CHARS[id].path === p && (K.STD_CONE[p] === cid || K.EARLY_CONE[p] === cid)));
            const whom = who.length ? (c.sig ? 'сигнатурный: ' : 'советуем: ') + who.slice(0, 8).map(id => this.link('/hsr98/char?id=' + id, this.esc(this.cardName(id)))).join(', ') : 'любому на Пути ' + this.esc(H.PATHS[p].name);
            return `<tr><td><b>${this.esc(c.name)}</b><br><span class="kv-small">${c.rarity} зв.</span></td><td>${this.esc(c.text)}</td><td class="kv-small">${this.esc(this.coneSources(cid).join('; ') || 'нет в продаже и в прыжках')}</td><td class="kv-small">${whom}</td></tr>`;
          }).join('')}`;
      }).join('');
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Световые конусы</p>
        <h1 class="kv-h1">Световые конусы</h1>
        <p>Все ${Object.keys(H.CONES).length} конусов игры по Путям. Бонус конуса работает только на своём Пути, наложение копий усиливает его на 25% за ступень. В колонке справа: чей это конус или кому мы его советуем.</p>
        <p class="kv-small">Ещё справочники: ${this.link('/hsr98/relics', 'реликвии')} | ${this.link('/hsr98/fusions', 'Слияния')} | ${this.link('/hsr98/banners', 'баннеры')}</p>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Конус</th><th>Эффект</th><th>Где взять</th><th>Кому</th></tr>${groups}</table>`;
    },

    renderRelics() {
      const H = this.game(), K = this.hsrData();
      const users = set => Object.keys(K.CHARS).filter(id => { const p = K.PRESETS[K.CHARS[id].build]; const s = p.set === 'elem' ? K.ELEM_SET[H.CHARS[id].elem] : p.set; return s === set || p.planar === set; });
      const bonus = (b, k) => Object.entries(b).map(([s, v]) => `${H.STAT_NAMES[s] || s} +${this.pct(v * k)}`).join(', ');
      const drops = id => H.CALYX.filter(c => (c.sets || []).includes(id)).map(c => c.name.split(': ').pop()).join(', ');
      const cav = H.CAVERN_SETS.map(id => { const s = H.RELIC_SETS[id]; const u = users(id); return `<tr><td><b>${this.esc(s.name)}</b></td><td>${this.esc(bonus(s.bonus, 1))}</td><td>${this.esc(bonus(s.bonus, 2))}</td><td class="kv-small">${this.esc(drops(id)) || '&nbsp;'}</td><td class="kv-small">${u.map(x => this.esc(this.cardName(x))).join(', ') || '&nbsp;'}</td></tr>`; }).join('');
      const pl = H.PLANAR_SETS.map(id => { const s = H.RELIC_SETS[id]; const u = users(id); return `<tr><td><b>${this.esc(s.name)}</b><br><span class="kv-small">${this.esc(Object.values(s.pieces || {}).join(', '))}</span></td><td>${this.esc(s.text)}</td><td class="kv-small">${u.length} персонажей</td></tr>`; }).join('');
      const jokes = H.FH.SHOP.jokes, row = jokes.rows.find(r => r.item === 'resin');
      const resin = row ? `Посланник в Зале забвения продаёт её в лавке «${jokes.name}» за ${row.price} нефритовых перьев, ${row.lim === 1 ? 'одну' : 'до ' + row.lim + ' штук'} раз в ${H.FH.TUN.shopDays} дня. Ещё смолу дают в Синтезе за ${H.RELIC_CRAFT ? H.RELIC_CRAFT.resinCost : 800} Обломков Реликвии. Реликвию любого набора и слота создают в Синтезе за ${H.RELIC_CRAFT ? H.RELIC_CRAFT.cost : 100} Обломков, а смола выбирает ей главную характеристику. Обломки дают расщеплённые реликвии. Тратьте её на тело или ноги главного бойца: там главная характеристика выпадает реже всего.` : '';
      const slots = H.RELIC_SLOTS.map(sl => `<tr><td><b>${this.esc(sl.name)}</b></td><td>${sl.mains.map(m => this.esc(H.STAT_NAMES[m] || m)).join(', ')}</td></tr>`).join('');
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Реликвии</p>
        <h1 class="kv-h1">Реликвии и планарные украшения</h1>
        <p>Четыре предмета пещеры (голова, руки, тело, ноги) и два планарных (сфера и вязь). Набор из двух предметов даёт бонус, из четырёх тот же бонус дважды. Планарные наборы работают от двух предметов и приходят из Виртуальной вселенной.</p>
        <h2 class="kv-h2">Наборы пещеры</h2>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Набор</th><th>2 предмета</th><th>4 предмета</th><th>Где падает</th><th>Кому мы советуем</th></tr>${cav}</table>
        <p class="kv-small">С патча 1.6 каждая Пещера коррозии и каждая Застойная тень роняет свою пару наборов. Общая Пещера в Симуляторе Экспресса по-прежнему даёт любой набор. Застойные тени принимают Топливные купоны: три купона и 30 энергии приносят реликвии своей пары без боя, до десяти раз за заход. Пещеры купонов не берут, зато проходятся сериями до шести боёв.</p>
        <h2 class="kv-h2">Планарные наборы</h2>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Набор</th><th>Эффект</th><th>Советуем</th></tr>${pl}</table>
        <h2 class="kv-h2">Главные характеристики по слотам</h2>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3">${slots}</table>
        <h2 class="kv-h2">${this.esc(H.ITEMS.resin ? H.ITEMS.resin.name : 'Смола')}</h2>
        <p>${this.esc(resin)}</p>`;
    },

    hitValue(ab, n) {
      if (!ab) return 0;
      let v = 0;
      for (const f of ab.fx || []) {
        if (f.k !== 'dmg') continue;
        v += ((f.m || 0) + (f.plusDef || 0) * 0.5 + (f.hpM || 0) * 0.5) * (f.hits || 1) + (f.adj || 0) * Math.min(2, Math.max(0, n - 1));
      }
      return ab.target === 'all' ? v * n : v;
    },

    fusionWorth(f, n) {
      const H = this.game();
      return this.hitValue(f, n) >= f.members.reduce((a, m) => a + this.hitValue(H.CHARS[m].ult, n), 0);
    },

    renderFusions() {
      const H = this.game(), K = this.hsrData();
      const rows = Object.entries(H.FUSIONS).sort((a, b) => a[1].members.length - b[1].members.length).map(([fid, f]) => {
        const teams = K.TEAMS.filter(t => f.members.every(m => t.members.includes(m)));
        const yes = n => this.fusionWorth(f, n) ? 'да' : 'нет';
        return `<tr><td><b>«${this.esc(f.name)}»</b></td><td>${f.members.map(m => this.charChip(m)).join('')}</td><td>${this.esc(f.text)}</td><td class="kv-small">${yes(1)}</td><td class="kv-small">${yes(5)}</td><td class="kv-small">${teams.map(t => this.link('/hsr98/team?id=' + t.id, '«' + this.esc(t.name) + '»')).join(', ') || '&nbsp;'}</td></tr>`;
      }).join('');
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Слияния</p>
        <h1 class="kv-h1">Слияния</h1>
        <p>Все ${Object.keys(H.FUSIONS).length} Слияний. Слияние доступно, когда в отряде есть все участники и у каждого полная энергия. Энергия обнуляется у всех, ход не тратится. Ждать Слияния стоит, только если его урон не меньше суммы абсолютных техник участников. Так играет и наш стенд. Колонки «Один враг» и «Пять врагов» показывают, выгоднее ли Слияние против босса и против полной волны. Щиты, лечение и заморозку они не учитывают.</p>
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Слияние</th><th>Участники</th><th>Что делает</th><th>Один враг</th><th>Пять врагов</th><th>В судовой роли</th></tr>${rows}</table>`;
    },

    renderBannerPage() {
      return `
        <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Баннеры</p>
        <h1 class="kv-h1">Баннеры</h1>
        <p>Все баннеры игры, их валюта, гарант и шанс избранной пятёрки. Советы, что крутить, в статье ${this.link('/hsr98/guide?id=pulls', '«Кого крутить и за какую валюту»')}.</p>
        ${this.tableBanners()}`;
    },

    renderAbout() {
      const d = this.data(), R = this.bench(), K = this.hsrData();
      const C = R ? R.conditions : null;
      const stands = C ? `
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3">
          <tr><th>Стенд</th><th>Бои</th><th>Условия</th></tr>
          <tr><td>Зал</td><td>этапы ${C.hall.stages.join(', ')}</td><td>турбулентность и HP врагов этапа, проигрыш этапа = ${C.hall.failCycles} циклов</td></tr>
          <tr><td>Боссы</td><td>${C.boss.encs.length} сюжетных боссов</td><td>HP ×${C.boss.hp}, атака ×${C.boss.atk}</td></tr>
          <tr><td>Выживание</td><td>те же боссы</td><td>отряд без лекаря, HP ×${C.survive.hp}, атака ×${C.survive.atk}</td></tr>
          <tr><td>Вселенная</td><td>Мир ${C.su.world} целиком</td><td>HP и атака ×${this.num(C.su.hp)}, ${C.su.seeds} забегов</td></tr>
          <tr><td>Начало игры</td><td>${C.start.encs.length} ранних боссов</td><td>реликвии по уровню, конусы 3 звёзд</td></tr>
        </table>` : '';
      return `
        <p class="kv-crumbs">${this.link('', 'Причал')} &gt; О сайте</p>
        <h1 class="kv-h1">О сайте</h1>
        <p>«${this.esc(d.title)}» открыт ${d.opened}. Мы не верим тир-листам на глаз, поэтому гоняем персонажей через одни и те же бои настоящим движком игры и считаем циклы.</p>
        <h2 class="kv-h2" id="method">Как мы считаем</h2>
        <p>Персонажи стоят на уровне врагов, реликвии +${C ? C.relic : 9}, у каждого сборка из его личного дела. Каждый бой прогоняется ${C ? C.seeds : 12} раз. Бойцу «Урона» стенд сам подбирает лучший отряд из «Усиления» и «Выживания», отдельно для каждого режима. Для остальных колонок считается, насколько быстрее с персонажем проходят бои три опорных отряда. Тир показывает долю от лидера колонки.</p>
        ${stands}
        <p>Бот стенда играет проще человека: абсолютные техники включает сразу, а Слияния ждёт, только если они выгоднее техник. Где бот заметно уступает человеку, мы пишем об этом и можем сдвинуть персонажа на шаг. Таких поправок сейчас ${K.ADJUST.length}.</p>
        <h2 class="kv-h2">Экипаж</h2>
        <ul class="kv-list">${d.crew.map(c => `<li><b>${this.esc(c.nick)}</b>: ${this.esc(c.job)}</li>`).join('')}</ul>
        <h2 class="kv-h2">История</h2>
        <table class="kv-log" width="100%" cellspacing="0" cellpadding="4">${d.log.map(e => `<tr><td class="kv-log-date">${e.date}</td><td>${this.esc(e.text)}</td></tr>`).join('')}</table>`;
    }
  });
})();
