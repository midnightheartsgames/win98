window.interpediaReg('demoscene', 'culture', {
  title: 'Демосцена',
  infobox: {
    title: 'Демосцена',
    badgeText: 'Demoscene',
    fields: [
      { label: 'Возникновение', value: 'середина 1980-х, Европа' },
      { label: 'Платформы', value: 'Commodore 64, Amiga, ZX Spectrum, PC' },
      { label: 'Жанры', value: 'демо, интро 64К и 4К, трекерная музыка, графика' },
      { label: 'Крупные пати', value: 'Assembly, The Party, The Gathering' },
      { label: 'Пати в России', value: 'ENLiGHT, Chaos Constructions' },
      { label: 'Знаменитые группы', value: 'Future Crew, Triton, Orange, The Black Lotus' },
      { label: 'Архивы', value: 'hornet.org (до 1998), scene.org' }
    ]
  },
  lead: `<strong>Демосцена</strong> — международное сообщество программистов, художников и музыкантов, создающих демо: небольшие программы, которые в реальном времени показывают графические эффекты под музыку. Главное в демо — выжать из компьютера больше, чем считалось возможным, и сделать это красиво.

Сцена выросла в 1980-х из заставок, которые взломщики добавляли к играм, и превратилась в самостоятельное искусство со своими фестивалями — «пати», конкурсами и легендами. Многие выходцы со сцены сегодня работают в игровой индустрии, а демо вроде [[secondreality|Second Reality]] стали классикой компьютерной культуры.`,
  sections: [
    { id: 'origins', title: 'Происхождение', content: `В середине 1980-х годов группы, снимавшие защиту с игр для Commodore 64 и позже Amiga, начали добавлять к взломанным играм короткие заставки — «крэктро» — с логотипом группы, бегущей строкой приветствий и музыкой. Заставки соревновались в эффектности, и вскоре появились группы, которые занимались только ими, без взлома. Так возникло демо как самостоятельный жанр.

С распространением VGA-графики и звуковых карт вроде [[gravisgus|Gravis UltraSound]] в начале 1990-х центром сцены стали IBM PC-совместимые компьютеры, хотя Amiga и Commodore 64 сохраняют преданных поклонников.` },
    { id: 'genres', title: 'Жанры', content: `<dl>
<dt>Демо</dt><dd>полноценная программа на несколько минут без ограничения размера.</dd>
<dt>Интро 64К и 4К</dt><dd>демо, которое умещается в 65 536 или 4096 байт вместе с графикой и музыкой; авторы генерируют текстуры и звук программно.</dd>
<dt>Трекерная музыка</dt><dd>композиции в форматах MOD, S3M, XM и IT, созданные в трекерах вроде FastTracker 2 и Impulse Tracker.</dd>
<dt>Графика</dt><dd>пиксельные рисунки, нарисованные вручную, в том числе ANSI-графика для [[bbs|BBS]].</dd>
</dl>

Популярные эффекты — плазма, туннели, вращающиеся трёхмерные объекты, огонь, звёздное небо, зеркальные шары — сменяют друг друга в ритме музыки.` },
    { id: 'parties', title: 'Пати', content: `Демопати — фестивали, на которые сценеры приезжают со своими компьютерами на несколько дней. Работы показывают на большом экране, зрители голосуют, а победители получают призы. Пати одновременно служат [[lanparty|компьютерными вечеринками]] для сетевых игр.

<table class="interpedia-wikitable">
<tr><th>Пати</th><th>Страна</th><th>С какого года</th></tr>
<tr><td>The Party</td><td>Дания</td><td>1991</td></tr>
<tr><td>Assembly</td><td>Финляндия</td><td>1992</td></tr>
<tr><td>The Gathering</td><td>Норвегия</td><td>1992</td></tr>
<tr><td>ENLiGHT</td><td>Россия, Санкт-Петербург</td><td>1990-е</td></tr>
<tr><td>Chaos Constructions</td><td>Россия, Санкт-Петербург</td><td>1999</td></tr>
</table>` },
    { id: 'russia', title: 'Демосцена в России', content: `В бывшем СССР сцена сформировалась вокруг клонов ZX Spectrum, которые собирали дома из доступных деталей. Русские спектрумисты прославились демо, выжимающими невероятное из восьмибитного компьютера, и электронными журналами на дискетах. С распространением ПК появилась и российская PC-сцена; крупнейшие пати проходят в Санкт-Петербурге.` },
    { id: 'industry', title: 'Сцена и индустрия', content: `Демосцена стала школой для разработчиков игр. Участники финской группы Future Crew основали студию Remedy Entertainment, выпустившую Death Rally (1996) и работающую над боевиком Max Payne, и компанию, создающую тесты производительности 3DMark. Шведская группа Triton выпустила трекер FastTracker 2, а композиторы со сцены пишут музыку для игр, например для [[ut99|Unreal Tournament]].` },
    { id: 'archives', title: 'Архивы', content: `Демо распространяются через [[bbs|BBS]], дискеты и FTP-архивы. Крупнейший архив PC-сцены, hornet.org, закрылся в 1998 году, и его коллекцию сохранили добровольцы, передав её в scene.org. Сценеры понимают, что их работы живут, лишь пока кто-то их хранит: демо, рассчитанное на конкретную звуковую карту и процессор, через несколько лет может не запуститься на новом компьютере.` }
  ],
  seeAlso: ['secondreality', 'gravisgus', 'amigaos', 'bbs', 'lanparty'],
  references: [
    'Future Crew. Second Reality: info file. — 1993.',
    'Hornet Archive: Demo News, 1992–1998.',
    'Assembly: официальные результаты конкурсов, 1992–1999.'
  ],
  categories: ['Киберкультура', 'Демосцена', 'Компьютерное искусство']
}, {
  title: 'The Demoscene',
  infobox: {
    title: 'Demoscene',
    badgeText: 'Demoscene',
    fields: [
      { label: 'Origins', value: 'mid-1980s, Europe' },
      { label: 'Platforms', value: 'Commodore 64, Amiga, ZX Spectrum, PC' },
      { label: 'Categories', value: 'demos, 64K and 4K intros, tracked music, graphics' },
      { label: 'Major parties', value: 'Assembly, The Party, The Gathering' },
      { label: 'Parties in Russia', value: 'ENLiGHT, Chaos Constructions' },
      { label: 'Famous groups', value: 'Future Crew, Triton, Orange, The Black Lotus' },
      { label: 'Archives', value: 'hornet.org (until 1998), scene.org' }
    ]
  },
  lead: `The <strong>demoscene</strong> is an international community of programmers, artists and musicians who make demos: small programs that show graphic effects in real time set to music. The point of a demo is to squeeze more out of a computer than was thought possible, and to do it beautifully.

The scene grew in the 1980s from the intros crackers added to games and became an art form of its own with festivals, "parties", competitions and legends. Many people from the scene now work in the game industry, and demos such as [[secondreality|Second Reality]] are classics of computer culture.`,
  sections: [
    { id: 'origins', title: 'Origins', content: `In the mid-1980s, groups that removed copy protection from Commodore 64 and later Amiga games began adding short intros, "cracktros", with the group logo, a scroller of greetings and music. The intros competed in flashiness, and soon groups appeared that made only intros, without cracking. That is how the demo emerged as a genre.

As VGA graphics and sound cards such as the [[gravisgus|Gravis UltraSound]] spread in the early 1990s, IBM PC compatibles became the center of the scene, though the Amiga and Commodore 64 keep devoted fans.` },
    { id: 'genres', title: 'Categories', content: `<dl>
<dt>Demo</dt><dd>a full program running several minutes, with no size limit.</dd>
<dt>64K and 4K intros</dt><dd>demos that fit into 65,536 or 4,096 bytes including graphics and music; authors generate textures and sound in code.</dd>
<dt>Tracked music</dt><dd>songs in MOD, S3M, XM and IT formats made in trackers such as FastTracker 2 and Impulse Tracker.</dd>
<dt>Graphics</dt><dd>hand-drawn pixel art, including ANSI art for [[bbs|BBSes]].</dd>
</dl>

Popular effects, plasma, tunnels, spinning 3D objects, fire, starfields and mirrored balls, follow one another in time with the music.` },
    { id: 'parties', title: 'Parties', content: `Demo parties are festivals where sceners bring their computers for several days. Works are shown on a big screen, the audience votes and winners get prizes. Parties also double as [[lanparty|LAN parties]] for network games.

<table class="interpedia-wikitable">
<tr><th>Party</th><th>Country</th><th>Since</th></tr>
<tr><td>The Party</td><td>Denmark</td><td>1991</td></tr>
<tr><td>Assembly</td><td>Finland</td><td>1992</td></tr>
<tr><td>The Gathering</td><td>Norway</td><td>1992</td></tr>
<tr><td>ENLiGHT</td><td>Russia, St. Petersburg</td><td>1990s</td></tr>
<tr><td>Chaos Constructions</td><td>Russia, St. Petersburg</td><td>1999</td></tr>
</table>` },
    { id: 'russia', title: 'The demoscene in Russia', content: `In the former USSR the scene formed around ZX Spectrum clones that people assembled at home from available parts. Russian Spectrum coders became famous for demos that wring the impossible out of an 8-bit computer and for disk magazines. As the PC spread, a Russian PC scene appeared too; the largest parties are held in St. Petersburg.` },
    { id: 'industry', title: 'The scene and the industry', content: `The demoscene became a school for game developers. Members of the Finnish group Future Crew founded Remedy Entertainment, which released Death Rally (1996) and is working on the action game Max Payne, and a company that makes the 3DMark benchmarks. The Swedish group Triton released the FastTracker 2 tracker, and scene composers write game music, for example for [[ut99|Unreal Tournament]].` },
    { id: 'archives', title: 'Archives', content: `Demos spread through [[bbs|BBSes]], floppies and FTP archives. The largest PC scene archive, hornet.org, closed in 1998, and volunteers saved its collection by passing it to scene.org. Sceners know their work lives only as long as someone keeps it: a demo written for a particular sound card and processor may not run on a new computer a few years later.` }
  ],
  seeAlso: ['secondreality', 'gravisgus', 'amigaos', 'bbs', 'lanparty'],
  references: [
    'Hornet Archive: Demo News, 1992–1998.',
    'Assembly: official competition results, 1992–1999.',
    'Future Crew. Second Reality info file, 1993.'
  ],
  categories: ['Cyberculture', 'Demoscene', 'Computer Art']
});

window.interpediaReg('secondreality', 'culture', {
  title: 'Second Reality (демо 1993 года)',
  infobox: {
    title: 'Second Reality',
    badgeText: 'Future Crew',
    fields: [
      { label: 'Группа', value: 'Future Crew (Финляндия)' },
      { label: 'Премьера', value: 'Assembly \'93, июль 1993' },
      { label: 'Место на конкурсе', value: '1-е среди PC-демо' },
      { label: 'Платформа', value: '[[msdos|MS-DOS]], 386/486, VGA' },
      { label: 'Звук', value: '[[gravisgus|Gravis UltraSound]], [[soundblaster|Sound Blaster]]' },
      { label: 'Музыка', value: 'Purple Motion, Skaven' },
      { label: 'Длительность', value: 'около 9 минут' }
    ]
  },
  lead: `<strong>Second Reality</strong> — демо финской группы Future Crew, представленное на фестивале Assembly '93 летом 1993 года и занявшее первое место. Девять минут непрерывных эффектов — вращающиеся трёхмерные объекты, плазма, зеркальный шар, туннели и финальный полёт над городом — под музыку Purple Motion и Skaven сделали его самым известным PC-демо в истории.

Second Reality показала, что обычный компьютер с процессором 386 или 486 способен на графику, которую тогда ожидали только от рабочих станций. Для многих людей оно стало первым знакомством с [[demoscene|демосценой]].`,
  sections: [
    { id: 'futurecrew', title: 'Future Crew', content: `Future Crew — одна из самых известных групп PC-сцены. Её демо Unreal (1992) уже поражало зрителей, а Second Reality закрепило славу. Участники группы известны под никами: программисты Psi, Trug и Wildfire, художники Pixel и Marvel, музыканты Purple Motion и Skaven. Группа выпустила также трекер Scream Tracker 3, популярный формат S3M и музыкальные диски.` },
    { id: 'premiere', title: 'Премьера', content: `Демо было показано на фестивале Assembly '93 в Финляндии. Зрители в зале встретили его овацией, и Second Reality уверенно выиграла конкурс PC-демо. После фестиваля демо разошлось через [[bbs|BBS]], FTP-архивы и компакт-диски по всему миру, а позднее вошло в сборники «лучших программ» компьютерных журналов.` },
    { id: 'effects', title: 'Эффекты', content: `<ul>
<li>Вступление с силуэтами космических кораблей и надписями на фоне неба.</li>
<li>Прозрачные многогранники с эффектом стекла (glenz-векторы).</li>
<li>Плазма — переливающиеся цветовые волны.</li>
<li>Зеркальный шар, отражающий окружающую сцену.</li>
<li>Туннели из точек и вращающиеся поверхности.</li>
<li>Финальный полёт камеры над трёхмерным городом с летящим кораблём.</li>
</ul>

Все эффекты рассчитываются в реальном времени без 3D-ускорителя — только силами процессора и VGA-видеокарты.` },
    { id: 'music', title: 'Музыка', content: `Музыку написали Purple Motion (Йонне Валтонен) и Skaven (Петер Хайба). Она звучит лучше всего на [[gravisgus|Gravis UltraSound]], который аппаратно смешивает голоса трекерной музыки, но работает и на [[soundblaster|Sound Blaster]]. Позже Skaven писал музыку для игр, в том числе для [[ut99|Unreal Tournament]].` },
    { id: 'legacy', title: 'Наследие', content: `Second Reality остаётся эталоном жанра: на неё ссылаются как на доказательство того, что программирование может быть искусством. Многие участники Future Crew ушли в индустрию: основали игровую студию Remedy Entertainment и компанию, создающую тесты производительности видеокарт. На компьютерах конца 1990-х демо работает слишком быстро или с ошибками звука, и поклонники хранят старые машины специально для его запуска.` }
  ],
  seeAlso: ['demoscene', 'gravisgus', 'soundblaster', 'msdos'],
  references: [
    'Future Crew. Second Reality: info file (SECOND.NFO). — 1993.',
    'Assembly \'93: результаты конкурсов. — 1993.'
  ],
  categories: ['Киберкультура', 'Демосцена', 'Компьютерное искусство', '1993 год']
}, {
  title: 'Second Reality (1993 PC Demo)',
  infobox: {
    title: 'Second Reality',
    badgeText: 'Future Crew',
    fields: [
      { label: 'Group', value: 'Future Crew (Finland)' },
      { label: 'Premiere', value: 'Assembly \'93, July 1993' },
      { label: 'Placing', value: '1st in the PC demo competition' },
      { label: 'Platform', value: '[[msdos|MS-DOS]], 386/486, VGA' },
      { label: 'Sound', value: '[[gravisgus|Gravis UltraSound]], [[soundblaster|Sound Blaster]]' },
      { label: 'Music', value: 'Purple Motion, Skaven' },
      { label: 'Length', value: 'about 9 minutes' }
    ]
  },
  lead: `<strong>Second Reality</strong> is a demo by the Finnish group Future Crew, shown at the Assembly '93 festival in summer 1993, where it took first place. Nine minutes of nonstop effects, spinning 3D objects, plasma, a mirrored ball, tunnels and a final flight over a city, set to music by Purple Motion and Skaven, made it the most famous PC demo ever.

Second Reality showed that an ordinary computer with a 386 or 486 could produce graphics then expected only from workstations. For many people it was their first encounter with the [[demoscene|demoscene]].`,
  sections: [
    { id: 'futurecrew', title: 'Future Crew', content: `Future Crew is one of the best-known groups of the PC scene. Its demo Unreal (1992) had already amazed audiences, and Second Reality cemented its fame. Members are known by their handles: coders Psi, Trug and Wildfire, artists Pixel and Marvel, musicians Purple Motion and Skaven. The group also released the Scream Tracker 3 tracker, the popular S3M format and music disks.` },
    { id: 'premiere', title: 'Premiere', content: `The demo was shown at the Assembly '93 festival in Finland. The audience gave it an ovation, and Second Reality won the PC demo competition comfortably. After the festival it spread around the world through [[bbs|BBSes]], FTP archives and CDs, and later appeared on "best software" compilations from computer magazines.` },
    { id: 'effects', title: 'Effects', content: `<ul>
<li>An intro with silhouettes of spaceships and text against the sky.</li>
<li>Transparent glass-like polyhedra (glenz vectors).</li>
<li>Plasma, shimmering waves of color.</li>
<li>A mirrored ball reflecting the scene around it.</li>
<li>Dot tunnels and rotating surfaces.</li>
<li>A final camera flight over a 3D city with a flying ship.</li>
</ul>

Every effect is computed in real time without a 3D accelerator, using only the processor and a VGA card.` },
    { id: 'music', title: 'Music', content: `The music was written by Purple Motion (Jonne Valtonen) and Skaven (Peter Hajba). It sounds best on the [[gravisgus|Gravis UltraSound]], which mixes tracker voices in hardware, but it also works on the [[soundblaster|Sound Blaster]]. Skaven later wrote game music, including for [[ut99|Unreal Tournament]].` },
    { id: 'legacy', title: 'Legacy', content: `Second Reality remains the benchmark of the genre and is cited as proof that programming can be art. Many Future Crew members moved into the industry, founding the game studio Remedy Entertainment and a company that makes video card benchmarks. On late-1990s computers the demo runs too fast or with sound glitches, and fans keep old machines just to run it.` }
  ],
  seeAlso: ['demoscene', 'gravisgus', 'soundblaster', 'msdos'],
  references: [
    'Future Crew. Second Reality info file (SECOND.NFO), 1993.',
    'Assembly \'93 competition results, 1993.'
  ],
  categories: ['Cyberculture', 'Demoscene', 'Computer Art', '1993']
});

