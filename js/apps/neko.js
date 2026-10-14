/**
 * Neko (90s Retro Desktop Pet)
 * Pixelated virtual cat running around on the Win 98 desktop,
 * chasing mouse cursor, scratching window edges, and curling up to sleep.
 */
class AppNeko {
  constructor() {
    this.enabled = false;
    this.canvas = null;
    this.ctx = null;
    this.x = 200;
    this.y = 200;
    this.targetX = 200;
    this.targetY = 200;
    this.speed = 3.5;
    this.state = 'sitting'; // 'running', 'sitting', 'scratching', 'sleeping', 'alert'
    this.direction = 's'; // 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'
    this.frame = 0;
    this.idleTime = 0;
    this.sleepZzz = [];
    this.animId = null;

    this.initEvents();
  }

  initEvents() {
    if (typeof document === 'undefined') return;
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      const prevTargetX = this.targetX;
      const prevTargetY = this.targetY;
      this.targetX = e.clientX;
      this.targetY = e.clientY;

      if (this.state === 'sleeping') {
        // Wake up with alert reaction
        this.state = 'alert';
        this.frame = 0;
        this.idleTime = 0;
        setTimeout(() => {
          if (this.state === 'alert') this.state = 'running';
        }, 400);
      } else {
        this.idleTime = 0;
      }
    });
  }

  toggle() {
    if (this.enabled) {
      this.stop();
      if (window.winManager) {
        window.winManager.openDialog({
          title: 'Neko Cat',
          icon: 'neko',
          message: 'Котик Neko отправился спать в корзину.'
        });
      }
    } else {
      this.start();
      if (window.soundSys) window.soundSys.playDing();
      if (window.winManager) {
        window.winManager.openDialog({
          title: 'Neko Cat',
          icon: 'neko',
          message: 'Котик Neko выпущен на рабочий стол! Подвигайте мышкой, чтобы он бегал за курсором.'
        });
      }
    }
  }

  start() {
    if (this.enabled) return;
    this.enabled = true;

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'neko-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '9998'; // Just below top modal
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.loop();
  }

  stop() {
    this.enabled = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
      this.ctx = null;
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loop() {
    if (!this.enabled) return;
    this.update();
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.frame++;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 36) {
      this.state = 'running';
      this.idleTime = 0;
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;

      // Determine 8-way direction
      const deg = (angle * 180 / Math.PI + 360) % 360;
      if (deg >= 337.5 || deg < 22.5) this.direction = 'e';
      else if (deg >= 22.5 && deg < 67.5) this.direction = 'se';
      else if (deg >= 67.5 && deg < 112.5) this.direction = 's';
      else if (deg >= 112.5 && deg < 157.5) this.direction = 'sw';
      else if (deg >= 157.5 && deg < 202.5) this.direction = 'w';
      else if (deg >= 202.5 && deg < 247.5) this.direction = 'nw';
      else if (deg >= 247.5 && deg < 292.5) this.direction = 'n';
      else this.direction = 'ne';
    } else {
      // Reached mouse, idle
      this.idleTime++;
      if (this.idleTime > 180) { // ~3 seconds at 60fps
        this.state = 'sleeping';
        if (this.frame % 40 === 0) {
          this.sleepZzz.push({ x: this.x + 8, y: this.y - 12, alpha: 1.0, size: 10 });
        }
      } else if (this.idleTime > 60) {
        this.state = 'scratching';
      } else {
        this.state = 'sitting';
      }
    }

    // Update Zzz bubbles
    for (let i = this.sleepZzz.length - 1; i >= 0; i--) {
      const z = this.sleepZzz[i];
      z.y -= 0.6;
      z.x += 0.3;
      z.alpha -= 0.015;
      if (z.alpha <= 0) {
        this.sleepZzz.splice(i, 1);
      }
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const px = Math.round(this.x);
    const py = Math.round(this.y);

    // Draw Cat Sprite
    this.ctx.save();
    this.ctx.translate(px, py);

    // Body
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1.5;

    if (this.state === 'sleeping') {
      // Curled sleeping ball
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Sleeping closed eyes
      this.ctx.beginPath();
      this.ctx.moveTo(-6, -1); this.ctx.lineTo(-2, -1);
      this.ctx.moveTo(2, -1); this.ctx.lineTo(6, -1);
      this.ctx.stroke();

      // Ears
      this.ctx.fillStyle = '#ff9999';
      this.ctx.beginPath();
      this.ctx.moveTo(-10, -6); this.ctx.lineTo(-6, -12); this.ctx.lineTo(-2, -7);
      this.ctx.fill(); this.ctx.stroke();
    } else {
      // Sitting or running cat
      const legOffset = (this.state === 'running' && (Math.floor(this.frame / 6) % 2 === 0)) ? 3 : 0;

      // Legs
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(-8, 6 - legOffset, 4, 6 + legOffset);
      this.ctx.fillRect(4, 6 + legOffset, 4, 6 - legOffset);

      // Body ellipse
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Head
      this.ctx.beginPath();
      this.ctx.ellipse(0, -9, 9, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Ears
      this.ctx.fillStyle = '#ff9999';
      this.ctx.beginPath();
      this.ctx.moveTo(-7, -14); this.ctx.lineTo(-4, -20); this.ctx.lineTo(-1, -15);
      this.ctx.fill(); this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(1, -15); this.ctx.lineTo(4, -20); this.ctx.lineTo(7, -14);
      this.ctx.fill(); this.ctx.stroke();

      // Eyes & Nose
      this.ctx.fillStyle = '#000000';
      if (this.state === 'alert') {
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText('!', -2, -22);
      }
      this.ctx.fillRect(-4, -10, 2, 3);
      this.ctx.fillRect(2, -10, 2, 3);

      this.ctx.fillStyle = '#ff0055';
      this.ctx.fillRect(-1, -6, 2, 2);

      // Tail
      this.ctx.beginPath();
      this.ctx.moveTo(legOffset ? 8 : -8, 8);
      this.ctx.quadraticCurveTo(14, 2, 12, -4);
      this.ctx.stroke();
    }

    this.ctx.restore();

    // Render Zzz bubbles
    this.sleepZzz.forEach(z => {
      this.ctx.fillStyle = `rgba(0, 0, 128, ${z.alpha})`;
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText('Zzz', z.x, z.y);
    });
  }
}

window.appNeko = new AppNeko();
