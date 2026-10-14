import { Pix, shade, pack, unpackHex } from './pixel.ts';

export interface HumanLook {
  kind: 'human';
  skin?: string;
  hair?: string;
  hairStyle?: string;
  eyes?: string;
  top?: string;
  topStyle?: string;
  bottom?: string;
  bottomStyle?: string;
  shoes?: string;
  accent?: string;
  accent2?: string;
  extra?: string[];
  build?: string;
  hat?: string;
  glow?: string;
}

export type Facing = 'down' | 'up' | 'left' | 'right';
export type Pose = 'stand' | 'walk1' | 'walk2' | 'strike' | 'cast' | 'hurt' | 'guard' | 'victory' | 'kneel' | 'sleep';

interface Pal {
  skin: string;
  skinS: string;
  hair: string;
  hairS: string;
  hairH: string;
  eye: string;
  top: string;
  topS: string;
  topH: string;
  bot: string;
  botS: string;
  shoe: string;
  acc: string;
  acc2: string;
  hat: string;
  hatS: string;
}

function palette(l: HumanLook): Pal {
  const skin = l.skin ?? '#f0c8a0';
  const hair = l.hair ?? '#2a1a14';
  const top = l.top ?? '#a02828';
  const bot = l.bottom ?? '#3c2c20';
  const hat = l.hat ?? top;
  return {
    skin,
    skinS: shade(skin, -0.18),
    hair,
    hairS: shade(hair, -0.3),
    hairH: shade(hair, 0.25),
    eye: l.eyes ?? '#2a1810',
    top,
    topS: shade(top, -0.28),
    topH: shade(top, 0.2),
    bot,
    botS: shade(bot, -0.28),
    shoe: l.shoes ?? '#2a2020',
    acc: l.accent ?? '#d8a838',
    acc2: l.accent2 ?? shade(l.accent ?? '#d8a838', -0.3),
    hat,
    hatS: shade(hat, -0.3)
  };
}

interface Frame {
  headY: number;
  torsoTop: number;
  torsoBot: number;
  legBot: number;
  tx0: number;
  tx1: number;
}

function frameFor(l: HumanLook): Frame {
  switch (l.build) {
    case 'child':
      return { headY: 11, torsoTop: 21, torsoBot: 26, legBot: 30, tx0: 5, tx1: 10 };
    case 'small':
      return { headY: 9, torsoTop: 19, torsoBot: 25, legBot: 30, tx0: 4, tx1: 11 };
    case 'old':
      return { headY: 9, torsoTop: 19, torsoBot: 25, legBot: 30, tx0: 4, tx1: 11 };
    case 'large':
      return { headY: 7, torsoTop: 17, torsoBot: 24, legBot: 30, tx0: 3, tx1: 12 };
    default:
      return { headY: 7, torsoTop: 17, torsoBot: 24, legBot: 30, tx0: 4, tx1: 11 };
  }
}

function outlineAuto(p: Pix, amt = -0.62): void {
  const src = p.data.slice();
  const w = p.w;
  const h = p.h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src[y * w + x]) continue;
      let nb = 0;
      if (x > 0 && src[y * w + x - 1]) nb = src[y * w + x - 1];
      else if (x < w - 1 && src[y * w + x + 1]) nb = src[y * w + x + 1];
      else if (y > 0 && src[(y - 1) * w + x]) nb = src[(y - 1) * w + x];
      else if (y < h - 1 && src[(y + 1) * w + x]) nb = src[(y + 1) * w + x];
      if (nb) p.data[y * w + x] = pack(shade(unpackHex(nb), amt));
    }
  }
}

export { outlineAuto };