window.interpediaReg('dancingbaby', 'culture', {
  title: 'Танцующий младенец (Baby Cha-Cha)',
  infobox: {
    title: 'Танцующий младенец',
    badgeText: 'Baby Cha-Cha',
    fields: [
      { label: 'Авторы анимации', value: 'Майкл Жирар, Роберт Амкраут' },
      { label: 'Год', value: '1996' },
      { label: 'Программа', value: 'Character Studio для 3D Studio MAX' },
      { label: 'Распространение', value: 'электронная почта, веб-страницы' },
      { label: 'Телевидение', value: 'сериал «Элли Макбил» (1998)' },
      { label: 'Мелодия', value: '«Hooked on a Feeling», «ooga-chaka»' }
    ]
  },
  lead: `<strong>Танцующий младенец</strong> (<em>Baby Cha-Cha</em>, «малыш ча-ча-ча») — короткая трёхмерная анимация младенца в подгузнике, танцующего ча-ча-ча, созданная в 1996 году как демонстрационный пример программы Character Studio. Пересылаемый по электронной почте и размещаемый на домашних страницах, младенец стал одним из первых «вирусных» явлений Интернета.

В 1998 году анимация попала на телевидение в сериале «Элли Макбил», где младенец являлся героине под песню «Hooked on a Feeling» с припевом «ooga-chaka». После этого его узнали даже те, кто ни разу не выходил в Сеть.`,
  sections: [
    { id: 'origin', title: 'Происхождение', content: `В 1996 году Майкл Жирар и Роберт Амкраут из компании Unreal Pictures создали анимацию танцующего младенца, чтобы показать возможности модуля Character Studio для пакета 3D Studio MAX. Модуль позволяет управлять «скелетом» персонажа и переносить на него движения. Файл с анимацией входил в комплект примеров.

Аниматор Рон Люсье переделал пример и отправил коллегам. Те переслали дальше — и через несколько месяцев младенец разошёлся по почтовым ящикам всего мира в виде видеофайлов AVI и анимированных GIF-картинок.` },
    { id: 'spread', title: 'Распространение', content: `Танцующий младенец распространялся так, как раньше распространялись только шутки и анекдоты: от человека к человеку. Его вставляли в письма, ставили на [[geocities|домашние страницы]] рядом со счётчиками, переделывали в варианты — младенец в образе Элвиса, младенец-каратист, младенец с бородой. Сайты с коллекциями вариантов собирали тысячи посетителей.

Для многих пользователей конца 1990-х это была первая трёхмерная анимация, которую они увидели на своём компьютере, и первый пример того, как картинка может облететь мир без участия телевидения и газет.` },
    { id: 'tv', title: 'Элли Макбил', content: `В 1998 году создатели американского сериала «Элли Макбил» использовали младенца как видение главной героини — молодой женщины-юриста, которой тикающие «биологические часы» являются в виде танцующего ребёнка. Сцены шли под песню «Hooked on a Feeling» шведской группы Blue Swede с запоминающимся вступлением «ooga-chaka». Младенец появился в рекламе, на футболках и в новостях, превратившись из сетевой шутки в часть массовой культуры.` },
    { id: 'meaning', title: 'Значение', content: `Танцующего младенца вспоминают как пример нового явления: образ, созданный без рекламного бюджета, становится всемирно известным за счёт того, что люди пересылают его друг другу. Подобные «сетевые эпидемии» с тех пор происходят всё чаще — от анимаций [[flash|Flash]] до шуточных сайтов.` }
  ],
  seeAlso: ['flash', 'geocities', 'www', 'blender'],
  references: [
    'Kinetix. Character Studio: Sample Files. — 1996.',
    'Журнал Wired о «танцующем младенце». — 1998.'
  ],
  categories: ['Киберкультура', 'Интернет-явления', 'Компьютерная анимация']
}, {
  title: 'The Dancing Baby (Baby Cha-Cha)',
  infobox: {
    title: 'The Dancing Baby',
    badgeText: 'Baby Cha-Cha',
    fields: [
      { label: 'Animators', value: 'Michael Girard, Robert Amkraut' },
      { label: 'Year', value: '1996' },
      { label: 'Software', value: 'Character Studio for 3D Studio MAX' },
      { label: 'Spread', value: 'email, web pages' },
      { label: 'Television', value: 'Ally McBeal (1998)' },
      { label: 'Tune', value: '"Hooked on a Feeling", "ooga-chaka"' }
    ]
  },
  lead: `The <strong>Dancing Baby</strong> (<em>Baby Cha-Cha</em>) is a short 3D animation of a baby in a diaper dancing the cha-cha, made in 1996 as a demo for the Character Studio software. Forwarded by email and posted on home pages, the baby became one of the first "viral" phenomena of the Internet.

In 1998 the animation reached television in the series Ally McBeal, where the baby appears to the heroine to the song "Hooked on a Feeling" with its "ooga-chaka" chant. After that even people who had never been online recognized it.`,
  sections: [
    { id: 'origin', title: 'Origin', content: `In 1996 Michael Girard and Robert Amkraut of Unreal Pictures created the dancing baby animation to show off the Character Studio plug-in for 3D Studio MAX. The plug-in controls a character's "skeleton" and transfers motion onto it. The animation file was included among the samples.

Animator Ron Lussier reworked the sample and sent it to colleagues. They forwarded it on, and within months the baby had reached inboxes around the world as AVI video files and animated GIFs.` },
    { id: 'spread', title: 'Spread', content: `The Dancing Baby spread the way only jokes used to: from person to person. People put it in emails and on [[geocities|home pages]] next to hit counters and remade it in variations: the baby as Elvis, as a karate fighter, with a beard. Sites collecting the variants drew thousands of visitors.

For many late-1990s users it was the first 3D animation they saw on their own computer, and the first example of a picture circling the world without television or newspapers.` },
    { id: 'tv', title: 'Ally McBeal', content: `In 1998 the makers of the American series Ally McBeal used the baby as a vision of the heroine, a young lawyer whose ticking "biological clock" appears to her as a dancing child. The scenes ran to "Hooked on a Feeling" by the Swedish band Blue Swede with its memorable "ooga-chaka" opening. The baby showed up in ads, on T-shirts and in the news, turning from an online joke into part of popular culture.` },
    { id: 'meaning', title: 'Significance', content: `The Dancing Baby is remembered as an example of something new: an image made with no advertising budget becoming world-famous because people forward it to each other. Such "online epidemics" have become more frequent since, from [[flash|Flash]] animations to joke sites.` }
  ],
  seeAlso: ['flash', 'geocities', 'www', 'blender'],
  references: [
    'Kinetix. Character Studio: Sample Files, 1996.',
    'Wired magazine on the Dancing Baby, 1998.'
  ],
  categories: ['Cyberculture', 'Internet Phenomena', 'Computer Animation']
});

window.interpediaReg('hackermanifesto', 'culture', {
  title: 'Манифест хакера («Совесть хакера»)',
  infobox: {
    title: 'Манифест хакера',
    badgeText: 'The Conscience of a Hacker',
    fields: [
      { label: 'Автор', value: 'The Mentor (Ллойд Бланкеншип)' },
      { label: 'Написан', value: '8 января 1986' },
      { label: 'Опубликован', value: 'журнал Phrack, выпуск 7, сентябрь 1986' },
      { label: 'Язык', value: 'английский' },
      { label: 'Группа автора', value: 'Legion of Doom' },
      { label: 'Известная фраза', value: '«My crime is that of curiosity»' }
    ]
  },
  lead: `<strong>«Совесть хакера»</strong> (<em>The Conscience of a Hacker</em>), известная как <strong>Манифест хакера</strong>, — короткий текст, написанный американским хакером под псевдонимом The Mentor вскоре после его ареста в январе 1986 года и опубликованный в электронном журнале Phrack. В нём автор объясняет, что движет подростками, проводящими ночи за компьютером и модемом: не жажда наживы, а любопытство и желание свободного знания.

Манифест стал одним из самых цитируемых текстов компьютерной субкультуры. Его переводят, вешают на стены и вставляют в подписи к сообщениям, а фраза «Моё преступление — любопытство» знакома каждому, кто интересуется историей хакерства.`,
  sections: [
    { id: 'author', title: 'Автор', content: `The Mentor — псевдоним Ллойда Бланкеншипа, участника известной хакерской группы Legion of Doom. Текст был написан 8 января 1986 года, вскоре после ареста автора, и опубликован 25 сентября 1986 года в седьмом выпуске Phrack — электронного журнала, который распространялся через [[bbs|BBS]] в виде текстовых файлов.

Позднее Бланкеншип работал в компании Steve Jackson Games, где писал книгу правил GURPS Cyberpunk для настольных ролевых игр. В марте 1990 года Секретная служба США провела у компании обыск и изъяла компьютеры, сочтя будущую книгу «руководством по компьютерным преступлениям». Суд позже признал действия властей незаконными, а сама история привела к созданию Фонда электронных рубежей (EFF), защищающего свободы в Сети.` },
    { id: 'text', title: 'Содержание', content: `Манифест написан от первого лица. Автор описывает школьника, которому скучно на уроках, и учителей, не понимающих его. Однажды он открывает для себя компьютер — машину, которая делает то, что ей говорят, и не осуждает, — а затем модем, через который «электронный импульс» ведёт его в мир людей с теми же интересами.

<blockquote>«Это наш мир теперь… мир электрона и переключателя, красоты бода… Да, я преступник. Моё преступление — любопытство. Моё преступление в том, что я сужу людей по тому, что они говорят и думают, а не по тому, как они выглядят… Вы можете остановить одного из нас, но вы не остановите нас всех… ведь мы все одинаковые».</blockquote>` },
    { id: 'ethic', title: 'Хакерская этика', content: `Манифест опирается на представления, сложившиеся в среде программистов ещё в 1960–1970-х годах и описанные журналистом Стивеном Леви в книге «Хакеры: герои компьютерной революции» (1984): информация должна быть свободной, доступ к компьютерам — неограниченным, а о человеке судят по его делам, а не по возрасту или положению. В 1980-х слово «хакер» в прессе стало означать взломщика, и многие программисты различают «хакеров» — любознательных мастеров — и «крэкеров», взламывающих системы ради выгоды или разрушения.` },
    { id: 'culture', title: 'В культуре', content: `Цитаты из манифеста звучат в фильме «Хакеры» (1995). Текст переведён на десятки языков, в том числе на русский, и распространяется в конференциях [[fidonet|ФидоНета]] и на хакерских сайтах. В 1999 году в России начал выходить журнал «Хакер», сделавший тему компьютерной смекалки и сетевой безопасности массовой.

Критики напоминают, что за романтикой манифеста стоят реальные незаконные действия, а подростковое любопытство не оправдывает вторжения в чужие системы. Сторонники видят в нём прежде всего защиту права на знание.` }
  ],
  seeAlso: ['cyberpunk', 'bbs', 'fidonet', 'usenet'],
  references: [
    'The Mentor. The Conscience of a Hacker // Phrack. — 1986. — Т. 1, вып. 7, файл 3.',
    'Levy S. Hackers: Heroes of the Computer Revolution. — Doubleday, 1984.',
    'Sterling B. The Hacker Crackdown. — Bantam, 1992.'
  ],
  categories: ['Киберкультура', 'Хакеры', 'Компьютерная безопасность']
}, {
  title: 'The Hacker Manifesto (Conscience of a Hacker)',
  infobox: {
    title: 'The Hacker Manifesto',
    badgeText: 'The Conscience of a Hacker',
    fields: [
      { label: 'Author', value: 'The Mentor (Loyd Blankenship)' },
      { label: 'Written', value: 'January 8, 1986' },
      { label: 'Published', value: 'Phrack magazine, issue 7, September 1986' },
      { label: 'Language', value: 'English' },
      { label: 'Author\'s group', value: 'Legion of Doom' },
      { label: 'Famous line', value: '"My crime is that of curiosity"' }
    ]
  },
  lead: `<strong>"The Conscience of a Hacker"</strong>, known as the <strong>Hacker Manifesto</strong>, is a short text written by an American hacker known as The Mentor shortly after his arrest in January 1986 and published in the electronic magazine Phrack. In it the author explains what drives teenagers who spend their nights with a computer and a modem: not greed, but curiosity and the desire for free knowledge.

The manifesto became one of the most quoted texts of computer subculture. It is translated, hung on walls and put in message signatures, and the line "My crime is that of curiosity" is known to everyone interested in hacker history.`,
  sections: [
    { id: 'author', title: 'The author', content: `The Mentor is the handle of Loyd Blankenship, a member of the well-known hacker group Legion of Doom. The text was written on January 8, 1986, shortly after his arrest, and published on September 25, 1986, in the seventh issue of Phrack, an electronic magazine distributed through [[bbs|BBSes]] as text files.

Blankenship later worked at Steve Jackson Games, where he wrote the GURPS Cyberpunk rulebook for tabletop role-playing. In March 1990 the US Secret Service raided the company and seized its computers, treating the forthcoming book as a "handbook for computer crime". A court later ruled the government's actions unlawful, and the affair led to the founding of the Electronic Frontier Foundation (EFF), which defends freedoms online.` },
    { id: 'text', title: 'Content', content: `The manifesto is written in the first person. The author describes a schoolboy bored in class and teachers who do not understand him. One day he discovers the computer, a machine that does what it is told and does not judge, and then the modem, through which "an electronic pulse" leads him into a world of people with the same interests.

<blockquote>"This is our world now... the world of the electron and the switch, the beauty of the baud... Yes, I am a criminal. My crime is that of curiosity. My crime is that of judging people by what they say and think, not what they look like... You may stop this individual, but you can't stop us all... after all, we're all alike."</blockquote>` },
    { id: 'ethic', title: 'The hacker ethic', content: `The manifesto draws on ideas that took shape among programmers in the 1960s and 1970s and were described by journalist Steven Levy in Hackers: Heroes of the Computer Revolution (1984): information should be free, access to computers should be unlimited, and people should be judged by what they do, not by age or status. In the 1980s the press began using "hacker" to mean an intruder, and many programmers distinguish "hackers", curious craftsmen, from "crackers", who break into systems for profit or destruction.` },
    { id: 'culture', title: 'In culture', content: `Lines from the manifesto are heard in the film Hackers (1995). The text has been translated into dozens of languages, Russian included, and circulates in [[fidonet|FidoNet]] echoes and on hacker sites. In 1999 the magazine Khaker began publishing in Russia, bringing computer savvy and network security to a mass audience.

Critics point out that behind the manifesto's romance lie real illegal acts, and teenage curiosity does not justify breaking into other people's systems. Supporters see it above all as a defense of the right to knowledge.` }
  ],
  seeAlso: ['cyberpunk', 'bbs', 'fidonet', 'usenet'],
  references: [
    'The Mentor. "The Conscience of a Hacker". Phrack, vol. 1, issue 7, file 3, 1986.',
    'Levy, S. Hackers: Heroes of the Computer Revolution. Doubleday, 1984.',
    'Sterling, B. The Hacker Crackdown. Bantam, 1992.'
  ],
  categories: ['Cyberculture', 'Hackers', 'Computer Security']
});

