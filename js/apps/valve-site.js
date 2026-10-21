const VLV_BASE = 'http://www.valvesoftware.com';
const VLV_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const VLV_MONTH_TITLES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const VLV_CATEGORIES = ['Half-Life 98', 'Half-Life 2', 'Steam', 'Dota 98', 'Студия'];
const VLV_PRODUCT_IDS = ['half-life', 'hl2', 'steam', 'dota'];

class ValveSite {
    constructor() {
        this.currentUrl = VLV_BASE;
        this.newsFilter = 'all';
        this.selectedShots = { 'half-life': 0, 'hl2': 0, 'dota': 0 };
        this.labWeaponId = 'grav_sawblade';
        this.labTargetId = 'fast_zombie';
        this.atlasSectorId = 'hl2-c05-c08';
        this.searchQuery = '';
        this.noticeMessage = '';
        this.pollStorageKey = 'win98_valve_poll_v1';
        this.commentsStorageKey = 'win98_valve_comments_v1';
        this.lettersStorageKey = 'win98_valve_letters_v1';
        this.lastWin = null;
        this.lastContainer = null;
        this.lastIe = null;
    }

    getData() {
        return window.VALVE_DATA || { studio: {}, history: [], projects: [], briefs: [], news: [], lab: { arsenal: [], targets: [], atlas: [] }, poll: { options: [] }, cabal: { intro: [], groups: [], jobs: [], initialLetters: [] }, steamSetup: { lines: [], mirrors: [] } };
    }

    escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    url(path) {
        return VLV_BASE + (path || '');
    }

    project(id) {
        return (this.getData().projects || []).find(p => p.id === id) || null;
    }

    article(id) {
        return (this.getData().news || []).find(n => n.id === id) || null;
    }

    dateParts(iso) {
        const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return { y: 2000, m: 9, d: 16 };
        return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
    }

    dateShort(iso) {
        const p = this.dateParts(iso);
        return `${String(p.d).padStart(2, '0')}.${String(p.m + 1).padStart(2, '0')}.${p.y}`;
    }

    dateLong(iso) {
        const p = this.dateParts(iso);
        return `${p.d} ${VLV_MONTHS[p.m]} ${p.y}`;
    }

