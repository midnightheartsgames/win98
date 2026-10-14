import type { App, Scene } from '../../app.ts';
import type { Game } from '../state.ts';
import type { PaiShoTile } from '../../data/types.ts';
import { PaiShoMatch, playerDeck, type RoundResult } from './core.ts';
import { COLORS } from '../ui.ts';
import { str } from '../../core/i18n.ts';
import { Particles } from '../../gfx/particles.ts';
import { Rng } from '../../core/rng.ts';

const EL_COLOR: Record<string, string> = { fire: '#e04828', water: '#3878d8', earth: '#789838', air: '#c8b878', lotus: '#f0f0f0' };
const EL_NAME: Record<string, string> = { fire: 'Огонь', water: 'Вода', earth: 'Земля', air: 'Воздух', lotus: 'Лотос' };

export class PaiShoScene implements Scene {
  opaque = true;
  countsPlaytime = true;
  private app: App;
  private g: Game;
  private opp: Game['data']['paisho']['opponents'][number];
  private match: PaiShoMatch;
  private done: (won: boolean) => void;
  private sel = 0;
  private phase: 'intro' | 'choose' | 'reveal' | 'result' | 'end' = 'intro';
  private t = 0;
  private last: RoundResult | null = null;
  private oLead: PaiShoTile | null = null;
  private fx = new Particles();
  private reward: string | null = null;

  constructor(app: App, oppId: string, done: (won: boolean) => void) {
    this.app = app;
    this.g = app.game as Game;
    this.done = done;
    const opp = this.g.data.paisho.opponents.find((o) => o.id === oppId);
    if (!opp) throw new Error(`unknown pai sho opponent ${oppId}`);
    this.opp = opp;
    this.match = new PaiShoMatch(this.g.data.paisho, playerDeck(this.g.s.paisho.tiles, this.g.data.paisho), opp.deck, opp.skill, new Rng((Date.now() ^ this.g.s.playtime) >>> 0));
  }

  enter(): void {
    this.app.sfx('paisho_start');
  }

  private nextRound(): void {
    if (this.match.over) {
      this.phase = 'end';
      this.t = 0;
      const won = this.match.winner === 'player';
      this.g.s.stats.paishoGames++;
      if (won) {
        const first = !this.g.s.paisho.beaten.includes(this.opp.id);
        if (first) {
          this.g.s.paisho.beaten.push(this.opp.id);
          this.g.setFlag(this.opp.flag);
          this.reward = this.opp.reward;
        } else {
          const rng = new Rng((this.g.s.playtime * 7) >>> 0);
          this.reward = rng.pick(this.opp.deck);
        }
        this.g.s.paisho.tiles[this.reward] = (this.g.s.paisho.tiles[this.reward] ?? 0) + 1;
        this.app.sfx('paisho_win');
        for (let i = 0; i < 5; i++) this.fx.burst('sparkle', 100 + i * 30, 100);
      } else this.app.sfx('paisho_lose');
      return;
    }
    this.phase = 'choose';
    this.sel = Math.min(this.sel, this.match.pHand.length - 1);
    this.oLead = this.match.playerLeads ? null : this.match.aiLead();
    if (this.oLead) this.app.sfx('paisho_place');
  }

  update(): void {
    this.t++;
    this.fx.update();
    const inp = this.app.input;
    switch (this.phase) {
      case 'intro':
        if (this.t > 30 && (inp.pressed('confirm') || this.t > 200)) this.nextRound();
        return;
      case 'choose': {
        const n = this.match.pHand.length;
        if (inp.repeat('left')) {
          this.sel = (this.sel + n - 1) % n;
          this.app.sfx('cursor');
        }
        if (inp.repeat('right')) {
          this.sel = (this.sel + 1) % n;
          this.app.sfx('cursor');
        }
        if (inp.pressed('confirm')) {
          this.last = this.match.play(this.sel, this.oLead ?? undefined);
          this.phase = 'reveal';
          this.t = 0;
          this.app.sfx('paisho_place');
        }
        return;
      }
      case 'reveal':
        if (this.t === 30 && this.last) {
          this.app.sfx(this.last.winner === 'player' ? 'paisho_point' : this.last.winner === 'opp' ? 'error' : 'cursor');
          if (this.last.winner === 'player') this.fx.burst('glow', 130, 118);
        }
        if (this.t > 40 && (inp.pressed('confirm') || this.t > 110)) this.nextRound();
        return;
      case 'end':
        if (this.t > 40 && inp.pressed('confirm')) {
          const won = this.match.winner === 'player';
          this.app.pop();
          this.done(won);
        }
        return;
    }
  }

