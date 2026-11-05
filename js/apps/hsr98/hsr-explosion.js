(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M, K = H.Cine.Kit;
  const { W, HGT, C } = H.UI_CONST;
  const { cl, lerp, sm, eOut, eIn, seg, rgba, glow, lighter, poly, rect, ell, line, ring, vgrad } = K;
  const LW = 320, LH = 240, CX = 160, CY = 120;
  const hx = G.hash;
  const RCOL = { 3: '#8cc4ff', 4: '#b48cff', 5: '#ffc860' };
  const RHOT = { 3: '#e6f4ff', 4: '#f2e6ff', 5: '#fff0c8' };
  const RDEEP = { 3: '#10284a', 4: '#26124a', 5: '#3e2606' };
  const RAINBOW = ['#ff5a5a', '#ffb04a', '#ffe85a', '#6aff8a', '#5ad8ff', '#7a7aff', '#d07aff'];
  const total = list => list.reduce((s, x) => s + x[1], 0);
  const SHOTS = [['hill', 1.4], ['chant', 1.5], ['beam', 0.6], ['boom', 1.7], ['score', 1.4]];
  const SLOW = 1.5;
  const CHAR_SLOW = 1.75;
  const slowOf = r => (r.kind === 'char' ? CHAR_SLOW : SLOW);
  const CINE = total(SHOTS) * SLOW;
  const HOP = 0.35;
  const CUTS = {
    kazuma: [['card', 1.1], ['toad', 1.0], ['steal', 0.8], ['catch', 1.2], ['pose', 1.4]],
    aqua: [['card', 1.1], ['rise', 1.3], ['cage', 1.0], ['gators', 1.0], ['drag', 1.1], ['pose', 1.4]],
    megumin: [['card', 1.1], ['name', 1.0], ['circles', 1.0], ['blast', 0.9], ['fall', 0.8], ['carry', 1.2], ['pose', 1.3]],
    darkness: [['card', 1.1], ['charge', 1.0], ['miss', 1.1], ['pelt', 1.0], ['wall', 1.1], ['pose', 1.4]],
    asta: [['card', 1.1], ['treat', 1.1], ['cover', 1.0], ['pose', 1.4]],
    arlan: [['card', 1.1], ['scratch', 1.1], ['jealous', 1.0], ['pose', 1.4]],
    herta: [['card', 1.1], ['bored', 1.1], ['spin', 1.1], ['pose', 1.4]],
    serval: [['card', 1.1], ['gig', 1.1], ['finale', 1.1], ['pose', 1.4]],
    natasha: [['card', 1.1], ['rival', 1.1], ['shot', 1.0], ['pose', 1.4]],
    sampo: [['card', 1.1], ['deal', 1.1], ['swap', 1.1], ['pose', 1.4]],
    hook: [['card', 1.1], ['titles', 1.1], ['recruit', 1.1], ['pose', 1.4]],
    pela: [['card', 1.1], ['report', 1.2], ['weak', 1.1], ['pose', 1.4]],
    himeko: [['card', 1.1], ['blast', 1.1], ['coffee', 1.1], ['purify', 1.0], ['pose', 1.4]],
    welt: [['card', 1.1], ['gravity', 1.1], ['back', 1.0], ['heal', 1.1], ['pose', 1.4]],
    bronya: [['card', 1.1], ['speech', 1.1], ['lalatina', 1.0], ['order', 1.2], ['pose', 1.4]],
    gepard: [['card', 1.1], ['shield', 1.1], ['garden', 1.0], ['bloom', 1.1], ['pose', 1.4]],
    clara: [['card', 1.1], ['brave', 1.1], ['steal', 1.0], ['family', 1.1], ['pose', 1.4]],
    yanqing: [['card', 1.1], ['swords', 1.1], ['name', 1.0], ['spar', 1.2], ['pose', 1.4]],
    bailu: [['card', 1.1], ['heal', 1.2], ['candy', 1.0], ['board', 1.1], ['pose', 1.4]],
    stelle: [['card', 1.1], ['trash', 1.1], ['bat', 1.0], ['collar', 1.1], ['pose', 1.4]],
    caelus: [['card', 1.1], ['smash', 1.0], ['splash', 1.1], ['sane', 1.1], ['pose', 1.4]],
    lynx: [['card', 1.1], ['stable', 1.2], ['bar', 1.1], ['pose', 1.4]],
    luka: [['card', 1.1], ['cabbage', 1.2], ['arm', 1.2], ['pose', 1.4]],
    sushang: [['card', 1.1], ['toad', 1.2], ['tale', 1.2], ['pose', 1.4]],
    qingque: [['card', 1.1], ['table', 1.2], ['luck', 1.2], ['pose', 1.4]],
    tingyun: [['card', 1.1], ['debt', 1.2], ['boost', 1.2], ['pose', 1.4]],
    yukong: [['card', 1.1], ['cart', 1.2], ['kite', 1.2], ['pose', 1.4]],
    hanya: [['card', 1.1], ['trial', 1.2], ['burden', 1.2], ['pose', 1.4]],
    xueyi: [['card', 1.1], ['hunt', 1.2], ['gears', 1.2], ['pose', 1.4]],
    guinaifen: [['card', 1.1], ['stream', 1.2], ['knives', 1.2], ['pose', 1.4]],
    march: [['card', 1.1], ['photo', 1.2], ['shogun', 1.3], ['pose', 1.4]],
    danheng: [['card', 1.1], ['archive', 1.2], ['tide', 1.3], ['pose', 1.4]]
  };
  const BRIEF = { kazuma: 'steal', aqua: 'gators', megumin: 'blast', darkness: 'pelt', asta: 'cover', arlan: 'jealous', herta: 'spin', serval: 'finale', natasha: 'shot', sampo: 'swap', hook: 'recruit', pela: 'weak', himeko: 'coffee', welt: 'back', bronya: 'lalatina', gepard: 'garden', clara: 'steal', yanqing: 'name', bailu: 'candy', stelle: 'bat', caelus: 'splash' , lynx: 'bar', luka: 'cabbage', sushang: 'toad', qingque: 'luck', tingyun: 'debt', yukong: 'cart', hanya: 'trial', xueyi: 'hunt', guinaifen: 'stream' , march: 'photo', danheng: 'archive' };
  const BEAT_SFX = {
    kazuma: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.7, 'glint']], toad: [[0.1, 'step'], [0.3, 'step'], [0.55, 'splash']], steal: [[0.05, 'whoosh'], [0.5, 'glint']], catch: [[0.1, 'chest'], [0.5, 'splash'], [0.8, 'deny']], pose: [[0.15, 'star4']] },
    aqua: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'glint']], rise: [[0.1, 'splash'], [0.55, 'buff']], cage: [[0.1, 'splash'], [0.45, 'heal']], gators: [[0.2, 'hit'], [0.45, 'hit'], [0.7, 'break']], drag: [[0.15, 'step'], [0.6, 'step']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    megumin: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'tech']], name: [[0.05, 'swing'], [0.5, 'glint']], circles: [[0.05, 'tech'], [0.5, 'buff']], blast: [[0, 'rumble'], [0.05, 'break']], fall: [[0.3, 'step']], carry: [[0.2, 'step'], [0.7, 'step']], pose: [[0.15, 'star5']] },
    darkness: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'shield']], charge: [[0.1, 'step'], [0.35, 'step'], [0.65, 'swing']], miss: [[0.1, 'swing'], [0.45, 'swing'], [0.8, 'swing']], pelt: [[0.15, 'hit'], [0.35, 'hit'], [0.55, 'hit'], [0.75, 'crit']], wall: [[0.1, 'shield'], [0.6, 'break']], pose: [[0.15, 'star5']] },
    asta: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'chest']], treat: [[0.22, 'chest'], [0.3, 'break_obj'], [0.5, 'step'], [0.7, 'ticket']], cover: [[0.1, 'whoosh'], [0.32, 'glint'], [0.45, 'break_obj']], pose: [[0.15, 'star4']] },
    arlan: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'hit']], scratch: [[0.12, 'whoosh'], [0.3, 'hit'], [0.5, 'buff'], [0.76, 'crit'], [0.86, 'break']], jealous: [[0.1, 'heal'], [0.55, 'deny']], pose: [[0.15, 'star4']] },
    herta: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'tech']], bored: [[0.02, 'rumble'], [0.08, 'break'], [0.55, 'text'], [0.78, 'deny']], spin: [[0.1, 'swing'], [0.3, 'swing'], [0.5, 'buff'], [0.58, 'break_obj']], pose: [[0.15, 'star4']] },
    serval: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'strum']], gig: [[0.1, 'strum'], [0.4, 'strum'], [0.7, 'strum']], finale: [[0.05, 'tech'], [0.4, 'rumble'], [0.44, 'break'], [0.8, 'strum']], pose: [[0.15, 'star4']] },
    natasha: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'heal']], rival: [[0.1, 'buff'], [0.6, 'deny'], [0.5, 'step'], [0.82, 'glint']], shot: [[0.15, 'hit'], [0.32, 'whoosh'], [0.5, 'heal'], [0.62, 'cancel']], pose: [[0.15, 'star4']] },
    sampo: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'chest']], deal: [[0.15, 'step'], [0.52, 'ticket'], [0.7, 'glint'], [0.78, 'deny']], swap: [[0.05, 'whoosh'], [0.2, 'glint'], [0.45, 'cancel'], [0.6, 'chest']], pose: [[0.15, 'star4']] },
    hook: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'swing']], titles: [[0.05, 'tech'], [0.38, 'swing'], [0.68, 'crit']], recruit: [[0.15, 'whoosh'], [0.35, 'glint'], [0.42, 'whoosh'], [0.6, 'glint'], [0.72, 'deny']], pose: [[0.15, 'star4']] },
    pela: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'text']], report: [[0.12, 'text'], [0.28, 'text'], [0.44, 'text'], [0.6, 'text'], [0.85, 'deny']], weak: [[0.05, 'tech'], [0.25, 'debuff'], [0.5, 'step'], [0.62, 'crit'], [0.66, 'break']], pose: [[0.15, 'star4']] },
    himeko: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'glint']], blast: [[0.12, 'chest'], [0.42, 'ult'], [0.6, 'rumble'], [0.62, 'break']], coffee: [[0.08, 'splash'], [0.52, 'deny'], [0.72, 'text']], purify: [[0.05, 'buff'], [0.3, 'heal'], [0.72, 'text']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    welt: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'glint']], gravity: [[0.08, 'tech'], [0.3, 'debuff'], [0.75, 'crit'], [0.78, 'break']], back: [[0.2, 'step'], [0.36, 'hit']], heal: [[0.1, 'heal'], [0.5, 'buff'], [0.64, 'text']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    bronya: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'glint']], speech: [[0.1, 'confirm'], [0.4, 'text'], [0.6, 'cancel']], lalatina: [[0.06, 'text'], [0.36, 'deny']], order: [[0.05, 'buff'], [0.4, 'swing'], [0.5, 'rumble'], [0.52, 'break'], [0.74, 'text']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    gepard: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'shield']], shield: [[0.08, 'shield'], [0.35, 'hit'], [0.55, 'hit'], [0.6, 'text']], garden: [[0.15, 'splash'], [0.6, 'cancel']], bloom: [[0.05, 'splash'], [0.3, 'buff'], [0.65, 'glint']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    clara: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'tech']], brave: [[0.1, 'step'], [0.42, 'whoosh'], [0.56, 'crit'], [0.58, 'break']], steal: [[0.05, 'whoosh'], [0.28, 'glint'], [0.4, 'debuff'], [0.55, 'deny']], family: [[0.1, 'step'], [0.45, 'buff'], [0.6, 'heal']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    yanqing: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'swing']], swords: [[0.1, 'whoosh'], [0.4, 'swing'], [0.5, 'swing'], [0.7, 'crit'], [0.72, 'break_obj']], name: [[0.15, 'confirm'], [0.55, 'deny']], spar: [[0.1, 'hit'], [0.25, 'hit'], [0.4, 'hit'], [0.55, 'hit'], [0.62, 'cancel']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    bailu: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'glint']], heal: [[0.1, 'splash'], [0.3, 'heal'], [0.55, 'buff'], [0.72, 'confirm']], candy: [[0.2, 'glint'], [0.52, 'deny'], [0.58, 'text']], board: [[0.1, 'step'], [0.5, 'glint'], [0.65, 'ticket']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    stelle: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'break_obj']], trash: [[0.05, 'door'], [0.3, 'step'], [0.56, 'chest'], [0.72, 'glint']], bat: [[0.2, 'swing'], [0.3, 'crit'], [0.88, 'glint']], collar: [[0.1, 'door'], [0.42, 'whoosh'], [0.56, 'deny']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    caelus: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'tech']], smash: [[0.15, 'step'], [0.46, 'swing'], [0.5, 'hit']], splash: [[0.05, 'buff'], [0.3, 'splash'], [0.5, 'splash'], [0.7, 'text']], sane: [[0.1, 'confirm'], [0.56, 'text'], [0.62, 'deny']], pose: [[0.1, 'glint'], [0.2, 'star5']] },
    lynx: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'tech']], stable: [[0.08, 'door'], [0.3, 'step'], [0.48, 'chest'], [0.62, 'heal'], [0.8, 'buff']], bar: [[0.12, 'step'], [0.4, 'whoosh'], [0.56, 'chest'], [0.66, 'heal'], [0.78, 'buff']], pose: [[0.15, 'star4']] },
    luka: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'hit']], cabbage: [[0.22, 'hit'], [0.4, 'hit'], [0.58, 'crit'], [0.6, 'break_obj'], [0.8, 'buff']], arm: [[0.1, 'step'], [0.32, 'hit'], [0.52, 'hit'], [0.66, 'break'], [0.8, 'deny']], pose: [[0.15, 'star4']] },
    sushang: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'swing']], toad: [[0.1, 'step'], [0.3, 'step'], [0.44, 'swing'], [0.5, 'crit'], [0.6, 'splash'], [0.8, 'confirm']], tale: [[0.1, 'text'], [0.35, 'swing'], [0.5, 'glint'], [0.78, 'deny']], pose: [[0.15, 'star4']] },
    qingque: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'chest']], table: [[0.12, 'select'], [0.3, 'select'], [0.48, 'select'], [0.66, 'deny'], [0.8, 'cancel']], luck: [[0.12, 'select'], [0.28, 'select'], [0.44, 'select'], [0.6, 'glint'], [0.66, 'crit'], [0.82, 'deny']], pose: [[0.15, 'star4']] },
    tingyun: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'glint']], debt: [[0.1, 'text'], [0.3, 'select'], [0.45, 'select'], [0.62, 'crit'], [0.7, 'debuff'], [0.84, 'deny']], boost: [[0.12, 'whoosh'], [0.3, 'tech'], [0.44, 'buff'], [0.58, 'rumble'], [0.62, 'break'], [0.84, 'cancel']], pose: [[0.15, 'star4']] },
    yukong: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'whoosh']], cart: [[0.08, 'whoosh'], [0.3, 'step'], [0.5, 'step'], [0.66, 'hit'], [0.7, 'crit'], [0.84, 'heal']], kite: [[0.12, 'whoosh'], [0.36, 'glint'], [0.55, 'swing'], [0.58, 'crit'], [0.72, 'hit'], [0.86, 'confirm']], pose: [[0.15, 'star4']] },
    hanya: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'confirm']], trial: [[0.12, 'text'], [0.26, 'text'], [0.38, 'text'], [0.5, 'text'], [0.66, 'crit'], [0.82, 'deny']], burden: [[0.1, 'whoosh'], [0.3, 'glint'], [0.44, 'debuff'], [0.56, 'shield'], [0.76, 'heal']], pose: [[0.15, 'star4']] },
    xueyi: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'debuff']], hunt: [[0.12, 'step'], [0.38, 'whoosh'], [0.46, 'debuff'], [0.6, 'hit'], [0.8, 'deny']], gears: [[0.18, 'swing'], [0.3, 'crit'], [0.34, 'break_obj'], [0.56, 'heal'], [0.7, 'heal'], [0.84, 'cancel']], pose: [[0.15, 'star4']] },
    guinaifen: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'confirm']], stream: [[0.1, 'text'], [0.36, 'whoosh'], [0.44, 'splash'], [0.52, 'glint'], [0.6, 'chest'], [0.78, 'deny']], knives: [[0.16, 'swing'], [0.26, 'hit'], [0.36, 'hit'], [0.46, 'hit'], [0.58, 'whoosh'], [0.82, 'deny']], pose: [[0.15, 'star4']] },
    march: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'glint']], photo: [[0.12, 'select'], [0.26, 'select'], [0.4, 'select'], [0.5, 'whoosh'], [0.56, 'glint'], [0.66, 'text'], [0.8, 'deny']], shogun: [[0.14, 'step'], [0.3, 'swing'], [0.38, 'shield'], [0.46, 'buff'], [0.58, 'step'], [0.66, 'hit'], [0.86, 'cancel']], pose: [[0.15, 'star4']] },
    danheng: { card: [[0.1, 'select'], [0.45, 'ticket'], [0.75, 'whoosh']], archive: [[0.12, 'door'], [0.26, 'door'], [0.4, 'door'], [0.54, 'door'], [0.62, 'break_obj'], [0.84, 'deny']], tide: [[0.1, 'tech'], [0.26, 'splash'], [0.44, 'splash'], [0.56, 'rumble'], [0.62, 'splash'], [0.84, 'cancel']], pose: [[0.15, 'star4']] }
  };
  const LINES = {
    kazuma: { card: ['Луна', 'Удача просто невероятная! А всё остальное… среднее.'], toad: ['Аква', 'Мм-мф! Казума-а-а, вытащи меня!'], steal: ['Казума', 'Кража!'], catch: ['Мегумин', 'Верни мои трусы!'] },
    aqua: { card: ['Луна', 'Магия и сила под потолок! А вот интеллект...'], rise: ['Община Аксис', 'Слава Акве, богине воды!'], cage: ['Аква', 'Очищение! Очищение! Ещё немного!'], gators: ['Аква', 'Они грызут прутья! Казума-а-а!'], drag: ['Аква', 'Не хочу наружу. Мир за клеткой такой страшный.'] },
    megumin: { card: ['Луна', 'Магия и интеллект зашкаливают! Архимаг, не меньше!'], name: ['Мегумин', 'Моё имя Мегумин! Я дочь Алого народа!'], circles: ['Мегумин', 'Чернее черноты, темнее тьмы…'], blast: ['Мегумин', 'Взрыв!'], fall: ['Мегумин', 'Ноги не держат… совсем.'], carry: ['Казума', 'Девяносто очков. Ладно, сто.'] },
    darkness: { card: ['Луна', 'Сила и защита огромные. А ловкость... почти ноль.'], charge: ['Даркнесс', 'Капуста! Крестоносец не отступает!'], miss: ['Казума', 'Ты хоть раз попади!'], pelt: ['Даркнесс', 'Ещё! Сильнее! Не жалейте меня!'], wall: ['Даркнесс', 'Прячьтесь за мной! Я выдержу!'] },
    asta: { card: ['Луна', 'Взнос на сто лет вперёд? Добро пожаловать!'], treat: ['Аста', 'Всем по кружке! Счёт пишите на меня!'], cover: ['Казума', 'Аква! Свои долги плати сама!'] },
    arlan: { card: ['Луна', 'Это всё старые раны? Вам срочно к лекарю!'], scratch: ['Арлан', 'Царапина. Чем меньше здоровья, тем сильней удар.'], jealous: ['Даркнесс', 'Почему все удары ему? Я тоже хочу!'] },
    herta: { card: ['Луна', 'Подождите, это же кукла! А где вы сами?'], bored: ['Мегумин', 'Ну как? Это же сто очков из ста!'], spin: ['Герта', 'Куру-куру. Забирай свою взрывную малявку.'] },
    serval: { card: ['Луна', 'Механик и рок-звезда? Запишу как барда.'], gig: ['Сервал', 'Хватит работать! Пора писать песни!'], finale: ['Мегумин', 'А на финал будет взрыв!'] },
    natasha: { card: ['Луна', 'Врач? У нас лечат молитвами, а не уколами.'], rival: ['Аква', 'Зачем уколы? Богиня вылечит молитвой!'], shot: ['Казума', 'А-а-а! Ой… а ведь правда не болит.'] },
    sampo: { card: ['Луна', 'Стоп. Вы продали мне мой же бланк?!'], deal: ['Сампо', 'Святая вода, свежая! Сама богиня берёт!'], swap: ['Казума', 'Кража! Пустой… А где мой кошелёк?'] },
    hook: { card: ['Луна', 'Класс «Великий Мрак»? Такого нет, но звучит!'], titles: ['Хук', 'Хук Великий Мрак, босс «Кротов»! Трепещите!'], recruit: ['Казума', 'Стоп. Почему я теперь крот?!'] },
    pela: { card: ['Луна', 'Досье на нашу гильдию? Это же секретно!'], report: ['Пела', 'Начнём рапорт. Недостатков в отряде: четыре.'], weak: ['Пела', 'Цель заморожена, защита снижена. Даркнесс, сейчас!'] },
    himeko: { card: ['Луна', 'Сотни миров за плечами? Вы точно не новичок.'], blast: ['Химико', 'Бой, по сути, серия точных расчётов.'], coffee: ['Химико', 'Устали? Чашечку кофе? Только без молока.'], purify: ['Аква', 'Очищение! Пейте, теперь это просто вода.'] },
    welt: { card: ['Луна', 'Аниматор, властитель, путешественник… Что писать?'], gravity: ['Вельт', 'Спокойствие. Сейчас всё стянет в одну точку.'], back: ['Мегумин', 'Вы тоже без сил после одного заклинания?'], heal: ['Аква', 'Держитесь, дедушка! Сейчас вылечу!'] },
    bronya: { card: ['Луна', 'Наследница хранительницы? Мне надо присесть.'], speech: ['Броня', 'Граждане Акселя! Впереди светлое будущее!'], lalatina: ['Даркнесс', 'Не называйте меня Лалатиной!'], order: ['Броня', 'Отряд, действуйте немедленно!'] },
    gepard: { card: ['Луна', 'Ещё один крестоносец? Надеюсь, этот попадает.'], shield: ['Гепард', 'Усилить оборону! Ни один кочан не пройдёт!'], garden: ['Гепард', 'Я выращиваю цветы, но… получается не очень.'], bloom: ['Аква', 'Красота природы! Вот как надо, командир!'] },
    clara: { card: ['Луна', 'А этот… господин за вами тоже записывается?'], brave: ['Клара', 'Я с-с-совсем тебя не боюсь!'], steal: ['Сварог', 'Цель: вор. Применяю протокол защиты.'], family: ['Клара', 'Он тоже семья! Правда же, господин Сварог?'] },
    yanqing: { card: ['Луна', 'Двенадцать мечей при себе? Не многовато?'], swords: ['Яньцин', 'Клинок в полёте! Сколько приёмов отразите?'], name: ['Мегумин', 'Этот меч зовут Чунчунмару! Твой тоже назову?'], spar: ['Даркнесс', 'Ещё! Не жалей меня, юный мечник!'] },
    bailu: { card: ['Луна', 'Детям записываться нельзя… Сколько вам лет?'], heal: ['Байлу', 'Кажется, кому-то нужен доктор! Всем лечиться!'], candy: ['Аква', 'Какая милая! Хочешь конфетку, малышка?'], board: ['Байлу', 'Наконец-то я выше всех! Беру это задание!'] },
    stelle: { card: ['Луна', 'Это вы рылись в урне за нашей гильдией?!'], trash: ['Стелла', 'Мусорка Акселя! Святое место для искателя!'], bat: ['Стелла', 'Хоумран! Жаба улетела на орбиту!'], collar: ['Казума', 'Вылезайте обе! Мы отряд, а не помойка!'] },
    caelus: { card: ['Луна', 'Внутри вас стелларон? Это… не заразно?'], smash: ['Келус', 'Бита. Самый понятный язык во Вселенной.'], splash: ['Аква', 'В тебе что-то нечистое! Очищение!'], sane: ['Казума', 'Наконец-то в отряде нормальный человек!'] },
    lynx: { card: ['Луна', 'Выживание на морозе? Зимой таких очень не хватает!'], stable: ['Рысь', 'Сено, крыша, лошадь греет. Отличный лагерь.'], bar: ['Рысь', 'Шоколадный батончик. Через минуту встанешь.'] },
    luka: { card: ['Луна', 'Боец без оружия? А, рука и есть оружие!'], cabbage: ['Лука', 'Овощи сами летят в кулак? Лучший день!'], arm: ['Даркнесс', 'Сильнее! Не жалей мою руку! Ну пожалуйста!'] },
    sushang: { card: ['Луна', 'Меч больше вас? Вы его точно поднимете?'], toad: ['Сушан', 'Доброе дело на сегодня: вытащить богиню из жабы!'], tale: ['Сушан', 'Генерала Короля демонов, один?! Расскажите ещё!'] },
    qingque: { card: ['Луна', 'Прорицательница? Предскажите, когда будут заказы.'], table: ['Аква', 'Почему я опять проиграла?! Нечестно!'], luck: ['Цинцюэ', 'Победа с первой раздачи?! Так не бывает!'] },
    tingyun: { card: ['Луна', 'Посредник? Гильдии как раз нужен переговорщик.'], debt: ['Аква', 'А ещё я вчера затопила подвал гильдии!'], boost: ['Мегумин', 'С таким попутным ветром мой Взрыв вдвое мощнее!'] },
    yukong: { card: ['Луна', 'Глава флота? У нас в Акселе и лодок-то нет.'], cart: ['Даркнесс', 'Быстрее! Меня волочёт по камням, это прекрасно!'], kite: ['Аква', 'Помогите! Богиню уносит ветром!'] },
    hanya: { card: ['Луна', 'Судья? Тогда узнайте, кто сломал доску заданий.'], trial: ['Казума', 'Это была Кража! Навык такой! Я не виноват!'], burden: ['Даркнесс', 'Бремя? Тяжкое? Повесьте на меня ещё одно!'] },
    xueyi: { card: ['Луна', 'Кукла? А куклам тоже выдают карту?'], hunt: ['Казума', 'Я же был в Скрытности! Как ты меня нашла?!'], gears: ['Аква', 'Хил! Хил! Почему кукла не лечится?!'] },
    guinaifen: { card: ['Луна', 'Артистка? Выступайте, только в гильдии не жечь!'], stream: ['Гуйнайфэнь', 'Эй, это мой стрим! И суперчаты тоже мои!'], knives: ['Даркнесс', 'Ни одного попадания? Бросайте ближе! Ещё ближе!'] },
    march: { card: ['Луна', 'Графа «Прошлое» пустая? Впишу «загадочная».'], photo: ['Март 7', 'Аква, ты весь кадр закрыла! Переснимаем!'], shogun: ['Казума', 'Он сам изо льда! Кланяйся, Март, ниже!'] },
    danheng: { card: ['Луна', 'Только имя и «копьё»? Анкету надо заполнять!'], archive: ['Дань Хэн', 'Архив отряда. Почему ящик долгов самый толстый?'], tide: ['Аква', 'Это я тут богиня воды! Смотри, как надо!'] }
  };
  const QUOTES = {
    kazuma: 'Сато Казума, авантюрист. У тебя отряд нормальный?',
    aqua: 'Я Аква, богиня воды! Поклоняйся мне как следует!',
    megumin: 'Я Мегумин! Лучший архимаг и мастер магии взрыва!',
    darkness: 'Даркнесс, крестоносец. Все удары врагов мои!',
    asta: 'Я Аста! Если беду решают кредиты, она уже решена.',
    arlan: 'Арлан, охрана станции. Царапина, само заживёт.',
    herta: 'Это Герта. На задания ходит кукла, мне некогда.',
    serval: 'Сервал Ландау. Мастерская закрыта, у меня концерт!',
    natasha: 'Наташа, врач Подземья. Не геройствуй, мне потом шить.',
    sampo: 'Сампо Коски, честный делец! Скидка только сегодня.',
    hook: 'Хук Великий Мрак! Ваша гильдия теперь наша нора!',
    pela: 'Пела, разведка Среброгривых. Ваши слабости записаны.',
    himeko: 'Химико, навигатор экспресса. Кофе будешь? Это не вопрос.',
    welt: 'Вельт Янг. Исекай, богиня, отряд… Я этот сюжет знаю.',
    bronya: 'Броня Рэнд. Командовать вашим отрядом? Это вызов.',
    gepard: 'Гепард Ландау. Встаньте за щит. Да, леди, вы тоже.',
    clara: 'Клара и господин Сварог. Теперь вы тоже наша семья!',
    yanqing: 'Яньцин, Облачные Рыцари. Сильные противники? Обожаю!',
    bailu: 'Байлу, целительница. Мне сотни лет, и я ещё вырасту!',
    stelle: 'Стелла, Первопроходец. Урны проверены, можно в путь!',
    caelus: 'Келус, Первопроходец. Нормальный отряд? Звучит скучно.',
    lynx: 'Рысь, экспедиция. Отряд? Только в рабочие часы.',
    luka: 'Лука, «Дикий Огонь». Монстры, в очередь по одному!',
    sushang: 'Сушан, Облачные Рыцари! Кому сегодня помочь?',
    qingque: 'Цинцюэ, прорицательница. Задания? Давай лучше партию.',
    tingyun: 'Тинъюнь, Комиссия по полётам. Обсудим условия сделки?',
    yukong: 'Юйкун, Комиссия по полётам. Пристегнитесь, взлетаем!',
    hanya: 'Ханья, Комиссия десяти владык. Ваши дела я записала.',
    xueyi: 'Сюэи, Комиссия десяти владык. Мара от меня не уйдёт.',
    guinaifen: 'Гуйнайфэнь, уличный цирк. Смотрите и изумляйтесь!',
    march: 'Март 7, Звёздный экспресс! Сначала фото, потом задания!',
    danheng: 'Дань Хэн, Звёздный экспресс. Копьё при мне. Идём.'
  };
  const RIM = { kazuma: '#9affb0', aqua: '#8ad0ff', megumin: '#ff5a4a', darkness: '#ffd870', asta: '#ffb070', arlan: '#b48cff', herta: '#a8d8ff', serval: '#8ac8ff', natasha: '#8affb8', sampo: '#6ae0c8', hook: '#ffb040', pela: '#8ad0ff', himeko: '#ff8a5a', welt: '#e8c040', bronya: '#6ae0a8', gepard: '#a8e0ff', clara: '#ff8ac0', yanqing: '#a8e0ff', bailu: '#b48cff', stelle: '#ffb070', caelus: '#b48cff' , lynx: '#b4a8ff', luka: '#ff6a5a', sushang: '#ffd070', qingque: '#7ac858', tingyun: '#8ae0d0', yukong: '#ffe070', hanya: '#f0e4c8', xueyi: '#b8a8ff', guinaifen: '#ff9a5a' , march: '#ffb0d8', danheng: '#8ae8c8' };
  const CASTLE = [6, 0, -26];
  const shotStart = name => { let s = 0; for (const [n, d] of SHOTS) { if (n === name) return s; s += d; } return s; };
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  function pick(list, t) {
    let s = 0;
    for (const [n, d] of list) { if (t < s + d) return [n, t - s]; s += d; }
    const last = list[list.length - 1];
    return [last[0], t - s + last[1]];
  }

  function score(res) {
    const best = Math.max(...res.map(r => r.rar)), seed = res.reduce((a, r) => a + [...String(r.id)].reduce((b, ch) => b + ch.charCodeAt(0), 0), 0);
    return best === 5 ? 100 : best === 4 ? 70 + seed % 25 : 40 + seed % 30;
  }

  const meshCache = new Map();
  function cached(key, fn) { let m = meshCache.get(key); if (!m) { m = fn(); meshCache.set(key, m); } return m; }

  function height(x, z) {
    const far = Math.exp(-((x - CASTLE[0]) * (x - CASTLE[0]) / 70 + (z - CASTLE[2]) * (z - CASTLE[2]) / 46)) * 4.4;
    return 0.45 * Math.sin(x * 0.18 + 1) + 0.4 * Math.cos(z * 0.16 + x * 0.05) + far - 0.5;
  }
  const castleY = () => height(CASTLE[0], CASTLE[2]);
  const boomAt = () => [CASTLE[0], castleY() + 1.6, CASTLE[2]];

  function terrainMesh() {
    return cached('terrain', () => {
      const m = R3.mesh(), x0 = -36, x1 = 36, z0 = -46, z1 = 12, nx = 24, nz = 22;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const ax = x0 + (x1 - x0) * i / nx, bx = x0 + (x1 - x0) * (i + 1) / nx, az = z1 - (z1 - z0) * j / nz, bz = z1 - (z1 - z0) * (j + 1) / nz;
        R3.quad(m, [ax, height(ax, az), az, bx, height(bx, az), az, bx, height(bx, bz), bz, ax, height(ax, bz), bz], hx(i, j, 5) > 0.5 ? '#4e6c2c' : '#40602a');
      }
      return m;
    });
  }

  function castleMesh() {
    return cached('castle', () => {
      const m = R3.mesh(), st = '#3c3238', dk = '#2a2228', rf = '#4a2630';
      R3.box(m, 0, 1.4, 0, 3.4, 2.8, 2.6, st, { cols: [st, dk, dk, st, '#4a4046', dk] });
      R3.box(m, 0, 3.3, 0, 1.6, 1.6, 1.4, st);
      R3.cyl(m, 0, 4.1, 0, 0.9, 0, 1.2, 8, rf);
      for (const [x, z] of [[-2.2, 1.3], [2.2, 1.3], [-2.2, -1.3], [2.2, -1.3]]) { R3.cyl(m, x, 0, z, 0.55, 0.55, 3.6, 8, dk); R3.cyl(m, x, 3.6, z, 0.78, 0, 1.4, 8, rf); }
      R3.box(m, 0, 0.6, 2.3, 4.4, 1.2, 0.3, st);
      R3.quad(m, [-0.4, 0, 1.31, 0.4, 0, 1.31, 0.4, 1.2, 1.31, -0.4, 1.2, 1.31], '#120e14');
      for (const x of [-0.9, 0.9]) R3.quad(m, [x - 0.16, 1.8, 1.31, x + 0.16, 1.8, 1.31, x + 0.16, 2.3, 1.31, x - 0.16, 2.3, 1.31], '#a46aff', { emit: 0.7 });
      return m;
    });
  }

  function townMesh() {
    return cached('town', () => {
      const m = R3.mesh();
      R3.box(m, 0, 0.7, 0, 16, 1.4, 0.5, '#4a4038');
      for (let i = 0; i < 8; i++) {
        const x = -7 + i * 2, h = 1 + hx(i, 2, 7) * 1.2, roof = R3.mesh(), tri = [[-0.8, 0], [0.8, 0], [0, 0.7]];
        R3.box(m, x, h / 2 + 0.3, -1.2, 1.4, h, 1.2, '#5a4a3e');
        R3.loft(roof, tri, -0.65, tri, 0.65, '#7a3a2a');
        R3.merge(m, roof, M.t(x, h + 0.3, -1.2));
        R3.quad(m, [x - 0.2, 0.6, -0.59, x + 0.2, 0.6, -0.59, x + 0.2, 1.0, -0.59, x - 0.2, 1.0, -0.59], '#ffc060', { emit: 1 });
      }
      R3.cyl(m, 5, 0, -2, 0.5, 0.5, 4, 8, '#5a4a3e');
      R3.cyl(m, 5, 4, -2, 0.8, 0, 1.4, 8, '#7a3a2a');
      return m;
    });
  }

  function rockMesh() { return cached('rock', () => { const m = R3.mesh(); R3.ell(m, 0, 0.25, 0, 0.7, 0.42, 0.55, 8, 5, '#6a6060'); return m; }); }

  const vars = new WeakMap();
  function vlook(look, v) {
    if (!v) return look;
    let m = vars.get(look);
    if (!m) vars.set(look, m = new Map());
    const key = JSON.stringify(v);
    let out = m.get(key);
    if (!out) { out = Object.assign({}, look, v); m.set(key, out); }
    return out;
  }

  function figure(g, look, x, y, k, o = {}) {
    const cv = G.figureCanvas(vlook(look, o.v), k), s = o.s || 1, w = cv.width * s, h = cv.height * s, fy = G.FIG_FOOT * k * s;
    g.save();
    g.imageSmoothingEnabled = false;
    if (o.a != null) g.globalAlpha = cl(o.a);
    g.translate(Math.round(x), Math.round(y));
    if (o.rot) g.rotate(o.rot);
    if (o.flip) g.scale(-1, 1);
    g.drawImage(o.tint ? K.tinted(cv, o.tint, o.ta == null ? 1 : o.ta) : cv, Math.round(-w / 2), Math.round(-fy), Math.round(w), Math.round(h));
    g.restore();
  }

  function rimFigure(g, look, x, y, k, rim, o = {}) {
    figure(g, look, x - 2, y, k, Object.assign({}, o, { tint: rim, ta: 1 }));
    figure(g, look, x, y, k, o);
  }

  function bust(g, look, x, y, size, s, o = {}) {
    const cv = G.bustCanvas(vlook(look, o.v), size);
    g.save();
    g.imageSmoothingEnabled = false;
    if (o.a != null) g.globalAlpha = cl(o.a);
    g.translate(Math.round(x), Math.round(y));
    if (o.flip) g.scale(-1, 1);
    g.scale(s, s);
    g.drawImage(cv, -size / 2, -size);
    g.restore();
  }

  function star4(g, x, y, r, col, a, thin) {
    if (r <= 0 || a <= 0) return;
    const w = r * (thin || 0.16);
    poly(g, rgba(col, a), [x, y - r, x + w, y - w, x + r, y, x + w, y + w, x, y + r, x - w, y + w, x - r, y, x - w, y - w]);
  }

  function hand(g, x, y, s, a) {
    lighter(g, () => glow(g, x, y, 20 * s, '#9affb0', 0.7 * a));
    ell(g, rgba('#f6dcc6', a), x, y, 6 * s, 5 * s);
    for (let i = 0; i < 4; i++) rect(g, rgba('#f6dcc6', a), Math.round(x + 4 * s), Math.round(y - 5 * s + i * 2.6 * s), Math.round(6 * s), Math.max(1, Math.round(1.8 * s)));
    rect(g, rgba('#f6dcc6', a), Math.round(x - 2 * s), Math.round(y - 8 * s), Math.round(2 * s), Math.round(5 * s));
    lighter(g, () => ring(g, rgba('#c8ffd8', 0.8 * a), 1, x, y, 11 * s));
  }

  function cabbage(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    ell(g, '#3a7a2a', 0, 0, 7 * s, 6 * s); ell(g, '#6ab84a', -s, -s, 5.6 * s, 4.6 * s); ell(g, '#a8e07a', -2 * s, -2 * s, 2.6 * s, 2 * s);
    rect(g, '#ffffff', Math.round(2 * s), Math.round(-2 * s), Math.max(1, Math.round(s)), Math.max(1, Math.round(s))); rect(g, '#141414', Math.round(2.5 * s), Math.round(-1.6 * s), 1, 1);
    g.restore();
  }

  function heart(g, x, y, s, a) {
    ell(g, rgba('#ff7ab8', a), x - s * 0.5, y, s * 0.6, s * 0.6);
    ell(g, rgba('#ff7ab8', a), x + s * 0.5, y, s * 0.6, s * 0.6);
    poly(g, rgba('#ff7ab8', a), [x - s * 1.05, y + s * 0.2, x + s * 1.05, y + s * 0.2, x, y + s * 1.3]);
  }

  function rune2d(g, x, y, rx, ry, rot, col, a) {
    if (a <= 0 || rx <= 0) return;
    lighter(g, () => {
      g.strokeStyle = rgba(col, a); g.lineWidth = 1;
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.ellipse(x, y, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 12; i++) { const q = rot + i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(q) * rx * 0.78, y + Math.sin(q) * ry * 0.78); g.lineTo(x + Math.cos(q) * rx, y + Math.sin(q) * ry); g.stroke(); }
      for (let i = 0; i < 6; i++) { const q0 = -rot * 1.4 + i / 6 * Math.PI * 2, q1 = q0 + Math.PI * 2 / 3; g.beginPath(); g.moveTo(x + Math.cos(q0) * rx * 0.74, y + Math.sin(q0) * ry * 0.74); g.lineTo(x + Math.cos(q1) * rx * 0.74, y + Math.sin(q1) * ry * 0.74); g.stroke(); }
      glow(g, x, y, rx * 0.5, col, 0.25 * a);
    });
  }

  function blast2d(g, T, x, y, k, col) {
    const r = 16 + 150 * eOut(k);
    lighter(g, () => { glow(g, x, y, r * 1.4, '#ff6a20', 0.9 * (1 - k * 0.6)); glow(g, x, y, r * 0.8, col, 0.6 * (1 - k * 0.5)); glow(g, x, y, r * 0.5, '#fff4d0', 1 - k); ring(g, rgba('#ffd8a0', 1 - k), 3, x, y, r); });
    for (let i = 0; i < 7; i++) ell(g, rgba(i % 2 ? '#5a3a2a' : '#8a5a3a', 0.55 * (1 - k * 0.8)), x + (hx(i, 3, 41) - 0.5) * r * 1.2, y - r * 0.3 - k * 60 * hx(i, 4, 41), r * 0.4 * (0.6 + hx(i, 5, 41)), r * 0.3);
    K.sparks(g, T, x, y, 24, 13, '#ffb050', 140);
  }

  function dusk(g, dark) {
    vgrad(g, 0, LH, dark ? [[0, '#14081c'], [0.55, '#4a1c24'], [1, '#2a1410']] : [[0, '#2a1438'], [0.5, '#a8443a'], [0.75, '#f0a050'], [1, '#3a2a1a']]);
  }

  function hillBack(g, T, glowCol) {
    dusk(g);
    ell(g, '#ffd890', 250, 128, 16, 16);
    lighter(g, () => glow(g, 250, 128, 50, '#ffb060', 0.4));
    poly(g, '#4a2a2a', [0, 140, 60, 122, 120, 130, 170, 104, 230, 118, 290, 108, LW, 118, LW, 170, 0, 170]);
    poly(g, '#2a1a1a', [154, 106, 160, 92, 166, 92, 166, 80, 172, 80, 172, 92, 178, 92, 184, 106]);
    rect(g, '#2a1a1a', 166, 70, 6, 12); poly(g, '#2a1a1a', [164, 70, 169, 62, 174, 70]);
    poly(g, '#3a3a22', [0, 168, LW, 160, LW, LH, 0, LH]);
    for (let i = 0; i < 70; i++) { const gx = (g._wide ? -54 : 0) + hx(i, 2, 71) * (g._wide ? 428 : LW), gy = 168 + hx(i, 3, 71) * 70, sw = Math.sin(T * 2 + i) * 1.5; line(g, '#5a6a3a', 1, gx, gy, gx + 1 + sw, gy - 5); }
    if (glowCol) lighter(g, () => glow(g, 160, 150, 90, glowCol, 0.25));
  }

  function guildBack(g, T) {
    vgrad(g, 0, LH, [[0, '#2a1a10'], [0.6, '#3a2416'], [1, '#1a100a']]);
    for (let x = (g._wide ? -66 : 0); x < (g._wide ? LW + 66 : LW); x += 22) { rect(g, '#22160c', x, 0, 2, 170); rect(g, rgba('#ffd8a0', 0.05), x + 2, 0, 1, 170); }
    rect(g, '#1c1008', 0, 20, LW, 6);
    for (const lx of [50, 270]) { line(g, '#1a1008', 1, lx, 26, lx, 40); ell(g, '#e8b040', lx, 46, 6, 7); lighter(g, () => glow(g, lx, 46, 30 + 3 * Math.sin(T * 7 + lx), '#ffb040', 0.45)); }
    poly(g, '#3a2414', [0, 172, LW, 172, LW, LH, 0, LH]);
  }

  function smokeBack(g, T, col) {
    vgrad(g, 0, LH, [[0, '#120a12'], [0.6, '#2a1614'], [1, '#100808']]);
    for (let i = 0; i < 12; i++) { const ph = (T * 0.15 + hx(i, 1, 61)) % 1, r = 30 + ph * 60; ell(g, rgba(i % 2 ? '#3a2a2a' : '#4a3430', 0.5 * (1 - ph)), 40 + hx(i, 2, 61) * 240, 200 - ph * 120, r, r * 0.7); }
    K.embers(g, T, 30, 21, 0, LW, LH, col || '#ff8a3a');
  }

  function coin(g, x, y, r, spin, a) {
    const w = Math.max(0.6, r * Math.abs(Math.cos(spin)));
    ell(g, rgba('#c88a18', a), x, y, w, r);
    ell(g, rgba('#f2c040', a), x - w * 0.15, y, w * 0.7, r * 0.8);
    rect(g, rgba('#fff4b0', a), Math.round(x - 1), Math.round(y - r * 0.5), 1, 1);
  }

  function bolt(g, x0, y0, x1, y1, col, a, seed) {
    if (a <= 0) return;
    g.strokeStyle = rgba(col, a); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0);
    for (let i = 1; i < 7; i++) { const k = i / 7; g.lineTo(lerp(x0, x1, k) + (hx(seed, i, 3) - 0.5) * 14, lerp(y0, y1, k) + (hx(seed, i, 4) - 0.5) * 8); }
    g.lineTo(x1, y1); g.stroke();
  }

  function peppy(g, x, y, s, T) {
    const b = Math.abs(Math.sin(T * 4)) * s;
    g.save(); g.translate(Math.round(x), Math.round(y - b)); g.scale(s, s);
    ell(g, rgba('#000000', 0.2), 0, b / s, 14, 3);
    ell(g, '#f4f4f8', 0, -9, 13, 9); ell(g, '#ffffff', -2, -11, 9, 6);
    for (const lx of [-8, -3, 4, 9]) rect(g, '#e8e8f0', lx - 1.5, -4, 3, 5);
    g.save(); g.translate(12, -14); g.rotate(Math.sin(T * 12) * 0.4); ell(g, '#ffffff', 2, -4, 4, 6); g.restore();
    ell(g, '#f4f4f8', -12, -18, 8, 7); poly(g, '#e8e8f0', [-18, -22, -16, -30, -12, -24]); poly(g, '#e8e8f0', [-10, -24, -6, -31, -5, -23]);
    rect(g, '#141418', -16, -20, 2, 2); rect(g, '#141418', -11, -20, 2, 2); ell(g, '#2a2a30', -18, -16, 2, 1.4); rect(g, '#ff8aa0', -17, -13, 2, 2);
    g.restore();
  }

  function bubble(g, x, y, text, a, italic) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = cl(a);
    g.font = (italic ? 'italic ' : '') + '9px Georgia, serif';
    const w = Math.ceil(g.measureText(text).width) + 12;
    rect(g, '#f8f4ec', Math.round(x - w / 2), y, w, 18); poly(g, '#f8f4ec', [x - 4, y + 18, x + 6, y + 18, x + 2, y + 26]);
    g.fillStyle = '#3a2410'; g.textAlign = 'center'; g.fillText(text, x, y + 12); g.textAlign = 'left';
    g.restore();
  }

  function note(g, x, y, s, col, a) {
    if (a <= 0) return;
    ell(g, rgba(col, a), x, y, 3 * s, 2.2 * s, -0.4);
    rect(g, rgba(col, a), Math.round(x + 2 * s), Math.round(y - 9 * s), Math.max(1, Math.round(s)), Math.round(9 * s));
    poly(g, rgba(col, a), [x + 2 * s, y - 9 * s, x + 6 * s, y - 6 * s, x + 6 * s, y - 4 * s, x + 3 * s, y - 6 * s]);
  }

  function guitar(g, x, y, ang, s) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang); g.scale(s, s);
    rect(g, '#2a2228', -1.5, -34, 3, 30); rect(g, '#d8dce4', -0.5, -34, 1, 30);
    poly(g, '#1a1418', [-3, -40, 3, -40, 4, -34, -4, -34]);
    ell(g, '#2a6ad8', -1, 2, 9, 8); ell(g, '#2a6ad8', 1, -7, 7, 6); ell(g, '#8ac8ff', -2, 0, 5, 4);
    rect(g, '#e8e8f0', -4, -3, 8, 2); rect(g, '#141418', -3, 3, 6, 2);
    g.restore();
  }

  function syringe(g, x, y, ang, s, push) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang); g.scale(s, s);
    rect(g, '#c8ccd0', -1, -26, 2, 4); rect(g, '#e8ecf0', -4, -22, 8, 3);
    const p = push || 0;
    rect(g, '#e8f0f4', -3, -19 + p * 10, 6, 18 - p * 10); rect(g, '#5ad890', -3, -12 + p * 10, 6, 11 - p * 10);
    rect(g, '#8a9098', -3, -20, 1, 19); rect(g, '#c8ccd0', -4, -1, 8, 2);
    line(g, '#d8dce4', 1, 0, 1, 0, 9);
    g.restore();
  }

  function teddy(g, x, y, s) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    ell(g, '#8a5a3a', 0, -8, 9, 9); ell(g, '#8a5a3a', 0, -22, 7, 6); ell(g, '#8a5a3a', -6, -27, 3, 3); ell(g, '#8a5a3a', 6, -27, 3, 3);
    ell(g, '#c89a72', 0, -6, 5, 5); ell(g, '#c89a72', 0, -20, 3, 2);
    rect(g, '#141414', -3, -24, 1, 1); rect(g, '#141414', 2, -24, 1, 1);
    for (const [sx, sy] of [[-4, -12], [3, -4]]) { line(g, '#e8e0d0', 1, sx - 2, sy - 2, sx + 2, sy + 2); line(g, '#e8e0d0', 1, sx - 2, sy + 2, sx + 2, sy - 2); }
    g.restore();
  }

  function moleHat(g, x, y, s, on) {
    if (!on) return;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    ell(g, '#8a5a2a', -12, -12, 6, 6); ell(g, '#8a5a2a', 12, -12, 6, 6); ell(g, '#d8a070', -12, -12, 3, 3); ell(g, '#d8a070', 12, -12, 3, 3);
    ell(g, '#a86a30', 0, -2, 18, 12); rect(g, '#6a3a1a', -18, 0, 36, 4);
    ell(g, '#3a3a44', -6, -2, 4, 4); ell(g, '#3a3a44', 6, -2, 4, 4); ell(g, '#8ad0ff', -6, -2, 2.4, 2.4); ell(g, '#8ad0ff', 6, -2, 2.4, 2.4);
    g.restore();
  }

  function drillBot(g, x, y, s, T) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    ell(g, rgba('#000000', 0.25), 0, 0, 30, 5);
    rect(g, '#5a5048', -24, -10, 48, 10); for (let i = 0; i < 6; i++) ell(g, '#2a2420', -20 + i * 8, -4, 4, 4);
    rect(g, '#c88a2a', -20, -40, 40, 30); rect(g, '#e8a83a', -20, -40, 40, 4); rect(g, '#2a2420', -14, -34, 28, 10);
    ell(g, '#ff6a3a', -7, -29, 3, 3); ell(g, '#ff6a3a', 7, -29, 3, 3);
    g.save(); g.translate(22, -24); g.rotate(-0.3);
    poly(g, '#a8acb4', [0, -9, 30, 0, 0, 9]);
    for (let i = 0; i < 4; i++) { const ph = ((T * 4 + i / 4) % 1) * 26; line(g, '#6a6e78', 1, ph, -9 + ph * 0.34, ph, 9 - ph * 0.34); }
    g.restore();
    g.restore();
  }

  function suitcase(g, x, y, s, open, T) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    ell(g, rgba('#000000', 0.25), 0, 0, 18, 3);
    rect(g, '#8a2a2a', -16, -16, 32, 16); rect(g, '#b83a3a', -16, -16, 32, 3); rect(g, '#d8b050', -3, -19, 6, 3);
    if (open > 0) {
      g.save(); g.translate(-16, -16); g.rotate(-open * 1.9); rect(g, '#7a2424', 0, -4, 32, 4); g.restore();
      rect(g, '#3a3a44', -6, -16 - 10 * open, 12, 10 * open); rect(g, '#5a5a66', -2, -26 * open - 6, 22 * open, 6);
      lighter(g, () => glow(g, 20 * open, -26 * open - 3, 6 + 2 * Math.sin(T * 20), '#ffb060', open));
    }
    g.restore();
  }

  function cup(g, x, y, s, liquid, T, steam) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    ell(g, '#d8d4cc', 0, 6, 12, 3);
    poly(g, '#f4f0e8', [-8, -8, 8, -8, 6, 5, -6, 5]);
    g.strokeStyle = '#f4f0e8'; g.lineWidth = 2; g.beginPath(); g.arc(9, -2, 4, -1.4, 1.4); g.stroke(); g.lineWidth = 1;
    ell(g, liquid, 0, -8, 8, 2);
    g.restore();
    if (steam > 0) for (let i = 0; i < 3; i++) { const ph = (T * 0.8 + i / 3) % 1; ell(g, rgba('#ffffff', 0.4 * steam * (1 - ph)), x - 3 * s + i * 3 * s + Math.sin(T * 3 + i) * 2 * s, y - 10 * s - ph * 14 * s, 1.5 * s, 2.5 * s); }
  }

  function coffeePot(g, x, y, rot) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot);
    poly(g, '#3a3a44', [-6, -8, 6, -8, 8, 6, -8, 6]); rect(g, '#5a5a66', -6, -10, 12, 3); poly(g, '#3a3a44', [7, -4, 14, -6, 14, -4, 8, 0]);
    g.strokeStyle = '#2a2a30'; g.lineWidth = 2; g.beginPath(); g.arc(-8, -1, 4, 1.6, 4.7); g.stroke(); g.lineWidth = 1;
    g.restore();
  }

  function flower(g, x, y, s, bloom, wilt) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    rect(g, '#b8683a', -9, -10, 18, 10); rect(g, '#d88a4a', -9, -10, 18, 3); rect(g, '#5a3a20', -8, -11, 16, 2);
    const bend = wilt * 1.2, h = 18 + 8 * bloom, tx = Math.sin(bend) * h, ty = -11 - Math.cos(bend) * h;
    g.strokeStyle = G.mix('#3a8a3a', '#7a7a4a', wilt); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -11); g.quadraticCurveTo(0, -11 - h * 0.6, tx, ty); g.stroke(); g.lineWidth = 1;
    ell(g, G.mix('#4a9a3a', '#8a8a5a', wilt), -3, -18, 4, 2, -0.5); ell(g, G.mix('#4a9a3a', '#8a8a5a', wilt), 3, -22, 4, 2, 0.5);
    const r = 3 + 4 * bloom, pc = G.mix('#f8a8c8', '#9a8a8a', wilt);
    for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2; ell(g, pc, tx + Math.cos(q) * r * 0.8, ty + Math.sin(q) * r * 0.8 + wilt * 2, r * 0.6, r * 0.4, q); }
    ell(g, G.mix('#f8e070', '#8a7a50', wilt), tx, ty + wilt * 2, r * 0.35, r * 0.35);
    g.restore();
  }

  function iceSword(g, x, y, ang, len) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang);
    rect(g, '#3a4a6a', -1.5, len * 0.5, 3, 7); rect(g, '#c8d8f0', -5, len * 0.5 - 2, 10, 2);
    poly(g, '#d8f0ff', [-2.5, len * 0.5 - 2, 2.5, len * 0.5 - 2, 2, -len * 0.5, 0, -len * 0.5 - 4, -2, -len * 0.5]);
    line(g, '#ffffff', 1, -0.5, len * 0.5 - 3, -0.5, -len * 0.5);
    g.restore();
  }

  function candy(g, x, y, s, rot, a) {
    if (a <= 0) return;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
    poly(g, '#f8a8c8', [-8, -3, -4, 0, -8, 3]); poly(g, '#f8a8c8', [8, -3, 4, 0, 8, 3]);
    ell(g, '#e85a8a', 0, 0, 4.5, 3.5); rect(g, '#ffffff', -2, -2, 2, 1);
    g.restore();
  }

  function gourd(g, x, y, s, rot) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot); g.scale(s, s);
    ell(g, '#c8a040', 0, 4, 6, 6); ell(g, '#c8a040', 0, -5, 4, 4); rect(g, '#8a3a2a', -2, -11, 4, 3); ell(g, '#f0d070', -2, 2, 2, 3);
    rect(g, '#c83030', -5, -1, 10, 2);
    g.restore();
  }

  function trashCan(g, x, y, s, back) {
    const w = 22 * s, h = 34 * s, top = y - h;
    if (back) { ell(g, '#2a2e34', x, top, w, 5 * s); return [x, top]; }
    ell(g, rgba('#000000', 0.25), x, y, w + 4, 4);
    rect(g, '#7a828c', x - w, top, w * 2, h); for (let i = 1; i < 4; i++) rect(g, '#5a626c', Math.round(x - w + i * w / 2), top, 1, h);
    rect(g, '#9aa2ac', x - w - 1, top, w * 2 + 2, 3 * s); rect(g, '#5a626c', x - w, y - 4 * s, w * 2, 3 * s);
    return [x, top];
  }

  function bat(g, x, y, ang, s) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang); g.scale(s, s);
    rect(g, '#2a2228', -1.5, -2, 3, 10);
    poly(g, '#c8a060', [-1.5, -2, 1.5, -2, 3.5, -34, 0, -37, -3.5, -34]);
    line(g, '#e8c890', 1, -1, -4, -2, -33);
    g.restore();
  }

  function freeze(t, hits, d) {
    let lost = 0;
    for (const h of hits) { if (t >= h + d) lost += d; else if (t > h) return h - lost; }
    return t - lost;
  }

  function shake(g, T, amp) { if (amp > 0) g.translate(Math.round(Math.sin(T * 61) * amp), Math.round(Math.cos(T * 47) * amp)); }

  function zoom(g, z, x, y) { g.translate(x, y); g.scale(z, z); g.translate(-x, -y); }

  function figAt(x, y, u, fx, fy) { return [x + (fx - 24) * u, y + (fy - G.FIG_FOOT) * u]; }

  function bustAt(look, x, y, size, s, side, flip) {
    const [bx, by] = G.bustEye(look, side), u = size * s / 64;
    return [x + (flip ? -1 : 1) * (bx - 32) * u, y - size * s + by * u, u];
  }

  function tears(g, look, x, y, size, s, T, a, flip) {
    if (a <= 0) return;
    for (const side of [-1, 1]) {
      const [ex, ey, u] = bustAt(look, x, y, size, s, side, flip), out = side * (flip ? -1 : 1);
      rect(g, rgba('#ffffff', 0.9 * a), Math.round(ex - u * 1.2), Math.round(ey + u * 2), Math.max(3, Math.round(u * 2.4)), Math.round(u * 10)); rect(g, rgba('#8ad0ff', 0.9 * a), Math.round(ex - u * 1.2), Math.round(ey + u * 2), 1, Math.round(u * 10));
      for (let i = 0; i < 6; i++) {
        const ph = (T * 2.6 + i / 6) % 1;
        ell(g, rgba('#e8f8ff', a * (1 - ph * 0.6)), ex + out * u * (1.5 + ph * 7), ey + u * 2 + ph * ph * u * 14, u * 1.1, u * 1.6);
      }
    }
  }

  function anger(g, x, y, s, a) {
    if (a <= 0) return;
    for (const [dx, dy, r] of [[-1, -1, 0], [1, -1, 1.57], [1, 1, 3.14], [-1, 1, 4.71]]) {
      g.save(); g.translate(x + dx * 3 * s, y + dy * 3 * s); g.rotate(r);
      poly(g, rgba('#e83030', a), [0, 0, 4 * s, 0, 4 * s, -1.4 * s, 1.4 * s, -1.4 * s, 1.4 * s, -4 * s, 0, -4 * s]);
      g.restore();
    }
  }

  function toad(g, x, y, s, T, o = {}) {
    const body = '#b87890', dk = '#8a5068', belly = '#ecc8b8', spot = '#9a5a74', puff = o.puff || 0, gape = o.gape || 0, b = Math.sin(T * 3) * 1.5;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(o.flip ? -s : s, s);
    ell(g, rgba('#000000', 0.25), 0, 0, 76, 9);
    ell(g, dk, 36, -18, 30, 18); ell(g, dk, 56, -4, 20, 6);
    ell(g, body, 8, -52 + b, 62 + puff * 8, 46 + puff * 10);
    ell(g, belly, -14, -30 + b, 42 + puff * 8, 26 + puff * 6);
    for (let i = 0; i < 7; i++) ell(g, spot, 4 + hx(i, 1, 5) * 54, -84 + hx(i, 2, 5) * 30 + b, 5, 3);
    ell(g, body, -42, -60 + b, 38 + puff * 4, 30 + puff * 5);
    for (const [ex, ey] of [[-58, -88], [-30, -92]]) { ell(g, body, ex, ey + b, 12, 11); ell(g, '#f4d860', ex, ey + b, 7, 7); rect(g, '#141014', ex - 5, ey - 1 + b, 10, 3); }
    if (gape > 0) {
      poly(g, '#5a2030', [-84, -54 + b, -20, -50 + b, -34, -50 + b + gape * 22, -76, -48 + b + gape * 16]);
      ell(g, '#d86a80', -52, -46 + b + gape * 12, 18 * gape, 5 * gape);
    }
    line(g, dk, 2, -84, -54 + b, -20, -50 + b);
    if (o.legs) {
      for (let i = 0; i < 2; i++) {
        const a = -2.05 + i * 0.5 + Math.sin(T * 14 + i * 2) * 0.25, lx = -82 + i * 8, ly = -62 + b, kx = lx + Math.cos(a) * 24, ky = ly + Math.sin(a) * 24, fx = kx + Math.cos(a - 0.5) * 20, fy = ky + Math.sin(a - 0.5) * 20;
        line(g, '#f6eef0', 9, lx, ly, kx, ky); line(g, '#3a52b0', 9, kx, ky, fx, fy); line(g, '#ffffff', 2, kx, ky, kx + Math.cos(a) * 3, ky + Math.sin(a) * 3); ell(g, '#24307a', fx + Math.cos(a - 0.5) * 3, fy + Math.sin(a - 0.5) * 3, 7, 5, a - 0.5);
      }
      poly(g, '#2a4ab8', [-94, -66 + b, -66, -70 + b, -62, -54 + b, -92, -50 + b]); rect(g, '#f4f4fa', -94, -52 + b, 32, 2);
      ell(g, body, -80, -52 + b, 10, 7);
    }
    if (o.slime) for (let i = 0; i < 4; i++) { const ph = (T * 1.6 + i / 4) % 1; ell(g, rgba('#e8f0c8', 0.8 * (1 - ph)), -78 + i * 10, -48 + b + ph * 40, 2, 3); }
    poly(g, dk, [-32, -26, -18, -26, -12, 0, -42, 0]); ell(g, dk, -36, 0, 13, 4);
    g.restore();
  }

  function cage(g, x, y, w, h, bend) {
    const col = '#4a4a56', hi = '#8a8a98';
    line(g, '#3a3a44', 2, x, 0, x, y - 14);
    poly(g, col, [x - w / 2, y, x, y - 16, x + w / 2, y, x + w / 2 - 6, y, x, y - 10, x - w / 2 + 6, y]);
    for (let i = 0; i <= 8; i++) {
      const bx = Math.round(x - w / 2 + 2 + i * (w - 4) / 8), bb = (bend && bend[i]) || 0, my = y + h / 2;
      line(g, col, 3, bx, y, bx + bb, my); line(g, col, 3, bx + bb, my, bx, y + h);
      line(g, hi, 1, bx - 1, y + 2, bx - 1 + bb, my);
    }
    rect(g, col, x - w / 2, y - 3, w, 6); rect(g, hi, x - w / 2, y - 3, w, 1);
    rect(g, col, x - w / 2, y + h - 3, w, 6);
  }

  function gator(g, x, y, s, bite, dir) {
    const top = '#4e6e2c', dk = '#2e4a1a';
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(dir * s, s);
    ell(g, rgba('#e8f8ff', 0.5), 4, 6, 26, 5);
    poly(g, dk, [-6, 2, 44, 4, 42, 9, -6, 10]);
    for (let i = 0; i < 6; i++) poly(g, '#f4f0e0', [4 + i * 7, 4, 7 + i * 7, -1, 10 + i * 7, 4]);
    g.save(); g.rotate(-bite * 0.5);
    poly(g, top, [-8, -6, 46, -4, 50, 2, -8, 4]);
    for (let i = 0; i < 6; i++) poly(g, '#f4f0e0', [4 + i * 7, 2, 7 + i * 7, 7, 10 + i * 7, 2]);
    for (let i = 0; i < 5; i++) rect(g, dk, -2 + i * 8, -7, 3, 2);
    ell(g, top, 2, -9, 7, 6); ell(g, '#e8d040', 3, -10, 3, 3); rect(g, '#141414', 2.5, -12, 1, 4);
    rect(g, dk, 46, -5, 2, 2);
    g.restore();
    g.restore();
  }

  function greatsword(g, x, y, ang, len) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang);
    rect(g, '#3a2a30', -2, 0, 4, 14); ell(g, '#d8b050', 0, 15, 3, 3);
    rect(g, '#d8b050', -10, -3, 20, 4);
    poly(g, '#d8dce4', [-3.5, -3, 3.5, -3, 3, -len, 0, -len - 6, -3, -len]);
    line(g, '#ffffff', 1, -1, -4, -1, -len + 2);
    g.restore();
  }

  function smear(g, x, y, r, a0, a1, a) {
    if (a <= 0) return;
    lighter(g, () => {
      for (let i = 0; i < 4; i++) { g.strokeStyle = rgba(i ? '#fff0c0' : '#ffffff', a * (1 - i * 0.22)); g.lineWidth = 5 - i; g.beginPath(); g.arc(x, y, r - i * 5, Math.min(a0, a1), Math.max(a0, a1)); g.stroke(); }
      g.lineWidth = 1;
    });
  }

  function smugCabbage(g, x, y, s, rot) {
    cabbage(g, x, y, s, rot);
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    rect(g, '#141414', Math.round(-2 * s), Math.round(2 * s), Math.max(2, Math.round(3 * s)), 1);
    g.restore();
  }

  function gear(g, x, y, r, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot);
    for (let i = 0; i < 6; i++) { g.save(); g.rotate(i / 6 * Math.PI * 2); rect(g, col, -r * 0.22, -r * 1.3, r * 0.44, r * 0.5); g.restore(); }
    ell(g, col, 0, 0, r, r); ell(g, '#3a3444', 0, 0, r * 0.4, r * 0.4);
    g.restore();
  }

  function stableBack(g, T, warm) {
    vgrad(g, 0, LH, [[0, '#120e0c'], [0.65, '#241a12'], [1, '#30241a']]);
    for (let x = (g._wide ? -66 : 0); x < (g._wide ? LW + 66 : LW); x += 22) { rect(g, '#33251a', x, 0, 20, 172); rect(g, '#1e160e', x + 20, 0, 2, 172); }
    rect(g, '#4a3420', 0, 22, LW, 8); rect(g, '#4a3420', 0, 116, LW, 6);
    rect(g, '#0a1024', 226, 40, 50, 40);
    for (let i = 0; i < 9; i++) { const ph = (T * 0.4 + i / 9) % 1; rect(g, rgba('#e8f0ff', 0.8), Math.round(230 + hx(i, 3, 71) * 42), Math.round(42 + ph * 36), 1, 1); }
    ell(g, '#e8ecf8', 264, 52, 5, 5);
    rect(g, '#4a3420', 249, 40, 4, 40); rect(g, '#4a3420', 226, 58, 50, 4); rect(g, '#5a4028', 222, 36, 58, 4); rect(g, '#5a4028', 222, 80, 58, 4);
    rect(g, '#4e3620', 18, 104, 76, 68); for (let i = 0; i < 4; i++) rect(g, '#3a2816', 18, 110 + i * 16, 76, 2); poly(g, '#3a2816', [18, 104, 94, 170, 90, 172, 18, 108]);
    ell(g, '#5a3c24', 52, 92, 11, 15); ell(g, '#4a301c', 58, 104, 8, 7); ell(g, '#1a1008', 48, 88, 1.6, 1.6); poly(g, '#3a2414', [44, 78, 48, 70, 52, 80]);
    poly(g, '#3e2e1a', [0, 172, LW, 172, LW, LH, 0, LH]);
    for (const [x, y, w] of [[60, 214, 70], [250, 206, 66], [160, 226, 90]]) { ell(g, '#a88a3a', x, y, w, 16); ell(g, '#c8a850', x, y - 4, w * 0.9, 12); for (let i = 0; i < 6; i++) line(g, '#e0c870', 1, x - w * 0.7 + i * w * 0.28, y - 6, x - w * 0.6 + i * w * 0.28 + 6, y - 12); }
    if (warm > 0) lighter(g, () => glow(g, 160, 196, 120, '#ffb060', 0.35 * warm));
  }

  function choco(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    rect(g, '#5a2e1a', -9 * s, -3 * s, 4 * s, 6 * s); rect(g, '#c83a2a', -5 * s, -3.4 * s, 13 * s, 6.8 * s); rect(g, '#e8c050', -1 * s, -3.4 * s, 3 * s, 6.8 * s); rect(g, '#f4e0a8', 3 * s, -1 * s, 4 * s, 2 * s);
    g.restore();
  }

  function plainBack(g, T, walls) {
    vgrad(g, 0, 160, [[0, '#5aa0e0'], [1, '#d8eef8']]);
    for (const [cx, cy, r] of [[50, 30, 22], [210, 20, 16], [292, 50, 14]]) { const x = (cx + T * 5) % (LW + 40) - 20; ell(g, '#ffffff', x, cy, r, r * 0.4); ell(g, '#f2f8ff', x - r * 0.4, cy - 3, r * 0.6, r * 0.3); }
    if (walls) {
      rect(g, '#b8a888', 14, 116, 132, 40); for (let x = 14; x < 146; x += 10) rect(g, '#b8a888', x, 112, 6, 4);
      rect(g, '#a89878', 62, 98, 20, 58); poly(g, '#7a3a2a', [60, 98, 72, 86, 84, 98]); arch(g, 66, 128, 12, 28, '#3a2a1a');
    }
    poly(g, '#6a9a4a', [0, 150, 80, 142, 170, 150, 260, 140, LW, 146, LW, 168, 0, 168]);
    vgrad(g, 160, LH, [[0, '#5a8a3a'], [1, '#3a6a2a']]);
    for (let i = 0; i < 50; i++) { const gx = (g._wide ? -54 : 0) + hx(i, 2, 77) * (g._wide ? 428 : LW), gy = 172 + hx(i, 3, 77) * 66; line(g, '#4a7a2a', 1, gx, gy, gx + 1 + Math.sin(T * 2 + i), gy - 4); }
  }

  function cabbageField(g, T) {
    plainBack(g, T, true);
    for (let r = 0; r < 4; r++) for (let i = (g._wide ? -2 : 0); i < (g._wide ? 12 : 10); i++) cabbage(g, 8 + i * 34 + (r % 2) * 17, 176 + r * 18, 0.8 + r * 0.15, 0);
  }

  function lakeBack(g, T, clean) {
    vgrad(g, 0, 120, [[0, '#4a8ad8'], [1, '#bfe4f8']]);
    for (const [cx, cy, r] of [[60, 34, 22], [250, 26, 18]]) { ell(g, '#f4faff', cx, cy, r, r * 0.45); ell(g, '#ffffff', cx - r * 0.3, cy - 3, r * 0.6, r * 0.35); }
    poly(g, '#3a7a4a', [0, 118, 40, 102, 90, 110, 140, 98, 200, 108, 260, 96, LW, 106, LW, 130, 0, 130]);
    poly(g, '#2a5a3a', [0, 128, 70, 120, 150, 126, 230, 118, LW, 124, LW, 132, 0, 132]);
    const top = G.mix('#5a6a3a', '#4aa0d8', clean), deep = G.mix('#2a3a1a', '#1a5a9a', clean);
    vgrad(g, 130, LH, [[0, top], [1, deep]]);
    const span = g._wide ? 428 : LW, x0 = g._wide ? -54 : 0;
    for (let i = 0; i < 16; i++) rect(g, rgba('#e8f8ff', (0.15 + 0.35 * clean) * (0.5 + 0.5 * Math.sin(T * 2 + i))), x0 + Math.round((hx(i, 2, 33) * span + T * 8) % span), 136 + Math.floor(hx(i, 3, 33) * 100), 6 + Math.floor(hx(i, 4, 33) * 10), 1);
    return top;
  }

  class ExplosionShow {
    constructor(ui, res, opts = {}) {
      this.ui = ui; this.res = res; this.game = ui.game; this.ban = opts.ban || 'guild';
      const B = H.BANNERS[this.ban];
      this.pass = (B && B.pass) || 'mana';
      this.best = Math.max(...res.map(r => r.rar));
      this.score = score(res);
      this.R = new R3.Raster(ui && ui.wide && ui.wide() ? 427 : LW, LH);
      this.phase = 'cine'; this.t = 0; this.cue = 0; this.rt = 0;
      this.queue = []; this.cur = -1; this.seen = new Set(); this.fade = 0; this.done = false; this.hop = 0; this.rc = [];
      this.cues = this.cueList();
      this.megumin = G.lookOf('megumin', this.game);
      this.kazuma = G.lookOf('kazuma', this.game);
      for (const r of res) if (r.kind === 'char') G.figureCanvas(G.lookOf(r.id, this.game), 3);
    }

    cueList() {
      const c = shotStart('chant'), b = shotStart('beam'), x = shotStart('boom'), s = shotStart('score');
      return [[0.1, 'glint'], [0.95, 'ticket'], [c + 0.1, 'tech'], [c + 0.8, 'buff'], [b + 0.05, 'whoosh'], [x, 'rumble'], [x + 0.05, 'break'], [x + 0.2, 'crit'], [s + 0.35, this.best === 5 ? 'star5' : this.best === 4 ? 'star4' : 'glint']].map(([x, id]) => [x * SLOW, id]);
    }

    item() { return this.res[this.cur]; }

    cardLen(r) { return r.rar === 5 ? 1.6 : 1.4; }

    length(r) { return this.designLen(r) * slowOf(r); }

    designLen(r) {
      if (r.kind !== 'char') return r.rar === 5 ? 2.2 : r.rar === 4 ? 1.7 : 1.3;
      const cut = this.cutsOf(r);
      return cut ? total(cut) + 0.6 : this.cardLen(r) + (r.rar === 5 ? 1.8 : 1.5);
    }

    cutsOf(r) {
      const k = this.key(r), full = r.kind === 'char' && CUTS[k];
      if (!full || r.res === 'new' || !BRIEF[k]) return full || null;
      return full.slice(full.findIndex(b => b[0] === BRIEF[k]));
    }

    key(r) {
      if (r.id !== 'trail') return r.id;
      return (r.gender || (this.game && this.game.state && this.game.state.gender)) === 'f' ? 'stelle' : 'caelus';
    }

    lookFor(r) {
      return r.id === 'trail' && r.gender ? G.trailLook(r.gender) : G.lookOf(r.id, this.game);
    }

    beatLine(r, t) {
      const cut = this.cutsOf(r), [n, lt] = pick(cut, t), beat = cut.find(b => b[0] === n), L = LINES[this.key(r)] && LINES[this.key(r)][n];
      if (!L || t >= total(cut)) return null;
      return { text: L[0] + ': «' + L[1] + '»', a: seg(lt, 0.05, 0.2) * (1 - seg(lt, beat[1] - 0.12, beat[1])) };
    }

    intro() { return this.hop + this.length(this.item()); }

    revealCues(r) { return this.designCues(r).map(([x, id]) => [x * slowOf(r), id]); }

    designCues(r) {
      if (r.kind !== 'char') return [[0.25, 'glint'], [0.4, 'break_obj'], [0.55, r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'chest']];
      const cut = this.cutsOf(r);
      if (cut) { const out = []; let at = 0; for (const [n, d] of cut) { for (const [x, id] of BEAT_SFX[this.key(r)][n] || []) out.push([at + x, id]); at += d; } return out; }
      return [[0.05, 'whoosh'], [0.5, 'ticket'], [0.9, r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'glint'], [this.cardLen(r), 'whoosh']];
    }

    tick(dt) {
      this.fade = Math.max(0, this.fade - dt * 2.4);
      if (this.phase === 'cine') {
        this.t += dt;
        while (this.cue < this.cues.length && this.cues[this.cue][0] <= this.t) this.ui.sfx(this.cues[this.cue++][1]);
        if (this.t >= CINE) this.begin(this.res.map((r, i) => i));
        return;
      }
      const before = this.rt;
      this.rt += dt;
      if (this.phase !== 'reveal') return;
      for (const [x, id] of this.rc) if (before < this.hop + x && this.rt >= this.hop + x) this.ui.sfx(id);
    }

    begin(queue) {
      const first = this.phase === 'cine';
      this.phase = 'reveal';
      this.queue = queue.filter(i => !this.seen.has(i));
      this.next(first);
      if (first) this.fade = 0.9;
    }

    next(first) {
      if (!this.queue.length) { if (this.res.length > 1) this.toRack(); else this.done = true; return; }
      this.cur = this.queue.shift();
      this.seen.add(this.cur);
      this.hop = first ? 0 : HOP;
      this.rt = 0;
      this.rc = (this.hop ? [[-this.hop + 0.02, 'whoosh']] : []).concat(this.revealCues(this.item()));
    }

    toRack() { this.phase = 'rack'; this.rt = 0; this.fade = 0.6; this.ui.sfx('confirm'); }

    skip() {
      if (this.res.length === 1) { if (this.phase === 'cine') this.begin([0]); else this.done = true; return; }
      if (this.phase === 'rack') { this.done = true; return; }
      const five = this.res.map((r, i) => i).filter(i => this.res[i].rar === 5 && !this.seen.has(i));
      if (five.length) this.begin(five); else this.toRack();
    }

    enter() {
      if (this.phase === 'cine') this.begin(this.res.map((r, i) => i));
      else if (this.phase === 'reveal') { if (this.rt < this.intro()) this.rt = this.intro(); else this.next(); }
      else if (this.rt < 0.8) this.rt = 0.8;
      else this.done = true;
    }

    shot() {
      let s = 0;
      const td = this.t / SLOW;
      for (const [n, d] of SHOTS) { if (td < s + d) return [n, td - s]; s += d; }
      const last = SHOTS[SHOTS.length - 1];
      return [last[0], last[1]];
    }

    world(R, eye, at, fov, T, o = {}) {
      R.light({ amb: [0.5, 0.42, 0.46], sun: [0.85, 0.55, 0.38], dir: [0.4, 0.55, -0.7], fog: { near: 16, far: 62, col: R3.rgb(o.dark ? '#3a1c22' : '#c8704a'), max: 0.85 } });
      R.look(eye, at, fov);
      if (o.dark) R.clear('#0c0614', '#3a1c22', '#2a1020'); else R.clear('#1e1032', '#e8904a', '#8a3a40');
      R.stars(o.dark ? 60 : 30, 9, o.dark ? 0.5 : 0.25);
      if (!o.dark) { const sp = R.project([40, 6, -70]); if (sp) R.flat(sp[0], sp[1], 26, '#ffc880', { a: 0.6 }); }
      R.draw(terrainMesh(), M.id());
      R.draw(townMesh(), M.of(M.t(-20, height(-20, -32) - 0.2, -32), M.ry(0.3), M.s(0.9)));
      R.draw(castleMesh(), M.of(M.t(CASTLE[0], castleY() - 0.1, CASTLE[2]), M.ry(-0.25)));
    }

    spot2d(R, p, hw) {
      const a = R.project(p), b = R.project([p[0], p[1] + hw, p[2]]), ox = (R.w - LW) >> 1;
      return a && b ? { x: a[0] - ox, y: a[1], h: a[1] - b[1] } : null;
    }

    person(g, look, sp, o = {}) {
      if (!sp) return 0;
      const s = sp.h / (89 * 2);
      if (o.rim) figure(g, look, sp.x - 1, sp.y, 2, { s, tint: o.rim, ta: 1, rot: o.rot, v: o.v });
      figure(g, look, sp.x, sp.y, 2, { s, tint: o.tint, ta: o.ta, rot: o.rot, v: o.v });
      return s;
    }

    staff(g, x, y, h, gem, T) {
      const [ox, oy] = G.staffOrb(this.megumin), gx = x + (ox - 24) * h / 89, gy = y + (oy - G.FIG_FOOT) * h / 89;
      if (gem > 0) { lighter(g, () => glow(g, gx, gy, h * 0.12 + 4 * Math.sin(T * 8), '#ff4a5a', 0.8 * gem)); ell(g, rgba('#ff3a4a', gem), gx, gy, Math.max(1, h * 0.022), Math.max(1, h * 0.022)); }
      return [gx, gy];
    }

    standers(R, g, T, o = {}) {
      const my = height(0, 4), ky = height(-1.5, 5.4), out = {};
      if (o.rock) R.draw(rockMesh(), M.t(-1.5, ky, 5.4));
      out.meg = this.spot2d(R, [0, my, 4], 1.55);
      out.kaz = this.spot2d(R, [-1.5, ky + 0.3, 5.4], 1.6);
      return out;
    }

    drawStanders(g, T, S, o = {}) {
      if (S.kaz && o.kazuma !== false) {
        lighter(g, () => glow(g, S.kaz.x, S.kaz.y - S.kaz.h * 0.5, S.kaz.h * 0.5, '#ff8a5a', 0.15));
        ell(g, '#3a3036', S.kaz.x + 2, S.kaz.y + 2, S.kaz.h * 0.22, S.kaz.h * 0.1);
        this.person(g, this.kazuma, S.kaz, { tint: '#1c1218', ta: 0.9, rim: '#ff9a6a' });
      }
      if (S.meg) {
        this.person(g, this.megumin, S.meg, { tint: '#1a0e14', ta: 0.92, rim: '#ff6a5a' });
        return this.staff(g, S.meg.x, S.meg.y, S.meg.h, o.gem || 0, T);
      }
      return null;
    }

    circles3d(R, k, T, a) {
      const c = boomAt();
      for (let i = 0; i < 3; i++) {
        const kk = eOut(cl((k - i * 0.22) / 0.45));
        if (kk <= 0) continue;
        const r = (5.5 - i * 1.2) * kk, y = c[1] + 7 + i * 2.2, rot = T * (i % 2 ? -0.9 : 0.9), col = i % 2 ? '#ff6a5a' : '#ffa060';
        for (let s = 0; s < 32; s++) {
          const a0 = s / 32 * Math.PI * 2 + rot, a1 = (s + 1) / 32 * Math.PI * 2 + rot;
          R.streak([c[0] + Math.cos(a0) * r, y, c[2] + Math.sin(a0) * r], [c[0] + Math.cos(a1) * r, y, c[2] + Math.sin(a1) * r], 0.18, col, col, { world: true, depth: false, a: 0.9 * a });
          if (s % 4 === 0) R.streak([c[0] + Math.cos(a0) * r * 0.78, y, c[2] + Math.sin(a0) * r * 0.78], [c[0] + Math.cos(a0) * r, y, c[2] + Math.sin(a0) * r], 0.12, col, col, { world: true, depth: false, a: 0.8 * a });
        }
        R.glow([c[0], y, c[2]], r * 0.7, col, { a: 0.25 * a, depth: false });
      }
    }

    hill(R, g, t, T) {
      const k = sm(t / 1.4), eye = [lerp(0.6, 0.2, k), lerp(1.7, 1.5, k), lerp(8.2, 7.4, k)], at = [lerp(2.6, 3.2, k), 1.6, -20];
      this.world(R, eye, at, 52, T);
      const S = this.standers(R, g, T, { rock: true });
      R.bake();
      const fly = seg(t, 0.1, 0.9), gem = seg(t, 0.95, 1.1);
      const tip = this.drawStanders(g, T, S, { gem });
      const head = tip ? [tip[0], tip[1]] : null;
      if (head) {
        const sx = lerp(LW + 30, head[0], eOut(fly)), sy = lerp(LH + 20, head[1], eOut(fly)) - Math.sin(fly * Math.PI) * 30;
        if (t < 0.95) {
          lighter(g, () => glow(g, sx, sy, 16, '#ff6a7a', 0.7));
          g.save(); g.imageSmoothingEnabled = false; g.translate(Math.round(sx), Math.round(sy)); g.rotate(T * 6 * (1 - fly)); G.itemIcon(g, this.pass, -8, -8, 16); g.restore();
        } else {
          const p = seg(t, 0.95, 1.4);
          lighter(g, () => { glow(g, head[0], head[1], 10 + 30 * (1 - p), '#ff4a5a', 0.9); ring(g, rgba('#ffd0d8', 1 - p), 1, head[0], head[1], 4 + p * 30); });
          star4(g, head[0], head[1], 4 + 4 * Math.sin(T * 12), '#ffffff', 0.9);
        }
      }
      K.vignette(g, 0.45);
    }

    chant(R, g, t, T) {
      const k = sm(t / 1.5), eye = [lerp(-0.6, -1.0, k), lerp(0.7, 0.55, k), lerp(6.6, 6.2, k)], at = [lerp(4.4, 5.4, k), lerp(7, 9.5, k), -24];
      this.world(R, eye, at, 60, T, { dark: true });
      this.circles3d(R, seg(t, 0.05, 1.3), T, 1);
      const S = this.standers(R, g, T);
      R.bake();
      K.embers(g, T, 40, 9, 0, LW, LH, '#ff6a4a');
      this.drawStanders(g, T, S, { kazuma: false, gem: 1 });
      if (S.meg) { const [fx, fy] = G.figEye(this.megumin, -1), ex = S.meg.x + (fx - 24) * S.meg.h / 89, ey = S.meg.y + (fy - G.FIG_FOOT) * S.meg.h / 89; lighter(g, () => { glow(g, ex, ey, 6 + 2 * Math.sin(T * 9), '#ff2a3a', 0.9); star4(g, ex, ey, 4, '#ffd0d0', 0.8); }); }
      K.vignette(g, 0.5);
    }

    beam(R, g, t, T) {
      const c = boomAt(), col = RCOL[this.best], hot = RHOT[this.best];
      this.world(R, [c[0] + 9, c[1] + 2.4, c[2] + 13], [c[0], c[1] + 2.2, c[2]], 46, T, { dark: true });
      this.circles3d(R, 1, T, 0.9);
      const k = seg(t, 0, 0.35), y0 = c[1] + 13, y1 = lerp(y0, c[1] - 1, eIn(k));
      R.streak([c[0], y0, c[2]], [c[0], y1, c[2]], 1.6, col, col, { world: true, depth: false, a: 0.45 });
      R.streak([c[0], y0, c[2]], [c[0], y1, c[2]], 0.5, hot, '#ffffff', { world: true, depth: false, a: 1 });
      if (k >= 1) { R.glow([c[0], c[1], c[2]], 3 + 2 * Math.sin(T * 30), hot, { a: 0.9, depth: false }); R.glow([c[0], c[1], c[2]], 6, col, { a: 0.5, depth: false }); }
      R.bake();
      K.speedLines(g, T, CX, CY, 20, hot, 0.3, 50);
      if (t > 0.4) K.flash(g, '#ffffff', 0.5 * seg(t, 0.4, 0.6));
    }

    boom(R, g, t, T) {
      const c = boomAt(), col = RCOL[this.best], hot = RHOT[this.best], k = seg(t, 0, 1.6), sh = Math.max(0, 1 - t * 1.4) * 0.35;
      const eye = [2 + Math.sin(T * 61) * sh, 3 + Math.cos(T * 47) * sh, 8.5], at = [5, c[1] + 3, -24];
      this.world(R, eye, at, 54, T, { dark: true });
      const r = lerp(0.8, 10, eOut(k));
      R.glow(c, r * 1.25, '#ff5a1a', { a: 0.85 * (1 - k * 0.5), depth: false });
      R.glow(c, r * 0.85, col, { a: 0.8 * (1 - k * 0.6), depth: false });
      R.glow(c, r * 0.45, hot, { a: 1 - k * 0.7, depth: false });
      R.glow(c, r * 0.2, '#ffffff', { a: 1 - k, depth: false });
      for (let i = 0; i < 9; i++) {
        const rise = seg(t, 0.25 + i * 0.03, 1.7), p = [c[0] + (hx(i, 1, 33) - 0.5) * r * 0.9, c[1] + rise * (6 + i * 0.7), c[2] + (hx(i, 2, 33) - 0.5) * r * 0.5];
        if (rise > 0) R.glow(p, r * (0.25 + 0.08 * hx(i, 3, 33)), i % 3 ? '#6a4030' : '#9a5a3a', { shape: 'puff', a: 0.75 * rise * (1 - k * 0.3), mode: 'alpha' });
      }
      const rings = this.best === 5 ? [0, 0.22] : [0];
      for (const d of rings) {
        const q = seg(t, 0.12 + d, 1.3 + d), rr = lerp(1, 42, eOut(q));
        if (q <= 0 || q >= 1) continue;
        for (let s = 0; s < 40; s++) {
          const a0 = s / 40 * Math.PI * 2, a1 = (s + 1) / 40 * Math.PI * 2, x0 = c[0] + Math.cos(a0) * rr, z0 = c[2] + Math.sin(a0) * rr, x1 = c[0] + Math.cos(a1) * rr, z1 = c[2] + Math.sin(a1) * rr;
          R.streak([x0, height(x0, z0) + 0.15, z0], [x1, height(x1, z1) + 0.15, z1], 0.5, hot, hot, { world: true, depth: false, a: 0.8 * (1 - q) });
        }
      }
      const hz = R.project([c[0], c[1] - 1, c[2]]);
      if (hz) R.haze(hz[1] - 50, hz[1] + 30, '#ff9a5a', 0.35 * (1 - k * 0.5));
      const top = R.project([c[0], c[1] + 9, c[2]]);
      R.bake();
      const bp0 = R.project(c), bp = bp0 ? [bp0[0] - ((R.w - LW) >> 1), bp0[1], bp0[2]] : null;
      if (bp && top) {
        const rise = seg(t, 0.3, 1.7), stem = bp[1] - (bp[1] - top[1]) * rise;
        for (let i = 0; i < 14; i++) {
          const f = i / 13, y = lerp(bp[1], stem, f), wdt = (8 + 26 * rise) * (f > 0.75 ? 1.8 : 0.6 + f * 0.4), x = bp[0] + (hx(i, 2, 57) - 0.5) * wdt * 0.6;
          ell(g, rgba(i % 2 ? '#5a3a2e' : '#7a4a34', 0.75 * rise), x, y, wdt, wdt * 0.55);
          if (f > 0.7) ell(g, rgba('#ff8a3a', 0.25 * rise * (1 - k * 0.4)), x, y + wdt * 0.2, wdt * 0.7, wdt * 0.3);
        }
      }
      if (bp && this.best === 5) lighter(g, () => { const q = seg(t, 0.3, 1.4), rr = 20 + q * 160; RAINBOW.forEach((h, i) => ring(g, rgba(h, 0.25 * (1 - q)), 2, bp[0], bp[1], rr + i * 3)); });
      const pass = seg(t, 0.55, 0.95);
      for (let i = 0; i < 80; i++) {
        const gx = (g._wide ? -54 : 0) + hx(i, 2, 55) * (g._wide ? 428 : LW), gy = 196 + hx(i, 3, 55) * 44, bend = pass > 0 && pass < 1 ? Math.sin(pass * Math.PI) * 6 : 0;
        line(g, i % 3 ? '#3a5a22' : '#4e7a2a', 1, gx, gy, gx + 1 + bend + Math.sin(T * 3 + i) * 0.8, gy - 6 - hx(i, 4, 55) * 4);
      }
      K.sparks(g, T, bp ? bp[0] : CX, bp ? bp[1] : 90, 20, 3, '#ffb050', 120);
      K.flash(g, '#ffffff', t < 0.14 ? 1 - t / 0.14 : 0);
    }

    scoreShot(R, g, t, T) {
      const k = sm(t / 1.4), c = boomAt();
      this.world(R, [lerp(-0.8, -1.2, k), 0.9, lerp(7.4, 7.0, k)], [0.6, 0.9, 0], 48, T, { dark: true });
      for (let i = 0; i < 7; i++) R.glow([c[0] + (hx(i, 1, 44) - 0.5) * 4, c[1] + 2 + i * 1.6 + T * 0.4, c[2]], 2.4 + i * 0.3, i % 2 ? '#3a2a2a' : '#4a3430', { shape: 'puff', a: 0.6, mode: 'alpha' });
      const kp = this.spot2d(R, [-0.9, height(-0.9, 3.6), 3.6], 1.6), mp = this.spot2d(R, [-0.2, height(-0.2, 3.6), 3.6], 1.5);
      R.bake();
      if (mp) {
        const s = mp.h / (89 * 2);
        const fx = kp ? kp.x + kp.h * 0.1 : mp.x;
        figure(g, this.megumin, fx, mp.y - mp.h * 0.05, 2, { s, rot: Math.PI / 2 });
        if (Math.floor(T * 3) % 2) ui3dots(g, fx + mp.h * 0.95, mp.y - mp.h * 0.3);
      }
      if (kp) {
        const s = this.person(g, this.kazuma, kp, {});
        const up = eOut(seg(t, 0.2, 0.5)), cx = kp.x + kp.h * 0.24, cy = kp.y - kp.h * 0.98 + (1 - up) * 30, sc = s * 2;
        g.save(); g.translate(Math.round(cx), Math.round(cy)); g.rotate(-0.08);
        rect(g, '#5a3a20', -1, 6, 3, 24);
        rect(g, '#2a1a10', -25, -17, 50, 26); rect(g, '#f2eadc', -24, -16, 48, 24); rect(g, this.best === 5 ? '#d8a020' : this.best === 4 ? '#8a5ad8' : '#4a78c8', -24, -16, 48, 4);
        g.font = 'bold 14px Georgia, serif'; g.fillStyle = '#3a2410'; g.textAlign = 'center'; g.fillText(String(this.score), 0, 5); g.textAlign = 'left';
        g.restore();
        if (this.best === 5 && up >= 1) { lighter(g, () => glow(g, cx, cy, 26 * sc, '#ffd870', 0.4)); for (let i = 0; i < 6; i++) star4(g, cx + Math.cos(T * 3 + i) * 32, cy + Math.sin(T * 3 + i) * 18, 3, '#fff0b0', 0.8); }
      }
      K.vignette(g, 0.5);
    }

    hopShot(g, t) {
      rect(g, '#000000', 0, 0, LW, LH);
      const k = seg(t, 0, HOP);
      lighter(g, () => {
        g.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const q = seg(k, i * 0.15, 0.7 + i * 0.15); if (q > 0 && q < 1) { g.strokeStyle = rgba('#ff6a5a', (1 - q) * 0.7); g.beginPath(); g.ellipse(CX, CY, q * 180, q * 54, 0, 0, Math.PI * 2); g.stroke(); } }
        g.lineWidth = 1;
      });
    }

    stealShot(g, r, t, T) {
      const rar = r.rar, col = RCOL[rar], hot = RHOT[rar];
      smokeBack(g, T, col);
      const reach = eOut(seg(t, 0, 0.35)), pop = seg(t, 0.35, 0.55), show = seg(t, 0.4, 0.8);
      hand(g, lerp(-30, 120, reach) - show * 60, 140 + Math.sin(T * 9) * 2, 2, 1 - show);
      if (pop > 0 && pop < 1) { lighter(g, () => glow(g, 150, 130, 70 * pop, '#ffffff', 0.9 * (1 - pop))); K.shards(g, pop, 150, 130, 20, 7, '#ffd8a0', 80, '#ffffff'); }
      if (show > 0) {
        lighter(g, () => { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + T * 0.6; line(g, rgba(hot, 0.35 * show), 2, CX + Math.cos(a) * 30, CY + Math.sin(a) * 30, CX + Math.cos(a) * 160, CY + Math.sin(a) * 160); } glow(g, CX, CY, 60, col, 0.5 * show); });
        const cv = G.coneArt(r.id, 72, 100), flip = Math.abs(Math.cos((1 - Math.min(1, show * 1.4)) * Math.PI * 1.5));
        g.save(); g.imageSmoothingEnabled = false; g.translate(CX, CY - 6); g.scale(lerp(0.4, 1.1, eOut(show)) * Math.max(0.15, flip), lerp(0.4, 1.1, eOut(show)));
        g.drawImage(cv, -cv.width / 2, -cv.height / 2);
        g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(-cv.width / 2, -cv.height / 2, cv.width, cv.height);
        g.restore();
        star4(g, CX + 30, CY - 50, 6 + 2 * Math.sin(T * 8), hot, 0.9);
      }
      K.vignette(g, 0.5);
    }

    cardShot(g, r, t, T) {
      const look = G.lookOf(r.id, this.game), d = H.CHARS[r.id], col = RCOL[r.rar];
      if (t < this.cardLen(r)) {
        guildBack(g, T);
        rect(g, '#6a4226', 0, 150, LW, 30); rect(g, '#8a5a34', 0, 150, LW, 4);
        const k = eOut(seg(t, 0, 0.45)), x = lerp(LW + 80, CX, k), y = 150;
        g.save(); g.translate(Math.round(x), y); g.rotate(-0.06 * (1 - k) - 0.02);
        rect(g, 'rgba(0,0,0,0.35)', -76, -92, 156, 98);
        rect(g, '#e8dcbc', -78, -96, 156, 98); rect(g, G.dark(col, 0.2), -78, -96, 156, 14);
        g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#fff6e0'; g.fillText('КАРТА ИСКАТЕЛЯ', -72, -86);
        rect(g, '#2a1c10', -72, -78, 44, 44); G.drawPortrait(g, look, -71, -77, 42);
        g.font = 'bold 10px Georgia, serif'; g.fillStyle = '#3a2410'; g.fillText(d.name, -22, -68);
        g.font = '8px Georgia, serif'; g.fillText('Класс: ' + H.PATHS[d.path].name, -22, -56); g.fillText('Стихия: ' + H.ELEMENTS[d.elem].name, -22, -46);
        const stat = [['Сила', 0.4 + hx(1, d.base.atk, 9) * 0.5], ['Удача', seg(t, 0.5, 1.1) * (0.3 + hx(2, d.base.hp, 9) * 0.7)]];
        stat.forEach(([n, v], i) => { g.fillText(n, -72, -20 + i * 11); rect(g, '#b8a888', -40, -26 + i * 11, 100, 6); rect(g, i ? '#2f9a4a' : '#b84a3a', -40, -26 + i * 11, Math.round(100 * Math.min(1, v)), 6); });
        const stamp = seg(t, 0.75, 0.95);
        if (stamp > 0) { g.globalAlpha = stamp; g.strokeStyle = '#c83030'; g.strokeRect(36, -88, 38, 16); g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#c83030'; g.fillText('★'.repeat(r.rar), 38, -76); g.globalAlpha = 1; }
        g.restore();
        if (stamp > 0 && stamp < 1) K.flash(g, '#ffffff', 0.3 * (1 - stamp));
        return;
      }
      const b = t - this.cardLen(r);
      hillBack(g, T, col);
      lighter(g, () => glow(g, CX, 160, 100, col, 0.3 * seg(b, 0, 0.5)));
      rimFigure(g, look, CX, 232 + Math.sin(T * 1.4), 3, col, { s: 0.76 });
      K.flash(g, '#ffffff', 0.8 * (1 - seg(b, 0, 0.25)));
    }

    cutShot(g, r, t, T) {
      const look = this.lookFor(r), [n, lt] = pick(this.cutsOf(r), t), own = n === 'pose' && this.outfitFinale(r);
      const fn = this['cut_' + this.key(r) + '_' + n] || this.cut_pose;
      g.save();
      if (own) own(g, lt, T, look, this.game);
      else fn.call(this, g, lt, T, look, r);
      g.restore();
      if (lt < 0.1 && t > 0.2) K.flash(g, '#000000', 1 - lt / 0.1);
    }

    outfitFinale(r) { const cut = r.id !== 'trail' && H.outfitCutOf ? H.outfitCutOf(H.wornOutfit(r.id, this.game), 'warp') : null; return cut && cut.finale; }

    lookOf(id) { return G.lookOf(id, this.game); }

    poseBack(g, id, T) {
      if (id === 'kazuma') {
        guildBack(g, T);
        rect(g, '#5a3a20', 206, 40, 96, 84); rect(g, '#b48a5a', 210, 44, 88, 76);
        for (let i = 0; i < 6; i++) { const nx = 214 + (i % 3) * 28, ny = 48 + Math.floor(i / 3) * 36; rect(g, i % 2 ? '#e8dcc0' : '#d8ccaa', nx, ny, 22, 30); rect(g, '#b83030', nx + 10, ny, 3, 3); for (let l = 0; l < 3; l++) rect(g, rgba('#5a4028', 0.6), nx + 3, ny + 9 + l * 6, 15, 1); }
        for (let i = 0; i < 14; i++) { const ph = (T * 0.5 + hx(i, 1, 64)) % 1, x = 30 + hx(i, 2, 64) * 260, y = ph * 260 - 20; ell(g, '#f2c040', x, y, 3 * Math.abs(Math.cos(T * 5 + i)) + 0.6, 3); rect(g, rgba('#fff4b0', 0.9), Math.round(x - 1), Math.round(y - 1), 1, 1); }
      } else if (id === 'asta') {
        K.BG.station(g, T, { kind: 'control' });
        const pts = [[44, 60], [70, 44], [100, 54], [118, 36], [146, 52], [176, 30], [210, 48]];
        lighter(g, () => pts.forEach(([x, y], i) => { glow(g, x, y, 6, '#ffe0a0', 0.8); if (i) line(g, rgba('#ffe0a0', 0.6), 1, pts[i - 1][0], pts[i - 1][1], x, y); }));
        for (let i = 0; i < 10; i++) star4(g, Math.round(30 + hx(i, 2, 63) * 260), Math.round(20 + hx(i, 3, 63) * 110), 2, '#ffecb4', 0.5 + 0.5 * Math.sin(T * (2 + hx(i, 1, 63) * 3) + i));
        g.save(); g.translate(254, 196); g.rotate(-0.5); rect(g, '#d8dce8', -6, -40, 12, 44); rect(g, '#8a92a8', -7, -44, 14, 6); rect(g, '#e8b040', -6, -20, 12, 3); g.restore();
        line(g, '#6a7088', 2, 254, 196, 240, 232); line(g, '#6a7088', 2, 254, 196, 268, 232); line(g, '#6a7088', 2, 254, 196, 256, 234);
      } else if (id === 'arlan') {
        K.BG.station(g, T, { kind: 'platform' });
        lighter(g, () => { for (let i = 0; i < 3; i++) bolt(g, 60 + i * 90, 20, 80 + i * 90, 150, '#c8b0ff', 0.25 + 0.2 * Math.sin(T * 9 + i), Math.floor(T * 6) + i); });
        peppy(g, 222, 234, 1.3, T);
      } else if (id === 'herta') {
        K.BG.station(g, T, { kind: 'hall' });
        for (let i = 0; i < 16; i++) { const ph = (T * 0.3 + hx(i, 1, 24)) % 1; star4(g, 20 + hx(i, 2, 24) * 280, ph * 250 - 10, 2.5, '#e8f8ff', 0.8 * (1 - ph)); }
        const doll = this.lookOf('herta');
        for (const [x, fl] of [[52, false], [268, true]]) { ell(g, rgba('#000000', 0.25), x, 232, 16, 3); figure(g, doll, x, 232, 2, { s: 0.5, flip: fl, a: 0.85, v: { mood: 'flat' } }); }
      } else if (id === 'serval') {
        K.BG.workshop(g, T);
        for (let i = 0; i < 8; i++) { const ph = (T * 0.4 + i / 8) % 1; note(g, 30 + hx(i, 2, 28) * 260, 220 - ph * 200, 1.3, i % 2 ? '#8ac8ff' : '#ffffff', 0.8 * (1 - ph)); }
        g.save(); g.translate(262, 70); g.rotate(Math.sin(T * 2) * 0.06); line(g, '#3a3036', 1, -10, -14, 0, -22); line(g, '#3a3036', 1, 10, -14, 0, -22); rect(g, '#5a3a20', -22, -14, 44, 18); rect(g, '#f2eadc', -20, -12, 40, 14); g.font = 'bold 8px Georgia, serif'; g.fillStyle = '#c83030'; g.textAlign = 'center'; g.fillText('ЗАКРЫТО', 0, -2); g.textAlign = 'left'; g.restore();
      } else if (id === 'natasha') {
        K.BG.under(g, T);
        rect(g, '#5a4a3a', 226, 196, 50, 6); rect(g, '#3a2e24', 230, 202, 5, 32); rect(g, '#3a2e24', 266, 202, 5, 32);
        teddy(g, 246, 196, 1.2); syringe(g, 264, 194, 1.3, 1);
        for (let i = 0; i < 8; i++) { const ph = (T * 0.4 + i / 8) % 1, x = 30 + hx(i, 2, 32) * 260, y = 230 - ph * 200; rect(g, rgba('#8affb8', 0.6 * (1 - ph)), Math.round(x - 1), Math.round(y - 3), 2, 7); rect(g, rgba('#8affb8', 0.6 * (1 - ph)), Math.round(x - 3), Math.round(y - 1), 7, 2); }
      } else if (id === 'sampo') {
        K.BG.city(g, T);
        g.save(); g.translate(262, 96); g.rotate(0.05);
        rect(g, 'rgba(0,0,0,0.3)', -27, -35, 56, 74); rect(g, '#f2eadc', -28, -38, 56, 74); rect(g, '#2a4a8a', -28, -38, 56, 10);
        g.font = 'bold 7px Georgia, serif'; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.fillText('РОЗЫСК', 0, -30);
        rect(g, '#2a1c10', -15, -24, 30, 30); G.drawPortrait(g, this.lookOf('sampo'), -14, -23, 28);
        g.fillStyle = '#3a2410'; g.fillText('САМПО КОСКИ', 0, 16); g.fillStyle = '#c83030'; g.fillText('НЕ ВЕРИТЬ!', 0, 28); g.textAlign = 'left';
        g.restore();
        for (let i = 0; i < 10; i++) { const ph = (T * 0.5 + hx(i, 1, 34)) % 1; coin(g, 30 + hx(i, 2, 34) * 260, ph * 250 - 20, 2, T * 5 + i, 0.7); }
      } else if (id === 'hook') {
        K.BG.mine(g, T);
        drillBot(g, 256, 232, 1.3, T);
        for (let i = 0; i < 10; i++) { const ph = (T * 0.4 + hx(i, 1, 37)) % 1; rect(g, rgba('#ffd890', 0.7 * (1 - ph)), Math.round(20 + hx(i, 2, 37) * 280), Math.round(230 - ph * 180), 2, 2); }
      } else if (id === 'pela') {
        K.BG.fort(g, T);
        rect(g, '#4a3a2a', 228, 200, 56, 6); rect(g, '#2e241a', 232, 206, 5, 28); rect(g, '#2e241a', 275, 206, 5, 28);
        for (let i = 0; i < 4; i++) { rect(g, ['#3a5a8a', '#8a3a3a', '#3a7a5a', '#6a4a8a'][i], 236 + i * 3, 172 + i * 7, 32, 7); rect(g, '#f2eadc', 266 + i * 3, 172 + i * 7, 2, 7); }
        for (let i = 0; i < 3; i++) { const q = i * Math.PI / 3; line(g, '#e8f4ff', 1, 250 + Math.cos(q) * 4, 168 + Math.sin(q) * 4, 250 - Math.cos(q) * 4, 168 - Math.sin(q) * 4); }
        for (let i = 0; i < 18; i++) { const ph = (T * 0.25 + hx(i, 1, 40)) % 1; rect(g, rgba('#ffffff', 0.8), Math.round(hx(i, 2, 40) * LW + Math.sin(T + i) * 6), Math.round(ph * 250 - 10), 2, 2); }
      } else if (id === 'himeko') {
        K.BG.parlor(g, T);
        suitcase(g, 246, 232, 1.6, 0, T);
        cup(g, 80, 222, 1.6, '#2a1408', T, 1);
      } else if (id === 'welt') {
        K.BG.space(g, T);
        g.save(); g.globalAlpha = 0.9; K.expressSide(g, ((T * 30) % 420) - 60, 16, 0.3, T); g.restore();
        g.save(); g.translate(250, 206); g.rotate(-0.12); rect(g, '#2a2228', -20, -14, 40, 28); rect(g, '#f4f0e4', -18, -12, 36, 24); g.strokeStyle = '#3a3036'; g.lineWidth = 1; g.beginPath(); g.arc(-6, -2, 5, 0, Math.PI * 2); g.moveTo(-6, 3); g.lineTo(-6, 9); g.moveTo(4, -6); g.lineTo(14, -6); g.moveTo(4, -2); g.lineTo(12, -2); g.stroke(); g.restore();
      } else if (id === 'bronya') {
        K.BG.snow(g, T);
        rect(g, rgba('#1a2a4a', 0.3), 0, 0, LW, LH);
        this.silverBanner(g, 40, 70, T, 1.8); this.silverBanner(g, 248, 70, T, 1.8);
        for (let i = 0; i < 18; i++) { const ph = (T * 0.25 + hx(i, 1, 46)) % 1; rect(g, rgba('#ffffff', 0.8), Math.round(hx(i, 2, 46) * LW + Math.sin(T + i) * 6), Math.round(ph * 250 - 10), 2, 2); }
      } else if (id === 'gepard') {
        K.BG.front(g, T);
        K.hexShield(g, 160, 150, 100, 0.25, T, '#a8e0ff');
        flower(g, 262, 236, 1.8, 1, 0);
      } else if (id === 'clara') {
        K.BG.rivet(g, T);
        rect(g, rgba('#0a0810', 0.3), 0, 0, LW, LH);
        const sv = this.lookOf('svarog');
        g.save(); g.globalAlpha = 0.85; figure(g, sv, 226, 236, 3, { s: 0.9, tint: '#1a1424', ta: 0.55 }); g.restore();
        lighter(g, () => glow(g, 226, 60, 30, '#ff2e8e', 0.3 + 0.1 * Math.sin(T * 3)));
      } else if (id === 'yanqing') {
        vgrad(g, 0, LH, [[0, '#f0b070'], [0.55, '#f8d8a8'], [1, '#8a5a3a']]);
        ell(g, '#fff0c8', 240, 70, 26, 26);
        for (const [x, w, h] of [[30, 60, 70], [110, 44, 100], [230, 70, 80]]) { rect(g, '#4a2a2a', x, 170 - h, w, h); for (let k = 0; k < 3; k++) poly(g, '#2a1414', [x - 8, 170 - h + k * (h / 3), x + w / 2, 160 - h - 10 + k * (h / 3), x + w + 8, 170 - h + k * (h / 3)]); }
        for (let i = 0; i < 6; i++) { const ph = (T * 0.3 + i / 6) % 1; ell(g, rgba('#ffffff', 0.5), (i * 70 + T * 10) % (LW + 60) - 30, 40 + i * 12, 30, 6); }
        poly(g, '#6a4a3a', [0, 170, LW, 170, LW, LH, 0, LH]);
        for (let i = 0; i < 6; i++) { const a = T * 1.5 + i / 6 * Math.PI * 2; iceSword(g, 160 + Math.cos(a) * 90, 140 + Math.sin(a) * 24, a + Math.PI / 2, 24); }
      } else if (id === 'bailu') {
        vgrad(g, 0, LH, [[0, '#2a5a5a'], [0.55, '#8ac8b8'], [1, '#3a4a3a']]);
        for (const [x, w, h] of [[20, 50, 80], [250, 60, 96]]) { rect(g, '#2a3a34', x, 170 - h, w, h); for (let k = 0; k < 2; k++) poly(g, '#1a2a24', [x - 8, 170 - h + k * (h / 2), x + w / 2, 160 - h - 10 + k * (h / 2), x + w + 8, 170 - h + k * (h / 2)]); }
        lighter(g, () => { g.strokeStyle = rgba('#bfe8ff', 0.5); g.lineWidth = 8; g.beginPath(); for (let k = 0; k <= 40; k++) { const q = k / 40, x = 20 + q * 280, y = 70 + Math.sin(q * 7 + T * 1.5) * 26; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.lineWidth = 2; g.strokeStyle = rgba('#ffffff', 0.5); g.stroke(); g.lineWidth = 1; });
        poly(g, '#4a5a44', [0, 170, LW, 170, LW, LH, 0, LH]);
        gourd(g, 248, 228, 2.4, 0.2);
        for (let i = 0; i < 8; i++) { const ph = (T * 0.4 + i / 8) % 1; candy(g, 30 + hx(i, 2, 54) * 260, ph * 250 - 20, 1.2, T * 2 + i, 0.8); }
      } else if (id === 'stelle') {
        K.BG.space(g, T);
        trashCan(g, 254, 236, 1.5, false);
        g.save(); g.translate(270, 196); g.rotate(0.4); bat(g, 0, 0, 0, 1.6); g.restore();
        for (let i = 0; i < 5; i++) star4(g, 40 + i * 60, 30 + (i % 2) * 20, 3 + 2 * Math.sin(T * 4 + i), '#fff0c0', 0.8);
      } else if (id === 'danheng') {
        vgrad(g, 0, 150, [[0, '#0a1420'], [0.7, '#1a3448'], [1, '#2a5060']]);
        ell(g, '#e8f4f0', 250, 46, 16, 16); lighter(g, () => glow(g, 250, 46, 50, '#bfe8e0', 0.35));
        for (let i = 0; i < 14; i++) rect(g, rgba('#e8f8ff', 0.5 + 0.5 * Math.sin(T * 2 + i)), Math.round(hx(i, 2, 116) * LW), Math.round(hx(i, 3, 116) * 110), 1, 1);
        vgrad(g, 150, LH, [[0, '#1a4a58'], [1, '#0a2028']]);
        for (let i = 0; i < 12; i++) rect(g, rgba('#bfe8e0', 0.2 + 0.2 * Math.sin(T * 2 + i)), Math.round((hx(i, 4, 116) * LW + T * 10) % LW), 156 + Math.floor(hx(i, 5, 116) * 80), 12, 1);
        lighter(g, () => { g.strokeStyle = rgba('#7ae8c8', 0.35); g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 60; i++) { const q = i / 60 * Math.PI * 3 + T * 0.8, x = CX + Math.cos(q) * (60 + i), y = 120 + Math.sin(q) * 30 - i * 0.6; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.lineWidth = 1; });
        for (let i = 0; i < 8; i++) { const ph = (T * 0.8 + i / 8) % 1; rect(g, rgba('#e8fff8', 0.6 * (1 - ph)), Math.round(ph * LW * 1.2 - 30), Math.round(40 + hx(i, 6, 116) * 140), 24, 1); }
      } else if (id === 'march') {
        vgrad(g, 0, LH, [[0, '#6a5aa8'], [0.55, '#e8a8d0'], [1, '#f8e0ec']]);
        for (let i = 0; i < 7; i++) { const x = 16 + i * 50, h = 40 + (i % 3) * 26; poly(g, rgba('#d8f0ff', 0.55), [x - 12, 186, x, 186 - h, x + 12, 186]); poly(g, rgba('#ffffff', 0.6), [x - 3, 186, x, 186 - h, x + 4, 186 - h * 0.4]); }
        poly(g, '#f2e8f4', [0, 186, LW, 186, LW, LH, 0, LH]); rect(g, '#d8c8e8', 0, 186, LW, 2);
        for (let i = 0; i < 6; i++) { const x = 30 + i * 52, y = 50 + (i % 2) * 34 + Math.sin(T * 1.4 + i) * 6; g.save(); g.translate(x, y); g.rotate(Math.sin(T + i) * 0.2); rect(g, '#ffffff', -10, -12, 20, 24); rect(g, ['#8ad8ff', '#ffb0d8', '#c8a8ff'][i % 3], -8, -10, 16, 15); g.restore(); }
        K.snowfall(g, T, 24, 61, { speed: 18, wind: 10, a: 0.7 });
      } else if (id === 'guinaifen' && H.FoursScenes) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#1a0a14'], [0.6, '#3a1418'], [1, '#2a1410']]);
        for (let i = 0; i < 5; i++) F.firework(g, 40 + i * 60, 50 + (i % 2) * 30, (T * 0.45 + i / 5) % 1, ['#ff6a3a', '#ffd040', '#ff8ad8', '#8affc0', '#8ad8ff'][i], i);
        poly(g, '#2a1410', [0, 186, LW, 186, LW, LH, 0, LH]); rect(g, '#5a2a1a', 0, 186, LW, 2);
        for (let i = 0; i < 9; i++) F.lanternR(g, 20 + i * 36, 18, 1, T, i, true);
        F.hoop(g, CX, 130, 70 + 4 * Math.sin(T * 3), T, 0.8);
        for (let i = 0; i < 14; i++) { const ph = (T * 0.6 + hx(i, 1, 111)) % 1; rect(g, rgba('#ffb070', 1 - ph), Math.round(20 + hx(i, 2, 111) * 280), Math.round(230 - ph * 200), 1, 2); }
      } else if (id === 'xueyi' && H.FoursScenes) {
        vgrad(g, 0, LH, [[0, '#08040e'], [0.7, '#1e0a26'], [1, '#0a0410']]);
        for (let i = 0; i < 5; i++) { const x = 20 + i * 70; rect(g, '#14081a', x, 0, 12, 186); rect(g, '#3a1a3a', x, 0, 2, 186); }
        poly(g, '#160a1c', [0, 186, LW, 186, LW, LH, 0, LH]); rect(g, '#3a1a4a', 0, 186, LW, 2);
        lighter(g, () => glow(g, CX, 120, 90, '#8a7aff', 0.25 + 0.08 * Math.sin(T * 2)));
        for (let i = 0; i < 4; i++) H.FoursScenes.chain(g, [0, LW, 0, LW][i], [30, 40, 200, 210][i], CX, 130, 0.9, '#d8d0f0');
        for (let i = 0; i < 10; i++) { const ph = (T * 0.4 + i / 10) % 1; rect(g, rgba('#c8b8ff', 1 - ph), Math.round(20 + hx(i, 2, 108) * 280), Math.round(220 - ph * 200), 1, 2); }
      } else if (id === 'hanya' && H.FoursScenes) {
        vgrad(g, 0, LH, [[0, '#14121c'], [0.7, '#2a2430'], [1, '#3a3040']]);
        poly(g, '#221c28', [0, 186, LW, 186, LW, LH, 0, LH]); rect(g, '#4a3e50', 0, 186, LW, 2);
        const ring = []; for (let i = 0; i <= 40; i++) { const q = -Math.PI / 2 + i / 40 * Math.PI * 1.9; ring.push(CX + Math.cos(q) * 84, 120 + Math.sin(q) * 70); }
        lighter(g, () => { H.FoursScenes.brush(g, ring, 1, rgba('#e8c880', 0.5), 4); glow(g, CX, 120, 90, '#e8c880', 0.12); });
        for (let i = 0; i < 7; i++) { const x = 20 + i * 46, h = 60 + (i % 3) * 22; g.save(); g.translate(x, 0); g.rotate(Math.sin(T * 1.2 + i) * 0.05); rect(g, '#efe6d0', -6, 0, 12, h); rect(g, '#c8b890', -6, h - 3, 12, 3); for (let k = 0; k < 3; k++) rect(g, '#c83a3a', -3, 10 + k * (h / 4), 6, 4); g.restore(); }
        for (const x of [40, 110, 210, 280]) { rect(g, '#efe6d0', x - 3, 172, 6, 14); lighter(g, () => glow(g, x, 168, 10 + Math.sin(T * 9 + x) * 2, '#ffb050', 0.8)); ell(g, '#ffd070', x, 168, 1.6, 3); }
      } else if (id === 'yukong' && H.FoursScenes) {
        vgrad(g, 0, LH, [[0, '#4a6aa8'], [0.6, '#a8c4e8'], [1, '#e8d8b0']]);
        for (let i = 0; i < 5; i++) ell(g, 'rgba(255,255,255,0.45)', ((20 + i * 70 + T * 6) % 380) - 30, 60 + (i % 2) * 20, 40, 9);
        rect(g, '#6a4a2a', 0, 184, LW, 56); rect(g, '#8a6a3a', 0, 184, LW, 3);
        for (let i = 0; i < 6; i++) rect(g, '#4a3220', 10 + i * 56, 188, 6, 30);
        poly(g, '#7a5a3a', [20, 176, 110, 176, 100, 186, 30, 186]); rect(g, '#d8b050', 60, 150, 2, 26); poly(g, '#f2ece0', [62, 150, 90, 164, 62, 170]);
        const cols = ['#d84a3a', '#e8b040', '#4a9ad8', '#d84a3a', '#e8b040'];
        for (let i = 0; i < 5; i++) { const x = 40 + i * 62, y = 50 + (i % 2) * 22 + Math.sin(T * 1.5 + i) * 6; line(g, 'rgba(255,255,255,0.6)', 1, x, y + 14, x + 20 - i * 10, 184); H.FoursScenes.kite(g, x, y, 1.3, cols[i], T, i); }
      } else if (id === 'tingyun' && H.FoursScenes) {
        const F = H.FoursScenes;
        F.xianzhou(g, T, 176, ['#e8a878', '#f8d8b0', '#c8e0d8']);
        for (let i = 0; i < 3; i++) { const x = ((i * 120 + T * 10) % 440) - 60, y = 150 - i * 12; poly(g, '#8a5a3a', [x, y, x + 50, y, x + 40, y + 8, x + 8, y + 8]); rect(g, '#d8b050', x + 22, y - 20, 2, 20); poly(g, '#f8f0e0', [x + 24, y - 20, x + 40, y - 8, x + 24, y - 4]); }
        poly(g, '#6a4a34', [0, 176, LW, 176, LW, LH, 0, LH]);
        F.fan(g, CX, 160, 92, Math.PI, Math.PI * 2, '#2a8a7a', '#d8b050');
        for (let i = 0; i < 5; i++) F.lanternR(g, 24 + i * 68, 20 + (i % 2) * 12, 1.1, T, i, true);
        if (Math.sin(T * 3) > 0.6) lighter(g, () => bolt(g, CX - 60, 70, CX + 50, 110, '#c8f0ff', 0.8, Math.floor(T * 8)));
      } else if (id === 'qingque' && H.FoursScenes) {
        H.FoursScenes.xianzhou(g, T, 176, ['#2a4a5a', '#4a7a7a', '#a8d0c0']);
        poly(g, '#3a5a4a', [0, 176, LW, 176, LW, LH, 0, LH]);
        rect(g, '#2a6a4a', 196, 196, 110, 40); rect(g, '#1e4a34', 196, 232, 110, 4);
        for (let i = 0; i < 12; i++) { const a = T * 0.6 + i / 12 * Math.PI * 2; H.FoursScenes.tile(g, CX + Math.cos(a) * 110, 130 + Math.sin(a) * 30, 1.3, i, Math.sin(a) * 0.4, 0.5 + 0.5 * Math.sin(a)); }
        for (let i = 0; i < 6; i++) H.FoursScenes.tile(g, 214 + i * 15, 214, 1.1, i + 3, 0, 1);
      } else if (id === 'sushang' && H.FoursScenes) {
        H.FoursScenes.xianzhou(g, T, 176, ['#f6c8a0', '#fbe6cc', '#d8ecd8']);
        poly(g, '#8a6a4a', [0, 176, LW, 176, LW, LH, 0, LH]);
        for (let i = 0; i < 4; i++) H.FoursScenes.lanternR(g, 40 + i * 80, 30 + (i % 2) * 14, 1.2, T, i, true);
        greatsword(g, 262, 236, 0.12, 70);
        for (let i = 0; i < 10; i++) { const ph = (T * 0.3 + i / 10) % 1; ell(g, rgba('#ffd8e8', 0.8 * (1 - ph)), 20 + hx(i, 2, 96) * 280 + Math.sin(T + i) * 10, ph * 240 - 10, 2, 1.4, T + i); }
      } else if (id === 'luka' && H.FoursScenes) {
        vgrad(g, 0, LH, [[0, '#0c0608'], [0.6, '#2a1012'], [1, '#3a1a14']]);
        for (let i = 0; i < 7; i++) rect(g, rgba('#ff8a5a', 0.08 + 0.04 * Math.sin(T * 2 + i)), 20 + i * 44, 0, 24, 150);
        lighter(g, () => { poly(g, rgba('#fff0d0', 0.12), [130, 0, 190, 0, 250, LH, 70, LH]); glow(g, CX, 230, 110, '#ff8a4a', 0.25); });
        poly(g, '#4a2a22', [0, 186, LW, 180, LW, LH, 0, LH]);
        H.FoursScenes.ropes(g, 150, '#e04a3a');
        for (let i = 0; i < 12; i++) { const ph = (T * 0.5 + hx(i, 1, 93)) % 1; rect(g, rgba('#ffb070', 1 - ph), Math.round(20 + hx(i, 2, 93) * 280), Math.round(230 - ph * 200), 1, 2); }
      } else if (id === 'lynx' && H.FoursScenes) {
        const F = H.FoursScenes;
        F.snowNight(g, T, 176);
        F.tent(g, 66, 206, 1.7, true);
        F.can(g, 262, 214, 1.5, 0.25);
        F.can(g, 280, 220, 1.3, -0.4);
        K.snowfall(g, T, 26, 41, { speed: 24, wind: 18, a: 0.75 });
      } else if (id === 'caelus') {
        K.BG.space(g, T);
        K.expressSide(g, 300, 218, 0.9, T);
        rect(g, rgba('#0a0814', 0.35), 0, 0, LW, LH);
        lighter(g, () => glow(g, 160, 150, 60, '#b48cff', 0.2 + 0.08 * Math.sin(T * 2)));
      } else if (id === 'aqua') {
        lakeBack(g, T, 1);
        lighter(g, () => { g.lineWidth = 3; RAINBOW.forEach((h, i) => { g.strokeStyle = rgba(h, 0.22); g.beginPath(); g.arc(CX, 236, 150 - i * 4, Math.PI, Math.PI * 2); g.stroke(); }); g.lineWidth = 1; });
        for (let i = 0; i < 12; i++) { const ph = (T * 0.4 + i / 12) % 1; ell(g, rgba('#bfe8ff', 1 - ph), 70 + hx(i, 4, 21) * 180, 236 - ph * 180, 1.6, 2.4); }
      } else if (id === 'darkness') {
        vgrad(g, 0, LH, [[0, '#6ab0e8'], [0.6, '#d8eef8'], [1, '#5a8a3a']]);
        rect(g, '#b8a888', 40, 70, 240, 100); for (let x = 40; x < 280; x += 16) rect(g, '#b8a888', x, 62, 8, 8); arch(g, 140, 104, 40, 66, '#3a2a1a');
        rect(g, '#5a4a3a', 254, 30, 3, 60);
        const w = Math.sin(T * 4) * 2;
        poly(g, '#e8c040', [257, 32, 281, 34 + w, 281, 70 + w, 269, 64, 257, 70]); poly(g, '#2a2a34', [257, 38, 281, 40 + w, 281, 45 + w, 257, 43]); rect(g, '#c8ccd8', 265, 50, 8, 8); poly(g, '#d03030', [269, 48, 270, 54, 269, 60, 268, 54]);
        poly(g, '#5a8a3a', [0, 170, LW, 170, LW, LH, 0, LH]);
        for (let i = 0; i < 8; i++) { const ph = (T * 0.35 + i / 8) % 1; poly(g, rgba('#7ac85a', 0.9 * (1 - ph)), [40 + hx(i, 2, 22) * 240 + Math.sin(T * 3 + i) * 10, ph * 240 - 10, 50 + hx(i, 2, 22) * 240 + Math.sin(T * 3 + i) * 10, ph * 240 - 6, 44 + hx(i, 2, 22) * 240 + Math.sin(T * 3 + i) * 10, ph * 240 - 2]); }
      } else {
        hillBack(g, T);
        for (let i = 0; i < 6; i++) { const ph = (T * 0.2 + i / 6) % 1; ell(g, rgba(i % 2 ? '#4a3430' : '#5a4038', 0.6 * (1 - ph)), 169 + Math.sin(i * 2 + T) * 6 * ph, 92 - ph * 80, 6 + ph * 18, 4 + ph * 10); }
      }
    }

    cut_pose(g, t, T, look, r) {
      const rim = RIM[this.key(r)] || RCOL[r.rar];
      this.poseBack(g, this.key(r), T);
      zoom(g, 1 + 0.06 * sm(t / 1.4), CX, 234);
      lighter(g, () => glow(g, CX, 150, 110, rim, 0.3));
      if (r.id === 'megumin') K.embers(g, T, 26, 31, 60, 260, 230, '#ff6a4a');
      if (r.id === 'darkness') for (let i = 0; i < 3; i++) { const ph = (T * 0.5 + i / 3) % 1; heart(g, 120 + hx(i, 4, 22) * 80, 200 - ph * 120, 3, (1 - ph) * 0.7); }
      ell(g, rgba('#000000', 0.3), CX, 236, 40, 6);
      rimFigure(g, look, CX, 234 + Math.sin(T * 1.4) * 1.5, 3, rim, { s: 0.74 });
      if (r.id === 'megumin') { const u = 3 * 0.74, [ox, oy] = G.staffOrb(look), sx = CX + (ox - 24) * u, sy = 234 + (oy - G.FIG_FOOT) * u; lighter(g, () => glow(g, sx, sy, 10 + 3 * Math.sin(T * 8), '#ff4a5a', 0.8)); }
      K.flash(g, '#ffffff', 0.7 * (1 - seg(t, 0, 0.2)));
    }

    advCard(g, t, T, look, spec) {
      guildBack(g, T);
      rect(g, '#5a3a20', 0, 168, LW, 72); rect(g, '#8a5a34', 0, 168, LW, 4); for (let i = 0; i < 5; i++) rect(g, '#4a2e18', 0, 184 + i * 12, LW, 1);
      const wow = seg(t, 0.75, 0.85);
      bust(g, look, lerp(0, 44, eOut(seg(t, 0, 0.3))) - wow * 6, LH + 6 - (spec.lift || 0), 124, 1, { v: wow > 0 ? { mouth: 'open' } : null });
      const k = eOut(seg(t, 0.05, 0.4)), cx = lerp(LW + 110, 214, k), cy = 98, sh = wow > 0 ? Math.sin(T * 50) * 2 * (1 - seg(t, 0.85, 1.1)) : 0, grow = eOut(seg(t, 0.55, 0.85));
      const [bigName, bigCol, bigHot] = spec.big;
      g.save(); g.translate(Math.round(cx + sh), cy); g.rotate(-0.04);
      rect(g, 'rgba(0,0,0,0.35)', -84, -50, 176, 108);
      rect(g, '#e8dcbc', -88, -54, 176, 108); rect(g, '#2f7438', -88, -54, 176, 14);
      g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#fff6e0'; g.fillText('КАРТА ИСКАТЕЛЯ', -82, -44);
      rect(g, '#2a1c10', -82, -36, 36, 36); G.drawPortrait(g, look, -81, -35, 34);
      g.font = 'bold 10px Georgia, serif'; g.fillStyle = '#3a2410'; g.fillText(spec.name, -40, -24);
      g.font = '8px Georgia, serif'; g.fillText('Класс: ' + spec.cls, -40, -12);
      spec.stats.forEach(([n, v], i) => {
        const y = 6 + i * 8;
        g.fillStyle = '#3a2410'; g.fillText(n, -82, y + 5);
        rect(g, '#b8a888', -26, y, 100, 5); rect(g, '#6a8aa0', -26, y, Math.round(100 * v * seg(t, 0.3 + i * 0.05, 0.5 + i * 0.05)), 5);
      });
      g.font = 'bold 9px Georgia, serif'; g.fillStyle = G.dark(bigCol, 0.35); g.fillText(bigName, -82, 50);
      rect(g, '#b8a888', -26, 43, 100, 8);
      const lw = Math.round(grow * 100 * (spec.bigMax || 3.6));
      if (lw > 0) { lighter(g, () => glow(g, -26 + lw, 47, 20, bigHot, 0.9)); rect(g, bigCol, -26, 43, lw, 8); rect(g, bigHot, -26, 43, lw, 2); }
      if (spec.stamp && wow > 0) { g.save(); g.globalAlpha = wow; g.font = 'bold 8px Georgia, serif'; const sw = Math.ceil(g.measureText(spec.stamp).width) + 10; g.globalAlpha = 0.9 * wow; g.translate(80 - sw / 2, 22); g.rotate(-0.12); g.strokeStyle = '#c83030'; g.lineWidth = 2; g.strokeRect(-sw / 2, -9, sw, 16); g.lineWidth = 1; g.fillStyle = '#c83030'; g.textAlign = 'center'; g.fillText(spec.stamp, 0, 2); g.textAlign = 'left'; g.restore(); }
      g.restore();
      const hand = seg(t, 0.4, 0.65) * 220;
      rect(g, '#2a3a6a', cx + 86 + hand, cy - 4, 200, 16); rect(g, '#e8e0d0', cx + 84 + hand, cy - 4, 4, 16); ell(g, '#f6dcc6', cx + 82 + hand, cy + 4, 8, 6);
      if (wow > 0) {
        if (spec.fx) spec.fx(g, wow, cy);
        else for (let i = 0; i < 8; i++) star4(g, 150 + hx(i, 1, 12) * 160, cy + 30 + (hx(i, 2, 12) - 0.5) * 40, 3 + 3 * Math.abs(Math.sin(T * 9 + i)), '#fff4b0', wow);
        g.save(); g.globalAlpha = wow; g.font = 'bold 22px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('!?', 112, 98); g.fillStyle = bigHot; g.fillText('!?', 110, 96); g.restore();
        K.flash(g, '#ffffff', 0.5 * (1 - seg(t, 0.75, 0.95)));
      }
    }

    cut_kazuma_card(g, t, T, look) {
      this.advCard(g, t, T, look, { name: 'Сато Казума', cls: 'авантюрист', stats: [['Сила', 0.32], ['Ловкость', 0.4], ['Магия', 0.28], ['Интеллект', 0.44]], big: ['Удача', '#d8b040', '#fff4b0'] });
    }

    cut_aqua_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Аква', cls: 'архижрица', stamp: 'УДАЧА: НИЖЕ НЕКУДА', stats: [['Сила', 0.9], ['Ловкость', 0.86], ['Магия', 0.96], ['Интеллект', 0.12]], big: ['Удача', '#5aa0e0', '#d8f0ff'], bigMax: 0.05,
        fx: (g, a) => { for (let i = 0; i < 14; i++) { const ph = (T * 0.6 + hx(i, 1, 119)) % 1; ell(g, rgba('#bfe8ff', a * (1 - ph * 0.5)), 130 + hx(i, 2, 119) * 190, ph * 250 - 20, 2, 3); } }
      });
    }

    cut_megumin_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Мегумин', cls: 'архимаг', stamp: 'НАВЫКИ: ТОЛЬКО ВЗРЫВ', stats: [['Сила', 0.16], ['Ловкость', 0.22], ['Магия', 0.98], ['Интеллект', 0.94]], big: ['Взрыв', '#d83a3a', '#ffd0a0'], lift: 22,
        fx: (g, a) => { for (let i = 0; i < 16; i++) { const ph = (T * 0.8 + hx(i, 1, 120)) % 1; rect(g, rgba(i % 2 ? '#ff6a4a' : '#ffd070', a * (1 - ph)), Math.round(130 + hx(i, 2, 120) * 190), Math.round(230 - ph * 230), 2, 2); } }
      });
    }

    cut_darkness_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Даркнесс', cls: 'крестоносец', stamp: 'ПОПАДАНИЙ: 0', stats: [['Сила', 0.9], ['Ловкость', 0.05], ['Магия', 0.2], ['Интеллект', 0.5]], big: ['Защита', '#c89a30', '#fff0b0'],
        fx: (g, a) => { for (let i = 0; i < 6; i++) { const ph = (T * 0.6 + i / 6) % 1; heart(g, 140 + hx(i, 2, 121) * 170, 200 - ph * 160, 4, a * (1 - ph) * 0.9); } }
      });
    }

    cut_asta_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Аста', cls: 'астроном?', stamp: 'ВЗНОС: 100 ЛЕТ', stats: [['Сила', 0.3], ['Ловкость', 0.42], ['Магия', 0.5], ['Интеллект', 0.72]], big: ['Кредиты', '#e8a020', '#ffe8a0'],
        fx: (g, a) => { for (let i = 0; i < 18; i++) { const ph = (T * 0.9 + hx(i, 1, 14)) % 1; coin(g, 130 + hx(i, 2, 14) * 190, ph * 250 - 20, 2.4, T * 6 + i, a); } }
      });
    }

    cut_asta_treat(g, t, T, look) {
      guildBack(g, T);
      for (const tx of [26, 252]) { ell(g, '#5a3a20', tx + 22, 196, 34, 9); rect(g, '#3a2414', tx + 18, 196, 8, 30); }
      const slam = seg(t, 0.15, 0.25), cheer = seg(t, 0.25, 0.4);
      ell(g, rgba('#000000', 0.25), 120, 226, 22, 4);
      figure(g, look, 120, 226, 2, { s: 0.86, v: slam > 0 ? { mouth: 'open' } : null });
      rect(g, '#6a4226', 150, 186, 64, 6); rect(g, '#3a2414', 156, 192, 6, 34); rect(g, '#3a2414', 202, 192, 6, 34);
      const by = lerp(110, 174, eIn(slam));
      ell(g, '#8a5a2a', 182, by, 13, 11); poly(g, '#6a3a1a', [174, by - 10, 190, by - 10, 186, by - 16, 178, by - 16]); rect(g, '#d8a020', 176, by - 13, 12, 2);
      ell(g, '#e8b030', 182, by + 2, 5, 5); rect(g, '#8a5a10', 181, by - 1, 2, 6);
      if (slam >= 1) for (let i = 0; i < 12; i++) { const q = seg(t, 0.25, 0.75), a = -Math.PI * (0.1 + 0.8 * hx(i, 1, 15)), v = 30 + 50 * hx(i, 2, 15); if (q < 1) coin(g, 182 + Math.cos(a) * v * q, 174 + Math.sin(a) * v * q + 60 * q * q, 2.2, T * 8 + i, 1); }
      const run = eOut(seg(t, 0.45, 0.75)), ax = lerp(LW + 40, 262, run), unroll = seg(t, 0.6, 1.05);
      if (run > 0) {
        if (unroll > 0) rect(g, '#f2eadc', ax - 22, 150, 9, 82);
        ell(g, rgba('#000000', 0.25), ax, 226, 20, 4);
        figure(g, this.lookOf('aqua'), ax, 226, 2, { s: 0.82, v: { mouth: 'open' }, rot: (1 - run) * -0.12 });
        rect(g, '#f2eadc', ax - 28, 140, 16, 12); rect(g, '#d8c8a8', ax - 28, 140, 16, 2);
      }
      for (let i = 0; i < 14; i++) { const x = 10 + i * 23, up = cheer * Math.abs(Math.sin(T * 7 + i)) * 6, y = 226 - up; ell(g, '#140a08', x, y, 10, 9); rect(g, '#140a08', x - 9, y, 18, 24); if (i % 3 === 0 && cheer > 0) { rect(g, '#d8c8a0', x + 6, y - 16, 7, 9); rect(g, '#fff8e0', x + 6, y - 18, 7, 3); } }
      if (run > 0 && unroll > 0) { const len = unroll * 210; rect(g, '#f2eadc', ax - 22 - len, 198 + Math.sin(T * 3) * 2, len + 9, 9); rect(g, '#d8c8a8', ax - 22 - len, 206 + Math.sin(T * 3) * 2, len + 9, 1); for (let i = 0; i < len / 7; i++) rect(g, rgba('#5a4028', 0.55), Math.round(ax - 26 - i * 7), 201 + Math.sin(T * 3) * 2, 4, 1); }
    }

    cut_asta_cover(g, t, T, look) {
      guildBack(g, T);
      bust(g, look, 160, LH + 6, 104, 1, { v: { mouth: 'open' } });
      const rip = seg(t, 0.3, 0.45), aqua = this.lookOf('aqua');
      bust(g, aqua, 54, LH + 4, 116, 1, { v: { mouth: 'open' }, flip: true });
      tears(g, aqua, 54, LH + 4, 116, 1, T, rip, true);
      bust(g, this.lookOf('kazuma'), 268, LH + 4, 124, 1, { v: { mouth: 'open' } });
      const hxp = 214, hyp = 112;
      lighter(g, () => glow(g, hxp, hyp, 22 + 4 * Math.sin(T * 10), '#9affb0', 0.7 * (1 - rip * 0.5)));
      if (rip < 1) { g.save(); g.translate(lerp(110, hxp - 6, eOut(seg(t, 0, 0.3))), hyp); g.rotate(0.1); rect(g, '#f2eadc', -22, -14, 44, 30); for (let i = 0; i < 5; i++) rect(g, rgba('#5a4028', 0.6), -18, -9 + i * 5, 30, 1); rect(g, '#c83030', 6, 8, 12, 4); g.restore(); }
      else for (let i = 0; i < 14; i++) { const q = seg(t, 0.45, 1), a = hx(i, 1, 16) * Math.PI * 2, v = 30 + 60 * hx(i, 2, 16); g.save(); g.translate(hxp - 6 + Math.cos(a) * v * q, hyp + Math.sin(a) * v * q + 50 * q * q); g.rotate(T * 5 + i); rect(g, rgba('#f2eadc', 1 - q * 0.6), -5, -4, 10, 8); g.restore(); }
      if (rip > 0 && rip < 1) lighter(g, () => glow(g, hxp - 6, hyp, 50, '#ffffff', 0.7 * (1 - rip)));
      if (rip >= 1) { g.save(); g.globalAlpha = seg(t, 0.45, 0.6); g.font = 'bold 14px Georgia, serif'; g.fillStyle = '#062010'; g.fillText('КРАЖА!', 191, 61); g.fillStyle = '#c8ffd8'; g.fillText('КРАЖА!', 190, 60); g.restore(); }
    }

    cut_arlan_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Арлан', cls: 'крестоносец?', stamp: 'К ЛЕКАРЮ!', stats: [['Сила', 0.78], ['Ловкость', 0.56], ['Магия', 0.1], ['Интеллект', 0.3]], big: ['Раны', '#c83030', '#ffb0a0'],
        fx: (g, a) => { for (let i = 0; i < 10; i++) { const ph = (T * 0.7 + hx(i, 1, 17)) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.5); g.translate(140 + hx(i, 2, 17) * 180, ph * 240 - 10); g.rotate(T * 2 + i); rect(g, '#f4f0e8', -9, -2, 18, 4); rect(g, '#d8c8b8', -9, 0, 18, 1); g.restore(); } }
      });
    }

    cut_arlan_scratch(g, t, T, look) {
      const hits = [0.3, 0.76], tt = freeze(t, hits, 0.06), cut = seg(tt, 0.76, 0.9);
      shake(g, T, t > 0.3 && t < 0.45 ? 3 : t > 0.76 && t < 0.95 ? 4 : 0);
      plainBack(g, T, true);
      const flop = seg(tt, 0.85, 1.05);
      g.save(); g.translate(236, 214); g.rotate(flop * 0.5); g.translate(-236, -214);
      toad(g, 236, 214, 0.85, T, { gape: tt < 0.4 ? 0.8 : 0.2 });
      g.restore();
      const lash = seg(tt, 0.12, 0.3), back = seg(tt, 0.3, 0.45);
      if (lash > 0 && back < 1) { const reach = lash < 1 ? lash : 1 - back, ex = lerp(170, 104, reach); line(g, '#d86a80', 6, 170, 168, ex, 150); ell(g, '#e88aa0', ex, 150, 6, 5); }
      const dash = eOut(seg(tt, 0.7, 0.8)), x = lerp(92, 196, dash) - back * 8 * (1 - dash), u = 2 * 0.9, y = 228;
      ell(g, rgba('#000000', 0.25), x, y, 22, 4);
      const power = seg(tt, 0.42, 0.7);
      if (power > 0) lighter(g, () => { glow(g, x, y - 48 * u, 50 * power, '#b48cff', 0.5 * power); for (let i = 0; i < 4; i++) bolt(g, x + (hx(i, 1, 9) - 0.5) * 40, y - 90 * u, x + (hx(i, 2, 9) - 0.5) * 50, y - 10, '#e0c8ff', power, Math.floor(T * 20) + i); });
      figure(g, look, x, y, 2, { s: 0.9, rot: -back * 0.12 * (1 - dash), tint: t > 0.3 && t < 0.38 ? '#ff4040' : null, ta: 0.6 });
      const hp = 5 - (tt >= 0.3 ? 3 : 0);
      for (let i = 0; i < 5; i++) rect(g, i < hp ? '#e04040' : '#4a2020', Math.round(x - 16 + i * 7), Math.round(y - 96 * u - 6), 5, 4);
      if (cut > 0 && cut < 1) { smear(g, 236, 150, 60, -2.4, lerp(-2.4, 1.2, cut), 1 - cut * 0.4); lighter(g, () => bolt(g, 180, 110, 290, 190, '#e0c8ff', 1 - cut, Math.floor(T * 30))); }
      if (t > 0.3 && t < 0.4) K.flash(g, '#ff2020', 0.25);
      if (t > 0.76 && t < 0.82) K.flash(g, '#e8d8ff', 0.6);
    }

    cut_arlan_jealous(g, t, T, look) {
      guildBack(g, T);
      const dark = this.lookOf('darkness'), aqua = this.lookOf('aqua');
      bust(g, look, 160, LH + 6, 124, 1);
      lighter(g, () => { glow(g, 160, 150, 70, '#8ad0ff', 0.35 * seg(t, 0, 0.3)); for (let i = 0; i < 12; i++) { const ph = (T * 0.8 + i / 12) % 1; star4(g, 110 + hx(i, 2, 18) * 100, 230 - ph * 150, 2.5, '#d8f4ff', 1 - ph); } });
      bust(g, aqua, 270, LH + 4, 116, 1, { v: { closed: true } });
      const lean = eOut(seg(t, 0.2, 0.45));
      bust(g, dark, lerp(-40, 52, lean), LH + 4, 120, 1, { v: { blush: true, mouth: 'open' }, flip: true });
      if (lean > 0.8) for (let i = 0; i < 4; i++) { const ph = (T * 0.9 + i / 4) % 1; heart(g, 40 + i * 16, 110 - ph * 40, 3, 1 - ph); }
      if (t > 0.55) { const a = seg(t, 0.55, 0.7); g.save(); g.globalAlpha = a; rect(g, '#f8f4ec', 176, 52, 84, 18); poly(g, '#f8f4ec', [188, 70, 198, 70, 184, 80]); g.font = 'italic 9px Georgia, serif'; g.fillStyle = '#3a2410'; g.fillText('Само заживёт.', 182, 64); g.restore(); }
    }

    cut_herta_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Герта', cls: 'архимаг?', stamp: 'ЭТО КУКЛА?', stats: [['Сила', 0.2], ['Ловкость', 0.34], ['Магия', 0.66], ['Удача', 0.5]], big: ['Интеллект', '#8a5ad8', '#e8d8ff'],
        fx: (g, a) => { g.font = 'bold 12px Georgia, serif'; ['∑', 'π', '∞', '√', 'Δ', 'λ', '∫', 'φ'].forEach((c, i) => { const ph = (T * 0.6 + i / 8) % 1; g.fillStyle = rgba('#d8c0ff', a * (1 - ph)); g.fillText(c, 140 + hx(i, 2, 19) * 170, 200 - ph * 170); }); }
      });
    }

    cut_herta_bored(g, t, T, look) {
      hillBack(g, T);
      blast2d(g, T, 169, 92, seg(t, 0, 0.8), '#ff8a3a');
      const meg = this.lookOf('megumin');
      ell(g, rgba('#000000', 0.25), 82, 228, 22, 4);
      figure(g, meg, 82, 228, 2, { s: 0.86, v: { mouth: 'open' } });
      ell(g, rgba('#000000', 0.25), 240, 228, 20, 4);
      figure(g, look, 240, 228, 2, { s: 0.82, v: { mood: 'flat' } });
      if (t > 0.5) bubble(g, 214, 56, 'И это считается сильным?', seg(t, 0.5, 0.62), true);
      if (t > 0.75) anger(g, 98, 56, 2, seg(t, 0.75, 0.85));
    }

    cut_herta_spin(g, t, T, look) {
      hillBack(g, T);
      const meg = this.lookOf('megumin'), freezeK = seg(t, 0.5, 0.65), tx = lerp(LW + 60, 280, eOut(seg(t, 0, 0.4)));
      figure(g, meg, 150, 200, 2, { s: 0.66, rot: -Math.PI / 2 });
      toad(g, tx, 222, 0.7, T * (1 - freezeK), { gape: 0.3 });
      if (freezeK > 0) {
        lighter(g, () => glow(g, tx - 4, 180, 70, '#a8e0ff', 0.6 * freezeK));
        for (let i = 0; i < 9; i++) { const x = tx - 50 + hx(i, 1, 21) * 90, y = 220 - hx(i, 2, 21) * 80, h = (10 + hx(i, 3, 21) * 18) * eOut(freezeK); poly(g, rgba('#d8f4ff', 0.85), [x - 4, y, x, y - h, x + 4, y]); poly(g, rgba('#ffffff', 0.7), [x - 1, y, x, y - h, x + 1, y]); }
      }
      const spin = t < 0.62, u = 2 * 0.62;
      for (const [px, ph] of [[172, 0], [216, 1.6]]) {
        const fl = spin ? Math.sin(T * 30 + ph) > 0 : false, hop = spin ? Math.abs(Math.sin(T * 9 + ph)) * 4 : 0;
        if (spin) lighter(g, () => { g.strokeStyle = rgba('#c8ecff', 0.8); g.lineWidth = 2; g.beginPath(); g.ellipse(px, 216 - hop, 26, 7, 0, T * 12 + ph, T * 12 + ph + 4); g.stroke(); g.lineWidth = 1; glow(g, px, 196, 30, '#a8e0ff', 0.3); });
        ell(g, rgba('#000000', 0.25), px, 226, 16, 3);
        figure(g, look, px, 224 - hop, 2, { s: 0.62, flip: fl, v: { mood: 'flat' } });
        for (let i = 0; i < 6; i++) { const q = (T * 2 + i / 6 + ph) % 1; rect(g, rgba('#e8f8ff', spin ? 1 - q : 0), Math.round(px + Math.cos(q * 6.28 + ph) * 30), Math.round(200 - 40 * u + q * 50), 2, 2); }
      }
      if (freezeK > 0 && freezeK < 1) K.flash(g, '#e8f8ff', 0.5 * (1 - freezeK));
    }

    cut_serval_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Сервал Ландау', cls: 'бард?', stamp: 'ГРОМКО!', stats: [['Сила', 0.46], ['Ловкость', 0.6], ['Магия', 0.52], ['Интеллект', 0.66]], big: ['Рок-н-ролл', '#3a90e8', '#d8f0ff'],
        fx: (g, a) => { for (let i = 0; i < 10; i++) { const ph = (T * 0.7 + i / 10) % 1; note(g, 140 + hx(i, 2, 25) * 170 + Math.sin(T * 3 + i) * 6, 210 - ph * 190, 1.2, i % 2 ? '#8ac8ff' : '#ffffff', a * (1 - ph)); } }
      });
    }

    serStage(g, T, x, y, look, jump, crowdUp) {
      for (const ax of [34, 286]) { rect(g, '#1a1418', ax - 22, 120, 44, 92); rect(g, '#2a2228', ax - 20, 122, 40, 40); rect(g, '#2a2228', ax - 20, 166, 40, 40); for (const cy of [142, 186]) { ell(g, '#0e0a0c', ax, cy, 14, 14); ell(g, '#3a3036', ax, cy, 5 + Math.abs(Math.sin(T * 16)) * 2, 5 + Math.abs(Math.sin(T * 16)) * 2); } }
      rect(g, '#6a4226', x - 50, y, 100, 7); rect(g, '#3a2414', x - 44, y + 7, 7, 40); rect(g, '#3a2414', x + 37, y + 7, 7, 40);
      const fy = y - jump, u = 2 * 0.8;
      ell(g, rgba('#000000', 0.25), x, y, 22, 4);
      figure(g, look, x, fy, 2, { s: 0.8, v: { mouth: 'open' } });
      const [gx, gy] = figAt(x, fy, u, 26, 60);
      guitar(g, gx, gy, -0.55 + Math.sin(T * 14) * 0.05, 1.2);
      lighter(g, () => { for (let i = 0; i < 3; i++) bolt(g, gx, gy, gx + (hx(Math.floor(T * 12), i, 5) - 0.5) * 120, gy - 40 - hx(Math.floor(T * 12), i, 6) * 60, '#c8e8ff', 0.8, Math.floor(T * 24) + i); });
      for (let i = 0; i < 8; i++) { const ph = (T * 0.8 + i / 8) % 1; note(g, gx + (hx(i, 2, 26) - 0.5) * 140, gy - ph * 120, 1.1, i % 2 ? '#8ac8ff' : '#ffffff', 1 - ph); }
      for (let i = 0; i < 14; i++) { const x0 = 10 + i * 23, up = crowdUp * Math.abs(Math.sin(T * 11 + i * 0.7)) * 8, yy = 226 - up; ell(g, '#120a10', x0, yy, 10, 9); rect(g, '#120a10', x0 - 9, yy, 18, 24); if (i % 4 === 1) { rect(g, '#120a10', x0 + 6, yy - 22, 4, 16); poly(g, '#120a10', [x0 + 4, yy - 22, x0 + 12, yy - 22, x0 + 10, yy - 28]); } }
    }

    cut_serval_gig(g, t, T, look) {
      guildBack(g, T);
      lighter(g, () => { for (const [x, c] of [[70, '#3a90e8'], [250, '#e83a8a'], [160, '#ffe8a0']]) poly(g, rgba(c, 0.16 + 0.08 * Math.sin(T * 6 + x)), [x - 6, 0, x + 6, 0, 160 + (x - 160) * 0.2 + 40, 200, 160 + (x - 160) * 0.2 - 40, 200]); });
      this.serStage(g, T, 160, 196, look, Math.abs(Math.sin(T * 7)) * 3 * seg(t, 0.2, 0.4), seg(t, 0.15, 0.4));
    }

    cut_serval_finale(g, t, T, look) {
      const boom = seg(t, 0.4, 1.0);
      shake(g, T, boom > 0 && boom < 0.4 ? 4 : 0);
      guildBack(g, T);
      if (boom > 0) { rect(g, '#2a1438', 40, 0, 240, 60 * eOut(boom)); blast2d(g, T, 160, 30, boom, '#ff8a3a'); for (let i = 0; i < 10; i++) { const a = -Math.PI * hx(i, 1, 27), v = 80 + 60 * hx(i, 2, 27); g.save(); g.translate(160 + Math.cos(a) * v * boom, 30 + Math.sin(a) * v * boom + 40 * boom * boom); g.rotate(T * 6 + i); rect(g, '#4a3020', -9, -2, 18, 4); g.restore(); } }
      const meg = this.lookOf('megumin'), mu = 2 * 0.74;
      if (boom <= 0) { rune2d(g, 160, 40, 70 * eOut(seg(t, 0, 0.35)), 16 * eOut(seg(t, 0, 0.35)), T * 1.4, '#ff6a5a', 0.9); }
      this.serStage(g, T, 160, 196, look, boom > 0 ? Math.sin(Math.min(1, boom * 1.6) * Math.PI) * 26 : 0, 1);
      const [ox, oy] = G.staffOrb(meg);
      figure(g, meg, 66, 214, 2, { s: 0.74 });
      lighter(g, () => glow(g, 66 + (ox - 24) * mu, 214 + (oy - G.FIG_FOOT) * mu, 12 + 4 * Math.sin(T * 9), '#ff4a5a', 0.9));
      if (boom > 0 && boom < 0.2) K.flash(g, '#fff0e0', 1 - boom / 0.2);
      if (t > 0.78) bubble(g, 214, 62, 'Вот это рок-н-ролл!', seg(t, 0.78, 0.9), true);
    }

    cut_natasha_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Наташа', cls: 'жрица?', stamp: 'ЛИЦЕНЗИЯ', stats: [['Сила', 0.4], ['Ловкость', 0.5], ['Магия', 0.34], ['Интеллект', 0.7]], big: ['Медицина', '#2fa86a', '#d8ffe8'],
        fx: (g, a) => { for (let i = 0; i < 10; i++) { const ph = (T * 0.6 + i / 10) % 1, x = 140 + hx(i, 2, 29) * 170, y = 210 - ph * 190; rect(g, rgba('#8affb8', a * (1 - ph)), Math.round(x - 1), Math.round(y - 4), 3, 9); rect(g, rgba('#8affb8', a * (1 - ph)), Math.round(x - 4), Math.round(y - 1), 9, 3); } }
      });
    }

    clinic(g, T, kazLying) {
      vgrad(g, 0, 170, [[0, '#2a3634'], [1, '#4a5a56']]);
      for (let x = 0; x < LW; x += 40) rect(g, rgba('#000000', 0.15), x, 0, 1, 170);
      line(g, '#1a1a1a', 1, 160, 0, 160, 26); ell(g, '#e8c870', 160, 30, 10, 5); lighter(g, () => glow(g, 160, 40, 90, '#ffd890', 0.35 + 0.05 * Math.sin(T * 9)));
      rect(g, '#d8dcd8', 252, 60, 46, 80); rect(g, '#b8bcb8', 254, 62, 42, 76); rect(g, '#2fa86a', 271, 70, 8, 22); rect(g, '#2fa86a', 264, 77, 22, 8);
      vgrad(g, 168, LH, [[0, '#3a3a36'], [1, '#22221e']]);
      rect(g, '#8a8a90', 70, 178, 160, 6); rect(g, '#e8ecf0', 72, 170, 156, 10); rect(g, '#5a5a60', 76, 184, 4, 30); rect(g, '#5a5a60', 220, 184, 4, 30);
      if (kazLying) {
        figure(g, this.lookOf('kazuma'), 214, 168, 2, { s: 0.62, rot: -Math.PI / 2, v: { closed: true } });
        for (let i = 0; i < 4; i++) rect(g, '#f4f0e8', 104 + i * 26, 156 + (i % 2) * 6, 18, 5);
        rect(g, '#c8d8e8', 130, 162, 90, 10);
      }
    }

    cut_natasha_rival(g, t, T, look) {
      this.clinic(g, T, true);
      const aqua = this.lookOf('aqua'), heal = seg(t, 0.1, 0.6), u = 2 * 0.8;
      figure(g, aqua, 58, 230, 2, { s: 0.8, v: { mouth: 'open' } });
      if (heal > 0) lighter(g, () => { glow(g, 150, 160, 60 * heal, '#8ad0ff', 0.4); for (let i = 0; i < 10; i++) { const ph = (T * 0.9 + i / 10) % 1; star4(g, 110 + hx(i, 2, 30) * 90, 170 - ph * 60, 2.5, '#d8f4ff', heal * (1 - ph)); } });
      if (t > 0.6) { g.save(); g.globalAlpha = seg(t, 0.6, 0.7); g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('+1', 160, 140 - seg(t, 0.6, 1) * 12); g.restore(); }
      const nx = lerp(LW + 40, 270, eOut(seg(t, 0.45, 0.8)));
      ell(g, rgba('#000000', 0.25), nx, 230, 20, 4);
      figure(g, look, nx, 230, 2, { s: 0.8 });
      const [hx2, hy2] = figAt(nx, 230, u, 12, 50);
      syringe(g, hx2, hy2 - 10, -0.9, 1.6);
      if (t > 0.8) star4(g, hx2 - 26, hy2 - 40, 3 + 2 * Math.sin(T * 14), '#ffffff', 0.9);
      if (t > 0.8) bubble(g, 238, 54, 'Садись, я тебя осмотрю.', seg(t, 0.8, 0.9), true);
    }

    cut_natasha_shot(g, t, T, look) {
      this.clinic(g, T, false);
      const hit = seg(t, 0.15, 0.25), up = eOut(seg(t, 0.3, 0.5)), heal = seg(t, 0.45, 0.8);
      shake(g, T, hit > 0 && t < 0.4 ? 3 : 0);
      const kaz = this.lookOf('kazuma'), aqua = this.lookOf('aqua');
      bust(g, aqua, 48, LH + 4, 112, 1, { v: { mouth: 'open' }, flip: true });
      tears(g, aqua, 48, LH + 4, 112, 1, T, seg(t, 0.5, 0.65), true);
      bust(g, look, 276, LH + 4, 118, 1);
      const ky = LH + 10 - up * 22 + (up >= 1 ? Math.abs(Math.sin(T * 8)) * -3 : 0);
      bust(g, kaz, 160, ky, 132, 1, { v: { mouth: 'open' } });
      if (heal > 0) lighter(g, () => { glow(g, 160, 150, 80, '#8affb8', 0.4 * heal); for (let i = 0; i < 10; i++) { const ph = (T * 1.2 + i / 10) % 1, x = 100 + hx(i, 2, 31) * 120, y = 220 - ph * 140; rect(g, rgba('#c8ffd8', heal * (1 - ph)), Math.round(x - 1), Math.round(y - 3), 2, 7); rect(g, rgba('#c8ffd8', heal * (1 - ph)), Math.round(x - 3), Math.round(y - 1), 7, 2); } });
      const sx = lerp(300, 226, eOut(seg(t, 0, 0.15))), sy = lerp(120, 178, eOut(seg(t, 0, 0.15))) - up * 22;
      if (t < 0.6) syringe(g, sx, sy, 0.8, 2.6, seg(t, 0.2, 0.4));
      if (hit > 0 && hit < 1) lighter(g, () => glow(g, 210, 196, 40, '#ffffff', 0.9 * (1 - hit)));
      if (t > 0.2 && t < 0.5) { g.save(); g.font = 'bold 20px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('!!', 122, 70); g.fillStyle = '#ffe060'; g.fillText('!!', 120, 68); g.restore(); }
    }

    cut_sampo_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Сампо Коски', cls: 'торговец', stamp: 'БЛАНК ПРОДАН', stats: [['Сила', 0.38], ['Ловкость', 0.74], ['Магия', 0.3], ['Интеллект', 0.6]], big: ['Связи', '#2aa894', '#d8fff4'],
        fx: (g, a) => { for (let i = 0; i < 14; i++) { const ph = (T * 0.8 + hx(i, 1, 33)) % 1; coin(g, 130 + hx(i, 2, 33) * 190, ph * 250 - 20, 2.4, T * 6 + i, a); } }
      });
    }

    cut_sampo_deal(g, t, T, look) {
      guildBack(g, T);
      const sx = 172;
      ell(g, rgba('#000000', 0.25), sx, 218, 20, 4);
      figure(g, look, sx, 218, 2, { s: 0.8, v: { mouth: 'open' } });
      rect(g, '#5a3a20', 112, 180, 128, 8); poly(g, '#2a8a7a', [108, 188, 244, 188, 240, 232, 112, 232]); for (let x = 116; x < 240; x += 12) rect(g, '#d8b040', x, 188, 4, 4);
      for (let i = 0; i < 4; i++) { const bx = 122 + i * 14; rect(g, '#8ad0ff', bx, 164, 8, 16); rect(g, '#d8e8f0', bx + 2, 160, 4, 4); rect(g, '#f2eadc', bx, 170, 8, 5); }
      for (let i = 0; i < 3; i++) { rect(g, '#d8c8a0', 186 + i * 6, 166 - i * 2, 5, 14 + i * 2); rect(g, '#b8a888', 186 + i * 6, 166 - i * 2, 5, 2); }
      for (let i = 0; i < 3; i++) { rect(g, '#a8acb4', 210 + i * 9, 170, 8, 10); rect(g, '#c83030', 210 + i * 9, 173, 8, 3); }
      g.save(); g.translate(176, 134); g.rotate(-0.04); rect(g, '#5a3a20', -42, -10, 84, 18); rect(g, '#f2eadc', -40, -8, 80, 14); g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#c83030'; g.textAlign = 'center'; g.fillText('РАСПРОДАЖА', 0, 3); g.textAlign = 'left'; g.restore();
      const aqua = this.lookOf('aqua'), ax = lerp(-40, 60, eOut(seg(t, 0.1, 0.4)));
      ell(g, rgba('#000000', 0.25), ax, 230, 20, 4);
      figure(g, aqua, ax, 230, 2, { s: 0.82, v: t > 0.5 ? { mouth: 'open', blush: true } : null });
      const fly = seg(t, 0.5, 0.75);
      if (fly > 0 && fly < 1) { for (let i = 0; i < 4; i++) coin(g, lerp(ax + 20, sx - 10, fly) + i * 4, 150 - Math.sin(fly * Math.PI) * 30 + i * 3, 2.4, T * 9 + i, 1); }
      const bot = seg(t, 0.6, 0.85);
      if (bot > 0) { const bx = lerp(130, ax + 18, bot), by = 164 - Math.sin(bot * Math.PI) * 34 + bot * 14; g.save(); g.translate(bx, by); g.rotate(bot * 6); rect(g, '#8ad0ff', -4, -8, 8, 16); rect(g, '#d8e8f0', -2, -12, 4, 4); g.restore(); }
      if (t > 0.75) bubble(g, ax + 6, 70, 'Это же вода из моего храма!', seg(t, 0.75, 0.85), true);
    }

    cut_sampo_swap(g, t, T, look) {
      guildBack(g, T);
      K.speedLines(g, T, 120, 130, 24, '#c8ffd8', 0.4, 30);
      const kaz = this.lookOf('kazuma');
      bust(g, kaz, 70, LH + 4, 140, 1, { v: { mouth: 'open' } });
      bust(g, look, 262, LH + 4, 128, 1, { v: { mouth: 'open' } });
      const grab = seg(t, 0.15, 0.3), open = seg(t, 0.4, 0.55), wx = 128, wy = 112;
      lighter(g, () => glow(g, wx, wy, 26 + 4 * Math.sin(T * 10), '#9affb0', 0.7 * (1 - open)));
      if (grab > 0) {
        g.save(); g.translate(wx, wy); g.rotate(-0.1);
        rect(g, '#6a3a1a', -14, -8, 28, 18); rect(g, '#8a5a2a', -14, -8, 28, 4);
        if (open > 0) { poly(g, '#4a2a10', [-14, -8, 14, -8, 10, -8 - 10 * open, -10, -8 - 10 * open]); }
        g.restore();
      }
      if (open > 0) for (let i = 0; i < 2; i++) { const q = seg(t, 0.45 + i * 0.1, 1), x = wx - 4 + i * 8 + Math.sin(T * 12 + i) * 6, y = wy - 14 - q * 60; poly(g, rgba('#c8c0b0', 1 - q * 0.5), [x, y, x - 6, y - 4 + Math.sin(T * 30) * 3, x - 4, y + 2]); poly(g, rgba('#c8c0b0', 1 - q * 0.5), [x, y, x + 6, y - 4 + Math.sin(T * 30) * 3, x + 4, y + 2]); }
      if (t > 0.55) { const sw = Math.sin(T * 7) * 0.4, px = 222, py = 92; line(g, '#3a2414', 1, px, py - 14, px + Math.sin(sw) * 4, py); g.save(); g.translate(px, py); g.rotate(sw); ell(g, '#2f7438', 0, 8, 10, 9); rect(g, '#1a4a20', -6, -2, 12, 3); ell(g, '#e8b030', 0, 8, 3, 3); g.restore(); star4(g, px + 14, py, 3 + 2 * Math.sin(T * 12), '#ffffff', 0.9); }
      const k = eOut(seg(t, 0.05, 0.25));
      g.save(); g.globalAlpha = k; g.font = 'bold 26px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#062010'; g.fillText('КРАЖА!', 122, 52); g.fillStyle = '#c8ffd8'; g.fillText('КРАЖА!', 120, 50); g.textAlign = 'left'; g.restore();
    }

    cut_hook_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Хук', cls: 'Великий Мрак', stamp: 'С ВЗРОСЛЫМИ', stats: [['Сила', 0.5], ['Ловкость', 0.48], ['Магия', 0.2], ['Интеллект', 0.22]], big: ['Пафос', '#e8602a', '#ffe0c0'],
        fx: (g, a) => K.embers(g, T, 30, 35, 130, 320, 230, '#ff8a3a')
      });
    }

    cut_hook_titles(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a0c14'], [1, '#4a1a10']]);
      poly(g, '#3a0a14', [0, 0, 172, 0, 148, LH, 0, LH]);
      poly(g, '#5a2a0a', [172, 0, LW, 0, LW, LH, 148, LH]);
      line(g, '#ffe0a0', 2, 172, 0, 148, LH);
      const meg = this.lookOf('megumin'), a = eOut(seg(t, 0, 0.3)), b = eOut(seg(t, 0.35, 0.6));
      rune2d(g, 80, 110, 70 * a, 70 * a, T * 0.8, '#ff5a4a', 0.7);
      K.embers(g, T, 30, 36, 170, 320, 240, '#ffb040');
      lighter(g, () => glow(g, 236, 140, 80 * b, '#ff9a3a', 0.4));
      ell(g, rgba('#000000', 0.3), 80, 232, 22, 4); ell(g, rgba('#000000', 0.3), 236, 232, 18, 4);
      rimFigure(g, meg, 80, 232, 2, '#ff5a4a', { s: 0.9 });
      rimFigure(g, look, 236, 232, 2, '#ffb040', { s: 0.9, v: { mouth: 'open' } });
      const tag = (x, y, rot, txt, col, k) => { if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); g.globalAlpha = k; g.font = 'bold 12px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#140608'; g.fillText(txt, 2, 2); g.fillStyle = col; g.fillText(txt, 0, 0); g.textAlign = 'left'; g.restore(); };
      tag(84, 34, -0.1, 'МЕГУМИН', '#ff6a5a', a);
      tag(228, 34, 0.06, 'ХУК ВЕЛИКИЙ МРАК', '#ffc060', b);
      if (t > 0.65) { const k = seg(t, 0.65, 0.8); g.save(); g.globalAlpha = k; g.font = 'bold 20px Georgia, serif'; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.fillText('VS', 160, 120); g.textAlign = 'left'; g.restore(); lighter(g, () => glow(g, 160, 114, 30, '#ffffff', 0.5 * k)); }
    }

    cut_hook_recruit(g, t, T, look) {
      guildBack(g, T);
      rect(g, '#6a4226', 110, 186, 100, 7); rect(g, '#3a2414', 116, 193, 7, 40); rect(g, '#3a2414', 197, 193, 7, 40);
      const hop = Math.abs(Math.sin(T * 6)) * 3;
      figure(g, look, 160, 186 - hop, 2, { s: 0.7, v: { mouth: 'open' } });
      const meg = this.lookOf('megumin'), kaz = this.lookOf('kazuma');
      bust(g, meg, 52, LH + 4, 120, 1, { v: { mouth: 'open', blush: true }, flip: true });
      bust(g, kaz, 268, LH + 4, 128, 1, { v: { mouth: 'open' } });
      const k1 = seg(t, 0.15, 0.35), k2 = seg(t, 0.4, 0.6);
      moleHat(g, lerp(160, 62, eOut(k1)), lerp(150, 122, eOut(k1)) - Math.sin(k1 * Math.PI) * 30, 0.9, k1 > 0);
      moleHat(g, lerp(160, 268, eOut(k2)), lerp(150, 132, eOut(k2)) - Math.sin(k2 * Math.PI) * 30, 1.1, k2 > 0);
      if (k1 >= 1) for (let i = 0; i < 3; i++) star4(g, 30 + i * 22, 80 + Math.sin(T * 6 + i) * 4, 3, '#fff0b0', 0.9);
      if (t > 0.7) anger(g, 300, 120, 2, seg(t, 0.7, 0.8));
    }

    cut_pela_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Пела', cls: 'разведчик', stamp: 'СЕКРЕТНО', stats: [['Сила', 0.3], ['Ловкость', 0.62], ['Магия', 0.46], ['Интеллект', 0.7]], big: ['Анализ', '#3a8ad8', '#d8f0ff'],
        fx: (g, a) => { for (let i = 0; i < 9; i++) { const ph = (T * 0.6 + i / 9) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.6); g.translate(140 + hx(i, 2, 38) * 170, ph * 250 - 20); g.rotate(Math.sin(T * 2 + i) * 0.6); rect(g, '#f4f4f8', -7, -9, 14, 18); for (let l = 0; l < 4; l++) rect(g, '#8a9ab0', -5, -6 + l * 4, 10, 1); g.restore(); } }
      });
    }

    cut_pela_report(g, t, T, look) {
      guildBack(g, T);
      g.save(); g.translate(150, 104); g.rotate(-0.02);
      rect(g, 'rgba(0,0,0,0.35)', -102, -76, 208, 156); rect(g, '#f4f2ec', -104, -80, 208, 156); rect(g, '#3a5a8a', -104, -80, 208, 16);
      g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('РАПОРТ: ОТРЯД КАЗУМЫ', -96, -69);
      const rows = [['aqua', 'Аква', 'долги и слёзы'], ['megumin', 'Мегумин', 'один взрыв в день'], ['darkness', 'Даркнесс', 'не попадает'], ['kazuma', 'Казума', 'крадёт трусы']];
      rows.forEach(([id, nm, flaw], i) => {
        const k = seg(t, 0.12 + i * 0.16, 0.24 + i * 0.16), y = -58 + i * 34;
        if (k <= 0) return;
        g.globalAlpha = k;
        rect(g, '#2a1c10', -96, y, 28, 28); G.drawPortrait(g, this.lookOf(id), -95, y + 1, 26);
        g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#2a3a5a'; g.fillText(nm, -60, y + 11);
        g.font = 'italic 9px Georgia, serif'; g.fillStyle = '#3a2410'; g.fillText(flaw, -60, y + 24);
        const u = seg(t, 0.2 + i * 0.16, 0.3 + i * 0.16); rect(g, '#c83030', -60, y + 26, Math.round(110 * u), 2);
        g.globalAlpha = 1;
      });
      g.restore();
      ell(g, rgba('#000000', 0.25), 286, 230, 18, 4);
      figure(g, look, 286, 230, 2, { s: 0.76 });
      const [px, py] = figAt(286, 230, 2 * 0.76, 14, 50), ty = -58 + Math.min(3, Math.floor(seg(t, 0.12, 0.8) * 4)) * 34 + 104 + 14;
      line(g, '#3a3036', 2, px, py, 228, ty);
      lighter(g, () => glow(g, 228, ty, 6, '#8ad0ff', 0.8));
    }

    cut_pela_weak(g, t, T, look) {
      const hit = seg(t, 0.62, 0.75);
      shake(g, T, hit > 0 && hit < 1 ? 4 : 0);
      plainBack(g, T, true);
      const freezeK = seg(t, 0.2, 0.4), tx = 236;
      toad(g, tx, 214, 0.8, T * (1 - freezeK), { gape: 0.3 });
      const scan = seg(t, 0.02, 0.3);
      lighter(g, () => { g.strokeStyle = rgba('#8ad0ff', 0.9 * (1 - freezeK * 0.5)); g.lineWidth = 1; const r = lerp(60, 26, eOut(scan)); g.beginPath(); g.arc(tx - 10, 164, r, 0, Math.PI * 2); g.stroke(); line(g, rgba('#8ad0ff', 0.9), 1, tx - 10 - r - 6, 164, tx - 10 + r + 6, 164); line(g, rgba('#8ad0ff', 0.9), 1, tx - 10, 164 - r - 6, tx - 10, 164 + r + 6); });
      if (freezeK > 0) {
        lighter(g, () => glow(g, tx - 4, 170, 70, '#a8e0ff', 0.5 * freezeK));
        for (let i = 0; i < 9; i++) { const x = tx - 50 + hx(i, 1, 39) * 90, y = 214 - hx(i, 2, 39) * 70, h = (10 + hx(i, 3, 39) * 16) * eOut(freezeK); poly(g, rgba('#d8f4ff', 0.85), [x - 4, y, x, y - h, x + 4, y]); }
        g.save(); g.globalAlpha = freezeK; rect(g, '#1a2a4a', tx - 54, 96, 92, 16); g.font = 'bold 8px Georgia, serif'; g.fillStyle = '#8ad0ff'; g.fillText('ЗАЩИТА −40%', tx - 48, 107); g.restore();
      }
      ell(g, rgba('#000000', 0.25), 52, 230, 18, 4);
      figure(g, look, 52, 230, 2, { s: 0.76 });
      const [px, py] = figAt(52, 230, 2 * 0.76, 36, 52);
      rect(g, '#2a2e38', px - 2, py - 8, 14, 10); rect(g, '#5ab0e8', px, py - 6, 10, 6);
      const dash = eOut(seg(t, 0.45, 0.62)), dx = lerp(-20, 150, dash), dark = this.lookOf('darkness'), u = 2 * 0.86, [sx, sy] = figAt(dx, 230, u, 37, 56);
      ell(g, rgba('#000000', 0.25), dx, 230, 22, 4);
      figure(g, dark, dx, 230, 2, { s: 0.86, rot: dash < 1 ? 0.12 : 0, v: hit > 0 ? { blush: true, mouth: 'open' } : null });
      const sw = seg(t, 0.55, 0.68);
      greatsword(g, sx, sy, lerp(-1.9, 1.4, eOut(sw)), 72);
      if (sw > 0 && sw < 1) smear(g, sx, sy, 76, -Math.PI / 2 - 1.9, -Math.PI / 2 + lerp(-1.9, 1.4, eOut(sw)), 1);
      if (hit > 0) {
        if (hit < 1) { lighter(g, () => glow(g, tx - 20, 170, 60, '#ffffff', 0.9 * (1 - hit))); K.shards(g, hit, tx - 20, 170, 16, 40, '#d8f4ff', 70, '#ffffff'); }
        g.save(); g.globalAlpha = seg(t, 0.68, 0.78); g.font = 'bold 16px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('ПОПАДАНИЕ!', 122, 72); g.fillStyle = '#ffd870'; g.fillText('ПОПАДАНИЕ!', 120, 70); g.restore();
        if (t > 0.8) bubble(g, 170, 22, 'Я попала?! Я правда попала!', seg(t, 0.8, 0.9), true);
      }
    }

    cut_himeko_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Химико', cls: 'навигатор?', stamp: 'БЫВАЛАЯ', stats: [['Сила', 0.52], ['Ловкость', 0.48], ['Магия', 0.74], ['Интеллект', 0.72]], big: ['Кофеин', '#7a4a22', '#f0c890'],
        fx: (g, a) => { for (let i = 0; i < 14; i++) { const ph = (T * 0.7 + hx(i, 1, 41)) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.5); g.translate(130 + hx(i, 2, 41) * 190, ph * 250 - 20); g.rotate(T * 3 + i); ell(g, '#5a3018', 0, 0, 4, 3); line(g, '#2a1408', 1, -3, 0, 3, 0); g.restore(); } }
      });
    }

    cut_himeko_blast(g, t, T, look) {
      const fire = seg(t, 0.42, 0.6), burnt = t > 0.6;
      shake(g, T, fire > 0 && t < 0.75 ? 3 : 0);
      plainBack(g, T, true);
      for (const [x, s, ph] of [[214, 0.5, 0], [256, 0.56, 1], [294, 0.48, 2]]) {
        g.save();
        if (burnt) { g.translate(x, 200); g.rotate(Math.PI); g.translate(-x, -200); }
        toad(g, x, burnt ? 170 : 214, s, T + ph, { gape: 0.2 });
        g.restore();
        if (burnt) for (let i = 0; i < 3; i++) { const q = (T * 0.6 + i / 3 + ph * 0.2) % 1; ell(g, rgba('#3a3036', 0.6 * (1 - q)), x + Math.sin(T + i) * 6, 170 - q * 50, 6 + q * 10, 4 + q * 6); }
      }
      ell(g, rgba('#000000', 0.25), 70, 228, 22, 4);
      figure(g, look, 70, 228, 2, { s: 0.9 });
      const open = eOut(seg(t, 0.1, 0.35));
      suitcase(g, 124, 226, 1.4, open, T);
      if (fire > 0) {
        const len = 200 * eOut(fire);
        lighter(g, () => { line(g, rgba('#ff8a3a', 0.9), 10, 146, 200, 146 + len, 190); line(g, rgba('#fff0c0', 1), 4, 146, 200, 146 + len, 190); glow(g, 146, 200, 24, '#ffb060', 0.9); });
        if (fire >= 1) blast2d(g, T, 254, 184, seg(t, 0.6, 1.1), '#ff8a3a');
      }
    }

    cut_himeko_coffee(g, t, T, look) {
      guildBack(g, T);
      const meg = this.lookOf('megumin'), kaz = this.lookOf('kazuma'), sip = seg(t, 0.5, 0.6);
      ell(g, rgba('#000000', 0.25), 160, 196, 20, 4);
      figure(g, look, 160, 196, 2, { s: 0.74 });
      rect(g, '#6a4226', 40, 196, 240, 8); rect(g, '#4a2e18', 40, 204, 240, 3);
      const pour = seg(t, 0.05, 0.45), [hx2, hy2] = figAt(160, 196, 2 * 0.74, 36, 52);
      coffeePot(g, hx2 + 10, hy2 - 2, pour > 0 && pour < 1 ? -0.6 : 0);
      if (pour > 0 && pour < 1) line(g, '#3a1a0a', 2, hx2 + 22, hy2 + 2, 214, 186);
      cup(g, 214, 194, 1.4, '#2a1408', T, 1);
      bust(g, meg, 50, LH + 4, 116, 1, { v: t > 0.6 ? { mouth: 'open' } : null, flip: true });
      bust(g, kaz, 268, LH + 4, 128, 1, { v: sip > 0 ? { closed: true, mouth: 'open' } : null });
      if (sip > 0) {
        lighter(g, () => glow(g, 268, 150, 50, '#8a5ad8', 0.3 * sip));
        for (let i = 0; i < 3; i++) { g.strokeStyle = rgba('#8a5ad8', 0.9 * sip); g.lineWidth = 2; g.beginPath(); for (let k = 0; k <= 8; k++) { const x = 236 + i * 14 + Math.sin(k + T * 10) * 2, y = 96 + k * 4; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.lineWidth = 1; }
        for (let i = 0; i < 3; i++) { const ph = (T * 1.5 + i / 3) % 1; ell(g, rgba('#bfe8ff', 1 - ph), 304 - i * 6, 128 + ph * 20, 2, 3); }
      }
      if (t > 0.7) { g.save(); g.globalAlpha = seg(t, 0.7, 0.8); g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('…', 76, 120); g.restore(); }
    }

    cut_himeko_purify(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a3a5a'], [1, '#1a2238']]);
      const aqua = this.lookOf('aqua'), clean = eOut(seg(t, 0.25, 0.6));
      bust(g, aqua, 54, LH + 4, 124, 1, { v: { mouth: 'open' }, flip: true });
      bust(g, look, 268, LH + 4, 124, 1, { v: clean >= 1 ? { mood: 'flat' } : null });
      const liquid = G.mix('#2a1408', '#8ad0ff', clean);
      cup(g, 160, 150, 4, liquid, T, 1 - clean);
      lighter(g, () => { glow(g, 160, 120, 60, '#8ad0ff', 0.5 * clean); g.strokeStyle = rgba('#d8f4ff', 0.8 * (1 - Math.abs(clean - 0.5) * 2)); g.lineWidth = 2; g.beginPath(); g.ellipse(160, 112, 30, 6, 0, T * 8, T * 8 + 4); g.stroke(); g.lineWidth = 1; });
      const reach = eOut(seg(t, 0, 0.25));
      lighter(g, () => glow(g, lerp(80, 126, reach), lerp(140, 108, reach), 14, '#8ad0ff', 0.9));
      const hx3 = lerp(80, 126, reach), hy3 = lerp(140, 108, reach);
      line(g, '#f4f6fa', 10, 70, 240, hx3 - 8, hy3 + 6); line(g, '#2a4ab8', 3, hx3 - 12, hy3 + 10, hx3 - 6, hy3 + 4);
      ell(g, '#f6dcc6', hx3, hy3, 6, 5);
      if (clean > 0) for (let i = 0; i < 10; i++) { const ph = (T * 0.9 + i / 10) % 1; star4(g, 120 + hx(i, 2, 42) * 80, 120 - ph * 70, 2.5, '#ffffff', clean * (1 - ph)); }
      if (t > 0.72) bubble(g, 246, 40, 'Это была моя лучшая обжарка…', seg(t, 0.72, 0.84), true);
    }

    cut_welt_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Вельт Янг', cls: 'аниматор?', stamp: 'ВЕТЕРАН', stats: [['Сила', 0.58], ['Ловкость', 0.4], ['Магия', 0.76], ['Интеллект', 0.74]], big: ['Опыт', '#c8a020', '#fff0b0'],
        fx: (g, a) => { for (let i = 0; i < 8; i++) { const ph = (T * 0.6 + i / 8) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.6); g.translate(140 + hx(i, 2, 43) * 170, ph * 250 - 20); g.rotate(Math.sin(T * 2 + i) * 0.5); rect(g, '#f4f0e4', -10, -7, 20, 14); g.strokeStyle = '#3a3036'; g.lineWidth = 1; g.beginPath(); g.arc(-2, 0, 4, 0, Math.PI * 2); g.moveTo(-2, 4); g.lineTo(-2, 9); g.stroke(); rect(g, '#8a8a90', 3, -3, 5, 1); rect(g, '#8a8a90', 3, 0, 5, 1); g.restore(); } }
      });
    }

    cut_welt_gravity(g, t, T, look) {
      const pull = seg(t, 0.3, 0.75), crush = seg(t, 0.75, 0.9);
      shake(g, T, crush > 0 && crush < 1 ? 4 : 0);
      plainBack(g, T, true);
      const cx = 248, cy = 92, r = lerp(4, 30, eOut(seg(t, 0.15, 0.4))) * (1 - crush);
      lighter(g, () => { glow(g, cx, cy, r * 3, '#8a5ad8', 0.5); for (let i = 0; i < 3; i++) { g.strokeStyle = rgba(i % 2 ? '#e8c040' : '#b48cff', 0.8); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, r * (1.4 + i * 0.4), r * (0.4 + i * 0.12), 0.3, T * (3 + i) , T * (3 + i) + 4.5); g.stroke(); } g.lineWidth = 1; });
      if (r > 0) ell(g, '#08040e', cx, cy, r, r);
      for (const [x, s, ph] of [[204, 0.46, 0], [252, 0.52, 1], [292, 0.44, 2]]) {
        const k = eIn(pull);
        if (k >= 1) continue;
        g.save(); const tx = lerp(x, cx, k), ty = lerp(214, cy + 20, k); g.translate(tx, ty); g.rotate(k * (3 + ph)); g.scale(1 - k * 0.7, 1 - k * 0.7); g.translate(-tx, -ty);
        toad(g, tx, ty, s, T + ph, { gape: 0.5 });
        g.restore();
      }
      if (crush > 0 && crush < 1) lighter(g, () => { glow(g, cx, cy, 60 * crush, '#ffffff', 1 - crush); ring(g, rgba('#e8c040', 1 - crush), 2, cx, cy, 10 + 90 * crush); });
      ell(g, rgba('#000000', 0.25), 72, 228, 22, 4);
      figure(g, look, 72, 228, 2, { s: 0.9 });
      const [hx2, hy2] = figAt(72, 228, 2 * 0.9, 37, 54), up = eOut(seg(t, 0.05, 0.25));
      const ca = lerp(0.2, 0.75, up);
      g.save(); g.translate(hx2, hy2); g.rotate(ca); rect(g, '#2a2228', -1.5, -54, 3, 58); ell(g, '#e8c040', 0, -56, 4, 4); g.restore();
      if (up >= 1) lighter(g, () => { const tx = hx2 + Math.sin(ca) * 56, ty = hy2 - Math.cos(ca) * 56; glow(g, tx, ty, 10 + 3 * Math.sin(T * 12), '#e8c040', 0.8); line(g, rgba('#e8c040', 0.35), 1, tx, ty, cx, cy); });
    }

    cut_welt_back(g, t, T, look) {
      hillBack(g, T);
      const meg = this.lookOf('megumin'), fall = eOut(seg(t, 0.05, 0.3));
      figure(g, meg, 250, 202, 2, { s: 0.66, rot: -Math.PI / 2 });
      figure(g, look, lerp(130, 136, fall), lerp(228, 204, fall), 2, { s: 0.7, rot: -fall * Math.PI / 2, v: fall >= 1 ? { closed: true } : null });
      if (fall >= 1) {
        const crack = seg(t, 0.3, 0.45);
        lighter(g, () => { for (let i = 0; i < 3; i++) { g.strokeStyle = rgba('#ffe060', crack * (0.6 + 0.4 * Math.sin(T * 20 + i))); g.lineWidth = 2; g.beginPath(); g.moveTo(96 + i * 10, 178); g.lineTo(100 + i * 10, 170); g.lineTo(94 + i * 10, 164); g.lineTo(98 + i * 10, 156); g.stroke(); } g.lineWidth = 1; });
        if (t > 0.35) { g.save(); g.globalAlpha = seg(t, 0.35, 0.45); g.font = 'bold 11px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('Хрусь!', 89, 151); g.fillStyle = '#ffffff'; g.fillText('Хрусь!', 88, 150); g.restore(); }
        for (let i = 0; i < 4; i++) { const ph = seg(t, 0.05, 0.4); ell(g, rgba('#c8b890', 0.6 * (1 - ph)), 100 + (i - 2) * 16 * (1 + ph), 222 - ph * 10, 6, 3); }
      }
    }

    cut_welt_heal(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a1438'], [0.6, '#6a3a4a'], [1, '#3a2a1a']]);
      const aqua = this.lookOf('aqua'), heal = seg(t, 0.1, 0.5);
      bust(g, aqua, 60, LH + 4, 126, 1, { v: { mouth: 'open' }, flip: true });
      bust(g, look, 252, LH + 6, 132, 1, { v: heal >= 1 ? { mouth: 'open' } : { closed: true } });
      lighter(g, () => { glow(g, 240, 160, 80 * heal, '#8ad0ff', 0.45); for (let i = 0; i < 14; i++) { const ph = (T * 0.9 + i / 14) % 1; star4(g, 190 + hx(i, 2, 44) * 110, 230 - ph * 160, 2.5, '#d8f4ff', heal * (1 - ph)); } });
      lighter(g, () => { for (let i = 0; i < 9; i++) { const q = (T * 1.4 + i / 9) % 1; star4(g, lerp(104, 214, q), 150 + Math.sin(q * 9 + T * 4) * 8, 3, '#d8f4ff', heal * (1 - Math.abs(q - 0.5))); } glow(g, 104, 150, 18 + 4 * Math.sin(T * 10), '#8ad0ff', 0.8 * heal); });
      if (t > 0.62) bubble(g, 238, 44, 'Мне не так уж много лет…', seg(t, 0.62, 0.74), true);
    }

    cut_bronya_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Броня Рэнд', cls: 'паладин?', stamp: 'ЗНАТЬ', stats: [['Сила', 0.56], ['Ловкость', 0.62], ['Магия', 0.5], ['Интеллект', 0.7]], big: ['Долг', '#2a5ab8', '#d8e8ff'],
        fx: (g, a) => { for (let i = 0; i < 16; i++) { const ph = (T * 0.25 + hx(i, 1, 45)) % 1; rect(g, rgba('#ffffff', a * 0.9), Math.round(130 + hx(i, 2, 45) * 190 + Math.sin(T + i) * 6), Math.round(ph * 250 - 10), 2, 2); } }
      });
    }

    silverBanner(g, x, y, T, s) {
      const w = Math.sin(T * 3 + x) * 2;
      g.save(); g.translate(x, y); g.scale(s || 1, s || 1);
      rect(g, '#5a4a3a', -1, -4, 2, 44);
      poly(g, '#2d5bd3', [1, -2, 22, 0 + w, 22, 34 + w, 12, 28, 1, 34]); poly(g, '#d8b050', [11, 6 + w * 0.5, 15, 13 + w * 0.5, 11, 20 + w * 0.5, 7, 13 + w * 0.5]); rect(g, '#ffffff', 10, 11 + w * 0.5, 2, 4);
      g.restore();
    }

    cut_bronya_speech(g, t, T, look) {
      guildBack(g, T);
      this.silverBanner(g, 96, 100, T, 1.4); this.silverBanner(g, 206, 100, T, 1.4);
      rect(g, '#6a4226', 128, 184, 64, 20); rect(g, '#8a5a34', 128, 184, 64, 3); rect(g, '#4a2e18', 158, 186, 2, 18);
      figure(g, look, 160, 186, 2, { s: 0.8, v: { mouth: 'open' } });
      if (t > 0.45) { const ph = (T * 1.5) % 1; ell(g, rgba('#bfe8ff', 1 - ph), 186, 64 + ph * 12, 2, 3); }
      for (let i = 0; i < 14; i++) {
        const x = 10 + i * 23, y = 226, sleepy = i % 3 !== 1;
        ell(g, '#120a08', x, y, 10, 9); rect(g, '#120a08', x - 9, y, 18, 24);
        if (i % 3 === 1) { rect(g, '#d8c8a0', x + 6, y - 16, 7, 9); rect(g, '#fff8e0', x + 6, y - 18, 7, 3); }
        if (sleepy && t > 0.35) { const ph = (T * 0.7 + i * 0.13) % 1; g.save(); g.globalAlpha = seg(t, 0.35, 0.5) * (1 - ph); g.font = 'bold ' + (7 + Math.round(ph * 5)) + 'px Georgia, serif'; g.fillStyle = '#d8e8ff'; g.fillText('z', x + 4 + ph * 8, y - 12 - ph * 22); g.restore(); }
      }
    }

    cut_bronya_lalatina(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a3a6a'], [1, '#14182a']]);
      lighter(g, () => { for (let i = 0; i < 6; i++) poly(g, rgba('#d8e8ff', 0.06), [40 + i * 50, 0, 60 + i * 50, 0, 30 + i * 50, LH, 10 + i * 50, LH]); });
      const dark = this.lookOf('darkness'), red = seg(t, 0.35, 0.5);
      bust(g, look, 66, LH + 4, 130, 1, { flip: true });
      bust(g, dark, 256, LH + 4, 130, 1, { v: red > 0 ? { blush: true, mouth: 'open' } : null });
      if (red > 0) {
        lighter(g, () => glow(g, 256, 140, 50, '#ff6a8a', 0.4 * red));
        for (let i = 0; i < 3; i++) { const ph = (T * 1.2 + i / 3) % 1; ell(g, rgba('#ffffff', 0.6 * (1 - ph)), 236 + i * 20, 100 - ph * 30, 5 + ph * 6, 3 + ph * 4); }
        anger(g, 296, 104, 2, red);
      }
      if (t < 0.4) bubble(g, 160, 40, 'Рада знакомству, леди Дастинесс Форд Лалатина.', seg(t, 0.05, 0.15), true);
    }

    cut_bronya_order(g, t, T, look) {
      const boom = seg(t, 0.5, 0.95), slash = seg(t, 0.4, 0.55);
      shake(g, T, boom > 0 && boom < 0.4 ? 4 : 0);
      plainBack(g, T, true);
      const rally = eOut(seg(t, 0.05, 0.3));
      lighter(g, () => { g.strokeStyle = rgba('#6ae0a8', 0.8 * rally); g.lineWidth = 2; g.beginPath(); g.ellipse(150, 226, 110 * rally, 14 * rally, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; for (let i = 0; i < 12; i++) { const ph = (T * 1.6 + i / 12) % 1; line(g, rgba('#c8ffe0', rally * (1 - ph)), 1, 60 + i * 18, 230 - ph * 80, 64 + i * 18, 220 - ph * 80); } });
      if (boom <= 0) toad(g, 278, 214, 0.62, T, { gape: 0.4 }); else blast2d(g, T, 278, 170, boom, '#ff8a3a');
      const party = [['aqua', 104, 0.74], ['megumin', 150, 0.74], ['darkness', 200, 0.8]];
      for (const [id, x, s] of party) { ell(g, rgba('#000000', 0.25), x, 228, 16, 3); figure(g, this.lookOf(id), x + (id === 'darkness' ? eOut(slash) * 30 : 0), 228, 2, { s, v: { mouth: 'open' } }); }
      if (slash > 0 && slash < 1) smear(g, 250, 170, 50, -2.4, lerp(-2.4, 1, slash), 1);
      ell(g, rgba('#000000', 0.25), 44, 230, 18, 4);
      figure(g, look, 44, 230, 2, { s: 0.82 });
      if (t > 0.72) bubble(g, 160, 30, 'Погодите… всё прошло по плану?!', seg(t, 0.72, 0.84), true);
    }

    cut_gepard_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Гепард Ландау', cls: 'крестоносец', stamp: 'ЧЕСТЬ', stats: [['Сила', 0.7], ['Ловкость', 0.36], ['Магия', 0.3], ['Интеллект', 0.5]], big: ['Защита', '#3a90d8', '#e0f4ff'],
        fx: (g, a) => K.hexShield(g, 286, 196, 34, 0.8 * a, T, '#a8e0ff')
      });
    }

    cut_gepard_shield(g, t, T, look) {
      cabbageField(g, T);
      const dark = this.lookOf('darkness'), sh = eOut(seg(t, 0.05, 0.25)), gx = 140;
      ell(g, rgba('#000000', 0.25), 56, 230, 16, 3);
      figure(g, dark, 56, 230, 2, { s: 0.72, v: t > 0.5 ? { mouth: 'open', blush: true } : null });
      ell(g, rgba('#000000', 0.25), gx, 230, 22, 4);
      figure(g, look, gx, 230, 2, { s: 0.9 });
      K.hexShield(g, gx + 40, 160, 70, 0.9 * sh, T, '#a8e0ff');
      for (let i = 0; i < 10; i++) {
        const ph = ((T * 1.1 + hx(i, 1, 47)) % 1), y = 90 + hx(i, 2, 47) * 120, hitX = gx + 96;
        if (ph < 0.6) cabbage(g, lerp(LW + 20, hitX, ph / 0.6), y, 1.4, T * 5 + i);
        else { const q = (ph - 0.6) / 0.4; cabbage(g, hitX + q * 50, y - Math.sin(q * Math.PI) * 30, 1.4, T * 5 + i); if (q < 0.3) lighter(g, () => glow(g, hitX, y, 14, '#d8f4ff', 0.9 * (1 - q / 0.3))); }
      }
      if (t > 0.55) bubble(g, 92, 60, 'Это должны были быть мои удары!', seg(t, 0.55, 0.67), true);
    }

    cut_gepard_garden(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#3a4a5a'], [1, '#1a2230']]);
      rect(g, '#2a3644', 220, 30, 70, 90); rect(g, '#8ab8d8', 224, 34, 62, 82); rect(g, '#2a3644', 254, 34, 2, 82); rect(g, '#2a3644', 224, 74, 62, 2);
      for (let i = 0; i < 10; i++) { const ph = (T * 0.3 + hx(i, 1, 48)) % 1; rect(g, '#ffffff', Math.round(226 + hx(i, 2, 48) * 58), Math.round(36 + ph * 78), 1, 1); }
      rect(g, '#5a4a3a', 0, 190, LW, 50); rect(g, '#6a5a48', 0, 190, LW, 3);
      bust(g, look, 74, LH + 6, 140, 1, { flip: true, v: t > 0.5 ? { mouth: 'open' } : null });
      const droop = seg(t, 0.2, 0.7), pour = seg(t, 0.15, 0.6);
      flower(g, 196, 192, 2.2, 0, droop);
      if (pour > 0 && pour < 1) { g.save(); g.translate(228, 120); g.rotate(-0.5); rect(g, '#7a8a98', -12, -8, 24, 16); poly(g, '#7a8a98', [-12, -4, -30, 6, -30, 9, -12, 2]); g.restore(); for (let i = 0; i < 6; i++) { const ph = (T * 2 + i / 6) % 1; ell(g, rgba('#8ad0ff', 1 - ph), 200 + Math.sin(i) * 4, 128 + ph * 40, 1.4, 2.4); } }
      if (t > 0.6) { const ph = (T * 1.5) % 1; ell(g, rgba('#bfe8ff', 1 - ph), 116, 96 + ph * 12, 2, 3); }
    }

    cut_gepard_bloom(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#3a5a8a'], [1, '#1a2a44']]);
      rect(g, '#5a4a3a', 0, 190, LW, 50); rect(g, '#6a5a48', 0, 190, LW, 3);
      const aqua = this.lookOf('aqua'), grow = eOut(seg(t, 0.25, 0.65));
      bust(g, look, 66, LH + 6, 134, 1, { flip: true, v: grow > 0.5 ? { mouth: 'open' } : null });
      bust(g, aqua, 262, LH + 4, 128, 1, { v: { mouth: 'open' } });
      for (const [fx, dir] of [[214, -1], [298, 1]]) {
        g.save(); g.translate(fx, 140); g.rotate(dir * 0.5); poly(g, '#f2bcd8', [0, 0, -12, -10, -4, -15, 4, -15, 12, -10]); for (let i = -2; i <= 2; i++) line(g, '#c87aa8', 1, 0, 0, i * 4.5, -13); g.restore();
        for (let i = 0; i < 8; i++) { const ph = (T * 1.4 + i / 8) % 1; ell(g, rgba('#bfe8ff', 0.9 * (1 - ph)), fx + dir * -(ph * 60), 126 - Math.sin(ph * Math.PI) * 30 + ph * 40, 1.6, 2.4); }
      }
      flower(g, 160, 192, 2.2, grow, 1 - grow);
      if (grow >= 1) for (let i = 0; i < 16; i++) { const q = seg(t, 0.65, 1), a = i / 16 * Math.PI * 2; ell(g, rgba(i % 2 ? '#f8a8c8' : '#ffffff', 1 - q), 160 + Math.cos(a) * q * 90, 110 + Math.sin(a) * q * 50 + q * q * 30, 3, 2, a); }
    }

    cut_clara_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Клара', cls: 'укротитель?', stamp: 'С РОБОТОМ', stats: [['Сила', 0.24], ['Ловкость', 0.4], ['Магия', 0.2], ['Интеллект', 0.6]], big: ['Семья', '#c83a5a', '#ffd0d8'],
        fx: (g, a) => { lighter(g, () => { for (const x of [138, 168]) { glow(g, x, 30, 12 + 2 * Math.sin(T * 6), '#ff2e8e', 0.9 * a); ell(g, rgba('#ff8ac0', a), x, 30, 4, 2); } }); }
      });
    }

    svarogHud(g, T, txt, col, a) {
      if (a <= 0) return;
      g.save(); g.globalAlpha = a;
      rect(g, rgba('#0a0a14', 0.7), 14, 14, 172, 22); g.strokeStyle = col; g.strokeRect(14.5, 14.5, 171, 21);
      g.font = 'bold 9px Georgia, serif'; g.fillStyle = col; g.fillText(txt, 22, 29);
      g.restore();
    }

    cut_clara_brave(g, t, T, look) {
      const smash = seg(t, 0.55, 0.65);
      shake(g, T, smash > 0 && t < 0.8 ? 5 : 0);
      plainBack(g, T, true);
      const tx = lerp(LW + 40, 240, eOut(seg(t, 0, 0.4)));
      g.save();
      if (smash > 0) { g.translate(tx, 214); g.scale(1 + smash * 0.3, 1 - smash * 0.6); g.translate(-tx, -214); }
      toad(g, tx, 214, 0.8, T, { gape: 0.5 });
      g.restore();
      const fy = lerp(-120, 140, eIn(seg(t, 0.4, 0.58)));
      if (t > 0.4) {
        rect(g, '#2e3048', tx - 16, fy - 200, 32, 160); for (let i = 0; i < 4; i++) { rect(g, '#4a4c6a', tx - 20, fy - 190 + i * 38, 40, 8); rect(g, '#ff2e8e', tx - 3, fy - 187 + i * 38, 6, 2); }
        rect(g, '#3a3c5a', tx - 24, fy - 48, 48, 14);
        poly(g, '#4a4c8a', [tx - 38, fy - 36, tx + 38, fy - 36, tx + 44, fy, tx + 34, fy + 18, tx - 34, fy + 18, tx - 44, fy]);
        poly(g, '#5a5ca0', [tx - 38, fy - 36, tx + 38, fy - 36, tx + 34, fy - 26, tx - 34, fy - 26]);
        for (let i = 0; i < 4; i++) { ell(g, '#5a5ca0', tx - 27 + i * 18, fy + 14, 8, 6); rect(g, '#2a2c40', tx - 19 + i * 18, fy + 6, 1, 12); }
        lighter(g, () => glow(g, tx, fy - 10, 14, '#ff2e8e', 0.7)); ell(g, '#ff6ab0', tx, fy - 10, 4, 4);
      }
      if (smash > 0 && smash < 1) { lighter(g, () => glow(g, tx, 200, 80, '#ffffff', 0.9 * (1 - smash))); K.shards(g, smash, tx, 210, 20, 49, '#c8b890', 70, '#ffffff'); }
      ell(g, rgba('#000000', 0.25), 90, 230, 18, 4);
      figure(g, look, 90 + (t < 0.6 ? Math.sin(T * 40) * 1.5 : 0), 230, 2, { s: 0.74, v: t > 0.65 ? { mouth: 'open' } : null });
      if (t < 0.55) for (let i = 0; i < 3; i++) { const ph = (T * 2 + i / 3) % 1; ell(g, rgba('#bfe8ff', 1 - ph), 110 + i * 4, 112 + ph * 14, 1.5, 2.5); }
    }

    cut_clara_steal(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#14101e'], [1, '#2a1a24']]);
      const sv = this.lookOf('svarog'), kaz = this.lookOf('kazuma'), grab = seg(t, 0.1, 0.3), alarm = seg(t, 0.4, 0.5);
      bust(g, sv, 236, LH + 10, 190, 1);
      lighter(g, () => glow(g, 236, 110, 70, alarm > 0 ? '#ff2040' : '#ff2e8e', 0.3 + 0.3 * alarm));
      bust(g, kaz, 70, LH + 4, 136, 1, { v: alarm > 0 ? { mouth: 'open' } : null });
      lighter(g, () => glow(g, 132, 130, 20 + 4 * Math.sin(T * 10), '#9affb0', 0.7 * (1 - alarm)));
      if (grab > 0) { g.save(); g.translate(lerp(200, 130, eOut(grab)), lerp(150, 128, eOut(grab))); g.rotate(T * 4); rect(g, '#a8acb4', -5, -2, 10, 4); rect(g, '#8a8e98', -2, -5, 4, 10); g.restore(); }
      if (alarm > 0) {
        lighter(g, () => { g.strokeStyle = rgba('#ff3040', alarm); g.lineWidth = 2; const r = 26 + 4 * Math.sin(T * 12); g.beginPath(); g.arc(70, 150, r, 0, Math.PI * 2); g.stroke(); line(g, rgba('#ff3040', alarm), 1, 70 - r - 10, 150, 70 + r + 10, 150); line(g, rgba('#ff3040', alarm), 1, 70, 150 - r - 10, 70, 150 + r + 10); g.lineWidth = 1; });
        this.svarogHud(g, T, 'ИНДЕКС УГРОЗЫ: ПОВЫШЕН', '#ff5060', alarm * (0.7 + 0.3 * Math.sin(T * 14)));
        for (let i = 0; i < 3; i++) { const ph = (T * 2 + i / 3) % 1; ell(g, rgba('#bfe8ff', 1 - ph), 112 + i * 5, 96 + ph * 16, 1.6, 2.6); }
      }
    }

    cut_clara_family(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#14101e'], [1, '#2a1a24']]);
      const sv = this.lookOf('svarog'), kaz = this.lookOf('kazuma'), calm = seg(t, 0.45, 0.6);
      bust(g, sv, 250, LH + 10, 180, 1);
      lighter(g, () => glow(g, 250, 110, 60, calm > 0 ? '#5ab0ff' : '#ff2040', 0.35));
      bust(g, kaz, 56, LH + 4, 124, 1, { v: { mouth: 'open' } });
      const run = eOut(seg(t, 0, 0.3));
      ell(g, rgba('#000000', 0.3), lerp(-20, 156, run), 232, 18, 4);
      figure(g, look, lerp(-20, 156, run), 232, 2, { s: 0.86, v: { mouth: 'open' } });
      this.svarogHud(g, T, calm > 0 ? 'ИНДЕКС УГРОЗЫ: ПОНИЖЕН' : 'ИНДЕКС УГРОЗЫ: ПОВЫШЕН', calm > 0 ? '#6ac8ff' : '#ff5060', 1);
      if (calm > 0) for (let i = 0; i < 5; i++) { const ph = (T * 0.7 + i / 5) % 1; heart(g, 120 + i * 20, 120 - ph * 40, 3, (1 - ph) * calm); }
    }

    cut_yanqing_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Яньцин', cls: 'мечник', stamp: 'ВУНДЕРКИНД', stats: [['Сила', 0.6], ['Ловкость', 0.78], ['Магия', 0.36], ['Интеллект', 0.44]], big: ['Мечи', '#3a90d8', '#e0f4ff'],
        fx: (g, a) => { g.save(); g.globalAlpha = a; for (let i = 0; i < 8; i++) { const ang = T * 2 + i / 8 * Math.PI * 2; iceSword(g, 250 + Math.cos(ang) * 50, 170 + Math.sin(ang) * 22, ang + Math.PI / 2, 22); } g.restore(); }
      });
    }

    cut_yanqing_swords(g, t, T, look) {
      plainBack(g, T, true);
      const fly = seg(t, 0.35, 0.7), cut = t > 0.7;
      for (const [x, s, ph] of [[208, 0.48, 0], [254, 0.54, 1], [296, 0.46, 2]]) {
        if (!cut) toad(g, x, 214, s, T + ph, { gape: 0.3 });
        else {
          const q = seg(t, 0.7, 1);
          g.save(); g.beginPath(); g.rect(0, 0, LW, 214 - 40 * s); g.clip(); g.translate(q * 10, -q * 6); toad(g, x, 214, s, T * 0, {}); g.restore();
          g.save(); g.beginPath(); g.rect(0, 214 - 40 * s, LW, 60); g.clip(); toad(g, x, 214, s, T * 0, {}); g.restore();
          lighter(g, () => glow(g, x - 6, 214 - 40 * s, 30 * (1 - q), '#d8f4ff', 0.9));
          for (let i = 0; i < 4; i++) { const h = 8 + 6 * hx(i, ph, 51); poly(g, rgba('#d8f4ff', 0.85), [x - 30 + i * 18 - 3, 214, x - 30 + i * 18, 214 - h, x - 30 + i * 18 + 3, 214]); }
        }
      }
      ell(g, rgba('#000000', 0.25), 80, 230, 20, 4);
      figure(g, look, 80, 230, 2, { s: 0.86, v: fly > 0 ? { mouth: 'open' } : null });
      for (let i = 0; i < 6; i++) {
        const orbit = T * 3 + i / 6 * Math.PI * 2, ox = 80 + Math.cos(orbit) * 40, oy = 150 + Math.sin(orbit) * 14;
        const k = eIn(seg(fly, i * 0.08, 0.5 + i * 0.08)), tx = 200 + (i % 3) * 46, ty = 180;
        const x = lerp(ox, tx + 40, k), y = lerp(oy, ty - 10, k), ang = k > 0 ? Math.atan2(ty - oy, tx - ox) + Math.PI / 2 : orbit + Math.PI / 2;
        if (k < 1) { iceSword(g, x, y, ang, 26); if (k > 0) lighter(g, () => line(g, rgba('#a8e0ff', 0.5), 2, ox, oy, x, y)); }
      }
      if (cut) for (let i = 0; i < 3; i++) smear(g, 208 + i * 46, 196, 40, -2.6, lerp(-2.6, 0.4, seg(t, 0.7, 0.85)), 1 - seg(t, 0.85, 1));
    }

    cut_yanqing_name(g, t, T, look) {
      guildBack(g, T);
      const meg = this.lookOf('megumin'), kaz = this.lookOf('kazuma');
      bust(g, look, 252, LH + 6, 132, 1, { v: t > 0.55 ? { mouth: 'open' } : null });
      bust(g, meg, 62, LH + 4, 124, 1, { v: { mouth: 'open' }, flip: true });
      g.save(); g.translate(162, 118); g.rotate(-0.25);
      rect(g, '#2a2228', -3, 22, 6, 22); rect(g, '#c8a040', -9, 18, 18, 4); poly(g, '#d8dce4', [-3, 18, 3, 18, 3, -40, 0, -48, -3, -40]); line(g, '#ffffff', 1, -1, 16, -1, -40);
      g.restore();
      lighter(g, () => glow(g, 162, 100, 26, '#ffffff', 0.25));
      const tag = eOut(seg(t, 0.15, 0.35));
      if (tag > 0) { g.save(); g.translate(170, 70); g.rotate(0.08); g.scale(lerp(1.5, 1, tag), lerp(1.5, 1, tag)); g.globalAlpha = tag; rect(g, '#f2eadc', -44, -12, 88, 20); rect(g, '#c83030', -44, -12, 88, 3); g.font = 'bold 11px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#3a2410'; g.fillText('ЧУНЧУНМАРУ', 0, 4); g.textAlign = 'left'; g.restore(); }
      if (t > 0.55) { bubble(g, 252, 30, 'Только не мой меч!!', seg(t, 0.55, 0.66), true); for (let i = 0; i < 3; i++) { const ph = (T * 2 + i / 3) % 1; ell(g, rgba('#bfe8ff', 1 - ph), 296 + i * 4, 104 + ph * 14, 1.6, 2.6); } }
    }

    cut_yanqing_spar(g, t, T, look) {
      cabbageField(g, T);
      const dark = this.lookOf('darkness'), tired = seg(t, 0.6, 0.75), hits = [0.1, 0.25, 0.4, 0.55];
      ell(g, rgba('#000000', 0.25), 206, 230, 22, 4);
      rimFigure(g, dark, 206, 230, 2, '#ffd870', { s: 0.9, v: { blush: true, mouth: 'open' } });
      hits.forEach((h, i) => { const q = seg(t, h, h + 0.12); if (q > 0 && q < 1) { smear(g, 200, 150 + i * 8, 46, -2.8 + i * 0.3, lerp(-2.8, 0.6, q) + i * 0.3, 1 - q * 0.4); lighter(g, () => glow(g, 206, 150 + i * 8, 20, '#d8f4ff', 0.8 * (1 - q))); } });
      if (t > 0.3) for (let i = 0; i < 4; i++) { const ph = (T * 0.8 + i / 4) % 1; heart(g, 232 + i * 10, 120 - ph * 40, 3, 1 - ph); }
      const yx = lerp(140, 104, tired);
      ell(g, rgba('#000000', 0.25), yx, 230, 18, 4);
      figure(g, look, yx, 230 + tired * 4, 2, { s: 0.82, rot: tired * -0.15, v: tired > 0 ? { mouth: 'open', closed: true } : { mouth: 'open' } });
      if (tired > 0) { for (let i = 0; i < 3; i++) { const ph = (T * 1.6 + i / 3) % 1; ell(g, rgba('#ffffff', 0.6 * (1 - ph)), 96 + i * 6, 96 - ph * 20, 3 + ph * 3, 2 + ph * 2); } bubble(g, 110, 40, 'Она… не падает?!', seg(t, 0.62, 0.74), true); }
    }

    cut_bailu_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Байлу', cls: 'целитель?', stamp: 'СТАРЕЙШИНА', stats: [['Сила', 0.2], ['Ловкость', 0.4], ['Магия', 0.7], ['Интеллект', 0.68]], big: ['Возраст', '#8a5ad8', '#f0e0ff'],
        fx: (g, a) => { for (let i = 0; i < 12; i++) { const ph = (T * 0.7 + hx(i, 1, 52)) % 1; candy(g, 130 + hx(i, 2, 52) * 190, ph * 250 - 20, 1.2, T * 3 + i, a); } }
      });
    }

    cut_bailu_heal(g, t, T, look) {
      plainBack(g, T, true);
      const up = t > 0.72, heal = seg(t, 0.25, 0.7), kaz = this.lookOf('kazuma'), meg = this.lookOf('megumin'), dark = this.lookOf('darkness');
      if (up) { figure(g, kaz, 46, 230, 2, { s: 0.74, v: { mouth: 'open' } }); figure(g, meg, 92, 230, 2, { s: 0.7, v: { mouth: 'open' } }); }
      else { figure(g, kaz, 128, 186, 2, { s: 0.66, rot: -Math.PI / 2, v: { closed: true } }); figure(g, meg, 124, 208, 2, { s: 0.58, rot: -Math.PI / 2 }); }
      ell(g, rgba('#000000', 0.25), 150, 230, 18, 4);
      figure(g, dark, 150, 230, 2, { s: 0.8, v: { blush: true } });
      ell(g, rgba('#000000', 0.25), 250, 230, 16, 3);
      figure(g, look, 250, 230, 2, { s: 0.66, v: { mouth: 'open' } });
      const [gx, gy] = figAt(250, 230, 2 * 0.66, 12, 54);
      gourd(g, gx - 4, gy, 1.4, -0.5 - heal * 0.8);
      if (heal > 0) {
        lighter(g, () => {
          g.strokeStyle = rgba('#8ad0ff', 0.8); g.lineWidth = 6; g.beginPath();
          for (let k = 0; k <= 24; k++) { const q = k / 24 * heal, x = lerp(gx - 10, 40, q), y = 120 - Math.sin(q * Math.PI) * 70 + Math.sin(q * 12 + T * 6) * 8; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
          g.stroke(); g.lineWidth = 2; g.strokeStyle = rgba('#ffffff', 0.8); g.stroke(); g.lineWidth = 1;
          glow(g, 110, 150, 100 * heal, '#8affd8', 0.3);
        });
        for (let i = 0; i < 24; i++) { const ph = (T * 1.4 + hx(i, 1, 53)) % 1; ell(g, rgba('#bfe8ff', 0.9 * heal * (1 - ph)), 30 + hx(i, 2, 53) * 170, 70 + ph * 150, 1.4, 2.6); }
        for (let i = 0; i < 8; i++) { const ph = (T * 0.8 + i / 8) % 1; star4(g, 40 + hx(i, 3, 53) * 150, 220 - ph * 100, 3, '#c8ffe8', heal * (1 - ph)); }
      }
    }

    cut_bailu_candy(g, t, T, look) {
      guildBack(g, T);
      const aqua = this.lookOf('aqua'), give = eOut(seg(t, 0.15, 0.4)), mad = seg(t, 0.5, 0.6);
      rect(g, '#d8c8a0', 214, 60, 10, 170); for (let i = 0; i < 9; i++) { rect(g, '#5a4028', 214, 70 + i * 18, i % 2 ? 6 : 10, 1); } g.font = 'bold 7px Georgia, serif'; g.fillStyle = '#5a4028'; g.fillText('150', 226, 103); g.fillText('120', 226, 157);
      ell(g, rgba('#000000', 0.25), 110, 230, 20, 4);
      figure(g, aqua, 110, 230, 2, { s: 0.86, v: { mouth: 'open' } });
      ell(g, rgba('#000000', 0.25), 196, 230, 16, 3);
      figure(g, look, 196, 230, 2, { s: 0.6, v: mad > 0 ? { mouth: 'open' } : null });
      candy(g, lerp(136, 172, give), lerp(150, 168, give), 2, Math.sin(T * 4) * 0.2, 1);
      if (mad > 0) { anger(g, 214, 128, 2, mad); for (let i = 0; i < 3; i++) { const ph = (T * 1.4 + i / 3) % 1; ell(g, rgba('#ffffff', 0.6 * (1 - ph)), 186 + i * 10, 120 - ph * 20, 3 + ph * 4, 2 + ph * 3); } bubble(g, 200, 40, 'Мне сотни лет, вообще-то!', seg(t, 0.55, 0.67), true); }
    }

    cut_bailu_board(g, t, T, look) {
      guildBack(g, T);
      rect(g, '#5a3a20', 104, 20, 112, 70); rect(g, '#b48a5a', 108, 24, 104, 62);
      for (let i = 0; i < 6; i++) { const nx = 112 + (i % 3) * 34, ny = 28 + Math.floor(i / 3) * 30; rect(g, i % 2 ? '#e8dcc0' : '#d8ccaa', nx, ny, 26, 26); rect(g, '#b83030', nx + 11, ny, 3, 3); for (let l = 0; l < 3; l++) rect(g, rgba('#5a4028', 0.6), nx + 4, ny + 8 + l * 5, 18, 1); }
      const dark = this.lookOf('darkness'), lift = eOut(seg(t, 0.05, 0.4)), u = 2 * 0.86, dx = 160, dy = 232;
      const [sx, sy] = figAt(dx, dy, u, 34, 28), bx = lerp(dx + 60, sx + 4, lift), by = lerp(dy, sy + 44, lift);
      ell(g, rgba('#000000', 0.25), dx, dy, 22, 4);
      figure(g, dark, dx, dy, 2, { s: 0.86, v: { blush: true, mouth: 'open' } });
      g.save(); g.beginPath(); g.rect(0, 0, LW, lift >= 1 ? sy + 6 : LH); g.clip();
      figure(g, look, bx, by, 2, { s: 0.6, v: lift >= 1 ? { mouth: 'open' } : null });
      g.restore();
      if (lift >= 1) for (const side of [-1, 1]) { const fx = sx + 4 + side * 6, fy = sy + 4; rect(g, '#2a2a6a', Math.round(fx - 2), Math.round(fy), 5, 16 + (side > 0 ? 2 : 0)); rect(g, '#e8e0f0', Math.round(fx - 3), Math.round(fy + 14 + (side > 0 ? 2 : 0)), 6, 3); }
      const grab = seg(t, 0.5, 0.7);
      if (grab > 0) { g.save(); g.translate(lerp(146, 196, grab), lerp(58, 120, grab) - Math.sin(grab * Math.PI) * 20); g.rotate(grab * 0.6); rect(g, '#e8dcc0', -12, -12, 24, 24); rect(g, '#b83030', -1, -12, 3, 3); g.restore(); for (let i = 0; i < 6; i++) star4(g, 130 + i * 12, 40 + Math.sin(T * 6 + i) * 4, 3, '#fff0b0', grab); }
    }

    trailName(def, r) { const st = this.game && this.game.state; return st && st.name && (!r.gender || r.gender === st.gender) ? st.name : def; }

    cut_stelle_card(g, t, T, look, r) {
      this.advCard(g, t, T, look, {
        name: this.trailName('Стелла', r), cls: 'бейсболист?', stamp: 'ОПАСНО', stats: [['Сила', 0.62], ['Ловкость', 0.58], ['Магия', 0.4], ['Интеллект', 0.5]], big: ['Хаос', '#e85a3a', '#ffd8c0'],
        fx: (g, a) => { for (let i = 0; i < 12; i++) { const ph = (T * 0.8 + hx(i, 1, 55)) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.5); g.translate(130 + hx(i, 2, 55) * 190, ph * 250 - 20); g.rotate(T * 4 + i); if (i % 3) { rect(g, '#d8d4c8', -5, -4, 10, 8); rect(g, '#a8a498', -4, -1, 8, 1); } else { rect(g, '#8a9098', -3, -5, 6, 10); rect(g, '#c83030', -3, -2, 6, 3); } g.restore(); } }
      });
    }

    headIn(g, look, x, y, s, T, ph) {
      const [, top] = trashCan(g, x, y, s, true);
      g.save(); g.beginPath(); g.rect(0, 0, LW, top); g.clip();
      figure(g, look, x + Math.sin(T * 14 + ph) * 2, top - 0.42 * 96 * 2 * 0.6 * s, 2, { s: 0.6 * s, rot: Math.PI + Math.sin(T * 12 + ph) * 0.1 });
      g.restore();
      trashCan(g, x, y, s, false);
    }

    cut_stelle_trash(g, t, T, look) {
      plainBack(g, T, true);
      const out = t > 0.55, pop = seg(t, 0.55, 0.7);
      if (!out) this.headIn(g, look, 160, 228, 1.2, T, 0);
      else {
        trashCan(g, 196, 228, 1.2, false);
        ell(g, rgba('#000000', 0.25), 140, 230, 18, 4);
        figure(g, look, 140, 230 - Math.sin(pop * Math.PI) * 20, 2, { s: 0.82, v: { mouth: 'open' } });
        const [hx2, hy2] = figAt(140, 230, 2 * 0.82, 38, 40);
        g.save(); g.translate(hx2 + 4, hy2 - 20); ell(g, '#2f7438', 0, 0, 9, 8); rect(g, '#1a4a20', -5, -9, 10, 3); ell(g, '#e8b030', 0, 0, 3, 3); g.restore();
        lighter(g, () => glow(g, hx2 + 4, hy2 - 20, 20, '#fff0a0', 0.6)); star4(g, hx2 + 16, hy2 - 30, 4 + 2 * Math.sin(T * 12), '#ffffff', 0.9);
        for (let i = 0; i < 6; i++) { const q = seg(t, 0.55, 0.9), a = -Math.PI * (0.2 + 0.6 * hx(i, 1, 56)); g.save(); g.translate(196 + Math.cos(a) * 50 * q, 190 + Math.sin(a) * 50 * q + 40 * q * q); g.rotate(T * 6 + i); rect(g, rgba('#d8d4c8', 1 - q), -4, -3, 8, 6); g.restore(); }
      }
      if (t > 0.72) bubble(g, 180, 40, 'Кошелёк Казумы? Беру!', seg(t, 0.72, 0.84), true);
    }

    cut_stelle_bat(g, t, T, look) {
      plainBack(g, T, true);
      const hit = seg(t, 0.3, 0.38), fly = seg(t, 0.38, 0.9);
      shake(g, T, hit > 0 && t < 0.5 ? 4 : 0);
      if (fly <= 0) toad(g, 220, 214, 0.75, T, { gape: 0.6 });
      else if (fly < 1) { g.save(); const x = lerp(220, 300, fly), y = lerp(200, 20, fly); g.translate(x, y); g.rotate(fly * 12); g.scale(1 - fly * 0.9, 1 - fly * 0.9); g.translate(-x, -y); toad(g, x, y, 0.75, T, { gape: 1 }); g.restore(); }
      if (fly >= 0.95) { const tw = seg(t, 0.88, 1); star4(g, 300, 20, 10 * Math.sin(tw * Math.PI), '#ffffff', 1); lighter(g, () => glow(g, 300, 20, 18 * Math.sin(tw * Math.PI), '#fff0c0', 0.8)); }
      ell(g, rgba('#000000', 0.25), 120, 230, 20, 4);
      figure(g, look, 120, 230, 2, { s: 0.86, rot: hit > 0 ? -0.08 : 0.06, v: { mouth: 'open' } });
      const [hx2, hy2] = figAt(120, 230, 2 * 0.86, 38, 54), sw = eOut(seg(t, 0.2, 0.36));
      bat(g, hx2, hy2, lerp(-2.4, 1.4, sw), 1.3);
      if (sw > 0 && sw < 1) smear(g, hx2, hy2, 50, -Math.PI / 2 - 2.4, -Math.PI / 2 + lerp(-2.4, 1.4, sw), 1);
      if (hit > 0 && hit < 1) { lighter(g, () => glow(g, 190, 180, 50, '#ffffff', 1 - hit)); g.save(); g.font = 'bold 18px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('БАМ!', 172, 152); g.fillStyle = '#ffe060'; g.fillText('БАМ!', 170, 150); g.restore(); }
    }

    cut_stelle_collar(g, t, T, look) {
      plainBack(g, T, true);
      const aqua = this.lookOf('aqua'), kaz = this.lookOf('kazuma'), pull = seg(t, 0.4, 0.55);
      if (pull <= 0) {
        this.headIn(g, look, 96, 228, 1.1, T, 0);
        this.headIn(g, aqua, 226, 228, 1.1, T, 1.7);
        const kx = lerp(-30, 160, eOut(seg(t, 0, 0.35)));
        ell(g, rgba('#000000', 0.25), kx, 230, 20, 4);
        figure(g, kaz, kx, 230, 2, { s: 0.86, v: { mouth: 'open' } });
      } else {
        trashCan(g, 60, 228, 1.1, false); trashCan(g, 262, 228, 1.1, false);
        const lift = Math.sin(pull * Math.PI) * 16;
        ell(g, rgba('#000000', 0.25), 160, 230, 20, 4);
        figure(g, look, 112, 230 - lift, 2, { s: 0.8, rot: 0.1 });
        figure(g, aqua, 208, 230 - lift, 2, { s: 0.8, rot: -0.1, v: { mouth: 'open' } });
        figure(g, kaz, 160, 230, 2, { s: 0.86, v: { mouth: 'open' } });
        anger(g, 178, 60, 2, seg(t, 0.55, 0.65));
        for (let i = 0; i < 8; i++) { const q = seg(t, 0.42, 0.8), a = -Math.PI * hx(i, 1, 57); g.save(); g.translate(160 + Math.cos(a) * 90 * q, 170 + Math.sin(a) * 40 * q + 50 * q * q); g.rotate(T * 5 + i); rect(g, rgba('#d8d4c8', 1 - q), -4, -3, 8, 6); g.restore(); }
      }
    }

    cut_lynx_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Рысь Ландау', cls: 'следопыт', stamp: 'В РАБОЧИЕ ЧАСЫ', stats: [['Сила', 0.36], ['Ловкость', 0.66], ['Магия', 0.42], ['Интеллект', 0.6]], big: ['Выживание', '#4ab0c4', '#d8f8ff'],
        fx: (g, a) => { for (let i = 0; i < 22; i++) { const ph = (T * 0.35 + hx(i, 1, 81)) % 1, x = 130 + hx(i, 2, 81) * 190 + Math.sin(T * 2 + i) * 6; star4(g, Math.round(x), Math.round(ph * 250 - 20), 2 + (i % 3), '#e8f8ff', a * (1 - ph * 0.5)); } }
      });
    }

    cut_lynx_stable(g, t, T, look) {
      const warm = seg(t, 0.5, 0.75), cold = 1 - warm;
      stableBack(g, T, warm);
      const shiver = cold * 2.4;
      bust(g, this.lookOf('kazuma'), 66 + Math.sin(T * 47) * shiver, LH + 4, 118, 1, { v: warm > 0.6 ? null : { mouth: 'open' } });
      bust(g, this.lookOf('aqua'), 128 + Math.sin(T * 53 + 1) * shiver, LH + 10, 118, 1, { v: { mouth: 'open' }, flip: true });
      if (cold > 0.05) {
        g.save(); g.globalAlpha = 0.35 * cold; rect(g, '#6a8ac8', 0, 0, LW, LH); g.restore();
        for (let i = 0; i < 4; i++) { const ph = (T * 0.8 + i / 4) % 1; ell(g, rgba('#e8f0ff', 0.6 * (1 - ph) * cold), 82 + (i % 2) * 62, 150 - ph * 30, 4 + ph * 6, 3 + ph * 4); }
      }
      const walk = eOut(seg(t, 0.14, 0.42)), lx = lerp(LW + 40, 250, walk);
      ell(g, rgba('#000000', 0.3), lx, 232, 18, 4);
      figure(g, look, lx, 232, 2, { s: 0.78 });
      const set = seg(t, 0.42, 0.56);
      if (set > 0) {
        const sx = 196, sy = 224;
        rect(g, '#3a3a44', sx - 9, sy - 10, 18, 10); rect(g, '#5a5a66', sx - 9, sy - 12, 18, 3);
        if (set >= 1) { lighter(g, () => { glow(g, sx, sy - 14, 16 + 3 * Math.sin(T * 9), '#ffb050', 0.9); poly(g, '#ffd070', [sx - 4, sy - 12, sx, sy - 22 - 2 * Math.sin(T * 13), sx + 4, sy - 12]); }); }
      }
      const cans = seg(t, 0.56, 0.72);
      if (cans > 0 && H.FoursScenes) {
        H.FoursScenes.can(g, lerp(250, 104, eOut(cans)), lerp(200, 214, eOut(cans)) - Math.sin(cans * Math.PI) * 30, 1.5, cans * 6);
        H.FoursScenes.can(g, lerp(250, 150, eOut(cans)), lerp(200, 218, eOut(cans)) - Math.sin(cans * Math.PI) * 24, 1.5, -cans * 5);
      }
      if (warm > 0.4) for (let i = 0; i < 3; i++) { const ph = (T * 0.6 + i / 3) % 1; heart(g, 84 + i * 30, 170 - ph * 50, 2.4, (1 - ph) * warm * 0.8); }
    }

    cut_lynx_bar(g, t, T, look) {
      hillBack(g, T);
      const meg = this.lookOf('megumin'), up = seg(t, 0.62, 0.72);
      if (up <= 0) {
        ell(g, rgba('#000000', 0.25), 190, 226, 70, 6);
        figure(g, meg, 112, 222, 2, { s: 0.78, rot: Math.PI / 2 });
      } else {
        ell(g, rgba('#000000', 0.3), 196, 232, 18, 4);
        figure(g, meg, 196, 232 - Math.sin(up * Math.PI) * 14, 2, { s: 0.78 });
        if (up < 1) K.flash(g, '#fff4d0', 0.5 * (1 - up));
      }
      const walk = eOut(seg(t, 0.05, 0.34)), lx = lerp(LW + 40, 286, walk);
      ell(g, rgba('#000000', 0.3), lx, 232, 18, 4);
      figure(g, look, lx, 232, 2, { s: 0.78, flip: true });
      const toss = seg(t, 0.4, 0.58);
      if (toss > 0 && up <= 0) choco(g, lerp(276, 236, toss), lerp(176, 214, toss) - Math.sin(toss * Math.PI) * 40, 1.6, toss * 9);
      if (up > 0) {
        choco(g, 214, 172, 1.4, -0.3);
        if (H.FoursScenes) for (let i = 0; i < 5; i++) { const ph = (T * 0.7 + i / 5) % 1; H.FoursScenes.cross(g, 170 + hx(i, 2, 91) * 56, 210 - ph * 90, 1.2, (1 - ph) * up); }
        for (let i = 0; i < 6; i++) star4(g, 172 + hx(i, 3, 92) * 50, 120 + hx(i, 4, 92) * 60, 2 + 2 * Math.abs(Math.sin(T * 7 + i)), '#fff4b0', up);
      }
    }

    cut_luka_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Лука', cls: 'кулачный боец', stamp: 'ОВОЩИ НЕ ЕСТ', stats: [['Сила', 0.7], ['Ловкость', 0.62], ['Магия', 0.18], ['Интеллект', 0.34]], big: ['Стойкость', '#d8402a', '#ffd0b0'],
        fx: (g, a) => { for (let i = 0; i < 6; i++) { const ph = (T * 0.8 + i / 6) % 1; if (H.FoursScenes) H.FoursScenes.gauntlet(g, 140 + hx(i, 2, 94) * 170, ph * 250 - 20, 0.6, T * 3 + i, 0.4 * a); } }
      });
    }

    cut_luka_cabbage(g, t, T, look) {
      const hits = [0.22, 0.4, 0.58], hot = hits.reduce((a, h) => Math.max(a, 1 - seg(t, h, h + 0.08)), 0) * (t > 0.2 ? 1 : 0);
      shake(g, T, hits.some(h => t > h && t < h + 0.06) ? 4 : 0);
      cabbageField(g, T);
      ell(g, rgba('#000000', 0.3), 110, 232, 20, 4);
      figure(g, look, 110, 232, 2, { s: 0.8 });
      const fx = 138, fy = 150;
      if (H.FoursScenes) H.FoursScenes.gauntlet(g, fx + hot * 14, fy, 1.1, 0, 0.3 + 0.7 * hot);
      hits.forEach((h, i) => {
        const fly = seg(t, h - 0.18, h), y0 = 90 + i * 30;
        if (t < h) { const s2 = i === 2 ? smugCabbage : cabbage; s2(g, lerp(LW + 20, fx + 26, fly), lerp(y0, fy, fly) - Math.sin(fly * Math.PI) * 20, 2.2, T * 6 + i); }
        else if (t < h + 0.3) {
          const k = seg(t, h, h + 0.3);
          K.shards(g, k, fx + 30, fy, 12, i, '#6ab84a', 40, '#a8e07a');
          lighter(g, () => glow(g, fx + 30, fy, 24 * (1 - k), '#ffffff', 0.9));
          star4(g, fx + 34, fy - 4, 10 * (1 - k), '#fff4c0', 1 - k);
        }
      });
      const n = hits.filter(h => t > h).length;
      if (n) { g.save(); g.font = 'bold 18px Georgia, serif'; g.fillStyle = '#1a0806'; g.fillText('×' + n, 244, 72); g.fillStyle = '#ffd070'; g.fillText('×' + n, 242, 70); g.restore(); }
    }

    cut_luka_arm(g, t, T, look) {
      const crack = seg(t, 0.66, 0.72);
      shake(g, T, crack > 0 && crack < 1 ? 5 : 0);
      guildBack(g, T);
      const push = Math.sin(T * 9) * 6 * seg(t, 0.2, 0.3) * (1 - crack), tilt = crack > 0 ? 0 : push * 0.02;
      bust(g, look, 70, LH + 6, 130, 1, { v: t > 0.4 ? { mouth: 'open' } : null });
      bust(g, this.lookOf('darkness'), 250, LH + 6, 130, 1, { v: t > 0.45 ? { blush: true, mouth: 'open' } : { blush: true }, flip: true });
      const ty = 186;
      if (crack <= 0) { rect(g, '#5a3a20', 70, ty, 180, 14); rect(g, '#8a5a34', 70, ty, 180, 3); rect(g, '#3a2414', 90, ty + 14, 8, 40); rect(g, '#3a2414', 222, ty + 14, 8, 40); }
      else { g.save(); g.translate(120, ty); g.rotate(-0.3 * crack); rect(g, '#5a3a20', -50, 0, 90, 14); g.restore(); g.save(); g.translate(200, ty); g.rotate(0.3 * crack); rect(g, '#5a3a20', -40, 0, 90, 14); g.restore(); K.shards(g, crack, CX, ty + 6, 14, 3, '#8a5a34', 50, '#c89a64'); }
      const hx0 = CX + push, hy0 = ty - 34 + (crack > 0 ? 24 * crack : 0), dy = crack > 0 ? 20 * crack : 0;
      const arm = (ex, col, hi, w) => { const dx = hx0 - ex, dyy = hy0 - (ty + dy), l = Math.hypot(dx, dyy) || 1, nx = -dyy / l * w, ny = dx / l * w; poly(g, col, [ex - nx, ty + dy - ny, ex + nx, ty + dy + ny, hx0 + nx, hy0 + ny, hx0 - nx, hy0 - ny]); line(g, hi, 2, ex - nx * 0.5, ty + dy - ny * 0.5, hx0 - nx * 0.5, hy0 - ny * 0.5); };
      arm(CX - 34, '#5a5e6c', '#a8acb8', 6);
      rect(g, '#d8402a', Math.round((CX - 34 + hx0) / 2) - 2, Math.round((ty + dy + hy0) / 2) - 2, 4, 4);
      arm(CX + 34, '#d07a34', '#f2eef8', 6);
      ell(g, '#2a2a30', hx0, hy0, 9, 9); ell(g, '#3a3c48', hx0 - 2, hy0 - 1, 6, 6);
      lighter(g, () => glow(g, hx0, hy0, 14 + 4 * Math.sin(T * 12), '#ff7a3a', 0.6));
      if (t > 0.45) for (let i = 0; i < 4; i++) { const ph = (T * 0.6 + i / 4) % 1; heart(g, 236 + hx(i, 2, 95) * 50, 150 - ph * 70, 3, (1 - ph) * 0.8); }
      if (crack >= 1) { g.save(); g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('Ничья?', 40, 120); g.restore(); }
    }

    cut_sushang_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Сушан', cls: 'рыцарь-новобранец', stamp: 'ДОБРОЕ ДЕЛО: 1/1', stats: [['Сила', 0.6], ['Ловкость', 0.58], ['Магия', 0.2], ['Интеллект', 0.38]], big: ['Отзывчивость', '#e8b030', '#fff0b0'],
        fx: (g, a) => { for (let i = 0; i < 9; i++) { const ph = (T * 0.5 + i / 9) % 1; ell(g, rgba('#ffd8e8', a * (1 - ph * 0.5)), 140 + hx(i, 2, 97) * 170 + Math.sin(T * 2 + i) * 8, ph * 250 - 20, 3, 2, T + i); } }
      });
    }

    cut_sushang_toad(g, t, T, look) {
      const hit = seg(t, 0.44, 0.5), spit = seg(t, 0.55, 0.8);
      shake(g, T, hit > 0 && hit < 1 ? 5 : 0);
      plainBack(g, T, true);
      const hop = spit > 0 ? 0 : Math.abs(Math.sin(T * 5)) * 4;
      toad(g, 236, 214 - hop, 0.95, T, { gape: spit > 0 ? 0.9 : 0.35, legs: spit <= 0, slime: true, puff: spit > 0 ? 0.6 : 0.3 + 0.1 * Math.sin(T * 9) });
      if (spit > 0) for (let i = 0; i < 3; i++) star4(g, 200 + i * 18, 120 - (i % 2) * 8, 4 + 2 * Math.sin(T * 9 + i), '#fff4b0', 1 - spit * 0.5);
      const run = eOut(seg(t, 0, 0.36)), x = lerp(-30, 112, run), u = 2 * 0.8;
      ell(g, rgba('#000000', 0.25), x, 228, 20, 4);
      figure(g, look, x, 228, 2, { s: 0.8 });
      const [hx2, hy2] = figAt(x, 228, u, 36, 54), sw = seg(t, 0.36, 0.5);
      greatsword(g, hx2, hy2, lerp(-1.2, 1.9, eOut(sw)), 64);
      if (sw > 0 && sw < 1) smear(g, hx2, hy2, 70, -2.2, -2.2 + 3.4 * sw, 0.9);
      if (spit > 0) {
        const aq = this.lookOf('aqua'), ax = lerp(164, 60, spit), ay = 226 - Math.sin(spit * Math.PI) * 70;
        figure(g, aq, ax, ay, 2, { s: 0.7, rot: (1 - spit) * -2.6 });
        for (let i = 0; i < 6; i++) { const ph = (T * 1.4 + i / 6) % 1; ell(g, rgba('#e8f0c8', 0.8 * (1 - ph)), ax - 12 + i * 5, ay - 40 + ph * 40, 2, 3); }
      }
    }

    cut_sushang_tale(g, t, T, look) {
      guildBack(g, T);
      bust(g, this.lookOf('kazuma'), 64, LH + 6, 132, 1, { v: t > 0.3 ? { mouth: 'open' } : null });
      bust(g, look, 256, LH + 6, 132, 1, { v: t > 0.55 ? { mouth: 'open' } : null, flip: true });
      const cloud = eOut(seg(t, 0.12, 0.3)), cx = 168, cy = 70;
      if (cloud > 0) {
        g.save(); g.globalAlpha = cloud;
        for (const [dx, dy, r] of [[-46, 6, 26], [-16, -10, 32], [24, -6, 30], [50, 10, 24], [0, 18, 34]]) ell(g, '#f8f4ec', cx + dx, cy + dy, r, r * 0.8);
        for (const [dx, dy, r] of [[-70, 58, 6], [-82, 76, 4]]) ell(g, '#f8f4ec', cx + dx, cy + dy, r, r);
        ell(g, '#d8e8f0', cx, cy + 14, 56, 14);
        const kz = this.lookOf('kazuma'), swing = seg(t, 0.3, 0.45);
        figure(g, kz, cx - 20, cy + 26, 2, { s: 0.3 });
        greatsword(g, cx - 12, cy + 2, lerp(-0.8, 1.2, eOut(swing)), 22);
        g.save(); g.translate(cx + 28, cy + 24); g.rotate(swing >= 1 ? -1.5 : 0); rect(g, '#2a2a3a', -6, -26, 12, 26); rect(g, '#4a4a5a', -7, -28, 14, 6); g.restore();
        if (swing >= 1) { ell(g, '#3a3a4a', cx + 52, cy + 22, 5, 4); ell(g, '#ff3a3a', cx + 53, cy + 21, 1.4, 1); }
        if (swing > 0 && swing < 1) star4(g, cx + 20, cy + 6, 8, '#fff4b0', 1);
        g.restore();
      }
      if (t > 0.5) for (let i = 0; i < 4; i++) star4(g, 236 + hx(i, 3, 98) * 50, 130 + hx(i, 4, 98) * 40, 2 + 2 * Math.abs(Math.sin(T * 8 + i)), '#fff4b0', 1);
      const meg = seg(t, 0.62, 0.72);
      if (meg > 0) { bust(g, this.lookOf('megumin'), 168, LH + 12, 96, 1, { a: meg }); bubble(g, 168, 140, '…', meg); }
    }

    cut_qingque_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Цинцюэ', cls: 'прорицатель', stamp: 'НОЛЬ ИНИЦИАТИВЫ', stats: [['Сила', 0.22], ['Ловкость', 0.4], ['Магия', 0.58], ['Интеллект', 0.62]], big: ['Азарт', '#3aa86a', '#d8ffd8'],
        fx: (g, a) => { if (H.FoursScenes) for (let i = 0; i < 10; i++) { const ph = (T * 0.6 + i / 10) % 1; H.FoursScenes.tile(g, 140 + hx(i, 2, 99) * 170, ph * 250 - 20, 1.2, i, T * 2 + i, a * (1 - ph * 0.4)); } }
      });
    }

    tilesTable(g, T, seats) {
      guildBack(g, T);
      for (const [id, x, flip] of seats) bust(g, this.lookOf(id), x, LH - 14, 116, 1, { flip });
      rect(g, '#1e4a34', 20, 216, 280, 8); rect(g, '#2a6a4a', 30, 204, 260, 14); rect(g, '#3a8a5a', 30, 204, 260, 3);
    }

    cut_qingque_table(g, t, T, look) {
      const lose = seg(t, 0.62, 0.7);
      this.tilesTable(g, T, [['aqua', 62, false], ['darkness', 266, true]]);
      bust(g, look, 164, LH - 8, 108, 1, { v: lose > 0 ? { mouth: 'open' } : null });
      const aq = this.lookOf('aqua');
      if (lose > 0) tears(g, aq, 62, LH - 14, 116, 1, T, lose);
      if (H.FoursScenes) {
        const F = H.FoursScenes;
        for (let i = 0; i < 3; i++) { const k = seg(t, 0.1 + i * 0.18, 0.2 + i * 0.18); if (k > 0) F.tile(g, lerp(164, 104 + i * 60, eOut(k)), lerp(180, 210, eOut(k)), 1.1, i, 0, 1); }
        if (lose > 0) for (let i = 0; i < 5; i++) F.tile(g, 140 + i * 12, 210, 1.1, 2, 0, 1);
      }
      if (lose > 0) { g.save(); g.globalAlpha = lose; g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('Небесный нефрит!', 112, 120); g.restore(); }
      if (t > 0.8) for (let i = 0; i < 6; i++) { const ph = (T * 0.8 + i / 6) % 1; coin(g, 140 + hx(i, 2, 100) * 50, 170 + ph * 40, 2.4, T * 6 + i, 1 - ph); }
    }

    cut_qingque_luck(g, t, T, look) {
      const win = seg(t, 0.58, 0.66), shock = seg(t, 0.7, 0.78);
      shake(g, T, win > 0 && win < 1 ? 3 : 0);
      this.tilesTable(g, T, [['kazuma', 70, false]]);
      bust(g, look, 256, LH - 14, 120, 1, { v: shock > 0 ? { mouth: 'open' } : null, flip: true });
      if (H.FoursScenes) {
        const F = H.FoursScenes;
        for (let i = 0; i < 4; i++) {
          const k = seg(t, 0.1 + i * 0.12, 0.2 + i * 0.12), x = 112 + i * 26;
          if (k <= 0) continue;
          F.tile(g, x, 198 - Math.sin(k * Math.PI) * 24, 1.6, 1, (1 - k) * 3, 1);
          if (win > 0) lighter(g, () => glow(g, x, 198, 14, '#ffe080', 0.4 * win));
        }
      }
      if (win > 0) {
        lighter(g, () => glow(g, 150, 180, 70, '#ffd860', 0.35 * win));
        for (let i = 0; i < 10; i++) star4(g, 90 + hx(i, 2, 101) * 140, 90 + hx(i, 3, 101) * 70, 2 + 3 * Math.abs(Math.sin(T * 8 + i)), '#fff4b0', win);
        g.save(); g.globalAlpha = win; g.font = 'bold 16px Georgia, serif'; g.fillStyle = '#1a0806'; g.fillText('Удача!', 122, 96); g.fillStyle = '#ffd860'; g.fillText('Удача!', 120, 94); g.restore();
      }
      if (shock > 0) { const [ex, ey, u] = bustAt(look, 256, LH - 14, 120, 1, 1, true); anger(g, ex + 16 * u, ey - 18 * u, 1.2, shock); for (let i = 0; i < 5; i++) { const ph = (T * 1.2 + i / 5) % 1; coin(g, 236 + i * 8, 150 + ph * 40, 2.4, T * 6 + i, 1 - ph); } }
    }

    cut_tingyun_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Тинъюнь', cls: 'посредник', stamp: 'СДЕЛКА ЗАКЛЮЧЕНА', stats: [['Сила', 0.2], ['Ловкость', 0.46], ['Магия', 0.56], ['Интеллект', 0.7]], big: ['Красноречие', '#2a9a8a', '#d8fff4'],
        fx: (g, a) => { if (H.FoursScenes) for (let i = 0; i < 6; i++) { const ph = (T * 0.4 + i / 6) % 1, x = 140 + hx(i, 2, 102) * 170, y = ph * 250 - 20, q = T * 2 + i; g.save(); g.globalAlpha = a * (1 - ph * 0.4); H.FoursScenes.fan(g, x, y, 12, q, q + 1.8, '#2a8a7a', '#d8b050'); g.restore(); } }
      });
    }

    cut_tingyun_debt(g, t, T, look) {
      const talk = seg(t, 0.2, 0.55), pop = seg(t, 0.6, 0.68);
      shake(g, T, pop > 0 && pop < 1 ? 5 : 0);
      guildBack(g, T);
      bust(g, look, 70, LH - 6, 124, 1, { v: talk > 0 && pop <= 0 && Math.sin(T * 14) > 0 ? { mouth: 'open' } : null });
      const kz = this.lookOf('kazuma');
      bust(g, kz, 252, LH - 6, 124, 1, { v: pop > 0 ? { mouth: 'open' } : null, flip: true });
      if (H.FoursScenes) { const sw = pop > 0 ? 0 : Math.sin(T * 6) * 0.25; H.FoursScenes.fan(g, 118, 176, 24, -2.4 + sw, -0.9 + sw, '#2a8a7a', '#d8b050'); }
      const owed = pop > 0 ? Math.round(lerp(170, 510, eOut(pop))) : Math.round(lerp(340, 170, talk));
      const py = 40, px = 110;
      rect(g, '#f4ead0', px, py, 100, 60); rect(g, '#d8c8a0', px, py + 56, 100, 4); rect(g, '#8a3a2a', px, py, 100, 12);
      g.save(); g.font = 'bold 9px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('ДОЛГ', px + 50, py + 9);
      g.font = 'bold 12px Georgia, serif'; g.fillStyle = pop > 0 ? '#c82a2a' : '#2a1a10'; g.fillText(owed + ' 000 000', px + 50, py + 32);
      g.font = '9px Georgia, serif'; g.fillStyle = '#5a4a3a'; g.fillText('эрис', px + 50, py + 46); g.restore();
      if (talk > 0 && pop <= 0) for (let i = 0; i < 3; i++) { const ph = (T * 0.9 + i / 3) % 1; ell(g, rgba('#d8fff4', 0.7 * (1 - ph)), 130 + ph * 40, 150 - ph * 30 + i * 6, 4, 2); }
      if (pop > 0) {
        bust(g, this.lookOf('aqua'), 168, LH + 40 - 60 * eOut(pop), 104, 1, { v: { mouth: 'open' } });
        const [ex, ey, u] = bustAt(kz, 252, LH - 6, 124, 1, 1, true);
        ell(g, rgba('#bfe8ff', pop), ex - 18 * u, ey - 10 * u, 2.2, 3.4);
        anger(g, 112, 120, 1.1, seg(t, 0.74, 0.8));
      }
    }

    cut_tingyun_boost(g, t, T, look) {
      const zap = seg(t, 0.26, 0.42), fire = seg(t, 0.58, 0.82), down = seg(t, 0.82, 0.9);
      shake(g, T, fire > 0 && fire < 0.4 ? 6 : 0);
      hillBack(g, T);
      if (fire > 0) blast2d(g, T, 168, 96, fire, '#ff4a3a');
      const meg = this.megumin;
      if (down <= 0) {
        ell(g, rgba('#000000', 0.3), 120, 232, 18, 4);
        figure(g, meg, 120, 232, 2, { s: 0.8 });
        const [gx, gy] = this.staff(g, 120, 232, 2 * 0.8 * 89, 0.4 + zap, T);
        rune2d(g, gx, gy, 10 + 16 * zap, 4 + 7 * zap, T * 2, '#ff6a5a', 0.4 + 0.6 * zap);
        if ((zap > 0 && zap < 1) || (t > 0.42 && t < 0.58)) lighter(g, () => bolt(g, 238, 150, gx, gy, '#c8f0ff', 0.9, Math.floor(T * 20)));
        if (t > 0.42 && fire <= 0) K.flash(g, '#d8f0ff', 0.12 + 0.08 * Math.sin(T * 30));
      } else { ell(g, rgba('#000000', 0.25), 124, 216, 70, 6); figure(g, meg, 50, 212, 2, { s: 0.8, rot: Math.PI / 2 }); }
      ell(g, rgba('#000000', 0.3), 250, 232, 18, 4);
      figure(g, look, 250, 232, 2, { s: 0.8, flip: true });
      if (H.FoursScenes) H.FoursScenes.fan(g, 238, 156, 18, -2.6 + Math.sin(T * 5) * 0.2, -1.1 + Math.sin(T * 5) * 0.2, '#2a8a7a', '#d8b050');
      if (t > 0.42) { g.save(); g.font = 'bold 14px Georgia, serif'; g.fillStyle = '#1a0806'; g.fillText('×2', 72, 72); g.fillStyle = '#c8f0ff'; g.fillText('×2', 70, 70); g.restore(); }
      if (down > 0) bubble(g, 96, 160, '…', down);
    }

    cut_yukong_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Юйкун', cls: 'воздушный ас', stamp: 'ШЕСТЬ РАЗ НА КРАСНЫЙ', stats: [['Сила', 0.44], ['Ловкость', 0.72], ['Магия', 0.4], ['Интеллект', 0.58]], big: ['Пилотаж', '#c89a3a', '#fff0c0'],
        fx: (g, a) => { if (H.FoursScenes) for (let i = 0; i < 6; i++) { const ph = (T * 0.35 + i / 6) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.4); H.FoursScenes.kite(g, 140 + hx(i, 2, 103) * 170, ph * 250 - 20, 0.9, ['#d84a3a', '#e8b040', '#4a9ad8'][i % 3], T, i); g.restore(); } }
      });
    }

    cart(g, x, y, T, hop) {
      const lz = x + 96, ly = y - 2 - hop;
      g.save(); g.translate(lz, ly); g.scale(1.4, 1.4); g.translate(-lz, -ly);
      for (let i = 0; i < 4; i++) { const k = Math.sin(T * 30 + i * Math.PI / 2) * 6; line(g, '#2a3a5a', 2, lz - 14 + (i % 2) * 22, ly + 4, lz - 14 + (i % 2) * 22 + k, ly + 14); }
      ell(g, '#3a5a8a', lz, ly, 24, 9); ell(g, '#5a7aaa', lz - 2, ly - 3, 16, 4); ell(g, '#3a5a8a', lz + 26, ly - 8, 10, 7); rect(g, '#141414', lz + 30, ly - 11, 2, 2);
      poly(g, '#3a5a8a', [lz - 22, ly - 2, lz - 50, ly + 6 + Math.sin(T * 20) * 3, lz - 22, ly + 4]);
      g.restore();
      rect(g, '#7a4a2a', x - 50, y - 26 - hop, 104, 22); rect(g, '#9a6a3a', x - 50, y - 26 - hop, 104, 3); rect(g, '#5a3420', x - 50, y - 6 - hop, 104, 3);
      for (const wx of [x - 30, x + 34]) { ell(g, '#3a2414', wx, y - hop, 11, 11); ell(g, '#8a5a34', wx, y - hop, 8, 8); for (let k = 0; k < 4; k++) { const q = -T * 18 + k * Math.PI / 4; line(g, '#3a2414', 1.4, wx - Math.cos(q) * 8, y - hop - Math.sin(q) * 8, wx + Math.cos(q) * 8, y - hop + Math.sin(q) * 8); } }
      return [lz + 36, ly - 11];
    }

    cut_yukong_cart(g, t, T, look) {
      const ox = lerp(LW + 80, 0, eOut(seg(t, 0, 0.25))), bump = seg(t, 0.64, 0.8), hop = Math.sin(bump * Math.PI) * 26 + Math.abs(Math.sin(T * 24)) * 2;
      shake(g, T, bump > 0 && bump < 0.2 ? 4 : 1);
      plainBack(g, T, false);
      for (let i = 0; i < 8; i++) { const x = ((i * 50 - T * 420) % (LW + 60) + LW + 60) % (LW + 60) - 30; rect(g, '#8a6a40', Math.round(x), 226, 26, 3); }
      for (let i = 0; i < 10; i++) { const x = ((i * 37 - T * 600) % (LW + 80) + LW + 80) % (LW + 80) - 40; rect(g, 'rgba(255,255,255,0.5)', Math.round(x), 60 + hx(i, 2, 104) * 120, 30, 1); }
      const cx = 170 + ox, cy = 214;
      rect(g, '#6a6a5a', 250 - ((T * 420) % 400), 214, 10, 8);
      ell(g, rgba('#000000', 0.25), cx, cy + 10, 60, 5);
      const kz = this.lookOf('kazuma'), dk = this.lookOf('darkness');
      figure(g, kz, cx - 20, cy + 6 - hop * 1.4, 2, { s: 0.55, rot: Math.sin(T * 14) * 0.25 - bump * 0.6, v: { mouth: 'open' } });
      figure(g, look, cx + 30, cy + 6 - hop, 2, { s: 0.55 });
      const [hx2, hy2] = this.cart(g, cx, cy, T, hop);
      line(g, '#3a2414', 1, cx + 40, cy - 26 - hop, hx2, hy2);
      const dy = cy - 6 - hop * 0.6 - Math.sin(bump * Math.PI) * 30, dx = cx - 160;
      line(g, '#c8a870', 1.4, cx - 50, cy - 12 - hop, dx + 104, dy);
      figure(g, dk, dx, dy, 2, { s: 0.6, rot: Math.PI / 2 - Math.sin(bump * Math.PI) * 0.4, v: { blush: true, mouth: 'open' } });
      for (let i = 0; i < 5; i++) { const ph = (T * 2 + i / 5) % 1; ell(g, rgba('#c8b090', 0.6 * (1 - ph)), dx - ph * 40, dy - 2 - ph * 10, 5 + ph * 8, 3 + ph * 4); }
      if (t > 0.3) for (let i = 0; i < 3; i++) { const ph = (T * 0.8 + i / 3) % 1; heart(g, dx + 60 + i * 20, dy - 20 - ph * 40, 3, (1 - ph) * 0.9); }
    }

    cut_yukong_kite(g, t, T, look) {
      const lift = seg(t, 0.26, 0.55), shot = seg(t, 0.55, 0.6), fall = seg(t, 0.6, 0.72);
      shake(g, T, fall >= 1 && t < 0.76 ? 4 : 0);
      plainBack(g, T, false);
      const hay = () => { ell(g, '#a88a3a', 250, 222, 52, 26); ell(g, '#c8a850', 250, 214, 46, 20); for (let i = 0; i < 7; i++) line(g, '#e0c870', 1, 214 + i * 11, 206, 218 + i * 11, 198); };
      const aq = this.lookOf('aqua');
      ell(g, rgba('#000000', 0.3), 64, 232, 18, 4);
      figure(g, look, 64, 232, 2, { s: 0.78 });
      const [bx, by] = figAt(64, 232, 1.56, 36, 54), draw = seg(t, 0.36, 0.55);
      g.strokeStyle = '#6a3a1a'; g.lineWidth = 2; g.beginPath(); g.arc(bx + 2, by - 6, 24, -1.2, 1.2); g.stroke(); g.lineWidth = 1;
      const tx = bx + 2 + Math.cos(1.2) * 24, sx = bx + 2 - draw * 10 * (shot > 0 ? 0 : 1);
      line(g, '#e8e0d0', 1, tx, by - 6 - Math.sin(1.2) * 24, sx, by - 6); line(g, '#e8e0d0', 1, sx, by - 6, tx, by - 6 + Math.sin(1.2) * 24);
      const kx = 200 + Math.sin(T * 2) * 10 + lift * 40, ky = 60 - lift * 20 + Math.sin(T * 3) * 4;
      if (fall <= 0) {
        hay();
        const ax = lerp(170, 236, lift), ay = 232 - 90 * eOut(lift);
        if (lift <= 0) ell(g, rgba('#000000', 0.3), ax, 232, 16, 4);
        figure(g, aq, ax, ay, 2, { s: 0.7, rot: Math.sin(T * 6) * 0.2 * lift, v: lift > 0 ? { mouth: 'open' } : null });
        const [hx3, hy3] = figAt(ax, ay, 1.4, 36, 50);
        if (shot < 1) { line(g, 'rgba(255,255,255,0.8)', 1, hx3, hy3, kx, ky + 14); if (H.FoursScenes) H.FoursScenes.kite(g, kx, ky, 1.8, '#d84a3a', T, 0); }
        if (draw > 0 && shot < 1) { const ax2 = lerp(bx, kx, eIn(shot)), ay2 = lerp(by - 6, ky + 4, eIn(shot)); if (shot > 0) lighter(g, () => { line(g, rgba('#ffe080', 0.9), 3, bx, by - 6, ax2, ay2); glow(g, ax2, ay2, 12, '#ffd850', 0.9); }); }
        if (lift > 0) for (let i = 0; i < 3; i++) ell(g, rgba('#bfe8ff', 0.8), ax + 14 + i * 4, ay - 120 + i * 6, 1.6, 2.4);
      } else {
        const k2 = seg(t, 0.6, 1);
        if (H.FoursScenes) H.FoursScenes.kite(g, kx + k2 * 120, ky - k2 * 60, 1.8, '#d84a3a', T * 6, 0);
        const ay = lerp(142, 170, eIn(fall));
        figure(g, aq, 250, lerp(60, ay, eIn(fall)), 2, { s: 0.6, rot: Math.PI });
        hay();
        if (fall >= 1) for (let i = 0; i < 6; i++) { const ph = seg(t, 0.72, 0.95); line(g, rgba('#e0c870', 1 - ph), 1, 250 + (i - 2.5) * 10, 196 - ph * 30, 252 + (i - 2.5) * 14, 190 - ph * 40); }
        if (t > 0.8) for (let i = 0; i < 3; i++) star4(g, 236 + i * 14, 130 + Math.sin(T * 6 + i) * 4, 4, '#fff4b0', 1);
      }
    }

    cut_hanya_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Ханья', cls: 'судья', stamp: 'ВСЁ ЗАПИСАНО', stats: [['Сила', 0.38], ['Ловкость', 0.5], ['Магия', 0.5], ['Интеллект', 0.7]], big: ['Строгость', '#8a7ab8', '#ece0ff'],
        fx: (g, a) => { for (let i = 0; i < 7; i++) { const ph = (T * 0.4 + i / 7) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.4); g.translate(140 + hx(i, 2, 105) * 170, ph * 250 - 20); g.rotate(Math.sin(T * 2 + i) * 0.4); rect(g, '#efe6d0', -4, -10, 8, 20); rect(g, '#c83a3a', -2, -6, 4, 3); rect(g, '#c83a3a', -2, 1, 4, 3); g.restore(); } }
      });
    }

    cut_hanya_trial(g, t, T, look) {
      const st = eOut(seg(t, 0.64, 0.7));
      shake(g, T, st > 0 && st < 1 ? 5 : 0);
      guildBack(g, T);
      bust(g, look, 66, LH - 6, 124, 1);
      const kz = this.lookOf('kazuma');
      bust(g, kz, 254, LH - 6, 124, 1, { v: t > 0.52 ? { mouth: 'open' } : null, flip: true });
      const px = 108, py = 28, w = 104, h = 104;
      rect(g, '#efe6d0', px, py, w, h); rect(g, '#5a3a20', px - 4, py - 4, w + 8, 5); rect(g, '#5a3a20', px - 4, py + h - 1, w + 8, 5);
      const rows = ['Обвиняемый: Казума', 'Навык: Кража', 'Украдено: бельё Крис', 'Свидетели: вся гильдия'];
      g.save(); g.font = 'bold 9px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#5a3a20'; g.fillText('ПРОТОКОЛ', px + w / 2, py + 12);
      g.font = '8px Georgia, serif'; g.textAlign = 'left'; g.fillStyle = '#1a1418';
      let wx = px + 8, wy = py + 30;
      rows.forEach((row, i) => { const k = seg(t, 0.1 + i * 0.12, 0.2 + i * 0.12); if (k <= 0) return; const n = Math.ceil(row.length * k); g.fillText(row.slice(0, n), px + 6, py + 30 + i * 16); if (k < 1) { wx = px + 6 + g.measureText(row.slice(0, n)).width; wy = py + 30 + i * 16; } });
      g.restore();
      if (t < 0.6) { g.save(); g.translate(wx + 2, wy - 4); g.rotate(-0.5 + Math.sin(T * 20) * 0.1); rect(g, '#5a3a20', -1, -18, 2, 16); rect(g, '#1a1418', -1.5, -3, 3, 4); g.restore(); }
      if (H.FoursScenes) H.FoursScenes.stamp(g, px + w / 2 + 14, py + h - 18, lerp(2.4, 1, st), 'ВИНА', st, '#d83a3a');
      if (t > 0.52) { const [ex, ey, u] = bustAt(kz, 254, LH - 6, 124, 1, 1, true); for (let i = 0; i < 2; i++) ell(g, rgba('#bfe8ff', 0.9), ex - (18 + i * 8) * u, ey - (8 - i * 6) * u, 2, 3.2); }
      if (t > 0.78) tears(g, kz, 254, LH - 6, 124, 1, T, seg(t, 0.78, 0.86), true);
    }

    cut_hanya_burden(g, t, T, look) {
      const draw = seg(t, 0.08, 0.32), fly = seg(t, 0.34, 0.46), on = seg(t, 0.46, 0.56);
      shake(g, T, on > 0 && on < 1 ? 4 : 0);
      plainBack(g, T, false);
      ell(g, rgba('#000000', 0.3), 74, 232, 18, 4);
      figure(g, look, 74, 232, 2, { s: 0.8 });
      const dk = this.lookOf('darkness'), sink = on * 4;
      const sx = lerp(146, 236, eOut(fly)), sy = lerp(120, 150, eOut(fly)), sr = lerp(26, 9, fly);
      if (on > 0) for (const [bx, by] of [[200, 228], [272, 230]]) { if (H.FoursScenes) H.FoursScenes.chain(g, 236, 156 + sink, bx, by, on, '#9aa0b0'); if (on >= 1) { ell(g, '#2a2a30', bx, by - 6, 9, 8); ell(g, '#4a4a54', bx - 2, by - 8, 4, 3); } }
      ell(g, rgba('#000000', 0.3), 236, 232, 18, 4);
      figure(g, dk, 236, 232 + sink, 2, { s: 0.8, flip: true, v: on > 0 ? { blush: true, mouth: t > 0.6 ? 'open' : null } : null });
      if (draw > 0 && t < 0.56) {
        const pts = []; for (let i = 0; i <= 24; i++) { const q = -Math.PI / 2 + i / 24 * Math.PI * 2; pts.push(sx + Math.cos(q) * sr, sy + Math.sin(q) * sr); }
        pts.push(sx - sr * 0.5, sy - sr * 0.2, sx + sr * 0.5, sy - sr * 0.2, sx, sy - sr * 0.6, sx, sy + sr * 0.6);
        lighter(g, () => { if (H.FoursScenes) H.FoursScenes.brush(g, pts, fly > 0 ? 1 : draw, '#ffe0a0', 3); glow(g, sx, sy, sr * 1.2, '#ffd880', 0.2); });
      }
      if (on > 0) {
        lighter(g, () => glow(g, 236, 156 + sink, 10, '#ffd880', 0.7));
        g.save(); g.globalAlpha = on; g.font = 'bold 12px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#1a0806'; g.fillText('Бремя', 237, 87); g.fillStyle = '#ffe0a0'; g.fillText('Бремя', 236, 86); g.restore();
      }
      if (t > 0.6) for (let i = 0; i < 4; i++) { const ph = (T * 0.7 + i / 4) % 1; heart(g, 210 + hx(i, 2, 106) * 50, 140 - ph * 50, 4.5, (1 - ph) * 0.9); }
      if (t > 0.72) { const [hx2, hy2] = figAt(74, 232, 1.6, 30, 12); ell(g, rgba('#bfe8ff', seg(t, 0.72, 0.78)), hx2 + 12, hy2, 2.2, 3.4); }
    }

    cut_xueyi_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Сюэи', cls: 'ловчая', stamp: 'ТЕЛО: КУКЛА', stats: [['Сила', 0.66], ['Ловкость', 0.6], ['Магия', 0.4], ['Интеллект', 0.5]], big: ['Хватка', '#6a5ad8', '#e0d8ff'],
        fx: (g, a) => { for (let i = 0; i < 7; i++) { const ph = (T * 0.45 + i / 7) % 1; g.save(); g.globalAlpha = a * (1 - ph * 0.4); gear(g, 140 + hx(i, 2, 107) * 170, ph * 250 - 20, 5 + (i % 3) * 2, T * 3 + i, '#b8b0c8'); g.restore(); } }
      });
    }

    cut_xueyi_hunt(g, t, T, look) {
      const shoot = seg(t, 0.36, 0.46), pull = seg(t, 0.56, 0.72);
      shake(g, T, pull > 0 && pull < 0.3 ? 4 : 0);
      guildBack(g, T);
      rect(g, '#efe0c0', 184, 36, 88, 78); rect(g, '#c8b080', 184, 36, 88, 3);
      g.save(); g.font = 'bold 8px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#8a2a1a'; g.fillText('РАЗЫСКИВАЕТСЯ', 228, 48); g.restore();
      bust(g, this.lookOf('kazuma'), 228, 104, 52, 1);
      g.save(); g.font = 'bold 8px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#1a1418'; g.fillText('КАЗУМА', 228, 110); g.restore();
      const walk = eOut(seg(t, 0, 0.3)), xx = lerp(-30, 70, walk);
      ell(g, rgba('#000000', 0.3), xx, 232, 18, 4);
      figure(g, look, xx, 232, 2, { s: 0.8 });
      const [hx2, hy2] = figAt(xx, 232, 1.6, 36, 52), kz = this.lookOf('kazuma');
      const kx = lerp(250, 150, eOut(pull)), ky = 232;
      if (pull <= 0) {
        figure(g, kz, kx, ky + 44 - (shoot >= 1 ? 8 : 0), 2, { s: 0.7, v: shoot >= 1 ? { mouth: 'open' } : null });
        rect(g, '#6a4a2a', 222, 178, 56, 62); rect(g, '#8a6a3a', 222, 178, 56, 4); rect(g, '#4a3220', 222, 196, 56, 3); rect(g, '#4a3220', 222, 216, 56, 3);
        if (shoot <= 0) for (let i = 0; i < 3; i++) ell(g, rgba('#ffffff', 0.25 + 0.15 * Math.sin(T * 4 + i)), 240 + i * 8, 170 - i * 4, 3, 3);
      } else {
        rect(g, '#6a4a2a', 222, 178, 56, 62); rect(g, '#8a6a3a', 222, 178, 56, 4); rect(g, '#4a3220', 222, 196, 56, 3); rect(g, '#4a3220', 222, 216, 56, 3);
        figure(g, kz, kx, ky, 2, { s: 0.7, rot: -0.3 * (1 - pull), v: { mouth: 'open' } });
        for (let i = 0; i < 3; i++) if (H.FoursScenes) H.FoursScenes.chain(g, kx - 16, ky - 60 + i * 14, kx + 16, ky - 54 + i * 14, 1, '#d8d0f0');
      }
      if (shoot > 0 && H.FoursScenes) { const tx = pull > 0 ? kx - 4 : 240, ty = pull > 0 ? ky - 50 : 186; H.FoursScenes.chain(g, hx2, hy2, tx, ty, shoot, '#d8d0f0'); lighter(g, () => glow(g, tx, ty, 10, '#8a7aff', 0.6 * shoot)); }
      if (shoot >= 1 && pull <= 0) { g.save(); g.font = 'bold 18px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('!', 252, 148); g.restore(); }
    }

    cut_xueyi_gears(g, t, T, look) {
      const swing = seg(t, 0.14, 0.3), hit = seg(t, 0.3, 0.5), heal = seg(t, 0.5, 0.8);
      shake(g, T, hit > 0 && hit < 0.2 ? 5 : 0);
      plainBack(g, T, true);
      
      const dk = this.lookOf('darkness');
      ell(g, rgba('#000000', 0.3), 100, 232, 18, 4);
      figure(g, dk, 100, 232, 2, { s: 0.8, v: hit > 0 ? { mouth: 'open' } : null });
      const [dx, dy] = figAt(100, 232, 1.6, 36, 54);
      greatsword(g, dx, dy, lerp(-1.4, 1.9, eOut(swing)), 62);
      if (swing > 0 && swing < 1) smear(g, dx, dy, 66, -2.4, -2.4 + 3.6 * swing, 0.9);
      rect(g, '#6a4a2a', 218, 170, 4, 62); rect(g, '#c8a870', 206, 176, 28, 18); ell(g, '#c8a870', 220, 166, 9, 9);
      ell(g, rgba('#000000', 0.3), 180, 232, 18, 4);
      figure(g, look, 180 + (hit > 0 && heal < 1 ? Math.sin(T * 40) * 1.5 : 0), 232, 2, { s: 0.8, flip: true });
      if (hit > 0) {
        lighter(g, () => glow(g, 176, 160, 20 * (1 - hit), '#ffffff', 0.9));
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (hx(i, 2, 109) - 0.5) * 2.6, d = eOut(hit) * (40 + hx(i, 3, 109) * 40), fy = 160 + Math.sin(a) * d + hit * hit * 70; if (fy < 232) gear(g, 178 + Math.cos(a) * d, fy, 3 + (i % 3) * 2, T * 8 + i, i % 2 ? '#c8a050' : '#b8b0c8'); else gear(g, 178 + Math.cos(a) * d, 230, 3 + (i % 3) * 2, i, i % 2 ? '#c8a050' : '#b8b0c8'); }
      }
      const aq = this.lookOf('aqua'), run = eOut(seg(t, 0.44, 0.56)), ax = lerp(LW + 30, 276, run);
      ell(g, rgba('#000000', 0.3), ax, 232, 18, 4);
      figure(g, aq, ax, 232, 2, { s: 0.78, flip: true, v: heal > 0 ? { mouth: 'open' } : null });
      if (heal > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(T * 10);
        lighter(g, () => glow(g, 180, 170, 34, '#7aff9a', 0.4 * pulse));
        if (H.FoursScenes) for (let i = 0; i < 5; i++) { const ph = (T * 0.8 + i / 5) % 1; H.FoursScenes.cross(g, 160 + hx(i, 2, 110) * 40, 200 - ph * 70, 1.1, (1 - ph) * 0.9); }
      }
      if (heal >= 0.6) { g.save(); g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#1a0806'; g.fillText('ИММУНИТЕТ', 133, 79); g.fillStyle = '#d8d0ff'; g.fillText('ИММУНИТЕТ', 132, 78); g.restore(); }
    }

    cut_guinaifen_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Гуйнайфэнь', cls: 'уличная артистка', stamp: 'ИДЁТ ЭФИР', stats: [['Сила', 0.4], ['Ловкость', 0.66], ['Магия', 0.5], ['Интеллект', 0.46]], big: ['Харизма', '#e8502a', '#ffe0c0'],
        fx: (g, a) => { if (H.FoursScenes) for (let i = 0; i < 4; i++) { g.save(); g.globalAlpha = a; H.FoursScenes.firework(g, 160 + hx(i, 2, 112) * 140, 30 + hx(i, 3, 112) * 120, (T * 0.5 + i / 4) % 1, ['#ff6a3a', '#ffd040', '#ff8ad8', '#8ad8ff'][i], i); g.restore(); } }
      });
    }

    cut_guinaifen_stream(g, t, T, look) {
      const pop = seg(t, 0.34, 0.44), trick = seg(t, 0.44, 0.62), mad = seg(t, 0.66, 0.74);
      guildBack(g, T);
      bust(g, look, lerp(110, 58, eOut(pop)), LH - 6, 124, 1, { v: (t < 0.34 && Math.sin(T * 12) > 0) || mad > 0 ? { mouth: 'open' } : null });
      if (pop > 0) {
        const aq = this.lookOf('aqua');
        bust(g, aq, 180, LH + 50 - 56 * eOut(pop), 120, 1, { v: { mouth: 'open' }, flip: true });
        if (trick > 0) {
          const fx = 196, fy = 176;
          if (H.FoursScenes) H.FoursScenes.fan(g, fx, fy, 16, -2.4, -0.7, '#4a9ad8', '#e8f0ff');
          for (let i = 0; i < 12; i++) { const ph = (T * 1.4 + i / 12) % 1, a = -Math.PI / 2 + (hx(i, 2, 113) - 0.5) * 1.6; ell(g, rgba('#bfe8ff', 0.9 * (1 - ph)), fx + Math.cos(a) * ph * 60, fy - 10 + Math.sin(a) * ph * 70 + ph * ph * 40, 2, 2.6); }
          for (let i = 0; i < 4; i++) flower(g, 160 + i * 26, 136 - Math.sin(i * 1.7) * 10, 1, cl(trick * 1.6 - i * 0.2), 0);
        }
      }
      rect(g, '#c82a2a', 12, 10, 8, 8); g.save(); g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('ЭФИР', 24, 18);
      const viewers = Math.round(pop > 0 ? lerp(12, 4096, eOut(trick)) : 7 + Math.floor(t * 8));
      g.fillStyle = '#ffd8a0'; g.fillText('Зрителей: ' + viewers, 12, 32); g.restore();
      rect(g, 'rgba(0,0,0,0.45)', 236, 30, 78, 110);
      const chat = pop > 0 ? ['АКВА!!!', 'Богиня!', 'ещё фокус', 'Аква лучше', '+100 эрис', 'АКВА!!!', 'кто это?'] : ['привет', 'Малышка Гуй!', 'огонь когда?', 'ку'];
      g.save(); g.font = '8px Georgia, serif';
      const n = pop > 0 ? Math.min(chat.length, 1 + Math.floor(trick * 9)) : chat.length;
      for (let i = 0; i < n; i++) { g.fillStyle = ['#ffd070', '#8ad8ff', '#ff8ad8', '#8affc0'][i % 4]; g.fillText(chat[chat.length - n + i] || '', 240, 42 + i * 14); }
      g.restore();
      if (trick > 0.4) for (let i = 0; i < 5; i++) { const ph = (T * 1.1 + i / 5) % 1; coin(g, lerp(276, 190, ph), lerp(60, 150, ph) - Math.sin(ph * Math.PI) * 20, 2.6, T * 6 + i, 1 - ph * 0.3); }
      if (mad > 0) { const [ex, ey, u] = bustAt(look, 58, LH - 6, 124, 1, 1, false); anger(g, ex + 22 * u, ey - 20 * u, 1.2, mad); }
    }

    cut_guinaifen_knives(g, t, T, look) {
      const hoopK = seg(t, 0.56, 0.74);
      plainBack(g, T, true);
      rect(g, '#7a4a2a', 196, 92, 80, 140); rect(g, '#9a6a3a', 196, 92, 80, 4);
      for (let r = 0; r < 4; r++) { g.strokeStyle = r % 2 ? '#e8e0d0' : '#c83a2a'; g.lineWidth = 4; g.beginPath(); g.ellipse(236, 150, 34 - r * 8, 52 - r * 12, 0, 0, Math.PI * 2); g.stroke(); } g.lineWidth = 1;
      const dk = this.lookOf('darkness');
      ell(g, rgba('#000000', 0.3), 236, 232, 18, 4);
      figure(g, dk, 236, 232, 2, { s: 0.78, flip: true, v: t > 0.6 ? { blush: true, mouth: 'open' } : { blush: true } });
      ell(g, rgba('#000000', 0.3), 70, 232, 18, 4);
      figure(g, look, 70, 232, 2, { s: 0.78 });
      const [hx2, hy2] = figAt(70, 232, 1.56, 36, 52);
      const spots = [[204, 110], [268, 120], [200, 176], [272, 186], [236, 98]];
      spots.forEach(([sx, sy], i) => {
        const k = seg(t, 0.12 + i * 0.08, 0.2 + i * 0.08);
        if (k <= 0) return;
        const x = lerp(hx2, sx, k), y = lerp(hy2, sy, k) - Math.sin(k * Math.PI) * 30;
        g.save(); g.translate(x, y); g.rotate(k < 1 ? T * 20 : (sx < 236 ? 0.3 : Math.PI - 0.3));
        rect(g, '#d8dce4', -1.5, -22, 3, 18); rect(g, '#ffffff', -0.5, -22, 1, 16); rect(g, '#d8b050', -4, -4, 8, 2); rect(g, '#5a3a20', -2, -2, 4, 10); g.restore();
        if (k < 1) lighter(g, () => glow(g, x, y, 8, '#ff7a3a', 0.8));
        else if (k < 1.01 || t < 0.2 + i * 0.08 + 0.05) star4(g, sx, sy, 5, '#fff4b0', 1);
      });
      if (hoopK > 0 && hoopK < 1 && H.FoursScenes) H.FoursScenes.hoop(g, lerp(hx2, 330, hoopK), lerp(hy2, 70, hoopK) - Math.sin(hoopK * Math.PI) * 20 + 50 * hoopK, 16, T, 1);
      if (t > 0.6) for (let i = 0; i < 4; i++) { const ph = (T * 0.7 + i / 4) % 1; heart(g, 214 + hx(i, 2, 114) * 44, 120 - ph * 50, 4.5, (1 - ph) * 0.9); }
      if (t > 0.74) { const [fx, fy] = figAt(70, 232, 1.56, 30, 12); ell(g, rgba('#bfe8ff', seg(t, 0.74, 0.8)), fx + 12, fy, 2.2, 3.4); }
    }

    cut_march_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Март 7', cls: 'лучница', stamp: 'ПРОШЛОЕ: НЕ ПОМНЮ', stats: [['Сила', 0.36], ['Ловкость', 0.58], ['Магия', 0.52], ['Интеллект', 0.4]], big: ['Оптимизм', '#ea6aa8', '#ffe0f0'],
        fx: (g, a) => { for (let i = 0; i < 12; i++) { const ph = (T * 0.35 + hx(i, 1, 115)) % 1, x = 130 + hx(i, 2, 115) * 190 + Math.sin(T * 2 + i) * 6; star4(g, Math.round(x), Math.round(ph * 250 - 20), 2 + (i % 3), i % 2 ? '#ffd8ec' : '#e8f8ff', a * (1 - ph * 0.5)); } }
      });
    }

    polaroid(g, x, y, rot, look, size) {
      g.save(); g.translate(x, y); g.rotate(rot);
      rect(g, 'rgba(0,0,0,0.3)', -46, -50, 96, 112); rect(g, '#fbfaf6', -48, -54, 96, 112); rect(g, '#2a2a3a', -42, -48, 84, 84);
      g.save(); g.beginPath(); g.rect(-42, -48, 84, 84); g.clip();
      vgrad(g, -48, 36, [[0, '#4a3020'], [1, '#2a1a10']]);
      bust(g, look, 0, 60, size, 1, { v: { mouth: 'open' } });
      g.restore();
      g.restore();
    }

    cut_march_photo(g, t, T, look) {
      const pop = seg(t, 0.46, 0.54), flash = seg(t, 0.56, 0.64), print = seg(t, 0.62, 0.74), come = seg(t, 0.7, 0.8);
      guildBack(g, T);
      const aq = this.lookOf('aqua');
      if (print <= 0) {
        bust(g, this.lookOf('kazuma'), 66, LH - 10, 112, 1);
        bust(g, this.lookOf('megumin'), 160, LH - 4, 112, 1, { v: t > 0.2 ? { mouth: 'open' } : null });
        bust(g, this.lookOf('darkness'), 254, LH - 10, 112, 1, { flip: true, v: { blush: true } });
        if (pop > 0) bust(g, aq, 160, LH + 80 - 110 * eOut(pop), 190, 1, { v: { mouth: 'open' } });
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2;
        for (const [x, y, dx, dy] of [[24, 24, 1, 1], [296, 24, -1, 1], [24, 200, 1, -1], [296, 200, -1, -1]]) { g.beginPath(); g.moveTo(x, y + 16 * dy); g.lineTo(x, y); g.lineTo(x + 16 * dx, y); g.stroke(); }
        g.lineWidth = 1; line(g, 'rgba(255,255,255,0.6)', 1, CX - 6, 112, CX + 6, 112); line(g, 'rgba(255,255,255,0.6)', 1, CX, 106, CX, 118);
        if (Math.sin(T * 6) > 0) ell(g, '#ff3a3a', 36, 36, 3, 3);
        const n = t < 0.12 ? 0 : t < 0.26 ? 3 : t < 0.4 ? 2 : t < 0.54 ? 1 : 0;
        if (n) { g.save(); g.font = 'bold 28px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillText(String(n), CX + 2, 62); g.fillStyle = '#ffffff'; g.fillText(String(n), CX, 60); g.restore(); }
      } else {
        bust(g, this.lookOf('kazuma'), 66, LH - 10, 112, 1, { v: { mouth: 'open' } });
        bust(g, aq, 254, LH - 10, 112, 1, { flip: true });
        this.polaroid(g, CX, lerp(-80, 104, eOut(print)), lerp(-0.6, -0.08, print), aq, 150);
        if (come > 0) { bust(g, look, lerp(LW + 60, 262, eOut(come)), LH - 4, 118, 1, { flip: true, v: { mouth: 'open' } }); anger(g, lerp(LW + 60, 262, eOut(come)) - 20, 130, 1.2, come); }
      }
      if (flash > 0) K.flash(g, '#ffffff', 1 - flash);
    }

    winterShogun(g, x, y, s, T, glowK) {
      if (glowK > 0) lighter(g, () => glow(g, x, y - 90 * s, 90 * s, '#9ad8ff', 0.5 * glowK));
      g.save(); g.translate(x, y); g.scale(s, s);
      for (let i = 0; i < 5; i++) ell(g, rgba('#ffffff', 0.35), -40 + i * 20 + Math.sin(T * 2 + i) * 4, -4, 22, 7);
      rect(g, '#5a6a8a', -20, -52, 14, 50); rect(g, '#5a6a8a', 6, -52, 14, 50);
      poly(g, '#7a8aaa', [-34, -46, 34, -46, 26, -84, -26, -84]); for (let i = 0; i < 4; i++) rect(g, '#a8c8e8', -30 + i * 2, -56 - i * 8, 60 - i * 4, 2);
      rect(g, '#8a9abc', -22, -124, 44, 42); rect(g, '#c8e0f8', -22, -110, 44, 3); rect(g, '#c8e0f8', -22, -98, 44, 3);
      poly(g, '#a8b8d8', [-22, -124, -46, -116, -42, -96, -22, -104]); poly(g, '#a8b8d8', [22, -124, 46, -116, 42, -96, 22, -104]);
      rect(g, '#6a7a9a', -40, -98, 12, 30); rect(g, '#6a7a9a', 28, -98, 12, 30);
      ell(g, '#a8b8d8', 0, -138, 17, 15); poly(g, '#8a9abc', [-26, -134, 26, -134, 20, -126, -20, -126]);
      poly(g, '#e8d070', [-4, -150, -26, -176, -14, -150]); poly(g, '#e8d070', [4, -150, 26, -176, 14, -150]);
      rect(g, '#141420', -10, -140, 20, 10); rect(g, '#ff3a4a', -7, -137, 4, 2); rect(g, '#ff3a4a', 3, -137, 4, 2);
      g.save(); g.translate(34, -72); g.rotate(-0.9); rect(g, '#2a2a3a', -2, 0, 4, 16); rect(g, '#e8d070', -6, -2, 12, 3); poly(g, '#e8f0ff', [-3.5, -2, 3.5, -2, 3, -86, 0, -94, -3, -86]); line(g, '#ffffff', 1, -1, -6, -1, -84); g.restore();
      g.restore();
    }

    cut_march_shogun(g, t, T, look) {
      const draw = seg(t, 0.12, 0.3), fly = seg(t, 0.3, 0.38), grow = seg(t, 0.38, 0.55), run = seg(t, 0.55, 0.66), bow = seg(t, 0.66, 0.72), leave = seg(t, 0.84, 1);
      shake(g, T, grow > 0 && grow < 0.3 ? 4 : 0);
      vgrad(g, 0, LH, [[0, '#2a3450'], [0.6, '#6a7a98'], [1, '#a8b4c8']]);
      poly(g, '#dfe6f0', [0, 160, 90, 150, 200, 158, LW, 148, LW, LH, 0, LH]);
      K.snowfall(g, T, 30, 62, { speed: 30, wind: 26, a: 0.8 });
      g.save(); g.globalAlpha = 1 - leave;
      this.winterShogun(g, 252 + leave * 40, 228, 0.9 + 0.14 * eOut(grow), T, grow);
      g.restore();
      const kz = this.lookOf('kazuma');
      if (bow <= 0) {
        ell(g, rgba('#000000', 0.25), 72, 232, 18, 4);
        figure(g, look, 72, 232, 2, { s: 0.78 });
        const [bx, by] = figAt(72, 232, 1.56, 36, 54);
        g.strokeStyle = '#d880b0'; g.lineWidth = 2; g.beginPath(); g.arc(bx + 2, by - 6, 22, -1.2, 1.2); g.stroke(); g.lineWidth = 1;
        const tx = bx + 2 + Math.cos(1.2) * 22, sx2 = bx + 2 - draw * 10 * (fly > 0 ? 0 : 1);
        line(g, '#ffffff', 1, tx, by - 6 - Math.sin(1.2) * 22, sx2, by - 6); line(g, '#ffffff', 1, sx2, by - 6, tx, by - 6 + Math.sin(1.2) * 22);
        if (fly > 0 && fly < 1) { const ax = lerp(bx, 250, eIn(fly)); lighter(g, () => { line(g, rgba('#bfe8ff', 0.9), 3, ax - 22, by - 8, ax, by - 10); glow(g, ax, by - 10, 10, '#9ad8ff', 0.9); }); }
        if (grow > 0 && grow < 1) { K.shards(g, grow, 250, by - 10, 12, 5, '#bfe8ff', 40, '#ffffff'); star4(g, 250, by - 10, 12 * (1 - grow), '#e8f8ff', 1 - grow); }
        if (run > 0) { const kx = lerp(-30, 40, eOut(run)); ell(g, rgba('#000000', 0.25), kx, 232, 16, 4); figure(g, kz, kx, 232, 2, { s: 0.74, v: { mouth: 'open' } }); }
      } else {
        figure(g, kz, 20, 190, 2, { s: 0.6, rot: Math.PI / 2 });
        figure(g, look, 40, 208, 2, { s: 0.6, rot: Math.PI / 2 });
        for (let i = 0; i < 3; i++) ell(g, rgba('#bfe8ff', 0.9), 150 + i * 10, 166 - i * 6, 2, 3);
      }
      if (grow >= 1 && bow <= 0) { g.save(); g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#1a2a4a'; g.fillText('Поглощено!', 211, 77); g.fillStyle = '#e8f8ff'; g.fillText('Поглощено!', 210, 76); g.restore(); }
      if (t > 0.76 && leave < 1) bubble(g, 206, 52, '…', seg(t, 0.76, 0.82) * (1 - leave));
    }

    cut_danheng_card(g, t, T, look) {
      this.advCard(g, t, T, look, {
        name: 'Дань Хэн', cls: 'копейщик', stamp: 'О ПРОШЛОМ МОЛЧИТ', stats: [['Сила', 0.54], ['Ловкость', 0.68], ['Магия', 0.46], ['Интеллект', 0.66]], big: ['Хладнокровие', '#2a9a8a', '#d8fff4'],
        fx: (g, a) => { for (let i = 0; i < 10; i++) { const ph = (T * 0.7 + i / 10) % 1; rect(g, rgba('#d8fff4', a * 0.7 * (1 - ph)), Math.round(130 + ph * 200), Math.round(20 + hx(i, 2, 117) * 200), 18, 1); } }
      });
    }

    cut_danheng_archive(g, t, T, look) {
      const burst = seg(t, 0.62, 0.8);
      shake(g, T, burst > 0 && burst < 0.25 ? 4 : 0);
      guildBack(g, T);
      const cx = 60, cy = 74, w = 120, dh = 28;
      rect(g, '#5a3a20', cx - 4, cy - 6, w + 8, dh * 4 + 12); rect(g, '#7a5030', cx - 4, cy - 6, w + 8, 4);
      const labels = ['Казума: кражи', 'Мегумин: взрывы', 'Даркнесс: ...', 'Аква: долги'];
      labels.forEach((lab, i) => {
        const k = seg(t, 0.1 + i * 0.14, 0.18 + i * 0.14), y = cy + i * dh, out = (i === 3 ? 26 : 16) * eOut(k) * (i < 3 ? 1 - seg(t, 0.2 + i * 0.14, 0.26 + i * 0.14) : 1);
        rect(g, '#2a1a10', cx, y, w, dh - 2);
        rect(g, i === 3 ? '#9a6a3a' : '#8a5a34', cx - out * 0.3, y + out * 0.2, w + out * 0.6, dh - 4 + out * 0.1);
        if (k > 0 && i === 3) for (let p = 0; p < 6; p++) rect(g, '#f4ead0', cx + 8 + p * 18, y - 4 - (p % 2) * 3, 12, 8);
        rect(g, '#efe0c0', cx + w / 2 - 30, y + 8 + out * 0.2, 60, 10);
        g.save(); g.font = '7px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#2a1a10'; g.fillText(lab, cx + w / 2, y + 16 + out * 0.2); g.restore();
        rect(g, '#d8b050', cx + w / 2 - 4, y + 20 + out * 0.2, 8, 2);
      });
      ell(g, rgba('#000000', 0.3), 240, 232, 18, 4);
      figure(g, look, 240, 232, 2, { s: 0.8, flip: true });
      if (burst > 0) {
        for (let i = 0; i < 26; i++) { const a = -Math.PI * (0.05 + hx(i, 2, 118) * 0.5), d = eOut(burst) * (60 + hx(i, 3, 118) * 140), px = cx + w / 2 + Math.cos(a) * d * 1.2, py = cy + 3 * dh + Math.sin(a) * d * 0.6 + burst * burst * 120; g.save(); g.translate(px, Math.min(py, 226 - (i % 5) * 6)); g.rotate(T * 3 + i); rect(g, '#f4ead0', -6, -4, 12, 8); rect(g, '#c8b890', -4, -1, 8, 1); g.restore(); }
        const pile = seg(t, 0.7, 0.86);
        if (pile > 0) { ell(g, '#efe4c8', 230, 236, 70 * pile, 30 * pile); ell(g, '#f8f0dc', 226, 230, 56 * pile, 22 * pile); for (let i = 0; i < 8; i++) rect(g, '#c8b890', 186 + i * 11, 222 - (i % 3) * 5, 8, 1); }
      }
      if (t > 0.84) bubble(g, 240, 100, '…', seg(t, 0.84, 0.9));
    }

    cut_danheng_tide(g, t, T, look) {
      const horn = seg(t, 0.06, 0.2), drag = seg(t, 0.16, 0.42), aqk = seg(t, 0.38, 0.56), flood = seg(t, 0.56, 0.8);
      shake(g, T, flood > 0 && flood < 0.3 ? 5 : 0);
      guildBack(g, T);
      const aq = this.lookOf('aqua'), kz = this.lookOf('kazuma');
      if (flood <= 0) bust(g, kz, CX, LH + 20, 96, 1);
      ell(g, rgba('#000000', 0.3), 250, 232, 18, 4);
      figure(g, look, 250, 232, 2, { s: 0.8, flip: true });
      if (horn > 0) {
        const u = 1.6, [fx, fy] = G.figEye(look, 1), hx0 = 250 - (fx - 24) * u, hy0 = 232 + (fy - G.FIG_FOOT) * u - 9 * u;
        for (const d of [-1, 1]) { const bx = hx0 + d * 5 * u; g.save(); g.globalAlpha = horn; poly(g, '#3aa894', [bx - 1.5, hy0 + 2, bx + d * 4, hy0 - 14, bx + d * 8, hy0 - 20, bx + d * 3, hy0 - 10, bx + 1.5, hy0 + 2]); poly(g, '#bff8e8', [bx, hy0, bx + d * 4, hy0 - 14, bx + d * 2, hy0 - 6]); g.restore(); }
        lighter(g, () => glow(g, hx0, hy0 - 6, 18, '#7ae8c8', 0.6 * horn));
      }
      if (drag > 0) lighter(g, () => { g.strokeStyle = rgba('#7ae8d8', 0.8 * (1 - flood)); g.lineWidth = 7; g.beginPath(); for (let i = 0; i <= 40; i++) { const k = i / 40 * drag, q = k * Math.PI * 4 + T * 2, x = 230 - k * 50 + Math.cos(q) * 20, y = 170 - k * 120 + Math.sin(q) * 10; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.lineWidth = 1; if (drag > 0.9) { ell(g, rgba('#bff8e8', 0.9 * (1 - flood)), 180, 52, 8, 6); ell(g, '#141420', 182, 50, 1.4, 1.4); } });
      ell(g, rgba('#000000', 0.3), 70, 232, 18, 4);
      figure(g, aq, 70, 232, 2, { s: 0.8, v: aqk > 0 ? { mouth: 'open' } : null });
      if (aqk > 0) lighter(g, () => { for (let i = 0; i < 3; i++) { const w = 10 + i * 6; poly(g, rgba('#7ac8ff', (0.3 - i * 0.08) * (1 - flood * 0.6)), [70 - w, 232, 70 + w, 232, 70 + w * 0.4, 232 - 170 * eOut(aqk), 70 - w * 0.4, 232 - 170 * eOut(aqk)]); } glow(g, 70, 100, 40, '#9ad8ff', 0.3 * aqk); });
      if (flood > 0) {
        const lvl = 232 - 90 * eOut(flood);
        g.save(); g.globalAlpha = 0.75; g.fillStyle = '#3a8ac8'; g.beginPath(); g.moveTo(0, LH); for (let x = 0; x <= LW; x += 8) g.lineTo(x, lvl + Math.sin(x * 0.08 + T * 6) * 4); g.lineTo(LW, LH); g.closePath(); g.fill(); g.restore();
        bust(g, kz, CX, lvl + 40, 96, 1, { v: { mouth: 'open' } });
        g.save(); g.globalAlpha = 0.5; g.fillStyle = '#3a8ac8'; g.fillRect(0, lvl + 16, LW, LH); g.restore();
        for (let x = 0; x <= LW; x += 16) ell(g, rgba('#e8f8ff', 0.8), x + Math.sin(T * 3 + x) * 3, lvl + Math.sin(x * 0.08 + T * 6) * 4 - 1, 5, 1.5);
        if (flood >= 1) for (let i = 0; i < 4; i++) { const ph = (T + i / 4) % 1; ell(g, rgba('#e8f8ff', 1 - ph), CX - 20 + i * 12, lvl - 4 - ph * 20, 2.5, 2.5); }
      }
    }

    cut_caelus_card(g, t, T, look, r) {
      this.advCard(g, t, T, look, {
        name: this.trailName('Келус', r), cls: 'главный герой?', stamp: 'ЯДРО ВНУТРИ', stats: [['Сила', 0.6], ['Ловкость', 0.54], ['Магия', 0.42], ['Интеллект', 0.52]], big: ['Стелларон', '#8a5ad8', '#f0e0ff'],
        fx: (g, a) => lighter(g, () => { for (let i = 0; i < 10; i++) { const ph = (T * 0.6 + i / 10) % 1, ang = i * 2.4 + T; rect(g, rgba('#d8b0ff', a * (1 - ph)), Math.round(76 + Math.cos(ang) * ph * 60), Math.round(170 + Math.sin(ang) * ph * 40), 2, 2); } glow(g, 76, 196, 26, '#b48cff', 0.4 * a); })
      });
    }

    cut_caelus_smash(g, t, T, look) {
      plainBack(g, T, true);
      const hit = seg(t, 0.5, 0.58), lunge = eOut(seg(t, 0.15, 0.5));
      shake(g, T, hit > 0 && t < 0.7 ? 3 : 0);
      const tx = lerp(280, 196, lunge);
      g.save();
      if (hit > 0) { g.translate(tx, 214); g.rotate(hit * 0.6); g.scale(1, 1 - hit * 0.3); g.translate(-tx, -214); }
      toad(g, tx, 214 + hit * 6, 0.75, T * (1 - hit), { gape: hit > 0 ? 0.1 : 0.8 });
      g.restore();
      if (hit > 0) for (let i = 0; i < 3; i++) star4(g, tx - 20 + i * 18, 140 + Math.sin(T * 6 + i) * 4, 3, '#ffe060', 0.9);
      ell(g, rgba('#000000', 0.25), 110, 230, 20, 4);
      figure(g, look, 110, 230, 2, { s: 0.86, v: { mood: 'flat' } });
      const [hx2, hy2] = figAt(110, 230, 2 * 0.86, 38, 54), sw = eOut(seg(t, 0.44, 0.52));
      bat(g, hx2, hy2, t < 0.44 ? 0.3 : lerp(-1.6, 1.1, sw), 1.3);
      if (sw > 0 && sw < 1) smear(g, hx2, hy2, 50, -Math.PI / 2 - 1.6, -Math.PI / 2 + lerp(-1.6, 1.1, sw), 1);
      if (hit > 0 && hit < 1) lighter(g, () => glow(g, 170, 180, 40, '#ffffff', 1 - hit));
    }

    cut_caelus_splash(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a3a5a'], [1, '#1a2238']]);
      const aqua = this.lookOf('aqua'), wave = seg(t, 0.3, 0.55), wet = t > 0.5;
      bust(g, aqua, 62, LH + 4, 128, 1, { v: { mouth: 'open' }, flip: true });
      bust(g, look, 250, LH + 6, 136, 1, { v: { mood: 'flat' } });
      lighter(g, () => glow(g, 250, 200, 22 + 4 * Math.sin(T * 5), '#b48cff', 0.6));
      if (wave > 0 && wave < 1) { lighter(g, () => { g.strokeStyle = rgba('#8ad0ff', 0.9); g.lineWidth = 14; g.beginPath(); for (let k = 0; k <= 16; k++) { const q = k / 16 * wave, x = lerp(110, 290, q), y = 150 - Math.sin(q * Math.PI) * 70 + Math.sin(q * 10 + T * 8) * 6; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.lineWidth = 1; }); }
      if (wave >= 1) for (let i = 0; i < 16; i++) { const ph = (T * 1.4 + i / 16) % 1; ell(g, rgba('#bfe8ff', 0.9 * (1 - ph)), 200 + hx(i, 2, 58) * 100, 90 + ph * 120, 1.5, 2.6); }
      if (wet) { for (let i = 0; i < 5; i++) rect(g, rgba('#bfe8ff', 0.7), 214 + i * 16, 96 + (i % 2) * 6, 2, 10 + (i % 3) * 4); }
      if (t > 0.7) bubble(g, 240, 40, '…Спасибо. Я как раз хотел помыться.', seg(t, 0.7, 0.82), true);
    }

    cut_caelus_sane(g, t, T, look) {
      hillBack(g, T);
      blast2d(g, T, 169, 92, (T * 0.3) % 1, '#ff8a3a');
      for (let i = 0; i < 3; i++) { const ph = (T * 0.8 + i / 3) % 1; heart(g, 150 + i * 12, 150 - ph * 30, 2.5, 1 - ph); }
      const kaz = this.lookOf('kazuma'), shake2 = eOut(seg(t, 0.1, 0.3)), shock = seg(t, 0.62, 0.72);
      bust(g, kaz, lerp(40, 100, shake2), LH + 4, 132, 1, { v: { mouth: 'open' } });
      bust(g, look, 228, LH + 6, 136, 1, { v: { mood: 'flat' } });
      if (shake2 >= 1 && shock <= 0) for (let i = 0; i < 4; i++) star4(g, 150 + i * 10, 150 + Math.sin(T * 8 + i) * 4, 3, '#fff0b0', 0.9);
      if (t > 0.55) bubble(g, 228, 40, '…Я, кстати, тоже проверяю урны.', seg(t, 0.55, 0.66), true);
      if (shock > 0) { g.save(); g.globalAlpha = shock; g.font = 'bold 22px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('!!', 72, 96); g.fillStyle = '#ffe060'; g.fillText('!!', 70, 94); g.restore(); }
    }

    cut_kazuma_toad(g, t, T, look) {
      plainBack(g, T, true);
      const hop = Math.abs(Math.sin(T * 5)) * 4;
      toad(g, 236, 214 - hop, 0.95, T, { gape: 0.35, legs: true, slime: true, puff: 0.3 + 0.1 * Math.sin(T * 9) });
      const k = eOut(seg(t, 0, 0.45)), x = lerp(-30, 66, k), u = 2 * 0.9;
      if (k < 1) for (let i = 0; i < 4; i++) ell(g, rgba('#c8b890', 0.5 * (1 - k)), x - 20 - i * 12, 224 - (i % 2) * 3, 6 - i, 3);
      ell(g, rgba('#000000', 0.25), x, 226, 22, 4);
      figure(g, look, x, 226, 2, { s: 0.9, rot: (1 - k) * 0.14 });
      if (t > 0.45) {
        const [hx2, hy2] = figAt(x, 226, u, 38, 56), a = seg(t, 0.45, 0.6);
        lighter(g, () => { glow(g, hx2, hy2, 18 + 3 * Math.sin(T * 10), '#9affb0', 0.8 * a); ring(g, rgba('#c8ffd8', 0.7 * a), 1, hx2, hy2, 8 + 6 * a); });
        g.save(); g.globalAlpha = a; g.font = 'bold 18px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('!', x - 3, 226 - 96 * u + 6); g.fillStyle = '#ffffff'; g.fillText('!', x - 4, 226 - 96 * u + 4); g.restore();
      }
    }

    cut_kazuma_steal(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#04140a'], [0.5, '#0a3a1a'], [1, '#04140a']]);
      K.speedLines(g, T, CX + 20, CY + 10, 40, '#c8ffd8', 0.6, 20);
      bust(g, look, 64, LH + 6, 150, 1, { v: { mouth: 'open' } });
      const grab = seg(t, 0.45, 0.6), s = lerp(1.5, 5, eIn(seg(t, 0, 0.5)));
      hand(g, CX + 30, CY + 10, s, 1 - grab);
      if (grab > 0) {
        const q = seg(t, 0.45, 0.8);
        lighter(g, () => { glow(g, CX + 30, CY + 10, 30 + 90 * q, '#ffffff', 0.9 * (1 - q)); ring(g, rgba('#c8ffd8', 1 - q), 2, CX + 30, CY + 10, 10 + 120 * q); });
        g.save(); g.translate(CX + 30, CY + 10); g.rotate(T * 8); g.scale(0.6 + q, 0.6 + q);
        ell(g, '#ffffff', 0, 0, 12, 12); g.font = 'bold 16px Georgia, serif'; g.fillStyle = '#0a3a1a'; g.textAlign = 'center'; g.fillText('?', 0, 6); g.textAlign = 'left';
        g.restore();
      }
      const k = eOut(seg(t, 0.1, 0.35));
      g.save(); g.globalAlpha = k; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center';
      g.fillStyle = '#062010'; g.fillText('КРАЖА!', CX + 22, 54); g.fillStyle = '#c8ffd8'; g.fillText('КРАЖА!', CX + 20, 52);
      g.textAlign = 'left'; g.restore();
    }

    cut_kazuma_catch(g, t, T, look) {
      plainBack(g, T, true);
      const spit = seg(t, 0.45, 0.75), aqua = this.lookOf('aqua');
      toad(g, 176, 156, 0.42, T, { gape: spit > 0 && spit < 1 ? 1 : 0.15, legs: spit <= 0, puff: spit > 0 && spit < 0.4 ? 0.8 : 0 });
      if (spit > 0) {
        const land = spit >= 1, ax = land ? 128 : lerp(144, 128, spit), ay = land ? 170 : lerp(130, 170, spit) - Math.sin(spit * Math.PI) * 30;
        figure(g, aqua, ax, ay, 1, { s: 0.75, rot: land ? -Math.PI / 2 : -spit * 2.4 });
        if (land) { ell(g, rgba('#e8f0c8', 0.7), 128, 172, 30, 3); g.font = 'bold 10px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('Тьфу!', 167, 101); g.fillStyle = '#ffffff'; g.fillText('Тьфу!', 166, 100); }
        for (let i = 0; i < 6; i++) { const ph = seg(t, 0.45 + i * 0.03, 0.9); if (ph > 0 && ph < 1) ell(g, rgba('#e8f0c8', 0.8 * (1 - ph)), lerp(144, 110 + i * 8, ph), 130 + ph * 40 - Math.sin(ph * Math.PI) * 20, 2, 2); }
      }
      const meg = this.lookOf('megumin'), mk = eOut(seg(t, 0.25, 0.55));
      bust(g, meg, lerp(-60, 44, mk), LH + 4, 116, 1, { v: { mouth: 'open', blush: true }, flip: true });
      if (mk > 0.9) anger(g, 74, 140, 2, 1);
      bust(g, look, 266, LH + 4, 128, 1, { v: { mouth: 'open' } });
      const up = eOut(seg(t, 0, 0.3)), px = 290, py = lerp(170, 82, up);
      g.save(); g.translate(px, py); g.rotate(Math.sin(T * 6) * 0.12);
      poly(g, '#f8f8f8', [-11, -6, 11, -6, 7, 4, 2, 7, -2, 7, -7, 4]); poly(g, '#e8e8f0', [-11, -6, 11, -6, 10, -3, -10, -3]);
      ell(g, '#ff7aa8', 0, -5, 2, 1.4); rect(g, '#d8d8e0', -2, 2, 4, 1);
      g.restore();
      lighter(g, () => glow(g, px, py, 18, '#ffffff', 0.5 * up));
    }

    cut_aqua_rise(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#0a1430'], [0.6, '#1a2a5a'], [1, '#0a1020']]);
      const rays = seg(t, 0.4, 0.9);
      lighter(g, () => { for (let i = 0; i < 9; i++) { const x = 40 + i * 30 + Math.sin(T + i) * 6; poly(g, rgba('#fff6d0', 0.16 * rays), [x - 6, 0, x + 6, 0, x + 26, LH, x - 26, LH]); } glow(g, CX, 40, 90, '#bfe8ff', 0.4 * rays); });
      ell(g, '#5a6070', CX, 206, 84, 14); ell(g, '#3a4050', CX, 202, 76, 10); ell(g, '#4aa0d8', CX, 202, 70, 8);
      const rise = eOut(seg(t, 0.05, 0.65)), fy = lerp(370, 176, rise);
      g.save(); g.beginPath(); g.rect(0, 0, LW, 202); g.clip();
      if (fy < 202) { rect(g, rgba('#8ad0ff', 0.85), CX - 14 + Math.sin(T * 20), fy - 2, 28, 204 - fy); for (let i = 0; i < 4; i++) rect(g, rgba('#ffffff', 0.7), Math.round(CX - 10 + i * 6 + Math.sin(T * 30 + i) * 2), Math.round(fy + ((T * 120 + i * 13) % (202 - fy + 1))), 1, 6); }
      figure(g, look, CX, fy, 2, { s: 0.8 });
      g.restore();
      if (fy < 230) for (let i = 0; i < 16; i++) { const ph = (T * 1.6 + i / 16) % 1, a = hx(i, 1, 51) * Math.PI, x = CX + Math.cos(a) * (12 + ph * 40) * (i % 2 ? 1 : -1), y = Math.min(fy, 202) - Math.sin(ph * Math.PI) * 26 + ph * 20; ell(g, rgba('#bfe8ff', 0.9 * (1 - ph)), x, y, 1.6, 2.2); }
      rect(g, '#5a6070', CX - 84, 206, 168, 6);
      for (let i = 0; i < 14; i++) { const x = 10 + i * 23, bow = Math.max(0, Math.sin(T * 5 + i * 0.6)) * 6 * rays, y = 224 + bow; ell(g, '#120a14', x, y, 10, 9); rect(g, '#120a14', x - 9, y, 18, 20); }
    }

    cut_aqua_cage(g, t, T, look) {
      const clean = seg(t, 0.2, 1) * 0.6, water = lakeBack(g, T, clean);
      cage(g, CX, 70, 100, 130);
      bust(g, look, CX, 196, 116, 1, { v: { closed: true } });
      g.save(); g.globalAlpha = 0.55; vgrad(g, 150, LH, [[0, water], [1, '#0a2a4a']]); g.restore();
      rect(g, rgba('#e8f8ff', 0.6), 0, 150, LW, 1);
      cage(g, CX, 70, 100, 130);
      for (let i = 0; i < 3; i++) { const q = seg(t, 0.2 + i * 0.22, 0.9 + i * 0.22); if (q > 0 && q < 1) lighter(g, () => { g.strokeStyle = rgba('#bfe8ff', 1 - q); g.beginPath(); g.ellipse(CX, 152, 50 + q * 150, 6 + q * 18, 0, 0, Math.PI * 2); g.stroke(); }); }
      lighter(g, () => glow(g, CX, 150, 60, '#bfe8ff', 0.4 * seg(t, 0.2, 0.5)));
      for (let i = 0; i < 14; i++) { const ph = (T * 0.8 + i / 14) % 1; star4(g, 70 + hx(i, 2, 66) * 180, 160 - ph * 110, 2.5, '#ffffff', (1 - ph) * seg(t, 0.2, 0.4)); }
    }

    cut_aqua_gators(g, t, T, look) {
      const hits = [0.2, 0.45, 0.7], tt = freeze(t, hits, 0.06), hitAmp = Math.max(...hits.map(h => 1 - seg(t, h, h + 0.15))) * (t > 0.2 ? 3 : 0);
      shake(g, T, hitAmp);
      const water = lakeBack(g, T, 0.6), n = hits.filter(h => tt >= h).length;
      bust(g, look, CX, 196, 116, 1, { v: { mouth: 'open' } });
      tears(g, look, CX, 196, 116, 1, T, seg(t, 0.1, 0.3));
      g.save(); g.globalAlpha = 0.55; vgrad(g, 150, LH, [[0, water], [1, '#0a2a4a']]); g.restore();
      rect(g, rgba('#e8f8ff', 0.6), 0, 150, LW, 1);
      const bend = [n >= 1 ? 4 : 0, n >= 1 ? 2 : 0, 0, 0, 0, 0, 0, n >= 2 ? -2 : 0, n >= 2 ? -5 : 0];
      cage(g, CX, 70, 100, 130, bend);
      const bite = h => { const q = seg(tt, h - 0.15, h + 0.1); return Math.sin(q * Math.PI); };
      gator(g, CX - 92, 150, 1, bite(0.2), 1);
      gator(g, CX + 92, 154, 1, bite(0.45), -1);
      gator(g, CX + 40, 214, 1.5, bite(0.7), -1);
      hits.forEach((h, i) => { const q = seg(t, h, h + 0.3); if (q > 0 && q < 1) { const x = [CX - 52, CX + 52, CX + 4][i], y = [140, 144, 196][i]; K.shards(g, q, x, y, 8, 5 + i, '#8a8a98', 30, '#ffffff'); g.save(); g.globalAlpha = 1 - q; g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('Хрусь!', x - 18, y - 22 - q * 10); g.fillStyle = '#ffffff'; g.fillText('Хрусь!', x - 19, y - 23 - q * 10); g.restore(); } });
    }

    cut_aqua_drag(g, t, T, look) {
      vgrad(g, 0, 120, [[0, '#f0a060'], [1, '#f8d8a8']]);
      ell(g, '#fff0c0', 60, 96, 14, 14);
      poly(g, '#3a5a4a', [0, 112, 60, 102, 140, 110, 220, 98, LW, 108, LW, 124, 0, 124]);
      vgrad(g, 122, 160, [[0, '#6ab8e8'], [1, '#4a98d0']]);
      for (let i = 0; i < 12; i++) star4(g, Math.round((hx(i, 2, 33) * LW + T * 10) % LW), 128 + Math.floor(hx(i, 3, 33) * 28), 2 + Math.abs(Math.sin(T * 4 + i)) * 2, '#ffffff', 0.8);
      vgrad(g, 158, LH, [[0, '#d8c090'], [1, '#a88a5a']]);
      const pull = eOut(seg(t, 0.1, 0.35)) * 10 + eOut(seg(t, 0.55, 0.8)) * 10, x = 96 + pull, kx = 250, lean = -0.2 - 0.06 * Math.sin(Math.min(1, t / 0.35) * Math.PI);
      for (let i = 0; i < 8; i++) rect(g, rgba('#8a7048', 0.6), Math.round(x - 60 - i * 9), 214 + (i % 2), 6, 1);
      rect(g, '#6a4a2a', x - 50, 206, 100, 6);
      const ab = 206;
      bust(g, look, x, ab, 92, 1, { v: { closed: true } });
      tears(g, look, x, ab, 92, 1, T, 0.6);
      cage(g, x, 106, 84, 100);
      const u = 2 * 0.85, [hx2, hy2] = figAt(kx, 226, u, 18, 56);
      line(g, '#c8a060', 2, x + 42, 150, hx2 + 4, hy2 + 4);
      ell(g, rgba('#000000', 0.25), kx, 226, 22, 4);
      figure(g, this.lookOf('kazuma'), kx, 226, 2, { s: 0.85, rot: lean });
      if (t > 0.35) for (let i = 0; i < 3; i++) { const ph = (T * 2 + i / 3) % 1; ell(g, rgba('#bfe8ff', 1 - ph), kx + 10 + i * 4, 226 - 92 * u + ph * 10, 1.4, 2); }
    }

    cut_megumin_name(g, t, T, look) {
      dusk(g, true);
      const size = 190, s = 1.2, bx = CX + 20, by = LH + 40, [gx, gy] = bustAt(look, bx, by, size, s, -1);
      rune2d(g, bx, by - size * s * 0.62, 120 * eOut(seg(t, 0, 0.5)), 120 * eOut(seg(t, 0, 0.5)), T * 0.6, '#ff6a5a', 0.6);
      bust(g, look, bx, by, size, s);
      lighter(g, () => { glow(g, gx, gy, 10 + 6 * Math.sin(T * 10), '#ff2a3a', 0.9 * seg(t, 0.3, 0.5)); star4(g, gx, gy, 6 + 5 * eOut(seg(t, 0.35, 0.6)), '#ffd0d0', 0.9 * seg(t, 0.3, 0.5)); });
      K.embers(g, T, 30, 13, 0, LW, LH, '#ff6a4a');
      const cape = seg(t, 0, 0.45);
      if (cape < 1) { const x0 = lerp(420, 820, eOut(cape)); poly(g, '#14101a', [x0 - 400, 0, LW + 100, 0, LW + 100, LH, x0 - 480, LH]); poly(g, '#d8b444', [x0 - 404, 0, x0 - 400, 0, x0 - 480, LH, x0 - 484, LH]); }
      const st = eOut(seg(t, 0.5, 0.7));
      if (st > 0) {
        g.save(); g.translate(86, 84); g.rotate(-0.12); g.scale(lerp(1.8, 1, st), lerp(1.8, 1, st)); g.globalAlpha = st;
        g.font = 'bold 26px Georgia, serif'; g.textAlign = 'center';
        g.fillStyle = '#1a0606'; g.fillText('МЕГУМИН', 2, 2); g.fillStyle = '#ff4a3a'; g.fillText('МЕГУМИН', 0, 0);
        g.font = 'italic 9px Georgia, serif'; g.fillStyle = '#ffd0c8'; g.fillText('архимаг Алого народа', 0, 14);
        g.textAlign = 'left'; g.restore();
      }
    }

    cut_megumin_circles(g, t, T, look) {
      dusk(g, true);
      K.stars(g, T, 40, 4, 0.5, 120);
      const tilt = sm(seg(t, 0.3, 1)) * 70, u = 3 * 0.82;
      g.save(); g.translate(0, tilt);
      for (let i = 0; i < 5; i++) { const kk = eOut(cl((t - i * 0.14) / 0.35)); rune2d(g, CX, 60 - i * 24, (50 + i * 14) * kk, (12 + i * 3) * kk, T * (i % 2 ? -1.4 : 1.4), i % 2 ? '#ff6a5a' : '#ffb070', 0.9 * kk); }
      rimFigure(g, look, CX, 232, 3, '#ff4a4a', { s: 0.82 });
      const [ox, oy] = G.staffOrb(look), sx = CX + (ox - 24) * u, sy = 232 + (oy - G.FIG_FOOT) * u;
      lighter(g, () => { glow(g, sx, sy, 14 + 4 * Math.sin(T * 9), '#ff4a5a', 0.9); line(g, rgba('#ff8a7a', 0.5 * seg(t, 0.2, 0.5)), 2, sx, sy, CX, -20); });
      g.restore();
      K.embers(g, T, 40, 41, 40, 280, 230, '#ff6a4a');
    }

    cut_megumin_blast(g, t, T, look) {
      shake(g, T, (1 - seg(t, 0, 0.6)) * 4);
      dusk(g, true);
      poly(g, '#1a0c10', [0, 150, 70, 136, 150, 144, 200, 128, 260, 140, LW, 132, LW, 170, 0, 170]);
      const k = seg(t, 0, 0.9);
      blast2d(g, T, 206, 124, k, '#ff8a3a');
      lighter(g, () => { const q = eOut(k); g.strokeStyle = rgba('#ffd8a0', 1 - q); g.lineWidth = 2; g.beginPath(); g.ellipse(206, 150, 20 + q * 200, 4 + q * 24, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; });
      poly(g, '#140a0c', [0, 186, LW, 180, LW, LH, 0, LH]);
      figure(g, look, 96, 244, 3, { s: 0.82, tint: '#ff8a3a', ta: 1 });
      figure(g, look, 94, 244, 3, { s: 0.82, tint: '#140a10', ta: 0.94 });
      K.flash(g, '#fff0e0', t < 0.12 ? 1 - t / 0.12 : 0);
    }

    cut_megumin_fall(g, t, T, look) {
      hillBack(g, T);
      for (let i = 0; i < 5; i++) { const ph = (T * 0.2 + i / 5) % 1; ell(g, rgba(i % 2 ? '#4a3430' : '#5a4038', 0.6 * (1 - ph)), 169 + Math.sin(i * 2 + T) * 6 * ph, 92 - ph * 80, 6 + ph * 18, 4 + ph * 10); }
      const k = eOut(seg(t, 0, 0.35)), bounce = t > 0.35 ? Math.abs(Math.sin(seg(t, 0.35, 0.55) * Math.PI)) * 4 : 0;
      figure(g, look, CX + 30 + k * 60, 218 - k * 12 - bounce, 2, { rot: -k * Math.PI / 2 });
      if (k >= 1) {
        for (let i = 0; i < 6; i++) { const ph = seg(t, 0.35, 0.7); ell(g, rgba('#c8b890', 0.6 * (1 - ph)), CX - 10 + (i - 3) * 16 * (1 + ph), 226 - ph * 10, 6, 3); }
        for (let i = 0; i < 3; i++) { const ph = (T * 0.8 + i / 3) % 1; ell(g, rgba('#ffffff', 0.5 * (1 - ph)), CX - 74 + i * 6, 190 - ph * 24, 3 + ph * 4, 2 + ph * 3); }
        g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#ffffff'; g.fillText('…', CX - 92, 172);
      }
    }

    cut_megumin_carry(g, t, T, look) {
      hillBack(g, T, '#ff8a5a');
      for (let i = 0; i < 7; i++) { const ph = (T * 0.2 + i / 7) % 1; ell(g, rgba(i % 2 ? '#4a3430' : '#5a4038', 0.6 * (1 - ph)), 169 + Math.sin(i * 2 + T) * 6 * ph, 92 - ph * 80, 6 + ph * 18, 4 + ph * 10); }
      const bob = Math.abs(Math.sin(T * 6)) * 2, kx = lerp(120, 136, t / 1.2), ky = 236 - bob, s = 0.86, u = 2 * s;
      ell(g, rgba('#1a0c08', 0.5), kx - 30, ky + 2, 50, 5);
      const shoulder = ky + (30 - G.FIG_FOOT) * u;
      g.save(); g.beginPath(); g.rect(0, 0, LW, shoulder); g.clip();
      figure(g, look, kx + 23, ky - 10 * u, 2, { s, rot: 0.08, tint: '#ff9a6a', ta: 1 });
      figure(g, look, kx + 22, ky - 10 * u, 2, { s, rot: 0.08, tint: '#2a1418', ta: 0.5 });
      g.restore();
      this.person(g, this.kazuma, { x: kx, y: ky, h: 89 * 2 * s }, { tint: '#2a1418', ta: 0.5, rim: '#ff9a6a' });
      for (const side of [-1, 1]) {
        const [bx, by] = figAt(kx, ky, u, 24 + side * 15, 58);
        poly(g, '#6a3820', [bx, by - 4, bx + side * 18, by - 2, bx + side * 21, by + 6, bx, by + 5]); rect(g, '#d8b040', Math.round(bx + side * 6), Math.round(by - 3), 2, 8);
        line(g, rgba('#ff9a6a', 0.8), 1, bx, by - 3, bx + side * 16, by - 1);
      }
      const [lx, ly] = figAt(kx, ky, u, 14, 30), [rx, ry] = figAt(kx, ky, u, 34, 30), [cx, cy] = figAt(kx, ky, u, 24, 40);
      line(g, '#5a1820', 5, lx, ly, cx + 2, cy); line(g, '#5a1820', 5, rx, ry, cx - 2, cy); ell(g, '#e8c8b0', cx, cy, 3, 2.4);
      line(g, rgba('#ff9a6a', 0.7), 1, rx, ry - 2, cx - 2, cy - 2);
      if (t > 0.6) { const a = seg(t, 0.6, 0.8); g.save(); g.globalAlpha = a; g.translate(kx + 40, ky - 120 * u / 2); g.rotate(0.12); rect(g, '#5a3a20', -1, 4, 2, 12); rect(g, '#f2eadc', -12, -8, 24, 13); rect(g, '#c83030', -12, -8, 24, 2); g.font = 'bold 8px Georgia, serif'; g.fillStyle = '#3a2410'; g.textAlign = 'center'; g.fillText(t > 0.95 ? '100' : '90', 0, 3); g.textAlign = 'left'; g.restore(); }
      K.vignette(g, 0.45);
    }

    cut_darkness_charge(g, t, T, look) {
      cabbageField(g, T);
      for (let i = 0; i < 12; i++) { const ph = ((T * 0.5 + hx(i, 1, 23)) % 1), x = lerp(LW + 30, 150, ph), y = 30 + hx(i, 2, 23) * 70 + Math.sin(T * 4 + i) * 6 + ph * 20; smugCabbage(g, x, y, 1.2 + hx(i, 3, 23) * 0.5, T * 3 + i); }
      const k = eOut(seg(t, 0, 0.6)), x = lerp(-40, 120, k), lean = 0.14 * (1 - seg(t, 0.6, 0.8)), u = 2 * 0.95, y = 230;
      if (k < 1) for (let i = 0; i < 5; i++) ell(g, rgba('#c8b890', 0.5 * (1 - k)), x - 22 - i * 12, y - 2 - (i % 2) * 3, 7 - i, 3);
      ell(g, rgba('#000000', 0.25), x, y, 22, 4);
      figure(g, look, x, y, 2, { s: 0.95, rot: lean });
      const [hx2, hy2] = figAt(x, y, u, 37, 56), up = seg(t, 0.6, 0.8);
      greatsword(g, hx2, hy2, lerp(0.9, -0.15, eOut(up)), 74);
      if (up >= 1) star4(g, hx2 - 12, hy2 - 82, 4 + 3 * Math.sin(T * 12), '#ffffff', 0.9);
    }

    cut_darkness_miss(g, t, T, look) {
      cabbageField(g, T);
      const x = 104, y = 230, u = 2 * 0.95, [px, py] = figAt(x, y, u, 37, 56);
      ell(g, rgba('#000000', 0.25), x, y, 22, 4);
      figure(g, look, x, y, 2, { s: 0.95, v: t > 0.75 ? { mouth: 'open' } : null });
      let ang = -1.9;
      for (let i = 0; i < 3; i++) {
        const t0 = 0.08 + i * 0.35, q = seg(t, t0, t0 + 0.16), back = seg(t, t0 + 0.24, t0 + 0.35);
        if (t >= t0) ang = lerp(-1.9, 1.3, eOut(q)) - (i < 2 ? back * 3.2 : 0);
        if (q > 0 && q < 1) smear(g, px, py, 80, -Math.PI / 2 - 1.9 + 0.2, -Math.PI / 2 + lerp(-1.9, 1.3, eOut(q)), 1 - q * 0.5);
        const tx = 210 + i * 22, ty = 150 - i * 14, d = eOut(seg(t, t0 - 0.04, t0 + 0.1));
        smugCabbage(g, tx + d * 18, ty - d * 30 + Math.sin(T * 6 + i) * 2, 1.7, Math.sin(T * 3 + i) * 0.3);
        if (q >= 1 && t < t0 + 0.4) { g.font = 'bold 12px Georgia, serif'; g.fillStyle = '#1a0c06'; g.fillText('Промах!', tx - 9, ty - 47); g.fillStyle = '#d8d0ff'; g.fillText('Промах!', tx - 10, ty - 48); }
      }
      greatsword(g, px, py, ang, 74);
    }

    cut_darkness_pelt(g, t, T, look) {
      const hits = [0.15, 0.35, 0.55, 0.75], tt = freeze(t, hits, 0.05), amp = Math.max(...hits.map(h => t >= h ? 1 - seg(t, h, h + 0.12) : 0)) * 4;
      shake(g, T, amp);
      vgrad(g, 0, LH, [[0, '#ffd8e8'], [0.6, '#f8b0c8'], [1, '#c87090']]);
      K.speedLines(g, T, 280, 80, 30, '#ffffff', 0.5, 30);
      const n = hits.filter(h => tt >= h).length;
      bust(g, look, 140, LH + 6, 180, 1, { v: n ? { blush: true, mouth: 'open' } : { blush: true } });
      const spots = [[150, 90], [112, 150], [176, 140], [138, 110]];
      hits.forEach((h, i) => {
        const [sx, sy] = spots[i];
        if (tt < h) { const q = seg(tt, h - 0.25, h); if (q > 0) cabbage(g, lerp(LW + 30, sx + 10, q), lerp(20 + i * 20, sy, q), 2.2, T * 6); }
        else { const q = seg(tt, h, h + 0.3); if (q < 1) { cabbage(g, sx + 10 + q * 80, sy - Math.sin(q * Math.PI) * 50, 2.2, T * 6); K.shards(g, q, sx, sy, 10, 9 + i, '#6ab84a', 40, '#a8e07a'); lighter(g, () => glow(g, sx, sy, 24, '#ffffff', 0.8 * (1 - q))); } }
      });
      if (n) for (let i = 0; i < 6; i++) { const ph = (T * 0.7 + i / 6) % 1; heart(g, 60 + hx(i, 3, 19) * 200, 220 - ph * 180, 4, 1 - ph); }
    }

    cut_darkness_wall(g, t, T, look) {
      cabbageField(g, T);
      const party = [['kazuma', 46, 0.08], ['aqua', 78, -0.06], ['megumin', 108, 0.05]];
      for (const [id, x, r] of party) figure(g, this.lookOf(id), x, 222, 2, { s: 0.55, rot: r + Math.sin(T * 20 + x) * 0.02 });
      const dx = 196, dy = 232, sh = seg(t, 0.05, 0.3);
      ell(g, rgba('#000000', 0.25), dx, dy, 24, 4);
      rimFigure(g, look, dx, dy, 2, '#ffd870', { s: 1, v: t > 0.6 ? { blush: true } : null });
      greatsword(g, dx + 34, dy + 6, Math.PI, 70);
      K.hexShield(g, dx, dy - 90, 86, 0.9 * sh, T, '#ffd870');
      for (let i = 0; i < 10; i++) {
        const ph = ((T * 1.2 + hx(i, 1, 37)) % 1), y = 70 + hx(i, 2, 37) * 110, hitX = dx + 60;
        if (ph < 0.6) cabbage(g, lerp(LW + 20, hitX, ph / 0.6), y, 1.4, T * 5 + i);
        else { const q = (ph - 0.6) / 0.4; cabbage(g, hitX + q * 40, y - Math.sin(q * Math.PI) * 30, 1.4, T * 5 + i); if (q < 0.3) lighter(g, () => glow(g, hitX, y, 14, '#ffe8a0', 0.8 * (1 - q / 0.3))); }
      }
      lighter(g, () => glow(g, dx, dy - 90, 70, '#ffe8a0', 0.25 * sh));
    }
    rackBg(g, T) {
      const x0 = g._wide ? -45 : 8, w0 = g._wide ? 410 : LW - 16;
      vgrad(g, 0, LH, [[0, '#2c1c12'], [1, '#120a06']]);
      rect(g, '#5a3a20', x0, 22, w0, LH - 34); rect(g, '#b4885a', x0 + 4, 26, w0 - 8, LH - 42);
      for (let i = 0; i < 420; i++) rect(g, i % 3 ? 'rgba(96,62,30,0.32)' : 'rgba(244,214,168,0.22)', x0 + 4 + (i * 73) % (w0 - 8), 26 + (i * 131) % (LH - 42), 1, 1);
    }

    paint() {
      const rw = this.ui && this.ui.wide && this.ui.wide() ? 427 : LW, ox = (rw - LW) >> 1;
      if (this.R.w !== rw) this.R = new R3.Raster(rw, LH);
      const R = this.R, g = R.g, T = this.t + this.rt;
      g._wide = rw > LW;
      g.save();
      if (ox) g.translate(ox, 0);
      if (this.phase === 'cine') {
        const [n, t] = this.shot();
        if (n === 'hill') this.hill(R, g, t, T);
        else if (n === 'chant') this.chant(R, g, t, T);
        else if (n === 'beam') this.beam(R, g, t, T);
        else if (n === 'boom') this.boom(R, g, t, T);
        else this.scoreShot(R, g, t, T);
      } else if (this.phase === 'reveal') {
        const r = this.item(), t = (this.rt - this.hop) / slowOf(r);
        if (t < 0) this.hopShot(g, this.rt);
        else if (r.kind !== 'char') this.stealShot(g, r, t, T);
        else if (this.cutsOf(r)) this.cutShot(g, r, t, T);
        else this.cardShot(g, r, t, T);
      } else this.rackBg(g, T);
      g.restore();
      H.Cine.dither(g);
      return R.cv;
    }

    render() { return this.paint(); }

    draw(c) {
      const ui = this.ui, cv = this.paint(), was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, ui.left, 0, ui.vw, HGT);
      c.imageSmoothingEnabled = was;
      if (this.phase === 'cine') this.cineOverlay(c);
      else if (this.phase === 'reveal') this.revealOverlay(c);
      else this.rackOverlay(c);
      if (this.fade > 0) { c.fillStyle = 'rgba(255,255,255,' + this.fade.toFixed(3) + ')'; c.fillRect(ui.left, 0, ui.vw, HGT); }
    }

    skipButton(c, label) {
      const ui = this.ui, w = ui.measure(label, 10) + 44, x = ui.right - w - 10, y = 10;
      c.fillStyle = 'rgba(20,6,8,0.6)'; c.fillRect(x, y, w, 20);
      c.strokeStyle = 'rgba(255,170,150,0.7)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
      const kw = ui.keycap(x + 6, y + 4, 'Esc');
      ui.text(label, x + 12 + kw, y + 5, { size: 10, col: C.cream });
      ui.hit(x, y, w, 20, () => this.skip());
    }

    subtitle(c, s, a) {
      if (!s || a <= 0) return;
      const ui = this.ui, lw = Math.min(600, ui.measure(s, 12) + 34);
      c.save(); c.globalAlpha = cl(a);
      c.fillStyle = 'rgba(10,4,6,0.78)'; c.fillRect(Math.round(W / 2 - lw / 2), HGT - 54, Math.round(lw), 22);
      ui.text(s, W / 2, HGT - 50, { size: 12, align: 'center', col: C.cream });
      c.restore();
    }

    cineOverlay(c) {
      const [n, t] = this.shot();
      if (n === 'chant') this.subtitle(c, 'Мегумин: «Чернее черноты, темнее тьмы, сольюсь с моим алым светом!»', seg(t, 0.1, 0.4) * (1 - seg(t, 1.3, 1.5)));
      if (n === 'beam') this.subtitle(c, 'Мегумин: «Взрыв!»', seg(t, 0, 0.15));
      if (n === 'score') this.subtitle(c, 'Казума: «' + (this.best === 5 ? 'Сто очков! Идеальный взрыв.' : this.best === 4 ? 'Хороший взрыв. ' + this.score + ' очков.' : 'Так себе. ' + this.score + ' очков.') + '»', seg(t, 0.4, 0.7));
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Пропустить');
      this.ui.hints([['Enter', 'Пропустить ролик']], this.ui.left + 12, HGT - 20, { col: 'rgba(240,220,210,0.8)' });
    }

    sparkRow(c, x, y, n, col, s) {
      c.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const cx = x + i * s * 2.4, w = s * 0.3;
        c.beginPath();
        c.moveTo(cx, y - s); c.lineTo(cx + w, y - w); c.lineTo(cx + s, y); c.lineTo(cx + w, y + w);
        c.lineTo(cx, y + s); c.lineTo(cx - w, y + w); c.lineTo(cx - s, y); c.lineTo(cx - w, y - w);
        c.closePath(); c.fill();
      }
    }

    plate(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui, ch = r.kind === 'char', d = ch ? H.CHARS[r.id] : H.CONES[r.id], path = d && d.path, name = ch ? d.fullName || d.name : r.name;
      const x0 = ui.left + Math.round(36 - 50 * (1 - eOut(a))), y = 178;
      c.save(); c.globalAlpha = cl(a);
      const gr = c.createLinearGradient(x0 - 36, 0, x0 + 334, 0);
      gr.addColorStop(0, 'rgba(20,6,8,0.8)'); gr.addColorStop(0.7, 'rgba(20,6,8,0.45)'); gr.addColorStop(1, 'rgba(20,6,8,0)');
      c.fillStyle = gr; c.fillRect(x0 - 36, y - 10, 370, 88);
      ui.diamond(x0 + 20, y + 22, 20, 'rgba(28,10,12,0.92)', RCOL[r.rar]);
      if (path) G.pathIcon(c, path, x0 + 8, y + 10, 24, RHOT[r.rar]);
      const size = ui.measure(name, 22, true, true) > 240 ? 16 : 22;
      ui.text(name, x0 + 50, y + (size === 22 ? 2 : 6), { size, bold: true, serif: true, col: '#ffffff' });
      if (ch && r.res === 'new') {
        const nx = Math.round(x0 + 56 + ui.measure(name, size, true, true));
        c.fillStyle = '#e8c860'; c.fillRect(nx, y + 6, 38, 12);
        ui.text('НОВЫЙ', nx + 19, y + 7, { size: 8, bold: true, align: 'center', col: '#1a1406', shadow: false });
      }
      this.sparkRow(c, x0 + 58, y + 38, r.rar, RCOL[r.rar], 5);
      if (ch) { G.elemIcon(c, d.elem, x0 + 57, y + 60, 6); ui.text(H.PATHS[d.path].name + ' · ' + H.ELEMENTS[d.elem].name, x0 + 68, y + 54, { size: 11, col: C.sub }); }
      else ui.text('Световой конус' + (path ? ' · ' + H.PATHS[path].name : ''), x0 + 50, y + 54, { size: 11, col: C.sub });
      c.restore();
    }

    resultTag(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui;
      c.save(); c.globalAlpha = cl(a);
      ui.resultTag(ui.right - 196, HGT - 108, r, [['Новый персонаж!', C.ok], ['вступает в отряд', C.cream]]);
      c.restore();
    }

    revealOverlay(c) {
      const ui = this.ui, r = this.item(), t = (this.rt - this.hop) / slowOf(r), L = this.designLen(r);
      if (t >= 0) {
        if (r.kind === 'char') {
          const cut = this.cutsOf(r), at = cut ? total(cut) - 0.8 : this.cardLen(r) + 0.4, said = cut && this.beatLine(r, t);
          if (said) this.subtitle(c, said.text, said.a);
          this.plate(c, r, seg(t, at, at + 0.4));
          this.subtitle(c, QUOTES[this.key(r)] ? '«' + QUOTES[this.key(r)] + '»' : H.WarpIntro && H.WarpIntro.line(r.id, this.game) ? '«' + H.WarpIntro.line(r.id, this.game) + '»' : '', seg(t, at + 0.2, at + 0.5));
        } else this.plate(c, r, seg(t, 0.55, 0.9));
        this.resultTag(c, r, seg(t, L - 0.4, L - 0.1));
      }
      if (this.res.length > 1) ui.plate(ui.left + 12, 10, (this.cur + 1) + ' / ' + this.res.length);
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Закрыть');
      ui.hints([['Enter', this.rt < this.intro() ? 'Показать' : this.queue.length || this.res.length > 1 ? 'Далее' : 'Готово']], ui.left + 12, HGT - 20);
    }

    note(c, r, x, y, w, h, rot) {
      const g = this.game;
      c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-w / 2, -h / 2);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(4, 5, w, h);
      c.fillStyle = '#f0e6cc'; c.fillRect(0, 0, w, h);
      c.fillStyle = G.dark(RCOL[r.rar], 0.25); c.fillRect(0, 0, w, 12);
      c.save(); c.beginPath(); c.rect(4, 14, w - 8, h - 40); c.clip();
      c.imageSmoothingEnabled = false;
      if (r.kind === 'char') { const cv = G.figureCanvas(G.lookOf(r.id, g), 2), s = 0.62; c.drawImage(cv, Math.round(w / 2 - cv.width * s / 2), 14, Math.round(cv.width * s), Math.round(cv.height * s)); }
      else { const cv = G.coneArt(r.id, 72, 100), s = (h - 40) / cv.height; c.drawImage(cv, Math.round(w / 2 - cv.width * s / 2), 14, Math.round(cv.width * s), h - 40); }
      c.restore();
      const nm = r.kind === 'char' ? H.CHARS[r.id].name : r.name;
      this.ui.text(this.ui.fitText ? this.ui.fitText(nm, 10, w - 8, true) : nm, w / 2, h - 24, { size: 10, bold: true, align: 'center', col: '#3a2410', shadow: false });
      this.sparkRow(c, w / 2 - (r.rar - 1) * 3.6, h - 8, r.rar, RCOL[r.rar], 3);
      if (r.rar >= 4) { c.fillStyle = r.rar === 5 ? '#d8a020' : '#8a4ad8'; c.beginPath(); c.arc(w - 10, h - 10, 7, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(w - 12, h - 12, 2, 0, Math.PI * 2); c.fill(); }
      if (r.kind === 'char' && r.res === 'new') { c.save(); c.translate(w - 30, 26); c.rotate(-0.2); c.strokeStyle = '#c83030'; c.lineWidth = 2; c.strokeRect(-20, -8, 40, 16); c.lineWidth = 1; this.ui.text('НОВЫЙ', 0, -5, { size: 9, bold: true, align: 'center', col: '#c83030', shadow: false }); c.restore(); }
      c.fillStyle = '#c83030'; c.beginPath(); c.arc(w / 2, 4, 3.5, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    rackOverlay(c) {
      const ui = this.ui, t = this.rt, n = this.res.length;
      for (let k = 4; k > 0; k--) ui.text('ДОСКА ЗАДАНИЙ', W / 2 + k, 22 + k, { size: 26, bold: true, serif: true, align: 'center', col: k > 1 ? '#1a0c06' : '#4a2a14', shadow: false });
      ui.text('ДОСКА ЗАДАНИЙ', W / 2, 22, { size: 26, bold: true, serif: true, align: 'center', col: '#fff0d8', shadow: false });
      const cols = Math.min(5, n), rows = Math.ceil(n / cols), w = 104, h = 150, gap = 10, x0 = Math.round(W / 2 - (cols * w + (cols - 1) * gap) / 2), y0 = rows > 1 ? 72 : 150;
      this.res.forEach((r, i) => {
        const k = eOut(seg(t, i * 0.06, i * 0.06 + 0.35));
        if (k <= 0) return;
        c.save(); c.globalAlpha = k;
        this.note(c, r, x0 + (i % cols) * (w + gap), y0 + Math.floor(i / cols) * (h + 14) - (1 - k) * 20, w, h, (hx(i, 3, 17) - 0.5) * 0.1);
        c.restore();
      });
      const five = this.res.filter(r => r.rar === 5).length, four = this.res.filter(r => r.rar === 4).length, news = this.res.filter(r => r.kind === 'char' && r.res === 'new').length;
      ui.text('5★: ' + five + ' · 4★: ' + four + (news ? ' · новых в отряде: ' + news : ''), W / 2, HGT - 44, { align: 'center', size: 11, col: C.cream });
      ui.hints([['Enter', 'Готово']], W / 2, HGT - 22, { align: 'center' });
    }
  }

  function arch(g, x, y, w, h, col) {
    rect(g, col, x, y + w / 2, w, h - w / 2);
    ell(g, col, x + w / 2, y + w / 2, w / 2, w / 2);
  }

  function ui3dots(g, x, y) {
    for (let i = 0; i < 3; i++) rect(g, '#ffffff', x + i * 4, y, 2, 2);
  }

  function beat(g, game, id, name, t, T) {
    const host = Object.create(ExplosionShow.prototype);
    host.game = game;
    g.save();
    host['cut_' + id + '_' + name](g, t, T, G.lookOf(id, game), { kind: 'char', id, rar: H.CHARS[id].rarity });
    g.restore();
  }

  H.ExplosionShow = ExplosionShow;
  Object.assign(H, { EXPLOSION_SHOTS: SHOTS, EXPLOSION_CINE: CINE, EXPLOSION_CUTS: CUTS, ExplosionKit: { RCOL, QUOTES, LINES, BRIEF, score, height, cutLen: id => total(CUTS[id]) * CHAR_SLOW, SLOW, CHAR_SLOW, bubble, anger, beat, toad } });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
