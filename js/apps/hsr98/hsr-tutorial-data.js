(function (H) {
  'use strict';

  const TUTORIAL_CATS = [
    { id: 'all', label: 'Все', icon: 'tut_all' },
    { id: 'combat', label: 'Бой', icon: 'tut_combat' },
    { id: 'adv', label: 'Приключения', icon: 'tut_adv' },
    { id: 'sys', label: 'Системы', icon: 'tut_sys' },
    { id: 'modes', label: 'Режимы', icon: 'tut_modes' },
    { id: 'special', label: 'Особое', icon: 'tut_special' }
  ];

  const TUTORIAL_ENTRIES = [
    {
      id: 'combat_sp', cat: 'combat', title: 'Навыки и очки навыков', trialId: 'tr_sp',
      pages: [
        {
          title: 'Навыки и очки навыков',
          art: [{ kind: 'sp', callout: 'sp', label: '2 ✦✦✦✧✧' }],
          text: '<orange>Очки навыков</orange> — это общий ресурс, который делится между всеми членами отряда в бою (максимум 5 очков). Использование <orange>навыка [E]</orange> расходует 1 очко навыков и производит мощный боевой эффект.'
        },
        {
          title: 'Восстановление очков навыков',
          art: [{ kind: 'sp_gain', callout: 'basic', label: '[Q] Атака → +1 ✦' }],
          text: 'Применение <orange>базовой атаки [Q]</orange> наносит урон выбранной цели и восстанавливает отряду <orange>1 очко навыков</orange>. Грамотно чередуйте базовые атаки и навыки, чтобы ключевым героям всегда хватало ресурсов.'
        }
      ]
    },
    {
      id: 'combat_ult', cat: 'combat', title: 'Энергия и сверхспособность', trialId: 'tr_ult',
      pages: [
        {
          title: 'Энергия и сверхспособность',
          art: [{ kind: 'ult', callout: 'ult', label: '[1–4] MAX' }],
          text: 'Персонажи накапливают <orange>энергию</orange>, когда применяют базовые атаки и навыки, получают удары от врагов или побеждают противников. Когда шкала заполнена, иконка героя загорается.'
        },
        {
          title: 'Внеочередной ход сверхспособности',
          art: [{ kind: 'ult_cut', callout: 'av', label: 'Вне очереди!' }],
          text: 'Нажмите клавиши <orange>[1–4]</orange> в любой момент боя, чтобы немедленно вставить <orange>сверхспособность</orange> перед текущим действием. Это позволяет перехватить инициативу, исцелить отряд или пробить стойкость врага до его удара.'
        }
      ]
    },
    {
      id: 'combat_break', cat: 'combat', title: 'Пробитие уязвимости', trialId: 'tr_break',
      pages: [
        {
          title: 'Уязвимости и шкала стойкости',
          art: [{ kind: 'break', callout: 'tough', label: 'Уязвимость и стойкость' }],
          text: 'Над каждым противником отображаются значки его стихийных <orange>уязвимостей</orange> и белая полоса <orange>стойкости</orange>. Только удары соответствующего типа урона способны уменьшать стойкость врага.'
        },
        {
          title: 'Эффект Пробития уязвимости',
          art: [{ kind: 'break_hit', callout: 'broken', label: 'ПРОБИТИЕ!' }],
          text: 'Когда стойкость падает до нуля, происходит <orange>Пробитие уязвимости</orange>: противник получает мгновенный урон пробития, его ход <orange>задерживается на 25%</orange>, а получаемый им урон возрастает до восстановления стойкости.'
        }
      ]
    },
    {
      id: 'combat_break_elem', cat: 'combat', title: 'Урон пробития и стихийные эффекты', trialId: 'tr_brk_type',
      pages: [
        {
          title: 'Типы урона при пробитии',
          art: [{ kind: 'break_types', callout: 'elem', label: '7 стихий пробития' }],
          text: 'Пробитие уязвимости <orange>физическими</orange> и <orange>огненными</orange> атаками наносит повышенный мгновенный урон пробития и накладывает <orange>Кровотечение</orange> или <orange>Горение</orange>. <orange>Ветряное</orange> и <orange>электрическое</orange> пробитие накладывают <orange>Выветривание</orange> и <orange>Шок</orange>.'
        },
        {
          title: 'Контроль и Связывание при пробитии',
          art: [{ kind: 'break_cc', callout: 'cc', label: 'Заморозка · Заключение · Связывание' }],
          text: '<orange>Ледяное</orange> пробитие вызывает <orange>Заморозку</orange> (пропуск хода), <orange>мнимое</orange> — <orange>Заключение</orange> (сильную задержку и снижение скорости), а <orange>квантовое</orange> — <orange>Связывание</orange>, накапливающее урон от каждого удара союзников.'
        }
      ]
    },
    {
      id: 'combat_av', cat: 'combat', title: 'Шкала порядка действий и Скорость', trialId: 'tr_advance',
      pages: [
        {
          title: 'Шкала порядка действий',
          art: [{ kind: 'av_order', callout: 'av', label: 'Очередь ходов' }],
          text: 'В левой верхней части экрана боя расположена <orange>шкала порядка действий</orange>. Чем выше <orange>Скорость</orange> персонажа, тем быстрее уменьшается его интервал ожидания и тем чаще наступает его ход.'
        },
        {
          title: 'Продвижение и задержка действия',
          art: [{ kind: 'av_shift', callout: 'advance', label: 'Продвижение +100%' }],
          text: 'Умения с эффектом <orange>продвижения действия вперёд</orange> приближают следующий ход союзника, а эффекты <orange>задержки действия</orange> отбрасывают противников вниз по шкале.'
        }
      ]
    },
    {
      id: 'combat_followup', cat: 'combat', title: 'Бонус-атаки и контратаки', trialId: 'tr_followup',
      pages: [
        {
          title: 'Бонус-атаки',
          art: [{ kind: 'followup', callout: 'fua', label: 'Бонус-атака!' }],
          text: 'Некоторые персонажи выполняют <orange>бонус-атаки</orange>, которые <orange>запускаются автоматически</orange> при соблюдении условий: например, когда HP врага падает ниже 50%, происходит пробитие уязвимости или враг бьёт союзника под щитом.'
        }
      ]
    },
    {
      id: 'combat_buffs', cat: 'combat', title: 'Усиления, ослабления и снятие эффектов', trialId: 'tr_dispel',
      pages: [
        {
          title: 'Снятие усилений и ослаблений',
          art: [{ kind: 'dispel', callout: 'buff', label: 'Снятие эффектов' }, { kind: 'cleanse', callout: 'debuff', label: 'Очищение союзника' }],
          text: 'В бою действуют <orange>усиления</orange> (повышают характеристики) и <orange>ослабления</orange> (снижают защиту, скорость или наносят периодический урон). Умения <orange>снятия усилений</orange> лишают врагов бонусов, а <orange>снятие ослаблений</orange> очищает союзников.'
        }
      ]
    },
    {
      id: 'combat_interrupt', cat: 'combat', title: 'Прерывание заряженной атаки противника', trialId: 'tr_interrupt',
      pages: [
        {
          title: 'Прерывание заряженной атаки',
          art: [{ kind: 'interrupt', callout: 'charge', label: 'Зарядка прервана!' }],
          text: 'Когда элитный противник или босс готовит <orange>заряженную атаку</orange>, над ним появляется предупреждение. Пробейте его <orange>уязвимость</orange> или наложите контроль до его следующего хода, чтобы <orange>прервать</orange> опасный приём.'
        }
      ]
    },
    {
      id: 'combat_dual_field', cat: 'combat', title: 'Главное и второстепенное поле',
      pages: [
        {
          title: 'Главное и второстепенное поле',
          art: [{ kind: 'dual_main', callout: 'boss', label: 'Главное поле (Босс)' }, { kind: 'dual_sub', callout: 'sub', label: 'Второстепенное поле' }],
          text: 'В режиме двойного боя поле, на котором находится босс, называется <orange>главным полем</orange>, в то время как другое поле называется <orange>второстепенным полем</orange>. Победа над отрядами на второстепенном поле ослабляет защиту босса и передаёт усиления главной группе.'
        }
      ]
    },
    {
      id: 'combat_dual_battle', cat: 'combat', title: 'Двойное поле боя',
      pages: [
        {
          title: 'Двойное поле боя',
          art: [{ kind: 'dual_split', callout: 'team1', label: 'Узел I' }, { kind: 'dual_split2', callout: 'team2', label: 'Узел II' }],
          text: 'В старших залах <orange>Зала забвения</orange> и в <orange>Чистом вымысле</orange> сражение проходит на <orange>двух полях боя</orange> подряд. Перед началом испытания вы формируете два отдельных отряда, каждый из которых удерживает свой участок.'
        }
      ]
    },
    {
      id: 'combat_hp_overload', cat: 'combat', title: 'Перегрузка HP',
      pages: [
        {
          title: 'Перегрузка HP',
          art: [{ kind: 'hp_overload', callout: 'hp', label: 'Перегрузка HP' }],
          text: 'При срабатывании <orange>Перегрузки HP</orange> часть избыточного исцеления или потерянного здоровья конвертируется в заряды. Накопленный заряд усиливает следующую атаку персонажа или создаёт защитный барьер.'
        }
      ]
    },
    {
      id: 'combat_back_row', cat: 'combat', title: 'Цель в заднем ряду',
      pages: [
        {
          title: 'Цель в заднем ряду',
          art: [{ kind: 'back_row', callout: 'back', label: 'Задний ряд' }],
          text: 'Некоторые противники призывают подкрепление и отступают в <orange>задний ряд</orange>. Обычные одиночные удары удерживаются передним строем, тогда как атаки по <orange>всем врагам</orange> и отскоки поражают цели в любом ряду.'
        }
      ]
    },
    {
      id: 'combat_hp_counter', cat: 'combat', title: 'Счётчик HP',
      pages: [
        {
          title: 'Счётчик HP',
          art: [{ kind: 'hp_counter', callout: 'tally', label: 'Счётчик фаз HP' }],
          text: 'У боссов и некоторых героев (например, Блэйда) действует <orange>Счётчик HP</orange>. У боссов индикатор показывает оставшиеся фазы здоровья, а у героев Разрушения отслеживает суммарно потерянное в бою HP для усиления сверхспособности.'
        }
      ]
    },
    {
      id: 'adv_chest', cat: 'adv', title: 'Сундук',
      pages: [
        {
          title: 'Сундук',
          art: [{ kind: 'chest', callout: 'chest', label: 'Обычный и ценный сундук' }],
          text: '<orange>Сундуки</orange> разбросаны по всему миру. Вы можете найти очень ценные вещи, исследуя отсеки станции, улицы Белобога и порты Лофу: <orange>Звёздный нефрит</orange>, кредиты, опыт Освоения и материалы развития.'
        }
      ]
    },
    {
      id: 'adv_destructibles', cat: 'adv', title: 'Разрушаемые предметы',
      pages: [
        {
          title: 'Разрушаемые предметы',
          art: [{ kind: 'destructible', callout: 'barrel', label: 'Контейнеры на карте' }],
          text: 'На локациях встречаются <orange>разрушаемые предметы</orange> и энергетические контейнеры. Взаимодействуйте с ними или разбивайте их на ходу, чтобы получать кредиты, материалы для Синтеза или восстанавливать очки техники и HP.'
        }
      ]
    },
    {
      id: 'adv_anchor1', cat: 'adv', title: 'Пространственный якорь I',
      pages: [
        {
          title: 'Пространственный якорь I',
          art: [{ kind: 'anchor', callout: 'anchor', label: 'Телепорт и ориентир' }],
          text: '<orange>Пространственные якоря</orange> служат маяками навигации. Подойдите к якорю в первый раз, чтобы активировать его: после этого вы сможете мгновенно перемещаться к нему через меню <orange>Навигации [M]</orange>.'
        }
      ]
    },
    {
      id: 'adv_anchor2', cat: 'adv', title: 'Пространственный якорь II',
      pages: [
        {
          title: 'Пространственный якорь II',
          art: [{ kind: 'anchor_heal', callout: 'heal', label: 'Полное исцеление и сохранение' }],
          text: 'При приближении к активному <orange>Пространственному якорю</orange> весь ваш отряд автоматически <orange>восстанавливает HP</orange> и поднимает павших союзников. Кроме того, рядом с якорем всегда доступно ручное <orange>сохранение игры</orange>.'
        }
      ]
    },
    {
      id: 'adv_strong_foe', cat: 'adv', title: 'Сильный противник',
      pages: [
        {
          title: 'Сильный противник',
          art: [{ kind: 'strong_foe', callout: 'elite', label: 'Грозный враг на карте' }],
          text: 'Особо опасные отряды и стражи Фрагментума отмечены аурой <orange>сильного противника</orange>. Победа над ними открывает доступ к охраняемым ценным сундукам, редким реликвиям и достижениям Освоения.'
        }
      ]
    },
    {
      id: 'adv_calyx_gold', cat: 'adv', title: 'Чашелист (золотой)',
      pages: [
        {
          title: 'Чашелист (золотой)',
          art: [{ kind: 'calyx_gold', callout: 'gold', label: 'Бутон воспоминаний · эфира · сокровищ' }],
          text: '<orange>Чашелист (золотой)</orange> — испытание за <orange>Энергию Освоения</orange>, в котором добываются журналы опыта персонажей, очищенный эфир для Световых конусов и кредиты. Быстрый сбор доступен и за <orange>Топливные купоны</orange>.'
        }
      ]
    },
    {
      id: 'adv_calyx_crimson', cat: 'adv', title: 'Чашелист (багровый)',
      pages: [
        {
          title: 'Чашелист (багровый)',
          art: [{ kind: 'calyx_crimson', callout: 'crimson', label: 'Материалы Путей' }],
          text: '<orange>Чашелист (багровый)</orange> вознаграждает материалами конкретного <orange>Пути</orange> (Разрушение, Охота, Эрудиция, Гармония, Небытие, Сохранение, Изобилие), необходимыми для активации и повышения уровня <orange>Следов</orange> и возвышения Световых конусов.'
        }
      ]
    },
    {
      id: 'adv_tech', cat: 'adv', title: 'Техники и вступление в бой',
      pages: [
        {
          title: 'Техники на поле',
          art: [{ kind: 'field_tech', callout: 'tech', label: 'Техника перед боем' }],
          text: 'У каждого героя есть уникальная <orange>Техника</orange>. Активация техники перед столкновением с врагом даёт отряду преимущество с первого хода: накладывает щиты, ослабляет защиту врагов, замораживает цели или сразу наносит урон по стойкости.'
        }
      ]
    },
    {
      id: 'sys_chars_cones', cat: 'sys', title: 'Персонажи и Световые конусы',
      pages: [
        {
          title: 'Уровень и Световые конусы',
          art: [{ kind: 'char_cone', callout: 'cone', label: 'Герой + Световой конус' }],
          text: 'В разделе <orange>Персонажи [C]</orange> вы можете повышать уровень героев и экипировать <orange>Световые конусы</orange>. Пассивная способность Светового конуса работает только тогда, когда его <orange>Путь</orange> совпадает с Путём персонажа!'
        }
      ]
    },
    {
      id: 'sys_traces', cat: 'sys', title: 'Следы и Эйдолоны',
      pages: [
        {
          title: 'Древо Следов и Эйдолоны',
          art: [{ kind: 'traces', callout: 'trace', label: 'Следы и Эйдолоны' }],
          text: 'Вкладка <orange>Следы</orange> позволяет повышать множители умений и открывать бонусные способности героя. Получение дубликатов персонажа в Прыжке открывает до шести <orange>Эйдолонов</orange>, значительно усиливающих его механики.'
        }
      ]
    },
    {
      id: 'sys_relics', cat: 'sys', title: 'Реликвии и комплекты',
      pages: [
        {
          title: 'Пещерные реликвии и планарные украшения',
          art: [{ kind: 'relics', callout: 'relic', label: '4 пещерные + 2 планарные' }],
          text: 'Герой может носить 4 <orange>пещерные реликвии</orange> (голова, руки, тело, ноги) и 2 <orange>планарных украшения</orange> (сфера и верёвка). Сбор 2 и 4 предметов одного набора активирует мощные бонусы комплекта.'
        }
      ]
    },
    {
      id: 'sys_warp_synth', cat: 'sys', title: 'Прыжок и Синтез',
      pages: [
        {
          title: 'Звёздный прыжок и Синтез',
          art: [{ kind: 'warp_synth', callout: 'warp', label: 'Прыжок [F3] и Синтез' }],
          text: 'Используйте <orange>Звёздные пропуска</orange> и <orange>Звёздный нефрит</orange> в меню <orange>Прыжка</orange>, чтобы приглашать в экипаж новых героев и получать редкие конусы. В меню <orange>Синтеза</orange> можно создавать расходники, объединять материалы и разбирать лишние реликвии.'
        }
      ]
    },
    {
      id: 'modes_fh', cat: 'modes', title: 'Зал забвения',
      pages: [
        {
          title: 'Зал забвения',
          art: [{ kind: 'mode_fh', callout: 'fh', label: 'Испытание циклов и звёзд' }],
          text: '<orange>Зал забвения</orange> в гостиной Экспресса проверяет мощь вашего экипажа в боях с ограничением по <orange>циклам</orange>. За каждую полученную звезду выдаются <orange>Звёздный нефрит</orange> и <orange>Сияющий отсвет</orange> для лавки «Шутки сбываются».'
        }
      ]
    },
    {
      id: 'modes_su', cat: 'modes', title: 'Виртуальная вселенная',
      pages: [
        {
          title: 'Виртуальная вселенная Герты',
          art: [{ kind: 'mode_su', callout: 'su', label: 'Благословения Эонов и диковины' }],
          text: 'В <orange>Виртуальной вселенной</orange> вы выбираете Путь, собираете <orange>Благословения Эонов</orange>, <orange>Диковины</orange> и вступаете в <orange>Резонанс Пути</orange>. В комнатах отдыха у Герты можно добыть <orange>планарные украшения</orange>.'
        }
      ]
    },
    {
      id: 'modes_pf', cat: 'modes', title: 'Чистый вымысел',
      pages: [
        {
          title: 'Чистый вымысел и Призрачная иллюзия',
          art: [{ kind: 'mode_pf', callout: 'pf', label: 'Непрерывные волны и Очки' }],
          text: 'В режиме <orange>Чистый вымысел</orange> враги появляются непрерывно, а за каждого поверженного противника начисляются очки. Эффекты <orange>Призрачной иллюзии</orange> и выбранной <orange>Какофонии</orange> помогают набрать до 80 000 очков на двух узлах.'
        }
      ]
    },
    {
      id: 'modes_cw', cat: 'modes', title: 'Валютные войны и Мультистриминг',
      pages: [
        {
          title: 'Валютные войны и Мультистриминг',
          art: [{ kind: 'mode_cw', callout: 'cw', label: 'Инвестиции, ранги и эфир' }],
          text: 'В <orange>Валютных войнах КММ</orange> вы собираете оперативников из общего пула, повышаете их звёздность и активируете синергии фракций. Механика <orange>Мультистриминга</orange> и зрительского эфира добавляет особые модификаторы раунда и бонусные дивиденды.'
        }
      ]
    },
    {
      id: 'modes_range', cat: 'modes', title: 'Боевой полигон',
      pages: [
        {
          title: 'Боевой полигон',
          art: [{ kind: 'mode_range', callout: 'range', label: 'Свободный тест отрядов' }],
          text: 'На <orange>Боевом полигоне</orange> можно испытать любой состав, включая пробных героев, настроить волны противников, зафиксировать зерно генератора (Seed) и посмотреть подробную сводку урона по циклам.'
        }
      ]
    },
    {
      id: 'spec_elation', cat: 'special', title: 'Путь Радости',
      pages: [
        {
          title: 'Путь Радости и Веселье',
          art: [{ kind: 'spec_elation', callout: 'elation', label: 'Юмор · Аха · Хит' }],
          text: 'Персонажи <orange>Пути Радости</orange> (и благословения Радости) копят заряды <orange>Юмора</orange> и вызывают на шкалу действий самого <orange>Аху</orange>. В состоянии <orange>Хита</orange> умения наносят дополнительный <orange>Урон Радости</orange>, зависящий от характеристики Радости.'
        }
      ]
    },
    {
      id: 'spec_contact', cat: 'special', title: 'Переговоры: Контакт с врагом', trialId: 'tr_contact',
      pages: [
        {
          title: 'Контакт с противником [T]',
          art: [{ kind: 'spec_contact', callout: 'contact', label: '[T] Контакт → Довольство' }],
          text: 'В обычных боях доступна команда <orange>[T] Контакт</orange>. У каждого семейства врагов свой характер: если выбрать реплику по душе противнику, он наполнится <orange>Довольством</orange> или <orange>Восторгом</orange>, подарит предмет и мирно покинет бой.'
        }
      ]
    },
    {
      id: 'spec_fusion', cat: 'special', title: 'Слияние: совместные техники', trialId: 'tr_fusion',
      pages: [
        {
          title: 'Совместные приёмы Слияния [R]',
          art: [{ kind: 'spec_fusion', callout: 'fusion', label: '[R] Слияние героев' }],
          text: 'Когда в отряде сражаются связанные друг с другом герои (например, Март 7 и Дань Хэн, Химико и Вельт, Броня и Зеле) и у обоих полностью заряжена <orange>энергия</orange>, команда <orange>[R] Слияние</orange> обрушивает на врагов совместный стихийный удар с особым эффектом.'
        }
      ]
    },
    {
      id: 'spec_net', cat: 'special', title: 'Эфирная связь и Рубеж Экспресса',
      pages: [
        {
          title: 'Гости Экспресса и совместный бой',
          art: [{ kind: 'spec_net', callout: 'net', label: 'UID · Друзья · Рубеж Экспресса' }],
          text: 'Через раздел <orange>Друзья</orange> в телефоне можно обмениваться UID по <orange>Эфирной связи</orange>, приглашать гостей в вагон Экспресса, оставлять записи в гостевой книге и проходить совместный режим <orange>«Рубеж Экспресса»</orange> за одним столом.'
        }
      ]
    }
  ];

  const TRAINING_GROUPS = [
    { id: 'basic', label: 'Базовые механики', icon: 'tut_combat' },
    { id: 'break', label: 'Пробитие уязвимости и ослабления', icon: 'gindex' },
    { id: 'special', label: 'Особые механики', icon: 'gdaily' }
  ];

  const TRAINING_TRIALS = [
    {
      id: 'tr_sp',
      group: 'basic',
      title: 'Навыки и очки навыков',
      badge: 'Тактическая тренировка',
      summary: '<orange>Очки навыков</orange> — это ресурс, который <orange>делится между всеми членами отряда</orange>.',
      art: { kind: 'sp', callout: 'sp', label: '2 ✦✦✦✧✧' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 101, sp: 1, lvl: 20,
        party: [
          { id: 'danheng', lvl: 20, spd: 115, energy: 20 },
          { id: 'hook', lvl: 20, spd: 96, energy: 20 }
        ],
        enemies: [
          { id: 'frostspawn', lvl: 20, hp: 0.25, tough: 20, spd: 75, weak: ['fire', 'wind'] },
          { id: 'windspawn', lvl: 20, hp: 0.25, tough: 20, spd: 72, weak: ['fire', 'wind'] }
        ]
      },
      steps: [
        { u: 'danheng', cmd: 'basic', text: 'У отряда всего 1 <orange>очко навыков</orange>. Нажмите <orange>[Q]</orange> и <orange>[Пробел]</orange>, чтобы Дань Хэн провёл <orange>базовую атаку</orange> и восстановил 1 очко навыков.' },
        { u: 'hook', cmd: 'skill', text: 'Очки навыков общие для всех героев! Нажмите <orange>[E]</orange> и <orange>[Пробел]</orange>, чтобы Хук применила <orange>навык</orange> и поразила врага.' }
      ]
    },
    {
      id: 'tr_ult',
      group: 'basic',
      title: 'Энергия и сверхспособность',
      badge: 'Тактическая тренировка',
      summary: 'Когда <orange>энергия</orange> полностью заряжена, нажмите <orange>[1–4]</orange>, чтобы применить <orange>сверхспособность</orange> вне очереди.',
      art: { kind: 'ult', callout: 'ult', label: '[1] Сверхспособность' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 102, sp: 3, lvl: 20,
        party: [
          { id: 'trail', lvl: 20, spd: 112, energy: 100 },
          { id: 'march', lvl: 20, spd: 98, energy: 40 }
        ],
        enemies: [
          { id: 'reaver', lvl: 20, hp: 0.32, tough: 20, spd: 78, weak: ['phys', 'ice'] },
          { id: 'baryon', lvl: 20, hp: 0.25, tough: 20, spd: 74, weak: ['phys', 'ice'] }
        ]
      },
      steps: [
        { u: 'trail', cmd: 'skill', text: 'Шкала <orange>энергии</orange> Первопроходца почти полна. Примените <orange>навык [E]</orange> и <orange>[Пробел]</orange>, чтобы зарядить сверхспособность до максимума.' },
        { ult: 0, cmd: 'ult:0', text: 'Энергия заряжена! Нажмите клавишу <orange>[1]</orange>, чтобы немедленно обрушить <orange>сверхспособность</orange> Первопроходца вне очереди.' }
      ]
    },
    {
      id: 'tr_break',
      group: 'basic',
      title: 'Пробитие уязвимости',
      badge: 'Тактическая тренировка',
      summary: 'Атакуйте врага типом урона его <orange>уязвимости</orange>, чтобы истощить белую шкалу <orange>стойкости</orange> и вызвать <orange>Пробитие уязвимости</orange>.',
      art: { kind: 'break', callout: 'tough', label: 'Пробитие стойкости' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 103, sp: 3, lvl: 20,
        party: [
          { id: 'danheng', lvl: 20, spd: 114, energy: 40 },
          { id: 'asta', lvl: 20, spd: 106, energy: 40 }
        ],
        enemies: [
          { id: 'beetle', lvl: 20, hp: 0.42, tough: 30, spd: 75, weak: ['wind', 'fire'] }
        ]
      },
      steps: [
        { u: 'danheng', cmd: 'skill', text: 'Над Автоматоном-жуком видны значки <orange>ветряной и огненной уязвимости</orange>. Примените навык Дань Хэна <orange>[E]</orange>, чтобы сбить его стойкость.' },
        { u: 'asta', cmd: 'skill', text: 'Примените навык Асты <orange>[E]</orange>: её метеоры полностью истощат <orange>стойкость</orange>, вызовут <orange>Пробитие уязвимости</orange> и добьют цель!' }
      ]
    },
    {
      id: 'tr_brk_type',
      group: 'break',
      title: 'Урон пробития: Типы и стойкость',
      badge: 'Продвинутая тренировка',
      summary: 'Пробитие уязвимости с помощью <orange>физических и огненных</orange> атак повышает мгновенный <orange>урон пробития</orange>.',
      art: { kind: 'break_types', callout: 'elem', label: 'Урон пробития 728!' },
      reward: { jade: 30, items: { aether2: 4 }, credits: 1500 },
      setup: {
        seed: 201, sp: 3, lvl: 25,
        party: [
          { id: 'trail', lvl: 25, spd: 112, energy: 40 },
          { id: 'hook', lvl: 25, spd: 102, energy: 40 }
        ],
        enemies: [
          { id: 'frostspawn', lvl: 25, hp: 0.35, tough: 20, spd: 76, weak: ['phys', 'fire'] },
          { id: 'soldier', lvl: 25, hp: 0.35, tough: 20, spd: 74, weak: ['phys', 'fire'] }
        ]
      },
      steps: [
        { u: 'trail', cmd: 'skill', text: '<orange>Физическое</orange> и <orange>огненное</orange> пробитие обладают наибольшим базовым множителем. Примените навык Первопроходца <orange>[E]</orange>, чтобы пробить стойкость!' },
        { u: 'hook', cmd: 'skill', text: 'Теперь примените огненный навык Хук <orange>[E]</orange>, чтобы вызвать мощный взрыв <orange>огненного пробития</orange>.' }
      ]
    },
    {
      id: 'tr_brk_stat',
      group: 'break',
      title: 'Урон пробития: Эффект пробития',
      badge: 'Продвинутая тренировка',
      summary: 'Характеристика <orange>Эффект пробития</orange> и бонус <orange>эффективности пробития</orange> значительно усиливают урон при истощении стойкости.',
      art: { kind: 'break_hit', callout: 'broken', label: 'Эффект пробития +120%' },
      reward: { jade: 30, items: { aether2: 4 }, credits: 1500 },
      setup: {
        seed: 202, sp: 3, lvl: 25,
        party: [
          { id: 'ruanmei', lvl: 25, spd: 116, energy: 60 },
          { id: 'hook', lvl: 25, spd: 102, energy: 40, breakE: 1.2 }
        ],
        enemies: [
          { id: 'incinerator', lvl: 25, hp: 0.48, tough: 30, spd: 75, weak: ['fire', 'ice'] }
        ]
      },
      steps: [
        { u: 'ruanmei', cmd: 'skill', text: 'Примените навык Жуань Мэй <orange>[E]</orange> («Обертон»), чтобы повысить <orange>эффективность пробития уязвимости</orange> отряда на 50%.' },
        { u: 'hook', cmd: 'skill', text: 'У Хук высокий <orange>Эффект пробития</orange>. Примените её навык <orange>[E]</orange>, чтобы одним ударом снести всю стойкость и сокрушить врага!' }
      ]
    },
    {
      id: 'tr_brk_dot',
      group: 'break',
      title: 'Пробитие уязвимости: Периодический урон',
      badge: 'Продвинутая тренировка',
      summary: 'Пробитие уязвимости накладывает <orange>периодический урон</orange> (<orange>Шок</orange>, <orange>Выветривание</orange>, <orange>Горение</orange>), а умения Небытия детонируют его.',
      art: { kind: 'break_types', callout: 'elem', label: 'Шок + Выветривание' },
      reward: { jade: 30, items: { aether2: 4 }, credits: 1500 },
      setup: {
        seed: 203, sp: 4, lvl: 25,
        party: [
          { id: 'serval', lvl: 25, spd: 116, energy: 40 },
          { id: 'sampo', lvl: 25, spd: 108, energy: 40 },
          { id: 'kafka', lvl: 25, spd: 100, energy: 40 }
        ],
        enemies: [
          { id: 'beetle', lvl: 25, hp: 0.55, tough: 20, spd: 75, weak: ['elec', 'wind'] }
        ]
      },
      steps: [
        { u: 'serval', cmd: 'skill', text: 'Пробейте стойкость навыком Сервал <orange>[E]</orange>, чтобы наложить электрический периодический урон — <orange>Шок</orange>.' },
        { u: 'sampo', cmd: 'skill', text: 'Примените навык Сампо <orange>[E]</orange>, чтобы наложить стаки ветряного периодического урона — <orange>Выветривание</orange>.' },
        { u: 'kafka', cmd: 'skill', text: 'Примените навык Кафки <orange>[E]</orange>: он мгновенно вызывает срабатывание всех эффектов <orange>периодического урона</orange> на цели!' }
      ]
    },
    {
      id: 'tr_brk_cc',
      group: 'break',
      title: 'Пробитие уязвимости: Контроль',
      badge: 'Продвинутая тренировка',
      summary: '<orange>Ледяное</orange> и <orange>мнимое</orange> пробитие накладывают эффекты контроля (<orange>Заморозку</orange> и <orange>Заключение</orange>), задерживая ход противника.',
      art: { kind: 'break_cc', callout: 'cc', label: 'Заморозка и Заключение' },
      reward: { jade: 30, items: { aether2: 4 }, credits: 1500 },
      setup: {
        seed: 204, sp: 3, lvl: 25,
        party: [
          { id: 'welt', lvl: 25, spd: 112, energy: 120 },
          { id: 'herta', lvl: 25, spd: 104, energy: 60 }
        ],
        enemies: [
          { id: 'reaver', lvl: 25, hp: 0.42, tough: 20, spd: 82, weak: ['imag', 'ice'] }
        ]
      },
      steps: [
        { ult: 0, cmd: 'ult:0', text: 'Нажмите <orange>[1]</orange>, чтобы применить сверхспособность Вельта: <orange>мнимое пробитие</orange> и <orange>Заключение</orange> сильно задержат ход врага на шкале действий.' },
        { u: 'welt', cmd: 'skill', text: 'Противник скован <orange>Заключением</orange> и замедлен. Завершите бой навыком <orange>[E]</orange>!' }
      ]
    },
    {
      id: 'tr_brk_quant',
      group: 'break',
      title: 'Пробитие квантовой уязвимости: Связывание',
      badge: 'Продвинутая тренировка',
      summary: '<orange>Квантовое пробитие</orange> накладывает <orange>Связывание</orange>: атаки по связанной цели наращивают её итоговый урон.',
      art: { kind: 'break_cc', callout: 'cc', label: 'Связывание ×5' },
      reward: { jade: 30, items: { aether2: 4 }, credits: 1500 },
      setup: {
        seed: 205, sp: 4, lvl: 25,
        party: [
          { id: 'seele', lvl: 25, spd: 118, energy: 40 },
          { id: 'silverwolf', lvl: 25, spd: 108, energy: 40 }
        ],
        enemies: [
          { id: 'eliminator', lvl: 25, hp: 0.52, tough: 20, spd: 76, weak: ['quant'] }
        ]
      },
      steps: [
        { u: 'seele', cmd: 'skill', text: 'Пробейте квантовую уязвимость навыком Зеле <orange>[E]</orange>, чтобы задержать врага и наложить <orange>Связывание</orange>.' },
        { u: 'silverwolf', cmd: 'skill', text: 'Атакуйте связанную цель навыком Серебряного Волка <orange>[E]</orange>, чтобы накопить заряды <orange>Связывания</orange> и добить врага!' }
      ]
    },
    {
      id: 'tr_followup',
      group: 'special',
      title: 'Бонус-атаки',
      badge: 'Продвинутая тренировка',
      summary: 'Некоторые персонажи используют <orange>бонус-атаки</orange>, которые <orange>запускаются автоматически</orange> при выполнении определённых условий.',
      art: { kind: 'followup', callout: 'fua', label: 'Бонус-атака!' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 301, sp: 3, lvl: 25,
        party: [
          { id: 'march', lvl: 25, spd: 116, energy: 40 },
          { id: 'herta', lvl: 25, spd: 106, energy: 40 },
          { id: 'himeko', lvl: 25, spd: 98, energy: 40 }
        ],
        enemies: [
          { id: 'frostspawn', lvl: 25, hp: 0.35, tough: 20, spd: 90, weak: ['ice', 'fire'] },
          { id: 'flamespawn', lvl: 25, hp: 0.35, tough: 20, spd: 88, weak: ['ice', 'fire'] }
        ]
      },
      steps: [
        { u: 'march', cmd: 'skill', text: 'Примените навык Март 7 <orange>[E]</orange> и укройте союзника <orange>щитом</orange> (после атаки врага по щиту Март 7 отвечает контратакой).' },
        { u: 'herta', cmd: 'skill', text: 'Примените навык Герты <orange>[E]</orange>: когда HP врагов упадёт ниже 50%, автоматически запустится её <orange>бонус-атака</orange>!' }
      ]
    },
    {
      id: 'tr_advance',
      group: 'special',
      title: 'Смена порядка действий',
      badge: 'Продвинутая тренировка',
      summary: 'Умения с <orange>продвижением действия вперёд</orange> позволяют союзнику <orange>немедленно сделать ход</orange> на шкале порядка действий.',
      art: { kind: 'av_shift', callout: 'advance', label: 'Ход продвинут на 100%' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 302, sp: 3, lvl: 25,
        party: [
          { id: 'seele', lvl: 25, spd: 118, energy: 60 },
          { id: 'bronya', lvl: 25, spd: 112, energy: 60 }
        ],
        enemies: [
          { id: 'shadewalker', lvl: 25, hp: 0.45, tough: 30, spd: 76, weak: ['quant', 'wind'] }
        ]
      },
      steps: [
        { u: 'seele', cmd: 'basic', text: 'Сначала проведите базовую атаку Зеле <orange>[Q]</orange>, чтобы нанести урон и сберечь очки навыков.' },
        { u: 'bronya', cmd: 'skill', text: 'Примените навык Брони «Боевой приказ» <orange>[E]</orange> на Зеле: её ход <orange>продвинется вперёд на 100%</orange>!' },
        { u: 'seele', cmd: 'skill', text: 'Зеле снова ходит первой с усилением урона! Завершите бой её навыком <orange>[E]</orange>.' }
      ]
    },
    {
      id: 'tr_dispel',
      group: 'special',
      title: 'Снятие усилений',
      badge: 'Продвинутая тренировка',
      summary: 'Используйте умения со <orange>снятием усилений</orange>, чтобы лишать противников опасных бонусов к атаке и защите.',
      art: { kind: 'dispel', callout: 'buff', label: 'Усиление снято!' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 303, sp: 3, lvl: 25,
        party: [
          { id: 'pela', lvl: 25, spd: 116, energy: 60 },
          { id: 'danheng', lvl: 25, spd: 108, energy: 60 }
        ],
        enemies: [
          { id: 'soldier', lvl: 25, hp: 0.45, tough: 20, spd: 75, weak: ['ice', 'wind'], startBuff: { s: 'atkP', v: 0.5, turns: 3, name: 'Боевой строй' } }
        ]
      },
      steps: [
        { u: 'pela', cmd: 'skill', text: 'На противнике активно усиление «Боевой строй». Примените навык Пелы «Анализ цели» <orange>[E]</orange>, чтобы <orange>снять усиление</orange> с врага!' },
        { u: 'danheng', cmd: 'skill', text: 'Противник лишён усиления и пробит. Добейте его навыком Дань Хэна <orange>[E]</orange>!' }
      ]
    },
    {
      id: 'tr_cleanse',
      group: 'special',
      title: 'Снятие ослаблений',
      badge: 'Продвинутая тренировка',
      summary: 'Используйте умения со <orange>снятием ослаблений</orange>, чтобы очищать союзников от периодического урона, замедления и контроля.',
      art: { kind: 'cleanse', callout: 'debuff', label: 'Ослабление снято!' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 304, sp: 3, lvl: 25,
        party: [
          { id: 'aqua', lvl: 25, spd: 116, energy: 60 },
          { id: 'danheng', lvl: 25, spd: 106, energy: 60, hpPct: 0.65, startDebuff: { s: 'spdP', v: -0.25, turns: 2, name: 'Оковы пепла' } }
        ],
        enemies: [
          { id: 'incinerator', lvl: 25, hp: 0.38, tough: 20, spd: 72, weak: ['ice', 'wind'] }
        ]
      },
      steps: [
        { u: 'aqua', cmd: 'skill', targetAlly: 1, text: 'На Дань Хэне висит ослабление скорости! Примените навык Аквы «Исцеление» <orange>[E]</orange> на Дань Хэна, чтобы <orange>снять ослабление</orange> и вылечить его.' },
        { u: 'danheng', cmd: 'skill', text: 'Полноценный ход возвращён! Атакуйте врага навыком Дань Хэна <orange>[E]</orange>.' }
      ]
    },
    {
      id: 'tr_interrupt',
      group: 'special',
      title: 'Прерывание заряженной атаки противника',
      badge: 'Продвинутая тренировка',
      summary: 'Пробейте <orange>стойкость</orange> противника, пока он готовит мощный удар, чтобы <orange>прервать заряженную атаку</orange>.',
      art: { kind: 'interrupt', callout: 'charge', label: 'Зарядка прервана!' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 305, sp: 3, lvl: 25,
        party: [
          { id: 'danheng', lvl: 25, spd: 116, energy: 60 },
          { id: 'asta', lvl: 25, spd: 108, energy: 60 }
        ],
        enemies: [
          { id: 'cannoneer', lvl: 25, hp: 0.25, tough: 30, spd: 70, weak: ['wind', 'fire'], startCharge: 1 }
        ]
      },
      steps: [
        { u: 'danheng', cmd: 'skill', text: 'Канонир заряжает сокрушительный залп! Начните сбивать его <orange>стойкость</orange> навыком Дань Хэна <orange>[E]</orange>.' },
        { u: 'asta', cmd: 'skill', text: 'Пробейте оставшуюся стойкость навыком Асты <orange>[E]</orange>: <orange>заряженная атака врага прервана</orange>!' }
      ]
    },
    {
      id: 'tr_contact',
      group: 'special',
      title: 'Переговоры: Контакт с врагом',
      badge: 'Продвинутая тренировка',
      summary: 'Нажмите <orange>[T] Контакт</orange> в бою и подберите верный подход к врагу, чтобы завершить встречу мирно и получить подарок.',
      art: { kind: 'spec_contact', callout: 'contact', label: '[T] Контакт → Восторг' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 306, sp: 3, lvl: 25, contact: true,
        party: [
          { id: 'march', lvl: 25, spd: 114, energy: 40 },
          { id: 'asta', lvl: 25, spd: 104, energy: 40 }
        ],
        enemies: [
          { id: 'flamespawn', lvl: 25, hp: 0.4, tough: 20, spd: 70, startJoy: 1 }
        ]
      },
      steps: [
        { u: 'march', cmd: 'contact', text: 'Порождения Фрагментума обожают милоту! Нажмите <orange>[T] Контакт</orange> и выберите «Сделать селфи» Март 7, чтобы враг в восторге подарил награду и ушёл.' }
      ]
    },
    {
      id: 'tr_fusion',
      group: 'special',
      title: 'Слияние: совместные техники',
      badge: 'Продвинутая тренировка',
      summary: 'Когда у обоих героев пары Слияния заряжена <orange>энергия</orange>, нажмите <orange>[R] Слияние</orange> для совместного удара.',
      art: { kind: 'spec_fusion', callout: 'fusion', label: '[R] Поезд отправляется!' },
      reward: { jade: 30, items: { exp2: 5 }, credits: 1500 },
      setup: {
        seed: 307, sp: 3, lvl: 25,
        party: [
          { id: 'march', lvl: 25, spd: 114, energy: 120 },
          { id: 'danheng', lvl: 25, spd: 108, energy: 100 }
        ],
        enemies: [
          { id: 'frostspawn', lvl: 25, hp: 0.25, tough: 20, spd: 72, weak: ['ice', 'wind'] },
          { id: 'windspawn', lvl: 25, hp: 0.25, tough: 20, spd: 70, weak: ['ice', 'wind'] }
        ]
      },
      steps: [
        { cmd: 'fusion', text: 'У Март 7 и Дань Хэна полная энергия! Нажмите <orange>[R] Слияние</orange> и подтвердите приём «Поезд отправляется!» клавишей <orange>[Пробел]</orange>.' }
      ]
    }
  ];

  Object.assign(H, { TUTORIAL_CATS, TUTORIAL_ENTRIES, TRAINING_GROUPS, TRAINING_TRIALS });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
