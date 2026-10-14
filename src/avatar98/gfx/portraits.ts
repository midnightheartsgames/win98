import { Pix, shade } from './pixel.ts';
import { outlineAuto } from './humanoid.ts';
import type { HumanLook } from './humanoid.ts';
import type { CreatureLook } from './creatures.ts';

export type Emotion = 'normal' | 'happy' | 'angry' | 'sad' | 'surprised';
export const EMOTIONS: Emotion[] = ['normal', 'happy', 'angry', 'sad', 'surprised'];

function eye(p: Pix, x: number, y: number, iris: string, emo: Emotion, flip: boolean, old: boolean): void {
  const dark = '#1a1018';
  if (emo === 'happy') {
    p.hline(x, x + 4, y + 1, dark);
    p.set(x, y + 2, dark);
    p.set(x + 4, y + 2, dark);
    return;
  }
  const h = emo === 'surprised' ? 4 : old ? 2 : 3;
  const top = emo === 'surprised' ? y - 1 : y;
  p.rect(x, top + 1, 5, h, '#f8f4f0');
  p.hline(x, x + 4, top, dark);
  if (emo !== 'surprised') p.set(flip ? x : x + 4, top + 1, dark);
  const ix = x + 1 + (emo === 'surprised' ? 1 : 0);
  const iw = emo === 'surprised' ? 2 : 3;
  p.rect(ix, top + 1, iw, h, iris);
  p.rect(ix + (iw > 2 ? 1 : 0), top + 1, 1, Math.max(1, h - 1), shade(iris, -0.5));
  p.set(ix, top + 1, '#ffffff');
  if (emo === 'sad') p.set(flip ? x + 4 : x, top + h + 1, '#90c8f0');
}

function brow(p: Pix, x: number, y: number, emo: Emotion, left: boolean, col: string): void {
  const pts: Record<Emotion, [number, number]> = { normal: [0, 0], happy: [-1, -1], angry: [1, -1], sad: [-1, 1], surprised: [-2, -2] };
  const [inner, outer] = pts[emo];
  const inX = left ? x + 4 : x;
  const outX = left ? x : x + 4;
  p.line(outX, y + (emo === 'angry' ? -1 : emo === 'sad' ? 1 : 0) + (emo === 'surprised' ? -2 : 0), inX, y + inner + (emo === 'surprised' ? 0 : 0), col);
  p.line(outX, y + 1 + (emo === 'angry' ? -1 : emo === 'sad' ? 1 : 0) + (emo === 'surprised' ? -2 : 0), inX, y + 1 + inner, col);
  void outer;
}

function mouth(p: Pix, cx: number, y: number, emo: Emotion, skin: string): void {
  const m = '#6a2828';
  switch (emo) {
    case 'happy':
      p.hline(cx - 3, cx + 3, y, m);
      p.hline(cx - 2, cx + 2, y + 1, '#c04848');
      p.set(cx - 4, y - 1, m);
      p.set(cx + 4, y - 1, m);
      break;
    case 'angry':
      p.rect(cx - 3, y, 7, 2, m);
      p.hline(cx - 2, cx + 2, y, '#f0f0f0');
      break;
    case 'sad':
      p.hline(cx - 2, cx + 2, y, m);
      p.set(cx - 3, y + 1, m);
      p.set(cx + 3, y + 1, m);
      break;
    case 'surprised':
      p.ellipse(cx, y + 1, 1.8, 2, m);
      break;
    default:
      p.hline(cx - 2, cx + 2, y, shade(skin, -0.45));
  }
}