function drawHead(p: Pix, l: HumanLook, c: Pal, dir: Facing, hy: number, dx: number): void {
  const cx = 8 + dx;
  const cy = hy + 5.5;
  p.ellipse(cx, cy, 5.5, 5.6, c.skin);
  if (dir !== 'up') {
    for (let y = Math.floor(cy + 2); y <= Math.ceil(cy + 5); y++) {
      const edge = dir === 'left' ? cx + 3 : cx + 4;
      for (let x = Math.floor(edge); x <= cx + 6; x++) if (p.get(x, y)) p.set(x, y, c.skinS);
    }
  }
  if (dir === 'down') {
    p.set(cx - 3, hy + 6, c.eye);
    p.set(cx - 3, hy + 7, c.eye);
    p.set(cx + 2, hy + 6, c.eye);
    p.set(cx + 2, hy + 7, c.eye);
    p.set(cx - 3, hy + 6, shade(c.eye, 0.25));
    p.set(cx + 2, hy + 6, shade(c.eye, 0.25));
    p.set(cx - 1, hy + 9, c.skinS);
    p.set(cx, hy + 9, c.skinS);
  } else if (dir === 'left') {
    p.set(cx - 3, hy + 6, c.eye);
    p.set(cx - 3, hy + 7, c.eye);
    p.set(cx - 6, hy + 7, c.skin);
    p.set(cx - 5, hy + 9, c.skinS);
  } else if (dir === 'right') {
    p.set(cx + 2, hy + 6, c.eye);
    p.set(cx + 2, hy + 7, c.eye);
    p.set(cx + 5, hy + 7, c.skin);
    p.set(cx + 4, hy + 9, c.skinS);
  }
}

function drawHair(p: Pix, l: HumanLook, c: Pal, dir: Facing, hy: number, dx: number, layer: 'back' | 'front'): void {
  const style = l.hairStyle ?? 'short';
  const cx = 8 + dx;
  const H = c.hair;
  const S = c.hairS;
  const top = hy;
  if (style === 'bald') {
    if (layer === 'front' && dir !== 'down') p.ellipse(cx, top + 4, 4, 2, shade(c.skin, 0.12));
    return;
  }
  if (layer === 'back') {
    if (style === 'long' || style === 'wild') {
      if (dir === 'up') p.rect(cx - 5, top + 5, 11, 12, H);
      else if (dir === 'down') {
        p.rect(cx - 6, top + 5, 2, 12, S);
        p.rect(cx + 5, top + 5, 2, 12, S);
      } else {
        const bx = dir === 'left' ? cx + 1 : cx - 6;
        p.rect(bx, top + 4, 6, 12, H);
      }
    }
    if (style === 'ponytail') {
      if (dir === 'up') {
        p.rect(cx - 1, top + 9, 3, 9, H);
        p.vline(cx + 1, top + 9, top + 17, S);
      } else if (dir === 'left') {
        p.rect(cx + 4, top + 2, 3, 3, H);
        p.rect(cx + 5, top + 5, 2, 8, H);
        p.vline(cx + 6, top + 5, top + 13, S);
      } else if (dir === 'right') {
        p.rect(cx - 6, top + 2, 3, 3, H);
        p.rect(cx - 6, top + 5, 2, 8, H);
        p.vline(cx - 6, top + 5, top + 13, S);
      } else {
        p.rect(cx - 1, top - 2, 3, 3, H);
      }
    }
    if (style === 'bun' && dir !== 'down') {
      const bx = dir === 'up' ? cx : dir === 'left' ? cx + 4 : cx - 4;
      p.ellipse(bx, top + 1, 2.6, 2.4, H);
      p.set(bx + 1, top + 2, S);
    }
    if (style === 'twin') {
      p.ellipse(cx - 6, top + 3, 2.2, 2.2, H);
      p.ellipse(cx + 6, top + 3, 2.2, 2.2, H);
    }
    return;
  }
  const capTo = dir === 'up' ? top + 10 : top + 3;
  for (let y = top - 1; y <= capTo; y++) {
    for (let x = cx - 6; x <= cx + 6; x++) {
      const nx = (x + 0.5 - cx) / 5.9;
      const ny = (y + 0.5 - (top + 5.3)) / 5.9;
      if (nx * nx + ny * ny <= 1) p.set(x, y, y > capTo - 1 && dir !== 'up' ? S : H);
    }
  }
  if (dir === 'down') {
    for (let x = cx - 5; x <= cx + 5; x++) {
      const k = (x * 7 + top) % 3;
      p.set(x, top + 4, H);
      if (k !== 0) p.set(x, top + 5, x % 2 ? H : S);
    }
    p.rect(cx - 6, top + 4, 1, 5, H);
    p.rect(cx + 5, top + 4, 1, 5, H);
    p.set(cx - 2, top + 1, c.hairH);
    p.set(cx - 1, top + 1, c.hairH);
    p.set(cx - 3, top + 2, c.hairH);
  } else if (dir === 'up') {
    p.rect(cx - 5, top + 9, 11, 2, S);
    p.set(cx - 2, top + 2, c.hairH);
    p.set(cx - 1, top + 2, c.hairH);
  } else {
    const back = dir === 'left' ? 1 : -1;
    for (let y = top + 3; y <= top + 9; y++) {
      for (let x = cx; x !== cx + back * 7; x += back) {
        const nx = (x + 0.5 - cx) / 5.9;
        const ny = (y + 0.5 - (top + 5.3)) / 5.9;
        if (nx * nx + ny * ny <= 1 && Math.abs(x - cx) >= 1) p.set(x, y, y > top + 8 ? S : H);
      }
    }
    const fx = dir === 'left' ? cx - 5 : cx + 4;
    p.rect(fx, top + 3, 2, 2, H);
    p.set(dir === 'left' ? cx - 1 : cx, top + 1, c.hairH);
  }
  if (style === 'spiky') {
    for (const sx of [-4, -1, 2, 5]) {
      p.set(cx + sx, top - 2, H);
      p.set(cx + sx, top - 1, H);
      p.set(cx + sx - 1, top - 1, H);
    }
  }
  if (style === 'topknot') {
    p.rect(cx - 1, top - 3, 3, 3, H);
    p.hline(cx - 1, cx + 1, top, c.acc);
    p.set(cx, top - 4, c.acc);
  }
  if (style === 'wild') {
    for (const sx of [-5, -2, 1, 4]) p.set(cx + sx, top - 1, H);
  }
  if (style === 'bob' && dir !== 'up') {
    if (dir === 'down') {
      p.rect(cx - 6, top + 4, 2, 7, H);
      p.rect(cx + 5, top + 4, 2, 7, H);
    } else {
      const bx = dir === 'left' ? cx + 1 : cx - 6;
      p.rect(bx, top + 4, 6, 7, H);
    }
  }
  if (style === 'bob' && dir === 'up') p.rect(cx - 6, top + 5, 13, 6, H);
  if (style === 'long' && dir === 'down') {
    p.rect(cx - 6, top + 4, 2, 10, H);
    p.rect(cx + 5, top + 4, 2, 10, H);
  }
  if (style === 'bun' && dir === 'down') {
    p.ellipse(cx, top - 1, 2.6, 2.2, H);
    p.set(cx + 1, top - 1, c.hairH);
  }
}

