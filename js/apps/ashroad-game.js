(function () {
    'use strict';

    var STORAGE_KEY = 'win98_ashroad98_state_v2';
    var LEGACY_KEY = 'win98_ashroad98_state_v1';
    var GEAR_SLOTS = ['weapon', 'helmet', 'cuirass', 'boots', 'amulet'];
    var ZONE_ORDER = ['head', 'torso', 'legs'];
    var HEAT_STEP = 0.15;
    var HEAT_MAX = 5;
    var COURIER_FEE = 0.15;
    var CAMP_TORCH = 4;
    var ROUND_REGEN = 4;
    var ELO_K = 32;
    var DARK_MOVE_DAMAGE = 6;
    var ARMOR_FACTOR = 0.65;
    var GUARD_PASS = 0.35;
    var SHELTER_GUARD_PASS = 0.25;
    var TERRAIN = {
        'Открытая гать': 'open',
        'Узкий проход': 'narrow',
        'Двор с укрытиями': 'shelter',
        'Ярус колоколов': 'belfry'
    };

    function data() {
        return window.ashroadData;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function nextRandom(st) {
        st.seed = (Math.imul(st.seed >>> 0, 1103515245) + 12345) >>> 0;
        return ((st.seed >>> 8) & 0xffffff) / 0x1000000;
    }

    function clockTime() {
        var d = new Date();
        var hh = d.getHours();
        var mm = d.getMinutes();
        return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
    }

    function zoneName(zoneId) {
        if (zoneId === 'head') return 'голова';
        if (zoneId === 'legs') return 'ноги';
        return 'корпус';
    }

    function zoneAcc(zoneId) {
        if (zoneId === 'head') return 'голову';
        if (zoneId === 'legs') return 'ноги';
        return 'корпус';
    }

    function stanceById(id) {
        var list = data().STANCES;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return list[0];
    }

    function terrainOf(sightline) {
        return TERRAIN[sightline] || 'shelter';
    }

    function makeItem(st, itemId, temper) {
        var tpl = data().ITEMS[itemId];
        if (!tpl) return null;
        var maxDur = tpl.maxDurability || 1;
        return {
            uid: 'itm_' + (st.uidCounter++),
            itemId: itemId,
            temper: temper || 0,
            durability: maxDur,
            maxDurability: maxDur
        };
    }

    function freshRivals() {
        var out = {};
        data().RIVALS.forEach(function (r) {
            out[r.id] = { rating: r.rating, wins: r.wins, losses: r.losses };
        });
        return out;
    }

    function createState(opts) {
        var D = data();
        opts = opts || {};
        var originId = D.ORIGINS[opts.originId] ? opts.originId : 'dragoon';
        var orderId = D.ORDERS[opts.orderId] ? opts.orderId : 'guard';
        var handle = opts.handle && String(opts.handle).trim() ? String(opts.handle).trim().slice(0, 20) : 'Странник_98';
        var origin = D.ORIGINS[originId];
        var st = {
            version: 2,
            registered: Boolean(opts.registered),
            uidCounter: 1,
            seed: (typeof opts.seed === 'number' ? opts.seed : (Date.now() % 2147483647)) >>> 0,
            hero: {
                handle: handle,
                originId: originId,
                orderId: orderId,
                level: 1,
                xp: 0,
                xpNext: 100,
                statPoints: 1,
                vigor: origin.stats.vigor,
                grit: origin.stats.grit,
                focus: origin.stats.focus,
                hp: 1,
                stam: 1,
                torch: 1,
                groshi: 85,
                iron: 2,
                tokens: 1,
                rating: 1035,
                arenaWins: 0,
                arenaLosses: 0,
                roadClears: 0,
                bossKills: 0,
                bossDefeated: false
            },
            equipped: { weapon: null, helmet: null, cuirass: null, boots: null, amulet: null, belt: null },
            inventory: [],
            road: {
                currentNodeId: 'ford_gate',
                visitedNodes: { ford_gate: true },
                clearedNodes: {},
                shortcuts: { ferry_plank: false, mine_cage: false },
                lootBag: { groshi: 0, iron: 0 },
                heat: 0,
                onExpedition: false,
                expeditions: 0,
                campsUsed: {},
                trail: ['ford_gate'],
                journal: ['Октябрь 1998 г. Получен железный пропуск на Заставе «Старый Брод». Сигнальная жаровня горит ровно.']
            },
            combat: null,
            contracts: {},
            orderInfluence: {},
            rivals: freshRivals(),
            commissionLots: [],
            poolCursor: 0,
            chatRoom: 'square',
            chatLogs: {},
            chatReplyCursor: 0,
            ambientCursor: 0,
            events: [],
            flash: null
        };
        origin.starterItems.forEach(function (itemId) {
            var inst = makeItem(st, itemId, 0);
            if (!inst) return;
            st.inventory.push(inst);
            var slot = D.ITEMS[itemId].slot === 'consumable' ? 'belt' : D.ITEMS[itemId].slot;
            if (!st.equipped[slot]) st.equipped[slot] = inst.uid;
        });
        Object.keys(D.CHAT_CHANNELS).forEach(function (key) {
            st.chatLogs[key] = D.CHAT_CHANNELS[key].initial.map(function (m) {
                return { time: m.time, author: m.author, text: m.text, isSystem: false };
            });
        });
        D.CONTRACTS.forEach(function (c) {
            st.contracts[c.id] = { progress: 0, claimed: false };
        });
        Object.keys(D.ORDERS).forEach(function (k) {
            st.orderInfluence[k] = D.ORDERS[k].baseInfluence;
        });
        st.commissionLots = D.COMMISSION_INITIAL.map(function (lot) {
            return {
                lotId: lot.lotId,
                itemId: lot.itemId,
                temper: lot.temper,
                durability: lot.durability,
                maxDurability: lot.maxDurability,
                seller: lot.seller,
                priceGroshi: lot.priceGroshi,
                note: lot.note,
                mine: false
            };
        });
        var derived = heroStats(st);
        st.hero.hp = derived.maxHp;
        st.hero.stam = derived.maxStam;
        st.hero.torch = derived.maxTorch;
        return st;
    }

    function migrateLegacy(old) {
        var st = createState({ registered: Boolean(old.registered), handle: old.hero.handle, originId: old.hero.originId, orderId: old.hero.orderId });
        ['level', 'xp', 'xpNext', 'statPoints', 'vigor', 'grit', 'focus', 'groshi', 'iron', 'tokens', 'rating', 'arenaWins', 'arenaLosses', 'roadClears', 'bossDefeated'].forEach(function (k) {
            if (old.hero[k] !== undefined) st.hero[k] = old.hero[k];
        });
        st.hero.groshi += (old.road.lootBag && old.road.lootBag.groshi) || 0;
        st.hero.iron += (old.road.lootBag && old.road.lootBag.iron) || 0;
        if (Array.isArray(old.inventory) && old.inventory.length) {
            st.inventory = old.inventory.filter(function (i) { return data().ITEMS[i.itemId]; });
            st.equipped = old.equipped || st.equipped;
            st.uidCounter = (old.uidCounter || 50) + 1;
        }
        st.road.visitedNodes = old.road.visitedNodes || st.road.visitedNodes;
        st.road.shortcuts = old.road.shortcuts || st.road.shortcuts;
        if (old.contracts) {
            Object.keys(st.contracts).forEach(function (k) {
                if (old.contracts[k]) st.contracts[k] = old.contracts[k];
            });
        }
        var derived = heroStats(st);
        st.hero.hp = derived.maxHp;
        st.hero.stam = derived.maxStam;
        st.hero.torch = derived.maxTorch;
        return st;
    }

    var memoryState = null;

    function isValidState(s) {
        return s && s.version === 2 && s.hero && s.road && Array.isArray(s.inventory) && s.rivals;
    }

    function loadState() {
        if (memoryState) {
            try {
                if (localStorage.getItem(STORAGE_KEY) === null) memoryState = null;
            } catch (e) {}
        }
        if (!memoryState) {
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                var parsed = raw ? JSON.parse(raw) : null;
                if (isValidState(parsed)) memoryState = parsed;
                if (!memoryState) {
                    var legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
                    if (legacy && legacy.hero && legacy.road) {
                        memoryState = migrateLegacy(legacy);
                        localStorage.removeItem(LEGACY_KEY);
                    }
                }
            } catch (e) {}
        }
        if (!memoryState) memoryState = createState({ registered: false });
        saveState(memoryState);
        return memoryState;
    }

    function saveState(st) {
        memoryState = st;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
        } catch (e) {}
    }

    function resetState(opts) {
        var st = createState(opts || { registered: true });
        saveState(st);
        return st;
    }

    function findItem(st, uid) {
        if (!uid) return null;
        for (var i = 0; i < st.inventory.length; i++) {
            if (st.inventory[i].uid === uid) return st.inventory[i];
        }
        return null;
    }

    function removeItem(st, uid) {
        for (var i = 0; i < st.inventory.length; i++) {
            if (st.inventory[i].uid === uid) {
                st.inventory.splice(i, 1);
                break;
            }
        }
        Object.keys(st.equipped).forEach(function (slot) {
            if (st.equipped[slot] === uid) st.equipped[slot] = null;
        });
    }

    function isEquipped(st, uid) {
        return Object.keys(st.equipped).some(function (slot) { return st.equipped[slot] === uid; });
    }

    function itemTitle(inst) {
        if (!inst) return 'Пусто';
        var tpl = data().ITEMS[inst.itemId];
        if (!tpl) return inst.itemId;
        return tpl.name + (inst.temper > 0 ? ' +' + inst.temper : '');
    }

    function heroStats(st) {
        var D = data();
        var h = st.hero;
        var origin = D.ORIGINS[h.originId] || D.ORIGINS.dragoon;
        var maxHp = origin.maxHp + (h.level - 1) * 12 + (h.grit - origin.stats.grit) * 6;
        var maxStam = origin.maxStam + (h.level - 1) * 6 + (h.grit - origin.stats.grit) * 4 + (h.orderId === 'guild' ? 5 : 0);
        var maxTorch = h.orderId === 'bell' ? 14 : 12;
        var atk = 8 + Math.floor(h.vigor * 0.75) + (h.level - 1) * 2;
        var crit = 2 + Math.floor((h.focus - 8) * 1.5);
        var armor = { head: 0, torso: 0, legs: 0 };
        var worn = 0;
        var weaponName = 'Кулаки';
        GEAR_SLOTS.forEach(function (slot) {
            var inst = findItem(st, st.equipped[slot]);
            if (!inst) return;
            var tpl = D.ITEMS[inst.itemId];
            if (!tpl) return;
            var factor = inst.durability <= 0 ? 0.5 : 1;
            if (inst.durability <= 5) worn++;
            var t = inst.temper || 0;
            if (slot === 'weapon') weaponName = itemTitle(inst);
            if (tpl.atk) atk += Math.round((tpl.atk + t * 2) * factor);
            if (tpl.crit) crit += Math.round((tpl.crit + t) * factor);
            if (tpl.maxHp) maxHp += Math.round((tpl.maxHp + t * 4) * factor);
            if (tpl.maxStam) maxStam += Math.round((tpl.maxStam + t * 2) * factor);
            if (tpl.armor) {
                ZONE_ORDER.forEach(function (z) {
                    if (tpl.armor[z]) armor[z] += Math.round((tpl.armor[z] + t) * factor);
                });
            }
        });
        var read = 30 + (h.focus - 10) * 6 + (h.originId === 'scribe' ? 15 : 0);
        h.hp = clamp(h.hp, 0, maxHp);
        h.stam = clamp(h.stam, 0, maxStam);
        h.torch = clamp(h.torch, 0, maxTorch);
        return {
            maxHp: maxHp,
            maxStam: maxStam,
            maxTorch: maxTorch,
            atk: atk,
            crit: clamp(crit, 0, 60),
            read: clamp(read, 10, 90),
            armor: armor,
            weaponName: weaponName,
            worn: worn
        };
    }

    function setFlash(st, text, warn) {
        st.flash = { text: text, warn: Boolean(warn) };
    }

    function takeFlash(st) {
        var f = st.flash;
        if (f) {
            st.flash = null;
            saveState(st);
        }
        return f;
    }

    function journal(st, text) {
        st.road.journal.unshift(text);
        if (st.road.journal.length > 14) st.road.journal.length = 14;
    }

    function addEvent(st, text) {
        st.events.unshift({ time: clockTime(), text: text });
        if (st.events.length > 12) st.events.length = 12;
    }

    function chatLine(st, room, author, text, isSystem) {
        var log = st.chatLogs[room] || st.chatLogs.square;
        log.push({ time: clockTime(), author: author, text: text, isSystem: Boolean(isSystem) });
        while (log.length > 30) log.shift();
    }

    function advanceContract(st, type, id, amount) {
        data().CONTRACTS.forEach(function (c) {
            var prog = st.contracts[c.id];
            if (!prog || prog.claimed || c.targetType !== type) return;
            if (c.targetId !== id && c.targetId !== 'any') return;
            if (type === 'bank_haul') prog.progress = Math.min(c.required, Math.max(prog.progress, amount));
            else prog.progress = Math.min(c.required, prog.progress + (amount || 1));
        });
    }

    function claimContract(st, contractId) {
        var D = data();
        var c = D.CONTRACTS.filter(function (x) { return x.id === contractId; })[0];
        var prog = c && st.contracts[c.id];
        if (!prog || prog.claimed || prog.progress < c.required) {
            setFlash(st, 'Подряд ещё не выполнен.', true);
            return false;
        }
        prog.claimed = true;
        st.hero.groshi += c.rewardGroshi;
        st.hero.iron += c.rewardIron;
        st.hero.tokens += c.rewardTokens;
        st.orderInfluence[c.orderId] += 25;
        var leveled = awardXp(st, c.rewardXp);
        setFlash(st, 'Подряд «' + c.title + '» оплачен: +' + c.rewardGroshi + ' гр., +' + c.rewardIron + ' жел., +' + c.rewardTokens + ' жет., +' + c.rewardXp + ' опыта.' + (leveled ? ' Новый уровень: ' + st.hero.level + '.' : ''));
        saveState(st);
        return true;
    }

    function awardXp(st, amount) {
        var h = st.hero;
        h.xp += amount;
        var leveled = false;
        while (h.xp >= h.xpNext) {
            h.xp -= h.xpNext;
            h.level += 1;
            h.xpNext = Math.round(h.xpNext * 1.45);
            h.statPoints += 2;
            leveled = true;
        }
        if (leveled) {
            var derived = heroStats(st);
            h.hp = derived.maxHp;
            h.stam = derived.maxStam;
            addEvent(st, h.handle + ' получил ' + h.level + '-й уровень.');
        }
        return leveled;
    }

    function allocStat(st, stat) {
        if (st.hero.statPoints <= 0 || ['vigor', 'grit', 'focus'].indexOf(stat) === -1) return false;
        var before = heroStats(st);
        st.hero[stat] += 1;
        st.hero.statPoints -= 1;
        var after = heroStats(st);
        st.hero.hp += after.maxHp - before.maxHp;
        st.hero.stam += after.maxStam - before.maxStam;
        saveState(st);
        return true;
    }

    function nodeById(id) {
        var nodes = data().NODES;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) return nodes[i];
        }
        return nodes[0];
    }

    function shortcutLinks(st, nodeId) {
        var out = [];
        var sc = data().SHORTCUTS;
        Object.keys(sc).forEach(function (k) {
            if (!st.road.shortcuts[k]) return;
            if (sc[k].from === nodeId) out.push(sc[k].to);
            if (sc[k].to === nodeId) out.push(sc[k].from);
        });
        return out;
    }

    function isHostile(st, node) {
        return node.enemyPool && node.enemyPool.length > 0 && !st.road.clearedNodes[node.id];
    }

    function isBlocked(st) {
        return isHostile(st, nodeById(st.road.currentNodeId));
    }

    function reachableIds(st) {
        var cur = nodeById(st.road.currentNodeId);
        var list = cur.connections.concat(shortcutLinks(st, cur.id)).filter(function (id, i, arr) {
            return arr.indexOf(id) === i;
        });
        if (isHostile(st, cur)) {
            var back = st.road.trail[st.road.trail.length - 2];
            return list.filter(function (id) { return id === back; });
        }
        return list;
    }

    function isReachable(st, nodeId) {
        return reachableIds(st).indexOf(nodeId) !== -1;
    }

    function isKnown(st, nodeId) {
        if (st.road.visitedNodes[nodeId]) return true;
        return data().NODES.some(function (n) {
            return st.road.visitedNodes[n.id] && n.connections.indexOf(nodeId) !== -1;
        });
    }

    function heatMultiplier(st) {
        return 1 + st.road.heat * HEAT_STEP;
    }

    function bankBag(st, viaCourier) {
        var bag = st.road.lootBag;
        var g = bag.groshi;
        var i = bag.iron;
        if (viaCourier) {
            g = Math.floor(g * (1 - COURIER_FEE));
            i = Math.floor(i * (1 - COURIER_FEE));
        }
        st.hero.groshi += g;
        st.hero.iron += i;
        if (g > 0) advanceContract(st, 'bank_haul', 'any', g);
        bag.groshi = 0;
        bag.iron = 0;
        st.road.heat = 0;
        return { groshi: g, iron: i };
    }

    function arriveAtGate(st, reason) {
        var derived = heroStats(st);
        var banked = bankBag(st, false);
        st.road.currentNodeId = 'ford_gate';
        st.road.trail = ['ford_gate'];
        st.road.clearedNodes = {};
        st.road.campsUsed = {};
        st.road.onExpedition = false;
        st.hero.hp = derived.maxHp;
        st.hero.stam = derived.maxStam;
        st.hero.torch = derived.maxTorch;
        var sold = settleCommission(st);
        restockCommission(st);
        ambientChat(st);
        var msg = reason + ' Факел, силы и здоровье восстановлены.';
        if (banked.groshi || banked.iron) msg += ' В казну сдано ' + banked.groshi + ' гр. и ' + banked.iron + ' жел.';
        if (sold.length) msg += ' Пока вас не было, продано: ' + sold.join(', ') + '.';
        journal(st, msg);
        setFlash(st, msg);
        return msg;
    }

    function moveTo(st, targetId) {
        if (st.combat && !st.combat.finished) {
            setFlash(st, 'Сначала закончите бой.', true);
            return false;
        }
        if (!isReachable(st, targetId)) {
            setFlash(st, isBlocked(st) ? 'Враг перекрыл тропу. Пробейтесь или отступите тем же путём.' : 'Туда отсюда не пройти.', true);
            return false;
        }
        var D = data();
        var h = st.hero;
        var from = st.road.currentNodeId;
        var target = nodeById(targetId);
        if (target.id === 'ford_gate') {
            arriveAtGate(st, 'Вы вернулись за ворота «Старого Брода».');
            saveState(st);
            return true;
        }
        if (!st.road.onExpedition) {
            st.road.onExpedition = true;
            st.road.expeditions += 1;
        }
        var viaShortcut = shortcutLinks(st, from).indexOf(targetId) !== -1 && nodeById(from).connections.indexOf(targetId) === -1;
        var torchCost = viaShortcut ? 1 : target.torchCost;
        var stamCost = viaShortcut ? 3 : target.staminaStep;
        var wasLit = h.torch > 0;
        h.torch = Math.max(0, h.torch - torchCost);
        h.stam = Math.max(10, h.stam - stamCost);
        var note = '';
        if (!wasLit && torchCost > 0) {
            h.hp = Math.max(1, h.hp - DARK_MOVE_DAMAGE);
            note = ' Идёте вслепую: -' + DARK_MOVE_DAMAGE + ' Здоровья.';
        } else if (h.torch === 0) {
            note = ' Факел догорел: в бою вы не разглядите замаха врага.';
        }
        st.road.currentNodeId = target.id;
        st.road.visitedNodes[target.id] = true;
        var idx = st.road.trail.indexOf(target.id);
        if (idx !== -1) st.road.trail.length = idx + 1;
        else st.road.trail.push(target.id);
        var msg = 'Сектор №' + target.num + ' «' + target.name + '».' + (viaShortcut ? ' Короткий путь.' : '') + note;
        if (isHostile(st, target)) msg += ' Путь вперёд перекрыт: ' + D.ENEMIES[target.enemyPool[0]].name.toLowerCase() + ' и другие.';
        journal(st, msg);
        setFlash(st, msg, Boolean(note));
        saveState(st);
        return true;
    }

    function camp(st) {
        var cur = nodeById(st.road.currentNodeId);
        if (cur.type !== 'breather') {
            setFlash(st, 'Привал можно разбить только у костра: Каменный Крест или Сторожка Звонаря.', true);
            return false;
        }
        if (st.road.campsUsed[cur.id]) {
            setFlash(st, 'Костёр прогорел, угли уже не греют. Новый разведут к следующей вылазке.', true);
            return false;
        }
        var derived = heroStats(st);
        st.road.campsUsed[cur.id] = true;
        st.hero.hp = derived.maxHp;
        st.hero.stam = derived.maxStam;
        st.hero.torch = Math.min(derived.maxTorch, st.hero.torch + CAMP_TORCH);
        var msg = 'Привал у костра «' + cur.name + '»: здоровье и дыхание восстановлены, факел +' + CAMP_TORCH + '.';
        journal(st, msg);
        setFlash(st, msg);
        saveState(st);
        return true;
    }

    function sendCourier(st) {
        var cur = nodeById(st.road.currentNodeId);
        if (cur.type !== 'breather') {
            setFlash(st, 'Гонцы ждут только у костров.', true);
            return false;
        }
        if (!st.road.lootBag.groshi && !st.road.lootBag.iron) {
            setFlash(st, 'Мешок пуст, гонцу нечего нести.', true);
            return false;
        }
        var got = bankBag(st, true);
        var msg = 'Гонец унёс мешок на Заставу. В казну дошло ' + got.groshi + ' гр. и ' + got.iron + ' жел. (гонцу 15%). Жар тракта остыл.';
        journal(st, msg);
        setFlash(st, msg);
        saveState(st);
        return true;
    }

    function escortHome(st) {
        var cur = nodeById(st.road.currentNodeId);
        if (cur.type !== 'breather') {
            setFlash(st, 'Дозор провожает домой только от костров.', true);
            return false;
        }
        arriveAtGate(st, 'Дозор проводил вас от костра «' + cur.name + '» до Заставы.');
        saveState(st);
        return true;
    }

    function pickEnemyForNode(st, node) {
        var idx = (st.hero.roadClears + node.num) % node.enemyPool.length;
        return node.enemyPool[idx];
    }

    function patrol(st) {
        var cur = nodeById(st.road.currentNodeId);
        if (!cur.enemyPool || !cur.enemyPool.length) {
            setFlash(st, 'Здесь не с кем драться.', true);
            return 'none';
        }
        if (st.road.clearedNodes[cur.id]) {
            setFlash(st, 'В секторе тихо: до следующей вылазки сюда никто не сунется.');
            saveState(st);
            return 'quiet';
        }
        startRoadCombat(st, pickEnemyForNode(st, cur), cur.id);
        return 'combat';
    }

    function unlockShortcut(st) {
        var D = data();
        var cur = nodeById(st.road.currentNodeId);
        var scId = cur.shortcutUnlock;
        if (!scId) {
            setFlash(st, 'Здесь нет механизма.', true);
            return false;
        }
        if (st.road.shortcuts[scId]) {
            setFlash(st, 'Короткий путь уже открыт.');
            return true;
        }
        if (isHostile(st, cur)) {
            startRoadCombat(st, cur.enemyPool[0], cur.id);
            setFlash(st, 'Механизм охраняет ' + D.ENEMIES[cur.enemyPool[0]].name.toLowerCase() + '.', true);
            return 'combat';
        }
        st.road.shortcuts[scId] = true;
        advanceContract(st, 'shortcut', scId, 1);
        var sc = D.SHORTCUTS[scId];
        var msg = 'Открыт короткий путь «' + sc.name + '». ' + sc.desc;
        journal(st, msg);
        addEvent(st, st.hero.handle + ' открыл короткий путь «' + sc.name + '».');
        setFlash(st, msg);
        saveState(st);
        return true;
    }

    function baseCombat(st, opts) {
        return {
            mode: opts.mode,
            nodeId: opts.nodeId,
            terrain: opts.terrain,
            sightline: opts.sightline,
            sightlineRule: opts.sightlineRule,
            round: 1,
            foeId: opts.foeId,
            foeName: opts.foeName,
            foeTitle: opts.foeTitle,
            foeHp: opts.hp,
            foeMaxHp: opts.hp,
            foeStam: opts.maxStam,
            foeMaxStam: opts.maxStam,
            foeAtk: opts.atk,
            foeArmor: { head: opts.armor.head, torso: opts.armor.torso, legs: opts.armor.legs },
            moves: opts.moves,
            restTell: opts.restTell,
            reads: opts.reads || 0,
            wager: opts.wager || 0,
            playerStunned: false,
            playerSlowed: false,
            foeStunned: false,
            foeSlowed: false,
            history: [],
            itemRound: 0,
            last: { strike: 'torso', guard: 'torso', stance: 'thrust' },
            intent: null,
            finished: false,
            winner: null,
            log: []
        };
    }

    function startRoadCombat(st, enemyId, nodeId) {
        var D = data();
        var tpl = D.ENEMIES[enemyId] || D.ENEMIES.bog_hound;
        var node = nodeById(nodeId || st.road.currentNodeId);
        st.combat = baseCombat(st, {
            mode: 'road',
            nodeId: node.id,
            terrain: terrainOf(node.sightline),
            sightline: node.sightline,
            sightlineRule: node.sightlineRule,
            foeId: tpl.id,
            foeName: tpl.name,
            foeTitle: tpl.title,
            hp: tpl.hp,
            maxStam: tpl.maxStam,
            atk: tpl.atk,
            armor: tpl.armor,
            moves: tpl.moves,
            restTell: tpl.restTell
        });
        st.combat.log.push('Сектор «' + node.name + '». Навстречу выходит ' + tpl.name.toLowerCase() + ' (' + tpl.title.toLowerCase() + ').' + (st.hero.torch === 0 ? ' Факел погас: замаха врага не видно.' : ''));
        prepareIntent(st);
        saveState(st);
        return st.combat;
    }

    function rivalById(id) {
        var list = data().RIVALS;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function startArenaCombat(st, rivalId) {
        var rival = rivalById(rivalId);
        if (!rival) return false;
        if (st.combat && !st.combat.finished) {
            setFlash(st, 'Вы уже в бою.', true);
            return false;
        }
        if (st.hero.groshi < rival.wager) {
            setFlash(st, 'Ставка ' + rival.handle + ' составляет ' + rival.wager + ' гр., а в казне ' + st.hero.groshi + '.', true);
            return false;
        }
        var derived = heroStats(st);
        st.hero.hp = derived.maxHp;
        st.hero.stam = derived.maxStam;
        st.hero.groshi -= rival.wager;
        st.combat = baseCombat(st, {
            mode: 'arena',
            nodeId: 'ford_gate',
            terrain: 'open',
            sightline: 'Утоптанный круг',
            sightlineRule: 'Ровная площадка без укрытий: Выпад наносит +10% урона.',
            foeId: rival.id,
            foeName: rival.handle,
            foeTitle: rival.realCity + ', ' + rival.weaponName,
            hp: rival.hp,
            maxStam: rival.maxStam,
            atk: rival.atk,
            armor: rival.armor,
            moves: rival.moves,
            restTell: rival.handle + ' тяжело дышит и опускает оружие.',
            reads: rival.reads,
            wager: rival.wager
        });
        st.combat.log.push('Судья Еремей бьёт в гонг. Против вас ' + rival.handle + ' (' + rival.realCity + '). Ставки по ' + rival.wager + ' гр. лежат у судьи.');
        prepareIntent(st);
        saveState(st);
        return st.combat;
    }

    function moveCost(stance, slowed, terrain, originId, isPlayer) {
        var cost = stanceById(stance).stamCost;
        if (stance === 'thrust' && isPlayer && originId === 'dragoon') cost -= 3;
        if (stance === 'cleave' && terrain === 'narrow' && !(isPlayer && originId === 'miner')) cost += 4;
        if (stance === 'cleave' && slowed) cost += 10;
        return cost;
    }

    function chooseFoeMove(st, c) {
        var moves = c.moves.map(function (m) {
            var w = m.w || 1;
            if (c.reads >= 2 && c.history.length) {
                var lastStance = c.history[c.history.length - 1].stance;
                if (lastStance === 'cleave' && m.stance === 'thrust') w *= 2.5;
                var thrusts = c.history.slice(-2).filter(function (x) { return x.stance === 'thrust'; }).length;
                if (thrusts === 2 && m.stance === 'breather') w *= 2.5;
            }
            var cost = moveCost(m.stance, c.foeSlowed, c.terrain, null, false);
            return { move: m, w: cost > c.foeStam ? 0 : w };
        });
        var canAttack = moves.some(function (x) { return x.w > 0 && x.move.stance !== 'breather'; });
        var total = canAttack ? moves.reduce(function (s, x) { return s + x.w; }, 0) : 0;
        var picked = null;
        if (total > 0) {
            var roll = nextRandom(st) * total;
            for (var i = 0; i < moves.length; i++) {
                roll -= moves[i].w;
                if (roll < 0 || i === moves.length - 1) {
                    if (moves[i].w > 0) {
                        picked = moves[i].move;
                        break;
                    }
                }
            }
        }
        var tired = !picked;
        var move = tired
            ? { stance: 'breather', strike: ZONE_ORDER[Math.floor(nextRandom(st) * 3)], guard: 'torso', tell: c.restTell }
            : { stance: picked.stance, strike: picked.strike, guard: picked.guard, tell: picked.tell, fakeAs: picked.fakeAs };
        var adaptNote = '';
        if (c.reads >= 1 && c.history.length >= 2) {
            var a = c.history[c.history.length - 1].strike;
            var b = c.history[c.history.length - 2].strike;
            if (a === b && move.guard !== a) {
                move.guard = a;
                adaptNote = c.foeName + ' заметил, что вы дважды били в ' + zoneAcc(a) + ', и закрывает это место.';
            }
        }
        return { move: move, tired: tired, adaptNote: adaptNote };
    }

    function readChance(st, c) {
        if (c.foeStunned) return 100;
        if (c.playerStunned) return 0;
        return heroStats(st).read;
    }

    function prepareIntent(st) {
        var c = st.combat;
        var choice = chooseFoeMove(st, c);
        var dark = c.mode === 'road' && st.hero.torch === 0;
        var chance = dark ? 0 : readChance(st, c);
        var read = !dark && nextRandom(st) * 100 < chance;
        var others = ZONE_ORDER.filter(function (z) { return z !== choice.move.strike; });
        var decoy = others[Math.floor(nextRandom(st) * others.length)];
        var pair = ZONE_ORDER.filter(function (z) { return z === choice.move.strike || z === decoy; });
        c.intent = {
            move: choice.move,
            tired: choice.tired,
            adaptNote: choice.adaptNote,
            dark: dark,
            chance: chance,
            read: read,
            pair: pair,
            hidden: c.mode === 'arena' && !read,
            seenStance: read ? choice.move.stance : (choice.move.fakeAs || choice.move.stance)
        };
        return c.intent;
    }

    function relightIntent(st) {
        var it = st.combat.intent;
        it.dark = false;
        it.chance = readChance(st, st.combat);
        it.read = nextRandom(st) * 100 < it.chance;
        it.hidden = st.combat.mode === 'arena' && !it.read;
        it.seenStance = it.read ? it.move.stance : (it.move.fakeAs || it.move.stance);
    }

    function describeIntent(c) {
        var it = c.intent;
        if (!it) return null;
        if (it.dark) {
            return { tell: 'Факел погас. В темноте замаха не разглядеть.', stance: null, zones: null, guard: null, note: '', read: false, dark: true };
        }
        if (it.hidden) {
            return { tell: c.foeName + ' держит дистанцию и не выдаёт замаха.', stance: null, zones: 'бьёт в ' + zoneAcc(it.pair[0]) + ' или в ' + zoneAcc(it.pair[1]), guard: null, note: '', read: false, dark: false };
        }
        var lines = { tell: it.move.tell, stance: stanceById(it.seenStance).name, read: it.read, dark: false, note: '', canFeint: c.moves.some(function (m) { return m.stance === 'feint'; }) };
        if (it.read) {
            lines.zones = 'бьёт в ' + zoneAcc(it.move.strike);
            lines.guard = 'прикрывает ' + zoneAcc(it.move.guard);
            if (it.move.fakeAs) lines.note = 'Замах ложный: это Финт.';
            if (it.adaptNote) lines.note = (lines.note ? lines.note + ' ' : '') + it.adaptNote;
        } else {
            lines.zones = 'бьёт в ' + zoneAcc(it.pair[0]) + ' или в ' + zoneAcc(it.pair[1]);
            lines.guard = null;
        }
        return lines;
    }

    function strikeDamage(o) {
        var base = o.atk * stanceById(o.stance).dmgMult + (o.bonus || 0);
        if (o.stance === 'thrust' && o.terrain === 'open') base *= 1.1;
        if (o.stance === 'feint' && o.terrain === 'narrow') base *= 1.1;
        if (o.strike === 'legs' && o.terrain === 'narrow') base *= 1.2;
        if (o.stunned) base *= 0.8;
        var notes = [];
        if (o.stance === 'thrust' && o.otherStance === 'cleave') {
            base *= 1.3;
            notes.push('interrupt');
        }
        if (o.stance === 'cleave' && o.otherStance === 'thrust') base *= 0.6;
        var guarded = o.strike === o.otherGuard || (o.otherStance === 'breather' && o.strike === 'torso');
        var landed = !guarded;
        if (guarded) {
            if (o.stance === 'feint') {
                landed = true;
                notes.push('bypass');
            } else if (o.stance === 'cleave') {
                base *= 0.75;
                landed = true;
                notes.push('crush');
            } else if (o.stance === 'thrust' && o.otherStance === 'breather') {
                base *= 0.2;
                notes.push('smother');
            } else {
                base *= o.terrain === 'shelter' ? SHELTER_GUARD_PASS : (o.thrustPierce && o.stance === 'thrust' ? 0.48 : GUARD_PASS);
                notes.push('blocked');
            }
        }
        var crit = landed && o.critChance > 0 && o.critRoll * 100 < o.critChance;
        var dmg = crit ? Math.round(base * 1.5) : Math.round(base - o.armor * ARMOR_FACTOR);
        dmg = Math.max(1, dmg);
        return { dmg: dmg, landed: landed, guarded: guarded, crit: crit, notes: notes };
    }

    function applyWound(zone, side) {
        if (zone === 'head') side.stunned = true;
        if (zone === 'legs') side.slowed = true;
    }

    function executeRound(st, strike, stance, guard) {
        var c = st.combat;
        if (!c || c.finished) return false;
        var D = data();
        var h = st.hero;
        var derived = heroStats(st);
        if (!c.intent) prepareIntent(st);
        var foe = c.intent.move;
        strike = ZONE_ORDER.indexOf(strike) !== -1 ? strike : 'torso';
        guard = ZONE_ORDER.indexOf(guard) !== -1 ? guard : 'torso';
        stance = stanceById(stance).id;
        var notes = [];

        var pCost = moveCost(stance, c.playerSlowed, c.terrain, h.originId, true);
        if (pCost > 0 && h.stam < pCost) {
            notes.push('Дыхания не хватило на ' + stanceById(stance).name.toLowerCase() + ': вы вынужденно переводите дух.');
            stance = 'breather';
            pCost = moveCost('breather', false, c.terrain, h.originId, true);
        }
        var fCost = moveCost(foe.stance, c.foeSlowed, c.terrain, null, false);
        h.stam = clamp(h.stam - pCost + (stance === 'breather' && c.terrain === 'shelter' ? 8 : 0), 0, derived.maxStam);
        c.foeStam = clamp(c.foeStam - fCost + (foe.stance === 'breather' && c.terrain === 'shelter' ? 8 : 0), 0, c.foeMaxStam);
        if (stance === 'cleave') c.playerSlowed = false;
        if (foe.stance === 'cleave') c.foeSlowed = false;

        var pHit = strikeDamage({
            atk: derived.atk,
            stance: stance,
            strike: strike,
            bonus: stance === 'cleave' && h.originId === 'miner' ? 4 : 0,
            terrain: c.terrain,
            stunned: c.playerStunned,
            otherStance: foe.stance,
            otherGuard: foe.guard,
            thrustPierce: h.originId === 'dragoon',
            critChance: derived.crit,
            critRoll: nextRandom(st),
            armor: c.foeArmor[strike] || 0
        });
        var fHit = strikeDamage({
            atk: c.foeAtk,
            stance: foe.stance,
            strike: foe.strike,
            bonus: 0,
            terrain: c.terrain,
            stunned: c.foeStunned,
            otherStance: stance,
            otherGuard: guard,
            thrustPierce: false,
            critChance: 0,
            critRoll: 1,
            armor: derived.armor[foe.strike] || 0
        });
        c.playerStunned = false;
        c.foeStunned = false;

        c.foeHp = Math.max(0, c.foeHp - pHit.dmg);
        if (pHit.notes.indexOf('interrupt') !== -1) notes.push('Ваш Выпад опережает тяжёлый замах.');
        if (pHit.notes.indexOf('bypass') !== -1) {
            var steal = h.originId === 'scribe' ? 12 : 8;
            h.stam = clamp(h.stam + steal, 0, derived.maxStam);
            c.foeStam = Math.max(0, c.foeStam - 8);
            notes.push('Финт обходит прикрытие: +' + steal + ' Дыхания.');
        }
        if (pHit.notes.indexOf('crush') !== -1) notes.push('Размах проламывает защиту.');
        if (pHit.notes.indexOf('smother') !== -1) notes.push('Ваш Выпад вязнет в Передышке.');
        if (pHit.notes.indexOf('blocked') !== -1) notes.push(c.foeName + ' принимает удар на прикрытие.');
        if (pHit.crit) notes.push('Точный удар: урон x1.5 сквозь броню.');
        if (pHit.landed && (pHit.dmg >= 10 || pHit.crit)) {
            var fs = {};
            applyWound(strike, fs);
            if (fs.stunned) {
                c.foeStunned = true;
                notes.push('Враг оглушён: следующий его замах вы прочтёте наверняка.');
            }
            if (fs.slowed) {
                c.foeSlowed = true;
                notes.push('Подсечка: следующий Размах врага дороже.');
            }
            if (strike === 'torso') {
                c.foeStam = Math.max(0, c.foeStam - 12);
                notes.push('Удар под рёбра: враг теряет 12 Дыхания.');
            }
        }

        var fDmg = 0;
        if (c.foeHp > 0) {
            fDmg = fHit.dmg;
            h.hp = Math.max(0, h.hp - fDmg);
            if (fHit.notes.indexOf('bypass') !== -1) notes.push(c.foeName + ' обходит ваше прикрытие финтом.');
            if (fHit.notes.indexOf('crush') !== -1) notes.push(c.foeName + ' проламывает вашу защиту.');
            if (fHit.notes.indexOf('smother') !== -1) notes.push('Передышка гасит вражеский Выпад.');
            if (fHit.notes.indexOf('blocked') !== -1) notes.push('Вы принимаете удар на прикрытие.');
            if (fHit.landed && fDmg >= 12) {
                if (foe.strike === 'head') {
                    c.playerStunned = true;
                    notes.push('Вас оглушило: следующий замах не прочесть.');
                } else if (foe.strike === 'legs') {
                    c.playerSlowed = true;
                    notes.push('Вам подсекли ногу: следующий Размах дороже.');
                } else {
                    h.stam = Math.max(0, h.stam - 12);
                    notes.push('Удар под рёбра: -12 Дыхания.');
                }
            }
        }

        if (c.terrain === 'belfry' && c.round % 3 === 0 && c.foeHp > 0 && h.hp > 0) {
            if (guard === 'head' || stance === 'breather') {
                notes.push('Набат гудит, но голова прикрыта.');
            } else {
                h.hp = Math.max(0, h.hp - 9);
                notes.push('Набатный колокол бьёт по неприкрытой голове: -9 Здоровья.');
            }
        }

        h.stam = clamp(h.stam + ROUND_REGEN, 0, derived.maxStam);
        c.foeStam = clamp(c.foeStam + ROUND_REGEN, 0, c.foeMaxStam);

        var line = 'Раунд ' + c.round + '. Вы: ' + stanceById(stance).name + ' в ' + zoneAcc(strike) + ', прикрыта ' + zoneName(guard) + ', урон ' + pHit.dmg + '.';
        if (c.foeHp > 0) line += ' ' + c.foeName + ': ' + stanceById(foe.stance).name + ' в ' + zoneAcc(foe.strike) + ', урон ' + fDmg + '.';
        if (notes.length) line += ' ' + notes.join(' ');
        c.log.unshift(line);
        c.history.push({ strike: strike, stance: stance });
        if (c.history.length > 4) c.history.shift();
        c.last = { strike: strike, guard: guard, stance: stance };

        if (c.foeHp <= 0) finishWin(st);
        else if (h.hp <= 0) finishLoss(st);
        else {
            c.round += 1;
            prepareIntent(st);
        }
        saveState(st);
        return true;
    }

    function wearGear(st, amount) {
        ['weapon', 'helmet', 'cuirass', 'boots'].forEach(function (slot) {
            var inst = findItem(st, st.equipped[slot]);
            if (inst && inst.durability > 0) inst.durability = Math.max(0, inst.durability - amount);
        });
    }

    function eloDelta(playerRating, foeRating, score) {
        var expected = 1 / (1 + Math.pow(10, (foeRating - playerRating) / 400));
        return Math.round(ELO_K * (score - expected));
    }

    function finishWin(st) {
        var D = data();
        var c = st.combat;
        var h = st.hero;
        c.finished = true;
        c.winner = 'player';
        wearGear(st, 1);
        if (c.mode === 'road') {
            var tpl = D.ENEMIES[c.foeId];
            var mult = heatMultiplier(st);
            var g = Math.round(tpl.groshi * mult * (h.orderId === 'guard' ? 1.15 : 1));
            var iron = Math.round(tpl.ironDrop * mult);
            st.road.lootBag.groshi += g;
            st.road.lootBag.iron += iron;
            st.road.heat = Math.min(HEAT_MAX, st.road.heat + 1);
            st.road.clearedNodes[c.nodeId] = true;
            h.roadClears += 1;
            st.orderInfluence[h.orderId] += 12;
            advanceContract(st, 'enemy', c.foeId, 1);
            advanceContract(st, 'node_clear', c.nodeId, 1);
            var leveled = awardXp(st, tpl.xp);
            var msg = 'Победа. ' + tpl.name + ' повержен. В мешок: +' + g + ' гр.' + (iron ? ', +' + iron + ' жел.' : '') + ' (жар x' + mult.toFixed(2) + '), +' + tpl.xp + ' опыта.';
            if (tpl.isBoss) {
                h.bossKills += 1;
                if (!h.bossDefeated) {
                    h.bossDefeated = true;
                    h.tokens += 3;
                    msg += ' Печать Коменданта Пепла ваша, +3 Жетона.';
                }
                chatLine(st, 'square', 'ВЕСТНИК', h.handle + ' одолел Старого Звонаря на Ярусе Колоколов.', true);
                addEvent(st, h.handle + ' одолел Старого Звонаря (раз ' + h.bossKills + ').');
            }
            if (leveled) msg += ' Новый уровень: ' + h.level + '. Очки характеристик ждут в Палате Героя.';
            c.log.unshift(msg);
            journal(st, 'Сектор «' + nodeById(c.nodeId).name + '»: побеждён ' + tpl.name.toLowerCase() + ', +' + g + ' гр. в мешок.');
        } else {
            var rival = rivalById(c.foeId);
            var rec = st.rivals[rival.id];
            var upset = rec.rating > h.rating;
            var delta = Math.max(1, eloDelta(h.rating, rec.rating, 1));
            h.rating += delta;
            rec.rating -= delta;
            rec.losses += 1;
            h.arenaWins += 1;
            h.groshi += c.wager * 2;
            var tokens = rec.rating + delta >= h.rating - delta - 30 ? 1 + (h.orderId === 'bell' ? 1 : 0) : 0;
            h.tokens += tokens;
            st.orderInfluence[h.orderId] += 15;
            advanceContract(st, 'arena_win', 'any', 1);
            if (upset) advanceContract(st, 'arena_upset', 'any', 1);
            var lv = awardXp(st, 20 + rival.level * 10);
            c.log.unshift('Победа в Круге. Вы забираете ставку: +' + c.wager + ' гр. чистыми, рейтинг +' + delta + (tokens ? ', +' + tokens + ' Жетон' : ', жетон за слабого соперника не дают') + '.' + (lv ? ' Новый уровень: ' + h.level + '.' : ''));
            chatLine(st, 'square', 'ВЕСТНИК', 'В Круге ' + h.handle + ' одолел ' + rival.handle + ' (рейтинг ' + h.rating + ').', true);
            addEvent(st, h.handle + ' победил ' + rival.handle + ' в Круге, рейтинг ' + h.rating + '.');
        }
    }

    function finishLoss(st) {
        var c = st.combat;
        var h = st.hero;
        c.finished = true;
        c.winner = 'foe';
        if (c.mode === 'road') {
            wearGear(st, 3);
            var lostG = Math.ceil(st.road.lootBag.groshi * 0.5);
            var lostI = Math.ceil(st.road.lootBag.iron * 0.5);
            st.road.lootBag.groshi -= lostG;
            st.road.lootBag.iron -= lostI;
            arriveAtGate(st, 'Вы пали в секторе «' + nodeById(c.nodeId).name + '». Дозорные вынесли вас к Заставе, половина мешка (' + lostG + ' гр., ' + lostI + ' жел.) осталась в пепле.');
            c.log.unshift('Поражение. Дозорные вынесли вас к Заставе. Потеряно ' + lostG + ' гр. и ' + lostI + ' жел. из мешка, снаряжение потрёпано.');
        } else {
            wearGear(st, 1);
            var rival = rivalById(c.foeId);
            var rec = st.rivals[rival.id];
            var delta = Math.max(1, -eloDelta(h.rating, rec.rating, 0));
            h.rating = Math.max(800, h.rating - delta);
            rec.rating += delta;
            rec.wins += 1;
            h.arenaLosses += 1;
            var derived = heroStats(st);
            h.hp = derived.maxHp;
            h.stam = derived.maxStam;
            c.log.unshift('Судья останавливает бой. Ставка ' + c.wager + ' гр. уходит к ' + rival.handle + ', рейтинг -' + delta + '. Лекари Круга поставили вас на ноги.');
        }
    }

    function closeCombat(st) {
        var mode = st.combat ? st.combat.mode : 'arena';
        st.combat = null;
        saveState(st);
        return mode;
    }

    function useItem(st, uid) {
        var D = data();
        var h = st.hero;
        var inst = findItem(st, uid || st.equipped.belt);
        var tpl = inst && D.ITEMS[inst.itemId];
        if (!tpl || tpl.slot !== 'consumable') {
            setFlash(st, 'Этот предмет нельзя применить.', true);
            return false;
        }
        var c = st.combat && !st.combat.finished ? st.combat : null;
        if (c && c.itemRound === c.round) {
            setFlash(st, 'За раунд можно достать с пояса только один припас.', true);
            return false;
        }
        var derived = heroStats(st);
        var text = '';
        if (tpl.effect === 'heal') {
            h.hp = clamp(h.hp + tpl.power, 1, derived.maxHp);
            if (c) {
                c.playerStunned = false;
                c.playerSlowed = false;
            }
            text = 'Здоровье +' + tpl.power + ', ранения сняты';
        } else if (tpl.effect === 'stamina') {
            h.stam = clamp(h.stam + tpl.power, 0, derived.maxStam);
            text = 'Дыхание +' + tpl.power;
        } else if (tpl.effect === 'torch') {
            h.torch = clamp(h.torch + tpl.power, 0, derived.maxTorch);
            text = 'Факел +' + tpl.power;
        } else if (tpl.effect === 'both') {
            h.hp = clamp(h.hp + tpl.power, 1, derived.maxHp);
            h.stam = clamp(h.stam + tpl.power, 0, derived.maxStam);
            text = 'Здоровье и Дыхание +' + tpl.power;
        }
        var wasBelt = st.equipped.belt === inst.uid;
        removeItem(st, inst.uid);
        if (wasBelt) {
            var next = st.inventory.filter(function (i) { return D.ITEMS[i.itemId].slot === 'consumable'; })[0];
            if (next) st.equipped.belt = next.uid;
        }
        if (c) {
            c.itemRound = c.round;
            if (tpl.effect === 'torch' && c.intent && c.intent.dark) relightIntent(st);
            c.log.unshift('С пояса: ' + tpl.name + '. ' + text + '.');
        }
        setFlash(st, tpl.name + ': ' + text + '.');
        saveState(st);
        return true;
    }

    function equip(st, uid) {
        var inst = findItem(st, uid);
        var tpl = inst && data().ITEMS[inst.itemId];
        if (!tpl) return false;
        if (st.combat && !st.combat.finished && tpl.slot !== 'consumable') {
            setFlash(st, 'Посреди боя доспех не сменить.', true);
            return false;
        }
        var slot = tpl.slot === 'consumable' ? 'belt' : tpl.slot;
        var before = heroStats(st);
        st.equipped[slot] = inst.uid;
        var after = heroStats(st);
        st.hero.hp = clamp(st.hero.hp + Math.max(0, after.maxHp - before.maxHp), 1, after.maxHp);
        setFlash(st, 'Надето: ' + itemTitle(inst) + '.');
        saveState(st);
        return true;
    }

    function repairCost(st, inst) {
        var missing = Math.max(0, inst.maxDurability - inst.durability);
        if (!missing) return 0;
        return Math.max(2, Math.round(missing * (st.hero.orderId === 'guard' ? 0.85 : 1)));
    }

    function temperCost(inst) {
        var tpl = data().ITEMS[inst.itemId];
        return { groshi: Math.round((tpl.costGroshi || 30) * Math.pow(1.35, inst.temper)), iron: inst.temper + 1 };
    }

    function repair(st, uid) {
        var inst = findItem(st, uid);
        if (!inst) return false;
        var cost = repairCost(st, inst);
        if (!cost) return false;
        if (st.hero.groshi < cost) {
            setFlash(st, 'На починку нужно ' + cost + ' гр.', true);
            return false;
        }
        st.hero.groshi -= cost;
        inst.durability = inst.maxDurability;
        setFlash(st, itemTitle(inst) + ': починено за ' + cost + ' гр.');
        saveState(st);
        return true;
    }

    function temper(st, uid) {
        var inst = findItem(st, uid);
        if (!inst || inst.temper >= 5) return false;
        var cost = temperCost(inst);
        if (st.hero.groshi < cost.groshi || st.hero.iron < cost.iron) {
            setFlash(st, 'На проковку нужно ' + cost.groshi + ' гр. и ' + cost.iron + ' жел.', true);
            return false;
        }
        st.hero.groshi -= cost.groshi;
        st.hero.iron -= cost.iron;
        inst.temper += 1;
        inst.maxDurability += 4;
        inst.durability = inst.maxDurability;
        setFlash(st, 'Громов проковал: ' + itemTitle(inst) + '.');
        saveState(st);
        return true;
    }

    function smelt(st, uid) {
        var inst = findItem(st, uid);
        if (!inst || isEquipped(st, uid)) return false;
        var tpl = data().ITEMS[inst.itemId];
        if (tpl.slot === 'consumable') return false;
        var iron = (tpl.tier || 1) + inst.temper + (st.hero.orderId === 'guild' ? 1 : 0);
        var g = Math.round((tpl.costGroshi || 20) * 0.3);
        removeItem(st, uid);
        st.hero.iron += iron;
        st.hero.groshi += g;
        setFlash(st, itemTitle(inst) + ' ушло в горн: +' + iron + ' жел., +' + g + ' гр.');
        saveState(st);
        return true;
    }

    function listPrice(inst) {
        var tpl = data().ITEMS[inst.itemId];
        return Math.round(((tpl.costGroshi || 25) + inst.temper * 20) * 0.8);
    }

    function listLot(st, uid) {
        var inst = findItem(st, uid);
        if (!inst || isEquipped(st, uid)) return false;
        var price = listPrice(inst);
        removeItem(st, uid);
        st.commissionLots.unshift({
            lotId: 'lot_' + (st.uidCounter++),
            itemId: inst.itemId,
            temper: inst.temper,
            durability: inst.durability,
            maxDurability: inst.maxDurability,
            seller: st.hero.handle,
            priceGroshi: price,
            note: 'Выставил ' + st.hero.handle + '.',
            mine: true
        });
        chatLine(st, 'trade', st.hero.handle, 'Выставил в комиссионку: ' + itemTitle(inst) + ' за ' + price + ' гр.');
        setFlash(st, itemTitle(inst) + ' выставлено за ' + price + ' гр. Покупатель найдётся, пока вы на тракте.');
        saveState(st);
        return true;
    }

    function withdrawLot(st, lotId) {
        for (var i = 0; i < st.commissionLots.length; i++) {
            var lot = st.commissionLots[i];
            if (lot.lotId === lotId && lot.mine) {
                var inst = makeItem(st, lot.itemId, lot.temper);
                inst.durability = lot.durability;
                inst.maxDurability = lot.maxDurability;
                st.inventory.push(inst);
                st.commissionLots.splice(i, 1);
                setFlash(st, itemTitle(inst) + ' снято с продажи.');
                saveState(st);
                return true;
            }
        }
        return false;
    }

    function buyLot(st, lotId) {
        for (var i = 0; i < st.commissionLots.length; i++) {
            var lot = st.commissionLots[i];
            if (lot.lotId !== lotId || lot.mine) continue;
            if (st.hero.groshi < lot.priceGroshi) {
                setFlash(st, 'Лот стоит ' + lot.priceGroshi + ' гр.', true);
                return false;
            }
            st.hero.groshi -= lot.priceGroshi;
            var inst = makeItem(st, lot.itemId, lot.temper);
            inst.durability = lot.durability;
            inst.maxDurability = lot.maxDurability;
            st.inventory.push(inst);
            st.commissionLots.splice(i, 1);
            if (data().ITEMS[inst.itemId].slot === 'consumable' && !st.equipped.belt) st.equipped.belt = inst.uid;
            setFlash(st, 'Куплено у ' + lot.seller + ': ' + itemTitle(inst) + '.');
            saveState(st);
            return true;
        }
        return false;
    }

    function buyShop(st, itemId) {
        var tpl = data().ITEMS[itemId];
        if (!tpl) return false;
        var h = st.hero;
        if (h.groshi < tpl.costGroshi || h.iron < tpl.costIron || h.tokens < tpl.costTokens) {
            setFlash(st, 'Не хватает на «' + tpl.name + '».', true);
            return false;
        }
        h.groshi -= tpl.costGroshi;
        h.iron -= tpl.costIron;
        h.tokens -= tpl.costTokens;
        var inst = makeItem(st, itemId, 0);
        st.inventory.push(inst);
        if (tpl.slot === 'consumable' && !st.equipped.belt) st.equipped.belt = inst.uid;
        setFlash(st, 'Куплено: ' + tpl.name + '.');
        saveState(st);
        return true;
    }

    function settleCommission(st) {
        var sold = [];
        st.commissionLots = st.commissionLots.filter(function (lot) {
            if (!lot.mine) return true;
            st.hero.groshi += lot.priceGroshi;
            var title = data().ITEMS[lot.itemId].name + (lot.temper ? ' +' + lot.temper : '');
            sold.push(title + ' (' + lot.priceGroshi + ' гр.)');
            addEvent(st, 'В комиссионке продано: ' + title + ' за ' + lot.priceGroshi + ' гр.');
            return false;
        });
        return sold;
    }

    function restockCommission(st) {
        var pool = data().COMMISSION_POOL;
        var others = st.commissionLots.filter(function (l) { return !l.mine; }).length;
        while (others < 4 && pool.length) {
            var p = pool[st.poolCursor % pool.length];
            st.poolCursor += 1;
            var tpl = data().ITEMS[p.itemId];
            var maxDur = (tpl.maxDurability || 1) + p.temper * 4;
            st.commissionLots.push({
                lotId: 'lot_' + (st.uidCounter++),
                itemId: p.itemId,
                temper: p.temper,
                durability: Math.max(1, maxDur - p.wear),
                maxDurability: maxDur,
                seller: p.seller,
                priceGroshi: p.priceGroshi,
                note: p.note,
                mine: false
            });
            others++;
        }
    }

    function ambientChat(st) {
        var pool = data().AMBIENT_CHAT;
        if (!pool.length) return;
        var line = pool[st.ambientCursor % pool.length];
        st.ambientCursor += 1;
        chatLine(st, line.room, line.author, line.text);
    }

    function sayInChat(st, text) {
        var D = data();
        var room = D.CHAT_CHANNELS[st.chatRoom] ? st.chatRoom : 'square';
        text = String(text || '').trim().slice(0, 140);
        if (!text) return false;
        chatLine(st, room, st.hero.handle, text);
        var replies = D.CHAT_CHANNELS[room].replies;
        if (replies && replies.length) {
            var rep = replies[st.chatReplyCursor % replies.length];
            st.chatReplyCursor += 1;
            chatLine(st, room, rep.author, st.hero.handle + ', ' + rep.text.charAt(0).toLowerCase() + rep.text.slice(1));
        }
        saveState(st);
        return true;
    }

    function register(st, opts) {
        var D = data();
        var handle = String(opts.handle || '').trim().slice(0, 20) || st.hero.handle;
        var originId = D.ORIGINS[opts.originId] ? opts.originId : st.hero.originId;
        var orderId = D.ORDERS[opts.orderId] ? opts.orderId : st.hero.orderId;
        var untouched = st.hero.level === 1 && st.hero.xp === 0 && st.hero.roadClears === 0 && st.hero.arenaWins === 0 && st.hero.arenaLosses === 0;
        if (untouched && (!st.registered || originId !== st.hero.originId)) {
            st = createState({ registered: true, handle: handle, originId: originId, orderId: orderId, seed: st.seed });
        } else {
            if (orderId !== st.hero.orderId) {
                if (st.registered) st.hero.tokens = Math.max(0, st.hero.tokens - 1);
                st.hero.orderId = orderId;
            }
            st.registered = true;
            st.hero.handle = handle;
        }
        chatLine(st, 'square', 'ВЕСТНИК', 'На Заставу прибыл ' + st.hero.handle + ' (' + D.ORIGINS[st.hero.originId].name.toLowerCase() + ', ' + D.ORDERS[st.hero.orderId].shortName + ').', true);
        setFlash(st, 'Пропуск на имя «' + st.hero.handle + '» скреплён печатью комендатуры.');
        saveState(st);
        return st;
    }

    function setChatRoom(st, room) {
        if (!data().CHAT_CHANNELS[room]) return false;
        st.chatRoom = room;
        saveState(st);
        return true;
    }

    function ladder(st) {
        var D = data();
        var rows = [{ handle: st.hero.handle, city: 'ваш модем', orderId: st.hero.orderId, level: st.hero.level, rating: st.hero.rating, wins: st.hero.arenaWins, losses: st.hero.arenaLosses, isPlayer: true }];
        D.RIVALS.forEach(function (r) {
            var rec = st.rivals[r.id] || r;
            rows.push({ handle: r.handle, city: r.realCity, orderId: r.orderId, level: r.level, rating: rec.rating, wins: rec.wins, losses: rec.losses, isPlayer: false, rivalId: r.id });
        });
        D.LADDER_EXTRA.forEach(function (x) {
            rows.push({ handle: x.handle, city: x.city, orderId: x.orderId, level: x.level, rating: x.rating, wins: x.wins, losses: x.losses, isPlayer: false });
        });
        rows.sort(function (a, b) { return b.rating - a.rating; });
        return rows;
    }

    function winOdds(st, rivalId) {
        var rec = st.rivals[rivalId];
        return 1 / (1 + Math.pow(10, (rec.rating - st.hero.rating) / 400));
    }

    function dossierText(st) {
        var D = data();
        var h = st.hero;
        var s = heroStats(st);
        return [
            '============================================================',
            "   ПЕПЕЛЬНЫЙ ТРАКТ '98 - ЛИЧНОЕ ДЕЛО ПУТНИКА ЗАСТАВЫ",
            '   Выгружено из Microslop Internet Explorer 4.0',
            '============================================================',
            'Прозвище:        ' + h.handle,
            'Ремесло:         ' + D.ORIGINS[h.originId].name + ' (уровень ' + h.level + ')',
            'Приказ:          ' + D.ORDERS[h.orderId].name,
            'Рейтинг Круга:   ' + h.rating + ' (побед ' + h.arenaWins + ', поражений ' + h.arenaLosses + ')',
            'Здоровье:        ' + h.hp + ' / ' + s.maxHp,
            'Дыхание:         ' + h.stam + ' / ' + s.maxStam,
            'Удар:            ' + s.atk + ' (точный удар ' + s.crit + '%, чтение замаха ' + s.read + '%)',
            'Броня по зонам:  голова ' + s.armor.head + ', корпус ' + s.armor.torso + ', ноги ' + s.armor.legs,
            'Казна:           ' + h.groshi + ' гр., ' + h.iron + ' жел., ' + h.tokens + ' жет.',
            '------------------------------------------------------------',
            'Оружие:          ' + s.weaponName,
            'Паромный настил: ' + (st.road.shortcuts.ferry_plank ? 'открыт' : 'не открыт'),
            'Рудничная клеть: ' + (st.road.shortcuts.mine_cage ? 'открыта' : 'не открыта'),
            'Старый Звонарь:  ' + (h.bossDefeated ? 'повержен ' + h.bossKills + ' раз, Печать Коменданта получена' : 'не повержен'),
            'Вылазок:         ' + st.road.expeditions,
            '============================================================'
        ].join('\r\n');
    }

    window.ashroadGame = {
        STORAGE_KEY: STORAGE_KEY,
        LEGACY_KEY: LEGACY_KEY,
        HEAT_STEP: HEAT_STEP,
        HEAT_MAX: HEAT_MAX,
        COURIER_FEE: COURIER_FEE,
        ZONE_ORDER: ZONE_ORDER,
        createState: createState,
        loadState: loadState,
        saveState: saveState,
        resetState: resetState,
        heroStats: heroStats,
        findItem: findItem,
        isEquipped: isEquipped,
        itemTitle: itemTitle,
        stanceById: stanceById,
        zoneName: zoneName,
        zoneAcc: zoneAcc,
        nodeById: nodeById,
        reachableIds: reachableIds,
        isReachable: isReachable,
        isKnown: isKnown,
        isBlocked: isBlocked,
        isHostile: isHostile,
        heatMultiplier: heatMultiplier,
        moveCost: moveCost,
        setFlash: setFlash,
        takeFlash: takeFlash,
        register: register,
        allocStat: allocStat,
        claimContract: claimContract,
        moveTo: moveTo,
        camp: camp,
        sendCourier: sendCourier,
        escortHome: escortHome,
        patrol: patrol,
        unlockShortcut: unlockShortcut,
        startRoadCombat: startRoadCombat,
        startArenaCombat: startArenaCombat,
        prepareIntent: prepareIntent,
        describeIntent: describeIntent,
        executeRound: executeRound,
        closeCombat: closeCombat,
        useItem: useItem,
        equip: equip,
        repairCost: repairCost,
        temperCost: temperCost,
        listPrice: listPrice,
        repair: repair,
        temper: temper,
        smelt: smelt,
        listLot: listLot,
        withdrawLot: withdrawLot,
        buyLot: buyLot,
        buyShop: buyShop,
        sayInChat: sayInChat,
        setChatRoom: setChatRoom,
        ladder: ladder,
        winOdds: winOdds,
        dossierText: dossierText
    };
})();
