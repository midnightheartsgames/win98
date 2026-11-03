(function (H) {
  'use strict';
  const scenes1 = `event day 1 -> s1_start
event visit kurgan1 -> s1_wake1
event visit kurgan2 -> s1_wake2
event visit kurgan3 -> s1_wake3
event risen 1 -> s1_risen
event day 6 -> s1_riders
event defeat riders -> s1_patrol
event flag s1_all -> s1_win

@s1_start
show aisulu left
show kulpash right
kulpash: Ветер третий день с востока, а пахнет дельтой. Так не бывает.
aisulu: Бывает, если кто-то идёт оттуда сюда.
kulpash: Или если кто-то ушёл отсюда туда. Твои мёртвые уже у чужих колоколов, девочка.
if kept aisulu_led
aisulu: Я видела их капитана. Она довела меня до кургана и ни о чём не спросила.
kulpash: Живые просто так не провожают. Вспомнишь об этом, когда придёт счёт.
else
aisulu: Я видела их капитана. Она спрашивала про соль, а не про то, кто платил.
kulpash: Значит, ещё спросит.
end
if kept letters_sent
show spirit right
spirit: Шаманка. Капитан из Звонграда отпустила меня и велела отдать тебе это.
aisulu: Мёртвые теперь носят письма?
spirit: Подписи бургомистра. Я читать не умею, но ей было важно.
aisulu: Положи на камень. Прочту, когда узнаю, кому верить.
show kulpash right
end
aisulu: Хан встал без венца и зовёт род на дельту. Я хочу знать, кто рядом с ним лежит спокойно, а кто нет.
kulpash: Разбуди три кургана у Кара-Обы. Спрашивай прямо, они не обидятся.
goal add wake1 "Разбудить курган на северо-западе" to kurgan1
goal add wake2 "Разбудить курган на северо-востоке" to kurgan2
goal add wake3 "Разбудить курган у западной межи" to kurgan3
goal add risen "Поднять павших из кургана в городе"
say Часть павших уходит тенями в курган города. Там их поднимают за половину цены, без редких ресурсов. Откройте город и щёлкните по кургану.
say Плач: когда гибнет ваш отряд, остальные получают +1 Натиск до конца боя, до +3.
end

@s1_wake1
show aisulu left
aisulu: Встань. Кто твой род?
say Земля шевелится. Тени идут за вами.
give unit shade 15
goal done wake1
set w1
scene s1_check
end

@s1_wake2
show aisulu left
aisulu: Встань. Кто открывал курганы?
say Камень молчит, но из земли выходят конные. Эти не помнят лиц.
give unit horsebow 8
goal done wake2
set w2
scene s1_check
end

@s1_wake3
show aisulu left
show kulpash right
aisulu: Встань.
kulpash: Ну?
aisulu: Здесь никого нет.
kulpash: Так не бывает. Здесь лежал кайдаров тысячник, я сама носила ему соль.
aisulu: Соль на месте. Вход засыпан ровно, чужими руками. Они вынесли его и закрыли за собой.
kulpash: Мёртвых не воруют, девочка. Мёртвых боятся.
aisulu: Значит, эти не боятся.
goal done wake3
set w3
scene s1_check
end

@s1_risen
say Павшие снова в строю. Сколько ещё можно поднять за эту неделю, видно в окне кургана.
goal done risen
set risen_done
scene s1_check
end

@s1_riders
show aisulu left
show kulpash right
kulpash: С востока разъезд. Копья, арбалеты, знамя с колоколом.
aisulu: Лига пришла в степь?
kulpash: Лига пришла искать тех, кто пришёл к ней. Встреть их раньше, чем они найдут Кара-Обу.
goal add patrol "Отбить разъезд Лиги" to riders
patrol riders 0
aim player 1 karaoba
say Конные лучники стреляют с седла: идут и стреляют за один ход, но на 30 % слабее.
end

@s1_patrol
show aisulu left
show kulpash right
kulpash: Разъезд ушёл. Командир у них был толковый, бумаги успел сжечь.
aisulu: Одну не успел. Тут написано, что степь надо занять, пока мёртвые на западе.
kulpash: Лига так не пишет. Лига пишет «обязуемся».
goal done patrol
set patrol_done
scene s1_check
end

@s1_check
if flag risen_done
if flag w1
if flag w2
if flag w3
if flag patrol_done
set s1_all
end
end
end
end
end
end

@s1_win
show aisulu left
show kulpash right
aisulu: Я пойду туда, куда увезли тысячника. На запад, через Белую корку.
kulpash: Там нет воды, нет города и нет соли, которая тебе бы помогла. Только камни.
aisulu: Камни мне подойдут.
win
end
`;

  const scenes2 = `event day 1 -> s2_start
event visit stone1 -> s2_stone
event visit tracks -> s2_tracks
event visit exit -> s2_exit
event defeat salt1 -> s2_salt1
event day 8 -> s2_week

@s2_start
show aisulu left
show yesui right
yesui: Здесь никто не ходит рядом с тобой, шаманка. Только мы.
aisulu: Я знаю. Дойдём до края корки?
yesui: Мёртвые дойдут. Вопрос, сколько мёртвых. Соль здесь режет даже нас.
goal add exit "Вывести рать через солончак к западному краю" to exit
say Своего города здесь нет. Павшие бродят за вами. Поднять их можно у курганных камней: раз в неделю, за половину цены, прямо в войско.
end

@s2_stone
show aisulu left
show yesui right
yesui: Этот камень старше курганов. Спроси его про своих.
aisulu: Кого он вернёт?
yesui: Тех, кто ещё помнит, куда шёл.
end

@s2_salt1
show aisulu left
show yesui right
yesui: Скорпионы сидели на дороге, как таможня. Кто-то их потревожил до нас.
aisulu: Кто здесь ходит?
yesui: Посмотри на следы, когда дойдём до стоянки. Степь таких не оставляет.
end

@s2_week
show yesui right
yesui: Ещё неделя, и я перестала считать, кто за мной идёт.
end

@s2_tracks
show aisulu left
show yesui right
aisulu: Колёса, узкие, с железом. Белая пыль на краю колеи, не наша соль. Лунная.
yesui: На такой дороге не ездили тысячу лет.
aisulu: Кто-то её расчистил. Смотри, куда ведут.
set tracks_seen
end

@s2_exit
show aisulu left
show yesui right
if flag tracks_seen
yesui: Край корки. Дальше дорога, и она светится сама.
else
aisulu: Стой. Смотри на землю. Колёса, узкие, с железом, и белая пыль в колее.
yesui: На такой дороге не ездили тысячу лет. Дальше она светится сама.
end
aisulu: Значит, венец ушёл по ней. Куда?
yesui: Спроси живых. Мёртвые туда не смотрят.
aisulu: Сначала нужны роды. Без родов мне не поверят, а без веры я только девочка с бубном.
goal done exit
win
end
`;

  const scenes3 = `event day 1 -> s3_start
event defeat bait1 -> s3_bait1
event defeat bait3 -> s3_bait3
event done rod1 -> s3_rod1
event done rod2 -> s3_rod2
event done rod3 -> s3_rod3
event flag s3_all -> s3_win

@s3_start
show aisulu left
show erden right
erden: Три рода. Кулпаш держит запад, Сарыг-кам север, я говорю за восток. Каждый скажет тебе нет, пока ты ему не поможешь.
aisulu: Я пришла не просить. Я пришла спрашивать, чьи мёртвые ушли без спроса.
erden: Спроси это у заставы с печатью. Сорок поколений никто не проходил без печати рода, и ты не первая.
goal add rod1 "Помочь роду Кулпаш: разбить разбойников у западного святилища" to bait1
goal add rod2 "Пройти заставу и помочь роду Сарыг-кама: принести соль" to rod2
goal add rod3 "Пройти вторую заставу и помочь роду Ердена: разбить нойонов-отступников" to bait3
say Печатник выдаёт печать своего цвета, застава пропускает с такой печатью. Просители платят за услугу: подойдите и посмотрите, что им нужно.
end

@s3_bait1
say Разбойников больше нет. Проситель рода Кулпаш ждёт в хижине у святилища.
goal point rod1 rod1
end

@s3_bait3
say Отступники разбиты. Проситель рода Ердена ждёт в хижине на солончаке.
goal point rod3 rod3
end

@s3_rod1
show kulpash right
show aisulu left
kulpash: Разбойников нет, соль считается, род запомнит.
aisulu: Мне нужна печать твоего рода.
kulpash: Она у каменной бабы на западе. Бери. И знай: я иду на дельту, как только хан скажет.
goal done rod1
set rod1_done
end

@s3_rod2
show saryg right
show aisulu left
saryg: Соль принята.
aisulu: И всё?
saryg: Я мало говорю. Иней на бубне с той недели не сходит. Значит, война.
goal done rod2
set rod2_done
end

@s3_rod3
show aisulu left
show erden right
erden: Роды у кургана. Все трое пришли, такого не было со времён Кайдара.
show kulpash right
kulpash: Хан велел идти на дельту. Что скажешь ты, шаманка, которая ходит к чужим капитанам?
show saryg right
saryg: Говори коротко.
aisulu: Хан ищет венец не там. Его унесли люди в белом, а дельта за это только платила.
show kulpash right
kulpash: Платила и резала. Разницы я не вижу.
choice
- Я приведу вам тех, кто вскрыл курган. Живыми или какими получится. -> s3_guilty
- Дайте мне три месяца. Потом делайте что хотите. -> s3_time
end
end

@s3_guilty
show erden right
erden: Род запомнит эти слова. Род всё запоминает.
keep promised_guilty
scene s3_after
end

@s3_time
kulpash: Три месяца мёртвые подождут. Живые не подождут и недели.
keep promised_time
scene s3_after
end

@s3_after
goal done rod3
set rod3_done
set s3_all
end

@s3_win
show aisulu left
show erden right
erden: У лунной дороги видели белую стоянку. Они уходят к морю.
aisulu: Значит, догоним по их же дороге.
win
end
`;

  const scenes4 = `event day 1 -> s4_start
event day 3 -> s4_second
event defeat order -> s4_caught
event arrive order -> s4_lost
event defeat mirror1 -> s4_mirror1

@s4_start
show aisulu left
show yesui right
yesui: Пыль на востоке, за первой петлёй. Четыре повозки и всадники в белом. Идут ровно, как по струне.
aisulu: Сколько им до моря?
yesui: Восемь дней. Нам столько же, если нигде не задерживаться.
aisulu: Дорога делает три петли. Скалы можно пройти напрямик, если хватит войска на тех, кто там сидит.
goal add order "Догнать белые повозки и разбить отряд Ордена" to order
reveal 74 60 3
spawn mirror 0.4 20 70 0 mirror1
goal add mirror1 "Пройти заслон" to mirror1
say Лунная дорога самая быстрая на карте. Повозки идут каждый день. Дойдут до берега, и венец потерян.
end

@s4_second
show yesui right
yesui: Шаманка, на дороге мы. Наши же кони, наши лица.
show aisulu left
aisulu: Не смотри им в глаза. Смотри на ноги, у них нет теней.
spawn mirror 0.6 50 48 0 mirror2
end

@s4_mirror1
say Заслон рассыпался. Отражение держит только того, кто его боится.
goal done mirror1
end

@s4_caught
show aisulu left
show cloak right
aisulu: Где венец?
cloak: Ты быстрая. Этого мы не считали. Повозки пустые, девочка, они для тебя и ехали.
aisulu: Ты мне скажешь, где он, или скажешь это моим предкам. Они спросят медленнее.
cloak: Я скажу и так, мне уже всё равно. Белый корабль вышел из Солеварска четыре дня назад. Венец в Чаше.
aisulu: Зачем он вам?
cloak: Луна просыпается, а цепь ещё не готова. Без венца степи её не удержать. Мы спасаем твоих мёртвых от того, что будет.
show yesui right
yesui: Он верит в это.
aisulu: Я вижу. От этого он не становится менее мёртвым.
goal done order
win
end

@s4_lost
show aisulu left
aisulu: Они у моря.
say Белые повозки дошли до берега.
lose
end
`;

  const scenes5 = `event day 1 -> s5_start
event capture fort -> s5_fort
event capture fort player 1 -> s5_khan_fort
event capture rechnoy player 1 -> s5_rechnoy
event defeat kaidar -> s5_khan_down
event done v1 -> s5_touch
event done v2 -> s5_touch
event done v3 -> s5_touch
event done v4 -> s5_touch
event day 10 -> s5_khan

@s5_start
show aisulu left
show kaidar right
kaidar: Ты вернулась без венца.
aisulu: Он в Чаше, на белом корабле. Я знаю, кто его увёз и кто заплатил.
kaidar: Кто заплатил, того и резать. Лига стоит на нашей соли. Я иду на Речной Стан.
aisulu: В Межевом форте капитан с письмами. Сожжёшь форт, сгорят и письма.
kaidar: Письма. Я лежал сто тридцать лет, чтобы мне читали письма.
aisulu: Лежал бы дальше, если бы не они. Иди северным перевалом, а форт оставь мне.
goal add fort "Взять Межевой форт через южный перевал" to fort
goal add spare "Необязательно: не разорить ни одного села"
if kept promised_guilty
show erden right
erden: Роды прислали камни. Ты обещала виновных, мы пришли посмотреть.
give unit stonewoman 12
else
show erden right
erden: Роды дают тебе три месяца и ни камня больше. Зато золото твоё, купи кого хочешь.
give gold 3000
end
aim player 1 rechnoy
aim player 2 kaidar
say Кайдар-хан ваш союзник: его войско идёт само, его города и шахты вы не занимаете. Сёла можно разорить ради золота или пройти мимо.
end

@s5_touch
if not flag touched
show aisulu left
aisulu: Здесь жили те, кто ничего не вскрывал.
set touched
goal fail spare
end
end

@s5_khan
show kaidar right
kaidar: Твои живые медлят. Мёртвые не устают, шаманка, но они и не ждут.
end

@s5_rechnoy
say Речной Стан горит. Рать Кайдар-хана не берёт пленных и не читает писем.
show kaidar right
kaidar: Следующий форт, шаманка. Успей раньше меня, если тебе так нужна бумага.
aim player 1 fort
set rechnoy_burned
end

@s5_khan_down
say Рать Кайдар-хана разбита у чужих стен. Сам хан снова в земле и встанет не скоро. Теперь на этой войне только вы.
set khan_fell
end

@s5_khan_fort
set khan_took
flag fort 0
end

@s5_fort
show aisulu left
if flag khan_took
show kaidar right
kaidar: Форт мой. Точнее, то, что от него осталось. Забирай свою бумагу, пока не догорела.
aisulu: Половины здесь нет.
kaidar: Половины здесь нет с той весны, как унесли мой венец.
keep letters_half
end
show adelina right
adelina: Опусти бунчук, шаманка. Стрелять здесь больше некому.
aisulu: Твой дух дошёл. Вот письма Мальса, а вот что нашла я: белые повозки, лунная дорога, белый корабль.
adelina: Мальс уехал с белыми плащами. И венец, значит, с ними.
aisulu: Венец в Чаше. Кто платил, знаешь ты. Кто вскрыл курган, теперь знаю я.
adelina: Тогда мы обе воевали не с теми.
hide adelina
show kaidar right
if flag khan_fell
kaidar: Мою рать положили, а я опять стою. Где тот, кто заплатил?
else
kaidar: Где тот, кто заплатил?
end
aisulu: Уехал к тем, кто забрал твой венец. Хан, он в Чаше. Мёртвые туда не дойдут.
kaidar: Я ждал сто тридцать лет не для того, чтобы услышать от девочки, что мне не дойти.
aisulu: Ложись. Я дойду. Отдай мне рать.
kaidar: Ты не хан.
aisulu: Нет. Я та, кто спрашивает.
kaidar: Тогда спроси с них за меня.
if not flag touched
say Ни одно село не разорено. В дельте это заметят.
keep spared_villages
goal done spare
end
keep kaidar_host
goal done fort
win
end
`;

  H.Campaign.add({
    id: 'sol',
    number: 2,
    faction: 'barrows',
    name: 'Соль',
    theme: 'camp_sol',
    hero: 'aisulu',
    about: 'Лето 999 года. Кайдар-хан встал из кургана без венца и зовёт род на дельту. Молодая шаманка Айсулу ищет тех, кто вскрыл курган, пока степь не ушла на войну.',
    opening: [
      'В степи Ак-Туз мёртвых кладут в соль. Соль хранит их, а они хранят род. Сто тридцать лет курганы молчали.',
      'Этой весной кто-то вскрыл курган Кайдар-хана и унёс Солевой венец. Хан встал и пошёл искать его там, где помнил врагов: на западе, в дельте.',
      'За ханом пошли те, кого он разбудил. Они не спрашивали зачем. Мёртвые спрашивают редко.',
      'Шаманка Айсулу спрашивает. Ей семнадцать лет, и пока это единственное, что отличает её от остальных.'
    ],
    ending: [
      'Кайдар-хан лёг обратно в курган без венца. Такого в степи не бывало, и старики до сих пор спорят, что это значит.',
      'Его рать осталась стоять и слушает теперь девочку с белым бубном.',
      'На дельте больше не звонят набат. Письма Мальса лежат в двух руках, и обе руки помнят, кто кого резал.',
      'Венец плывёт через Чашу на белом корабле. Айсулу смотрит на запад и считает, сколько живых надо будет спросить.'
    ],
    missions: [
      {
        id: 'sol1',
        name: 'Ветер над курганом',
        levelCap: 5,
        about: 'Малая карта, свой город.',
        brief: 'Хан встал без венца и зовёт род на дельту. Айсулу хочет понять, кто ещё поднят и кем, прежде чем степь уйдёт воевать.\n\nРазбудите три кургана у Кара-Обы и спросите лежащих прямо. Поднимите павших из кургана города. Когда придёт разъезд Лиги, встретьте его раньше, чем он найдёт могилы.',
        goals: ['Разбудить три кургана', 'Поднять павших из кургана в городе', 'Отбить разъезд Лиги, когда он придёт'],
        lose: 'Айсулу пала или потерян город',
        bonuses: [{ kind: 'unit', unit: 'shade', count: 15 }, { kind: 'res', res: { gold: 1500, salt: 2 } }, { kind: 'art', id: 'saltcharm' }],
        scenes: scenes1
      },
      {
        id: 'sol2',
        name: 'Белая корка',
        levelCap: 8,
        about: 'Средняя карта, солончак, своего города нет.',
        brief: 'Похитители ушли на запад через Белую корку, где нет ни воды, ни города. Рать идёт за шаманкой, и каждый павший тут остаётся без кургана.\n\nВедите войско к западному краю. Поднимайте павших у курганных камней: камень отвечает раз в неделю и просит золота. Смотрите на дорогу, колёса в степи чужие.',
        goals: ['Вывести рать через солончак к западному краю'],
        lose: 'Айсулу пала',
        bonuses: [{ kind: 'res', res: { gold: 3000 } }, { kind: 'unit', unit: 'horsebow', count: 8 }, { kind: 'art', id: 'quilted' }],
        scenes: scenes2
      },
      {
        id: 'sol3',
        name: 'Каменные бабы',
        levelCap: 11,
        about: 'Средняя карта, свой город, печати и заставы.',
        brief: 'Без родов шаманке никто не поверит, а роды стоят у трёх святилищ и не пускают чужих без печати. Каждый старший попросит услугу, и каждый уже готов идти на дельту.\n\nПомогите трём родам. Печать одного рода откроет заставу другого. Когда все соберутся, им придётся что-то обещать.',
        goals: ['Помочь роду Кулпаш', 'Пройти заставу и помочь роду Сарыг-кама', 'Пройти вторую заставу и помочь роду Ердена'],
        lose: 'Айсулу пала или потерян город',
        bonuses: [{ kind: 'unit', unit: 'stonewoman', count: 6 }, { kind: 'res', res: { gold: 3000, salt: 4 } }, { kind: 'art', id: 'saltring' }],
        scenes: scenes3
      },
      {
        id: 'sol4',
        name: 'Ночь на лунной дороге',
        levelCap: 14,
        about: 'Средняя карта, погоня.',
        brief: 'Белые повозки идут к морю по лунной дороге, по которой никто не ездил тысячу лет. На ней шаг стоит меньше, чем на любой другой, и они это знают.\n\nДогоните повозки раньше, чем они дойдут до берега, и разбейте отряд Ордена. Дорога петляет, скалы можно пройти напрямик, но проходы сторожат. На дороге вас ждут отражения: они выглядят как ваше войско, но не отбрасывают тени.',
        goals: ['Догнать белые повозки и разбить отряд Ордена'],
        lose: 'Повозки дошли до берега или Айсулу пала',
        bonuses: [{ kind: 'unit', unit: 'eaglespirit', count: 8 }, { kind: 'res', res: { gold: 5000 } }, { kind: 'art', id: 'couriers' }],
        scenes: scenes4
      },
      {
        id: 'sol5',
        name: 'Тризна',
        levelCap: 18,
        about: 'Большая карта, союзник.',
        brief: 'Хан идёт войной на Лигу, и его не остановить. В Межевом форте стоит капитан с письмами, которые могут закончить эту войну, если не сгорят.\n\nВозьмите форт раньше хана: через южный перевал, пока рать Кайдар-хана дерётся на севере. Хан ваш союзник и идёт своей дорогой. Сёла по пути можно разорить ради золота или пройти мимо: степь не забудет ни того, ни другого.',
        goals: ['Взять Межевой форт', 'Необязательно: не разорить ни одного села'],
        lose: 'Айсулу пала',
        bonuses: [{ kind: 'unit', unit: 'bonebull', count: 4 }, { kind: 'res', res: { gold: 8000, salt: 6 } }, { kind: 'art', id: 'khanaxe' }],
        scenes: scenes5
      }
    ]
  });
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
