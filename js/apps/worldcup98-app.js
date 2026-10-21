(function (globalScope) {
    const Core = globalScope.WorldCup98 || (typeof require !== 'undefined' ? require('./worldcup98-core.js') : null);
    const SAVE_KEY = 'wc98_tournament_save_v1';

    class WorldCup98Audio {
        constructor() {
            this.ctx = null;
            this.muted = false;
        }

        ensureContext() {
            if (this.muted) return null;
            if (!this.ctx) {
                const AudioCtx = globalScope.AudioContext || globalScope.webkitAudioContext;
                if (AudioCtx) {
                    try {
                        this.ctx = new AudioCtx();
                    } catch (_) {
                        this.ctx = null;
                    }
                }
            }
            if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
                this.ctx.resume().catch(() => {});
            }
            return this.ctx;
        }

        playTone(freq, duration = 0.12, type = 'triangle', gainVal = 0.08, slideFreq = null) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                if (slideFreq) {
                    osc.frequency.exponentialRampToValueAtTime(slideFreq, ctx.currentTime + duration);
                }
                gain.gain.setValueAtTime(gainVal, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (_) {}
        }

        playKick(power = 0.6) {
            this.playTone(135 + power * 45, 0.09, 'sine', 0.12, 48);
        }

        playWhistle(long = false) {
            this.playTone(2850, long ? 0.36 : 0.16, 'sine', 0.07, 2980);
        }

        playPost() {
            this.playTone(820, 0.22, 'square', 0.09, 410);
        }

        playGoalRoar() {
            const notes = [261.6, 329.6, 392.0, 523.2];
            notes.forEach((n, idx) => {
                setTimeout(() => this.playTone(n, 0.25, 'sawtooth', 0.06), idx * 90);
            });
        }
    }

    class WorldCup98App {
        constructor(container, options = {}) {
            this.container = container;
            this.options = options;
            this.audio = new WorldCup98Audio();
            this.screen = 'menu';

            this.setupConfig = {
                homeTeam: 'RUS',
                awayTeam: 'FRA',
                homeFormation: '3-5-2',
                awayFormation: '4-3-3',
                stadium: 'stade_de_france',
                weather: 'night',
                halfDuration: 60
            };

            this.activeGroupTab = 'A';
            this.tournament = this.loadTournament();
            this.activeScenario = null;
            this.matchContext = 'friendly';
            this.match = null;
            this.standaloneShootout = null;
            this.penSelection = { zoneX: -1, zoneY: 1, power: 0.78, diveX: 0, diveY: 0 };

            this.keys = {};
            this.rafId = null;
            this.lastFrameTs = 0;
            this.rainDrops = Array.from({ length: 55 }, (_, i) => ({
                x: (i * 73) % 800,
                y: (i * 47) % 450
            }));

            this.boundKeyDown = (e) => this.handleKeyDown(e);
            this.boundKeyUp = (e) => this.handleKeyUp(e);
            this.init();
        }

        init() {
            if (!this.container) return;
            this.container.innerHTML = '';
            this.root = document.createElement('div');
            this.root.className = 'wc98-root';
            this.container.appendChild(this.root);

            globalScope.addEventListener('keydown', this.boundKeyDown);
            globalScope.addEventListener('keyup', this.boundKeyUp);

            this.render();
        }

        destroy() {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            globalScope.removeEventListener('keydown', this.boundKeyDown);
            globalScope.removeEventListener('keyup', this.boundKeyUp);
        }

        loadTournament() {
            try {
                const raw = globalScope.localStorage && globalScope.localStorage.getItem(SAVE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const t = new Core.Tournament({ playerTeam: parsed.playerTeamId || 'RUS' });
                    t.stage = parsed.stage || 'group';
                    t.matchday = parsed.matchday || 0;
                    t.groups = parsed.groups || t.groups;
                    t.standings = parsed.standings || t.standings;
                    t.fixtures = parsed.fixtures || t.fixtures;
                    t.knockout = parsed.knockout || t.knockout;
                    return t;
                }
            } catch (_) {}
            return null;
        }

        saveTournament() {
            if (!this.tournament || !globalScope.localStorage) return;
            try {
                globalScope.localStorage.setItem(SAVE_KEY, JSON.stringify({
                    playerTeamId: this.tournament.playerTeamId,
                    stage: this.tournament.stage,
                    matchday: this.tournament.matchday,
                    groups: this.tournament.groups,
                    standings: this.tournament.standings,
                    fixtures: this.tournament.fixtures,
                    knockout: this.tournament.knockout
                }));
            } catch (_) {}
        }

        render() {
            if (!this.root) return;
            if (this.screen !== 'match' && this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }

            const topbarHtml = `
                <div class="wc98-topbar">
                    <div class="wc98-brand">
                        <div class="wc98-crest">98</div>
                        <div class="wc98-brand-titles">
                            <span class="wc98-brand-kicker">EA SPORTS • FRANCE 98</span>
                            <span class="wc98-brand-main">WORLD CUP 98</span>
                        </div>
                    </div>
                    <div class="wc98-topbar-actions">
                        ${this.screen !== 'menu' ? `<button class="wc98-btn" data-action="nav-menu">Главное меню</button>` : ''}
                        <button class="wc98-btn" data-action="toggle-mute">${this.audio.muted ? 'Звук: ВЫКЛ' : 'Звук: ВКЛ'}</button>
                    </div>
                </div>
            `;

            let bodyHtml = '';
            if (this.screen === 'menu') {
                bodyHtml = this.renderMenuScreen();
            } else if (this.screen === 'friendly_setup') {
                bodyHtml = this.renderFriendlySetupScreen();
            } else if (this.screen === 'tournament') {
                bodyHtml = this.renderTournamentScreen();
            } else if (this.screen === 'classics') {
                bodyHtml = this.renderClassicsScreen();
            } else if (this.screen === 'shootout_standalone') {
                bodyHtml = this.renderStandaloneShootoutScreen();
            } else if (this.screen === 'match') {
                bodyHtml = this.renderMatchScreen();
            }

            this.root.innerHTML = topbarHtml + bodyHtml;
            this.bindEvents();

            if (this.screen === 'match') {
                this.startMatchLoop();
            }
        }

        renderMenuScreen() {
            const hasSavedTourney = Boolean(this.tournament);
            return `
                <div class="wc98-screen">
                    <div class="wc98-menu-hero">
                        <div class="wc98-hero-copy">
                            <span class="wc98-hero-tag">ОФИЦИАЛЬНАЯ ЛИЦЕНЗИЯ КУБКА МИРА FIFA 1998</span>
                            <h2 class="wc98-hero-title">КУБОК МИРА ВО ФРАНЦИИ: ОТ «ВЕЛОДРОМА» ДО «СТАД ДЕ ФРАНС»</h2>
                            <p class="wc98-hero-desc">
                                Тактические построения (4-4-2, 4-3-3, 3-5-2, 5-3-2 Катеначчо), трёхмерная баллистика мяча с подкруткой и ударами с лёта, погодные условия, правило «Золотого гола» в овертайме и послематчевые серии пенальти.
                            </p>
                            <div style="display:flex; gap:8px; margin-top:4px;">
                                <button class="wc98-btn wc98-btn-gold" data-action="quick-kickoff">Быстрый матч: Россия — Франция</button>
                                <button class="wc98-btn" data-action="open-tournament">${hasSavedTourney ? 'Продолжить ЧМ-98' : 'Начать ЧМ-98'}</button>
                            </div>
                        </div>
                        <div class="wc98-hero-quick">
                            <div style="font-size:11px; font-weight:800; color:#fde047;">СВОДКА FRANCE '98</div>
                            <div style="font-size:11px; color:#e2e8f0;">• 16 национальных сборных с составами 1998 года</div>
                            <div style="font-size:11px; color:#e2e8f0;">• 4 арены: Сен-Дени, Париж, Марсель, Лион</div>
                            <div style="font-size:11px; color:#e2e8f0;">• 5 исторических сценариев ЧМ</div>
                            <div style="font-size:11px; color:#93c5fd;">Рекомендация «Игромании»: Хит сезона '98!</div>
                        </div>
                    </div>

                    <div class="wc98-mode-strip">
                        <div class="wc98-mode-tile" data-action="open-tournament">
                            <div>
                                <div class="wc98-mode-kicker">ГЛАВНЫЙ ТУРНИР</div>
                                <div class="wc98-mode-name">Чемпионат мира '98</div>
                            </div>
                            <div class="wc98-mode-sub">Групповой этап (A–D), плей-офф на выбывание, «Золотой гол» и финал в Сен-Дени.</div>
                            <button class="wc98-btn wc98-btn-gold">В турнир</button>
                        </div>

                        <div class="wc98-mode-tile" data-action="open-friendly">
                            <div>
                                <div class="wc98-mode-kicker">ТАКТИЧЕСКАЯ ДОСКА</div>
                                <div class="wc98-mode-name">Товарищеский матч</div>
                            </div>
                            <div class="wc98-mode-sub">Выбор любых сборных, расстановки на макете поля, арены и погоды (солнце, ночь, ливень).</div>
                            <button class="wc98-btn">Настроить матч</button>
                        </div>

                        <div class="wc98-mode-tile" data-action="open-classics">
                            <div>
                                <div class="wc98-mode-kicker">АРХИВ ТЕЛЕТРАНСЛЯЦИЙ</div>
                                <div class="wc98-mode-name">Классические матчи</div>
                            </div>
                            <div class="wc98-mode-sub">5 драматичных развязок: переверните ход финала ЧМ-98 или победите за сборную России!</div>
                            <button class="wc98-btn">Выбрать сценарий</button>
                        </div>

                        <div class="wc98-mode-tile" data-action="open-shootout">
                            <div>
                                <div class="wc98-mode-kicker">ДУЭЛЬ НЕРВОВ</div>
                                <div class="wc98-mode-name">Серия пенальти</div>
                            </div>
                            <div class="wc98-mode-sub">Поочерёдные 11-метровые удары: выбирайте угол и силу удара или прыгайте вратарём!</div>
                            <button class="wc98-btn">На точку</button>
                        </div>
                    </div>

                    <div class="wc98-controls-banner">
                        <div><span class="wc98-key-pill">Стрелки / WASD</span> Движение и прицел</div>
                        <div><span class="wc98-key-pill">Shift</span> Спринт (рывок)</div>
                        <div><span class="wc98-key-pill">X / J</span> Пас низом / Смена игрока</div>
                        <div><span class="wc98-key-pill">C / K</span> Навес в штрафную / Подкат</div>
                        <div><span class="wc98-key-pill">Пробел / Z</span> Удар (удерж. силу) / Отбор</div>
                        <div><span class="wc98-key-pill">E / V</span> Финт</div>
                        <div><span class="wc98-key-pill">1 / 2 / 3</span> Тактика на лету</div>
                    </div>
                </div>
            `;
        }

        renderFriendlySetupScreen() {
            const hTeam = Core.TEAMS[this.setupConfig.homeTeam] || Core.TEAMS.RUS;
            const aTeam = Core.TEAMS[this.setupConfig.awayTeam] || Core.TEAMS.FRA;
            const hForm = Core.FORMATIONS[this.setupConfig.homeFormation] || Core.FORMATIONS['4-4-2'];
            const aForm = Core.FORMATIONS[this.setupConfig.awayFormation] || Core.FORMATIONS['4-4-2'];
            const tacBonus = Core.getTacticalBonus(hForm.id, aForm.id, 'balanced');

            const teamOptionsHtml = (selectedId) => Object.values(Core.TEAMS).map(t =>
                `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${t.name} (${t.code})</option>`
            ).join('');

            const formationOptionsHtml = (selectedId) => Object.values(Core.FORMATIONS).map(f =>
                `<option value="${f.id}" ${f.id === selectedId ? 'selected' : ''}>${f.name}</option>`
            ).join('');

            const renderStatBar = (label, val) => `
                <div class="wc98-stat-row">
                    <span class="wc98-stat-label">${label}</span>
                    <div class="wc98-stat-track"><div class="wc98-stat-fill" style="width:${val}%"></div></div>
                    <span style="width:24px; text-align:right; font-weight:800;">${val}</span>
                </div>
            `;

            const chalkNodesHtml = hForm.slots.map((slot, idx) => {
                const player = hTeam.roster[idx] || hTeam.roster[0];
                const leftPct = 50 + slot.x * 42;
                const topPct = 50 + slot.y * 38;
                return `
                    <div class="wc98-chalk-node" style="left:${leftPct}%; top:${topPct}%; background:${slot.role === 'GK' ? hTeam.gkColor : hTeam.primary}; color:${hTeam.secondary === '#ffffff' ? '#ffffff' : '#09152e'};">
                        ${player.number}
                        <span class="wc98-chalk-label">${player.name}</span>
                    </div>
                `;
            }).join('');

            const matchupNote = tacBonus.formationEdge > 1
                ? `Тактическое преимущество: ${hForm.id} переигрывает ${aForm.id} (+9% к перехватам и ударам)`
                : (tacBonus.formationEdge < 1
                    ? `Внимание: схема соперника ${aForm.id} неудобна для ${hForm.id}`
                    : `Равный тактический баланс схем (${hForm.id} против ${aForm.id})`);

            return `
                <div class="wc98-screen">
                    <div class="wc98-desk-layout">
                        <div class="wc98-team-pane">
                            <div class="wc98-team-header">
                                <span class="wc98-flag-badge">
                                    <span class="wc98-kit-swatch" style="background:${hTeam.primary}; border-color:${hTeam.secondary};"></span>
                                    ВАША СБОРНАЯ (1P)
                                </span>
                                <select class="wc98-select" data-config="homeTeam">${teamOptionsHtml(hTeam.id)}</select>
                            </div>
                            ${renderStatBar('АТАКА', hTeam.ratings.att)}
                            ${renderStatBar('ЦЕНТР', hTeam.ratings.mid)}
                            ${renderStatBar('ОБОРОНА', hTeam.ratings.def)}
                            ${renderStatBar('СКОРОСТЬ', hTeam.ratings.spd)}
                            ${renderStatBar('ВРАТАРЬ', hTeam.ratings.gk)}

                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                                <span style="font-size:11px; font-weight:800; color:#fde047;">СХЕМА (ФОРМАЦИЯ):</span>
                                <select class="wc98-select" data-config="homeFormation">${formationOptionsHtml(hForm.id)}</select>
                            </div>
                            <div style="font-size:11px; color:#cbd5e1;">${hForm.shortDesc}</div>

                            <div class="wc98-chalkboard">
                                ${chalkNodesHtml}
                            </div>
                        </div>

                        <div class="wc98-team-pane" style="justify-content:space-between;">
                            <div style="display:flex; flex-direction:column; gap:10px;">
                                <div style="font-size:12px; font-weight:900; color:#fde047; text-align:center; border-bottom:1px solid #1e3a8a; padding-bottom:6px;">
                                    ПАРАМЕТРЫ МАТЧА
                                </div>
                                <label style="font-size:11px; color:#94a3b8; font-weight:700;">СТАДИОН ЧМ-98:</label>
                                <select class="wc98-select" data-config="stadium">
                                    ${Object.values(Core.STADIUMS).map(s => `<option value="${s.id}" ${s.id === this.setupConfig.stadium ? 'selected' : ''}>${s.name}</option>`).join('')}
                                </select>

                                <label style="font-size:11px; color:#94a3b8; font-weight:700;">ПОГОДА И ГАЗОН:</label>
                                <select class="wc98-select" data-config="weather">
                                    ${Object.values(Core.WEATHER_TYPES).map(w => `<option value="${w.id}" ${w.id === this.setupConfig.weather ? 'selected' : ''}>${w.name}</option>`).join('')}
                                </select>

                                <div style="background:rgba(29,78,216,0.22); border:1px solid #3b82f6; padding:8px; font-size:11px; color:#e2e8f0; line-height:1.4;">
                                    <div style="font-weight:800; color:#fde047; margin-bottom:4px;">ТАКТИЧЕСКАЯ СВОДКА:</div>
                                    ${matchupNote}
                                </div>
                            </div>

                            <button class="wc98-btn wc98-btn-gold" style="padding:10px; font-size:13px;" data-action="start-friendly-match">
                                ВЫЙТИ НА ПОЛЕ ▶
                            </button>
                        </div>

                        <div class="wc98-team-pane">
                            <div class="wc98-team-header">
                                <span class="wc98-flag-badge">
                                    <span class="wc98-kit-swatch" style="background:${aTeam.primary}; border-color:${aTeam.secondary};"></span>
                                    СОПЕРНИК (ИИ)
                                </span>
                                <select class="wc98-select" data-config="awayTeam">${teamOptionsHtml(aTeam.id)}</select>
                            </div>
                            ${renderStatBar('АТАКА', aTeam.ratings.att)}
                            ${renderStatBar('ЦЕНТР', aTeam.ratings.mid)}
                            ${renderStatBar('ОБОРОНА', aTeam.ratings.def)}
                            ${renderStatBar('СКОРОСТЬ', aTeam.ratings.spd)}
                            ${renderStatBar('ВРАТАРЬ', aTeam.ratings.gk)}

                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                                <span style="font-size:11px; font-weight:800; color:#fde047;">СХЕМА СОПЕРНИКА:</span>
                                <select class="wc98-select" data-config="awayFormation">${formationOptionsHtml(aForm.id)}</select>
                            </div>

                            <div style="font-size:11px; font-weight:800; color:#93c5fd; margin-top:4px;">СТАРТОВЫЙ СОСТАВ (${aTeam.name}):</div>
                            <div class="wc98-roster-mini">
                                ${aTeam.roster.map(r => `
                                    <div class="wc98-roster-line">
                                        <span>#${r.number} <strong>${r.name}</strong> (${r.role})</span>
                                        <span>УДР ${r.sho} • СКР ${r.spd}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderTournamentScreen() {
            if (!this.tournament) {
                this.tournament = new Core.Tournament({ playerTeam: this.setupConfig.homeTeam || 'RUS' });
                this.activeGroupTab = this.tournament.getPlayerGroup();
                this.saveTournament();
            }

            const t = this.tournament;
            const playerTeam = Core.TEAMS[t.playerTeamId] || Core.TEAMS.RUS;
            const nextFixture = t.getNextPlayerFixture();
            const groupRows = t.standings[this.activeGroupTab] || t.standings.A;

            const stageLabels = {
                group: `ГРУППОВОЙ ЭТАП (ТУР ${Math.min(3, t.matchday + 1)} ИЗ 3)`,
                quarter: '1/4 ФИНАЛА КУБКА МИРА',
                semi: '1/2 ФИНАЛА КУБКА МИРА',
                final: 'ФИНАЛ ЧМ-98 НА «СТАД ДЕ ФРАНС»',
                completed: 'ТУРНИР ЗАВЕРШЁН!'
            };

            let rightPaneHtml = '';
            if (t.stage === 'completed') {
                const champ = Core.TEAMS[t.knockout.champion] || playerTeam;
                rightPaneHtml = `
                    <div class="wc98-team-pane" style="align-items:center; justify-content:center; text-align:center;">
                        <div style="font-size:36px;">🏆</div>
                        <div style="font-size:18px; font-weight:900; color:#fde047;">ЧЕМПИОН МИРА 1998 — ${champ.name.toUpperCase()}!</div>
                        <p style="font-size:12px; color:#cbd5e1;">Золотой Кубок мира поднимается над «Стад де Франс» под овации 80 000 зрителей!</p>
                        <button class="wc98-btn wc98-btn-gold" data-action="reset-tournament">Начать новый Чемпионат мира</button>
                    </div>
                `;
            } else if (nextFixture) {
                const oppId = nextFixture.home === t.playerTeamId ? nextFixture.away : nextFixture.home;
                const opp = Core.TEAMS[oppId] || Core.TEAMS.FRA;
                rightPaneHtml = `
                    <div class="wc98-team-pane" style="justify-content:space-between;">
                        <div>
                            <div style="font-size:11px; font-weight:800; color:#fde047;">СЛЕДУЮЩИЙ МАТЧ СБОРНОЙ:</div>
                            <div style="font-size:19px; font-weight:900; margin:8px 0;">
                                ${Core.TEAMS[nextFixture.home].name} — ${Core.TEAMS[nextFixture.away].name}
                            </div>
                            <div style="font-size:11px; color:#93c5fd; margin-bottom:8px;">
                                Схема соперника (${opp.name}): ${opp.formation} • Лидер: ${opp.roster[6].name} (#${opp.roster[6].number})
                            </div>
                            <div class="wc98-roster-mini">
                                ${opp.roster.map(r => `
                                    <div class="wc98-roster-line">
                                        <span>#${r.number} ${r.name} (${r.role})</span>
                                        <span>Рейтинг ${Math.round((r.spd + r.sho + r.pas) / 3)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <button class="wc98-btn wc98-btn-gold" style="padding:10px; font-size:13px;" data-action="play-tournament-match">
                            ИГРАТЬ МАТЧ ТУРНИРА ▶
                        </button>
                    </div>
                `;
            } else {
                rightPaneHtml = `
                    <div class="wc98-team-pane" style="justify-content:center; align-items:center; text-align:center;">
                        <div style="font-size:15px; font-weight:800; color:#fca5a5;">Ваша сборная завершила выступление на турнире.</div>
                        <button class="wc98-btn wc98-btn-gold" data-action="reset-tournament">Начать новый Чемпионат мира</button>
                    </div>
                `;
            }

            const knockoutHtml = (t.stage !== 'group') ? `
                <div style="margin-top:8px; background:rgba(5,11,24,0.7); padding:8px; border:1px solid #334155;">
                    <div style="font-size:11px; font-weight:800; color:#fde047; margin-bottom:4px;">СЕТКА ПЛЕЙ-ОФФ ЧМ-98:</div>
                    ${t.knockout.quarterFinals.map(m => `<div style="font-size:11px;">1/4: ${Core.TEAMS[m.home].name} ${m.played ? `${m.homeGoals}:${m.awayGoals}` : 'vs'} ${Core.TEAMS[m.away].name}</div>`).join('')}
                    ${t.knockout.semiFinals.map(m => `<div style="font-size:11px; color:#93c5fd;">1/2: ${Core.TEAMS[m.home].name} ${m.played ? `${m.homeGoals}:${m.awayGoals}` : 'vs'} ${Core.TEAMS[m.away].name}</div>`).join('')}
                    ${t.knockout.finalMatch ? `<div style="font-size:12px; font-weight:900; color:#fde047;">ФИНАЛ: ${Core.TEAMS[t.knockout.finalMatch.home].name} ${t.knockout.finalMatch.played ? `${t.knockout.finalMatch.homeGoals}:${t.knockout.finalMatch.awayGoals}` : 'vs'} ${Core.TEAMS[t.knockout.finalMatch.away].name}</div>` : ''}
                </div>
            ` : '';

            return `
                <div class="wc98-screen">
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.9); border:1px solid #3b82f6; padding:8px 12px;">
                        <div>
                            <span style="font-size:11px; color:#fde047; font-weight:800;">СТАДИЯ: ${stageLabels[t.stage]}</span>
                            <span style="margin-left:12px; font-size:12px; font-weight:900;">Ваша сборная: ${playerTeam.name}</span>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <span style="font-size:11px; color:#94a3b8;">Сменить сборную (новый ЧМ):</span>
                            <select class="wc98-select" data-action="change-tourney-team">
                                ${Object.values(Core.TEAMS).map(tm => `<option value="${tm.id}" ${tm.id === t.playerTeamId ? 'selected' : ''}>${tm.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="wc98-tourney-grid">
                        <div class="wc98-team-pane">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:12px; font-weight:900; color:#fde047;">ТУРНИРНЫЕ ТАБЛИЦЫ ГРУПП</span>
                                <div style="display:flex; gap:4px;">
                                    ${['A', 'B', 'C', 'D'].map(g => `
                                        <button class="wc98-btn ${this.activeGroupTab === g ? 'wc98-btn-gold' : ''}" data-group-tab="${g}">Гр. ${g}</button>
                                    `).join('')}
                                </div>
                            </div>

                            <table class="wc98-table">
                                <thead>
                                    <tr>
                                        <th>Сборная</th>
                                        <th>И</th>
                                        <th>В</th>
                                        <th>Н</th>
                                        <th>П</th>
                                        <th>Мячи</th>
                                        <th>Очки</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groupRows.map((row, idx) => `
                                        <tr class="${row.teamId === t.playerTeamId ? 'wc98-row-player' : ''}">
                                            <td>${idx + 1}. ${row.name}</td>
                                            <td>${row.P}</td>
                                            <td>${row.W}</td>
                                            <td>${row.D}</td>
                                            <td>${row.L}</td>
                                            <td>${row.GF}-${row.GA}</td>
                                            <td><strong>${row.Pts}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>

                            ${knockoutHtml}
                        </div>

                        ${rightPaneHtml}
                    </div>
                </div>
            `;
        }

        renderClassicsScreen() {
            return `
                <div class="wc98-screen">
                    <div style="font-size:14px; font-weight:900; color:#fde047;">
                        ИСТОРИЧЕСКИЕ СЦЕНАРИИ КУБКА МИРА (WORLD CUP CLASSICS)
                    </div>
                    <div class="wc98-classics-list">
                        ${Core.CLASSIC_SCENARIOS.map(sc => `
                            <div class="wc98-classic-card">
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:10px; color:#fde047; font-weight:800;">
                                        <span>${sc.year}</span>
                                        <span>Старт с ${sc.startMinute}' минуты</span>
                                    </div>
                                    <div style="font-size:15px; font-weight:900; margin:4px 0; color:#ffffff;">${sc.title}</div>
                                    <div style="font-size:11px; font-weight:800; color:#93c5fd; margin-bottom:6px;">${sc.subtitle}</div>
                                    <div style="font-size:11px; color:#cbd5e1; line-height:1.4;">${sc.description}</div>
                                </div>
                                <button class="wc98-btn wc98-btn-gold" data-scenario-id="${sc.id}">Вступить в игру с ${sc.startMinute}' мин ▶</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderStandaloneShootoutScreen() {
            if (!this.standaloneShootout) {
                this.standaloneShootout = new Core.PenaltyShootout({
                    homeTeam: this.setupConfig.homeTeam || 'RUS',
                    awayTeam: this.setupConfig.awayTeam || 'FRA'
                });
            }
            return `
                <div class="wc98-screen">
                    ${this.renderShootoutWidget(this.standaloneShootout, true)}
                </div>
            `;
        }

        renderShootoutWidget(shootoutObj, isStandalone = false) {
            const isPlayerKicking = shootoutObj.turn === 'home';
            const renderDots = (hist) => {
                const slots = [];
                for (let i = 0; i < Math.max(5, hist.length); i++) {
                    const st = hist[i] || '';
                    slots.push(`<div class="wc98-pen-dot ${st}"></div>`);
                }
                return `<div class="wc98-pen-dots">${slots.join('')}</div>`;
            };

            const zones = [
                { label: 'Верхний левый', zx: -1, zy: 1 },
                { label: 'Под перекладину', zx: 0, zy: 1 },
                { label: 'Верхний правый', zx: 1, zy: 1 },
                { label: 'Нижний левый', zx: -1, zy: 0 },
                { label: 'По центру низом', zx: 0, zy: 0 },
                { label: 'Нижний правый', zx: 1, zy: 0 }
            ];

            return `
                <div class="wc98-team-pane" style="max-width:680px; margin:0 auto; width:100%;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #3b82f6; padding-bottom:8px;">
                        <div>
                            <div style="font-size:10px; color:#fde047; font-weight:800;">СЕРИЯ 11-МЕТРОВЫХ УДАРОВ • РАУНД ${shootoutObj.round}</div>
                            <div style="font-size:18px; font-weight:900;">
                                ${shootoutObj.homeTeam.name} ${shootoutObj.homeScore} : ${shootoutObj.awayScore} ${shootoutObj.awayTeam.name}
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                            <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
                                <span>${shootoutObj.homeTeam.code}</span> ${renderDots(shootoutObj.homeHistory)}
                            </div>
                            <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
                                <span>${shootoutObj.awayTeam.code}</span> ${renderDots(shootoutObj.awayHistory)}
                            </div>
                        </div>
                    </div>

                    <div style="font-size:12px; font-weight:800; color:#93c5fd; text-align:center;">
                        ${shootoutObj.finished
                            ? `Серия завершена! Победитель: ${shootoutObj.winner === 'home' ? shootoutObj.homeTeam.name : shootoutObj.awayTeam.name}!`
                            : (isPlayerKicking
                                ? `ВАШ УДАР (${shootoutObj.homeTeam.name}): выберите сектор ворот и нажмите «ПРОБИТЬ ПЕНАЛЬТИ»`
                                : `УДАР СОПЕРНИКА (${shootoutObj.awayTeam.name}): выберите сектор прыжка вашего вратаря!`)}
                    </div>

                    <div class="wc98-pen-grid">
                        ${zones.map(z => {
                            const selected = isPlayerKicking
                                ? (this.penSelection.zoneX === z.zx && this.penSelection.zoneY === z.zy)
                                : (this.penSelection.diveX === z.zx && this.penSelection.diveY === z.zy);
                            return `
                                <div class="wc98-pen-cell ${selected ? 'selected' : ''}" data-pen-zx="${z.zx}" data-pen-zy="${z.zy}">
                                    ${z.label}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    ${shootoutObj.lastResult ? `
                        <div style="background:rgba(250,204,21,0.15); border:1px solid #facc15; padding:6px 10px; font-size:12px; font-weight:800; color:#fde047; text-align:center;">
                            ${shootoutObj.lastResult.description}
                        </div>
                    ` : ''}

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        ${!shootoutObj.finished ? `
                            <button class="wc98-btn wc98-btn-gold" data-action="execute-penalty-step">
                                ${isPlayerKicking ? 'ПРОБИТЬ ПЕНАЛЬТИ ▶' : 'ПРЫГНУТЬ ВРАТАРЁМ ▶'}
                            </button>
                        ` : `
                            <button class="wc98-btn wc98-btn-gold" data-action="${isStandalone ? 'restart-standalone-shootout' : 'finish-match-after-shootout'}">
                                ${isStandalone ? 'Новая серия пенальти' : 'Завершить матч'}
                            </button>
                        `}
                    </div>
                </div>
            `;
        }

        renderMatchScreen() {
            const m = this.match;
            if (!m) return '';
            const periodLabel = m.half === 1 ? '1 ТАЙМ' : (m.half === 2 ? '2 ТАЙМ' : 'ЗОЛОТОЙ ГОЛ');
            const activePlayer = m.controlledPlayer || m.players[0];

            let overlayHtml = '';
            if (m.state === 'halftime') {
                overlayHtml = `
                    <div class="wc98-modal-overlay">
                        <div class="wc98-modal-card">
                            <div style="font-size:16px; font-weight:900; color:#fde047;">ПЕРЕРЫВ • СВОДКА ПЕРВОГО ТАЙМА</div>
                            <div style="font-size:22px; font-weight:900; text-align:center;">
                                ${m.homeTeam.name} ${m.score.home} : ${m.score.away} ${m.awayTeam.name}
                            </div>
                            <div class="wc98-roster-mini">
                                <div class="wc98-roster-line"><span>Удары (в створ)</span><span>${m.stats.home.shots} (${m.stats.home.onTarget}) — ${m.stats.away.shots} (${m.stats.away.onTarget})</span></div>
                                <div class="wc98-roster-line"><span>Передачи</span><span>${m.stats.home.passes} — ${m.stats.away.passes}</span></div>
                                <div class="wc98-roster-line"><span>Отборы / Фолы</span><span>${m.stats.home.tackles}/${m.stats.home.fouls} — ${m.stats.away.tackles}/${m.stats.away.fouls}</span></div>
                                <div class="wc98-roster-line"><span>Угловые</span><span>${m.stats.home.corners} — ${m.stats.away.corners}</span></div>
                            </div>
                            <button class="wc98-btn wc98-btn-gold" data-action="resume-second-half">Начать 2-й тайм ▶</button>
                        </div>
                    </div>
                `;
            } else if (m.state === 'shootout' && m.shootout) {
                overlayHtml = `
                    <div class="wc98-modal-overlay">
                        ${this.renderShootoutWidget(m.shootout, false)}
                    </div>
                `;
            } else if (m.state === 'finished') {
                overlayHtml = `
                    <div class="wc98-modal-overlay">
                        <div class="wc98-modal-card">
                            <div style="font-size:16px; font-weight:900; color:#fde047;">ФИНАЛЬНЫЙ СВИСТОК • ИТОГ МАТЧА</div>
                            <div style="font-size:24px; font-weight:900; text-align:center;">
                                ${m.homeTeam.name} ${m.score.home} : ${m.score.away} ${m.awayTeam.name}
                            </div>
                            ${m.shootout ? `<div style="text-align:center; color:#fde047; font-size:12px;">Пенальти: ${m.shootout.homeScore} : ${m.shootout.awayScore}</div>` : ''}
                            <div class="wc98-roster-mini">
                                <div class="wc98-roster-line"><span>Удары (в створ)</span><span>${m.stats.home.shots} (${m.stats.home.onTarget}) — ${m.stats.away.shots} (${m.stats.away.onTarget})</span></div>
                                <div class="wc98-roster-line"><span>Точные передачи</span><span>${m.stats.home.passes} — ${m.stats.away.passes}</span></div>
                                <div class="wc98-roster-line"><span>Отборы</span><span>${m.stats.home.tackles} — ${m.stats.away.tackles}</span></div>
                                <div class="wc98-roster-line"><span>Карточки (ЖК/КК)</span><span>${m.stats.home.yellowCards}/${m.stats.home.redCards} — ${m.stats.away.yellowCards}/${m.stats.away.redCards}</span></div>
                            </div>
                            <button class="wc98-btn wc98-btn-gold" data-action="complete-match-flow">Продолжить ▶</button>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="wc98-match-stage">
                    <div class="wc98-canvas-wrap">
                        <canvas class="wc98-canvas" width="840" height="460"></canvas>

                        <div class="wc98-scorebug">
                            <div class="wc98-bug-comp">FRANCE 98</div>
                            <div class="wc98-bug-team">
                                <span class="wc98-kit-swatch" style="width:10px;height:10px;background:${m.homeTeam.primary};"></span>
                                <span id="wc98-hud-home-code">${m.homeTeam.code}</span>
                            </div>
                            <div class="wc98-bug-score" id="wc98-hud-score">${m.score.home} - ${m.score.away}</div>
                            <div class="wc98-bug-team">
                                <span id="wc98-hud-away-code">${m.awayTeam.code}</span>
                                <span class="wc98-kit-swatch" style="width:10px;height:10px;background:${m.awayTeam.primary};"></span>
                            </div>
                            <div class="wc98-bug-clock" id="wc98-hud-clock">${m.getDisplayMinute()}' (${periodLabel})</div>
                        </div>

                        <div class="wc98-tactics-hud">
                            <button class="wc98-tac-pill ${m.homeMentality === 'defensive' ? 'active' : ''}" data-mentality="defensive">[1] Контратака</button>
                            <button class="wc98-tac-pill ${m.homeMentality === 'balanced' ? 'active' : ''}" data-mentality="balanced">[2] Баланс</button>
                            <button class="wc98-tac-pill ${m.homeMentality === 'attacking' ? 'active' : ''}" data-mentality="attacking">[3] Прессинг</button>
                        </div>

                        ${overlayHtml}
                    </div>

                    <div class="wc98-bottom-hud">
                        <div class="wc98-commentary-box" id="wc98-hud-commentary">${m.commentary}</div>
                        <div class="wc98-telemetry">
                            <div>
                                Игрок: <strong id="wc98-hud-player">#${activePlayer.number} ${activePlayer.name}</strong>
                            </div>
                            <div style="display:flex; align-items:center; gap:4px;">
                                <span>Сила:</span>
                                <div class="wc98-gauge"><div class="wc98-gauge-fill" id="wc98-hud-power" style="width:0%; background:#facc15;"></div></div>
                            </div>
                            <div style="display:flex; align-items:center; gap:4px;">
                                <span>Выносл.:</span>
                                <div class="wc98-gauge"><div class="wc98-gauge-fill" id="wc98-hud-stamina" style="width:${Math.round(activePlayer.stamina)}%; background:#22c55e;"></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        bindEvents() {
            this.root.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const act = btn.getAttribute('data-action');
                    this.handleAction(act);
                });
            });

            this.root.querySelectorAll('[data-config]').forEach(sel => {
                sel.addEventListener('change', () => {
                    const key = sel.getAttribute('data-config');
                    this.setupConfig[key] = sel.value;
                    if (key === 'homeTeam' && Core.TEAMS[sel.value]) {
                        this.setupConfig.homeFormation = Core.TEAMS[sel.value].formation;
                    }
                    if (key === 'awayTeam' && Core.TEAMS[sel.value]) {
                        this.setupConfig.awayFormation = Core.TEAMS[sel.value].formation;
                    }
                    this.render();
                });
            });

            this.root.querySelectorAll('[data-group-tab]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.activeGroupTab = btn.getAttribute('data-group-tab');
                    this.render();
                });
            });

            this.root.querySelectorAll('[data-action="change-tourney-team"]').forEach(sel => {
                sel.addEventListener('change', () => {
                    this.tournament = new Core.Tournament({ playerTeam: sel.value });
                    this.activeGroupTab = this.tournament.getPlayerGroup();
                    this.saveTournament();
                    this.render();
                });
            });

            this.root.querySelectorAll('[data-scenario-id]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const scId = btn.getAttribute('data-scenario-id');
                    const sc = Core.CLASSIC_SCENARIOS.find(s => s.id === scId);
                    if (sc) {
                        this.startScenarioMatch(sc);
                    }
                });
            });

            this.root.querySelectorAll('[data-mentality]').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (this.match) {
                        this.match.setMentality('home', btn.getAttribute('data-mentality'));
                        this.render();
                    }
                });
            });

            this.root.querySelectorAll('[data-pen-zx]').forEach(cell => {
                cell.addEventListener('click', () => {
                    const zx = Number(cell.getAttribute('data-pen-zx'));
                    const zy = Number(cell.getAttribute('data-pen-zy'));
                    const sh = this.screen === 'shootout_standalone' ? this.standaloneShootout : (this.match && this.match.shootout);
                    if (sh && sh.turn === 'home') {
                        this.penSelection.zoneX = zx;
                        this.penSelection.zoneY = zy;
                    } else {
                        this.penSelection.diveX = zx;
                        this.penSelection.diveY = zy;
                    }
                    this.render();
                });
            });
        }

        handleAction(act) {
            if (act === 'nav-menu') {
                this.screen = 'menu';
                this.render();
            } else if (act === 'toggle-mute') {
                this.audio.muted = !this.audio.muted;
                this.render();
            } else if (act === 'open-friendly') {
                this.screen = 'friendly_setup';
                this.render();
            } else if (act === 'open-tournament') {
                this.screen = 'tournament';
                this.render();
            } else if (act === 'open-classics') {
                this.screen = 'classics';
                this.render();
            } else if (act === 'open-shootout') {
                this.standaloneShootout = new Core.PenaltyShootout({
                    homeTeam: this.setupConfig.homeTeam || 'RUS',
                    awayTeam: this.setupConfig.awayTeam || 'FRA'
                });
                this.screen = 'shootout_standalone';
                this.render();
            } else if (act === 'quick-kickoff') {
                this.setupConfig.homeTeam = 'RUS';
                this.setupConfig.awayTeam = 'FRA';
                this.startFriendlyMatch();
            } else if (act === 'start-friendly-match') {
                this.startFriendlyMatch();
            } else if (act === 'reset-tournament') {
                this.tournament = new Core.Tournament({ playerTeam: this.setupConfig.homeTeam || 'RUS' });
                this.activeGroupTab = this.tournament.getPlayerGroup();
                this.saveTournament();
                this.render();
            } else if (act === 'play-tournament-match') {
                this.startTournamentMatch();
            } else if (act === 'resume-second-half') {
                if (this.match) {
                    this.audio.playWhistle(true);
                    this.match.resumeFromHalftime();
                    this.render();
                }
            } else if (act === 'execute-penalty-step') {
                const sh = this.screen === 'shootout_standalone' ? this.standaloneShootout : (this.match && this.match.shootout);
                if (!sh) return;
                this.audio.playKick(0.8);
                if (sh.turn === 'home') {
                    sh.takeKick({
                        zoneX: this.penSelection.zoneX,
                        zoneY: this.penSelection.zoneY,
                        power: this.penSelection.power
                    });
                } else {
                    const aiKick = {
                        zoneX: Math.round((Math.random() * 2) - 1),
                        zoneY: Math.random() > 0.5 ? 1 : 0,
                        power: 0.76
                    };
                    sh.takeKick(aiKick, {
                        diveX: this.penSelection.diveX,
                        diveY: this.penSelection.diveY
                    });
                }
                if (sh.lastResult && sh.lastResult.outcome === 'goal') {
                    this.audio.playGoalRoar();
                }
                this.render();
            } else if (act === 'restart-standalone-shootout') {
                this.standaloneShootout = new Core.PenaltyShootout({
                    homeTeam: this.setupConfig.homeTeam || 'RUS',
                    awayTeam: this.setupConfig.awayTeam || 'FRA'
                });
                this.render();
            } else if (act === 'finish-match-after-shootout') {
                if (this.match) {
                    this.match.finishMatch();
                    this.render();
                }
            } else if (act === 'complete-match-flow') {
                if (this.matchContext === 'tournament' && this.tournament && this.match) {
                    const nextFix = this.tournament.getNextPlayerFixture();
                    const playerIsHome = !nextFix || nextFix.home === this.tournament.playerTeamId;
                    const hg = playerIsHome ? this.match.score.home : this.match.score.away;
                    const ag = playerIsHome ? this.match.score.away : this.match.score.home;
                    const winSide = this.match.winner === 'home'
                        ? (playerIsHome ? 'home' : 'away')
                        : (playerIsHome ? 'away' : 'home');
                    this.tournament.recordPlayerMatchResult(hg, ag, winSide);
                    this.saveTournament();
                    this.screen = 'tournament';
                } else if (this.matchContext === 'scenario') {
                    this.screen = 'classics';
                } else {
                    this.screen = 'menu';
                }
                this.render();
            }
        }

        startFriendlyMatch() {
            this.matchContext = 'friendly';
            this.match = new Core.Match({
                homeTeam: this.setupConfig.homeTeam,
                awayTeam: this.setupConfig.awayTeam,
                homeFormation: this.setupConfig.homeFormation,
                awayFormation: this.setupConfig.awayFormation,
                stadium: this.setupConfig.stadium,
                weather: this.setupConfig.weather,
                halfDuration: this.setupConfig.halfDuration,
                goldenGoal: true
            });
            this.audio.playWhistle(true);
            this.screen = 'match';
            this.render();
        }

        startTournamentMatch() {
            if (!this.tournament) return;
            const fix = this.tournament.getNextPlayerFixture();
            if (!fix) return;
            const oppId = fix.home === this.tournament.playerTeamId ? fix.away : fix.home;
            const oppTeam = Core.TEAMS[oppId] || Core.TEAMS.FRA;
            const playerTeam = Core.TEAMS[this.tournament.playerTeamId] || Core.TEAMS.RUS;
            const isKnockout = this.tournament.stage !== 'group';

            this.matchContext = 'tournament';
            this.match = new Core.Match({
                homeTeam: playerTeam.id,
                awayTeam: oppTeam.id,
                homeFormation: playerTeam.formation,
                awayFormation: oppTeam.formation,
                stadium: this.tournament.stage === 'final' ? 'stade_de_france' : 'velodrome',
                weather: this.tournament.stage === 'final' ? 'night' : 'sunny',
                halfDuration: 55,
                allowExtraTime: isKnockout,
                goldenGoal: true
            });
            this.audio.playWhistle(true);
            this.screen = 'match';
            this.render();
        }

        startScenarioMatch(scenario) {
            this.activeScenario = scenario;
            this.matchContext = 'scenario';
            this.match = new Core.Match({
                homeTeam: scenario.homeTeam,
                awayTeam: scenario.awayTeam,
                initialHomeScore: scenario.initialHomeScore,
                initialAwayScore: scenario.initialAwayScore,
                startMinute: scenario.startMinute,
                startHalf: scenario.startHalf || 2,
                stadium: scenario.stadium,
                weather: scenario.weather,
                halfDuration: 65,
                allowExtraTime: true,
                goldenGoal: scenario.goldenGoal
            });
            this.audio.playWhistle(true);
            this.screen = 'match';
            this.render();
        }

        getAimVector() {
            let x = 0;
            let y = 0;
            if (this.keys.ArrowRight || this.keys.KeyD) x += 1;
            if (this.keys.ArrowLeft || this.keys.KeyA) x -= 1;
            if (this.keys.ArrowDown || this.keys.KeyS) y += 1;
            if (this.keys.ArrowUp || this.keys.KeyW) y -= 1;
            return { x, y };
        }

        handleKeyDown(e) {
            if (this.screen !== 'match' || !this.match) return;
            this.keys[e.code] = true;

            if (e.code === 'Digit1') {
                this.match.setMentality('home', 'defensive');
                this.updateTacticsHud();
            } else if (e.code === 'Digit2') {
                this.match.setMentality('home', 'balanced');
                this.updateTacticsHud();
            } else if (e.code === 'Digit3') {
                this.match.setMentality('home', 'attacking');
                this.updateTacticsHud();
            } else if (e.code === 'KeyX' || e.code === 'KeyJ') {
                const aim = this.getAimVector();
                if (this.match.ball.owner && this.match.ball.owner.team === 'home') {
                    this.audio.playKick(0.5);
                    this.match.pass(aim.x, aim.y);
                } else {
                    this.match.switchPlayer();
                }
            } else if (e.code === 'KeyC' || e.code === 'KeyK') {
                const aim = this.getAimVector();
                if (this.match.ball.owner && this.match.ball.owner.team === 'home') {
                    this.audio.playKick(0.65);
                    this.match.lobPass(aim.x, aim.y);
                } else {
                    this.match.slideTackle(aim.x, aim.y);
                }
            } else if (e.code === 'KeyE' || e.code === 'KeyV') {
                const aim = this.getAimVector();
                this.match.skillMove(aim.x, aim.y);
            } else if (e.code === 'Space' || e.code === 'KeyZ') {
                e.preventDefault();
                if (this.match.ball.owner && this.match.ball.owner.team === 'home') {
                    if (!this.match.shotCharge.active) {
                        this.match.startChargeShot();
                    }
                } else {
                    this.match.standingTackle();
                }
            }
        }

        handleKeyUp(e) {
            this.keys[e.code] = false;
            if (this.screen !== 'match' || !this.match) return;
            if ((e.code === 'Space' || e.code === 'KeyZ') && this.match.shotCharge.active) {
                const aim = this.getAimVector();
                this.audio.playKick(this.match.shotCharge.power);
                this.match.releaseShot(aim.x || 1, aim.y, aim.y);
            }
        }

        updateTacticsHud() {
            if (!this.root || !this.match) return;
            this.root.querySelectorAll('[data-mentality]').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-mentality') === this.match.homeMentality);
            });
        }

        startMatchLoop() {
            const canvas = this.root.querySelector('.wc98-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            this.lastFrameTs = performance.now();

            const step = (now) => {
                if (this.screen !== 'match' || !this.match) return;
                const dt = Math.min(0.05, (now - this.lastFrameTs) / 1000);
                this.lastFrameTs = now;

                const prevState = this.match.state;
                const prevEventsLen = this.match.events.length;
                const aim = this.getAimVector();

                this.match.update(dt, {
                    moveX: aim.x,
                    moveY: aim.y,
                    sprint: Boolean(this.keys.ShiftLeft || this.keys.ShiftRight)
                });

                if (this.match.events.length > prevEventsLen) {
                    const latest = this.match.events[this.match.events.length - 1];
                    if (latest.type === 'goal') this.audio.playGoalRoar();
                    if (latest.type === 'post' || latest.type === 'crossbar') this.audio.playPost();
                    if (latest.type === 'foul' || latest.type === 'penalty_awarded') this.audio.playWhistle(false);
                }

                if (this.match.state !== prevState && (this.match.state === 'halftime' || this.match.state === 'shootout' || this.match.state === 'finished')) {
                    this.audio.playWhistle(true);
                    this.render();
                    return;
                }

                this.updateLiveHudDom();
                this.renderPitchCanvas(ctx, canvas.width, canvas.height);
                this.rafId = requestAnimationFrame(step);
            };

            this.rafId = requestAnimationFrame(step);
        }

        updateLiveHudDom() {
            const m = this.match;
            if (!m || !this.root) return;
            const scoreEl = this.root.querySelector('#wc98-hud-score');
            const clockEl = this.root.querySelector('#wc98-hud-clock');
            const commEl = this.root.querySelector('#wc98-hud-commentary');
            const playerEl = this.root.querySelector('#wc98-hud-player');
            const powerEl = this.root.querySelector('#wc98-hud-power');
            const stamEl = this.root.querySelector('#wc98-hud-stamina');

            if (scoreEl) scoreEl.textContent = `${m.score.home} - ${m.score.away}`;
            if (clockEl) {
                const pLabel = m.half === 1 ? '1Т' : (m.half === 2 ? '2Т' : 'ЗГ');
                clockEl.textContent = `${m.getDisplayMinute()}' (${pLabel})`;
            }
            if (commEl) commEl.textContent = m.commentary;
            if (playerEl && m.controlledPlayer) {
                playerEl.textContent = `#${m.controlledPlayer.number} ${m.controlledPlayer.name}`;
            }
            if (powerEl) {
                const pct = Math.min(100, Math.round((m.shotCharge.power / 1.15) * 100));
                powerEl.style.width = `${pct}%`;
                powerEl.style.background = m.shotCharge.power > 1.0 ? '#ef4444' : (m.shotCharge.power >= 0.62 ? '#22c55e' : '#facc15');
            }
            if (stamEl && m.controlledPlayer) {
                stamEl.style.width = `${Math.round(m.controlledPlayer.stamina)}%`;
            }
        }

        projectPoint(wx, wy, wz = 0, cw = 840, ch = 460) {
            const normY = (wy + Core.PITCH_HALF_H) / Core.PITCH_HEIGHT;
            const perspectiveScale = 0.78 + normY * 0.28;
            const sx = cw / 2 + wx * 0.86 * perspectiveScale;
            const sy = 54 + normY * (ch - 86) - wz * 0.85;
            return { x: sx, y: sy, scale: perspectiveScale };
        }

        renderPitchCanvas(ctx, cw, ch) {
            const m = this.match;
            if (!ctx || !m) return;

            ctx.fillStyle = m.stadium.trackColor || '#1e293b';
            ctx.fillRect(0, 0, cw, ch);

            ctx.fillStyle = '#09152e';
            ctx.fillRect(0, 0, cw, 38);
            const bannerCount = 12;
            for (let i = 0; i < bannerCount; i++) {
                ctx.fillStyle = i % 2 === 0 ? m.homeTeam.primary : m.awayTeam.primary;
                ctx.fillRect(i * (cw / bannerCount), 28, cw / bannerCount - 2, 10);
            }

            const stripes = 14;
            const stripeWorldW = Core.PITCH_WIDTH / stripes;
            for (let i = 0; i < stripes; i++) {
                const x1 = -Core.PITCH_HALF_W + i * stripeWorldW;
                const x2 = x1 + stripeWorldW;
                const tl = this.projectPoint(x1, -Core.PITCH_HALF_H, 0, cw, ch);
                const tr = this.projectPoint(x2, -Core.PITCH_HALF_H, 0, cw, ch);
                const br = this.projectPoint(x2, Core.PITCH_HALF_H, 0, cw, ch);
                const bl = this.projectPoint(x1, Core.PITCH_HALF_H, 0, cw, ch);

                ctx.fillStyle = i % 2 === 0 ? m.stadium.grassLight : m.stadium.grassDark;
                ctx.beginPath();
                ctx.moveTo(tl.x, tl.y);
                ctx.lineTo(tr.x, tr.y);
                ctx.lineTo(br.x, br.y);
                ctx.lineTo(bl.x, bl.y);
                ctx.closePath();
                ctx.fill();
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 2;
            const drawWorldPoly = (pts, close = true) => {
                ctx.beginPath();
                pts.forEach(([wx, wy], idx) => {
                    const p = this.projectPoint(wx, wy, 0, cw, ch);
                    if (idx === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                });
                if (close) ctx.closePath();
                ctx.stroke();
            };

            drawWorldPoly([
                [-Core.PITCH_HALF_W, -Core.PITCH_HALF_H],
                [Core.PITCH_HALF_W, -Core.PITCH_HALF_H],
                [Core.PITCH_HALF_W, Core.PITCH_HALF_H],
                [-Core.PITCH_HALF_W, Core.PITCH_HALF_H]
            ]);

            drawWorldPoly([[0, -Core.PITCH_HALF_H], [0, Core.PITCH_HALF_H]], false);

            const centerP = this.projectPoint(0, 0, 0, cw, ch);
            ctx.beginPath();
            ctx.ellipse(centerP.x, centerP.y, 58, 38, 0, 0, Math.PI * 2);
            ctx.stroke();

            [-1, 1].forEach(side => {
                const gx = side * Core.PITCH_HALF_W;
                const boxX = gx - side * Core.PENALTY_BOX_W;
                drawWorldPoly([
                    [gx, -Core.PENALTY_BOX_H / 2],
                    [boxX, -Core.PENALTY_BOX_H / 2],
                    [boxX, Core.PENALTY_BOX_H / 2],
                    [gx, Core.PENALTY_BOX_H / 2]
                ]);

                const postTopBase = this.projectPoint(gx, -Core.GOAL_HALF_W, 0, cw, ch);
                const postBotBase = this.projectPoint(gx, Core.GOAL_HALF_W, 0, cw, ch);
                const postTopHigh = this.projectPoint(gx, -Core.GOAL_HALF_W, Core.CROSSBAR_HEIGHT, cw, ch);
                const postBotHigh = this.projectPoint(gx, Core.GOAL_HALF_W, Core.CROSSBAR_HEIGHT, cw, ch);
                const backTop = this.projectPoint(gx + side * Core.GOAL_DEPTH, -Core.GOAL_HALF_W, 0, cw, ch);
                const backBot = this.projectPoint(gx + side * Core.GOAL_DEPTH, Core.GOAL_HALF_W, 0, cw, ch);

                ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(postTopHigh.x, postTopHigh.y);
                ctx.lineTo(backTop.x, backTop.y);
                ctx.lineTo(backBot.x, backBot.y);
                ctx.lineTo(postBotHigh.x, postBotHigh.y);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(postTopBase.x, postTopBase.y);
                ctx.lineTo(postTopHigh.x, postTopHigh.y);
                ctx.lineTo(postBotHigh.x, postBotHigh.y);
                ctx.lineTo(postBotBase.x, postBotBase.y);
                ctx.stroke();
            });

            const sortedPlayers = [...m.players].filter(p => !p.sentOff).sort((a, b) => a.y - b.y);
            for (const p of sortedPlayers) {
                const pos = this.projectPoint(p.x, p.y, 0, cw, ch);
                const teamObj = p.team === 'home' ? m.homeTeam : m.awayTeam;
                const shirtColor = p.role === 'GK' ? teamObj.gkColor : teamObj.primary;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y + 2, 8 * pos.scale, 4 * pos.scale, 0, 0, Math.PI * 2);
                ctx.fill();

                if (p === m.controlledPlayer) {
                    ctx.strokeStyle = '#fde047';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(pos.x, pos.y + 2, 13 * pos.scale, 7 * pos.scale, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }

                const bounceY = Math.sin(p.animPhase) * 1.8;
                ctx.fillStyle = teamObj.shorts || '#ffffff';
                ctx.fillRect(pos.x - 4 * pos.scale, pos.y - 7 * pos.scale + bounceY, 8 * pos.scale, 5 * pos.scale);

                ctx.fillStyle = shirtColor;
                ctx.fillRect(pos.x - 6 * pos.scale, pos.y - 16 * pos.scale + bounceY, 12 * pos.scale, 10 * pos.scale);

                ctx.fillStyle = '#f1c27d';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y - 20 * pos.scale + bounceY, 4 * pos.scale, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.round(9 * pos.scale)}px Tahoma`;
                ctx.textAlign = 'center';
                ctx.fillText(String(p.number), pos.x, pos.y - 8 * pos.scale + bounceY);
            }

            const bShadow = this.projectPoint(m.ball.x, m.ball.y, 0, cw, ch);
            const bPos = this.projectPoint(m.ball.x, m.ball.y, m.ball.z, cw, ch);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(bShadow.x, bShadow.y + 1, 5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bPos.x, bPos.y - 3, 5.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (m.weatherId === 'rain') {
                ctx.strokeStyle = 'rgba(186, 230, 253, 0.38)';
                ctx.lineWidth = 1;
                for (const d of this.rainDrops) {
                    d.x = (d.x - 4 + cw) % cw;
                    d.y = (d.y + 9) % ch;
                    ctx.beginPath();
                    ctx.moveTo(d.x, d.y);
                    ctx.lineTo(d.x - 3, d.y + 8);
                    ctx.stroke();
                }
            }

            const radarW = 116;
            const radarH = 68;
            const rx = cw - radarW - 10;
            const ry = ch - radarH - 8;
            ctx.fillStyle = 'rgba(9, 21, 46, 0.76)';
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 1;
            ctx.fillRect(rx, ry, radarW, radarH);
            ctx.strokeRect(rx, ry, radarW, radarH);

            for (const p of m.players) {
                if (p.sentOff) continue;
                const px = rx + ((p.x + Core.PITCH_HALF_W) / Core.PITCH_WIDTH) * radarW;
                const py = ry + ((p.y + Core.PITCH_HALF_H) / Core.PITCH_HEIGHT) * radarH;
                ctx.fillStyle = p.team === 'home' ? m.homeTeam.primary : m.awayTeam.primary;
                ctx.fillRect(px - 2, py - 2, 4, 4);
            }
            const bx = rx + ((m.ball.x + Core.PITCH_HALF_W) / Core.PITCH_WIDTH) * radarW;
            const by = ry + ((m.ball.y + Core.PITCH_HALF_H) / Core.PITCH_HEIGHT) * radarH;
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const appWorldCup98 = {
        id: 'worldcup98',
        instance: null,

        open() {
            if (typeof gameManager !== 'undefined' && !gameManager.isInstalled('worldcup98')) {
                const mgr = globalScope.winManager || globalScope.wm;
                if (mgr && typeof mgr.alert === 'function') {
                    mgr.alert('EA Sports World Cup 98 не установлен! Установите демо-версию с компакт-диска «Игромания» (D:\\demo\\worldcup98.exe).');
                }
                return;
            }

            const winId = 'app_worldcup98';
            const mgr = globalScope.winManager || globalScope.wm;
            if (mgr && mgr.windows && mgr.windows.has(winId)) {
                mgr.restoreWindow(winId);
                return;
            }

            const root = document.createElement('div');
            root.style.width = '100%';
            root.style.height = '100%';

            if (mgr && typeof mgr.createWindow === 'function') {
                mgr.createWindow({
                    id: winId,
                    title: 'EA Sports World Cup 98 — France 98',
                    icon: 'worldcup98',
                    width: Math.min(920, (globalScope.innerWidth || 1024) - 30),
                    height: Math.min(620, (globalScope.innerHeight || 768) - 65),
                    x: 24,
                    y: 18,
                    resizable: true,
                    className: 'wc98-window',
                    content: root,
                    onClose: () => {
                        if (this.instance) {
                            this.instance.destroy();
                            this.instance = null;
                        }
                    }
                });
            }

            this.instance = new WorldCup98App(root);
            return this.instance;
        }
    };

    globalScope.WorldCup98App = WorldCup98App;
    globalScope.appWorldCup98 = appWorldCup98;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { WorldCup98App, appWorldCup98, WorldCup98Audio };
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
