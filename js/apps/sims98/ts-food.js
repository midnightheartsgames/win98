(function (S) {
  'use strict';
  const QUALITY = ['Несъедобно', 'Плохо', 'Сносно', 'Нормально', 'Хорошо', 'Очень хорошо', 'Отлично', 'Превосходно', 'Совершенство'];
  const TOP_Q = QUALITY.length - 1, GREAT_Q = 7, FINE_Q = 6, PERFECT_Q = 8;
  const COOK_WITH_FOOD = 0.25, COOK_BUSY = 0.05, SPOILED_PULL = 0.05, LEFT_AFTER = 120, SPOIL_AFTER = 2880, THROW_AFTER = 4320, BREAKFAST = [300, 660], STUFFED = 85;
  const FIRE_BY_LEVEL = [0.06, 0.04, 0.025, 0.015, 0.008, 0.003], FIRE_LEFT = 90, FIRE_SPREAD_EVERY = 10, FIRE_SPREAD_RANGE = 2, FIRE_SPREAD = 0.15, COOL_AFTER = 30, BEAT = 0.4, BURN_NEAR = 1.3, BURN_AFTER = 3;
  const NO_BURN = new Set(['toilet', 'shower', 'bathtub', 'bath_sink', 'kitchen_sink', 'mailbox', 'bush']);

  const ROWS = [
    ['oatmeal', 'Овсяная каша', 0, 'breakfast', false, 15, 55],
    ['fried_eggs', 'Яичница', 0, 'breakfast', false, 10, 50],
    ['syrniki', 'Сырники', 2, 'breakfast', false, 20, 60],
    ['pancakes', 'Блины', 3, 'breakfast', false, 25, 62],
    ['cheese_omelet', 'Омлет с сыром', 5, 'breakfast', false, 15, 60],
    ['pasta_navy', 'Макароны по-флотски', 0, 'meal', true, 25, 72],
    ['buckwheat', 'Гречка с грибами', 0, 'meal', false, 25, 68],
    ['fried_potato', 'Жареная картошка', 1, 'meal', false, 25, 70],
    ['sausage_mash', 'Сосиски с пюре', 1, 'meal', true, 20, 70],
    ['garden_salad', 'Салат «Огород»', 2, 'meal', false, 15, 50],
    ['cutlets', 'Котлеты с гарниром', 2, 'meal', true, 30, 78],
    ['borscht', 'Борщ', 3, 'meal', true, 40, 80],
    ['veg_stew', 'Овощное рагу', 3, 'meal', false, 35, 74],
    ['pilaf', 'Плов', 4, 'meal', true, 45, 85],
    ['dumplings', 'Пельмени', 4, 'meal', true, 30, 80],
    ['baked_fish', 'Рыба с лимоном', 5, 'meal', true, 40, 78],
    ['lasagna', 'Лазанья', 5, 'meal', true, 50, 85],
    ['cabbage_rolls', 'Голубцы', 6, 'meal', true, 50, 82],
    ['mushroom_soup', 'Грибной суп', 6, 'meal', false, 35, 72],
    ['risotto', 'Ризотто с тыквой', 7, 'meal', false, 45, 80],
    ['duck_apples', 'Утка с яблоками', 8, 'meal', true, 70, 90],
    ['beef_stroganoff', 'Мясо по-купечески', 8, 'meal', true, 50, 88],
    ['stuffed_peppers', 'Фаршированный перец', 9, 'meal', false, 50, 82],
    ['charlotte', 'Шарлотка', 3, 'dessert', false, 45, 35],
    ['cottage_bake', 'Творожная запеканка', 5, 'dessert', false, 40, 40],
    ['napoleon', 'Торт «Наполеон»', 9, 'dessert', false, 80, 45],
    ['coffee', 'Кофе', 0, 'drink', false, 5, 5],
    ['tea', 'Чай с вареньем', 0, 'drink', false, 5, 5]
  ];
  const KIND_NAMES = { breakfast: 'завтрак', meal: 'обед', dessert: 'десерт', drink: 'напиток' };

  S.RECIPES = {};
  ROWS.forEach(([id, name, level, kind, meat, mins, hunger], order) => { S.RECIPES[id] = { id, name, level, kind, meat, mins, hunger, order }; });
  Object.defineProperty(S.RECIPES, 'pizza', { value: { id: 'pizza', name: 'Пицца', level: 11, kind: 'delivery', meat: true, mins: 0, hunger: 70, order: ROWS.length }, enumerable: false });
  const SIGNATURE_LEVEL = 6, SIGNATURE_Q = 2;
  S.FOOD_QUALITY = QUALITY;

  const MEAL_STEP = { seat: 'chair', clip: 'eat', standClip: 'eatStand', mins: 20, gain: { hunger: 72, fun: 3 }, food: true };

  S.ADS.cook_meal = {
    id: 'cook_meal', obj: 'stove', name: 'Приготовить', icon: 'cook', age: 'teen', below: { hunger: 55 }, cook: true, wants: { hunger: 72 },
    steps: [{ obj: 'fridge', pose: 'front', clip: 'use', mins: 3, sound: 'fridge' }, { pose: 'front', clip: 'cook', mins: 22, loop: 'sizzle', gain: { fun: 3 }, cook: true }]
  };
  S.ADS.eat_meal = {
    id: 'eat_meal', obj: 'counter', name: 'Взять порцию', icon: 'eat', age: 'toddler', below: { hunger: 70 }, when: 'serving',
    steps: [{ pose: 'front', clip: 'use', mins: 1, take: 'meal' }, MEAL_STEP]
  };
  S.ADS.eat_leftovers = {
    id: 'eat_leftovers', obj: 'fridge', name: 'Разогреть остатки', icon: 'eat', age: 'child', below: { hunger: 65 }, when: 'leftovers',
    steps: [{ pose: 'front', clip: 'use', mins: 3, sound: 'fridge', take: 'fridge' }, MEAL_STEP]
  };
  for (const [id, book] of Object.entries(S.SKILL_BOOKS)) {
    S.ADS[id] = {
      id, obj: 'bookshelf', name: book.name, icon: 'book', age: S.SKILLS[book.skill].age, below: { fun: 90 }, book: true,
      steps: [{ pose: 'front', clip: 'use', mins: 2 }, { seat: 'any', clip: 'read', standClip: 'readStand', mins: S.Skills.BOOK_MINS, gain: { fun: 12 } }]
    };
  }
  S.ADS.mirror_speech = { id: 'mirror_speech', obj: 'bath_sink', name: 'Порепетировать речь у зеркала', icon: 'talk', age: 'teen', below: { fun: 80 }, steps: [{ pose: 'front', clip: 'talk', mins: 30, gain: { fun: 6, social: 6 } }] };
  S.ADS.tv_workout = { id: 'tv_workout', obj: 'tv', name: 'Заниматься под телевизор', icon: 'punch', mood: 'workedOut', age: 'teen', below: { fun: 75 }, steps: [{ pose: 'near', clip: 'exercise', mins: 30, loop: 'tv', gain: { fun: 18, hygiene: -10, energy: -8 } }] };
  S.ADS.extinguish = { id: 'extinguish', name: 'Потушить', icon: 'fire', age: 'teen', player: true, when: 'burning', steps: [{ pose: 'near', clip: 'shove', mins: 4, beat: true }] };
  S.ADS.clean_soot = { id: 'clean_soot', name: 'Отчистить от копоти', icon: 'wash', age: 'teen', player: true, when: 'burnt', steps: [{ pose: 'near', clip: 'wash', mins: 30, gain: { hygiene: -12 }, clean: true }] };
  for (const id of ['cook_meal', 'eat_meal', 'eat_leftovers', 'mirror_speech', 'tv_workout', 'extinguish', 'clean_soot', ...Object.keys(S.SKILL_BOOKS)]) S.ADS[id].id = id;

  const kitchen = lot => lot.kitchen || (lot.kitchen = { meals: [], fridge: [], fires: [], last: null });

  const now = world => world.day * 1440 + world.clock;
  const keepsFor = lot => (lot && S.Art && S.Art.freezer(lot) ? 2 : 1);
  const spoiled = (world, meal, lot) => now(world) - meal.made >= SPOIL_AFTER * keepsFor(lot);
  const OWN = { baked_fish: 'fish', garden_salad: 'produce', veg_stew: 'produce', borscht: 'produce', charlotte: 'produce', stuffed_peppers: 'produce', risotto: 'produce', fried_potato: 'produce' };

  const modelOf = item => {
    const kind = S.KINDS[S.KIND_ID[item.kind]];
    return kind ? kind.model : null;
  };

  const nearestOf = (lot, model, x, z, floor) => {
    let best = null, bestD = Infinity;
    for (const item of lot.house.items) {
      if (modelOf(item) !== model || item.burnt || (floor !== undefined && item.floor !== floor)) continue;
      const d = Math.hypot(lot.x + item.x - x, lot.z + item.z - z);
      if (d < bestD) {
        bestD = d;
        best = item;
      }
    }
    return best;
  };

  const fireOn = (lot, item) => (lot.kitchen ? lot.kitchen.fires.find(f => f.item === lot.house.items.indexOf(item)) : null);

  const mood = (world, sim, id) => {
    if (sim.moods && id && S.MOODLETS[id]) S.Moods.add(sim, id, 0, world);
  };

  S.Food = {
    QUALITY, TOP_Q, GREAT_Q, PERFECT_Q, FIRE_BY_LEVEL, LEFT_AFTER, SPOIL_AFTER, KIND_NAMES, kitchen, now,

    knows(sim, id) {
      const recipe = S.RECIPES[id];
      return !!recipe && S.AGE_RANK[sim.age] >= S.AGE_RANK.teen && S.Skills.level(sim, 'cooking') >= recipe.level;
    },

    known(sim) {
      return Object.values(S.RECIPES).filter(r => S.Food.knows(sim, r.id));
    },

    learnRecipes(world, sim) {
      if (!sim.skill) return;
      const before = sim.skill.stats.recipesKnown || 0, known = S.Food.known(sim), fresh = known.filter(r => r.level === S.Skills.level(sim, 'cooking'));
      S.Skills.setStat(world, sim, 'recipesKnown', known.length);
      if (known.length > before && fresh.length) {
        world.events.push({ type: 'skill', sim: sim.id, name: sim.name, skill: 'cooking', text: sim.name + ', новые рецепты: ' + fresh.map(r => r.name).join(', ') });
        if (sim.wish && fresh.some(r => !r.meat)) S.Wishes.bump(sim, 'vegRecipe');
      }
    },

    timeOk(world, recipe) {
      return recipe.kind !== 'breakfast' || (world.clock >= BREAKFAST[0] && world.clock < BREAKFAST[1]);
    },

    why(world, sim, recipe) {
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.teen) return 'Готовят с подросткового возраста';
      if (!S.Food.knows(sim, recipe.id)) return 'Нужна готовка ' + recipe.level;
      if (!S.Food.timeOk(world, recipe)) return 'Завтрак готовят с 5 до 11 утра';
      if (recipe.meat && S.Traits.has(sim, 'vegetarian')) return S.Traits.name('vegetarian', sim.sex) + ' не готовит мясо';
      return null;
    },

    menu(world, sim, lot, item) {
      const signature = sim.job && sim.job.id === 'culinary' && sim.job.level >= SIGNATURE_LEVEL;
      const options = Object.values(S.RECIPES).map(recipe => ({ label: recipe.name, ad: 'cook_meal', lot, item, recipe: recipe.id, signature: signature && recipe.kind !== 'drink' ? true : undefined, closed: S.Food.why(world, sim, recipe), tip: { title: recipe.name, text: KIND_NAMES[recipe.kind][0].toUpperCase() + KIND_NAMES[recipe.kind].slice(1) + (recipe.meat ? ', с мясом' : ', без мяса') + ', ' + recipe.mins + ' мин.', line: recipe.kind === 'drink' ? '' : 'На всех, кто дома' } }));
      const open = options.filter(o => !o.closed), shut = options.filter(o => o.closed && S.Food.knows(sim, o.recipe)), next = options.filter(o => o.closed && !S.Food.knows(sim, o.recipe)).slice(0, 2);
      return { label: 'Приготовить…', section: open.concat(shut, next) };
    },

    pick(world, sim) {
      const list = Object.values(S.RECIPES).filter(r => r.kind !== 'drink' && !S.Food.why(world, sim, r));
      if (!list.length) return 'oatmeal';
      list.sort((a, b) => b.level - a.level || a.order - b.order);
      const top = list.slice(0, 3);
      return top[Math.floor(S.roll(world.rng) * top.length)].id;
    },

    factor(world, lot, ad) {
      if (!lot || (ad.id !== 'cook_meal' && ad.id !== 'eat_leftovers')) return 1;
      if (ad.id === 'cook_meal' && world.family.some(s => s.act && s.act.ad === 'cook_meal' && s.act.lot === lot.index)) return COOK_BUSY;
      if (!lot.kitchen) return 1;
      const k = lot.kitchen, fresh = k.fridge.some(m => m.left > 0 && !spoiled(world, m, lot));
      if (ad.id === 'eat_leftovers') return fresh ? 1 : SPOILED_PULL;
      return fresh || k.meals.some(m => m.left > 0) ? COOK_WITH_FOOD : 1;
    },

    fireChance(sim) {
      if (S.Skills.has(sim, 'allRecipes')) return 0;
      const level = S.Skills.level(sim, 'cooking');
      let p = FIRE_BY_LEVEL[Math.min(level, FIRE_BY_LEVEL.length - 1)];
      if (S.Traits.has(sim, 'naturalCook')) p *= 0.25;
      if (S.Traits.has(sim, 'clumsy')) p *= 1.5;
      if (S.Traits.has(sim, 'unlucky')) p *= 1.5;
      return p;
    },

    quality(world, sim, recipe) {
      const level = S.Skills.level(sim, 'cooking'), cooked = sim.skill ? sim.skill.stats.cooked[recipe.id] || 0 : 0;
      let base = 1.5 + level * 0.6 + Math.min(1.5, cooked / 6) - Math.max(0, recipe.level - level) * 0.5;
      if (S.Traits.has(sim, 'naturalCook')) base += 1.2;
      if (S.Traits.has(sim, 'perfectionist')) base += 0.5;
      if (S.Skills.has(sim, 'chef')) base += 0.5;
      if (S.Skills.has(sim, 'hundredPerfect')) base += 0.5;
      return Math.max(0, Math.min(TOP_Q, Math.round(base + S.roll(world.rng) * 3 - 1.5)));
    },

    startCooking(world, sim, act, lot, item) {
      if (!act.recipe || !S.RECIPES[act.recipe]) act.recipe = S.Food.pick(world, sim);
      const servings = world.family.filter(s => s.lot === lot && s.needs && !s.inside).length || 1;
      if (!S.Econ.payGroceries(world, sim, S.RECIPES[act.recipe], servings)) return 'Пустой холодильник: на продукты нет денег';
      if (!S.Art.fireproof(item) && S.roll(world.rng) < S.Food.fireChance(sim)) {
        S.Food.ignite(world, lot, item, sim);
        return 'Загорелось!';
      }
      return true;
    },

    cooked(world, sim, act) {
      const recipe = S.RECIPES[act.recipe], lot = world.lots[act.lot];
      if (!recipe || !lot) return;
      const q = Math.min(TOP_Q, S.Food.quality(world, sim, recipe) + (act.signature ? SIGNATURE_Q : 0)), skill = sim.skill;
      if (skill) {
        const first = !skill.stats.cooked[recipe.id];
        skill.stats.cooked[recipe.id] = (skill.stats.cooked[recipe.id] || 0) + 1;
        S.Skills.stat(world, sim, 'meals', 1);
        if (q >= GREAT_Q) S.Skills.stat(world, sim, 'great', 1);
        if (q === PERFECT_Q) S.Skills.stat(world, sim, 'perfect', 1);
        if (q >= FINE_Q && sim.wish) S.Wishes.bump(sim, 'fineDish');
        if (first && sim.wish) S.Wishes.bump(sim, 'newDish');
        if (q <= 2 && sim.wish) S.Wishes.bump(sim, 'weirdDish');
      }
      world.events.push({ type: 'meal', sim: sim.id, name: sim.name, text: sim.name + ': «' + recipe.name + '», ' + QUALITY[q].toLowerCase(), quality: q });
      if (recipe.kind === 'drink') {
        mood(world, sim, recipe.id === 'coffee' ? 'coffee' : 'tea');
        if (recipe.id === 'coffee') sim.needs.energy = Math.min(100, sim.needs.energy + 20);
        else sim.needs.fun = Math.min(100, sim.needs.fun + 10);
        return;
      }
      const k = kitchen(lot), home = world.family.filter(s => s.lot === lot && s.needs && !s.inside).length || 1;
      const counter = nearestOf(lot, 'counter', sim.x, sim.z, sim.floor) || nearestOf(lot, 'counter', sim.x, sim.z);
      const ownKind = OWN[recipe.id], ownAt = ownKind && sim.bag ? S.Econ.index(sim, it => it.k === ownKind) : -1;
      if (ownAt >= 0) S.Econ.take(sim, ownAt);
      const meal = { recipe: recipe.id, quality: q, left: home, made: now(world), item: counter ? lot.house.items.indexOf(counter) : -1, by: sim.id, own: ownAt >= 0 ? ownKind : null };
      k.meals.push(meal);
      k.last = { recipe: recipe.id, quality: q };
      if (counter && sim.queue.length < S.Acts.QUEUE_LIMIT) sim.queue.unshift(S.Acts.adAct('eat_meal', lot, counter));
    },

    ready(world, lot, item, ad) {
      if (!ad.when) return !item.burnt && !fireOn(lot, item);
      const k = lot.kitchen;
      if (ad.when === 'serving') return !!(k && k.meals.some(m => m.left > 0 && m.item === lot.house.items.indexOf(item)));
      if (ad.when === 'leftovers') return !!(k && k.fridge.some(m => m.left > 0)) && !item.burnt;
      if (ad.when === 'burning') return !!fireOn(lot, item);
      if (ad.when === 'burnt') return !!item.burnt && !fireOn(lot, item);
      if (S.WHEN && S.WHEN[ad.when]) return !item.burnt && !fireOn(lot, item) && S.WHEN[ad.when](world, lot, item);
      return true;
    },

    take(world, sim, act, from) {
      if (!sim.needs) return false;
      const lot = world.lots[act.lot], k = lot && lot.kitchen;
      if (!k) return false;
      const list = from === 'fridge' ? k.fridge : k.meals.filter(m => m.item === act.item);
      const meal = list.filter(m => m.left > 0).sort((a, b) => spoiled(world, a, lot) - spoiled(world, b, lot) || b.quality - a.quality || b.made - a.made)[0];
      if (!meal) return false;
      meal.left--;
      act.food = { recipe: meal.recipe, quality: meal.quality, made: meal.made, cold: from === 'fridge' ? 1 : 0, own: meal.own || null };
      act.gain = { hunger: S.RECIPES[meal.recipe].hunger, fun: 3 };
      act.startHunger = Math.round(sim.needs.hunger);
      k.fridge = k.fridge.filter(m => m.left > 0);
      k.meals = k.meals.filter(m => m.left > 0);
      return true;
    },

    eaten(world, sim, act) {
      const food = act.food;
      if (!food || !sim.moods) return;
      const recipe = S.RECIPES[food.recipe];
      if (act.startHunger >= STUFFED) mood(world, sim, 'heavyStomach');
      if (food.cold && spoiled(world, food, world.lots[act.lot])) {
        mood(world, sim, 'spoiledFood');
        return;
      }
      if (food.quality === 0) mood(world, sim, 'burntFood');
      else if (food.quality <= 2) mood(world, sim, 'weirdDish');
      else if (food.cold) mood(world, sim, 'leftovers');
      else if (recipe.kind === 'delivery') mood(world, sim, 'pizza');
      else if (recipe.kind === 'dessert') mood(world, sim, food.quality >= GREAT_Q ? 'masterDish' : 'dessert');
      else if (food.quality >= GREAT_Q) mood(world, sim, 'masterDish');
      else if (food.quality >= 5) mood(world, sim, 'tastyDish');
      else mood(world, sim, recipe.kind === 'breakfast' ? 'breakfast' : 'homeMeal');
      if (food.own === 'fish') mood(world, sim, 'ownFish');
      if (food.own === 'produce') mood(world, sim, 'ownHarvest');
    },

    copy(world, sim) {
      const lot = sim.home, k = kitchen(lot);
      if (!k.last) return false;
      const counter = nearestOf(lot, 'counter', sim.x, sim.z, sim.floor);
      if (!counter) return false;
      const wrong = S.roll(world.rng) < 0.3, q = wrong ? Math.max(0, k.last.quality - 3) : k.last.quality;
      k.meals.push({ recipe: k.last.recipe, quality: q, left: world.family.filter(s => s.lot === lot && s.needs).length || 1, made: now(world), item: lot.house.items.indexOf(counter), by: sim.id });
      world.events.push({ type: 'meal', sim: sim.id, name: sim.name, text: 'Копир блюд: «' + S.RECIPES[k.last.recipe].name + '», ' + QUALITY[q].toLowerCase() + (wrong ? '. Что-то пошло не так' : '') });
      return true;
    },

    ignite(world, lot, item, by) {
      const k = kitchen(lot), index = lot.house.items.indexOf(item);
      if (k.fires.some(f => f.item === index) || item.burnt || NO_BURN.has(modelOf(item))) return false;
      if (!by && k.cool && k.cool[index] > now(world)) return false;
      const first = !k.fires.length;
      k.fires.push({ item: index, heat: 1, left: FIRE_LEFT, spreadIn: FIRE_SPREAD_EVERY, near: {} });
      if (by && by.skill) S.Skills.stat(world, by, 'fires', 1);
      world.events.push({ type: 'fire', lot: lot.index, item: index, start: first, text: first ? 'Пожар! Горит: ' + S.modelName(modelOf(item)) : 'Огонь перекинулся: ' + S.modelName(modelOf(item)) });
      if (first) {
        for (const sim of world.family) {
          if (sim.lot !== lot || sim.inside) continue;
          if (S.Traits) S.Traits.bubble(sim, 'fire');
          if (sim.act && sim.act.ad && !sim.act.listen && S.ADS[sim.act.ad].steps.some(s => s.cook) && sim.act.lot === lot.index) {
            S.Acts.dropCurrent(world, sim);
            sim.queue.length = 0;
          }
        }
      }
      return true;
    },

    burning(lot) {
      return !!(lot.kitchen && lot.kitchen.fires.length);
    },

    fireAt(lot, item) {
      return fireOn(lot, item);
    },

    beat(world, sim, act) {
      const lot = world.lots[act.lot], item = lot && lot.house.items[act.item], fire = item && fireOn(lot, item);
      if (!fire) return;
      fire.heat -= BEAT + S.Skills.level(sim, 'athletic') * 0.02 + (S.Traits.has(sim, 'brave') ? 0.15 : 0);
      if (S.roll(world.rng) < 0.04) mood(world, sim, 'burn');
      if (fire.heat <= 0) S.Food.putOut(world, lot, fire, sim);
    },

    putOut(world, lot, fire, sim) {
      const k = lot.kitchen;
      k.fires = k.fires.filter(f => f !== fire);
      k.cool = k.cool || {};
      k.cool[fire.item] = now(world) + COOL_AFTER;
      const name = S.modelName(modelOf(lot.house.items[fire.item]));
      world.events.push({ type: 'fire', lot: lot.index, item: fire.item, out: true, text: (sim ? sim.name + ' тушит: ' : 'Погасло: ') + name + (k.fires.length ? '' : '. Пожар потушен') });
      if (!k.fires.length && sim && sim.wish) S.Wishes.bump(sim, 'fireOut');
    },

    burnOut(world, lot, fire) {
      const item = lot.house.items[fire.item], k = lot.kitchen;
      k.fires = k.fires.filter(f => f !== fire);
      item.burnt = true;
      if (world.reflag) world.reflag.add(item);
      world.events.push({ type: 'fire', lot: lot.index, item: fire.item, burnt: true, text: 'Сгорело: ' + S.modelName(modelOf(item)) + (k.fires.length ? '' : '. Огонь погас') });
    },

    clean(world, sim, act) {
      const lot = world.lots[act.lot], item = lot && lot.house.items[act.item];
      if (!item || !item.burnt) return;
      item.burnt = false;
      if (world.reflag) world.reflag.add(item);
      world.events.push({ type: 'fire', lot: lot.index, item: act.item, cleaned: true, text: sim.name + ' отчищает копоть: ' + S.modelName(modelOf(item)) });
    },

    urge(world, sim) {
      const lot = sim.lot;
      if (!lot || !S.Food.burning(lot) || sim.inside || sim.car || !sim.needs) return null;
      const k = lot.kitchen, coward = S.Traits.has(sim, 'coward') || S.AGE_RANK[sim.age] < S.AGE_RANK.teen;
      if (sim.act && (sim.act.ad === 'extinguish' || (sim.act.go && sim.act.flee))) return null;
      if (coward) {
        const door = lot.doorOut;
        if (Math.hypot(sim.x - door[0], sim.z - door[1]) < 2 || sim.lot !== lot) return null;
        return { go: { x: door[0], z: door[1], floor: 0, lot: lot.index, enter: -1, run: true, car: false }, phase: 'start', auto: true, flee: true };
      }
      let best = null, bestD = Infinity;
      for (const fire of k.fires) {
        const item = lot.house.items[fire.item];
        const d = Math.hypot(lot.x + item.x - sim.x, lot.z + item.z - sim.z) + Math.abs(item.floor - sim.floor) * 6;
        if (d < bestD) {
          bestD = d;
          best = item;
        }
      }
      return best ? Object.assign(S.Acts.adAct('extinguish', lot, best), { auto: true }) : null;
    },

    heldMoods(world, sim) {
      return sim.lot && !sim.inside && S.Food.burning(sim.lot) ? ['fire'] : [];
    },

    step(world, dt) {
      const t = now(world);
      for (const lot of world.lots) {
        const k = lot.kitchen;
        if (!k) continue;
        if (k.meals.length) {
          const old = k.meals.filter(m => t - m.made >= LEFT_AFTER && m.left > 0);
          if (old.length && lot.house.items.some(i => modelOf(i) === 'fridge' && !i.burnt)) {
            for (const m of old) k.fridge.push({ recipe: m.recipe, quality: m.quality, left: m.left, made: m.made, item: -1, by: m.by, own: m.own || null });
            k.meals = k.meals.filter(m => !old.includes(m));
          }
          k.meals = k.meals.filter(m => m.left > 0 && t - m.made < LEFT_AFTER * 2);
        }
        if (k.fridge.length) k.fridge = k.fridge.filter(m => t - m.made < THROW_AFTER * keepsFor(lot));
        for (const fire of k.fires.slice()) {
          const item = lot.house.items[fire.item];
          fire.left -= dt;
          if (fire.left <= 0) {
            S.Food.burnOut(world, lot, fire);
            continue;
          }
          fire.spreadIn -= dt;
          if (fire.spreadIn <= 0) {
            fire.spreadIn += FIRE_SPREAD_EVERY;
            for (const other of lot.house.items) {
              if (other === item || other.floor !== item.floor || other.burnt || !S.objectOf(other) || NO_BURN.has(modelOf(other))) continue;
              if (Math.hypot(other.x - item.x, other.z - item.z) > FIRE_SPREAD_RANGE || fireOn(lot, other)) continue;
              if (S.roll(world.rng) < FIRE_SPREAD * fire.heat) S.Food.ignite(world, lot, other, null);
            }
          }
          for (const sim of world.family) {
            if (sim.lot !== lot || sim.floor !== item.floor || sim.inside) continue;
            const close = Math.hypot(lot.x + item.x - sim.x, lot.z + item.z - sim.z) < BURN_NEAR && !(sim.act && sim.act.ad === 'extinguish');
            fire.near[sim.id] = close ? (fire.near[sim.id] || 0) + dt : 0;
            if (fire.near[sim.id] >= BURN_AFTER) {
              fire.near[sim.id] = -1440;
              mood(world, sim, 'burn');
            }
          }
        }
        if (k.cool && !k.fires.length) delete k.cool;
        if (!k.meals.length && !k.fridge.length && !k.fires.length && !k.last) delete lot.kitchen;
      }
    },

    pack(world) {
      const out = [];
      for (const lot of world.lots) {
        const burnt = lot.house.items.map((item, i) => (item.burnt ? i : -1)).filter(i => i >= 0);
        if (!lot.kitchen && !burnt.length) continue;
        const k = lot.kitchen || { meals: [], fridge: [], fires: [], last: null };
        out.push([lot.index, k.meals.map(m => [m.recipe, m.quality, m.left, m.made, m.item, m.by, m.own || null]), k.fridge.map(m => [m.recipe, m.quality, m.left, m.made, m.item, m.by, m.own || null]), k.fires.map(f => [f.item, f.heat, f.left, f.spreadIn, f.near]), k.last && [k.last.recipe, k.last.quality], burnt, k.cool || null]);
      }
      return out;
    },

    unpack(world, list) {
      if (list === null || list === undefined) return [];
      if (!Array.isArray(list)) throw new Error('повреждена кухня');
      const meal = r => {
        if (!Array.isArray(r) || (r.length !== 6 && r.length !== 7) || !S.RECIPES[r[0]] || !(r[1] >= 0 && r[1] <= TOP_Q) || (r[6] && r[6] !== 'fish' && r[6] !== 'produce')) throw new Error('неизвестное блюдо в файле');
        return { recipe: r[0], quality: r[1], left: r[2], made: r[3], item: r[4], by: r[5], own: r[6] || null };
      };
      return list.map(r => {
        if (!Array.isArray(r) || r.length !== 7 || !world.lots[r[0]]) throw new Error('повреждена кухня');
        const lot = world.lots[r[0]], items = lot.house.items.length;
        const fires = r[3].map(f => {
          if (!Array.isArray(f) || f.length !== 5 || !(f[0] >= 0 && f[0] < items)) throw new Error('повреждён пожар');
          return { item: f[0], heat: f[1], left: f[2], spreadIn: f[3], near: Object.assign({}, f[4]) };
        });
        if (!r[5].every(i => i >= 0 && i < items)) throw new Error('повреждены сгоревшие вещи');
        const kitchenState = { meals: r[1].map(meal), fridge: r[2].map(meal), fires, last: r[4] && { recipe: r[4][0], quality: r[4][1] } };
        if (r[6]) kitchenState.cool = Object.assign({}, r[6]);
        return { lot, kitchen: kitchenState, burnt: r[5] };
      });
    },

    apply(world, rows) {
      for (const lot of world.lots) {
        delete lot.kitchen;
        for (const item of lot.house.items) {
          if (item.burnt && world.reflag) world.reflag.add(item);
          item.burnt = false;
        }
      }
      for (const row of rows) {
        row.lot.kitchen = row.kitchen;
        for (const i of row.burnt) {
          row.lot.house.items[i].burnt = true;
          if (world.reflag) world.reflag.add(row.lot.house.items[i]);
        }
      }
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
