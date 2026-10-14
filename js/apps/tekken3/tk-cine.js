(function (T) {
  'use strict';
  const { clamp, lerp, FONT_H, FONT_T, SCREENS } = T;

  const ENDINGS = {
    kenta: ['Призовые деньги легли на стол нотариуса ровно в полдень.', 'Старый учитель долго смотрел на ключи от додзё и молчал.', '«Завтра в шесть. Не опаздывай», — сказал он наконец.', 'В первый день в зал пришли одиннадцать детей. Кэнта был двенадцатым учеником.'],
    ray: ['Рэй отдал долг до последнего цента и оставил себе на один билет.', 'На причале его ждали те же люди, что и год назад.', '«Ещё раунд?» — спросил один из них.', 'Рэй улыбнулся и купил им всем кофе. В Бостоне стало на один бар «Мэддокс» больше.'],
    yalan: ['Бульдозеры остановились у ворот чайной.', 'Ялань положила на капот договор аренды на сто лет.', 'Бабушка налила ей чай и впервые не сказала, что она пьёт слишком быстро.', 'По вечерам во дворе снова ходят по кругу — теперь уже двадцать человек.'],
    rafael: ['На старой площади Салвадора снова звучит беримбау.', 'Рафаэл выкупил землю под роду и построил навес от дождя.', 'Мальчишки, которых гоняла полиция, теперь гоняют друг друга в кругу.', 'Местре играет медленную ангола и смеётся, когда его сбивают с ног.'],
    volkov: ['Бригада вернулась в цех в понедельник в семь утра.', 'Волков лично открыл проходную и пожал руку каждому.', 'Директором завода он становиться отказался.', '«Я мастер. Моё место — у станка и на ковре».'],
    minjun: ['Мин-Джун принёс кубок в закусочную у рынка.', 'Отец повесил его над кассой рядом с меню.', 'Очередь стояла до угла: все хотели увидеть чемпиона.', 'Аренду теперь платят на год вперёд, а ноги Мин-Джуна подают рамён.'],
    irina: ['В архиве концерна Ирина нашла папку с фамилией своего клиента.', 'Он был жив — его держали в лаборатории под ареной как свидетеля.', 'Она вывела его через вентиляцию за семь минут.', 'Утром папка лежала на столе у журналистов. Ирина взяла отпуск.'],
    kagemaru: ['Свиток Туманной горы вернулся на своё место в храме.', 'Кагэмару зажёг благовония и снял маску — впервые за двадцать лет.', 'В храме не было никого, кто мог бы увидеть его лицо.', 'Утром туман сошёл с горы, и тени снова стали обычными тенями.'],
    tony: ['Тони нашёл организатора отборочных боёв в Коулуне.', 'Разговор длился ровно одну минуту и три удара по центральной линии.', 'Его ученик вернулся в зал через месяц.', 'Тони починил ему часы и прибавил пять отжиманий к разминке.'],
    somsak: ['Над рекой в родной деревне стоит новый лагерь с навесом и рингом.', 'Двенадцать мальчишек по утрам бегают вдоль рисовых полей.', 'Сомсак учит их вай кру и терпению.', 'Промоутер прислал письмо с извинениями. Сомсак использовал его для растопки.'],
    potapych: ['Потапыч вернулся в цирк на Цветном с кубком в зубах.', 'Номер «Медведь-чемпион» собрал аншлаг на три месяца вперёд.', 'Дрессировщик вернулся с пенсии, чтобы стоять рядом на поклоне.', 'Гонорар Потапыча — сорок банок сгущёнки в неделю.'],
    liu: ['Лю Шэн нашёл бывшего ученика в кабинете на верхнем этаже.', 'Уши были надраны ровно так, как обещано.', 'Ученик заплакал и попросил вернуть его в горы.', 'Теперь они вдвоём подметают двор на горе Удан. Вино кончилось на второй день.'],
    strazh: ['Страж-7 отнёс кубок в пустой институт «Полюс».', 'В архиве нашлись адреса двенадцати учёных.', 'Он обошёл каждого пешком за полярную зиму.', 'ПРОТОКОЛ «ЧАЙ» ВЫПОЛНЕН. ЛЮДИ В БЕЗОПАСНОСТИ.'],
    churban: ['Чурбан вернулся в угол храмового зала.', 'Утром монахи удивились, что на нём нет пыли.', 'Самый младший ученик ударил его и отлетел в угол.', 'Кажется, Чурбан улыбался. Но это не точно.'],
    genzo: ['Гэндзо Курогане остался один в храме под ареной.', 'Колосс лежал перед ним грудой остывшей бронзы.', '«Сила, которой я искал, всегда была во мне», — сказал он пустому залу.', 'На следующий день концерн объявил о новом турнире.'],
    colossus: ['Колосс вернулся в храм и сел на свой постамент.', 'Он запомнил каждого, кого победил.', 'Бронза остывала медленно, как три тысячи лет назад.', 'Где-то наверху уже собирались новые бойцы.'],
    colossus2: ['Пламя ушло из трещин, и храм погрузился в темноту.', 'В глубине горела одна-единственная искра.', 'Она будет ждать следующего турнира.', 'Столько, сколько потребуется.']
  };

  class Cine {
    constructor(ui, a) {
      this.ui = ui; this.a = a; this.t = 0;
      this.shots = [];
      if (a.kind === 'ending') this.buildEnding(a.id, a.costume || 0);
      else if (a.kind === 'intro') this.buildIntro();
      else this.buildCredits();
      this.cur = -1;
    }

    buildEnding(id, costume) {
      const def = T.FIGHTER[id];
      const lines = ENDINGS[id] || ['Турнир окончен.'];
      const st = T.STAGE[def.stage] || T.STAGE.dojo;
      const sh = T.showcase(this.ui, def, costume);
      const cams = [
        (k) => ({ eye: [lerp(6, 3.2, k), lerp(2.4, 1.5, k), lerp(4, 2, k)], at: [0, 1.0, 0], fov: 0.7 }),
        (k) => { const a = 0.4 + k * 0.9; return { eye: [Math.cos(a) * 2.0, 1.55, Math.sin(a) * 2.0], at: [0, 1.4, 0], fov: 0.55 }; },
        (k) => ({ eye: [lerp(-1.5, -3.8, k), 1.1, lerp(2.6, 4.6, k)], at: [0, 1.1, 0], fov: 0.7 }),
        (k) => ({ eye: [0, lerp(1.6, 4, k), lerp(3.5, 7, k)], at: [0, 1.0, 0], fov: 0.7 })
      ];
      const states = ['intro', 'idle', 'win', 'win'];
      lines.forEach((line, i) => this.shots.push({ dur: 250, stage: st, items: [{ sh, pos: [0, 0, 0], yaw: Math.PI / 2 }], cam: cams[i % cams.length], text: line, state: states[i % states.length] }));
      this.title = def.name.toUpperCase();
      this.music = 'ending';
      this.endText = 'КОНЕЦ';
    }

    buildIntro() {
      const list = T.selectableFighters(this.ui.save).filter(d => !d.finalForm);
      for (const def of list) {
        const sh = T.showcase(this.ui, def, 0);
        const st = T.STAGE[def.stage] || T.STAGE.dojo;
        const side = Math.random() < 0.5 ? 1 : -1;
        this.shots.push({ dur: 130, stage: st, items: [{ sh, pos: [0, 0, 0], yaw: Math.PI / 2 }], cam: (k) => { const a = Math.PI / 2 + side * (0.9 - k * 0.7); const s = sh.B.size || 1; return { eye: [Math.cos(a) * (2.6 - k * 0.5) * s, 1.3 * s, Math.sin(a) * (2.6 - k * 0.5) * s], at: [0, 1.1 * s, 0], fov: 0.6 }; }, name: def.name.toUpperCase(), style: def.style, state: 'win' });
      }
      this.music = 'title';
      this.endText = 'TEKKEN 3';
    }

    buildCredits() {
      this.credits = true;
      this.music = 'credits';
      const rows = [['TEKKEN 3', 'h'], ['WIN 98 EDITION', 's'], ['', ''], ['БОЙЦЫ', 'h']];
      for (const d of T.rosterOrder()) rows.push([`${d.name} — ${d.style}`, 'n']);
      rows.push(['', ''], ['АРЕНЫ', 'h']);
      for (const s of T.STAGES) rows.push([s.name, 'n']);
      rows.push(['', ''], ['РЕЖИМЫ', 'h'], ['Аркада · Бой вдвоём · Командный бой · На время', 'n'], ['Выживание · Тренировка · Штурм «Курогане» · Пляжный мяч', 'n'], ['', ''], ['СПАСИБО ЗА ИГРУ!', 'h']);
      this.rows = rows;
      this.shots.push({ dur: 60 * 22 });
    }

    enter() { this.ui.audio.music(this.music); this.next(); }

    next() {
      this.cur++;
      this.st = 0;
      const s = this.shots[this.cur];
      if (!s) { this.done = true; this.doneT = 0; return; }
      if (s.stage) { this.ui.scene.setStage(s.stage); this.ui.scene.parts.length = 0; }
    }

    step() {
      this.t++;
      if (this.done) { if (++this.doneT > 120) this.a.onDone(); return; }
      this.st++;
      const s = this.shots[this.cur];
      if (s.items) for (const it of s.items) T.tickShow(it.sh, s.state);
      if (s.stage) { T.ambientTick(this.ui.scene, s.stage, this.ui.scene.cam || { at: [0, 1, 0] }, this.ui.clock); this.ui.scene.tickParts(); }
      if (this.st >= s.dur) this.next();
    }

    input(a) {
      if (a === 'ok' || a === 'start') { if (this.credits || this.done) this.a.onDone(); else this.next(); }
      if (a === 'back') this.a.onDone();
    }

    click() { this.input('ok'); }

    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      if (this.done) {
        ui.clearGL([0, 0, 0]);
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        g.globalAlpha = clamp(this.doneT / 30, 0, 1) * clamp((120 - this.doneT) / 20, 0, 1);
        ui.text(this.endText, W / 2, H / 2, 44 * S, '#ffe040', 'center', FONT_H, { italic: true });
        g.globalAlpha = 1;
        return;
      }
      const s = this.shots[this.cur];
      if (this.credits) {
        ui.clearGL([0, 0, 0]);
        ui.bg('gold');
        const y0 = H - this.st * 0.9 * S;
        this.rows.forEach(([txt, k], i) => {
          const y = y0 + i * 34 * S;
          if (y < -40 || y > H + 40) return;
          ui.text(txt, W / 2, y, (k === 'h' ? 26 : k === 's' ? 18 : 15) * S, k === 'h' ? '#ffe040' : '#eee', 'center', k === 'n' ? FONT_T : FONT_H, { italic: k !== 'n', weight: 'bold', stroke: 3 });
        });
        return;
      }
      const k = clamp(this.st / s.dur, 0, 1);
      const items = s.items.map(it => T.showItem(it.sh, it.pos, it.yaw));
      ui.fighterView(items, s.cam(k), s.stage);
      const fade = Math.min(1, this.st / 25, (s.dur - this.st) / 25);
      g.fillStyle = `rgba(0,0,0,${1 - clamp(fade, 0, 1)})`; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(0, 0, W, H * 0.09); g.fillRect(0, H * 0.84, W, H * 0.16);
      if (s.text) {
        g.globalAlpha = clamp(fade, 0, 1);
        ui.wrap(s.text, W * 0.12, H * 0.89, W * 0.76, 16 * S, '#f0f0e0', 20 * S);
        g.globalAlpha = 1;
        if (this.title && this.cur === 0) ui.text(this.title, 24 * S, H * 0.06, 18 * S, '#e8a430', 'left', FONT_H, { italic: true });
      }
      if (s.name) {
        const a = clamp((this.st - 15) / 15, 0, 1);
        g.globalAlpha = a * clamp(fade, 0, 1);
        ui.text(s.name, W * 0.08, H * 0.74, 44 * S, '#fff', 'left', FONT_H, { italic: true, stroke: 6 });
        ui.text(s.style, W * 0.08, H * 0.79, 18 * S, '#e8a430', 'left', FONT_H, { italic: true, stroke: 4 });
        g.globalAlpha = 1;
      }
    }
  }

  SCREENS.cine = Cine;
  Object.assign(T, { ENDINGS });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
