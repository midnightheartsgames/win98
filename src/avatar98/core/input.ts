export type Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'menu' | 'run' | 'debug' | 'extra';

const ACTIONS: Action[] = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'menu', 'run', 'debug', 'extra'];

const KEYMAP: Record<string, Action> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'confirm',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Space: 'confirm',
  KeyX: 'cancel',
  Escape: 'cancel',
  Backspace: 'cancel',
  KeyC: 'menu',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  F9: 'debug',
  KeyV: 'extra',
  Tab: 'extra'
};

const PAD_BUTTONS: [number, Action][] = [
  [0, 'confirm'],
  [1, 'cancel'],
  [3, 'menu'],
  [9, 'menu'],
  [2, 'run'],
  [5, 'extra'],
  [12, 'up'],
  [13, 'down'],
  [14, 'left'],
  [15, 'right']
];

export class Input {
  private keys = new Set<Action>();
  private pad = new Set<Action>();
  private held: Record<Action, number> = Object.fromEntries(ACTIONS.map((a) => [a, 0])) as Record<Action, number>;
  private pressedNow = new Set<Action>();
  private latched = new Set<Action>();
  private typed: string[] = [];
  private ac = new AbortController();
  private isActive: () => boolean;
  lastDevice: 'keyboard' | 'gamepad' = 'keyboard';
  onFirstGesture: (() => void) | null = null;

  constructor(target: Window, isActive: () => boolean) {
    this.isActive = isActive;
    const sig = { signal: this.ac.signal };
    target.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (!this.isActive()) return;
        const a = KEYMAP[e.code];
        if (this.onFirstGesture) {
          const f = this.onFirstGesture;
          this.onFirstGesture = null;
          f();
        }
        if (e.key.length === 1 && !a && !e.ctrlKey && !e.metaKey && !e.altKey) this.typed.push(e.key);
        if (a) {
          if (!e.repeat) this.latched.add(a);
          this.keys.add(a);
          this.lastDevice = 'keyboard';
          e.preventDefault();
          e.stopPropagation();
        }
      },
      sig
    );
    target.addEventListener(
      'keyup',
      (e: KeyboardEvent) => {
        const a = KEYMAP[e.code];
        if (a) this.keys.delete(a);
      },
      sig
    );
    target.addEventListener('blur', () => this.clear(), sig);
  }

  clear(): void {
    this.keys.clear();
    this.pad.clear();
    this.latched.clear();
    for (const a of ACTIONS) this.held[a] = 0;
  }

  private pollPad(): void {
    this.pad.clear();
    const nav = globalThis.navigator as Navigator | undefined;
    if (!nav || !nav.getGamepads) return;
    for (const gp of nav.getGamepads()) {
      if (!gp || !gp.connected) continue;
      for (const [i, a] of PAD_BUTTONS) if (gp.buttons[i]?.pressed) this.pad.add(a);
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      if (ax < -0.5) this.pad.add('left');
      if (ax > 0.5) this.pad.add('right');
      if (ay < -0.5) this.pad.add('up');
      if (ay > 0.5) this.pad.add('down');
      if (this.pad.size) this.lastDevice = 'gamepad';
    }
  }

  update(): void {
    this.pollPad();
    this.pressedNow.clear();
    for (const a of ACTIONS) {
      const down = this.keys.has(a) || this.pad.has(a);
      if (down) {
        if (this.held[a] === 0) this.pressedNow.add(a);
        this.held[a]++;
      } else {
        if (this.latched.has(a) && this.held[a] === 0) this.pressedNow.add(a);
        this.held[a] = 0;
      }
    }
    this.latched.clear();
  }

  down(a: Action): boolean {
    return this.held[a] > 0;
  }
  pressed(a: Action): boolean {
    return this.pressedNow.has(a);
  }
  repeat(a: Action): boolean {
    const h = this.held[a];
    return h === 1 || (h > 18 && (h - 18) % 5 === 0);
  }
  consume(a: Action): void {
    this.pressedNow.delete(a);
  }
  takeTyped(): string[] {
    const t = this.typed;
    this.typed = [];
    return t;
  }
  anyPressed(): boolean {
    return this.pressedNow.size > 0;
  }
  press(a: Action): void {
    this.keys.add(a);
  }
  release(a: Action): void {
    this.keys.delete(a);
  }
  destroy(): void {
    this.ac.abort();
  }
}
