window.interpediaReg('voodoo', 'hardware', {
  title: '3dfx Voodoo Graphics (SST-1)',
  hatnote: 'Статья о первом ускорителе 3dfx. О следующей модели см. [[voodoo2|Voodoo 2]].',
  infobox: {
    title: '3dfx Voodoo Graphics',
    badgeText: '3D-ускоритель, 1996',
    fields: [
      { label: 'Разработчик', value: '3dfx Interactive' },
      { label: 'Выход на ПК', value: 'осень 1996' },
      { label: 'Набор микросхем', value: 'SST-1: FBI (буфер кадра) и TMU (текстуры)' },
      { label: 'Частота', value: '50 МГц' },
      { label: 'Память', value: '4 МБ EDO (2 МБ кадр + 2 МБ текстуры)' },
      { label: 'Разрешение', value: 'до 640×480 с Z-буфером' },
      { label: 'Скорость заполнения', value: '50 млн пикселей/с' },
      { label: 'Шина', value: 'PCI' },
      { label: 'API', value: 'Glide, MiniGL, Direct3D' },
      { label: 'Платы', value: 'Orchid Righteous 3D, Diamond Monster 3D и др.' }
    ]
  },
  lead: `<strong>3dfx Voodoo Graphics</strong> (набор микросхем SST-1) — трёхмерный графический ускоритель компании 3dfx Interactive, появившийся на рынке ПК осенью 1996 года. Плата не умела выводить обычную двухмерную картинку и подключалась к основной видеокарте внешним кабелем, но в играх давала изображение, недостижимое для процессора: сглаженные текстуры, прозрачность, туман и плавную частоту кадров.

Voodoo превратил 3D-ускоритель из диковинки в обязательную часть игрового компьютера. Фирменный программный интерфейс Glide на несколько лет стал стандартом де-факто, а надпись «3dfx» на коробке с игрой означала, что она будет выглядеть лучше всего.`,
  sections: [
    { id: 'company', title: '3dfx Interactive', content: `Компанию 3dfx основали в 1994 году в Сан-Хосе трое инженеров, ранее работавших в Silicon Graphics: Росс Смит, Гэри Таролли и Скотт Селлерс. Они рассчитывали, что дешёвая память и производство микросхем позволят перенести графику уровня рабочих станций в игровые автоматы и домашние ПК. Сначала Voodoo появился в аркадных автоматах, а затем — на платах для ПК, которые выпускали партнёры: Orchid, Diamond, Canopus, Quantum3D и другие.` },
    { id: 'design', title: 'Устройство', content: `Ускоритель состоит из двух микросхем. FBI (Frame Buffer Interface) управляет буфером кадра и Z-буфером, выполняет смешивание цветов и туман, а TMU (Texture Mapping Unit) накладывает текстуры с билинейной фильтрацией и MIP-картами. Каждой микросхеме отведено по 2 МБ памяти.

<table class="interpedia-wikitable">
<tr><th>Возможность</th><th>Что даёт</th></tr>
<tr><td>Билинейная фильтрация</td><td>гладкие текстуры вместо «квадратиков» программного рендера</td></tr>
<tr><td>Коррекция перспективы</td><td>текстуры не «плывут» на наклонных стенах</td></tr>
<tr><td>Z-буфер</td><td>правильный порядок перекрытия объектов</td></tr>
<tr><td>Альфа-смешивание</td><td>полупрозрачные вода, стекло, взрывы</td></tr>
<tr><td>Туман</td><td>плавное исчезновение дальних объектов</td></tr>
</table>` },
    { id: 'passthrough', title: 'Сквозной кабель', content: `Voodoo — «чистый» 3D-ускоритель. Монитор подключается к нему, а он, в свою очередь, коротким кабелем к обычной 2D-видеокарте. Когда игра включает 3D-режим, реле на плате переключает выход на изображение Voodoo — характерный щелчок слышен в начале каждой игры. Решение экономило деньги покупателя, который мог оставить старую видеокарту, но немного ухудшало чёткость 2D-картинки.` },
    { id: 'glide', title: 'Glide и игры', content: `Glide — собственный программный интерфейс 3dfx, упрощённая версия OpenGL, повторяющая возможности оборудования. Он был быстрее и проще в использовании, чем Direct3D 1990-х, и многие разработчики писали игры именно под него. Для [[quake|GLQuake]] 3dfx выпустила драйвер MiniGL, реализующий только нужную игре часть OpenGL.

Среди игр, раскрывших возможности Voodoo, — GLQuake, Tomb Raider с патчем для 3dfx, POD, MechWarrior 2 и Need for Speed II SE. Для многих игроков именно GLQuake стал первым знакомством с ускорителем.` },
    { id: 'models', title: 'Наследники', content: `<table class="interpedia-wikitable">
<tr><th>Модель</th><th>Год</th><th>Особенности</th></tr>
<tr><td>Voodoo Rush</td><td>1997</td><td>совмещённая 2D/3D-плата, медленнее оригинала</td></tr>
<tr><td>[[voodoo2|Voodoo 2]]</td><td>1998</td><td>два текстурных блока, режим SLI</td></tr>
<tr><td>Voodoo Banshee</td><td>1998</td><td>2D и 3D на одном чипе</td></tr>
<tr><td>Voodoo3</td><td>1999</td><td>2D/3D, платы выпускает сама 3dfx</td></tr>
</table>

В 1999 году 3dfx купила производителя плат STB Systems и перестала продавать микросхемы другим фирмам. На выставке COMDEX в ноябре 1999 года компания объявила Voodoo4 и Voodoo5 на новом чипе VSA-100 с полноэкранным сглаживанием.` },
    { id: 'russia', title: 'Voodoo в России', content: `В России плата Voodoo стоила для многих непомерно дорого, особенно после кризиса 1998 года, и долго оставалась мечтой. [[lanparty|Компьютерные клубы]] рекламировали «машины с 3Dfx», а журналы публиковали советы по разгону и выбору платы. Слово «тридэфикс» стало в разговорной речи синонимом 3D-ускорителя вообще.` }
  ],
  seeAlso: ['voodoo2', 'rivatnt', 'quake', 'agpbus', 'overclocking'],
  references: [
    '3dfx Interactive. Voodoo Graphics Specification. — 1996.',
    '3dfx Interactive. Glide Programming Guide. — 1997.',
    'Обзор 3D-ускорителей // Компьютерра. — 1997.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: драйверы, разгон, тесты']],
  categories: ['Компьютерное железо', '3D-ускорители', '3dfx']
}, {
  title: '3dfx Voodoo Graphics (SST-1)',
  hatnote: 'This article is about 3dfx\'s first accelerator. For the next model, see [[voodoo2|Voodoo 2]].',
  infobox: {
    title: '3dfx Voodoo Graphics',
    badgeText: '3D accelerator, 1996',
    fields: [
      { label: 'Developer', value: '3dfx Interactive' },
      { label: 'PC release', value: 'autumn 1996' },
      { label: 'Chipset', value: 'SST-1: FBI (frame buffer) and TMU (textures)' },
      { label: 'Clock', value: '50 MHz' },
      { label: 'Memory', value: '4 MB EDO (2 MB frame + 2 MB texture)' },
      { label: 'Resolution', value: 'up to 640×480 with Z-buffer' },
      { label: 'Fill rate', value: '50 million pixels/s' },
      { label: 'Bus', value: 'PCI' },
      { label: 'APIs', value: 'Glide, MiniGL, Direct3D' },
      { label: 'Boards', value: 'Orchid Righteous 3D, Diamond Monster 3D and others' }
    ]
  },
  lead: `<strong>3dfx Voodoo Graphics</strong> (the SST-1 chipset) is a 3D graphics accelerator from 3dfx Interactive that reached the PC market in autumn 1996. The board could not display ordinary 2D graphics and connected to the main video card with an external cable, but in games it produced images no processor could match: filtered textures, transparency, fog and smooth frame rates.

Voodoo turned the 3D accelerator from a curiosity into an essential part of a gaming PC. Its proprietary Glide programming interface became a de facto standard for several years, and a "3dfx" label on a game box meant it would look its best.`,
  sections: [
    { id: 'company', title: '3dfx Interactive', content: `3dfx was founded in 1994 in San Jose by three former Silicon Graphics engineers: Ross Smith, Gary Tarolli and Scott Sellers. They bet that cheap memory and chip manufacturing would bring workstation-class graphics to arcade machines and home PCs. Voodoo first appeared in arcade cabinets and then on PC boards made by partners such as Orchid, Diamond, Canopus and Quantum3D.` },
    { id: 'design', title: 'Design', content: `The accelerator consists of two chips. The FBI (Frame Buffer Interface) manages the frame buffer and Z-buffer and handles blending and fog, while the TMU (Texture Mapping Unit) applies textures with bilinear filtering and MIP maps. Each chip has 2 MB of memory.

<table class="interpedia-wikitable">
<tr><th>Feature</th><th>Benefit</th></tr>
<tr><td>Bilinear filtering</td><td>smooth textures instead of software rendering's blocky pixels</td></tr>
<tr><td>Perspective correction</td><td>textures do not swim on angled walls</td></tr>
<tr><td>Z-buffer</td><td>correct overlap of objects</td></tr>
<tr><td>Alpha blending</td><td>translucent water, glass and explosions</td></tr>
<tr><td>Fog</td><td>distant objects fade out smoothly</td></tr>
</table>` },
    { id: 'passthrough', title: 'Pass-through cable', content: `Voodoo is a pure 3D accelerator. The monitor plugs into it, and it connects to an ordinary 2D video card with a short cable. When a game switches to 3D, a relay on the board switches the output to the Voodoo picture, with a click heard at the start of every game. The design saved buyers money, since they could keep their old video card, but slightly softened the 2D picture.` },
    { id: 'glide', title: 'Glide and games', content: `Glide is 3dfx's own programming interface, a simplified OpenGL that mirrors the hardware's abilities. It was faster and simpler than the Direct3D of the 1990s, and many developers wrote games for it directly. For [[quake|GLQuake]], 3dfx released a MiniGL driver implementing only the part of OpenGL the game needed.

Games that showed off Voodoo include GLQuake, Tomb Raider with its 3dfx patch, POD, MechWarrior 2 and Need for Speed II SE. For many players GLQuake was their first taste of an accelerator.` },
    { id: 'models', title: 'Successors', content: `<table class="interpedia-wikitable">
<tr><th>Model</th><th>Year</th><th>Features</th></tr>
<tr><td>Voodoo Rush</td><td>1997</td><td>combined 2D/3D board, slower than the original</td></tr>
<tr><td>[[voodoo2|Voodoo 2]]</td><td>1998</td><td>two texture units, SLI mode</td></tr>
<tr><td>Voodoo Banshee</td><td>1998</td><td>2D and 3D on one chip</td></tr>
<tr><td>Voodoo3</td><td>1999</td><td>2D/3D, boards made by 3dfx itself</td></tr>
</table>

In 1999 3dfx bought board maker STB Systems and stopped selling chips to other companies. At COMDEX in November 1999 it announced the Voodoo4 and Voodoo5 on the new VSA-100 chip with full-scene anti-aliasing.` },
    { id: 'russia', title: 'Voodoo in Russia', content: `In Russia a Voodoo board was too expensive for many, especially after the 1998 crisis, and long remained a dream. [[lanparty|Computer clubs]] advertised "machines with 3Dfx", and magazines printed advice on overclocking and choosing a board. In everyday speech "3Dfx" became a synonym for any 3D accelerator.` }
  ],
  seeAlso: ['voodoo2', 'rivatnt', 'quake', 'agpbus', 'overclocking'],
  references: [
    '3dfx Interactive. Voodoo Graphics Specification, 1996.',
    '3dfx Interactive. Glide Programming Guide, 1997.',
    '"3D accelerator roundup". Computerra, 1997.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: drivers, overclocking, benchmarks']],
  categories: ['Hardware', '3D Accelerators', '3dfx']
}, ['voodoogfx']);

window.interpediaReg('voodoo2', 'hardware', {
  title: '3dfx Voodoo 2 (1998)',
  infobox: {
    title: '3dfx Voodoo 2',
    badgeText: 'Voodoo2 SLI',
    fields: [
      { label: 'Разработчик', value: '3dfx Interactive' },
      { label: 'Выход', value: 'февраль 1998' },
      { label: 'Частота', value: '90 МГц' },
      { label: 'Текстурные блоки', value: '2 (мультитекстурирование за проход)' },
      { label: 'Память', value: '8 или 12 МБ EDO' },
      { label: 'Разрешение', value: 'до 800×600; 1024×768 в режиме SLI' },
      { label: 'Скорость заполнения', value: '90 млн пикселей/с, 180 млн текселей/с' },
      { label: 'Шина', value: 'PCI' },
      { label: 'Цена при выходе', value: 'около 250–300 $' }
    ]
  },
  lead: `<strong>3dfx Voodoo 2</strong> — второе поколение трёхмерных ускорителей 3dfx, вышедшее в начале 1998 года. Как и [[voodoo|первый Voodoo]], это отдельная 3D-плата, работающая в паре с обычной видеокартой, но почти втрое более быстрая благодаря частоте 90 МГц и двум текстурным блокам.

Главная особенность Voodoo 2 — режим SLI: две одинаковые платы, соединённые шлейфом, рисуют чётные и нечётные строки изображения, удваивая скорость и поднимая разрешение до 1024×768. Компьютер с двумя Voodoo 2 стал символом идеальной игровой машины 1998 года.`,
  sections: [
    { id: 'architecture', title: 'Архитектура', content: `Voodoo 2 состоит из трёх микросхем: одного блока обработки пикселей и двух текстурных блоков (TMU). Второй текстурный блок позволяет наложить две текстуры за один проход — например, основную текстуру стены и карту освещения в [[quake2|Quake II]], — тогда как первый Voodoo делал это в два прохода. Ускоритель берёт на себя также установку треугольников, которую раньше выполнял центральный процессор.

Платы выпускались с 8 МБ (по 2 МБ на каждый текстурный блок и 4 МБ на кадр) и с 12 МБ (по 4 МБ на текстуры). Версия с 12 МБ вмещает вдвое больше текстур, что заметно в играх с детальной графикой.` },
    { id: 'sli', title: 'Режим SLI', content: `SLI (Scan-Line Interleave) — технология объединения двух плат. Каждая плата отрисовывает свою половину строк изображения, а затем картинки смешиваются в одну. Две платы соединяются внутренним шлейфом, а монитор подключается к основной из них.

<table class="interpedia-wikitable">
<tr><th>Конфигурация</th><th>Макс. разрешение</th><th>Quake II, 800×600</th></tr>
<tr><td>Voodoo 2, 8 МБ</td><td>800×600</td><td>около 40 кадров/с</td></tr>
<tr><td>Voodoo 2, 12 МБ</td><td>800×600</td><td>около 40 кадров/с</td></tr>
<tr><td>Voodoo 2 SLI</td><td>1024×768</td><td>около 70 кадров/с</td></tr>
</table>

Цифры приблизительны и зависят от процессора; лучшие результаты достигались с [[pentium2|Pentium II]] 400–450 МГц.` },
    { id: 'boards', title: 'Платы', content: `3dfx в то время продавала микросхемы производителям плат. Voodoo 2 выпускали Creative (3D Blaster Voodoo2), Diamond (Monster 3D II), STB (BlackMagic 3D), Canopus (Pure3D II, с видеовыходом), Metabyte (Wicked3D), Guillemot, Quantum3D и другие. Платы различались объёмом памяти, охлаждением и комплектом игр.` },
    { id: 'games', title: 'Игры', content: `В 1998 году Voodoo 2 — лучший выбор для игр. Через Glide работают [[unreal|Unreal]], Need for Speed III, Turok и десятки других игр, через MiniGL — [[quake2|Quake II]], [[halflife|Half-Life]] и SiN. Демозапись Quake II стала стандартным тестом: «сколько кадров выдаёт на Voodoo 2» — один из самых частых вопросов в журналах и конференциях.` },
    { id: 'rivals', title: 'Соперники', content: `В конце 1998 года появились совмещённые 2D/3D-платы на чипе [[rivatnt|RIVA TNT]] от NVIDIA, поддерживающие 32-битный цвет и большие текстуры, тогда как Voodoo 2 ограничен 16-битным цветом и текстурами 256×256. В 1999 году 3dfx ответила моделью Voodoo3, объединившей 2D и 3D на одной плате, но 16-битное ограничение сохранилось, и спор «32 бита против скорости» стал главной темой года.` }
  ],
  seeAlso: ['voodoo', 'rivatnt', 'quake2', 'pentium2', 'agpbus'],
  references: [
    '3dfx Interactive. Voodoo2 Graphics Technical Reference. — 1998.',
    'Тест плат на Voodoo 2 // Мир ПК. — 1998.',
    'Тесты Voodoo2 SLI в Quake II // Компьютерра. — 1998.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: калькулятор FPS и разгон']],
  categories: ['Компьютерное железо', '3D-ускорители', '3dfx']
}, {
  title: '3dfx Voodoo 2 (1998)',
  infobox: {
    title: '3dfx Voodoo 2',
    badgeText: 'Voodoo2 SLI',
    fields: [
      { label: 'Developer', value: '3dfx Interactive' },
      { label: 'Released', value: 'February 1998' },
      { label: 'Clock', value: '90 MHz' },
      { label: 'Texture units', value: '2 (single-pass multitexturing)' },
      { label: 'Memory', value: '8 or 12 MB EDO' },
      { label: 'Resolution', value: 'up to 800×600; 1024×768 in SLI' },
      { label: 'Fill rate', value: '90 million pixels/s, 180 million texels/s' },
      { label: 'Bus', value: 'PCI' },
      { label: 'Launch price', value: 'about $250–300' }
    ]
  },
  lead: `<strong>3dfx Voodoo 2</strong> is the second generation of 3dfx 3D accelerators, released in early 1998. Like the [[voodoo|original Voodoo]], it is a separate 3D board working alongside an ordinary video card, but nearly three times faster thanks to its 90 MHz clock and two texture units.

The main feature of Voodoo 2 is SLI: two identical boards joined by a ribbon cable draw the even and odd lines of the image, doubling speed and raising the resolution to 1024×768. A PC with two Voodoo 2 cards became the symbol of the ideal gaming machine of 1998.`,
  sections: [
    { id: 'architecture', title: 'Architecture', content: `Voodoo 2 consists of three chips: one pixel processor and two texture units (TMUs). The second texture unit applies two textures in one pass, for example a wall texture and its lightmap in [[quake2|Quake II]], where the first Voodoo needed two passes. The accelerator also handles triangle setup, previously done by the main processor.

Boards came with 8 MB (2 MB per texture unit and 4 MB for the frame) or 12 MB (4 MB per texture unit). The 12 MB version holds twice as many textures, which shows in games with detailed graphics.` },
    { id: 'sli', title: 'SLI mode', content: `SLI (Scan-Line Interleave) combines two boards. Each board renders its half of the scan lines, and the images are merged into one. The boards are joined by an internal ribbon cable, and the monitor connects to the primary one.

<table class="interpedia-wikitable">
<tr><th>Configuration</th><th>Max resolution</th><th>Quake II, 800×600</th></tr>
<tr><td>Voodoo 2, 8 MB</td><td>800×600</td><td>about 40 fps</td></tr>
<tr><td>Voodoo 2, 12 MB</td><td>800×600</td><td>about 40 fps</td></tr>
<tr><td>Voodoo 2 SLI</td><td>1024×768</td><td>about 70 fps</td></tr>
</table>

Figures are approximate and depend on the processor; the best results came with a [[pentium2|Pentium II]] at 400–450 MHz.` },
    { id: 'boards', title: 'Boards', content: `At the time 3dfx sold its chips to board makers. Voodoo 2 boards were made by Creative (3D Blaster Voodoo2), Diamond (Monster 3D II), STB (BlackMagic 3D), Canopus (Pure3D II, with video out), Metabyte (Wicked3D), Guillemot, Quantum3D and others. They differed in memory, cooling and bundled games.` },
    { id: 'games', title: 'Games', content: `In 1998 Voodoo 2 was the best choice for games. [[unreal|Unreal]], Need for Speed III, Turok and dozens of others run through Glide, and [[quake2|Quake II]], [[halflife|Half-Life]] and SiN through MiniGL. The Quake II demo became the standard benchmark, and "how many frames does it get on a Voodoo 2" was one of the most common questions in magazines and newsgroups.` },
    { id: 'rivals', title: 'Rivals', content: `In late 1998 combined 2D/3D boards based on NVIDIA's [[rivatnt|RIVA TNT]] appeared, supporting 32-bit color and large textures, whereas Voodoo 2 is limited to 16-bit color and 256×256 textures. In 1999 3dfx answered with Voodoo3, which put 2D and 3D on one board, but the 16-bit limit remained, and the "32-bit versus speed" debate became the main topic of the year.` }
  ],
  seeAlso: ['voodoo', 'rivatnt', 'quake2', 'pentium2', 'agpbus'],
  references: [
    '3dfx Interactive. Voodoo2 Graphics Technical Reference, 1998.',
    '"Voodoo 2 board roundup". Mir PK, 1998.',
    '"Voodoo2 SLI in Quake II". Computerra, 1998.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: FPS calculator and overclocking']],
  categories: ['Hardware', '3D Accelerators', '3dfx']
});

