export type ExprValue = number | boolean;
export type Resolver = (name: string) => ExprValue | undefined;

type Tok = { k: 'id' | 'num' | 'op' | 'lp' | 'rp'; v: string };

const OPS = ['&&', '||', '>=', '<=', '==', '!=', '>', '<', '!', '+', '-'];

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (c === '(') {
      out.push({ k: 'lp', v: c });
      i++;
      continue;
    }
    if (c === ')') {
      out.push({ k: 'rp', v: c });
      i++;
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (op) {
      out.push({ k: 'op', v: op });
      i += op.length;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ k: 'num', v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
      out.push({ k: 'id', v: src.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`unexpected character '${c}' in condition "${src}"`);
  }
  return out;
}

type Node =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'not'; a: Node }
  | { t: 'neg'; a: Node }
  | { t: 'bin'; op: string; a: Node; b: Node };

const PREC: Record<string, number> = { '||': 1, '&&': 2, '==': 3, '!=': 3, '>': 4, '<': 4, '>=': 4, '<=': 4, '+': 5, '-': 5 };

class Parser {
  private p = 0;
  private toks: Tok[];
  private src: string;
  constructor(toks: Tok[], src: string) {
    this.toks = toks;
    this.src = src;
  }
  parse(): Node {
    const n = this.bin(0);
    if (this.p < this.toks.length) throw new Error(`unexpected '${this.toks[this.p].v}' in condition "${this.src}"`);
    return n;
  }
  private bin(minPrec: number): Node {
    let left = this.unary();
    for (;;) {
      const t = this.toks[this.p];
      if (!t || t.k !== 'op' || PREC[t.v] === undefined || PREC[t.v] < minPrec) return left;
      this.p++;
      const right = this.bin(PREC[t.v] + 1);
      left = { t: 'bin', op: t.v, a: left, b: right };
    }
  }
  private unary(): Node {
    const t = this.toks[this.p];
    if (!t) throw new Error(`unexpected end of condition "${this.src}"`);
    if (t.k === 'op' && t.v === '!') {
      this.p++;
      return { t: 'not', a: this.unary() };
    }
    if (t.k === 'op' && t.v === '-') {
      this.p++;
      return { t: 'neg', a: this.unary() };
    }
    if (t.k === 'lp') {
      this.p++;
      const n = this.bin(0);
      if (this.toks[this.p]?.k !== 'rp') throw new Error(`missing ')' in condition "${this.src}"`);
      this.p++;
      return n;
    }
    if (t.k === 'num') {
      this.p++;
      return { t: 'num', v: parseFloat(t.v) };
    }
    if (t.k === 'id') {
      this.p++;
      if (t.v === 'true') return { t: 'num', v: 1 };
      if (t.v === 'false') return { t: 'num', v: 0 };
      return { t: 'id', v: t.v };
    }
    throw new Error(`unexpected '${t.v}' in condition "${this.src}"`);
  }
}

const cache = new Map<string, Node>();

export function compileExpr(src: string): Node {
  let n = cache.get(src);
  if (!n) {
    n = new Parser(tokenize(src), src).parse();
    cache.set(src, n);
  }
  return n;
}

export function exprIdentifiers(src: string): string[] {
  return tokenize(src)
    .filter((t) => t.k === 'id' && t.v !== 'true' && t.v !== 'false')
    .map((t) => t.v);
}

const num = (v: ExprValue | undefined): number => (v === undefined ? 0 : typeof v === 'boolean' ? (v ? 1 : 0) : v);

function run(n: Node, r: Resolver): number {
  switch (n.t) {
    case 'num':
      return n.v;
    case 'id':
      return num(r(n.v));
    case 'not':
      return run(n.a, r) ? 0 : 1;
    case 'neg':
      return -run(n.a, r);
    case 'bin': {
      if (n.op === '&&') return run(n.a, r) && run(n.b, r) ? 1 : 0;
      if (n.op === '||') return run(n.a, r) || run(n.b, r) ? 1 : 0;
      const a = run(n.a, r);
      const b = run(n.b, r);
      switch (n.op) {
        case '==':
          return a === b ? 1 : 0;
        case '!=':
          return a !== b ? 1 : 0;
        case '>':
          return a > b ? 1 : 0;
        case '<':
          return a < b ? 1 : 0;
        case '>=':
          return a >= b ? 1 : 0;
        case '<=':
          return a <= b ? 1 : 0;
        case '+':
          return a + b;
        case '-':
          return a - b;
      }
    }
  }
  return 0;
}

export function evalExpr(src: string | undefined | null, r: Resolver): boolean {
  if (src === undefined || src === null || src === '') return true;
  return run(compileExpr(src), r) !== 0;
}

export function evalNumber(src: string, r: Resolver): number {
  return run(compileExpr(src), r);
}