function drawHat(p: Pix, l: HumanLook, c: Pal, dir: Facing, hy: number, dx: number): void {
  const style = l.hairStyle;
  const cx = 8 + dx;
  if (style === 'cap') {
    p.ellipse(cx, hy + 3, 6.2, 3.6, c.hat);
    p.hline(cx - 6, cx + 6, hy + 5, c.hatS);
    if (dir === 'down') p.hline(cx - 4, cx + 4, hy + 6, c.hatS);
    if (dir === 'left') p.hline(cx - 8, cx - 4, hy + 5, c.hatS);
    if (dir === 'right') p.hline(cx + 4, cx + 8, hy + 5, c.hatS);
    p.set(cx, hy, shade(c.hat, 0.3));
  } else if (style === 'helmet') {
    p.ellipse(cx, hy + 4, 6.3, 4.8, c.hat);
    p.hline(cx - 6, cx + 6, hy + 6, c.hatS);
    p.set(cx - 2, hy + 1, shade(c.hat, 0.35));
    p.set(cx - 1, hy + 1, shade(c.hat, 0.35));
    if (dir !== 'up') p.rect(dir === 'right' ? cx - 1 : dir === 'left' ? cx - 6 : cx - 5, hy + 7, dir === 'down' ? 11 : 7, 1, c.acc);
  } else if (style === 'hood') {
    p.ellipse(cx, hy + 5, 6.6, 6.2, c.hat);
    if (dir === 'down') p.ellipse(cx, hy + 7.5, 4.4, 4, c.skin);
    if (dir === 'left') p.ellipse(cx - 2, hy + 7.5, 3.4, 4, c.skin);
    if (dir === 'right') p.ellipse(cx + 2, hy + 7.5, 3.4, 4, c.skin);
    p.set(cx - 5, hy + 3, shade(c.hat, 0.25));
  } else if (style === 'sagehat') {
    p.poly([[cx - 4, hy + 4], [cx + 5, hy + 4], [cx + 3, hy - 4], [cx - 2, hy - 4]], c.hat);
    p.rect(cx - 1, hy - 7, 3, 4, c.hat);
    p.hline(cx - 4, cx + 4, hy + 3, c.acc);
    p.set(cx, hy - 7, c.acc);
  }
}