window.interpediaReg('rivatnt', 'hardware', {
  title: 'NVIDIA RIVA TNT / TNT2',
  infobox: {
    title: 'NVIDIA RIVA TNT',
    badgeText: 'TwiN Texel',
    fields: [
      { label: 'Разработчик', value: 'NVIDIA' },
      { label: 'Выход', value: 'TNT — осень 1998, TNT2 — весна 1999' },
      { label: 'Техпроцесс', value: '0,35 мкм (TNT), 0,25 мкм (TNT2)' },
      { label: 'Частота', value: '90 МГц (TNT), до 150 МГц (TNT2 Ultra)' },
      { label: 'Память', value: '16 МБ (TNT), до 32 МБ (TNT2)' },
      { label: 'Цвет', value: '32 бита, Z-буфер 24 бита, буфер трафарета' },
      { label: 'Шина', value: '[[agpbus|AGP]] 2x / 4x, PCI' },
      { label: 'API', value: 'Direct3D, OpenGL' },
      { label: 'Предшественник', value: 'RIVA 128 (1997)' },
      { label: 'Преемник', value: 'GeForce 256 (1999)' }
    ]
  },
  lead: `<strong>RIVA TNT</strong> (от <em>TwiN Texel</em>) — графический процессор компании NVIDIA, вышедший осенью 1998 года, и его улучшенная версия <strong>TNT2</strong> (1999). В отличие от [[voodoo2|3dfx Voodoo 2]], это совмещённая 2D/3D-видеокарта: один чип отвечает и за рабочий стол, и за трёхмерную графику.

TNT обрабатывает два текселя за такт, поддерживает 32-битный цвет, большие текстуры и полноценные драйверы OpenGL. Он стал первым серьёзным соперником 3dfx и сделал NVIDIA одним из лидеров рынка. В октябре 1999 года компания выпустила его преемника — GeForce 256.`,
  sections: [
    { id: 'nvidia', title: 'NVIDIA', content: `NVIDIA основали в 1993 году Дженсен Хуанг, Крис Малаховски и Кёртис Прием. Первый продукт, NV1 (1995), работал с квадратичными поверхностями вместо треугольников и не прижился. Успех пришёл с RIVA 128 (1997) — быстрой и недорогой 2D/3D-микросхемой со 128-битной шиной памяти, которую выбрали многие производители компьютеров.` },
    { id: 'tnt', title: 'RIVA TNT', content: `TNT имеет два конвейера, которые накладывают две текстуры за такт или обрабатывают два пикселя одновременно. Чип поддерживает 32-битный цвет, 24-битный Z-буфер и 8-битный буфер трафарета, текстуры до 1024×1024 и разрешение до 1600×1200 и выше. Первоначально NVIDIA обещала частоту 125 МГц, но платы вышли с частотой 90 МГц, и скорость оказалась сопоставимой с [[voodoo2|Voodoo 2]], а не выше неё.

Главным преимуществом стало качество изображения: в 32-битном цвете нет «полосатых» переходов и шума, заметных в 16-битном режиме Voodoo.` },
    { id: 'tnt2', title: 'TNT2', content: `TNT2 (весна 1999) выпускается по технологии 0,25 мкм, работает на частотах от 125 до 150 МГц, поддерживает до 32 МБ памяти и шину [[agpbus|AGP]] 4x. Выпускались несколько вариантов: TNT2 Ultra для энтузиастов, обычный TNT2 и упрощённые Vanta и TNT2 M64 для недорогих компьютеров.

<table class="interpedia-wikitable">
<tr><th>Чип</th><th>Ядро, МГц</th><th>Память</th><th>Назначение</th></tr>
<tr><td>RIVA TNT</td><td>90</td><td>до 16 МБ</td><td>основная модель 1998 года</td></tr>
<tr><td>TNT2</td><td>125</td><td>до 32 МБ</td><td>массовая модель 1999 года</td></tr>
<tr><td>TNT2 Ultra</td><td>150</td><td>до 32 МБ</td><td>для энтузиастов</td></tr>
<tr><td>TNT2 M64</td><td>125</td><td>до 32 МБ, 64-битная шина</td><td>бюджетные ПК</td></tr>
</table>` },
    { id: 'boards', title: 'Платы', content: `NVIDIA продаёт чипы производителям плат. На TNT вышли Diamond Viper V550, Creative Graphics Blaster RIVA TNT, STB Velocity 4400 и ASUS V3400TNT, на TNT2 — Diamond Viper V770, Creative 3D Blaster TNT2 Ultra, ASUS V3800 и многие другие. Некоторые платы оснащались видеовыходом и входом и стереоочками.` },
    { id: 'rivalry', title: 'Соперничество с 3dfx', content: `Спор TNT и Voodoo — один из главных сюжетов 1998–1999 годов. Сторонники 3dfx ценили скорость и совместимость с играми на Glide, сторонники NVIDIA — 32-битный цвет, большие текстуры и открытые стандарты Direct3D и OpenGL. Когда в 1999 году 3dfx перестала продавать чипы сторонним производителям, многие из них перешли на NVIDIA.` },
    { id: 'geforce', title: 'GeForce 256', content: `В октябре 1999 года NVIDIA выпустила GeForce 256, назвав его первым в мире «графическим процессором» (GPU). Он берёт на себя не только закраску пикселей, но и преобразование координат и освещение (T&L), которые раньше рассчитывал центральный процессор. Игры, использующие эту возможность, только начинают появляться.` }
  ],
  seeAlso: ['voodoo2', 'voodoo', 'agpbus', 'pentium2', 'quake2'],
  references: [
    'NVIDIA Corporation. RIVA TNT Product Overview. — 1998.',
    'NVIDIA Corporation. GeForce 256 Technical Brief. — 1999.',
    'Сравнительный тест TNT2 и Voodoo3 // Мир ПК. — 1999.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: сравнение с TNT']],
  categories: ['Компьютерное железо', '3D-ускорители', 'NVIDIA']
}, {
  title: 'NVIDIA RIVA TNT / TNT2',
  infobox: {
    title: 'NVIDIA RIVA TNT',
    badgeText: 'TwiN Texel',
    fields: [
      { label: 'Developer', value: 'NVIDIA' },
      { label: 'Released', value: 'TNT autumn 1998, TNT2 spring 1999' },
      { label: 'Process', value: '0.35 µm (TNT), 0.25 µm (TNT2)' },
      { label: 'Clock', value: '90 MHz (TNT), up to 150 MHz (TNT2 Ultra)' },
      { label: 'Memory', value: '16 MB (TNT), up to 32 MB (TNT2)' },
      { label: 'Color', value: '32-bit, 24-bit Z-buffer, stencil buffer' },
      { label: 'Bus', value: '[[agpbus|AGP]] 2x / 4x, PCI' },
      { label: 'APIs', value: 'Direct3D, OpenGL' },
      { label: 'Predecessor', value: 'RIVA 128 (1997)' },
      { label: 'Successor', value: 'GeForce 256 (1999)' }
    ]
  },
  lead: `<strong>RIVA TNT</strong> (from <em>TwiN Texel</em>) is a graphics processor from NVIDIA released in autumn 1998, and <strong>TNT2</strong> (1999) is its improved version. Unlike the [[voodoo2|3dfx Voodoo 2]], it is a combined 2D/3D video card: one chip handles both the desktop and 3D graphics.

TNT processes two texels per clock and supports 32-bit color, large textures and full OpenGL drivers. It became 3dfx's first serious rival and made NVIDIA a market leader. In October 1999 the company released its successor, the GeForce 256.`,
  sections: [
    { id: 'nvidia', title: 'NVIDIA', content: `NVIDIA was founded in 1993 by Jensen Huang, Chris Malachowsky and Curtis Priem. Its first product, the NV1 (1995), used quadratic surfaces instead of triangles and did not catch on. Success came with the RIVA 128 (1997), a fast and inexpensive 2D/3D chip with a 128-bit memory bus chosen by many PC makers.` },
    { id: 'tnt', title: 'RIVA TNT', content: `TNT has two pipelines that apply two textures per clock or process two pixels at once. The chip supports 32-bit color, a 24-bit Z-buffer and an 8-bit stencil buffer, textures up to 1024×1024 and resolutions of 1600×1200 and beyond. NVIDIA first promised 125 MHz, but boards shipped at 90 MHz, and performance ended up comparable to the [[voodoo2|Voodoo 2]] rather than ahead of it.

Its main advantage was image quality: 32-bit color has none of the banding and noise visible in Voodoo's 16-bit mode.` },
    { id: 'tnt2', title: 'TNT2', content: `TNT2 (spring 1999) is made on a 0.25 µm process, runs at 125 to 150 MHz, supports up to 32 MB of memory and [[agpbus|AGP]] 4x. Several versions were made: TNT2 Ultra for enthusiasts, the regular TNT2, and the cut-down Vanta and TNT2 M64 for budget computers.

<table class="interpedia-wikitable">
<tr><th>Chip</th><th>Core, MHz</th><th>Memory</th><th>Market</th></tr>
<tr><td>RIVA TNT</td><td>90</td><td>up to 16 MB</td><td>main 1998 model</td></tr>
<tr><td>TNT2</td><td>125</td><td>up to 32 MB</td><td>mainstream 1999 model</td></tr>
<tr><td>TNT2 Ultra</td><td>150</td><td>up to 32 MB</td><td>enthusiasts</td></tr>
<tr><td>TNT2 M64</td><td>125</td><td>up to 32 MB, 64-bit bus</td><td>budget PCs</td></tr>
</table>` },
    { id: 'boards', title: 'Boards', content: `NVIDIA sells its chips to board makers. TNT boards included the Diamond Viper V550, Creative Graphics Blaster RIVA TNT, STB Velocity 4400 and ASUS V3400TNT; TNT2 boards the Diamond Viper V770, Creative 3D Blaster TNT2 Ultra, ASUS V3800 and many more. Some boards came with video in and out and stereo glasses.` },
    { id: 'rivalry', title: 'Rivalry with 3dfx', content: `The TNT versus Voodoo debate was one of the main stories of 1998–1999. 3dfx supporters valued speed and compatibility with Glide games; NVIDIA supporters valued 32-bit color, large textures and the open Direct3D and OpenGL standards. When 3dfx stopped selling chips to other manufacturers in 1999, many of them switched to NVIDIA.` },
    { id: 'geforce', title: 'GeForce 256', content: `In October 1999 NVIDIA released the GeForce 256, calling it the world's first "graphics processing unit" (GPU). It handles not only pixel shading but also transform and lighting (T&L), previously computed by the main processor. Games that use this ability are only beginning to appear.` }
  ],
  seeAlso: ['voodoo2', 'voodoo', 'agpbus', 'pentium2', 'quake2'],
  references: [
    'NVIDIA Corporation. RIVA TNT Product Overview, 1998.',
    'NVIDIA Corporation. GeForce 256 Technical Brief, 1999.',
    '"TNT2 vs. Voodoo3". Mir PK, 1999.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: comparison with TNT']],
  categories: ['Hardware', '3D Accelerators', 'NVIDIA']
});

window.interpediaReg('pentium', 'hardware', {
  title: 'Intel Pentium и Pentium MMX',
  infobox: {
    title: 'Intel Pentium',
    badgeText: 'P5 / P54C / P55C',
    fields: [
      { label: 'Производитель', value: 'Intel' },
      { label: 'Выход', value: '22 марта 1993' },
      { label: 'Частоты', value: '60–200 МГц; MMX — 166–233 МГц' },
      { label: 'Транзисторов', value: '3,1 млн (P5), 4,5 млн (MMX)' },
      { label: 'Кэш L1', value: '8+8 КБ; у MMX 16+16 КБ' },
      { label: 'Шина данных', value: '64 бита' },
      { label: 'Разъёмы', value: 'Socket 4, Socket 5, [[slot1|Socket 7]]' },
      { label: 'Предшественник', value: 'Intel 486' },
      { label: 'Преемник', value: '[[pentium2|Pentium II]]' }
    ]
  },
  lead: `<strong>Intel Pentium</strong> — процессор пятого поколения архитектуры x86, представленный Intel 22 марта 1993 года. Он получил два конвейера для одновременного выполнения команд, 64-битную шину данных и гораздо более быстрый математический сопроцессор, чем у 486-го. Именно на Pentium трёхмерные игры вроде [[quake|Quake]] стали по-настоящему играбельными.

В 1997 году вышла модель <strong>Pentium MMX</strong> с 57 новыми командами для обработки мультимедиа и удвоенным кэшем. Имя «Pentium» стало нарицательным: в России «пентиумом» нередко называют любой современный компьютер.`,
  sections: [
    { id: 'name', title: 'Название', content: `Логично было бы назвать новый процессор «586», но в 1991 году суд отказал Intel в праве на товарный знак для цифровых обозначений вроде «386» и «486»: их использовали и конкуренты, например AMD. Поэтому Intel придумала слово «Pentium» — от греческого «пента», «пять». Одновременно компания вела рекламную кампанию Intel Inside, приучая покупателей обращать внимание на марку процессора.` },
    { id: 'architecture', title: 'Архитектура', content: `<ul>
<li><strong>Суперскалярность.</strong> Два конвейера, U и V, позволяют выполнять две простые команды за такт.</li>
<li><strong>Раздельный кэш</strong> — 8 КБ для команд и 8 КБ для данных.</li>
<li><strong>Предсказание переходов</strong> уменьшает простои конвейера на циклах и условиях.</li>
<li><strong>Быстрый блок вычислений с плавающей точкой</strong> — в несколько раз быстрее, чем у 486DX, что особенно важно для 3D-графики.</li>
</ul>

Первые модели P5 на 60 и 66 МГц питались напряжением 5 В и сильно грелись. Модели P54C (с 1994 года, 75–200 МГц) перешли на 3,3 В и разъёмы Socket 5 и Socket 7.` },
    { id: 'fdiv', title: 'Ошибка FDIV', content: `Осенью 1994 года профессор математики Томас Найсли обнаружил, что Pentium в редких случаях неправильно делит числа с плавающей точкой: в таблице, используемой блоком деления, не хватало нескольких значений. Сначала Intel утверждала, что ошибка затрагивает лишь научные расчёты, и предлагала замену только по запросу. Под давлением прессы и после того, как IBM приостановила продажи компьютеров на Pentium, компания в декабре 1994 года объявила о бесплатной замене всех процессоров. Убытки составили около 475 миллионов долларов, а шутки про «пентиумную арифметику» надолго вошли в фольклор.` },
    { id: 'mmx', title: 'Pentium MMX', content: `Pentium MMX (январь 1997) добавил 57 команд MMX, которые обрабатывают сразу несколько целых чисел в одном 64-битном регистре. Это ускоряет обработку звука, видео и изображений — при условии, что программа переписана под новые команды. Кэш первого уровня увеличен до 16+16 КБ, что ускорило и обычные программы. Рекламу MMX запомнили по роликам с танцующими работниками Intel в защитных «кроличьих» костюмах.` },
    { id: 'models', title: 'Модели', content: `<table class="interpedia-wikitable">
<tr><th>Ядро</th><th>Год</th><th>Частоты, МГц</th><th>Разъём</th></tr>
<tr><td>P5</td><td>1993</td><td>60, 66</td><td>Socket 4</td></tr>
<tr><td>P54C</td><td>1994–1996</td><td>75–200</td><td>Socket 5 / 7</td></tr>
<tr><td>P55C (MMX)</td><td>1997</td><td>166, 200, 233</td><td>Socket 7</td></tr>
</table>

Параллельно выпускался Pentium Pro (1995) для серверов и рабочих станций. Его ядро P6 легло в основу [[pentium2|Pentium II]].` },
    { id: 'today', title: 'Pentium в 1999 году', content: `К концу 1999 года Pentium MMX сняты с производства для настольных ПК, но миллионы компьютеров на них продолжают работать в офисах и дома. Pentium 166 MMX с 32 МБ памяти вполне справляется с [[windows98|Win 98]] и офисными программами, а с ускорителем [[voodoo|3dfx Voodoo]] — и с играми 1997 года.` }
  ],
  seeAlso: ['pentium2', 'celeron300a', 'amdk6', 'slot1', 'overclocking'],
  references: [
    'Intel Corporation. Pentium Processor Family Developer\'s Manual. — 1995.',
    'Nicely T. Pentium FDIV flaw. — Lynchburg College, 1994.',
    'Гук М. Процессоры Pentium II, Pentium Pro и просто Pentium. — СПб.: Питер, 1999.'
  ],
  categories: ['Компьютерное железо', 'Процессоры', 'Intel']
}, {
  title: 'Intel Pentium & Pentium MMX',
  infobox: {
    title: 'Intel Pentium',
    badgeText: 'P5 / P54C / P55C',
    fields: [
      { label: 'Manufacturer', value: 'Intel' },
      { label: 'Released', value: 'March 22, 1993' },
      { label: 'Clock speeds', value: '60–200 MHz; MMX 166–233 MHz' },
      { label: 'Transistors', value: '3.1 million (P5), 4.5 million (MMX)' },
      { label: 'L1 cache', value: '8+8 KB; 16+16 KB on MMX' },
      { label: 'Data bus', value: '64-bit' },
      { label: 'Sockets', value: 'Socket 4, Socket 5, [[slot1|Socket 7]]' },
      { label: 'Predecessor', value: 'Intel 486' },
      { label: 'Successor', value: '[[pentium2|Pentium II]]' }
    ]
  },
  lead: `<strong>Intel Pentium</strong> is the fifth-generation x86 processor, introduced by Intel on March 22, 1993. It gained two pipelines for executing instructions in parallel, a 64-bit data bus and a far faster math coprocessor than the 486. The Pentium is where 3D games such as [[quake|Quake]] became truly playable.

In 1997 came the <strong>Pentium MMX</strong> with 57 new multimedia instructions and a doubled cache. The name became generic: in Russia "pentium" is often used for any modern computer.`,
  sections: [
    { id: 'name', title: 'The name', content: `It would have been logical to call the new processor "586", but in 1991 a court denied Intel trademark rights to numbers such as "386" and "486", which competitors like AMD also used. So Intel coined "Pentium", from the Greek "penta", five. At the same time it ran the Intel Inside campaign, teaching buyers to care about the processor brand.` },
    { id: 'architecture', title: 'Architecture', content: `<ul>
<li><strong>Superscalar design.</strong> Two pipelines, U and V, execute two simple instructions per clock.</li>
<li><strong>Split cache</strong>: 8 KB for instructions and 8 KB for data.</li>
<li><strong>Branch prediction</strong> reduces pipeline stalls in loops and conditions.</li>
<li><strong>A fast floating-point unit</strong>, several times faster than the 486DX's, which matters especially for 3D graphics.</li>
</ul>

The first P5 models at 60 and 66 MHz ran at 5 V and got very hot. The P54C models (from 1994, 75–200 MHz) moved to 3.3 V and the Socket 5 and Socket 7 sockets.` },
    { id: 'fdiv', title: 'The FDIV bug', content: `In autumn 1994 mathematics professor Thomas Nicely found that the Pentium occasionally divided floating-point numbers incorrectly: the lookup table used by the divider was missing a few entries. Intel first claimed the bug only affected scientific work and offered replacements only on request. Under press pressure, and after IBM halted sales of Pentium computers, the company announced in December 1994 that it would replace every processor for free. The cost was about $475 million, and jokes about "Pentium math" became part of computer folklore.` },
    { id: 'mmx', title: 'Pentium MMX', content: `The Pentium MMX (January 1997) added 57 MMX instructions that process several integers at once in a single 64-bit register. This speeds up sound, video and image processing, provided the program is rewritten for the new instructions. The L1 cache grew to 16+16 KB, which also sped up ordinary programs. MMX advertising is remembered for the ads with dancing Intel workers in "bunny suit" clean room outfits.` },
    { id: 'models', title: 'Models', content: `<table class="interpedia-wikitable">
<tr><th>Core</th><th>Year</th><th>Clock, MHz</th><th>Socket</th></tr>
<tr><td>P5</td><td>1993</td><td>60, 66</td><td>Socket 4</td></tr>
<tr><td>P54C</td><td>1994–1996</td><td>75–200</td><td>Socket 5 / 7</td></tr>
<tr><td>P55C (MMX)</td><td>1997</td><td>166, 200, 233</td><td>Socket 7</td></tr>
</table>

The Pentium Pro (1995) for servers and workstations was sold in parallel. Its P6 core became the basis of the [[pentium2|Pentium II]].` },
    { id: 'today', title: 'The Pentium in 1999', content: `By the end of 1999 the Pentium MMX is out of production for desktops, but millions of computers built on it still work in offices and homes. A Pentium 166 MMX with 32 MB of memory handles [[windows98|Win 98]] and office programs well, and with a [[voodoo|3dfx Voodoo]] it runs the games of 1997 too.` }
  ],
  seeAlso: ['pentium2', 'celeron300a', 'amdk6', 'slot1', 'overclocking'],
  references: [
    'Intel Corporation. Pentium Processor Family Developer\'s Manual, 1995.',
    'Nicely, T. Pentium FDIV flaw. Lynchburg College, 1994.',
    'Guk, M. Protsessory Pentium II, Pentium Pro i prosto Pentium. St. Petersburg: Piter, 1999.'
  ],
  categories: ['Hardware', 'Processors', 'Intel']
});