window.interpediaReg('cyberpunk', 'culture', {
  title: 'Киберпанк',
  infobox: {
    title: 'Киберпанк',
    badgeText: 'High tech, low life',
    fields: [
      { label: 'Термин', value: 'Брюс Бетке, рассказ «Киберпанк» (1983)' },
      { label: 'Ключевой роман', value: '«Нейромант» Уильяма Гибсона (1984)' },
      { label: 'Слово «киберпространство»', value: 'Гибсон, «Сожжение Хром» (1982)' },
      { label: 'Антология', value: '«Зеркальные очки», ред. Брюс Стерлинг (1986)' },
      { label: 'Кино', value: '«Бегущий по лезвию», «Акира», «Матрица»' },
      { label: 'Игры', value: '[[systemshock2|System Shock]], Syndicate, Shadowrun' }
    ]
  },
  lead: `<strong>Киберпанк</strong> — направление научной фантастики, возникшее в начале 1980-х годов: мир недалёкого будущего, где высокие технологии соседствуют с бедностью и распадом общества. Его герои — хакеры, наёмники и изгои, живущие в тени всемогущих корпораций, с имплантатами в теле и выходом в виртуальное «киберпространство».

Слово «киберпространство» придумал Уильям Гибсон, а роман «Нейромант» (1984) стал главной книгой жанра. К концу 1990-х эстетика киберпанка — зелёные символы на чёрном экране, тёмные очки, неоновые вывески под дождём — стала частью массовой культуры, а фильм «Матрица» (1999) сделал её мировым хитом.`,
  sections: [
    { id: 'origins', title: 'Происхождение', content: `Термин появился в 1983 году как название рассказа Брюса Бетке о подростках-хакерах. Критик Гарднер Дозуа подхватил слово, чтобы описать новую волну писателей — Уильяма Гибсона, Брюса Стерлинга, Руди Рюкера, Джона Ширли и Пэт Кэдиган. В 1986 году Стерлинг собрал антологию «Зеркальные очки», предисловие к которой стало манифестом направления.

Важнейшие визуальные образы задал фильм Ридли Скотта «Бегущий по лезвию» (1982) с его дождливым мегаполисом и рекламными экранами на небоскрёбах.` },
    { id: 'themes', title: 'Темы', content: `<ul>
<li><strong>Корпорации</strong> сильнее государств и диктуют законы.</li>
<li><strong>Киберпространство</strong> — общая виртуальная реальность компьютерных сетей, в которую герои «подключаются» напрямую.</li>
<li><strong>Тело и машина</strong> — импланты, протезы, усиления; граница между человеком и компьютером размывается.</li>
<li><strong>Искусственный интеллект</strong>, стремящийся к свободе, как в «Нейроманте» или в образе SHODAN из [[systemshock2|System Shock]].</li>
<li><strong>Улица</strong> — «у улицы своё применение для вещей»: технологии попадают к тем, для кого их не создавали.</li>
</ul>` },
    { id: 'works', title: 'Ключевые произведения', content: `<table class="interpedia-wikitable">
<tr><th>Произведение</th><th>Год</th><th>Тип</th></tr>
<tr><td>«Бегущий по лезвию»</td><td>1982</td><td>фильм</td></tr>
<tr><td>«Нейромант» (Гибсон)</td><td>1984</td><td>роман</td></tr>
<tr><td>«Акира» (Отомо)</td><td>1988</td><td>аниме</td></tr>
<tr><td>«Лавина» (Стивенсон)</td><td>1992</td><td>роман</td></tr>
<tr><td>«Призрак в доспехах» (Осии)</td><td>1995</td><td>аниме</td></tr>
<tr><td>«Хакеры», «Джонни-мнемоник»</td><td>1995</td><td>фильмы</td></tr>
<tr><td>«Матрица» (Вачовски)</td><td>1999</td><td>фильм</td></tr>
</table>` },
    { id: 'games', title: 'Киберпанк в играх', content: `Настольные ролевые игры Cyberpunk 2020 и Shadowrun (1989) перенесли жанр за игровой стол. На компьютерах вышли Neuromancer (1988) по роману Гибсона, тактическая стратегия Syndicate (1993) о войне корпораций и [[systemshock2|System Shock]] (1994) с безумным искусственным интеллектом. Студия Ion Storm готовит Deus Ex — игру о заговорах и наноимплантатах на движке [[unreal|Unreal]].` },
    { id: 'matrix', title: '«Матрица»', content: `Фильм «Матрица», вышедший в марте 1999 года, стал главным событием года для поклонников жанра: хакер Нео узнаёт, что привычный мир — компьютерная симуляция. Замедленные перестрелки, чёрные плащи и «падающий» зелёный код на экранах вдохновили тысячи заставок, обоев рабочего стола и домашних страниц. Заставка «Матрица» — одна из самых популярных загрузок 1999 года.` },
    { id: 'russia', title: 'Киберпанк в России', content: `Книги Гибсона и Стерлинга вышли в русских переводах в 1990-х. Отечественный ответ — роман Сергея Лукьяненко «Лабиринт отражений» (1997) о виртуальном городе Диптауне и «дайверах», умеющих выходить из виртуальности по своей воле, и его продолжение «Фальшивые зеркала» (1999). Книги стали популярны у читателей [[fidonet|ФидоНета]] и посетителей интернет-кафе, во многом угадав их повседневность.` }
  ],
  seeAlso: ['hackermanifesto', 'systemshock2', 'bbs', 'www'],
  references: [
    'Gibson W. Neuromancer. — Ace Books, 1984.',
    'Sterling B. (ред.) Mirrorshades: The Cyberpunk Anthology. — Arbor House, 1986.',
    'Лукьяненко С. Лабиринт отражений. — М.: АСТ, 1997.'
  ],
  links: [['http://www.themeworld98.com', 'ThemeWorld \'98: заставка с падающим кодом']],
  categories: ['Киберкультура', 'Научная фантастика', 'Киберпанк']
}, {
  title: 'Cyberpunk & Cyberspace',
  infobox: {
    title: 'Cyberpunk',
    badgeText: 'High tech, low life',
    fields: [
      { label: 'Term', value: 'Bruce Bethke, short story "Cyberpunk" (1983)' },
      { label: 'Key novel', value: 'William Gibson\'s Neuromancer (1984)' },
      { label: 'The word "cyberspace"', value: 'Gibson, "Burning Chrome" (1982)' },
      { label: 'Anthology', value: 'Mirrorshades, ed. Bruce Sterling (1986)' },
      { label: 'Film', value: 'Blade Runner, Akira, The Matrix' },
      { label: 'Games', value: '[[systemshock2|System Shock]], Syndicate, Shadowrun' }
    ]
  },
  lead: `<strong>Cyberpunk</strong> is a branch of science fiction that emerged in the early 1980s: a near-future world where high technology sits alongside poverty and social decay. Its heroes are hackers, mercenaries and outcasts living in the shadow of all-powerful corporations, with implants in their bodies and access to a virtual "cyberspace".

The word "cyberspace" was coined by William Gibson, and his novel Neuromancer (1984) became the genre's central book. By the late 1990s the cyberpunk aesthetic, green symbols on a black screen, dark glasses, neon signs in the rain, had become part of popular culture, and the film The Matrix (1999) made it a worldwide hit.`,
  sections: [
    { id: 'origins', title: 'Origins', content: `The term appeared in 1983 as the title of a Bruce Bethke story about teenage hackers. Editor Gardner Dozois picked up the word to describe a new wave of writers: William Gibson, Bruce Sterling, Rudy Rucker, John Shirley and Pat Cadigan. In 1986 Sterling assembled the anthology Mirrorshades, whose preface became the movement's manifesto.

The key visual images came from Ridley Scott's Blade Runner (1982), with its rainy megacity and advertising screens on skyscrapers.` },
    { id: 'themes', title: 'Themes', content: `<ul>
<li><strong>Corporations</strong> are stronger than states and dictate the law.</li>
<li><strong>Cyberspace</strong> is the shared virtual reality of computer networks that heroes "jack into" directly.</li>
<li><strong>Body and machine</strong>: implants, prosthetics, enhancements blur the line between human and computer.</li>
<li><strong>Artificial intelligence</strong> seeking freedom, as in Neuromancer or SHODAN in [[systemshock2|System Shock]].</li>
<li><strong>The street</strong>: "the street finds its own uses for things", and technology reaches people it was never made for.</li>
</ul>` },
    { id: 'works', title: 'Key works', content: `<table class="interpedia-wikitable">
<tr><th>Work</th><th>Year</th><th>Type</th></tr>
<tr><td>Blade Runner</td><td>1982</td><td>film</td></tr>
<tr><td>Neuromancer (Gibson)</td><td>1984</td><td>novel</td></tr>
<tr><td>Akira (Otomo)</td><td>1988</td><td>anime</td></tr>
<tr><td>Snow Crash (Stephenson)</td><td>1992</td><td>novel</td></tr>
<tr><td>Ghost in the Shell (Oshii)</td><td>1995</td><td>anime</td></tr>
<tr><td>Hackers, Johnny Mnemonic</td><td>1995</td><td>films</td></tr>
<tr><td>The Matrix (Wachowskis)</td><td>1999</td><td>film</td></tr>
</table>` },
    { id: 'games', title: 'Cyberpunk in games', content: `The tabletop role-playing games Cyberpunk 2020 and Shadowrun (1989) brought the genre to the gaming table. On computers came Neuromancer (1988), based on Gibson's novel, the tactical strategy game Syndicate (1993) about corporate war, and [[systemshock2|System Shock]] (1994) with its insane AI. Ion Storm is preparing Deus Ex, a game of conspiracies and nano-implants on the [[unreal|Unreal]] engine.` },
    { id: 'matrix', title: 'The Matrix', content: `The Matrix, released in March 1999, was the year's big event for genre fans: the hacker Neo learns that the familiar world is a computer simulation. Slow-motion gunfights, black coats and the "falling" green code on screens inspired thousands of screensavers, wallpapers and home pages. A Matrix screensaver is one of the most popular downloads of 1999.` },
    { id: 'russia', title: 'Cyberpunk in Russia', content: `Gibson's and Sterling's books came out in Russian translation in the 1990s. The Russian answer is Sergei Lukyanenko's novel Labyrinth of Reflections (1997), about the virtual city of Deeptown and "divers" who can leave virtual reality at will, and its sequel False Mirrors (1999). The books became popular with [[fidonet|FidoNet]] readers and Internet cafe regulars, in many ways predicting their everyday life.` }
  ],
  seeAlso: ['hackermanifesto', 'systemshock2', 'bbs', 'www'],
  references: [
    'Gibson, W. Neuromancer. Ace Books, 1984.',
    'Sterling, B. (ed.) Mirrorshades: The Cyberpunk Anthology. Arbor House, 1986.',
    'Lukyanenko, S. Labirint otrazheniy. Moscow: AST, 1997.'
  ],
  links: [['http://www.themeworld98.com', 'ThemeWorld \'98: falling code screensaver']],
  categories: ['Cyberculture', 'Science Fiction', 'Cyberpunk']
});