function drawEyesOver(p: Pix, l: HumanLook, c: Pal, dir: Facing, hy: number, dx: number): void {
  const cx = 8 + dx;
  const ex = l.extra ?? [];
  if (dir === 'up') return;
  if (ex.includes('visor') || l.hairStyle === 'helmet') {
    const col = l.glow ?? '#60f0e0';
    if (dir === 'down') p.hline(cx - 4, cx + 3, hy + 7, col);
    else if (dir === 'left') p.hline(cx - 5, cx - 1, hy + 7, col);
    else p.hline(cx, cx + 4, hy + 7, col);
  }
  if (ex.includes('mask')) {
    const col = c.acc2;
    if (dir === 'down') p.rect(cx - 4, hy + 8, 8, 3, col);
    else if (dir === 'left') p.rect(cx - 6, hy + 8, 5, 3, col);
    else p.rect(cx + 1, hy + 8, 5, 3, col);
  }
  if (ex.includes('glasses')) {
    if (dir === 'down') {
      p.set(cx - 4, hy + 6, '#e0e8f0');
      p.set(cx - 3, hy + 6, '#a0b0c0');
      p.set(cx + 2, hy + 6, '#a0b0c0');
      p.set(cx + 3, hy + 6, '#e0e8f0');
      p.hline(cx - 2, cx + 1, hy + 6, '#303030');
    } else if (dir === 'left') p.set(cx - 4, hy + 6, '#e0e8f0');
    else p.set(cx + 3, hy + 6, '#e0e8f0');
  }
  if (ex.includes('goggles')) {
    const y = hy + 3;
    p.hline(cx - 5, cx + 5, y + 1, '#3a2c20');
    if (dir === 'down') {
      p.rect(cx - 4, y, 3, 2, '#e8b040');
      p.rect(cx + 1, y, 3, 2, '#e8b040');
      p.set(cx - 3, y, '#fff0b0');
      p.set(cx + 2, y, '#fff0b0');
    } else if (dir === 'left') p.rect(cx - 6, y, 3, 2, '#e8b040');
    else p.rect(cx + 3, y, 3, 2, '#e8b040');
  }
  if (ex.includes('headband')) {
    const y = hy + 3;
    if (dir === 'down') p.hline(cx - 5, cx + 5, y, c.acc);
    else if (dir === 'left') {
      p.hline(cx - 6, cx + 4, y, c.acc);
      p.set(cx + 5, y + 1, c.acc);
      p.set(cx + 6, y + 2, c.acc);
    } else {
      p.hline(cx - 4, cx + 6, y, c.acc);
      p.set(cx - 5, y + 1, c.acc);
      p.set(cx - 6, y + 2, c.acc);
    }
  }
  if (ex.includes('beard')) {
    if (dir === 'down') {
      p.rect(cx - 4, hy + 8, 8, 3, c.hair);
      p.rect(cx - 2, hy + 11, 4, 2, c.hair);
      p.hline(cx - 1, cx, hy + 9, c.skinS);
    } else if (dir === 'left') p.rect(cx - 5, hy + 8, 5, 4, c.hair);
    else p.rect(cx, hy + 8, 5, 4, c.hair);
  }
  if (ex.includes('mustache')) {
    if (dir === 'down') {
      p.hline(cx - 3, cx - 1, hy + 8, c.hair);
      p.hline(cx, cx + 2, hy + 8, c.hair);
    } else if (dir === 'left') p.hline(cx - 5, cx - 3, hy + 8, c.hair);
    else p.hline(cx + 2, cx + 4, hy + 8, c.hair);
  }
  if (ex.includes('scar')) {
    const sx = dir === 'right' ? cx + 3 : cx - 4;
    p.set(sx, hy + 5, shade(c.skin, -0.35));
    p.set(sx + 1, hy + 6, shade(c.skin, -0.35));
  }
  if (ex.includes('marking')) {
    p.set(cx - 1, hy + 4, l.glow ?? '#e05030');
    p.set(cx, hy + 4, l.glow ?? '#e05030');
  }
}

