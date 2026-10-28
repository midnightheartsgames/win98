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
    neti: 'нети', anzat: 'анзат', veknoid: 'векноид', yoda: 'вид Йоды', keldor: 'кел-дор', tholothian: 'толотианка',
    nikto: 'каджайн\'са\'никто', falleen: 'фаллин', kaminoan: 'каминоанка', cyborg: 'калишит-киборг', cerean: 'цереанин',
    palliduvan: 'паллидуванка', weequay: 'вику', mirialan: 'мириаланка', selonian: 'селонианин'
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
        clonewars: o('Войны клонов', '#1e1e22', '#4a3a3a', 'тёмный наряд агента Дуку')
      }
    }),
    tholme: P('Толм', 'human', {
      tier: 1, faces: FACES, plate: '#5a7a4a', pitch: 260, skin: '#d8b090', hair: '#9a9a9a', eyes: '#4a7a4a', cyber: true,
      look: 'человек, светлая кожа, седые волосы (раньше чёрные), зелёные глаза, искусственный левый глаз, зелёный клинок',
      outfits: { robe: o('роба', '#6a5a44', '#3a3024', 'роба джедая, сдержанная, тёмная') }
    }),
    kit: P('Кит', 'nautolan', {
      tier: 1, faces: FACES, plate: '#3a9a5a', pitch: 360, skin: '#5aa05a', eyes: '#101010',
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
    kuro: P('Ан\'йа Куро', 'human', { long: true, plate: '#5a5a7a', pitch: 360, skin: '#e0d0c0', hair: '#c8c8c8', eyes: '#4a6aa0', look: 'Тёмная Женщина: седые волосы (раньше чёрные), голубые глаза; бывшая наставница Аурры', outfits: { robe: o('роба', '#3a3a44', '#6a6a7a', 'тёмная роба') } }),
    malloc: P('Вьен\'сай\'Маллок', 'devaronian', { plate: '#a04a4a', pitch: 540, skin: '#c06a5a', hair: '#5a3a20', eyes: '#5a3a20', female: true, look: 'деваронка, каштановые волосы, карие глаза; сенатор', outfits: { senator: o('сенатор', '#4a2a4a', '#c8a050', 'платье сенатора') } }),
    aurra: P('Аурра Синг', 'palliduvan', { plate: '#c04a2a', pitch: 460, skin: '#ece8e0', hair: '#a04020', eyes: '#3a9a3a', look: 'алебастровая кожа, рыжие волосы в пучке, зелёные глаза, антенна-имплант на голове', outfits: { hunter: o('охотница', '#8a3a2a', '#3a2a2a', 'красно-бурый комбинезон охотницы') } }),
    shonju: P('Шон-Джу', 'human', { plate: '#6a5a3a', pitch: 300, skin: '#e0c4a0', hair: '#1a1410', eyes: '#5a3a20', look: 'человек, светлая кожа, чёрные волосы, карие глаза; после главы 5 протезы кистей', outfits: { robe: o('учитель', '#5a4a3a', '#2a2a2a', 'одежда учителя своей школы') } }),
    duum: P('Аттума Дуум', 'human', { plate: '#7a7a8a', pitch: 280, skin: '#e0c8b0', hair: '#e0d080', eyes: '#4a6aa0', cyber: true, look: 'человек-киборг, светлый парик, голубые глаза, металлическое тело под одеждой', outfits: { merc: o('наёмник', '#3a3a4a', '#8a8a9a', 'одежда наёмника') } }),
    bulq: P('Сора Булк', 'weequay', { plate: '#7a5a3a', pitch: 220, skin: '#8a7a5a', hair: '#1a1410', eyes: '#5a3a20', look: 'вику, серо-коричневая кожа, чёрные волосы, карие глаза; правая рука Дуку', outfits: { robe: o('роба', '#2a2a2a', '#5a3a2a', 'тёмная роба') } }),
    akku: P('Акку Сеи', 'anzat', { plate: '#9a8a8a', pitch: 250, skin: '#c8b8a0', hair: '#e8e8e8', eyes: '#c02020', look: 'анзат, белые волосы, красные глаза; учитель убийц', outfits: { robe: o('учитель', '#3a2a2a', '#7a6a5a', 'одежда учителя') } }),
    barriss: P('Барисс', 'mirialan', { plate: '#3a7a5a', pitch: 580, skin: '#b0a060', hair: '#1a1410', eyes: '#4a6aa0', look: 'мириаланка, оливковая кожа, чёрные волосы, голубые глаза, знаки на лице (сверить)', outfits: { robe: o('роба', '#3a2a3a', '#6a5a7a', 'тёмная роба с капюшоном') } }),
    zonder: P('Зондер', 'selonian', { plate: '#7a6a4a', pitch: 500, skin: '#7a5a3a', eyes: '#2a1a10', look: 'селонианин (внешность сверить), падаван', outfits: { padawan: o('падаван', '#6a5a44', '#3a3024', 'туника падавана') } }),
    drake: P('Дрейк Ло\'ган', 'human', { plate: '#5a6a7a', pitch: 460, skin: '#e0c0a0', hair: '#4a3a2a', eyes: '#4a5a6a', look: 'падаван (внешность сверить)', outfits: { padawan: o('падаван', '#6a5a44', '#3a3024', 'туника падавана') } }),
    stass: P('Стасс Алли', 'tholothian', { plate: '#4a7a9a', pitch: 540, skin: '#7a5a4a', eyes: '#3a5a8a', look: 'толотианка, двоюродная сестра Ади Галлии (сверить)', outfits: { robe: o('роба', '#6a5a44', '#3a3024', 'роба джедая') } }),
    tinte: P('Шейф Тинте', 'kiffar', { plate: '#5a5a6a', pitch: 300, skin: '#8a8a8a', hair: '#141414', eyes: '#141414', mark: '#e0c040', look: 'киффар, серая кожа, чёрные волосы, чёрные глаза; правительница Киффу и Киффекса', outfits: { sheyf: o('Шейф', '#3a3a4a', '#a08a4a', 'строгая одежда правительницы') } })
  };

  A.NARRATOR = { name: '', plate: null, pitch: 520 };

  A.MUSIC = ['temple', 'ryloth', 'battle', 'aayla'];

  A.TRACKS = {
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

  A.TYPES = { blade: 'клинок', strike: 'удар', blaster: 'бластер', ion: 'ион', shock: 'разряд', mind: 'разум' };
  A.NRAV = { coward: 'трус', merc: 'наёмник', fanatic: 'фанатик', proud: 'гордец', dutiful: 'служака' };
  A.WEIGHTS = { light: 'лёгкий', medium: 'средний', heavy: 'тяжёлый' };

  A.HEROES = {
    aayla: { name: 'Эйла', look: 'aayla_padawan', blade: '#e83a2a', tempo: true, base: { hp: 120, fp: 30, mig: 10, wil: 9, agi: 12, sta: 8 }, grow: { hp: 14, fp: 3, mig: 1.6, wil: 1.3, agi: 0.8, sta: 1.0 }, skills: ['blade', 'combo', 'leap', 'throw', 'whirl', 'roll', 'push', 'pull', 'disarm', 'sense', 'brace', 'deflect', 'focus', 'guard', 'talk'] },
    vos: { name: 'Вос', look: 'vos_early', blade: '#3ad04a', base: { hp: 140, fp: 28, mig: 12, wil: 8, agi: 10, sta: 10 }, grow: { hp: 15, fp: 3, mig: 1.7, wil: 1.4, agi: 0.7, sta: 1.1 }, skills: ['blade', 'read', 'vlightning', 'push', 'guard'] }
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
    read: { name: 'Прочтение', menu: 'own', fp: 8, target: 'enemy', weight: 0.8, effect: 'read', about: 'два следующих хода и слабости врага' },
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
    wait: { name: 'Ждёт' }
  };

  A.BASIC_SKILLS = ['blade', 'guard', 'talk'];

  A.STANCE = { deflect: [{ charges: 2, share: 0.5 }, { charges: 3, share: 0.75 }, { charges: 4, share: 1 }] };

  A.ENEMY_KINDS = {
    sentient: { weak: [], resist: [], immune: [] },
    beast: { weak: ['mind'], resist: [], immune: [] },
    droid: { weak: ['ion'], resist: [], immune: ['mind'] },
    morgukai: { weak: ['strike'], resist: [], immune: ['blade'], cortosis: true },
    anzat: { weak: [], resist: ['mind'], immune: [] },
    cyborg: { weak: ['ion'], resist: [], immune: ['mind'] },
    noghri: { weak: [], resist: ['mind'], immune: [] }
  };

  A.ENEMIES = {
    smuggler: { name: 'Контрабандист', kind: 'sentient', twilek: true, nrav: 'coward', weight: 'light', ai: 'shooter', weapon: 'blaster', look: 'twilek_green', hp: 100, mig: 34, wil: 10, agi: 18, sta: 14, resolve: 20, weak: ['shock'], xp: 40, credits: 15 },
    thug: { name: 'Громила', kind: 'sentient', twilek: true, nrav: 'merc', weight: 'medium', ai: 'melee', weapon: 'vibro', look: 'twilek_guard', hp: 150, mig: 40, wil: 8, agi: 14, sta: 24, resolve: 26, weak: ['strike'], xp: 60, credits: 20 },
    spider: { name: 'Энергетический паук', kind: 'beast', weight: 'light', ai: 'biter', beast: 'spider', hp: 80, mig: 30, wil: 6, agi: 19, sta: 12, weak: ['strike'], xp: 30, credits: 0 },
    giant_spider: { name: 'Огромный паук', kind: 'beast', boss: true, weight: 'heavy', ai: 'spiderboss', beast: 'giant', hp: 1100, mig: 48, wil: 14, agi: 12, sta: 24, weak: ['shock'], xp: 600, credits: 0 }
  };

  A.GROUPS = {
    smugglers_a: { name: 'Контрабандисты', units: [['thug', 'front', 1], ['smuggler', 'back', 0], ['smuggler', 'back', 2]], hazard: null, scene: 'cave' },
    smugglers_b: { name: 'Контрабандисты', units: [['thug', 'front', 1], ['smuggler', 'back', 1]], hazard: null, scene: 'cave' },
    smugglers_c: { name: 'Контрабандисты у пропасти', units: [['smuggler', 'front', 1], ['smuggler', 'back', 0], ['smuggler', 'back', 2]], hazard: 'chasm', scene: 'cave' },
    smugglers_d: { name: 'Контрабандисты', units: [['thug', 'front', 0], ['thug', 'front', 2], ['smuggler', 'back', 1]], hazard: null, scene: 'cave' },
    spiders_a: { name: 'Энергетические пауки', units: [['spider', 'front', 0], ['spider', 'front', 1], ['spider', 'front', 2]], hazard: null, scene: 'mine' },
    spiders_b: { name: 'Энергетические пауки', units: [['spider', 'front', 0], ['spider', 'front', 2], ['spider', 'back', 1]], hazard: null, scene: 'mine' },
    spider_boss: { name: 'Логово', units: [['giant_spider', 'back', 1], ['spider', 'front', 0], ['spider', 'front', 2]], hazard: 'brace', boss: true, scene: 'mine' }
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
      rage: 'Ах так?!'
    },
    say: {
      persuade: 'Мы знаем про глиттерилл. Сдайся, пока это просто контрабанда.',
      mind: 'Тебе не нужно с нами драться.',
      charm: 'Неужели такой славный парень будет стрелять в девушку?',
      threat: 'Ещё шаг, и пожалеешь.'
    }
  };
  A.ARGUMENTS = ['clue_lessu_market_d', 'clue_ryll_tunnels_u'];

  A.ITEMS = {
    bacta: { name: 'Бакта-пластырь', about: '+30 % здоровья одному герою', heal: 0.3 },
    stim: { name: 'Стимулятор', about: '+2 Темпа Эйле', tempo: 2 },
    antidote: { name: 'Противоядие', about: 'снимает яд', cure: 'poison' }
  };

  A.RECOVER = { hpPerFp: 7 };

  A.DIFFICULTY = { story: { dmg: 0.7, hp: 0.7, help: true }, normal: { dmg: 1, hp: 1 }, master: { dmg: 1.25, hp: 1.2 } };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
