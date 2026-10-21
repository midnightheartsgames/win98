(function () {
    'use strict';

    var BASE = 'http://www.ashroad98.ru';
    var ROUTES = {
        gate: ['gate', 'login', 'pass'],
        square: ['square', 'town', 'chat'],
        road: ['road', 'map', 'tract'],
        fight: ['fight', 'combat', 'battle'],
        arena: ['arena', 'duel', 'ring'],
        smith: ['smith', 'shop', 'market', 'forge'],
        hero: ['hero', 'inventory', 'profile'],
        chronicle: ['chronicle', 'ladder', 'lore', 'news']
    };
    var SIGNS = [
        { key: 'gate', label: 'Ворота' },
        { key: 'square', label: 'Застава' },
        { key: 'road', label: 'Тракт' },
        { key: 'arena', label: 'Круг' },
        { key: 'smith', label: 'Кузница' },
        { key: 'hero', label: 'Герой' },
        { key: 'chronicle', label: 'Летопись' }
    ];
    var SLOT_NAMES = {
        weapon: 'Оружие',
        helmet: 'Голова',
        cuirass: 'Корпус',
        boots: 'Ноги',
        amulet: 'Оберег',
        belt: 'Пояс',
        consumable: 'Припас'
    };
    var MAP_NAMES = {
        ford_gate: 'Застава',
        reed_causeway: 'Камышовая Гать',
        peat_fork: 'Развилка',
        sunken_ferry: 'Паром',
        willow_backwater: 'Ивовый Затон',
        stone_cross: 'Каменный Крест',
        quarry_approach: 'Выработка',
        shaft_three: 'Штольня №3',
        collapsed_drift: 'Обвальный Штрек',
        ringer_hut: 'Сторожка',
        bell_courtyard: 'Двор',
        belfry_crown: 'Ярус Колоколов'
    };
    var SHOP_IDS = ['pitch_torch', 'rye_rusk', 'ash_salve', 'bell_tincture', 'broad_saber', 'shaft_cleaver', 'riveted_casque', 'brigandine_vest', 'splint_greaves', 'duelist_charm', 'bell_halberd', 'belfry_visored', 'warden_plate', 'bell_tongue_relic'];

    function G() {
        return window.ashroadGame;
    }

    function D() {
        return window.ashroadData;
    }

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function gif(name) {
        return typeof window.webGif === 'function' ? window.webGif(name, 1) : '';
    }

    function url(path) {
        return BASE + '/' + path;
    }

    function link(path, text, cls) {
        return '<a href="' + url(path) + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + text + '</a>';
    }

    function btn(act, text, attrs, cls) {
        var extra = '';
        Object.keys(attrs || {}).forEach(function (k) {
            extra += ' data-' + k + '="' + esc(attrs[k]) + '"';
        });
        return '<button type="button" class="' + (cls || 'ar-btn') + '" data-ar-act="' + act + '"' + extra + '>' + text + '</button>';
    }

    function parseRoute(address) {
        var raw = String(address || BASE);
        var path = raw.replace(/^https?:\/{2}[^\/]+/i, '');
        var q = path.search(/[?#]/);
        if (q !== -1) path = path.slice(0, q);
        path = path.replace(/^\/+|\/+$/g, '').toLowerCase().replace(/\.html?$/, '');
        if (!path || path === 'index') return G().loadState().registered ? 'square' : 'gate';
        var keys = Object.keys(ROUTES);
        for (var i = 0; i < keys.length; i++) {
            if (ROUTES[keys[i]].indexOf(path) !== -1) return keys[i];
        }
        return 'missing';
    }

    function cells(cur, max, cls, count) {
        count = count || 10;
        var filled = max > 0 ? Math.round(Math.max(0, Math.min(1, cur / max)) * count) : 0;
        if (cur > 0 && filled === 0) filled = 1;
        var out = '<span class="ar-cells">';
        for (var i = 0; i < count; i++) out += '<span class="' + (i < filled ? cls : 'ar-cell-off') + '"></span>';
        return out + '</span>';
    }

    function ticks(progress, required) {
        if (required > 10) return '<span class="ar-ticks">' + progress + ' / ' + required + ' гр.</span>';
        var out = '<span class="ar-ticks">';
        for (var i = 0; i < required; i++) out += i < progress ? '■' : '□';
        return out + '</span>';
    }

    function renderMasthead(st) {
        var lit = st.hero.bossDefeated ? '#ffcc00' : '#ff6600';
        var flakes = '';
        var pts = [[36, 18], [92, 44], [148, 12], [210, 58], [268, 26], [330, 40], [402, 14], [455, 62], [520, 30], [588, 50], [640, 16], [702, 38], [118, 76], [372, 70], [610, 80], [730, 70]];
        pts.forEach(function (p) {
            flakes += '<rect x="' + p[0] + '" y="' + p[1] + '" width="2" height="2" fill="#cccccc"/>';
        });
        var posts = '';
        [[300, 98, 14], [338, 86, 10], [362, 79, 7], [377, 75, 5]].forEach(function (p) {
            posts += '<rect x="' + p[0] + '" y="' + (p[1] - p[2]) + '" width="' + Math.max(2, Math.round(p[2] / 3)) + '" height="' + p[2] + '" fill="#000000"/>';
            posts += '<rect x="' + (p[0] - 1) + '" y="' + (p[1] - p[2]) + '" width="' + (Math.max(2, Math.round(p[2] / 3)) + 2) + '" height="2" fill="#ffffff"/>';
        });
        return '<svg class="ar-mast-svg" width="760" height="112" viewBox="0 0 760 112" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Пепельный Тракт: дорога к Старой Колокольне">' +
            '<rect x="0" y="0" width="760" height="112" fill="#333333"/>' +
            '<rect x="0" y="40" width="760" height="10" fill="#666666"/>' +
            '<rect x="0" y="50" width="760" height="6" fill="#999999"/>' +
            '<rect x="0" y="56" width="760" height="4" fill="#666666"/>' +
            '<rect x="0" y="60" width="760" height="52" fill="#333333"/>' +
            '<polygon points="330,112 420,112 392,72 384,72" fill="#666666"/>' +
            '<polygon points="350,112 400,112 389,72 386,72" fill="#999999"/>' +
            posts +
            '<polygon points="612,72 612,24 618,24 618,14 622,6 626,14 626,24 632,24 632,72" fill="#000000"/>' +
            '<rect x="619" y="30" width="6" height="7" fill="' + lit + '"/>' +
            '<rect x="600" y="62" width="48" height="10" fill="#000000"/>' +
            '<polygon points="0,72 60,66 130,70 210,64 300,70 330,72 0,80" fill="#000000"/>' +
            '<polygon points="430,72 520,66 600,72 700,64 760,68 760,80 430,80" fill="#000000"/>' +
            '<rect x="0" y="80" width="760" height="32" fill="#000000"/>' +
            '<rect x="56" y="58" width="4" height="22" fill="#000000"/>' +
            '<rect x="50" y="52" width="16" height="6" fill="#000000"/>' +
            '<rect x="54" y="48" width="8" height="4" fill="#ff6600"/>' +
            flakes +
            '<text x="22" y="34" font-family="Georgia, Times New Roman, serif" font-size="30" font-weight="bold" fill="#000000">Пепельный Тракт \'98</text>' +
            '<text x="20" y="32" font-family="Georgia, Times New Roman, serif" font-size="30" font-weight="bold" fill="#cc9933">Пепельный Тракт \'98</text>' +
            '<text x="22" y="100" font-family="Verdana, Arial, sans-serif" font-size="11" fill="#cccccc">Многопользовательская игра в браузере. Сервер «Старый Брод», 12 вёрст до Колокольни.</text>' +
            '<text x="738" y="100" font-family="Courier New, monospace" font-size="11" fill="#999999" text-anchor="end">в сети 42</text>' +
            '</svg>';
    }

    function renderSigns(st, route) {
        var html = '';
        var fighting = st.combat && !st.combat.finished;
        if (fighting) html += link('fight', 'Бой!', 'ar-sign ar-sign-alarm' + (route === 'fight' ? ' ar-sign-on' : ''));
        SIGNS.forEach(function (s) {
            var label = s.label;
            if (s.key === 'hero' && st.hero.statPoints > 0) label += ' (+' + st.hero.statPoints + ')';
            html += link(s.key, label, 'ar-sign' + (route === s.key ? ' ar-sign-on' : ''));
        });
        return '<tr><td class="ar-signs">' + html + '</td></tr>';
    }

    function renderPassStrip(st) {
        var h = st.hero;
        var s = G().heroStats(st);
        var D0 = D();
        var who = st.registered
            ? '<b>' + esc(h.handle) + '</b><br>' + h.level + '-й ур., <span style="color:' + D0.ORDERS[h.orderId].color + ';">' + esc(D0.ORDERS[h.orderId].shortName) + '</span>'
            : '<b>Без пропуска.</b> ' + link('gate', 'Выписать');
        return '<tr><td class="ar-pass">' +
            '<table class="ar-pass-row" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-pass-who">' + who + '</td>' +
            '<td>' + gif('heart') + ' ' + h.hp + '/' + s.maxHp + cells(h.hp, s.maxHp, 'ar-cell-hp', 8) + '</td>' +
            '<td>Дых. ' + h.stam + '/' + s.maxStam + cells(h.stam, s.maxStam, 'ar-cell-st', 8) + '</td>' +
            '<td>' + gif('flame') + ' ' + h.torch + '/' + s.maxTorch + cells(h.torch, s.maxTorch, 'ar-cell-tr', 8) + '</td>' +
            '<td class="ar-pass-purse">' + gif('money') + ' ' + h.groshi + ' гр., ' + h.iron + ' жел., ' + h.tokens + ' жет.</td>' +
            '</tr></table></td></tr>';
    }

    function renderNotices(st, route) {
        var out = '';
        var c = st.combat;
        if (c && !c.finished && route !== 'fight') {
            out += '<div class="ar-alarm">Идёт бой: ' + esc(c.foeName) + ', раунд ' + c.round + '. ' + link('fight', 'Вернуться в бой') + '</div>';
        }
        var f = G().takeFlash(st);
        if (f) out += '<div class="ar-tape' + (f.warn ? ' ar-tape-warn' : '') + '">' + esc(f.text) + '</div>';
        return out ? '<tr><td class="ar-notices">' + out + '</td></tr>' : '';
    }

    function renderFooter() {
        var ring = '';
        if (window.retroSites && typeof window.retroSites.renderWebRing === 'function') ring = window.retroSites.renderWebRing(BASE);
        return '<tr><td class="ar-foot">' +
            '<div class="ar-buttons">' +
            '<span class="ar-88"><b>IE 4.0</b><br>800x600</span>' +
            '<span class="ar-88"><b>КОИ8-Р</b><br>Win-1251</span>' +
            '<span class="ar-88 ar-88-top"><b>Rambler\'s</b><br>Top100 #4</span>' +
            '<span class="ar-88 ar-88-count">004819</span>' +
            '</div>' +
            '<div>Сервер «Старый Брод» работает на таблицах, без апплетов и картинок больше 4 кб. Пишите коменданту: <a href="mailto:komendant@ashroad98.ru">komendant@ashroad98.ru</a></div>' +
            ring +
            '</td></tr>';
    }

    function originPortrait(id, size) {
        var w = size || 72;
        var h = Math.round(w * 1.25);
        var body = '';
        if (id === 'dragoon') {
            body = '<rect x="22" y="4" width="20" height="14" fill="#000000"/><rect x="20" y="16" width="24" height="3" fill="#cc9933"/>' +
                '<rect x="24" y="19" width="16" height="15" fill="#cc9966"/><rect x="16" y="36" width="32" height="34" fill="#336699"/>' +
                '<rect x="16" y="36" width="32" height="4" fill="#cc9933"/><rect x="50" y="22" width="3" height="50" fill="#cccccc"/><rect x="47" y="64" width="9" height="3" fill="#cc9933"/>' +
                '<rect x="18" y="70" width="11" height="18" fill="#000000"/><rect x="35" y="70" width="11" height="18" fill="#000000"/>';
        } else if (id === 'miner') {
            body = '<rect x="20" y="8" width="24" height="10" fill="#996633"/><rect x="29" y="10" width="6" height="5" fill="#ffcc00"/>' +
                '<rect x="24" y="18" width="16" height="15" fill="#cc9966"/><rect x="14" y="35" width="36" height="35" fill="#663300"/>' +
                '<rect x="6" y="20" width="4" height="52" fill="#996633"/><polygon points="0,22 18,18 18,24 0,26" fill="#999999"/>' +
                '<rect x="17" y="70" width="12" height="18" fill="#333333"/><rect x="35" y="70" width="12" height="18" fill="#333333"/>';
        } else {
            body = '<polygon points="20,20 32,4 44,20" fill="#333333"/><rect x="24" y="18" width="16" height="15" fill="#cc9966"/>' +
                '<polygon points="14,36 50,36 54,88 10,88" fill="#333333"/><rect x="38" y="44" width="18" height="22" fill="#ffffcc"/>' +
                '<rect x="40" y="48" width="14" height="1" fill="#666666"/><rect x="40" y="52" width="14" height="1" fill="#666666"/><rect x="40" y="56" width="10" height="1" fill="#666666"/>' +
                '<rect x="54" y="30" width="2" height="18" fill="#ffffff"/>';
        }
        return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 64 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="0" y="0" width="64" height="90" fill="#999999"/>' + body + '</svg>';
    }

    function pennant(order, selected) {
        return '<svg width="54" height="78" viewBox="0 0 54 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<rect x="2" y="2" width="50" height="3" fill="#996633"/>' +
            '<polygon points="8,5 46,5 46,62 27,76 8,62" fill="' + order.color + '" stroke="' + (selected ? '#ffffff' : '#000000') + '" stroke-width="2"/>' +
            '<rect x="18" y="20" width="18" height="18" fill="#000000"/>' +
            '<rect x="22" y="24" width="10" height="10" fill="' + order.color + '"/>' +
            '</svg>';
    }

    function renderGate(st) {
        var D0 = D();
        var h = st.hero;
        var origins = Object.keys(D0.ORIGINS).map(function (k) {
            var o = D0.ORIGINS[k];
            var on = h.originId === k;
            return '<td class="ar-origin' + (on ? ' ar-picked' : '') + '">' +
                '<label>' + originPortrait(k) + '<br><input type="radio" name="ar_origin" value="' + k + '"' + (on ? ' checked' : '') + '> <b>' + esc(o.name) + '</b></label>' +
                '<div class="ar-small">' + esc(o.desc) + '</div>' +
                '<div class="ar-origin-perk">«' + esc(o.passiveName) + '»: ' + esc(o.passiveDesc) + '</div>' +
                '<div class="ar-small">Здоровье ' + o.maxHp + ', Дыхание ' + o.maxStam + ', Сила ' + o.stats.vigor + ', Крепость ' + o.stats.grit + ', Глазомер ' + o.stats.focus + '</div>' +
                '</td>';
        }).join('');
        var orders = Object.keys(D0.ORDERS).map(function (k) {
            var o = D0.ORDERS[k];
            var on = h.orderId === k;
            return '<td class="ar-order' + (on ? ' ar-picked' : '') + '">' +
                '<label>' + pennant(o, on) + '<br><input type="radio" name="ar_order" value="' + k + '"' + (on ? ' checked' : '') + '> <b>' + esc(o.name) + '</b></label>' +
                '<div class="ar-small">' + esc(o.commander) + '. «' + esc(o.motto) + '»</div>' +
                '<div class="ar-origin-perk">' + esc(o.bonusDesc) + '</div>' +
                '</td>';
        }).join('');
        var registered = st.registered;
        var untouched = h.level === 1 && h.xp === 0 && h.roadClears === 0 && h.arenaWins === 0 && h.arenaLosses === 0;
        var note = registered
            ? (untouched ? 'Пока вы не сделали ни шагу, ремесло можно сменить без потерь.' : 'Ремесло уже не сменить: оно записано в ваших боях. Смена Приказа стоит 1 Жетон.')
            : 'Пропуск пока чистый. Впишите прозвище и выберите, кем вы пришли на Заставу.';
        return '<div class="ar-gate">' +
            '<table class="ar-gate-top" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-iron-pass">' +
            '<div class="ar-rivet ar-rivet-tl"></div><div class="ar-rivet ar-rivet-tr"></div><div class="ar-rivet ar-rivet-bl"></div><div class="ar-rivet ar-rivet-br"></div>' +
            '<div class="ar-iron-head">Железный пропуск</div>' +
            '<div class="ar-iron-no">№ ' + (4800 + st.road.expeditions + h.level) + '-СБ</div>' +
            '<div class="ar-iron-name" id="ar-pass-name">' + esc(h.handle) + '</div>' +
            '<div class="ar-iron-line">' + esc(D0.ORIGINS[h.originId].name) + ', ' + h.level + '-й уровень</div>' +
            '<div class="ar-iron-line">' + esc(D0.ORDERS[h.orderId].name) + '</div>' +
            '<div class="ar-iron-line">Рейтинг Круга ' + h.rating + ', вылазок ' + st.road.expeditions + '</div>' +
            '<div class="ar-iron-stamp">' + (registered ? 'ЗАВЕРЕНО' : 'НЕ ЗАВЕРЕНО') + '</div>' +
            '</td>' +
            '<td class="ar-gate-intro">' +
            '<p>За частоколом начинается <b>Пепельный Тракт</b>: двенадцать вёрст гатей, затопленных переправ и рудничных выработок до Старой Колокольни. Дорогу держат три Приказа, а в Круге Поединков меряются силой путники со всей страны, от Тулы до Новосибирска.</p>' +
            '<p class="ar-steps-title"><b>Как здесь живут</b></p>' +
            '<ol class="ar-steps">' +
            '<li>Получите пропуск: прозвище, ремесло, Приказ.</li>' +
            '<li>Возьмите подряд на доске Заставы.</li>' +
            '<li>Выйдите на тракт с горящим факелом, деритесь, несите добычу назад.</li>' +
            '<li>Перекуйте снаряжение у Громова и вызовите кого-нибудь в Круг.</li>' +
            '</ol>' +
            (registered ? '<p>' + link('square', 'Пройти на Заставу') + ' | ' + link('road', 'Сразу на тракт') + '</p>' : '') +
            '</td></tr></table>' +
            '<form id="ar-gate-form" class="ar-ledger">' +
            '<div class="ar-ledger-title">Пропускная книга Заставы «Старый Брод», октябрь 1998 г.</div>' +
            '<p class="ar-ledger-note">' + note + '</p>' +
            '<p><label for="ar-handle"><b>Прозвище в чате и Летописи:</b></label> <input type="text" id="ar-handle" name="ar_handle" class="ar-input" maxlength="20" value="' + esc(h.handle) + '"></p>' +
            '<p><b>Прежнее ремесло</b> (стартовые вещи и боевой приём):</p>' +
            '<table class="ar-pick" cellpadding="0" cellspacing="0"><tr>' + origins + '</tr></table>' +
            '<p><b>Приказ, которому вы присягаете:</b></p>' +
            '<table class="ar-pick" cellpadding="0" cellspacing="0"><tr>' + orders + '</tr></table>' +
            '<p class="ar-ledger-submit"><button type="submit" class="ar-btn ar-btn-ember">Скрепить печатью</button> ' +
            (registered ? btn('reset', 'Сжечь пропуск и начать заново', {}, 'ar-btn ar-btn-quiet') : '') +
            '</p>' +
            '</form>' +
            '</div>';
    }

    function renderTownSvg(st) {
        var fighting = st.combat && !st.combat.finished;
        var spots = [
            { go: 'gate', x: 14, w: 92, label: 'Ворота' },
            { go: 'square', x: 120, w: 110, label: 'Таверна', room: 'tavern' },
            { go: 'arena', x: 246, w: 120, label: 'Круг' },
            { go: 'square', x: 382, w: 96, label: 'Доска подрядов', jump: 'ar-board' },
            { go: 'smith', x: 494, w: 110, label: 'Кузница' },
            { go: 'road', x: 620, w: 126, label: 'На тракт' }
        ];
        var art = '<rect x="0" y="0" width="760" height="150" fill="#333333"/>' +
            '<rect x="0" y="118" width="760" height="32" fill="#666666"/>' +
            '<rect x="0" y="118" width="760" height="2" fill="#999999"/>' +
            '<rect x="20" y="58" width="6" height="60" fill="#000000"/><rect x="94" y="58" width="6" height="60" fill="#000000"/><rect x="20" y="58" width="80" height="8" fill="#000000"/>' +
            '<rect x="30" y="66" width="60" height="52" fill="#663300"/><rect x="58" y="66" width="4" height="52" fill="#000000"/>' +
            '<rect x="54" y="34" width="12" height="24" fill="#000000"/><rect x="52" y="28" width="16" height="6" fill="#ff6600"/>' +
            '<polygon points="122,70 175,40 228,70" fill="#000000"/><rect x="130" y="70" width="90" height="48" fill="#663300"/>' +
            '<rect x="142" y="82" width="16" height="14" fill="#ffcc00"/><rect x="190" y="82" width="16" height="14" fill="#ffcc00"/><rect x="166" y="92" width="18" height="26" fill="#000000"/>' +
            '<rect x="250" y="96" width="112" height="22" fill="#000000"/><rect x="256" y="100" width="100" height="14" fill="#996633"/>' +
            (fighting ? '<rect x="296" y="76" width="20" height="20" fill="#ff6600"/>' : '<rect x="300" y="80" width="12" height="16" fill="#cccccc"/>') +
            '<rect x="250" y="70" width="4" height="30" fill="#000000"/><rect x="358" y="70" width="4" height="30" fill="#000000"/>' +
            '<rect x="400" y="64" width="60" height="40" fill="#996633"/><rect x="426" y="104" width="6" height="14" fill="#000000"/>' +
            '<rect x="406" y="70" width="14" height="12" fill="#ffffcc"/><rect x="424" y="72" width="14" height="10" fill="#ffffcc"/><rect x="442" y="68" width="12" height="14" fill="#ffffcc"/><rect x="410" y="86" width="16" height="12" fill="#ffffcc"/><rect x="432" y="86" width="14" height="12" fill="#ffffcc"/>' +
            '<rect x="500" y="62" width="98" height="56" fill="#333333" stroke="#000000" stroke-width="2"/><rect x="574" y="36" width="12" height="26" fill="#000000"/>' +
            '<rect x="512" y="86" width="30" height="20" fill="#ff6600"/><rect x="518" y="92" width="18" height="8" fill="#ffcc00"/>' +
            '<polygon points="640,118 700,118 684,80 676,80" fill="#999999"/>' +
            '<polygon points="712,118 712,36 718,36 718,26 722,18 726,26 726,36 732,36 732,118" fill="#000000"/>' +
            '<rect x="719" y="42" width="6" height="6" fill="' + (st.hero.bossDefeated ? '#ffcc00' : '#ff6600') + '"/>';
        var hot = spots.map(function (s) {
            var attrs = 'data-ar-go="' + s.go + '"' + (s.room ? ' data-room="' + s.room + '"' : '') + (s.jump ? ' data-jump="' + s.jump + '"' : '');
            return '<g class="ar-hot" ' + attrs + '>' +
                '<rect x="' + s.x + '" y="10" width="' + s.w + '" height="132" fill="none" pointer-events="all"/>' +
                '<rect class="ar-hot-plate" x="' + (s.x + 4) + '" y="124" width="' + (s.w - 8) + '" height="18" fill="#000000"/>' +
                '<text x="' + (s.x + s.w / 2) + '" y="137" font-family="Verdana, Arial, sans-serif" font-size="11" fill="#ffffcc" text-anchor="middle">' + esc(s.label) + '</text>' +
                '</g>';
        }).join('');
        return '<svg class="ar-town-svg" width="732" height="144" viewBox="0 0 760 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Площадь Заставы: щёлкните по зданию">' + art + hot + '</svg>';
    }

    function renderSquare(st) {
        var D0 = D();
        var notes = D0.CONTRACTS.map(function (c) {
            var prog = st.contracts[c.id] || { progress: 0, claimed: false };
            var ord = D0.ORDERS[c.orderId];
            var action;
            if (prog.claimed) action = '<span class="ar-paid">Оплачено</span>';
            else if (prog.progress >= c.required) action = btn('claim', 'Получить расчёт', { id: c.id }, 'ar-btn ar-btn-ember');
            else action = link(c.targetType.indexOf('arena') === 0 ? 'arena' : 'road', 'Взяться');
            return '<td class="ar-note' + (prog.claimed ? ' ar-note-done' : '') + '">' +
                '<div class="ar-nail"></div>' +
                '<div class="ar-note-title">' + esc(c.title) + '</div>' +
                '<div class="ar-note-from" style="border-color:' + ord.color + ';">' + esc(c.patron) + '</div>' +
                '<div class="ar-note-text">' + esc(c.desc) + '</div>' +
                '<div class="ar-note-foot">' + ticks(prog.progress, c.required) + ' <span class="ar-note-pay">' + c.rewardGroshi + ' гр., ' + c.rewardIron + ' жел., ' + c.rewardTokens + ' жет.</span></div>' +
                '<div class="ar-note-act">' + action + '</div>' +
                '</td>';
        });
        var rows = '';
        for (var i = 0; i < notes.length; i += 3) {
            rows += '<tr>' + notes.slice(i, i + 3).join('') + (notes.length - i < 3 ? '<td class="ar-note-empty" colspan="' + (3 - (notes.length - i)) + '"></td>' : '') + '</tr>';
        }
        var roomKey = D0.CHAT_CHANNELS[st.chatRoom] ? st.chatRoom : 'square';
        var room = D0.CHAT_CHANNELS[roomKey];
        var rooms = Object.keys(D0.CHAT_CHANNELS).map(function (k) {
            return k === roomKey
                ? '<div class="ar-room ar-room-on">' + esc(D0.CHAT_CHANNELS[k].name) + '</div>'
                : '<div class="ar-room">' + btn('room', esc(D0.CHAT_CHANNELS[k].name), { room: k }, 'ar-linkbtn') + '</div>';
        }).join('');
        var lines = (st.chatLogs[roomKey] || []).map(function (m) {
            var mine = m.author === st.hero.handle;
            return '<div class="ar-chat-line"><span class="ar-chat-time">' + esc(m.time) + '</span> ' +
                '<span class="' + (m.isSystem ? 'ar-chat-sys' : (mine ? 'ar-chat-me' : 'ar-chat-who')) + '">&lt;' + esc(m.author) + '&gt;</span> ' + esc(m.text) + '</div>';
        }).join('');
        var roster = '<div class="ar-chat-me">' + esc(st.hero.handle) + '</div>' + room.roster.map(function (n) { return '<div>' + esc(n) + '</div>'; }).join('');
        return '<div class="ar-town">' + renderTownSvg(st) + '<div class="ar-caption">Щёлкните по зданию. Колокольня на горизонте ' + (st.hero.bossDefeated ? 'светится золотом: Звонарь повержен.' : 'горит красным: Звонарь держит ярус.') + '</div></div>' +
            '<a name="ar-board"></a><div class="ar-board" id="ar-board">' +
            '<div class="ar-board-head">Доска подрядов</div>' +
            '<table class="ar-board-grid" cellpadding="0" cellspacing="8">' + rows + '</table>' +
            '</div>' +
            '<table class="ar-chat" cellpadding="0" cellspacing="0">' +
            '<tr><td class="ar-chat-bar" colspan="3">Чат Заставы: ' + esc(room.name) + '. Обновляется при каждом заходе.</td></tr>' +
            '<tr><td class="ar-chat-rooms">' + rooms + '</td>' +
            '<td class="ar-chat-pane"><div class="ar-chat-log" id="ar-chat-log">' + lines + '</div></td>' +
            '<td class="ar-chat-roster"><div class="ar-chat-roster-head">Здесь ' + (room.roster.length + 1) + '</div>' + roster + '</td></tr>' +
            '<tr><td class="ar-chat-say" colspan="3"><form id="ar-chat-form">' +
            '<label for="ar-chat-input">Сказать:</label> <input type="text" id="ar-chat-input" class="ar-input ar-chat-input" maxlength="140" autocomplete="off"> ' +
            '<button type="submit" class="ar-btn">Отправить</button></form></td></tr>' +
            '</table>';
    }

    function nodeGlyph(node, x, y, color) {
        if (node.type === 'hub') return '<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" fill="none" stroke="' + color + '" stroke-width="2"/><rect x="' + (x - 1) + '" y="' + (y - 7) + '" width="2" height="14" fill="' + color + '"/>';
        if (node.type === 'breather') return '<polygon points="' + (x - 6) + ',' + (y + 6) + ' ' + x + ',' + (y - 8) + ' ' + (x + 6) + ',' + (y + 6) + '" fill="' + color + '"/>';
        if (node.type === 'secret') return '<rect x="' + (x - 6) + '" y="' + (y - 2) + '" width="12" height="8" fill="' + color + '"/><rect x="' + (x - 4) + '" y="' + (y - 7) + '" width="8" height="5" fill="none" stroke="' + color + '" stroke-width="2"/>';
        if (node.type === 'boss') return '<polygon points="' + (x - 7) + ',' + (y + 6) + ' ' + (x - 4) + ',' + (y - 5) + ' ' + (x + 4) + ',' + (y - 5) + ' ' + (x + 7) + ',' + (y + 6) + '" fill="' + color + '"/><rect x="' + (x - 1) + '" y="' + (y + 6) + '" width="3" height="3" fill="' + color + '"/>';
        return '<line x1="' + (x - 6) + '" y1="' + (y - 6) + '" x2="' + (x + 6) + '" y2="' + (y + 6) + '" stroke="' + color + '" stroke-width="2"/><line x1="' + (x + 6) + '" y1="' + (y - 6) + '" x2="' + (x - 6) + '" y2="' + (y + 6) + '" stroke="' + color + '" stroke-width="2"/>';
    }

    function renderMapSvg(st) {
        var D0 = D();
        var g = G();
        var cur = st.road.currentNodeId;
        var reach = g.reachableIds(st);
        var lines = '';
        var seen = {};
        D0.NODES.forEach(function (a) {
            a.connections.forEach(function (bid) {
                var key = a.id < bid ? a.id + bid : bid + a.id;
                if (seen[key]) return;
                seen[key] = true;
                var b = g.nodeById(bid);
                var known = g.isKnown(st, a.id) && g.isKnown(st, b.id);
                if (!known) return;
                lines += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#333333" stroke-width="2"' + (st.road.visitedNodes[a.id] && st.road.visitedNodes[b.id] ? '' : ' stroke-dasharray="3,4"') + '/>';
            });
        });
        Object.keys(D0.SHORTCUTS).forEach(function (k) {
            var sc = D0.SHORTCUTS[k];
            var a = g.nodeById(sc.from);
            var b = g.nodeById(sc.to);
            if (!st.road.shortcuts[k] && !st.road.visitedNodes[sc.unlockNode]) return;
            lines += '<line x1="' + a.x + '" y1="' + (a.y + 18) + '" x2="' + b.x + '" y2="' + (b.y + 18) + '" stroke="' + (st.road.shortcuts[k] ? '#996633' : '#999999') + '" stroke-width="3" stroke-dasharray="8,4"/>';
        });
        var nodes = D0.NODES.map(function (n) {
            var known = g.isKnown(st, n.id);
            var visited = Boolean(st.road.visitedNodes[n.id]);
            var isCur = n.id === cur;
            var canGo = reach.indexOf(n.id) !== -1;
            if (!known) {
                return '<g><rect x="' + (n.x - 8) + '" y="' + (n.y - 8) + '" width="16" height="16" fill="#cccc99" stroke="#999966" stroke-width="1"/>' +
                    '<text x="' + n.x + '" y="' + (n.y + 4) + '" font-family="Courier New, monospace" font-size="12" fill="#999966" text-anchor="middle">?</text></g>';
            }
            var color = n.type === 'boss' ? '#990000' : '#000000';
            var hostile = g.isHostile(st, n) && visited;
            var ring = isCur ? '<rect x="' + (n.x - 14) + '" y="' + (n.y - 14) + '" width="28" height="28" fill="#ffcc00" stroke="#ff6600" stroke-width="3"/>'
                : (canGo ? '<rect x="' + (n.x - 13) + '" y="' + (n.y - 13) + '" width="26" height="26" fill="#ffffcc" stroke="#ff6600" stroke-width="2" stroke-dasharray="4,2"/>'
                    : '<rect x="' + (n.x - 12) + '" y="' + (n.y - 12) + '" width="24" height="24" fill="' + (st.road.clearedNodes[n.id] ? '#cccccc' : '#ffffcc') + '" stroke="#333333" stroke-width="1"/>');
            var name = visited ? esc(MAP_NAMES[n.id] || n.name) : '?';
            return '<g class="ar-map-node' + (canGo || isCur ? ' ar-map-live' : '') + '" data-ar-node="' + n.id + '">' +
                ring + nodeGlyph(n, n.x, n.y, color) +
                (hostile ? '<rect x="' + (n.x + 9) + '" y="' + (n.y - 15) + '" width="7" height="7" fill="#cc0000"/>' : '') +
                '<text x="' + n.x + '" y="' + (n.y + 27) + '" font-family="Verdana, Arial, sans-serif" font-size="9" fill="#000000" text-anchor="middle">' + n.num + '. ' + name + '</text>' +
                '</g>';
        }).join('');
        return '<svg class="ar-map-svg" width="732" height="241" viewBox="0 0 760 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Карта Пепельного Тракта">' +
            '<rect x="0" y="0" width="760" height="250" fill="#cccc99"/>' +
            '<rect x="4" y="4" width="752" height="242" fill="none" stroke="#666633" stroke-width="1"/>' +
            '<text x="14" y="20" font-family="Georgia, Times New Roman, serif" font-size="13" font-style="italic" fill="#333333">Чертёж Пепельного Тракта, снят дозором Стражи Брода</text>' +
            '<text x="746" y="238" font-family="Verdana, Arial, sans-serif" font-size="9" fill="#333333" text-anchor="end">Красная метка: сектор занят врагом. Пунктир: короткий путь.</text>' +
            lines + nodes + '</svg>';
    }

    function renderRoad(st) {
        var D0 = D();
        var g = G();
        var cur = g.nodeById(st.road.currentNodeId);
        var bag = st.road.lootBag;
        var hostile = g.isHostile(st, cur);
        var heat = g.heatMultiplier(st);
        var acts = [];
        if (hostile) {
            var foe = D0.ENEMIES[cur.enemyPool[(st.hero.roadClears + cur.num) % cur.enemyPool.length]];
            acts.push(btn('patrol', 'Драться: ' + esc(foe.name.toLowerCase()), {}, 'ar-btn ar-btn-ember'));
        } else if (cur.enemyPool && cur.enemyPool.length) {
            acts.push('<span class="ar-quiet">Сектор зачищен до конца вылазки.</span>');
        }
        if (cur.shortcutUnlock) {
            var sc = D0.SHORTCUTS[cur.shortcutUnlock];
            acts.push(st.road.shortcuts[cur.shortcutUnlock] ? '<span class="ar-quiet">' + esc(sc.name) + ': открыто.</span>' : btn('shortcut', 'Запустить механизм: ' + esc(sc.name), {}, hostile ? 'ar-btn' : 'ar-btn ar-btn-ember'));
        }
        if (cur.type === 'breather') {
            acts.push(st.road.campsUsed[cur.id] ? '<span class="ar-quiet">Костёр прогорел.</span>' : btn('camp', 'Привал у костра', {}, 'ar-btn'));
            if (bag.groshi || bag.iron) acts.push(btn('courier', 'Отправить мешок с гонцом (-15%)', {}, 'ar-btn'));
            acts.push(btn('home', 'Вернуться с дозором на Заставу', {}, 'ar-btn'));
        }
        var beltItems = st.inventory.filter(function (i) { return D0.ITEMS[i.itemId].slot === 'consumable'; });
        var belt = beltItems.length ? beltItems.map(function (i) {
            return btn('use', esc(D0.ITEMS[i.itemId].name), { uid: i.uid }, 'ar-btn ar-btn-small');
        }).join(' ') : '<span class="ar-quiet">пусто, припасы продаёт Громов</span>';
        var exits = g.reachableIds(st).map(function (id) {
            var n = g.nodeById(id);
            var viaShort = cur.connections.indexOf(id) === -1;
            var known = st.road.visitedNodes[id];
            var cost = viaShort ? 1 : n.torchCost;
            return '<td class="ar-exit">' +
                '<div class="ar-exit-board">' + (id === 'ford_gate' ? '' : '→ ') + n.num + '. ' + esc(n.name) + '</div>' +
                '<div class="ar-small">' + (viaShort ? 'Короткий путь. ' : '') + 'Факел -' + cost + '. ' + (known ? esc(n.sightline) + '.' : 'Ещё не разведано.') + '</div>' +
                btn('move', id === 'ford_gate' ? 'Вернуться за ворота' : 'Идти', { node: id }, 'ar-btn ar-btn-small') +
                '</td>';
        }).join('');
        if (!exits) exits = '<td class="ar-exit">Отсюда некуда идти.</td>';
        var journal = st.road.journal.slice(0, 8).map(function (j) { return '<li>' + esc(j) + '</li>'; }).join('');
        var expedition = st.road.onExpedition
            ? 'Вылазка №' + st.road.expeditions + '. В мешке <b>' + bag.groshi + ' гр.</b> и <b>' + bag.iron + ' жел.</b> Жар тракта x' + heat.toFixed(2) + (st.road.heat >= G().HEAT_MAX ? ' (предел)' : '') + '.'
            : 'Вы за воротами Заставы. Первый шаг на тракт начнёт вылазку.';
        return '<div class="ar-expedition">' + expedition +
            (st.road.onExpedition ? ' <span class="ar-small">Каждая победа поднимает жар на 15%. Погибнете, и половина мешка останется в пепле. Сдать мешок можно на Заставе или с гонцом у костра.</span>' : '') +
            '</div>' +
            '<div class="ar-map">' + renderMapSvg(st) + '</div>' +
            '<table class="ar-sector" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-verst"><div class="ar-verst-post"><div class="ar-verst-num">' + cur.num + '</div><div class="ar-verst-unit">верста</div></div></td>' +
            '<td class="ar-sector-body">' +
            '<h2 class="ar-h2">' + esc(cur.name) + '</h2>' +
            '<div class="ar-sector-rule"><b>' + esc(cur.sightline) + '.</b> ' + esc(cur.sightlineRule) + '</div>' +
            '<p>' + esc(cur.desc) + '</p>' +
            '<p class="ar-scout"><b>Примета:</b> ' + esc(cur.breadcrumb) + '</p>' +
            (hostile ? '<p class="ar-blocked">Путь вперёд перекрыт. Можно драться или отступить тем же путём.</p>' : '') +
            '<div class="ar-acts">' + acts.join(' ') + '</div>' +
            '<div class="ar-belt"><b>Пояс:</b> ' + belt + '</div>' +
            '</td></tr></table>' +
            '<table class="ar-exits" cellpadding="0" cellspacing="6"><tr>' + exits + '</tr></table>' +
            '<div class="ar-journal"><b>Полевой журнал</b><ul>' + journal + '</ul></div>';
    }

    function figureSvg(side, picked, armor, wound) {
        var zones = [
            { id: 'head', shape: '<rect class="ar-zf" x="44" y="6" width="32" height="32" fill="#999999" stroke="#000000" stroke-width="2"/>', ty: 26 },
            { id: 'torso', shape: '<rect class="ar-zf" x="32" y="44" width="56" height="66" fill="#999999" stroke="#000000" stroke-width="2"/>', ty: 82 },
            { id: 'legs', shape: '<rect class="ar-zf" x="34" y="116" width="22" height="70" fill="#999999" stroke="#000000" stroke-width="2"/><rect class="ar-zf" x="64" y="116" width="22" height="70" fill="#999999" stroke="#000000" stroke-width="2"/>', ty: 156 }
        ];
        var body = zones.map(function (z) {
            return '<g class="ar-zone' + (picked === z.id ? ' ar-zone-on' : '') + '" data-ar-zone="' + z.id + '" data-side="' + side + '">' + z.shape +
                '<text x="60" y="' + z.ty + '" font-family="Courier New, monospace" font-size="11" fill="#000000" text-anchor="middle">' + armor[z.id] + '</text></g>';
        }).join('');
        var arms = '<rect x="20" y="46" width="10" height="56" fill="#666666"/><rect x="90" y="46" width="10" height="56" fill="#666666"/>';
        var mark = wound ? '<text x="60" y="198" font-family="Verdana, Arial, sans-serif" font-size="10" fill="#cc0000" text-anchor="middle">' + wound + '</text>' : '';
        return '<svg class="ar-fig ar-fig-' + side + '" width="120" height="204" viewBox="0 0 120 204" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="' + (side === 'foe' ? 'Куда бить' : 'Что прикрыть') + '">' + arms + body + mark + '</svg>';
    }

    function renderFight(st) {
        var D0 = D();
        var g = G();
        var c = st.combat;
        if (!c) {
            return '<div class="ar-empty">' +
                '<h2 class="ar-h2">Сейчас вы ни с кем не бьётесь</h2>' +
                '<p>Бой начинается на тракте, в секторе с врагом, или в Круге Поединков по вызову.</p>' +
                '<p>' + link('road', 'Открыть карту тракта') + ' | ' + link('arena', 'Таблица вызовов Круга') + '</p></div>';
        }
        var h = st.hero;
        var s = g.heroStats(st);
        var info = g.describeIntent(c);
        var place = c.mode === 'arena' ? 'Круг Поединков, ставка ' + c.wager + ' гр.' : 'Сектор «' + esc(g.nodeById(c.nodeId).name) + '»';
        var log = c.log.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
        var controls;
        if (c.finished) {
            var won = c.winner === 'player';
            controls = '<div class="ar-verdict ' + (won ? 'ar-verdict-win' : 'ar-verdict-loss') + '">' +
                '<div class="ar-verdict-head">' + (won ? 'Победа' : 'Поражение') + '</div>' +
                '<p>' + esc(c.log[0]) + '</p>' +
                btn('close', c.mode === 'road' ? (won ? 'Вернуться к карте' : 'Очнуться на Заставе') : 'Вернуться к вызовам', { next: c.mode === 'road' ? 'road' : 'arena' }, 'ar-btn ar-btn-ember') +
                '</div>';
        } else {
            var stances = D0.STANCES.map(function (sd) {
                var cost = g.moveCost(sd.id, c.playerSlowed, c.terrain, h.originId, true);
                var on = c.last.stance === sd.id;
                var cant = cost > 0 && h.stam < cost;
                return '<label class="ar-stance' + (on ? ' ar-stance-on' : '') + (cant ? ' ar-stance-cant' : '') + '">' +
                    '<input type="radio" name="ar_stance" value="' + sd.id + '"' + (on ? ' checked' : '') + '> <b>' + esc(sd.name) + '</b> ' +
                    '<span class="ar-cost">' + (cost > 0 ? '-' + cost : '+' + (-cost)) + ' дых.</span>' +
                    '<span class="ar-stance-rule">' + esc(sd.rule) + '</span></label>';
            }).join('');
            var zoneRadios = function (name, picked) {
                return g.ZONE_ORDER.map(function (z) {
                    return '<label><input type="radio" name="' + name + '" value="' + z + '"' + (picked === z ? ' checked' : '') + '> ' + g.zoneName(z) + '</label>';
                }).join(' ');
            };
            var belt = st.inventory.filter(function (i) { return D0.ITEMS[i.itemId].slot === 'consumable'; }).map(function (i) {
                return btn('use', esc(D0.ITEMS[i.itemId].name), { uid: i.uid }, 'ar-btn ar-btn-small');
            }).join(' ');
            controls = '<form id="ar-fight-form">' +
                '<div class="ar-watch' + (info.dark ? ' ar-watch-dark' : '') + '">' +
                '<div class="ar-watch-head">Наблюдение' + (info.dark ? '' : ' (чтение ' + c.intent.chance + '%)') + '</div>' +
                '<div class="ar-watch-tell">' + esc(info.tell) + '</div>' +
                (info.stance ? '<div>Похоже на: <b>' + esc(info.stance) + '</b>' + (info.read || !info.canFeint ? '' : ', но это может быть Финт') + '</div>' : '') +
                (info.zones ? '<div>Цель: <b>' + esc(info.zones) + '</b>' + (info.guard ? ', ' + esc(info.guard) : '') + '</div>' : '') +
                (info.note ? '<div class="ar-watch-note">' + esc(info.note) + '</div>' : '') +
                (info.read ? '<div class="ar-watch-read">Замах прочитан точно.</div>' : '') +
                '</div>' +
                '<div class="ar-zone-radios"><b>Бить в:</b> ' + zoneRadios('ar_strike', c.last.strike) + '</div>' +
                '<div class="ar-zone-radios"><b>Прикрыть:</b> ' + zoneRadios('ar_guard', c.last.guard) + '</div>' +
                '<div class="ar-stances">' + stances + '</div>' +
                '<div class="ar-go"><button type="submit" class="ar-btn ar-btn-ember ar-btn-big">Раунд ' + c.round + ': ударить</button></div>' +
                (belt ? '<div class="ar-belt"><b>Пояс</b> (один припас за раунд): ' + belt + '</div>' : '') +
                '</form>';
        }
        var pWound = c.playerStunned ? 'оглушены' : (c.playerSlowed ? 'подсечка' : '');
        var fWound = c.foeStunned ? 'оглушён' : (c.foeSlowed ? 'подсечка' : '');
        return '<div class="ar-duel-place">' + place + '. <b>' + esc(c.sightline) + ':</b> ' + esc(c.sightlineRule) + '</div>' +
            '<table class="ar-duel" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-duelist">' +
            '<div class="ar-duelist-name">' + esc(h.handle) + '</div>' +
            '<div class="ar-small">' + esc(s.weaponName) + '</div>' +
            '<div class="ar-gauge">Здоровье ' + h.hp + '/' + s.maxHp + cells(h.hp, s.maxHp, 'ar-cell-hp') + '</div>' +
            '<div class="ar-gauge">Дыхание ' + h.stam + '/' + s.maxStam + cells(h.stam, s.maxStam, 'ar-cell-st') + '</div>' +
            figureSvg('self', c.last.guard, s.armor, pWound) +
            (c.finished ? '' : '<div class="ar-fig-hint">Щёлкните, что прикрыть. Цифры: броня.</div>') +
            '</td>' +
            '<td class="ar-duel-mid">' + controls + '</td>' +
            '<td class="ar-duelist ar-duelist-foe">' +
            '<div class="ar-duelist-name">' + esc(c.foeName) + '</div>' +
            '<div class="ar-small">' + esc(c.foeTitle) + '</div>' +
            '<div class="ar-gauge">Здоровье ' + c.foeHp + '/' + c.foeMaxHp + cells(c.foeHp, c.foeMaxHp, 'ar-cell-hp') + '</div>' +
            '<div class="ar-gauge">Дыхание ' + c.foeStam + '/' + c.foeMaxStam + cells(c.foeStam, c.foeMaxStam, 'ar-cell-st') + '</div>' +
            figureSvg('foe', c.last.strike, c.foeArmor, fWound) +
            (c.finished ? '' : '<div class="ar-fig-hint">Щёлкните, куда бить.</div>') +
            '</td></tr></table>' +
            '<div class="ar-protocol"><div class="ar-protocol-head">Протокол боя</div><ol reversed>' + log + '</ol></div>';
    }

    function oddsWord(p) {
        if (p >= 0.7) return 'вы сильнее';
        if (p >= 0.55) return 'чуть в вашу пользу';
        if (p > 0.45) return 'на равных';
        if (p > 0.3) return 'он сильнее';
        return 'не по зубам';
    }

    function renderArena(st) {
        var D0 = D();
        var g = G();
        var fighting = st.combat && !st.combat.finished;
        var rows = D0.RIVALS.map(function (r) {
            var rec = st.rivals[r.id];
            var odds = g.winOdds(st, r.id);
            var ord = D0.ORDERS[r.orderId];
            var can = !fighting && st.hero.groshi >= r.wager;
            return '<tr>' +
                '<td><b>' + esc(r.handle) + '</b> <span class="ar-small">(' + r.level + ' ур., <span style="color:' + ord.color + ';">' + esc(ord.shortName) + '</span>)</span><br>' +
                '<span class="ar-small">' + esc(r.realCity) + ', ' + esc(r.weaponName) + '</span><br>' +
                '<i class="ar-quote">' + esc(r.quote) + '</i></td>' +
                '<td class="ar-num">' + rec.rating + '<br><span class="ar-small">' + rec.wins + '/' + rec.losses + '</span></td>' +
                '<td>' + oddsWord(odds) + '<br><span class="ar-small">по рейтингу ' + Math.round(odds * 100) + '%</span></td>' +
                '<td class="ar-small">' + esc(r.style) + '</td>' +
                '<td class="ar-num">' + r.wager + ' гр.</td>' +
                '<td>' + (can ? btn('challenge', 'Вызвать', { rival: r.id }, 'ar-btn ar-btn-ember') : '<span class="ar-quiet">' + (fighting ? 'вы в бою' : 'нет ставки') + '</span>') + '</td>' +
                '</tr>';
        }).join('');
        return '<table class="ar-ring-top" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-ring-art"><svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<rect x="0" y="0" width="150" height="150" fill="#333333"/>' +
            '<circle cx="75" cy="78" r="60" fill="#996633" stroke="#000000" stroke-width="4"/>' +
            '<circle cx="75" cy="78" r="46" fill="none" stroke="#cc9966" stroke-width="2" stroke-dasharray="6,5"/>' +
            '<rect x="48" y="62" width="10" height="30" fill="#000000"/><rect x="92" y="62" width="10" height="30" fill="#000000"/>' +
            '<rect x="58" y="70" width="34" height="3" fill="#cccccc"/>' +
            '<rect x="70" y="8" width="10" height="14" fill="#cc9933"/><rect x="66" y="22" width="18" height="3" fill="#000000"/>' +
            '</svg></td>' +
            '<td class="ar-ring-rules">' +
            '<h2 class="ar-h2">Круг Поединков</h2>' +
            '<p>Судья Еремей принимает ставки от обоих бойцов. Победитель забирает обе, проигравший теряет свою. Лекари Круга ставят на ноги после любого исхода.</p>' +
            '<p>Рейтинг считается по шахматной формуле: за победу над сильным дают много, над слабым почти ничего. Жетон Круга дают только за победу над равным или сильным.</p>' +
            '<p>Соперники живые люди: замаха они не показывают, пока вы его не прочтёте, а внимательные замечают ваши привычки.</p>' +
            '<p>Ваш рейтинг: <b>' + st.hero.rating + '</b>, побед ' + st.hero.arenaWins + ', поражений ' + st.hero.arenaLosses + '. ' + link('chronicle', 'Лестница в Летописи') + '</p>' +
            '</td></tr></table>' +
            '<table class="ar-listing" cellpadding="0" cellspacing="0">' +
            '<tr><th>Боец</th><th>Рейтинг</th><th>Шансы</th><th>Повадка</th><th>Ставка</th><th></th></tr>' +
            rows + '</table>';
    }

    function durCells(inst) {
        var tpl = D().ITEMS[inst.itemId];
        if (tpl.slot === 'consumable') return '';
        return cells(inst.durability, inst.maxDurability, inst.durability <= 5 ? 'ar-cell-hp' : 'ar-cell-dur', 8) + ' <span class="ar-small">' + inst.durability + '/' + inst.maxDurability + '</span>';
    }

    function renderSmith(st) {
        var D0 = D();
        var g = G();
        var h = st.hero;
        var gear = st.inventory.filter(function (i) { return D0.ITEMS[i.itemId].slot !== 'consumable'; });
        var anvil = gear.map(function (inst) {
            var tpl = D0.ITEMS[inst.itemId];
            var worn = g.isEquipped(st, inst.uid);
            var rc = g.repairCost(st, inst);
            var tc = g.temperCost(inst);
            return '<tr>' +
                '<td><b>' + esc(g.itemTitle(inst)) + '</b>' + (worn ? ' <span class="ar-worn">надето</span>' : '') + '<br><span class="ar-small">' + esc(SLOT_NAMES[tpl.slot]) + '</span></td>' +
                '<td>' + durCells(inst) + '</td>' +
                '<td>' + (rc ? btn('repair', 'Починить, ' + rc + ' гр.', { uid: inst.uid }, 'ar-btn ar-btn-small') : '<span class="ar-quiet">цело</span>') + '</td>' +
                '<td>' + (inst.temper < 5 ? btn('temper', 'Проковать до +' + (inst.temper + 1) + ': ' + tc.groshi + ' гр., ' + tc.iron + ' жел.', { uid: inst.uid }, 'ar-btn ar-btn-small') : '<span class="ar-quiet">предел +5</span>') + '</td>' +
                '<td>' + (worn ? '' : btn('smelt', 'В горн', { uid: inst.uid }, 'ar-btn ar-btn-small') + ' ' + btn('list', 'В комиссию за ' + g.listPrice(inst) + ' гр.', { uid: inst.uid }, 'ar-btn ar-btn-small')) + '</td>' +
                '</tr>';
        }).join('');
        var board = SHOP_IDS.map(function (id) {
            var tpl = D0.ITEMS[id];
            var price = [tpl.costGroshi + ' гр.'];
            if (tpl.costIron) price.push(tpl.costIron + ' жел.');
            if (tpl.costTokens) price.push(tpl.costTokens + ' жет.');
            var can = h.groshi >= tpl.costGroshi && h.iron >= tpl.costIron && h.tokens >= tpl.costTokens;
            return '<tr><td class="ar-chalk-item">' + esc(tpl.name) + '<div class="ar-chalk-desc">' + esc(tpl.desc) + '</div></td>' +
                '<td class="ar-chalk-dots"></td>' +
                '<td class="ar-chalk-price">' + price.join(', ') + '</td>' +
                '<td>' + btn('buy', 'Купить', { item: id }, can ? 'ar-btn ar-btn-small' : 'ar-btn ar-btn-small ar-btn-dim') + '</td></tr>';
        }).join('');
        var ads = st.commissionLots.map(function (lot) {
            var tpl = D0.ITEMS[lot.itemId];
            return '<td class="ar-ad' + (lot.mine ? ' ar-ad-mine' : '') + '">' +
                '<div class="ar-ad-head">' + (lot.mine ? 'Ваш лот. ' : 'Продаю. ') + esc(tpl.name) + (lot.temper ? ' +' + lot.temper : '') + '</div>' +
                '<div>' + esc(lot.note) + '</div>' +
                (tpl.slot !== 'consumable' ? '<div class="ar-small">Прочность ' + lot.durability + '/' + lot.maxDurability + '.</div>' : '') +
                '<div class="ar-ad-price">' + lot.priceGroshi + ' гр. Спрашивать ' + esc(lot.seller) + '.</div>' +
                (lot.mine ? btn('withdraw', 'Снять', { lot: lot.lotId }, 'ar-btn ar-btn-small') : btn('buylot', 'Купить', { lot: lot.lotId }, 'ar-btn ar-btn-small')) +
                '</td>';
        });
        var adRows = '';
        for (var i = 0; i < ads.length; i += 3) adRows += '<tr>' + ads.slice(i, i + 3).join('') + '</tr>';
        return '<table class="ar-forge-top" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-forge-art"><svg width="170" height="120" viewBox="0 0 170 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<rect x="0" y="0" width="170" height="120" fill="#000000"/>' +
            '<rect x="10" y="70" width="44" height="40" fill="#333333"/><rect x="16" y="78" width="32" height="20" fill="#ff6600"/><rect x="22" y="84" width="20" height="10" fill="#ffcc00"/>' +
            '<polygon points="70,64 150,64 140,74 128,74 128,96 140,110 80,110 92,96 92,74 80,74" fill="#666666"/>' +
            '<rect x="70" y="64" width="80" height="3" fill="#999999"/>' +
            '<rect x="112" y="20" width="6" height="40" fill="#996633" transform="rotate(30 115 40)"/><rect x="98" y="16" width="26" height="12" fill="#999999" transform="rotate(30 111 22)"/>' +
            '<rect x="96" y="56" width="3" height="3" fill="#ffcc00"/><rect x="104" y="50" width="2" height="2" fill="#ff6600"/><rect x="88" y="52" width="2" height="2" fill="#ffcc00"/>' +
            '</svg></td>' +
            '<td class="ar-forge-text"><h2 class="ar-h2">Кузница мастера Громова</h2>' +
            '<p>Каждый бой стачивает снаряжение на 1, поражение на тракте на 3. Сломанная вещь (0) работает вполсилы. Проковка прибавляет урон или броню, а каждая следующая обходится дороже.</p>' +
            '<p>Комиссионный ряд работает без хозяина: выставленный лот покупают, пока вы на тракте, деньги ждут вас на Заставе.</p></td>' +
            '</tr></table>' +
            '<div class="ar-anvil"><div class="ar-anvil-head">На наковальне</div>' +
            (anvil ? '<table class="ar-anvil-table" cellpadding="0" cellspacing="0"><tr><th>Вещь</th><th>Прочность</th><th>Починка</th><th>Проковка</th><th>Сбыть</th></tr>' + anvil + '</table>' : '<p>У вас нет снаряжения.</p>') +
            '</div>' +
            '<table class="ar-chalk" cellpadding="0" cellspacing="0"><tr><td class="ar-chalk-frame">' +
            '<div class="ar-chalk-head">Прейскурант</div>' +
            '<table class="ar-chalk-list" cellpadding="0" cellspacing="0">' + board + '</table>' +
            '</td></tr></table>' +
            '<div class="ar-classifieds"><div class="ar-classifieds-head">Комиссионный ряд. Объявления</div>' +
            '<table class="ar-ads" cellpadding="0" cellspacing="6">' + adRows + '</table></div>';
    }

    function renderHero(st) {
        var D0 = D();
        var g = G();
        var h = st.hero;
        var s = g.heroStats(st);
        var origin = D0.ORIGINS[h.originId];
        var order = D0.ORDERS[h.orderId];
        var slots = ['weapon', 'helmet', 'cuirass', 'boots', 'amulet', 'belt'].map(function (slot) {
            var inst = g.findItem(st, st.equipped[slot]);
            return '<tr><td class="ar-slot-name">' + SLOT_NAMES[slot] + '</td><td>' + (inst ? '<b>' + esc(g.itemTitle(inst)) + '</b> ' + durCells(inst) : '<span class="ar-quiet">пусто</span>') + '</td></tr>';
        }).join('');
        var stat = function (key, name, what) {
            return '<tr><td>' + name + '</td><td class="ar-num">' + h[key] + '</td><td class="ar-small">' + what + '</td><td>' + (h.statPoints > 0 ? btn('stat', '+1', { stat: key }, 'ar-btn ar-btn-small') : '') + '</td></tr>';
        };
        var bag = st.inventory.map(function (inst) {
            var tpl = D0.ITEMS[inst.itemId];
            var worn = g.isEquipped(st, inst.uid);
            var line = [];
            if (tpl.atk) line.push('удар +' + (tpl.atk + inst.temper * 2));
            if (tpl.crit) line.push('точн. +' + (tpl.crit + inst.temper) + '%');
            if (tpl.armor) line.push('броня ' + (tpl.armor.head || 0) + '/' + (tpl.armor.torso || 0) + '/' + (tpl.armor.legs || 0));
            if (tpl.maxHp) line.push('здор. +' + tpl.maxHp);
            if (tpl.maxStam) line.push('дых. +' + tpl.maxStam);
            var act = tpl.slot === 'consumable'
                ? btn('use', 'Применить', { uid: inst.uid }, 'ar-btn ar-btn-small') + (worn ? '' : ' ' + btn('equip', 'На пояс', { uid: inst.uid }, 'ar-btn ar-btn-small'))
                : (worn ? '<span class="ar-worn">надето</span>' : btn('equip', 'Надеть', { uid: inst.uid }, 'ar-btn ar-btn-small'));
            return '<td class="ar-bag-cell' + (worn ? ' ar-bag-worn' : '') + '">' +
                '<div class="ar-bag-slot">' + SLOT_NAMES[tpl.slot] + '</div>' +
                '<div class="ar-bag-name">' + esc(g.itemTitle(inst)) + '</div>' +
                '<div class="ar-small">' + esc(line.join(', ') || tpl.desc) + '</div>' +
                (tpl.slot !== 'consumable' ? '<div>' + durCells(inst) + '</div>' : '') +
                '<div class="ar-bag-act">' + act + '</div></td>';
        });
        var bagRows = '';
        for (var i = 0; i < bag.length; i += 4) {
            var row = bag.slice(i, i + 4);
            while (row.length < 4) row.push('<td class="ar-bag-cell ar-bag-none"></td>');
            bagRows += '<tr>' + row.join('') + '</tr>';
        }
        return '<div class="ar-dossier">' +
            '<div class="ar-dossier-head">Личное дело путника № ' + (4800 + st.road.expeditions + h.level) + '-СБ</div>' +
            '<table class="ar-dossier-top" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-photo">' + originPortrait(h.originId, 96) + '<div class="ar-small">' + esc(origin.name) + '</div></td>' +
            '<td class="ar-dossier-fields">' +
            '<table class="ar-fields" cellpadding="0" cellspacing="0">' +
            '<tr><td>Прозвище</td><td><b>' + esc(h.handle) + '</b></td></tr>' +
            '<tr><td>Приказ</td><td>' + esc(order.name) + '</td></tr>' +
            '<tr><td>Уровень</td><td>' + h.level + ' (опыт ' + h.xp + ' из ' + h.xpNext + ')' + cells(h.xp, h.xpNext, 'ar-cell-xp') + '</td></tr>' +
            '<tr><td>Удар</td><td>' + s.atk + ', точный удар ' + s.crit + '%</td></tr>' +
            '<tr><td>Чтение замаха</td><td>' + s.read + '%</td></tr>' +
            '<tr><td>Броня</td><td>голова ' + s.armor.head + ', корпус ' + s.armor.torso + ', ноги ' + s.armor.legs + '</td></tr>' +
            '<tr><td>Приём</td><td>«' + esc(origin.passiveName) + '»: ' + esc(origin.passiveDesc) + '</td></tr>' +
            '<tr><td>Привилегия</td><td>' + esc(order.bonusDesc) + '</td></tr>' +
            '</table></td></tr></table>' +
            '<table class="ar-dossier-mid" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-stats"><div class="ar-sub">Характеристики' + (h.statPoints ? ': свободных очков ' + h.statPoints : '') + '</div>' +
            '<table class="ar-stat-table" cellpadding="0" cellspacing="0">' +
            stat('vigor', 'Сила', '+0.75 к удару') +
            stat('grit', 'Крепость', '+6 здоровья, +4 дыхания') +
            stat('focus', 'Глазомер', '+6% чтения, +1.5% точного удара') +
            '</table></td>' +
            '<td class="ar-slots"><div class="ar-sub">Надето</div><table class="ar-slot-table" cellpadding="0" cellspacing="0">' + slots + '</table></td>' +
            '</tr></table>' +
            '<div class="ar-sub">Вещевой мешок</div>' +
            '<table class="ar-bag" cellpadding="0" cellspacing="4">' + bagRows + '</table>' +
            '<p class="ar-dossier-foot">' + btn('dossier', 'Выгрузить личное дело в Блокнот', {}, 'ar-btn') + ' <span class="ar-small">Файл ляжет в C:\\My Documents\\Ashroad98_Hero.txt</span></p>' +
            '</div>';
    }

    function renderChronicle(st) {
        var D0 = D();
        var g = G();
        var inf = st.orderInfluence;
        var total = Object.keys(inf).reduce(function (a, k) { return a + inf[k]; }, 0) || 1;
        var bars = Object.keys(D0.ORDERS).map(function (k) {
            var pct = Math.round(inf[k] / total * 100);
            return '<tr><td class="ar-inf-name">' + esc(D0.ORDERS[k].name) + (k === st.hero.orderId ? ' (ваш)' : '') + '</td>' +
                '<td class="ar-inf-bar"><table cellpadding="0" cellspacing="0" width="' + (pct * 3) + '"><tr><td style="background-color:' + D0.ORDERS[k].color + ';height:10px;"></td></tr></table></td>' +
                '<td class="ar-num">' + inf[k] + '</td></tr>';
        }).join('');
        var ladder = g.ladder(st).map(function (r, i) {
            return '<tr' + (r.isPlayer ? ' class="ar-me"' : '') + '><td class="ar-num">' + (i + 1) + '</td><td>' + esc(r.handle) + '</td><td>' + esc(r.city.replace(/ \(.+\)$/, '')) + '</td><td>' + esc(D0.ORDERS[r.orderId].shortName) + '</td><td class="ar-num">' + r.rating + '</td><td class="ar-num">' + r.wins + '/' + r.losses + '</td></tr>';
        }).join('');
        var events = st.events.length ? st.events.map(function (e) { return '<li><b>' + esc(e.time) + '</b> ' + esc(e.text) + '</li>'; }).join('') : '<li>Пока о вас не писали. Сделайте что-нибудь громкое.</li>';
        var lore = D0.CHRONICLE_LORE.map(function (e) {
            return '<div class="ar-article"><div class="ar-article-date">' + esc(e.date) + '</div><div class="ar-article-title">' + esc(e.title) + '</div><p>' + esc(e.body) + '</p></div>';
        }).join('');
        return '<div class="ar-paper">' +
            '<div class="ar-paper-mast">Летопись Заставы</div>' +
            '<div class="ar-paper-sub">Листок комендатуры «Старого Брода». Выходит, когда есть что сказать. Октябрь 1998 г.</div>' +
            '<table class="ar-paper-cols" cellpadding="0" cellspacing="0"><tr>' +
            '<td class="ar-paper-col">' +
            '<div class="ar-paper-h">Вестник</div><ul class="ar-events">' + events + '</ul>' +
            '<div class="ar-paper-h">Кто держит тракт</div>' +
            '<table class="ar-inf" cellpadding="0" cellspacing="0">' + bars + '</table>' +
            '<p class="ar-small">Влияние растёт от побед ваших и чужих, от выполненных подрядов и открытых путей.</p>' +
            '<div class="ar-paper-h">Памятка новобранцу</div>' +
            '<p><b>Бой.</b> Каждый раунд вы и враг одновременно выбираете, куда бить, что прикрыть и каким приёмом. Выпад сбивает Размах, Размах ломает прикрытие и Передышку, Финт обходит прикрытую зону, Передышка гасит Выпад и даёт дыхание.</p>' +
            '<p><b>Наблюдение.</b> Глазомер решает, прочтёте ли вы замах точно. Не прочли: видна пара зон, а Финт выглядит как другой приём. Оглушённого врага читаешь наверняка. В темноте без факела не видно ничего.</p>' +
            '<p><b>Тракт.</b> Враги перекрывают путь, пока их не одолеть, и возвращаются к следующей вылазке. Жар тракта растит добычу с каждой победой. Костёр греет один раз за вылазку.</p>' +
            '</td>' +
            '<td class="ar-paper-col ar-paper-col-r">' +
            '<div class="ar-paper-h">Лестница Круга</div>' +
            '<table class="ar-ladder" cellpadding="0" cellspacing="0"><tr><th>№</th><th>Боец</th><th>Город</th><th>Приказ</th><th>Рейтинг</th><th>П/П</th></tr>' + ladder + '</table>' +
            '<div class="ar-paper-h">Из архива комендатуры</div>' + lore +
            '</td></tr></table></div>';
    }

    function renderMissing(address) {
        return '<div class="ar-empty"><h2 class="ar-h2">Такой версты на тракте нет</h2>' +
            '<p>Адрес ' + esc(address) + ' не ведёт ни к одному зданию Заставы.</p>' +
            '<p>' + link('square', 'На площадь Заставы') + '</p></div>';
    }

    function renderSite(address) {
        var st = G().loadState();
        var route = parseRoute(address);
        var body;
        if (route === 'gate') body = renderGate(st);
        else if (route === 'square') body = renderSquare(st);
        else if (route === 'road') body = renderRoad(st);
        else if (route === 'fight') body = renderFight(st);
        else if (route === 'arena') body = renderArena(st);
        else if (route === 'smith') body = renderSmith(st);
        else if (route === 'hero') body = renderHero(st);
        else if (route === 'chronicle') body = renderChronicle(st);
        else body = renderMissing(address);
        return '<div class="ar-page" data-ar-route="' + route + '">' +
            '<table class="ar-frame" cellpadding="0" cellspacing="0">' +
            '<tr><td class="ar-mast">' + renderMasthead(st) + '</td></tr>' +
            renderSigns(st, route) +
            renderPassStrip(st) +
            renderNotices(st, route) +
            '<tr><td class="ar-body ar-body-' + route + '">' + body + '</td></tr>' +
            renderFooter() +
            '</table></div>';
    }

    function exportDossier(st) {
        var text = G().dossierText(st);
        var folder = ['My Computer', 'C:', 'My Documents'];
        var name = 'Ashroad98_Hero.txt';
        try {
            if (window.vfs && typeof window.vfs.writeFile === 'function') window.vfs.writeFile(folder, name, text);
        } catch (e) {}
        try {
            if (window.appNotepad && typeof window.appNotepad.open === 'function') window.appNotepad.open(name, text, folder);
        } catch (e) {}
        G().setFlash(st, 'Личное дело выгружено в C:\\My Documents\\' + name + ' и открыто в Блокноте.');
        G().saveState(st);
        return text;
    }

    function act(name, attrs) {
        var g = G();
        var st = g.loadState();
        var a = attrs || {};
        switch (name) {
            case 'reset':
                g.resetState({ registered: false, seed: st.seed });
                g.setFlash(g.loadState(), 'Старый пропуск сожжён. Впишите себя заново.');
                g.saveState(g.loadState());
                return { go: 'gate' };
            case 'room':
                g.setChatRoom(st, a.room);
                return { go: 'square' };
            case 'claim':
                g.claimContract(st, a.id);
                return { stay: true };
            case 'equip':
                g.equip(st, a.uid);
                return { stay: true };
            case 'use':
                g.useItem(st, a.uid);
                return { stay: true };
            case 'stat':
                g.allocStat(st, a.stat);
                return { stay: true };
            case 'dossier':
                exportDossier(st);
                return { stay: true };
            case 'challenge':
                return g.startArenaCombat(st, a.rival) ? { go: 'fight' } : { stay: true };
            case 'close':
                g.closeCombat(st);
                return { go: a.next === 'road' ? 'road' : 'arena' };
            case 'move':
                g.moveTo(st, a.node);
                return { go: 'road' };
            case 'patrol':
                return g.patrol(st) === 'combat' ? { go: 'fight' } : { stay: true };
            case 'shortcut':
                return g.unlockShortcut(st) === 'combat' ? { go: 'fight' } : { stay: true };
            case 'camp':
                g.camp(st);
                return { stay: true };
            case 'courier':
                g.sendCourier(st);
                return { stay: true };
            case 'home':
                g.escortHome(st);
                return { go: 'square' };
            case 'repair':
                g.repair(st, a.uid);
                return { stay: true };
            case 'temper':
                g.temper(st, a.uid);
                return { stay: true };
            case 'smelt':
                g.smelt(st, a.uid);
                return { stay: true };
            case 'list':
                g.listLot(st, a.uid);
                return { stay: true };
            case 'withdraw':
                g.withdrawLot(st, a.lot);
                return { stay: true };
            case 'buylot':
                g.buyLot(st, a.lot);
                return { stay: true };
            case 'buy':
                g.buyShop(st, a.item);
                return { stay: true };
            case 'round':
                g.executeRound(st, a.strike, a.stance, a.guard);
                return { stay: true };
            case 'say':
                g.sayInChat(st, a.text);
                return { stay: true };
            case 'register':
                g.register(st, a);
                return { go: 'square' };
            case 'node':
                if (a.node === st.road.currentNodeId) return g.patrol(st) === 'combat' ? { go: 'fight' } : { stay: true };
                g.moveTo(st, a.node);
                return { go: 'road' };
            default:
                return { stay: true };
        }
    }

    function attachEvents(win, container, ieApp) {
        var ie = ieApp || window.appIE;
        var root = container.querySelector('.ar-page');
        if (!root) return;
        var route = root.getAttribute('data-ar-route');
        var frame = container;
        var sound = function () {
            if (window.soundSys && typeof window.soundSys.playClick === 'function') window.soundSys.playClick();
        };
        var follow = function (res) {
            if (!ie || !win) return;
            if (res && res.go && res.go !== route) {
                ie.navigate(win, url(res.go));
                return;
            }
            var top = frame.scrollTop || 0;
            ie.renderPage(win, ie.currentUrl || url(route));
            frame.scrollTop = top;
        };
        var log = root.querySelector('#ar-chat-log');
        if (log) log.scrollTop = log.scrollHeight;

        root.querySelectorAll('a[href^="' + BASE + '"]').forEach(function (a) {
            a.addEventListener('click', function (ev) {
                ev.preventDefault();
                if (ie && win) ie.navigate(win, a.getAttribute('href'));
            });
        });
        root.querySelectorAll('[data-ar-act]').forEach(function (el) {
            el.addEventListener('click', function (ev) {
                ev.preventDefault();
                sound();
                var attrs = {};
                ['id', 'uid', 'room', 'rival', 'next', 'node', 'lot', 'item', 'stat'].forEach(function (k) {
                    var v = el.getAttribute('data-' + k);
                    if (v !== null) attrs[k] = v;
                });
                follow(act(el.getAttribute('data-ar-act'), attrs));
            });
        });
        root.querySelectorAll('[data-ar-go]').forEach(function (el) {
            el.addEventListener('click', function () {
                sound();
                var room = el.getAttribute('data-room');
                var jump = el.getAttribute('data-jump');
                if (room) {
                    G().setChatRoom(G().loadState(), room);
                    follow({ stay: true });
                    var chat = frame.querySelector('.ar-chat');
                    if (chat) frame.scrollTop += chat.getBoundingClientRect().top - frame.getBoundingClientRect().top - 4;
                    return;
                }
                if (jump) {
                    var target = frame.querySelector('#' + jump);
                    if (target) frame.scrollTop += target.getBoundingClientRect().top - frame.getBoundingClientRect().top - 4;
                    return;
                }
                follow({ go: el.getAttribute('data-ar-go') });
            });
        });
        root.querySelectorAll('[data-ar-node]').forEach(function (el) {
            el.addEventListener('click', function () {
                var st = G().loadState();
                var id = el.getAttribute('data-ar-node');
                if (id !== st.road.currentNodeId && !G().isReachable(st, id)) {
                    G().setFlash(st, G().isBlocked(st) ? 'Враг перекрыл тропу: драться или назад тем же путём.' : 'Туда за один переход не дойти. Идите по соседним секторам, они обведены пунктиром.', true);
                    G().saveState(st);
                    follow({ stay: true });
                    return;
                }
                sound();
                follow(act('node', { node: id }));
            });
        });
        root.querySelectorAll('[data-ar-zone]').forEach(function (el) {
            el.addEventListener('click', function () {
                var side = el.getAttribute('data-side');
                var zone = el.getAttribute('data-ar-zone');
                var name = side === 'foe' ? 'ar_strike' : 'ar_guard';
                var radio = root.querySelector('input[name="' + name + '"][value="' + zone + '"]');
                if (radio) radio.checked = true;
                root.querySelectorAll('[data-ar-zone][data-side="' + side + '"]').forEach(function (z) {
                    z.setAttribute('class', 'ar-zone' + (z === el ? ' ar-zone-on' : ''));
                });
            });
        });
        root.querySelectorAll('input[name="ar_strike"], input[name="ar_guard"]').forEach(function (r) {
            r.addEventListener('change', function () {
                var side = r.name === 'ar_strike' ? 'foe' : 'self';
                root.querySelectorAll('[data-ar-zone][data-side="' + side + '"]').forEach(function (z) {
                    z.setAttribute('class', 'ar-zone' + (z.getAttribute('data-ar-zone') === r.value ? ' ar-zone-on' : ''));
                });
            });
        });
        root.querySelectorAll('input[name="ar_stance"]').forEach(function (r) {
            r.addEventListener('change', function () {
                root.querySelectorAll('.ar-stance').forEach(function (l) {
                    var inp = l.querySelector('input');
                    l.className = 'ar-stance' + (inp && inp.checked ? ' ar-stance-on' : '') + (l.className.indexOf('ar-stance-cant') !== -1 ? ' ar-stance-cant' : '');
                });
            });
        });
        root.querySelectorAll('input[name="ar_origin"], input[name="ar_order"]').forEach(function (r) {
            r.addEventListener('change', function () {
                root.querySelectorAll('input[name="' + r.name + '"]').forEach(function (o) {
                    var cell = o.closest ? o.closest('td') : null;
                    if (cell) cell.className = cell.className.replace(' ar-picked', '') + (o.checked ? ' ar-picked' : '');
                });
            });
        });
        var handle = root.querySelector('#ar-handle');
        var passName = root.querySelector('#ar-pass-name');
        if (handle && passName) {
            handle.addEventListener('input', function () {
                passName.textContent = handle.value.trim() || '...';
            });
        }
        var pick = function (form, name, fallback) {
            var r = form.querySelector('input[name="' + name + '"]:checked');
            return r ? r.value : fallback;
        };
        var gate = root.querySelector('#ar-gate-form');
        if (gate) {
            gate.addEventListener('submit', function (ev) {
                ev.preventDefault();
                sound();
                follow(act('register', { handle: handle ? handle.value : '', originId: pick(gate, 'ar_origin'), orderId: pick(gate, 'ar_order') }));
            });
        }
        var chat = root.querySelector('#ar-chat-form');
        if (chat) {
            chat.addEventListener('submit', function (ev) {
                ev.preventDefault();
                var inp = root.querySelector('#ar-chat-input');
                if (!inp || !inp.value.trim()) return;
                follow(act('say', { text: inp.value }));
                var again = frame.querySelector('#ar-chat-input');
                if (again && typeof again.focus === 'function') again.focus();
            });
        }
        var fight = root.querySelector('#ar-fight-form');
        if (fight) {
            fight.addEventListener('submit', function (ev) {
                ev.preventDefault();
                sound();
                follow(act('round', { strike: pick(fight, 'ar_strike', 'torso'), guard: pick(fight, 'ar_guard', 'torso'), stance: pick(fight, 'ar_stance', 'thrust') }));
            });
        }
    }

    window.ashroadSite = {
        BASE: BASE,
        parseRoute: parseRoute,
        renderSite: renderSite,
        attachEvents: attachEvents,
        act: act,
        exportDossier: exportDossier
    };
})();
