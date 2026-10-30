(function (H) {
  'use strict';
  H.ART_SLOTS = [['head', 'Голова'], ['neck', 'Шея'], ['shoulders', 'Плечи'], ['body', 'Тело'], ['right', 'Правая рука'], ['left', 'Левая рука'], ['ring1', 'Кольцо'], ['ring2', 'Кольцо'], ['legs', 'Ноги'], ['charm', 'Оберег']];
  H.ART_RANKS = { plain: ['простой', '#c8c0a8'], rare: ['редкий', '#70a8f0'], relic: ['реликвия', '#f0b040'] };

  const row = (id, name, slot, rank, fx, about) => ({ id, name, slot, rank, fx, about });
  H.ARTIFACTS = Object.fromEntries([
    row('militiahelm', 'Шлем ополченца', 'head', 'plain', { def: 1 }, '+1 Стойкость'),
    row('wormwood', 'Венок из полыни', 'head', 'plain', { wis: 1 }, '+1 Мудрость'),
    row('bookchain', 'Цепь книжника', 'neck', 'plain', { wis: 1 }, '+1 Мудрость'),
    row('steppebeads', 'Бусы степнячки', 'neck', 'plain', { power: 1 }, '+1 Чары'),
    row('ancestorhorn', 'Рог предков', 'neck', 'relic', { enemyReady: 20 }, 'Враги начинают бой с −20 готовности'),
    row('scoutcloak', 'Плащ дозорного', 'shoulders', 'plain', { sight: 1 }, 'Обзор +1'),
    row('roadcloak', 'Дорожный плащ', 'shoulders', 'plain', { steps: 1 }, '+1 шаг в день'),
    row('quiverbelt', 'Арбалетная перевязь', 'shoulders', 'rare', { shots: 1 }, 'Стрелки +1 выстрел'),
    row('quilted', 'Стёганка', 'body', 'plain', { def: 1 }, '+1 Стойкость'),
    row('bellcuirass', 'Кираса Звонграда', 'body', 'rare', { def: 3 }, '+3 Стойкости'),
    row('eldersword', 'Меч старшины', 'right', 'plain', { atk: 1 }, '+1 Натиск'),
    row('khanaxe', 'Секира степного хана', 'right', 'rare', { atk: 3 }, '+3 Натиска'),
    row('guildshield', 'Щит цеха', 'left', 'plain', { def: 1 }, '+1 Стойкость'),
    row('saltstaff', 'Посох белой соли', 'left', 'rare', { power: 3 }, '+3 Чар'),
    row('riverbanner', 'Знамя Семи Рек', 'left', 'relic', { init: 1 }, 'Все свои +1 Инициатива'),
    row('saltring', 'Кольцо соли', 'ring', 'plain', { mana: 5 }, 'Запас маны +5'),
    row('millerring', 'Кольцо мельника', 'ring', 'plain', { luck: 1 }, 'Удача +1'),
    row('couriers', 'Сапоги гонца', 'legs', 'plain', { steps: 2 }, '+2 шага в день'),
    row('saltcharm', 'Соляной оберег', 'charm', 'plain', { morale: 1 }, 'Мораль +1'),
    row('luckbone', 'Кость удачи', 'charm', 'plain', { luck: 1 }, 'Удача +1')
  ].map(a => [a.id, a]));
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