    parseRoute(url) {
        const raw = String(url || VLV_BASE).trim();
        const afterScheme = raw.includes('://') ? raw.slice(raw.indexOf('://') + 3) : raw;
        const slashIdx = afterScheme.indexOf('/');
        const tail = slashIdx >= 0 ? afterScheme.slice(slashIdx) : (afterScheme.includes('?') ? afterScheme.slice(afterScheme.indexOf('?')) : '/');
        const hashFree = tail.split('#')[0];
        const qIdx = hashFree.indexOf('?');
        const pathPart = qIdx >= 0 ? hashFree.slice(0, qIdx) : hashFree;
        const queryPart = qIdx >= 0 ? hashFree.slice(qIdx + 1) : '';
        const params = {};
        queryPart.split('&').forEach(pair => {
            if (!pair) return;
            const eq = pair.indexOf('=');
            const decode = s => {
                try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s; }
            };
            if (eq >= 0) params[decode(pair.slice(0, eq))] = decode(pair.slice(eq + 1));
            else params[decode(pair)] = '';
        });
        const clean = (pathPart.toLowerCase().replace(/\/+$/, '') || '/').replace(/\.html?$/, '');
        const aliases = {
            '/games': ['games', {}], '/products': ['games', {}], '/projects': ['games', {}],
            '/game': ['game', params], '/project': ['game', params],
            '/half-life': ['game', { id: 'half-life' }], '/halflife': ['game', { id: 'half-life' }],
            '/hl2': ['game', { id: 'hl2' }], '/half-life-2': ['game', { id: 'hl2' }],
            '/steam': ['game', { id: 'steam' }],
            '/dota': ['game', { id: 'dota' }], '/dota98': ['game', { id: 'dota' }],
            '/news': ['news', params], '/press': ['news', params],
            '/article': ['article', params], '/dispatch': ['article', params],
            '/lab': ['lab', params], '/lambda': ['lab', params], '/testchamber': ['lab', params],
            '/company': ['company', params], '/cabal': ['company', params], '/studio': ['company', params], '/jobs': ['company', params],
            '/letters': ['letters', params], '/mail': ['letters', params],
            '/search': ['search', params]
        };
        if (params.q !== undefined && clean !== '/article') {
            this.searchQuery = params.q;
            return { page: 'search', params };
        }
        const hit = aliases[clean];
        if (!hit) return { page: 'home', params };
        if (hit[0] === 'news' && params.cat) this.newsFilter = params.cat;
        return { page: hit[0], params: hit[1] };
    }

    getPageTitle(url) {
        const route = this.parseRoute(url);
        if (route.page === 'games') return 'Valve Software: продукты';
        if (route.page === 'game') {
            const proj = this.project(route.params.id) || this.project('hl2');
            return proj ? `${proj.title} - Valve Software` : 'Valve Software';
        }
        if (route.page === 'news') return 'Valve Software: новости и пресс-релизы';
        if (route.page === 'article') {
            const art = this.article(route.params.id) || (this.getData().news || [])[0];
            return art ? `${art.title} - Valve Software` : 'Valve Software';
        }
        if (route.page === 'lab') return 'Valve Software: испытательная камера λ';
        if (route.page === 'company') return 'Valve Software: о компании и вакансии';
        if (route.page === 'letters') return 'Valve Software: почта читателей';
        if (route.page === 'search') return `Valve Software: поиск «${this.searchQuery || ''}»`;
        return 'Valve Software - Kirkland, Washington';
    }

    navigate(url) {
        this.currentUrl = url;
        const ie = this.lastIe || window.appIE;
        const win = this.lastWin || (ie && ie.currentWin);
        if (ie && win && typeof ie.navigate === 'function') {
            ie.navigate(win, url);
            return;
        }
        this.rerenderInPlace();
    }

    rerenderInPlace() {
        const ie = this.lastIe || window.appIE;
        const win = this.lastWin || (ie && ie.currentWin);
        const container = this.lastContainer;
        if (ie && win && container && typeof ie.renderPage === 'function') {
            const top = container.scrollTop || 0;
            ie.renderPage(win, ie.currentUrl || this.currentUrl);
            container.scrollTop = top;
            return;
        }
        if (container) container.innerHTML = this.render(this.currentUrl);
    }

    renderSite(url) {
        return this.render(url);
    }

    attachEvents(win, container, ieInstance) {
        this.lastWin = win || null;
        this.lastContainer = container || null;
        this.lastIe = ieInstance || window.appIE || null;
        if (!container || typeof container.querySelectorAll !== 'function') return;
        const click = () => { if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick(); };
        container.querySelectorAll('[data-vlv]').forEach(el => {
            const kind = el.tagName === 'SELECT' ? 'change' : (el.tagName === 'FORM' ? 'submit' : 'click');
            el.addEventListener(kind, e => {
                if (e && e.preventDefault && kind !== 'change') e.preventDefault();
                if (kind === 'click') click();
                this.runAction(el.dataset.vlv, el);
            });
        });
    }

    runAction(action, el) {
        const id = el && el.dataset ? el.dataset.id : '';
        const handlers = {
            product: () => this.productAction(id),
            steamPage: () => this.openInSteam(id),
            shot: () => this.setShot(id, el.dataset.n),
            filter: () => this.setNewsFilter(el.dataset.cat),
            vote: () => {
                const checked = this.lastContainer && this.lastContainer.querySelector('input[name="vlv-poll"]:checked');
                if (checked) this.votePoll(checked.value);
            },
            pollReset: () => this.resetPoll(),
            weapon: () => this.setLabWeapon(el.value),
            target: () => this.setLabTarget(el.value),
            sector: () => this.setAtlasSector(id),
            sectorGo: () => {
                this.atlasSectorId = id;
                this.navigate(`${VLV_BASE}/lab`);
            },
            labReport: () => this.exportLabReport(),
            atlasTxt: () => this.exportAtlasGuide(id),
            articleTxt: () => this.exportArticleTxt(id),
            comment: () => this.submitComment(id),
            letter: () => this.submitLetter(),
            search: () => this.submitSearch()
        };
        if (handlers[action]) handlers[action]();
    }

    gm() {
        return window.gameManager || null;
    }

    installedCount() {
        const gm = this.gm();
        return gm ? VLV_PRODUCT_IDS.filter(id => gm.isInstalled(id)).length : 0;
    }

    exeName(proj) {
        return proj && proj.exePath ? proj.exePath.split('\\').pop() : 'EXE';
    }

    steamDownload(projectId) {
        const steam = window.appSteam;
        const dl = steam && steam.downloads && typeof steam.downloads.get === 'function' ? steam.downloads.get(projectId) : null;
        if (!dl || !dl.totalKB) return null;
        return { pct: Math.min(100, Math.floor(dl.doneKB / dl.totalKB * 100)), paused: !!dl.paused };
    }

    owns(gm, projectId) {
        if (typeof gm.ownsOnSteam === 'function') return gm.ownsOnSteam(projectId);
        return typeof gm.isPurchased === 'function' && gm.isPurchased(projectId);
    }

    getProjectStatusInfo(projectId) {
        const gm = this.gm();
        const proj = this.project(projectId);
        if (projectId === 'steam') {
            if (gm && gm.isInstalled('steam')) return { state: 'installed', text: `Установлен: ${proj.exePath}`, button: 'Запустить Steam' };
            if (gm && gm.isDownloaded('steam')) return { state: 'downloaded', text: 'SteamInstall.exe лежит в папке Downloads', button: 'Запустить SteamInstall.exe' };
            return { state: 'none', text: 'Не установлен', button: 'Скачать на steampowered.com' };
        }
        if (!gm) return { state: 'none', text: 'Есть в магазине Steam', button: 'Открыть в Steam' };
        if (gm.isInstalled(projectId)) return { state: 'installed', text: `Установлено: ${proj.exePath}`, button: `Запустить ${this.exeName(proj)}`, steamLink: true };
        const dl = this.steamDownload(projectId);
        if (dl) return { state: 'downloading', text: `Загружается в Steam: ${dl.pct}%${dl.paused ? ', пауза' : ''}`, button: 'Открыть Steam' };
        if (this.owns(gm, projectId)) return { state: 'owned', text: 'Куплено, ещё не загружено', button: 'Загрузить в Steam' };
        return { state: 'none', text: 'Есть в магазине Steam', button: 'Открыть в Steam' };
    }

    productAction(projectId) {
        if (projectId !== 'steam') {
            this.launchGame(projectId);
            return;
        }
        const st = this.getProjectStatusInfo('steam');
        if (st.state === 'installed') this.openSteamClient();
        else if (st.state === 'downloaded') this.installSteam();
        else if (st.state === 'none') this.navigate('http://www.steampowered.com');
    }

    installSteam() {
        const gm = this.gm();
        if (!gm) return;
        gm.openSetupWizard('steam');
        this.noticeMessage = 'Запущен мастер установки Steam.';
        this.rerenderInPlace();
    }

    openSteamClient() {
        if (window.appSteam && typeof window.appSteam.open === 'function') {
            window.appSteam.open();
            return;
        }
        this.launchFromCatalog('steam');
    }

    launchFromCatalog(projectId) {
        const gm = this.gm();
        const entry = gm && gm.catalog ? gm.catalog[projectId] : null;
        if (entry && typeof entry.launch === 'function') entry.launch();
    }

    openInSteam(projectId) {
        if (projectId === 'steam') {
            this.productAction('steam');
            return;
        }
        const gm = this.gm();
        if (gm && typeof gm.showInSteam === 'function') gm.showInSteam(projectId);
    }

    launchGame(projectId) {
        if (projectId === 'steam') {
            this.openSteamClient();
            return;
        }
        const gm = this.gm();
        if (!gm) return;
        if (gm.isInstalled(projectId)) this.launchFromCatalog(projectId);
        else gm.showInSteam(projectId);
    }

    setShot(projectId, index) {
        this.selectedShots[projectId] = Number(index) || 0;
        this.rerenderInPlace();
    }

    setNewsFilter(cat) {
        this.newsFilter = VLV_CATEGORIES.includes(cat) ? cat : 'all';
        this.rerenderInPlace();
    }

    setLabWeapon(weaponId) {
        this.labWeaponId = weaponId;
        this.rerenderInPlace();
    }

    setLabTarget(targetId) {
        this.labTargetId = targetId;
        this.rerenderInPlace();
    }

    setAtlasSector(sectorId) {
        this.atlasSectorId = sectorId;
        this.rerenderInPlace();
    }

    saveTextFileToMyDocs(fileName, textContent) {
        const safeName = String(fileName || 'VALVE.TXT').replace(/[^a-zA-Z0-9._-]/g, '_');
        const folder = ['My Computer', 'C:', 'My Documents'];
        if (window.vfs && typeof window.vfs.writeFile === 'function') window.vfs.writeFile(folder, safeName, textContent);
        if (window.appNotepad && typeof window.appNotepad.open === 'function') window.appNotepad.open(safeName, textContent, folder);
        this.noticeMessage = `Файл C:\\My Documents\\${safeName} сохранён и открыт в Блокноте.`;
        this.rerenderInPlace();
    }

    wrapText(text, width) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let line = '';
        words.forEach(w => {
            if (line && (line + ' ' + w).length > width) {
                lines.push(line);
                line = w;
            } else {
                line = line ? line + ' ' + w : w;
            }
        });
        if (line) lines.push(line);
        return lines;
    }

    buildArticleText(art) {
        const rule = '='.repeat(72);
        const out = [
            rule,
            'VALVE SOFTWARE L.L.C.                         KIRKLAND, WASHINGTON',
            `ПРЕСС-РЕЛИЗ ${art.code}`.padEnd(56) + this.dateShort(art.date),
            rule,
            '',
            ...this.wrapText(art.title.toUpperCase(), 72),
            '',
            `Автор: ${art.author}`,
            ''
        ];
        (art.body || []).forEach(p => {
            out.push(...this.wrapText(p, 72));
            out.push('');
        });
        out.push('###', '', `Контакты для прессы: ${this.getData().studio.pressEmail || 'press@valvesoftware.com'}`, `${VLV_BASE}/article?id=${art.id}`);
        return out.join('\r\n');
    }

    exportArticleTxt(articleId) {
        const art = this.article(articleId) || (this.getData().news || [])[0];
        if (!art) return;
        this.saveTextFileToMyDocs(`VALVE_${art.code.replace(/[^a-zA-Z0-9]/g, '_')}.TXT`, this.buildArticleText(art));
    }

    unitFor(target, n) {
        const forms = target && target.unitForms;
        if (!forms) return 'HP';
        const k = Math.abs(n) % 100;
        const d = k % 10;
        if (k > 10 && k < 20) return forms[2];
        if (d === 1) return forms[0];
        if (d >= 2 && d <= 4) return forms[1];
        return forms[2];
    }

    labTargetsFor(weapon) {
        const targets = (this.getData().lab || {}).targets || [];
        return weapon ? targets.filter(t => t.game === weapon.game) : targets;
    }

    damageRule(weapon, target) {
        if (target.immuneNote) return { dmg: 0, note: target.immuneNote };
        if (target.rocketOnly) return weapon.rocket ? { dmg: 1, note: 'Каждая ракета считается за одно попадание' } : { dmg: 0, note: 'Не пробивает: берут только ракеты' };
        if (weapon.combineKill && target.combine) return { dmg: 1000, note: 'Сверхзаряд: солдат погибает в захвате' };
        if (weapon.bullet && target.bulletMult) return { dmg: Math.round(weapon.damage * target.bulletMult), note: `Пули наносят ${Math.round(target.bulletMult * 100)}% урона` };
        return { dmg: weapon.damage, note: 'Полный урон' };
    }

    computeBallistics() {
        const lab = this.getData().lab || { arsenal: [], targets: [] };
        const weapon = (lab.arsenal || []).find(w => w.id === this.labWeaponId) || (lab.arsenal || [])[0];
        const pool = this.labTargetsFor(weapon);
        const target = pool.find(t => t.id === this.labTargetId) || pool[0];
        if (!weapon || !target) return null;
        const rule = this.damageRule(weapon, target);
        const effectiveDamage = rule.dmg;
        const armorModifierText = rule.note;
        if (effectiveDamage <= 0) {
            return { weapon, target, effectiveDamage: 0, armorModifierText, hitsToKill: 0, timeToEliminate: null, hits: [], immune: true };
        }
        const hitsToKill = Math.max(1, Math.ceil(target.hp / effectiveDamage));
        const timeToEliminate = ((hitsToKill - 1) * weapon.cooldownSec).toFixed(2);
        const hits = [];
        let hp = target.hp;
        for (let i = 1; i <= hitsToKill; i++) {
            hp = Math.max(0, hp - effectiveDamage);
            hits.push({ n: i, left: hp });
        }
        return { weapon, target, effectiveDamage, armorModifierText, hitsToKill, timeToEliminate, hits, immune: false };
    }

    exportLabReport() {
        const calc = this.computeBallistics();
        if (!calc) return;
        const rule = '='.repeat(64);
        const lines = [
            rule,
            'VALVE SOFTWARE  ИСПЫТАТЕЛЬНАЯ КАМЕРА λ',
            'ПРОТОКОЛ ИСПЫТАНИЯ',
            rule,
            `СНАРЯД:   ${calc.weapon.name} (${calc.weapon.game})`,
            `УРОН:     ${calc.weapon.damage}, интервал ${calc.weapon.cooldownSec} с`,
            `ПИТАНИЕ:  ${calc.weapon.ammoType}`,
            '',
            `ЦЕЛЬ:     ${calc.target.name} (${calc.target.game})`,
            `ЗАПАС:    ${calc.target.hp} ${this.unitFor(calc.target, calc.target.hp)}`,
            '',
            calc.immune ? `УРОН ПО ЦЕЛИ: нет (${calc.armorModifierText})` : `УРОН ПО ЦЕЛИ: ${calc.effectiveDamage} за попадание (${calc.armorModifierText})`,
            ...calc.hits.map(h => `  попадание ${String(h.n).padStart(2)}: осталось ${h.left} ${this.unitFor(calc.target, h.left)}`),
            calc.immune ? 'ИТОГ: цель этим не уничтожить' : `ИТОГ: ${calc.hitsToKill} попад., не быстрее ${calc.timeToEliminate} с`,
            '',
            ...this.wrapText(`СНАРЯД: ${calc.weapon.notes}`, 64),
            ...this.wrapText(`ЦЕЛЬ: ${calc.target.threatNote}`, 64),
            rule
        ];
        this.saveTextFileToMyDocs('VALVE_LAB_REPORT.TXT', lines.join('\r\n'));
    }

    exportAtlasGuide(sectorId) {
        const atlas = (this.getData().lab || {}).atlas || [];
        const sec = atlas.find(s => s.id === (sectorId || this.atlasSectorId)) || atlas[0];
        if (!sec) return;
        const rule = '='.repeat(64);
        const lines = [
            rule,
            `VALVE SOFTWARE  АТЛАС УРОВНЕЙ  ${sec.code}`,
            `${sec.project}: ${sec.title}`,
            rule,
            '',
            'МАРШРУТ:',
            ...sec.rooms.map((r, i) => `  ${String((sec.firstNumber || 1) + i).padStart(2)}. ${r}`),
            '',
            'СНАРЯЖЕНИЕ:',
            ...this.wrapText(sec.startKit, 62).map(l => '  ' + l),
            '',
            'ОПАСНОСТИ:',
            ...this.wrapText(sec.hazards, 62).map(l => '  ' + l),
            '',
            'СОВЕТ:',
            ...this.wrapText(sec.tacticalNote, 62).map(l => '  ' + l),
            '',
            rule,
            `${VLV_BASE}/lab`
        ];
        this.saveTextFileToMyDocs(`VALVE_ATLAS_${sec.code.replace(/[^a-zA-Z0-9]/g, '_')}.TXT`, lines.join('\r\n'));
    }

    readStore(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const val = JSON.parse(raw);
            return val == null ? fallback : val;
        } catch (e) {
            return fallback;
        }
    }

    writeStore(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
    }

    getPollState() {
        const poll = this.getData().poll || { question: '', options: [] };
        const saved = this.readStore(this.pollStorageKey, {});
        const extra = saved.extraVotes || {};
        const options = (poll.options || []).map(o => ({ ...o, votes: o.baseVotes + (Number(extra[o.id]) || 0) }));
        const totalVotes = options.reduce((s, o) => s + o.votes, 0) || 1;
        return { question: poll.question, options, votedId: saved.votedId || null, totalVotes };
    }

    votePoll(optionId) {
        const state = this.getPollState();
        if (!optionId || !state.options.some(o => o.id === optionId)) return;
        const extra = {};
        state.options.forEach(o => {
            if (o.votes > o.baseVotes) extra[o.id] = o.votes - o.baseVotes;
        });
        extra[optionId] = (extra[optionId] || 0) + 1;
        this.writeStore(this.pollStorageKey, { votedId: optionId, extraVotes: extra });
        if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
        this.rerenderInPlace();
    }

    resetPoll() {
        try { localStorage.removeItem(this.pollStorageKey); } catch (e) { }
        this.rerenderInPlace();
    }

    getArticleComments(articleId) {
        const store = this.readStore(this.commentsStorageKey, {});
        return Array.isArray(store[articleId]) ? store[articleId] : [];
    }

    findInput(id) {
        if (this.lastContainer && typeof this.lastContainer.querySelector === 'function') {
            const found = this.lastContainer.querySelector(`#${id}`);
            if (found) return found;
        }
        return null;
    }

    fieldValue(direct, id) {
        if (direct !== undefined) return String(direct);
        const el = this.findInput(id);
        return el && el.value ? String(el.value) : '';
    }

    siteDate() {
        return (this.getData().studio || {}).siteDate || '2000-10-16';
    }

    submitComment(articleId, directAuthor, directText) {
        const author = this.fieldValue(directAuthor, 'valve-comment-name').trim().slice(0, 40) || 'Гость';
        const text = this.fieldValue(directText, 'valve-comment-text').trim().slice(0, 1200);
        if (!text) {
            this.noticeMessage = 'Отзыв пустой. Напишите хотя бы одно предложение.';
            this.rerenderInPlace();
            return false;
        }
        const store = this.readStore(this.commentsStorageKey, {});
        if (!Array.isArray(store[articleId])) store[articleId] = [];
        store[articleId].unshift({ author, date: this.siteDate(), text });
        this.writeStore(this.commentsStorageKey, store);
        this.noticeMessage = 'Отзыв добавлен.';
        this.rerenderInPlace();
        return true;
    }

    getLetters() {
        const initial = ((this.getData().cabal || {}).initialLetters) || [];
        const custom = this.readStore(this.lettersStorageKey, []);
        return [...(Array.isArray(custom) ? custom : []), ...initial];
    }

    letterTopics() {
        return ((this.getData().cabal || {}).letterTopics) || [];
    }

    submitLetter(directAuthor, directTopic, directQuestion) {
        const author = this.fieldValue(directAuthor, 'valve-letter-name').trim().slice(0, 60) || 'Читатель';
        const topics = this.letterTopics();
        const topicRaw = this.fieldValue(directTopic, 'valve-letter-topic').trim();
        const topic = topics.find(t => t.id === topicRaw || t.label === topicRaw) || topics[topics.length - 1] || { label: 'Другое', reply: '' };
        const question = this.fieldValue(directQuestion, 'valve-letter-text').trim().slice(0, 1500);
        if (!question) {
            this.noticeMessage = 'Письмо пустое. Напишите вопрос в поле «Текст письма».';
            this.rerenderInPlace();
            return false;
        }
        const custom = this.readStore(this.lettersStorageKey, []);
        const list = Array.isArray(custom) ? custom : [];
        list.unshift({ author, date: this.siteDate(), topic: topic.label, question, reply: topic.reply });
        this.writeStore(this.lettersStorageKey, list);
        this.noticeMessage = 'Письмо отправлено. Ответ опубликован ниже.';
        this.rerenderInPlace();
        return true;
    }

    submitSearch(directQuery) {
        const q = this.fieldValue(directQuery, 'valve-search-input').trim();
        this.searchQuery = q;
        this.navigate(`${VLV_BASE}/search?q=${encodeURIComponent(q)}`);
    }

    link(path, label, cls) {
        return `<a${cls ? ` class="${cls}"` : ''} data-url="${this.escapeHtml(this.url(path))}" href="#">${label}</a>`;
    }

    renderWheel(size) {
        const spokes = [0, 72, 144, 216, 288].map(a => {
            const r = a * Math.PI / 180;
            const x = (40 + Math.sin(r) * 30).toFixed(1);
            const y = (40 - Math.cos(r) * 30).toFixed(1);
            return `<line x1="40" y1="40" x2="${x}" y2="${y}" stroke="#CC3300" stroke-width="7"/><line x1="40" y1="40" x2="${x}" y2="${y}" stroke="#FF6633" stroke-width="2"/>`;
        }).join('');
        return `<svg width="${size}" height="${size}" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="33" fill="none" stroke="#661900" stroke-width="12"/>
            <circle cx="40" cy="40" r="33" fill="none" stroke="#CC3300" stroke-width="8"/>
            <circle cx="40" cy="40" r="33" fill="none" stroke="#881F00" stroke-width="8" stroke-dasharray="2 4"/>
            <circle cx="40" cy="40" r="30" fill="none" stroke="#FF6633" stroke-width="1"/>
            ${spokes}
            <circle cx="40" cy="40" r="10" fill="#CC3300" stroke="#661900" stroke-width="2"/>
            <polygon points="40,34 45,37 45,43 40,46 35,43 35,37" fill="#999999" stroke="#333333" stroke-width="1"/>
            <circle cx="40" cy="40" r="2" fill="#333333"/>
        </svg>`;
    }

    renderMasthead() {
        const flanges = [214, 398, 560].map(x => `
            <rect x="${x}" y="58" width="10" height="34" fill="#5C5C4C" stroke="#2B2B22" stroke-width="1"/>
            <rect x="${x + 3}" y="61" width="4" height="4" fill="#2B2B22"/><rect x="${x + 3}" y="85" width="4" height="4" fill="#2B2B22"/>`).join('');
        return `<svg class="vlv-mast-svg" width="600" height="112" viewBox="0 0 600 112" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Valve Software">
            <rect x="0" y="0" width="600" height="112" fill="#3A3A3A"/>
            <rect x="0" y="0" width="600" height="2" fill="#555555"/>
            <line x1="300" y1="0" x2="300" y2="46" stroke="#2A2A2A" stroke-width="1"/>
            <rect x="72" y="64" width="528" height="22" fill="#7A7A66"/>
            <rect x="72" y="64" width="528" height="4" fill="#A6A690"/>
            <rect x="72" y="80" width="528" height="6" fill="#55554A"/>
            ${flanges}
            <rect x="584" y="54" width="16" height="42" fill="#5C5C4C" stroke="#2B2B22" stroke-width="1"/>
            <g transform="translate(6,16)">${this.renderWheel(84).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>
            <text x="108" y="44" font-family="Arial Black, Arial, sans-serif" font-size="38" font-weight="900" fill="#FFFFFF" letter-spacing="3">VALVE</text>
            <text x="112" y="58" font-family="Verdana, Arial, sans-serif" font-size="10" font-weight="bold" fill="#CC9933" letter-spacing="6">SOFTWARE</text>
            <text x="318" y="26" font-family="Verdana, Arial, sans-serif" font-size="10" fill="#BBBBAA">Kirkland, Washington</text>
            <text x="318" y="40" font-family="Verdana, Arial, sans-serif" font-size="10" fill="#888877">Half-Life 98, Half-Life 2, Steam, Dota 98</text>
        </svg>`;
    }

    renderGauge() {
        const count = this.installedCount();
        const angle = -135 + count * (270 / 4);
        const ticks = [0, 1, 2, 3, 4].map(i => {
            const a = (-135 + i * 67.5) * Math.PI / 180;
            const x1 = (48 + Math.sin(a) * 28).toFixed(1);
            const y1 = (48 - Math.cos(a) * 28).toFixed(1);
            const x2 = (48 + Math.sin(a) * 34).toFixed(1);
            const y2 = (48 - Math.cos(a) * 34).toFixed(1);
            const tx = (48 + Math.sin(a) * 21).toFixed(1);
            const ty = (48 - Math.cos(a) * 21 + 3).toFixed(1);
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222222" stroke-width="2"/><text x="${tx}" y="${ty}" font-family="Verdana, Arial" font-size="8" font-weight="bold" fill="#222222" text-anchor="middle">${i}</text>`;
        }).join('');
        const rad = angle * Math.PI / 180;
        const nx = (48 + Math.sin(rad) * 30).toFixed(1);
        const ny = (48 - Math.cos(rad) * 30).toFixed(1);
        return `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Установлено продуктов Valve: ${count} из 4">
            <circle cx="48" cy="48" r="44" fill="#664411"/>
            <circle cx="48" cy="48" r="41" fill="#CC9933"/>
            <circle cx="48" cy="48" r="37" fill="#EEEEDD" stroke="#664411" stroke-width="1"/>
            <path d="M ${(48 + Math.sin(67.5 * Math.PI / 180) * 34).toFixed(1)} ${(48 - Math.cos(67.5 * Math.PI / 180) * 34).toFixed(1)} A 34 34 0 0 1 ${(48 + Math.sin(135 * Math.PI / 180) * 34).toFixed(1)} ${(48 - Math.cos(135 * Math.PI / 180) * 34).toFixed(1)}" fill="none" stroke="#339933" stroke-width="4"/>
            ${ticks}
            <text x="48" y="70" font-family="Verdana, Arial" font-size="6" fill="#444444" text-anchor="middle">VALVE</text>
            <line x1="48" y1="48" x2="${nx}" y2="${ny}" stroke="#CC0000" stroke-width="3"/>
            <circle cx="48" cy="48" r="5" fill="#333333"/>
        </svg>`;
    }

    renderHeader(activePage) {
        const plates = [
            ['home', '', 'Главная'],
            ['games', '/games', 'Продукты'],
            ['news', '/news', 'Новости'],
            ['lab', '/lab', 'Стенд λ'],
            ['company', '/company', 'Компания'],
            ['letters', '/letters', 'Почта']
        ];
        const owner = { game: 'games', article: 'news' };
        const current = owner[activePage] || activePage;
        const count = this.installedCount();
        return `
            <tr>
                <td class="vlv-mast">
                    <table class="vlv-mast-row" cellspacing="0" cellpadding="0"><tr>
                        <td class="vlv-mast-art"><a data-url="${VLV_BASE}" href="#" title="Valve Software: главная">${this.renderMasthead()}</a></td>
                        <td class="vlv-mast-gauge">
                            <a data-url="${VLV_BASE}/games" href="#" title="Какие продукты Valve установлены на этом компьютере">${this.renderGauge()}</a>
                            <div class="vlv-gauge-cap">Установлено<br><b>${count} из 4</b></div>
                        </td>
                    </tr></table>
                </td>
            </tr>
            <tr>
                <td class="vlv-navrow">
                    <table cellspacing="0" cellpadding="0" class="vlv-nav-table"><tr>
                        <td class="vlv-plates">${plates.map(([id, path, label]) => this.link(path, label, `vlv-plate${current === id ? ' is-on' : ''}`)).join('')}</td>
                        <td class="vlv-searchcell">
                            <form class="vlv-search" data-vlv="search">
                                <input id="valve-search-input" type="text" size="14" maxlength="60" value="${this.escapeHtml(this.searchQuery)}" title="Поиск по сайту">
                                <input type="submit" class="vlv-btn" value="Найти">
                            </form>
                        </td>
                    </tr></table>
                </td>
            </tr>`;
    }

    renderNotice() {
        if (!this.noticeMessage) return '';
        const msg = this.noticeMessage;
        this.noticeMessage = '';
        return `<div class="vlv-notice">${window.webGif ? window.webGif('info') : ''} ${this.escapeHtml(msg)}</div>`;
    }

    renderFooter() {
        const studio = this.getData().studio || {};
        return `
            <tr>
                <td class="vlv-foot">
                    <div class="vlv-foot-links">
                        ${this.link('', 'Главная')} | ${this.link('/games', 'Продукты')} | ${this.link('/news', 'Новости')} | ${this.link('/lab', 'Стенд λ')} | ${this.link('/company', 'Компания')} | ${this.link('/letters', 'Почта')} | <a data-url="http://www.steampowered.com" href="#">Steam</a>
                    </div>
                    <table class="vlv-foot-row" cellspacing="0" cellpadding="0"><tr>
                        <td class="vlv-foot-legal">
                            &copy; 1996-2000 Valve Software, L.L.C. Все права защищены.<br>
                            Half-Life, логотип λ и Steam являются товарными знаками Valve Software.<br>
                            Письма: <a href="mailto:letters@valvesoftware.com">letters@valvesoftware.com</a>. Пресса: <a href="mailto:press@valvesoftware.com">press@valvesoftware.com</a>.<br>
                            Лучше всего смотреть в Microslop Internet Explorer 5.0 при 800x600.
                        </td>
                        <td class="vlv-foot-buttons">
                            <a class="vlv-88" data-url="http://www.steampowered.com" href="#"><span class="vlv-88-steam">STEAM</span><span class="vlv-88-sub">get it now</span></a>
                            <a class="vlv-88 vlv-88-hl" data-url="${VLV_BASE}/game?id=hl2" href="#"><span class="vlv-88-l">λ</span><span class="vlv-88-sub">HALF-LIFE 2</span></a>
                        </td>
                    </tr></table>
                    <div class="vlv-foot-date">Обновлено ${this.escapeHtml(this.dateShort(studio.siteDate))}</div>
                </td>
            </tr>`;
    }

    productButton(id, st, extraCls) {
        return `<button type="button" class="vlv-btn vlv-btn-go${extraCls ? ' ' + extraCls : ''}" data-vlv="product" data-id="${id}"${st.disabled ? ' disabled' : ''}>${this.escapeHtml(st.button)}</button>`;
    }

    renderPoll() {
        const st = this.getPollState();
        if (st.votedId) {
            const rows = st.options.map(o => {
                const pct = Math.round(o.votes / st.totalVotes * 100);
                return `<tr><td class="vlv-poll-label">${o.id === st.votedId ? '<b>' + this.escapeHtml(o.label) + '</b>' : this.escapeHtml(o.label)}</td></tr>
                    <tr><td><span class="vlv-poll-bar" style="width:${Math.max(2, pct)}px"></span> ${pct}%</td></tr>`;
            }).join('');
            return `<div class="vlv-rail-box">
                <div class="vlv-rail-h">Опрос</div>
                <div class="vlv-poll-q">${this.escapeHtml(st.question)}</div>
                <table class="vlv-poll-res" cellspacing="0">${rows}</table>
                <div class="vlv-poll-foot">Ваш голос учтён. Всего: ${st.totalVotes}.<br><a href="#" data-vlv="pollReset">Переголосовать</a></div>
            </div>`;
        }
        return `<div class="vlv-rail-box">
            <div class="vlv-rail-h">Опрос</div>
            <div class="vlv-poll-q">${this.escapeHtml(st.question)}</div>
            ${st.options.map((o, i) => `<label class="vlv-poll-opt"><input type="radio" name="vlv-poll" value="${o.id}"${i === 0 ? ' checked' : ''}> ${this.escapeHtml(o.label)}</label>`).join('')}
            <button type="button" class="vlv-btn" data-vlv="vote">Голосовать</button>
        </div>`;
    }

    renderHome() {
        const data = this.getData();
        const projects = data.projects || [];
        const rail = `
            <div class="vlv-rail-box">
                <div class="vlv-rail-h">Продукты</div>
                ${projects.map(p => {
                    const st = this.getProjectStatusInfo(p.id);
                    return `<div class="vlv-rail-prod">
                        <span class="vlv-ico16">${window.Icons && window.Icons[p.icon] ? window.Icons[p.icon] : ''}</span>
                        ${this.link(`/game?id=${p.id}`, this.escapeHtml(p.title))}
                        <div class="vlv-rail-st vlv-st-${st.state}">${this.escapeHtml(st.state === 'installed' ? 'установлено' : (p.id === 'steam' ? 'бесплатно' : p.priceText))}</div>
                    </div>`;
                }).join('')}
            </div>
            ${this.renderPoll()}
            <div class="vlv-rail-box">
                <div class="vlv-rail-h">Вакансии</div>
                <div class="vlv-rail-text">Ищем в Киркланд: ${((data.cabal || {}).jobs || []).map(j => this.escapeHtml(j.role.toLowerCase())).join(', ')}.</div>
                ${this.link('/company', 'Подробнее')}
            </div>`;
        const feature = data.feature || {};
        const fproj = this.project(feature.projectId) || projects[0];
        const fst = fproj ? this.getProjectStatusInfo(fproj.id) : null;
        const briefs = (data.briefs || []).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 9);
        const log = briefs.map(b => {
            const art = b.article ? this.article(b.article) : null;
            return `<tr>
                <td class="vlv-log-date">${this.dateShort(b.date)}</td>
                <td class="vlv-log-body">
                    <div class="vlv-log-title">${this.escapeHtml(b.title)}${b.isNew ? ' <span class="web-new">NEW!</span>' : ''}</div>
                    <div class="vlv-log-text">${this.escapeHtml(b.text)}</div>
                    ${art ? `<div class="vlv-log-more">${this.link(`/article?id=${art.id}`, 'Полный текст пресс-релиза')}</div>` : ''}
                    <div class="vlv-log-cat">${this.escapeHtml(b.cat)}</div>
                </td>
            </tr>`;
        }).join('');
        return `
            <table class="vlv-home" cellspacing="0" cellpadding="0"><tr>
                <td class="vlv-rail">${rail}</td>
                <td class="vlv-main">
                    ${fproj ? `<table class="vlv-feature" cellspacing="0" cellpadding="0"><tr>
                        <td class="vlv-feature-shot"><a data-url="${VLV_BASE}/game?id=${fproj.id}" href="#"><img src="${this.escapeHtml(feature.shot)}" width="256" height="192" alt="${this.escapeHtml(fproj.title)}"></a></td>
                        <td class="vlv-feature-text">
                            <div class="vlv-feature-kicker">${this.escapeHtml(feature.kicker)}</div>
                            <h1 class="vlv-feature-title">${this.escapeHtml(feature.title)}</h1>
                            <p>${this.escapeHtml(feature.text)}</p>
                            <div class="vlv-feature-st vlv-st-${fst.state}">${this.escapeHtml(fst.text)}</div>
                            ${this.productButton(fproj.id, fst)} ${this.link(`/game?id=${fproj.id}`, 'Об игре')}
                        </td>
                    </tr></table>` : ''}
                    <h2 class="vlv-h2">Новости</h2>
                    <table class="vlv-log" cellspacing="0" cellpadding="0">${log}</table>
                    <div class="vlv-more">${this.link('/news', 'Все новости и пресс-релизы')}</div>
                </td>
            </tr></table>`;
    }

    renderGamesList() {
        const data = this.getData();
        const projects = data.projects || [];
        const rows = projects.map(p => {
            const st = this.getProjectStatusInfo(p.id);
            const thumb = p.shots && p.shots[0] ? `<img src="${this.escapeHtml(p.shots[0].src)}" width="160" height="120" alt="${this.escapeHtml(p.title)}">` : `<div class="vlv-thumb-steam">${window.Icons && window.Icons.steam ? window.Icons.steam : ''}<span>STEAM</span></div>`;
            return `<tr>
                <td class="vlv-ledger-thumb"><a data-url="${VLV_BASE}/game?id=${p.id}" href="#">${thumb}</a></td>
                <td class="vlv-ledger-info">
                    <div class="vlv-ledger-title">${this.link(`/game?id=${p.id}`, this.escapeHtml(p.title))}</div>
                    <div class="vlv-ledger-kind">${this.escapeHtml(p.kind)}</div>
                    <p>${this.escapeHtml(p.short)}</p>
                    <table class="vlv-facts-mini" cellspacing="0"><tr>
                        <td>Файл</td><td><code>${this.escapeHtml(p.exePath)}</code></td>
                    </tr><tr>
                        <td>Объём</td><td>${this.escapeHtml(p.sizeText)}</td>
                    </tr></table>
                </td>
                <td class="vlv-ledger-buy">
                    <div class="vlv-ledger-price">${this.escapeHtml(p.priceText)}</div>
                    <div class="vlv-ledger-st vlv-st-${st.state}">${this.escapeHtml(st.text)}</div>
                    ${this.productButton(p.id, st)}
                </td>
            </tr>`;
        }).join('');
        const specRow = (label, key) => `<tr><th>${label}</th>${projects.map(p => `<td>${this.escapeHtml((p.specs || {})[key])}</td>`).join('')}</tr>`;
        return `
            <div class="vlv-pad">
                <h1 class="vlv-h1">Продукты Valve</h1>
                <p class="vlv-intro">Четыре продукта для Win 98. Игры продаются и обновляются только через Steam: купите игру в клиенте, и он сам скачает и установит её в C:\\Games. Сам клиент Steam бесплатен, его установщик лежит на <a data-url="http://www.steampowered.com" href="#">www.steampowered.com</a>.</p>
                <table class="vlv-ledger" cellspacing="0" cellpadding="0">${rows}</table>
                <h2 class="vlv-h2">Что нужно компьютеру</h2>
                <table class="vlv-matrix" cellspacing="0">
                    <tr><th></th>${projects.map(p => `<th>${this.link(`/game?id=${p.id}`, this.escapeHtml(p.title))}</th>`).join('')}</tr>
                    ${specRow('Процессор', 'cpu')}
                    ${specRow('Память', 'ram')}
                    ${specRow('Система', 'os')}
                    ${specRow('Видео', 'video')}
                    ${specRow('Место на диске', 'disk')}
                    ${specRow('Связь', 'net')}
                </table>
            </div>`;
    }

    renderKeys(keys) {
        return String(keys).split(' / ').map(k => `<kbd>${this.escapeHtml(k)}</kbd>`).join(' ');
    }

    renderSteamSetup(proj, st) {
        const setup = this.getData().steamSetup || { lines: [], mirrors: [] };
        const steps = [
            ['none', 'Скачайте SteamInstall.exe', 'Нажмите «Загрузить Steam» на www.steampowered.com. Файл ляжет в «Мои документы\\Downloads».'],
            ['downloaded', 'Запустите установщик', 'Мастер установки скопирует клиент в C:\\Program Files\\Steam и создаст значок на рабочем столе.'],
            ['installed', 'Войдите и выберите игру', 'В окне «Игры» купите игру. Клиент сам скачает её и установит в C:\\Games.']
        ];
        const order = { none: 0, downloaded: 1, installed: 2 };
        const now = order[st.state] || 0;
        const sizeKbit = (setup.sizeMb || 1.3) * 1024 * 8;
        const fmt = sec => sec >= 60 ? `${Math.floor(sec / 60)} мин ${String(Math.round(sec % 60)).padStart(2, '0')} с` : `${Math.max(1, Math.round(sec))} с`;
        return `
            <h2 class="vlv-h2">Как установить Steam</h2>
            <table class="vlv-steps" cellspacing="0">${steps.map(([key, title, text], i) => `
                <tr class="${i < now ? 'is-done' : (i === now ? 'is-now' : '')}">
                    <td class="vlv-step-n">${i + 1}</td>
                    <td><b>${title}</b>${i < now ? ' <span class="vlv-done">готово</span>' : ''}<br>${text}</td>
                </tr>`).join('')}
            </table>
            <h2 class="vlv-h2">Сколько качать установщик</h2>
            <table class="vlv-data" cellspacing="0">
                <tr><th>Подключение</th><th>Реальная скорость</th><th>SteamInstall.exe, ${this.escapeHtml(String(setup.sizeMb || 1.3).replace('.', ','))} МБ</th></tr>
                ${(setup.lines || []).map(l => `<tr><td>${this.escapeHtml(l.label)}</td><td>${l.kbps} кбит/с</td><td>${fmt(sizeKbit / l.kbps)}</td></tr>`).join('')}
            </table>
            <p class="vlv-small">${this.escapeHtml(setup.note || '')}</p>
            <h2 class="vlv-h2">Серверы загрузки</h2>
            <table class="vlv-data" cellspacing="0">
                <tr><th>Сервер</th><th>Где</th></tr>
                ${(setup.mirrors || []).map(m => `<tr><td><code>${this.escapeHtml(m.name)}</code></td><td>${this.escapeHtml(m.where)}</td></tr>`).join('')}
            </table>`;
    }

    renderGameDetail(projectId) {
        const data = this.getData();
        const proj = this.project(projectId) || this.project('hl2') || (data.projects || [])[0];
        if (!proj) return this.renderGamesList();
        const st = this.getProjectStatusInfo(proj.id);
        const shots = proj.shots || [];
        const shotIdx = Math.min(Math.max(0, shots.length - 1), Math.max(0, Number(this.selectedShots[proj.id]) || 0));
        const shot = shots[shotIdx];
        const switcher = (data.projects || []).map(p => p.id === proj.id ? `<b>${this.escapeHtml(p.title)}</b>` : this.link(`/game?id=${p.id}`, this.escapeHtml(p.title))).join(' | ');
        const related = (data.news || []).filter(n => n.projectId === proj.id || n.projectId === 'all');
        const tables = proj.tables || [];
        const visual = shot ? `
            <div class="vlv-shot">
                <img src="${this.escapeHtml(shot.src)}" width="320" height="240" alt="${this.escapeHtml(shot.caption)}">
                <div class="vlv-shot-cap">${this.escapeHtml(shot.caption)}</div>
                <div class="vlv-shot-btns">${shots.map((s, i) => `<button type="button" class="vlv-btn${i === shotIdx ? ' is-on' : ''}" data-vlv="shot" data-id="${proj.id}" data-n="${i}">Кадр ${i + 1}</button>`).join(' ')}</div>
            </div>` : `<div class="vlv-steam-shot">${window.Icons && window.Icons.steam ? window.Icons.steam : ''}<div>STEAM</div><span>${this.escapeHtml(proj.short)}</span></div>`;
        return `
            <div class="vlv-pad">
                <div class="vlv-switch">${switcher}</div>
                <table class="vlv-prod-head" cellspacing="0" cellpadding="0"><tr>
                    <td class="vlv-ico32">${window.Icons && window.Icons[proj.icon] ? window.Icons[proj.icon] : ''}</td>
                    <td><h1 class="vlv-h1">${this.escapeHtml(proj.title)}</h1><div class="vlv-prod-kind">${this.escapeHtml(proj.kind)}</div></td>
                </tr></table>
                <table class="vlv-prod" cellspacing="0" cellpadding="0"><tr>
                    <td class="vlv-prod-visual">${visual}</td>
                    <td class="vlv-prod-side">
                        <div class="vlv-buybox">
                            <div class="vlv-buy-price">${this.escapeHtml(proj.priceText)}</div>
                            <div class="vlv-buy-st vlv-st-${st.state}">${this.escapeHtml(st.text)}</div>
                            ${this.productButton(proj.id, st)}
                            ${st.steamLink ? `<div class="vlv-buy-alt"><a href="#" data-vlv="steamPage" data-id="${proj.id}">Страница игры в Steam</a></div>` : ''}
                            ${proj.id === 'steam' ? '' : '<div class="vlv-buy-note">Продаётся только в клиенте Steam.</div>'}
                        </div>
                        <table class="vlv-facts" cellspacing="0">
                            <tr><th>Файл</th><td><code>${this.escapeHtml(proj.exePath)}</code></td></tr>
                            <tr><th>Объём</th><td>${this.escapeHtml(proj.sizeText)}</td></tr>
                            <tr><th>Разработчик</th><td>${this.escapeHtml(proj.maker)}</td></tr>
                            <tr><th>Движок</th><td>${this.escapeHtml(proj.engine)}</td></tr>
                            <tr><th>Экран</th><td>${this.escapeHtml(proj.modes)}</td></tr>
                        </table>
                    </td>
                </tr></table>
                <h2 class="vlv-h2">${proj.id === 'steam' ? 'О программе' : 'Об игре'}</h2>
                ${(proj.about || []).map(p => `<p>${this.escapeHtml(p)}</p>`).join('')}
                <ul class="vlv-list">${(proj.features || []).map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}</ul>
                ${proj.id === 'steam' ? this.renderSteamSetup(proj, st) : ''}
                ${tables.map(t => `<h2 class="vlv-h2">${this.escapeHtml(t.title)}</h2>
                <table class="vlv-data" cellspacing="0">
                    <tr>${t.cols.map(c => `<th>${this.escapeHtml(c)}</th>`).join('')}</tr>
                    ${t.rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="vlv-data-name"' : ''}>${this.escapeHtml(c)}</td>`).join('')}</tr>`).join('')}
                </table>`).join('')}
                ${(proj.controls || []).length ? `<h2 class="vlv-h2">Управление</h2>
                <table class="vlv-keys" cellspacing="0">${proj.controls.map(([k, a]) => `<tr><td class="vlv-keys-k">${this.renderKeys(k)}</td><td>${this.escapeHtml(a)}</td></tr>`).join('')}</table>` : ''}
                <h2 class="vlv-h2">Системные требования</h2>
                <table class="vlv-facts vlv-facts-wide" cellspacing="0">
                    <tr><th>Процессор</th><td>${this.escapeHtml(proj.specs.cpu)}</td></tr>
                    <tr><th>Память</th><td>${this.escapeHtml(proj.specs.ram)}</td></tr>
                    <tr><th>Система</th><td>${this.escapeHtml(proj.specs.os)}</td></tr>
                    <tr><th>Видео</th><td>${this.escapeHtml(proj.specs.video)}</td></tr>
                    <tr><th>Место на диске</th><td>${this.escapeHtml(proj.specs.disk)}</td></tr>
                    <tr><th>Связь</th><td>${this.escapeHtml(proj.specs.net)}</td></tr>
                </table>
                ${related.length ? `<h2 class="vlv-h2">Пресс-релизы</h2><ul class="vlv-list">${related.map(n => `<li>${this.dateShort(n.date)} ${this.link(`/article?id=${n.id}`, this.escapeHtml(n.title))}</li>`).join('')}</ul>` : ''}
            </div>`;
    }

    newsEntries() {
        const data = this.getData();
        const arts = (data.news || []).map(n => ({ date: n.date, cat: n.category, title: n.title, text: n.summary, article: n.id, code: n.code, isRelease: true }));
        const briefs = (data.briefs || []).filter(b => !b.article).map(b => ({ ...b }));
        return [...arts, ...briefs].sort((a, b) => b.date.localeCompare(a.date));
    }

    renderNewsArchive() {
        const filter = this.newsFilter;
        const entries = this.newsEntries().filter(e => filter === 'all' || e.cat === filter);
        const filters = ['all', ...VLV_CATEGORIES].map(c => {
            const label = c === 'all' ? 'Все' : c;
            return c === filter ? `<b>[${this.escapeHtml(label)}]</b>` : `<a href="#" data-vlv="filter" data-cat="${this.escapeHtml(c)}">${this.escapeHtml(label)}</a>`;
        }).join(' ');
        const groups = [];
        entries.forEach(e => {
            const p = this.dateParts(e.date);
            const key = `${VLV_MONTH_TITLES[p.m]} ${p.y}`;
            let g = groups.find(x => x.key === key);
            if (!g) {
                g = { key, items: [] };
                groups.push(g);
            }
            g.items.push(e);
        });
        return `
            <div class="vlv-pad">
                <h1 class="vlv-h1">Новости и пресс-релизы</h1>
                <div class="vlv-filters">Рубрика: ${filters}</div>
                ${groups.length ? groups.map(g => `
                    <h3 class="vlv-month">${g.key}</h3>
                    <table class="vlv-archive" cellspacing="0">
                        ${g.items.map(e => `<tr>
                            <td class="vlv-arch-date">${this.dateShort(e.date)}</td>
                            <td class="vlv-arch-cat">${this.escapeHtml(e.cat)}</td>
                            <td>
                                ${e.isRelease ? `<span class="vlv-tag">пресс-релиз ${this.escapeHtml(e.code)}</span><br>${this.link(`/article?id=${e.article}`, '<b>' + this.escapeHtml(e.title) + '</b>')}` : `<b>${this.escapeHtml(e.title)}</b>`}
                                <div class="vlv-arch-text">${this.escapeHtml(e.text)}</div>
                            </td>
                        </tr>`).join('')}
                    </table>`).join('') : '<p>В этой рубрике пока нет новостей.</p>'}
            </div>`;
    }

    renderArticle(articleId) {
        const data = this.getData();
        const art = this.article(articleId) || (data.news || [])[0];
        if (!art) return this.renderNewsArchive();
        const comments = this.getArticleComments(art.id);
        const proj = this.project(art.projectId);
        const others = (data.news || []).filter(n => n.id !== art.id);
        return `
            <div class="vlv-pad vlv-article-page">
                <div class="vlv-crumbs">${this.link('/news', 'Новости')} &gt; пресс-релиз ${this.escapeHtml(art.code)}</div>
                <table class="vlv-print" cellspacing="0" cellpadding="0"><tr>
                    <td class="vlv-sprocket"></td>
                    <td class="vlv-paper">
                        <div class="vlv-paper-head">
                            <table cellspacing="0" cellpadding="0" class="vlv-paper-row"><tr><td>VALVE SOFTWARE L.L.C.</td><td class="vlv-r">KIRKLAND, WASHINGTON</td></tr>
                            <tr><td>ПРЕСС-РЕЛИЗ ${this.escapeHtml(art.code)}</td><td class="vlv-r">${this.dateShort(art.date)}</td></tr></table>
                        </div>
                        <h1 class="vlv-paper-title">${this.escapeHtml(art.title)}</h1>
                        <div class="vlv-paper-by">${this.escapeHtml(art.author)}, ${this.dateLong(art.date)}</div>
                        ${(art.body || []).map(p => `<p>${this.escapeHtml(p)}</p>`).join('')}
                        <div class="vlv-paper-end">###</div>
                        <div class="vlv-paper-contact">Контакты для прессы: <a href="mailto:press@valvesoftware.com">press@valvesoftware.com</a></div>
                    </td>
                    <td class="vlv-sprocket"></td>
                </tr></table>
                <div class="vlv-print-tools">
                    <button type="button" class="vlv-btn" data-vlv="articleTxt" data-id="${art.id}">Сохранить как .TXT</button>
                    ${proj ? this.link(`/game?id=${proj.id}`, `Страница ${this.escapeHtml(proj.title)}`) : ''}
                </div>
                <h2 class="vlv-h2">Отзывы читателей (${comments.length})</h2>
                ${comments.length ? `<table class="vlv-guest" cellspacing="0">${comments.map(c => `<tr>
                    <td class="vlv-guest-who"><b>${this.escapeHtml(c.author)}</b><br>${this.dateShort(c.date)}</td>
                    <td>${this.escapeHtml(c.text)}</td>
                </tr>`).join('')}</table>` : '<p class="vlv-small">Отзывов пока нет.</p>'}
                <form class="vlv-form" data-vlv="comment" data-id="${art.id}">
                    <table cellspacing="0" class="vlv-form-t">
                        <tr><td><label for="valve-comment-name">Имя</label></td><td><input id="valve-comment-name" type="text" size="28" maxlength="40"></td></tr>
                        <tr><td><label for="valve-comment-text">Отзыв</label></td><td><textarea id="valve-comment-text" rows="4" cols="52" maxlength="1200"></textarea></td></tr>
                        <tr><td></td><td><input type="submit" class="vlv-btn" value="Добавить отзыв"></td></tr>
                    </table>
                </form>
                ${others.length ? `<h2 class="vlv-h2">Другие пресс-релизы</h2><ul class="vlv-list">${others.map(n => `<li>${this.dateShort(n.date)} ${this.link(`/article?id=${n.id}`, this.escapeHtml(n.title))}</li>`).join('')}</ul>` : ''}
            </div>`;
    }

    renderRoute(rooms, firstNumber) {
        const perRow = 4;
        const rows = [];
        for (let i = 0; i < rooms.length; i += perRow) rows.push(rooms.slice(i, i + perRow));
        return `<table class="vlv-route" cellspacing="0" cellpadding="0">${rows.map((row, ri) => `
            <tr>${row.map((room, ci) => {
                const n = ri * perRow + ci + 1;
                const last = n === rooms.length;
                return `<td class="vlv-room"><span class="vlv-room-n">${(firstNumber || 1) + n - 1}</span>${this.escapeHtml(room)}</td>${ci < row.length - 1 ? '<td class="vlv-pipe-h"></td>' : (last ? '' : '<td class="vlv-pipe-end"></td>')}`;
            }).join('')}</tr>`).join('')}
        </table>`;
    }

    renderLab() {
        const lab = this.getData().lab || { arsenal: [], targets: [], atlas: [] };
        const calc = this.computeBallistics();
        const games = [...new Set((lab.arsenal || []).map(w => w.game))];
        const weaponOptions = games.map(g => `<optgroup label="${this.escapeHtml(g)}">${(lab.arsenal || []).filter(w => w.game === g).map(w => `<option value="${w.id}"${w.id === (calc && calc.weapon.id) ? ' selected' : ''}>${this.escapeHtml(w.name)}</option>`).join('')}</optgroup>`).join('');
        const targetOptions = this.labTargetsFor(calc && calc.weapon).map(t => `<option value="${t.id}"${t.id === (calc && calc.target.id) ? ' selected' : ''}>${this.escapeHtml(t.name)} (${t.hp} ${this.escapeHtml(this.unitFor(t, t.hp))})</option>`).join('');
        const atlas = lab.atlas || [];
        const sec = atlas.find(s => s.id === this.atlasSectorId) || atlas[0];
        const cells = 24;
        const barLine = (n, left) => {
            const filled = Math.round(left / calc.target.hp * cells);
            return `${String(n).padStart(2, ' ')}  [${'#'.repeat(filled)}${'.'.repeat(cells - filled)}] ${String(left).padStart(4, ' ')} ${this.unitFor(calc.target, left)}`;
        };
        const bar = !calc ? '' : (calc.immune
            ? `${barLine(' ', calc.target.hp)}\n    цель не повреждена`
            : [barLine(' ', calc.target.hp), ...calc.hits.slice(0, 12).map(h => barLine(h.n, h.left))].join('\n') + (calc.hits.length > 12 ? `\n    ... ещё ${calc.hits.length - 12}` : ''));
        const verdict = !calc ? '' : (calc.immune ? 'ИТОГ: этим не уничтожить' : `ИТОГ: ${calc.hitsToKill} попад., ${calc.timeToEliminate} с`);
        return `
            <div class="vlv-pad">
                <h1 class="vlv-h1">Испытательная камера λ</h1>
                <p class="vlv-intro">Выберите оружие или предмет для гравипушки и противника. Камера посчитает по таблицам урона из игр, сколько попаданий нужно и сколько это займёт времени. Протокол можно распечатать в Блокнот.</p>
                <table class="vlv-console" cellspacing="0" cellpadding="0">
                    <tr>
                        <td class="vlv-console-ctl">
                            <label for="valve-lab-weapon">Снаряд</label>
                            <select id="valve-lab-weapon" data-vlv="weapon">${weaponOptions}</select>
                            <label for="valve-lab-target">Цель</label>
                            <select id="valve-lab-target" data-vlv="target">${targetOptions}</select>
                            <button type="button" class="vlv-btn" data-vlv="labReport">Печать протокола</button>
                        </td>
                        <td class="vlv-console-crt">
                            ${calc ? `<pre class="vlv-crt">ИСПЫТАНИЕ: ${this.escapeHtml(calc.weapon.name)}
ЦЕЛЬ:      ${this.escapeHtml(calc.target.name)}, ${calc.target.hp} ${this.escapeHtml(this.unitFor(calc.target, calc.target.hp))}
УРОН:      ${calc.immune ? 'нет' : calc.effectiveDamage + ' за попадание'}
           ${this.escapeHtml(calc.armorModifierText)}

${this.escapeHtml(bar)}

${this.escapeHtml(verdict)}</pre>` : ''}
                        </td>
                    </tr>
                </table>
                ${calc ? `<table class="vlv-data vlv-data-side" cellspacing="0">
                    <tr><th>Снаряд</th><td>${this.escapeHtml(calc.weapon.ammoType)}. ${this.escapeHtml(calc.weapon.notes)}</td></tr>
                    <tr><th>Цель</th><td>${this.escapeHtml(calc.target.threatNote)}</td></tr>
                </table>` : ''}
                <h2 class="vlv-h2">Атлас уровней</h2>
                <div class="vlv-filters">${atlas.map(s => s.id === (sec && sec.id) ? `<b>[${this.escapeHtml(s.code)}]</b>` : `<a href="#" data-vlv="sector" data-id="${s.id}">${this.escapeHtml(s.code)}</a>`).join(' ')}</div>
                ${sec ? `<div class="vlv-atlas">
                    <div class="vlv-atlas-title">${this.escapeHtml(sec.project)}: ${this.escapeHtml(sec.title)}</div>
                    ${this.renderRoute(sec.rooms || [], sec.firstNumber)}
                    <table class="vlv-data vlv-data-side" cellspacing="0">
                        <tr><th>Снаряжение</th><td>${this.escapeHtml(sec.startKit)}</td></tr>
                        <tr><th>Опасности</th><td>${this.escapeHtml(sec.hazards)}</td></tr>
                        <tr><th>Совет</th><td>${this.escapeHtml(sec.tacticalNote)}</td></tr>
                    </table>
                    <button type="button" class="vlv-btn" data-vlv="atlasTxt" data-id="${sec.id}">Сохранить карту как .TXT</button>
                </div>` : ''}
            </div>`;
    }

    renderCompany() {
        const data = this.getData();
        const cabal = data.cabal || { intro: [], groups: [], jobs: [] };
        return `
            <div class="vlv-pad">
                <h1 class="vlv-h1">О компании</h1>
                ${(data.about || []).map(p => `<p>${this.escapeHtml(p)}</p>`).join('')}
                <h2 class="vlv-h2">История</h2>
                <table class="vlv-history" cellspacing="0">
                    ${(data.history || []).map(h => `<tr><td class="vlv-hist-when">${this.escapeHtml(h.when)}</td><td>${this.escapeHtml(h.text)}</td></tr>`).join('')}
                </table>
                <h2 class="vlv-h2">Как мы работаем: кабалы</h2>
                ${(cabal.intro || []).map(p => `<p>${this.escapeHtml(p)}</p>`).join('')}
                <table class="vlv-data" cellspacing="0">
                    <tr><th>Кабал</th><th>Ведущий</th><th>Чем занят сейчас</th></tr>
                    ${(cabal.groups || []).map(g => `<tr><td class="vlv-data-name">${this.escapeHtml(g.name)}</td><td>${this.escapeHtml(g.lead)}</td><td>${this.escapeHtml(g.focus)}</td></tr>`).join('')}
                </table>
                <h2 class="vlv-h2" id="jobs">Вакансии</h2>
                <p>Резюме и примеры работ присылайте на <a href="mailto:jobs@valvesoftware.com">jobs@valvesoftware.com</a>. Переезд в Киркланд оплачиваем.</p>
                <table class="vlv-ads" cellspacing="0" cellpadding="0"><tr>
                    ${(cabal.jobs || []).map(j => `<td class="vlv-ad">
                        <div class="vlv-ad-role">${this.escapeHtml(j.role)}</div>
                        <div class="vlv-ad-dept">${this.escapeHtml(j.dept)}</div>
                        <p>${this.escapeHtml(j.req)}</p>
                        <a href="mailto:jobs@valvesoftware.com">jobs@valvesoftware.com</a>
                    </td>`).join('')}
                </tr></table>
                <h2 class="vlv-h2">Адрес</h2>
                <p>${this.escapeHtml((data.studio || {}).name)}, ${this.escapeHtml((data.studio || {}).city)}. Письма читателей: ${this.link('/letters', 'раздел «Почта»')} или <a href="mailto:letters@valvesoftware.com">letters@valvesoftware.com</a>.</p>
            </div>`;
    }

    renderLetters() {
        const letters = this.getLetters();
        const topics = this.letterTopics();
        return `
            <div class="vlv-pad">
                <h1 class="vlv-h1">Почта читателей</h1>
                <p class="vlv-intro">Каждую неделю мы отвечаем здесь на письма. Выберите тему, и письмо попадёт к нужной группе. Можно написать и из Outlook Express на <a href="mailto:letters@valvesoftware.com">letters@valvesoftware.com</a>.</p>
                <form class="vlv-form vlv-letter-form" data-vlv="letter">
                    <table cellspacing="0" class="vlv-form-t">
                        <tr><td><label for="valve-letter-name">Имя, город</label></td><td><input id="valve-letter-name" type="text" size="30" maxlength="60"></td></tr>
                        <tr><td><label for="valve-letter-topic">Тема</label></td><td><select id="valve-letter-topic">${topics.map(t => `<option value="${t.id}">${this.escapeHtml(t.label)}</option>`).join('')}</select></td></tr>
                        <tr><td><label for="valve-letter-text">Текст письма</label></td><td><textarea id="valve-letter-text" rows="4" cols="52" maxlength="1500"></textarea></td></tr>
                        <tr><td></td><td><input type="submit" class="vlv-btn" value="Отправить письмо"></td></tr>
                    </table>
                </form>
                ${letters.map(l => `<div class="vlv-letter">
                    <div class="vlv-letter-head"><b>${this.escapeHtml(l.author)}</b>, ${this.dateShort(l.date)}. Тема: ${this.escapeHtml(l.topic)}</div>
                    <p class="vlv-letter-q"><b>В:</b> ${this.escapeHtml(l.question)}</p>
                    <p class="vlv-letter-a"><b>О:</b> ${this.escapeHtml(l.reply)}</p>
                </div>`).join('')}
            </div>`;
    }

    searchText(parts) {
        return parts.flat(Infinity).filter(v => v != null).join(' ').toLowerCase();
    }

    renderSearch() {
        const q = String(this.searchQuery || '').trim();
        const ql = q.toLowerCase();
        const data = this.getData();
        if (!ql) {
            return `<div class="vlv-pad"><h1 class="vlv-h1">Поиск по сайту</h1><p>Введите слово в поле поиска вверху страницы.</p></div>`;
        }
        const hits = [];
        (data.projects || []).forEach(p => {
            if (this.searchText([p.title, p.kind, p.short, p.about, p.features, p.engine, (p.tables || []).map(t => t.rows), p.controls]).includes(ql)) {
                hits.push({ kind: 'Продукт', path: `/game?id=${p.id}`, title: p.title, text: p.short });
            }
        });
        (data.news || []).forEach(n => {
            if (this.searchText([n.title, n.summary, n.category, n.author, n.body]).includes(ql)) {
                hits.push({ kind: `Пресс-релиз, ${this.dateShort(n.date)}`, path: `/article?id=${n.id}`, title: n.title, text: n.summary });
            }
        });
        (data.briefs || []).filter(b => !b.article).forEach(b => {
            if (this.searchText([b.title, b.text, b.cat]).includes(ql)) {
                hits.push({ kind: `Новость, ${this.dateShort(b.date)}`, path: '/news', title: b.title, text: b.text });
            }
        });
        ((data.lab || {}).atlas || []).forEach(a => {
            if (this.searchText([a.title, a.rooms, a.startKit, a.hazards, a.tacticalNote]).includes(ql)) {
                hits.push({ kind: `Атлас, ${a.code}`, sector: a.id, title: `${a.project}: ${a.title}`, text: a.tacticalNote });
            }
        });
        if (this.searchText([data.about, data.history, (data.cabal || {}).intro, (data.cabal || {}).groups, (data.cabal || {}).jobs]).includes(ql)) {
            hits.push({ kind: 'Компания', path: '/company', title: 'О компании, история и вакансии', text: 'Страница о Valve Software.' });
        }
        return `
            <div class="vlv-pad">
                <h1 class="vlv-h1">Поиск: «${this.escapeHtml(q)}»</h1>
                <p>Найдено страниц: ${hits.length}.</p>
                ${hits.length ? `<ol class="vlv-results">${hits.map(h => `<li>
                    ${h.sector ? `<a href="#" data-vlv="sectorGo" data-id="${h.sector}"><b>${this.escapeHtml(h.title)}</b></a>` : this.link(h.path, '<b>' + this.escapeHtml(h.title) + '</b>')}
                    <div class="vlv-small">${this.escapeHtml(h.kind)}</div>
                    <div>${this.escapeHtml(h.text)}</div>
                </li>`).join('')}</ol>` : `<p>По запросу «${this.escapeHtml(q)}» ничего не найдено. Попробуйте: гравипушка, Рейвенхолм, вортигонт, Techies, модем.</p>`}
            </div>`;
    }

    render(url) {
        if (url) this.currentUrl = url;
        const route = this.parseRoute(this.currentUrl);
        const views = {
            games: () => this.renderGamesList(),
            game: () => this.renderGameDetail(route.params.id),
            news: () => this.renderNewsArchive(),
            article: () => this.renderArticle(route.params.id),
            lab: () => this.renderLab(),
            company: () => this.renderCompany(),
            letters: () => this.renderLetters(),
            search: () => this.renderSearch(),
            home: () => this.renderHome()
        };
        const body = (views[route.page] || views.home)();
        return `
            <div class="vlv-page">
                <table class="vlv-frame" cellspacing="0" cellpadding="0">
                    ${this.renderHeader(route.page)}
                    <tr><td class="vlv-body vlv-body-${route.page}">${this.renderNotice()}${body}</td></tr>
                    ${this.renderFooter()}
                </table>
            </div>`;
    }
}

window.valveSite = new ValveSite();