window.interpediaReg('pentium2', 'hardware', {
  title: 'Intel Pentium II (Klamath / Deschutes)',
  infobox: {
    title: 'Intel Pentium II',
    badgeText: 'Картридж SECC',
    fields: [
      { label: 'Производитель', value: 'Intel' },
      { label: 'Выход', value: '7 мая 1997' },
      { label: 'Ядра', value: 'Klamath (0,35 мкм), Deschutes (0,25 мкм)' },
      { label: 'Частоты', value: '233–450 МГц' },
      { label: 'Шина', value: '66 МГц; 100 МГц с апреля 1998' },
      { label: 'Кэш L2', value: '512 КБ на половинной частоте ядра' },
      { label: 'Транзисторов', value: '7,5 млн' },
      { label: 'Разъём', value: '[[slot1|Slot 1]]' },
      { label: 'Преемник', value: 'Pentium III (1999)' }
    ]
  },
  lead: `<strong>Intel Pentium II</strong> — процессор Intel, выпущенный 7 мая 1997 года. Он объединил ядро P6 серверного Pentium Pro с командами MMX и упаковку в картридж, который вставляется в разъём [[slot1|Slot 1]], как плата расширения. Кэш второго уровня размещается на плате картриджа рядом с ядром.

Pentium II на 300–450 МГц вместе с ускорителями [[voodoo2|Voodoo 2]] и [[rivatnt|RIVA TNT]] определил облик мощного игрового компьютера 1998 года. В 1999 году его сменил Pentium III, а дешёвой альтернативой стал [[celeron300a|Celeron]].`,
  sections: [
    { id: 'p6', title: 'Ядро P6', content: `Pentium II унаследовал ядро Pentium Pro (1995): процессор переводит команды x86 во внутренние микрооперации и выполняет их не по порядку, а по мере готовности данных, заглядывая далеко вперёд. Такая архитектура хорошо справляется с 32-битными программами. Pentium Pro, однако, медленно работал с 16-битным кодом, что для [[windows95|Win 95]] было существенно; в Pentium II этот недостаток исправили и добавили MMX.` },
    { id: 'cartridge', title: 'Картридж SECC', content: `Кэш Pentium Pro находился в одном корпусе с ядром, что делало процессор очень дорогим. Для Pentium II Intel вынесла кэш на отдельные микросхемы и разместила их вместе с ядром на небольшой плате в пластиковом картридже SECC (Single Edge Contact Cartridge). Кэш работает на половинной частоте ядра — медленнее, чем у Pentium Pro, но гораздо дешевле. Новый разъём Slot 1 к тому же защищён патентами Intel, и конкуренты не могли выпускать совместимые процессоры.` },
    { id: 'models', title: 'Модели', content: `<table class="interpedia-wikitable">
<tr><th>Ядро</th><th>Год</th><th>Частоты, МГц</th><th>Шина, МГц</th></tr>
<tr><td>Klamath</td><td>1997</td><td>233, 266, 300</td><td>66</td></tr>
<tr><td>Deschutes</td><td>1998</td><td>333</td><td>66</td></tr>
<tr><td>Deschutes</td><td>1998</td><td>350, 400, 450</td><td>100</td></tr>
</table>

Модели с шиной 100 МГц требуют материнских плат на наборе логики 440BX (апрель 1998) и памяти SDRAM стандарта PC100. Набор 440LX (1997) впервые принёс поддержку [[agpbus|AGP]] и SDRAM.` },
    { id: 'family', title: 'Семейство', content: `<dl>
<dt>[[celeron300a|Celeron]] (1998)</dt><dd>удешевлённая версия: сначала без кэша второго уровня, затем со 128 КБ кэша на полной частоте.</dd>
<dt>Pentium II Xeon (1998)</dt><dd>для серверов, с большим кэшем на полной частоте и разъёмом Slot 2.</dd>
<dt>Mobile Pentium II</dt><dd>для ноутбуков.</dd>
</dl>` },
    { id: 'p3', title: 'Pentium III', content: `26 февраля 1999 года вышел Pentium III (ядро Katmai) — по сути Pentium II с 70 новыми командами SSE для вычислений с плавающей точкой. Встроенный серийный номер процессора вызвал протесты защитников частной жизни, и Intel выпустила утилиту для его отключения. В октябре 1999 года появилось ядро Coppermine (0,18 мкм) с 256 КБ кэша второго уровня прямо на кристалле, работающего на полной частоте; оно выпускается и в картридже, и для разъёма Socket 370.` },
    { id: 'russia', title: 'Pentium II в России', content: `В 1998 году компьютер на Pentium II стоил в России несколько тысяч долларов, а после августовского кризиса стал ещё менее доступен. Поэтому огромную популярность получили сборки на [[celeron300a|Celeron 300A]] с [[overclocking|разгоном]] и на процессорах [[amdk6|AMD K6-2]].` }
  ],
  seeAlso: ['pentium', 'celeron300a', 'slot1', 'amdk6', 'agpbus'],
  references: [
    'Intel Corporation. Pentium II Processor Developer\'s Manual. — 1997.',
    'Intel Corporation. 440BX AGPset Datasheet. — 1998.',
    'Гук М. Процессоры Pentium II, Pentium Pro и просто Pentium. — СПб.: Питер, 1999.'
  ],
  categories: ['Компьютерное железо', 'Процессоры', 'Intel']
}, {
  title: 'Intel Pentium II',
  infobox: {
    title: 'Intel Pentium II',
    badgeText: 'SECC cartridge',
    fields: [
      { label: 'Manufacturer', value: 'Intel' },
      { label: 'Released', value: 'May 7, 1997' },
      { label: 'Cores', value: 'Klamath (0.35 µm), Deschutes (0.25 µm)' },
      { label: 'Clock speeds', value: '233–450 MHz' },
      { label: 'Bus', value: '66 MHz; 100 MHz from April 1998' },
      { label: 'L2 cache', value: '512 KB at half core speed' },
      { label: 'Transistors', value: '7.5 million' },
      { label: 'Socket', value: '[[slot1|Slot 1]]' },
      { label: 'Successor', value: 'Pentium III (1999)' }
    ]
  },
  lead: `<strong>Intel Pentium II</strong> is an Intel processor released on May 7, 1997. It combined the P6 core of the server-class Pentium Pro with MMX instructions and a cartridge package that plugs into the [[slot1|Slot 1]] connector like an expansion card. The level 2 cache sits on the cartridge board next to the core.

Pentium II chips at 300–450 MHz, together with [[voodoo2|Voodoo 2]] and [[rivatnt|RIVA TNT]] accelerators, defined the powerful gaming PC of 1998. In 1999 the Pentium III replaced it, and the [[celeron300a|Celeron]] became the cheap alternative.`,
  sections: [
    { id: 'p6', title: 'The P6 core', content: `The Pentium II inherited the Pentium Pro (1995) core: it translates x86 instructions into internal micro-operations and executes them out of order as data becomes ready, looking far ahead. This design handles 32-bit programs well. The Pentium Pro, however, was slow with 16-bit code, which mattered a great deal for [[windows95|Win 95]]; the Pentium II fixed this and added MMX.` },
    { id: 'cartridge', title: 'The SECC cartridge', content: `The Pentium Pro's cache shared a package with the core, which made the processor very expensive. For the Pentium II, Intel moved the cache to separate chips and mounted them with the core on a small board in a plastic SECC (Single Edge Contact Cartridge). The cache runs at half the core speed, slower than the Pentium Pro's but much cheaper. The new Slot 1 connector was also protected by Intel patents, so competitors could not make compatible processors.` },
    { id: 'models', title: 'Models', content: `<table class="interpedia-wikitable">
<tr><th>Core</th><th>Year</th><th>Clock, MHz</th><th>Bus, MHz</th></tr>
<tr><td>Klamath</td><td>1997</td><td>233, 266, 300</td><td>66</td></tr>
<tr><td>Deschutes</td><td>1998</td><td>333</td><td>66</td></tr>
<tr><td>Deschutes</td><td>1998</td><td>350, 400, 450</td><td>100</td></tr>
</table>

Models with a 100 MHz bus need motherboards with the 440BX chipset (April 1998) and PC100 SDRAM. The 440LX chipset (1997) first brought [[agpbus|AGP]] and SDRAM support.` },
    { id: 'family', title: 'The family', content: `<dl>
<dt>[[celeron300a|Celeron]] (1998)</dt><dd>a budget version, first with no L2 cache and then with 128 KB of full-speed cache.</dd>
<dt>Pentium II Xeon (1998)</dt><dd>for servers, with a large full-speed cache and the Slot 2 connector.</dd>
<dt>Mobile Pentium II</dt><dd>for laptops.</dd>
</dl>` },
    { id: 'p3', title: 'Pentium III', content: `The Pentium III (Katmai core) came out on February 26, 1999: essentially a Pentium II with 70 new SSE instructions for floating-point math. Its built-in processor serial number drew protests from privacy advocates, and Intel released a utility to switch it off. In October 1999 the Coppermine core (0.18 µm) arrived with 256 KB of full-speed L2 cache on the die; it is made both as a cartridge and for the Socket 370 connector.` },
    { id: 'russia', title: 'The Pentium II in Russia', content: `In 1998 a Pentium II computer cost several thousand dollars in Russia, and after the August crisis it became even less affordable. That is why builds based on the [[celeron300a|Celeron 300A]] with [[overclocking|overclocking]] and on [[amdk6|AMD K6-2]] processors became hugely popular.` }
  ],
  seeAlso: ['pentium', 'celeron300a', 'slot1', 'amdk6', 'agpbus'],
  references: [
    'Intel Corporation. Pentium II Processor Developer\'s Manual, 1997.',
    'Intel Corporation. 440BX AGPset Datasheet, 1998.',
    'Guk, M. Protsessory Pentium II, Pentium Pro i prosto Pentium. St. Petersburg: Piter, 1999.'
  ],
  categories: ['Hardware', 'Processors', 'Intel']
});

window.interpediaReg('celeron300a', 'hardware', {
  title: 'Intel Celeron 300A (легенда разгона)',
  infobox: {
    title: 'Intel Celeron 300A',
    badgeText: 'Mendocino',
    fields: [
      { label: 'Производитель', value: 'Intel' },
      { label: 'Выход', value: 'август 1998' },
      { label: 'Ядро', value: 'Mendocino (0,25 мкм)' },
      { label: 'Штатная частота', value: '300 МГц (4,5 × 66 МГц)' },
      { label: 'Типичный разгон', value: '450 МГц (4,5 × 100 МГц)' },
      { label: 'Кэш L2', value: '128 КБ на кристалле, на полной частоте' },
      { label: 'Корпус', value: 'SEPP для [[slot1|Slot 1]]; позже PPGA для Socket 370' },
      { label: 'Цена при выходе', value: 'около 150 $' }
    ]
  },
  lead: `<strong>Intel Celeron 300A</strong> — недорогой процессор Intel на ядре Mendocino, выпущенный в августе 1998 года. Он стал самым известным процессором для [[overclocking|разгона]] в истории ПК: при установке частоты системной шины 100 МГц вместо штатных 66 МГц большинство экземпляров работали на частоте 450 МГц и не уступали [[pentium2|Pentium II 450]], стоившему в несколько раз дороже.

Комбинация «Celeron 300A и материнская плата на 440BX» в 1998–1999 годах стала стандартной рекомендацией для тех, кто хотел максимальной скорости за минимальные деньги. Особенно популярна она в России после кризиса 1998 года.`,
  sections: [
    { id: 'first', title: 'Первый Celeron', content: `В апреле 1998 года Intel выпустила Celeron, чтобы противостоять дешёвым процессорам [[amdk6|AMD K6-2]] и Cyrix. Первые модели на 266 и 300 МГц (ядро Covington) были урезанными Pentium II без кэша второго уровня. В играх они ещё держались, но в офисных программах сильно отставали даже от старых Pentium MMX, и пресса встретила их резкой критикой.` },
    { id: 'mendocino', title: 'Mendocino', content: `Летом 1998 года Intel исправила ошибку: ядро Mendocino получило 128 КБ кэша второго уровня прямо на кристалле. Кэш вчетверо меньше, чем у Pentium II, но работает на полной частоте ядра, а не на половинной. В результате Celeron 300A и 333 почти сравнялись с Pentium II той же частоты, а в некоторых задачах даже опережали его. Чтобы отличать новые модели от старой Celeron 300, к названию добавили букву «A».` },
    { id: 'overclock', title: 'Разгон до 450 МГц', content: `Множитель Celeron 300A зафиксирован на значении 4,5. Штатная шина 66 МГц даёт 300 МГц, а шина 100 МГц, предназначенная для Pentium II, — 450 МГц. Большинство процессоров выдерживали эту частоту без изменений или при небольшом повышении напряжения ядра с 2,0 до 2,1–2,2 В и хорошем кулере.

<table class="interpedia-wikitable">
<tr><th>Шина</th><th>Частота</th><th>Результат</th></tr>
<tr><td>66 МГц</td><td>300 МГц</td><td>штатный режим</td></tr>
<tr><td>75 МГц</td><td>338 МГц</td><td>надёжно на любом экземпляре</td></tr>
<tr><td>83 МГц</td><td>374 МГц</td><td>почти всегда</td></tr>
<tr><td>100 МГц</td><td>450 МГц</td><td>большинство экземпляров</td></tr>
<tr><td>103–112 МГц</td><td>464–504 МГц</td><td>удачные экземпляры с повышенным напряжением</td></tr>
</table>

Поскольку шина 100 МГц разгоняет и память, нужна SDRAM стандарта PC100.` },
    { id: 'boards', title: 'Материнские платы', content: `Для разгона подходят платы на наборе логики Intel 440BX. Легендой стала Abit BH6 с технологией SoftMenu II: частота шины и напряжение выставляются в [[bios|BIOS]] без перемычек. В 1999 году Abit выпустила плату BP6 для двух процессоров Celeron в исполнении Socket 370 — первую недорогую двухпроцессорную систему для дома, раскрывающую возможности [[winnt4|Win NT]] и [[linux|Linux]].` },
    { id: 'socket370', title: 'Socket 370', content: `В начале 1999 года Celeron перешли в дешёвый корпус PPGA для разъёма Socket 370. Для установки в старые платы с [[slot1|Slot 1]] продаются переходники — «слотокеты». Последующие модели (366, 400, 433 МГц и выше) имеют более высокие множители, и разгонять их до 450 МГц бессмысленно, поэтому слава 300A не повторилась.` }
  ],
  seeAlso: ['overclocking', 'pentium2', 'slot1', 'amdk6', 'bios'],
  references: [
    'Intel Corporation. Celeron Processor Datasheet. — 1998.',
    'Тест разгона Celeron 300A // Компьютерра. — 1998.',
    'Конференция ru.hardware, обсуждение разгона Celeron, 1998–1999.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: разгон и калькулятор']],
  categories: ['Компьютерное железо', 'Процессоры', 'Intel', 'Оверклокинг']
}, {
  title: 'Intel Celeron 300A (Overclocking Legend)',
  infobox: {
    title: 'Intel Celeron 300A',
    badgeText: 'Mendocino',
    fields: [
      { label: 'Manufacturer', value: 'Intel' },
      { label: 'Released', value: 'August 1998' },
      { label: 'Core', value: 'Mendocino (0.25 µm)' },
      { label: 'Rated speed', value: '300 MHz (4.5 × 66 MHz)' },
      { label: 'Typical overclock', value: '450 MHz (4.5 × 100 MHz)' },
      { label: 'L2 cache', value: '128 KB on die, full speed' },
      { label: 'Package', value: 'SEPP for [[slot1|Slot 1]]; later PPGA for Socket 370' },
      { label: 'Launch price', value: 'about $150' }
    ]
  },
  lead: `<strong>Intel Celeron 300A</strong> is a low-cost Intel processor on the Mendocino core, released in August 1998. It became the most famous [[overclocking|overclocking]] processor in PC history: with the system bus set to 100 MHz instead of the rated 66 MHz, most chips ran at 450 MHz and matched a [[pentium2|Pentium II 450]] that cost several times more.

In 1998–1999 the combination "Celeron 300A plus a 440BX motherboard" became the standard advice for anyone wanting maximum speed for minimum money. It is especially popular in Russia after the 1998 crisis.`,
  sections: [
    { id: 'first', title: 'The first Celeron', content: `In April 1998 Intel released the Celeron to compete with cheap [[amdk6|AMD K6-2]] and Cyrix processors. The first models at 266 and 300 MHz (Covington core) were cut-down Pentium IIs with no L2 cache at all. They held up in games but fell far behind even old Pentium MMX chips in office software, and the press criticized them harshly.` },
    { id: 'mendocino', title: 'Mendocino', content: `In summer 1998 Intel fixed the mistake: the Mendocino core got 128 KB of L2 cache right on the die. The cache is a quarter the size of the Pentium II's but runs at full core speed instead of half. As a result the Celeron 300A and 333 nearly matched Pentium IIs of the same clock and even beat them in some tasks. An "A" was added to the name to tell the new chip from the old Celeron 300.` },
    { id: 'overclock', title: 'Overclocking to 450 MHz', content: `The Celeron 300A's multiplier is locked at 4.5. The rated 66 MHz bus gives 300 MHz, and the 100 MHz bus intended for the Pentium II gives 450 MHz. Most chips handled that speed as is, or with a small core voltage increase from 2.0 to 2.1–2.2 V and a good cooler.

<table class="interpedia-wikitable">
<tr><th>Bus</th><th>Speed</th><th>Result</th></tr>
<tr><td>66 MHz</td><td>300 MHz</td><td>rated</td></tr>
<tr><td>75 MHz</td><td>338 MHz</td><td>reliable on any chip</td></tr>
<tr><td>83 MHz</td><td>374 MHz</td><td>almost always</td></tr>
<tr><td>100 MHz</td><td>450 MHz</td><td>most chips</td></tr>
<tr><td>103–112 MHz</td><td>464–504 MHz</td><td>lucky chips with extra voltage</td></tr>
</table>

Because a 100 MHz bus also speeds up memory, PC100 SDRAM is required.` },
    { id: 'boards', title: 'Motherboards', content: `Boards with Intel's 440BX chipset are suitable for overclocking. The Abit BH6 with SoftMenu II became a legend: bus speed and voltage are set in the [[bios|BIOS]] without jumpers. In 1999 Abit released the BP6 board for two Socket 370 Celerons, the first affordable dual-processor home system, showing what [[winnt4|Win NT]] and [[linux|Linux]] can do with two CPUs.` },
    { id: 'socket370', title: 'Socket 370', content: `In early 1999 Celerons moved to the cheap PPGA package for the Socket 370 connector. Adapters known as "slotkets" let them fit older [[slot1|Slot 1]] boards. Later models (366, 400, 433 MHz and up) have higher multipliers, so pushing them to 450 MHz makes no sense, and the 300A's fame was never repeated.` }
  ],
  seeAlso: ['overclocking', 'pentium2', 'slot1', 'amdk6', 'bios'],
  references: [
    'Intel Corporation. Celeron Processor Datasheet, 1998.',
    '"Overclocking the Celeron 300A". Computerra, 1998.',
    'ru.hardware echo, Celeron overclocking discussions, 1998–1999.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: overclocking and calculator']],
  categories: ['Hardware', 'Processors', 'Intel', 'Overclocking']
});

