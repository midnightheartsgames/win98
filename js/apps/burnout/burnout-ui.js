/**
 * Burnout: Championship Drag Racing - UI, Menus & Time Slip System
 * Renders main menu, controls dialog, and authentic paper Time Slip results.
 */

class BurnoutUI {
  constructor(app, physics, audio) {
    this.app = app;
    this.physics = physics;
    this.audio = audio;
  }

  renderTitleScreenHTML() {
    return `
      <div class="burnout-title-screen">
        <!-- Bethesda & Hot Rod Header -->
        <div class="burnout-title-logos">
          <div class="burnout-logo-badge bethesda">BETHESDA SOFTWORKS</div>
          <div class="burnout-logo-badge hotrod">HOT ROD MAGAZINE</div>
          <div class="burnout-logo-badge mediatech">MEDIATECH WEST</div>
        </div>

        <!-- Main Fiery Title -->
        <div class="burnout-title-hero">
          <div class="burnout-title-sub">CHAMPIONSHIP DRAG RACING</div>
          <div class="burnout-title-main">BURNOUT</div>
          <div class="burnout-title-edition">PLAYER'S CHOICE EDITION &bull; ДЕМО-ВЕРСИЯ ДИСКА «ИГРОМАНИЯ»</div>
        </div>

        <!-- Menu Buttons List -->
        <div class="burnout-main-menu">
          <button class="burnout-menu-btn" id="btn_menu_race">
            <span class="burnout-btn-icon">🏁</span>
            <span class="burnout-btn-text">
              <strong>БЫСТРАЯ ГОНКА (QUICK RACE)</strong>
              <small>Дуэль против соперника в соседней полосе</small>
            </span>
          </button>

          <button class="burnout-menu-btn" id="btn_menu_test">
            <span class="burnout-btn-icon">⏱️</span>
            <span class="burnout-btn-text">
              <strong>ТЕСТОВЫЙ ЗАЕЗД (SOLO TEST RUN)</strong>
              <small>Одиночный заезд на 1/4 мили для снятия телеметрии</small>
            </span>
          </button>

          <button class="burnout-menu-btn" id="btn_menu_garage">
            <span class="burnout-btn-icon">🔧</span>
            <span class="burnout-btn-text">
              <strong>МАСТЕРСКАЯ И ГАРАЖ (GARAGE & DYNO)</strong>
              <small>Тюнинг КПП, наддува, давления в сликах и диностенд</small>
            </span>
          </button>

          <button class="burnout-menu-btn" id="btn_menu_help">
            <span class="burnout-btn-icon">📖</span>
            <span class="burnout-btn-text">
              <strong>КАК ИГРАТЬ (УПРАВЛЕНИЕ И ПРАВИЛА)</strong>
              <small>Светофор Christmas Tree, прогрев резины, фальстарт</small>
            </span>
          </button>
        </div>

        <!-- Footer Copyright -->
        <div class="burnout-title-footer">
          &copy; 1998 Bethesda Softworks & MediaTech West. Licensed by Petersen Publishing Company. All Rights Reserved.
        </div>
      </div>
    `;
  }

  renderTimeSlipHTML(slip) {
    if (!slip) return '';

    const p = slip.player;
    const r = slip.rival;

    return `
      <div class="burnout-timeslip-overlay">
        <div class="burnout-timeslip-paper">
          <!-- Track Header -->
          <div class="timeslip-header">
            <div class="timeslip-track">${slip.trackName}</div>
            <div class="timeslip-date">${slip.date}</div>
            <div class="timeslip-divider">================================</div>
          </div>

          <!-- Lanes Comparison Table -->
          <table class="timeslip-table">
            <thead>
              <tr>
                <th style="width:35%;">ПАРАМЕТР</th>
                <th style="width:32.5%; color:#c0392b;">ЛЕВАЯ (ВЫ)</th>
                <th style="width:32.5%; color:#2980b9;">ПРАВАЯ (AI)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R/T (Реакция)</td>
                <td class="${p.isFoul ? 'foul' : ''}">${p.rt} ${p.isFoul ? 'FOUL' : ''}</td>
                <td class="${r.isFoul ? 'foul' : ''}">${r.rt}</td>
              </tr>
              <tr>
                <td>60 FT</td>
                <td>${p.t60}</td>
                <td>${r.t60}</td>
              </tr>
              <tr>
                <td>330 FT</td>
                <td>${p.t330}</td>
                <td>${r.t330}</td>
              </tr>
              <tr>
                <td>1/8 ET (сек)</td>
                <td>${p.t660}</td>
                <td>${r.t660}</td>
              </tr>
              <tr>
                <td>1/8 MPH</td>
                <td>${p.mph660}</td>
                <td>${r.mph660}</td>
              </tr>
              <tr>
                <td>1000 FT</td>
                <td>${p.t1000}</td>
                <td>${r.t1000}</td>
              </tr>
              <tr class="highlight">
                <td>1/4 ET (Итог)</td>
                <td class="bold">${p.t1320}</td>
                <td class="bold">${r.t1320}</td>
              </tr>
              <tr class="highlight">
                <td>1/4 MPH</td>
                <td class="bold">${p.mph1320}</td>
                <td class="bold">${r.mph1320}</td>
              </tr>
            </tbody>
          </table>

          <div class="timeslip-divider">================================</div>

          <!-- WIN / LOSE Rubber Stamp -->
          <div class="timeslip-stamp ${p.isWinner ? 'win' : 'lose'}">
            ${p.isFoul ? 'ДИСКВАЛИФИКАЦИЯ' : (p.isWinner ? 'ПОБЕДИТЕЛЬ!' : 'ВТОРОЕ МЕСТО')}
          </div>

          <!-- Action buttons -->
          <div class="timeslip-actions">
            <button class="win-btn" id="btn_slip_replay" style="font-weight:bold; padding:4px 14px;">Заехать ещё раз</button>
            <button class="win-btn" id="btn_slip_garage" style="padding:4px 10px;">В гараж</button>
            <button class="win-btn" id="btn_slip_menu" style="padding:4px 10px;">Меню</button>
          </div>
        </div>
      </div>
    `;
  }

