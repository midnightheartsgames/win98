/**
 * S.T.A.L.K.E.R. 98 — story: quests with stages and PDA markers, dialogue trees, traders, level scripts,
 * PDA news, the intro and the ending. All text is bilingual (ru / en).
 */
(function (S) {
  'use strict';
  const D = S.DATA, IT = D.ITEMS, T = D.T;

  // ================================================================ quests
  // stages: [{ text, target(g) -> {level, x, z} | {level, actor} }]
  const QUESTS = {
    q_wolf: { main: true, title: T('Поговорить с Волком', 'Talk to Wolf'), stages: [
      { text: T('Сидорович велел найти Волка в деревне новичков. Волк даст людей, чтобы отбить Шустрого у бандитов.', 'Sidorovich told you to find Wolf in the rookie village. Wolf will give you men to free Nimble from the bandits.'), target: { level: 'cordon', actor: 'wolf' } }] },
    q_nimble: { main: true, title: T('Спасти Шустрого', 'Rescue Nimble'), stages: [
      { text: T('Группа Петрухи выдвигается к АТП. Встретьтесь с ними у ворот и атакуйте вместе.', 'Petrukha\'s group is heading to the motor depot. Meet them at the gates and attack together.'), target: { level: 'cordon', x: 34, z: -104 } },
      { text: T('Перебейте бандитов на АТП. Шустрый держат где-то внутри.', 'Kill the bandits at the motor depot. Nimble is held somewhere inside.'), target: { level: 'cordon', x: 80, z: -100 } },
      { text: T('АТП зачищено. Поговорите с Шустрым — он в сторожке у ворот.', 'The depot is clear. Talk to Nimble — he is in the guard hut by the gates.'), target: { level: 'cordon', actor: 'nimble' } }] },
    q_flash: { main: true, title: T('Флешка для Сидоровича', 'A flash drive for Sidorovich'), stages: [
      { text: T('Отнесите флешку Шустрого Сидоровичу в бункер.', 'Take Nimble\'s flash drive to Sidorovich\'s bunker.'), target: { level: 'cordon', actor: 'sidorovich' } }] },
    q_garbage: { main: true, title: T('Путь на Свалку', 'The way to Garbage'), stages: [
      { text: T('Нужно пройти за железнодорожную насыпь. Военные на мосту возьмут взятку (500 RU), а под разрушенным ж/д мостом есть проход через аномалии — не забудьте болты.', 'You must get past the railway embankment. The soldiers at the bridge take bribes (500 RU); under the collapsed rail bridge there is a way through the anomalies — use bolts.'), target: { level: 'cordon', x: 22, z: 30 }, alt: { level: 'cordon', x: -100, z: 25 } },
      { text: T('Вы за насыпью. Идите по дороге на север — к Свалке.', 'You are past the embankment. Follow the road north to Garbage.'), target: { level: 'cordon', x: -2, z: 290 } }] },
    q_seriy: { main: true, title: T('Найти Серого', 'Find Seriy'), stages: [
      { text: T('Сидорович сказал, что Серый из одиночек знает о группе Стрелка. Его ищут в ангаре на Свалке.', 'Sidorovich said that Seriy of the loners knows about Strelok\'s group. Look for him in the hangar at Garbage.'), target: { level: 'garbage', x: 64, z: -80 } },
      { text: T('Бандиты атакуют ангар! Помогите одиночкам отбиться.', 'Bandits are attacking the hangar! Help the loners fight them off.'), target: { level: 'garbage', x: 40, z: -85 } },
      { text: T('Атака отбита. Поговорите с Серым.', 'The attack is repelled. Talk to Seriy.'), target: { level: 'garbage', actor: 'seriy' } }] },
    q_digger: { main: true, title: T('КПК Копателя', 'Digger\'s PDA'), stages: [
      { text: T('Копатель из группы Стрелка погиб на кладбище техники. Найдите его КПК в разбитом ангаре. Там сильная радиация и, по слухам, что-то невидимое.', 'Digger from Strelok\'s group died at the vehicle graveyard. Find his PDA in the wrecked hangar. Heavy radiation there, and rumours of something invisible.'), target: { level: 'garbage', x: 112, z: 131 } }] },
    q_agroprom: { main: true, title: T('Дорога на Агропром', 'The road to Agroprom'), stages: [
      { text: T('В КПК Копателя — маршрут группы Стрелка через Агропром. Идите по дороге на запад.', 'Digger\'s PDA holds the route of Strelok\'s group through Agroprom. Follow the road west.'), target: { level: 'garbage', x: 190, z: 38 } }] },
    q_tolik: { title: T('Раненый Толик', 'Wounded Tolik'), stages: [
      { text: T('У дороги в деревню лежит раненый сталкер Толик. Ему нужна аптечка.', 'The wounded stalker Tolik lies by the road into the village. He needs a medkit.'), target: { level: 'cordon', actor: 'tolik' } }] },
    q_medusa: { title: T('Артефакт для Сидоровича', 'An artifact for Sidorovich'), stages: [
      { text: T('Сидорович хочет «Медузу». Говорят, под разрушенным ж/д мостом, среди «Электр», что-то светилось.', 'Sidorovich wants a Jellyfish. They say something glowed among the Electros under the collapsed rail bridge.'), target: { level: 'cordon', x: -100, z: 24 } },
      { text: T('«Медуза» у вас. Отнесите её Сидоровичу.', 'You have the Jellyfish. Take it to Sidorovich.'), target: { level: 'cordon', actor: 'sidorovich' } }] },
    q_dogs: { title: T('Собаки у старой фермы', 'Dogs at the old farm'), stages: [
      { text: T('Стая слепых псов у старой фермы нападает на новичков. Волк просит её перебить.', 'A pack of blind dogs at the old farm attacks the rookies. Wolf asks you to wipe it out.'), target: { level: 'cordon', x: -125, z: -60 } },
      { text: T('Стая уничтожена. Вернитесь к Волку за наградой.', 'The pack is dead. Return to Wolf for your reward.'), target: { level: 'cordon', actor: 'wolf' } }] },
    q_farm: { title: T('Хутор бандитов', 'The bandit farmstead'), stages: [
      { text: T('Бандиты засели на хуторе за насыпью и грабят всех, кто идёт на Свалку. Фанат просит их выбить.', 'Bandits hold the farmstead beyond the embankment and rob everyone heading to Garbage. Fanatic asks you to drive them out.'), target: { level: 'cordon', x: -72, z: 214 } },
      { text: T('Хутор свободен. Расскажите об этом Фанату.', 'The farmstead is free. Tell Fanatic.'), target: { level: 'cordon', actor: 'fanatic' } }] },
    q_fox: { title: T('Лис в беде', 'Fox in trouble'), stages: [
      { text: T('Сталкер Лис передал сигнал SOS с хутора на северо-востоке Свалки: его обложили собаки.', 'The stalker Fox sent an SOS from the farm in the north-east of Garbage: dogs have him cornered.'), target: { level: 'garbage', x: -122, z: 120 } },
      { text: T('Собаки перебиты. Поговорите с Лисом.', 'The dogs are dead. Talk to Fox.'), target: { level: 'garbage', actor: 'fox' } }] },
    q_bes: { title: T('Бес у бандитов', 'Bes and the bandits'), stages: [
      { text: T('Бандиты в депо держат сталкера Беса и требуют выкуп. Выручите его.', 'Bandits at the depot are holding the stalker Bes for ransom. Get him out.'), target: { level: 'garbage', x: -104, z: -46 } },
      { text: T('Бандиты мертвы. Поговорите с Бесом.', 'The bandits are dead. Talk to Bes.'), target: { level: 'garbage', actor: 'bes' } }] }
  };
  function q(g, id) { return g.quests[id] || null; }
  function active(g, id, stage) { const s = g.quests[id]; return !!s && s.state === 'active' && (stage == null || s.stage === stage); }
  function done(g, id) { const s = g.quests[id]; return !!s && s.state === 'done'; }
  function startQuest(g, id, stage = 0) {
    if (g.quests[id]) return;
    g.quests[id] = { state: 'active', stage, t: g.time }; g.questOrder.push(id); g.activeQuest = id;
    g.emit({ t: 'task', kind: 'new', q: id, title: g.L(QUESTS[id].title) });
  }
  function setStage(g, id, stage) { const s = g.quests[id]; if (!s || s.state !== 'active' || s.stage === stage) return; s.stage = stage; g.emit({ t: 'task', kind: 'upd', q: id, title: g.L(QUESTS[id].title) }); }
  function complete(g, id, money = 0, items = []) {
    const s = g.quests[id]; if (!s || s.state !== 'active') return;
    s.state = 'done'; s.t = g.time; g.stats.rating += QUESTS[id].main ? 60 : 35;
    g.emit({ t: 'task', kind: 'done', q: id, title: g.L(QUESTS[id].title) });
    if (money) { g.money += money; g.emit({ t: 'msg', text: `${g.L(D.STR[g.lang] ? T('Получено', 'Received') : '')}: ${money} RU`, color: '#e0d070' }); }
    for (const [iid, n] of items) { g.give(iid, n || 1); g.emit({ t: 'msg', text: `${g.L(T('Получено', 'Received'))}: ${g.L(IT[iid].name)}${n > 1 ? ' ×' + n : ''}`, color: '#d0f0c0' }); }
    if (g.activeQuest === id) g.activeQuest = null;
  }
  function fail(g, id) { const s = g.quests[id]; if (!s || s.state !== 'active') return; s.state = 'failed'; g.emit({ t: 'task', kind: 'fail', q: id, title: g.L(QUESTS[id].title) }); }
  function news(g, from, text, icon = 'stalker') { const n = { from: g.L(from), text: g.L(text), time: g.time, icon }; g.news.push(n); if (g.news.length > 60) g.news.shift(); g.emit({ t: 'news', from: n.from, text: n.text, icon }); }
  function diary(g, key, title, text) { if (g.diary.some(d => d.key === key)) return; g.diary.push({ key, title: g.L(title), text: g.L(text), time: g.time }); }
  function giveTo(g, id, n = 1) { g.give(id, n); g.emit({ t: 'msg', text: `${g.L(T('Получено', 'Received'))}: ${g.L(IT[id].name)}${n > 1 ? ' ×' + n : ''}`, color: '#d0f0c0' }); }
  function takeFrom(g, id, n = 1) { const ok = g.takeById(id, n); if (ok) g.emit({ t: 'msg', text: `${g.L(T('Отдано', 'Given'))}: ${g.L(IT[id].name)}`, color: '#c0c0c0' }); return ok; }
  function pay(g, sum) { if (g.money < sum) return false; g.money -= sum; g.emit({ t: 'msg', text: `−${sum} RU`, color: '#e0a070' }); return true; }
  function earn(g, sum) { g.money += sum; g.emit({ t: 'msg', text: `+${sum} RU`, color: '#e0d070' }); }
  const medkitId = g => (g.has('medkit') ? 'medkit' : g.has('medkit_army') ? 'medkit_army' : null);

  // quest marker for the PDA/compass
  function markers(g) {
    const out = [];
    for (const id of g.questOrder) {
      const s = g.quests[id]; if (!s || s.state !== 'active') continue;
      const st = QUESTS[id].stages[s.stage]; if (!st) continue;
      for (const tg of [st.target, st.alt]) {
        if (!tg) continue;
        if (tg.actor) { if (tg.level === g.levelId) { const a = g.actorById(tg.actor); if (a) out.push({ q: id, x: a.x, z: a.z, main: !!QUESTS[id].main }); } else out.push({ q: id, level: tg.level, main: !!QUESTS[id].main }); }
        else if (tg.level === g.levelId) out.push({ q: id, x: tg.x, z: tg.z, main: !!QUESTS[id].main });
        else out.push({ q: id, level: tg.level, main: !!QUESTS[id].main });
      }
    }
    return out;
  }

  // ================================================================ traders
  const TRADERS = {
    sidorovich: { name: T('Сидорович', 'Sidorovich'), money: 30000, sellMul: 1.25, buyMul: 0.45, artMul: 0.75, stock: [
      { id: '9x18' }, { id: '9x19' }, { id: '12x70' }, { id: '545' }, { id: '545bp', n: 6 }, { id: 'medkit' }, { id: 'medkit_army', n: 4 }, { id: 'bandage' }, { id: 'antirad' },
      { id: 'vodka' }, { id: 'bread' }, { id: 'sausage' }, { id: 'tourist' }, { id: 'energy', n: 5 }, { id: 'rgd5', n: 6 }, { id: 'f1', n: 4 },
      { id: 'fort', n: 1, cond: 0.85 }, { id: 'obrez', n: 2, cond: 0.8 }, { id: 'toz', n: 1, cond: 0.8 }, { id: 'mp5', n: 1, cond: 0.8 }, { id: 'aks74u', n: 1, cond: 0.75 }, { id: 'stalker_suit', n: 1, cond: 0.9 }] },
    seriy: { name: T('Серый', 'Seriy'), money: 9000, sellMul: 1.5, buyMul: 0.3, artMul: 0.55, stock: [
      { id: '9x18', n: 6 }, { id: '545', n: 6 }, { id: '12x70', n: 5 }, { id: 'medkit', n: 5 }, { id: 'bandage', n: 8 }, { id: 'antirad', n: 6 }, { id: 'vodka', n: 5 }, { id: 'tourist', n: 5 }] }
  };
  // deep copies live in the game so purchases persist in saves
  function traderState(g, key) { g.flags.traders = g.flags.traders || {}; if (!g.flags.traders[key]) g.flags.traders[key] = JSON.parse(JSON.stringify(TRADERS[key])); return g.flags.traders[key]; }

  // ================================================================ dialogues
  // node: { say: text | fn(g,a), opts: [{ t, if(g,a), do(g,a), go: nodeId | null | 'trade' }] }
  const bye = T('Бывай.', 'See you.');
  const DIALOGS = {
    sidorovich: {
      start: g => (!g.flags.intro_done ? 'intro' : 'root'),
      nodes: {
        intro: { say: T('А, очухался, Меченый. Слушай сюда. Нашли тебя сталкеры на обочине, в грузовике смерти. Я тебя выходил, так что с тебя должок. И не спорь. В КПК у тебя одна запись: «Убить Стрелка». Кто такой Стрелок — не знаю, но разузнать можно.', 'Ah, you\'re awake, Marked One. Listen. Stalkers found you by the road in a death truck. I patched you up, so now you owe me. Don\'t argue. There\'s one entry in your PDA: "Kill Strelok". Who Strelok is, I don\'t know, but we can find out.'), opts: [
          { t: T('Кто я? Ничего не помню...', 'Who am I? I remember nothing...'), go: 'intro2' },
          { t: T('Что за должок?', 'What do I owe you?'), go: 'intro2' }] },
        intro2: { say: T('Кто ты — мне без разницы. Работа есть. Шустрый, сталкер из деревни, нёс мне флешку с важной информацией. Его бандиты на АТП повязали. Иди к Волку в деревню — он там за старшего, людей даст. Вытащите Шустрого, флешку — мне. Держи на дорогу, и не благодари.', 'I don\'t care who you are. There\'s work. Nimble, a stalker from the village, was bringing me a flash drive with important data. Bandits grabbed him at the motor depot. Go to Wolf in the village — he\'s in charge there and will give you men. Get Nimble out and bring me the drive. Take this for the road, no need to thank me.'), opts: [
          { t: T('Ладно. Где найти Волка?', 'Fine. Where do I find Wolf?'), do: g => { g.flags.intro_done = true; startQuest(g, 'q_wolf'); giveTo(g, '9x18', 2); giveTo(g, 'medkit'); diary(g, 'marked', T('Меченый', 'Marked One'), T('Меня вытащили из «грузовика смерти». На руке татуировка «S.T.A.L.K.E.R.», в КПК — «Убить Стрелка». Сидорович требует долг.', 'I was pulled out of a "death truck". A S.T.A.L.K.E.R. tattoo on my arm, "Kill Strelok" in my PDA. Sidorovich wants his debt paid.')); }, go: 'wolfhint' }] },
        wolfhint: { say: T('Выйдешь из бункера — налево, по тропинке до деревни. Волк у въезда стоит, в комбинезоне. И вот ещё: у меня можно купить всё, что нужно. Если деньги будут.', 'Out of the bunker, follow the path to the village. Wolf stands at the entrance, in a suit. And another thing: you can buy anything you need from me. If you have the money.'), opts: [{ t: T('Понял.', 'Got it.'), go: null }] },
        root: { say: g => (g.has('flash_nimble') ? T('Ну? Принёс?', 'Well? Got it?') : done(g, 'q_flash') ? T('Чего надо, Меченый? Время — деньги.', 'What do you want, Marked One? Time is money.') : T('Ну что, Шустрого вытащил? Нет? Так чего стоишь?', 'So, did you get Nimble out? No? Then why are you standing here?')), opts: [
          { t: T('Вот флешка Шустрого.', 'Here\'s Nimble\'s flash drive.'), if: g => g.has('flash_nimble'), go: 'flash' },
          { t: T('Вот «Медуза», как договаривались.', 'Here is the Jellyfish, as agreed.'), if: g => active(g, 'q_medusa') && g.has('medusa'), go: 'medusa_done' },
          { t: T('Есть работа?', 'Got any work?'), if: g => !q(g, 'q_medusa'), go: 'medusa' },
          { t: T('Как пройти за насыпь?', 'How do I get past the embankment?'), if: g => active(g, 'q_garbage', 0), go: 'embank' },
          { t: T('Расскажи про Стрелка.', 'Tell me about Strelok.'), if: g => done(g, 'q_flash'), go: 'strelok' },
          { t: T('Давай поторгуем.', 'Let\'s trade.'), go: 'trade' },
          { t: bye, go: null }] },
        flash: { say: T('Давай сюда. Так... Ага. Значит, слушай: на флешке данные про группу Стрелка. Был с ним один, Копатель — пропал на Свалке. А на Свалке заправляет Серый из одиночек, он о них что-то знает. Держи за работу. И да — за насыпь просто так не пройдёшь: на мосту военные. Хочешь — плати им, хочешь — лезь под разрушенный ж/д мост, там аномалии. Сам решай.', 'Give it here. Right... Aha. Listen: the drive has data on Strelok\'s group. One of them, Digger, vanished at Garbage. At Garbage, Seriy of the loners is the man; he knows something about them. Here\'s your pay. And no, you won\'t just walk past the embankment: the military hold the bridge. Pay them, or crawl under the collapsed rail bridge through the anomalies. Your call.'), opts: [
          { t: T('Понял. Иду на Свалку.', 'Understood. Heading to Garbage.'), do: g => { takeFrom(g, 'flash_nimble'); complete(g, 'q_flash', 1500); startQuest(g, 'q_garbage'); startQuest(g, 'q_seriy'); diary(g, 'strelok', T('Стрелок', 'Strelok'), T('Группа Стрелка ходила глубоко в Зону. Один из них, Копатель, пропал на Свалке. Серый из одиночек что-то знает.', 'Strelok\'s group went deep into the Zone. One of them, Digger, disappeared at Garbage. Seriy of the loners knows something.')); g.emit({ t: 'autosave' }); }, go: null }] },
        medusa: { say: T('Работа всегда есть. Принеси мне «Медузу». Под разрушенным ж/д мостом «Электры» трещат, там её видели. Три тысячи дам. Болты не забудь.', 'There\'s always work. Bring me a Jellyfish. Electros crackle under the collapsed rail bridge — one was seen there. I\'ll pay three thousand. Don\'t forget your bolts.'), opts: [
          { t: T('Договорились.', 'Deal.'), do: g => { startQuest(g, 'q_medusa'); if (g.has('medusa')) setStage(g, 'q_medusa', 1); }, go: null },
          { t: T('Не сейчас.', 'Not now.'), go: 'root' }] },
        medusa_done: { say: T('О, светится... Хорошая. Держи, как обещал.', 'Oh, it glows... A good one. Here, as promised.'), opts: [{ t: T('Приятно иметь дело.', 'Pleasure doing business.'), do: g => { takeFrom(g, 'medusa'); complete(g, 'q_medusa', 3000); }, go: 'root' }] },
        embank: { say: T('Военные на мосту — народ продажный. Капитан у них, Кузнецов, за пятьсот рублей глаза закроет. Не хочешь платить — лезь под разрушенный мост, где овраг. Только там «Электры», кидай болты. А на юг, к блокпосту, даже не суйся — там стреляют без разговоров.', 'The soldiers at the bridge are for sale. Their captain, Kuznetsov, will look away for five hundred. Don\'t want to pay — crawl under the collapsed bridge through the ravine. But there are Electros there, throw bolts. And don\'t even think of going south to the checkpoint — they shoot on sight.'), opts: [{ t: T('Ясно.', 'Clear.'), go: 'root' }] },
        strelok: { say: T('Стрелок — легенда. Говорят, дальше всех в Зону ходил, до самого центра. А тебе он зачем — это ты у себя в КПК спроси.', 'Strelok is a legend. They say he went deeper into the Zone than anyone, right to the centre. Why you want him — ask your PDA.'), opts: [{ t: T('Спрошу.', 'I will.'), go: 'root' }] },
        trade: { trade: true }
      }
    },
    wolf: {
      start: () => 'root',
      nodes: {
        root: { say: g => (active(g, 'q_wolf') ? T('Стой. Ты кто такой? А, это тебя Сидорович выходил... Меченый. Чего надо?', 'Hold it. Who are you? Ah, the one Sidorovich patched up... Marked One. What do you want?') : T('Как оно, Меченый?', 'How\'s it going, Marked One?')), opts: [
          { t: T('Сидорович прислал. Нужно вытащить Шустрого.', 'Sidorovich sent me. We need to get Nimble out.'), if: g => active(g, 'q_wolf'), go: 'nimble' },
          { t: T('Собаки у фермы больше не побеспокоят.', 'The dogs at the farm won\'t bother anyone now.'), if: g => active(g, 'q_dogs', 1), go: 'dogs_done' },
          { t: T('Есть для меня дело?', 'Anything for me?'), if: g => done(g, 'q_wolf') && !q(g, 'q_dogs'), go: 'dogs' },
          { t: T('Расскажи о Кордоне.', 'Tell me about the Cordon.'), go: 'cordon' },
          { t: bye, go: null }] },
        nimble: { say: T('Шустрого на АТП держат, бандиты. Их там человек семь, главный — Юрик. Петруха с ребятами как раз туда собирается. Вот, возьми обрез и патроны — с пукалкой своей там делать нечего. Встретишься с Петрухой у ворот АТП, на востоке от дороги. Действуйте вместе.', 'Nimble is held at the motor depot by bandits. About seven of them, Yurik in charge. Petrukha and his boys are about to go there. Here, take this sawn-off and shells — you won\'t get far with that peashooter. Meet Petrukha at the depot gates, east of the road. Work together.'), opts: [
          { t: T('Выдвигаюсь.', 'On my way.'), do: g => { complete(g, 'q_wolf'); startQuest(g, 'q_nimble'); giveTo(g, 'obrez'); giveTo(g, '12x70', 2); S.QUESTS.sendTeam(g); }, go: null }] },
        dogs: { say: T('У старой фермы, на северо-запад отсюда, стая слепых псов прижилась. Двоих новичков уже порвали. Перебей их — не обижу.', 'A pack of blind dogs settled at the old farm north-west of here. Already tore up two rookies. Wipe them out and I\'ll make it worth your while.'), opts: [
          { t: T('Сделаю.', 'I\'ll do it.'), do: g => { startQuest(g, 'q_dogs'); if (g.groupDead('farm_dogs')) setStage(g, 'q_dogs', 1); }, go: null },
          { t: T('Потом.', 'Later.'), go: 'root' }] },
        dogs_done: { say: T('Слышал, слышал. Держи, заработал.', 'Heard about it. Here, you\'ve earned it.'), opts: [{ t: T('Спасибо.', 'Thanks.'), do: g => complete(g, 'q_dogs', 700, [['medkit', 1]]), go: 'root' }] },
        cordon: { say: T('Кордон — это предбанник Зоны. На юге военный блокпост — туда не ходи. На востоке АТП, дальше насыпь с мостом, там тоже военные. За насыпью — МТС, хутор и дорога на Свалку. Ночью без фонаря не шастай, собаки.', 'The Cordon is the Zone\'s front porch. South is the army checkpoint — stay away. East is the motor depot, then the embankment and the bridge with more soldiers. Beyond the embankment: the tractor station, a farmstead and the road to Garbage. Don\'t wander at night without a flashlight — dogs.'), opts: [{ t: T('Понял.', 'Got it.'), go: 'root' }] }
      }
    },
    fanatic: {
      start: () => 'root',
      nodes: {
        root: { say: T('Здорово. Я Фанат, новичков тут учу, как не помереть в первый же день.', 'Hi. I\'m Fanatic. I teach rookies how not to die on their first day.'), opts: [
          { t: T('Дай совет новичку.', 'Any advice for a rookie?'), go: 'tips' },
          { t: T('Нужна помощь?', 'Need a hand?'), if: g => !q(g, 'q_farm'), go: 'farm' },
          { t: T('Хутор свободен.', 'The farmstead is clear.'), if: g => active(g, 'q_farm', 1), go: 'farm_done' },
          { t: bye, go: null }] },
        tips: { say: T('Первое — аномалии. Слышишь, детектор пищит, — остановись, кинь болт (клавиша 6). Второе — радиация: антирад или водка. Третье — кровь: бинт сразу. И ешь вовремя, а то ноги таскать не будешь. Ну и лишнего не таскай: больше 50 кило — и не побегаешь.', 'First — anomalies. Detector beeps — stop, throw a bolt (key 6). Second — radiation: anti-rad or vodka. Third — bleeding: bandage right away. And eat on time, or you won\'t drag your legs. Don\'t carry too much: over 50 kilos and you can\'t run.'), opts: [{ t: T('Спасибо.', 'Thanks.'), go: 'root' }] },
        farm: { say: T('За насыпью, на хуторе к северо-западу от дороги, засели бандиты. Грабят всех, кто на Свалку идёт. Выбьешь их — отблагодарю.', 'Beyond the embankment, at the farmstead north-west of the road, bandits have dug in. They rob everyone going to Garbage. Drive them out and I\'ll reward you.'), opts: [
          { t: T('Займусь.', 'I\'ll handle it.'), do: g => { startQuest(g, 'q_farm'); if (g.groupDead('farm_bandits')) setStage(g, 'q_farm', 1); }, go: null }, { t: T('Не сейчас.', 'Not now.'), go: 'root' }] },
        farm_done: { say: T('Вот это дело! Держи, заслужил.', 'Now that\'s something! Here, you\'ve earned it.'), opts: [{ t: T('Обращайся.', 'Any time.'), do: g => complete(g, 'q_farm', 1200, [['545', 2]]), go: 'root' }] }
      }
    },
    tolik: {
      start: g => (done(g, 'q_tolik') ? 'thanks' : 'root'),
      nodes: {
        root: { say: T('Братан... Собаки порвали... Аптечку... есть аптечка?', 'Brother... dogs tore me up... a medkit... got a medkit?'), opts: [
          { t: T('Держи аптечку.', 'Here, take a medkit.'), if: g => !!medkitId(g), do: (g, a) => { takeFrom(g, medkitId(g)); a.wounded = false; a.storyWound = false; a.beh = 'guard'; a.home = { x: a.x, z: a.z, yaw: a.yaw }; a.hp = a.maxHp * 0.7; startQuest(g, 'q_tolik'); complete(g, 'q_tolik', 200, [['antirad', 2]]); g.addGoodwill('stalker', 60); }, go: 'thanks' },
          { t: T('Нет у меня аптечки.', 'I don\'t have one.'), do: g => startQuest(g, 'q_tolik'), go: null }] },
        thanks: { say: T('Спасибо, братан. Век не забуду. Держи, что есть... Если что — я в деревне.', 'Thanks, brother. I won\'t forget it. Take what I have... I\'ll be in the village.'), opts: [{ t: T('Выздоравливай.', 'Get well.'), go: null }] }
      }
    },
    nimble: {
      start: g => (g.groupDead('atp_bandits') ? (g.flags.nimble_free ? 'after' : 'root') : 'captive'),
      nodes: {
        captive: { say: T('Тише ты! Бандиты кругом. Перебей их — тогда поговорим.', 'Quiet! Bandits everywhere. Kill them, then we\'ll talk.'), opts: [{ t: T('Жди.', 'Wait here.'), go: null }] },
        root: { say: T('Фух, спасибо! Думал, всё, конец мне. Ты от Сидоровича? Вот флешка, я её в сапоге прятал. Передай ему. Я в деревню — отлежусь. Будет нужно оружие получше — заходи, я достану.', 'Phew, thank you! Thought I was done for. You from Sidorovich? Here\'s the drive, I hid it in my boot. Give it to him. I\'m off to the village to rest. If you need better guns — drop by, I\'ll get you some.'), opts: [
          { t: T('Береги себя.', 'Take care.'), do: (g, a) => { g.flags.nimble_free = true; g.give('flash_nimble'); g.emit({ t: 'msg', text: g.L(T('Получено: Флешка Шустрого', 'Received: Nimble\'s flash drive')), color: '#d0f0c0' }); complete(g, 'q_nimble', 0, [['aks74u', 1]]); startQuest(g, 'q_flash'); a.ignore = false; a.beh = 'goto'; a.goal = [-70, -196]; a.after = 'camp'; a.look = 'hostage'; g.emit({ t: 'autosave' }); }, go: null }] },
        after: { say: T('Ещё раз спасибо, Меченый. Не забудь — флешку Сидоровичу.', 'Thanks again, Marked One. Don\'t forget — the drive goes to Sidorovich.'), opts: [{ t: bye, go: null }] }
      }
    },
    kuznetsov: {
      start: g => (g.flags.bridge_paid ? 'paid' : 'root'),
      nodes: {
        root: { say: T('Стоять! Проход закрыт. Документы есть? Нет? Тогда разворачивайся, пока цел.', 'Halt! No passage. Papers? No? Then turn around while you still can.'), opts: [
          { t: T('А если договоримся? (500 RU)', 'What if we make a deal? (500 RU)'), if: g => g.money >= 500, do: g => { pay(g, 500); g.flags.bridge_paid = true; if (active(g, 'q_garbage')) g.emit({ t: 'task', kind: 'upd', q: 'q_garbage', title: g.L(QUESTS.q_garbage.title) }); }, go: 'paid' },
          { t: T('Денег нет.', 'I have no money.'), if: g => g.money < 500, go: 'poor' },
          { t: T('Ухожу.', 'I\'m leaving.'), go: null }] },
        poor: { say: T('Нет денег — нет прохода. Свободен.', 'No money, no passage. Get lost.'), opts: [{ t: T('...', '...'), go: null }] },
        paid: { say: T('Проходи быстро, пока я не передумал. И меня ты не видел.', 'Move along quickly before I change my mind. And you never saw me.'), opts: [{ t: T('Понял.', 'Understood.'), go: null }] }
      }
    },
    seriy: {
      start: () => 'root',
      nodes: {
        root: { say: g => (active(g, 'q_seriy', 1) ? T('Не до разговоров — бандиты прут! Держи восточную сторону!', 'No time to talk — bandits incoming! Hold the east side!') : T('Я Серый. Чего хотел, сталкер?', 'I\'m Seriy. What do you want, stalker?')), opts: [
          { t: T('Меня прислал Сидорович. Ищу Стрелка.', 'Sidorovich sent me. I\'m looking for Strelok.'), if: g => active(g, 'q_seriy', 2), go: 'strelok' },
          { t: T('Я ищу Стрелка.', 'I\'m looking for Strelok.'), if: g => active(g, 'q_seriy', 0), go: 'wait' },
          { t: T('КПК Копателя у меня.', 'I have Digger\'s PDA.'), if: g => g.has('pda_digger') && !g.flags.seriy_pda, go: 'pda' },
          { t: T('Поторгуем?', 'Trade?'), if: g => !active(g, 'q_seriy', 1), go: 'trade' },
          { t: bye, go: null }] },
        wait: { say: T('Стрелок, говоришь... Потом поговорим, у нас тут неспокойно.', 'Strelok, you say... We\'ll talk later, things are restless here.'), opts: [{ t: T('Ладно.', 'Fine.'), go: null }] },
        strelok: { say: T('Выручил ты нас, спасибо. Про Стрелка... Был у него в группе Копатель. Шли они через кладбище техники, там Копатель и остался. Говорят, что-то невидимое его порвало, и фонит там жутко. КПК у Копателя при себе был — в нём маршрут. Найдёшь — узнаешь, куда Стрелок пошёл. Держи за помощь, и антирад возьми — пригодится.', 'You helped us out, thanks. About Strelok... He had a man named Digger in his group. They went through the vehicle graveyard, and Digger stayed there. Something invisible tore him apart, they say, and the radiation is awful. Digger carried a PDA with the route. Find it and you\'ll know where Strelok went. Here\'s something for your help, and take anti-rads — you\'ll need them.'), opts: [
          { t: T('Найду.', 'I\'ll find it.'), do: g => { complete(g, 'q_seriy', 2000, [['antirad', 3]]); startQuest(g, 'q_digger'); if (g.has('pda_digger')) S.QUESTS.onPickup(g, 'pda_digger'); diary(g, 'digger', T('Копатель', 'Digger'), T('Копатель из группы Стрелка погиб на кладбище техники на Свалке. Его КПК хранит маршрут группы.', 'Digger of Strelok\'s group died at the vehicle graveyard at Garbage. His PDA holds the group\'s route.')); }, go: null }] },
        pda: { say: T('Нашёл-таки! Живой вернулся — уже подвиг. Так... Агропром, НИИ, подземелья... Стрелок шёл к центру Зоны. Иди на Агропром, дорога на запад. Удачи, Меченый. Вот, держи ещё.', 'You found it! Coming back alive is a feat already. Let\'s see... Agroprom, the institute, the underground... Strelok was heading to the centre of the Zone. Go to Agroprom, the road west. Good luck, Marked One. Here, take this too.'), opts: [{ t: T('Спасибо, Серый.', 'Thanks, Seriy.'), do: g => { g.flags.seriy_pda = true; earn(g, 1000); giveTo(g, 'medkit_army'); }, go: null }] },
        trade: { trade: true }
      }
    },
    fox: {
      start: g => (!g.groupDead('fox_dogs') && !done(g, 'q_fox') ? 'danger' : done(g, 'q_fox') ? 'after' : 'root'),
      nodes: {
        danger: { say: T('Собаки! Бей их, бей!', 'Dogs! Kill them, kill them!'), opts: [{ t: T('...', '...'), go: null }] },
        root: { say: T('Ух... Спасибо, сталкер. Думал — всё. Я Лис. Брат мой, Серый, в ангаре сидит — скажи ему, что я живой. А это тебе: тайник мой, на хуторе. Бери, что там есть.', 'Phew... Thanks, stalker. Thought I was done. I\'m Fox. My brother Seriy sits in the hangar — tell him I\'m alive. And this is for you: my stash, here at the farm. Take whatever is in it.'), opts: [
          { t: T('Держись, Лис.', 'Hang in there, Fox.'), do: (g, a) => { complete(g, 'q_fox', 800); S.QUESTS.revealStash(g, 'st_fox'); a.wounded = false; a.storyWound = false; a.beh = 'guard'; a.home = { x: a.x, z: a.z, yaw: a.yaw }; a.hp = a.maxHp * 0.6; g.addGoodwill('stalker', 50); }, go: null }] },
        after: { say: T('Как увидишь брата — передай привет.', 'If you see my brother, say hi.'), opts: [{ t: bye, go: null }] }
      }
    },
    bes: {
      start: g => (g.groupDead('depot_bandits') ? (done(g, 'q_bes') ? 'after' : 'root') : 'captive'),
      nodes: {
        captive: { say: T('Тс-с! Их трое у костра. Выручай, братан...', 'Shh! Three of them by the fire. Help me out, brother...'), opts: [{ t: T('Жди.', 'Wait.'), go: null }] },
        root: { say: T('Ну ты даёшь! Трое на одного! Спасибо, я Бес. Денег у меня нет — бандиты всё выгребли, — но знаю один тайник у вагонов. Там «Гадюка» лежит, я её сам прятал.', 'Wow, three on one! Thanks, I\'m Bes. I have no money — the bandits took it all — but I know a stash by the wagons. There\'s a Viper there, I hid it myself.'), opts: [
          { t: T('Сочтёмся.', 'We\'re even.'), do: (g, a) => { startQuest(g, 'q_bes'); complete(g, 'q_bes', 0); S.QUESTS.revealStash(g, 'st_wagon'); a.ignore = false; a.beh = 'goto'; a.goal = [66, -82]; a.after = 'guard'; a.look = 'hostage'; g.addGoodwill('stalker', 60); }, go: null }] },
        after: { say: T('Спасибо ещё раз!', 'Thanks again!'), opts: [{ t: bye, go: null }] }
      }
    },
    duty: {
      start: () => 'root',
      nodes: {
        root: { say: T('Стой. Здесь блокпост «Долга». Проход в Бар закрыт до особого распоряжения — у нас там зачистка.', 'Stop. This is a Duty checkpoint. The way to the Bar is closed until further notice — we\'re running a sweep.'), opts: [
          { t: T('Что такое «Долг»?', 'What is Duty?'), go: 'duty' },
          { t: T('Понял, ухожу.', 'Understood, leaving.'), go: null }] },
        duty: { say: T('Группировка. Наш долг — защитить мир от заразы Зоны. Мутантов бьём, бандитов не терпим. Вступить хочешь — приходи, когда проход откроем.', 'A faction. Our duty is to protect the world from the Zone\'s plague. We kill mutants and don\'t tolerate bandits. Want to join — come back when the way opens.'), opts: [{ t: T('Посмотрим.', 'We\'ll see.'), go: null }] }
      }
    },
    rookie: {
      start: () => 'root',
      nodes: {
        root: { say: g => (active(g, 'q_nimble', 0) ? T('Меченый? Волк сказал, ты с нами на АТП. Мы уже выдвинулись — встречаемся у ворот.', 'Marked One? Wolf said you\'re with us on the depot job. We\'re already moving — meet at the gates.') : T('Здорово. Чего надо?', 'Hey. What do you want?')), opts: [
          { t: T('Как жизнь в деревне?', 'How\'s life in the village?'), go: 'life' },
          { t: bye, go: null }] },
        life: { say: T('Да какая жизнь... Сидим у костра, травим байки, ждём, когда кто-нибудь артефакт принесёт. Ночью собаки воют. Нормально, в общем.', 'What life... We sit by the fire, tell stories, wait for someone to bring an artifact. Dogs howl at night. Normal, I guess.'), opts: [{ t: T('Ясно.', 'I see.'), go: null }] }
      }
    },
    generic: {
      start: () => 'root',
      nodes: {
        root: { say: (g, a) => (a.faction === 'bandit' ? T('Чего уставился? Проваливай, пока цел.', 'What are you staring at? Get lost while you can.') : a.faction === 'military' ? T('Проходи, не задерживайся.', 'Move along.') : T('Здорово, сталкер. Как оно?', 'Hey, stalker. How\'s it going?')), opts: [
          { t: T('Расскажи что-нибудь.', 'Tell me something.'), if: (g, a) => a.faction !== 'bandit' && a.faction !== 'military', go: 'rumour' },
          { t: bye, go: null }] },
        rumour: { say: (g, a) => { const r = RUMOURS[(a.uid + Math.floor(g.time / 3600)) % RUMOURS.length]; return r; }, opts: [{ t: T('Спасибо.', 'Thanks.'), go: null }] }
      }
    },
    wounded: {
      start: () => 'root',
      nodes: {
        root: { say: T('Помоги... аптечку...', 'Help... a medkit...'), opts: [
          { t: T('Держи аптечку.', 'Here\'s a medkit.'), if: g => !!medkitId(g), do: (g, a) => { takeFrom(g, medkitId(g)); a.wounded = false; a.hp = a.maxHp * 0.6; a.ai.state = 'idle'; g.addGoodwill(a.faction, 40); g.stats.rating += 10; if (g.rng() < 0.6) { const m = 100 + Math.floor(g.rng() * 200); earn(g, m); } a.beh = a.beh === 'wounded' ? 'guard' : a.beh; if (a.faction === 'bandit' || a.faction === 'military') { a.attitude = 'neutral'; a.hostile = false; } }, go: 'thanks' },
          { t: T('Уйти.', 'Leave.'), go: null }] },
        thanks: { say: T('Спасибо... Выручил. Держи, что есть.', 'Thanks... you saved me. Take what I have.'), opts: [{ t: T('Бывай.', 'See you.'), go: null }] }
      }
    }
  };
  const RUMOURS = [
    T('Говорят, на Свалке кровосос завёлся. Невидимый, гад. Только глаза светятся.', 'They say a bloodsucker lives at Garbage. Invisible bastard. Only the eyes glow.'),
    T('На кладбище техники фонит так, что счётчик с ума сходит. Без антирада не суйся.', 'The vehicle graveyard is so hot the counter goes crazy. Don\'t go without anti-rads.'),
    T('Под разрушенным мостом «Электры». Кидай болты, прежде чем шагнуть.', 'Electros under the collapsed bridge. Throw bolts before you step.'),
    T('Капитан на мосту деньги любит. Пятьсот рублей — и ты уже на той стороне.', 'The captain at the bridge loves money. Five hundred rubles and you\'re across.'),
    T('Ночью без фонаря лучше не ходить. Фонарик — клавиша L, если что.', 'Better not walk at night without a flashlight. That\'s the L key, by the way.'),
    T('Долговцы на севере Свалки никого в Бар не пускают. Говорят, что-то там случилось.', 'Duty up north at Garbage lets nobody into the Bar. Something happened there, they say.'),
    T('Слышал про Стрелка? Говорят, он дошёл до самого Саркофага. Брешут, наверное.', 'Heard of Strelok? They say he reached the Sarcophagus itself. Probably lies.')
  ];
  S.RUMOURS = RUMOURS;

  // ================================================================ ambient PDA chatter
  const CHATTER = [
    [T('Сталкер Хмурый', 'Stalker Gloomy'), T('Кто-нибудь, заберите у меня этого новичка. Он третий раз в «Трамплин» лезет.', 'Someone take this rookie away from me. Third time he walks into a Springboard.')],
    [T('Сталкер Витёк', 'Stalker Vitek'), T('Слепые псы у МТС. Штук пять. Осторожнее там.', 'Blind dogs at the tractor station. About five. Careful.')],
    [T('Сталкер Бывалый', 'Stalker Seasoned'), T('Мужики, у кого антирад лишний? Сменяю на банку тушёнки.', 'Anyone have a spare anti-rad? Will trade for a can of stew.')],
    [T('Сталкер Косой', 'Stalker Squint'), T('Опять выброс снился. Проснулся — а водки нет. Вот это страшно.', 'Dreamt of a blowout again. Woke up — no vodka. Now that\'s scary.')],
    [T('Сталкер Толян', 'Stalker Tolyan'), T('На Свалке бандиты совсем обнаглели. Троих наших обобрали у депо.', 'Bandits at Garbage have gone wild. Robbed three of ours by the depot.')],
    [T('Сталкер Дед', 'Stalker Gramps'), T('Помню, в восемьдесят шестом тут тихо было... А теперь — Зона.', 'I remember back in eighty-six it was quiet here... Now — the Zone.')],
    [T('Сталкер Чиж', 'Stalker Finch'), T('Нашёл «Каплю» у Жарки! Хотя нет, это просто стекло...', 'Found a Droplets by a Burner! Oh wait, it\'s just glass...')]
  ];

  // ================================================================ scripts
  const API = {
    QUESTS, DIALOGS, TRADERS, markers, startQuest, setStage, complete, fail, active, done, news, traderState,
    onNewGame(g) {
      const sid = g.actorById('sidorovich'); if (sid) g.emit({ t: 'dialog', actor: sid, auto: true });
      g.chatterT = 180;
    },
    onLevel(g, id, first) {
      if (id === 'garbage' && !g.flags.garbage_seen) {
        g.flags.garbage_seen = true;
        if (g.quests.q_garbage) complete(g, 'q_garbage', 0);
        news(g, T('Сидорович', 'Sidorovich'), T('Меченый, ты на Свалке? Серый в ангаре, к западу от дороги. Смотри, бандиты там шалят.', 'Marked One, you at Garbage? Seriy is in the hangar west of the road. Watch out, the bandits are acting up.'), 'trader');
        startQuest(g, 'q_seriy');
        g.foxSosT = 40;
      }
      void first;
    },
    sendTeam(g) {
      for (const a of g.group('atp_team')) { if (a.dead) continue; a.beh = 'goto'; a.goal = [31 + (a.uid % 3) * 1.5, -104 + (a.uid % 2) * 2]; a.after = 'guard'; a.leash = 25; }
      news(g, T('Петруха', 'Petrukha'), T('Выдвигаемся к АТП. Ждём тебя у ворот.', 'Moving out to the depot. We\'ll wait for you at the gates.'));
    },
    onZone(g, z) {
      if (z === 'atp_near' && active(g, 'q_nimble', 0)) API.attackAtp(g);
      if (z === 'atp' && active(g, 'q_nimble', 0)) API.attackAtp(g);
      if (z === 'embankment_north' && active(g, 'q_garbage', 0)) setStage(g, 'q_garbage', 1);
      if (z === 'ravine' && !g.flags.ravine_hint) { g.flags.ravine_hint = true; g.msg(T('Детектор надрывается. Бросайте болты (6) и обходите аномалии.', 'The detector is going crazy. Throw bolts (6) and walk around the anomalies.'), '#a0e0ff'); }
      if (z === 'hangar_near' && active(g, 'q_seriy', 0) && !g.flags.hangar_attack) {
        g.flags.hangar_attack = true; g.spawnGroup('hangar_attack'); setStage(g, 'q_seriy', 1);
        news(g, T('Серый', 'Seriy'), T('Бандиты атакуют ангар! Кто рядом — на помощь!', 'Bandits are attacking the hangar! Anyone nearby — help!'));
      }
      if (z === 'fox_farm' && !g.flags.fox_dogs && !done(g, 'q_fox')) { g.flags.fox_dogs = true; startQuest(g, 'q_fox'); g.spawnGroup('fox_dogs'); for (const d of g.group('fox_dogs')) S.acquire(g, d, 'player', true); }
      if (z === 'depot' && !q(g, 'q_bes') && !g.groupDead('depot_bandits')) { startQuest(g, 'q_bes'); }
      if (z === 'graveyard' && !g.flags.graveyard_hint) { g.flags.graveyard_hint = true; g.msg(T('Сильная радиация! Держите антирад под рукой (F3).', 'Heavy radiation! Keep anti-rads handy (F3).'), '#ffd060'); }
      if (z === 'bar_gate') g.msg(T('Проход в Бар закрыт «Долгом».', 'Duty keeps the way to the Bar closed.'), '#e0c0a0');
    },
    attackAtp(g) {
      if (g.flags.atp_attack) return; g.flags.atp_attack = true; setStage(g, 'q_nimble', 1);
      for (const a of g.group('atp_team')) { if (a.dead) continue; a.beh = 'assault'; a.target = [78 + (a.uid % 3) * 3, -98]; a.after = 'guard'; a.leash = 60; a.ai.path = null; }
      news(g, T('Петруха', 'Petrukha'), T('Пошли, мужики! Мочи бандитов!', 'Let\'s go, guys! Kill the bandits!'));
    },
    onDeath(g, a, src) {
      if (a.group === 'atp_bandits' && g.groupDead('atp_bandits')) {
        if (!g.quests.q_nimble) startQuest(g, 'q_nimble', 2); else setStage(g, 'q_nimble', 2);
        g.flags.atp_attack = true;
        news(g, T('Петруха', 'Petrukha'), T('Чисто! Шустрый в сторожке у ворот. Мы — обратно в деревню.', 'Clear! Nimble is in the guard hut by the gates. We\'re heading back to the village.'));
        for (const t of g.group('atp_team')) if (!t.dead) { t.beh = 'goto'; t.goal = [t.home.x, t.home.z]; t.after = 'camp'; }
      }
      if (a.group === 'farm_dogs' && g.groupDead('farm_dogs') && active(g, 'q_dogs', 0)) setStage(g, 'q_dogs', 1);
      if (a.group === 'farm_bandits' && g.groupDead('farm_bandits') && active(g, 'q_farm', 0)) setStage(g, 'q_farm', 1);
      if (a.group === 'hangar_attack' && g.groupDead('hangar_attack')) { setStage(g, 'q_seriy', 2); news(g, T('Серый', 'Seriy'), T('Отбились! Спасибо, сталкер. Зайди ко мне в ангар.', 'We held! Thanks, stalker. Come see me in the hangar.')); }
      if (a.group === 'fox_dogs' && g.groupDead('fox_dogs')) setStage(g, 'q_fox', 1);
      if (a.group === 'depot_bandits' && g.groupDead('depot_bandits')) { if (!q(g, 'q_bes')) startQuest(g, 'q_bes'); setStage(g, 'q_bes', 1); }
      if (a.id && a.essential && src === 'player') {
        if (a.id === 'wolf' && active(g, 'q_wolf')) fail(g, 'q_wolf');
        news(g, T('Сталкеры', 'Stalkers'), T(`${g.L(a.name)} убит. Кто-то за это ответит.`, `${g.L(a.name)} is dead. Someone will answer for this.`));
      }
    },
    onPickup(g, id) {
      if (id === 'medusa' && active(g, 'q_medusa', 0)) setStage(g, 'q_medusa', 1);
      if (id === 'pda_digger') {
        if (!q(g, 'q_digger')) startQuest(g, 'q_digger');
        if (active(g, 'q_digger')) { complete(g, 'q_digger', 0); startQuest(g, 'q_agroprom'); diary(g, 'route', T('Маршрут Стрелка', 'Strelok\'s route'), T('В КПК Копателя: «Агропром — подземка — Янтарь — Радар — ЧАЭС. Стрелок идёт к центру Зоны».', 'Digger\'s PDA: "Agroprom — underground — Yantar — Radar — ChNPP. Strelok is heading to the centre of the Zone".')); news(g, T('КПК Копателя', 'Digger\'s PDA'), T('...группа идёт через Агропром. Стрелок уверен: в центре Зоны — ответы. Если найдёте этот КПК — передайте...', '...the group goes through Agroprom. Strelok is sure: the answers are in the centre of the Zone. If you find this PDA — pass it on...'), 'pda'); g.emit({ t: 'autosave' }); }
      }
    },
    onSell(g, id) { if (id === 'medusa' && active(g, 'q_medusa')) setStage(g, 'q_medusa', 0); },
    // a dead man's PDA sometimes reveals a stash on this level
    onPda(g, it) {
      const cand = g.stashes.filter(s => s.hidden && !g.knownStashes[s.id] && !s.opened);
      if (!cand.length) { g.msg(T('В КПК ничего интересного.', 'Nothing interesting in the PDA.')); return; }
      const s = cand[Math.floor(g.rng() * cand.length)]; API.revealStash(g, s.id);
      g.removeItem(it.uid);
    },
    revealStash(g, id) {
      const s = g.stashes.find(x => x.id === id); if (!s || g.knownStashes[id]) return;
      g.knownStashes[id] = { level: g.levelId, x: s.x, z: s.z, name: g.L(s.name) || id };
      g.emit({ t: 'news', from: g.L(D.STR[g.lang].stashInfo), text: g.L(s.name) || id, icon: 'stash' });
    },
    guardZone(g, a, dt) {
      if (a.group !== 'bridge_army' || g.flags.bridge_paid) return;
      const zn = g.def.zones.find(z => z.id === 'bridge_post'), p = g.player;
      if (!zn || !g.inRect(zn, p.x, p.z) || p.dead) { a.ai.warnT = 0; return; }
      if (a.id !== 'kuznetsov' && a.ai.warnT === 0) a.ai.warnT = 0.001;
      a.ai.warnT += dt;
      if (a.id === 'kuznetsov' && a.ai.warnT < 0.5 && !a.ai.warned) { a.ai.warned = true; S.bark(g, a, S.BARK.warn, true); }
      if (a.id === 'kuznetsov' && a.ai.warnT > 7 && !a.ai.warned2) { a.ai.warned2 = true; S.bark(g, a, S.BARK.warn, true); }
      if (a.ai.warnT > 14) { for (const o of g.group('bridge_army')) { o.attitude = null; o.hostile = true; } news(g, T('Военные', 'Military'), T('Нарушитель на мосту! Огонь!', 'Intruder at the bridge! Fire!'), 'military'); }
    },
    onAgroprom(g) {
      if (active(g, 'q_agroprom') || done(g, 'q_agroprom')) { complete(g, 'q_agroprom', 0); g.emit({ t: 'ending' }); }
      else g.msg(T('На Агропром идти пока незачем.', 'No reason to go to Agroprom yet.'), '#e0c0a0');
    },
    tick(g) {
      // Fox's SOS a while after arriving at Garbage
      if (g.foxSosT > 0) { g.foxSosT -= 1 / 60; if (g.foxSosT <= 0 && !q(g, 'q_fox')) { startQuest(g, 'q_fox'); news(g, T('Лис', 'Fox'), T('SOS! Меня собаки на хуторе обложили, северо-восток Свалки! Кто-нибудь!', 'SOS! Dogs have me cornered at the farm, north-east of Garbage! Anyone!')); } }
      // PDA chatter
      g.chatterT = (g.chatterT == null ? 200 : g.chatterT) - 1 / 60;
      if (g.chatterT <= 0) { g.chatterT = 200 + g.rng() * 240; const c = CHATTER[Math.floor(g.rng() * CHATTER.length)]; news(g, c[0], c[1]); }
      // ATP: helpers also start once the player opens fire nearby
      if (active(g, 'q_nimble', 0) && g.levelId === 'cordon' && g.group('atp_bandits').some(b => !b.dead && b.ai.state === 'combat')) API.attackAtp(g);
    }
  };
  API.INTRO = [
    T('2012 год. После второго взрыва на Чернобыльской АЭС вокруг станции образовалась Зона — место, где законы природы перестали действовать.', '2012. After the second explosion at the Chernobyl NPP, the Zone formed around the plant — a place where the laws of nature no longer apply.'),
    T('Сюда идут сталкеры — за артефактами, за деньгами, за ответами. Многие не возвращаются.', 'Stalkers come here — for artifacts, for money, for answers. Many never return.'),
    T('Грозовой ночью по Зоне мчится «грузовик смерти» с телами. Молния бьёт в кузов. Грузовик переворачивается.', 'On a stormy night a "death truck" full of bodies races through the Zone. Lightning strikes. The truck overturns.'),
    T('Мародёр находит среди тел живого. На руке — татуировка «S.T.A.L.K.E.R.». В КПК — одна запись: «Убить Стрелка».', 'A scavenger finds one man alive among the bodies. A tattoo on his arm: "S.T.A.L.K.E.R.". One entry in his PDA: "Kill Strelok".'),
    T('Его приносят к торговцу Сидоровичу. Теперь его зовут Меченый.', 'He is brought to the trader Sidorovich. From now on they call him the Marked One.')
  ];
  API.ENDING = [
    T('КПК Копателя ведёт дальше — на Агропром, в подземелья НИИ, к Янтарю и Радару.', 'Digger\'s PDA leads further — to Agroprom, into the institute\'s underground, towards Yantar and the Radar.'),
    T('Меченый уходит по пустой дороге на запад. Позади — Кордон, Свалка, Сидорович и его вечные долги.', 'The Marked One walks the empty road west. Behind him — the Cordon, Garbage, Sidorovich and his endless debts.'),
    T('Где-то впереди, в самом сердце Зоны, его ждёт Стрелок. И, может быть, ответ на вопрос: кто он такой?', 'Somewhere ahead, in the heart of the Zone, Strelok is waiting. And perhaps the answer to the question: who is he?'),
    T('Продолжение следует.', 'To be continued.')
  ];
  API.CREDITS = [
    T('S.T.A.L.K.E.R. 98: Тень Чернобыля', 'S.T.A.L.K.E.R. 98: Shadow of Chernobyl'),
    T('Фанатский ремейк в духе игр 1998–2000 годов для Win98-клона', 'A fan remake in the spirit of 1998–2000 games for the Win98 clone'),
    T('По мотивам игры GSC Game World (2007)', 'Based on the game by GSC Game World (2007)'),
    T('Вся графика, звуки и музыка сгенерированы кодом', 'All graphics, sounds and music are generated by code'),
    T('Спасибо, что играли!', 'Thanks for playing!')
  ];
  S.QUESTS = API;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