window.interpediaReg('amdk6', 'hardware', {
  title: 'AMD K6-2 и технология 3DNow!',
  infobox: {
    title: 'AMD K6-2',
    badgeText: '3DNow!',
    fields: [
      { label: 'Производитель', value: 'AMD' },
      { label: 'Выход', value: 'май 1998' },
      { label: 'Частоты', value: '266–475 МГц' },
      { label: 'Шина', value: '66 и 100 МГц' },
      { label: 'Кэш L1', value: '32+32 КБ' },
      { label: 'Транзисторов', value: '9,3 млн' },
      { label: 'Техпроцесс', value: '0,25 мкм' },
      { label: 'Разъём', value: 'Super Socket 7' },
      { label: 'Расширения', value: 'MMX, 3DNow!' }
    ]
  },
  lead: `<strong>AMD K6-2</strong> — процессор компании AMD для разъёма Socket 7, выпущенный в мае 1998 года. Он стал первым процессором с набором команд <strong>3DNow!</strong>, ускоряющим вычисления с плавающей точкой для трёхмерной графики, и работал на шине 100 МГц в платах стандарта Super Socket 7 с портом [[agpbus|AGP]].

K6-2 предлагал скорость, близкую к [[pentium2|Pentium II]], по цене заметно ниже и позволял модернизировать старые платы Socket 7. Благодаря этому он стал одним из самых популярных процессоров в недорогих компьютерах, особенно в России.`,
  sections: [
    { id: 'history', title: 'История AMD K6', content: `AMD долгое время выпускала клоны процессоров Intel по лицензии. Собственный процессор K5 (1996) запоздал и уступал Pentium. Тогда AMD купила компанию NexGen и на основе её разработки выпустила K6 (апрель 1997) — процессор с MMX, совместимый с разъёмом Socket 7. K6 был быстрым в обычных программах, но слабым в вычислениях с плавающей точкой, важных для 3D-игр.` },
    { id: '3dnow', title: 'Технология 3DNow!', content: `3DNow! — 21 команда, которые за один раз выполняют две операции с числами одинарной точности, хранящимися в регистрах MMX. Это ускоряет расчёт геометрии в трёхмерных играх: преобразование координат и освещение вершин. Поддержка 3DNow! вошла в DirectX 6, а AMD совместно с разработчиками выпустила оптимизированные версии игр, в том числе обновление для [[quake2|Quake II]]. Intel ответила аналогичным набором SSE в Pentium III (1999).` },
    { id: 'ss7', title: 'Super Socket 7', content: `Чтобы конкурировать с платформой [[slot1|Slot 1]], AMD вместе с производителями наборов логики VIA (MVP3) и ALi (Aladdin V) расширила старый разъём Socket 7 до стандарта Super Socket 7: шина 100 МГц и порт AGP. Владельцы плат Socket 7 часто могли установить K6-2 просто после обновления [[bios|BIOS]], однако наборы логики для Super Socket 7 работали с AGP не так надёжно, как Intel 440BX, и требовали аккуратного подбора драйверов.` },
    { id: 'models', title: 'Модели и наследники', content: `<table class="interpedia-wikitable">
<tr><th>Процессор</th><th>Год</th><th>Частоты, МГц</th><th>Особенности</th></tr>
<tr><td>K6</td><td>1997</td><td>166–300</td><td>MMX</td></tr>
<tr><td>K6-2</td><td>1998–1999</td><td>266–475</td><td>3DNow!, шина 100 МГц</td></tr>
<tr><td>K6-III</td><td>1999</td><td>400–450</td><td>256 КБ кэша L2 на кристалле</td></tr>
<tr><td>Athlon (K7)</td><td>1999</td><td>500–750</td><td>новая архитектура, разъём Slot A</td></tr>
</table>

Athlon, вышедший в июне 1999 года, впервые в истории AMD опередил лучшие процессоры Intel по производительности.` },
    { id: 'russia', title: 'K6-2 в России', content: `После кризиса 1998 года покупатели в России считали каждый доллар, и сборки на K6-2 с платами на чипсетах VIA стали самыми массовыми. Их хвалили за цену и упрекали за нестабильность AGP и слабый блок вычислений с плавающей точкой в играх без поддержки 3DNow!. Споры «Intel или AMD» — постоянная тема в эхоконференциях [[fidonet|ФидоНета]].` }
  ],
  seeAlso: ['pentium2', 'celeron300a', 'slot1', 'agpbus', 'overclocking'],
  references: [
    'AMD. AMD-K6-2 Processor Data Sheet. — 1998.',
    'AMD. 3DNow! Technology Manual. — 1998.',
    'Тест K6-2 и Celeron // Мир ПК. — 1999.'
  ],
  categories: ['Компьютерное железо', 'Процессоры', 'AMD']
}, {
  title: 'AMD K6-2 and 3DNow!',
  infobox: {
    title: 'AMD K6-2',
    badgeText: '3DNow!',
    fields: [
      { label: 'Manufacturer', value: 'AMD' },
      { label: 'Released', value: 'May 1998' },
      { label: 'Clock speeds', value: '266–475 MHz' },
      { label: 'Bus', value: '66 and 100 MHz' },
      { label: 'L1 cache', value: '32+32 KB' },
      { label: 'Transistors', value: '9.3 million' },
      { label: 'Process', value: '0.25 µm' },
      { label: 'Socket', value: 'Super Socket 7' },
      { label: 'Extensions', value: 'MMX, 3DNow!' }
    ]
  },
  lead: `<strong>AMD K6-2</strong> is an AMD processor for the Socket 7 connector, released in May 1998. It was the first processor with the <strong>3DNow!</strong> instruction set, which speeds up floating-point math for 3D graphics, and it ran on a 100 MHz bus in Super Socket 7 boards with an [[agpbus|AGP]] port.

The K6-2 offered performance close to the [[pentium2|Pentium II]] at a noticeably lower price and let owners upgrade old Socket 7 boards. As a result it became one of the most popular processors in budget computers, especially in Russia.`,
  sections: [
    { id: 'history', title: 'History of the AMD K6', content: `For a long time AMD made licensed clones of Intel processors. Its own K5 (1996) arrived late and trailed the Pentium. AMD then bought NexGen and used its design for the K6 (April 1997), an MMX processor compatible with Socket 7. The K6 was fast in ordinary programs but weak in floating-point math, which matters for 3D games.` },
    { id: '3dnow', title: '3DNow! technology', content: `3DNow! is 21 instructions that each perform two single-precision operations on values held in MMX registers. This speeds up geometry in 3D games: coordinate transforms and vertex lighting. 3DNow! support went into DirectX 6, and AMD worked with developers on optimized game versions, including an update for [[quake2|Quake II]]. Intel answered with the similar SSE set in the Pentium III (1999).` },
    { id: 'ss7', title: 'Super Socket 7', content: `To compete with the [[slot1|Slot 1]] platform, AMD and chipset makers VIA (MVP3) and ALi (Aladdin V) extended the old Socket 7 into Super Socket 7: a 100 MHz bus and an AGP port. Socket 7 owners could often install a K6-2 after a [[bios|BIOS]] update, but Super Socket 7 chipsets handled AGP less reliably than Intel's 440BX and needed careful driver choices.` },
    { id: 'models', title: 'Models and successors', content: `<table class="interpedia-wikitable">
<tr><th>Processor</th><th>Year</th><th>Clock, MHz</th><th>Features</th></tr>
<tr><td>K6</td><td>1997</td><td>166–300</td><td>MMX</td></tr>
<tr><td>K6-2</td><td>1998–1999</td><td>266–475</td><td>3DNow!, 100 MHz bus</td></tr>
<tr><td>K6-III</td><td>1999</td><td>400–450</td><td>256 KB on-die L2 cache</td></tr>
<tr><td>Athlon (K7)</td><td>1999</td><td>500–750</td><td>new architecture, Slot A</td></tr>
</table>

The Athlon, released in June 1999, was the first AMD processor to outperform Intel's best.` },
    { id: 'russia', title: 'The K6-2 in Russia', content: `After the 1998 crisis, Russian buyers counted every dollar, and K6-2 builds with VIA chipset boards became the most common. They were praised for price and criticized for flaky AGP and a weak floating-point unit in games without 3DNow! support. "Intel or AMD" is a constant topic in [[fidonet|FidoNet]] echoes.` }
  ],
  seeAlso: ['pentium2', 'celeron300a', 'slot1', 'agpbus', 'overclocking'],
  references: [
    'AMD. AMD-K6-2 Processor Data Sheet, 1998.',
    'AMD. 3DNow! Technology Manual, 1998.',
    '"K6-2 vs. Celeron". Mir PK, 1999.'
  ],
  categories: ['Hardware', 'Processors', 'AMD']
});

window.interpediaReg('slot1', 'hardware', {
  title: 'Slot 1 и Socket 7 (процессорные разъёмы)',
  infobox: {
    title: 'Процессорные разъёмы',
    badgeText: 'Socket 7, Slot 1, Socket 370',
    fields: [
      { label: 'Socket 7', value: '321 контакт, ZIF; с 1995 года' },
      { label: 'Процессоры Socket 7', value: '[[pentium|Pentium]], Pentium MMX, [[amdk6|AMD K6]], Cyrix 6x86, IDT WinChip' },
      { label: 'Super Socket 7', value: 'шина 100 МГц и AGP (1998)' },
      { label: 'Slot 1', value: '242 контакта, картридж; с 1997 года' },
      { label: 'Процессоры Slot 1', value: '[[pentium2|Pentium II]], Pentium III, [[celeron300a|Celeron]]' },
      { label: 'Socket 370', value: 'Celeron PPGA (1999), Pentium III Coppermine' },
      { label: 'Конкурирующий слот', value: 'Slot A (AMD Athlon)' }
    ]
  },
  lead: `<strong>Socket 7</strong> и <strong>Slot 1</strong> — два главных процессорных разъёма персональных компьютеров второй половины 1990-х годов. Socket 7 — квадратное гнездо с рычагом для процессоров [[pentium|Pentium]] и совместимых с ним чипов AMD, Cyrix и IDT. Slot 1 — щелевой разъём, в который вертикально вставляется картридж [[pentium2|Pentium II]].

Выбор разъёма в 1998–1999 годах означал выбор лагеря: открытая платформа Socket 7, развивавшаяся конкурентами Intel, или фирменная платформа Intel Slot 1. К концу 1999 года Intel сама возвращается к гнёздам — Socket 370.`,
  sections: [
    { id: 'zif', title: 'Гнёзда ZIF', content: `Ранние процессоры вставлялись в гнёзда с усилием, и при замене легко было погнуть ножки. Гнёзда ZIF (Zero Insertion Force) имеют рычаг: процессор свободно опускается в отверстия, а при опускании рычага контакты зажимаются. Socket 7 — 321-контактное гнездо ZIF — стал стандартом для Pentium с 1995 года и поддерживает раздельное питание ядра и ввода-вывода, необходимое Pentium MMX и K6.` },
    { id: 'socket7', title: 'Socket 7 и Super Socket 7', content: `Socket 7 — открытый стандарт: в одну и ту же плату можно установить процессоры Intel, AMD, Cyrix или IDT, подобрав напряжение и множитель перемычками. Когда Intel перешла на Slot 1, конкуренты продолжили развивать Socket 7. В 1998 году AMD, VIA и ALi представили Super Socket 7 с шиной 100 МГц и портом [[agpbus|AGP]], на котором работают [[amdk6|K6-2]] и K6-III.` },
    { id: 'slot1', title: 'Slot 1', content: `Slot 1 появился в 1997 году вместе с Pentium II. Процессор поставляется на плате в пластиковом картридже, который вставляется в разъём вертикально и закрепляется держателем, как карта расширения. Картридж позволил разместить рядом с ядром отдельные микросхемы кэша второго уровня. Разъём защищён патентами, поэтому AMD и Cyrix не могли выпускать процессоры для Slot 1.

Для удешевлённых [[celeron300a|Celeron]] Intel выпускала корпус SEPP — та же плата, но без пластикового кожуха.` },
    { id: 'slota', title: 'Slot A', content: `Для процессора Athlon (1999) AMD выбрала разъём Slot A. Механически он совпадает со Slot 1, но электрически несовместим: Athlon использует системную шину EV6, разработанную Digital для процессоров Alpha. Материнские платы для Athlon пока дороги и немногочисленны.` },
    { id: 'socket370', title: 'Возвращение к гнёздам', content: `Когда кэш второго уровня переместился на кристалл процессора, картридж потерял смысл. В 1999 году Intel перевела Celeron в корпус PPGA для разъёма Socket 370, а в октябре 1999 года выпустила Pentium III Coppermine в корпусе FC-PGA для того же разъёма. Переходники «слотокет» позволяют установить процессоры Socket 370 в платы со Slot 1.

<table class="interpedia-wikitable">
<tr><th>Разъём</th><th>Годы</th><th>Тип</th><th>Процессоры</th></tr>
<tr><td>Socket 5</td><td>1994–1996</td><td>гнездо</td><td>Pentium 75–133</td></tr>
<tr><td>Socket 7</td><td>1995–1999</td><td>гнездо ZIF</td><td>Pentium, MMX, K5, K6, 6x86</td></tr>
<tr><td>Super Socket 7</td><td>1998–1999</td><td>гнездо ZIF</td><td>K6-2, K6-III</td></tr>
<tr><td>Slot 1</td><td>1997–1999</td><td>щель</td><td>Pentium II, Pentium III, Celeron</td></tr>
<tr><td>Slot 2</td><td>1998–1999</td><td>щель</td><td>Pentium II/III Xeon</td></tr>
<tr><td>Slot A</td><td>1999</td><td>щель</td><td>AMD Athlon</td></tr>
<tr><td>Socket 370</td><td>1999</td><td>гнездо ZIF</td><td>Celeron, Pentium III</td></tr>
</table>` }
  ],
  seeAlso: ['pentium', 'pentium2', 'celeron300a', 'amdk6', 'agpbus'],
  references: [
    'Intel Corporation. Slot 1 Connector Specification. — 1997.',
    'AMD. Super7 Platform Overview. — 1998.',
    'Гук М. Аппаратные средства IBM PC. Энциклопедия. — СПб.: Питер, 1998.'
  ],
  categories: ['Компьютерное железо', 'Процессоры', 'Материнские платы']
}, {
  title: 'Slot 1 and Socket 7 CPU Sockets',
  infobox: {
    title: 'CPU sockets',
    badgeText: 'Socket 7, Slot 1, Socket 370',
    fields: [
      { label: 'Socket 7', value: '321 pins, ZIF; since 1995' },
      { label: 'Socket 7 CPUs', value: '[[pentium|Pentium]], Pentium MMX, [[amdk6|AMD K6]], Cyrix 6x86, IDT WinChip' },
      { label: 'Super Socket 7', value: '100 MHz bus and AGP (1998)' },
      { label: 'Slot 1', value: '242 contacts, cartridge; since 1997' },
      { label: 'Slot 1 CPUs', value: '[[pentium2|Pentium II]], Pentium III, [[celeron300a|Celeron]]' },
      { label: 'Socket 370', value: 'Celeron PPGA (1999), Pentium III Coppermine' },
      { label: 'Rival slot', value: 'Slot A (AMD Athlon)' }
    ]
  },
  lead: `<strong>Socket 7</strong> and <strong>Slot 1</strong> are the two main processor connectors of late-1990s personal computers. Socket 7 is a square socket with a lever for [[pentium|Pentium]] processors and compatible chips from AMD, Cyrix and IDT. Slot 1 is an edge connector into which a [[pentium2|Pentium II]] cartridge is inserted vertically.

In 1998–1999 choosing a connector meant choosing a camp: the open Socket 7 platform developed by Intel's competitors, or Intel's proprietary Slot 1. By the end of 1999 Intel itself is returning to sockets with Socket 370.`,
  sections: [
    { id: 'zif', title: 'ZIF sockets', content: `Early processors had to be pressed into their sockets, and pins bent easily during replacement. ZIF (Zero Insertion Force) sockets have a lever: the processor drops freely into the holes, and lowering the lever clamps the contacts. Socket 7, a 321-pin ZIF socket, became the Pentium standard in 1995 and supports the split core and I/O voltages needed by the Pentium MMX and K6.` },
    { id: 'socket7', title: 'Socket 7 and Super Socket 7', content: `Socket 7 is an open standard: the same board accepts Intel, AMD, Cyrix or IDT processors, with voltage and multiplier set by jumpers. When Intel moved to Slot 1, its competitors kept developing Socket 7. In 1998 AMD, VIA and ALi introduced Super Socket 7 with a 100 MHz bus and an [[agpbus|AGP]] port, used by the [[amdk6|K6-2]] and K6-III.` },
    { id: 'slot1', title: 'Slot 1', content: `Slot 1 appeared in 1997 with the Pentium II. The processor comes on a board inside a plastic cartridge that is inserted vertically and held by a retention bracket, like an expansion card. The cartridge made room next to the core for separate L2 cache chips. The connector is protected by patents, so AMD and Cyrix could not make Slot 1 processors.

For budget [[celeron300a|Celerons]] Intel used the SEPP package, the same board without the plastic shell.` },
    { id: 'slota', title: 'Slot A', content: `For the Athlon (1999) AMD chose Slot A. Mechanically it matches Slot 1, but it is electrically incompatible: the Athlon uses the EV6 system bus that Digital designed for its Alpha processors. Athlon motherboards are still expensive and few.` },
    { id: 'socket370', title: 'Back to sockets', content: `Once the L2 cache moved onto the processor die, the cartridge lost its purpose. In 1999 Intel moved the Celeron to the PPGA package for Socket 370, and in October 1999 it released the Pentium III Coppermine in an FC-PGA package for the same socket. "Slotket" adapters let Socket 370 processors fit Slot 1 boards.

<table class="interpedia-wikitable">
<tr><th>Connector</th><th>Years</th><th>Type</th><th>Processors</th></tr>
<tr><td>Socket 5</td><td>1994–1996</td><td>socket</td><td>Pentium 75–133</td></tr>
<tr><td>Socket 7</td><td>1995–1999</td><td>ZIF socket</td><td>Pentium, MMX, K5, K6, 6x86</td></tr>
<tr><td>Super Socket 7</td><td>1998–1999</td><td>ZIF socket</td><td>K6-2, K6-III</td></tr>
<tr><td>Slot 1</td><td>1997–1999</td><td>slot</td><td>Pentium II, Pentium III, Celeron</td></tr>
<tr><td>Slot 2</td><td>1998–1999</td><td>slot</td><td>Pentium II/III Xeon</td></tr>
<tr><td>Slot A</td><td>1999</td><td>slot</td><td>AMD Athlon</td></tr>
<tr><td>Socket 370</td><td>1999</td><td>ZIF socket</td><td>Celeron, Pentium III</td></tr>
</table>` }
  ],
  seeAlso: ['pentium', 'pentium2', 'celeron300a', 'amdk6', 'agpbus'],
  references: [
    'Intel Corporation. Slot 1 Connector Specification, 1997.',
    'AMD. Super7 Platform Overview, 1998.',
    'Guk, M. Apparatnye sredstva IBM PC. Entsiklopediya. St. Petersburg: Piter, 1998.'
  ],
  categories: ['Hardware', 'Processors', 'Motherboards']
});