  renderHelpHTML() {
    return `
      <div class="burnout-help-dialog">
        <div style="font-family:'Arial Black'; font-size:14px; color:#c0392b; margin-bottom:8px;">
          РУКОВОДСТВО ПИЛОТА: BURNOUT DRAG RACING
        </div>

        <div class="burnout-help-content">
          <h4>1. Прогрев резины (Water Box & Burnout)</h4>
          <p>
            Перед заездом удерживайте <b>[Пробел]</b> (газ) и <b>[B]</b> (Line-Lock / стояночный тормоз передних колес). 
            Задние слики начнут шлифовать мокрый асфальт, полетит дым! Следите за прибором температуры шин: 
            идеальная температура для старта — <b>180°F - 230°F (зеленая зона)</b>.
          </p>

          <h4>2. Подкатка к светофору (Staging)</h4>
          <p>
            После прогрева плавно нажмите <b>[Вверх]</b> или <b>[W]</b>, чтобы подкрасться к стартовой черте:
            <br>&bull; Загорится верхний белый луч <b>Pre-Stage</b>.
            <br>&bull; Продвиньтесь ещё на 2 фута — загорится нижний белый луч <b>Stage</b>.
            <br>Остановитесь! Начнется обратный отсчет светофора Christmas Tree.
          </p>

          <h4>3. Стартовый светофор (Christmas Tree)</h4>
          <p>
            Загораются 3 жёлтых огня с интервалом 0.5 секунды. Стартуйте в момент зажигания <b>ЗЕЛЁНОГО</b> огня!
            <br><span style="color:#c0392b; font-weight:bold;">Внимание:</span> старт до зелёного — это фальстарт (Red Light) и мгновенный проигрыш!
          </p>

          <h4>4. Управление в гонке</h4>
          <table style="width:100%; font-size:11px; margin:6px 0; border-collapse:collapse;">
            <tr><td style="width:40%;"><b>[Пробел] или [W] / [Вверх]</b></td><td>Газ (Throttle)</td></tr>
            <tr><td><b>[S] или [Вниз]</b></td><td>Тормоз (Brakes)</td></tr>
            <tr><td><b>[Shift] или [Z]</b></td><td>Передача ВВЕРХ (Shift Up по тахометру!)</td></tr>
            <tr><td><b>[Ctrl] или [X]</b></td><td>Передача ВНИЗ (Shift Down)</td></tr>
            <tr><td><b>[B]</b></td><td>Line-Lock (Блокировка передних тормозов для бернаута)</td></tr>
            <tr><td><b>[N]</b></td><td>Закись азота (Nitrous Oxide N2O Boost)</td></tr>
            <tr><td><b>[P]</b></td><td>Выпуск тормозного парашюта (Parachute)</td></tr>
            <tr><td><b>[C]</b></td><td>Переключение камеры (Кабина / Позади)</td></tr>
          </table>
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:12px;">
          <button class="win-btn" id="btn_close_help" style="padding:4px 18px; font-weight:bold;">Понятно</button>
        </div>
      </div>
    `;
  }
}

window.BurnoutUI = BurnoutUI;