window.interpediaReg('bbs', 'culture', {
  title: 'Электронные доски объявлений (BBS)',
  infobox: {
    title: 'BBS',
    badgeText: 'Bulletin Board System',
    fields: [
      { label: 'Первая BBS', value: 'CBBS, Чикаго, 16 февраля 1978' },
      { label: 'Авторы', value: 'Уорд Кристенсен, Рэнди Сьюсс' },
      { label: 'Связь', value: 'телефонная линия и [[modem56k|модем]]' },
      { label: 'Программы для BBS', value: 'PCBoard, Wildcat!, RemoteAccess, Maximus, WWIV' },
      { label: 'Терминалы', value: 'Telix, Terminate, Telemate, HyperTerminal' },
      { label: 'Протоколы передачи', value: 'Xmodem, Ymodem, Zmodem' },
      { label: 'Сети', value: '[[fidonet|FidoNet]] и др.' }
    ]
  },
  lead: `<strong>BBS</strong> (<em>Bulletin Board System</em>, электронная доска объявлений) — компьютер с модемом и специальной программой, к которому пользователи дозваниваются по телефону, чтобы читать и писать сообщения, скачивать файлы и играть в текстовые игры. Обычно BBS держит на домашнем компьютере один энтузиаст — сисоп (системный оператор).

С конца 1970-х до середины 1990-х годов BBS были главным местом встреч компьютерных людей. Многие из них объединились в [[fidonet|ФидоНет]]. С приходом Интернета число BBS сокращается, но тысячи станций всё ещё работают, а их культура — ANSI-графика, «двери» с играми, файловые архивы — продолжает жить.`,
  sections: [
    { id: 'history', title: 'История', content: `Первую BBS, CBBS (Computerized Bulletin Board System), создали Уорд Кристенсен и Рэнди Сьюсс в Чикаго. Работу над ней они начали во время сильной метели в январе 1978 года и запустили систему 16 февраля. Кристенсен также придумал протокол передачи файлов Xmodem. С распространением персональных компьютеров и дешёвых модемов в 1980-х BBS появились тысячами по всему миру.` },
    { id: 'how', title: 'Как устроена BBS', content: `Пользователь запускает терминальную программу и набирает номер BBS. После соединения на экране появляется заставка, нарисованная символами, и запрос имени и пароля. Затем открывается меню:

<pre>[M] Сообщения     [F] Файлы
[D] Двери (игры)  [C] Позвать сисопа
[B] Бюллетени     [G] Выход</pre>

У большинства BBS одна или несколько телефонных линий, поэтому одновременно на станции может находиться лишь несколько человек, а время сеанса ограничено. Чтобы скачивать файлы, нередко нужно поддерживать «рейтинг»: закачать на станцию что-то своё.` },
    { id: 'features', title: 'Возможности', content: `<dl>
<dt>Сообщения</dt><dd>локальные конференции и эхоконференции сетей вроде [[fidonet|ФидоНета]].</dd>
<dt>Файловые области</dt><dd>shareware-программы, игры, драйверы, тексты, [[demoscene|демо]] и музыка.</dd>
<dt>Двери</dt><dd>внешние программы, запускаемые из BBS, прежде всего текстовые игры: Legend of the Red Dragon, TradeWars 2002 и другие, в которые пользователи играют по очереди, по несколько ходов в день.</dd>
<dt>Чат с сисопом</dt><dd>пользователь может «позвать» сисопа, и тот, если не спит, отвечает прямо в терминале.</dd>
</dl>` },
    { id: 'ansi', title: 'ANSI-графика', content: `Заставки и меню BBS рисуют цветными символами ANSI — блоками, полосками и рамками из набора символов IBM PC. Сложилась целая школа ANSI-художников, объединённых в группы вроде ACiD Productions и iCE, которые ежемесячно выпускают «паки» своих работ. ANSI-графика близка к [[demoscene|демосцене]], и многие художники работают в обоих направлениях.` },
    { id: 'russia', title: 'BBS в России', content: `В России BBS расцвели в начале и середине 1990-х, когда Интернет был редкостью, а модем на 2400 бод — завидным приобретением. Станции работали по ночам на домашних телефонах сисопов и служили главными источниками программ, игр и новостей. Многие из них входят в [[fidonet|ФидоНет]], а их сисопы составляют ядро российского компьютерного сообщества.` },
    { id: 'decline', title: 'BBS и Интернет', content: `С распространением Интернета пользователи переходят на веб-сайты, [[usenet|Usenet]] и [[irc|IRC]], где не нужно ждать свободной линии. Многие BBS закрылись, и вместе с ними исчезли их файловые архивы и переписка. Оставшиеся станции подключаются к Интернету через telnet, а энтузиасты собирают архивы текстов и ANSI-графики, чтобы сохранить историю.` }
  ],
  seeAlso: ['fidonet', 'modem56k', 'usenet', 'irc', 'demoscene'],
  references: [
    'Christensen W., Suess R. Hobbyist Computerized Bulletin Board // Byte. — 1978. — Ноябрь.',
    'Jennings T. FidoNet History and Operation. — 1985.',
    'Rheingold H. The Virtual Community. — Addison-Wesley, 1993.'
  ],
  links: [['http://fido.relcom.ru', 'ФидоНет через WWW']],
  categories: ['Киберкультура', 'BBS', 'Сетевые сообщества']
}, {
  title: 'Bulletin Board Systems (BBS)',
  infobox: {
    title: 'BBS',
    badgeText: 'Bulletin Board System',
    fields: [
      { label: 'First BBS', value: 'CBBS, Chicago, February 16, 1978' },
      { label: 'Creators', value: 'Ward Christensen, Randy Suess' },
      { label: 'Connection', value: 'phone line and [[modem56k|modem]]' },
      { label: 'BBS software', value: 'PCBoard, Wildcat!, RemoteAccess, Maximus, WWIV' },
      { label: 'Terminals', value: 'Telix, Terminate, Telemate, HyperTerminal' },
      { label: 'Transfer protocols', value: 'Xmodem, Ymodem, Zmodem' },
      { label: 'Networks', value: '[[fidonet|FidoNet]] and others' }
    ]
  },
  lead: `A <strong>BBS</strong> (<em>Bulletin Board System</em>) is a computer with a modem and special software that users dial by phone to read and write messages, download files and play text games. A BBS is usually run on a home computer by a single enthusiast, the sysop (system operator).

From the late 1970s to the mid-1990s, BBSes were the main meeting place for computer people. Many of them joined together in [[fidonet|FidoNet]]. With the arrival of the Internet the number of BBSes is shrinking, but thousands still run, and their culture, ANSI art, game "doors" and file archives, lives on.`,
  sections: [
    { id: 'history', title: 'History', content: `The first BBS, CBBS (Computerized Bulletin Board System), was created by Ward Christensen and Randy Suess in Chicago. They began work during a heavy blizzard in January 1978 and launched the system on February 16. Christensen also devised the Xmodem file transfer protocol. As personal computers and cheap modems spread in the 1980s, BBSes appeared by the thousands around the world.` },
    { id: 'how', title: 'How a BBS works', content: `The user starts a terminal program and dials the BBS. After connecting, a title screen drawn in characters appears, along with a prompt for name and password. Then a menu opens:

<pre>[M] Messages      [F] Files
[D] Doors (games) [C] Page sysop
[B] Bulletins     [G] Goodbye</pre>

Most BBSes have one or a few phone lines, so only a few people can be on at once, and session time is limited. Downloading often requires keeping a "ratio" by uploading something of your own.` },
    { id: 'features', title: 'Features', content: `<dl>
<dt>Messages</dt><dd>local conferences and echoes from networks such as [[fidonet|FidoNet]].</dd>
<dt>File areas</dt><dd>shareware, games, drivers, texts, [[demoscene|demos]] and music.</dd>
<dt>Doors</dt><dd>external programs launched from the BBS, above all text games such as Legend of the Red Dragon and TradeWars 2002, played in turns, a few moves a day.</dd>
<dt>Sysop chat</dt><dd>a user can "page" the sysop, who, if awake, answers right in the terminal.</dd>
</dl>` },
    { id: 'ansi', title: 'ANSI art', content: `BBS title screens and menus are drawn with colored ANSI characters, blocks, bars and frames from the IBM PC character set. A whole school of ANSI artists grew up, organized in groups such as ACiD Productions and iCE, which release monthly "packs" of their work. ANSI art is close to the [[demoscene|demoscene]], and many artists work in both.` },
    { id: 'russia', title: 'BBSes in Russia', content: `In Russia BBSes flourished in the early and mid-1990s, when the Internet was rare and a 2400-baud modem was an enviable purchase. Stations ran at night on sysops' home phones and were the main source of software, games and news. Many belong to [[fidonet|FidoNet]], and their sysops form the core of the Russian computer community.` },
    { id: 'decline', title: 'BBSes and the Internet', content: `As the Internet spreads, users move to websites, [[usenet|Usenet]] and [[irc|IRC]], where there is no waiting for a free line. Many BBSes have closed, and their file archives and correspondence vanished with them. The remaining stations connect to the Internet via telnet, and enthusiasts collect archives of texts and ANSI art to preserve the history.` }
  ],
  seeAlso: ['fidonet', 'modem56k', 'usenet', 'irc', 'demoscene'],
  references: [
    'Christensen, W., Suess, R. "Hobbyist Computerized Bulletin Board". Byte, November 1978.',
    'Jennings, T. FidoNet History and Operation, 1985.',
    'Rheingold, H. The Virtual Community. Addison-Wesley, 1993.'
  ],
  links: [['http://fido.relcom.ru', 'FidoNet on the Web']],
  categories: ['Cyberculture', 'BBS', 'Online Communities']
});

window.interpediaReg('bsod', 'culture', {
  title: 'Синий экран смерти (BSOD)',
  infobox: {
    title: 'Синий экран смерти',
    badgeText: 'Blue Screen of Death',
    fields: [
      { label: 'Где встречается', value: 'Win 3.x, Win 9x, Win NT' },
      { label: 'Цвета', value: 'белый текст на синем фоне' },
      { label: 'Режим', value: 'текстовый, 80 × 25 символов' },
      { label: 'Типичная ошибка Win 9x', value: 'Fatal exception 0E (ошибка страницы)' },
      { label: 'Типичная ошибка NT', value: 'STOP 0x0000000A (IRQL_NOT_LESS_OR_EQUAL)' },
      { label: 'Самый известный случай', value: 'COMDEX, 20 апреля 1998' }
    ]
  },
  lead: `<strong>Синий экран смерти</strong> (<em>Blue Screen of Death</em>, BSOD) — шутливое название экрана с сообщением о критической ошибке в системах семейства Win. Когда программа или драйвер совершает недопустимое действие, система переключается в текстовый режим и показывает белый текст на синем фоне с кодом ошибки и адресом, после чего пользователю остаётся лишь нажать клавишу или перезагрузить компьютер.

Синий экран стал символом ненадёжности персональных компьютеров 1990-х и героем бесчисленных шуток. Самый известный случай произошёл на выставке COMDEX в 1998 году, когда [[windows98|Win 98]] «упала» прямо во время презентации Билла Гейтса.`,
  sections: [
    { id: 'win9x', title: 'Синий экран в Win 9x', content: `В [[windows95|Win 95]] и [[windows98|Win 98]] синий экран появляется при исключении в драйвере или в 16-разрядной части системы. Типичное сообщение выглядит так:

<pre>Win
A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) +
00010E36. The current application will be terminated.

*  Press any key to terminate the current application.
*  Press CTRL+ALT+DEL again to restart your computer. You will
   lose any unsaved information in all applications.

Press any key to continue _</pre>

Код 0E означает ошибку страницы памяти, 0D — общую ошибку защиты, 06 — недопустимую команду. Нередко после нажатия клавиши система продолжает работу, но уже нестабильно, и лучшее решение — сохранить документы и перезагрузиться.` },
    { id: 'nt', title: 'Синий экран в NT', content: `В [[winnt4|Win NT]] синий экран означает остановку всей системы: ядро обнаружило ошибку, после которой продолжать работу опасно. Экран содержит код STOP, например <code>0x0000000A IRQL_NOT_LESS_OR_EQUAL</code>, список загруженных драйверов и содержимое стека. Система может записать дамп памяти на диск для последующего анализа и автоматически перезагрузиться. Администраторы узнают по коду ошибки виновный драйвер.` },
    { id: 'causes', title: 'Причины', content: `<ul>
<li><strong>Драйверы.</strong> Ошибки в драйверах видеокарт, звуковых плат, сетевых карт и сканеров — самая частая причина.</li>
<li><strong>Неисправная память.</strong> Дефектные модули ОЗУ вызывают случайные синие экраны в самых разных местах.</li>
<li><strong>[[overclocking|Разгон]].</strong> Процессор или видеокарта на повышенной частоте сбоят при нагреве.</li>
<li><strong>Конфликты оборудования</strong> — два устройства на одном прерывании.</li>
<li><strong>Повреждённые системные файлы</strong> после неудачной установки программ.</li>
</ul>` },
    { id: 'comdex', title: 'Случай на COMDEX', content: `20 апреля 1998 года на выставке COMDEX в Чикаго Билл Гейтс показывал Win 98. Ассистент подключил к компьютеру сканер через USB, и на огромном экране вместо установки драйвера появился синий экран. Гейтс пошутил: «Должно быть, поэтому мы ещё не выпустили Win 98». Видео с этим моментом показали новости по всему миру.` },
    { id: 'culture', title: 'В культуре', content: `Синий экран стал частью компьютерного фольклора. Пользователи сочиняют стихи и хокку о сбоях, рисуют синий экран на открытках и футболках, существуют заставки, имитирующие его для розыгрыша коллег. Выражение «словить синий экран» понятно любому пользователю Win, а аббревиатура BSOD — одна из самых известных в компьютерном сленге.` }
  ],
  seeAlso: ['windows98', 'winnt4', 'overclocking', 'windows95'],
  references: [
    'Microslop Knowledge Base: Fatal exception errors in Win 95/98.',
    'Microslop Win NT Workstation Resource Kit: Troubleshooting STOP errors. — 1996.',
    'Видеозапись презентации Win 98 на COMDEX. — Чикаго, 20 апреля 1998.'
  ],
  categories: ['Киберкультура', 'Win', 'Компьютерный юмор']
}, {
  title: 'Blue Screen of Death (BSOD)',
  infobox: {
    title: 'Blue Screen of Death',
    badgeText: 'BSOD',
    fields: [
      { label: 'Found in', value: 'Win 3.x, Win 9x, Win NT' },
      { label: 'Colors', value: 'white text on blue' },
      { label: 'Mode', value: 'text mode, 80 × 25 characters' },
      { label: 'Typical Win 9x error', value: 'Fatal exception 0E (page fault)' },
      { label: 'Typical NT error', value: 'STOP 0x0000000A (IRQL_NOT_LESS_OR_EQUAL)' },
      { label: 'Most famous case', value: 'COMDEX, April 20, 1998' }
    ]
  },
  lead: `The <strong>Blue Screen of Death</strong> (BSOD) is the joking name for the critical error screen in the Win family of systems. When a program or driver does something illegal, the system switches to text mode and shows white text on blue with an error code and address, leaving the user to press a key or reboot.

The blue screen became a symbol of the unreliability of 1990s personal computers and the subject of countless jokes. The most famous case came at COMDEX in 1998, when [[windows98|Win 98]] crashed right in the middle of Bill Gates's presentation.`,
  sections: [
    { id: 'win9x', title: 'The blue screen in Win 9x', content: `In [[windows95|Win 95]] and [[windows98|Win 98]] the blue screen appears on an exception in a driver or in the 16-bit part of the system. A typical message looks like this:

<pre>Win
A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) +
00010E36. The current application will be terminated.

*  Press any key to terminate the current application.
*  Press CTRL+ALT+DEL again to restart your computer. You will
   lose any unsaved information in all applications.

Press any key to continue _</pre>

Code 0E means a page fault, 0D a general protection fault and 06 an invalid opcode. Often the system keeps running after a key press, but unstably, and the best course is to save documents and reboot.` },
    { id: 'nt', title: 'The blue screen in NT', content: `In [[winnt4|Win NT]] a blue screen means the whole system has stopped: the kernel found an error after which continuing is dangerous. The screen shows a STOP code such as <code>0x0000000A IRQL_NOT_LESS_OR_EQUAL</code>, a list of loaded drivers and a stack dump. The system can write a memory dump to disk for later analysis and reboot automatically. Administrators identify the guilty driver from the error code.` },
    { id: 'causes', title: 'Causes', content: `<ul>
<li><strong>Drivers.</strong> Bugs in video, sound, network and scanner drivers are the most common cause.</li>
<li><strong>Faulty memory.</strong> Defective RAM modules cause random blue screens in all sorts of places.</li>
<li><strong>[[overclocking|Overclocking]].</strong> A processor or video card at a raised clock fails as it heats up.</li>
<li><strong>Hardware conflicts</strong>: two devices on one interrupt.</li>
<li><strong>Damaged system files</strong> after a failed software installation.</li>
</ul>` },
    { id: 'comdex', title: 'The COMDEX incident', content: `On April 20, 1998, at COMDEX in Chicago, Bill Gates was demonstrating Win 98. An assistant plugged a scanner in over USB, and instead of a driver installation the giant screen showed a blue screen. Gates joked: "That must be why we're not shipping Win 98 yet." Footage of the moment ran on news broadcasts around the world.` },
    { id: 'culture', title: 'In culture', content: `The blue screen became part of computer folklore. Users write poems and haiku about crashes, put the blue screen on postcards and T-shirts, and there are screensavers that imitate it to prank coworkers. "Getting a blue screen" is understood by every Win user, and BSOD is one of the best-known abbreviations in computer slang.` }
  ],
  seeAlso: ['windows98', 'winnt4', 'overclocking', 'windows95'],
  references: [
    'Microslop Knowledge Base: Fatal exception errors in Win 95/98.',
    'Microslop Win NT Workstation Resource Kit: Troubleshooting STOP errors, 1996.',
    'Video of the Win 98 presentation at COMDEX, Chicago, April 20, 1998.'
  ],
  categories: ['Cyberculture', 'Win', 'Computer Humor']
});