window.interpediaReg('soundblaster', 'hardware', {
  title: 'Sound Blaster 16 и AWE64',
  infobox: {
    title: 'Sound Blaster',
    badgeText: 'Creative Technology',
    fields: [
      { label: 'Производитель', value: 'Creative Technology (Сингапур)' },
      { label: 'Первая модель', value: 'Sound Blaster 1.0, ноябрь 1989' },
      { label: 'Sound Blaster 16', value: '1992; 16 бит, 44,1 кГц, стерео' },
      { label: 'Синтезатор SB16', value: 'FM, Yamaha OPL3' },
      { label: 'AWE32 / AWE64', value: '1994 / 1996; таблично-волновой синтез EMU8000' },
      { label: 'Шина', value: 'ISA; Sound Blaster Live! — PCI' },
      { label: 'Настройки DOS', value: 'SET BLASTER=A220 I5 D1 H5' }
    ]
  },
  lead: `<strong>Sound Blaster</strong> — серия звуковых плат сингапурской компании Creative Technology, ставшая стандартом звука для IBM PC-совместимых компьютеров. Почти каждая игра для [[msdos|DOS]] поддерживает «Sound Blaster или совместимые», и производители других плат годами были вынуждены эмулировать её.

Самые распространённые модели 1990-х — <strong>Sound Blaster 16</strong> (1992) с 16-битным стереозвуком качества компакт-диска и <strong>AWE32</strong> и <strong>AWE64</strong> с таблично-волновым синтезатором, звучащим как настоящие инструменты. В 1998 году вышла Sound Blaster Live! для шины PCI с объёмным звуком для игр.`,
  sections: [
    { id: 'origins', title: 'Происхождение', content: `Creative основал в 1981 году в Сингапуре Сим Вонг Ху. Первая звуковая карта компании, Game Blaster (1987), не имела успеха, но Sound Blaster (1989) соединила совместимость с популярной платой AdLib — синтезатор Yamaha OPL2 — и цифровой канал для воспроизведения записанных звуков. Игры получили и музыку, и речь, и звуковые эффекты одновременно, а также порт для джойстика и MIDI.

В комплект ранних плат входила программа Dr. Sbaitso — «психотерапевт», беседующий с пользователем синтезированным голосом.` },
    { id: 'models', title: 'Модели', content: `<table class="interpedia-wikitable">
<tr><th>Модель</th><th>Год</th><th>Цифровой звук</th><th>Синтезатор</th></tr>
<tr><td>Sound Blaster 1.0 / 2.0</td><td>1989 / 1991</td><td>8 бит, моно</td><td>FM OPL2</td></tr>
<tr><td>Sound Blaster Pro</td><td>1991</td><td>8 бит, стерео</td><td>FM OPL2 ×2, затем OPL3</td></tr>
<tr><td>Sound Blaster 16</td><td>1992</td><td>16 бит, 44,1 кГц, стерео</td><td>FM OPL3</td></tr>
<tr><td>AWE32</td><td>1994</td><td>16 бит</td><td>EMU8000, 32 голоса, 1 МБ сэмплов</td></tr>
<tr><td>AWE64 / AWE64 Gold</td><td>1996</td><td>16 бит</td><td>EMU8000, 64 голоса (32 программных)</td></tr>
<tr><td>Live!</td><td>1998</td><td>PCI, многоканальный</td><td>EMU10K1, 64 голоса, EAX</td></tr>
</table>` },
    { id: 'sb16', title: 'Sound Blaster 16', content: `Sound Blaster 16 стала самой массовой звуковой картой эпохи DOS. Она записывает и воспроизводит звук качества компакт-диска, имеет разъём для дочерней платы Wave Blaster с сэмплами инструментов и интерфейс для подключения [[cdrom|привода CD-ROM]] — в начале 1990-х многие покупали её именно в «мультимедийных наборах» вместе с приводом и колонками.

FM-синтезатор OPL3 звучит узнаваемо «электронно»: музыка [[doom|Doom]] и сотен других игр в памяти игроков звучит именно так.` },
    { id: 'awe', title: 'AWE32 и AWE64', content: `Платы серии AWE используют синтезатор EMU8000 компании E-mu Systems, производителя профессиональных сэмплеров. Вместо искусственного FM-звука он воспроизводит записанные звуки настоящих инструментов. Пользователь может загружать собственные банки звуков в формате SoundFont: в AWE32 — в модули памяти SIMM, в AWE64 Gold — в 4 МБ встроенной памяти.

AWE64 Gold отличается позолоченными разъёмами и цифровым выходом S/PDIF и считается выбором меломанов.` },
    { id: 'setup', title: 'Настройка в DOS', content: `Чтобы игра нашла плату, нужно было указать её параметры: порт ввода-вывода, прерывание и каналы DMA. Они задаются переменной окружения в AUTOEXEC.BAT:

<blockquote>SET BLASTER=A220 I5 D1 H5 P330 T6</blockquote>

Здесь A220 — порт 220h, I5 — прерывание 5, D1 и H5 — каналы 8- и 16-битного DMA, P330 — MIDI-порт, T6 — тип платы. Конфликт прерываний с сетевой картой или мышью — одна из самых частых причин молчащего звука. Plug and Play в [[windows95|Win 95]] упростил настройку, но не устранил конфликты полностью.` },
    { id: 'live', title: 'Sound Blaster Live! и EAX', content: `Sound Blaster Live! (август 1998) работает на шине PCI и выводит звук на четыре колонки. Технология EAX (Environmental Audio Extensions) добавляет реверберацию и эхо в зависимости от помещения: в пещере звук гулкий, в коридоре — отражённый. Её поддерживают многие игры 1999 года. Главный соперник Creative в 3D-звуке — компания Aureal с технологией A3D.` }
  ],
  seeAlso: ['gravisgus', 'msdos', 'cdrom', 'mp3format', 'demoscene'],
  references: [
    'Creative Labs. Sound Blaster 16 User\'s Guide. — 1992.',
    'Creative Labs. AWE64 Gold Getting Started. — 1996.',
    'Гук М. Аппаратные средства IBM PC. Энциклопедия. — СПб.: Питер, 1998.'
  ],
  categories: ['Компьютерное железо', 'Звуковые карты', 'Creative']
}, {
  title: 'Sound Blaster 16 & AWE64',
  infobox: {
    title: 'Sound Blaster',
    badgeText: 'Creative Technology',
    fields: [
      { label: 'Manufacturer', value: 'Creative Technology (Singapore)' },
      { label: 'First model', value: 'Sound Blaster 1.0, November 1989' },
      { label: 'Sound Blaster 16', value: '1992; 16-bit, 44.1 kHz, stereo' },
      { label: 'SB16 synthesizer', value: 'FM, Yamaha OPL3' },
      { label: 'AWE32 / AWE64', value: '1994 / 1996; EMU8000 wavetable synthesis' },
      { label: 'Bus', value: 'ISA; Sound Blaster Live! is PCI' },
      { label: 'DOS settings', value: 'SET BLASTER=A220 I5 D1 H5' }
    ]
  },
  lead: `<strong>Sound Blaster</strong> is a series of sound cards from Singapore's Creative Technology that became the sound standard for IBM PC compatibles. Nearly every [[msdos|DOS]] game supports "Sound Blaster or compatible", and other card makers had to emulate it for years.

The most widespread 1990s models are the <strong>Sound Blaster 16</strong> (1992) with 16-bit CD-quality stereo, and the <strong>AWE32</strong> and <strong>AWE64</strong> with a wavetable synthesizer that sounds like real instruments. The Sound Blaster Live! for the PCI bus, with surround sound for games, came out in 1998.`,
  sections: [
    { id: 'origins', title: 'Origins', content: `Creative was founded in Singapore in 1981 by Sim Wong Hoo. Its first sound card, the Game Blaster (1987), flopped, but the Sound Blaster (1989) combined compatibility with the popular AdLib card, a Yamaha OPL2 synthesizer, with a digital channel for playing recorded sounds. Games got music, speech and sound effects at the same time, plus a joystick and MIDI port.

Early cards came with Dr. Sbaitso, a "psychotherapist" program that talked to the user in a synthesized voice.` },
    { id: 'models', title: 'Models', content: `<table class="interpedia-wikitable">
<tr><th>Model</th><th>Year</th><th>Digital audio</th><th>Synthesizer</th></tr>
<tr><td>Sound Blaster 1.0 / 2.0</td><td>1989 / 1991</td><td>8-bit mono</td><td>FM OPL2</td></tr>
<tr><td>Sound Blaster Pro</td><td>1991</td><td>8-bit stereo</td><td>dual FM OPL2, later OPL3</td></tr>
<tr><td>Sound Blaster 16</td><td>1992</td><td>16-bit, 44.1 kHz, stereo</td><td>FM OPL3</td></tr>
<tr><td>AWE32</td><td>1994</td><td>16-bit</td><td>EMU8000, 32 voices, 1 MB of samples</td></tr>
<tr><td>AWE64 / AWE64 Gold</td><td>1996</td><td>16-bit</td><td>EMU8000, 64 voices (32 in software)</td></tr>
<tr><td>Live!</td><td>1998</td><td>PCI, multichannel</td><td>EMU10K1, 64 voices, EAX</td></tr>
</table>` },
    { id: 'sb16', title: 'Sound Blaster 16', content: `The Sound Blaster 16 became the most common sound card of the DOS era. It records and plays CD-quality sound, has a header for a Wave Blaster daughterboard with instrument samples, and an interface for a [[cdrom|CD-ROM drive]]; in the early 1990s many people bought it in "multimedia kits" with a drive and speakers.

Its OPL3 FM synthesizer has a recognizably "electronic" sound: that is how the music of [[doom|Doom]] and hundreds of other games sounds in players' memories.` },
    { id: 'awe', title: 'AWE32 and AWE64', content: `AWE cards use the EMU8000 synthesizer from E-mu Systems, a maker of professional samplers. Instead of artificial FM sound, it plays recorded samples of real instruments. Users can load their own sound banks in SoundFont format, into SIMM memory modules on the AWE32 or into 4 MB of onboard memory on the AWE64 Gold.

The AWE64 Gold has gold-plated connectors and an S/PDIF digital output and is considered the audiophile choice.` },
    { id: 'setup', title: 'DOS setup', content: `For a game to find the card, its settings had to be specified: I/O port, interrupt and DMA channels. They are set by an environment variable in AUTOEXEC.BAT:

<blockquote>SET BLASTER=A220 I5 D1 H5 P330 T6</blockquote>

Here A220 is port 220h, I5 is interrupt 5, D1 and H5 are the 8- and 16-bit DMA channels, P330 is the MIDI port and T6 is the card type. An interrupt conflict with a network card or mouse was one of the most common reasons for silent sound. Plug and Play in [[windows95|Win 95]] made setup easier but did not end conflicts entirely.` },
    { id: 'live', title: 'Sound Blaster Live! and EAX', content: `The Sound Blaster Live! (August 1998) runs on the PCI bus and drives four speakers. EAX (Environmental Audio Extensions) adds reverb and echo depending on the room: a cave sounds hollow, a corridor sounds reflective. Many 1999 games support it. Creative's main rival in 3D audio is Aureal with its A3D technology.` }
  ],
  seeAlso: ['gravisgus', 'msdos', 'cdrom', 'mp3format', 'demoscene'],
  references: [
    'Creative Labs. Sound Blaster 16 User\'s Guide, 1992.',
    'Creative Labs. AWE64 Gold Getting Started, 1996.',
    'Guk, M. Apparatnye sredstva IBM PC. Entsiklopediya. St. Petersburg: Piter, 1998.'
  ],
  categories: ['Hardware', 'Sound Cards', 'Creative']
});

window.interpediaReg('gravisgus', 'hardware', {
  title: 'Gravis UltraSound (GUS)',
  infobox: {
    title: 'Gravis UltraSound',
    badgeText: 'GUS',
    fields: [
      { label: 'Производитель', value: 'Advanced Gravis (Канада)' },
      { label: 'Выход', value: '1992' },
      { label: 'Звуковой процессор', value: 'GF1' },
      { label: 'Голоса', value: '14 при 44,1 кГц; 32 при 19,2 кГц' },
      { label: 'Память', value: '256 КБ — 1 МБ под сэмплы' },
      { label: 'Модели', value: 'GUS, GUS MAX, GUS ACE, GUS PnP' },
      { label: 'Шина', value: 'ISA' }
    ]
  },
  lead: `<strong>Gravis UltraSound</strong> (<em>GUS</em>) — звуковая карта канадской компании Advanced Gravis, выпущенная в 1992 году. Её процессор GF1 аппаратно смешивает до 32 голосов из сэмплов, загруженных во встроенную память, и звучит гораздо богаче FM-синтеза [[soundblaster|Sound Blaster]].

GUS стала любимой картой [[demoscene|демосцены]] и музыкантов-трекерщиков: многие демо и трекеры поддерживают её в первую очередь. Однако совместимость с Sound Blaster обеспечивалась лишь программной эмуляцией, и в массовых играх карта часто молчала или звучала с ошибками.`,
  sections: [
    { id: 'design', title: 'Устройство', content: `Сердце карты — процессор GF1, созданный по технологии фирмы Forte. Музыкальные программы загружают в память карты сэмплы инструментов, а GF1 сам воспроизводит их с нужной высотой, громкостью и панорамой. Центральному процессору остаётся только отдавать команды, а не смешивать звук самостоятельно. Чем больше голосов звучит одновременно, тем ниже частота дискретизации: 14 голосов — при 44,1 кГц, 32 голоса — при 19,2 кГц.

Для MIDI-музыки в играх карта использует набор «патчей» — файлов с сэмплами инструментов, которые копируются в память при запуске.` },
    { id: 'models', title: 'Модели', content: `<table class="interpedia-wikitable">
<tr><th>Модель</th><th>Год</th><th>Особенности</th></tr>
<tr><td>UltraSound (классическая)</td><td>1992</td><td>до 1 МБ памяти, 8-битная запись</td></tr>
<tr><td>UltraSound MAX</td><td>1993</td><td>кодек CS4231 для 16-битной записи, интерфейс CD-ROM</td></tr>
<tr><td>UltraSound ACE</td><td>1994</td><td>без записи, дополнение к другой карте</td></tr>
<tr><td>UltraSound PnP</td><td>1995</td><td>чип AMD InterWave, Plug and Play, память под SoundFont-подобные банки</td></tr>
</table>` },
    { id: 'scene', title: 'GUS и демосцена', content: `Цена около 150 долларов и качество, близкое к профессиональным сэмплерам, сделали GUS стандартом для демосцены начала 1990-х. Демо [[secondreality|Second Reality]] группы Future Crew (1993) звучит лучше всего именно на GUS. Трекеры Scream Tracker 3, Impulse Tracker и FastTracker 2 используют её аппаратное смешивание, а форматы S3M, IT и XM стали языком сценовых музыкантов.` },
    { id: 'compat', title: 'Проблемы совместимости', content: `GUS не была совместима с Sound Blaster на уровне оборудования. Gravis выпускала эмуляторы SBOS и MegaEm, которые перехватывали обращения к Sound Blaster, но многие игры с ними работали плохо. Поэтому типичный «сценовый» компьютер имел две звуковые карты: GUS для музыки и демо и Sound Blaster для игр. С переходом игр на [[windows95|Win 95]] и DirectX проблема отчасти исчезла, но драйверы GUS для Win 95 отставали.` },
    { id: 'end', title: 'Закат', content: `В 1997 году Advanced Gravis перешла под контроль компании Kensington и сосредоточилась на игровых контроллерах — джойстиках и знаменитом Gravis GamePad. Выпуск звуковых карт прекратился. Владельцы GUS продолжают пользоваться ими для трекерной музыки, а сценовые программы до сих пор предлагают GUS в списке устройств первой строкой.` }
  ],
  seeAlso: ['soundblaster', 'demoscene', 'secondreality', 'msdos'],
  references: [
    'Advanced Gravis. UltraSound User\'s Guide. — 1992.',
    'Advanced Gravis. UltraSound Software Development Kit. — 1993.',
    'Future Crew. Second Reality: info file. — 1993.'
  ],
  categories: ['Компьютерное железо', 'Звуковые карты', 'Демосцена']
}, {
  title: 'Gravis UltraSound (GUS)',
  infobox: {
    title: 'Gravis UltraSound',
    badgeText: 'GUS',
    fields: [
      { label: 'Manufacturer', value: 'Advanced Gravis (Canada)' },
      { label: 'Released', value: '1992' },
      { label: 'Sound processor', value: 'GF1' },
      { label: 'Voices', value: '14 at 44.1 kHz; 32 at 19.2 kHz' },
      { label: 'Memory', value: '256 KB to 1 MB for samples' },
      { label: 'Models', value: 'GUS, GUS MAX, GUS ACE, GUS PnP' },
      { label: 'Bus', value: 'ISA' }
    ]
  },
  lead: `<strong>Gravis UltraSound</strong> (<em>GUS</em>) is a sound card from the Canadian company Advanced Gravis, released in 1992. Its GF1 processor mixes up to 32 voices in hardware from samples loaded into onboard memory and sounds far richer than the FM synthesis of the [[soundblaster|Sound Blaster]].

GUS became the favorite card of the [[demoscene|demoscene]] and tracker musicians, and many demos and trackers support it first. Sound Blaster compatibility, however, came only through software emulation, so in mainstream games the card was often silent or glitchy.`,
  sections: [
    { id: 'design', title: 'Design', content: `The heart of the card is the GF1 processor, built on Forte's technology. Music programs load instrument samples into the card's memory, and the GF1 plays them at the required pitch, volume and pan by itself. The main processor only sends commands instead of mixing the sound. The more voices play at once, the lower the sample rate: 14 voices at 44.1 kHz, 32 voices at 19.2 kHz.

For MIDI music in games the card uses a set of "patches", files of instrument samples copied into memory at startup.` },
    { id: 'models', title: 'Models', content: `<table class="interpedia-wikitable">
<tr><th>Model</th><th>Year</th><th>Features</th></tr>
<tr><td>UltraSound (classic)</td><td>1992</td><td>up to 1 MB of memory, 8-bit recording</td></tr>
<tr><td>UltraSound MAX</td><td>1993</td><td>CS4231 codec for 16-bit recording, CD-ROM interface</td></tr>
<tr><td>UltraSound ACE</td><td>1994</td><td>no recording, add-on to another card</td></tr>
<tr><td>UltraSound PnP</td><td>1995</td><td>AMD InterWave chip, Plug and Play, memory for sample banks</td></tr>
</table>` },
    { id: 'scene', title: 'GUS and the demoscene', content: `A price of about $150 and quality close to professional samplers made GUS the demoscene standard of the early 1990s. Future Crew's [[secondreality|Second Reality]] (1993) sounds best on a GUS. The Scream Tracker 3, Impulse Tracker and FastTracker 2 trackers use its hardware mixing, and the S3M, IT and XM formats became the language of scene musicians.` },
    { id: 'compat', title: 'Compatibility problems', content: `GUS was not hardware-compatible with the Sound Blaster. Gravis released the SBOS and MegaEm emulators, which intercepted Sound Blaster calls, but many games worked badly with them. So a typical "scene" PC had two sound cards: a GUS for music and demos and a Sound Blaster for games. As games moved to [[windows95|Win 95]] and DirectX the problem partly went away, but GUS drivers for Win 95 lagged behind.` },
    { id: 'end', title: 'Decline', content: `In 1997 Advanced Gravis came under the control of Kensington and focused on game controllers, joysticks and the famous Gravis GamePad. Sound card production ended. GUS owners still use their cards for tracker music, and scene software still lists GUS first among sound devices.` }
  ],
  seeAlso: ['soundblaster', 'demoscene', 'secondreality', 'msdos'],
  references: [
    'Advanced Gravis. UltraSound User\'s Guide, 1992.',
    'Advanced Gravis. UltraSound Software Development Kit, 1993.',
    'Future Crew. Second Reality info file, 1993.'
  ],
  categories: ['Hardware', 'Sound Cards', 'Demoscene']
});

