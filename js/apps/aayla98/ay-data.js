(function (A) {
  'use strict';
  const FACES = ['calm', 'smile', 'laugh', 'sad', 'angry', 'surprised', 'afraid', 'resolute', 'thoughtful', 'shy'];
  const MINOR = ['calm', 'smile', 'angry', 'surprised'];
  A.FACES = FACES;
  A.MINOR_FACES = MINOR;

  A.FACE_NAMES = {
    calm: 'спокойно', smile: 'улыбка', laugh: 'смех', sad: 'грусть', angry: 'гнев',
    surprised: 'удивление', afraid: 'страх', resolute: 'решимость', thoughtful: 'задумчивость', shy: 'смущение'
  };

  A.LEKKU = {
    still: 'спокойно', tense: 'напряжены', down: 'опущены', up: 'приподняты', twitch: 'подёргивание',
    hello: 'жест «привет»', bye: 'жест «прощай»', love: 'жест «люблю тебя»', insult: 'жест «чтоб спайс тебе раны разъел»'
  };

  A.KINDS = {
    twilek: 'твилек', kiffar: 'киффар', human: 'человек', nautolan: 'наутоланин', clone: 'клон', devaronian: 'деваронец',
    neti: 'нети', chadrafan: 'чадра-фан', togruta: 'тогрута', thisspiasian: 'тиспиасианин', neimoidian: 'неймодианец', anzat: 'анзат', veknoid: 'векноид', yoda: 'вид Йоды', keldor: 'кел-дор', tholothian: 'толотианка',
    nikto: 'каджайн\'са\'никто', falleen: 'фаллин', kaminoan: 'каминоанка', cyborg: 'калишит-киборг', cerean: 'цереанин',
    palliduvan: 'паллидуванка', weequay: 'вику', mirialan: 'мириаланка', selonian: 'селонианин', baragwin: 'баргвин', houk: 'хук', droid: 'дроид', ewok: 'эвок'
  };

  const o = (name, cloth, trim, what) => ({ name, cloth, trim, what });
  const P = (name, kind, extra) => Object.assign({ name, kind, faces: MINOR, tier: 2, pitch: 420, plate: '#6a6a7a' }, extra);

  A.CAST = {
    aayla: P('Эйла', 'twilek', {
      tier: 1, faces: FACES, lekku: true, plate: '#4f86c0', pitch: 640, skin: '#6fa8dc', eyes: '#8a6a3a',
      look: 'твилек-рутианка, 1,7 м, голубая кожа, карие глаза, лекку голубые (узор и повязки сверить), украшение на пупке',
      outfits: {
        padawan: o('падаван', '#8c7a62', '#c9b48a', 'сетчатый комбинезон под плащом с рукавами, красный клинок у пояса'),
        dancer: o('танцовщица', '#7a4a6a', '#d8b060', 'тот же наряд, но открытее; одежда танцовщицы в поместье дяди'),
        kiffex: o('форма Киффекса', '#6b4a30', '#3a2a1c', 'коричневые сапоги, брюки, простые повязки на голове и лекку, пояс из кожи рикрита, жилет с одним рукавом'),
        robe: o('роба', '#5a3c26', '#a07a50', 'роба твилекского джедая: кожаный топ, повязка на голове, наручи, брюки, сапоги'),
        servant: o('служанка', '#6a5a4a', '#b89a60', 'наряд рабыни-служанки в доме Ро Фенна по комиксу'),
        jayzaa: o('Джейзаа', '#26262e', '#8a8a96', 'механик: чёрные брюки и топ, наплечники, очки'),
        tuulaa: o('Туулаа', '#e8e0f0', '#8a5aa8', 'наследница: бело-лиловое платье')
      }
    }),
    vos: P('Вос', 'kiffar', {
      tier: 1, faces: FACES, plate: '#b8902a', pitch: 300, skin: '#b0825a', hair: '#1c1410', eyes: '#5a3a20', mark: '#e0c040',
      look: 'киффар, смуглая кожа, чёрные волосы (дреды сверить), карие глаза, жёлтые при Тьме, жёлтая клановая татуировка через лицо (сверить)',
      outfits: {
        early: o('ранний', '#3a3434', '#6a5a4a', 'тёмная одежда джедая без рукавов, обмотки на руках, голые ладони'),
        clonewars: o('Войны клонов', '#1e1e22', '#4a3a3a', 'тёмная одежда без знаков Ордена: наёмник «Корто Вос» на «Колесе», позже агент у Дуку')
      }
    }),
    tholme: P('Толм', 'human', {
      tier: 1, faces: FACES, plate: '#5a7a4a', pitch: 260, skin: '#d8b090', hair: '#9a9a9a', eyes: '#4a7a4a', cyber: true,
      look: 'человек, светлая кожа, седые волосы (раньше чёрные), зелёные глаза, искусственный левый глаз, зелёный клинок',
      outfits: { robe: o('роба', '#6a5a44', '#3a3024', 'роба джедая, сдержанная, тёмная') }
    }),
    kit: P('Кит', 'nautolan', {
      tier: 1, truth: true, faces: FACES, plate: '#3a9a5a', pitch: 360, skin: '#5aa05a', eyes: '#101010',
      look: 'наутоланин, зелёная кожа, чёрные глаза, щупальца на голове, широкая улыбка',
      outfits: { robe: o('роба', '#8a6a44', '#5a4026', 'роба джедая') }
    }),
    bly: P('Блай', 'clone', {
      tier: 1, faces: FACES, plate: '#c8a020', pitch: 330, skin: '#a87a58', hair: '#1a1410', eyes: '#3a2a1a', mark: '#e0b020',
      look: 'клон, лицо Джанго Фетта, короткие чёрные волосы; броня с жёлтыми знаками 327-го корпуса',
      outfits: {
        bare: o('без шлема', '#d8d8d0', '#e0b020', 'броня без шлема, жёлтые знаки 327-го'),
        phase1: o('шлем фазы I', '#d8d8d0', '#e0b020', 'шлем и броня фазы I с жёлтыми знаками'),
        phase2: o('шлем фазы II', '#d8d8d0', '#e0b020', 'шлем и броня фазы II с жёлтыми знаками и козырьком')
      }
    }),
    villie: P('Вилли', 'devaronian', {
      tier: 1, faces: FACES, plate: '#a83a2a', pitch: 480, skin: '#b8402a', eyes: '#d02020',
      look: 'деваронец, красная кожа, красные глаза, рога, хитрая ухмылка; корабль «Инферно»',
      outfits: { spacer: o('контрабандист', '#3a3a2a', '#8a7a4a', 'потёртая куртка контрабандиста') }
    }),
    traa: P('Т\'ра Саа', 'neti', {
      tier: 1, faces: FACES, plate: '#8a8a2a', pitch: 220, skin: '#c8b040', hair: '#6a4a2a', eyes: '#9ac040',
      look: 'нети, древесное тело, жёлтая кожа, коричневые отростки вместо волос, жёлто-зелёные глаза',
      outfits: { robe: o('роба', '#5a4a30', '#3a2e1e', 'простая роба поверх древесного тела') }
    }),
    ekria: P('Экрия', 'human', {
      tier: 1, faces: FACES, plate: '#3a6ab0', pitch: 720, skin: '#e8dcd0', hair: '#3a5ad0', eyes: '#4a4a6a',
      look: 'баролианка, бледная кожа, синие волосы; слайсер, падаван',
      outfits: { padawan: o('падаван', '#6a6a7a', '#3a3a4a', 'практичная одежда падавана с инструментами слайсера') }
    }),
    xiaan: P('Сиань', 'twilek', {
      lekku: true, plate: '#6a9ad0', pitch: 760, skin: '#7fb2e5', eyes: '#3a6ab0',
      look: 'твилек-рутианка, голубая кожа, голубые глаза, младшая падаван',
      outfits: { padawan: o('падаван', '#c8b08a', '#8a7050', 'светлая туника падавана') }
    }),
    pol: P('Пол', 'twilek', {
      lekku: true, plate: '#7a5a8a', pitch: 280, skin: '#7a9ab0', eyes: '#8a6a3a',
      look: 'твилек, глава клана Секура и член правящего совета (цвет кожи сверить), богатые одежды',
      outfits: { robe: o('глава клана', '#5a2a4a', '#d8b060', 'богатая одежда главы клана') }
    }),
    asante: P('Асанте', 'kiffar', {
      plate: '#8a5aa0', pitch: 520, skin: '#b8906a', hair: '#1c1410', eyes: '#7a4ab0', mark: '#e0c040',
      look: 'киффар, смуглая кожа, чёрные волосы, фиолетовые глаза, стражница Киффу',
      outfits: { guard: o('стражница Киффу', '#4a4a5a', '#a08a4a', 'форма стражей Киффу') }
    }),
    karkko: P('Каркко', 'anzat', {
      plate: '#8a1a1a', pitch: 200, skin: '#9a8a5a', hair: '#141010', eyes: '#2a1a10', goatee: true,
      look: 'анзат почти 2 м, оливковая кожа, длинные чёрные волосы, собранные сзади, небольшие усы и бородка, хоботки в щеках только при кормлении, красный клинок',
      outfits: { robe: o('чёрная роба', '#141016', '#3a1a1a', 'чёрная длинная одежда') }
    }),
    zao: P('Зао', 'veknoid', {
      plate: '#8a6a4a', pitch: 560, skin: '#8a6a4a', eyes: '#f0f0f0',
      look: 'векноид, коричнево-белая кожа, белые слепые глаза; прячется под видом маленького слепого повара',
      outfits: { cook: o('повар', '#c8c0b0', '#6a5a4a', 'фартук повара') }
    }),
    mace: P('Мейс Винду', 'human', { plate: '#6a3aa0', pitch: 240, skin: '#6a4a30', hair: null, eyes: '#2a1a10', look: 'по фильмам: бритая голова, тёмная кожа, фиолетовый клинок', outfits: { robe: o('роба', '#6a5a44', '#3a3024', 'роба джедая') } }),
    yoda: P('Йода', 'yoda', { plate: '#5a8a3a', pitch: 600, skin: '#7a9a5a', eyes: '#6a5a2a', look: 'по фильмам: маленький, зелёный, большие уши', outfits: { robe: o('роба', '#b0a080', '#6a5a44', 'роба джедая') } }),
    plo: P('Пло Кун', 'keldor', { plate: '#a0602a', pitch: 230, skin: '#c87a3a', eyes: '#101010', look: 'по фильмам: кел-дор в дыхательной маске и защитных очках', outfits: { robe: o('роба', '#5a4a3a', '#2a2a2a', 'роба джедая') } }),
    adi: P('Ади Галлия', 'tholothian', { plate: '#3a6a9a', pitch: 560, skin: '#6a4a3a', eyes: '#3a5a8a', look: 'по фильмам: толотианка, головной убор с отростками', outfits: { robe: o('роба', '#2a3a5a', '#8a9ab0', 'роба советницы') } }),
    dallin: P('Джейс Даллин', 'human', { plate: '#6a6a5a', pitch: 300, skin: '#e0c0a0', hair: '#5a3a20', eyes: '#5a3a20', scars: true, look: 'человек, светлая кожа, каштановые волосы, карие глаза, лицо в шрамах', outfits: { crew: o('экипаж «Интрепида»', '#4a5a6a', '#2a3a4a', 'форма экипажа') } }),
    rofenn: P('Ро Фенн', 'twilek', { lekku: true, plate: '#c0c0b0', pitch: 210, skin: '#e8e4dc', eyes: '#d8c020', stout: true, look: 'тучный твилек, белая кожа, жёлтые глаза', outfits: { robe: o('глава клана', '#6a3a2a', '#c8a040', 'богатая одежда') } }),
    kharis: P('Х\'арис Фенн', 'twilek', { lekku: true, plate: '#b0b0a0', pitch: 330, skin: '#e8e4dc', eyes: '#d8c020', look: 'твилек, белая кожа, жёлтые глаза, изгнанник', outfits: { robe: o('изгнанник', '#3a2a2a', '#8a6a4a', 'тёмный дорожный плащ') } }),
    tsyr: P('Цир', 'nikto', { plate: '#8a4a2a', pitch: 190, skin: '#a0603a', eyes: '#4a2a10', scars: true, look: 'каджайн\'са\'никто, моргукай, три больших шрама на лице, кортозисный посох', outfits: { armor: o('доспех моргукаев', '#4a3a2a', '#8a8a7a', 'тёмный доспех и кортозисный посох') } }),
    bok: P('Бок', 'nikto', { plate: '#9a4a2a', pitch: 230, skin: '#a8683a', eyes: '#c02020', look: 'каджайн\'са\'никто, моргукай, красные глаза; позже кибернетическая правая рука и кортозисная перчатка', outfits: { armor: o('доспех моргукаев', '#4a3a2a', '#8a8a7a', 'тёмный доспех') } }),
    lon: P('Лон Секура', 'twilek', { lekku: true, plate: '#5a7ab0', pitch: 300, skin: '#6a9ad0', eyes: '#6a5a3a', look: 'твилек, голубая кожа, отец Ната', outfits: { robe: o('совет Рилота', '#3a4a6a', '#c8a050', 'одежда члена совета') } }),
    nat: P('Нат', 'twilek', { lekku: true, plate: '#7aa0d0', pitch: 820, skin: '#7aaee0', eyes: '#8a6a3a', child: true, look: 'твилек-мальчик, голубая кожа, карие глаза, наследник клана', outfits: { child: o('наследник', '#4a5a8a', '#c8a050', 'детская одежда наследника') } }),
    khaleen: P('Халин Хенц', 'human', { long: true, plate: '#7a4a6a', pitch: 620, skin: '#d8b090', hair: '#3a2a1a', eyes: '#3a2a1a', look: 'воровка с «Колеса» (внешность сверить)', outfits: { thief: o('воровка', '#2a2a3a', '#6a4a6a', 'практичная тёмная одежда') } }),
    zenex: P('Зенекс', 'falleen', { plate: '#4a7a3a', pitch: 250, skin: '#5a8a4a', hair: '#4a2a1a', eyes: '#4ab04a', look: 'фаллин, каштановые волосы, зелёные глаза; криминальный глава «Колеса»', outfits: { boss: o('глава', '#2a1a2a', '#c8a040', 'дорогой костюм') } }),
    anakin: P('Анакин', 'human', { plate: '#5a6a8a', pitch: 420, skin: '#e0c0a0', hair: '#6a4a2a', eyes: '#4a6a9a', look: 'по эпизоду II: падаван', outfits: { robe: o('падаван', '#5a3a26', '#3a2a1a', 'тёмная туника') } }),
    obiwan: P('Оби-Ван', 'human', { plate: '#8a7a4a', pitch: 340, skin: '#e0c0a0', hair: '#a0703a', eyes: '#4a6a8a', look: 'по эпизоду II: рыжеватые волосы и борода', outfits: { robe: o('роба', '#b0a080', '#6a5a44', 'светлая роба') } }),
    kumanai: P('Кума Наи', 'kaminoan', { plate: '#8aa0a0', pitch: 500, skin: '#d8dcd8', eyes: '#101010', look: 'каминоанка, длинная шея, чёрные глаза, нановирусный инъектор', outfits: { lab: o('учёная', '#e8ece8', '#9aa8a8', 'светлая одежда каминоанцев') } }),
    grievous: P('Гривус', 'cyborg', { plate: '#8a8a7a', pitch: 160, skin: '#d8d0b0', eyes: '#d0a020', look: 'по Clone Wars (2003): киборг, костяная маска, жёлтые глаза', outfits: { body: o('корпус', '#9a9a8a', '#5a5a4a', 'металлический корпус') } }),
    kiadi: P('Ки-Ади-Мунди', 'cerean', { plate: '#8a6a4a', pitch: 260, skin: '#e0c0a0', hair: '#d8d8d0', eyes: '#3a2a1a', look: 'по фильмам: цереанин с высокой головой, белая борода', outfits: { robe: o('роба', '#8a7a5a', '#4a3a2a', 'роба джедая') } }),
    tookarti: P('Тукарти', 'chadrafan', { plate: '#7a5a4a', pitch: 760, skin: '#8a6a52', eyes: '#141010', look: 'чадра-фан: маленький, мохнатый, большие уши, нос-пятачок; информатор с «Колеса» (Republic 49)', outfits: { rags: o('информатор', '#4a4038', '#8a7a5a', 'потёртая куртка с капюшоном') } }),
    barkeep: P('Бармен', 'human', { stout: true, plate: '#6a5a3a', pitch: 260, skin: '#c89a78', hair: '#3a3028', eyes: '#2a1a10', look: 'бармен «Ржавой втулки» на «Колесе» (адаптация)', outfits: { apron: o('бармен', '#3a3430', '#8a6a3a', 'фартук поверх комбинезона техника') } }),
    thug: P('Громила', 'human', { plate: '#6a3a3a', pitch: 230, skin: '#b88a68', hair: '#2a1a10', eyes: '#2a1a10', look: 'громила, каких Тукарти нанимает «узнать правду» (Republic 49)', outfits: { thug: o('громила', '#3a3030', '#7a5a3a', 'кожаная броня, нож на поясе') } }),
    neimoidian: P('Неймодианец', 'neimoidian', { plate: '#5a6a4a', pitch: 330, skin: '#7a8a6a', eyes: '#c84a2a', look: 'неймодианец, связной Зенекса у сепаратистов (Republic 49)', outfits: { robe: o('связной', '#4a3a5a', '#a08a4a', 'тёмная роба с высоким воротом') } }),
    rancisis: P('Оппо Рансисис', 'thisspiasian', { plate: '#7a6a4a', pitch: 200, skin: '#9a8a6a', hair: '#e8e0c8', eyes: '#2a2a1a', look: 'тиспиасианин, магистр Совета: длинный мех и борода, четыре руки, змеиный хвост (эпизод II, Republic 50)', outfits: { robe: o('роба', '#6a5a44', '#3a3024', 'роба джедая') } }),
    sayn: P('Сайн Та', 'kaminoan', { plate: '#8ab0b0', pitch: 520, skin: '#e0e4e0', eyes: '#141414', look: 'каминоанка, главный клонер Типоки (Tides of Terror)', outfits: { lab: o('учёная', '#e8ecec', '#9ab0b0', 'белая одежда учёных Типоки') } }),
    shaak: P('Шаак Ти', 'togruta', { female: true, plate: '#a84a3a', pitch: 480, skin: '#c8503a', eyes: '#2a1a1a', look: 'по фильмам: тогрута, красная кожа с белым узором, монтралы и головные хвосты в бело-синюю полоску', outfits: { robe: o('роба', '#8a6a44', '#4a3a2a', 'роба джедая') } }),
    shaagi: P('Ша\'а Ги', 'human', { plate: '#6a7a5a', pitch: 440, skin: '#d8b090', hair: '#3a2a1a', eyes: '#3a2a1a', look: 'падаван мастера Баррека (Clone Wars 2003, глава 20; внешность сверить)', outfits: { robe: o('падаван', '#8a7a5a', '#5a4a3a', 'туника падавана') } }),
    miles: P('Майлз Крофт', 'human', { art: 'tholme', faces: FACES, plate: '#5a7a4a', pitch: 260, skin: '#d8b090', hair: '#9a9a9a', eyes: '#4a7a4a', cyber: true, look: 'Толм под видом слуги наследницы (Jedi: Aayla Secura); рисуется картинками Толма', outfits: { servant: o('слуга', '#4a4a3a', '#8a7a5a', 'скромная ливрея слуги богатого дома') } }),
    saba: P('Саба', 'human', { art: 'kuro', long: true, plate: '#5a5a7a', pitch: 360, skin: '#e0d0c0', hair: '#c8c8c8', eyes: '#4a6aa0', look: 'Ан\'йа Куро под видом служанки наследницы (Jedi: Aayla Secura); рисуется картинками Куро', outfits: { servant: o('служанка', '#4a3a4a', '#8a7a6a', 'тёмное платье служанки') } }),
    elsah: P('Элса\'сай\'Моро', 'devaronian', { female: true, plate: '#a05a3a', pitch: 500, skin: '#c87a5a', hair: '#3a2418', eyes: '#3a2418', look: 'деваронка, сенатор, давняя подруга Т\'ра Саа (Jedi: Aayla Secura; внешность сверить)', outfits: { holo: o('голограмма', '#5a8ab0', '#a0d0f0', 'синяя голограмма сенатора') } }),
    sabat: P('Сабат', 'human', { plate: '#8a3a2a', pitch: 240, skin: '#e0c0a0', hair: '#b04a20', eyes: '#3a2a1a', scars: true, look: 'наёмник, начальник охраны Дуума: рыжие волосы, шрам через левый глаз, броня вроде клоновской (Deadly Hands of Shon-Ju)', outfits: { armor: o('броня', '#8a8a8a', '#5a3a2a', 'серая броня, похожая на броню клонов') } }),
    clonesgt: P('Сержант-клон', 'clone', { plate: '#8a8a7a', pitch: 330, skin: '#a87a58', hair: '#1a1410', eyes: '#3a2a1a', look: 'сержант конвоя элитных клонов на Кавамине-Минор (адаптация)', outfits: { phase1: o('шлем фазы I', '#d8d8d0', '#9a9a94', 'шлем и броня элитного отделения') } }),
    jeweler: P('Ювелир', 'devaronian', { plate: '#8a6a3a', pitch: 300, skin: '#b8503a', eyes: '#e0c020', look: 'деваронец, ювелир галереи у дома сенатора (адаптация)', outfits: { rich: o('ювелир', '#3a2a4a', '#c8a050', 'богатый кафтан') } }),
    dguard: P('Стражник сенатора', 'devaronian', { plate: '#6a3a3a', pitch: 260, skin: '#b04a3a', eyes: '#e0c020', look: 'деваронец из стражи сенатора Вьен\'сай\'Маллок (адаптация)', outfits: { guard: o('стражник', '#4a3a3a', '#c8a050', 'тёмная форма стражи, пика') } }),
    raider: P('Налётчик', 'human', { plate: '#6a5a3a', pitch: 250, skin: '#c89a78', hair: '#3a2a1a', eyes: '#2a1a10', look: 'налётчик с базы в Синих горах (адаптация)', outfits: { armor: o('налётчик', '#4a4030', '#8a6a3a', 'потёртая броня, бластер') } }),
    kuro: P('Ан\'йа Куро', 'human', { long: true, plate: '#5a5a7a', pitch: 360, skin: '#e0d0c0', hair: '#c8c8c8', eyes: '#4a6aa0', look: 'Тёмная Женщина: седые волосы (раньше чёрные), голубые глаза; бывшая наставница Аурры', outfits: { robe: o('роба', '#3a3a44', '#6a6a7a', 'тёмная роба') } }),
    malloc: P('Вьен\'сай\'Маллок', 'devaronian', { plate: '#a04a4a', pitch: 540, skin: '#c06a5a', hair: '#5a3a20', eyes: '#5a3a20', female: true, look: 'деваронка, каштановые волосы, карие глаза; сенатор', outfits: { senator: o('сенатор', '#4a2a4a', '#c8a050', 'платье сенатора') } }),
    aurra: P('Аурра Синг', 'palliduvan', { plate: '#c04a2a', pitch: 460, skin: '#ece8e0', hair: '#a04020', eyes: '#3a9a3a', look: 'алебастровая кожа, рыжие волосы в пучке, зелёные глаза, антенна-имплант на голове', outfits: { hunter: o('охотница', '#8a3a2a', '#3a2a2a', 'красно-бурый комбинезон охотницы') } }),
    shonju: P('Шон-Джу', 'human', { plate: '#6a5a3a', pitch: 300, skin: '#e0c4a0', hair: '#1a1410', eyes: '#5a3a20', look: 'человек, светлая кожа, чёрные волосы, карие глаза; после главы 5 протезы кистей', outfits: { robe: o('учитель', '#5a4a3a', '#2a2a2a', 'одежда учителя своей школы') } }),
    duum: P('Аттума Дуум', 'human', { plate: '#7a7a8a', pitch: 280, skin: '#e0c8b0', hair: '#e0d080', eyes: '#4a6aa0', cyber: true, look: 'человек-киборг, светлый парик, голубые глаза, металлическое тело под одеждой', outfits: { merc: o('наёмник', '#3a3a4a', '#8a8a9a', 'одежда наёмника') } }),
    bulq: P('Сора Булк', 'weequay', { plate: '#7a5a3a', pitch: 220, skin: '#8a7a5a', hair: '#1a1410', eyes: '#5a3a20', look: 'вику, серо-коричневая кожа, чёрные волосы, карие глаза; правая рука Дуку', outfits: { robe: o('роба', '#2a2a2a', '#5a3a2a', 'тёмная роба') } }),
    akku: P('Акку Сеи', 'anzat', { plate: '#9a8a8a', pitch: 250, skin: '#c8b8a0', hair: '#e8e8e8', eyes: '#c02020', look: 'анзат, белые волосы, красные глаза; учитель убийц', outfits: { robe: o('учитель', '#3a2a2a', '#7a6a5a', 'одежда учителя') } }),
    gort: P('Горт', 'houk', { stout: true, plate: '#5a3a6a', pitch: 180, skin: '#6a4a8a', eyes: '#d8c040', look: 'хук, тёмно-фиолетовая кожа, огромный и мускулистый (Republic 72, внешность сверить)', outfits: { spacer: o('завсегдатай', '#3a3028', '#6a5a3a', 'грубая куртка завсегдатая кантины') } }),
    kelkko: P('Рат Келкко', 'anzat', { plate: '#6a4a3a', pitch: 240, skin: '#c8b090', hair: '#5a3a20', eyes: '#5a3a20', look: 'анзат, каштановые волосы, карие глаза; убийца, учит армию моргукаев (Republic 72–75)', outfits: { robe: o('убийца', '#2a2224', '#5a3a2a', 'тёмная одежда убийцы') } }),
    droid: P('Боевой дроид', 'droid', { plate: '#8a7a5a', pitch: 460, skin: '#c8b48a', eyes: '#2a2a2a', look: 'боевой дроид B1 без рук и ног, болтливый и ехидный (What Goes Up...)', outfits: { b1: o('корпус B1', '#c8b48a', '#8a7a5a', 'корпус B1 песочного цвета, без рук и ног') } }),
    ewok: P('Вождь эвоков', 'ewok', { stout: true, plate: '#7a5a3a', pitch: 520, skin: '#6a4a2a', eyes: '#1a1410', look: 'эвок в кожаном капюшоне с перьями, вождь племени на деревьях (What Goes Up..., внешность сверить)', outfits: { hood: o('капюшон вождя', '#8a6a4a', '#c8a060', 'кожаный капюшон, бусы из костей') } }),
    clone501: P('Боец 501-го', 'clone', { plate: '#3a5ab0', pitch: 330, skin: '#a87a58', hair: '#1a1410', eyes: '#3a2a1a', mark: '#3a5ab0', look: 'клон 501-го легиона, броня фазы II с синими знаками (Battlefront II)', outfits: { phase2: o('шлем фазы II', '#d8d8d0', '#3a5ab0', 'шлем и броня фазы II с синими полосами 501-го') } }),
    trooper: P('Боец 327-го', 'clone', { plate: '#c8a020', pitch: 330, skin: '#a87a58', hair: '#1a1410', eyes: '#3a2a1a', mark: '#e0b020', look: 'клон из отделения Блая, броня фазы II с жёлтыми знаками 327-го', outfits: { phase2: o('шлем фазы II', '#d8d8d0', '#e0b020', 'шлем и броня фазы II с жёлтыми полосами') } }),
    barriss: P('Барисс', 'mirialan', { plate: '#3a7a5a', pitch: 580, skin: '#b0a060', hair: '#1a1410', eyes: '#4a6aa0', look: 'мириаланка, оливковая кожа, чёрные волосы, голубые глаза, знаки на лице (сверить)', outfits: { robe: o('роба', '#3a2a3a', '#6a5a7a', 'тёмная роба с капюшоном') } }),
    zonder: P('Зондер', 'selonian', { plate: '#7a6a4a', pitch: 500, skin: '#7a5a3a', eyes: '#2a1a10', look: 'селонианин (внешность сверить), падаван', outfits: { padawan: o('падаван', '#6a5a44', '#3a3024', 'туника падавана') } }),
    drake: P('Дрейк Ло\'ган', 'human', { plate: '#5a6a7a', pitch: 460, skin: '#e0c0a0', hair: '#4a3a2a', eyes: '#4a5a6a', look: 'падаван (внешность сверить)', outfits: { padawan: o('падаван', '#6a5a44', '#3a3024', 'туника падавана') } }),
    stass: P('Стасс Алли', 'tholothian', { plate: '#4a7a9a', pitch: 540, skin: '#7a5a4a', eyes: '#3a5a8a', look: 'толотианка, двоюродная сестра Ади Галлии (сверить)', outfits: { robe: o('роба', '#6a5a44', '#3a3024', 'роба джедая') } }),
    tinte: P('Шейф Тинте', 'kiffar', { plate: '#5a5a6a', pitch: 300, skin: '#8a8a8a', hair: '#141414', eyes: '#141414', mark: '#e0c040', look: 'киффар, серая кожа, чёрные волосы, чёрные глаза; правительница Киффу и Киффекса', outfits: { sheyf: o('Шейф', '#3a3a4a', '#a08a4a', 'строгая одежда правительницы') } }),
    stranger: P('Незнакомец', 'kiffar', {
      art: 'vos', faces: FACES, plate: '#8a7a5a', pitch: 300, skin: '#b0825a', hair: '#1c1410', eyes: '#5a3a20', mark: '#e0c040',
      look: 'Вос, каким его видит Эйла без памяти: незнакомый киффар; рисуется картинками Воса',
      outfits: { early: o('ранний', '#3a3434', '#6a5a4a', 'тёмная одежда джедая без рукавов, обмотки на руках, голые ладони') }
    }),
    stranger_devaronian: P('Деваронец', 'devaronian', {
      art: 'villie', plate: '#8a4a3a', pitch: 480, skin: '#b8402a', eyes: '#d02020',
      look: 'Вилли, каким его видит Эйла без памяти; рисуется картинками Вилли',
      outfits: { spacer: o('контрабандист', '#3a3a2a', '#8a7a4a', 'потёртая куртка контрабандиста') }
    }),
    clansman: P('Киффар', 'kiffar', { plate: '#6a6a4a', pitch: 290, skin: '#a87a52', hair: '#1c1410', eyes: '#3a2a1a', mark: '#e0c040', look: 'киффар из клана Вос, привёл незнакомца в поместье Пола (Republic 21)', outfits: { travel: o('дорожная одежда', '#4a4a3a', '#8a7a5a', 'дорожная одежда киффара, пыльный плащ') } }),
    patron: P('Голограмма', 'twilek', { lekku: true, stout: true, plate: '#4a7a9a', pitch: 200, skin: '#e8e4dc', eyes: '#3a3a3a', look: 'голограмма покровителя с Корусанта: тучный белокожий твилек с четырьмя лекку, лицо в помехах (Chom Frey Kaa, Republic 21)', outfits: { holo: o('голограмма', '#5a8ab0', '#a0d0f0', 'синяя голограмма с помехами, дорогая одежда сенатора') } }),
    nima: P('Нима', 'twilek', { lekku: true, plate: '#c87a4a', pitch: 700, skin: '#e0a070', eyes: '#3a2a1a', look: 'молодая служанка поместья, оранжевая кожа (адаптация)', outfits: { servant: o('служанка', '#8a6a4a', '#c8a070', 'простое платье служанки поместья') } }),
    bala: P('Бала', 'twilek', { lekku: true, stout: true, plate: '#7a8a4a', pitch: 360, skin: '#8aa070', eyes: '#2a2a1a', look: 'старая кухарка поместья, зелёная кожа, тучная (адаптация)', outfits: { cook: o('кухарка', '#6a5a4a', '#a08a6a', 'фартук поверх тёмного платья') } }),
    misra: P('Мисра', 'twilek', { lekku: true, plate: '#9a5a8a', pitch: 560, skin: '#c890b8', eyes: '#4a2a3a', look: 'немолодая танцовщица, лиловая кожа, учит танцу в поместье (адаптация)', outfits: { dancer: o('учительница танца', '#6a3a5a', '#d8b060', 'платье танцовщицы, браслеты на запястьях') } }),
    merchant: P('Торговец рилла', 'twilek', { lekku: true, plate: '#8a7a3a', pitch: 330, skin: '#c8a060', eyes: '#3a2a1a', look: 'гость поместья, торговец рилла (адаптация)', outfits: { rich: o('богатый гость', '#4a3a6a', '#c8a050', 'дорогая одежда торговца') } }),
    envoy: P('Посланница совета', 'twilek', { lekku: true, plate: '#5a6a9a', pitch: 520, skin: '#9a8ad0', eyes: '#2a2a4a', look: 'гостья поместья, посланница правящего совета (адаптация)', outfits: { council: o('совет Рилота', '#3a4a6a', '#c8a050', 'строгая одежда члена совета') } }),
    guard: P('Стражник', 'twilek', { lekku: true, plate: '#3a4a6a', pitch: 300, skin: '#5a8ab8', eyes: '#1a1010', look: 'стражник клана Секура', outfits: { guard: o('стражник', '#3a4a6a', '#c8a050', 'форма стражи клана Секура, электропосох') } }),
    voice: P('Голос', 'anzat', { plate: '#5a1a1a', pitch: 190, skin: '#9a8a5a', eyes: '#2a1a10', look: 'голос Каркко в голове Эйлы, бюст не показывается', outfits: { none: o('голос', '#141016', '#3a1a1a', 'бюст не показывается, только табличка') } }),
    vilbum: P('Астаал Вилбум', 'baragwin', { plate: '#6a7a5a', pitch: 210, skin: '#8a9070', eyes: '#2a2a1a', look: 'баргвин, джедай-консул, хранитель Башни первого знания (статья Astaal Vilbum)', outfits: { robe: o('роба', '#6a5a44', '#3a3024', 'роба джедая') } }),
    guardian: P('Страж Киффу', 'kiffar', { plate: '#3a3a44', pitch: 300, skin: '#a87a52', hair: '#1c1410', eyes: '#2a1a10', mark: '#e0c040', look: 'стражник Киффу в чёрной броне, знак клана Вос: золотая пятиконечная звезда в круге (статья Kiffu Guardians)', outfits: { armor: o('чёрная броня', '#24242a', '#c8a040', 'чёрная броня стражей, бластер') } }),
    prisoner: P('Заключённый', 'human', { plate: '#6a5a4a', pitch: 280, skin: '#c8a080', hair: '#3a2a1a', eyes: '#2a1a10', look: 'заключённый тюремной планеты Киффекс, завсегдатай кантины «Чёрная дыра»', outfits: { rags: o('лохмотья', '#5a4a3a', '#3a2e22', 'грязная одежда заключённого') } }),
    anzat: P('Анзат из свиты', 'anzat', { plate: '#5a5a5a', pitch: 180, skin: '#9a9a90', hair: '#1a1410', eyes: '#c8c040', look: 'одичавший анзат из свиты Каркко: серая кожа, широкий нос, спутанные волосы, хоботки в щеках', outfits: { rags: o('лохмотья', '#3a3430', '#5a4a3a', 'рваная тёмная одежда') } }),
    captain: P('Контрабандист', 'human', { plate: '#6a5a3a', pitch: 330, skin: '#d0a888', hair: '#3a2a1a', eyes: '#3a2a1a', look: 'контрабандист с корабля, который идёт к Киффексу (Republic 32)', outfits: { spacer: o('контрабандист', '#4a4030', '#8a7a50', 'куртка космолётчика') } }),
    maid: P('Служанка Фенна', 'twilek', { lekku: true, plate: '#9a6a5a', pitch: 660, skin: '#d8a8c8', eyes: '#3a2a3a', look: 'молодая рабыня в доме Ро Фенна, розовая кожа (адаптация)', outfits: { servant: o('рабыня', '#6a5a4a', '#a08a6a', 'простая одежда рабыни дома Фенн, медный браслет') } }),
    overseer: P('Надсмотрщик', 'twilek', { lekku: true, stout: true, plate: '#7a6a3a', pitch: 250, skin: '#c8c0a0', eyes: '#3a3010', look: 'старший над рабами дома Фенн (адаптация)', outfits: { steward: o('надсмотрщик', '#4a3a2a', '#c8a050', 'тёмный кафтан, связка ключей, хлыст за поясом') } }),
    hunter: P('Охотник за головами', 'human', { plate: '#6a4a3a', pitch: 280, skin: '#c89a78', hair: '#2a1a10', eyes: '#2a1a10', look: 'охотник за головами со свалки Орд-Мантелла (Republic 43)', outfits: { armor: o('охотник', '#4a3a30', '#7a6a50', 'потёртая броня, винтовка за спиной') } }),
    nikto: P('Никто-наёмник', 'nikto', { plate: '#7a3a2a', pitch: 220, skin: '#a0603a', eyes: '#2a1a10', look: 'каджайн\'са\'никто, наёмник в крепости Х\'ариса (адаптация)', outfits: { armor: o('наёмник', '#3a3028', '#7a6a4a', 'кожаная броня, вибротопор') } })
  };

  A.NARRATOR = { name: '', plate: null, pitch: 520 };

  A.MUSIC = ['temple', 'ryloth', 'battle', 'aayla', 'cover', 'memory', 'karkko', 'duel', 'flight'];

  A.TRACKS = {
    flight: {
      bpm: 144, parts: [
        { wave: 'square', vol: 0.035, notes: 'D5/1 A4/0.5 D5/0.5 F5/1 E5/0.5 D5/0.5 C5/1 A4/1 Bb4/1 C5/1 D5/2 A4/2 F5/1 E5/0.5 F5/0.5 G5/1 F5/0.5 E5/0.5 D5/1 C5/1 Bb4/1 A4/1 G4/1 A4/1 Bb4/1 C5/1 D5/4 A4/1 C5/1 E5/2' },
        { wave: 'triangle', vol: 0.12, notes: 'D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 Bb1/0.5 Bb2/0.5 Bb1/0.5 Bb2/0.5 Bb1/0.5 Bb2/0.5 Bb1/0.5 Bb2/0.5 C2/0.5 C3/0.5 C2/0.5 C3/0.5 C2/0.5 C3/0.5 C2/0.5 C3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 Bb1/0.5 Bb2/0.5 Bb1/0.5 Bb2/0.5 Bb1/0.5 Bb2/0.5 Bb1/0.5 Bb2/0.5 G1/0.5 G2/0.5 G1/0.5 G2/0.5 G1/0.5 G2/0.5 G1/0.5 G2/0.5 A1/0.5 A2/0.5 A1/0.5 A2/0.5 A1/0.5 A2/0.5 A1/0.5 A2/0.5' },
        { wave: 'noise', vol: 0.045, notes: 'k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5' }
      ]
    },
    temple: {
      bpm: 72, parts: [
        { wave: 'triangle', vol: 0.11, notes: 'D5/2 A4/1 F#4/1 G4/2 E4/2 F#4/1 A4/1 D5/1 E5/1 C#5/4 B4/2 G4/1 E4/1 F#4/2 D4/2 E4/1 G4/1 B4/1 A4/1 D4/4' },
        { wave: 'sine', vol: 0.12, notes: 'D3/4 G2/4 D3/4 A2/4 G2/4 D3/4 E2/2 A2/2 D3/4' },
        { wave: 'square', vol: 0.025, notes: 'F#4/4 B3/4 A3/4 E4/4 D4/4 A3/4 G3/2 C#4/2 F#3/4' }
      ]
    },
    ryloth: {
      bpm: 96, parts: [
        { wave: 'square', vol: 0.04, notes: 'D4/1 Eb4/0.5 F4/0.5 G4/1 F4/1 Eb4/1 D4/1 r/2 A4/1 Bb4/0.5 A4/0.5 G4/1 F4/1 G4/2 Eb4/2 D5/1 C5/0.5 Bb4/0.5 A4/1 G4/1 A4/1 Bb4/1 A4/2 G4/0.5 F4/0.5 Eb4/1 F4/1 Eb4/1 D4/4' },
        { wave: 'triangle', vol: 0.12, notes: 'D2/2 A2/2 D2/2 A2/2 D2/2 A2/2 D2/2 A2/2 D2/2 A2/2 D2/2 A2/2 D2/2 A2/2 D2/2 A2/2' },
        { wave: 'square', vol: 0.018, notes: 'D3/0.5 A3/0.5 D4/0.5 A3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 Eb3/0.5 Bb3/0.5 Eb4/0.5 Bb3/0.5 Eb3/0.5 Bb3/0.5 Eb4/0.5 Bb3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 C3/0.5 G3/0.5 C4/0.5 G3/0.5 C3/0.5 G3/0.5 C4/0.5 G3/0.5 Eb3/0.5 Bb3/0.5 Eb4/0.5 Bb3/0.5 Eb3/0.5 Bb3/0.5 Eb4/0.5 Bb3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5 D3/0.5 A3/0.5 D4/0.5 A3/0.5' }
      ]
    },
    battle: {
      bpm: 150, parts: [
        { wave: 'square', vol: 0.04, notes: 'A4/1 C5/0.5 D5/0.5 E5/1 D5/0.5 C5/0.5 D5/1.5 C5/0.5 B4/1 G4/1 A4/1 F4/0.5 A4/0.5 C5/1 A4/1 B4/1.5 G4/0.5 D5/2 E5/1 D5/0.5 C5/0.5 D5/1 E5/1 A5/2 G5/1 E5/1 F5/1 E5/0.5 D5/0.5 C5/1 D5/1 E5/2 E4/2' },
        { wave: 'square', vol: 0.03, notes: 'A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 F2/0.5 F3/0.5 F2/0.5 F3/0.5 F2/0.5 F3/0.5 F2/0.5 F3/0.5 G2/0.5 G3/0.5 G2/0.5 G3/0.5 G2/0.5 G3/0.5 G2/0.5 G3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 A2/0.5 A3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5' },
        { wave: 'noise', vol: 0.05, notes: 'k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5 k/0.5 n/0.5' }
      ]
    },
    aayla: {
      bpm: 84, parts: [
        { wave: 'triangle', vol: 0.12, notes: 'E4/1 G4/1 B4/2 A4/1 G4/0.5 F#4/0.5 G4/2 E4/1 G4/1 B4/1 D5/1 C5/3 B4/1 A4/1 B4/1 C5/2 B4/1 A4/0.5 G4/0.5 A4/2 G4/1 F#4/1 E4/1 D#4/1 E4/4' },
        { wave: 'sine', vol: 0.12, notes: 'E2/4 C3/4 E2/4 A2/4 F#2/4 B2/4 C3/2 B2/2 E2/4' },
        { wave: 'square', vol: 0.02, notes: 'B3/4 E4/4 G3/4 E4/4 C4/4 D#4/4 A3/2 F#3/2 G3/4' }
      ]
    },
    cover: {
      bpm: 92, parts: [
        { wave: 'square', vol: 0.035, notes: 'D4/1 Eb4/0.5 F#4/0.5 G4/1 F#4/1 Eb4/2 D4/2 A4/1 Bb4/0.5 A4/0.5 G4/1 F#4/1 G4/1 A4/1 F#4/2 D5/1 C5/0.5 Bb4/0.5 A4/1 G4/1 F#4/1 G4/0.5 F#4/0.5 Eb4/2 F#4/1 G4/1 Eb4/1 F#4/1 D4/4' },
        { wave: 'triangle', vol: 0.11, notes: 'D2/1.5 D2/0.5 A2/1 Eb2/1 D2/1.5 D2/0.5 A2/1 Eb2/1 D2/1.5 D2/0.5 A2/1 Eb2/1 D2/1.5 D2/0.5 A2/1 D2/1 G2/1.5 G2/0.5 D3/1 G2/1 G2/1.5 G2/0.5 D3/1 G2/1 Eb2/1.5 Eb2/0.5 Bb2/1 Eb2/1 D2/1.5 D2/0.5 A2/1 D2/1' },
        { wave: 'noise', vol: 0.035, notes: 'k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1 k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1 k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1 k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1 k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1 k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1 k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1 k/1 n/0.5 n/0.5 k/0.5 n/0.5 n/1' }
      ]
    },
    karkko: {
      bpm: 60, parts: [
        { wave: 'sawtooth', vol: 0.03, notes: 'C4/2 Eb4/2 D4/2 Gb4/2 F4/4 Eb4/4 C4/2 B3/2 C4/2 Db4/2 C4/8' },
        { wave: 'triangle', vol: 0.12, notes: 'C2/4 C2/4 Ab1/4 G1/4 C2/4 C2/4 Ab1/4 G1/4' },
        { wave: 'sine', vol: 0.06, notes: 'G3/8 Ab3/8 G3/8 F#3/8' }
      ]
    },
    duel: {
      bpm: 168, parts: [
        { wave: 'square', vol: 0.035, notes: 'E4/0.5 G4/0.5 B4/1 A4/0.5 G4/0.5 F#4/1 E4/0.5 F#4/0.5 G4/1 B4/1 E5/2 D5/1 C5/0.5 B4/0.5 A4/1 G4/1 F#4/1 A4/1 B4/2 B3/2 E4/0.5 G4/0.5 B4/1 C5/1 B4/1 A4/2 G4/1 F#4/1 E4/5' },
        { wave: 'square', vol: 0.028, notes: 'E2/0.5 E3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 C2/0.5 C3/0.5 C2/0.5 C3/0.5 C2/0.5 C3/0.5 C2/0.5 C3/0.5 A1/0.5 A2/0.5 A1/0.5 A2/0.5 A1/0.5 A2/0.5 A1/0.5 A2/0.5 B1/0.5 B2/0.5 B1/0.5 B2/0.5 B1/0.5 B2/0.5 B1/0.5 B2/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 C2/0.5 C3/0.5 C2/0.5 C3/0.5 D2/0.5 D3/0.5 D2/0.5 D3/0.5 E2/0.5 E3/0.5 E2/0.5 E3/0.5 B1/0.5 B2/0.5 B1/0.5 B2/0.5 E2/2 E2/2' },
        { wave: 'noise', vol: 0.045, notes: 'k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/0.5 n/0.5 n/0.5 n/0.5 k/2' }
      ]
    },
    memory: {
      bpm: 66, parts: [
        { wave: 'triangle', vol: 0.1, notes: 'E4/1 G4/1 B4/2 r/4 A4/1 G4/0.5 F#4/0.5 G4/2 r/4 C5/3 B4/1 r/4 E4/4 r/4' },
        { wave: 'sine', vol: 0.1, notes: 'E2/8 C3/8 A2/8 E2/8' }
      ]
    }
  };

  A.parseNotes = src => src.trim().split(/\s+/).map(tok => {
    const m = /^(r|n|k|[A-G][#b]?\d)\/(\d+(?:\.\d+)?)$/.exec(tok);
    if (!m) throw new Error('bad note ' + tok);
    return [m[1], +m[2]];
  });

  A.noteFreq = n => {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (semi + (+m[3] + 1) * 12 - 69) / 12);
  };

  A.TYPES = { blade: 'клинок', strike: 'удар', blaster: 'бластер', ion: 'ион', shock: 'разряд', mind: 'разум', light: 'свет' };
  A.NRAV = { coward: 'трус', merc: 'наёмник', fanatic: 'фанатик', proud: 'гордец', dutiful: 'служака' };
  A.WEIGHTS = { light: 'лёгкий', medium: 'средний', heavy: 'тяжёлый' };

  A.HEROES = {
    aayla: { name: 'Эйла', look: 'aayla_padawan', looks: { pro: 'aayla_padawan', ch1: 'aayla_dancer', ch2: 'aayla_kiffex', ch3: 'aayla_robe', ch4: 'aayla_robe', ch5: 'aayla_robe', ch6: 'aayla_robe', ch7: 'aayla_robe' }, blade: '#e83a2a', tempo: true, base: { hp: 120, fp: 30, mig: 10, wil: 9, agi: 12, sta: 8 }, grow: { hp: 14, fp: 3, mig: 1.6, wil: 1.3, agi: 0.8, sta: 1.0 }, skills: ['blade', 'combo', 'leap', 'throw', 'whirl', 'roll', 'push', 'pull', 'disarm', 'sense', 'brace', 'deflect', 'focus', 'guard', 'talk'] },
    anzat: { name: 'Анзат', look: 'anzat_feral', retinue: true, base: { hp: 100, fp: 0, mig: 10, wil: 8, agi: 14, sta: 8 }, grow: { hp: 11, fp: 0, mig: 1.4, wil: 0.5, agi: 0.5, sta: 0.9 }, skills: ['feral', 'hunger', 'guard'] },
    vos: { name: 'Вос', look: 'vos_early', blade: '#3ad04a', base: { hp: 140, fp: 28, mig: 12, wil: 8, agi: 10, sta: 10 }, grow: { hp: 15, fp: 3, mig: 1.7, wil: 1.4, agi: 0.7, sta: 1.1 }, skills: ['blade', 'read', 'vlightning', 'push', 'guard'] },
    tholme: { name: 'Толм', look: 'tholme_robe', blade: '#3ad04a', base: { hp: 140, fp: 30, mig: 11, wil: 10, agi: 11, sta: 10 }, grow: { hp: 14, fp: 3, mig: 1.6, wil: 1.4, agi: 0.8, sta: 1.1 }, skills: ['blade', 'shadow', 'push', 'guard'] },
    plo: { name: 'Пло Кун', look: 'plo_robe', blade: '#4a8aff', base: { hp: 150, fp: 34, mig: 11, wil: 12, agi: 10, sta: 11 }, grow: { hp: 15, fp: 3.4, mig: 1.5, wil: 1.6, agi: 0.7, sta: 1.1 }, skills: ['blade', 'telepathy', 'push', 'guard'] },
    villie: { name: 'Вилли', look: 'villie_spacer', base: { hp: 120, fp: 0, mig: 11, wil: 8, agi: 13, sta: 9 }, grow: { hp: 12, fp: 0, mig: 1.5, wil: 0.6, agi: 0.8, sta: 0.9 }, skills: ['vshot', 'bet', 'thermal', 'flash', 'guard'] },
    kit: { name: 'Кит', look: 'kit_robe', blade: '#3ad04a', wet: 1.25, base: { hp: 150, fp: 32, mig: 12, wil: 10, agi: 11, sta: 10 }, grow: { hp: 15, fp: 3, mig: 1.6, wil: 1.4, agi: 0.8, sta: 1.1 }, skills: ['blade', 'shiicho', 'push', 'guard'] },
    kiadi: { name: 'Ки-Ади-Мунди', look: 'kiadi_robe', blade: '#4a8aff', base: { hp: 150, fp: 34, mig: 12, wil: 12, agi: 10, sta: 11 }, grow: { hp: 15, fp: 3.2, mig: 1.6, wil: 1.5, agi: 0.7, sta: 1.1 }, skills: ['blade', 'mundipush', 'guard'] },
    shaak: { name: 'Шаак Ти', look: 'shaak_robe', blade: '#4a8aff', base: { hp: 140, fp: 34, mig: 11, wil: 12, agi: 12, sta: 10 }, grow: { hp: 14, fp: 3.2, mig: 1.5, wil: 1.5, agi: 0.8, sta: 1.0 }, skills: ['blade', 'tkthrow', 'guard'] },
    traa: { name: 'Т\'ра Саа', look: 'traa_neti', blade: '#3ad04a', base: { hp: 150, fp: 36, mig: 11, wil: 13, agi: 10, sta: 12 }, grow: { hp: 15, fp: 3.4, mig: 1.5, wil: 1.6, agi: 0.7, sta: 1.2 }, skills: ['blade', 'roots', 'guard'] },
    shonju: { name: 'Шон-Джу', look: 'shonju_robe', base: { hp: 150, fp: 30, mig: 13, wil: 12, agi: 12, sta: 11 }, grow: { hp: 15, fp: 3, mig: 1.7, wil: 1.5, agi: 0.8, sta: 1.1 }, skills: ['spalm', 'guard'] },
    clone_elite: { name: 'Элитный клон', look: 'clone_elite', base: { hp: 120, fp: 0, mig: 12, wil: 8, agi: 12, sta: 11 }, grow: { hp: 12, fp: 0, mig: 1.5, wil: 0.6, agi: 0.7, sta: 1.0 }, skills: ['cshot', 'guard'] },
    secura_guard: { name: 'Стражник Секура', look: 'twilek_guard', base: { hp: 120, fp: 0, mig: 12, wil: 8, agi: 11, sta: 11 }, grow: { hp: 12, fp: 0, mig: 1.4, wil: 0.5, agi: 0.6, sta: 1.0 }, skills: ['zapstaff', 'guard'] },
    bly: { name: 'Блай', look: 'bly_phase2', base: { hp: 130, fp: 0, mig: 12, wil: 9, agi: 12, sta: 12 }, grow: { hp: 14, fp: 0, mig: 1.6, wil: 0.7, agi: 0.8, sta: 1.1 }, skills: ['bshot', 'suppress', 'grenade', 'bcover', 'guard'] },
    ekria: { name: 'Экрия', look: 'ekria_padawan', blade: '#4a8aff', base: { hp: 110, fp: 26, mig: 10, wil: 11, agi: 13, sta: 9 }, grow: { hp: 12, fp: 2.6, mig: 1.4, wil: 1.4, agi: 0.8, sta: 0.9 }, skills: ['blade', 'hack', 'guard'] },
    barriss: { name: 'Барисс', look: 'barriss_robe', blade: '#4a8aff', base: { hp: 140, fp: 34, mig: 11, wil: 13, agi: 11, sta: 10 }, grow: { hp: 14, fp: 3.2, mig: 1.5, wil: 1.6, agi: 0.7, sta: 1.0 }, skills: ['blade', 'heal', 'guard'] },
    zonder: { name: 'Зондер', look: 'zonder_padawan', blade: '#3ad04a', base: { hp: 120, fp: 24, mig: 11, wil: 10, agi: 13, sta: 10 }, grow: { hp: 12, fp: 2.4, mig: 1.5, wil: 1.2, agi: 0.8, sta: 1.0 }, skills: ['blade', 'tkthrow', 'guard'] },
    clone501: { name: 'Боец 501-го', look: 'clone501', base: { hp: 120, fp: 0, mig: 12, wil: 8, agi: 12, sta: 11 }, grow: { hp: 12, fp: 0, mig: 1.5, wil: 0.6, agi: 0.7, sta: 1.0 }, skills: ['cshot', 'guard'] },
    clone_327: { name: 'Боец 327-го', look: 'clone_327', base: { hp: 110, fp: 0, mig: 11, wil: 8, agi: 11, sta: 10 }, grow: { hp: 11, fp: 0, mig: 1.4, wil: 0.5, agi: 0.6, sta: 0.9 }, skills: ['cshot', 'guard'] }
  };

  A.SKILLS = {
    blade: { name: 'Клинок', menu: 'blade', type: 'blade', power: 80, target: 'front', weight: 1, about: 'удар по переднему ряду, +1 Темп' },
    combo: { name: 'Связка', menu: 'blade', type: 'blade', power: 58, hits: 2, tempo: 2, target: 'front', weight: 1, about: 'два удара по одной цели' },
    leap: { name: 'Прыжок Атару', menu: 'blade', type: 'blade', power: 74, tempo: 2, target: 'any', weight: 1, about: 'удар по любому ряду' },
    throw: { name: 'Бросок клинка', menu: 'blade', type: 'blade', power: 48, tempo: 3, target: 'row', weight: 1.1, about: 'весь ряд, клинок возвращается' },
    whirl: { name: 'Вихрь Атару', menu: 'blade', type: 'blade', power: 68, tempo: 4, target: 'frontAll', weight: 1.2, about: 'весь передний ряд' },
    roll: { name: 'Кувырок нексу', menu: 'blade', tempo: 1, target: 'self', weight: 0.5, effect: 'evade', about: 'уйти от следующей атаки' },
    push: { name: 'Толчок', menu: 'force', type: 'strike', atk: 'wil', power: 30, fp: 10, target: 'any', weight: 1, effect: 'push', level: 1, about: 'передний ряд в задний, задний в опасность' },
    pull: { name: 'Притяжение', menu: 'force', fp: 8, target: 'back', weight: 0.8, effect: 'pull', about: 'задний ряд в передний' },
    disarm: { name: 'Вырвать оружие', menu: 'force', fp: 8, target: 'shooter', weight: 0.8, effect: 'disarm', about: 'стрелок два хода без выстрелов' },
    sense: { name: 'Чутьё', menu: 'force', fp: 6, target: 'none', weight: 0.8, effect: 'sense', about: 'нрав и слабости всех врагов' },
    brace: { name: 'Обрушить крепь', menu: 'force', fp: 12, target: 'none', weight: 1, effect: 'collapse', needs: 'brace', about: 'завал на задний ряд' },
    deflect: { name: 'Отражение', menu: 'stance', target: 'self', weight: 0.8, effect: 'deflect', about: 'выстрелы уходят в стрелков' },
    focus: { name: 'Сосредоточиться', menu: 'stance', target: 'self', weight: 1, effect: 'focus', about: '+30 % Силы и Покой' },
    guard: { name: 'Защита', menu: 'stance', target: 'self', weight: 1, effect: 'guard', about: 'урон по герою вдвое меньше до его хода' },
    talk: { name: 'Слово', menu: 'talk', target: 'talk', weight: 1, about: 'убедить, внушить, обаять, пригрозить' },
    fists: { name: 'Рукопашная', menu: 'hand', type: 'strike', power: 70, target: 'front', weight: 0.9, about: 'удар рукой или ногой по переднему ряду' },
    calm: { name: 'Покой', menu: 'stance', target: 'self', weight: 0.8, effect: 'calm', about: 'покой на три хода: Сила вдвое быстрее, страх не действует' },
    foresee: { name: 'Прочтение', menu: 'force', fp: 6, target: 'enemy', weight: 0.8, effect: 'foresee', about: 'Чутьё показывает следующий ход цели' },
    mindguard: { name: 'Наука Пло Куна', passive: true, about: 'защита разума: сопротивление страху +50 %' },
    instinct: { name: 'Инстинкт', type: 'strike', atk: 'wil', power: 30, level: 1 },
    feral: { name: 'Когти', menu: 'own', type: 'strike', power: 62, target: 'front', weight: 0.9, about: 'удар по переднему ряду' },
    hunger: { name: 'Голод', menu: 'own', type: 'mind', atk: 'mig', power: 54, target: 'enemy', weight: 1.1, effect: 'drain', about: 'тянет здоровье из цели, половина возвращается анзату' },
    klightning: { name: 'Молния Каркко', menu: 'force', gift: true, type: 'shock', power: 92, fp: 0, giftFp: 14, dark: 3, target: 'enemy', weight: 1.1, about: 'тёмный дар: разряд по одному врагу' },
    terror: { name: 'Ужас', menu: 'force', gift: true, type: 'mind', power: 18, fp: 0, giftFp: 12, dark: 3, target: 'row', weight: 1.1, effect: 'fear', about: 'тёмный дар: страх на весь ряд, трусы бегут' },
    command: { name: 'Приказ свите', menu: 'force', gift: true, fp: 0, giftFp: 10, dark: 3, target: 'none', weight: 0.8, effect: 'command', needs: 'retinue', about: 'тёмный дар: анзати сразу бьют своей целью' },
    lower: { name: 'Опустить клинок', menu: 'stance', target: 'self', weight: 1, effect: 'lower', about: 'не драться с Восом' },
    baton: { name: 'Шоковая дубинка', type: 'shock', atk: 'mig', power: 44, melee: true },
    vblade: { name: 'Клинок Воса', type: 'blade', power: 46, melee: true },
    vines: { name: 'Корни', type: 'strike', power: 42, ranged: true },
    hold: { name: 'Корни держат', type: 'strike', power: 16, ranged: true, stun: 1 },
    ksaber: { name: 'Красный клинок', type: 'blade', power: 66, melee: true },
    kslam: { name: 'Удар о стену', type: 'strike', power: 58, ranged: true, stun: 1 },
    kbolt: { name: 'Молния', type: 'shock', power: 74, ranged: true },
    vanish: { name: 'Исчезновение' },
    reappear: { name: 'Каркко за спиной' },
    vdefend: { name: 'Вос защищается' },
    dread: { name: 'Морок', type: 'mind', power: 22, ranged: true },
    claw: { name: 'Удар лапой', type: 'strike', power: 28, melee: true },
    tentacles: { name: 'Щупальца', type: 'strike', power: 14, melee: true, stun: 1 },
    barb: { name: 'Жало', type: 'strike', power: 18, melee: true, slow: 2 },
    tail: { name: 'Удар хвостом', type: 'strike', power: 36, melee: true },
    nip: { name: 'Укус', type: 'strike', power: 20, melee: true },
    pounce: { name: 'Прыжок сверху', type: 'strike', power: 60, melee: true },
    pistol: { name: 'Выстрел', type: 'blaster', power: 44, ranged: true, deflect: true },
    zap: { name: 'Электропосох', type: 'shock', atk: 'mig', power: 34, melee: true },
    read: { name: 'Прочтение', menu: 'own', fp: 8, target: 'enemy', weight: 0.8, effect: 'read', about: 'два следующих хода и слабости врага' },
    shadow: { name: 'Тень', menu: 'force', fp: 10, target: 'self', weight: 0.8, effect: 'shadow', about: 'уйти в тень: враги не видят до удара, удар клинком из тени вдвое сильнее' },
    telepathy: { name: 'Телепатия', menu: 'force', type: 'mind', atk: 'wil', power: 34, fp: 12, target: 'row', weight: 1.1, effect: 'fear', about: 'страх через Силу по всему ряду' },
    seal: { name: 'Закрыть проход', menu: 'force', target: 'none', weight: 1, effect: 'seal', about: 'Силой закрыть проход в пещеру пожирателей' },
    swarmbite: { name: 'Рой впивается', type: 'strike', power: 30, ranged: true },
    djemso: { name: 'Джем-Со', menu: 'stance', target: 'self', weight: 0.8, effect: 'djemso', about: 'до своего хода: принятый удар даёт Темп, на удар вблизи ответ клинком' },
    vshot: { name: 'Бластер', menu: 'own', type: 'blaster', power: 62, target: 'any', weight: 1, about: 'выстрел по любой цели' },
    bet: { name: 'Ставка', menu: 'own', target: 'bet', weight: 0.6, effect: 'bet', about: 'поставить кредиты на исход боя, выигрыш втрое' },
    thermal: { name: 'Термодетонатор', menu: 'own', type: 'strike', power: 74, target: 'row', weight: 1.2, once: true, about: 'взрыв по ряду, один раз за бой' },
    flash: { name: 'Вспышка', menu: 'own', target: 'none', weight: 0.8, once: true, effect: 'flash', about: 'враги слепнут на два хода: выстрелы вдвое слабее' },
    zapstaff: { name: 'Электропосох', menu: 'own', type: 'shock', atk: 'mig', power: 58, target: 'front', weight: 1, about: 'удар по переднему ряду' },
    staff: { name: 'Кортозисный посох', type: 'strike', power: 64, melee: true },
    staffsweep: { name: 'Подсечка посохом', type: 'strike', power: 30, melee: true, stun: 1 },
    sniper: { name: 'Прицельный выстрел', type: 'blaster', power: 66, ranged: true, deflect: true },
    net: { name: 'Сеть', type: 'strike', power: 18, ranged: true, stun: 1 },
    vibroaxe: { name: 'Вибротопор', type: 'blade', power: 72, melee: true },
    scalpel: { name: 'Скальпель', type: 'blade', power: 62, melee: true },
    shockfield: { name: 'Защитный разряд', type: 'shock', power: 74, ranged: true },
    inject: { name: 'Игла', type: 'strike', power: 30, melee: true, poison: true },
    vlightning: { name: 'Молния', menu: 'force', type: 'shock', power: 70, fp: 18, target: 'enemy', weight: 1.1, about: 'разряд по одному врагу' },
    shot: { name: 'Выстрел', type: 'blaster', power: 70, ranged: true, deflect: true },
    stab: { name: 'Удар виброножом', type: 'blade', power: 80, melee: true },
    punch: { name: 'Удар кулаком', type: 'strike', power: 14, melee: true },
    bite: { name: 'Укус', type: 'strike', power: 46, melee: true, poison: true },
    bigbite: { name: 'Укус', type: 'strike', power: 90, melee: true },
    web: { name: 'Паутина', type: 'strike', power: 20, ranged: true, stun: 1 },
    swarm: { name: 'Зов роя', summon: 'spider' },
    advance: { name: 'Шаг вперёд', move: 'front' },
    search: { name: 'Ищет оружие' },
    shiicho: { name: 'Шии-Чо', menu: 'own', type: 'blade', power: 58, target: 'frontAll', weight: 1.1, about: 'круговой удар по переднему ряду; под дождём и в воде сильнее' },
    duo: { name: 'Вдвоём', menu: 'blade', type: 'blade', power: 72, tempo: 2, target: 'enemy', weight: 1, needs: 'vos', about: 'Эйла и Вос бьют одну цель вместе' },
    twinwhirl: { name: 'Двойной вихрь', menu: 'blade', type: 'blade', power: 62, tempo: 3, target: 'frontAll', weight: 1.2, needs: 'kit', about: 'Вихрь Атару и Шии-Чо Кита по всему переднему ряду' },
    barrier: { name: 'Барьер Силы', menu: 'force', fp: 14, target: 'none', weight: 1, effect: 'barrier', about: 'до хода Эйлы выстрелы и взрывы по отряду вдвое слабее, яд не берёт' },
    mundipush: { name: 'Толчок Мунди', menu: 'own', type: 'strike', atk: 'wil', power: 48, fp: 8, target: 'any', weight: 1, about: 'мощный толчок Силой по одной цели' },
    tkthrow: { name: 'Обломки Силой', menu: 'own', type: 'strike', atk: 'wil', power: 44, fp: 8, target: 'any', weight: 1, about: 'Сила швыряет в цель обломки корабля' },
    b1shot: { name: 'Выстрел B1', type: 'blaster', power: 46, ranged: true, deflect: true },
    b2burst: { name: 'Очередь с запястья', type: 'blaster', power: 44, ranged: true, deflect: true, hits: 2 },
    b2punch: { name: 'Удар B2', type: 'strike', power: 60, melee: true },
    dekashot: { name: 'Спаренные бластеры', type: 'blaster', power: 42, ranged: true, deflect: true, hits: 2 },
    sonic: { name: 'Звуковой бластер', type: 'strike', power: 50, ranged: true },
    rise: { name: 'Взлёт' },
    dgrab: { name: 'Щупальце', type: 'strike', power: 46, melee: true, stun: 1 },
    dbite: { name: 'Пасть', type: 'strike', power: 70, melee: true },
    zblaster: { name: 'Бластер Зенекса', type: 'blaster', power: 62, ranged: true, deflect: true },
    pheromone: { name: 'Феромоны', type: 'mind', power: 22, ranged: true },
    zshove: { name: 'Толчок к перилам', type: 'strike', power: 48, melee: true },
    gsabers: { name: 'Два клинка', type: 'blade', power: 58, melee: true, hits: 2 },
    gspin: { name: 'Вращение клинков', type: 'blade', power: 44, melee: true },
    ggrab: { name: 'Хватка когтями', type: 'strike', power: 52, melee: true, stun: 1 },
    bpunch: { name: 'Удар Блая', type: 'strike', power: 46, melee: true },
    bsweep: { name: 'Подсечка Блая', type: 'strike', power: 28, melee: true, stun: 1 },
    roots: { name: 'Корни', menu: 'own', fp: 10, target: 'enemy', weight: 1, effect: 'roots', about: 'корни держат врага на месте и два хода лечат отряд' },
    heal: { name: 'Исцеление', menu: 'force', fp: 16, target: 'ally', weight: 1, effect: 'heal', about: 'Сила затягивает раны: +30 % здоровья одному герою' },
    cshot: { name: 'Залп клона', menu: 'own', type: 'blaster', power: 60, target: 'any', weight: 1, about: 'выстрел по любой цели' },
    spalm: { name: 'Ладонь Силы', menu: 'own', type: 'strike', atk: 'wil', power: 72, target: 'front', weight: 1, about: 'Сила через ладонь по переднему ряду' },
    antenna: { name: 'Срезать антенну', menu: 'blade', target: 'none', weight: 1, about: 'удар клинком по импланту Аурры' },
    pullsaber: { name: 'Притянуть клинок', menu: 'force', target: 'none', weight: 1, about: 'Сила возвращает клинок в руку' },
    repeater: { name: 'Тяжёлый бластер', type: 'blaster', power: 44, ranged: true, deflect: true, hits: 2 },
    asaber: { name: 'Красный клинок Аурры', type: 'blade', power: 70, melee: true },
    ashot: { name: 'Бластер Аурры', type: 'blaster', power: 62, ranged: true, deflect: true },
    ataunt: { name: 'Колкость', type: 'mind', power: 18, ranged: true },
    dlaser: { name: 'Лазеры дроида', type: 'blaster', power: 46, ranged: true, deflect: true, hits: 2 },
    dclaw: { name: 'Клешня', type: 'strike', power: 62, melee: true, stun: 1 },
    shpalm: { name: 'Ладонь Шон-Джу', type: 'strike', atk: 'wil', power: 66, melee: true },
    shwave: { name: 'Волна Силы', type: 'strike', atk: 'wil', power: 48, ranged: true, stun: 1 },
    squeeze: { name: 'Хватка за лекку', type: 'strike', power: 40, melee: true },
    bshot: { name: 'Два DC-17', menu: 'own', type: 'blaster', power: 46, hits: 2, target: 'any', weight: 1, about: 'два выстрела из пистолетов по любой цели' },
    suppress: { name: 'Огонь на подавление', menu: 'own', target: 'none', weight: 1, effect: 'suppress', about: 'два хода враги бьют на треть слабее' },
    grenade: { name: 'Граната', menu: 'own', type: 'strike', power: 72, target: 'row', weight: 1.1, once: true, about: 'взрыв по ряду, один раз за бой' },
    bcover: { name: 'Прикрыть генерала', menu: 'own', target: 'none', weight: 0.8, effect: 'bcover', about: 'до своего хода Блай принимает выстрелы и броски, нацеленные в Эйлу' },
    twidance: { name: 'Сумеречный танец', menu: 'blade', type: 'blade', power: 58, tempo: 3, target: 'none', weight: 1.1, about: 'три удара подряд по разным врагам, по любому ряду' },
    memlight: { name: 'Обрывок памяти', type: 'light', atk: 'wil', power: 64 },
    bondlight: { name: 'Связь с Восом', type: 'light', atk: 'wil', power: 30 },
    tholmelight: { name: 'Голос учителя', type: 'light', atk: 'wil', power: 30 },
    nblade: { name: 'Нож ногри', type: 'blade', power: 80, melee: true, poison: true },
    ndart: { name: 'Отравленный дротик', type: 'strike', power: 46, ranged: true, poison: true },
    rbeam: { name: 'Луч стража храма', type: 'blaster', power: 66, ranged: true, deflect: true },
    rslam: { name: 'Удар стража храма', type: 'strike', power: 90, melee: true },
    vsaber6: { name: 'Клинок Воса', type: 'blade', power: 120, melee: true },
    vthrow: { name: 'Бросок Силой', type: 'strike', atk: 'wil', power: 60, ranged: true },
    vkick6: { name: 'Удар ногой', type: 'strike', power: 72, melee: true, stun: 1 },
    askick: { name: 'Удар анзата', type: 'strike', power: 60, melee: true },
    gauntlet: { name: 'Кортозисная перчатка', type: 'strike', power: 90, melee: true },
    bcharge: { name: 'Бросок Бока', type: 'strike', power: 112 },
    runup: { name: 'Разбег' },
    retreat: { name: 'Отход' },
    gloom: { name: 'Тень прошлого', type: 'mind', power: 120, ranged: true },
    despair: { name: 'Отчаяние', type: 'mind', power: 80, ranged: true },
    vaapad: { name: 'Ваапад во тьме', type: 'mind', power: 150, ranged: true },
    hack: { name: 'Взлом', menu: 'own', target: 'droid', weight: 1, effect: 'hack', about: 'дроид или турель два хода стреляет по своим' },
    volley: { name: 'Отделение 327-го', menu: 'own', type: 'blaster', power: 52, target: 'none', weight: 1.2, once: true, about: 'отделение даёт залп по всем врагам, раз за бой' },
    aclaw: { name: 'Клешни акклея', type: 'blade', power: 92, melee: true },
    astomp: { name: 'Удар акклея', type: 'strike', power: 62, melee: true, stun: 1 },
    atshot: { name: 'Противотанковый залп', type: 'blaster', power: 84, ranged: true, deflect: true },
    gstrike: { name: 'Удар госсама', type: 'strike', power: 62, melee: true },
    gshot: { name: 'Выстрел госсама', type: 'blaster', power: 58, ranged: true, deflect: true },
    bclaw: { name: 'Лапа Зверя', type: 'blade', power: 92, melee: true },
    btentacle: { name: 'Щупальца Зверя', type: 'strike', power: 54, melee: true, stun: 1 },
    brise: { name: 'Встаёт на дыбы' },
    ceiling: { name: 'Обрушить своды', menu: 'force', target: 'none', weight: 1, about: 'Сила обрушивает сталактиты; Зверь гибнет, если стоит под ними' },
    wait: { name: 'Ждёт' }
  };

  A.BASIC_SKILLS = ['blade', 'guard', 'talk'];
  A.GIFTS = ['klightning', 'terror', 'command'];
  A.DARK_GIFTS_FROM = 40;

  A.STANCE = { deflect: [{ charges: 2, share: 0.5 }, { charges: 3, share: 0.75 }, { charges: 4, share: 1 }] };

  A.ENEMY_KINDS = {
    sentient: { weak: [], resist: [], immune: [] },
    beast: { weak: ['mind'], resist: [], immune: [] },
    droid: { weak: ['ion'], resist: [], immune: ['mind'] },
    morgukai: { weak: ['strike'], resist: [], immune: ['blade'], cortosis: true },
    anzat: { weak: [], resist: ['mind'], immune: [] },
    cyborg: { weak: ['ion'], resist: [], immune: ['mind'] },
    noghri: { weak: [], resist: ['mind'], immune: [] },
    illusion: { weak: [], resist: [], immune: [] },
    shade: { weak: ['light'], resist: [], immune: ['blade', 'strike', 'blaster', 'ion', 'shock', 'mind'] }
  };

  A.ENEMIES = {
    smuggler: { name: 'Контрабандист', kind: 'sentient', twilek: true, nrav: 'coward', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'twilek_green', hp: 100, mig: 34, wil: 10, agi: 18, sta: 14, resolve: 20, weak: ['shock'], xp: 40, credits: 15 },
    thug: { name: 'Громила', kind: 'sentient', twilek: true, nrav: 'merc', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'twilek_guard', hp: 150, mig: 40, wil: 8, agi: 14, sta: 24, resolve: 26, weak: ['strike'], xp: 60, credits: 20 },
    spider: { name: 'Энергетический паук', kind: 'beast', weight: 'light', ai: 'biter', beast: 'spider', hp: 80, mig: 30, wil: 6, agi: 19, sta: 12, weak: ['strike'], xp: 30, credits: 0 },
    giant_spider: { name: 'Огромный паук', kind: 'beast', boss: true, weight: 'heavy', ai: 'spiderboss', beast: 'giant', hp: 1100, mig: 48, wil: 14, agi: 12, sta: 24, weak: ['shock'], xp: 600, credits: 0 },
    lylek: { name: 'Лилек', kind: 'beast', weight: 'medium', ai: 'lylek', beast: 'lylek', hp: 80, mig: 18, wil: 6, agi: 12, sta: 12, armor: { blade: 0.75 }, xp: 60, credits: 0 },
    lylek_young: { name: 'Молодой лилек', kind: 'beast', weight: 'light', ai: 'lylek', young: true, beast: 'lylek_young', hp: 50, mig: 12, wil: 5, agi: 14, sta: 8, armor: { blade: 0.75 }, xp: 40, credits: 0 },
    lylek_old: { name: 'Старый лилек', kind: 'beast', boss: true, weight: 'heavy', ai: 'lylekboss', beast: 'lylek_old', hp: 240, mig: 16, wil: 10, agi: 10, sta: 16, armor: { blade: 0.75 }, xp: 220, credits: 0 },
    clan_guard: { name: 'Стражник', kind: 'sentient', twilek: true, nrav: 'dutiful', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'twilek_guard', melee: 'zap', hp: 80, mig: 16, wil: 9, agi: 12, sta: 12, resolve: 22, xp: 45, credits: 10 },
    anzat_wild: { name: 'Одичавший анзат', kind: 'anzat', nrav: 'fanatic', weight: 'medium', ai: 'melee', look: 'anzat_feral', melee: 'feral', senses: true, hp: 150, mig: 22, wil: 12, agi: 16, sta: 14, xp: 110, credits: 0 },
    guardian: { name: 'Стрелок стражи Киффу', kind: 'sentient', nrav: 'dutiful', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'guardian_black', closeIn: true, hp: 130, mig: 26, wil: 12, agi: 16, sta: 16, resolve: 34, xp: 120, credits: 25 },
    guardian_baton: { name: 'Страж Киффу', kind: 'sentient', nrav: 'dutiful', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'guardian_black', melee: 'baton', hp: 180, mig: 28, wil: 12, agi: 13, sta: 20, resolve: 34, xp: 130, credits: 25 },
    prisoner: { name: 'Заключённый', kind: 'sentient', nrav: 'coward', weight: 'light', ai: 'melee', weapon: 'vibro', look: 'prisoner_rags', melee: 'stab', hp: 120, mig: 24, wil: 8, agi: 14, sta: 12, resolve: 14, weak: ['mind'], xp: 80, credits: 10 },
    prisoner_merc: { name: 'Наёмник из кантины', kind: 'sentient', nrav: 'merc', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'prisoner_merc', melee: 'stab', hp: 160, mig: 28, wil: 10, agi: 13, sta: 16, resolve: 24, xp: 100, credits: 20 },
    vos_cantina: { name: 'Вос', kind: 'sentient', nrav: 'proud', weight: 'medium', ai: 'vosduel', look: 'vos_early', weapon: 'saber', blade: '#3ad04a', strongMind: true, hp: 2000, mig: 28, wil: 30, agi: 17, sta: 30, xp: 0, credits: 0 },
    traa: { name: 'Т\'ра Саа', kind: 'sentient', nrav: 'proud', weight: 'heavy', ai: 'traa', look: 'traa_neti', weapon: 'none', strongMind: true, boss: true, hp: 2400, mig: 24, wil: 32, agi: 12, sta: 32, xp: 0, credits: 0 },
    vos_sanctum: { name: 'Вос', kind: 'sentient', nrav: 'proud', weight: 'medium', ai: 'vossanctum', look: 'vos_early', weapon: 'saber', blade: '#3ad04a', strongMind: true, hp: 9999, mig: 28, wil: 30, agi: 15, sta: 30, xp: 0, credits: 0 },
    karkko: { name: 'Каркко', kind: 'anzat', nrav: 'proud', weight: 'heavy', ai: 'karkko', look: 'karkko_robe', weapon: 'saber', blade: '#e83a2a', strongMind: true, boss: true, hp: 700, mig: 34, wil: 36, agi: 16, sta: 26, xp: 0, credits: 0 },
    illusion: { name: 'Морок', kind: 'illusion', weight: 'light', ai: 'illusion', beast: 'illusion', fake: true, hp: 1, mig: 24, wil: 30, agi: 14, sta: 1, xp: 0, credits: 0 },
    challat: { name: 'Рой пожирателей', kind: 'beast', weight: 'light', ai: 'swarm', beast: 'challat', hp: 120, mig: 30, wil: 6, agi: 20, sta: 10, xp: 0, credits: 0 },
    fenn_guard: { name: 'Стражник Фенна', kind: 'sentient', twilek: true, nrav: 'dutiful', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'fenn_guard', melee: 'zap', hp: 100, mig: 30, wil: 14, agi: 17, sta: 18, resolve: 30, xp: 120, credits: 20 },
    fenn_shooter: { name: 'Стрелок Фенна', kind: 'sentient', twilek: true, nrav: 'dutiful', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'fenn_guard', closeIn: true, hp: 80, mig: 30, wil: 14, agi: 20, sta: 14, resolve: 30, xp: 110, credits: 20 },
    tsyr: { name: 'Цир', kind: 'morgukai', nrav: 'fanatic', weight: 'heavy', ai: 'morgukai', look: 'tsyr_armor', weapon: 'staff', melee: 'staff', strongMind: true, boss: true, hp: 9999, mig: 52, wil: 30, agi: 20, sta: 40, xp: 0, credits: 0 },
    bok_young: { name: 'Бок', kind: 'morgukai', nrav: 'fanatic', weight: 'heavy', ai: 'morgukai', look: 'bok_armor', weapon: 'staff', melee: 'staff', strongMind: true, hp: 9999, mig: 46, wil: 24, agi: 21, sta: 34, xp: 0, credits: 0 },
    bok: { name: 'Бок', kind: 'morgukai', nrav: 'fanatic', weight: 'heavy', ai: 'bok', look: 'bok_armor', weapon: 'staff', melee: 'staff', strongMind: true, boss: true, hp: 850, mig: 40, wil: 26, agi: 20, sta: 28, xp: 700, credits: 0 },
    hunter_rifle: { name: 'Охотник с винтовкой', kind: 'sentient', nrav: 'merc', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'hunter_rifle', shot: 'sniper', hp: 95, mig: 32, wil: 12, agi: 20, sta: 16, resolve: 28, xp: 130, credits: 40 },
    hunter_net: { name: 'Охотник с сетью', kind: 'sentient', nrav: 'coward', weight: 'light', ai: 'netter', weapon: 'blaster', look: 'hunter_rifle', hp: 85, mig: 28, wil: 10, agi: 22, sta: 14, resolve: 20, weak: ['mind'], xp: 120, credits: 30 },
    hunter_brute: { name: 'Охотник-громила', kind: 'sentient', nrav: 'merc', weight: 'heavy', ai: 'melee', weapon: 'vibro', look: 'hunter_brute', melee: 'vibroaxe', hp: 140, mig: 34, wil: 10, agi: 15, sta: 22, resolve: 32, xp: 150, credits: 40 },
    nikto_guard: { name: 'Никто-наёмник', kind: 'sentient', nrav: 'merc', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'nikto_merc', melee: 'vibroaxe', hp: 120, mig: 36, wil: 12, agi: 18, sta: 20, resolve: 30, xp: 160, credits: 30 },
    nikto_gunner: { name: 'Стрелок-никто', kind: 'sentient', nrav: 'merc', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'nikto_merc', closeIn: true, hp: 85, mig: 34, wil: 12, agi: 20, sta: 15, resolve: 28, xp: 140, credits: 30 },
    axrx: { name: 'AX/RX', kind: 'droid', weight: 'heavy', ai: 'axrx', beast: 'axrx', boss: true, hp: 520, mig: 34, wil: 20, agi: 17, sta: 26, xp: 600, credits: 0 },
    clan_shooter: { name: 'Стрелок стражи', kind: 'sentient', twilek: true, nrav: 'dutiful', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'twilek_guard', shot: 'pistol', closeIn: true, hp: 60, mig: 12, wil: 9, agi: 14, sta: 9, resolve: 22, xp: 45, credits: 10 },
    b1: { name: 'Боевой дроид B1', kind: 'droid', weight: 'light', ai: 'shooter', beast: 'b1', shot: 'b1shot', closeIn: true, hp: 110, mig: 44, wil: 1, agi: 19, sta: 20, xp: 110, credits: 0 },
    b2: { name: 'Супердроид B2', kind: 'droid', weight: 'heavy', ai: 'b2', beast: 'b2', hp: 200, mig: 56, wil: 1, agi: 15, sta: 40, weak: ['strike'], armor: { blade: 0.8 }, xp: 180, credits: 0 },
    droideka: { name: 'Дроидека', kind: 'droid', weight: 'medium', ai: 'shooter', beast: 'droideka', shot: 'dekashot', shield: true, hp: 180, mig: 50, wil: 1, agi: 21, sta: 34, xp: 170, credits: 0 },
    geonosian: { name: 'Джеонозиец', kind: 'sentient', nrav: 'fanatic', mute: true, weight: 'light', ai: 'flyer', beast: 'geonosian', shot: 'sonic', fly: true, hp: 100, mig: 46, wil: 12, agi: 26, sta: 16, xp: 110, credits: 0 },
    enforcer: { name: 'Громила', kind: 'sentient', nrav: 'merc', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'enforcer_wheel', melee: 'baton', hp: 130, mig: 38, wil: 14, agi: 19, sta: 22, resolve: 40, xp: 150, credits: 30 },
    enforcer_gun: { name: 'Стрелок', kind: 'sentient', nrav: 'coward', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'enforcer_gun', shot: 'pistol', closeIn: true, hp: 90, mig: 38, wil: 12, agi: 22, sta: 18, resolve: 34, weak: ['mind'], xp: 130, credits: 30 },
    dianoga: { name: 'Дианога', kind: 'beast', weight: 'heavy', ai: 'dianoga', beast: 'dianoga', elite: true, hp: 600, mig: 54, wil: 10, agi: 15, sta: 30, xp: 300, credits: 0 },
    zenex: { name: 'Зенекс', kind: 'sentient', nrav: 'proud', weight: 'medium', ai: 'zenex', look: 'zenex_boss', weapon: 'blaster', strongMind: true, boss: true, hp: 800, mig: 54, wil: 46, agi: 23, sta: 32, xp: 600, credits: 150 },
    grievous: { name: 'Гривус', kind: 'cyborg', nrav: 'proud', weight: 'heavy', ai: 'grievous', beast: 'grievous', strongMind: true, boss: true, hp: 9999, mig: 66, wil: 30, agi: 27, sta: 60, xp: 0, credits: 0 },
    bly_spar: { name: 'Блай', kind: 'sentient', nrav: 'dutiful', weight: 'medium', ai: 'spar', look: 'bly_bare', weapon: 'none', strongMind: true, boss: true, hp: 420, mig: 44, wil: 22, agi: 23, sta: 32, xp: 0, credits: 0 },
    devaron_guard: { name: 'Стражник сенатора', kind: 'sentient', nrav: 'dutiful', weight: 'medium', ai: 'melee', weapon: 'staff', look: 'devaron_guard', melee: 'zap', hp: 130, mig: 46, wil: 16, agi: 21, sta: 30, resolve: 52, xp: 110, credits: 20 },
    devaron_gun: { name: 'Стрелок сенатора', kind: 'sentient', nrav: 'dutiful', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'devaron_guard', shot: 'shot', closeIn: true, hp: 90, mig: 46, wil: 14, agi: 24, sta: 22, resolve: 48, xp: 100, credits: 20 },
    raider: { name: 'Налётчик', kind: 'sentient', nrav: 'merc', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'raider_blade', melee: 'stab', hp: 140, mig: 46, wil: 16, agi: 22, sta: 30, resolve: 50, xp: 120, credits: 30 },
    raider_gun: { name: 'Стрелок налётчиков', kind: 'sentient', nrav: 'coward', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'raider_gun', shot: 'shot', closeIn: true, hp: 100, mig: 46, wil: 14, agi: 25, sta: 24, resolve: 44, weak: ['mind'], xp: 100, credits: 30 },
    raider_heavy: { name: 'Налётчик с тяжёлым бластером', kind: 'sentient', nrav: 'merc', weight: 'heavy', ai: 'shooter', weapon: 'blaster', look: 'raider_heavy', shot: 'repeater', closeIn: true, hp: 200, mig: 52, wil: 16, agi: 18, sta: 34, resolve: 56, xp: 150, credits: 40 },
    aurra: { name: 'Аурра Синг', kind: 'sentient', nrav: 'proud', mute: true, weight: 'medium', ai: 'aurra', look: 'aurra_hunter', weapon: 'saber', blade: '#e83a2a', strongMind: true, boss: true, hp: 900, mig: 60, wil: 46, agi: 28, sta: 36, xp: 500, credits: 0 },
    operative: { name: 'Боевик Дуума', kind: 'sentient', nrav: 'merc', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'duum_merc', melee: 'stab', hp: 170, mig: 52, wil: 16, agi: 23, sta: 30, resolve: 54, xp: 110, credits: 30 },
    operative_gun: { name: 'Стрелок Дуума', kind: 'sentient', nrav: 'merc', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'duum_gun', shot: 'shot', closeIn: true, hp: 120, mig: 52, wil: 14, agi: 26, sta: 24, resolve: 50, xp: 100, credits: 30 },
    sec_droid: { name: 'Охранный дроид', kind: 'droid', weight: 'heavy', ai: 'secdroid', beast: 'secdroid', hp: 220, mig: 56, wil: 1, agi: 18, sta: 42, xp: 150, credits: 0 },
    duum_guard: { name: 'Охранник Дуума', kind: 'sentient', nrav: 'dutiful', weight: 'medium', ai: 'shooter', weapon: 'blaster', look: 'duum_gun', shot: 'shot', closeIn: true, hp: 110, mig: 50, wil: 16, agi: 24, sta: 30, resolve: 56, xp: 110, credits: 30 },
    shonju_foe: { name: 'Шон-Джу', kind: 'sentient', nrav: 'proud', mute: true, weight: 'medium', ai: 'shonju', look: 'shonju_robe', weapon: 'none', strongMind: true, boss: true, hp: 1000, mig: 62, wil: 52, agi: 26, sta: 38, xp: 500, credits: 0 },
    noghri: { name: 'Ногри', kind: 'noghri', nrav: 'fanatic', mute: true, weight: 'light', ai: 'melee', weapon: 'vibro', look: 'noghri_warrior', melee: 'nblade', hp: 170, mig: 72, wil: 20, agi: 30, sta: 28, xp: 85, credits: 0 },
    noghri_dart: { name: 'Ногри с дротиками', kind: 'noghri', nrav: 'fanatic', mute: true, weight: 'light', ai: 'shooter', weapon: 'none', look: 'noghri_warrior', shot: 'ndart', hp: 130, mig: 70, wil: 20, agi: 32, sta: 24, xp: 80, credits: 0 },
    rakatan_droid: { name: 'Страж ракатанского храма', kind: 'droid', weight: 'heavy', ai: 'secdroid', beast: 'rakatan', shot: 'rbeam', melee: 'rslam', hp: 250, mig: 70, wil: 1, agi: 18, sta: 46, xp: 110, credits: 0 },
    vos_honoghr: { name: 'Вос', kind: 'sentient', nrav: 'proud', mute: true, weight: 'medium', ai: 'vos6', look: 'vos_cw', weapon: 'saber', blade: '#3ad04a', strongMind: true, boss: true, hp: 9999, mig: 80, wil: 54, agi: 32, sta: 52, xp: 0, credits: 0 },
    anzat_student: { name: 'Ученик Акку Сеи', kind: 'anzat', nrav: 'dutiful', weight: 'medium', ai: 'melee', weapon: 'none', look: 'anzat_student', melee: 'askick', hp: 140, mig: 56, wil: 26, agi: 28, sta: 30, resolve: 50, xp: 0, credits: 0 },
    bok_clone: { name: 'Моргукай', kind: 'morgukai', nrav: 'fanatic', mute: true, weight: 'heavy', ai: 'melee', look: 'morgukai_clone', weapon: 'staff', melee: 'staff', strongMind: true, elite: true, hp: 460, mig: 64, wil: 26, agi: 22, sta: 40, xp: 250, credits: 0 },
    morgukai_clone: { name: 'Клон-моргукай', kind: 'morgukai', nrav: 'fanatic', mute: true, weight: 'heavy', ai: 'melee', look: 'morgukai_clone', weapon: 'staff', melee: 'staff', strongMind: true, hp: 240, mig: 70, wil: 22, agi: 22, sta: 36, xp: 120, credits: 0 },
    anzat_assassin: { name: 'Анзат-убийца', kind: 'anzat', nrav: 'fanatic', mute: true, weight: 'medium', ai: 'melee', look: 'anzat_assassin', weapon: 'vibro', melee: 'feral', senses: true, hp: 190, mig: 62, wil: 30, agi: 32, sta: 30, xp: 115, credits: 0 },
    bok_final: { name: 'Бок', kind: 'morgukai', nrav: 'fanatic', mute: true, weight: 'heavy', ai: 'bokfinal', look: 'bok_cyber', weapon: 'staff', melee: 'gauntlet', strongMind: true, boss: true, hp: 1300, mig: 80, wil: 30, agi: 21, sta: 44, xp: 500, credits: 0 },
    shade_tinte: { name: 'Тень Шейф Тинте', kind: 'shade', nrav: 'proud', mute: true, weight: 'medium', ai: 'shade', look: 'shade_tinte', weapon: 'none', strongMind: true, hp: 460, mig: 30, wil: 52, agi: 20, sta: 30, xp: 110, credits: 0 },
    shade_karkko: { name: 'Тень Каркко', kind: 'shade', nrav: 'proud', mute: true, weight: 'medium', ai: 'shade', look: 'shade_karkko', weapon: 'saber', blade: '#e83a2a', strongMind: true, hp: 500, mig: 30, wil: 56, agi: 21, sta: 30, xp: 120, credits: 0 },
    b1_late: { name: 'Боевой дроид B1', kind: 'droid', weight: 'light', ai: 'shooter', beast: 'b1', shot: 'b1shot', closeIn: true, hp: 150, mig: 78, wil: 1, agi: 22, sta: 30, xp: 90, credits: 0 },
    b2_late: { name: 'Супердроид B2', kind: 'droid', weight: 'heavy', ai: 'b2', beast: 'b2', hp: 300, mig: 88, wil: 1, agi: 17, sta: 54, weak: ['strike'], armor: { blade: 0.8 }, xp: 150, credits: 0 },
    deka_late: { name: 'Дроидека', kind: 'droid', weight: 'medium', ai: 'shooter', beast: 'droideka', shot: 'dekashot', shield: true, hp: 240, mig: 80, wil: 1, agi: 24, sta: 46, xp: 140, credits: 0 },
    acklay: { name: 'Акклей', kind: 'beast', weight: 'heavy', ai: 'melee', beast: 'acklay', melee: 'aclaw', elite: true, hp: 520, mig: 90, wil: 14, agi: 20, sta: 46, armor: { blade: 0.75 }, weak: ['strike'], xp: 260, credits: 0 },
    av_turret: { name: 'Противотанковая турель', kind: 'droid', weight: 'heavy', ai: 'shooter', beast: 'turret', shot: 'atshot', hp: 240, mig: 72, wil: 1, agi: 14, sta: 50, xp: 150, credits: 0 },
    gossam: { name: 'Коммандос-госсам', kind: 'sentient', nrav: 'dutiful', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'gossam_commando', melee: 'gstrike', hp: 210, mig: 82, wil: 22, agi: 26, sta: 38, resolve: 62, xp: 170, credits: 30 },
    gossam_gun: { name: 'Стрелок-госсам', kind: 'sentient', nrav: 'dutiful', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'gossam_commando', shot: 'gshot', closeIn: true, hp: 160, mig: 80, wil: 20, agi: 28, sta: 30, resolve: 60, xp: 160, credits: 30 },
    bly_spar7: { name: 'Блай', kind: 'sentient', nrav: 'dutiful', weight: 'medium', ai: 'spar', look: 'bly_bare', weapon: 'none', strongMind: true, boss: true, hp: 640, mig: 64, wil: 30, agi: 30, sta: 48, xp: 0, credits: 0 },
    endor_beast: { name: 'Зверь в Пасти Горы', kind: 'beast', weight: 'heavy', ai: 'beast', beast: 'endor_beast', boss: true, hp: 1500, mig: 82, wil: 20, agi: 22, sta: 50, resist: ['blaster'], xp: 700, credits: 0 },
    dark_vos: { name: 'Тёмный Вос', kind: 'shade', nrav: 'proud', mute: true, weight: 'medium', ai: 'shade', look: 'vos_dark', weapon: 'none', strongMind: true, boss: true, hp: 1100, mig: 30, wil: 60, agi: 23, sta: 34, xp: 220, credits: 0 }
  };

  A.GROUPS = {
    smugglers_a: { name: 'Контрабандисты', units: [['thug', 'front', 1], ['smuggler', 'back', 0], ['smuggler', 'back', 2]], hazard: null, scene: 'cave' },
    smugglers_b: { name: 'Контрабандисты', units: [['thug', 'front', 1], ['smuggler', 'back', 1]], hazard: null, scene: 'cave' },
    smugglers_c: { name: 'Контрабандисты у пропасти', units: [['smuggler', 'front', 1], ['smuggler', 'back', 0], ['smuggler', 'back', 2]], hazard: 'chasm', scene: 'cave' },
    smugglers_d: { name: 'Контрабандисты', units: [['thug', 'front', 0], ['thug', 'front', 2], ['smuggler', 'back', 1]], hazard: null, scene: 'cave' },
    spiders_a: { name: 'Энергетические пауки', units: [['spider', 'front', 0], ['spider', 'front', 1], ['spider', 'front', 2]], hazard: null, scene: 'mine' },
    spiders_b: { name: 'Энергетические пауки', units: [['spider', 'front', 0], ['spider', 'front', 2], ['spider', 'back', 1]], hazard: null, scene: 'mine' },
    spider_boss: { name: 'Логово', units: [['giant_spider', 'back', 1], ['spider', 'front', 0], ['spider', 'front', 2]], hazard: 'brace', boss: true, scene: 'mine' },
    guards_a: { name: 'Стража поместья', units: [['clan_guard', 'front', 1]], hazard: null, scene: 'estate', spare: true, talk: 'guards' },
    guards_b: { name: 'Стража поместья', units: [['clan_guard', 'front', 1], ['clan_shooter', 'back', 1]], hazard: null, scene: 'estate', spare: true, talk: 'guards' },
    lylek_a: { name: 'Лилек', units: [['lylek', 'front', 1]], hazard: null, scene: 'ryloth_cave' },
    lylek_b: { name: 'Молодые лилеки', units: [['lylek_young', 'front', 0], ['lylek_young', 'front', 2]], hazard: null, scene: 'ryloth_cave' },
    lylek_c: { name: 'Лилеки у обрыва', units: [['lylek', 'front', 1], ['lylek_young', 'back', 1]], hazard: 'chasm', scene: 'ryloth_cave' },
    lylek_boss: { name: 'Логово лилека', units: [['lylek_old', 'front', 1]], hazard: 'chasm', boss: true, scene: 'ryloth_cave' },
    temple_a: { name: 'Одичавшие анзати', units: [['anzat_wild', 'front', 0], ['anzat_wild', 'front', 2]], hazard: null, scene: 'kiffex_temple' },
    temple_b: { name: 'Одичавшие анзати у провала', units: [['anzat_wild', 'front', 1], ['anzat_wild', 'back', 1]], hazard: 'chasm', scene: 'kiffex_temple' },
    post_a: { name: 'Стражи Киффу', units: [['guardian_baton', 'front', 1], ['guardian', 'back', 0], ['guardian', 'back', 2]], hazard: null, scene: 'kiffex_post', talk: 'kiffu' },
    post_b: { name: 'Стражи Киффу', units: [['guardian_baton', 'front', 0], ['guardian_baton', 'front', 2], ['guardian', 'back', 1]], hazard: null, scene: 'kiffex_post', talk: 'kiffu' },
    post_c: { name: 'Стражи Киффу у шахты лифта', units: [['guardian', 'front', 1], ['guardian', 'back', 0], ['guardian', 'back', 2]], hazard: 'chasm', scene: 'kiffex_post', talk: 'kiffu' },
    cantina_crowd: { name: 'Заключённые кантины', units: [['prisoner', 'front', 0], ['prisoner_merc', 'front', 1], ['prisoner', 'front', 2]], hazard: null, scene: 'kiffex_cantina', talk: 'cantina' },
    duel_cantina: { name: 'Поединок в кантине', units: [['vos_cantina', 'front', 1]], hazard: null, scene: 'kiffex_cantina', duel: 'cantina', party: ['aayla'], boss: true },
    traa_duel: { name: 'Т\'ра Саа', units: [['traa', 'front', 1]], hazard: null, scene: 'kiffex_hills', duel: 'traa', boss: true },
    duel_sanctum: { name: 'Святилище', units: [['vos_sanctum', 'front', 1]], hazard: null, scene: 'kiffex_sanctum', duel: 'sanctum', party: ['aayla'], boss: true },
    karkko_boss: { name: 'Каркко', units: [['karkko', 'front', 1]], hazard: null, scene: 'kiffex_sanctum', duel: 'karkko', hero: { id: 'vos', level: 17 }, boss: true },
    stark_cave: { name: 'Пещера пожирателей', units: [['challat', 'front', 0], ['challat', 'front', 2], ['challat', 'back', 1]], hazard: null, scene: 'avos_cave', duel: 'challat', hero: [{ id: 'tholme', level: 15 }, { id: 'plo', level: 15 }], boss: true },
    fenn_a: { name: 'Стража дома Фенн', units: [['fenn_guard', 'front', 1], ['fenn_shooter', 'back', 1]], hazard: null, scene: 'fenn_house', spare: true, talk: 'fenn' },
    fenn_b: { name: 'Стража дома Фенн', units: [['fenn_guard', 'front', 0], ['fenn_guard', 'front', 2]], hazard: null, scene: 'fenn_house', spare: true, talk: 'fenn' },
    morgukai_night: { name: 'Покои Ната', units: [['tsyr', 'front', 0], ['bok_young', 'front', 2]], hazard: null, scene: 'secura_chamber', duel: 'night', allies: [{ id: 'guard_1', hero: 'secura_guard' }, { id: 'guard_2', hero: 'secura_guard' }], boss: true },
    hunters_a: { name: 'Охотники за головами', units: [['hunter_brute', 'front', 1], ['hunter_rifle', 'back', 0], ['hunter_net', 'back', 2]], hazard: null, scene: 'ordmantell_junk', talk: 'hunters' },
    hunters_b: { name: 'Охотники за головами', units: [['hunter_brute', 'front', 0], ['hunter_brute', 'front', 2], ['hunter_rifle', 'back', 1]], hazard: null, scene: 'ordmantell_junk', talk: 'hunters' },
    kintan_patrol: { name: 'Патруль Х\'ариса', units: [['nikto_guard', 'front', 0], ['nikto_guard', 'front', 2], ['nikto_gunner', 'back', 1]], hazard: null, scene: 'kintan_wastes', talk: 'nikto' },
    morgukai_wastes: { name: 'Засада в песках', units: [['tsyr', 'front', 0], ['bok_young', 'front', 2]], hazard: null, scene: 'kintan_wastes', duel: 'wastes', boss: true },
    fortress_a: { name: 'Наёмники Х\'ариса', units: [['nikto_guard', 'front', 1], ['nikto_gunner', 'back', 1]], hazard: null, scene: 'kintan_fortress', talk: 'nikto', party: ['aayla'] },
    fortress_b: { name: 'Наёмники у провала', units: [['nikto_guard', 'front', 0], ['nikto_guard', 'front', 2]], hazard: 'chasm', scene: 'kintan_fortress', talk: 'nikto', party: ['aayla'] },
    axrx_boss: { name: 'Темница', units: [['axrx', 'front', 1]], hazard: null, scene: 'kintan_cell', duel: 'axrx', party: ['aayla'], boss: true },
    bok_edge: { name: 'Бок у обрыва', units: [['bok', 'front', 1]], hazard: 'chasm', scene: 'kintan_edge', duel: 'bok', party: ['aayla'], boss: true },
    arena: { name: 'Арена Джеонозиса', units: [['b2', 'front', 1], ['b1', 'back', 0], ['b1', 'back', 2]], hazard: null, scene: 'geonosis_arena', duel: 'arena', party: ['aayla'], allies: [{ id: 'kit', hero: 'kit', plus: 3 }], boss: true },
    wheel_trap: { name: 'Ловушка Тукарти', units: [['enforcer', 'front', 0], ['enforcer', 'front', 2], ['enforcer_gun', 'back', 1]], hazard: null, scene: 'wheel_maint', talk: 'wheel', party: ['aayla'] },
    wheel_guards: { name: 'Громилы Зенекса', units: [['enforcer', 'front', 1], ['enforcer_gun', 'back', 0], ['enforcer_gun', 'back', 2]], hazard: null, scene: 'wheel_maint', talk: 'wheel', party: ['aayla'] },
    wheel_pit: { name: 'Мусорная яма', units: [['dianoga', 'front', 1]], hazard: null, scene: 'wheel_pit', duel: 'dianoga', boss: true },
    zenex_bridge: { name: 'Мостик над шахтой', units: [['zenex', 'front', 1]], hazard: 'chasm', scene: 'wheel_shaft', duel: 'zenex', party: ['aayla'], boss: true },
    kamino_a: { name: 'Супердроид в коридоре', units: [['b2', 'front', 1]], hazard: null, scene: 'kamino_lab' },
    kamino_b: { name: 'Супердроиды у шлюза', units: [['b2', 'front', 0], ['b2', 'front', 2]], hazard: null, scene: 'kamino_lab' },
    kuma_platform: { name: 'Площадка Кумы Наи', units: [['b2', 'front', 0], ['b2', 'front', 2], ['b2', 'back', 1]], hazard: 'ocean', scene: 'kamino_platform', rain: true, boss: true },
    hypori: { name: 'Гривус', units: [['grievous', 'front', 1]], hazard: null, scene: 'hypori_wreck', duel: 'grievous', party: ['aayla'], allies: [{ id: 'kiadi', hero: 'kiadi', plus: 4 }, { id: 'shaak', hero: 'shaak', plus: 3 }], boss: true },
    bly_spar: { name: 'Спарринг с Блаем', units: [['bly_spar', 'front', 1]], hazard: null, scene: 'temple_hall', duel: 'spar', party: ['aayla'], boss: true },
    devaron_guards: { name: 'Стража сенатора', units: [['devaron_guard', 'front', 1], ['devaron_gun', 'back', 0], ['devaron_gun', 'back', 2]], hazard: null, scene: 'devaron_suite', talk: 'devaron', party: ['aayla'], spare: true },
    raiders_a: { name: 'Налётчики', units: [['raider', 'front', 1], ['raider_gun', 'back', 1]], hazard: null, scene: 'devaron_base', talk: 'raiders', party: ['aayla'] },
    raiders_b: { name: 'Налётчики у обрыва', units: [['raider', 'front', 0], ['raider', 'front', 2], ['raider_gun', 'back', 1]], hazard: 'chasm', scene: 'devaron_base', talk: 'raiders', party: ['aayla'] },
    aurra_duel: { name: 'Аурра Синг', units: [['aurra', 'front', 1]], hazard: null, scene: 'devaron_cave', duel: 'aurra', party: ['aayla'], boss: true, spare: true },
    raiders_final: { name: 'База налётчиков', units: [['raider', 'front', 0], ['raider', 'front', 2], ['raider_heavy', 'back', 1], ['raider_gun', 'back', 0]], hazard: null, scene: 'devaron_base', talk: 'raiders', boss: true },
    cavamina_cantina: { name: 'Кантина на Кавамине-Минор', units: [['operative', 'front', 0], ['operative', 'front', 2], ['operative_gun', 'back', 1]], hazard: null, scene: 'cavamina_cantina', duel: 'cantina5', party: ['aayla'], allies: [{ id: 'clone_1', hero: 'clone_elite' }, { id: 'clone_2', hero: 'clone_elite' }], boss: true },
    forest_sabat: { name: 'Люди Сабата', units: [['operative', 'front', 0], ['sec_droid', 'front', 2], ['operative_gun', 'back', 1]], hazard: null, scene: 'cavamina_forest', duel: 'forest', party: ['aayla'], allies: [{ id: 'shonju', hero: 'shonju', plus: 4 }], boss: true },
    duum_guards: { name: 'Охрана Дуума', units: [['duum_guard', 'front', 0], ['duum_guard', 'front', 2], ['sec_droid', 'back', 1]], hazard: null, scene: 'duum_hq', talk: 'duum', party: ['aayla'], boss: true },
    shonju_duel: { name: 'Шон-Джу', units: [['shonju_foe', 'front', 1]], hazard: null, scene: 'duum_fire', duel: 'shonju', party: ['aayla'], boss: true },
    honoghr_a: { name: 'Ногри в лесу', units: [['noghri', 'front', 0], ['noghri', 'front', 2], ['noghri_dart', 'back', 1]], hazard: null, scene: 'honoghr_forest', party: ['aayla', 'bly'], allies: [{ id: 'trooper_1', hero: 'clone_327' }] },
    honoghr_b: { name: 'Ногри у ручья', units: [['noghri', 'front', 1], ['noghri_dart', 'back', 0], ['noghri_dart', 'back', 2]], hazard: null, scene: 'honoghr_forest', party: ['aayla', 'bly'], allies: [{ id: 'trooper_1', hero: 'clone_327' }] },
    honoghr_ambush: { name: 'Засада ногри', units: [['noghri', 'front', 0], ['noghri', 'front', 1], ['noghri', 'front', 2], ['noghri_dart', 'back', 1]], hazard: null, scene: 'honoghr_forest', duel: 'squad6', party: ['aayla', 'bly'], allies: [{ id: 'trooper_1', hero: 'clone_327' }], boss: true },
    temple_horde: { name: 'Ногри в храме', units: [['noghri', 'front', 0], ['noghri', 'front', 2], ['noghri_dart', 'back', 1]], hazard: null, scene: 'honoghr_temple', duel: 'horde6', party: ['aayla', 'bly'], boss: true },
    temple_noghri: { name: 'Стража храма', units: [['noghri', 'front', 0], ['noghri', 'front', 2], ['noghri_dart', 'back', 1]], hazard: null, scene: 'honoghr_temple' },
    temple_droids: { name: 'Стражи ракатанского храма', units: [['rakatan_droid', 'front', 0], ['rakatan_droid', 'front', 2]], hazard: null, scene: 'honoghr_temple' },
    vos_honoghr: { name: 'Вос', units: [['vos_honoghr', 'front', 1]], hazard: null, scene: 'honoghr_ship', duel: 'endure6', party: ['aayla', 'bly'], boss: true },
    seii_students: { name: 'Ученики Акку Сеи', units: [['anzat_student', 'front', 0], ['anzat_student', 'front', 2], ['anzat_student', 'back', 1]], hazard: null, scene: 'anzat_school', hero: { id: 'tholme', level: 44, skills: ['blade', 'shadow', 'push', 'guard', 'talk'] }, spare: true, gentle: true, talk: 'students' },
    bok_clone: { name: 'Моргукай у шаттла', units: [['bok_clone', 'front', 1]], hazard: null, scene: 'anzat_dock', party: ['aayla'], boss: true },
    camp_clones: { name: 'Ночная атака на лагерь', units: [['morgukai_clone', 'front', 0], ['morgukai_clone', 'front', 2], ['anzat_assassin', 'back', 0], ['anzat_assassin', 'back', 2]], hazard: null, scene: 'saleucami_camp', duel: 'camp6', party: ['aayla', 'bly', 'vos'], boss: true },
    cavern_a: { name: 'Клоны-моргукаи', units: [['morgukai_clone', 'front', 0], ['morgukai_clone', 'front', 2]], hazard: 'lava', scene: 'saleucami_caverns' },
    cavern_b: { name: 'Клон и анзат-убийца', units: [['morgukai_clone', 'front', 1], ['anzat_assassin', 'back', 1]], hazard: null, scene: 'saleucami_caverns' },
    bok_gate: { name: 'Бок', units: [['bok_final', 'front', 1]], hazard: 'gate', scene: 'saleucami_gate', duel: 'bokgate', party: ['aayla'], boss: true },
    bly_spar7: { name: 'Спарринг на «Интрепиде»', units: [['bly_spar7', 'front', 1]], hazard: null, scene: 'intrepid_gym', duel: 'spar', party: ['aayla'], boss: true },
    acklay_a: { name: 'Акклей', units: [['acklay', 'front', 1]], hazard: null, scene: 'felucia_jungle', party: ['aayla', 'bly'], allies: [{ id: 'trooper_501', hero: 'clone501' }] },
    acklay_b: { name: 'Акклеи', units: [['acklay', 'front', 0], ['acklay', 'front', 2]], hazard: null, scene: 'felucia_jungle', party: ['aayla', 'bly'], allies: [{ id: 'trooper_501', hero: 'clone501' }] },
    hill_droids: { name: 'Дроиды на холме', units: [['b2_late', 'front', 0], ['b2_late', 'front', 2], ['b1_late', 'back', 1]], hazard: null, scene: 'felucia_jungle', party: ['aayla', 'bly'], allies: [{ id: 'trooper_501', hero: 'clone501' }], boss: true },
    turrets_a: { name: 'Турели у грибного дерева', units: [['av_turret', 'back', 0], ['av_turret', 'back', 1], ['av_turret', 'back', 2]], hazard: null, scene: 'felucia_jungle', party: ['aayla', 'bly'], allies: [{ id: 'trooper_501', hero: 'clone501' }] },
    turrets_b: { name: 'Турели за грибным деревом', units: [['av_turret', 'back', 0], ['av_turret', 'back', 1], ['av_turret', 'back', 2]], hazard: null, scene: 'felucia_jungle', party: ['aayla', 'bly'], allies: [{ id: 'trooper_501', hero: 'clone501' }] },
    nigkoe_a: { name: 'Коммандос-госсамы', units: [['gossam', 'front', 0], ['gossam', 'front', 2], ['gossam_gun', 'back', 1]], hazard: null, scene: 'felucia_nigkoe', talk: 'gossam', party: ['aayla', 'bly', 'ekria'] },
    nigkoe_b: { name: 'Охрана тюрьмы', units: [['b2_late', 'front', 1], ['b1_late', 'back', 0], ['b1_late', 'back', 2]], hazard: null, scene: 'felucia_nigkoe', party: ['aayla', 'bly', 'ekria'] },
    kwayteow_guards: { name: 'Охрана базы Шу Май', units: [['b2_late', 'front', 1], ['b1_late', 'back', 0], ['b1_late', 'back', 2]], hazard: null, scene: 'felucia_kwayteow', party: ['aayla'], allies: [{ id: 'barriss', hero: 'barriss', plus: 0 }, { id: 'zonder', hero: 'zonder', plus: -6 }], boss: true },
    endor_beast: { name: 'Зверь в Пасти Горы', units: [['endor_beast', 'front', 1]], hazard: null, scene: 'endor_cave', duel: 'beast', party: ['aayla'], boss: true },
    niango_wave: { name: 'Дроиды у Ниянго', units: [['b2_late', 'front', 0], ['deka_late', 'front', 2], ['b1_late', 'back', 1]], hazard: null, scene: 'felucia_niango', duel: 'niango', party: ['aayla', 'bly'], allies: [{ id: 'trooper_1', hero: 'clone_327' }], boss: true },
    vos_dark: { name: 'Тьма Воса', units: [['shade_tinte', 'front', 0], ['shade_karkko', 'front', 2], ['dark_vos', 'back', 1]], hazard: null, scene: 'vos_mind', duel: 'shadows', party: ['aayla'], allies: [{ id: 'tholme', hero: 'tholme', plus: 4 }], boss: true }
  };

  A.HAZARDS = { chasm: 'пропасть', lava: 'лава', gate: 'лазерные ворота', turbine: 'турбина', ocean: 'океан', poison: 'отравленная вода', brace: 'крепь шахты' };

  A.TALK = {
    table: {
      coward: { persuade: 'surrender', mind: 'flee', charm: 'info', threat: 'flee' },
      merc: { persuade: 'info', mind: 'flee', charm: 'surrender', threat: 'rage' },
      fanatic: { persuade: 'rage', mind: 'rage', charm: 'rage', threat: 'rage' },
      proud: { persuade: 'surrender', mind: 'rage', charm: 'rage', threat: 'rage' },
      dutiful: { persuade: 'surrender', mind: 'flee', charm: 'rage', threat: 'rage' }
    },
    approaches: { persuade: 'Убедить', mind: 'Внушить', charm: 'Обаять', threat: 'Пригрозить' },
    greet: {
      coward: 'Не подходи! Я… я стреляю!',
      merc: 'Мне платят не за разговоры, джедайка.',
      fanatic: 'Говорить с джедаями? Никогда.',
      proud: 'Кто ты такая, чтобы мне указывать?',
      dutiful: 'Приказ есть приказ.'
    },
    reply: {
      surrender: 'Ладно, ладно! Только убери светомеч.',
      flee: 'Да ну вас всех!',
      info: 'Склад за пропастью, за дверью с тремя чертами. Я вам ничего не говорил.',
      rage: 'Ах так?!',
      pause: 'Противник медлит, но оружия не опускает.'
    },
    say: {
      persuade: 'Мы знаем про глиттерилл. Сдайся, пока это просто контрабанда.',
      mind: 'Тебе не нужно с нами драться.',
      charm: 'Неужели такой славный парень будет стрелять в девушку?',
      threat: 'Ещё шаг, и пожалеешь.'
    }
  };
  A.ARGUMENTS = ['clue_lessu_market_d', 'clue_ryll_tunnels_u'];
  A.TALK_SETS = {
    devaron: {
      args: ['intel_route', 'intel_hunter'],
      greet: { dutiful: 'Гостья сенатора с клинком? Стоять!' },
      say: {
        persuade: 'Ваша хозяйка наняла убийцу сенатора Элсы. Вы за неё умирать собрались?',
        mind: 'Ты не видел здесь никакой наследницы.',
        charm: 'Неужели ты поднимешь пику на гостью?',
        threat: 'Отойди. Я не за тобой пришла.'
      },
      reply: {
        surrender: 'Я ничего не видел. Идите.',
        flee: 'Мне за это не платят!',
        info: 'Сенатор каждую ночь говорит с кем-то в Синих горах. Больше я не знаю.',
        rage: 'Взять её!'
      }
    },
    raiders: {
      args: ['intel_mountains', 'intel_route'],
      greet: { merc: 'Джедайка в Синих горах? Хорошая награда сама пришла.', coward: 'Джедай! Здесь джедай!' },
      say: {
        persuade: 'Сенатор вас продаст, как только Республика спросит. Уходите, пока можно.',
        mind: 'Тебе не нужна эта драка.',
        charm: 'Опусти бластер. Мы оба знаем, что тебе платят мало.',
        threat: 'Посчитай, сколько вас осталось.'
      },
      reply: {
        surrender: 'Всё, всё, я сдаюсь.',
        flee: 'Пусть сенатор сама воюет!',
        info: 'Пленных джедаев держат в пещере за водопадом. Охотница сама их завалила.',
        rage: 'Награду за джедая я не упущу!'
      }
    },
    duum: {
      args: [],
      greet: { dutiful: 'Тревога! Джедайка на станции!' },
      say: {
        persuade: 'Дуум бросит вас, как бросил Сабата.',
        mind: 'Тебе здесь не за что умирать.',
        charm: 'Опусти оружие. Я не за тобой пришла.',
        threat: 'Станция горит. Уходи, пока можешь.'
      },
      reply: {
        surrender: 'Ладно, ладно! Я ухожу.',
        flee: 'Пусть Дуум сам разбирается!',
        info: 'Пульт Дуума в верхнем отсеке. Я ничего не говорил.',
        rage: 'За Дуума!'
      }
    },
    wheel: {
      args: ['intel_korto', 'intel_guide'],
      greet: { merc: 'Тукарти платит, чтобы мы узнали правду. Сейчас узнаем.', coward: 'Это она! Механичка!' },
      say: {
        persuade: 'Корто Вос мне должен. Дайте забрать долг, и разойдёмся.',
        mind: 'Вам не платят за драку с механиками.',
        charm: 'Брось нож. У тебя руки для гаечного ключа.',
        threat: 'Ещё шаг, и я разберу тебя, как старый привод.'
      },
      reply: {
        surrender: 'Ладно, ладно. Мы просто проверяли.',
        flee: 'За такие деньги я не дерусь!',
        info: 'Зенекс ищет воровку, Халин. Говорят, она стащила у него что-то важное.',
        rage: 'Сейчас посмотрим, кто кого разберёт!'
      }
    },
    fenn: {
      args: ['intel_screen', 'intel_study'],
      greet: { dutiful: 'Рабыня с клинком? Держите её!' },
      say: {
        persuade: 'Ваш хозяин нанял никто украсть сына Секуры. Хотите отвечать за это вместе с ним?',
        mind: 'Ты не видел здесь никакой рабыни.',
        charm: 'Не узнаёшь? Я каждый вечер наливаю тебе вино.',
        threat: 'Отойди. Подносы я ношу не потому, что больше ничего не умею.'
      },
      reply: {
        surrender: 'Я ничего не видел. Иди.',
        flee: 'Это не моё дело, не моё!',
        info: 'Кабинет хозяина не заперт до полуночи. Больше я ничего не знаю.',
        rage: 'Взять её!'
      }
    },
    hunters: {
      args: [],
      greet: { merc: 'За киффара дают хорошие деньги. За тебя накинут.', coward: 'Ещё одна джедайка? Мне за двоих не платили!' },
      say: {
        persuade: 'Заказчик вам не заплатит, если от вас ничего не останется.',
        mind: 'Награда того не стоит. Уходи.',
        charm: 'Брось винтовку. Мне неудобно разговаривать, когда в меня целятся.',
        threat: 'Вас было больше. Посчитай, сколько осталось.'
      },
      reply: {
        surrender: 'Всё, всё. Я передумал.',
        flee: 'Пусть сами за ним бегают!',
        info: 'Деваронец на «Инферно» стоит у южных ворот. Я вам этого не говорил.',
        rage: 'Двойная плата за двух джедаев!'
      }
    },
    nikto: {
      args: [],
      greet: { merc: 'Х\'арис платит за каждого джедая. Живого или нет.' },
      say: {
        persuade: 'Твой хозяин сбежит первым. Плату ты не получишь.',
        mind: 'Ты нас не видел. Иди на свой пост.',
        charm: 'Неужели ты станешь драться с гостьей?',
        threat: 'Моргукаи вас не спасут. Они сами по себе.'
      },
      reply: {
        surrender: 'Плата не стоит головы.',
        flee: 'Пусть Х\'арис сам дерётся!',
        info: 'Темница внизу, за двумя дверями. Ключ у дроида.',
        rage: 'За головы джедаев платят вдвое!'
      }
    },
    kiffu: {
      args: ['clue_kiffex_post_c'],
      greet: { dutiful: 'Именем Шейф, стой! Ещё шаг, и стреляю.' },
      say: {
        persuade: 'Пульт связи сгорел. С Киффу никто не придёт.',
        mind: 'Ты устал. Ты хочешь домой.',
        charm: 'Неужели ты выстрелишь в девушку?',
        threat: 'Мои анзати голодны. Бросай оружие.'
      },
      reply: {
        surrender: 'Ладно. Только не отдавай меня им.',
        flee: 'Нет-нет-нет...',
        info: 'Оружейная за южной дверью. Я ничего не говорил.',
        rage: 'За Киффу!'
      }
    },
    cantina: {
      args: [],
      greet: { coward: 'Это анзати! Бегите все!', merc: 'Плевать, кто ты. Это мой стол.' },
      say: {
        persuade: 'Уходите, и никто вас не тронет.',
        mind: 'Тебе здесь не место. Иди.',
        charm: 'Отойди, красавчик. Мне нужен не ты.',
        threat: 'Беги, пока они не проголодались.'
      },
      reply: {
        surrender: 'Всё, всё, я сижу тихо!',
        flee: 'Пропустите! Пропустите!',
        info: 'Джедаи? У задней стены. Повар с ними.',
        rage: 'Ах ты синяя...'
      }
    },
    gossam: {
      args: ['nigkoe_codes'],
      greet: { dutiful: 'Именем Торговой гильдии, стоять!' },
      say: {
        persuade: 'Шу Май улетела и бросила вас здесь. Её счета Экрия уже видела.',
        mind: 'Тебе приказали сторожить пленников, а не умирать за них.',
        charm: 'Гильдия платит вам меньше, чем стоит ваша броня.',
        threat: 'Республика уже в воротах. Брось оружие.'
      },
      reply: {
        surrender: 'Гильдия меня не похвалит. Но и не похоронит.',
        flee: 'Пусть Шу Май сама сторожит своих джедаев!',
        info: 'Пленники в нижнем блоке. Ключи у дроида на посту.',
        rage: 'За Гильдию!',
        pause: 'Госсам медлит, но оружия не опускает.'
      }
    },
    students: {
      args: ['seii_code'],
      greet: { dutiful: 'Учитель велел проверить тебя, джедай.' },
      say: {
        persuade: 'Учитель хочет знать, чему вы научились. Мёртвыми вы ему этого не покажете.',
        mind: 'Урок окончен. Ты показал всё, что умеешь.',
        charm: 'Хороший удар. Акку Сеи по-прежнему учит хорошо.',
        threat: 'Я учился у него, когда вас ещё не было на свете.'
      },
      reply: {
        surrender: 'Учитель, я уступаю.',
        flee: 'Ученик отходит к стене и садится, как велит обычай.',
        info: 'Учителей почти не осталось. Нас учит он один.',
        rage: 'Учитель смотрит. Я не отступлю!',
        pause: 'Ученик медлит, но рук не опускает.'
      }
    },
    guards: {
      args: ['clue_pol_estate_f', 'heard_holo'],
      greet: { dutiful: 'Стой, танцовщица! Хозяин мёртв, и ты пойдёшь с нами.' },
      say: {
        persuade: 'Ваш хозяин каждое утро поил меня из своей фляги. Хотите отвечать за это вместе с ним?',
        mind: 'Ты меня здесь не видел.',
        charm: 'Ты же каждый вечер смотрел, как я танцую. Неужели отдашь меня им?',
        threat: 'Уйди с дороги. Ты видел, что было на балконе.'
      },
      reply: {
        surrender: 'Иди. Я тебя не видел.',
        flee: 'Не подходи ко мне!',
        info: 'Ворота в сады не заперты. Только меня не впутывай.',
        rage: 'Хватит болтать. Взять её!'
      }
    }
  };

  A.ITEMS = {
    bacta: { name: 'Бакта-пластырь', about: '+30 % здоровья одному герою', heal: 0.3 },
    stim: { name: 'Стимулятор', about: '+2 Темпа Эйле', tempo: 2 },
    antidote: { name: 'Противоядие', about: 'снимает яд', cure: 'poison' },
    flash: { name: 'Вспышка', about: 'все враги слепнут на два хода: выстрелы вдвое слабее', blind: 2 }
  };

  A.SHOP = { name: 'Контрабанда Вилли', items: [['bacta', 30], ['stim', 45], ['antidote', 25], ['flash', 40]] };
  A.BET = { stake: 40, fast: 4, clean: 0.5, pays: 3 };

  A.COVERS = {
    servant: {
      name: 'Служанка Ро Фенна', chapter: 'ch3', look: 'aayla_servant', outfit: 'servant', map: 'fenn_house', exposed: 'ch3_exposed',
      alias: 'Риэла',
      legend: 'Рабыня-служанка, купленная на рынке Кала\'уна. Говорит мало, работает много.',
      allowed: ['подавать на пирах, мыть, убирать', 'ходить по людской, кухне и пиршественному залу', 'слушать: при слугах говорят свободно'],
      gives: ['Сила на глазах у других', 'кабинет хозяина и покои семьи', 'ложь тому, кто читает лекку', 'слова не по роли'],
      intel: [['intel_screen', 'Кто нанят: разговор у ширмы'], ['intel_study', 'Что задумано: бумаги в кабинете'], ['intel_maid', 'Когда: что знают слуги']],
      decay: 0.4, seen: 25, force: 30, duty: 12
    },
    jayzaa: {
      name: 'Механик Джейзаа', chapter: 'ch4', look: 'aayla_jayzaa', outfit: 'jayzaa', map: 'wheel_levels', exposed: 'ch4_exposed',
      alias: 'Джейзаа',
      legend: 'Механик без гроша. Прилетела на «Колесо» за долгом: наёмник Корто Вос задолжал ей за ремонт.',
      allowed: ['чинить всё, что сломано, и брать за это плату', 'грубить и торговаться', 'ходить по барам и техническим уровням'],
      gives: ['Сила на чужих глазах', 'задние комнаты казино Зенекса', 'вежливость и наставления: так говорят джедаи', 'работа без платы'],
      intel: [['intel_korto', 'Где видели Корто Воса: бармен «Ржавой втулки»'], ['intel_guide', 'Кто к нему водит: информатор Тукарти'], ['fixed_lift', 'Как спуститься: лифт на нижние уровни']],
      decay: 0.4, seen: 25, force: 30, duty: 12,
      why: { seen: 'механику нечего делать у Зенекса', duty: 'работа по роли и плата' }
    },
    tuulaa: {
      name: 'Наследница Туулаа Донита', chapter: 'ch5', look: 'aayla_tuulaa', outfit: 'tuulaa', map: 'devaron_suite', exposed: 'ch5_exposed',
      alias: 'Туулаа Донита',
      legend: 'Избалованная дочь твилекского судовладельца. Гостит у сенатора Вьен\'сай\'Маллок, тратит отцовские деньги и помыкает слугами.',
      allowed: ['тратить деньги в галерее', 'капризничать и приказывать слугам', 'бывать в залах сенатора и на террасе'],
      gives: ['Сила на чужих глазах', 'кабинет сенатора', 'наследница, которая не тратит денег', 'вежливость со слугами при гостях'],
      intel: [['intel_route', 'Кто сливает маршруты: что подслушала Саба'], ['intel_mountains', 'Где база: что принёс из города Майлз'], ['intel_hunter', 'Кто убил Элсу: охотница в доме сенатора']],
      decay: 0.1, seen: 25, force: 30, duty: 12, stingy: { every: 45, add: 10 },
      why: { seen: 'гостье нечего делать в кабинете сенатора', duty: 'наследница капризничает', stingy: 'гости шепчутся: наследница не тратит ни кредита' }
    }
  };

  A.REPAIRS = {
    cooler: { name: 'Охладитель бара', w: 4, h: 3, from: 1, to: 1, solved: ['T0 L1 I1 L2', 'I1 L3 T2 L0', 'L2 I0 T1 L1'], shift: ['0 2 1 3', '1 2 0 1', '3 1 2 0'] },
    fan: { name: 'Вентилятор мастерской', w: 4, h: 3, from: 2, to: 0, solved: ['L1 I1 T3 I1', 'I0 T0 L2 I0', 'L3 I1 T2 L1'], shift: ['2 1 1 3', '1 0 2 1', '3 2 0 2'] },
    lift: { name: 'Щиток лифта', w: 5, h: 3, from: 0, to: 2, solved: ['I1 L2 T3 I0 L3', 'L0 I0 T1 L1 L2', 'T2 L0 I1 L3 L0'], shift: ['1 3 0 2 1', '2 1 3 2 3', '0 2 1 1 2'] }
  };

  A.FLIGHT = {
    w: 320, h: 240, help: 1.5, closing: 2,
    ship: { r: 3, top: 22, bottom: 196, side: 10, inv: 0.8, dash: 0.2, dashSpeed: 2.8, dashInv: 0.34, dashCool: 0.9, ion: 1.5, ionSlow: 0.55 },
    shot: { speed: 340, dmg: 1, gap: 4 },
    foes: {
      vulture: { name: 'Истребитель дроидов', hp: 2, r: 6, crash: 12, fire: 'aim', cadence: 2.4, bolt: 'bolt', fighter: true },
      tri: { name: 'Три-истребитель', hp: 6, r: 7, crash: 16, fire: 'burst', cadence: 2.8, bolt: 'bolt', fighter: true },
      bok: { name: 'Истребитель Бока', hp: 150, r: 10, crash: 18, fire: 'spread', cadence: 1.4, bolt: 'heavy', boss: true },
      cannon: { name: 'Ионная пушка', hp: 24, r: 9, fire: 'ion', cadence: 3.4, bolt: 'ion', ground: true },
      spire: { name: 'Скала', r: 10, crash: 15, solid: true },
      geyser: { name: 'Выброс лавы', r: 13, crash: 14, warn: 1.2, burst: 0.8 },
      wing: { name: 'Синий лидер', r: 6, decor: true },
      ally: { name: 'Ведомый', r: 6, decor: true }
    },
    bolts: {
      bolt: { speed: 105, r: 2, dmg: 8 },
      heavy: { speed: 125, r: 3, dmg: 10 },
      ion: { speed: 70, r: 5, dmg: 12, ion: true }
    }
  };

  A.FLIGHTS = {
    kintan: {
      name: 'Над Кинтаном', chapter: 'ch3', ship: 'inferno', shipName: '«Инферно»', look: 'kintan',
      shields: 100, speed: 105, cadence: 0.17, scroll: 55,
      goal: { type: 'boss', text: 'Сбить истребитель Бока' },
      voices: {},
      boss: {
        y: 44,
        passes: [
          { until: 0.7, time: 26, spread: 3, cadence: 1.5, out: ['vos', 'Уходит на разворот. Сейчас вернётся.'] },
          { until: 0.4, time: 26, spread: 3, cadence: 1.4, dive: 5.5, out: ['villie', 'Отстал. Ненадолго.'] },
          { until: 0, spread: 5, cadence: 1.25, dive: 4.2 }
        ],
        dive: ['villie', 'Он пикирует! В сторону!'],
        down: ['vos', 'Есть! Он уходит в пески.']
      },
      timeline: [
        [0.5, 'radio', 'villie', 'Он висит у нас на хвосте. Штурвал твой, только не разбей мне корабль!'],
        [2, 'spires', 7, 13],
        [6, 'radio', 'vos', 'Скалы торчат из песка, как зубы. Обходи их.'],
        [16, 'radio', 'villie', 'Вот он! Истребитель Бока!'],
        [18, 'boss', 1],
        [28, 'spires', 4, 16],
        [46, 'radio', 'villie', 'Видишь, где земля светится? Там сейчас рванёт лава.'],
        [48, 'geysers', 12, 24],
        [56, 'spires', 5, 16],
        [73, 'radio', 'vos', 'Бок снова сзади.'],
        [75, 'boss', 2],
        [104, 'radio', 'vos', 'Ниже, к дюнам. Пусть идёт за нами.'],
        [106, 'spires', 14, 20],
        [110, 'geysers', 6, 14],
        [126, 'radio', 'villie', 'Он опять здесь. Ну всё, или он, или мы.'],
        [128, 'boss', 3],
        [136, 'spires', 6, 30],
        [140, 'geysers', 6, 30]
      ]
    },
    kamino: {
      name: 'Над Камино', chapter: 'ch4', ship: 'delta7', shipName: '«Дельта-7», позывной Красная-2', look: 'kamino',
      shields: 80, speed: 125, cadence: 0.15, scroll: 26, foeSpeed: 52,
      goal: { type: 'hold', leak: 24, text: 'Не пустить истребители дроидов к Типоке' },
      voices: { choi: { name: 'Цуи Чой, Красный лидер', plate: '#a83a2a' } },
      leak: ['choi', 'Один прорвался к городу! Держите их выше!'],
      assist: { every: 3.5, after: 51, then: 5.5 },
      timeline: [
        [0.5, 'radio', 'choi', 'Красная эскадрилья, истребители наши. Транспорты оставьте Синим.'],
        [3, 'wave', 'vulture', 'line', 5],
        [4, 'radio', 'aayla', 'Красная-2 на месте. Вижу их.'],
        [9, 'wave', 'vulture', 'vee', 5],
        [15, 'wave', 'vulture', 'column', 5, { x: 90 }],
        [21, 'radio', 'obiwan', 'Синие, за мной, на транспорты.'],
        [23, 'wave', 'vulture', 'sweep', 6, { side: 'left', y: 40 }],
        [30, 'wave', 'vulture', 'dive', 5],
        [37, 'wave', 'vulture', 'vee', 7],
        [44, 'wave', 'vulture', 'sweep', 6, { side: 'right', y: 56 }],
        [51, 'radio', 'choi', 'Коссекс сбит!'],
        [52, 'wave', 'vulture', 'line', 6],
        [55, 'wave', 'vulture', 'dive', 3],
        [62, 'wave', 'vulture', 'vee', 7, { speed: 60 }],
        [70, 'wave', 'vulture', 'column', 6, { x: 230, speed: 66 }],
        [79, 'radio', 'choi', 'Синий лидер подбит. Скайуокер идёт за ним вниз.'],
        [81, 'wave', 'vulture', 'dive', 6],
        [89, 'wave', 'vulture', 'sweep', 6, { side: 'left', y: 36 }],
        [92, 'wave', 'vulture', 'sweep', 6, { side: 'right', y: 70 }],
        [100, 'wave', 'vulture', 'vee', 7, { speed: 58 }],
        [109, 'wave', 'vulture', 'line', 7, { speed: 62 }],
        [117, 'wave', 'vulture', 'dive', 8, { gap: 0.55 }],
        [126, 'radio', 'choi', 'Флот Рансисиса вышел из гиперпространства. Держитесь!'],
        [128, 'wave', 'vulture', 'vee', 7, { speed: 62 }],
        [134, 'wave', 'vulture', 'column', 6, { x: 160, speed: 70, wob: 60 }],
        [141, 'wave', 'vulture', 'line', 8, { speed: 60 }],
        [150, 'radio', 'choi', 'Они уходят. Красная эскадрилья, хорошая работа.'],
        [150, 'retreat'],
        [151, 'end']
      ]
    },
    saleucami: {
      name: 'Над Салеуками', chapter: 'ch6', ship: 'eta2', shipName: '«Эта-2», Синяя эскадрилья', look: 'saleucami',
      shields: 90, speed: 130, cadence: 0.14, scroll: 45,
      goal: { type: 'cannons', text: 'Разбить ионные пушки' },
      voices: { hett: { name: 'А\'Шарад Хетт, Красный лидер', plate: '#8a5a3a' } },
      base: {
        y: 36, h: 110, dome: { dy: 22, rx: 176, ry: 66 },
        cannons: [[44, 18], [92, 30], [136, 38], [184, 38], [228, 30], [276, 18]],
        down: ['hett', 'Щит упал. Синие, на пушки!'],
        done: ['hett', 'Пушки молчат. Наземным войскам путь открыт.']
      },
      timeline: [
        [0.5, 'radio', 'xiaan', 'Синяя эскадрилья, за мной. Пока стоит щит, пушки нам не достать.'],
        [3, 'orbs', 6, 10],
        [6, 'wave', 'vulture', 'vee', 5],
        [11, 'radio', 'hett', 'Красные справа. Дроиды поднимаются из кальдеры.'],
        [12, 'wave', 'tri', 'hover', 2, { stay: 9 }],
        [22, 'wave', 'vulture', 'sweep', 6, { side: 'right', y: 44 }],
        [27, 'orbs', 8, 12],
        [31, 'wave', 'tri', 'hover', 3, { stay: 10 }],
        [43, 'wave', 'vulture', 'dive', 6],
        [50, 'wave', 'vulture', 'sweep', 6, { side: 'left', y: 60 }],
        [55, 'radio', 'hett', 'Вижу цитадель. Пушки стоят по краю кальдеры.'],
        [57, 'base'],
        [65, 'radio', 'xiaan', 'Щит держит. Уходите от ионных зарядов!'],
        [67, 'wave', 'tri', 'hover', 2, { stay: 10, y: 120 }],
        [77, 'wave', 'vulture', 'line', 6],
        [84, 'wave', 'vulture', 'sweep', 6, { side: 'left', y: 130 }],
        [90, 'wave', 'tri', 'hover', 2, { stay: 9, y: 126 }],
        [99, 'wave', 'vulture', 'dive', 5],
        [104, 'radio', 'xiaan', 'Меня зацепило. Двигатель горит.'],
        [107, 'radio', 'hett', 'Сиань, выходи из боя!'],
        [110, 'radio', 'xiaan', 'Прощай, А\'Шарад. Сделай мою смерть победой.'],
        [111, 'kamikaze'],
        [118, 'radio', 'aayla', 'Сиань...'],
        [120, 'wave', 'tri', 'hover', 2, { stay: 12, y: 120 }],
        [132, 'wave', 'vulture', 'dive', 6],
        [142, 'wave', 'tri', 'hover', 3, { stay: 12, y: 124 }],
        [156, 'wave', 'vulture', 'vee', 7],
        [168, 'wave', 'tri', 'hover', 3, { stay: 14, y: 124 }],
        [184, 'wave', 'vulture', 'dive', 8],
        [198, 'wave', 'tri', 'hover', 3, { stay: 16, y: 124 }],
        [216, 'wave', 'vulture', 'vee', 7]
      ]
    },
    felucia: {
      name: 'Погоня у Квай-Теоу', chapter: 'ch7', ship: 'barc', shipName: 'Спидербайк BARC', look: 'felucia', ally: 'arc170',
      shields: 90, speed: 135, cadence: 0.16, scroll: 70,
      goal: { type: 'survive', text: 'Прорваться к реке у базы Шу Май' },
      voices: { arc: { name: 'Пилот ARC-170', plate: '#a83a2a' } },
      assist: { every: 40, after: 40, then: 2.6 },
      timeline: [
        [0.5, 'radio', 'bly', 'Байки к бою. Держитесь за мной, генерал.'],
        [2, 'spires', 8, 14],
        [5, 'wave', 'vulture', 'line', 4],
        [11, 'radio', 'barriss', 'Истребители дроидов над деревьями!'],
        [12, 'wave', 'vulture', 'vee', 5],
        [18, 'spires', 10, 12],
        [22, 'wave', 'vulture', 'sweep', 5, { side: 'left', y: 50 }],
        [30, 'wave', 'vulture', 'dive', 5],
        [36, 'spires', 12, 14],
        [38, 'radio', 'arc', 'ARC-170 на подходе. Генерал, истребители наши.'],
        [42, 'wave', 'vulture', 'vee', 6],
        [50, 'wave', 'vulture', 'sweep', 6, { side: 'right', y: 60 }],
        [56, 'spires', 12, 12],
        [60, 'wave', 'vulture', 'dive', 6],
        [66, 'radio', 'arc', 'Ещё двое сбиты. Держитесь ближе к реке, генерал.'],
        [70, 'wave', 'vulture', 'line', 6],
        [76, 'spires', 14, 14],
        [80, 'wave', 'vulture', 'column', 6, { x: 100 }],
        [88, 'wave', 'vulture', 'sweep', 6, { side: 'left', y: 44 }],
        [94, 'spires', 12, 12],
        [96, 'wave', 'vulture', 'dive', 7],
        [104, 'radio', 'aayla', 'У реки прыгаем с байков! Все в воду!'],
        [106, 'spires', 10, 10],
        [110, 'wave', 'vulture', 'vee', 6],
        [118, 'radio', 'bly', 'Вода прямо по курсу, генерал!'],
        [122, 'retreat'],
        [123, 'end']
      ]
    }
  };

  A.CREDITS = {
    studio: ['Midnight Studio', 'LucasArts (2001)', 'Win 98 Edition'],
    chapters: [['pro', 'glitteryll'], ['ch1', 'balcony'], ['ch2', 'sanctum'], ['int', 'blue_blade'], ['ch3', 'knighting'], ['ch4', 'hypori'], ['ch5', 'found'], ['ch6', 'hand_dark'], ['ch7', 'bird']],
    endings: { felucia: 'end_felucia', other: 'end_other', dark: 'end_dark' },
    sources: [
      ['«Twilight», «Darkness», «Rite of Passage», «Heart of Fire», Republic 49–50, 68, 72–77, «Jedi: Aayla Secura»', 'John Ostrander, Jan Duursema'],
      ['«Tides of Terror», Star Wars Tales 14', 'David Land (Milton Freewater Jr.), Adriana Melo'],
      ['«The Clone Wars: Deadly Hands of Shon-Ju»', 'Jeremy Barlow, Brian Koschak'],
      ['«Reversal of Fortune»', 'Paul Ens, Tom Hodges'],
      ['Clone Wars Adventures 5, «What Goes Up...»', 'Fillbach Brothers'],
      ['Эпизоды II и III, Star Wars: Battlefront II, Clone Wars (2003)', 'Lucasfilm, LucasArts']
    ],
    thanks: 'Факты сверены по статьям Вукипедии о героях, местах и сражениях.'
  };

  A.RECOVER = { hpPerFp: 7 };
  A.BLUE_BLADE = '#4a8aff';
  A.GREEN_BLADE = '#3ad04a';
  A.RETRY_FLOOR = 0.5;

  const R = (from, more) => Object.assign({ from }, more);
  const TH = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  A.BONDS = {
    tholme: { name: 'Толм', who: 'tholme', outfit: 'robe', ranks: [
      R('plot', { when: 'интерлюдия', before: 'p1', reward: 'Тень в поле: когда Эйла крадётся, враги замечают её вдвое ближе' }),
      R('respite', { at: TH, reward: 'Плащ Силы: звери не замечают Эйлу, пока она крадётся' }),
      R('respite', { at: TH, reward: 'Скрыть присутствие: Сила врагов её не чует' }),
      R('respite', { at: TH, reward: 'Удар из засады вдвое сильнее' }),
      R('plot', { when: 'глава 6, Салеуками', before: 'p9', reward: 'Медитация вдвоём: раз за главу вернуть отряду всю Силу' })
    ] },
    traa: { name: 'Т\'ра Саа', who: 'traa', outfit: 'robe', ranks: [
      R('plot', { when: 'глава 2, Киффу', before: 'p1', reward: 'Терпение: Покой держится на ход дольше' }),
      R('respite', { at: ['p5'], reward: 'Корни Т\'ра Саа в отряде держат дольше' }),
      R('plot', { when: 'глава 5, Деварон', before: 'p6', reward: 'Исцеление у Эйлы' })
    ] },
    vos: { name: 'Квинлан Вос', who: 'vos', outfit: 'early', letgo: 3, ranks: [
      R('plot', { when: 'глава 3, Орд-Мантелл', before: 'p2', reward: 'Прочтение у Эйлы' }),
      R('respite', { at: ['p2', 'p3'], reward: null }),
      R('plot', { when: 'глава 4, «Колесо»', before: 'p4', reward: '«Вдвоём»: совместный удар, если Вос в отряде' }),
      R('respite', { at: ['p7', 'p8'], via: 'tholme', viaName: 'шифровки', reward: null }),
      R('plot', { when: 'глава 6, Салеуками', before: 'p9', reward: 'Отпущенная связь: Сумеречный танец и Темп 2 в начале каждого боя' })
    ] },
    kit: { name: 'Кит Фисто', who: 'kit', outfit: 'robe', ranks: [
      R('plot', { when: 'глава 4, Камино', before: 'p4', reward: 'Дыхание под водой' }),
      R('respite', { at: ['p4', 'p5'], reward: null }),
      R('respite', { at: ['p4', 'p5'], reward: 'Двойной вихрь' }),
      R('plot', { when: 'глава 5, после Деварона', before: 'p6', reward: 'Выбор: отпустить или удержать' }),
      R('respite', { at: ['p6', 'p8'], reward: 'Отпущенная связь: каждый третий ход +1 Темп' })
    ] },
    bly: { name: 'Коммандер Блай', who: 'bly', outfit: 'bare', ranks: [
      R('plot', { when: 'глава 4, назначение', before: 'p5', reward: 'Огонь на подавление' }),
      R('respite', { at: ['p5', 'p6'], reward: 'Рукопашная +20 %' }),
      R('plot', { when: 'глава 6, Хоногр', before: 'p8', reward: 'Прикрыть генерала' }),
      R('respite', { at: ['p8'], reward: null }),
      R('respite', { at: ['p9', 'p10'], reward: 'Отделение 327-го: залп по всем врагам' })
    ] },
    villie: { name: 'Вилли', who: 'villie', outfit: 'spacer', ranks: [
      R('plot', { when: 'глава 3, Кинтан', before: 'p2', reward: 'Ставка у Эйлы в бою, если Вилли нет рядом' }),
      R('respite', { at: ['p2'], reward: 'Лавка контрабанды' }),
      R('respite', { at: ['p3'], reward: 'Счастливая фишка: раз за главу отменить поражение' })
    ] },
    secura: { name: 'Клан Секура', who: 'lon', outfit: 'robe', ranks: [
      R('plot', { when: 'конец главы 3', before: 'p2', reward: 'Танец лекку: медитация в движении лечит отряд, раз на место' }),
      R('respite', { at: ['p3'], reward: 'Сдержанность лекку +1' }),
      R('respite', { at: ['p6'], reward: '«Имя клана»: Слово с твилеками на ступень легче' })
    ] },
    ekria: { name: 'Экрия', who: 'ekria', outfit: 'padawan', ranks: [
      R('plot', { when: 'глава 7, «Интрепид»', before: 'p9', reward: 'Взлом у Эйлы' }),
      R('respite', { at: ['p9'], reward: 'Расчёт: турели и ловушки видны на карте' }),
      R('respite', { at: ['p10'], reward: 'Сердце огня уходит к ней, в эпилоге своя строка' })
    ] }
  };

  A.RESPITES = {
    p1: { chapter: 'int', when: 'после интерлюдии', place: 'temple', count: 3, near: { tholme: 'council', xiaan: 'hall', yoda: 'garden' } },
    p2: { chapter: 'ch3', when: 'после посвящения', place: 'temple', count: 2, near: { tholme: 'hall', vos: 'garden', villie: 'pad' } },
    p3: { chapter: 'ch3', when: 'в хронике «Восемь лет»', place: 'chronicle', count: 4, near: { tholme: 'temple', vos: 'holo', villie: 'pad', secura: 'ryloth' }, years: ['29 ДБЯ', '27 ДБЯ', '25 ДБЯ', '23 ДБЯ'] },
    p4: { chapter: 'ch4', when: 'после Камино', place: 'temple', count: 3, near: { tholme: 'council', kit: 'garden', yoda: 'garden' } },
    p5: { chapter: 'ch5', when: 'после Деварона', place: 'ship', count: 3, near: { tholme: 'bridge', kit: 'hold', traa: 'hold', bly: 'deck' } },
    p6: { chapter: 'ch5', when: 'в конце главы 5', place: 'temple', count: 2, near: { tholme: 'council', kit: 'garden', bly: 'pad', secura: 'cell' } },
    p7: { chapter: 'ch6', when: 'на Нью-Холстисе', place: 'hospital', count: 2, near: { tholme: 'ward', bly: 'yard' } },
    p8: { chapter: 'ch6', when: 'после Хоногра', place: 'cruiser', count: 3, near: { bly: 'squad', kit: 'bridge', tholme: 'bridge' } },
    p9: { chapter: 'ch7', when: 'на «Интрепиде»', place: 'intrepid', count: 2, near: { bly: 'gym', ekria: 'bridge' } },
    p10: { chapter: 'ch7', when: 'в лагере на Фелуции', place: 'camp', count: 3, near: { bly: 'perimeter', ekria: 'tents' } }
  };
  A.RESPITE_ORDER = Object.keys(A.RESPITES);

  A.PLACES = {
    temple: { name: 'Храм джедаев', rooms: [
      { id: 'garden', name: 'Сад медитаций', bg: 'temple_garden', acts: ['meditate'], x: 70, y: 96 },
      { id: 'hall', name: 'Тренировочный зал', bg: 'temple_hall', acts: ['train'], x: 250, y: 96 },
      { id: 'archive', name: 'Архив', bg: 'temple_archive', acts: ['archive'], x: 430, y: 96 },
      { id: 'council', name: 'Зал Совета', bg: 'temple_council', acts: [], x: 70, y: 248 },
      { id: 'cell', name: 'Келья Эйлы', bg: 'temple_cell', acts: [], x: 250, y: 248 },
      { id: 'pad', name: 'Посадочная площадка', bg: 'temple_pad', acts: [], x: 430, y: 248 }
    ] },
    ship: { name: 'Корабль оперативной группы', rooms: [
      { id: 'bridge', name: 'Мостик', bg: 'taskforce_bridge', acts: ['archive'], x: 70, y: 96 },
      { id: 'hold', name: 'Грузовой отсек', bg: 'taskforce_hold', acts: ['train'], x: 250, y: 96 },
      { id: 'deck', name: 'Отсек отделения', bg: 'taskforce_deck', acts: [], x: 430, y: 96 },
      { id: 'medbay', name: 'Медотсек', bg: 'taskforce_medbay', acts: ['meditate'], x: 250, y: 248 }
    ] },
    hospital: { name: 'Госпиталь на Нью-Холстисе', rooms: [
      { id: 'ward', name: 'Палата Т\'ра Саа', bg: 'holstice_hospital', acts: [], x: 70, y: 96 },
      { id: 'yard', name: 'Двор госпиталя', bg: 'holstice_yard', acts: ['train'], x: 250, y: 96 },
      { id: 'memorial', name: 'Памятник павшим джедаям', bg: 'holstice_memorial', acts: ['meditate'], x: 430, y: 96 },
      { id: 'comm', name: 'Узел связи', bg: 'holstice_hospital', acts: ['archive'], x: 250, y: 248 }
    ] },
    cruiser: { name: 'Крейсер 327-го', rooms: [
      { id: 'bridge', name: 'Мостик', bg: 'cruiser_bridge', acts: ['archive'], x: 70, y: 96 },
      { id: 'squad', name: 'Отсек отделения', bg: 'cruiser_deck', acts: [], x: 250, y: 96 },
      { id: 'hold', name: 'Тренировочный отсек', bg: 'cruiser_hold', acts: ['train'], x: 430, y: 96 },
      { id: 'medbay', name: 'Медотсек', bg: 'cruiser_medbay', acts: ['meditate'], x: 250, y: 248 }
    ] },
    intrepid: { name: '«Интрепид»', rooms: [
      { id: 'gym', name: 'Тренировочный отсек', bg: 'intrepid_gym', acts: ['train'], x: 70, y: 96 },
      { id: 'bridge', name: 'Мостик', bg: 'intrepid_bridge', acts: [], x: 250, y: 96 },
      { id: 'cabin', name: 'Каюта Эйлы', bg: 'intrepid_cabin', acts: ['meditate'], x: 430, y: 96 }
    ] },
    camp: { name: 'Лагерь на Фелуции', rooms: [
      { id: 'perimeter', name: 'Периметр', bg: 'felucia_camp', acts: ['train'], x: 70, y: 96 },
      { id: 'tents', name: 'Палатки', bg: 'felucia_camp', acts: [], x: 250, y: 96 },
      { id: 'stream', name: 'Ручей у могилы Т\'да', bg: 'felucia_stream', acts: ['meditate'], x: 430, y: 96 }
    ] },
    chronicle: { name: 'Хроника «Восемь лет»', rooms: [
      { id: 'temple', name: 'Храм', bg: 'temple_hall', acts: ['train', 'meditate', 'archive'], x: 70, y: 96 },
      { id: 'holo', name: 'Голосвязь с Восом', bg: 'temple_cell', acts: [], x: 250, y: 96 },
      { id: 'pad', name: 'Посадочная площадка', bg: 'temple_pad', acts: [], x: 430, y: 96 },
      { id: 'ryloth', name: 'Рилот, клан Секура', bg: 'secura_chamber', acts: [], x: 250, y: 248 }
    ] }
  };

  A.ACTIVITIES = {
    bond: { name: 'Связь', about: 'сцена с человеком и очко связи' },
    train: { name: 'Тренировка', about: 'ступень одного умения' },
    meditate: { name: 'Медитация', about: 'Тьма −15, Дворец памяти' },
    archive: { name: 'Архив', about: 'статья о следующем задании: слабости врагов видны с первого хода' }
  };
  A.RESPITE_XP = 120;
  A.MEDITATE_DARK = 15;

  A.TRAININGS = {
    deflect2: { name: 'Отражение II', from: 'int', needs: 'deflect', level: ['deflect', 2], about: 'в стойке Отражения три выстрела, три четверти урона уходит обратно' },
    push2: { name: 'Толчок II', from: 'int', needs: 'push', level: ['push', 2], about: 'толчок бьёт в полтора раза сильнее' },
    restraint: { name: 'Сдержанность лекку', from: 'int', restraint: true, about: 'лекку не выдают ложь на одну ступень дольше' },
    djemso: { name: 'Джем-Со', from: 'ch3', about: 'стойка, в которой Темп даёт принятый удар' },
    deflect3: { name: 'Отражение III', from: 'ch4', needs: 'deflect', after: 'deflect2', level: ['deflect', 3], about: 'четыре выстрела, весь урон уходит обратно' },
    barrier: { name: 'Барьер Силы', from: 'ch4', about: 'барьер держит выстрелы и газ' },
    push3: { name: 'Толчок III', from: 'ch5', needs: 'push', after: 'push2', level: ['push', 3], about: 'бьёт вдвое сильнее, тяжёлого врага сдвигает с первого раза' }
  };

  A.ARCHIVE = {
    ch3: { title: 'Рилот: правящий совет и моргукаи', about: 'кланы Фенн и Секура, моргукаи с Кинтана', respites: ['p1'] },
    ch4: { title: 'Конфедерация и дроиды', about: 'граф Дуку, недовольные системы, боевые дроиды', respites: ['p3'] },
    ch5: { title: 'Налёты у Кореллианского торгового хребта', about: 'налётчики, охотники за головами, Аурра Синг', respites: ['p4'] },
    ch6: { title: 'Ногри и Хоногр', about: 'ногри, их яды и засады, мандалорские протекторы', respites: ['p5', 'p6'] },
    ch7: { title: 'Фелуция и Торговая гильдия', about: 'грибные джунгли, акклеи, станции очистки воды', respites: ['p7', 'p8'] }
  };

  A.DIFFICULTY = { story: { dmg: 0.7, hp: 0.7, help: true }, normal: { dmg: 1, hp: 1 }, master: { dmg: 1.25, hp: 1.2 } };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
