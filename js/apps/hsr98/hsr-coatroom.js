(function (H) {
  'use strict';

  const POM_BASE = 'uniform';
  const POM_OUTFITS = {
    uniform: {
      name: 'Униформа проводника «Торжественный алый!»', short: 'Униформа проводника', rarity: 5,
      text: 'Изысканная униформа, которую Пом-Пом надевает, когда приветствует или провожает гостей. Алый шёлк с металлическими аксессуарами подчёркивает удивительную выправку проводника, а карманные часы, которые полируют десять раз в день, являются залогом стабильной работы Экспресса.',
      wear: ['Пом-Пом снова в униформе. Часы начищены, можно встречать гостей!', 'Униформа сидит как влитая. Проводник на посту, пом!']
    },
    pajamas: {
      name: 'Пижама «Сладких снов!»', short: 'Пижама', rarity: 4,
      text: 'Домашняя пижама, в которой спит Пом-Пом. Обычно он не показывает её другим... Разве что в полусне. Светло-голубой цвет напоминает утреннее небо. Некоторые пассажиры думают, что белый помпон на кончике колпака подражает пепеши, но это всего лишь слухи.',
      look: { coat: 'pajamas', top: '#8cb8de', stripe: '#f6f9fc', cap: '#94c2e6', trim: '#e0b048', beard: '#fbfaf6', bib: '#f6eedb', gem: '#3d86e0' },
      how: 'Пижама приходит письмом обновления 1.8. Загляните в Почту.',
      wear: ['Пом-Пом совсем не собирался спать! Просто пижама очень мягкая, пом.', 'Только никому не говори, что видел{|а} Пом-Пом в пижаме!'],
      greet: [
        'pompom|А? Это ты, {name}... Пом-Пом не спит. Пом-Пом проверяет вагон перед сном.',
        'pompom|Помпон на колпаке ничему не подражает! Кто опять болтает про пепеши?',
        'pompom|Хр-р... Билеты? Ах да. Пом-Пом на посту даже в пижаме!'
      ]
    },
    chef: {
      name: 'Поварской наряд «Прожарка от проводника!»', short: 'Поварской наряд', rarity: 4,
      text: 'Белоснежный китель, румяный фартук и высокий поварской колпак, которые экипаж подарил Пом-Пом в честь новоселья на втором этаже. Хотя проводник и раньше пёк пироги и разливал лимонад в Вагоне для вечеринок, в этом костюме его кулинарный авторитет неоспорим.',
      look: { coat: 'chef', top: '#f6f4ee', apron: '#c8382e', trim: '#e0a840', cap: '#ffffff', scarf: '#e85038', beard: '#fbfaf6' },
      how: 'Награда за полное обустройство комнаты в событии «Идеи декора для космического дома».',
      wear: ['Что приготовить сегодня, пом? Стейк средней прожарки или ягодный пирог?', 'В этом колпаке Пом-Пом выше на целую лапу! Настоящий шеф-повар Экспресса!'],
      greet: [
        'pompom|Запахло свежей выпечкой? Это Пом-Пом проверяет духовку в Вагоне для вечеринок, пом!',
        'pompom|{name}, мой руки перед обедом! У шеф-повара Пом-Пом на кухне строгий порядок!',
        'pompom|Тебе зажарить тост или налить сока? Только не кроши на ковёр, пом!'
      ]
    }
  };

  const LOOKS = {};
  function pomOutfitLook(id) {
    const o = POM_OUTFITS[id];
    if (!o || !o.look) return H.SPEAKERS.pompom.look;
    return LOOKS[id] || (LOOKS[id] = Object.assign({}, H.SPEAKERS.pompom.look, o.look));
  }

  const LETTER = {
    id: 'v18_coatroom', from: H.BRAND.team, title: 'Патч 1.8: Гардеробная Пом-Пом', need: 'express_intro',
    give: { pom: 'pajamas' },
    text: [
      'Уважаемый Первопроходец!',
      'У Пом-Пом прибавилось нарядов. В углу Вагона для вечеринок теперь Гардеробная комната Пом-Пом: подойдите к вешалке и помогите проводнику выбрать, что надеть сегодня.',
      'Костюм виден на Экспрессе, в разговорах и в меню проводника. В сюжетных сценах Пом-Пом носит униформу, пока в гардеробной не включён переключатель «Наряд в сюжетных сценах». В Прыжке проводник всегда в униформе: в ней он встречает новых пассажиров.',
      'Во вложении первый новый костюм, Пижама «Сладких снов!». Счастливого пути!'
    ]
  };
  if (H.MAIL && !H.MAIL.some(m => m.id === LETTER.id)) H.MAIL.push(LETTER);

  const QUESTS = {
    pom_coat: {
      name: 'Многоликий Пом-Пом', giver: 'Пом-Пом', type: 'adv', ch: 'adv_express', face: 'pompom', area: 'express_party',
      desc: 'У Пом-Пом прибавилось нарядов, и проводник обустраивает себе гардеробную в Вагоне для вечеринок. Он ждёт тебя у вешалки.',
      reward: { credits: 1000 },
      steps: {
        talk: { text: 'Поговорить с Пом-Пом у гардеробной в Вагоне для вечеринок', at: 'express_party:z', desc: 'У Пом-Пом прибавилось нарядов, и проводник обустраивает себе гардеробную в Вагоне для вечеринок. Он ждёт тебя у вешалки.' }
      }
    }
  };

  const SCRIPTS = {
    pom_coat_talk: [
      { recap: 'Многоликий Пом-Пом', text: 'У Пом-Пом прибавилось нарядов, и проводник обустроил себе гардеробную в углу Вагона для вечеринок. {name} может одобрить место или предложить другое, но Пом-Пом остаётся при своём и просит помочь выбрать, что надеть сегодня.' },
      'pompom|{name}, ты как раз вовремя! У Пом-Пом прибавилось нарядов, поэтому здесь теперь будет гардеробная!',
      'pompom|Как думаешь, она будет неплохо здесь смотреться?',
      { choice: [['«Да, отлично!»', 'yes'], ['«Есть ещё один вариант.»', 'other'], ['«А в твоей комнате гардеробную обустроить нельзя?»', 'room']] },
      '#yes',
      'pompom|Хе-хе, и Пом-Пом того же мнения. Наконец-то заполним этот угол!',
      { jump: 'go' },
      '#other',
      'pompom|Что? {name}, ты {нашёл|нашла} для гардеробной Пом-Пом более подходящее место?',
      { choice: [['«Общий вагон.»', 'parlor'], ['«Архив.»', 'archive'], ['«Грузовой вагон.»', 'cargo']] },
      '#parlor',
      'pompom|Разве там можно устраивать гардеробную? Всё-таки переодевание Пом-Пом не такое уж занимательное зрелище.',
      { jump: 'no' },
      '#archive',
      'pompom|Там разве не расположена гардеробная Дань Хэна?',
      { jump: 'no' },
      '#cargo',
      'pompom|Не шути так, пом! У Пом-Пом достаточно высокие требования к качеству жизни!',
      '#no',
      'pompom|Твоё предложение отклонено! Пока что лучше этого места не найти.',
      { jump: 'go' },
      '#room',
      'pompom|Кхм-кхм, Пом-Пом всё-таки проводник! Весь Экспресс и есть комната Пом-Пом!',
      '#go',
      'pompom|Решено, гардеробная будет здесь! {name}, раз уж ты рядом, помоги Пом-Пом выбрать, что сегодня надеть, пом!',
      { ui: 'coatroom' },
      { give: { credits: 1000 } },
      { quest: 'pom_coat', step: 'done' },
      { flag: 'pom_coat_done' },
      { tut: 'Гардеробная комната Пом-Пом. В углу Вагона для вечеринок можно сменить костюм проводника. Костюм виден на Экспрессе, в разговорах и в меню проводника. Показывать ли его в сюжетных сценах, решает переключатель в гардеробной. В Прыжке Пом-Пом всегда в униформе.' },
      '|Пом-Пом ещё немного крутится перед зеркалом и спешит обратно в Общий вагон.'
    ]
  };

  Object.assign(H.Game.prototype, {
    pomState() { return this.state.pom || (this.state.pom = { have: [], wear: null, scenes: false }); },
    pomOwns(id) { return id === POM_BASE || (!!POM_OUTFITS[id] && this.pomState().have.includes(id)); },
    pomWorn() { const w = this.pomState().wear; return w && this.pomOwns(w) ? w : POM_BASE; },
    pomInScenes() { return this.pomState().scenes ? this.pomWorn() : POM_BASE; },
    pomGive(id) {
      if (!POM_OUTFITS[id] || this.pomOwns(id)) return false;
      this.pomState().have.push(id);
      if (!this.state.quests.pom_coat) this.setQuest('pom_coat', 'talk');
      this.toast('В гардеробную комнату Пом-Пом добавлены новые костюмы');
      return true;
    },
    pomWear(id) {
      if (!this.pomOwns(id)) return false;
      const st = this.pomState();
      st.wear = id === POM_BASE ? null : id;
      if (st.wear) this.state.flags.pom_dressed = true;
      else delete this.state.flags.pom_dressed;
      return true;
    },
    pomSetScenes(on) { this.pomState().scenes = !!on; },
    pomGreet() {
      const list = POM_OUTFITS[this.pomWorn()].greet;
      return list ? [list[Math.floor(this.rng() * list.length)]] : [];
    }
  });

  Object.assign(H.QUESTS, QUESTS);
  Object.assign(H.SCRIPTS, SCRIPTS);

  const coat = H.SCRIPTS.exp_coatroom;
  coat.unshift({ if: '?pom_coat=talk', jump: 'pom_quest' });
  coat.push({ end: true }, '#pom_quest', { script: 'pom_coat_talk' });

  const talk = H.SCRIPTS.pompom_talk, hello = talk.findIndex(st => st && st.one), menu = talk.find(st => st && st.menu && st.exit && st.exit[1] === 'bye');
  if (hello >= 0) talk.splice(hello, 0, { if: 'pom_dressed', jump: 'pom_hello' });
  if (menu) menu.menu.push(['«Тебе идёт этот наряд.»', 'pom_nice', 'pom_dressed']);
  talk.push({ end: true },
    '#pom_hello', { lines: 'pomGreet' }, { jump: 'menu' },
    '#pom_nice', 'pompom|{name}, ты {такой внимательный|такая внимательная}! Правда, отличная, пом?', { jump: 'menu' });

  Object.assign(H, { POM_OUTFITS, POM_BASE, pomOutfitLook });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