interface Limbs {
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  pose: Pose;
}

function limbsFor(pose: Pose): Limbs {
  switch (pose) {
    case 'walk1':
      return { armL: -1, armR: 1, legL: 1, legR: -1, pose };
    case 'walk2':
      return { armL: 1, armR: -1, legL: -1, legR: 1, pose };
    default:
      return { armL: 0, armR: 0, legL: 0, legR: 0, pose };
  }
}

function drawBody(p: Pix, l: HumanLook, c: Pal, dir: Facing, f: Frame, lim: Limbs, dy: number): void {
  const ts = l.topStyle ?? 'tunic';
  const bs = l.bottomStyle ?? 'pants';
  const ex = l.extra ?? [];
  const tt = f.torsoTop + dy;
  const tb = f.torsoBot + dy;
  const lb = f.legBot;
  const x0 = f.tx0;
  const x1 = f.tx1;
  const side = dir === 'left' || dir === 'right';
  const hand = ex.includes('gloves') ? c.acc2 : c.skin;
  const sleeve = ts === 'vest' ? c.skin : c.top;
  const sleeveS = ts === 'vest' ? c.skinS : c.topS;
  const legTop = tb + 1;
  const long = ts === 'robe' || ts === 'coat' || ts === 'dress' || bs === 'robe';
  const skirtBot = ts === 'robe' || bs === 'robe' ? lb - 1 : ts === 'coat' ? lb - 3 : ts === 'dress' ? lb - 2 : tb;
  const drawLeg = (lx: number, w: number, off: number) => {
    const bottom = lb + Math.min(0, off);
    const topy = legTop;
    p.rect(lx, topy, w, bottom - topy, c.bot);
    p.vline(lx + w - 1, topy, bottom - 1, c.botS);
    p.rect(lx, bottom - 1, w, 1, c.shoe);
    if (bottom - 1 >= topy + 1) p.rect(lx, bottom - 1, w, 1, c.shoe);
    p.set(lx, bottom - 1, shade(c.shoe, 0.25));
  };
  if (!side) {
    const lw = 3;
    const lL = 8 - lw - (x1 - x0 > 7 ? 0 : 0);
    if (lim.pose === 'kneel') {
      p.rect(x0, lb - 4, x1 - x0 + 1, 3, c.bot);
      p.rect(x0, lb - 1, 3, 1, c.shoe);
      p.rect(x1 - 2, lb - 1, 3, 1, c.shoe);
    } else {
      drawLeg(lL, lw, lim.legL);
      drawLeg(8, lw, lim.legR);
    }
  } else {
    const fwd = dir === 'left' ? -1 : 1;
    if (lim.pose === 'kneel') {
      p.rect(6, lb - 4, 5, 3, c.bot);
      p.rect(dir === 'left' ? 4 : 8, lb - 1, 4, 1, c.shoe);
    } else if (lim.legL === 0 && lim.pose !== 'strike') {
      drawLeg(6, 4, 0);
    } else {
      const a = lim.pose === 'strike' ? 2 : 1;
      drawLeg(6 + fwd * a, 3, 0);
      drawLeg(7 - fwd * a, 3, -1);
    }
  }
  if (long) {
    for (let y = tb; y <= skirtBot; y++) {
      const spread = Math.floor((y - tb) / 3);
      const a = side ? 5 - spread : x0 - spread;
      const b = side ? 10 + spread : x1 + spread;
      p.hline(a, b, y, c.top);
      p.set(b, y, c.topS);
    }
    if (ts === 'robe' || bs === 'robe') p.hline(side ? 5 : x0 - 2, side ? 10 : x1 + 2, skirtBot, c.acc);
  }
  const bx0 = side ? 5 : x0;
  const bx1 = side ? 10 : x1;
  p.rect(bx0, tt, bx1 - bx0 + 1, tb - tt + 1, c.top);
  p.vline(bx1, tt, tb, c.topS);
  p.hline(bx0, bx1, tb, c.topS);
  if (!side) p.vline(bx0, tt + 1, tb - 1, c.topH);
  if (dir === 'down') {
    if (ts === 'tunic' || ts === 'robe' || ts === 'dress') {
      p.set(7, tt, c.acc);
      p.set(8, tt, c.acc);
      p.set(7, tt + 1, c.acc);
      p.set(8, tt + 1, c.acc2);
    }
    if (ts === 'jacket' || ts === 'coat') {
      p.vline(7, tt, tb, c.acc);
      p.vline(8, tt, tb, c.acc2);
      p.set(6, tt, c.topH);
      p.set(9, tt, c.topH);
    }
    if (ts === 'armor') {
      p.hline(bx0, bx1, tt + 2, c.topH);
      p.rect(6, tt + 3, 4, 2, c.acc);
      p.set(8, tt + 3, shade(c.acc, 0.4));
    }
    if (ts === 'apron') {
      p.rect(5, tt + 2, 6, tb - tt + 4, c.acc);
      p.vline(10, tt + 2, tb + 3, c.acc2);
    }
    if (ts === 'vest') {
      p.vline(7, tt, tb, c.acc2);
      p.vline(8, tt, tb, c.acc2);
    }
    if (ex.includes('sash') || ts === 'tunic') p.hline(bx0, bx1, tb - 1, c.acc);
    if (ex.includes('scarf')) {
      p.hline(bx0 + 1, bx1 - 1, tt, c.acc);
      p.vline(bx1 - 2, tt, tt + 3, c.acc);
    }
    if (ex.includes('toolbelt')) {
      p.hline(bx0, bx1, tb - 1, '#5a4028');
      p.set(bx0 + 1, tb, '#a0a0a8');
      p.set(bx1 - 1, tb, '#c09030');
    }
  } else if (dir === 'up') {
    if (ex.includes('sash') || ts === 'tunic') p.hline(bx0, bx1, tb - 1, c.acc);
    if (ex.includes('backpack')) p.rect(6, tt + 1, 4, 5, '#6a5030');
    if (ex.includes('scarf')) p.hline(bx0 + 1, bx1 - 1, tt, c.acc);
  } else {
    if (ex.includes('sash') || ts === 'tunic') p.hline(bx0, bx1, tb - 1, c.acc);
    if (ex.includes('backpack')) p.rect(dir === 'left' ? 10 : 3, tt + 1, 3, 5, '#6a5030');
    if (ex.includes('scarf')) {
      p.hline(bx0, bx1, tt, c.acc);
      p.set(dir === 'left' ? bx1 + 1 : bx0 - 1, tt + 1, c.acc);
    }
    if (ts === 'jacket' || ts === 'coat') p.vline(dir === 'left' ? 6 : 9, tt, tb, c.acc);
    if (ts === 'apron') p.rect(dir === 'left' ? 4 : 9, tt + 2, 3, tb - tt + 3, c.acc);
  }
  if (ts === 'armor' && !side) {
    p.rect(bx0 - 1, tt, 2, 2, c.topH);
    p.rect(bx1, tt, 2, 2, c.topH);
  }
  const arm = (ax: number, ay: number, len: number, handC = hand) => {
    p.vline(ax, ay, ay + len - 1, sleeve);
    p.set(ax, ay + len, handC);
  };
  const ay = tt + 1;
  const pose = lim.pose;
  if (!side) {
    const lx = bx0 - 1;
    const rx = bx1 + 1;
    if (pose === 'cast' || pose === 'victory') {
      p.vline(lx, tt - 4, tt, sleeve);
      p.set(lx, tt - 5, hand);
      if (pose === 'cast') {
        p.vline(rx, tt - 4, tt, sleeve);
        p.set(rx, tt - 5, hand);
      } else arm(rx, ay, 5);
    } else if (pose === 'guard') {
      p.hline(bx0, bx1, tt + 3, sleeveS);
      p.set(bx0 + 2, tt + 3, hand);
      p.set(bx1 - 2, tt + 3, hand);
    } else {
      arm(lx, ay, 5 + lim.armL);
      arm(rx, ay, 5 + lim.armR);
    }
  } else {
    const fwd = dir === 'left' ? -1 : 1;
    const shoulderX = 7 + (dir === 'left' ? 0 : 1);
    if (pose === 'strike') {
      p.hline(shoulderX, shoulderX + fwd * 5, ay + 1, sleeve);
      p.set(shoulderX + fwd * 6, ay + 1, hand);
      p.set(shoulderX + fwd * 6, ay, hand);
    } else if (pose === 'cast') {
      p.line(shoulderX, ay, shoulderX + fwd * 4, ay - 4, sleeve);
      p.set(shoulderX + fwd * 5, ay - 5, hand);
      p.set(shoulderX + fwd * 4, ay - 5, hand);
    } else if (pose === 'hurt') {
      p.line(shoulderX, ay, shoulderX - fwd * 3, ay + 3, sleeve);
      p.set(shoulderX - fwd * 4, ay + 4, hand);
    } else if (pose === 'guard') {
      p.hline(shoulderX, shoulderX + fwd * 3, ay + 2, sleeveS);
      p.vline(shoulderX + fwd * 3, ay - 1, ay + 1, sleeve);
      p.set(shoulderX + fwd * 3, ay - 2, hand);
    } else if (pose === 'victory') {
      p.vline(shoulderX, ay - 6, ay, sleeve);
      p.set(shoulderX, ay - 7, hand);
    } else {
      const sw = lim.armL;
      p.vline(shoulderX + sw * fwd, ay, ay + 4, sleeve);
      p.vline(shoulderX + 1 + sw * fwd, ay, ay + 4, sleeveS);
      p.set(shoulderX + sw * fwd, ay + 5, hand);
    }
  }
  if (ex.includes('cane') && dir !== 'up') {
    const cxn = dir === 'left' ? 3 : dir === 'right' ? 12 : 13;
    p.vline(cxn, tt + 3, lb - 1, '#7a5a30');
    p.set(cxn, tt + 2, '#a07840');
  }
  if (ex.includes('wrench') && dir !== 'up') {
    const wx = dir === 'left' ? 2 : 13;
    p.vline(wx, tt + 4, tt + 9, '#a0a4b0');
    p.hline(wx - 1, wx + 1, tt + 3, '#c0c4d0');
  }
  if (ex.includes('staff') && dir !== 'up') {
    const wx = dir === 'left' ? 3 : 12;
    p.vline(wx, tt - 6, lb - 1, '#8a6a3a');
    p.set(wx, tt - 7, '#c0c0c8');
  }
}

