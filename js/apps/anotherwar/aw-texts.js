(function (AW) {
  'use strict';

  AW.TEXT_OVERRIDE = Object.assign(AW.TEXT_OVERRIDE || {}, {
    drinkGulp: 'Буль!'
  });

  AW.ITEM_TEXT = Object.assign(AW.ITEM_TEXT || {}, {
    'cItem/mapa': { name: 'Карта', desc: 'Это потрепанная карта!', gender: 'F' },
    'cWeapon/Kufel': { name: 'Кружка', desc: 'Вместительная!', gender: 'F' },
    'cWeapon/pszczola': { name: 'Пчела', desc: 'Злющая какая!', gender: 'F' },
    'cWeapon/rojfuhrer': { name: 'Ройфюрер', desc: 'Смотрит недобро...', gender: 'M' }
  });

  AW.AREA_TEXT = Object.assign(AW.AREA_TEXT || {}, {
    A02_CafeRene: { aKubel: { desc: 'Ведро.', force: true } }
  });

  AW.areaText = function (level, area, field, fallback) {
    const L = AW.AREA_TEXT[level];
    const a = L && L[area.id];
    if (a && a[field] !== undefined && (a.force || !(field === 'desc' && area.voice))) return a[field];
    return fallback;
  };
})(globalThis.AW = globalThis.AW || {});
