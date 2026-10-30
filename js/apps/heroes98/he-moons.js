(function (H) {
  'use strict';
  const MOONS = [
    { id: 'white', icon: 1, name: 'Белая', full: 'Белая луна', of: 'Белой луны', color: '#f0f0e0', school: 'yasna', people: ['throne'], about: 'Лечение заклинаниями +25 %, заклинания Ясны дешевле на 1 ману' },
    { id: 'red', icon: 2, name: 'Алая', full: 'Алая луна', of: 'Алой луны', color: '#d84a2a', school: 'zhar', people: ['forge'], about: 'Урон заклинаний Жари +20 %' },
    { id: 'azure', icon: 3, name: 'Лазурная', full: 'Лазурная луна', of: 'Лазурной луны', color: '#3a8ad0', school: 'glub', people: ['tide'], about: 'Вода стоит для Прилива как дорога, заклинания Глуби держатся на раунд дольше' },
    { id: 'green', icon: 4, name: 'Зелёная', full: 'Зелёная луна', of: 'Зелёной луны', color: '#4aa83a', school: 'rostan', people: ['thicket'], about: 'Прирост всех существ +10 %' },
    { id: 'silver', icon: 5, name: 'Серебряная', full: 'Серебряная луна', of: 'Серебряной луны', color: '#b8c8e0', school: 'morok', people: ['stars'], about: 'Обзор всех героев −2, заклинания Морока дешевле на 1 ману' },
    { id: 'gold', icon: 6, name: 'Золотая', full: 'Золотая луна', of: 'Золотой луны', color: '#e8c040', school: 'mera', people: ['league'], about: 'Доход городов +10 %, курс рынка лучше на шаг' },
    { id: 'black', icon: 7, name: 'Чёрная', full: 'Чёрная луна', of: 'Чёрной луны', color: '#3a3648', school: 'tlen', people: ['barrows'], about: 'Прирост существ в городах −10 %, нейтральные отряды растут вдвое' },
    { id: 'convergence', icon: 8, name: 'Схождение', full: 'Схождение', of: 'Схождения', color: '#c090e0', school: null, people: ['spore', 'throne'], about: 'Все герои колдуют на ступень выше, все лунные врата открыты, нейтралы +25 %' }
  ];
  const byId = Object.fromEntries(MOONS.map(m => [m.id, m]));

  const roll = S => {
    const seven = MOONS.slice(0, 7).map(m => m.id);
    for (let i = seven.length - 1; i > 0; i--) {
      const j = Math.floor(H.roll(S) * (i + 1));
      [seven[i], seven[j]] = [seven[j], seven[i]];
    }
    return [...seven, 'convergence'];
  };

  const weekOf = S => Math.floor((S.day - 1) / 7);
  const at = (S, week) => (S.moons ? byId[S.moons[week % S.moons.length]] : null);
  const current = S => at(S, weekOf(S));
  const is = (S, id) => {
    const m = current(S);
    return !!m && m.id === id;
  };
  const circle = S => Math.floor(weekOf(S) / 8) + 1;
  const ahead = (S, n) => Array.from({ length: n }, (_, i) => at(S, weekOf(S) + i)).filter(Boolean);
  const dateText = S => {
    const m = current(S), day = (S.day - 1) % 7 + 1;
    return m ? 'Круг ' + circle(S) + ', неделя ' + m.of + ', день ' + day : 'Неделя ' + (weekOf(S) + 1) + ', день ' + day;
  };
  const growthPct = S => (is(S, 'green') ? 10 : is(S, 'black') ? -10 : 0);
  const neutralRate = S => (is(S, 'convergence') ? 0.25 : is(S, 'black') ? H.MAP.growth * 2 : H.MAP.growth);
  const goldMul = S => (is(S, 'gold') ? 1.1 : 1);
  const marketStep = S => (is(S, 'gold') ? 1 : 0);
  const sightPlus = S => (is(S, 'silver') ? -2 : 0);
  const battle = S => {
    const m = current(S);
    return m ? { id: m.id, people: m.people } : null;
  };

  H.MOONS = MOONS;
  H.Moons = { MOONS, byId, roll, weekOf, at, current, is, circle, ahead, dateText, growthPct, neutralRate, goldMul, marketStep, sightPlus, battle };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
