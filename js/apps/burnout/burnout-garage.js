/**
 * Burnout: Championship Drag Racing - Garage & Dyno Tuning Module
 * Allows deep tuning of engine boost, gear ratios, tire pressure, launch limiter,
 * and live plotting of Horsepower and Torque Dyno curves.
 */

class BurnoutGarage {
  constructor(physics) {
    this.physics = physics;
    this.storageKey = 'win98_burnout_tuning';
    this.loadTuning();
  }

  loadTuning() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(this.physics.setup, parsed);
      }
    } catch (e) {}
  }

  saveTuning() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.physics.setup));
    } catch (e) {}
  }

  resetToDefault() {
    this.physics.setup = {
      carName: '1969 Chevy Chevelle SS 540 Blown',
      engineCID: 540,
      baseHP: 1650,
      baseTorque: 1350,
      revLimiter: 8200,
      idleRpm: 1100,
      launchRpm: 5500,
      blowerBoostPsi: 24,
      tirePressurePsi: 16,
      tireCompound: 'Soft Slicks',
      wheelieBarHeight: 'Medium',
      nitrousShotHP: 250,
      hasNitrous: true,
      gearRatios: [2.65, 1.85, 1.34, 1.00],
      finalDrive: 4.10,
      weightLbs: 2750
    };
    this.saveTuning();
  }

  renderGarageHTML() {
    const s = this.physics.setup;

    return `
      <div class="burnout-garage-container">
        <!-- Header -->
        <div class="burnout-garage-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:24px;">🔧</div>
            <div>
              <div style="font-family:'Arial Black', Impact; font-size:16px; color:#f1c40f;">МАСТЕРСКАЯ И ГАРАЖ ТЮНИНГА</div>
              <div style="font-size:11px; color:#aaa;">Bethesda Softworks & Hot Rod Magazine Tuning Shop (1998)</div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="win-btn" id="btn_garage_reset" style="padding:2px 10px;">Сброс</button>
            <button class="win-btn" id="btn_garage_save" style="font-weight:bold; padding:2px 14px;">Сохранить</button>
          </div>
        </div>

        <div class="burnout-garage-body">
          <!-- Left Column: Sliders and Tuning controls -->
          <div class="burnout-tuning-controls">
            <!-- Engine & Supercharger Group -->
            <fieldset class="burnout-fieldset">
              <legend>Двигатель и Нагнетатель</legend>
              <div class="burnout-param-row">
                <label>Давление наддува (Blower Boost):</label>
                <div class="burnout-slider-wrap">
                  <input type="range" id="tune_boost" min="15" max="35" step="1" value="${s.blowerBoostPsi}">
                  <span id="val_boost" class="burnout-val">${s.blowerBoostPsi} PSI</span>
                </div>
              </div>
              <div class="burnout-param-row">
                <label>Лаунч-контроль (Launch RPM):</label>
                <div class="burnout-slider-wrap">
                  <input type="range" id="tune_launch_rpm" min="4000" max="7200" step="100" value="${s.launchRpm}">
                  <span id="val_launch_rpm" class="burnout-val">${s.launchRpm} RPM</span>
                </div>
              </div>
              <div class="burnout-param-row">
                <label>Закись азота (Nitrous Jet Shot):</label>
                <select id="tune_nitrous" class="win-select" style="font-size:11px;">
                  <option value="150" ${s.nitrousShotHP === 150 ? 'selected' : ''}>+150 HP (Street Shot)</option>
                  <option value="250" ${s.nitrousShotHP === 250 ? 'selected' : ''}>+250 HP (Pro Mod Shot)</option>
                  <option value="350" ${s.nitrousShotHP === 350 ? 'selected' : ''}>+350 HP (Monster Blast)</option>
                </select>
              </div>
            </fieldset>

            <!-- Transmission & Gearing Group -->
            <fieldset class="burnout-fieldset">
              <legend>Трансмиссия (Передаточные числа)</legend>
              <div class="burnout-param-row">
                <label>1-я передача:</label>
                <div class="burnout-slider-wrap">
                  <input type="range" id="tune_gear1" min="2.20" max="3.20" step="0.05" value="${s.gearRatios[0]}">
                  <span id="val_gear1" class="burnout-val">${s.gearRatios[0].toFixed(2)}</span>
                </div>
              </div>
              <div class="burnout-param-row">
                <label>2-я передача:</label>
                <div class="burnout-slider-wrap">
                  <input type="range" id="tune_gear2" min="1.60" max="2.20" step="0.05" value="${s.gearRatios[1]}">
                  <span id="val_gear2" class="burnout-val">${s.gearRatios[1].toFixed(2)}</span>
                </div>
              </div>
              <div class="burnout-param-row">
                <label>3-я передача:</label>
                <div class="burnout-slider-wrap">
                  <input type="range" id="tune_gear3" min="1.20" max="1.60" step="0.05" value="${s.gearRatios[2]}">
                  <span id="val_gear3" class="burnout-val">${s.gearRatios[2].toFixed(2)}</span>
                </div>
              </div>
              <div class="burnout-param-row">
                <label>Главная пара (Final Drive):</label>
                <div class="burnout-slider-wrap">
                  <input type="range" id="tune_final" min="3.55" max="4.88" step="0.05" value="${s.finalDrive}">
                  <span id="val_final" class="burnout-val">${s.finalDrive.toFixed(2)}</span>
                </div>
              </div>
            </fieldset>

            <!-- Chassis & Tires Group -->
            <fieldset class="burnout-fieldset">
              <legend>Шасси, Слики и Вилли-бар</legend>
              <div class="burnout-param-row">
                <label>Давление в шинах (Cold PSI):</label>
                <div class="burnout-slider-wrap">
                  <input type="range" id="tune_psi" min="12" max="24" step="1" value="${s.tirePressurePsi}">
                  <span id="val_psi" class="burnout-val">${s.tirePressurePsi} PSI</span>
                </div>
              </div>
              <div class="burnout-param-row">
                <label>Высота упоров Wheelie Bar:</label>
                <select id="tune_wheelie" class="win-select" style="font-size:11px;">
                  <option value="Low" ${s.wheelieBarHeight === 'Low' ? 'selected' : ''}>Низко (Минимум отрыва морды)</option>
                  <option value="Medium" ${s.wheelieBarHeight === 'Medium' ? 'selected' : ''}>Средне (Оптимальный перенос веса)</option>
                  <option value="High" ${s.wheelieBarHeight === 'High' ? 'selected' : ''}>Высоко (Драматичный вилли)</option>
                </select>
              </div>
            </fieldset>
          </div>

          <!-- Right Column: Live Dyno Chart and Stats -->
          <div class="burnout-dyno-panel">
            <div style="font-family:'Arial Black'; font-size:12px; color:#00ffcc; margin-bottom:6px;">
              ДИНОСТЕНД (DYNO POWER CURVE)
            </div>
            <div class="burnout-dyno-canvas-wrap">
              <canvas id="burnout_dyno_canvas" width="340" height="210"></canvas>
            </div>

            <!-- Dyno Numbers Readout -->
            <div class="burnout-dyno-stats">
              <div class="burnout-stat-box">
                <div class="burnout-stat-label">ПИКОВАЯ МОЩНОСТЬ:</div>
                <div class="burnout-stat-value hp" id="dyno_peak_hp">--- HP</div>
              </div>
              <div class="burnout-stat-box">
                <div class="burnout-stat-label">КРУТЯЩИЙ МОМЕНТ:</div>
                <div class="burnout-stat-value tq" id="dyno_peak_tq">--- LB-FT</div>
              </div>
              <div class="burnout-stat-box">
                <div class="burnout-stat-label">РАСЧЕТНОЕ 1/4 МИЛИ:</div>
                <div class="burnout-stat-value et" id="dyno_est_et">~6.8 сек @ 205 MPH</div>
              </div>
            </div>

            <!-- Car Specs summary -->
            <div class="burnout-car-summary">
              <b>Автомобиль:</b> ${s.carName}<br>
              <b>Двигатель:</b> 540ci Big Block V8 Supercharged<br>
              <b>Топливо:</b> Метанол + Октановый бустер<br>
              <b>Снаряженная масса:</b> 2,750 фунтов (~1247 кг)
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents(container, onTuningChanged) {
    const s = this.physics.setup;

    const bindSlider = (id, targetProp, valId, unit = '', isFloat = false) => {
      const input = container.querySelector(id);
      const valEl = container.querySelector(valId);
      if (!input) return;

      input.addEventListener('input', (e) => {
        const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        if (Array.isArray(targetProp)) {
          s[targetProp[0]][targetProp[1]] = val;
        } else {
          s[targetProp] = val;
        }
        if (valEl) valEl.textContent = isFloat ? `${val.toFixed(2)}${unit}` : `${val}${unit}`;
        this.drawDynoCurve(container);
        if (onTuningChanged) onTuningChanged();
      });
    };

    bindSlider('#tune_boost', 'blowerBoostPsi', '#val_boost', ' PSI');
    bindSlider('#tune_launch_rpm', 'launchRpm', '#val_launch_rpm', ' RPM');
    bindSlider('#tune_gear1', ['gearRatios', 0], '#val_gear1', '', true);
    bindSlider('#tune_gear2', ['gearRatios', 1], '#val_gear2', '', true);
    bindSlider('#tune_gear3', ['gearRatios', 2], '#val_gear3', '', true);
    bindSlider('#tune_final', 'finalDrive', '#val_final', '', true);
    bindSlider('#tune_psi', 'tirePressurePsi', '#val_psi', ' PSI');

    const nitrousSel = container.querySelector('#tune_nitrous');
    if (nitrousSel) {
      nitrousSel.addEventListener('change', (e) => {
        s.nitrousShotHP = parseInt(e.target.value, 10);
        this.drawDynoCurve(container);
      });
    }

    const wheelieSel = container.querySelector('#tune_wheelie');
    if (wheelieSel) {
      wheelieSel.addEventListener('change', (e) => {
        s.wheelieBarHeight = e.target.value;
      });
    }

    const btnReset = container.querySelector('#btn_garage_reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.resetToDefault();
        container.innerHTML = this.renderGarageHTML();
        this.bindEvents(container, onTuningChanged);
        this.drawDynoCurve(container);
      });
    }

    const btnSave = container.querySelector('#btn_garage_save');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveTuning();
        if (window.soundSys) window.soundSys.playDing();
      });
    }

    this.drawDynoCurve(container);
  }

  drawDynoCurve(container) {
    const canvas = container.querySelector('#burnout_dyno_canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1b2a47';
    ctx.lineWidth = 1;
    // Horizontal grid lines
    for (let y = 20; y < h - 25; y += 30) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }
    // Vertical grid lines (RPM 2000 to 8000)
    for (let x = 35; x <= w - 10; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, h - 25);
      ctx.stroke();
    }

    // Grid labels
    ctx.fillStyle = '#6b7c96';
    ctx.font = '8px Tahoma';
    ctx.textAlign = 'right';
    ctx.fillText('2000', 30, 35);
    ctx.fillText('1500', 30, 85);
    ctx.fillText('1000', 30, 135);
    ctx.fillText('500', 30, 185);

    ctx.textAlign = 'center';
    ctx.fillText('2k', 35, h - 12);
    ctx.fillText('4k', 125, h - 12);
    ctx.fillText('6k', 215, h - 12);
    ctx.fillText('8k', 305, h - 12);
    ctx.fillText('RPM', w - 15, h - 12);

    // Calculate Peak HP and Torque based on boost & nitrous
    const s = this.physics.setup;
    const boostMult = 1 + (s.blowerBoostPsi - 15) * 0.025;
    const peakHP = Math.floor(s.baseHP * boostMult + s.nitrousShotHP);
    const peakTorque = Math.floor(s.baseTorque * boostMult + s.nitrousShotHP * 0.85);

    // Update numbers readout
    const hpEl = container.querySelector('#dyno_peak_hp');
    const tqEl = container.querySelector('#dyno_peak_tq');
    const etEl = container.querySelector('#dyno_est_et');
    if (hpEl) hpEl.textContent = `${peakHP} HP`;
    if (tqEl) tqEl.textContent = `${peakTorque} LB-FT`;
    if (etEl) {
      const estTime = Math.max(6.1, (7.8 - (peakHP / 2000) * 0.9)).toFixed(2);
      const estMph = Math.min(235, Math.floor(180 + (peakHP / 2000) * 45));
      etEl.textContent = `~${estTime} сек @ ${estMph} MPH`;
    }

    // 1. Draw Torque Curve (Blue line)
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let r = 2000; r <= 8500; r += 200) {
      const x = 35 + ((r - 2000) / 6500) * (w - 50);
      const curve = Math.sin(((r - 1800) / 6700) * Math.PI);
      const val = peakTorque * Math.max(0.4, curve);
      const y = (h - 25) - (val / 2200) * (h - 50);

      if (r === 2000) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Draw Horsepower Curve (Red/Orange line)
    ctx.strokeStyle = '#ff3300';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let r = 2000; r <= 8500; r += 200) {
      const x = 35 + ((r - 2000) / 6500) * (w - 50);
      const curve = Math.sin(((r - 1500) / 8000) * (Math.PI * 0.85));
      const val = peakHP * Math.max(0.3, curve);
      const y = (h - 25) - (val / 2200) * (h - 50);

      if (r === 2000) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dyno Legend
    ctx.font = 'bold 9px Tahoma';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff3300';
    ctx.fillText('■ МОЩНОСТЬ (HP)', 45, 14);
    ctx.fillStyle = '#00d2ff';
    ctx.fillText('■ МОМЕНТ (LB-FT)', 160, 14);
  }
}

window.BurnoutGarage = BurnoutGarage;

