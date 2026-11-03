(function (H) {
  'use strict';
  const scenes1 = `event day 1 -> h1_start
event visit g1 -> h1_g1
event visit g2 -> h1_g2
event visit g3 -> h1_g3
event capture lit -> h1_lit
event flag h1_all -> h1_win

@h1_start
show irga left
show ilm right
ilm: Ты вернулась. Тебя же выгнали.
irga: Выгнали из цеха, не из Горнил. Старшие продают Престолу цепи, Ильм. Те самые, со старыми клеймами.
ilm: Совет говорит, что это просто железо.
irga: Совет не читал клейма. Я читала. Цепи ковали держать луну. Кто держит цепь, тот держит и её.
ilm: И что ты будешь делать одна?
irga: Не одна. Подмастерья трёх цехов ещё помнят, кто учил их бить молотом.
goal add g1 "Позвать подмастерьев Молотового цеха" to g1
goal add g2 "Позвать подмастерьев Саламандрова рва" to g2
goal add g3 "Позвать подмастерьев Стеклянной пещеры" to g3
goal add lit "Дойти до Чёрной Литейной" to lit
say Герои Горнил ходят по лаве и пеплу, как по дороге. Другим лава не даётся.
say В бою каждое действие даёт отряду Горнил очко Жара, очко прибавляет 10 % урона. С тремя очками отряд перегрет и теряет здоровье. «Оборона» остужает его и лечит.
if kept heart_given
show ilm right
ilm: С моря пишут, что кусок лунного сердца везут к Белым руинам. Если и цепи туда же, мне это не нравится.
end
end

@h1_g1
show brant right
brant: Молотовой цех слушает. Только скажи, кого бить, и мы пойдём не спрашивая.
irga: Спрашивайте. Это полезно.
give unit apprentice 14
goal done g1
set a1
scene h1_check
end

@h1_g2
show irga left
irga: Саламандры не знают про цепи. Но знают меня, я им десять лет носила уголь.
give unit salamander 6
goal done g2
set a2
scene h1_check
end

@h1_g3
show ilm right
ilm: Стеклянная пещера с тобой. Пауки, правда, сами решают, кого слушать.
give unit obsidianspider 4
goal done g3
set a3
scene h1_check
end

@h1_lit
show irga left
irga: Чёрная Литейная наша. Горн ещё тёплый.
goal done lit
set at
scene h1_check
end

@h1_check
if flag a1
if flag a2
if flag a3
if flag at
set h1_all
end
end
end
end
end

@h1_win
show garm right
garm: Совет цехов говорит один раз. Кузнечиха Ирга, ты вне закона. Твоё клеймо стёрто со всех наковален Горнил.
irga: Клеймо можно стереть. Руку, которая его ставила, сложнее.
garm: Цепи уйдут в срок. Это сделка, а не война.
irga: Значит, будет война.
win
end
`;

  const scenes2 = `event day 1 -> h2_start
event day 4 -> h2_letter
event defeat kerm -> h2_kerm
event capture dvor -> h2_dvor

@h2_start
show irga left
show brant right
brant: Цеховой Двор. Там совет, там суд и там цепи. Стены обсидиановые, вдвое крепче наших.
irga: Значит, бить надо вдвое умнее. Возьмём машины и дадим горну поработать.
goal add dvor "Взять Цеховой Двор" to dvor
say В Чёрной Литейной стоит Великий горн. Две вещи одного места и одной редкости он перековывает в одну, на ступень реже.
say По дороге лежат шлемы и кольца. Их можно перековать.
end

@h2_letter
show garm right
garm: Совет предлагает сделку. Верни Литейную цеху, и твоё имя вернут на наковальни. Цепи всё равно уйдут.
irga: Ты всё меришь сделками, Гарм. Цепь, которой держат луну, не товар.
garm: Всё товар, если найти покупателя. Ты просто не умеешь торговать.
irga: Зато умею ковать. Посмотрим, что дороже.
end

@h2_kerm
show brant right
brant: Керм Наковальня ушёл с поля. Сказал, что за совет он стоял честно, а умирать за него не нанимался.
irga: Честный человек. Жаль, что не на нашей стороне.
end

@h2_dvor
show irga left
show brant right
brant: Двор наш. А цепей нет. Склад пустой, только пыль и следы колёс.
irga: Обоз ушёл на перевал. Совет продал цепи раньше, чем мы постучали.
show garm right
garm: Судьи в твоих руках, кузнечиха. Что будешь делать?
choice
- Отпустить судей. Пусть цеха видят, что мы не они. -> h2_free
- Оставить судей под стражей до конца войны. -> h2_hold
end
end

@h2_free
show brant right
brant: Отпустили. Двое из них подмигнули мне на выходе. Может, это что-то значит.
goal done dvor
keep judges_freed
win
end

@h2_hold
show brant right
brant: Сидят. Цеха уже прислали выкуп. Не за свободу, а за то, чтобы мы их кормили.
goal done dvor
keep judges_held
win
end
`;

  const scenes3 = `event day 1 -> h3_start
event day 5 -> h3_rider
event defeat convoy -> h3_caught
event arrive convoy -> h3_gone
event day 10 -> h3_late

@h3_start
show irga left
show ilm right
ilm: Обоз Престола идёт через Серный перевал. Охрана белая, возницы наши.
irga: Сколько у нас времени?
ilm: До конца второй недели. Потом он спустится в долину, и там его уже не догнать.
goal add convoy "Перехватить обоз с цепями" to convoy
goal lose day 14
say Обоз идёт по дороге каждый день. Его видно сквозь туман войны.
end

@h3_rider
if not flag got
show ilm right
ilm: Гонец с перевала. Возницы обоза наши, из Серной слободы. Они не хотят везти цепи, но их держат белые.
irga: Тогда бить будем охрану, а не возниц.
ilm: Охрана из духов. Их не уговоришь и не подкупишь.
end
end

@h3_late
if not flag got
show ilm right
ilm: Обоз прошёл середину перевала. Четыре дня, не больше.
end
end

@h3_caught
show irga left
show ilm right
ilm: Обоз наш. Звеньев только половина.
irga: Где остальное?
ilm: Ушло раньше, другой дорогой. Возницы говорят, что старшие сами разделили цепь, чтобы не везти всё одним обозом.
irga: Умно. Значит, вторая половина уже у Престола.
goal done convoy
set got
keep chain_half
if day 10
else
keep convoy_fast
end
win
end

@h3_gone
show ilm right
ilm: Обоз спустился в долину. Мы опоздали.
lose
end
`;

  const scenes4 = `event day 1 -> h4_start
event done q1 -> h4_q1
event done q2 -> h4_q2
event done q3 -> h4_q3
event done q4 -> h4_q4
event day 15 -> h4_elders
event defeat garm -> h4_garm
event flag h4_all -> h4_win

@h4_start
show irga left
show brant right
brant: Цеха готовы присягнуть. Но каждый хочет испытание. Старый обычай.
irga: Обычай хороший. Только старшие ведут войско, а ждать оно не будет.
brant: Две недели. Потом оно придёт к Литейной.
goal add q1 "Испытание литейщиков" to q1
goal add q2 "Испытание кузнецов" to q2
goal add q3 "Испытание серников" to q3
goal add q4 "Испытание стеклодувов" to q4 glass
say Кузнецы просят редкий шлем. Два простых шлема можно перековать в Великом горне.
if kept judges_freed
show brant right
brant: Отпущенные судьи сдержали слово. Литейщики прислали подмастерьев без испытания на верность.
give unit caster 6
end
end

@h4_q1
show brant right
brant: Литейщики присягнули. Их мастер сказал, что расплав не разбирает, за кого льётся, но они разбирают.
give unit caster 8
goal done q1
set t1
scene h4_check
end

@h4_q2
show irga left
irga: Кузнецы взяли шлем и долго смотрели на шов. Потом сказали, что такой шов можно доверить войне.
give unit hammerer 20
goal done q2
set t2
scene h4_check
end

@h4_q3
show ilm right
ilm: Серники с нами. Привели паровиков. Обещали, что те не взорвутся без приказа.
give unit steamling 2
goal done q3
set t3
scene h4_check
end

@h4_q4
show brant right
brant: Стеклодувы присягнули последними. Им понравилось, как мы разбили тех, кто стоял у пещеры.
give unit glassblower 6
goal done q4
set t4
scene h4_check
end

@h4_elders
if not flag h4_all
spawn hero garm 1 66 44 0 garm
army garm apprentice 30 salamander 10
if not diff easy
army garm slaggiant 1 caster 6 apprentice 10
end
if diff impossible
army garm slaggiant 2 caster 10 steamling 3
end
show garm right
garm: Испытания, присяги. Ты играешь в старые игры, кузнечиха. А я привёл войско.
goal add garm "Отбить войско старших" to garm
aim player 1 home
end
end

@h4_garm
show irga left
irga: Гарм ушёл. Не разбит, просто ушёл. Он умеет считать потери.
goal done garm
set gb
scene h4_check
end

@h4_check
if flag t1
if flag t2
if flag t3
if flag t4
if day 15
if flag gb
set h4_all
end
else
keep guilds_sworn
set h4_all
end
end
end
end
end
end

@h4_win
show irga left
show ilm right
ilm: Четыре цеха с тобой. А Гарм послал гонца к Белым руинам. Просит Престол о помощи.
irga: Старший горн просит помощи у тех, кому продал цепи.
ilm: Он говорит, что это тоже сделка.
irga: У него всё сделка. Посмотрим, сколько стоит Старый Горн.
win
end
`;

  const scenes5 = `event day 1 -> h5_start
event day 8 -> h5_lava1
event day 15 -> h5_lava2
event day 22 -> h5_lava3
event defeat garm -> h5_garm
event defeat order -> h5_order
event flag h5_all -> h5_win

@h5_start
show irga left
show brant right
brant: Старый Горн проснулся. Говорят, раз в неделю он будет заливать долины.
irga: Тем лучше. Лава наша дорога, а не их.
brant: Белые стоят лагерем у южного склона. Гарм в Цеховом Дворе.
goal add garm "Разбить Гарма Окалину" to garm
goal add order "Разбить отряд Ордена" to order
goal lose day 29
if not diff easy
army garm slaggiant 1 caster 4 salamander 6
army order crossbow 10 plated 4
end
if diff impossible
army garm slaggiant 1 caster 6 steamling 2
army order crossbow 10 whitespirit 4
end
say Каждую неделю Старый Горн заливает лавой часть карты. Горнила ходят по лаве, остальным она преграждает путь.
if kept judges_freed
show brant right
brant: Литейщики судей прислали людей.
give unit caster 10
end
if kept judges_held
show brant right
brant: Цеха заплатили за судей. Деньги пригодятся.
give gold 5000
end
if kept guilds_sworn
show ilm right
ilm: Все четыре цеха выходят с нами. Их было бы меньше, если бы мы опоздали.
give unit apprentice 30
end
end

@h5_lava1
terrain lava 40 20 4 16
terrain lava 66 70 4 14
show ilm right
ilm: Горн выплюнул первую реку. Северная долина отрезана для всех, кроме нас.
end

@h5_lava2
terrain lava 50 50 12 3
show ilm right
ilm: Вторая река прошла через середину. Белые теперь ходят кругом.
end

@h5_lava3
terrain lava 84 30 3 20
show ilm right
ilm: Третья река у Белого лагеря. Им некуда отступать.
end

@h5_garm
show irga left
show garm right
garm: Ты думаешь, это конец? Половина цепи уже у регента.
irga: Знаю. Вторая половина у меня.
goal done garm
set gg
scene h5_check
end

@h5_order
show cloak right
cloak: Регенту не нужна вся цепь, кузнечиха. Ему достаточно той, что есть.
goal done order
set go
scene h5_check
end

@h5_check
if flag gg
if flag go
set h5_all
end
end
end

@h5_win
show irga left
show ilm right
ilm: Что будешь делать со своей половиной?
irga: Перекую. Регент получит её, если захочет. Только цепь лопнет, если ею держать луну против воли.
ilm: Как ты это сделаешь?
irga: Одним неправильным швом. Хороший кузнец никогда его не поставит. Поэтому никто его и не будет искать.
keep link_flawed
win
end
`;

  H.Campaign.add({
    id: 'zhar',
    number: 5,
    faction: 'forge',
    name: 'Жар',
    theme: 'camp_zhar',
    hero: 'irga',
    about: 'Осень 999 года. Старшие горны продают Престолу Цепи луны. Изгнанная кузнечиха Ирга знает, что цепи откованы держать луну, и поднимает подмастерьев.',
    opening: [
      'При царях Горнила ковали для Престола цепи и оружие. Цари ушли под воду, цепи остались в Горниле.',
      'Тысячу лет их никто не трогал. Старшие горны держали их как запас, а запас всегда можно продать.',
      'Этой осенью Престол приехал за Цепями луны и заплатил серой, которой у Горнил и так много.',
      'Кузнечиха Ирга прочла на цепях старые клейма. За это её выгнали из цеха. Теперь она идёт обратно.'
    ],
    ending: [
      'Цеховой Двор снова слушает цеха, а не совет. Гарм Окалина ушёл к южному склону и больше не приходил.',
      'Половина цепи уехала к Белым руинам. Вторая половина лежит на наковальне в Чёрной Литейной.',
      'Ирга перековала её за одну ночь. Шов вышел ровным, никто из подмастерьев не нашёл изъяна.',
      'Над Старым Горном снова дым. Говорят, если цепь когда-нибудь натянут против воли, это будет слышно отсюда.'
    ],
    missions: [
      {
        id: 'zhar1',
        name: 'Окалина',
        levelCap: 5,
        about: 'Малая карта, лавовые тропы.',
        brief: 'Совет старших горнов продаёт Престолу Цепи луны. Ирга возвращается в Горнила, откуда её выгнали.\n\nСоберите подмастерьев трёх цехов и дойдите до Чёрной Литейной, пока совет не узнал, зачем вы пришли.',
        goals: ['Позвать подмастерьев трёх цехов', 'Дойти до Чёрной Литейной'],
        lose: 'Ирга пала',
        bonuses: [{ kind: 'unit', unit: 'apprentice', count: 20 }, { kind: 'res', res: { gold: 1500, sulfur: 3 } }, { kind: 'art', id: 'leatherjack' }],
        scenes: scenes1
      },
      {
        id: 'zhar2',
        name: 'Цеховой суд',
        levelCap: 8,
        about: 'Средняя карта, осада.',
        brief: 'Цеховой Двор держит совет, суд и склад с цепями. Его обсидиановые стены вдвое крепче обычных.\n\nВозьмите Цеховой Двор осадой. В Чёрной Литейной стоит Великий горн: перекуйте то, что найдёте по дороге.',
        goals: ['Взять Цеховой Двор'],
        lose: 'Ирга пала или потеряна Литейная',
        bonuses: [{ kind: 'res', res: { gold: 3000, ore: 10, sulfur: 3 } }, { kind: 'unit', unit: 'caster', count: 6 }, { kind: 'art', id: 'roadcloak' }],
        scenes: scenes2
      },
      {
        id: 'zhar3',
        name: 'Серный перевал',
        levelCap: 11,
        about: 'Средняя карта, погоня.',
        brief: 'Цепи уже в пути: обоз Престола идёт через Серный перевал. Возницы наши, из Серной слободы, а охрану дал Орден. До конца второй недели обоз спустится в долину.\n\nПерехватите обоз, пока он на перевале. Его видно сквозь туман, а лава Ирге не помеха.',
        goals: ['Перехватить обоз с цепями до конца второй недели'],
        lose: 'Обоз ушёл или Ирга пала',
        bonuses: [{ kind: 'unit', unit: 'steamling', count: 3 }, { kind: 'res', res: { gold: 4000, sulfur: 4 } }, { kind: 'art', id: 'couriers' }],
        scenes: scenes3
      },
      {
        id: 'zhar4',
        name: 'Литая клятва',
        levelCap: 14,
        about: 'Средняя карта, задания.',
        brief: 'Четыре цеха готовы встать за Иргу, но каждый просит испытание по старому обычаю. Старшие ведут войско и будут у Литейной через две недели.\n\nПройдите испытания четырёх цехов. Если войско старших придёт раньше, его придётся отбить.',
        goals: ['Пройти испытания четырёх цехов', 'Отбить войско старших, если оно придёт'],
        lose: 'Ирга пала или потеряна Литейная',
        bonuses: [{ kind: 'unit', unit: 'slaggiant', count: 1 }, { kind: 'res', res: { gold: 5000, ore: 10 } }, { kind: 'art', id: 'ironhelm' }],
        scenes: scenes4
      },
      {
        id: 'zhar5',
        name: 'Извержение',
        levelCap: 18,
        about: 'Большая карта, которая меняется.',
        brief: 'Гарм Окалина держит Цеховой Двор, у южного склона стоит лагерь Ордена. Старый Горн проснулся и каждую неделю заливает лавой часть долин.\n\nРазбейте старших горнов и отряд Ордена до пятой недели.',
        goals: ['Разбить Гарма Окалину', 'Разбить отряд Ордена', 'Успеть до пятой недели'],
        lose: 'Прошло 28 дней, Ирга пала или потеряна Литейная',
        bonuses: [{ kind: 'unit', unit: 'volcano', count: 1 }, { kind: 'res', res: { gold: 8000, ore: 15, sulfur: 6 } }, { kind: 'art', id: 'rageband' }],
        scenes: scenes5
      }
    ]
  });
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