window.interpediaReg('agpbus', 'hardware', {
  title: 'Шина AGP (Accelerated Graphics Port)',
  infobox: {
    title: 'AGP',
    badgeText: 'Accelerated Graphics Port',
    fields: [
      { label: 'Разработчик', value: 'Intel' },
      { label: 'Спецификация', value: 'AGP 1.0 — 1996; AGP 2.0 — 1998' },
      { label: 'Первый набор логики', value: 'Intel 440LX (1997)' },
      { label: 'Разрядность', value: '32 бита, 66 МГц' },
      { label: 'Пропускная способность', value: '266 МБ/с (1x), 533 МБ/с (2x), 1066 МБ/с (4x)' },
      { label: 'Для сравнения', value: 'PCI — 133 МБ/с на все устройства' },
      { label: 'Поддержка в ОС', value: '[[windows98|Win 98]], Win 95 OSR2.1' }
    ]
  },
  lead: `<strong>AGP</strong> (<em>Accelerated Graphics Port</em>, ускоренный графический порт) — выделенный разъём для видеокарты, разработанный Intel и появившийся на материнских платах в 1997 году. В отличие от общей шины PCI, AGP соединяет видеокарту напрямую с набором логики и памятью и работает в несколько раз быстрее.

AGP позволяет видеокарте брать текстуры прямо из оперативной памяти компьютера, когда их не хватает собственной памяти карты. На практике к 1999 году главным преимуществом стала скорость передачи данных для 3D-игр, а слот AGP — стандартным местом для видеокарты.`,
  sections: [
    { id: 'why', title: 'Зачем понадобилась AGP', content: `Шина PCI (1992) передаёт до 133 МБ/с, и эту полосу делят все платы: сетевая, звуковая, контроллер дисков и видеокарта. С появлением 3D-ускорителей видеокарте понадобилось передавать огромные объёмы текстур и геометрии. Intel предложила отдельный порт только для графики, работающий на удвоенной частоте и не мешающий остальным устройствам.` },
    { id: 'modes', title: 'Режимы', content: `<table class="interpedia-wikitable">
<tr><th>Режим</th><th>Передач за такт</th><th>Пропускная способность</th><th>Спецификация</th></tr>
<tr><td>AGP 1x</td><td>1</td><td>266 МБ/с</td><td>AGP 1.0 (1996)</td></tr>
<tr><td>AGP 2x</td><td>2</td><td>533 МБ/с</td><td>AGP 1.0 (1996)</td></tr>
<tr><td>AGP 4x</td><td>4</td><td>1066 МБ/с</td><td>AGP 2.0 (1998), питание 1,5 В</td></tr>
</table>

Помимо скорости, AGP поддерживает конвейерные запросы и отдельные линии для адресов (sideband addressing), что позволяет видеокарте отправлять следующий запрос, не дожидаясь ответа на предыдущий.` },
    { id: 'texturing', title: 'AGP-текстурирование', content: `Таблица GART (Graphics Address Remapping Table) позволяет видеокарте видеть часть оперативной памяти как продолжение собственной. Теоретически это значит, что текстуры могут храниться в основной памяти, а видеокарта — обходиться небольшим объёмом своей. Эту идею Intel продемонстрировала на собственном графическом чипе Intel 740 (1998), но он оказался медленнее карт с большой локальной памятью. Производители вроде NVIDIA и 3dfx предпочли ставить на карты 16–32 МБ, используя AGP прежде всего как быструю шину.` },
    { id: 'chipsets', title: 'Наборы логики и карты', content: `Первым набором логики с AGP стал Intel 440LX (1997) для [[pentium2|Pentium II]], затем 440BX (1998) с шиной 100 МГц. Для платформы Super Socket 7 и процессоров [[amdk6|AMD K6-2]] AGP поддерживают наборы VIA MVP3 и ALi Aladdin V; на них AGP нередко работает нестабильно, и пользователи ищут свежие драйверы VIA.

Под AGP выпускаются [[rivatnt|RIVA TNT]] и TNT2, Voodoo Banshee и Voodoo3, Matrox G200 и G400, ATI Rage Pro и Rage 128. При этом [[voodoo2|Voodoo 2]] остаётся платой PCI и спокойно работает рядом с AGP-видеокартой.` },
    { id: 'pro', title: 'AGP Pro', content: `Для мощных профессиональных видеокарт рабочих станций принята спецификация AGP Pro — более длинный разъём, способный подавать больше питания. Платы с ним только начинают появляться. Поддержка AGP 4x есть в наборах логики 1999 года, например Intel 820.` }
  ],
  seeAlso: ['rivatnt', 'voodoo2', 'pentium2', 'slot1', 'windows98'],
  references: [
    'Intel Corporation. Accelerated Graphics Port Interface Specification, Revision 1.0. — 1996.',
    'Intel Corporation. AGP Interface Specification, Revision 2.0. — 1998.',
    'Гук М. Аппаратные средства IBM PC. Энциклопедия. — СПб.: Питер, 1998.'
  ],
  categories: ['Компьютерное железо', 'Шины', 'Intel']
}, {
  title: 'AGP (Accelerated Graphics Port)',
  infobox: {
    title: 'AGP',
    badgeText: 'Accelerated Graphics Port',
    fields: [
      { label: 'Developer', value: 'Intel' },
      { label: 'Specification', value: 'AGP 1.0 in 1996; AGP 2.0 in 1998' },
      { label: 'First chipset', value: 'Intel 440LX (1997)' },
      { label: 'Width', value: '32-bit, 66 MHz' },
      { label: 'Bandwidth', value: '266 MB/s (1x), 533 MB/s (2x), 1066 MB/s (4x)' },
      { label: 'For comparison', value: 'PCI: 133 MB/s shared by all devices' },
      { label: 'OS support', value: '[[windows98|Win 98]], Win 95 OSR2.1' }
    ]
  },
  lead: `<strong>AGP</strong> (<em>Accelerated Graphics Port</em>) is a dedicated video card connector designed by Intel that appeared on motherboards in 1997. Unlike the shared PCI bus, AGP links the video card directly to the chipset and memory and runs several times faster.

AGP lets a video card pull textures straight from the computer's main memory when its own memory runs short. In practice, by 1999 the main benefit had become raw data speed for 3D games, and the AGP slot had become the standard home for a video card.`,
  sections: [
    { id: 'why', title: 'Why AGP was needed', content: `The PCI bus (1992) carries up to 133 MB/s, and all cards share that bandwidth: network, sound, disk controller and video. With the arrival of 3D accelerators, the video card had to move huge amounts of textures and geometry. Intel proposed a separate port just for graphics, running at double speed without getting in the way of other devices.` },
    { id: 'modes', title: 'Modes', content: `<table class="interpedia-wikitable">
<tr><th>Mode</th><th>Transfers per clock</th><th>Bandwidth</th><th>Specification</th></tr>
<tr><td>AGP 1x</td><td>1</td><td>266 MB/s</td><td>AGP 1.0 (1996)</td></tr>
<tr><td>AGP 2x</td><td>2</td><td>533 MB/s</td><td>AGP 1.0 (1996)</td></tr>
<tr><td>AGP 4x</td><td>4</td><td>1066 MB/s</td><td>AGP 2.0 (1998), 1.5 V signaling</td></tr>
</table>

Besides speed, AGP supports pipelined requests and separate address lines (sideband addressing), so the video card can send its next request without waiting for the previous answer.` },
    { id: 'texturing', title: 'AGP texturing', content: `The GART (Graphics Address Remapping Table) lets the video card see part of main memory as an extension of its own. In theory textures could live in main memory and the card could get by with little memory of its own. Intel demonstrated the idea with its own Intel 740 graphics chip (1998), but it turned out slower than cards with large local memory. Makers such as NVIDIA and 3dfx preferred to put 16–32 MB on their cards and use AGP mainly as a fast bus.` },
    { id: 'chipsets', title: 'Chipsets and cards', content: `The first AGP chipset was Intel's 440LX (1997) for the [[pentium2|Pentium II]], followed by the 440BX (1998) with a 100 MHz bus. For the Super Socket 7 platform and [[amdk6|AMD K6-2]] processors, AGP is supported by the VIA MVP3 and ALi Aladdin V chipsets; on them AGP is often unstable, and users hunt for the latest VIA drivers.

AGP cards include the [[rivatnt|RIVA TNT]] and TNT2, Voodoo Banshee and Voodoo3, Matrox G200 and G400, and ATI Rage Pro and Rage 128. The [[voodoo2|Voodoo 2]], meanwhile, remains a PCI card and works happily next to an AGP video card.` },
    { id: 'pro', title: 'AGP Pro', content: `For powerful professional workstation cards, the AGP Pro specification adds a longer connector that can deliver more power. Boards with it are only beginning to appear. AGP 4x support is found in 1999 chipsets such as the Intel 820.` }
  ],
  seeAlso: ['rivatnt', 'voodoo2', 'pentium2', 'slot1', 'windows98'],
  references: [
    'Intel Corporation. Accelerated Graphics Port Interface Specification, Revision 1.0, 1996.',
    'Intel Corporation. AGP Interface Specification, Revision 2.0, 1998.',
    'Guk, M. Apparatnye sredstva IBM PC. Entsiklopediya. St. Petersburg: Piter, 1998.'
  ],
  categories: ['Hardware', 'Buses', 'Intel']
});

window.interpediaReg('crtmonitor', 'hardware', {
  title: 'ЭЛТ-мониторы и трубка Sony Trinitron',
  infobox: {
    title: 'ЭЛТ-монитор',
    badgeText: 'Электронно-лучевая трубка',
    fields: [
      { label: 'Принцип', value: 'электронные пушки и люминофор' },
      { label: 'Маски', value: 'теневая маска, апертурная решётка (Trinitron)' },
      { label: 'Типичный шаг', value: '0,25–0,28 мм' },
      { label: 'Диагонали', value: '14, 15, 17, 19, 21 дюйм' },
      { label: 'Рекомендуемая частота', value: 'от 85 Гц' },
      { label: 'Стандарты безопасности', value: 'MPR II, TCO 92/95/99' },
      { label: 'Trinitron', value: 'Sony, с 1968 года' }
    ]
  },
  lead: `<strong>ЭЛТ-монитор</strong> — монитор на основе электронно-лучевой трубки, основной тип дисплея для персональных компьютеров. Три электронные пушки рисуют изображение строка за строкой, заставляя светиться красный, зелёный и синий люминофор на внутренней стороне экрана.

Среди трубок особое место занимает <strong>Trinitron</strong> компании Sony: вместо теневой маски с отверстиями в ней используется решётка из тонких вертикальных проволочек, благодаря чему изображение ярче и контрастнее, а экран почти плоский по вертикали. Мониторы на Trinitron и её аналогах — мечта дизайнеров и игроков конца 1990-х.`,
  sections: [
    { id: 'principle', title: 'Принцип работы', content: `Внутри стеклянной колбы с вакуумом расположены три электронные пушки. Отклоняющая система с катушками ведёт лучи по экрану слева направо и сверху вниз десятки раз в секунду. Перед люминофором стоит маска, благодаря которой каждый луч попадает только в точки своего цвета.

Частота вертикальной развёртки определяет, сколько раз в секунду обновляется изображение. При 60 Гц экран заметно мерцает и утомляет глаза; эргономисты рекомендуют не менее 85 Гц. Чем выше разрешение, тем сложнее монитору держать высокую частоту, поэтому в характеристиках указывают, например, «1024×768 при 85 Гц».` },
    { id: 'masks', title: 'Маски', content: `<dl>
<dt>Теневая маска</dt><dd>металлический лист с круглыми отверстиями; точки люминофора образуют треугольники. Изображение чёткое, но маска задерживает значительную часть электронов, и картинка темнее.</dd>
<dt>Апертурная решётка</dt><dd>вертикальные проволочки вместо листа (Sony Trinitron, Mitsubishi Diamondtron). Пропускает больше электронов, даёт яркое изображение. Чтобы проволочки не вибрировали, их удерживают одна-две тонкие горизонтальные нити, заметные на светлом фоне как еле видимые линии.</dd>
<dt>Щелевая маска</dt><dd>компромисс с прямоугольными прорезями (NEC CromaClear).</dd>
</dl>` },
    { id: 'trinitron', title: 'Sony Trinitron', content: `Sony представила трубку Trinitron в 1968 году в телевизорах и с тех пор выпускает её и для компьютерных мониторов. Экран Trinitron имеет форму сегмента цилиндра: изогнут по горизонтали, но прямой по вертикали, что уменьшает блики. Трубки Sony используют и другие производители — Apple, Dell, ViewSonic, Nokia. После истечения основных патентов появились аналоги, например Mitsubishi Diamondtron. В 1998–1999 годах Sony выпустила полностью плоские трубки FD Trinitron.` },
    { id: 'sizes', title: 'Размеры', content: `Диагональ ЭЛТ-монитора указывается для всей трубки, а видимая область меньше примерно на дюйм.

<table class="interpedia-wikitable">
<tr><th>Диагональ</th><th>Видимая область</th><th>Типичное разрешение</th><th>Вес</th></tr>
<tr><td>14″</td><td>около 13″</td><td>640×480, 800×600</td><td>около 10 кг</td></tr>
<tr><td>15″</td><td>около 14″</td><td>800×600</td><td>около 13 кг</td></tr>
<tr><td>17″</td><td>около 16″</td><td>1024×768</td><td>около 18 кг</td></tr>
<tr><td>19″</td><td>около 18″</td><td>1280×1024</td><td>около 23 кг</td></tr>
<tr><td>21″</td><td>около 20″</td><td>1600×1200</td><td>около 30 кг</td></tr>
</table>

В 1999 году 15 дюймов — стандарт для домашнего компьютера, 17 — желанное улучшение. Жидкокристаллические мониторы уже продаются, но 15-дюймовая модель стоит больше 1000 долларов.` },
    { id: 'safety', title: 'Безопасность и мифы', content: `Шведские стандарты MPR II и TCO ограничивают электромагнитное излучение мониторов; наклейка «TCO 95» или «TCO 99» служит знаком качества. Кнопка размагничивания (degauss) включает катушку, которая снимает намагниченность маски — экран при этом вздрагивает с характерным гулом.

В России широко распространены защитные стеклянные экраны, надеваемые на монитор, и народное поверье, что кактус рядом с монитором «поглощает излучение». Научных подтверждений у этого поверья нет, однако кактусы на компьютерных столах остаются приметой времени.` }
  ],
  seeAlso: ['voodoo', 'rivatnt', 'windows98', 'overclocking'],
  references: [
    'Sony Corporation. Trinitron Technical Overview. — 1998.',
    'TCO Development. TCO\'99 Displays Requirements. — 1999.',
    'Обзор 17-дюймовых мониторов // Мир ПК. — 1999.'
  ],
  categories: ['Компьютерное железо', 'Мониторы', 'Sony']
}, {
  title: 'CRT Monitors and Sony Trinitron',
  infobox: {
    title: 'CRT monitor',
    badgeText: 'Cathode ray tube',
    fields: [
      { label: 'Principle', value: 'electron guns and phosphor' },
      { label: 'Masks', value: 'shadow mask, aperture grille (Trinitron)' },
      { label: 'Typical pitch', value: '0.25–0.28 mm' },
      { label: 'Sizes', value: '14, 15, 17, 19, 21 inches' },
      { label: 'Recommended refresh', value: '85 Hz and up' },
      { label: 'Safety standards', value: 'MPR II, TCO 92/95/99' },
      { label: 'Trinitron', value: 'Sony, since 1968' }
    ]
  },
  lead: `A <strong>CRT monitor</strong> is a display built around a cathode ray tube, the main type of display for personal computers. Three electron guns draw the image line by line, making red, green and blue phosphor glow on the inside of the screen.

Among tubes, Sony's <strong>Trinitron</strong> holds a special place: instead of a shadow mask with holes it uses a grille of thin vertical wires, which makes the image brighter and more contrasty, and the screen is almost flat vertically. Monitors with Trinitron and similar tubes were the dream of designers and gamers in the late 1990s.`,
  sections: [
    { id: 'principle', title: 'How it works', content: `Inside a vacuum glass envelope are three electron guns. A deflection yoke with coils sweeps the beams across the screen left to right and top to bottom dozens of times per second. In front of the phosphor sits a mask that ensures each beam lands only on dots of its own color.

The vertical refresh rate sets how many times per second the image is redrawn. At 60 Hz the screen visibly flickers and tires the eyes; ergonomists recommend at least 85 Hz. The higher the resolution, the harder it is to keep a high refresh rate, which is why specifications say, for example, "1024×768 at 85 Hz".` },
    { id: 'masks', title: 'Masks', content: `<dl>
<dt>Shadow mask</dt><dd>a metal sheet with round holes; phosphor dots form triangles. The image is sharp, but the mask blocks a large share of the electrons, so the picture is darker.</dd>
<dt>Aperture grille</dt><dd>vertical wires instead of a sheet (Sony Trinitron, Mitsubishi Diamondtron). It lets more electrons through and gives a bright image. To keep the wires from vibrating, one or two thin horizontal damper wires hold them, visible on a light background as faint lines.</dd>
<dt>Slot mask</dt><dd>a compromise with rectangular slots (NEC CromaClear).</dd>
</dl>` },
    { id: 'trinitron', title: 'Sony Trinitron', content: `Sony introduced the Trinitron tube in 1968 in television sets and has since made it for computer monitors as well. A Trinitron screen is shaped like a section of a cylinder, curved horizontally but straight vertically, which reduces glare. Other makers use Sony tubes too, including Apple, Dell, ViewSonic and Nokia. After the main patents expired, alternatives such as the Mitsubishi Diamondtron appeared. In 1998–1999 Sony released fully flat FD Trinitron tubes.` },
    { id: 'sizes', title: 'Sizes', content: `A CRT's size is quoted for the whole tube, and the viewable area is about an inch smaller.

<table class="interpedia-wikitable">
<tr><th>Size</th><th>Viewable</th><th>Typical resolution</th><th>Weight</th></tr>
<tr><td>14″</td><td>about 13″</td><td>640×480, 800×600</td><td>about 10 kg</td></tr>
<tr><td>15″</td><td>about 14″</td><td>800×600</td><td>about 13 kg</td></tr>
<tr><td>17″</td><td>about 16″</td><td>1024×768</td><td>about 18 kg</td></tr>
<tr><td>19″</td><td>about 18″</td><td>1280×1024</td><td>about 23 kg</td></tr>
<tr><td>21″</td><td>about 20″</td><td>1600×1200</td><td>about 30 kg</td></tr>
</table>

In 1999, 15 inches is standard for a home computer and 17 is the coveted upgrade. LCD monitors are already on sale, but a 15-inch model costs more than $1,000.` },
    { id: 'safety', title: 'Safety and myths', content: `The Swedish MPR II and TCO standards limit monitor emissions; a "TCO 95" or "TCO 99" sticker serves as a mark of quality. The degauss button energizes a coil that removes magnetization from the mask, and the screen shudders with a characteristic hum.

In Russia, glass screen filters fitted over the monitor are widespread, as is the folk belief that a cactus next to the monitor "absorbs radiation". There is no scientific support for it, but cacti on computer desks remain a sign of the times.` }
  ],
  seeAlso: ['voodoo', 'rivatnt', 'windows98', 'overclocking'],
  references: [
    'Sony Corporation. Trinitron Technical Overview, 1998.',
    'TCO Development. TCO\'99 Displays Requirements, 1999.',
    '"17-inch monitor roundup". Mir PK, 1999.'
  ],
  categories: ['Hardware', 'Monitors', 'Sony']
});