window.interpediaReg('overclocking', 'culture', {
  title: 'Оверклокинг (разгон процессоров)',
  infobox: {
    title: 'Оверклокинг',
    badgeText: 'Разгон',
    fields: [
      { label: 'Суть', value: 'работа комплектующих на частоте выше штатной' },
      { label: 'Способы', value: 'частота шины, множитель, напряжение' },
      { label: 'Легенда', value: '[[celeron300a|Celeron 300A]] на 450 МГц' },
      { label: 'Видеокарты', value: '[[voodoo2|Voodoo 2]], [[rivatnt|TNT2]]' },
      { label: 'Охлаждение', value: 'радиаторы, вентиляторы, элементы Пельтье' },
      { label: 'Тесты', value: 'Quake II timedemo, Final Reality, 3DMark99' },
      { label: 'Риски', value: 'сбои, перегрев, повреждение, потеря гарантии' }
    ]
  },
  lead: `<strong>Оверклокинг</strong> (от англ. <em>overclocking</em>), или <strong>разгон</strong>, — повышение рабочей частоты процессора, видеокарты или памяти выше значения, указанного производителем. Производители выпускают чипы с запасом прочности, и энтузиасты пользуются им, чтобы бесплатно получить прибавку скорости в играх и программах.

В 1998–1999 годах разгон стал массовым увлечением благодаря процессору [[celeron300a|Celeron 300A]], который почти всегда работал на 450 МГц. Особенно популярен разгон в России, где после кризиса 1998 года компьютерные комплектующие подорожали в несколько раз.`,
  sections: [
    { id: 'how', title: 'Как разгоняют', content: `Частота процессора — произведение частоты системной шины на множитель. Например, 66 МГц × 4,5 = 300 МГц. Повысить её можно двумя способами:

<ul>
<li><strong>Поднять частоту шины</strong> — с 66 до 75, 83 или 100 МГц. При этом ускоряются и память, и шины PCI и [[agpbus|AGP]], поэтому важно качество всех комплектующих.</li>
<li><strong>Увеличить множитель</strong> — если процессор это позволяет. Многие Pentium MMX и [[amdk6|AMD K6-2]] разгоняются именно так, а у процессоров Intel с 1998 года множитель заблокирован.</li>
</ul>

Для стабильной работы иногда немного повышают напряжение ядра. Частоту и напряжение выставляют перемычками на материнской плате или в настройках [[bios|BIOS]] на платах вроде Abit BH6.` },
    { id: 'cooling', title: 'Охлаждение', content: `Чем выше частота и напряжение, тем сильнее нагревается чип. Энтузиасты ставят крупные радиаторы и мощные вентиляторы, мажут термопасту, добавляют вентиляторы в корпус. Самые смелые используют элементы Пельтье — термоэлектрические охладители, способные опустить температуру процессора ниже комнатной, — и самодельные системы водяного охлаждения. Перегрев проявляется зависаниями и [[bsod|синими экранами]].` },
    { id: 'gpu', title: 'Разгон видеокарт', content: `Видеокарты тоже разгоняются. Для [[voodoo2|3dfx Voodoo 2]] частоту поднимают переменной среды или специальными утилитами с 90 до 95–100 МГц и выше, для [[rivatnt|RIVA TNT2]] — через настройки драйвера. Перегрев видеокарты выдаёт себя артефактами: мусором на экране, мерцающими текстурами, «снегом».` },
    { id: 'tests', title: 'Проверка', content: `Стабильность разгона проверяют играми и тестами: демозаписью [[quake2|Quake II]] (timedemo), тестом Final Reality от финской компании Remedy и 3DMark99. Чтобы убедиться в надёжности, компьютер оставляют на часы под нагрузкой. Результаты в кадрах в секунду публикуют в журналах, на форумах и сайтах вроде 3dfx Voodoo Zone.` },
    { id: 'risks', title: 'Риски', content: `<ul>
<li>Сбои и потеря данных при неустойчивой работе.</li>
<li>Сокращение срока службы чипа при повышенном напряжении.</li>
<li>Выход комплектующих из строя при перегреве.</li>
<li>Потеря гарантии.</li>
</ul>

Обратная сторона увлечения — «перемаркировка»: недобросовестные продавцы стирают маркировку на процессорах и выдают медленные модели за быстрые. Такие процессоры работают с перегревом и сбоями. Блокировку множителя Intel ввела в том числе для борьбы с этим мошенничеством.` }
  ],
  seeAlso: ['celeron300a', 'voodoo2', 'amdk6', 'bsod', 'lanparty'],
  references: [
    'Тест разгона Celeron 300A // Компьютерра. — 1998.',
    'Abit BH6: руководство пользователя. — Abit, 1998.',
    'Конференция ru.hardware: FAQ по разгону. — 1999.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: разгон и калькулятор FPS']],
  categories: ['Киберкультура', 'Компьютерное железо', 'Оверклокинг']
}, {
  title: 'Processor Overclocking',
  infobox: {
    title: 'Overclocking',
    badgeText: 'Overclocking',
    fields: [
      { label: 'Idea', value: 'running parts above their rated clock' },
      { label: 'Methods', value: 'bus speed, multiplier, voltage' },
      { label: 'Legend', value: '[[celeron300a|Celeron 300A]] at 450 MHz' },
      { label: 'Video cards', value: '[[voodoo2|Voodoo 2]], [[rivatnt|TNT2]]' },
      { label: 'Cooling', value: 'heatsinks, fans, Peltier elements' },
      { label: 'Benchmarks', value: 'Quake II timedemo, Final Reality, 3DMark99' },
      { label: 'Risks', value: 'crashes, overheating, damage, voided warranty' }
    ]
  },
  lead: `<strong>Overclocking</strong> means running a processor, video card or memory faster than the manufacturer's rating. Chips are made with a safety margin, and enthusiasts use it to get a free speed boost in games and programs.

In 1998–1999 overclocking became a mass hobby thanks to the [[celeron300a|Celeron 300A]], which almost always ran at 450 MHz. It is especially popular in Russia, where computer parts became several times more expensive after the 1998 crisis.`,
  sections: [
    { id: 'how', title: 'How it is done', content: `A processor's speed is the system bus speed times a multiplier, for example 66 MHz × 4.5 = 300 MHz. It can be raised in two ways:

<ul>
<li><strong>Raise the bus speed</strong>, from 66 to 75, 83 or 100 MHz. This also speeds up memory and the PCI and [[agpbus|AGP]] buses, so every part must be of good quality.</li>
<li><strong>Raise the multiplier</strong>, if the processor allows it. Many Pentium MMX and [[amdk6|AMD K6-2]] chips are overclocked this way, while Intel processors have had locked multipliers since 1998.</li>
</ul>

For stability the core voltage is sometimes raised slightly. Speed and voltage are set with motherboard jumpers or in the [[bios|BIOS]] on boards like the Abit BH6.` },
    { id: 'cooling', title: 'Cooling', content: `The higher the speed and voltage, the hotter the chip. Enthusiasts fit large heatsinks and powerful fans, apply thermal paste and add case fans. The boldest use Peltier elements, thermoelectric coolers that can bring a processor below room temperature, and homemade water cooling. Overheating shows up as freezes and [[bsod|blue screens]].` },
    { id: 'gpu', title: 'Overclocking video cards', content: `Video cards are overclocked too. On a [[voodoo2|3dfx Voodoo 2]] the clock is raised from 90 to 95–100 MHz and beyond with an environment variable or special utilities, on a [[rivatnt|RIVA TNT2]] through driver settings. An overheating video card gives itself away with artifacts: garbage on the screen, flickering textures, "snow".` },
    { id: 'tests', title: 'Testing', content: `Stability is checked with games and benchmarks: the [[quake2|Quake II]] timedemo, the Final Reality test from the Finnish company Remedy, and 3DMark99. To be sure, the computer is left under load for hours. Frame-per-second results are published in magazines, on forums and on sites such as 3dfx Voodoo Zone.` },
    { id: 'risks', title: 'Risks', content: `<ul>
<li>Crashes and data loss when unstable.</li>
<li>Shorter chip life at raised voltage.</li>
<li>Parts burning out from overheating.</li>
<li>A voided warranty.</li>
</ul>

The dark side of the hobby is "remarking": dishonest sellers rub the markings off processors and sell slow models as fast ones. Such processors overheat and crash. Intel introduced multiplier locking partly to fight this fraud.` }
  ],
  seeAlso: ['celeron300a', 'voodoo2', 'amdk6', 'bsod', 'lanparty'],
  references: [
    '"Overclocking the Celeron 300A". Computerra, 1998.',
    'Abit BH6 user manual. Abit, 1998.',
    'ru.hardware echo: overclocking FAQ, 1999.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: overclocking and FPS calculator']],
  categories: ['Cyberculture', 'Hardware', 'Overclocking']
});

