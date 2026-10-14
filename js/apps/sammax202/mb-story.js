(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP202 = {
    id: '202', ROOMS: {}, ITEMS: {}, TALK: {}, LAYERS: {}, ACTOR_HOT: {},
    SAVE_KEY: 'sammax202_saves', SET_KEY: 'sammax202_settings',
    TITLE_MUSIC: 'title22', CREDITS_MUSIC: 'credits22'
  };
  const { ITEMS, TALK } = E;

  Object.assign(COLORS, {
    bernie22: C.sky[4],
    billy22: C.gold[4],
    mort22: C.sand[4],
    pedro22: C.yellow[4],
    spatula22: C.neonA,
    bjimmy22: C.cream[4],
    mary22: C.rose[3],
    lincoln22: C.sand[3],
    sybil22: C.lilac[4],
    bosco22: C.mint[4],
    stinky22: C.teal[4],
    gstinky22: C.oak[4],
    narr22: C.grey[5]
  });

  Object.assign(S.THEMES, {
    title22: { bpm: 136, style: 'fanfare', prog: ['C', 'F', 'G', 'C', 'Am', 'Dm', 'G7', 'C'], mel: 'E5 . G5 . C6 . G5 . A5 . C6 . B5 . G5 . E5 . G5 . C6 . E6 . D6 . C6 . B5 . G5 . C5 . E5 . G5 . C6 . A5 . F5 . D5 . B4 . C5 . . . . . . .' },
    beach22: { bpm: 112, style: 'calypso', prog: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'], mel: 'G4 . C5 . E5 . G5 . E5 . C5 . D5 . B4 . A4 . C5 . E5 . A5 . F5 . D5 . C5 . . . G4 . C5 . E5 . G5 . E5 . D5 . B4 . G4 . A4 . F4 . G4 . . . C5 . . . . . . .' },
    fountain22: { bpm: 90, style: 'creepy', prog: ['Am', 'Dm', 'E7', 'Am', 'F', 'Dm', 'E7', 'E7'], mel: 'E5 . A5 . C6 . B5 . A5 . E5 . F5 . D5 . B4 . . . D5 . F5 . E5 . D5 . C5 . B4 . A4 . . . C5 . E5 . A5 . C6 . B5 . G#5 . E5 . . . . . . .' },
    cavern22: { bpm: 80, style: 'industrial', prog: ['Dm', 'Dm', 'Bb', 'A7', 'Dm', 'Gm', 'A7', 'Dm'], mel: 'D4 . . . F4 . . . A4 . . . G4 . F4 . Bb4 . . . A4 . . . G4 . F4 . E4 . . . D4 . . . F4 . . . D4 . Bb3 . A3 . . . D4 . . . . . . .' },
    volcano22: { bpm: 128, style: 'march', prog: ['Em', 'C', 'Am', 'B7', 'Em', 'C', 'B7', 'Em'], mel: 'E4 . G4 . B4 . E5 . D#5 . B4 . G4 . E4 . C5 . E5 . G5 . E5 . B4 . . . D#4 . . . E4 . G4 . B4 . E5 . G5 . E5 . D#5 . B4 . E4 . . . . . . .' },
    triangle22: { bpm: 144, style: 'tango', prog: ['Am', 'E7', 'E7', 'Am', 'Dm', 'Am', 'E7', 'Am'], mel: 'A4 . C5 . E5 . A5 . G#5 . E5 . B4 . . . B4 . D5 . F5 . E5 . D5 . C5 . A4 . . . D5 . F5 . A5 . F5 . E5 . C5 . A4 . . . B4 . G#4 . A4 . . . . . . .' },
    diner22: { bpm: 120, style: 'country', prog: ['G', 'C', 'G', 'D7', 'G', 'C', 'D7', 'G'], mel: 'B4 . D5 . G5 . D5 . E5 . G5 . E5 . C5 . D5 . B4 . G4 . B4 . A4 . C5 . F#5 . D5 . G5 . . . B4 . D5 . C5 . E5 . G5 . E5 . D5 . F#5 . A5 . F#5 . G5 . . . . . . .' },
    sybil22: { bpm: 104, style: 'waltz', prog: ['F', 'Dm', 'Bb', 'C7', 'F', 'Gm', 'C7', 'F'], mel: 'A4 . . C5 . . D5 . . F5 . . D5 . C5 . Bb4 . G4 . . . . . A4 . . C5 . F5 G5 . . F5 . D5 E5 . . G5 . . F5 . . . . .' },
    finale22: { bpm: 160, style: 'tarantella', prog: ['Am', 'E7', 'Am', 'Dm', 'Am', 'E7', 'Am', 'Am'], mel: 'E5 . E5 E5 F5 E5 D5 . B4 . . . B4 . B4 B4 C5 B4 A4 . E5 . . . D5 F5 A5 F5 D5 . C5 E5 A5 E5 C5 . B4 D5 G#5 D5 B4 . A4 . . . . .' },
    credits22: { bpm: 130, style: 'swing', prog: ['C', 'A7', 'Dm7', 'G7', 'C', 'C7', 'F', 'G7'], mel: 'E5 . G5 C6 . E6 . D6 C#6 . A5 . E5 . C#5 . D5 . F5 A5 . C6 . A5 B5 . . . G5 . . . E5 . G5 C6 . E6 . G6 E6 . Bb5 . G5 . E5 . F5 . A5 . C6 . A5 F5 G5 . . . . . . .' }
  });

  E.voice = function (g, key, text, x, y) {
    return g.say(null, text, { key, color: COLORS[key] || C.grey[5], x, y });
  };

  E.narr = function (g, text, color) {
    return g.say(null, text, { key: 'narr', color: color || COLORS.narr22, x: 160, y: 190 });
  };

  E.dress = function (g) {
    const max = g.actors.max;
    const sam = g.actors.sam;
    if (g.roomId === 'beach') g.fx.tint = [255, 230, 180, 0.08];
    else if (g.roomId === 'volcano') g.fx.tint = [255, 120, 60, 0.18];
    else if (g.roomId === 'cavern') g.fx.tint = [90, 110, 140, 0.15];
    else if (g.roomId === 'triangle') g.fx.tint = [120, 240, 255, 0.12];
    else g.fx.tint = null;
    if (sam) { sam.scale = null; sam.z = 0; }
    if (max) { max.scale = null; max.follow = 'sam'; }
    g.f.frozen = false;
  };

  TALK.portalTrip = {
    options: () => [
      { id: 'street', icon: 'home21', text: 'К нашему офису в Нью-Йорке.', when: gg => gg.roomId !== 'street', say: false, end: true, run: function* (gg) { gg.endDialog(); yield* E.warp(gg, 'street'); } },
      { id: 'beach', icon: 'beach22', text: 'На остров Пасхи.', when: gg => gg.roomId !== 'beach', say: false, end: true, run: function* (gg) { gg.endDialog(); yield* E.warp(gg, 'beach'); } },
      { id: 'triangle', icon: 'triangle22', text: 'Внутрь Бермудского треугольника.', when: gg => gg.roomId !== 'triangle', say: false, end: true, run: function* (gg) { gg.endDialog(); yield* E.warp(gg, 'triangle'); } },
      { id: 'volcano', icon: 'volcano22', text: 'К жерлу вулкана.', when: gg => gg.f.volcanoKnown && gg.roomId !== 'volcano', say: false, end: true, run: function* (gg) { gg.endDialog(); yield* E.warp(gg, 'volcano'); } },
      { id: 'bye', icon: 'bye', text: 'Останемся здесь.', say: false, end: true }
    ]
  };

  E.warp = function* (g, to) {
    g.hideUI = true;
    g.sfx('zap');
    yield g.fadeOut(3);
    g.closeup = { kind: 'warp22', t0: g.time, dest: to };
    g.music('triangle22');
    yield g.fadeIn(3);
    const at = { x: 160, y: 196 };
    if (!g.seen['warp_' + to]) {
      g.seen['warp_' + to] = 1;
      if (to === 'beach') {
        yield g.say('max', 'Сэм, мои лапы пахнут ананасом!', at);
        yield g.say('sam', 'Это пальмовый озон портала. Держи шляпу, выходим на пляж.', at);
      } else if (to === 'volcano') {
        yield g.say('max', 'Жарко! Жарко! Давай прыгнем в лаву прямо в обуви!', at);
        yield g.say('sam', 'Лава испортит подошвы, а новые выписывать через комиссара долго.', at);
      } else if (to === 'triangle') {
        yield g.say('sam', 'Аномальная зона. В воздухе плавают старые дирижабли и гитары.', at);
        yield g.say('max', 'Идеальное место для постоянного проживания!', at);
      } else {
        yield g.say('sam', 'Старый добрый грязный тротуар. Никакой тропической экзотики.', at);
      }
    } else yield 1.2;
    yield g.fadeOut(3);
    g.closeup = null;
    g.hideUI = false;
    if (to === 'beach') yield* g.goRoom('beach', { x: 260, y: 166, dir: 's' }, { from: 'warp' });
    else if (to === 'volcano') yield* g.goRoom('volcano', { x: 80, y: 166, dir: 'e' }, { from: 'warp' });
    else if (to === 'triangle') yield* g.goRoom('triangle', { x: 160, y: 168, dir: 's' }, { from: 'warp' });
    else yield* g.goRoom('street', { x: 420, y: 154, dir: 's' }, { from: 'warp' });
  };

  ITEMS.max = {
    name: 'Макс',
    icon: 'max',
    look: 'Мой гиперактивный белоснежный напарник. Вооружен острыми зубами и детской непосредственностью.',
    use: 'Я не стану применять Макса без крайней необходимости. Он пачкает мебель.'
  };

  ITEMS.gun = {
    name: 'Пистолет',
    icon: 'gun',
    look: 'Мой табельный револьвер. Шесть патронов, вороненая сталь и легкий запах пороха.',
    use: 'Стрелять по всему подряд весело, но гильзы потом собирать лень.'
  };

  ITEMS.sandwich = {
    name: 'Гранитный бутерброд',
    icon: 'sandwich22',
    look: 'Кулинарный шедевр из закусочной Вонючки. Хлеб из базальтовой муки и начинка из пемзы.',
    use: 'Таким бутербродом можно разбить витрину или подпереть дверь бункера.'
  };

  ITEMS.suntea = {
    name: 'Солнечный чай',
    icon: 'suntea22',
    look: 'Банка с мутным напитком, который дедушка Вонючка настаивал на солнце сорок лет.',
    use: 'Пахнет морской тиной и старыми сапогами. Пить это добровольно нельзя.'
  };

  ITEMS.youthwater = {
    name: 'Вода молодости',
    icon: 'youthwater22',
    look: 'Кружка с искрящейся водой из тайного грота. Жидкость слегка светится и пахнет мыльными пузырями.',
    use: 'Один глоток превращает взрослого в карапуза. Нам с Максом омолаживаться пока рано.'
  };

  ITEMS.seismic = {
    name: 'Сейсмический инвертор',
    icon: 'seismic22',
    look: 'Прибор Боско для защиты от бермудских колебаний. Гудит и ритмично вибрирует.',
    use: 'Если включить на полную мощность, земля под ногами начинает ходить ходуном.'
  };

  ITEMS.rattle = {
    name: 'Золотая погремушка',
    icon: 'rattle22',
    look: 'Тяжелая резная погремушка с древними символами. Джимми Двузубик отобрал ее на дне грота.',
    use: 'Внутри перекатывается крупная вулканическая жемчужина.'
  };

  ITEMS.prophecy = {
    name: 'Скрижаль пророчества',
    icon: 'prophecy22',
    look: 'Каменная плитка со стихами Мортимера о великом пробуждении горы Беллависта.',
    use: 'Строки гласят: Слезы утихнут, смех замрет, древний мотив лаву повернет.'
  };

  ITEMS.flower = {
    name: 'Гибискус',
    icon: 'flower22',
    look: 'Яркий тропический цветок с пляжа острова Пасхи. Лепестки алые и свежие.',
    use: 'Идеальный романтический жест для тех, кто ищет взаимности.'
  };

  ITEMS.pedrokey = {
    name: 'Трезвучный камертон',
    icon: 'pedrokey22',
    look: 'Бронзовый камертон музыкантов мариачи. Резонирует на частоте пространственных разломов.',
    use: 'Если ударить по нему, в воздухе открываются радужные портальные дуги.'
  };

  ITEMS.spatula = {
    name: 'Мистер Лопатка',
    icon: 'spatula22',
    look: 'Наш бывший золотой карась. В золотом куполе верховного жреца он выглядит на удивление надменно.',
    use: 'Теперь он под стражей. Никаких жертвоприношений в лаве больше не будет.'
  };

  E.maxHint = function (g) {
    if (!g.f.portalSeen) return 'Сэм, за окном что-то светится треугольником! Пошли проверим тротуар!';
    if (g.roomId === 'street' && !g.f.beachVisited) return 'Прыгай прямо в сияющий портал на улице! Не каждый день выпадает шанс улететь неизвестно куда!';
    if (!g.f.prophecyGot) return 'Надо поговорить с огромными каменными головами на пляже. Они явно знают местный распорядок!';
    if (!g.f.bernieHappy) return 'Плачущий истукан Берни зальет слезами весь остров! Ему нужно поднять настроение. Может, Сибил и Линкольн устроят здесь свидание?';
    if (!g.f.billySerious) return 'Хохочущий истукан Билли раздражает своим гоготом! Его надо как-то остудить или напугать подземной встряской!';
    if (!g.f.pedroDone) return 'Внутри Бермудского треугольника играют мариачи. Педро поет о настройке портальных частот!';
    if (!g.f.volcanoReady) return 'Древний проход в вулкан открыт. Пора подняться к жерлу и выяснить, кто там командует лавой!';
    if (!g.f.lavaDiverted) return 'Лава вот-вот накроет истуканов! Надо направить порталы так, чтобы поток ушел обратно в океан!';
    return 'Мистер Лопатка в наших руках. Пора возвращаться в родной офис и складывать улики в шкаф!';
  };

  E.install = function () {
    for (const room of Object.values(E.ROOMS)) {
      if (room.dress202) continue;
      room.dress202 = true;
      const setup = room.setup;
      room.setup = function (g) {
        if (setup) setup.call(room, g);
        E.dress(g);
      };
      if (!room.onLoad) room.onLoad = function (g) { room.setup(g); };
    }
  };

  E.newGame = function (g) {
    g.vt = {};
    g.addActor('sam', { name: 'Сэм', color: COLORS.sam, speed: 62, stride: 34 });
    g.addActor('max', { name: 'Макс', color: COLORS.max, speed: 70, stride: 26, follow: 'sam' });
    g.inv = ['max', 'gun'];
    g.place('sam', 'office', 150, 164, 's');
    g.place('max', 'office', 118, 156, 'w');
    E.dress(g);
  };

  E.afterLoad = function (g) {
    const room = g.room;
    if (room && room.onLoad) room.onLoad(g);
    E.dress(g);
  };

  E.startNewGame = function (g) {
    E.install();
    E.newGame(g);
    g.setRoom('office', { x: 150, y: 164, dir: 's' });
    if (E.ROOMS.office && E.ROOMS.office.intro) {
      g.fade = 1; g.fadeTo = 1;
      g.run(E.ROOMS.office.intro, { name: 'intro' });
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
