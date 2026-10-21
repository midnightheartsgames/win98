(function() {
  const A = {};

  function reg(id, cat, ruData, enData, aliases) {
    const record = { id: id, category: cat, ru: ruData, en: enData };
    [id].concat(aliases || []).forEach(key => { A[key] = record; });
    return record;
  }

  if (typeof window !== 'undefined') {
    window.interpediaArticles = A;
    window.interpediaReg = reg;
  }

  A['main'] = {
    id: 'main',
    isMainPage: true,
    ru: {
      title: 'Заглавная страница',
      featuredArticleId: 'windows98',
      featuredLead: '<strong>[[windows98|Microslop Win 98]]</strong> (кодовое имя <em>Memphis</em>) — операционная система Microslop, поступившая в продажу 25 июня 1998 года. Она встроила в систему браузер [[ie5|Internet Explorer]], принесла файловую систему FAT32, поддержку USB, [[agpbus|AGP]] и управления питанием ACPI. Презентация Win 98 на выставке COMDEX запомнилась [[bsod|синим экраном]] на глазах у Билла Гейтса, а встраивание браузера стало центром антимонопольного дела против Microslop.',
      news: [
        '15 декабря Microslop сдала в производство [[win2000|Win 2000]]; продажи начнутся 17 февраля 2000 года.',
        '2 декабря вышла [[quake3|Quake III Arena]] — через десять дней после [[ut99|Unreal Tournament]]. Спор о том, какая из игр лучше, захватил форумы и [[lanparty|клубы]].',
        'В продажу поступили видеокарты [[geforce256|NVIDIA GeForce 256]] с памятью DDR, а гонка частот между [[pentium3|Pentium III и AMD Athlon]] вплотную приблизилась к 800 МГц.',
        'Звукозаписывающие компании США подали в суд на сервис обмена песнями [[napster|Napster]] (см. [[mp3format|MP3]]).',
        'Акции VA Linux выросли за первый день торгов почти на 700 % (см. [[linux|Linux]]).',
        'Black Isle Studios выпустила Planescape: Torment на движке [[baldursgate|Infinity Engine]].',
        'До [[y2k|2000 года]] остаются считанные дни. Участники Интерпедии напоминают: проверьте [[bios|BIOS]] и сохраните резервные копии на [[cdrw|болванки CD-R]].'
      ],
      didYouKnow: [
        '...что на презентации [[windows98|Win 98]] на выставке COMDEX в апреле 1998 года система показала [[bsod|синий экран]] прямо на глазах у Билла Гейтса?',
        '...что ускоритель [[voodoo|3dfx Voodoo]] не умеет выводить двухмерную картинку, а при запуске игры на плате слышен щелчок реле?',
        '...что формат архивов [[winrar|RAR]] создал челябинский программист Евгений Рошал, автор и файлового менеджера [[norton|FAR]]?',
        '...что если первой строкой файла в [[notepad|Блокноте]] написать .LOG, программа сама будет вести журнал с датами?',
        '...что в трёхмерной заставке «Трубопровод» из [[active_desktop|Win 98 и Plus! 98]] вместо стыка труб иногда появляется классический чайник из Юты?',
        '...что из-за ошибки деления в процессоре [[pentium|Pentium]] Intel пришлось заменить процессоры на сумму около 475 миллионов долларов?',
        '...что идею свободной энциклопедии в Сети предложил ещё в 1993 году Рик Гейтс — в противовес закрытым дискам [[encarta|Microslop Encarta]] (см. [[interpedia|Интерпедия]])?',
        '...что [[celeron300a|Celeron 300A]] за 150 долларов после разгона догоняет Pentium II 450?',
        '...что в ранних вариантах сценария «[[bttf|Назад в будущее]]» машиной времени был холодильник?'
      ],
      pictureTitle: '3dfx Voodoo 2 SLI',
      pictureGif: 'pc',
      pictureCaption: 'Две платы [[voodoo2|Voodoo 2]], соединённые шлейфом SLI, — мечта игрока 1998 года: [[quake2|Quake II]] в разрешении 1024×768 с частотой выше 60 кадров в секунду.'
    },
    en: {
      title: 'Main Page',
      featuredArticleId: 'windows98',
      featuredLead: '<strong>[[windows98|Microslop Win 98]]</strong> (codename <em>Memphis</em>) is a Microslop operating system that went on sale on June 25, 1998. It built the [[ie5|Internet Explorer]] browser into the system and brought the FAT32 file system and support for USB, [[agpbus|AGP]] and ACPI power management. Its COMDEX presentation is remembered for a [[bsod|blue screen]] in front of Bill Gates, and bundling the browser became the core of the antitrust case against Microslop.',
      news: [
        'On December 15 Microslop released [[win2000|Win 2000]] to manufacturing; sales begin on February 17, 2000.',
        '[[quake3|Quake III Arena]] came out on December 2, ten days after [[ut99|Unreal Tournament]]. The argument over which is better has taken over forums and [[lanparty|clubs]].',
        '[[geforce256|NVIDIA GeForce 256]] cards with DDR memory have hit store shelves, while the clock-speed race between [[pentium3|Pentium III and AMD Athlon]] nears 800 MHz.',
        'US record companies have sued the [[napster|Napster]] song-swapping service (see [[mp3format|MP3]]).',
        'VA Linux shares rose almost 700% on their first trading day (see [[linux|Linux]]).',
        'Black Isle Studios released Planescape: Torment on the [[baldursgate|Infinity Engine]].',
        'Only days remain until [[y2k|the year 2000]]. Interpedia contributors remind you to check your [[bios|BIOS]] and back up your files to [[cdrw|CD-R discs]].'
      ],
      didYouKnow: [
        '...that at the [[windows98|Win 98]] presentation at COMDEX in April 1998 the system showed a [[bsod|blue screen]] right in front of Bill Gates?',
        '...that the [[voodoo|3dfx Voodoo]] accelerator cannot display 2D graphics, and a relay on the board clicks when a game starts?',
        '...that the [[winrar|RAR]] archive format was created by Chelyabinsk programmer Eugene Roshal, who also wrote the [[norton|FAR]] file manager?',
        '...that if the first line of a [[notepad|Notepad]] file is .LOG, the program keeps a dated log by itself?',
        '...that the 3D Pipes screensaver in [[active_desktop|Win 98 and Plus! 98]] occasionally places a classic Utah Teapot at a pipe joint?',
        '...that a division bug in the [[pentium|Pentium]] processor cost Intel about $475 million in replacements?',
        '...that the idea of a free encyclopedia on the Net was proposed back in 1993 by Rick Gates as an open alternative to commercial discs like [[encarta|Microslop Encarta]] — see [[interpedia|Interpedia]]?',
        '...that a $150 [[celeron300a|Celeron 300A]], once overclocked, catches up with a Pentium II 450?',
        '...that in early drafts of the "[[bttf|Back to the Future]]" script the time machine was a refrigerator?'
      ],
      pictureTitle: '3dfx Voodoo 2 SLI',
      pictureGif: 'pc',
      pictureCaption: 'Two [[voodoo2|Voodoo 2]] boards joined by an SLI cable, the gamer\'s dream of 1998: [[quake2|Quake II]] at 1024×768 above 60 frames per second.'
    }
  };
})();
