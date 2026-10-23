const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let passed = 0;
const check = (cond, msg) => {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exit(1);
  }
  passed++;
  console.log('PASS: ' + msg);
};

const store = new Map();
global.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear()
};

const timers = [];
global.setTimeout = (fn, ms) => {
  timers.push({ fn, ms });
  return timers.length;
};
const flush = () => {
  let guard = 0;
  while (timers.length && guard++ < 500) timers.shift().fn();
};

const dialogs = [];
const published = [];
const listeners = [];
global.window = {
  addEventListener: () => {},
  isOnline: true,
  winManager: {
    windows: new Map(),
    openDialog: (o) => { dialogs.push(o); return { id: 'dlg' }; },
    createWindow: () => ({ element: {}, titleElement: {} }),
    closeWindow: () => {},
    bringToTop: () => {}
  },
  appIE: { publishAnekdot: (text, date) => published.push({ text, date }) },
  gameManager: {
    state: { purchased: ['winamp'] },
    catalog: { wolf3d: { title: 'Wolfenstein 3D', steam: true, priceDisplay: '$14.99' } },
    addListener: fn => listeners.push(fn)
  }
};
global.Icons = new Proxy({}, { get: () => '<svg></svg>' });

eval(fs.readFileSync(path.join(root, 'js/apps/outlook-mail.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'js/apps/outlook.js'), 'utf8'));

const data = window.OutlookMail;
let app = window.appOutlook;
const AppClass = app.constructor;
const ME = data.me.addr;
const inbox = () => app.folderMails('inbox');
const last = () => inbox()[0];
const reset = () => {
  store.clear();
  timers.length = 0;
  dialogs.length = 0;
  app = new AppClass();
  timers.length = 0;
};
const write = (to, subject, body) => {
  const before = app.state.pending.length;
  const mail = app.send({ to, subject, body });
  return { mail, scheduled: app.state.pending.slice(before) };
};
const roundTrip = (to, subject, body) => {
  const r = write(to, subject, body);
  flush();
  return r;
};

check(Array.isArray(data.people) && data.people.length >= 35, 'correspondent directory has at least 35 people');
const addrs = data.people.map(p => p.addr);
check(new Set(addrs).size === addrs.length, 'every correspondent address is unique');
check(addrs.every(a => app.validAddr(a)), 'every correspondent address is a valid e-mail address');
check(data.people.every(p => p.name && p.sig && Array.isArray(p.stages) && p.stages.length), 'every correspondent has a name, a signature and stages');
check(data.people.every(p => (p.topics || []).every(t => t.id && t.r)), 'every topic has an id and a reply');
const corpus = fs.readFileSync(path.join(root, 'js/apps/outlook-mail.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/apps/outlook.js'), 'utf8');
check(!/Microsoft|MICROSOFT/.test(corpus) && !/\bWindows\b/.test(corpus), 'mail texts use Microslop and Win names only');
check(!/\/\/|\/\*/.test(fs.readFileSync(path.join(root, 'js/apps/outlook.js'), 'utf8').replace(/https?:\/\//g, '')), 'outlook.js contains no comments');

reset();
const seededInbox = inbox();
check(seededInbox.length >= 9, 'inbox is seeded with at least 9 letters');
['ПИСЬМО СЧАСТЬЯ', 'GOOD TIMES', 'МОЯ СТРАНИЧКА', 'Re: Домашка'].forEach(key => {
  check(seededInbox.some(m => m.subject.includes(key)), `seed letter "${key}" is in the inbox`);
});
check(app.folderMails('sent').length === 1, 'sent folder is seeded with one letter');
check(seededInbox.every((m, i) => i === 0 || (seededInbox[i - 1].ts >= m.ts)), 'inbox is sorted newest first');

reset();
const first = write('Дима <dima@geocities.com>', 'Привет', 'Классная страничка, Дима!');
check(first.mail && first.mail.folder === 'sent', 'online letter goes to Sent');
check(first.scheduled.length === 1, 'one reply is scheduled');
const wait = first.scheduled[0].due - Date.now();
check(wait >= 4900 && wait <= 10100, `reply arrives 5-10 seconds later (${wait} ms)`);
check(timers.some(t => t.ms >= 4900 && t.ms <= 10100), 'reply timer is armed for 5-10 seconds');
flush();
let reply = last();
check(reply.from.includes('dima@geocities.com') && !reply.read && reply.fresh, 'Dima reply lands unread in the inbox');
check(reply.subject === 'Re: Привет', 'reply subject is "Re: <subject>"');
check(reply.body.includes('Dima_Webmaster') && reply.body.includes('> Классная страничка'), 'reply carries the signature and quotes the letter');
check(app.freshCount() === 1, 'fresh unread counter feeds the tray icon');
app.select(reply.id);
check(app.freshCount() === 0, 'reading the letter clears the tray counter');
check(app.state.book.some(c => c.addr === 'dima@geocities.com'), 'recipient is remembered in the address book');

roundTrip('dima@geocities.com', 'Ещё', 'Как дела?');
check(last().body.includes('F5'), 'Dima second letter admits the counter is fake');
roundTrip('dima@geocities.com', 'Опять я', 'Что нового?');
check(app.flag('dima@geocities.com', 'offer') && last().body.includes('веб-студии'), 'Dima third letter brings the job offer');
roundTrip('dima@geocities.com', 'Re: студия', 'Не соглашайся, оставайся собой!');
check(app.flag('dima@geocities.com', 'stayed') && app.flag('dima@geocities.com', 'nocounter'), 'advice to decline sets stayed and removes the counter');
check(last().body.includes('отказался') && !last().body.includes('так и не сказал'), 'Dima answers the advice without contradicting it');

reset();
['A', 'B', 'C'].forEach(s => roundTrip('dima@geocities.com', s, 'Привет, Дима'));
roundTrip('dima@geocities.com', 'Совет', 'Конечно иди, это же деньги');
check(app.flag('dima@geocities.com', 'took') && last().body.includes('Согласился'), 'advice to accept leads to the studio branch');
reset();
['A', 'B', 'C'].forEach(s => roundTrip('dima@geocities.com', s, 'Привет, Дима'));
roundTrip('dima@geocities.com', 'Quake', 'Го в quake вечером?');
check(app.flag('dima@geocities.com', 'both') && last().body.includes('P.S.') && last().body.includes('совмещать'), 'no advice still resolves the arc in a P.S.');

reset();
const reg = write('admin@club98.net', 'Re: Турнир по Quake 2 и StarCraft в субботу!', 'Запишите меня, пожалуйста');
check(reg.scheduled.length === 2, 'tournament registration schedules a reply and a results letter');
check(reg.scheduled[1].due - reg.scheduled[0].due >= 59000, 'results letter comes about a minute after the reply');
flush();
check(inbox().some(m => m.subject === 'Итоги турнира в клубе «Redmond»') && app.flag('admin@club98.net', 'reg'), 'results letter arrives and registration is remembered');
roundTrip('admin@club98.net', 'Сколько стоит?', 'Сколько стоит час игры?');
check(last().body.includes('10 рублей'), 'club answers the price question');

reset();
roundTrip('nobody@nowhere-land.xx', 'Тест', 'Привет');
check(last().from.includes('MAILER-DAEMON') && last().body.includes('Host unknown'), 'unknown host bounces with Host unknown');
roundTrip('vasya@geocities.com', 'Тест', 'Привет');
check(last().body.includes('User unknown') && last().body.includes('support@geocities.com'), 'unknown user bounces and points to the domain desk');
roundTrip('webmaster@kinomania98.ru', 'Кино', 'Что посоветуете?');
check(last().from.includes('editor@kinomania98.ru'), 'webmaster@ alias reaches the site desk');
roundTrip(ME, 'Себе', 'Напоминание: купить модем');
check(last().from.includes(ME) && last().body === 'Напоминание: купить модем', 'a letter to yourself arrives as sent');

reset();
check(app.send({ to: '', subject: 'x', body: 'y' }) === false && dialogs.length === 1, 'empty recipient shows an error');
check(app.send({ to: 'not-an-address', subject: 'x', body: 'y' }) === false && dialogs.length === 2, 'invalid address shows an error');

reset();
window.isOnline = false;
const off = write('misha@school98.ru', 'Офлайн', 'Привет из автономного режима');
check(off.mail.folder === 'outbox' && off.scheduled.length === 0, 'offline letter waits in Outbox');
window.isOnline = true;
check(app.flushOutbox() === 1 && app.state.pending.length === 1, 'delivering mail sends the Outbox');
flush();
check(last().from.includes('misha@school98.ru'), 'Misha answers the delivered letter');

reset();
const chain = inbox().find(m => m.subject.includes('ПИСЬМО СЧАСТЬЯ'));
app.currentFolder = 'inbox';
app.selectedEmailId = chain.id;
let composed = null;
app.openCompose = (d) => { composed = d; };
app.forward();
check(composed.subject.startsWith('Fw: ') && composed.body.includes('Пересылаемое сообщение'), 'forward prepares Fw: subject and forwarded body');
roundTrip('misha@school98.ru', composed.subject, composed.body);
check(last().body.includes('письмо счастья'), 'forwarding the chain letter gets a chain-letter reply');

const hoax = inbox().find(m => m.subject.includes('GOOD TIMES'));
app.selectedEmailId = hoax.id;
app.forward();
roundTrip('virus@antivirus98.com', composed.subject, composed.body);
check(last().body.includes('не существует'), 'antivirus lab debunks the forwarded Good Times hoax');

app.selectedEmailId = inbox().find(m => m.subject.includes('Confidential')).id;
app.reply(false);
check(composed.to.includes('prince98@lagos-bank.ng') && composed.subject.startsWith('Re: ') && composed.body.includes('> Dearest Friend'), 'reply quotes the original with > lines');

reset();
['1', '2', '3'].forEach(s => roundTrip('prince98@lagos-bank.ng', s, 'OK, tell me more'));
check(inbox().some(m => m.from.includes('fraud@cbn-nigeria.ng')), 'Prince scam escalates into a recovery scam letter');
roundTrip('prince98@lagos-bank.ng', 'No', 'Это мошенничество!');
check(last().body.includes('doubt my honesty'), 'Prince reacts to being called a scam');

reset();
roundTrip('support@microslop.com', 'Помогите', 'Ничего не работает');
roundTrip('support@microslop.com', 'Помогите', 'Ничего не работает');
check(last().body.includes('автоматически'), 'Microslop support answers with an autoresponder at first');
roundTrip('support@microslop.com', 'Помогите', 'Синий экран каждый час');
check(app.flag('support@microslop.com', 'human') && last().body.includes('Сергей'), 'third letter reaches a human engineer');

reset();
const joke = 'Сисадмин звонит провайдеру: у меня Интернет не работает. Провайдер: а модем включён? Сисадмин: подождите, сейчас позвоню и спрошу.';
roundTrip('anekdot@anekdot98.ru', 'Анекдот', joke);
check(published.length === 1 && published[0].text === joke, 'a mailed joke is published on the anekdot site when the editor replies');
roundTrip('anekdot@anekdot98.ru', 'Ещё', 'Штирлиц шёл по коридору и думал о модеме весь вечер до утра.');
check(last().body.includes('баян') || last().body.includes('Баян'), 'old jokes are rejected as bayan');

reset();
roundTrip('digest@search98.com', 'subscribe', '');
check(app.flag('digest@search98.com', 'sub') && inbox().some(m => m.subject.includes('выпуск для новых')), 'subscribing sends a confirmation and an issue');
roundTrip('digest@search98.com', 'unsubscribe', '');
check(!app.flag('digest@search98.com', 'sub') && last().subject.includes('отписаны'), 'unsubscribe removes the subscription');
roundTrip('addurl@search98.com', 'Мой сайт', 'Добавьте http://www.narod.ru/alexey98 пожалуйста');
check(last().subject.includes('http://www.narod.ru/alexey98'), 'Add URL robot echoes the submitted site');

reset();
roundTrip('eugene@fido.relcom.ru', 'Поинт', 'Хочу стать поинтом');
check(app.flag('eugene@fido.relcom.ru', 'applied') && last().body.includes('AI> '), 'Fido sysop asks for point data and quotes Fido style');
roundTrip('eugene@fido.relcom.ru', 'Re: Поинт', 'Алексей Иванов, Москва, тел. 123-45-67, T-Mail и GoldED');
check(app.flag('eugene@fido.relcom.ru', 'point') && inbox().some(m => m.body.includes('2:5020/1024.98')), 'Fido sysop assigns a point address');
check(inbox().some(m => m.subject.includes('RU.WIN98')), 'echo rules arrive as a follow-up letter');

reset();
roundTrip('dejikosan99@digicharat.net', 'Join', 'I want to join the fan club!');
check(app.flag('dejikosan99@digicharat.net', 'member') && last().body.includes('#0451'), 'fan club membership number is issued');

reset();
window.appICQ = { contacts: [{ email: 'elena_msu@chat.ru', name: 'Елена Смирнова', nick: 'Лена_Студентка', uin: '554433', replies: ['Спасибочки!'] }] };
roundTrip('elena_msu@chat.ru', 'Про вирус', 'Лена, это мистификация, не бойся');
check(last().from.includes('elena_msu@chat.ru') && last().body.includes('554433'), 'ICQ contacts answer letters too');
roundTrip('nobody@chat.ru', 'x', 'y');
check(last().body.includes('User unknown'), 'unknown user on an ICQ contact domain bounces');
delete window.appICQ;

reset();
window.gameManager.state.purchased.push('wolf3d');
listeners.forEach(fn => fn(window.gameManager.state));
check(app.state.pending.length === 1, 'Steam purchase schedules a receipt');
flush();
check(last().subject.includes('Wolfenstein 3D') && last().body.includes('$14.99'), 'Steam receipt names the game and the price');

reset();
roundTrip('misha@school98.ru', 'Re: x', '');
check(last().body.includes('пустым'), 'an empty letter gets an empty-letter reply');

reset();
let sweep = 0;
data.people.forEach(person => {
  (person.topics || []).forEach(topic => {
    const key = (topic.k || []).find(k => k[0] !== '=');
    if (!key || topic.need) return;
    app.state.people = {};
    const out = app.answer(person.addr, { subject: 'Вопрос', body: `Здравствуйте! ${key} ${'текст '.repeat(8)}` });
    const body = out[0].mail.body;
    if (!body || /\{(ticket|url|date|subj)\}/.test(body + out[0].mail.subject)) {
      console.error('Broken reply', person.addr, topic.id, body);
      process.exit(1);
    }
    sweep++;
  });
  app.state.people = {};
  const plain = app.answer(person.addr, { subject: 'Привет', body: 'Просто хотел написать.' });
  if (!plain.length || !plain[0].mail.body) {
    console.error('No reply from', person.addr);
    process.exit(1);
  }
});
check(sweep > 80, `every keyword topic produces a filled reply (${sweep} topics)`);

const html = app.linkify('Заходи на http://www.geocities.com/dima_web/ или пиши dima@geocities.com.');
check(html.includes('data-url="http://www.geocities.com/dima_web/"') && html.includes('data-mail="dima@geocities.com"'), 'letter bodies link URLs and addresses');

composed = null;
app.openCompose = (d) => { composed = d; };
app.composeTo('mailto:dima@geocities.com?subject=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82&body=Hi');
check(composed.to === 'dima@geocities.com' && composed.subject === 'Привет' && composed.body === 'Hi', 'mailto links open a prefilled letter');

reset();
roundTrip('dima@geocities.com', 'Сохранение', 'Проверка');
const saved = JSON.parse(store.get(app.storageKey));
const reloaded = new AppClass();
check(reloaded.state.mails.length === saved.mails.length && reloaded.state.people['dima@geocities.com'].n === 1, 'mail and correspondent state survive a reload');
write('misha@school98.ru', 'Висит', 'Ответ ещё в пути');
timers.length = 0;
const again = new AppClass();
check(again.state.pending.length === 1 && timers.length >= 1, 'pending replies are re-armed after a reload');

const sources = ['js/apps/ie.js', 'js/apps/retro-sites.js', 'js/apps/advanced-site.js', 'js/apps/blender-site.js', 'js/apps/clippy-site.js', 'js/apps/poligon-site.js', 'js/apps/themeworld-site.js', 'js/apps/youvid-site.js', 'js/apps/steam-site.js', 'js/apps/digicharat-site.js', 'js/apps/interpedia-site.js', 'js/apps/kinomania-site.js', 'js/apps/webcinema-site.js', 'js/apps/gamerzone-site.js', 'js/apps/cheatcc-site.js', 'js/apps/hsr-site.js', 'js/apps/muzzone-site.js', 'js/apps/lucasarts-site.js', 'js/apps/ferrum-site.js', 'js/apps/gsc-site.js', 'js/apps/valve-site.js', 'js/apps/blizzard-site.js', 'js/apps/kovcheg-site.js', 'js/apps/kovcheg-site-guest.js', 'js/apps/sunsetvalley-site.js', 'js/apps/ashroad-site.js', 'js/apps/carman-site.js', 'js/apps/kish-site.js', 'js/apps/prodigy-site.js', 'js/apps/svodka-site.js']
  .map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const offline = ['misha@school98.ru', 'admin@club98.net', 'prince98@lagos-bank.ng', 'billg@microslop.com', 'support@mail98.com'];
const missing = addrs.filter(a => !offline.includes(a) && !sources.includes(`mailto:${a}`) && !sources.includes(`mailLink('${a}')`) && !sources.includes(`mailContact('${a}'`));
check(!missing.length, `every site correspondent is listed on its site (${missing.join(', ') || 'all found'})`);

const mailIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check(mailIndex.indexOf('js/apps/outlook-mail.js') > 0 && mailIndex.indexOf('js/apps/outlook-mail.js') < mailIndex.indexOf('js/apps/outlook.js'), 'index.html loads the mail directory before Outlook');

console.log(`\nOutlook Express: ${passed} checks passed.`);