window.interpediaReg('floppy144', 'hardware', {
  title: 'Дискета 3,5″ (1,44 МБ)',
  infobox: {
    title: 'Дискета 3,5″',
    badgeText: 'Microfloppy HD',
    fields: [
      { label: 'Разработчик формата', value: 'Sony' },
      { label: 'Появление', value: '1981–1982' },
      { label: 'Ёмкость', value: '720 КБ (DD), 1,44 МБ (HD), 2,88 МБ (ED)' },
      { label: 'Разметка HD', value: '80 дорожек × 2 стороны × 18 секторов × 512 байт' },
      { label: 'Формат DMF', value: '1,68 МБ, 21 сектор (дистрибутивы Microslop)' },
      { label: 'Корпус', value: 'жёсткий пластик, металлическая шторка' },
      { label: 'Защита записи', value: 'сдвижная заслонка' }
    ]
  },
  lead: `<strong>Дискета 3,5 дюйма</strong> — гибкий магнитный диск в жёстком пластиковом корпусе с металлической шторкой, разработанный компанией Sony. Версия высокой плотности ёмкостью 1,44 МБ с конца 1980-х годов — самый распространённый сменный носитель для персональных компьютеров.

На дискетах распространяются программы и драйверы, с них устанавливают систему и загружаются при сбоях, на них переносят документы между домом и работой. К концу 1990-х ёмкости дискеты уже не хватает для большинства задач, но дисковод по-прежнему стоит почти в каждом компьютере, а надпись «A:» знакома любому пользователю.`,
  sections: [
    { id: 'history', title: 'История', content: `Компания Sony представила трёхдюймовый формат «микрофлоппи» в начале 1980-х годов как замену хрупким 5,25-дюймовым дискетам в бумажном конверте. Новый диск помещался в нагрудный карман, был защищён от пыли и пальцев и не гнулся. Первым массовым компьютером с таким дисководом стал Apple Macintosh (1984), позднее — IBM PC Convertible (1986) и семейство IBM PS/2 (1987), где появилась версия высокой плотности на 1,44 МБ. Поддержку этого формата добавила [[msdos|MS-DOS]] 3.3.` },
    { id: 'capacity', title: 'Ёмкость', content: `<table class="interpedia-wikitable">
<tr><th>Тип</th><th>Маркировка</th><th>Ёмкость</th><th>Год</th></tr>
<tr><td>Двойной плотности</td><td>DD (2DD)</td><td>720 КБ</td><td>1986</td></tr>
<tr><td>Высокой плотности</td><td>HD (2HD)</td><td>1,44 МБ</td><td>1987</td></tr>
<tr><td>Сверхвысокой плотности</td><td>ED</td><td>2,88 МБ</td><td>1991</td></tr>
</table>

Название «1,44 МБ» — забавная смесь единиц: дискета вмещает 1 474 560 байт, то есть 1440 «компьютерных» килобайт по 1024 байта, а затем их поделили на 1000. Дискеты HD отличаются от DD дополнительным квадратным отверстием в углу. Microslop распространяла [[windows95|Win 95]] и Office на дискетах в формате DMF ёмкостью 1,68 МБ; обычной командой COPY такие дискеты не копируются.` },
    { id: 'use', title: 'Применение', content: `<ul>
<li><strong>Установка программ.</strong> Win 3.1 умещалась на 6–7 дискет, Win 95 занимала 13 дискет DMF, Office 97 — несколько десятков.</li>
<li><strong>Загрузочная дискета.</strong> С неё запускают компьютер при сбое, создают разделы утилитой FDISK и устанавливают систему. Дискета [[windows98|Win 98]] содержит драйверы [[cdrom|CD-ROM]].</li>
<li><strong>Обмен файлами.</strong> Курсовые, рефераты и игры переносят между домом, школой и работой.</li>
<li><strong>Обновление [[bios|BIOS]]</strong> и драйверов.</li>
</ul>

Большие файлы делят на части архиваторами: многотомный архив ARJ или [[winrar|RAR]] с томами по 1,44 МБ позволяет перенести игру на двух десятках дискет, если ни одна из них не окажется сбойной.` },
    { id: 'failures', title: 'Сбои и вирусы', content: `Дискеты чувствительны к магнитам, пыли, жаре и износу. Сообщение DOS «General failure reading drive A. Abort, Retry, Fail?» — одна из самых знакомых фраз эпохи. Через дискеты распространялись загрузочные вирусы, такие как Stoned и Michelangelo; паника вокруг Michelangelo, который должен был стирать диски 6 марта 1992 года, сделала антивирусы массовым товаром. Подробнее см. [[avp|AVP]].

В России качество дискет на рынках сильно различается, и пользователи предпочитают проверенные марки вроде 3M, Verbatim, Sony и TDK, а важные данные записывают на две дискеты сразу.` },
    { id: 'future', title: 'Будущее дискеты', content: `В 1998 году Apple выпустила iMac без дисковода, и это решение широко обсуждалось. Для переноса больших файлов появились [[zipdrive|Iomega Zip]] на 100 МБ и совместимый с обычными дискетами дисковод LS-120 SuperDisk на 120 МБ; распространяются записывающие приводы CD-R. Тем не менее дискета остаётся самым дешёвым и универсальным способом передать небольшой файл, и производители компьютеров не спешат от неё отказываться.` }
  ],
  seeAlso: ['zipdrive', 'cdrom', 'msdos', 'winrar', 'avp'],
  references: [
    'Гук М. Аппаратные средства IBM PC. Энциклопедия. — СПб.: Питер, 1998.',
    'IBM Personal System/2 Technical Reference. — IBM, 1987.',
    'Microslop Knowledge Base: Distribution Media Format (DMF). — 1995.'
  ],
  categories: ['Компьютерное железо', 'Носители информации', 'Sony']
}, {
  title: '3.5-inch Floppy Diskette (1.44 MB)',
  infobox: {
    title: '3.5″ floppy disk',
    badgeText: 'Microfloppy HD',
    fields: [
      { label: 'Format developer', value: 'Sony' },
      { label: 'Introduced', value: '1981–1982' },
      { label: 'Capacity', value: '720 KB (DD), 1.44 MB (HD), 2.88 MB (ED)' },
      { label: 'HD layout', value: '80 tracks × 2 sides × 18 sectors × 512 bytes' },
      { label: 'DMF format', value: '1.68 MB, 21 sectors (Microslop distribution)' },
      { label: 'Shell', value: 'rigid plastic, metal shutter' },
      { label: 'Write protection', value: 'sliding tab' }
    ]
  },
  lead: `The <strong>3.5-inch floppy disk</strong> is a flexible magnetic disk in a rigid plastic shell with a metal shutter, developed by Sony. Its 1.44 MB high-density version has been the most common removable medium for personal computers since the late 1980s.

Floppies carry programs and drivers, install systems and boot computers after a crash, and move documents between home and work. By the late 1990s a floppy is too small for most jobs, but the drive is still in almost every computer, and "A:" is familiar to every user.`,
  sections: [
    { id: 'history', title: 'History', content: `Sony introduced the 3.5-inch "microfloppy" in the early 1980s to replace fragile 5.25-inch disks in paper sleeves. The new disk fit in a shirt pocket, was protected from dust and fingers and did not bend. The first mass-market computer with the drive was the Apple Macintosh (1984), followed by the IBM PC Convertible (1986) and the IBM PS/2 family (1987), which introduced the 1.44 MB high-density version. [[msdos|MS-DOS]] 3.3 added support for it.` },
    { id: 'capacity', title: 'Capacity', content: `<table class="interpedia-wikitable">
<tr><th>Type</th><th>Marking</th><th>Capacity</th><th>Year</th></tr>
<tr><td>Double density</td><td>DD (2DD)</td><td>720 KB</td><td>1986</td></tr>
<tr><td>High density</td><td>HD (2HD)</td><td>1.44 MB</td><td>1987</td></tr>
<tr><td>Extra density</td><td>ED</td><td>2.88 MB</td><td>1991</td></tr>
</table>

The name "1.44 MB" is an odd mix of units: the disk holds 1,474,560 bytes, which is 1,440 "computer" kilobytes of 1,024 bytes, then divided by 1,000. HD disks differ from DD ones by an extra square hole in the corner. Microslop shipped [[windows95|Win 95]] and Office on floppies in the 1.68 MB DMF format, which an ordinary COPY command cannot duplicate.` },
    { id: 'use', title: 'Uses', content: `<ul>
<li><strong>Software installation.</strong> Win 3.1 fit on 6–7 disks, Win 95 took 13 DMF disks, Office 97 several dozen.</li>
<li><strong>Boot disk.</strong> It starts the computer after a crash, creates partitions with FDISK and installs the system. The [[windows98|Win 98]] boot disk includes [[cdrom|CD-ROM]] drivers.</li>
<li><strong>File exchange.</strong> Term papers, essays and games travel between home, school and work.</li>
<li><strong>[[bios|BIOS]]</strong> and driver updates.</li>
</ul>

Large files are split by archivers: a multi-volume ARJ or [[winrar|RAR]] archive with 1.44 MB volumes lets you carry a game on two dozen disks, as long as none of them turns out bad.` },
    { id: 'failures', title: 'Failures and viruses', content: `Floppies are sensitive to magnets, dust, heat and wear. The DOS message "General failure reading drive A. Abort, Retry, Fail?" is one of the most familiar phrases of the era. Boot sector viruses such as Stoned and Michelangelo spread through floppies; the scare over Michelangelo, which was set to wipe disks on March 6, 1992, made antivirus software a mass-market product. See [[avp|AVP]].

In Russia the quality of floppies sold at markets varies widely, and users prefer trusted brands such as 3M, Verbatim, Sony and TDK and copy important data onto two disks at once.` },
    { id: 'future', title: 'The future of the floppy', content: `In 1998 Apple released the iMac without a floppy drive, a widely debated decision. For moving large files there are the 100 MB [[zipdrive|Iomega Zip]] and the 120 MB LS-120 SuperDisk, which also reads ordinary floppies, and CD-R writers are spreading. Still, the floppy remains the cheapest and most universal way to hand over a small file, and PC makers are in no hurry to drop it.` }
  ],
  seeAlso: ['zipdrive', 'cdrom', 'msdos', 'winrar', 'avp'],
  references: [
    'Guk, M. Apparatnye sredstva IBM PC. Entsiklopediya. St. Petersburg: Piter, 1998.',
    'IBM Personal System/2 Technical Reference. IBM, 1987.',
    'Microslop Knowledge Base: Distribution Media Format (DMF), 1995.'
  ],
  categories: ['Hardware', 'Storage Media', 'Sony']
});

window.interpediaReg('modem56k', 'hardware', {
  title: 'Модемы 56K и USRobotics Sportster',
  infobox: {
    title: 'Модем 56K',
    badgeText: 'V.90',
    fields: [
      { label: 'Стандарт', value: 'ITU-T V.90 (1998)' },
      { label: 'Предшественники', value: 'x2 (USRobotics), K56flex (Rockwell, Lucent)' },
      { label: 'Приём', value: 'до 56 кбит/с (на практике до 53)' },
      { label: 'Передача', value: 'до 33,6 кбит/с' },
      { label: 'Команды', value: 'набор Hayes AT' },
      { label: 'Известные марки', value: 'USRobotics, ZyXEL, Hayes, Motorola, Rockwell' },
      { label: 'Исполнение', value: 'внешние (COM-порт) и внутренние (ISA, PCI)' }
    ]
  },
  lead: `<strong>Модем 56K</strong> — модем для коммутируемых телефонных линий, принимающий данные со скоростью до 56 кбит/с. После «войны стандартов» между технологиями x2 и K56flex в 1998 году был принят единый международный стандарт V.90. Модем — главное окно в [[www|Интернет]], [[fidonet|ФидоНет]] и [[bbs|BBS]] для домашнего пользователя конца 1990-х.

Самый известный бытовой модем — <strong>USRobotics Sportster</strong>. В России, где телефонные линии часто не позволяют достичь заявленной скорости, особой славой пользуются модемы ZyXEL и USRobotics Courier, умеющие держать связь на зашумлённых линиях.`,
  sections: [
    { id: 'principle', title: 'Принцип работы', content: `Модем (модулятор-демодулятор) превращает цифровые данные в звуковой сигнал, который передаётся по обычной телефонной линии, и обратно. При соединении модемы «договариваются» о скорости и протоколе — это знаменитая серия свистов и шипения, которую можно услышать из динамика. Управляют модемом командами набора Hayes: <code>ATZ</code> сбрасывает настройки, <code>ATDT</code> и <code>ATDP</code> набирают номер тональным или импульсным набором, <code>ATM0</code> выключает динамик, <code>ATH0</code> кладёт трубку.` },
    { id: 'speeds', title: 'Скорости', content: `<table class="interpedia-wikitable">
<tr><th>Стандарт</th><th>Скорость</th><th>Годы</th></tr>
<tr><td>V.22bis</td><td>2400 бит/с</td><td>1984</td></tr>
<tr><td>V.32</td><td>9600 бит/с</td><td>1989</td></tr>
<tr><td>V.32bis</td><td>14 400 бит/с</td><td>1991</td></tr>
<tr><td>V.34</td><td>28 800 бит/с</td><td>1994</td></tr>
<tr><td>V.34+</td><td>33 600 бит/с</td><td>1996</td></tr>
<tr><td>x2 / K56flex</td><td>до 56 000 бит/с</td><td>1997</td></tr>
<tr><td>V.90</td><td>до 56 000 бит/с</td><td>1998</td></tr>
</table>

Страница с картинками размером 50 КБ загружается на скорости 28,8 кбит/с примерно за 15 секунд, а файл в 3 МБ — около четверти часа. Подробнее см. [[dialup|удалённый доступ]].` },
    { id: 'v90', title: 'Как работает 56K', content: `Скорость 56 кбит/с возможна только при приёме и только если провайдер подключён к телефонной станции цифровой линией. Тогда сигнал проходит лишь одно аналогово-цифровое преобразование — на участке от станции до абонента. В США скорость ограничена ещё и правилами о мощности сигнала, поэтому реальный максимум — около 53 кбит/с. Передача от абонента работает по старой схеме, до 33,6 кбит/с.

В 1997 году продавались два несовместимых варианта: x2 от USRobotics и K56flex от Rockwell и Lucent. Провайдер мог поддерживать только один из них. В 1998 году Международный союз электросвязи утвердил компромиссный стандарт V.90, и производители выпустили обновления прошивок.` },
    { id: 'usr', title: 'USRobotics', content: `Компания USRobotics из Чикаго выпускала две линейки: недорогие Sportster для дома и профессиональные Courier для серверов и сисопов. Внешний Sportster в узнаваемом корпусе с рядом светодиодов (AA, CD, OH, RD, SD, TR, MR) подключается к COM-порту. В 1997 году USRobotics купила компания 3Com.

Дешёвой альтернативой стали программные «Win-модемы», в которых обработку сигнала выполняет центральный процессор. Они стоят меньше, но работают только под Win и нагружают компьютер.` },
    { id: 'russia', title: 'Модемы в России', content: `Многие российские телефонные станции — декадно-шаговые или координатные — дают помехи и не поддерживают тональный набор. На таких линиях модем 56K обычно соединяется на 19 200–28 800 бит/с, а дешёвые модели теряют связь. Поэтому у сисопов [[fidonet|ФидоНета]] в почёте модемы ZyXEL серии U-1496 и Omni и USRobotics Courier, умеющие работать на плохих линиях.

Модем занимает телефон, и в семьях постоянно спорят, кто будет пользоваться линией. Многие выходят в Сеть ночью, когда звонков нет, а у некоторых провайдеров ночные часы дешевле.` }
  ],
  seeAlso: ['dialup', 'fidonet', 'bbs', 'http', 'www'],
  references: [
    'ITU-T Recommendation V.90. — Женева, 1998.',
    'USRobotics. Sportster 56K User\'s Guide. — 1997.',
    'Конференция ru.modem, FAQ по модемам, 1998–1999.'
  ],
  links: [['http://fido.relcom.ru', 'Эхоконференции ФидоНета через WWW']],
  categories: ['Компьютерное железо', 'Модемы', 'Интернет']
}, {
  title: '56K Modems & USRobotics Sportster',
  infobox: {
    title: '56K modem',
    badgeText: 'V.90',
    fields: [
      { label: 'Standard', value: 'ITU-T V.90 (1998)' },
      { label: 'Predecessors', value: 'x2 (USRobotics), K56flex (Rockwell, Lucent)' },
      { label: 'Download', value: 'up to 56 kbit/s (about 53 in practice)' },
      { label: 'Upload', value: 'up to 33.6 kbit/s' },
      { label: 'Commands', value: 'Hayes AT set' },
      { label: 'Well-known brands', value: 'USRobotics, ZyXEL, Hayes, Motorola, Rockwell' },
      { label: 'Form', value: 'external (COM port) and internal (ISA, PCI)' }
    ]
  },
  lead: `A <strong>56K modem</strong> is a dial-up telephone modem that receives data at up to 56 kbit/s. After a "standards war" between the x2 and K56flex technologies, the single international V.90 standard was adopted in 1998. The modem is the home user's main window onto the [[www|Internet]], [[fidonet|FidoNet]] and [[bbs|BBSes]] in the late 1990s.

The best-known consumer modem is the <strong>USRobotics Sportster</strong>. In Russia, where phone lines often cannot reach the advertised speed, ZyXEL modems and the USRobotics Courier are prized for holding a connection on noisy lines.`,
  sections: [
    { id: 'principle', title: 'How it works', content: `A modem (modulator-demodulator) turns digital data into an audio signal carried over an ordinary phone line, and back. When connecting, modems "negotiate" speed and protocol, the famous series of whistles and hisses heard from the speaker. Modems are controlled with Hayes commands: <code>ATZ</code> resets settings, <code>ATDT</code> and <code>ATDP</code> dial by tone or pulse, <code>ATM0</code> mutes the speaker and <code>ATH0</code> hangs up.` },
    { id: 'speeds', title: 'Speeds', content: `<table class="interpedia-wikitable">
<tr><th>Standard</th><th>Speed</th><th>Year</th></tr>
<tr><td>V.22bis</td><td>2,400 bit/s</td><td>1984</td></tr>
<tr><td>V.32</td><td>9,600 bit/s</td><td>1989</td></tr>
<tr><td>V.32bis</td><td>14,400 bit/s</td><td>1991</td></tr>
<tr><td>V.34</td><td>28,800 bit/s</td><td>1994</td></tr>
<tr><td>V.34+</td><td>33,600 bit/s</td><td>1996</td></tr>
<tr><td>x2 / K56flex</td><td>up to 56,000 bit/s</td><td>1997</td></tr>
<tr><td>V.90</td><td>up to 56,000 bit/s</td><td>1998</td></tr>
</table>

A 50 KB page with pictures loads in about 15 seconds at 28.8 kbit/s, and a 3 MB file takes about a quarter of an hour. See [[dialup|dial-up access]] for more.` },
    { id: 'v90', title: 'How 56K works', content: `56 kbit/s is possible only for downloads and only if the provider connects to the phone exchange over a digital line. The signal then goes through just one analog-to-digital conversion, between the exchange and the subscriber. In the US, power rules also cap the signal, so the practical maximum is about 53 kbit/s. Uploads use the old scheme, up to 33.6 kbit/s.

In 1997 two incompatible versions were on sale: USRobotics' x2 and K56flex from Rockwell and Lucent. A provider might support only one of them. In 1998 the International Telecommunication Union approved the compromise V.90 standard, and manufacturers released firmware upgrades.` },
    { id: 'usr', title: 'USRobotics', content: `Chicago-based USRobotics made two lines: inexpensive Sportster modems for home and professional Couriers for servers and sysops. The external Sportster, in its familiar case with a row of LEDs (AA, CD, OH, RD, SD, TR, MR), connects to a COM port. In 1997 USRobotics was bought by 3Com.

A cheap alternative is the software "Winmodem", whose signal processing is done by the main processor. Such modems cost less but work only under Win and load the computer.` },
    { id: 'russia', title: 'Modems in Russia', content: `Many Russian telephone exchanges, step-by-step or crossbar, add noise and do not support tone dialing. On such lines a 56K modem usually connects at 19,200–28,800 bit/s, and cheap models drop the connection. That is why [[fidonet|FidoNet]] sysops prize ZyXEL U-1496 and Omni modems and the USRobotics Courier, which can cope with bad lines.

A modem ties up the phone, and families constantly argue over who gets the line. Many people go online at night, when nobody calls, and some providers charge less for night hours.` }
  ],
  seeAlso: ['dialup', 'fidonet', 'bbs', 'http', 'www'],
  references: [
    'ITU-T Recommendation V.90. Geneva, 1998.',
    'USRobotics. Sportster 56K User\'s Guide, 1997.',
    'ru.modem echo, modem FAQ, 1998–1999.'
  ],
  links: [['http://fido.relcom.ru', 'FidoNet echomail on the Web']],
  categories: ['Hardware', 'Modems', 'Internet']
});