export function drawHumanoid(l: HumanLook, dir: Facing, pose: Pose): Pix {
  const p = new Pix(16, 32);
  const c = palette(l);
  const f = frameFor(l);
  const lim = limbsFor(pose);
  let hy = f.headY;
  let dx = 0;
  let bodyDy = 0;
  if (l.build === 'old' && (dir === 'left' || dir === 'right')) dx = dir === 'left' ? -1 : 1;
  if (pose === 'hurt') dx += dir === 'left' ? 1 : dir === 'right' ? -1 : 0;
  if (pose === 'strike') dx += dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  if (pose === 'kneel') {
    hy += 4;
    bodyDy = 4;
  }
  const bf: Frame = { ...f, torsoTop: f.torsoTop, torsoBot: f.torsoBot };
  if (dir !== 'up') drawHair(p, l, c, dir, hy, dx, 'back');
  drawBody(p, l, c, dir, bf, lim, bodyDy);
  p.rect(7, hy + 11, 2, f.torsoTop + bodyDy - hy - 11, c.skinS);
  drawHead(p, l, c, dir, hy, dx);
  if (!['cap', 'helmet', 'hood', 'sagehat'].includes(l.hairStyle ?? '')) drawHair(p, l, c, dir, hy, dx, 'front');
  else if (l.hairStyle === 'cap' || l.hairStyle === 'sagehat') {
    const ls = { ...l, hairStyle: 'short' };
    drawHair(p, ls, c, dir, hy, dx, 'front');
  }
  if (dir === 'up') drawHair(p, l, c, dir, hy, dx, 'back');
  drawHat(p, l, c, dir, hy, dx);
  drawEyesOver(p, l, c, dir, hy, dx);
  outlineAuto(p);
  if (pose === 'sleep') return p.rotate90().shift(0, 0);
  return p;
}

export function drawKO(l: HumanLook): Pix {
  const stand = drawHumanoid(l, 'left', 'stand');
  const rot = new Pix(32, 16);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
    const v = stand.data[y * 16 + x];
    if (v) rot.set(y, 15 - x, v);
  }
  return rot;
}