export function drawPortrait(l: HumanLook, emo: Emotion): Pix {
  const p = new Pix(48, 48);
  const skin = l.skin ?? '#f0c8a0';
  const skinS = shade(skin, -0.16);
  const hair = l.hair ?? '#2a1a14';
  const hairS = shade(hair, -0.3);
  const hairH = shade(hair, 0.28);
  const top = l.top ?? '#a02828';
  const acc = l.accent ?? '#d8a838';
  const iris = l.eyes ?? '#5a3020';
  const style = l.hairStyle ?? 'short';
  const ex = l.extra ?? [];
  const old = l.build === 'old';
  const child = l.build === 'child';
  const cx = 24;
  const fy = child ? 25 : 23;
  if (style === 'long' || style === 'wild') p.rect(cx - 14, fy - 10, 29, 30, hairS);
  if (style === 'ponytail') {
    p.ellipse(cx + 10, fy - 13, 5, 4, hair);
    p.rect(cx + 11, fy - 12, 5, 16, hair);
    p.vline(cx + 15, fy - 10, fy + 4, hairS);
  }
  if (style === 'bun') p.ellipse(cx, fy - 15, 6, 5, hair);
  if (style === 'twin') {
    p.ellipse(cx - 13, fy - 11, 4.5, 4.5, hair);
    p.ellipse(cx + 13, fy - 11, 4.5, 4.5, hair);
  }
  if (style === 'topknot') {
    p.rect(cx - 3, fy - 20, 7, 6, hair);
    p.hline(cx - 3, cx + 3, fy - 15, acc);
    p.rect(cx - 1, fy - 22, 3, 2, acc);
  }
  const shoulderTop = 39;
  p.ellipse(cx, 50, 21, 12, top);
  p.ellipse(cx + 6, 50, 15, 10, shade(top, -0.2));
  const ts = l.topStyle ?? 'tunic';
  if (ts === 'jacket' || ts === 'coat') {
    p.poly([[cx - 5, shoulderTop], [cx + 5, shoulderTop], [cx + 2, 47], [cx - 2, 47]], acc);
    p.line(cx - 6, shoulderTop, cx - 2, 47, shade(top, 0.25));
    p.line(cx + 6, shoulderTop, cx + 2, 47, shade(top, -0.4));
  } else if (ts === 'armor') {
    p.rect(cx - 17, 41, 10, 5, shade(top, 0.25));
    p.rect(cx + 8, 41, 10, 5, shade(top, 0.1));
    p.rect(cx - 4, 42, 8, 5, acc);
  } else if (ts === 'vest') {
    p.poly([[cx - 6, shoulderTop], [cx + 6, shoulderTop], [cx + 3, 47], [cx - 3, 47]], skin);
  } else {
    p.poly([[cx - 6, shoulderTop], [cx + 6, shoulderTop], [cx, 46]], acc);
    p.poly([[cx - 4, shoulderTop], [cx + 4, shoulderTop], [cx, 43]], skinS);
  }
  if (ex.includes('scarf')) p.rect(cx - 10, shoulderTop - 1, 21, 4, acc);
  p.rect(cx - 4, fy + 8, 9, shoulderTop - fy - 7, skinS);
  const rx = child ? 12 : 11;
  const ry = child ? 12 : 13;
  p.ellipse(cx, fy, rx, ry, skin);
  p.poly([[cx - rx + 1, fy + 3], [cx + rx - 1, fy + 3], [cx + 4, fy + ry + 1], [cx - 4, fy + ry + 1]], skin);
  for (let y = fy - ry; y <= fy + ry + 1; y++) for (let x = cx + 5; x <= cx + rx + 1; x++) if (p.get(x, y) && (x - cx) * 1.1 + (y - fy) * 0.35 > 7) p.set(x, y, skinS);
  p.ellipse(cx - rx, fy + 1, 2, 3, skin);
  p.ellipse(cx + rx, fy + 1, 2, 3, skinS);
  const eyeY = fy;
  eye(p, cx - 9, eyeY, iris, emo, false, old);
  eye(p, cx + 4, eyeY, iris, emo, true, old);
  const browC = style === 'helmet' || style === 'hood' ? shade(skin, -0.5) : shade(hair, -0.1);
  brow(p, cx - 9, eyeY - 4, emo, true, browC);
  brow(p, cx + 4, eyeY - 4, emo, false, browC);
  p.set(cx, fy + 5, skinS);
  p.set(cx + 1, fy + 6, shade(skin, -0.3));
  mouth(p, cx, fy + 9, emo, skin);
  if (emo === 'happy' || emo === 'surprised') {
    p.hline(cx - 9, cx - 6, fy + 5, '#f09090');
    p.hline(cx + 6, cx + 9, fy + 5, '#f09090');
  }
  if (old) {
    p.line(cx - 10, eyeY + 4, cx - 8, eyeY + 5, skinS);
    p.line(cx + 8, eyeY + 5, cx + 10, eyeY + 4, shade(skinS, -0.1));
    p.line(cx - 5, fy + 7, cx - 6, fy + 10, skinS);
    p.line(cx + 5, fy + 7, cx + 6, fy + 10, shade(skinS, -0.1));
  }
  if (ex.includes('beard')) {
    p.poly([[cx - 10, fy + 4], [cx + 10, fy + 4], [cx + 6, fy + 17], [cx - 6, fy + 17]], hair);
    p.hline(cx - 3, cx + 3, fy + 9, '#6a2828');
  }
  if (ex.includes('mustache')) {
    p.poly([[cx - 6, fy + 7], [cx, fy + 6], [cx + 6, fy + 7], [cx + 5, fy + 9], [cx, fy + 8], [cx - 5, fy + 9]], hair);
  }
  if (ex.includes('mask')) p.poly([[cx - 11, fy + 4], [cx + 11, fy + 4], [cx + 7, fy + 14], [cx - 7, fy + 14]], l.accent2 ?? '#303840');
  if (ex.includes('scar')) p.line(cx + 5, eyeY - 5, cx + 8, eyeY + 6, shade(skin, -0.35));
  const helmetish = style === 'helmet' || style === 'hood' || style === 'cap' || style === 'sagehat';
  if (style !== 'bald' && style !== 'helmet' && style !== 'hood') {
    p.ellipse(cx, fy - 9, rx + 2, 7, hair);
    const lockW = 5;
    for (let lx = cx - rx - 1; lx <= cx + rx; lx += lockW - 1) {
      const k = Math.abs((lx * 7) % 5);
      const len = (style === 'spiky' || style === 'wild' ? 7 : 5) + (k % 3);
      p.poly([[lx, fy - 10], [lx + lockW, fy - 10], [lx + 2 + (k % 2), fy - 10 + len]], hair);
      p.line(lx + lockW - 1, fy - 9, lx + 2 + (k % 2), fy - 11 + len, hairS);
    }
    p.rect(cx - rx - 2, fy - 9, 3, style === 'long' || style === 'bob' || style === 'wild' ? 20 : 10, hair);
    p.rect(cx + rx, fy - 9, 3, style === 'long' || style === 'bob' || style === 'wild' ? 20 : 10, hairS);
    p.line(cx - 6, fy - 14, cx - 1, fy - 13, hairH);
    p.line(cx - 7, fy - 13, cx - 5, fy - 12, hairH);
    if (style === 'spiky') for (const sx of [-9, -4, 1, 6, 10]) p.poly([[cx + sx - 2, fy - 12], [cx + sx + 2, fy - 12], [cx + sx + 1, fy - 19]], hair);
    if (style === 'bob') {
      p.rect(cx - rx - 2, fy - 2, 4, 12, hair);
      p.rect(cx + rx - 1, fy - 2, 4, 12, hairS);
    }
  }
  if (style === 'bald') {
    p.ellipse(cx - 3, fy - 9, 4, 2, shade(skin, 0.2));
  }
  if (helmetish) {
    const hc = l.hat ?? top;
    if (style === 'cap') {
      p.ellipse(cx, fy - 11, rx + 3, 7, hc);
      p.rect(cx - rx - 2, fy - 8, 2 * rx + 5, 3, shade(hc, -0.3));
      p.rect(cx - 8, fy - 6, 17, 2, shade(hc, -0.45));
      p.set(cx, fy - 17, shade(hc, 0.3));
    } else if (style === 'helmet') {
      p.ellipse(cx, fy - 5, rx + 3, 12, hc);
      p.rect(cx - rx - 3, fy - 5, 2 * rx + 7, 3, shade(hc, -0.3));
      p.ellipse(cx - 4, fy - 12, 4, 2, shade(hc, 0.3));
      p.rect(cx - rx, fy - 2, 2 * rx + 1, 4, l.glow ?? '#60f0e0');
      p.hline(cx - rx, cx + rx, fy - 1, shade(l.glow ?? '#60f0e0', 0.5));
      p.rect(cx - rx - 3, fy - 2, 3, 12, shade(hc, -0.2));
      p.rect(cx + rx + 1, fy - 2, 3, 12, shade(hc, -0.35));
    } else if (style === 'hood') {
      p.ring(cx, fy + 1, rx + 5, ry + 6, hc);
      p.ellipse(cx, fy - 12, rx + 3, 5, hc);
      p.rect(cx - rx - 5, fy, 5, 16, hc);
      p.rect(cx + rx + 1, fy, 5, 16, shade(hc, -0.3));
    } else if (style === 'sagehat') {
      p.poly([[cx - 12, fy - 10], [cx + 12, fy - 10], [cx + 8, fy - 22], [cx - 7, fy - 22]], hc);
      p.rect(cx - 3, fy - 27, 7, 6, hc);
      p.hline(cx - 12, cx + 12, fy - 11, acc);
      p.rect(cx - 1, fy - 29, 3, 2, acc);
    }
  }
  if (ex.includes('headband')) p.rect(cx - rx - 1, fy - 9, 2 * rx + 3, 2, acc);
  if (ex.includes('goggles')) {
    p.rect(cx - rx - 2, fy - 11, 2 * rx + 5, 2, '#3a2c20');
    p.ellipse(cx - 5, fy - 11, 4, 3, '#e8b040');
    p.ellipse(cx + 5, fy - 11, 4, 3, '#e8b040');
    p.ellipse(cx - 6, fy - 12, 1.5, 1, '#fff0c0');
    p.ellipse(cx + 4, fy - 12, 1.5, 1, '#fff0c0');
  }
  if (ex.includes('glasses')) {
    p.ring(cx - 7, eyeY + 2, 4.5, 3.5, '#303038');
    p.ring(cx + 7, eyeY + 2, 4.5, 3.5, '#303038');
    p.hline(cx - 2, cx + 2, eyeY + 1, '#303038');
  }
  if (ex.includes('visor') && style !== 'helmet') p.rect(cx - rx, fy - 1, 2 * rx + 1, 3, l.glow ?? '#60f0e0');
  if (ex.includes('marking')) {
    p.poly([[cx - 2, fy - 8], [cx + 2, fy - 8], [cx, fy - 4]], l.glow ?? '#e05030');
  }
  if (ex.includes('earring')) p.set(cx - rx - 1, fy + 5, '#f0d040');
  outlineAuto(p, -0.6);
  return p;
}