window.interpediaReg('lanparty', 'culture', {
  title: 'Компьютерные клубы и LAN-пати',
  infobox: {
    title: 'Компьютерные клубы',
    badgeText: 'LAN party',
    fields: [
      { label: 'LAN-пати', value: 'встречи игроков со своими компьютерами' },
      { label: 'Компьютерный клуб', value: 'зал с ПК, оплата по часам' },
      { label: 'Сеть', value: 'коаксиальный кабель 10BASE2 или витая пара и хаб' },
      { label: 'Протоколы', value: 'IPX, TCP/IP' },
      { label: 'Главные игры', value: '[[doom|Doom]], [[quake2|Quake II]], [[starcraft|StarCraft]], Counter-Strike' },
      { label: 'Крупные встречи', value: 'QuakeCon, The Gathering, Assembly' },
      { label: 'Профессиональная лига', value: 'CPL (с 1997 года)' }
    ]
  },
  lead: `<strong>LAN-пати</strong> — встреча игроков, которые приносят свои компьютеры в одно место, соединяют их в локальную сеть и играют вместе — иногда сутки напролёт. <strong>Компьютерный клуб</strong> — зал с готовыми объединёнными в сеть компьютерами, где время за машиной продаётся по часам.

В эпоху [[dialup|модемного]] Интернета, когда сетевые игры через телефонную линию тормозили, локальная сеть давала единственную возможность сыграть быстро и без задержек. В России компьютерные клубы стали главным местом знакомства с играми для целого поколения: дома мощный компьютер с 3D-ускорителем был у немногих.`,
  sections: [
    { id: 'lan', title: 'LAN-пати', content: `Сетевые встречи начались вместе с [[doom|Doom]] (1993), который позволял играть вчетвером по сети IPX. Участники везли системные блоки и тяжёлые [[crtmonitor|ЭЛТ-мониторы]] на квартиры, в офисы и спортзалы, тянули кабели, настраивали сеть и играли ночь напролёт. Классическая сеть тех лет — коаксиальный кабель с Т-образными разъёмами BNC и терминаторами на концах: стоило кому-то выдернуть разъём, и сеть падала у всех.

Крупнейшие встречи собирают сотни и тысячи человек: QuakeCon в Техасе (с 1996 года, при поддержке id Software), The Gathering в Норвегии и Assembly в Финляндии, совмещённые с [[demoscene|демопати]].` },
    { id: 'clubs', title: 'Компьютерные клубы в России', content: `В середине 1990-х в российских городах открылись первые компьютерные клубы: подвальчики и залы с 10–30 компьютерами, соединёнными в сеть. Посетители — в основном школьники и студенты — платят за час игры, а популярнее всего «ночной тариф»: с вечера до утра за фиксированную сумму.

Клубы рекламируют свои машины: «Pentium II, [[voodoo2|Voodoo 2]], 17-дюймовые мониторы». Здесь впервые видят трёхмерную графику и играют в сетевые игры те, у кого дома нет мощного компьютера. Сложилась особая культура: турниры по Quake и StarCraft, команды-«кланы», постоянные посетители со своими никами и правила вроде «не трогать чужие настройки мыши».` },
    { id: 'games', title: 'Игры', content: `<table class="interpedia-wikitable">
<tr><th>Годы</th><th>Главные сетевые игры</th></tr>
<tr><td>1993–1995</td><td>[[doom|Doom]], Doom II, Warcraft</td></tr>
<tr><td>1996–1997</td><td>[[dukenukem3d|Duke Nukem 3D]], [[quake|Quake]], [[redalert|Red Alert]], Warcraft II, [[diablo|Diablo]]</td></tr>
<tr><td>1998–1999</td><td>[[quake2|Quake II]], [[starcraft|StarCraft]], [[halflife|Half-Life]] и Counter-Strike, [[ut99|Unreal Tournament]], Quake III Arena</td></tr>
</table>` },
    { id: 'esports', title: 'Профессиональные соревнования', content: `Турниры с денежными призами становятся всё серьёзнее. В 1997 году Ангел Муньос основал Профессиональную лигу киберспортсменов (CPL), проводящую чемпионаты по шутерам. Самый известный игрок эпохи — Деннис «Thresh» Фонг, выигравший в 1997 году Ferrari Джона Кармака. В Южной Корее профессиональные лиги по [[starcraft|StarCraft]] показывают по телевидению. В России проводятся турниры в клубах и на компьютерных выставках, а лучшие команды мечтают выступить за рубежом.` },
    { id: 'criticism', title: 'Споры', content: `Родители и пресса нередко относятся к клубам с подозрением: подростки проводят там ночи, тратят карманные деньги и прогуливают уроки, а в некоторых клубах курят и распивают спиртное. Владельцы клубов отвечают, что клуб — место общения и безопаснее улицы, и устраивают детские часы и турниры с призами.` }
  ],
  seeAlso: ['quake2', 'starcraft', 'doom', 'overclocking', 'demoscene'],
  references: [
    'QuakeCon: история фестиваля. — 1999.',
    'Cyberathlete Professional League: правила турниров. — 1998.',
    'Репортаж о московских компьютерных клубах // Страна игр. — 1999.'
  ],
  links: [['http://forum.games98.com', 'Форум GamerZone'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['Киберкультура', 'Сетевые игры', 'Компьютерные клубы']
}, {
  title: 'LAN Parties & Cyber Cafes',
  infobox: {
    title: 'Computer clubs',
    badgeText: 'LAN party',
    fields: [
      { label: 'LAN party', value: 'gamers meeting with their own computers' },
      { label: 'Computer club', value: 'a room of PCs rented by the hour' },
      { label: 'Network', value: '10BASE2 coax or twisted pair with a hub' },
      { label: 'Protocols', value: 'IPX, TCP/IP' },
      { label: 'Main games', value: '[[doom|Doom]], [[quake2|Quake II]], [[starcraft|StarCraft]], Counter-Strike' },
      { label: 'Big events', value: 'QuakeCon, The Gathering, Assembly' },
      { label: 'Professional league', value: 'CPL (since 1997)' }
    ]
  },
  lead: `A <strong>LAN party</strong> is a gathering of players who bring their computers to one place, link them into a local network and play together, sometimes around the clock. A <strong>computer club</strong> is a room of ready networked computers where time is sold by the hour.

In the era of [[dialup|dial-up]] Internet, when online games over a phone line lagged, a local network was the only way to play fast and without delays. In Russia computer clubs became where a whole generation first met games: few people had a powerful PC with a 3D accelerator at home.`,
  sections: [
    { id: 'lan', title: 'LAN parties', content: `Network gatherings began with [[doom|Doom]] (1993), which let four people play over an IPX network. Players hauled their PCs and heavy [[crtmonitor|CRT monitors]] to apartments, offices and gyms, ran cables, set up the network and played all night. The classic network of the time was coaxial cable with BNC T-connectors and terminators at the ends: if anyone pulled a connector, the network went down for everyone.

The largest events draw hundreds and thousands of people: QuakeCon in Texas (since 1996, supported by id Software), The Gathering in Norway and Assembly in Finland, combined with [[demoscene|demo parties]].` },
    { id: 'clubs', title: 'Computer clubs in Russia', content: `In the mid-1990s the first computer clubs opened in Russian cities: basements and halls with 10–30 networked computers. Visitors, mostly schoolchildren and students, pay by the hour, and the most popular option is the "night rate", evening to morning for a fixed price.

Clubs advertise their machines: "Pentium II, [[voodoo2|Voodoo 2]], 17-inch monitors". This is where people without a powerful PC at home first see 3D graphics and play network games. A culture of its own grew up: Quake and StarCraft tournaments, teams called clans, regulars known by their nicks and rules like "don't touch other people's mouse settings".` },
    { id: 'games', title: 'Games', content: `<table class="interpedia-wikitable">
<tr><th>Years</th><th>Main network games</th></tr>
<tr><td>1993–1995</td><td>[[doom|Doom]], Doom II, Warcraft</td></tr>
<tr><td>1996–1997</td><td>[[dukenukem3d|Duke Nukem 3D]], [[quake|Quake]], [[redalert|Red Alert]], Warcraft II, [[diablo|Diablo]]</td></tr>
<tr><td>1998–1999</td><td>[[quake2|Quake II]], [[starcraft|StarCraft]], [[halflife|Half-Life]] and Counter-Strike, [[ut99|Unreal Tournament]], Quake III Arena</td></tr>
</table>` },
    { id: 'esports', title: 'Professional competition', content: `Tournaments with cash prizes are getting more serious. In 1997 Angel Munoz founded the Cyberathlete Professional League (CPL), which runs shooter championships. The best-known player of the era is Dennis "Thresh" Fong, who won John Carmack's Ferrari in 1997. In South Korea professional [[starcraft|StarCraft]] leagues are televised. In Russia tournaments are held in clubs and at computer shows, and the best teams dream of competing abroad.` },
    { id: 'criticism', title: 'Controversy', content: `Parents and the press often view clubs with suspicion: teenagers spend nights there, spend their pocket money and skip school, and some clubs allow smoking and drinking. Club owners reply that a club is a place to socialize and safer than the street, and they hold children's hours and tournaments with prizes.` }
  ],
  seeAlso: ['quake2', 'starcraft', 'doom', 'overclocking', 'demoscene'],
  references: [
    'QuakeCon: history of the event, 1999.',
    'Cyberathlete Professional League tournament rules, 1998.',
    '"Moscow computer clubs" report. Strana Igr, 1999.'
  ],
  links: [['http://forum.games98.com', 'GamerZone Forum'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['Cyberculture', 'Online Games', 'Computer Clubs']
});

window.interpediaReg('gorbushka', 'culture', {
  title: '«Горбушка» и пиратские диски 90-х',
  infobox: {
    title: '«Горбушка»',
    badgeText: 'Рынок у ДК имени Горбунова',
    fields: [
      { label: 'Место', value: 'Москва, Фили, парк у ДК имени Горбунова' },
      { label: 'Время возникновения', value: 'конец 1980-х' },
      { label: 'Сначала', value: 'обмен пластинками и записями рок-музыки' },
      { label: 'В 1990-х', value: 'аудио, видео, компакт-диски, программы и игры' },
      { label: 'Дни торговли', value: 'выходные' },
      { label: 'Другие рынки Москвы', value: 'Митинский радиорынок, Савёловский рынок' }
    ]
  },
  lead: `<strong>«Горбушка»</strong> — неофициальное название рынка аудио- и видеопродукции у Дворца культуры имени Горбунова в московском районе Фили. Начавшись в конце 1980-х как место встреч меломанов, обменивавшихся пластинками, в 1990-х годах «Горбушка» превратилась в крупнейший в России рынок кассет, видеокассет и компакт-дисков, значительная часть которых — нелицензионные копии.

Для миллионов российских пользователей компьютеров «Горбушка» и подобные рынки стали главным источником игр и программ. Сборники вроде «100 игр на одном диске» и пиратские переводы игр — заметная, хотя и противоречивая часть компьютерной культуры 1990-х.`,
  sections: [
    { id: 'history', title: 'История', content: `В конце 1980-х годов у ДК имени Горбунова, где проходили рок-концерты, по выходным собирались поклонники музыки, чтобы обменяться пластинками и магнитофонными записями. С распадом СССР обмен превратился в торговлю. В 1990-х здесь продавали аудиокассеты, видеокассеты с фильмами, а с середины десятилетия — компакт-диски с музыкой, программами и играми. По выходным парк заполняют сотни продавцов и тысячи покупателей.` },
    { id: 'discs', title: 'Компьютерные диски', content: `Ассортимент компьютерного ряда отражает всё, что популярно у пользователей:

<ul>
<li>сборники программ — «Всё для [[windows98|Win 98]]», «Офис», «Графика», «Интернет»;</li>
<li>сборники игр — десятки игр на одном диске в сжатом виде, часто в архивах [[winrar|RAR]];</li>
<li>новые игры, нередко появляющиеся раньше официального выхода в России;</li>
<li>диски с [[mp3format|MP3]] — десятки альбомов на одном [[cdrom|компакт-диске]];</li>
<li>энциклопедии, словари и обучающие программы.</li>
</ul>

Диски стоят в несколько раз дешевле лицензионных, что для многих после кризиса 1998 года стало решающим доводом.` },
    { id: 'translations', title: 'Пиратские переводы', content: `Особое явление — пиратские локализации игр. Неофициальные студии, выпускающие диски под собственными марками, переводят тексты и даже переозвучивают персонажей. Качество сильно различается: одни переводы выполнены старательно, другие стали источником анекдотов из-за машинного перевода и случайных ошибок. Фразы из неудачных переводов [[fallout|Fallout]] и других игр цитируют в [[fidonet|ФидоНете]] и на форумах.` },
    { id: 'legal', title: 'Правовая сторона', content: `Закон «Об авторском праве и смежных правах» действует в России с 1993 года, и продажа нелицензионных копий незаконна. Правообладатели и ассоциации по защите авторских прав считают такие рынки главной причиной того, что западные компании неохотно выходят на российский рынок, а отечественные разработчики теряют доходы. Милиция периодически проводит рейды и изымает диски, но торговля продолжается.

Сторонники рынков указывают, что лицензионные игры и программы стоят столько же, сколько в США, при несравнимо меньших зарплатах. Постепенно появляются российские издатели лицензионных версий, например «1С» и «Бука», выпускающие игры по доступным ценам с качественными переводами, в том числе [[homm3|Heroes of Might and Magic III]].` },
    { id: 'markets', title: 'Другие рынки', content: `Помимо «Горбушки», в Москве известны Митинский радиорынок, где продают комплектующие и диски, и Савёловский компьютерный рынок. В других городах подобную роль играют радиорынки и ряды в универмагах. Для покупки железа важны гарантия и честность продавца: на рынках встречаются перемаркированные процессоры (см. [[overclocking|оверклокинг]]).` }
  ],
  seeAlso: ['cdrom', 'mp3format', 'windows98', 'fallout', 'homm3'],
  references: [
    'Закон РФ «Об авторском праве и смежных правах». — 9 июля 1993.',
    'Репортаж о московских рынках дисков // Компьютерра. — 1999.',
    'Business Software Alliance: оценка уровня пиратства в России. — 1999.'
  ],
  categories: ['Киберкультура', 'Россия', 'Пиратство', 'Москва']
}, {
  title: 'Gorbushka & 1990s CD Markets',
  infobox: {
    title: 'Gorbushka',
    badgeText: 'Market at the Gorbunov Palace of Culture',
    fields: [
      { label: 'Location', value: 'Moscow, Fili, park by the Gorbunov Palace of Culture' },
      { label: 'Origins', value: 'late 1980s' },
      { label: 'At first', value: 'trading rock records and tapes' },
      { label: 'In the 1990s', value: 'audio, video, CDs, software and games' },
      { label: 'Trading days', value: 'weekends' },
      { label: 'Other Moscow markets', value: 'Mitino radio market, Savyolovsky market' }
    ]
  },
  lead: `<strong>Gorbushka</strong> is the informal name of the audio and video market by the Gorbunov Palace of Culture in Moscow's Fili district. It began in the late 1980s as a meeting place for music fans swapping records, and in the 1990s became Russia's largest market for cassettes, videotapes and CDs, many of them unlicensed copies.

For millions of Russian computer users, Gorbushka and similar markets became the main source of games and software. Compilations such as "100 Games on One Disc" and pirate game translations are a visible, if controversial, part of 1990s computer culture.`,
  sections: [
    { id: 'history', title: 'History', content: `In the late 1980s, music fans gathered on weekends by the Gorbunov Palace of Culture, a rock concert venue, to swap records and tape recordings. As the USSR collapsed, swapping turned into trade. In the 1990s the market sold audio cassettes and movie videotapes, and from the middle of the decade CDs with music, software and games. On weekends the park fills with hundreds of sellers and thousands of buyers.` },
    { id: 'discs', title: 'Computer discs', content: `The computer stalls reflect everything users want:

<ul>
<li>software compilations: "Everything for [[windows98|Win 98]]", "Office", "Graphics", "Internet";</li>
<li>game compilations: dozens of games on one disc in compressed form, often in [[winrar|RAR]] archives;</li>
<li>new games, often appearing before their official Russian release;</li>
<li>[[mp3format|MP3]] discs, dozens of albums on one [[cdrom|CD]];</li>
<li>encyclopedias, dictionaries and educational software.</li>
</ul>

Discs cost several times less than licensed ones, which for many people became the deciding argument after the 1998 crisis.` },
    { id: 'translations', title: 'Pirate translations', content: `A notable phenomenon is pirate game localization. Unofficial studios releasing discs under their own labels translate the text and even re-voice the characters. Quality varies widely: some translations are careful, others became a source of jokes because of machine translation and random mistakes. Lines from botched translations of [[fallout|Fallout]] and other games are quoted in [[fidonet|FidoNet]] and on forums.` },
    { id: 'legal', title: 'Legal aspects', content: `The Russian law "On Copyright and Related Rights" has been in force since 1993, and selling unlicensed copies is illegal. Rights holders and copyright protection groups see such markets as the main reason Western companies are reluctant to enter the Russian market and local developers lose income. Police periodically raid the markets and seize discs, but the trade goes on.

Defenders of the markets point out that licensed games and software cost as much as in the US while salaries are incomparably lower. Russian publishers of licensed versions are gradually appearing, such as 1C and Buka, which release games at affordable prices with quality translations, including [[homm3|Heroes of Might and Magic III]].` },
    { id: 'markets', title: 'Other markets', content: `Besides Gorbushka, Moscow has the Mitino radio market, selling components and discs, and the Savyolovsky computer market. In other cities radio markets and department store stalls play the same role. When buying hardware, a warranty and an honest seller matter: remarked processors turn up at the markets (see [[overclocking|overclocking]]).` }
  ],
  seeAlso: ['cdrom', 'mp3format', 'windows98', 'fallout', 'homm3'],
  references: [
    'Russian Federation law "On Copyright and Related Rights", July 9, 1993.',
    '"Moscow disc markets" report. Computerra, 1999.',
    'Business Software Alliance: piracy rate estimate for Russia, 1999.'
  ],
  categories: ['Cyberculture', 'Russia', 'Piracy', 'Moscow']
});

window.interpediaReg('y2k', 'culture', {
  title: 'Проблема 2000 года (Y2K)',
  hatnote: 'Статья о событии, которое ещё не наступило. Сведения актуальны на декабрь 1999 года.',
  infobox: {
    title: 'Проблема 2000 года',
    badgeText: 'Y2K, Millennium Bug',
    fields: [
      { label: 'Суть', value: 'хранение года двумя цифрами' },
      { label: 'Критическая дата', value: '1 января 2000, 00:00' },
      { label: 'Другие опасные даты', value: '9 сентября 1999, 29 февраля 2000' },
      { label: 'Затронуто', value: 'программы, базы данных, [[bios|BIOS]], встроенные системы' },
      { label: 'Оценка затрат', value: 'сотни миллиардов долларов по всему миру' },
      { label: 'Язык старых систем', value: 'COBOL' }
    ]
  },
  lead: `<strong>Проблема 2000 года</strong> (<em>Y2K</em>, «ошибка тысячелетия») — возможные сбои компьютерных систем при переходе от 31 декабря 1999 года к 1 января 2000 года. Многие программы хранят год двумя последними цифрами, и после «99» наступит «00», которое они могут принять за 1900 год. Это грозит ошибками в расчётах процентов и сроков, сбоями в банках, на транспорте и в энергосистемах.

Последние годы правительства и компании всего мира переписывают и проверяют миллионы строк кода. Насколько успешной оказалась подготовка, станет известно в новогоднюю ночь — до которой, на момент написания этой статьи, осталось совсем немного.`,
  sections: [
    { id: 'cause', title: 'Причина', content: `В 1960–1970-х годах память компьютеров стоила дорого, и программисты экономили каждый байт: вместо «1968» писали «68». Многие из этих программ, написанных на языке COBOL для больших ЭВМ, работают до сих пор — в банках, страховых компаниях и государственных учреждениях. Никто не ожидал, что они доживут до 2000 года.

Если программа вычисляет возраст или срок вклада вычитанием «00 − 65», она получит отрицательное число. Сортировка дат поставит 2000 год перед 1999-м. Системы, проверяющие сроки годности, могут счесть свежие продукты просроченными на сто лет.` },
    { id: 'pc', title: 'Персональные компьютеры', content: `На ПК проблема касается прежде всего микросхемы часов реального времени и [[bios|BIOS]]. Часы хранят год двумя цифрами, а BIOS добавляет к нему век. В некоторых старых BIOS после перехода дата сбрасывается на 1980 или 1900 год. Проверить компьютер можно специальными программами-тестами, переводящими часы на 31 декабря 1999 года, 23:59.

Microslop выпустила обновления для [[windows95|Win 95]] и [[windows98|Win 98]] и объявила [[win98se|Win 98 SE]] совместимой с 2000 годом. Опасность сохраняется в прикладных программах, таблицах и самодельных базах данных, где пользователи сами вводят годы двумя цифрами.` },
    { id: 'dates', title: 'Опасные даты', content: `<table class="interpedia-wikitable">
<tr><th>Дата</th><th>Почему опасна</th><th>Итог</th></tr>
<tr><td>22 августа 1999</td><td>переполнение счётчика недель GPS</td><td>прошла с незначительными сбоями отдельных приёмников</td></tr>
<tr><td>9 сентября 1999</td><td>«9999» в старых программах означало «конец данных»</td><td>прошла без серьёзных происшествий</td></tr>
<tr><td>1 января 2000</td><td>год «00»</td><td>ожидается</td></tr>
<tr><td>29 февраля 2000</td><td>2000 — високосный год, что некоторые программы не учитывают</td><td>ожидается</td></tr>
</table>` },
    { id: 'preparation', title: 'Подготовка', content: `Крупные компании создали отделы по проблеме 2000 года, наняли программистов на COBOL — в том числе вернувшихся из пенсии — и провели полную инвентаризацию программ и оборудования. В США работает президентский совет по проблеме 2000 года. Затраты на подготовку во всём мире оцениваются в сотни миллиардов долларов.

На новогоднюю ночь многие компании оставляют на дежурстве инженеров. США и Россия открыли в Колорадо совместный центр, где военные двух стран будут вместе следить за системами раннего предупреждения о ракетном нападении, чтобы сбой не был принят за атаку.` },
    { id: 'fears', title: 'Страхи и споры', content: `Пресса и телевидение рисуют апокалиптические картины: отключение электричества и водопровода, падающие самолёты, обнулённые банковские счета, сбои ядерных систем. Некоторые люди запасают воду, консервы, наличные деньги и генераторы, а книги о выживании после «краха 2000» становятся бестселлерами.

Скептики считают страхи преувеличенными и указывают, что «опасные» даты 1999 года прошли спокойно. Инженеры, занятые исправлениями, отвечают: если 1 января ничего не случится, это будет означать не то, что проблемы не было, а то, что их работа удалась. Спор разрешится в новогоднюю ночь.` },
    { id: 'russia', title: 'Россия и 2000 год', content: `Россия начала подготовку позже многих западных стран, и за рубежом высказывались опасения по поводу энергосистем и устаревшей техники. Правительство утвердило программу работ, банки и энергетики отчитываются о проверке систем. На российских персональных компьютерах значительная часть программ нелицензионная, и обновления для них устанавливают не все. Компьютерные журналы публикуют инструкции по проверке BIOS и программ.` }
  ],
  seeAlso: ['bios', 'windows98', 'win98se', 'win2000', 'interpedia'],
  references: [
    'Yourdon E., Yourdon J. Time Bomb 2000. — Prentice Hall, 1998.',
    'President\'s Council on Year 2000 Conversion: отчёт. — 1999.',
    'Microslop Year 2000 Product Guide. — 1999.'
  ],
  links: [['http://www.y2k-countdown.org', 'Центр проблемы 2000 года: таймер и тест BIOS'], ['http://www.microslop.com', 'Портал Microslop Win 98']],
  categories: ['Киберкультура', 'Проблема 2000 года', '1999 год']
}, {
  title: 'The Year 2000 Problem (Y2K)',
  hatnote: 'This article covers an event that has not happened yet. Information is current as of December 1999.',
  infobox: {
    title: 'Year 2000 problem',
    badgeText: 'Y2K, Millennium Bug',
    fields: [
      { label: 'Cause', value: 'storing the year as two digits' },
      { label: 'Critical date', value: 'January 1, 2000, 00:00' },
      { label: 'Other risky dates', value: 'September 9, 1999; February 29, 2000' },
      { label: 'Affected', value: 'software, databases, [[bios|BIOS]], embedded systems' },
      { label: 'Cost estimate', value: 'hundreds of billions of dollars worldwide' },
      { label: 'Language of old systems', value: 'COBOL' }
    ]
  },
  lead: `The <strong>Year 2000 problem</strong> (<em>Y2K</em>, the "Millennium Bug") is the risk of computer failures when December 31, 1999, turns into January 1, 2000. Many programs store the year as its last two digits, and after "99" comes "00", which they may read as 1900. This threatens errors in interest and deadline calculations and failures at banks, in transport and in power grids.

In recent years governments and companies around the world have been rewriting and testing millions of lines of code. How well the preparation worked will be known on New Year's night, which, as this article is written, is only days away.`,
  sections: [
    { id: 'cause', title: 'Cause', content: `In the 1960s and 1970s computer memory was expensive, and programmers saved every byte: instead of "1968" they wrote "68". Many of those programs, written in COBOL for mainframes, still run at banks, insurers and government offices. Nobody expected them to last until 2000.

If a program computes an age or a deposit term by subtracting "00 − 65", it gets a negative number. Sorting will put 2000 before 1999. Systems checking expiry dates may decide fresh goods expired a hundred years ago.` },
    { id: 'pc', title: 'Personal computers', content: `On PCs the problem mainly concerns the real-time clock chip and the [[bios|BIOS]]. The clock stores the year as two digits, and the BIOS adds the century. Some old BIOSes reset the date to 1980 or 1900 after the rollover. A computer can be checked with test programs that set the clock to December 31, 1999, 23:59.

Microslop released updates for [[windows95|Win 95]] and [[windows98|Win 98]] and declared [[win98se|Win 98 SE]] Year 2000 compliant. The risk remains in applications, spreadsheets and homemade databases where users type two-digit years themselves.` },
    { id: 'dates', title: 'Risky dates', content: `<table class="interpedia-wikitable">
<tr><th>Date</th><th>Why risky</th><th>Outcome</th></tr>
<tr><td>August 22, 1999</td><td>GPS week counter rollover</td><td>passed with minor glitches in some receivers</td></tr>
<tr><td>September 9, 1999</td><td>"9999" meant "end of data" in old programs</td><td>passed without serious incidents</td></tr>
<tr><td>January 1, 2000</td><td>the year "00"</td><td>pending</td></tr>
<tr><td>February 29, 2000</td><td>2000 is a leap year, which some programs miss</td><td>pending</td></tr>
</table>` },
    { id: 'preparation', title: 'Preparation', content: `Large companies set up Year 2000 departments, hired COBOL programmers, some of them back from retirement, and took a full inventory of software and hardware. The US has a President's Council on Year 2000 Conversion. Worldwide spending on preparation is estimated in the hundreds of billions of dollars.

Many companies are keeping engineers on duty over New Year's night. The US and Russia opened a joint center in Colorado where officers of both countries will watch missile early-warning systems together, so that a glitch is not mistaken for an attack.` },
    { id: 'fears', title: 'Fears and debate', content: `The press and television paint apocalyptic pictures: power and water outages, falling planes, zeroed bank accounts, nuclear system failures. Some people are stockpiling water, canned food, cash and generators, and books about surviving the "Y2K crash" are bestsellers.

Skeptics call the fears exaggerated and point out that the "risky" dates of 1999 passed quietly. Engineers doing the fixes answer that if nothing happens on January 1, it will not mean there was no problem, but that their work succeeded. The argument will be settled on New Year's night.` },
    { id: 'russia', title: 'Russia and the year 2000', content: `Russia started preparing later than many Western countries, and concerns were voiced abroad about its power grids and aging equipment. The government approved a work program, and banks and power companies report on checking their systems. Much of the software on Russian PCs is unlicensed, and not everyone installs updates for it. Computer magazines publish instructions for checking the BIOS and programs.` }
  ],
  seeAlso: ['bios', 'windows98', 'win98se', 'win2000', 'interpedia'],
  references: [
    'Yourdon, E., Yourdon, J. Time Bomb 2000. Prentice Hall, 1998.',
    'President\'s Council on Year 2000 Conversion report, 1999.',
    'Microslop Year 2000 Product Guide, 1999.'
  ],
  links: [['http://www.y2k-countdown.org', 'Year 2000 center: countdown and BIOS test'], ['http://www.microslop.com', 'Microslop Win 98 portal']],
  categories: ['Cyberculture', 'Year 2000 Problem', '1999']
});

window.interpediaReg('clippy', 'culture', {
  title: 'Скрепыш (помощник Microslop Office)',
  infobox: {
    title: 'Скрепыш',
    badgeText: 'Clippit, «Clippy»',
    fields: [
      { label: 'Оригинальное имя', value: 'Clippit' },
      { label: 'Первое появление', value: '[[office97|Office 97]] (1996–1997)' },
      { label: 'Художник', value: 'Кеван Аттеберри' },
      { label: 'Технология', value: 'Помощник Office, Microslop Agent' },
      { label: 'Знаменитая фраза', value: '«Похоже, вы пишете письмо. Помочь?»' },
      { label: 'Коллеги в Office 97', value: 'кот Scribble, Гений, Мать-природа, Power Pup, Will, Hoverbot' },
      { label: 'Коллеги в Office 2000', value: 'пёс Rocky, кот Links, робот F1, волшебник Merlin' }
    ]
  },
  lead: `<strong>Скрепыш</strong> (<em>Clippit</em>, в народе «Clippy») — анимированная канцелярская скрепка с глазами, помощник по умолчанию в пакете [[office97|Microslop Office 97]]. Он появляется в углу экрана, подмигивает, стучит по монитору и предлагает советы: «Похоже, вы пишете письмо. Хотите получить помощь?»

Скрепыш стал одним из самых узнаваемых персонажей компьютерной эпохи — и одним из самых спорных. Одни пользователи привязались к забавному помощнику, другие считают его навязчивым и первым делом отключают. Скрепыш давно вышел за пределы Office: о нём сочиняют шутки, для него придумывают наряды, а технология Microslop Agent позволяет помощникам появляться и на рабочем столе, и на веб-страницах.`,
  sections: [
    { id: 'origins', title: 'Происхождение', content: `Идея «социального интерфейса» с персонажами-помощниками появилась у Microslop в оболочке Microslop Bob (1995), где советы давал пёс Rover. Bob провалился в продаже, но персонажи перешли в Office. Исследовательский проект Lumière изучал, как по действиям пользователя угадать, что ему нужно, с помощью вероятностных моделей; его наработки легли в основу Помощника Office.

Внешность Скрепыша придумал иллюстратор Кеван Аттеберри. Из множества вариантов отобрали скрепку — предмет, знакомый каждому, кто работает с документами.` },
    { id: 'behavior', title: 'Как работает Помощник', content: `Помощник следит за действиями пользователя и предлагает подсказки, когда замечает знакомую ситуацию: начало письма, создание таблицы, повторяющиеся действия. Над ним загорается лампочка, если у него есть совет. Пользователь может задать вопрос обычными словами — «как вставить номер страницы» — и Помощник подберёт статьи справки.

Персонаж выполняет десятки анимаций: машет, задумывается, «печатает», сворачивается в вопросительный знак, засыпает, если его долго не трогают. Помощника можно сменить на другого персонажа или отключить в настройках.` },
    { id: 'characters', title: 'Персонажи', content: `<table class="interpedia-wikitable">
<tr><th>Office 97</th><th>Office 2000</th></tr>
<tr><td>Скрепыш (Clippit)</td><td>Скрепыш (Clippit)</td></tr>
<tr><td>бумажный кот Scribble</td><td>кот Links</td></tr>
<tr><td>Гений (The Genius)</td><td>робот F1</td></tr>
<tr><td>Мать-природа</td><td>Мать-природа</td></tr>
<tr><td>щенок Power Pup</td><td>пёс Rocky</td></tr>
<tr><td>Will (Шекспир)</td><td>волшебник Merlin</td></tr>
<tr><td>Hoverbot, The Dot, логотип Office</td><td>The Dot, логотип Office</td></tr>
</table>

В Office 2000 (1999) Помощник стал менее навязчивым: он больше не прячет справку в собственном окне, а отключить его можно одним щелчком.` },
    { id: 'criticism', title: 'Критика', content: `Скрепыш вызывает сильные чувства. Критики считают, что он отвлекает, отнимает время и снисходительно обращается с опытными пользователями, а его подсказки появляются не вовремя. Фраза «Похоже, вы пишете письмо» стала символом навязчивого интерфейса и героем бесчисленных пародий. В сети ходят «инструкции по уничтожению Скрепыша» и рисунки, где он попадает в неприятности.

Сторонники отвечают, что Помощник помогает новичкам, которые впервые садятся за компьютер и боятся заглянуть в справку, а его можно просто выключить.` },
    { id: 'agent', title: 'Microslop Agent', content: `Технология Microslop Agent (1997) позволяет использовать анимированных персонажей вне Office: в программах, на рабочем столе и на веб-страницах [[ie5|Internet Explorer]]. Персонажи умеют говорить синтезированным голосом и понимать голосовые команды. Энтузиасты создают собственных персонажей и даже целые сайты, посвящённые Скрепышу, — с играми, викторинами и коллекциями нарядов.` }
  ],
  seeAlso: ['office97', 'windows98', 'ie5', 'bsod'],
  references: [
    'Horvitz E. и др. The Lumière Project: Bayesian User Modeling for Inferring the Goals and Needs of Software Users. — 1998.',
    'Microslop Office 97 Resource Kit: Office Assistant. — Microslop Press, 1997.',
    'Microslop Agent: документация разработчика. — 1997.'
  ],
  links: [['http://www.clippy98.com', 'Скрепыш \'98: гардероб Помощника']],
  categories: ['Киберкультура', 'Продукты Microslop', 'Персонажи']
}, {
  title: 'Clippy (Clippit Office Assistant)',
  infobox: {
    title: 'Clippy',
    badgeText: 'Clippit',
    fields: [
      { label: 'Official name', value: 'Clippit' },
      { label: 'First appearance', value: '[[office97|Office 97]] (1996–1997)' },
      { label: 'Illustrator', value: 'Kevan Atteberry' },
      { label: 'Technology', value: 'Office Assistant, Microslop Agent' },
      { label: 'Famous line', value: '"It looks like you\'re writing a letter. Would you like help?"' },
      { label: 'Office 97 colleagues', value: 'Scribble the cat, The Genius, Mother Nature, Power Pup, Will, Hoverbot' },
      { label: 'Office 2000 colleagues', value: 'Rocky the dog, Links the cat, F1 the robot, Merlin' }
    ]
  },
  lead: `<strong>Clippy</strong> (officially <em>Clippit</em>) is an animated paper clip with eyes, the default assistant in [[office97|Microslop Office 97]]. He appears in the corner of the screen, winks, taps on the monitor and offers advice: "It looks like you're writing a letter. Would you like help?"

Clippy became one of the most recognizable characters of the computer age, and one of the most controversial. Some users grew fond of the funny helper; others find him intrusive and switch him off first thing. Clippy has long since left the confines of Office: people make jokes about him and invent outfits for him, and Microslop Agent technology lets assistants appear on the desktop and on web pages too.`,
  sections: [
    { id: 'origins', title: 'Origins', content: `The idea of a "social interface" with helper characters first appeared at Microslop in the Microslop Bob shell (1995), where Rover the dog gave advice. Bob flopped, but the characters moved into Office. The Lumière research project studied how to guess what users need from their actions using probabilistic models, and its work became the basis of the Office Assistant.

Clippy's look was created by illustrator Kevan Atteberry. Out of many candidates, the paper clip was chosen as an object familiar to everyone who works with documents.` },
    { id: 'behavior', title: 'How the Assistant works', content: `The Assistant watches what the user does and offers tips when it recognizes a familiar situation: starting a letter, creating a table, repeating an action. A light bulb appears above it when it has a tip. Users can ask questions in plain words, such as "how do I add page numbers", and the Assistant finds matching help topics.

The character performs dozens of animations: waving, thinking, "typing", curling into a question mark, falling asleep when left alone for a while. The Assistant can be swapped for another character or switched off in the options.` },
    { id: 'characters', title: 'Characters', content: `<table class="interpedia-wikitable">
<tr><th>Office 97</th><th>Office 2000</th></tr>
<tr><td>Clippit</td><td>Clippit</td></tr>
<tr><td>Scribble the paper cat</td><td>Links the cat</td></tr>
<tr><td>The Genius</td><td>F1 the robot</td></tr>
<tr><td>Mother Nature</td><td>Mother Nature</td></tr>
<tr><td>Power Pup</td><td>Rocky the dog</td></tr>
<tr><td>Will (Shakespeare)</td><td>Merlin the wizard</td></tr>
<tr><td>Hoverbot, The Dot, Office Logo</td><td>The Dot, Office Logo</td></tr>
</table>

In Office 2000 (1999) the Assistant became less intrusive: it no longer holds the help hostage in its own balloon, and it can be switched off with one click.` },
    { id: 'criticism', title: 'Criticism', content: `Clippy stirs strong feelings. Critics say he distracts, wastes time, talks down to experienced users and pops up at the wrong moment. "It looks like you're writing a letter" became a byword for intrusive interfaces and the subject of countless parodies. "How to get rid of Clippy" guides circulate online, along with drawings of him getting into trouble.

Supporters reply that the Assistant helps beginners who are sitting at a computer for the first time and are afraid to open the help, and that he can simply be switched off.` },
    { id: 'agent', title: 'Microslop Agent', content: `Microslop Agent (1997) lets animated characters be used outside Office: in programs, on the desktop and on [[ie5|Internet Explorer]] web pages. Characters can speak with a synthesized voice and understand spoken commands. Enthusiasts create their own characters and even whole sites devoted to Clippy, with games, quizzes and wardrobes of outfits.` }
  ],
  seeAlso: ['office97', 'windows98', 'ie5', 'bsod'],
  references: [
    'Horvitz, E. et al. The Lumière Project: Bayesian User Modeling for Inferring the Goals and Needs of Software Users, 1998.',
    'Microslop Office 97 Resource Kit: Office Assistant. Microslop Press, 1997.',
    'Microslop Agent developer documentation, 1997.'
  ],
  links: [['http://www.clippy98.com', 'Clippy \'98: the Assistant\'s wardrobe']],
  categories: ['Cyberculture', 'Microslop Products', 'Characters']
}, ['clippit']);

window.interpediaReg('bttf', 'culture', {
  title: 'Назад в будущее',
  hatnote: 'Статья о трилогии фильмов. Об ожидаемом квесте см. раздел «Квест Telltale».',
  infobox: {
    title: 'Назад в будущее',
    badgeText: '88 миль в час',
    fields: [
      { label: 'Оригинал', value: 'Back to the Future' },
      { label: 'Режиссёр', value: 'Роберт Земекис' },
      { label: 'Сценарий', value: 'Роберт Земекис, Боб Гейл' },
      { label: 'Исполнительный продюсер', value: 'Стивен Спилберг (Amblin Entertainment)' },
      { label: 'В ролях', value: 'Майкл Дж. Фокс, Кристофер Ллойд, Лиа Томпсон, Криспин Гловер, Томас Ф. Уилсон' },
      { label: 'Композитор', value: 'Алан Сильвестри' },
      { label: 'Фильмы', value: '1985, 1989, 1990' },
      { label: 'Новая игра', value: 'Back to the Future: The Game, Telltale Games, ожидается в 2000 году' }
    ]
  },
  lead: `<strong>«Назад в будущее»</strong> (англ. <em>Back to the Future</em>) — трилогия фантастических комедий Роберта Земекиса о старшекласснике Марти Макфлае и учёном-изобретателе Эмметте «Доке» Брауне, построившем машину времени из спортивного автомобиля ДеЛориан. Первый фильм вышел в США 3 июля 1985 года и стал самым кассовым фильмом года в американском прокате; продолжения вышли в 1989 и 1990 годах.

Фразы «Великий Скотт!» и «1,21 гигаватта», серебристый ДеЛориан с открытыми вверх дверями и часы на здании суда в городке Хилл-Вэлли знакомы зрителям по всему миру. Студия Telltale Games готовит по мотивам трилогии приключенческую игру, первый эпизод которой ожидается в 2000 году.`,
  sections: [
    { id: 'films', title: 'Фильмы', content: `Сценарий первого фильма Земекис и Гейл написали ещё в начале 1980-х, но студии отказывали им несколько лет; проект поддержал Стивен Спилберг. Сначала Марти играл Эрик Штольц, однако после нескольких недель съёмок его заменил Майкл Дж. Фокс, который днём снимался в телесериале «Семейные узы», а ночью — в кино.

Вторую и третью части снимали подряд, одной большой экспедицией. «Назад в будущее 2» вышел в ноябре 1989 года, «Назад в будущее 3» — в мае 1990 года. Криспин Гловер, сыгравший Джорджа Макфлая, в продолжениях не участвовал.` },
    { id: 'plot', title: 'Сюжет и мир', content: `В первом фильме Марти случайно попадает из 1985 года в 1955-й, мешает знакомству собственных родителей и должен свести их снова, пока не исчез сам. Вернуться домой помогает молния, которая в 10:04 вечера 12 ноября 1955 года бьёт в часы на здании суда.

Во второй части герои летят в 21 октября 2015 года, а затем исправляют «другой» 1985 год, где хулиган Бифф Таннен разбогател благодаря спортивному альманаху из будущего. Третья часть переносит действие в 1885 год, на Дикий Запад, где Док встречает учительницу Клару Клейтон.

Хилл-Вэлли — главный герой трилогии наравне с людьми: площадь перед судом показана в каждой эпохе, и по вывескам видно, как меняется город.` },
    { id: 'delorean', title: 'Машина времени', content: `<ul>
<li><strong>Автомобиль.</strong> ДеЛориан DMC-12 с кузовом из нержавеющей стали и дверями «крыло чайки» выпускался в Северной Ирландии в 1981–1982 годах; построено около девяти тысяч машин.</li>
<li><strong>Потоковый конденсатор</strong> — Y-образный прибор, который «делает возможным путешествие во времени».</li>
<li><strong>88 миль в час</strong> — скорость, на которой машина уходит во времени, оставляя за собой огненный след.</li>
<li><strong>1,21 гигаватта</strong> — мощность, которую сначала даёт плутоний, а позже «Мистер Фьюжн», переделанный бытовой реактор на мусоре.</li>
<li><strong>Временные контуры</strong> — табло с тремя датами: куда, откуда и где машина была в прошлый раз.</li>
</ul>

В ранних вариантах сценария машиной времени был холодильник; от него отказались, чтобы дети не начали забираться в холодильники.` },
    { id: 'music', title: 'Музыка и награды', content: `Оркестровую тему написал Алан Сильвестри; её фанфары стали визитной карточкой трилогии. Песня группы Huey Lewis and the News «The Power of Love» возглавила американский хит-парад и была номинирована на «Оскар», а вторая песня группы, «Back in Time», звучит в финале первого фильма. Сам фильм получил «Оскар» за монтаж звуковых эффектов.` },
    { id: 'games', title: 'Игры и аттракционы', content: `<table class="interpedia-wikitable">
<tr><th>Название</th><th>Год</th><th>Платформа</th></tr>
<tr><td>Back to the Future (Electric Dreams)</td><td>1985</td><td>ZX Spectrum, Commodore 64</td></tr>
<tr><td>Back to the Future (LJN)</td><td>1989</td><td>NES</td></tr>
<tr><td>Игры по второй и третьей частям</td><td>1990–1991</td><td>домашние компьютеры, приставки</td></tr>
<tr><td>Back to the Future: The Ride</td><td>1991</td><td>аттракцион Universal Studios</td></tr>
</table>

Ранние игры критиковали за то, что от фильмов в них оставались только имена. Аттракцион в парках Universal, напротив, считается одним из лучших симуляторов полёта: зрители «гонятся» за Биффом сквозь время в восьмиместном ДеЛориане. В 1991–1992 годах выходил мультсериал, где Кристофер Ллойд вёл игровые вставки.` },
    { id: 'telltale', title: 'Квест Telltale', content: `Студия Telltale Games объявила приключенческую игру <em>Back to the Future: The Game</em>, первый эпизод которой, «Самое время», ожидается в 2000 году. По словам разработчиков, действие начнётся в мае 1986 года: Док пропал полгода назад, его гараж распродают, а ДеЛориан возвращается сам, без водителя. Марти отправится в Хилл-Вэлли 1931 года, времён сухого закона, где ему придётся работать вместе с семнадцатилетним Эмметтом Брауном против гангстера Кида Таннена.

Игра обещана в классическом жанре «наведи и щёлкни»: рисованная графика 640×480 в 256 цветах, курсор, который сам подсказывает действие, реплики с портретами и субтитрами. Продавать её будут через сервис Steam.` },
    { id: 'russia', title: 'В России', content: `В конце 1980-х и в 1990-х фильмы разошлись в России на видеокассетах с одноголосым авторским переводом, позже их показывали по телевидению. Настоящий ДеЛориан в стране почти никто не видел, но его силуэт узнают сразу: картинки машины и часов Хилл-Вэлли часто встречаются на обоях рабочего стола и в домашних страницах любителей кино.` }
  ],
  seeAlso: ['scumm', 'grimfandango', 'y2k'],
  references: [
    'Klastorin M., Hibbs S. Back to the Future: The Official Book of the Complete Movie Trilogy. — Mallard Press, 1990.',
    'Земекис Р., Гейл Б. «Назад в будущее»: сценарий. — Universal Pictures, 1985.',
    'Telltale Games. Back to the Future: The Game. Анонс для прессы, 1999.'
  ],
  links: [['http://www.steampowered.com', 'Steam: Back to the Future: The Game']],
  categories: ['Кино', 'Научная фантастика', 'Путешествия во времени']
}, {
  title: 'Back to the Future',
  hatnote: 'This article is about the film trilogy. For the upcoming adventure game, see the section "The Telltale adventure".',
  infobox: {
    title: 'Back to the Future',
    badgeText: '88 miles per hour',
    fields: [
      { label: 'Russian title', value: 'Назад в будущее' },
      { label: 'Director', value: 'Robert Zemeckis' },
      { label: 'Writers', value: 'Robert Zemeckis, Bob Gale' },
      { label: 'Executive producer', value: 'Steven Spielberg (Amblin Entertainment)' },
      { label: 'Starring', value: 'Michael J. Fox, Christopher Lloyd, Lea Thompson, Crispin Glover, Thomas F. Wilson' },
      { label: 'Music', value: 'Alan Silvestri' },
      { label: 'Films', value: '1985, 1989, 1990' },
      { label: 'New game', value: 'Back to the Future: The Game, Telltale Games, expected in 2000' }
    ]
  },
  lead: `<strong>Back to the Future</strong> is a trilogy of science fiction comedies by Robert Zemeckis about high school student Marty McFly and the inventor Emmett "Doc" Brown, who built a time machine out of a DeLorean sports car. The first film opened in the United States on 3 July 1985 and became the highest-grossing film of the year at the American box office; the sequels followed in 1989 and 1990.

"Great Scott!", "1.21 gigawatts", the silver DeLorean with its upward-opening doors and the clock on the Hill Valley courthouse are known to audiences all over the world. Telltale Games is preparing an adventure game based on the trilogy, with the first episode expected in 2000.`,
  sections: [
    { id: 'films', title: 'Films', content: `Zemeckis and Gale wrote the first script in the early 1980s, but studios turned it down for years until Steven Spielberg backed the project. Eric Stoltz was first cast as Marty; after several weeks of shooting he was replaced by Michael J. Fox, who worked on the sitcom Family Ties by day and on the film by night.

The second and third films were shot back to back as one long production. Back to the Future Part II opened in November 1989 and Part III in May 1990. Crispin Glover, who played George McFly, did not return for the sequels.` },
    { id: 'plot', title: 'Story and setting', content: `In the first film Marty is accidentally sent from 1985 to 1955, gets in the way of his own parents meeting and has to bring them together again before he fades away. The way home is the lightning bolt that strikes the courthouse clock at 10:04 p.m. on 12 November 1955.

In Part II the heroes travel to 21 October 2015 and then have to repair an "alternate" 1985 in which the bully Biff Tannen grew rich with a sports almanac from the future. Part III moves to 1885 and the Wild West, where Doc meets the schoolteacher Clara Clayton.

Hill Valley itself is as much a character as the people: the courthouse square appears in every era, and its shop signs show how the town changes.` },
    { id: 'delorean', title: 'The time machine', content: `<ul>
<li><strong>The car.</strong> The DeLorean DMC-12, with a stainless steel body and gull-wing doors, was built in Northern Ireland in 1981–1982; about nine thousand were made.</li>
<li><strong>The flux capacitor</strong> is the Y-shaped device that "makes time travel possible".</li>
<li><strong>88 miles per hour</strong> is the speed at which the car leaves its time, leaving trails of fire behind.</li>
<li><strong>1.21 gigawatts</strong> is the power supplied first by plutonium and later by "Mr. Fusion", a converted household reactor that runs on rubbish.</li>
<li><strong>The time circuits</strong> are a display of three dates: destination, present and last time departed.</li>
</ul>

In early drafts of the script the time machine was a refrigerator; the idea was dropped for fear that children would climb into refrigerators.` },
    { id: 'music', title: 'Music and awards', content: `Alan Silvestri wrote the orchestral theme, whose fanfare became the signature of the trilogy. Huey Lewis and the News reached number one in the United States with "The Power of Love", which was nominated for an Academy Award, and their second song, "Back in Time", plays at the end of the first film. The film itself won the Academy Award for Sound Effects Editing.` },
    { id: 'games', title: 'Games and rides', content: `<table class="interpedia-wikitable">
<tr><th>Title</th><th>Year</th><th>Platform</th></tr>
<tr><td>Back to the Future (Electric Dreams)</td><td>1985</td><td>ZX Spectrum, Commodore 64</td></tr>
<tr><td>Back to the Future (LJN)</td><td>1989</td><td>NES</td></tr>
<tr><td>Games of Parts II and III</td><td>1990–1991</td><td>home computers, consoles</td></tr>
<tr><td>Back to the Future: The Ride</td><td>1991</td><td>Universal Studios ride</td></tr>
</table>

The early games were criticised for keeping little of the films except the names. The ride at the Universal parks, by contrast, is counted among the best motion simulators: visitors chase Biff through time in an eight-seat DeLorean. An animated series ran in 1991–1992, with Christopher Lloyd presenting live-action segments.` },
    { id: 'telltale', title: 'The Telltale adventure', content: `Telltale Games has announced the adventure <em>Back to the Future: The Game</em>, whose first episode, "It's About Time", is expected in 2000. According to the developers, the story begins in May 1986: Doc has been missing for six months, his garage is being sold off, and the DeLorean comes back on its own with nobody at the wheel. Marty travels to the Hill Valley of 1931, in the days of Prohibition, where he has to work with seventeen-year-old Emmett Brown against the gangster Kid Tannen.

The game is promised as a classic point-and-click adventure: hand-drawn graphics at 640×480 in 256 colours, a cursor that suggests the action by itself, and dialogue with portraits and subtitles. It will be sold through the Steam service.` },
    { id: 'russia', title: 'In Russia', content: `In the late 1980s and the 1990s the films spread in Russia on videotapes with single-voice translations and were later shown on television. Hardly anyone in the country has seen a real DeLorean, but its silhouette is recognised at once: pictures of the car and the Hill Valley clock are common on desktop wallpapers and on the home pages of film fans.` }
  ],
  seeAlso: ['scumm', 'grimfandango', 'y2k'],
  references: [
    'Klastorin M., Hibbs S. Back to the Future: The Official Book of the Complete Movie Trilogy. — Mallard Press, 1990.',
    'Zemeckis R., Gale B. Back to the Future: screenplay. — Universal Pictures, 1985.',
    'Telltale Games. Back to the Future: The Game. Press announcement, 1999.'
  ],
  links: [['http://www.steampowered.com', 'Steam: Back to the Future: The Game']],
  categories: ['Film', 'Science Fiction', 'Time Travel']
}, ['back to the future', 'назад в будущее', 'delorean', 'делориан']);
