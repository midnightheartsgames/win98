/**
 * Burnout: Championship Drag Racing - Canvas 2D/Pseudo-3D Track & Car Renderer
 * Renders authentic 1998 software-rasterized drag strip, Christmas Tree,
 * supercharged muscle cars, burnout smoke particles, flames, chutes, and Autometer HUD.
 */

class BurnoutRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Camera modes: 'cockpit', 'chase', 'trackside'
    this.cameraMode = 'cockpit';

    // Particle pool for burnout smoke and exhaust flames
    this.particles = [];
    this.maxParticles = 180;

    // Shift light flash timer
    this.shiftLightFlash = 0;
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  render(physics, dt) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    // Compute active camera 3D projection parameters
    const proj = this.getTrackProjection(physics, w, h);

    // 1. Draw Horizon & Sky
    this.drawSky(w, h, proj);

    // 2. Draw 3D Track & Scenery
    this.drawTrack(physics, w, h, proj);

    // 3. Draw Christmas Tree
    this.drawChristmasTree(physics, w, h, proj);

    // 4. Update and draw particles (smoke, flames)
    this.updateParticles(physics, dt, proj, w, h);
    this.drawParticles();

    // 5. Draw Cars (Player & Rival)
    this.drawCars(physics, w, h, proj);

    // 6. Draw Dashboard / Cockpit HUD & Instruments
    this.drawHUD(physics, w, h, dt);
  }

  getTrackProjection(physics, w, h) {
    const isCockpit = (this.cameraMode === 'cockpit');
    const p = physics.player;

    if (isCockpit) {
      // Cockpit View: Low-slung driver perspective from inside the left lane
      // Dynamic chassis pitch: front lifts under acceleration (wheelie), dips under heavy braking
      const pitchOffset = -(p.wheelieAngle * 2.2) + (p.brake * 3.5);
      const horizonY = Math.round(h * 0.44 + pitchOffset);

      // In cockpit, player looks straight down their own lane (Left lane)
      const vpX = w * 0.5; // Left lane vanishing point in screen center

      // Left lane width in perspective
      const laneTopW = w * 0.16;
      const laneBotW = w * 0.76;

      // Left outer barrier (close to driver)
      const leftTopX = vpX - laneTopW * 0.5; // ~ w * 0.42
      const leftBotX = vpX - laneBotW * 0.5; // ~ w * 0.12

      // Center divider (yellow line, to the RIGHT of player's hood!)
      const centerTopX = vpX + laneTopW * 0.5; // ~ w * 0.58
      const centerBotX = vpX + laneBotW * 0.5; // ~ w * 0.88

      // Right outer barrier (outer edge of rival lane)
      const rightTopX = vpX + laneTopW * 1.5; // ~ w * 0.74
      const rightBotX = vpX + laneBotW * 1.5; // ~ w * 1.64

      // Rival lane center (for rival car)
      const rivalLaneTopX = vpX + laneTopW; // ~ w * 0.66
      const rivalLaneBotX = vpX + laneBotW; // ~ w * 1.26

      return {
        isCockpit: true,
        horizonY,
        vpX,
        leftTopX,
        leftBotX,
        centerTopX,
        centerBotX,
        rightTopX,
        rightBotX,
        rivalLaneTopX,
        rivalLaneBotX,
        playerLaneTopX: vpX,
        playerLaneBotX: vpX,
        laneTopW,
        laneBotW
      };
    } else {
      // Chase View: Elevated boom behind both cars centered on the track
      const horizonY = Math.round(h * 0.42);
      const vpX = w * 0.5;
      const trackTopW = w * 0.14;
      const trackBotW = w * 0.94;

      const leftTopX = vpX - trackTopW * 0.5; // w * 0.43
      const leftBotX = vpX - trackBotW * 0.5; // w * 0.03

      const centerTopX = vpX;
      const centerBotX = vpX;

      const rightTopX = vpX + trackTopW * 0.5; // w * 0.57
      const rightBotX = vpX + trackBotW * 0.5; // w * 0.97

      const playerLaneTopX = vpX - trackTopW * 0.25;
      const playerLaneBotX = vpX - trackBotW * 0.25;

      const rivalLaneTopX = vpX + trackTopW * 0.25;
      const rivalLaneBotX = vpX + trackBotW * 0.25;

      return {
        isCockpit: false,
        horizonY,
        vpX,
        leftTopX,
        leftBotX,
        centerTopX,
        centerBotX,
        rightTopX,
        rightBotX,
        rivalLaneTopX,
        rivalLaneBotX,
        playerLaneTopX,
        playerLaneBotX,
        trackTopW,
        trackBotW
      };
    }
  }

  drawSky(w, h, proj) {
    const ctx = this.ctx;
    const horizonY = proj.horizonY;

    // 1998 Dusk/Sunset dragway gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#0a192f');
    skyGrad.addColorStop(0.5, '#203a43');
    skyGrad.addColorStop(0.85, '#d35400');
    skyGrad.addColorStop(1.0, '#e67e22');

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Distant mountain silhouettes / tree line
    ctx.fillStyle = '#1c2833';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= w; x += 40) {
      const my = horizonY - 12 - Math.sin(x * 0.02) * 10 - Math.cos(x * 0.05) * 6;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // Stadium floodlights glowing against twilight sky
    this.drawStadiumLights(w, horizonY);
  }

  drawStadiumLights(w, horizonY) {
    const ctx = this.ctx;
    const lightPositions = [w * 0.12, w * 0.28, w * 0.72, w * 0.88];

    lightPositions.forEach(lx => {
      // Light tower pole
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, horizonY);
      ctx.lineTo(lx, horizonY - 70);
      ctx.stroke();

      // Light rack crossbar
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(lx - 12, horizonY - 72, 24, 4);

      // Halogen bulbs with glow
      for (let b = -10; b <= 10; b += 7) {
        ctx.fillStyle = '#fffdf0';
        ctx.beginPath();
        ctx.arc(lx + b, horizonY - 74, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Halogen light beam flare
      const flareGrad = ctx.createRadialGradient(lx, horizonY - 74, 2, lx, horizonY - 74, 40);
      flareGrad.addColorStop(0, 'rgba(255, 255, 220, 0.4)');
      flareGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(lx, horizonY - 74, 40, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawTrack(physics, w, h, proj) {
    const ctx = this.ctx;
    const horizonY = proj.horizonY;

    // Ground / Grass outside track
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Track asphalt trapezoid
    ctx.fillStyle = '#222225'; // Dark rubbered asphalt
    ctx.beginPath();
    ctx.moveTo(proj.leftTopX, horizonY);
    ctx.lineTo(proj.rightTopX, horizonY);
    ctx.lineTo(proj.rightBotX, h);
    ctx.lineTo(proj.leftBotX, h);
    ctx.closePath();
    ctx.fill();

    // Center divider barrier / timing sensors line (yellow)
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(proj.centerTopX, horizonY);
    ctx.lineTo(proj.centerBotX, h);
    ctx.stroke();

    // Left and Right outer white boundary lines
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(proj.leftTopX, horizonY);
    ctx.lineTo(proj.leftBotX, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(proj.rightTopX, horizonY);
    ctx.lineTo(proj.rightBotX, h);
    ctx.stroke();

    // Rubber groove burnout tire marks on left and right lanes
    this.drawRubberGrooves(proj, h);

    // Concrete safety barriers & Sponsor Billboards along track
    this.drawGuardrailsAndBillboards(physics, w, h, proj);

    // Distance markers (60ft, 330ft, 660ft, 1000ft, 1320ft Finish line gantry)
    this.drawDistanceMarkers(physics, w, h, proj);
  }

  drawRubberGrooves(proj, h) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 10, 12, 0.45)';

    // Left lane grooves
    const pTop = (proj.leftTopX + proj.centerTopX) * 0.5;
    const pBot = (proj.leftBotX + proj.centerBotX) * 0.5;
    const pWTop = (proj.centerTopX - proj.leftTopX) * 0.18;
    const pWBot = (proj.centerBotX - proj.leftBotX) * 0.18;

    ctx.beginPath();
    ctx.moveTo(pTop - pWTop, proj.horizonY);
    ctx.lineTo(pTop - pWTop * 0.3, proj.horizonY);
    ctx.lineTo(pBot - pWBot * 0.3, h);
    ctx.lineTo(pBot - pWBot, h);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pTop + pWTop * 0.3, proj.horizonY);
    ctx.lineTo(pTop + pWTop, proj.horizonY);
    ctx.lineTo(pBot + pWBot, h);
    ctx.lineTo(pBot + pWBot * 0.3, h);
    ctx.fill();

    // Right lane grooves
    const rTop = (proj.centerTopX + proj.rightTopX) * 0.5;
    const rBot = (proj.centerBotX + proj.rightBotX) * 0.5;
    const rWTop = (proj.rightTopX - proj.centerTopX) * 0.18;
    const rWBot = (proj.rightBotX - proj.centerBotX) * 0.18;

    ctx.beginPath();
    ctx.moveTo(rTop - rWTop, proj.horizonY);
    ctx.lineTo(rTop - rWTop * 0.3, proj.horizonY);
    ctx.lineTo(rBot - rWBot * 0.3, h);
    ctx.lineTo(rBot - rWBot, h);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rTop + rWTop * 0.3, proj.horizonY);
    ctx.lineTo(rTop + rWTop, proj.horizonY);
    ctx.lineTo(rBot + rWBot, h);
    ctx.lineTo(rBot + rWBot * 0.3, h);
    ctx.fill();
  }

  drawGuardrailsAndBillboards(physics, w, h, proj) {
    const ctx = this.ctx;
    const playerPos = physics.player.pos;

    // 1. Draw continuous 3D Concrete Barriers (Jersey Barriers) along track edges
    this.drawConcreteBarriers(proj.leftTopX, proj.leftBotX, proj.rightTopX, proj.rightBotX, proj.horizonY, w, h);

    // 2. Discrete Billboard Positions along the 1/4 mile dragstrip
    const billboardWorldList = [
      { pos: 60, sponsor: 'hotrod' },
      { pos: 180, sponsor: 'bethesda' },
      { pos: 340, sponsor: 'autometer' },
      { pos: 520, sponsor: 'mickey' },
      { pos: 720, sponsor: 'igromania' },
      { pos: 940, sponsor: 'valvoline' },
      { pos: 1140, sponsor: 'hotrod' },
      { pos: 1340, sponsor: 'bethesda' },
      { pos: 1560, sponsor: 'autometer' }
    ];

    // Collect visible billboards
    const visibleBillboards = [];
    billboardWorldList.forEach(b => {
      const relDist = b.pos - playerPos;
      // Show only if in front of camera (15ft to 650ft)
      if (relDist >= 15 && relDist <= 650) {
        const factor = Math.max(0.04, 1 - (relDist / 650));
        const scale = factor * factor;
        const y = proj.horizonY + (h - proj.horizonY) * scale;
        const pT = Math.max(0, Math.min(1, (y - proj.horizonY) / (h - proj.horizonY)));

        const lxBoundary = proj.leftTopX + (proj.leftBotX - proj.leftTopX) * pT;
        const rxBoundary = proj.rightTopX + (proj.rightBotX - proj.rightTopX) * pT;

        visibleBillboards.push({
          pos: b.pos,
          relDist: relDist,
          scale: factor,
          y: y,
          lxBoundary: lxBoundary,
          rxBoundary: rxBoundary,
          sponsor: b.sponsor
        });
      }
    });

    // Sort by distance: farthest first, nearest last
    visibleBillboards.sort((a, b) => b.relDist - a.relDist);

    // Draw each billboard pair (Left & Right of track)
    visibleBillboards.forEach(b => {
      const bW = Math.max(22, 110 * b.scale);
      const bH = Math.max(14, 55 * b.scale);

      // Left billboard (outside left barrier)
      const lx = b.lxBoundary - (15 + 40 * b.scale) - bW;
      this.drawSingleBillboard(lx, b.y, bW, bH, b.scale, b.sponsor, true);

      // Right billboard (outside right barrier)
      const rx = b.rxBoundary + (15 + 40 * b.scale);
      this.drawSingleBillboard(rx, b.y, bW, bH, b.scale, b.sponsor, false);
    });
  }

  drawConcreteBarriers(lxTop, lxBot, rxTop, rxBot, horizonY, w, h) {
    const ctx = this.ctx;
    const barrierH = 16; // Height of concrete wall in perspective

    // Left barrier side face (dark grey concrete)
    ctx.fillStyle = '#4a4d52';
    ctx.beginPath();
    ctx.moveTo(lxTop, horizonY);
    ctx.lineTo(lxTop, horizonY - 4);
    ctx.lineTo(lxBot, h - barrierH);
    ctx.lineTo(lxBot, h);
    ctx.closePath();
    ctx.fill();

    // Left barrier top curb (red and white safety stripes)
    const segments = 16;
    for (let i = 0; i < segments; i++) {
      const f1 = i / segments;
      const f2 = (i + 1) / segments;
      const s1 = f1 * f1;
      const s2 = f2 * f2;

      const y1 = horizonY + (h - barrierH - horizonY) * s1;
      const y2 = horizonY + (h - barrierH - horizonY) * s2;
      const x1 = lxTop + (lxBot - lxTop) * s1;
      const x2 = lxTop + (lxBot - lxTop) * s2;

      ctx.fillStyle = (i % 2 === 0) ? '#c0392b' : '#ecf0f1';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - 5 * s2, y2 - 3 * s2);
      ctx.lineTo(x1 - 5 * s1, y1 - 3 * s1);
      ctx.closePath();
      ctx.fill();
    }

    // Right barrier side face
    ctx.fillStyle = '#3a3d42';
    ctx.beginPath();
    ctx.moveTo(rxTop, horizonY);
    ctx.lineTo(rxTop, horizonY - 4);
    ctx.lineTo(rxBot, h - barrierH);
    ctx.lineTo(rxBot, h);
    ctx.closePath();
    ctx.fill();

    // Right barrier top curb
    for (let i = 0; i < segments; i++) {
      const f1 = i / segments;
      const f2 = (i + 1) / segments;
      const s1 = f1 * f1;
      const s2 = f2 * f2;

      const y1 = horizonY + (h - barrierH - horizonY) * s1;
      const y2 = horizonY + (h - barrierH - horizonY) * s2;
      const x1 = rxTop + (rxBot - rxTop) * s1;
      const x2 = rxTop + (rxBot - rxTop) * s2;

      ctx.fillStyle = (i % 2 === 0) ? '#c0392b' : '#ecf0f1';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 + 5 * s2, y2 - 3 * s2);
      ctx.lineTo(x1 + 5 * s1, y1 - 3 * s1);
      ctx.closePath();
      ctx.fill();
    }
  }



  drawSingleBillboard(x, y, w, h, scale, sponsor, isLeft) {
    const ctx = this.ctx;
    ctx.save();

    const legH = 22 * scale;
    const boardY = y - legH - h;

    // 1. Dual steel I-beam legs
    ctx.fillStyle = '#2c3e50';
    const legW = Math.max(2, 4 * scale);
    const leg1X = x + w * 0.18;
    const leg2X = x + w * 0.82 - legW;

    ctx.fillRect(leg1X, boardY + h, legW, legH);
    ctx.fillRect(leg2X, boardY + h, legW, legH);

    // Diagonal truss brace between legs
    if (scale > 0.25) {
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(leg1X, boardY + h);
      ctx.lineTo(leg2X, boardY + h + legH);
      ctx.moveTo(leg2X, boardY + h);
      ctx.lineTo(leg1X, boardY + h + legH);
      ctx.stroke();
    }

    // Concrete footings
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(leg1X - 3 * scale, y - 4 * scale, legW + 6 * scale, 5 * scale);
    ctx.fillRect(leg2X - 3 * scale, y - 4 * scale, legW + 6 * scale, 5 * scale);

    // 2. Billboard backing shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 4 * scale, boardY + 4 * scale, w, h);

    // 3. Heavy steel / timber frame
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(x, boardY, w, h);
    ctx.strokeStyle = '#57606f';
    ctx.lineWidth = Math.max(1, 2.5 * scale);
    ctx.strokeRect(x, boardY, w, h);

    // 4. Inner poster margin
    const m = Math.max(2, 3.5 * scale);
    const px = x + m;
    const py = boardY + m;
    const pw = w - m * 2;
    const ph = h - m * 2;

    // 5. Authentic Sponsor Logo Artwork
    if (sponsor === 'hotrod') {
      // Hot Rod Magazine
      const grad = ctx.createLinearGradient(px, py, px, py + ph);
      grad.addColorStop(0, '#c0392b');
      grad.addColorStop(1, '#800000');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);

      // Yellow flame accent
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(px, py + ph);
      ctx.lineTo(px + pw * 0.4, py + ph);
      ctx.lineTo(px + pw * 0.25, py + ph * 0.4);
      ctx.lineTo(px + pw * 0.15, py + ph * 0.6);
      ctx.lineTo(px, py + ph * 0.3);
      ctx.closePath();
      ctx.fill();

      // Text Logo
      ctx.fillStyle = '#f1c40f';
      ctx.font = `bold ${Math.max(6, Math.floor(15 * scale))}px Impact, Arial Black`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HOT ROD', px + pw * 0.55, py + ph * 0.40);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(4, Math.floor(7 * scale))}px Tahoma`;
      ctx.fillText('MAGAZINE ★ 1998', px + pw * 0.55, py + ph * 0.75);

    } else if (sponsor === 'bethesda') {
      // Bethesda Softworks
      const grad = ctx.createLinearGradient(px, py, px, py + ph);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(1, '#001122');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);

      // Double frame line
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.strokeRect(px + 2, py + 2, pw - 4, ph - 4);

      // Logo
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(6, Math.floor(13 * scale))}px Arial Black`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BETHESDA', px + pw * 0.5, py + ph * 0.38);

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(px + pw * 0.2, py + ph * 0.58, pw * 0.6, Math.max(1, 2 * scale));

      ctx.fillStyle = '#00d2ff';
      ctx.font = `bold ${Math.max(4, Math.floor(6.5 * scale))}px Tahoma`;
      ctx.fillText('SOFTWORKS', px + pw * 0.5, py + ph * 0.78);

    } else if (sponsor === 'autometer') {
      // Auto Meter Competition Instruments
      ctx.fillStyle = '#111111';
      ctx.fillRect(px, py, pw, ph);

      // Mini round gauge logo
      const gR = Math.max(3, 10 * scale);
      const gX = px + pw * 0.22;
      const gY = py + ph * 0.5;
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(gX, gY, gR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.stroke();
      // Needle
      ctx.strokeStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(gX, gY);
      ctx.lineTo(gX + gR * 0.7, gY - gR * 0.4);
      ctx.stroke();

      // Text
      ctx.fillStyle = '#f39c12';
      ctx.font = `bold ${Math.max(6, Math.floor(11 * scale))}px Impact, Arial Black`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('AUTO METER', px + pw * 0.42, py + ph * 0.4);

      ctx.fillStyle = '#bdc3c7';
      ctx.font = `bold ${Math.max(4, Math.floor(6 * scale))}px Tahoma`;
      ctx.fillText('COMPETITION GAUGES', px + pw * 0.42, py + ph * 0.72);

    } else if (sponsor === 'mickey') {
      // Mickey Thompson Drag Slicks
      ctx.fillStyle = '#0a290a';
      ctx.fillRect(px, py, pw, ph);

      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 4);
      ctx.lineTo(px + pw * 0.25, py + 4);
      ctx.lineTo(px + pw * 0.15, py + ph - 4);
      ctx.lineTo(px + 4, py + ph - 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(6, Math.floor(13 * scale))}px Impact, Arial Black`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M/T TIRES', px + pw * 0.58, py + ph * 0.38);

      ctx.fillStyle = '#f1c40f';
      ctx.font = `bold ${Math.max(4, Math.floor(6.5 * scale))}px Tahoma`;
      ctx.fillText('CHAMPIONSHIP SLICKS', px + pw * 0.58, py + ph * 0.72);

    } else if (sponsor === 'igromania') {
      // Игромания
      const grad = ctx.createLinearGradient(px, py, px, py + ph);
      grad.addColorStop(0, '#800000');
      grad.addColorStop(1, '#4a0000');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);

      // Target circle logo
      const tR = Math.max(3, 11 * scale);
      const tX = px + pw * 0.20;
      const tY = py + ph * 0.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, 1.2 * scale);
      ctx.beginPath();
      ctx.arc(tX, tY, tR, 0, Math.PI * 2);
      ctx.arc(tX, tY, tR * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tX - tR - 2, tY); ctx.lineTo(tX + tR + 2, tY);
      ctx.moveTo(tX, tY - tR - 2); ctx.lineTo(tX, tY + tR + 2);
      ctx.stroke();

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(6, Math.floor(12 * scale))}px Arial Black`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('ИГРОМАНИЯ', px + pw * 0.38, py + ph * 0.38);

      ctx.fillStyle = '#f1c40f';
      ctx.font = `bold ${Math.max(4, Math.floor(6 * scale))}px Tahoma`;
      ctx.fillText('КОМПАКТ-ДИСК #9 (1998)', px + pw * 0.38, py + ph * 0.72);

    } else {
      // Valvoline Racing
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, pw, ph);

      // Blue & Red Chevron
      ctx.fillStyle = '#0984e3';
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 4);
      ctx.lineTo(px + pw * 0.3, py + ph * 0.5);
      ctx.lineTo(px + 4, py + ph - 4);
      ctx.fill();
      ctx.fillStyle = '#d63031';
      ctx.beginPath();
      ctx.moveTo(px + 10 * scale, py + 4);
      ctx.lineTo(px + pw * 0.3 + 6 * scale, py + ph * 0.5);
      ctx.lineTo(px + 10 * scale, py + ph - 4);
      ctx.fill();

      ctx.fillStyle = '#2d3436';
      ctx.font = `bold ${Math.max(6, Math.floor(12 * scale))}px Impact`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('VALVOLINE', px + pw * 0.40, py + ph * 0.4);
      ctx.fillStyle = '#0984e3';
      ctx.font = `bold ${Math.max(4, Math.floor(6.5 * scale))}px Tahoma`;
      ctx.fillText('RACING MOTOR OIL', px + pw * 0.40, py + ph * 0.72);
    }

    // 6. Overhead floodlight lamps on top edge of billboard
    if (scale > 0.15) {
      const lampPositions = [x + w * 0.25, x + w * 0.75];
      lampPositions.forEach(lx => {
        // Arm
        ctx.strokeStyle = '#57606f';
        ctx.lineWidth = Math.max(1, 1.8 * scale);
        ctx.beginPath();
        ctx.moveTo(lx, boardY);
        ctx.lineTo(lx, boardY - 6 * scale);
        ctx.lineTo(lx + (isLeft ? 4 : -4) * scale, boardY - 8 * scale);
        ctx.stroke();

        // Lamp head
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.arc(lx + (isLeft ? 4 : -4) * scale, boardY - 8 * scale, Math.max(1.5, 3 * scale), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  drawDistanceMarkers(physics, w, h, proj) {
    const ctx = this.ctx;
    const playerPos = physics.player.pos;

    // Track targets: 0 (Start), 60', 330', 660', 1000', 1320' (Finish Gantry)
    const targets = [
      { pos: 0, label: 'START LINE' },
      { pos: 60, label: '60 FT' },
      { pos: 330, label: '330 FT' },
      { pos: 660, label: '1/8 MILE' },
      { pos: 1000, label: '1000 FT' },
      { pos: 1320, label: '1/4 MILE FINISH' }
    ];

    targets.forEach(t => {
      const dist = t.pos - playerPos;
      // If marker is in visible view in front of car (0 to 600 ft)
      if (dist >= -5 && dist <= 500) {
        const factor = 1 - (dist / 500);
        const y = proj.horizonY + (h - proj.horizonY) * (factor * factor);
        const pT = Math.max(0, Math.min(1, (y - proj.horizonY) / (h - proj.horizonY)));

        const lx = proj.leftTopX + (proj.leftBotX - proj.leftTopX) * pT;
        const rx = proj.rightTopX + (proj.rightBotX - proj.rightTopX) * pT;
        const spanW = rx - lx;

        // Finish Line Gantry Bridge (1320 ft)
        if (t.pos === 1320) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6 * factor;
          // Checkerboard finish line stripe across asphalt
          ctx.beginPath();
          ctx.moveTo(lx, y);
          ctx.lineTo(rx, y);
          ctx.stroke();

          // Overhead Gantry structure
          const gH = 110 * factor;
          ctx.fillStyle = '#2c3e50';
          ctx.fillRect(lx - 10 * factor, y - gH, 12 * factor, gH);
          ctx.fillRect(rx - 2 * factor, y - gH, 12 * factor, gH);

          ctx.fillStyle = '#c0392b';
          ctx.fillRect(lx, y - gH, spanW, 24 * factor);

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.max(8, Math.floor(14 * factor))}px Impact, Arial Black`;
          ctx.textAlign = 'center';
          ctx.fillText('★ 1/4 MILE FINISH ★', (lx + rx) * 0.5, y - gH + 17 * factor);
          ctx.textAlign = 'left';
        } else {
          // Regular line across track
          ctx.strokeStyle = (t.pos === 0) ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = (t.pos === 0) ? 4 * factor : 2 * factor;
          ctx.beginPath();
          ctx.moveTo(lx, y);
          ctx.lineTo(rx, y);
          ctx.stroke();

          // Signboard on track edge
          ctx.fillStyle = '#f39c12';
          ctx.font = `bold ${Math.max(6, Math.floor(9 * factor))}px Tahoma`;
          ctx.fillText(t.label, rx + 6 * factor, y);
        }
      }
    });
  }

  drawChristmasTree(physics, w, h, proj) {
    const ctx = this.ctx;
    const playerPos = physics.player.pos;
    const treeDist = 0 - playerPos; // Tree is at start line (pos 0)

    // Only render tree if within view (-20 to 250 feet)
    if (treeDist < -25 || treeDist > 300) return;

    const factor = Math.max(0.12, 1 - (treeDist / 300));
    const scale = factor * factor;
    const y = proj.horizonY + (h - proj.horizonY) * (scale * 0.88);
    const pT = Math.max(0, Math.min(1, (y - proj.horizonY) / (h - proj.horizonY)));
    const treeX = proj.centerTopX + (proj.centerBotX - proj.centerTopX) * pT;

    const treeH = 90 * factor;
    const treeW = 28 * factor;

    // Tree main vertical post
    ctx.fillStyle = '#f1c40f'; // Yellow NHRA tree post
    ctx.fillRect(treeX - treeW * 0.15, y - treeH, treeW * 0.3, treeH);

    // Tree light housing boxes
    ctx.fillStyle = '#111111';
    ctx.fillRect(treeX - treeW * 0.5, y - treeH, treeW, treeH * 0.95);

    const ts = physics.treeState;
    const bulbR = Math.max(2, 3.2 * factor);

    // Light pairs helper: left (player) & right (rival)
    const drawBulbPair = (relY, isOnLeft, isOnRight, colorOn, colorOff, glowColor) => {
      const by = y - treeH + relY * treeH;
      const lx = treeX - treeW * 0.28;
      const rx = treeX + treeW * 0.28;

      // Left bulb
      ctx.fillStyle = isOnLeft ? colorOn : colorOff;
      ctx.beginPath();
      ctx.arc(lx, by, bulbR, 0, Math.PI * 2);
      ctx.fill();
      if (isOnLeft && glowColor) {
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(lx, by, bulbR * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Right bulb
      ctx.fillStyle = isOnRight ? colorOn : colorOff;
      ctx.beginPath();
      ctx.arc(rx, by, bulbR, 0, Math.PI * 2);
      ctx.fill();
      if (isOnRight && glowColor) {
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(rx, by, bulbR * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // 1. Pre-Stage Bulbs (Top White)
    drawBulbPair(0.10, ts.preStagePlayer, ts.preStageRival, '#ffffff', '#333333', 'rgba(255, 255, 255, 0.4)');

    // 2. Stage Bulbs (Second White)
    drawBulbPair(0.22, ts.stagePlayer, ts.stageRival, '#ffffff', '#333333', 'rgba(255, 255, 255, 0.4)');

    // 3. Amber 1 (Yellow Countdown)
    drawBulbPair(0.38, ts.amber1, ts.amber1, '#f39c12', '#443300', 'rgba(243, 156, 18, 0.45)');

    // 4. Amber 2 (Yellow Countdown)
    drawBulbPair(0.50, ts.amber2, ts.amber2, '#f39c12', '#443300', 'rgba(243, 156, 18, 0.45)');

    // 5. Amber 3 (Yellow Countdown)
    drawBulbPair(0.62, ts.amber3, ts.amber3, '#f39c12', '#443300', 'rgba(243, 156, 18, 0.45)');

    // 6. Green Light (GO!)
    drawBulbPair(0.76, ts.green, ts.green, '#2ecc71', '#003311', 'rgba(46, 204, 113, 0.5)');

    // 7. Red Light (Foul / False Start!)
    drawBulbPair(0.88, ts.redPlayer, ts.redRival, '#e74c3c', '#330000', 'rgba(231, 76, 60, 0.6)');
  }

  updateParticles(physics, dt, proj, w, h) {
    const p = physics.player;
    const r = physics.rival;
    const isCockpit = (this.cameraMode === 'cockpit');

    // 1. Player burnout smoke
    if (p.lineLock && p.throttle > 0.25) {
      for (let i = 0; i < 3; i++) {
        if (this.particles.length < this.maxParticles) {
          let px, py;
          if (isCockpit) {
            px = (Math.random() < 0.5 ? w * 0.18 : w * 0.82) + (Math.random() * 40 - 20);
            py = h * 0.70 + (Math.random() * 30 - 15);
          } else {
            px = w * 0.32 + (Math.random() * 30 - 15);
            py = h * 0.82;
          }
          this.particles.push({
            type: 'smoke',
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 35,
            vy: -Math.random() * 45 - 25,
            size: Math.random() * 16 + 12,
            alpha: 0.8,
            color: '#ecf0f1'
          });
        }
      }
    }

    // 2. Rival burnout smoke
    if (r.lineLock && r.throttle > 0.25) {
      for (let i = 0; i < 2; i++) {
        if (this.particles.length < this.maxParticles) {
          let rx, ry;
          if (isCockpit) {
            rx = proj.centerBotX + 40 + (Math.random() * 40 - 20);
            ry = h * 0.75;
          } else {
            rx = w * 0.68 + (Math.random() * 30 - 15);
            ry = h * 0.82;
          }
          this.particles.push({
            type: 'smoke',
            x: rx,
            y: ry,
            vx: (Math.random() - 0.5) * 30,
            vy: -Math.random() * 40 - 20,
            size: Math.random() * 14 + 10,
            alpha: 0.75,
            color: '#d5dbdb'
          });
        }
      }
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.size += 20 * dt;
      part.alpha -= 1.1 * dt;

      if (part.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    this.particles.forEach(part => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, part.alpha);
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawCars(physics, w, h, proj) {
    const p = physics.player;
    const r = physics.rival;

    if (this.cameraMode === 'cockpit') {
      // 1. Draw rival car in right lane if beside or ahead
      this.drawRivalFromCockpit(p, r, w, h, proj);

      // 2. Draw Cockpit view (centered hood, 6-71 blower, rotating butterflies, windshield rollcage)
      this.drawCockpitView(p, w, h, proj);
    } else {
      // 1. In Chase view, draw player car at its fixed chase position in the left lane
      const playerY = h * 0.78;
      const pT = Math.max(0, Math.min(1, (playerY - proj.horizonY) / (h - proj.horizonY)));
      const playerX = proj.playerLaneTopX + (proj.playerLaneBotX - proj.playerLaneTopX) * pT;
      this.drawCarOnTrack(p, playerX, playerY, 1.2, '#c0392b', true);

      // 2. Draw rival car in right lane based on true distance relative to player!
      this.drawRivalInChase(p, r, w, h, proj);
    }
  }

  drawRivalInChase(player, rival, w, h, proj) {
    const relDist = rival.pos - player.pos;
    // Chase cam is placed ~26 ft behind player car
    const distFromCam = 26 + relDist;
    if (distFromCam < 7 || distFromCam > 900) return; // Culled if behind camera or too far

    const scaleFactor = Math.max(0.06, 26 / distFromCam);
    const rivalY = proj.horizonY + (h * 0.78 - proj.horizonY) * scaleFactor;
    if (rivalY > h * 0.96) return; // Culled if below screen bottom

    const pT = Math.max(0, Math.min(1, (rivalY - proj.horizonY) / (h - proj.horizonY)));
    const rivalX = proj.rivalLaneTopX + (proj.rivalLaneBotX - proj.rivalLaneTopX) * pT;
    const rivalScale = 1.2 * scaleFactor;

    this.drawCarOnTrack(rival, rivalX, rivalY, rivalScale, '#2980b9', false);
  }

  drawRivalFromCockpit(player, rival, w, h, proj) {
    const relDist = rival.pos - player.pos;
    // Visible through front windshield if between -18 ft and 700 ft ahead
    if (relDist < -18 || relDist > 700) return;

    const distFromEyes = relDist + 22;
    const distFactor = 22 / Math.max(8, distFromEyes);
    const rivalScale = Math.min(1.35, 1.05 * distFactor);

    const rivalY = proj.horizonY + (h * 0.76 - proj.horizonY) * distFactor;
    if (rivalY > h * 0.92) return;

    const pT = Math.max(0, Math.min(1, (rivalY - proj.horizonY) / (h - proj.horizonY)));
    const rivalX = proj.rivalLaneTopX + (proj.rivalLaneBotX - proj.rivalLaneTopX) * pT;

    this.drawCarOnTrack(rival, rivalX, rivalY, rivalScale, '#2980b9', false);
  }

  drawCockpitView(player, w, h, proj) {
    const ctx = this.ctx;
    const hoodBaseY = h * 0.62;
    const centerX = w * 0.50; // Aligned straight down the left lane!

    ctx.save();

    // Subtle engine shake based on RPM and throttle
    const shake = (player.rpm / 8500) * (player.throttle * 3.5 + 1.2);
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;

    const hoodTopY = hoodBaseY + shakeY;
    const hoodBotY = h;

    // 1. Hood surface (Deep metallic candy apple red with racing stripes)
    ctx.fillStyle = '#961515';
    ctx.beginPath();
    ctx.moveTo(centerX - w * 0.36 + shakeX, hoodBotY);
    ctx.lineTo(centerX - w * 0.20 + shakeX, hoodTopY);
    ctx.lineTo(centerX + w * 0.20 + shakeX, hoodTopY);
    ctx.lineTo(centerX + w * 0.36 + shakeX, hoodBotY);
    ctx.closePath();
    ctx.fill();

    // Cowl induction center hump
    ctx.fillStyle = '#781010';
    ctx.beginPath();
    ctx.moveTo(centerX - w * 0.16 + shakeX, hoodBotY);
    ctx.lineTo(centerX - w * 0.12 + shakeX, hoodTopY);
    ctx.lineTo(centerX + w * 0.12 + shakeX, hoodTopY);
    ctx.lineTo(centerX + w * 0.16 + shakeX, hoodBotY);
    ctx.closePath();
    ctx.fill();

    // Dual white racing stripes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(centerX - 30 + shakeX, hoodBotY);
    ctx.lineTo(centerX - 20 + shakeX, hoodTopY);
    ctx.lineTo(centerX - 6 + shakeX, hoodTopY);
    ctx.lineTo(centerX - 10 + shakeX, hoodBotY);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX + 10 + shakeX, hoodBotY);
    ctx.lineTo(centerX + 6 + shakeX, hoodTopY);
    ctx.lineTo(centerX + 20 + shakeX, hoodTopY);
    ctx.lineTo(centerX + 30 + shakeX, hoodBotY);
    ctx.fill();

    // Hood pins on corners
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.arc(centerX - w * 0.17 + shakeX, hoodTopY + 8, 4, 0, Math.PI * 2);
    ctx.arc(centerX + w * 0.17 + shakeX, hoodTopY + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // 2. Huge 6-71 Supercharger (Blower) & Bird Catcher Scoop protruding from hood
    const blowerX = centerX + shakeX;
    const blowerY = hoodTopY - 42;

    // Chrome blower casing
    ctx.fillStyle = '#d5dbdb';
    ctx.fillRect(blowerX - 54, blowerY, 108, 46);
    ctx.fillStyle = '#7f8c8d';
    ctx.strokeRect(blowerX - 54, blowerY, 108, 46);

    // Blower cooling fins
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 1;
    for (let fy = blowerY + 6; fy < blowerY + 42; fy += 6) {
      ctx.beginPath();
      ctx.moveTo(blowerX - 50, fy);
      ctx.lineTo(blowerX + 50, fy);
      ctx.stroke();
    }

    // Blower cog belt pulley drive on front
    ctx.fillStyle = '#1c2833';
    ctx.beginPath();
    ctx.arc(blowerX - 42, blowerY + 24, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.arc(blowerX - 42, blowerY + 24, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(blowerX - 42, blowerY + 24, 3, 0, Math.PI * 2);
    ctx.fill();

    // Red anodized injector hat (Enderle Birdcatcher scoop)
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(blowerX - 60, blowerY);
    ctx.lineTo(blowerX - 74, blowerY - 32);
    ctx.lineTo(blowerX + 74, blowerY - 32);
    ctx.lineTo(blowerX + 60, blowerY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Three butterfly throttle valves!
    // Angle opens with player throttle!
    const throttleAngle = (player.throttle * 0.7); // 0 = closed, 0.7 = fully open
    const bCenters = [blowerX - 38, blowerX, blowerX + 38];
    bCenters.forEach(bx => {
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(bx, blowerY - 16, 14, 0, Math.PI * 2);
      ctx.fill();

      // Red butterfly disk rotating on throttle
      ctx.fillStyle = '#e74c3c';
      ctx.save();
      ctx.translate(bx, blowerY - 16);
      ctx.scale(1.0, Math.max(0.12, Math.cos(throttleAngle * Math.PI)));
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Roll Cage & Windshield Surround
    // Steel roll cage A-pillars framing left and right edges
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 14;
    // Left A-pillar
    ctx.beginPath();
    ctx.moveTo(0, h * 0.15);
    ctx.lineTo(w * 0.08, h);
    ctx.stroke();
    // Right A-pillar
    ctx.beginPath();
    ctx.moveTo(w, h * 0.15);
    ctx.lineTo(w * 0.92, h);
    ctx.stroke();
    // Top roll bar crossmember
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();

    // Windshield Sun Strip with "BURNOUT" logo
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, 28);
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 13px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ BURNOUT: CHAMPIONSHIP DRAG RACING ★', w * 0.5, 20);

    // 4. Cowl-mounted Auto Meter 5-inch Monster Tachometer on Driver's side
    const tachX = centerX - w * 0.28 + shakeX;
    const tachY = hoodTopY - 18 + shakeY;
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(tachX, tachY, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shift Light on top-right of tach
    const shiftLightOn = (player.rpm >= 7600);
    ctx.fillStyle = shiftLightOn ? '#ffdd00' : '#443300';
    ctx.beginPath();
    ctx.arc(tachX + 28, tachY - 22, 10, 0, Math.PI * 2);
    ctx.fill();
    if (shiftLightOn) {
      ctx.fillStyle = 'rgba(255, 230, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(tachX + 28, tachY - 22, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tach needle
    const tachAngle = -Math.PI * 0.75 + (player.rpm / 8500) * (Math.PI * 1.5);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tachX, tachY);
    ctx.lineTo(tachX + Math.cos(tachAngle) * 26, tachY + Math.sin(tachAngle) * 26);
    ctx.stroke();

    ctx.restore();
  }

  drawCarOnTrack(car, x, y, scale, bodyColor, isPlayer) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Front-end wheelie lift & rear suspension squat
    const wheelieAngleRad = (car.wheelieAngle * Math.PI) / 180;
    const squatY = car.squat * 4;
    ctx.translate(0, squatY);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 56, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Wheelie bars extending behind under rear bumper
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-18, 0); ctx.lineTo(-28, 18);
    ctx.moveTo(18, 0); ctx.lineTo(28, 18);
    ctx.stroke();
    // Crossbar
    ctx.strokeStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.moveTo(-28, 16); ctx.lineTo(28, 16);
    ctx.stroke();
    // Red roller caster wheels on wheelie bar
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(-28, 18, 3.5, 0, Math.PI * 2);
    ctx.arc(28, 18, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Massive Rear Drag Slicks (Fat wrinkle-wall tires)
    const tireW = 24;
    const tireH = 34;
    const tireY = -22;

    // Left Tire
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.roundRect(-54, tireY, tireW, tireH, 4);
    ctx.fill();
    ctx.strokeStyle = '#222222';
    ctx.stroke();
    // Center rim
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.ellipse(-42, tireY + tireH * 0.5, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dcdde1';
    ctx.beginPath();
    ctx.arc(-42, tireY + tireH * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right Tire
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.roundRect(30, tireY, tireW, tireH, 4);
    ctx.fill();
    ctx.strokeStyle = '#222222';
    ctx.stroke();
    // Center rim
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.ellipse(42, tireY + tireH * 0.5, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dcdde1';
    ctx.beginPath();
    ctx.arc(42, tireY + tireH * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Zoomie Exhaust Pipes on flanks spitting flame bursts
    if (car.throttle > 0.3) {
      const isNitrous = car.nitrousActive;
      const flameColor = isNitrous ? '#00e5ff' : '#ff4400';
      const innerFlame = isNitrous ? '#ffffff' : '#ffff00';
      const flameLen = 8 + car.throttle * 14;

      // Left zoomie flame
      ctx.fillStyle = flameColor;
      ctx.beginPath();
      ctx.moveTo(-56, -6);
      ctx.lineTo(-56 - flameLen, -10 + (Math.random() * 4 - 2));
      ctx.lineTo(-56, -14);
      ctx.fill();
      ctx.fillStyle = innerFlame;
      ctx.beginPath();
      ctx.moveTo(-56, -8);
      ctx.lineTo(-56 - flameLen * 0.6, -10);
      ctx.lineTo(-56, -12);
      ctx.fill();

      // Right zoomie flame
      ctx.fillStyle = flameColor;
      ctx.beginPath();
      ctx.moveTo(56, -6);
      ctx.lineTo(56 + flameLen, -10 + (Math.random() * 4 - 2));
      ctx.lineTo(56, -14);
      ctx.fill();
      ctx.fillStyle = innerFlame;
      ctx.beginPath();
      ctx.moveTo(56, -8);
      ctx.lineTo(56 + flameLen * 0.6, -10);
      ctx.lineTo(56, -12);
      ctx.fill();
    }

    // 4. Blower Scoop visible above hood in front
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(-14, -58, 28, 12);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-16, -63, 32, 6);
    // 3 red butterflies
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-8, -60, 2.5, 0, Math.PI * 2);
    ctx.arc(0, -60, 2.5, 0, Math.PI * 2);
    ctx.arc(8, -60, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Main Muscle Car Body (Pro Stock / Chevelle styling)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    // Tapered muscular fastback body
    ctx.moveTo(-42, -18);
    ctx.lineTo(-44, -30);
    ctx.lineTo(-34, -48);
    ctx.lineTo(34, -48);
    ctx.lineTo(44, -30);
    ctx.lineTo(42, -18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Racing Stripes down trunk
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, -48, 6, 32);
    ctx.fillRect(4, -48, 6, 32);

    // Rear bumper & tail fascia
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(-38, -24, 76, 12);

    // Dual tail-lights
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(-35, -22, 16, 7);
    ctx.fillRect(19, -22, 16, 7);

    // License plate
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(-10, -22, 20, 8);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 5px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText('HOTROD', 0, -16);

    // Rear Drag Wing / Pro Spoiler
    ctx.fillStyle = '#111111';
    ctx.fillRect(-46, -32, 92, 5);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-48, -35, 4, 8);
    ctx.fillRect(44, -35, 4, 8);

    // Rear tinted window with rollcage
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.moveTo(-28, -32);
    ctx.lineTo(-24, -46);
    ctx.lineTo(24, -46);
    ctx.lineTo(28, -32);
    ctx.closePath();
    ctx.fill();

    // Rollcage bars
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -32); ctx.lineTo(0, -46);
    ctx.moveTo(18, -32); ctx.lineTo(0, -46);
    ctx.stroke();

    // 6. Parachute Pack on rear bumper
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(-12, -26, 24, 12);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -26, 24, 12);
    // Cross release cord
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -26); ctx.lineTo(12, -14);
    ctx.moveTo(12, -26); ctx.lineTo(-12, -14);
    ctx.stroke();

    // Parachute deployed animation trailing behind!
    if (car.parachuteDeployed) {
      ctx.save();
      // Twin cross-form drag chutes
      const chuteDist = 65;
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(-24, -chuteDist, 22, 0, Math.PI * 2);
      ctx.arc(24, -chuteDist, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-24, -chuteDist, 10, 0, Math.PI * 2);
      ctx.arc(24, -chuteDist, 10, 0, Math.PI * 2);
      ctx.fill();

      // Suspension lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-8, -24); ctx.lineTo(-24, -chuteDist);
      ctx.moveTo(8, -24); ctx.lineTo(24, -chuteDist);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // Dashboard HUD & Autometer Gauges
  drawHUD(physics, w, h, dt) {
    const ctx = this.ctx;
    const p = physics.player;

    // Bottom Dashboard Bezel Bar
    const dashH = 95;
    const dashY = h - dashH;

    const dashGrad = ctx.createLinearGradient(0, dashY, 0, h);
    dashGrad.addColorStop(0, '#1c1c1c');
    dashGrad.addColorStop(0.1, '#2c2c2c');
    dashGrad.addColorStop(1, '#0d0d0d');

    ctx.fillStyle = dashGrad;
    ctx.fillRect(0, dashY, w, dashH);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, dashY, w, dashH);

    // 1. Huge Autometer Monster Tachometer (Left Center)
    this.drawTachometer(p, 90, dashY + 48, 42, dt);

    // 2. Speedometer (Right Center)
    this.drawSpeedometer(p, 195, dashY + 48, 40);

    // 3. Digital Gear Indicator & Shift Light (Center)
    this.drawGearAndShiftLight(p, w * 0.5, dashY + 46, dt);

    // 4. Tire Temperature Gauge (Next to Speedo)
    this.drawTireTempGauge(p, w - 190, dashY + 48, 38);

    // 5. Status / Telemetry & Controls Panel (Far Right)
    this.drawTelemetryPanel(physics, w - 95, dashY + 48);

    // 6. Top Timing / Stage Banner
    this.drawTopRaceBanner(physics, w);
  }

  drawTachometer(player, cx, cy, radius, dt) {
    const ctx = this.ctx;

    // Chrome bezel
    ctx.fillStyle = '#dcdde1';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Black dial face
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Tick marks (0 to 10,000 RPM)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let rpm = 0; rpm <= 10000; rpm += 1000) {
      const angle = Math.PI * 0.75 + (rpm / 10000) * (Math.PI * 1.5);
      const isRedline = (rpm >= 7800);
      ctx.strokeStyle = isRedline ? '#e74c3c' : '#ffffff';

      const x1 = cx + Math.cos(angle) * (radius - 8);
      const y1 = cy + Math.sin(angle) * (radius - 8);
      const x2 = cx + Math.cos(angle) * (radius - 2);
      const y2 = cy + Math.sin(angle) * (radius - 2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (rpm % 2000 === 0) {
        ctx.fillStyle = isRedline ? '#e74c3c' : '#ffffff';
        ctx.font = 'bold 8px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tx = cx + Math.cos(angle) * (radius - 15);
        const ty = cy + Math.sin(angle) * (radius - 15);
        ctx.fillText((rpm / 1000).toString(), tx, ty);
      }
    }

    // Tach needle
    const needleRpm = Math.min(10000, player.rpm);
    const needleAngle = Math.PI * 0.75 + (needleRpm / 10000) * (Math.PI * 1.5);

    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 6), cy + Math.sin(needleAngle) * (radius - 6));
    ctx.stroke();

    // Center cap
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Autometer logo label
    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 7px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText('AUTO METER', cx, cy + 18);
    ctx.font = '6px Tahoma';
    ctx.fillText('RPM x1000', cx, cy + 26);
  }

  drawSpeedometer(player, cx, cy, radius) {
    const ctx = this.ctx;

    // Bezel
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    ctx.fill();

    // Black dial
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Speed marks (0 to 260 MPH)
    for (let s = 0; s <= 260; s += 20) {
      const angle = Math.PI * 0.75 + (s / 260) * (Math.PI * 1.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = (s % 40 === 0) ? 1.5 : 1.0;

      const x1 = cx + Math.cos(angle) * (radius - 7);
      const y1 = cy + Math.sin(angle) * (radius - 7);
      const x2 = cx + Math.cos(angle) * (radius - 2);
      const y2 = cy + Math.sin(angle) * (radius - 2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Needle
    const needleSpeed = Math.min(260, player.speedMph);
    const needleAngle = Math.PI * 0.75 + (needleSpeed / 260) * (Math.PI * 1.5);

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 6), cy + Math.sin(needleAngle) * (radius - 6));
    ctx.stroke();

    // Center digital speed display
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(player.speedMph) + ' MPH', cx, cy + 18);
  }

  drawGearAndShiftLight(player, cx, cy, dt) {
    const ctx = this.ctx;

    // Shift Light Pod (mounted top of dash)
    const isShiftTime = (player.rpm >= 7600);
    this.shiftLightFlash += dt * 25;
    const isFlashOn = isShiftTime && (Math.sin(this.shiftLightFlash) > 0);

    const shiftLightColor = isFlashOn ? '#ffff00' : '#443300';

    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(cx - 32, cy - 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.stroke();

    ctx.fillStyle = shiftLightColor;
    ctx.beginPath();
    ctx.arc(cx - 32, cy - 14, 9, 0, Math.PI * 2);
    ctx.fill();

    if (isFlashOn) {
      // Glow halo
      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(cx - 32, cy - 14, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Digital 7-Segment LED Gear Box
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx - 14, cy - 30, 28, 42);
    ctx.strokeStyle = '#555555';
    ctx.strokeRect(cx - 14, cy - 30, 28, 42);

    ctx.fillStyle = '#ff2200';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.gear.toString(), cx, cy - 8);

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 8px Tahoma';
    ctx.fillText('GEAR', cx, cy + 24);

    // Nitrous Bottle indicator
    const n2oColor = player.nitrousActive ? '#00e5ff' : (player.nitrousRemaining > 0 ? '#0077aa' : '#444');
    ctx.fillStyle = n2oColor;
    ctx.fillRect(cx + 22, cy - 20, 24, 30);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(cx + 22, cy - 20, 24, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Tahoma';
    ctx.fillText('N2O', cx + 34, cy - 10);
    ctx.fillText(Math.floor(player.nitrousRemaining) + '%', cx + 34, cy + 4);
  }

  drawTireTempGauge(player, cx, cy, radius) {
    const ctx = this.ctx;

    // Bezel & background
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.stroke();

    // Temperature color zones: Cold (<150 Blue), Optimal (180-230 Green), Hot (>240 Red)
    // Draw 3 arc zones
    const startA = Math.PI * 0.8;
    const endA = Math.PI * 2.2;

    // Cold Arc
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, startA, startA + 0.45 * (endA - startA));
    ctx.stroke();

    // Optimal Green Arc
    ctx.strokeStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, startA + 0.45 * (endA - startA), startA + 0.75 * (endA - startA));
    ctx.stroke();

    // Hot Red Arc
    ctx.strokeStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, startA + 0.75 * (endA - startA), endA);
    ctx.stroke();

    // Needle based on 70°F to 300°F
    const tempFrac = Math.max(0, Math.min(1.0, (player.tireTemp - 70) / 230));
    const needleA = startA + tempFrac * (endA - startA);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleA) * (radius - 8), cy + Math.sin(needleA) * (radius - 8));
    ctx.stroke();

    // Numeric readout
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText('TIRE TEMP', cx, cy + 14);

    const tempColor = (player.tireTemp >= 180 && player.tireTemp <= 235) ? '#2ecc71' : (player.tireTemp > 235 ? '#e74c3c' : '#3498db');
    ctx.fillStyle = tempColor;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(Math.floor(player.tireTemp) + '°F', cx, cy + 26);
  }

  drawTelemetryPanel(physics, cx, cy) {
    const ctx = this.ctx;
    const p = physics.player;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(cx - 38, cy - 38, 76, 76);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(cx - 38, cy - 38, 76, 76);

    ctx.font = 'bold 8px Tahoma';
    ctx.textAlign = 'left';

    // Distance
    ctx.fillStyle = '#95a5a6';
    ctx.fillText('DIST:', cx - 34, cy - 24);
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`${Math.max(0, Math.floor(p.pos))} FT`, cx + 2, cy - 24);

    // Throttle bar
    ctx.fillStyle = '#95a5a6';
    ctx.fillText('THROT:', cx - 34, cy - 10);
    ctx.fillStyle = '#222';
    ctx.fillRect(cx + 2, cy - 16, 32, 6);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx + 2, cy - 16, 32 * p.throttle, 6);

    // Line Lock indicator
    ctx.fillStyle = p.lineLock ? '#e74c3c' : '#555';
    ctx.fillText(p.lineLock ? '● LINE LOCK' : '○ LINE LOCK', cx - 34, cy + 6);

    // Parachute indicator
    ctx.fillStyle = p.parachuteDeployed ? '#2ecc71' : '#555';
    ctx.fillText(p.parachuteDeployed ? '● CHUTE OUT' : '○ CHUTE', cx - 34, cy + 20);

    // Camera mode
    ctx.fillStyle = '#3498db';
    ctx.fillText(`CAM: ${this.cameraMode.toUpperCase()}`, cx - 34, cy + 32);
  }

  drawTopRaceBanner(physics, w) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, 28);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(w, 28);
    ctx.stroke();

    ctx.font = 'bold 12px Tahoma';
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'left';
    ctx.fillText('BURNOUT: CHAMPIONSHIP DRAG RACING', 12, 18);

    // Center Stage Guide
    let guide = 'ПРОГРЕВ: [ПРОБЕЛ] + [B] (Line-Lock)';
    if (physics.state === 'STAGING') {
      guide = 'ПОДКАТКА: Медленно [Вверх/W] до лучей Pre-Stage и Stage!';
    } else if (physics.state === 'COUNTDOWN') {
      guide = 'ВНИМАНИЕ! СТАРТ ПО ЗЕЛЕНОМУ СИГНАЛУ!';
    } else if (physics.state === 'RACING') {
      guide = 'ГОНКА: [Shift/Z] - передача вверх! [N] - Закись! [P] - Парашют!';
    } else if (physics.state === 'FINISHED') {
      guide = 'ЗАЕЗД ЗАВЕРШЕН! СМОТРИТЕ ЧЕК ВРЕМЕНИ!';
    }

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(guide, w * 0.52, 18);

    // Right quick camera toggle
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ffff';
    ctx.font = '10px Tahoma';
    ctx.fillText('[C] Вид камеры', w - 12, 18);
  }
}

window.BurnoutRenderer = BurnoutRenderer;

