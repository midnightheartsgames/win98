(function (N) {
  'use strict';

  N.CHARS = {
    tyoma: { name: 'Тёма', col: '#8ad0ff', voice: { g: 'm', pitch: 0.82, rate: 0.95, nat: true } },
    kesha: { name: 'Кеша', col: '#ffd060', voice: { g: 'm', pitch: 1.2, rate: 1.12 }, look: { male: true, skin: '#e8c8a8', hair: '#6a5a4a', hairStyle: 'bald', top: '#5a5e66', pants: '#4a4e56', shoes: '#1a1a1a', topKind: 'suit', hat: 'none', glasses: true, fat: 1.12, tall: 0.96, face: 14 } },
    colonel: { name: 'Полковник', col: '#a0e080', voice: { g: 'm', pitch: 0.7, rate: 0.9 }, look: { male: true, skin: '#d8a888', hair: '#9a9a94', hairStyle: 'short', top: '#e8e8f0', pants: '#3a4230', shoes: '#1a1a1a', topKind: 'vest', stripesH: true, hat: 'furazhka', fat: 1.1, tall: 1.04, old: true, face: 5 } },
    lyova: { name: 'Лёва', col: '#ff80c0', voice: { g: 'm', pitch: 1.04, rate: 1.06 }, look: { male: true, skin: '#e8c0a0', hair: '#1a1410', hairStyle: 'short', top: '#b0164e', pants: '#141414', shoes: '#0c0c0c', topKind: 'suit', hat: 'none', chain: true, fat: 1.14, tall: 1.0, face: 10 } },
    larisa: { name: 'Лариса', col: '#ffa060', voice: { g: 'f', pitch: 1.12, rate: 1.08, nat: true }, look: { male: false, skin: '#f0d0b0', hair: '#c83a20', hairStyle: 'bob', top: '#e0409a', pants: '#1a1a1a', shoes: '#1a1a1a', topKind: 'top', skirt: true, hat: 'none', fat: 1.08, tall: 0.98, face: 12 } },
    hromoy: { name: 'Хромой', col: '#ff6060', kind: 'bandit', voice: { g: 'm', pitch: 0.74, rate: 0.98 }, look: { male: true, skin: '#e0b894', hair: '#1a1410', hairStyle: 'bald', top: '#1a1410', pants: '#16307a', shoes: '#e8e8e8', topKind: 'jacket', leather: true, hat: 'none', chain: true, fat: 1.16, tall: 1.03, face: 13 } },
    borzyh: { name: 'Борзых', col: '#c8c0a0', voice: { g: 'm', pitch: 0.88, rate: 0.92 }, look: { male: true, skin: '#e8c4a0', hair: '#8a8a84', hairStyle: 'short', top: '#2a2e3a', pants: '#2a2e3a', shoes: '#0c0c0c', topKind: 'suit', hat: 'none', glasses: true, fat: 1.2, old: true, face: 4 } },
    sonny: { name: 'Сонный', col: '#c0a0ff', voice: { g: 'm', pitch: 0.64, rate: 0.82 } },
    gena: { name: 'Гена', col: '#d0d0d0', kind: 'bandit', voice: { g: 'm', pitch: 1.06, rate: 1.1 }, look: { male: true, skin: '#dcb08a', hair: '#2a1e14', hairStyle: 'short', top: '#e8e8e2', pants: '#1a1a1a', shoes: '#1a1a1a', topKind: 'jacket', hat: 'cap', fat: 1.0, face: 11 } },
    vadik: { name: 'Вадик', col: '#b0b8c8', kind: 'bandit', voice: { g: 'm', pitch: 0.8, rate: 0.96 }, look: { male: true, skin: '#e4bc98', hair: '#3a2a1a', hairStyle: 'bald', top: '#141416', pants: '#141416', shoes: '#0a0a0a', topKind: 'suit', hat: 'none', fat: 1.28, tall: 1.08, face: 9 } },
    driver: { name: 'Водитель', col: '#c8c8c8', kind: 'worker', voice: { g: 'm', pitch: 0.95, rate: 1.0 } },
    boss: { name: 'Главный', col: '#e09a60', kind: 'zarechny', voice: { g: 'm', pitch: 1.05, rate: 1.12 } },
    soldier: { name: 'Боец', col: '#a8c890', kind: 'soldier', voice: { g: 'm', pitch: 0.92, rate: 1.04 } },
    dj: { name: 'Диджей', voice: { g: 'm', pitch: 1.12, rate: 1.16 } }
  };

  N.VOICES = {
    'Диктор': { g: 'f', pitch: 1.02, rate: 0.94 },
    'Дежурная': { g: 'f', pitch: 1.18, rate: 1.1 },
    'Гопник': { g: 'm', pitch: 1.1, rate: 1.15 },
    'Охранник': { g: 'm', pitch: 0.9, rate: 1.0 },
    'Бандит': { g: 'm', pitch: 0.86, rate: 1.06 }
  };

  N.PAGER = {
    afterM1: 'КЕША: Тёма, отоспись. Утром зайди в контору. Ленина, «Фемида».',
    afterM2: 'ЛАРИСА: Тёма, полковник ждёт. Дебаркадер «Отставник», Ока за Южным шоссе. Целую, Л.',
    afterM2b: 'КЕША: Нашёл, кто с ГАЗа продал сделку. Зайди.',
    afterM3: 'ПОЛКОВНИК: Верещагин, есть работа для стрелка. Дебаркадер.',
    afterM4: 'ЛЁВА: Тимофей! Узнал, что ты вышел. «Мираж», Янки Купалы. Жду. Л.',
    afterM5: 'ЛЁВА: Хромой зашевелился. Заезжай.',
    afterM6: 'ПОЛКОВНИК: Нашлись твои «Волги». Срочно на дебаркадер.',
    afterM6b: 'ЛАРИСА: Слышала про парк. Жив? Позвони. Л.',
    afterM7: 'ЛЁВА: Последнее дело, Тимофей. Жду.',
    finale: 'КЕША: Тёма, срочно в контору. Всё решится сегодня ночью.',
    ending: 'СОННЫЙ: Тёма, еду в Нижний. Готовь деньги. С.',
    taxi: 'ТАКСОПАРК: Хороший водитель! Премия и «шашечки» — ваши такси теперь быстрее.',
    police: 'ОВД: Благодарность от начальника ОВД. Бронежилеты в гостинице усилены.'
  };

  N.FORECAST = {
    clear: ['Гидрометцентр: над Нижним ясно, без осадков. Плюс двадцать шесть.', 'Синоптики обещают солнце до вечера. Квас у проходной не забудьте.'],
    cloudy: ['Затянуло. Осадков не обещают, но зонтик возьмите.', 'Пасмурно, ветер северо-западный. Обычный нижегородский июль.'],
    rain: ['Над Окой гроза. Водители, дорога мокрая — тормозной путь длиннее, не гоните.', 'Ливень до вечера. На Мызинском мосту скользко, держите дистанцию.'],
    fog: ['Туман над Окой, видимость сто метров. ГИБДД просит включить фары.', 'Туман в Автозаводском районе. Постовые тоже ничего не видят.']
  };

  N.HELP = {
    drive: 'W/S — газ и тормоз, A/D — руль, Пробел — ручник. F — выйти из машины.',
    radar: 'Цель отмечена на радаре розовой меткой.',
    save: 'Зайди в розовый маркер у двери гостиницы, чтобы сохранить игру.',
    foot: 'Мышь — обзор, левая кнопка — удар, правая — прицел. Q/E — смена оружия.',
    aim: 'Правая кнопка — прицел, левая — выстрел. В прицеле Тёма стреляет точнее. R — перезарядка.',
    melee: 'Левая кнопка — удар. Кастет бьёт сильнее кулака. Упавшего добивать не обязательно.',
    chase: 'Shift — бег. Догони и сбей с ног.',
    wanted: 'Мигалки вверху — уровень розыска. Скройся от милиции или перекрась машину в «Жестянщике».',
    shop: 'Магазин «Охотник» продаёт оружие. Заходи в маркер у двери.',
    taxi: 'В любом такси нажми T, чтобы подрабатывать извозом.',
    police: 'В милицейской машине нажми T — будешь ловить преступников.',
    sniper: 'Правая кнопка — прицел СВД. Колесо мыши — кратность.',
    grenade: 'Зажми левую кнопку и отпусти, чтобы бросить гранату. Чем дольше держишь, тем дальше летит. G — бросить сразу.',
    driveby: 'В машине Q или E — посмотреть вбок, левая кнопка — стрелять из окна.',
    tail: 'Держись позади, но не вплотную: слишком близко — заметят, слишком далеко — потеряешь.',
    cargo: 'В фургоне гранаты. Каждый удар — минус груз. Объезжай ямы и бордюры.',
    water: 'Тёма не умеет плавать. По колено — можно, по грудь — уже тонет. Не лезь на глубину.',
    drown: 'Тёма тонет! Скорее к берегу — на мелководье ещё можно встать на ноги.'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