  private tile(ctx: CanvasRenderingContext2D, t: PaiShoTile | null, x: number, y: number, faceUp: boolean, hi = false): void {
    ctx.fillStyle = '#20140a';
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = faceUp ? '#f0e4c8' : '#8a5a30';
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hi ? '#ffe060' : '#5a3a1a';
    ctx.lineWidth = hi ? 2 : 1;
    ctx.stroke();
    if (!faceUp || !t) {
      ctx.strokeStyle = '#c08a50';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = EL_COLOR[t.element];
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    if (t.element === 'lotus') {
      ctx.strokeStyle = '#c0c0d0';
      ctx.stroke();
    }
    this.app.font.drawCentered(ctx, String(t.value), x, y - 4, t.element === 'lotus' || t.element === 'air' ? '#202020' : '#ffffff', null);
  }

  private board(ctx: CanvasRenderingContext2D): void {
    const cx = 160;
    const cy = 110;
    ctx.fillStyle = '#3a2412';
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = '#e8d8b0';
    ctx.beginPath();
    ctx.arc(cx, cy, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a04030';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 78, cy + Math.sin(a) * 78);
      ctx.lineTo(cx - Math.cos(a) * 78, cy - Math.sin(a) * 78);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(160,64,48,0.18)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 78);
    ctx.lineTo(cx + 78, cy);
    ctx.lineTo(cx, cy + 78);
    ctx.lineTo(cx - 78, cy);
    ctx.fill();
    ctx.strokeStyle = '#6a3a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, 78, 0, Math.PI * 2);
    ctx.stroke();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const m = this.match;
    this.board(ctx);
    ui.window(ctx, 4, 4, 100, 34, 'dark', 0.8);
    ui.text(ctx, this.opp.name, 10, 9, COLORS.gold);
    ui.text(ctx, `●`.repeat(m.oWins) + '○'.repeat(Math.max(0, this.g.data.paisho.rules.winsNeeded - m.oWins)), 10, 22, '#f08060');
    ui.window(ctx, 216, 202, 100, 34, 'dark', 0.8);
    ui.text(ctx, this.g.s.name, 222, 207, COLORS.gold);
    ui.text(ctx, `●`.repeat(m.pWins) + '○'.repeat(Math.max(0, this.g.data.paisho.rules.winsNeeded - m.pWins)), 222, 220, '#80f0a0');
    const sp = this.app.sprites.portrait(this.opp.look, this.phase === 'end' ? (m.winner === 'opp' ? 'happy' : 'sad') : 'normal');
    if (sp) ctx.drawImage(sp, 268, 4);
    m.oHand.forEach((_, i) => this.tile(ctx, null, 110 + i * 28, 20, false));
    m.pHand.forEach((t, i) => {
      const lift = this.phase === 'choose' && i === this.sel ? -6 : 0;
      this.tile(ctx, t, 60 + i * 30, 214 + lift, true, this.phase === 'choose' && i === this.sel);
    });
    if (this.phase === 'choose' && this.oLead) {
      this.tile(ctx, this.oLead, 190, 102, true);
      ui.textCenter(ctx, str.t('paisho.opp_leads'), 160, 150, COLORS.title);
    }
    if (this.phase === 'choose' && !this.oLead) ui.textCenter(ctx, str.t('paisho.you_lead'), 160, 150, COLORS.title);
    if ((this.phase === 'reveal' || this.phase === 'end') && this.last) {
      const r = this.last;
      const k = Math.min(1, this.t / 20);
      this.tile(ctx, r.player, 130, 118 + (1 - k) * 60, true, r.winner === 'player');
      this.tile(ctx, r.opp, 190, 102 - (1 - k) * 60, this.phase === 'end' || this.t > 15, r.winner === 'opp');
      if (this.t > 25 || this.phase === 'end') {
        ui.textCenter(ctx, `${r.pScore}`, 130, 136, '#206020');
        ui.textCenter(ctx, `${r.oScore}`, 190, 80, '#802020');
        const txt = r.winner === 'player' ? str.t('paisho.round_win') : r.winner === 'opp' ? str.t('paisho.round_lose') : str.t('paisho.round_draw');
        if (this.phase === 'reveal') ui.textCenter(ctx, txt, 160, 160, '#3a2010');
      }
    }
    if (this.phase === 'choose') {
      const t = m.pHand[this.sel];
      if (t) {
        ui.window(ctx, 4, 164, 150, 30, 'dark', 0.85);
        ui.text(ctx, t.name, 10, 169, COLORS.text);
        ui.text(ctx, `${EL_NAME[t.element]}, сила ${t.value}`, 10, 180, EL_COLOR[t.element] === '#f0f0f0' ? COLORS.gold : COLORS.title);
      }
    }
    ui.window(ctx, 4, 42, 78, 64, 'dark', 0.75);
    ui.text(ctx, str.t('paisho.beats'), 8, 46, COLORS.dim);
    const beats = this.g.data.paisho.rules.beats;
    Object.entries(beats).forEach(([a, b], i) => ui.text(ctx, `${EL_NAME[a]} > ${EL_NAME[b]}`, 8, 57 + i * 11, EL_COLOR[a]));
    if (this.phase === 'intro') {
      ui.window(ctx, 40, 70, 240, 90);
      ui.textCenter(ctx, str.t('paisho.title'), 160, 78, COLORS.gold);
      this.app.font.wrap(str.t('paisho.rules'), 224).slice(0, 6).forEach((l, i) => ui.text(ctx, l, 48, 92 + i * 10));
    }
    if (this.phase === 'end') {
      ui.window(ctx, 70, 92, 180, this.reward ? 48 : 30);
      const won = m.winner === 'player';
      ui.textCenter(ctx, str.t(won ? 'paisho.win' : m.winner === 'draw' ? 'paisho.draw' : 'paisho.lose'), 160, 100, won ? COLORS.gold : '#f0a080');
      if (this.reward) {
        const tile = this.g.data.paisho.tiles.find((x) => x.id === this.reward);
        ui.textCenter(ctx, str.t('paisho.reward', { tile: tile?.name ?? '' }), 160, 116, '#80f0a0');
      }
    }
    this.fx.render(ctx);
  }
}