export function drawCreaturePortrait(l: CreatureLook, emo: Emotion): Pix {
  const p = new Pix(48, 48);
  const c1 = l.c1 ?? '#f4ead8';
  const c2 = l.c2 ?? '#e87a40';
  const glow = l.glow ?? '#7af0e0';
  const eyeC = l.eye ?? '#203040';
  const cx = 24;
  if (l.kind === 'fox') {
    p.ellipse(cx, 44, 14, 10, c1);
    p.poly([[cx - 14, 20], [cx - 6, 4], [cx - 2, 18]], c2);
    p.poly([[cx + 14, 20], [cx + 6, 4], [cx + 2, 18]], c2);
    p.poly([[cx - 11, 18], [cx - 6, 8], [cx - 4, 18]], '#f8d0c0');
    p.poly([[cx + 11, 18], [cx + 6, 8], [cx + 4, 18]], '#f8d0c0');
    p.ellipse(cx, 27, 15, 12, c1);
    p.poly([[cx - 15, 28], [cx + 15, 28], [cx, 42]], c1);
    p.ellipse(cx, 36, 5, 4, '#ffffff');
    p.rect(cx - 2, 33, 5, 3, '#402830');
    p.line(cx - 12, 22, cx - 7, 20, glow);
    p.line(cx + 12, 22, cx + 7, 20, glow);
    p.poly([[cx - 2, 15], [cx + 2, 15], [cx, 19]], glow);
    const ey = 25;
    if (emo === 'happy') {
      p.line(cx - 10, ey + 1, cx - 7, ey - 1, eyeC);
      p.line(cx - 7, ey - 1, cx - 4, ey + 1, eyeC);
      p.line(cx + 4, ey + 1, cx + 7, ey - 1, eyeC);
      p.line(cx + 7, ey - 1, cx + 10, ey + 1, eyeC);
    } else {
      const h = emo === 'surprised' ? 6 : 5;
      p.ellipse(cx - 7, ey, 3, h / 2, eyeC);
      p.ellipse(cx + 7, ey, 3, h / 2, eyeC);
      p.set(cx - 8, ey - 1, '#ffffff');
      p.set(cx + 6, ey - 1, '#ffffff');
      if (emo === 'angry') {
        p.line(cx - 11, ey - 5, cx - 4, ey - 3, eyeC);
        p.line(cx + 11, ey - 5, cx + 4, ey - 3, eyeC);
      }
      if (emo === 'sad') {
        p.line(cx - 11, ey - 3, cx - 4, ey - 5, eyeC);
        p.line(cx + 11, ey - 3, cx + 4, ey - 5, eyeC);
        p.set(cx - 9, ey + 4, '#90c8f0');
      }
    }
    if (emo === 'happy') p.hline(cx - 3, cx + 3, 39, '#b04050');
    if (emo === 'surprised') p.ellipse(cx, 40, 1.5, 1.5, '#602030');
    p.hline(cx - 12, cx - 9, 31, '#f0a0a0');
    p.hline(cx + 9, cx + 12, 31, '#f0a0a0');
  } else {
    const body = c1;
    p.ellipse(cx, 30, 16, 14, body);
    p.ellipse(cx + 4, 34, 11, 9, shade(body, -0.2));
    p.ellipse(cx - 6, 26, 3, 3.5, eyeC);
    p.ellipse(cx + 6, 26, 3, 3.5, eyeC);
    p.set(cx - 7, 25, '#ffffff');
    p.set(cx + 5, 25, '#ffffff');
    if (l.kind === 'catowl') {
      p.poly([[cx - 15, 20], [cx - 10, 8], [cx - 5, 18]], body);
      p.poly([[cx + 15, 20], [cx + 10, 8], [cx + 5, 18]], body);
      p.ring(cx - 6, 26, 5.5, 5.5, c2);
      p.ring(cx + 6, 26, 5.5, 5.5, c2);
      p.poly([[cx - 2, 31], [cx + 2, 31], [cx, 35]], '#e0a030');
    } else if (l.kind === 'platydog') {
      p.rect(cx - 8, 32, 17, 6, c2);
      p.hline(cx - 7, cx + 7, 35, shade(c2, -0.3));
      p.ellipse(cx - 14, 24, 4, 7, shade(body, -0.25));
      p.ellipse(cx + 14, 24, 4, 7, shade(body, -0.25));
    } else {
      p.ellipse(cx, 36, 3, 2, shade(body, -0.4));
    }
  }
  outlineAuto(p, -0.55);
  return p;
}
