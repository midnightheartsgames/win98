(function (S) {
  'use strict';
  const EMPTY = 0, FILL = 1, SHADE = 2, EDGE = 3;
  const TONES = {
    white: ['#ffffff', '#bcd4f4', '#12306e'],
    blue: ['#2f5fb8', '#17387e', '#d8ecff'],
    gray: ['#b4bfd2', '#8c98b0', '#3c4a68'],
    red: ['#f04a3a', '#b01f18', '#3c0808'],
    gold: ['#ffd84a', '#d89a18', '#5a3408'],
    green: ['#5fe05a', '#22a02a', '#0a4010'],
    dark: ['#16326e', '#2a4a90', '#c8e4fa']
  };

  class Pen {
    constructor(size) {
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.ink = FILL;
    }

    dot(x, y) {
      if (x >= 0 && y >= 0 && x < this.size && y < this.size) this.data[x + y * this.size] = this.ink;
    }

    rect(x, y, w, h) {
      for (let j = y; j < y + h; j++) {
        for (let i = x; i < x + w; i++) this.dot(i, j);
      }
      return this;
    }

    disc(cx, cy, r) {
      for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) {
        for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
          if (Math.hypot(i - cx, j - cy) <= r) this.dot(i, j);
        }
      }
      return this;
    }

    poly(points) {
      const ys = points.map(p => p[1]), top = Math.floor(Math.min(...ys)), bottom = Math.ceil(Math.max(...ys));
      for (let j = top; j <= bottom; j++) {
        const y = j + 0.001, xs = [];
        points.forEach((a, n) => {
          const b = points[(n + 1) % points.length];
          if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        });
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          for (let i = Math.round(xs[k]); i <= Math.round(xs[k + 1]); i++) this.dot(i, j);
        }
      }
      return this;
    }

    line(x0, y0, x1, y1, t) {
      const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1, half = (t || 1) / 2;
      for (let n = 0; n <= steps; n++) {
        const x = x0 + (x1 - x0) * n / steps, y = y0 + (y1 - y0) * n / steps;
        if (half <= 0.5) this.dot(Math.round(x), Math.round(y));
        else this.disc(x, y, half);
      }
      return this;
    }

    erase(fn) {
      const ink = this.ink;
      this.ink = EMPTY;
      fn(this);
      this.ink = ink;
      return this;
    }

    shade(fn) {
      const ink = this.ink;
      this.ink = SHADE;
      fn(this);
      this.ink = ink;
      return this;
    }
  }

  const person = (p, x, y, k) => {
    p.disc(x, y + 2 * k, 2 * k);
    p.poly([[x - 3 * k, y + 5 * k], [x + 3 * k, y + 5 * k], [x + 2 * k, y + 11 * k], [x + 2 * k, y + 17 * k], [x + 0.5, y + 17 * k], [x, y + 12 * k], [x - 0.5, y + 17 * k], [x - 2 * k, y + 17 * k], [x - 2 * k, y + 11 * k]]);
  };

  const ICONS = {
    live: [28, p => {
      p.disc(14, 4, 3);
      p.poly([[10, 9], [18, 9], [19, 16], [17, 16], [16.5, 12], [16, 18], [18, 26], [15.5, 26], [14, 19], [12, 26], [9.5, 26], [12, 18], [11.5, 12], [11, 16], [9, 16]]);
    }],
    buy: [28, p => {
      p.rect(7, 4, 14, 12);
      p.rect(3, 11, 4, 11);
      p.rect(21, 11, 4, 11);
      p.rect(7, 16, 14, 6);
      p.rect(5, 22, 3, 3);
      p.rect(20, 22, 3, 3);
      p.shade(q => q.rect(7, 15, 14, 1));
    }],
    build: [28, p => {
      p.line(6, 23, 18, 8, 3);
      p.poly([[13, 5], [21, 3], [25, 8], [22, 10], [19, 8], [16, 10]]);
      p.line(22, 23, 11, 12, 2);
      p.poly([[3, 3], [9, 6], [13, 11], [10, 13], [6, 10]]);
    }],
    map: [14, p => {
      p.poly([[1, 3], [5, 1], [9, 3], [13, 1], [13, 11], [9, 13], [5, 11], [1, 13]]);
      p.shade(q => q.rect(5, 2, 1, 10).rect(9, 3, 1, 10));
    }],
    photo: [14, p => {
      p.rect(1, 4, 12, 8);
      p.rect(4, 2, 5, 2);
      p.erase(q => q.disc(7, 8, 2));
    }],
    dots: [14, p => {
      p.disc(2.5, 7, 1.4);
      p.disc(7, 7, 1.4);
      p.disc(11.5, 7, 1.4);
    }],
    floorUp: [14, p => {
      p.poly([[7, 1], [12, 7], [9, 7], [9, 12], [5, 12], [5, 7], [2, 7]]);
    }],
    floorDown: [14, p => {
      p.poly([[7, 13], [12, 7], [9, 7], [9, 2], [5, 2], [5, 7], [2, 7]]);
    }],
    wallUp: [14, p => {
      p.rect(2, 1, 10, 12);
      p.shade(q => q.rect(2, 5, 10, 1).rect(2, 9, 10, 1).rect(6, 1, 1, 4).rect(4, 6, 1, 3).rect(9, 6, 1, 3).rect(6, 10, 1, 3));
    }],
    wallCut: [14, p => {
      p.rect(2, 8, 10, 5);
      p.shade(q => q.rect(2, 10, 10, 1).rect(6, 8, 1, 2));
      p.rect(2, 3, 2, 2).rect(6, 3, 2, 2).rect(10, 3, 2, 2);
    }],
    wallDown: [14, p => {
      p.rect(2, 11, 10, 2);
      p.line(7, 2, 7, 7, 2);
      p.poly([[3, 6], [11, 6], [7, 10]]);
    }],
    plus: [12, p => p.rect(5, 1, 2, 10).rect(1, 5, 10, 2)],
    minus: [12, p => p.rect(1, 5, 10, 2)],
    rotL: [12, p => {
      p.disc(6, 6, 5);
      p.erase(q => q.disc(6, 6, 3).rect(0, 0, 6, 6));
      p.poly([[0, 3], [7, 0], [6, 6]]);
    }],
    rotR: [12, p => {
      p.disc(6, 6, 5);
      p.erase(q => q.disc(6, 6, 3).rect(6, 0, 6, 6));
      p.poly([[11, 3], [4, 0], [5, 6]]);
    }],
    home: [12, p => {
      p.poly([[6, 0], [12, 6], [10, 6], [10, 11], [7, 11], [7, 8], [5, 8], [5, 11], [2, 11], [2, 6], [0, 6]]);
    }],
    pause: [10, p => p.rect(1, 1, 3, 8).rect(6, 1, 3, 8)],
    play: [10, p => p.poly([[2, 0], [9, 5], [2, 9]])],
    fast: [10, p => {
      p.poly([[0, 1], [4, 5], [0, 9]]);
      p.poly([[5, 1], [9, 5], [5, 9]]);
    }],
    faster: [10, p => {
      p.poly([[0, 2], [3, 5], [0, 8]]);
      p.poly([[3, 2], [6, 5], [3, 8]]);
      p.poly([[6, 2], [9, 5], [6, 8]]);
    }],
    skip: [10, p => {
      p.poly([[0, 1], [6, 5], [0, 9]]);
      p.rect(7, 1, 2, 8);
    }],
    close: [12, p => p.line(2, 2, 9, 9, 2.4).line(9, 2, 2, 9, 2.4)],
    left: [10, p => p.poly([[7, 0], [2, 5], [7, 9]])],
    right: [10, p => p.poly([[2, 0], [7, 5], [2, 9]])],
    simology: [20, p => {
      p.poly([[10, 1], [15, 10], [10, 19], [5, 10]]);
      p.shade(q => q.poly([[10, 10], [15, 10], [10, 19]]));
    }],
    skills: [20, p => {
      p.poly([[3, 3], [10, 5], [17, 3], [17, 16], [10, 18], [3, 16]]);
      p.shade(q => q.rect(10, 5, 1, 13));
      p.shade(q => q.line(5, 7, 8, 8).line(5, 10, 8, 11).line(12, 8, 15, 7).line(12, 11, 15, 10));
    }],
    job: [20, p => {
      p.rect(2, 7, 16, 10);
      p.rect(7, 3, 6, 2);
      p.rect(7, 3, 1, 4).rect(12, 3, 1, 4);
      p.shade(q => q.rect(2, 11, 16, 1));
      p.erase(q => q.rect(9, 10, 2, 3));
    }],
    relations: [20, p => {
      person(p, 7, 2, 1);
      person(p, 14, 3, 0.9);
    }],
    chance: [20, p => {
      p.poly([[4, 2], [16, 2], [16, 15], [13, 18], [4, 18]]);
      p.shade(q => q.line(6, 5, 13, 5).line(6, 8, 13, 8).line(6, 11, 11, 11));
      p.erase(q => q.poly([[13, 18], [16, 15], [13, 15]]));
    }],
    inventory: [20, p => {
      p.rect(5, 6, 10, 12);
      p.disc(10, 6, 5);
      p.rect(8, 0, 4, 2);
      p.rect(3, 9, 2, 7);
      p.rect(15, 9, 2, 7);
      p.shade(q => q.rect(7, 11, 6, 5));
      p.shade(q => q.rect(7, 4, 6, 1));
    }],
    rewards: [20, p => {
      p.poly([[10, 1], [12.6, 7], [19, 7.6], [14, 11.6], [15.6, 18], [10, 14.6], [4.4, 18], [6, 11.6], [1, 7.6], [7.4, 7]]);
    }],
    needs: [20, p => {
      p.disc(9.5, 8, 6.5);
      p.poly([[15, 8], [18, 12], [15, 13]]);
      p.rect(6, 13, 8, 5);
      p.erase(q => q.rect(14, 15, 6, 5));
    }],
    walk: [18, p => {
      p.disc(9, 2, 2);
      p.poly([[7, 5], [11, 5], [13, 10], [11.5, 10.5], [10.5, 8], [10.5, 11], [13, 17], [11, 17], [9, 12], [7, 17], [5, 17], [7.5, 11], [7.5, 8], [6.5, 10.5], [5, 10]]);
    }],
    sit: [18, p => {
      p.rect(4, 1, 2, 16);
      p.rect(4, 9, 11, 2);
      p.rect(13, 9, 2, 8);
    }],
    car: [18, p => {
      p.poly([[1, 9], [4, 9], [6, 5], [12, 5], [14, 9], [17, 10], [17, 14], [1, 14]]);
      p.erase(q => q.poly([[6.5, 6], [8.5, 6], [8.5, 9], [5.5, 9]]).poly([[10, 6], [11.5, 6], [13, 9], [10, 9]]));
      p.disc(5, 14, 2);
      p.disc(13, 14, 2);
    }],
    enter: [18, p => {
      p.rect(4, 1, 11, 16);
      p.erase(q => q.rect(6, 3, 7, 12));
      p.rect(7, 3, 6, 14);
      p.erase(q => q.rect(11, 9, 1, 2));
    }],
    star: [26, p => {
      p.poly([[13, 1], [16.4, 9], [25, 9.8], [18.4, 15.2], [20.6, 24], [13, 19.4], [5.4, 24], [7.6, 15.2], [1, 9.8], [9.6, 9]]);
      p.shade(q => q.poly([[13, 12], [18.4, 15.2], [20.6, 24], [13, 19.4]]));
    }],
    eat: [18, p => {
      p.disc(9, 11, 6);
      p.erase(q => q.disc(9, 11, 3.6));
      p.rect(5, 2, 1, 5).rect(7, 2, 1, 5).rect(5, 6, 3, 1).rect(6, 6, 1, 4);
      p.poly([[12, 1], [15, 1], [15, 6], [12, 6]]);
      p.rect(13, 6, 1, 3);
    }],
    cook: [18, p => {
      p.rect(3, 8, 12, 7);
      p.rect(1, 9, 2, 2).rect(15, 9, 2, 2);
      p.rect(4, 6, 10, 2);
      p.line(6, 4, 6, 1).line(9, 4, 9, 1).line(12, 4, 12, 1);
    }],
    wash: [18, p => {
      p.poly([[9, 1], [14, 9], [14, 11], [12, 15], [9, 16], [6, 15], [4, 11], [4, 9]]);
      p.shade(q => q.poly([[9, 10], [12, 10], [11, 13], [9, 14]]));
    }],
    toilet: [18, p => {
      p.rect(11, 2, 4, 8);
      p.rect(3, 9, 11, 3);
      p.poly([[4, 12], [13, 12], [11, 16], [6, 16]]);
    }],
    sleep: [18, p => {
      p.disc(8, 8, 6);
      p.erase(q => q.disc(11, 6, 5));
      p.rect(12, 2, 4, 1).rect(14, 3, 1, 1).rect(13, 4, 1, 1).rect(12, 5, 4, 1);
    }],
    tv: [18, p => {
      p.rect(2, 4, 14, 10);
      p.erase(q => q.rect(4, 6, 8, 6));
      p.rect(13, 6, 1, 1).rect(13, 9, 1, 1);
      p.line(6, 3, 3, 0).line(11, 3, 14, 0);
      p.rect(4, 14, 3, 2).rect(11, 14, 3, 2);
    }],
    music: [18, p => {
      p.rect(7, 2, 2, 11);
      p.rect(14, 1, 2, 11);
      p.rect(7, 2, 9, 2);
      p.disc(5.5, 13, 2.6);
      p.disc(12.5, 12, 2.6);
    }],
    book: [18, p => {
      p.poly([[1, 3], [8, 5], [15, 3], [15, 14], [8, 16], [1, 14]]);
      p.shade(q => q.rect(8, 5, 1, 11));
    }],
    keys: [18, p => {
      p.rect(3, 2, 12, 8);
      p.erase(q => q.rect(5, 4, 8, 4));
      p.rect(7, 10, 4, 2);
      p.rect(2, 13, 14, 3);
    }],
    paint: [18, p => {
      p.disc(8, 10, 6.5);
      p.erase(q => q.disc(5, 12, 1.4).disc(8, 7, 1.2).disc(11, 11, 1.2));
      p.line(11, 6, 16, 1, 2);
    }],
    punch: [18, p => {
      p.rect(4, 4, 10, 8);
      p.rect(2, 6, 2, 6);
      p.rect(6, 12, 8, 3);
      p.shade(q => q.rect(4, 7, 10, 1));
    }],
    cloud: [18, p => {
      p.disc(6, 9, 4).disc(11, 7, 5).disc(14, 10, 3.5);
      p.rect(3, 10, 13, 3);
      p.shade(q => q.line(5, 15, 4, 17, 1).line(9, 15, 8, 17, 1).line(13, 15, 12, 17, 1));
    }],
    question: [18, p => {
      p.disc(9, 5.5, 4.5);
      p.erase(q => q.disc(9, 5.5, 2.2).rect(3, 6, 6, 4));
      p.rect(8, 9, 3, 4);
      p.rect(8, 14, 3, 3);
    }],
    exclaim: [18, p => {
      p.poly([[7, 1], [12, 1], [11, 11], [8, 11]]);
      p.rect(8, 13, 3, 3);
    }],
    toy: [18, p => {
      p.rect(2, 8, 7, 7);
      p.disc(12.5, 11.5, 3.5);
      p.poly([[6, 1], [10, 7], [2, 7]]);
    }],
    chess: [18, p => {
      p.disc(9, 4, 3);
      p.rect(6, 7, 7, 2);
      p.poly([[7, 9], [11, 9], [12, 13], [6, 13]]);
      p.rect(3, 13, 12, 3);
      p.shade(q => q.rect(9, 9, 2, 4));
    }],
    heart: [18, p => {
      p.disc(5.5, 6, 4).disc(11.5, 6, 4).poly([[1.6, 7.5], [16.4, 7.5], [9, 16]]);
      p.shade(q => q.disc(5, 5, 1.2));
    }],
    heartBroken: [18, p => {
      p.disc(5.5, 6, 4).disc(11.5, 6, 4).poly([[1.6, 7.5], [16.4, 7.5], [9, 16]]);
      p.erase(q => q.line(9, 2, 7, 7, 1).line(7, 7, 10, 10, 1).line(10, 10, 8, 15, 1));
    }],
    ring: [18, p => {
      p.disc(9, 11, 5.5);
      p.erase(q => q.disc(9, 11, 3.5));
      p.poly([[6, 5], [9, 1], [12, 5], [9, 7]]);
      p.shade(q => q.poly([[9, 1], [12, 5], [9, 7]]));
    }],
    baby: [18, p => {
      p.disc(9, 5, 3.5);
      p.poly([[4, 9], [14, 9], [12, 16], [6, 16]]);
      p.shade(q => q.rect(6, 11, 6, 1).rect(7, 13, 4, 1));
      p.erase(q => q.rect(7, 5, 1, 1).rect(10, 5, 1, 1));
    }],
    money: [18, p => {
      p.rect(1, 4, 16, 10);
      p.shade(q => q.rect(3, 6, 12, 6));
      p.disc(9, 9, 2.5);
      p.erase(q => q.rect(2, 5, 1, 1).rect(15, 12, 1, 1));
    }],
    sun: [18, p => {
      p.disc(9, 9, 4);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        p.line(9 + Math.cos(a) * 6, 9 + Math.sin(a) * 6, 9 + Math.cos(a) * 8, 9 + Math.sin(a) * 8, 1.6);
      }
    }],
    lamp: [18, p => {
      p.disc(9, 7, 5.5);
      p.rect(6, 11, 6, 3);
      p.shade(q => q.rect(7, 12, 4, 1));
      p.rect(7, 14, 4, 2);
      p.erase(q => q.rect(8, 5, 1, 4).rect(10, 5, 1, 4));
    }],
    dirt: [18, p => {
      p.poly([[2, 13], [5, 10], [9, 11], [13, 9], [16, 12], [14, 16], [7, 16]]);
      p.shade(q => q.rect(6, 12, 5, 2));
      p.disc(11, 4, 1.6);
      p.line(8, 3, 10, 4, 1).line(14, 3, 12, 4, 1);
    }],
    grave: [18, p => {
      p.poly([[4, 16], [4, 6], [6, 2], [12, 2], [14, 6], [14, 16]]);
      p.shade(q => q.rect(8, 5, 2, 7).rect(6, 7, 6, 2));
      p.rect(2, 15, 14, 2);
    }],
    mask: [18, p => {
      p.poly([[1, 6], [17, 6], [16, 12], [10, 12], [9, 10], [8, 12], [2, 12]]);
      p.erase(q => q.disc(5.5, 9, 1.8).disc(12.5, 9, 1.8));
    }],
    fire: [18, p => {
      p.poly([[9, 1], [13, 7], [14, 11], [12, 16], [6, 16], [4, 11], [5, 7], [7, 9]]);
      p.shade(q => q.poly([[9, 8], [11, 12], [10, 15], [8, 15], [7, 12]]));
    }],
    bolt: [18, p => p.poly([[11, 1], [4, 10], [8, 10], [6, 17], [14, 7], [10, 7]])],
    ghost: [18, p => {
      p.disc(9, 7, 6);
      p.rect(3, 7, 12, 7);
      p.poly([[3, 14], [5, 17], [7, 14], [9, 17], [11, 14], [13, 17], [15, 14]]);
      p.erase(q => q.rect(6, 6, 2, 3).rect(10, 6, 2, 3));
    }],
    tree: [18, p => {
      p.disc(9, 7, 6);
      p.shade(q => q.disc(11, 9, 2.5));
      p.rect(8, 12, 2, 5);
    }],
    fish: [18, p => {
      p.poly([[1, 9], [5, 5], [11, 5], [14, 9], [11, 13], [5, 13]]);
      p.poly([[13, 9], [17, 5], [17, 13]]);
      p.erase(q => q.rect(4, 8, 1, 1));
      p.shade(q => q.line(7, 7, 7, 11, 1));
    }],
    talk: [18, p => {
      p.poly([[2, 2], [16, 2], [16, 11], [8, 11], [4, 15], [5, 11], [2, 11]]);
      p.erase(q => q.rect(5, 5, 2, 2).rect(8, 5, 2, 2).rect(11, 5, 2, 2));
    }],
    scroll: [18, p => {
      p.rect(3, 2, 12, 14);
      p.shade(q => q.line(5, 5, 12, 5).line(5, 8, 12, 8).line(5, 11, 10, 11));
    }],
    phone: [18, p => {
      p.rect(6, 4, 7, 13);
      p.rect(10, 0, 2, 5);
      p.erase(q => q.rect(7, 6, 5, 3));
      p.shade(q => q.rect(7, 11, 1, 1).rect(9, 11, 1, 1).rect(11, 11, 1, 1).rect(7, 13, 1, 1).rect(9, 13, 1, 1).rect(11, 13, 1, 1));
    }],
    pin: [18, p => {
      p.disc(9, 7, 5.5);
      p.poly([[4, 8], [14, 8], [9, 17]]);
      p.erase(q => q.disc(9, 7, 2));
    }],
    fruit: [18, p => {
      p.disc(9, 11, 6);
      p.poly([[9, 5], [13, 1], [15, 3], [11, 6]]);
      p.line(9, 3, 9, 6, 1);
      p.shade(q => q.disc(11, 13, 2.5));
    }],
    guitar: [18, p => {
      p.disc(6, 13, 4.5);
      p.disc(9, 10, 3.2);
      p.line(9, 9, 15, 3, 2);
      p.rect(14, 1, 3, 3);
      p.erase(q => q.disc(7, 12, 1.4));
      p.shade(q => q.line(3, 15, 6, 17, 1));
    }],
    gem: [18, p => {
      p.poly([[5, 3], [13, 3], [17, 8], [9, 17], [1, 8]]);
      p.shade(q => q.poly([[9, 8], [17, 8], [9, 17]]));
      p.erase(q => q.line(1, 8, 17, 8, 1));
    }],
    rock: [18, p => {
      p.poly([[2, 13], [4, 7], [9, 4], [15, 6], [17, 12], [12, 16], [5, 16]]);
      p.shade(q => q.poly([[9, 11], [17, 12], [12, 16], [6, 15]]));
    }],
    bug: [18, p => {
      p.disc(9, 11, 5);
      p.disc(9, 4, 2.5);
      p.line(3, 8, 1, 6, 1).line(15, 8, 17, 6, 1).line(3, 12, 1, 12, 1).line(15, 12, 17, 12, 1).line(4, 15, 2, 17, 1).line(14, 15, 16, 17, 1);
      p.erase(q => q.line(9, 7, 9, 16, 1));
    }],
    butterfly: [18, p => {
      p.poly([[8, 8], [2, 2], [1, 8], [5, 11]]);
      p.poly([[10, 8], [16, 2], [17, 8], [13, 11]]);
      p.poly([[8, 10], [3, 15], [7, 16]]);
      p.poly([[10, 10], [15, 15], [11, 16]]);
      p.rect(8, 5, 2, 11);
      p.shade(q => q.disc(4, 6, 1.5).disc(14, 6, 1.5));
    }],
    seed: [18, p => {
      p.rect(4, 2, 10, 15);
      p.shade(q => q.rect(4, 2, 10, 3));
      p.erase(q => q.disc(9, 11, 3));
      p.disc(9, 11, 1.5);
    }]
  };

  const built = new Map();

  const gridOf = name => {
    if (built.has(name)) return built.get(name);
    const [size, paint] = ICONS[name], pad = size + 2, pen = new Pen(size);
    paint(pen);
    const data = new Uint8Array(pad * pad);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) data[x + 1 + (y + 1) * pad] = pen.data[x + y * size];
    }
    for (let y = 0; y < pad; y++) {
      for (let x = 0; x < pad; x++) {
        if (data[x + y * pad] !== EMPTY) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) {
          for (let dx = -1; dx <= 1 && !near; dx++) {
            const i = x + dx, j = y + dy;
            const v = i >= 0 && j >= 0 && i < pad && j < pad ? data[i + j * pad] : EMPTY;
            near = v === FILL || v === SHADE;
          }
        }
        if (near) data[x + y * pad] = EDGE;
      }
    }
    const grid = { size: pad, data };
    built.set(name, grid);
    return grid;
  };

  const sheets = new Map();

  const sheetOf = (name, tone) => {
    const key = name + ':' + tone;
    if (sheets.has(key)) return sheets.get(key);
    const grid = gridOf(name), canvas = document.createElement('canvas'), colors = TONES[tone];
    canvas.width = grid.size;
    canvas.height = grid.size;
    const g = canvas.getContext('2d');
    for (let y = 0; y < grid.size; y++) {
      for (let x = 0; x < grid.size; x++) {
        const v = grid.data[x + y * grid.size];
        if (!v) continue;
        g.fillStyle = colors[v - 1];
        g.fillRect(x, y, 1, 1);
      }
    }
    sheets.set(key, canvas);
    return canvas;
  };

  S.Icons = {
    NAMES: Object.keys(ICONS),
    TONES,
    gridOf,
    sizeOf: name => ICONS[name][0] + 2,

    draw(g, name, x, y, tone) {
      g.drawImage(sheetOf(name, tone || 'white'), Math.round(x), Math.round(y));
    },

    scaled(g, name, cx, cy, tone, k) {
      const sheet = sheetOf(name, tone || 'white'), w = sheet.width * k, h = sheet.height * k, smooth = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      g.drawImage(sheet, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
      g.imageSmoothingEnabled = smooth;
    },

    centered(g, name, cx, cy, tone) {
      const size = S.Icons.sizeOf(name);
      S.Icons.draw(g, name, cx - size / 2, cy - size / 2, tone);
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