window.interpediaReg('cdrom', 'hardware', {
  title: 'CD-ROM приводы и мультимедийные диски',
  infobox: {
    title: 'CD-ROM',
    badgeText: 'Compact Disc Read-Only Memory',
    fields: [
      { label: 'Разработчики', value: 'Sony и Philips' },
      { label: 'Стандарт', value: '«Жёлтая книга», 1985' },
      { label: 'Файловая система', value: 'ISO 9660 (1988)' },
      { label: 'Ёмкость', value: '650 МБ (74 мин); 700 МБ (80 мин)' },
      { label: 'Скорость 1x', value: '150 КБ/с' },
      { label: 'Типичный привод 1999', value: '32x–48x' },
      { label: 'Интерфейсы', value: 'ATAPI (IDE), SCSI, ранее — через звуковую карту' },
      { label: 'Драйвер DOS', value: 'MSCDEX.EXE' }
    ]
  },
  lead: `<strong>CD-ROM</strong> (<em>Compact Disc Read-Only Memory</em>) — оптический диск для хранения данных, созданный Sony и Philips на основе музыкального компакт-диска. Один диск вмещает 650 МБ — столько же, сколько примерно 450 [[floppy144|дискет]].

В середине 1990-х привод CD-ROM стал обязательной частью «мультимедийного компьютера». На дисках распространяются игры с видеороликами и музыкой, энциклопедии, операционные системы и сборники программ. К 1999 году приводы стали в десятки раз быстрее, а записывающие приводы CD-R перестали быть роскошью.`,
  sections: [
    { id: 'history', title: 'История', content: `Музыкальный компакт-диск (Compact Disc Digital Audio, «Красная книга») появился в 1982 году. В 1985 году Sony и Philips опубликовали «Жёлтую книгу» — стандарт записи компьютерных данных на такой же диск, с дополнительной коррекцией ошибок. Отраслевое соглашение High Sierra (1986) превратилось в стандарт файловой системы ISO 9660 (1988), который понимают все операционные системы.` },
    { id: 'multimedia', title: 'Мультимедийный ПК', content: `В 1991 году группа производителей во главе с Microslop опубликовала стандарт Multimedia PC (MPC): компьютер с процессором 386SX, звуковой картой и приводом CD-ROM. «Мультимедийные наборы» из привода, [[soundblaster|звуковой карты]] и колонок стали популярной покупкой.

Привод окупили игры: The 7th Guest (1993) и Myst (1993) поражали видеороликами и графикой, невозможными на дискетах. За ними последовали энциклопедии и справочники на дисках — от [[encarta|Microslop Encarta]] до атласов и словарей. Музыку многие игры, например [[quake2|Quake II]] и [[redalert|Red Alert]], записывают на диск обычными звуковыми дорожками.` },
    { id: 'speed', title: 'Скорость', content: `За базовую скорость принята скорость музыкального проигрывателя — 150 КБ/с (1x).

<table class="interpedia-wikitable">
<tr><th>Скорость</th><th>КБ/с</th><th>Годы массового распространения</th></tr>
<tr><td>1x</td><td>150</td><td>1990–1993</td></tr>
<tr><td>2x</td><td>300</td><td>1994</td></tr>
<tr><td>4x</td><td>600</td><td>1995</td></tr>
<tr><td>8x — 12x</td><td>1200–1800</td><td>1996</td></tr>
<tr><td>24x — 32x</td><td>до 4800</td><td>1997–1998</td></tr>
<tr><td>40x — 48x</td><td>до 7200 (на краю диска)</td><td>1999</td></tr>
</table>

Скоростные приводы вращают диск с постоянной угловой скоростью, поэтому максимальная скорость достигается лишь на внешних дорожках. На высоких оборотах приводы заметно шумят, а неровные пиратские диски вибрируют.` },
    { id: 'interfaces', title: 'Подключение', content: `Первые приводы подключались через собственные интерфейсы Panasonic, Mitsumi и Sony, часто расположенные на звуковой карте. С середины 1990-х стандартом стал интерфейс ATAPI на шине IDE, тот же, что у жёсткого диска. В [[msdos|DOS]] для работы с приводом нужен драйвер устройства в CONFIG.SYS и программа MSCDEX.EXE в AUTOEXEC.BAT; [[windows95|Win 95]] и [[windows98|Win 98]] работают с приводом сами.` },
    { id: 'recordable', title: 'CD-R, CD-RW и DVD', content: `Записывающие приводы CD-R позволяют один раз записать собственный диск, а CD-RW (1997) — перезаписывать его многократно. В 1998–1999 годах приводы CD-R со скоростью записи 2x–4x подешевели до нескольких сотен долларов, а «болванки» — до нескольких долларов. Параллельно распространяется DVD-ROM ёмкостью 4,7 ГБ на слой, читающий и обычные CD.` },
    { id: 'russia', title: 'Компакт-диски в России', content: `В России компакт-диски стали главным носителем для пиратских сборников: на рынках вроде [[gorbushka|Горбушки]] и в киосках продаются диски «100 игр», «Всё для Win 98» и коллекции MP3, вмещающие сотни песен. Компьютерные журналы, например «Игромания», выходят с дисками, на которых демоверсии, патчи и драйверы.` }
  ],
  seeAlso: ['floppy144', 'zipdrive', 'soundblaster', 'gorbushka', 'mp3format'],
  references: [
    'ISO 9660:1988. Volume and file structure of CDROM for information interchange.',
    'Philips, Sony. System Description Compact Disc Read Only Memory («Жёлтая книга»). — 1985.',
    'Multimedia PC Marketing Council. MPC Level 1 Specification. — 1991.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания» с компакт-диском']],
  categories: ['Компьютерное железо', 'Носители информации', 'Мультимедиа']
}, {
  title: 'CD-ROM Drives and Multimedia',
  infobox: {
    title: 'CD-ROM',
    badgeText: 'Compact Disc Read-Only Memory',
    fields: [
      { label: 'Developers', value: 'Sony and Philips' },
      { label: 'Standard', value: 'Yellow Book, 1985' },
      { label: 'Filesystem', value: 'ISO 9660 (1988)' },
      { label: 'Capacity', value: '650 MB (74 min); 700 MB (80 min)' },
      { label: '1x speed', value: '150 KB/s' },
      { label: 'Typical 1999 drive', value: '32x–48x' },
      { label: 'Interfaces', value: 'ATAPI (IDE), SCSI, earlier via sound card' },
      { label: 'DOS driver', value: 'MSCDEX.EXE' }
    ]
  },
  lead: `<strong>CD-ROM</strong> (<em>Compact Disc Read-Only Memory</em>) is an optical data disc created by Sony and Philips from the music compact disc. One disc holds 650 MB, about as much as 450 [[floppy144|floppy disks]].

In the mid-1990s the CD-ROM drive became an essential part of the "multimedia PC". Discs carry games with video and music, encyclopedias, operating systems and software compilations. By 1999 drives had become dozens of times faster, and CD-R writers were no longer a luxury.`,
  sections: [
    { id: 'history', title: 'History', content: `The music compact disc (Compact Disc Digital Audio, the "Red Book") appeared in 1982. In 1985 Sony and Philips published the "Yellow Book", a standard for storing computer data on the same disc with extra error correction. The High Sierra industry agreement (1986) became the ISO 9660 file system standard (1988), which every operating system understands.` },
    { id: 'multimedia', title: 'The multimedia PC', content: `In 1991 a group of manufacturers led by Microslop published the Multimedia PC (MPC) standard: a computer with a 386SX processor, a sound card and a CD-ROM drive. "Multimedia kits" of a drive, a [[soundblaster|sound card]] and speakers became a popular purchase.

Games paid for the drive: The 7th Guest (1993) and Myst (1993) dazzled with video and graphics impossible on floppies. Encyclopedias and reference works on disc followed, from [[encarta|Microslop Encarta]] to atlases and dictionaries. Many games, such as [[quake2|Quake II]] and [[redalert|Red Alert]], store their music on the disc as ordinary audio tracks.` },
    { id: 'speed', title: 'Speed', content: `The base speed is that of a music player, 150 KB/s (1x).

<table class="interpedia-wikitable">
<tr><th>Speed</th><th>KB/s</th><th>Mainstream years</th></tr>
<tr><td>1x</td><td>150</td><td>1990–1993</td></tr>
<tr><td>2x</td><td>300</td><td>1994</td></tr>
<tr><td>4x</td><td>600</td><td>1995</td></tr>
<tr><td>8x – 12x</td><td>1,200–1,800</td><td>1996</td></tr>
<tr><td>24x – 32x</td><td>up to 4,800</td><td>1997–1998</td></tr>
<tr><td>40x – 48x</td><td>up to 7,200 (at the outer edge)</td><td>1999</td></tr>
</table>

Fast drives spin the disc at a constant angular speed, so peak speed is reached only on the outer tracks. At high speeds drives are noisy, and uneven pirate discs wobble.` },
    { id: 'interfaces', title: 'Connection', content: `The first drives used proprietary Panasonic, Mitsumi and Sony interfaces, often located on the sound card. From the mid-1990s the standard became ATAPI on the IDE bus, the same as the hard disk. Under [[msdos|DOS]] a drive needs a device driver in CONFIG.SYS and MSCDEX.EXE in AUTOEXEC.BAT; [[windows95|Win 95]] and [[windows98|Win 98]] handle the drive themselves.` },
    { id: 'recordable', title: 'CD-R, CD-RW and DVD', content: `CD-R writers record a disc once, and CD-RW (1997) can rewrite it many times. In 1998–1999 CD-R drives writing at 2x–4x fell to a few hundred dollars and blank discs to a few dollars. Meanwhile DVD-ROM is spreading, with 4.7 GB per layer and the ability to read ordinary CDs.` },
    { id: 'russia', title: 'CDs in Russia', content: `In Russia the CD became the main medium for pirate compilations: markets such as [[gorbushka|Gorbushka]] and street kiosks sell discs like "100 Games", "Everything for Win 98" and MP3 collections holding hundreds of songs. Computer magazines such as Igromania come with discs of demos, patches and drivers.` }
  ],
  seeAlso: ['floppy144', 'zipdrive', 'soundblaster', 'gorbushka', 'mp3format'],
  references: [
    'ISO 9660:1988. Volume and file structure of CDROM for information interchange.',
    'Philips, Sony. System Description Compact Disc Read Only Memory (Yellow Book), 1985.',
    'Multimedia PC Marketing Council. MPC Level 1 Specification, 1991.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine with cover CD']],
  categories: ['Hardware', 'Storage Media', 'Multimedia']
});

window.interpediaReg('zipdrive', 'hardware', {
  title: 'Iomega Zip (100 МБ)',
  infobox: {
    title: 'Iomega Zip',
    badgeText: 'Zip 100',
    fields: [
      { label: 'Производитель', value: 'Iomega (США)' },
      { label: 'Выход', value: 'март 1995' },
      { label: 'Ёмкость', value: '100 МБ; Zip 250 — с 1998 года' },
      { label: 'Интерфейсы', value: 'параллельный порт, SCSI, ATAPI (IDE), USB' },
      { label: 'Цена при выходе', value: 'около 200 $ за привод, около 20 $ за диск' },
      { label: 'Конкуренты', value: 'SyQuest EZ135, LS-120 SuperDisk, CD-R' },
      { label: 'Старшая линейка', value: 'Iomega Jaz (1–2 ГБ)' }
    ]
  },
  lead: `<strong>Iomega Zip</strong> — система сменных магнитных дисков ёмкостью 100 МБ, выпущенная американской компанией Iomega в 1995 году. Диск Zip размером чуть больше [[floppy144|дискеты]] вмещает столько же, сколько 70 дискет, а привод в узнаваемом синем корпусе подключается к параллельному порту принтера и не требует открывать компьютер.

Zip стал стандартом для переноса больших файлов — макетов, фотографий, архивов — в издательствах, типографиях и университетах. Его репутацию омрачила проблема «щелчка смерти», а к концу 1999 года Zip всё сильнее теснят записывающие приводы CD-R.`,
  sections: [
    { id: 'history', title: 'История', content: `Iomega из штата Юта ранее выпускала накопители Bernoulli Box на гибких дисках большой ёмкости для профессионального рынка. Zip, объявленный в конце 1994 года и выпущенный весной 1995-го, задумывался как массовый продукт: недорогой привод, диски по цене обеда в ресторане и простое подключение. За первые годы было продано несколько миллионов приводов, а компьютеры многих производителей стали оснащать встроенным Zip.` },
    { id: 'tech', title: 'Устройство', content: `Диск Zip — гибкий магнитный диск в жёстком корпусе, похожем на толстую дискету, но несовместимом с обычным дисководом. Головки работают на очень малом расстоянии от вращающейся поверхности, что позволяет записывать данные гораздо плотнее, чем на дискете.

<table class="interpedia-wikitable">
<tr><th>Интерфейс</th><th>Скорость</th><th>Особенности</th></tr>
<tr><td>Параллельный порт</td><td>около 1 МБ/с</td><td>подключается к порту принтера, переносной</td></tr>
<tr><td>SCSI</td><td>до 1,4 МБ/с</td><td>популярен у Macintosh</td></tr>
<tr><td>ATAPI (IDE)</td><td>до 1,4 МБ/с</td><td>внутренний, ставится вместо дисковода</td></tr>
<tr><td>USB</td><td>около 1 МБ/с</td><td>с 1999 года</td></tr>
</table>` },
    { id: 'click', title: '«Щелчок смерти»', content: `В 1998 году широкую огласку получила неисправность, названная «щелчком смерти» (click of death): привод начинает ритмично щёлкать головками, не может прочитать диск и при этом может повредить и диск, и следующие вставленные в него диски. Специалист по восстановлению данных Стив Гибсон выпустил программу Trouble In Paradise для диагностики. Против Iomega был подан коллективный иск. Компания отрицала массовый характер проблемы, но доверие пользователей пошатнулось.` },
    { id: 'rivals', title: 'Конкуренты и наследники', content: `<dl>
<dt>Iomega Jaz</dt><dd>диски на 1 ГБ (1995) и 2 ГБ (1998) для профессионалов.</dd>
<dt>Zip 250</dt><dd>диски на 250 МБ (1998); новый привод читает и старые диски на 100 МБ.</dd>
<dt>SyQuest EZ135 и SyJet</dt><dd>главный конкурент; компания SyQuest обанкротилась в ноябре 1998 года.</dd>
<dt>LS-120 SuperDisk</dt><dd>диски на 120 МБ, а привод читает и обычные дискеты 1,44 МБ.</dd>
<dt>CD-R</dt><dd>650 МБ за несколько долларов; диск читается в любом [[cdrom|приводе CD-ROM]].</dd>
</dl>` },
    { id: 'russia', title: 'Zip в России', content: `В России Zip используют прежде всего в полиграфии и дизайне: макеты, свёрстанные на [[macos8|Macintosh]] в QuarkXPress и [[photoshop|Photoshop]], привозят в типографии и бюро вывода плёнок на дисках Zip. Для домашних пользователей привод дорог, а диски трудно найти за пределами крупных городов.` }
  ],
  seeAlso: ['floppy144', 'cdrom', 'macos8', 'photoshop'],
  references: [
    'Iomega Corporation. Zip Drive User\'s Guide. — 1995.',
    'Gibson S. Trouble In Paradise: The Click of Death. — Gibson Research, 1998.',
    'Обзор сменных накопителей // Мир ПК. — 1998.'
  ],
  categories: ['Компьютерное железо', 'Носители информации', 'Iomega']
}, {
  title: 'Iomega Zip Drive (100 MB)',
  infobox: {
    title: 'Iomega Zip',
    badgeText: 'Zip 100',
    fields: [
      { label: 'Manufacturer', value: 'Iomega (USA)' },
      { label: 'Released', value: 'March 1995' },
      { label: 'Capacity', value: '100 MB; Zip 250 from 1998' },
      { label: 'Interfaces', value: 'parallel port, SCSI, ATAPI (IDE), USB' },
      { label: 'Launch price', value: 'about $200 per drive, about $20 per disk' },
      { label: 'Competitors', value: 'SyQuest EZ135, LS-120 SuperDisk, CD-R' },
      { label: 'Higher-end line', value: 'Iomega Jaz (1–2 GB)' }
    ]
  },
  lead: `<strong>Iomega Zip</strong> is a 100 MB removable magnetic disk system released by the American company Iomega in 1995. A Zip disk, slightly larger than a [[floppy144|floppy]], holds as much as 70 floppies, and the drive in its recognizable blue case plugs into the printer's parallel port without opening the computer.

Zip became the standard for moving large files, layouts, photos and archives, in publishing houses, print shops and universities. Its reputation was marred by the "click of death", and by the end of 1999 Zip is increasingly squeezed by CD-R writers.`,
  sections: [
    { id: 'history', title: 'History', content: `Utah-based Iomega previously made Bernoulli Box drives with high-capacity flexible disks for the professional market. Zip, announced in late 1994 and released in spring 1995, was meant as a mass product: an inexpensive drive, disks for the price of a restaurant lunch and simple hookup. Several million drives sold in the first years, and many PC makers began building Zip drives into their computers.` },
    { id: 'tech', title: 'Design', content: `A Zip disk is a flexible magnetic disk in a rigid shell that looks like a thick floppy but does not fit an ordinary floppy drive. The heads fly very close to the spinning surface, which allows far denser recording than a floppy.

<table class="interpedia-wikitable">
<tr><th>Interface</th><th>Speed</th><th>Notes</th></tr>
<tr><td>Parallel port</td><td>about 1 MB/s</td><td>plugs into the printer port, portable</td></tr>
<tr><td>SCSI</td><td>up to 1.4 MB/s</td><td>popular with Macintosh users</td></tr>
<tr><td>ATAPI (IDE)</td><td>up to 1.4 MB/s</td><td>internal, fits in place of a floppy drive</td></tr>
<tr><td>USB</td><td>about 1 MB/s</td><td>since 1999</td></tr>
</table>` },
    { id: 'click', title: 'The "click of death"', content: `In 1998 a fault called the "click of death" got wide publicity: the drive starts clicking its heads rhythmically, cannot read the disk, and may damage both that disk and the next ones inserted. Data recovery specialist Steve Gibson released a diagnostic program, Trouble In Paradise. A class action suit was filed against Iomega. The company denied the problem was widespread, but user trust was shaken.` },
    { id: 'rivals', title: 'Competitors and successors', content: `<dl>
<dt>Iomega Jaz</dt><dd>1 GB (1995) and 2 GB (1998) disks for professionals.</dd>
<dt>Zip 250</dt><dd>250 MB disks (1998); the new drive also reads old 100 MB disks.</dd>
<dt>SyQuest EZ135 and SyJet</dt><dd>the main competitor; SyQuest went bankrupt in November 1998.</dd>
<dt>LS-120 SuperDisk</dt><dd>120 MB disks, and the drive also reads ordinary 1.44 MB floppies.</dd>
<dt>CD-R</dt><dd>650 MB for a few dollars, readable in any [[cdrom|CD-ROM drive]].</dd>
</dl>` },
    { id: 'russia', title: 'Zip in Russia', content: `In Russia Zip is used mostly in printing and design: layouts made on the [[macos8|Macintosh]] in QuarkXPress and [[photoshop|Photoshop]] are taken to print shops and film output bureaus on Zip disks. For home users the drive is expensive, and disks are hard to find outside big cities.` }
  ],
  seeAlso: ['floppy144', 'cdrom', 'macos8', 'photoshop'],
  references: [
    'Iomega Corporation. Zip Drive User\'s Guide, 1995.',
    'Gibson, S. Trouble In Paradise: The Click of Death. Gibson Research, 1998.',
    '"Removable storage roundup". Mir PK, 1998.'
  ],
  categories: ['Hardware', 'Storage Media', 'Iomega']
});
