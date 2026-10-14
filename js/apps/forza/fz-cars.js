(function (F) {
  'use strict';

  const C = (o) => o;

  const CARS = [
    C({ id: 'vaz2105', make: 'Lada', model: '2105', year: 1985, country: 'su', rarity: 'common', price: 6000, hp: 64, nm: 92, rpmT: 3400, rpmP: 5600, red: 6200, kg: 995, wf: 0.53, dt: 'RWD', gears: 4, vmax: 145, grip: 0.8, brake: 0.78, off: 0.3, eng: 'lada', cock: 'su', col: '#6f9fc8',
      sh: { len: 4.13, wid: 1.62, hgt: 1.44, wb: 2.42, clr: 0.18, wr: 0.29, nose: 0.76, hood: 0.92, deck: 0.98, tail: 0.86, ws: 0.3, wt: 0.45, rt: 0.72, rb: 0.83, tum: 0.8, lights: 'rect', grille: 'lada', bump: 'alu', rims: 'steel', doors: 4 } }),
    C({ id: 'zaz968', make: 'ZAZ', model: '968M Запорожец', year: 1985, country: 'su', rarity: 'common', price: 3500, hp: 50, nm: 83, rpmT: 3000, rpmP: 4400, red: 5000, kg: 820, wf: 0.42, dt: 'RWD', gears: 4, vmax: 118, grip: 0.74, brake: 0.72, off: 0.36, eng: 'v4', cock: 'su', col: '#c8b98a',
      sh: { len: 3.73, wid: 1.57, hgt: 1.4, wb: 2.16, clr: 0.19, wr: 0.28, nose: 0.74, hood: 0.86, deck: 0.92, tail: 0.84, ws: 0.28, wt: 0.42, rt: 0.7, rb: 0.8, tum: 0.8, lights: 'round2', grille: 'none', bump: 'chrome', ears: true, rims: 'steel', doors: 2 } }),
    C({ id: 'moskvich2141', make: 'Moskvich', model: '2141', year: 1992, country: 'su', rarity: 'common', price: 7500, hp: 72, nm: 106, rpmT: 3400, rpmP: 5500, red: 6000, kg: 1070, wf: 0.6, dt: 'FWD', gears: 5, vmax: 155, grip: 0.8, brake: 0.78, off: 0.3, eng: 'lada', cock: 'su', col: '#8a8d90',
      sh: { len: 4.35, wid: 1.69, hgt: 1.4, wb: 2.58, clr: 0.17, wr: 0.29, nose: 0.72, hood: 0.9, deck: 0.98, tail: 0.9, ws: 0.27, wt: 0.42, rt: 0.66, rb: 0.96, tum: 0.8, lights: 'rect', grille: 'slot', bump: 'black', rims: 'steel', doors: 5 } }),
    C({ id: 'vaz2108', make: 'Lada', model: '2108 Samara', year: 1989, country: 'su', rarity: 'common', price: 9000, hp: 70, nm: 106, rpmT: 3400, rpmP: 5600, red: 6300, kg: 945, wf: 0.61, dt: 'FWD', gears: 5, vmax: 156, grip: 0.82, brake: 0.8, off: 0.28, eng: 'lada', cock: 'su', col: '#b7282e',
      sh: { len: 4.0, wid: 1.65, hgt: 1.4, wb: 2.46, clr: 0.16, wr: 0.28, nose: 0.7, hood: 0.88, deck: 0.95, tail: 0.9, ws: 0.28, wt: 0.44, rt: 0.74, rb: 0.95, tum: 0.8, lights: 'rect', grille: 'slot', bump: 'black', rims: 'steel', doors: 3 } }),
    C({ id: 'niva', make: 'Lada', model: 'Niva 2121', year: 1990, country: 'su', rarity: 'common', price: 8000, hp: 75, nm: 116, rpmT: 3000, rpmP: 5400, red: 5800, kg: 1150, wf: 0.52, dt: 'AWD', gears: 4, vmax: 132, grip: 0.76, brake: 0.76, off: 0.9, eng: 'lada', cock: 'su', col: '#2f8a4a', gift: 5,
      sh: { len: 3.74, wid: 1.68, hgt: 1.64, wb: 2.2, clr: 0.23, wr: 0.34, nose: 0.95, hood: 1.05, deck: 1.05, tail: 1.0, ws: 0.3, wt: 0.4, rt: 0.93, rb: 0.99, tum: 0.86, lights: 'round2', grille: 'bars', bump: 'chrome', suv: true, rims: 'steel', doors: 3 } }),
    C({ id: 'uaz469', make: 'UAZ', model: '469', year: 1985, country: 'su', rarity: 'common', price: 7000, hp: 75, nm: 171, rpmT: 2200, rpmP: 4000, red: 4500, kg: 1540, wf: 0.52, dt: 'AWD', gears: 4, vmax: 115, grip: 0.72, brake: 0.7, off: 0.96, eng: 'van', cock: 'su', col: '#5a6b3c', rim: '#4a5530',
      sh: { len: 4.03, wid: 1.79, hgt: 2.02, wb: 2.38, clr: 0.3, wr: 0.4, nose: 1.1, hood: 1.2, deck: 1.2, tail: 1.15, ws: 0.28, wt: 0.33, rt: 0.97, rb: 1, tum: 0.95, lights: 'round2', grille: 'bars', bump: 'black', suv: true, roof: '#4a5236', spare: 'tire', rims: 'steel', doors: 4, glassTo: 0.74 } }),
    C({ id: 'gaz24', make: 'GAZ', model: '24 Volga', year: 1981, country: 'su', rarity: 'common', price: 10000, hp: 95, nm: 186, rpmT: 2400, rpmP: 4500, red: 5000, kg: 1420, wf: 0.54, dt: 'RWD', gears: 4, vmax: 147, grip: 0.77, brake: 0.74, off: 0.35, eng: 'i4', cock: 'su', col: '#141416',
      sh: { len: 4.74, wid: 1.8, hgt: 1.49, wb: 2.8, clr: 0.18, wr: 0.32, nose: 0.82, hood: 0.95, deck: 1.0, tail: 0.9, ws: 0.33, wt: 0.46, rt: 0.7, rb: 0.8, tum: 0.8, lights: 'round2', grille: 'chrome', bump: 'chrome', rims: 'retro', doors: 4 } }),
    C({ id: 'raf2203', make: 'RAF', model: '2203 Latvija', year: 1987, country: 'lv', rarity: 'rare', price: 25000, barn: true, hp: 95, nm: 186, rpmT: 2400, rpmP: 4500, red: 5000, kg: 1800, wf: 0.55, dt: 'RWD', gears: 4, vmax: 120, grip: 0.72, brake: 0.7, off: 0.32, eng: 'van', cock: 'su', col: '#c33a2c',
      sh: { len: 4.98, wid: 2.04, hgt: 1.97, wb: 2.62, clr: 0.2, wr: 0.34, nose: 1.0, hood: 1.05, deck: 1.8, tail: 1.0, ws: 0.05, wt: 0.17, rt: 0.97, rb: 1, tum: 0.9, lights: 'round2', grille: 'slot', bump: 'chrome', van: true, roof: '#e8e6dc', rims: 'steel' } }),
    C({ id: 'gaz21', make: 'GAZ', model: '21 Volga', year: 1965, country: 'su', rarity: 'rare', price: 30000, barn: true, hp: 75, nm: 170, rpmT: 2200, rpmP: 4000, red: 4500, kg: 1450, wf: 0.54, dt: 'RWD', gears: 3, vmax: 130, grip: 0.72, brake: 0.66, off: 0.4, eng: 'i4', cock: 'retro', col: '#e8e6dc',
      sh: { len: 4.83, wid: 1.8, hgt: 1.62, wb: 2.7, clr: 0.19, wr: 0.34, nose: 0.85, hood: 1.0, deck: 1.02, tail: 0.9, ws: 0.34, wt: 0.47, rt: 0.7, rb: 0.8, tum: 0.74, lights: 'round2', grille: 'shark', bump: 'chrome', round: true, rims: 'retro', cluster: 'fan', doors: 4 } }),
    C({ id: 'golf2', make: 'Volkswagen', model: 'Golf GTI 16V', year: 1989, country: 'de', rarity: 'common', price: 18000, hp: 139, nm: 168, rpmT: 4600, rpmP: 6100, red: 6800, kg: 960, wf: 0.62, dt: 'FWD', gears: 5, vmax: 208, grip: 0.92, brake: 0.92, off: 0.22, eng: 'i4', cock: 'eu', col: '#e8e6dc',
      sh: { len: 3.99, wid: 1.68, hgt: 1.41, wb: 2.47, clr: 0.13, wr: 0.3, nose: 0.72, hood: 0.9, deck: 0.98, tail: 0.9, ws: 0.3, wt: 0.45, rt: 0.76, rb: 0.95, tum: 0.8, lights: 'round4', grille: 'gti', bump: 'black', rims: 'mesh', doors: 3 } }),
    C({ id: 'audi80', make: 'Audi', model: '80 quattro', year: 1990, country: 'de', rarity: 'common', price: 16000, hp: 133, nm: 186, rpmT: 4000, rpmP: 5500, red: 6300, kg: 1260, wf: 0.58, dt: 'AWD', gears: 5, vmax: 200, grip: 0.9, brake: 0.9, off: 0.42, eng: 'i4', cock: 'eu', col: '#1a2f6e',
      sh: { len: 4.39, wid: 1.7, hgt: 1.4, wb: 2.55, clr: 0.14, wr: 0.31, nose: 0.72, hood: 0.88, deck: 0.98, tail: 0.92, ws: 0.3, wt: 0.46, rt: 0.7, rb: 0.8, tum: 0.8, lights: 'rect', grille: 'audi', bump: 'body', round: true, flare: 0.015, rims: 'pepper', doors: 4 } }),
    C({ id: 'mazda626', make: 'Mazda', model: '626 Hatchback (GE)', year: 1991, country: 'jp', rarity: 'common', price: 13000, hp: 115, nm: 170, rpmT: 4500, rpmP: 5500, red: 6500, kg: 1185, wf: 0.61, dt: 'FWD', gears: 5, vmax: 200, grip: 0.87, brake: 0.86, off: 0.24, eng: 'i4', cock: 'jp', col: '#7a1a26',
      sh: { len: 4.695, wid: 1.75, hgt: 1.39, wb: 2.61, clr: 0.15, wr: 0.31, nose: 0.73, hood: 0.9, deck: 0.99, tail: 0.95, ws: 0.31, wt: 0.48, rt: 0.69, rb: 0.92, tum: 0.8, lights: 'wide', grille: 'mazda', bump: 'body', tailBand: true, modelBadge: 'left', round: true, rims: 'cover', doors: 5, fog: true } }),
    C({ id: 'e30', make: 'BMW', model: '325i (E30)', year: 1989, country: 'de', rarity: 'common', price: 22000, hp: 170, nm: 222, rpmT: 4300, rpmP: 5800, red: 6500, kg: 1200, wf: 0.52, dt: 'RWD', gears: 5, vmax: 220, grip: 0.92, brake: 0.92, off: 0.2, eng: 'i6', cock: 'eu', col: '#b7282e',
      sh: { len: 4.32, wid: 1.65, hgt: 1.38, wb: 2.57, clr: 0.13, wr: 0.3, nose: 0.75, hood: 0.88, deck: 0.97, tail: 0.9, ws: 0.34, wt: 0.47, rt: 0.72, rb: 0.82, tum: 0.8, lights: 'round4', grille: 'kidney', bump: 'black', rims: 'mesh', doors: 2 } }),
    C({ id: 'silvia', make: 'Nissan', model: "Silvia K's (S13)", year: 1989, country: 'jp', rarity: 'common', price: 21000, hp: 175, nm: 226, rpmT: 4000, rpmP: 6400, red: 7000, kg: 1180, wf: 0.55, dt: 'RWD', gears: 5, vmax: 225, grip: 0.93, brake: 0.92, off: 0.15, eng: 'i4t', cock: 'jp', col: '#b9c9b0',
      sh: { len: 4.47, wid: 1.69, hgt: 1.29, wb: 2.48, clr: 0.12, wr: 0.3, nose: 0.62, hood: 0.84, deck: 0.93, tail: 0.88, ws: 0.34, wt: 0.5, rt: 0.7, rb: 0.82, tum: 0.78, lights: 'slim', grille: 'slot', bump: 'body', wing: 'lip', rims: 'multi', doors: 2 } }),
    C({ id: 'celica', cla: 0.08, make: 'Toyota', model: 'Celica GT-Four ST205', year: 1994, country: 'jp', rarity: 'common', price: 27000, hp: 255, nm: 304, rpmT: 4000, rpmP: 6000, red: 6800, kg: 1380, wf: 0.6, dt: 'AWD', gears: 5, vmax: 245, grip: 0.97, brake: 0.95, off: 0.45, eng: 'i4t', cock: 'jp', col: '#d12a24',
      sh: { len: 4.42, wid: 1.75, hgt: 1.3, wb: 2.54, clr: 0.13, wr: 0.31, nose: 0.62, hood: 0.85, deck: 0.97, tail: 0.92, ws: 0.33, wt: 0.5, rt: 0.68, rb: 0.9, tum: 0.78, lights: 'round4', grille: 'slot', bump: 'body', wing: 'high', scoop: true, round: true, flare: 0.03, rims: 'five', doors: 3, fog: true } }),
    C({ id: 'merc190', make: 'Mercedes-Benz', model: '190E 2.3-16', year: 1986, country: 'de', rarity: 'rare', price: 26000, hp: 185, nm: 235, rpmT: 4500, rpmP: 6200, red: 6800, kg: 1230, wf: 0.53, dt: 'RWD', gears: 5, vmax: 230, grip: 0.95, brake: 0.94, off: 0.18, eng: 'i4', cock: 'eu', col: '#3b3d40', gift: 10,
      sh: { len: 4.43, wid: 1.7, hgt: 1.36, wb: 2.66, clr: 0.12, wr: 0.3, nose: 0.72, hood: 0.88, deck: 0.97, tail: 0.9, ws: 0.33, wt: 0.47, rt: 0.7, rb: 0.8, tum: 0.8, lights: 'rect', grille: 'merc', bump: 'body', wing: 'lip', skirts: true, rims: 'pepper', doors: 4 } }),
    C({ id: 'charger', make: 'Dodge', model: 'Charger R/T', year: 1969, country: 'us', rarity: 'rare', price: 45000, hp: 375, nm: 651, rpmT: 3200, rpmP: 4600, red: 5400, kg: 1750, wf: 0.56, dt: 'RWD', gears: 4, vmax: 230, grip: 0.86, brake: 0.8, off: 0.2, eng: 'v8m', cock: 'us', col: '#141416', livery: 'tail', col2: '#b7282e',
      sh: { len: 5.28, wid: 1.95, hgt: 1.35, wb: 3.0, clr: 0.14, wr: 0.34, nose: 0.8, hood: 0.93, deck: 0.98, tail: 0.92, ws: 0.4, wt: 0.52, rt: 0.66, rb: 0.76, tum: 0.78, lights: 'hidden', grille: 'full', bump: 'chrome', flare: [0, 0.03], rims: 'five', cluster: 'pods', doors: 2, exh: 'dual' } }),
    C({ id: 'sierra', cla: 0.1, make: 'Ford', model: 'Sierra RS500 Cosworth', year: 1987, country: 'gb', rarity: 'rare', price: 48000, hp: 224, nm: 277, rpmT: 4500, rpmP: 6000, red: 6800, kg: 1220, wf: 0.55, dt: 'RWD', gears: 5, vmax: 245, grip: 0.96, brake: 0.95, off: 0.2, eng: 'i4t', cock: 'eu', col: '#141416', gift: 15,
      sh: { len: 4.46, wid: 1.73, hgt: 1.36, wb: 2.61, clr: 0.12, wr: 0.31, nose: 0.7, hood: 0.88, deck: 0.98, tail: 0.95, ws: 0.3, wt: 0.46, rt: 0.72, rb: 0.95, tum: 0.8, lights: 'rect', grille: 'slot', bump: 'body', wing: 'whale', flare: 0.03, rims: 'multi', doors: 3, fog: true } }),
    C({ id: 'w124', make: 'Mercedes-Benz', model: 'E 500 (W124)', year: 1994, country: 'de', rarity: 'rare', price: 55000, hp: 320, nm: 470, rpmT: 3900, rpmP: 5600, red: 6000, kg: 1710, wf: 0.54, dt: 'RWD', gears: 4, vmax: 250, grip: 0.94, brake: 0.95, off: 0.2, eng: 'v8', cock: 'eu', col: '#141416',
      sh: { len: 4.74, wid: 1.79, hgt: 1.41, wb: 2.8, clr: 0.13, wr: 0.32, nose: 0.74, hood: 0.9, deck: 1.0, tail: 0.95, ws: 0.32, wt: 0.46, rt: 0.71, rb: 0.81, tum: 0.8, lights: 'rect', grille: 'merc', bump: 'body', rims: 'pepper', doors: 4 } }),
    C({ id: 'm3e36', make: 'BMW', model: 'M3 (E36)', year: 1997, country: 'de', rarity: 'rare', price: 60000, hp: 321, nm: 350, rpmT: 3250, rpmP: 7400, red: 7600, kg: 1460, wf: 0.52, dt: 'RWD', gears: 6, vmax: 265, grip: 1.0, brake: 1.0, off: 0.15, eng: 'i6', cock: 'eu', col: '#e8e6dc',
      sh: { len: 4.43, wid: 1.71, hgt: 1.34, wb: 2.7, clr: 0.11, wr: 0.32, nose: 0.7, hood: 0.87, deck: 0.96, tail: 0.92, ws: 0.34, wt: 0.49, rt: 0.7, rb: 0.8, tum: 0.78, lights: 'round4', grille: 'kidney', bump: 'body', round: true, flare: 0.015, rims: 'multi', doors: 2, exh: 'quad', fog: true } }),
    C({ id: 'evo6', cla: 0.12, make: 'Mitsubishi', model: 'Lancer Evolution VI', year: 1999, country: 'jp', rarity: 'rare', price: 70000, hp: 280, nm: 373, rpmT: 3000, rpmP: 6500, red: 7000, kg: 1360, wf: 0.6, dt: 'AWD', gears: 5, vmax: 240, grip: 1.02, brake: 1.0, off: 0.55, eng: 'i4t', cock: 'jp', col: '#d12a24',
      sh: { len: 4.35, wid: 1.77, hgt: 1.41, wb: 2.51, clr: 0.13, wr: 0.32, nose: 0.72, hood: 0.89, deck: 1.0, tail: 0.95, ws: 0.32, wt: 0.47, rt: 0.72, rb: 0.82, tum: 0.8, lights: 'rect', grille: 'evo', bump: 'body', wing: 'high', flare: 0.035, rims: 'multi', doors: 4, fog: true } }),
    C({ id: 'impreza22b', cla: 0.12, make: 'Subaru', model: 'Impreza 22B STi', year: 1998, country: 'jp', rarity: 'epic', price: 95000, hp: 280, nm: 363, rpmT: 3200, rpmP: 6000, red: 7200, kg: 1270, wf: 0.58, dt: 'AWD', gears: 5, vmax: 248, grip: 1.02, brake: 1.0, off: 0.6, eng: 'f4t', cock: 'jp', col: '#1f4aa8', rim: '#d8b048', gift: 20,
      sh: { len: 4.37, wid: 1.77, hgt: 1.39, wb: 2.52, clr: 0.13, wr: 0.32, nose: 0.72, hood: 0.88, deck: 0.99, tail: 0.95, ws: 0.31, wt: 0.46, rt: 0.72, rb: 0.83, tum: 0.8, lights: 'rect', grille: 'slot', bump: 'body', wing: 'high', scoop: true, flare: 0.04, rims: 'five', doors: 2, fog: true } }),
    C({ id: 'g500', make: 'Mercedes-Benz', model: 'G 500', year: 1998, country: 'de', rarity: 'rare', price: 80000, hp: 296, nm: 456, rpmT: 2800, rpmP: 5500, red: 6000, kg: 2400, wf: 0.52, dt: 'AWD', gears: 5, vmax: 190, grip: 0.84, brake: 0.86, off: 0.92, eng: 'v8', cock: 'eu', col: '#141416',
      sh: { len: 4.66, wid: 1.76, hgt: 1.93, wb: 2.85, clr: 0.28, wr: 0.38, nose: 1.05, hood: 1.2, deck: 1.3, tail: 1.15, ws: 0.25, wt: 0.32, rt: 0.97, rb: 1, tum: 0.96, lights: 'round2', grille: 'bars', bump: 'black', suv: true, spare: 'cover', rims: 'dish', doors: 5 } }),
    C({ id: 'm5e39', cla: 0.05, make: 'BMW', model: 'M5 (E39)', year: 2000, country: 'de', rarity: 'epic', price: 95000, hp: 400, nm: 500, rpmT: 3800, rpmP: 6600, red: 7000, kg: 1795, wf: 0.53, dt: 'RWD', gears: 6, vmax: 285, grip: 1.0, brake: 1.02, off: 0.18, eng: 'v8', cock: 'eu', col: '#2a62b8',
      sh: { len: 4.78, wid: 1.8, hgt: 1.44, wb: 2.83, clr: 0.12, wr: 0.33, nose: 0.72, hood: 0.9, deck: 1.0, tail: 0.95, ws: 0.32, wt: 0.47, rt: 0.71, rb: 0.82, tum: 0.8, lights: 'round4', grille: 'kidney', bump: 'body', round: true, rims: 'multi', doors: 4, exh: 'quad' } }),
    C({ id: 'supra', cla: 0.1, make: 'Toyota', model: 'Supra RZ', year: 1998, country: 'jp', rarity: 'epic', price: 85000, hp: 326, nm: 441, rpmT: 4000, rpmP: 5600, red: 6800, kg: 1570, wf: 0.53, dt: 'RWD', gears: 6, vmax: 285, grip: 1.0, brake: 1.02, off: 0.1, eng: 'i6t', cock: 'jp', col: '#e24a22',
      sh: { len: 4.52, wid: 1.81, hgt: 1.27, wb: 2.55, clr: 0.12, wr: 0.33, nose: 0.6, hood: 0.85, deck: 0.97, tail: 0.95, ws: 0.35, wt: 0.52, rt: 0.68, rb: 0.88, tum: 0.76, lights: 'slim', grille: 'slot', bump: 'body', wing: 'hoop', round: true, flare: 0.02, rims: 'five', doors: 3 } }),
    C({ id: 'r34', cla: 0.16, make: 'Nissan', model: 'Skyline GT-R V-Spec (R34)', year: 1999, country: 'jp', rarity: 'epic', price: 110000, hp: 330, nm: 392, rpmT: 4400, rpmP: 6800, red: 8000, kg: 1560, wf: 0.56, dt: 'AWD', gears: 6, vmax: 265, grip: 1.03, brake: 1.03, off: 0.35, eng: 'i6t', cock: 'jp', col: '#2a3f8e',
      sh: { len: 4.6, wid: 1.79, hgt: 1.36, wb: 2.67, clr: 0.12, wr: 0.33, nose: 0.68, hood: 0.88, deck: 1.0, tail: 0.97, ws: 0.33, wt: 0.48, rt: 0.69, rb: 0.82, tum: 0.78, lights: 'slim', grille: 'slot', bump: 'body', wing: 'high', tailRound: true, flare: 0.025, rims: 'multi', doors: 2, fog: true } }),
    C({ id: 'p993', cla: 0.2, make: 'Porsche', model: '911 Turbo (993)', year: 1995, country: 'de', rarity: 'epic', price: 150000, hp: 408, nm: 540, rpmT: 4500, rpmP: 5750, red: 6800, kg: 1500, wf: 0.39, dt: 'AWD', gears: 6, vmax: 290, grip: 1.04, brake: 1.06, off: 0.25, eng: 'f6t', cock: 'eu', col: '#c9c9c4', gift: 25,
      sh: { len: 4.25, wid: 1.8, hgt: 1.29, wb: 2.27, clr: 0.12, wr: 0.32, nose: 0.62, hood: 0.8, deck: 0.95, tail: 0.9, ws: 0.32, wt: 0.48, rt: 0.62, rb: 0.95, tum: 0.74, lights: 'oval', grille: 'none', bump: 'body', wing: 'whale', round: true, flare: [0.01, 0.06], rims: 'five', doors: 2, exh: 'dual' } }),
    C({ id: 'f355', cla: 0.22, make: 'Ferrari', model: 'F355 Berlinetta', year: 1994, country: 'it', rarity: 'epic', price: 190000, hp: 380, nm: 363, rpmT: 6000, rpmP: 8250, red: 8500, kg: 1350, wf: 0.42, dt: 'RWD', gears: 6, vmax: 295, grip: 1.05, brake: 1.05, off: 0.08, eng: 'v8f', cock: 'it', col: '#c41a1a',
      sh: { len: 4.25, wid: 1.9, hgt: 1.17, wb: 2.45, clr: 0.11, wr: 0.33, nose: 0.55, hood: 0.78, deck: 0.95, tail: 0.9, ws: 0.33, wt: 0.5, rt: 0.6, rb: 0.72, tum: 0.74, lights: 'popup', grille: 'slot', bump: 'body', intakes: true, round: true, flare: [0.02, 0.04], rims: 'five', seats: 2, doors: 2, exh: 'quad' } }),
    C({ id: 'viper', cla: 0.14, make: 'Dodge', model: 'Viper GTS', year: 1999, country: 'us', rarity: 'epic', price: 125000, hp: 450, nm: 664, rpmT: 3700, rpmP: 5200, red: 6000, kg: 1535, wf: 0.5, dt: 'RWD', gears: 6, vmax: 298, grip: 1.06, brake: 1.04, off: 0.08, eng: 'v10', cock: 'us', col: '#1f3f9a', livery: 'stripes', col2: '#e8e6dc',
      sh: { len: 4.49, wid: 1.94, hgt: 1.19, wb: 2.44, clr: 0.11, wr: 0.34, nose: 0.58, hood: 0.9, deck: 0.95, tail: 0.92, ws: 0.46, wt: 0.6, rt: 0.7, rb: 0.9, tum: 0.74, lights: 'slim', grille: 'slot', bump: 'body', round: true, flare: 0.04, rims: 'five', seats: 2, cluster: 'twin', doors: 2, exh: 'center' } }),
    C({ id: 'diablo', cla: 0.32, make: 'Lamborghini', model: 'Diablo SV', year: 1997, country: 'it', rarity: 'legendary', price: 280000, hp: 510, nm: 580, rpmT: 5900, rpmP: 7100, red: 7500, kg: 1530, wf: 0.41, dt: 'RWD', gears: 5, vmax: 320, grip: 1.07, brake: 1.06, off: 0.05, eng: 'v12', cock: 'it', col: '#f0a81c',
      sh: { len: 4.47, wid: 2.04, hgt: 1.11, wb: 2.65, clr: 0.11, wr: 0.34, nose: 0.5, hood: 0.72, deck: 0.95, tail: 0.92, ws: 0.28, wt: 0.47, rt: 0.58, rb: 0.78, tum: 0.72, lights: 'popup', grille: 'slot', bump: 'body', wing: 'high', intakes: true, flare: [0.03, 0.06], rims: 'dish', seats: 2, doors: 2, exh: 'center' } }),
    C({ id: 'mclarenf1', cla: 0.26, make: 'McLaren', model: 'F1', year: 1994, country: 'gb', rarity: 'legendary', price: 1500000, hp: 627, nm: 651, rpmT: 5600, rpmP: 7400, red: 7500, kg: 1138, wf: 0.42, dt: 'RWD', gears: 6, vmax: 386, grip: 1.07, brake: 1.08, off: 0.05, eng: 'v12', cock: 'it', col: '#e24a22',
      sh: { len: 4.29, wid: 1.82, hgt: 1.14, wb: 2.72, clr: 0.11, wr: 0.33, nose: 0.55, hood: 0.72, deck: 0.93, tail: 0.9, ws: 0.28, wt: 0.46, rt: 0.6, rb: 0.74, tum: 0.72, lights: 'slim', grille: 'slot', bump: 'body', snorkel: true, round: true, flare: 0.02, rims: 'five', seat: 'center', seats: 2, cluster: 'center', doors: 2, exh: 'center' } }),
    C({ id: 'p356', make: 'Porsche', model: '356A Speedster', year: 1958, country: 'de', rarity: 'legendary', price: 120000, barn: true, hp: 75, nm: 117, rpmT: 3700, rpmP: 5000, red: 5500, kg: 770, wf: 0.41, dt: 'RWD', gears: 4, vmax: 165, grip: 0.8, brake: 0.74, off: 0.25, eng: 'f4', cock: 'retro', col: '#dcc9a0',
      sh: { len: 3.95, wid: 1.66, hgt: 1.22, wb: 2.1, clr: 0.15, wr: 0.3, nose: 0.62, hood: 0.82, deck: 0.9, tail: 0.8, ws: 0.38, wt: 0.47, rt: 0.56, rb: 0.72, tum: 0.72, lights: 'round2', grille: 'none', bump: 'chrome', roof: '#2a2a2a', round: true, flare: 0.03, rims: 'retro', seats: 2, cluster: 'three', doors: 2, exh: 'dual' } }),
    C({ id: 'm300sl', make: 'Mercedes-Benz', model: '300 SL Gullwing', year: 1955, country: 'de', rarity: 'legendary', price: 400000, barn: true, hp: 215, nm: 274, rpmT: 4600, rpmP: 5800, red: 6400, kg: 1295, wf: 0.5, dt: 'RWD', gears: 4, vmax: 250, grip: 0.84, brake: 0.78, off: 0.2, eng: 'i6', cock: 'retro', col: '#c9c9c4',
      sh: { len: 4.52, wid: 1.79, hgt: 1.3, wb: 2.4, clr: 0.14, wr: 0.33, nose: 0.7, hood: 0.9, deck: 0.95, tail: 0.85, ws: 0.42, wt: 0.54, rt: 0.66, rb: 0.8, tum: 0.74, lights: 'round2', grille: 'star', bump: 'chrome', round: true, flare: 0.02, rims: 'retro', seats: 2, cluster: 'twin', doors: 2 } })
  ];

  const BY_ID = {};
  for (const c of CARS) BY_ID[c.id] = c;

  const COUNTRY = { su: 'СССР', lv: 'Латвия', de: 'Германия', jp: 'Япония', us: 'США', it: 'Италия', gb: 'Великобритания' };

  const UPGRADES = [
    { id: 'engine', name: 'Двигатель', levels: [
      { name: 'Заводской', price: 0 },
      { name: 'Улица', price: 1500, pw: 1.1, rev: 150 },
      { name: 'Спорт', price: 4500, pw: 1.22, rev: 350 },
      { name: 'Гонка', price: 11000, pw: 1.38, rev: 600 }
    ] },
    { id: 'trans', name: 'Трансмиссия', levels: [
      { name: 'Заводская', price: 0 },
      { name: 'Спорт', price: 1200, shift: 0.7, fd: 1.04 },
      { name: 'Гонка', price: 3500, shift: 0.45, fd: 1.08, gear: 1 }
    ] },
    { id: 'tires', name: 'Шины', levels: [
      { name: 'Заводские', price: 0 },
      { name: 'Спортивные', price: 1000, grip: 0.07, off: -0.05 },
      { name: 'Гоночные слики', price: 3000, grip: 0.17, off: -0.25 },
      { name: 'Раллийные', price: 2000, grip: 0.03, off: 0.22 },
      { name: 'Внедорожные', price: 2000, grip: -0.05, off: 0.4 }
    ] },
    { id: 'susp', name: 'Подвеска', levels: [
      { name: 'Заводская', price: 0 },
      { name: 'Спорт', price: 1500, grip: 0.025, cg: -0.03, resp: 0.9, off: -0.04 },
      { name: 'Гонка', price: 4000, grip: 0.05, cg: -0.05, resp: 0.8, off: -0.1 },
      { name: 'Ралли', price: 3000, grip: 0.01, cg: 0.02, resp: 0.95, off: 0.18 }
    ] },
    { id: 'brakes', name: 'Тормоза', levels: [
      { name: 'Заводские', price: 0 },
      { name: 'Спорт', price: 800, brake: 0.12 },
      { name: 'Гонка', price: 2500, brake: 0.25 }
    ] },
    { id: 'weight', name: 'Облегчение', levels: [
      { name: 'Заводской вес', price: 0 },
      { name: 'Улица', price: 1200, kg: 0.95 },
      { name: 'Спорт', price: 3500, kg: 0.9 },
      { name: 'Гонка', price: 8000, kg: 0.84 }
    ] },
    { id: 'aero', name: 'Аэродинамика', levels: [
      { name: 'Заводская', price: 0 },
      { name: 'Спойлер', price: 1500, cla: 0.3, cda: 0.02, wing: 'lip' },
      { name: 'Гоночное антикрыло', price: 4000, cla: 0.75, cda: 0.06, wing: 'high' }
    ] }
  ];

  const HP_W = 745.7;

  function gearSet(n, first, top) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 1 : i / (n - 1);
      const k = Math.pow(t, 0.9);
      out.push(first * Math.pow(top / first, k));
    }
    return out;
  }

  function spec(id, up = {}) {
    const c = BY_ID[id];
    if (!c) throw new Error('unknown car ' + id);
    const lv = (cat) => {
      const u = UPGRADES.find(x => x.id === cat);
      return u.levels[F.clamp(up[cat] | 0, 0, u.levels.length - 1)];
    };
    const e = lv('engine'), tr = lv('trans'), ti = lv('tires'), su = lv('susp'), br = lv('brakes'), we = lv('weight'), ae = lv('aero');
    const sh = c.sh;
    const mass = c.kg * (we.kg || 1) + 75;
    const powerMul = e.pw || 1;
    const P = c.hp * HP_W * powerMul;
    const T = c.nm * (1 + (powerMul - 1) * 0.85);
    const red = c.red + (e.rev || 0);
    const rpmP = c.rpmP + (e.rev || 0) * 0.6;
    const vmaxBase = c.vmax / 3.6;
    const crr = 0.013;
    const eta = c.country === 'su' || c.country === 'lv' ? 0.8 : 0.86;
    const Pbase = c.hp * HP_W * eta;
    const cda0 = Math.max(0.3, (Pbase - crr * c.kg * F.G * vmaxBase) / (0.5 * F.RHO * vmaxBase * vmaxBase * vmaxBase));
    const cda = cda0 + (ae.cda || 0);
    const vmaxEst = Math.cbrt((P * eta) / (0.5 * F.RHO * cda)) * 0.985;
    const wr = sh.wr;
    const gears = c.gears + (tr.gear || 0);
    const rpmAtTop = Math.min(red * 0.97, rpmP * 1.1);
    const wheelRpmTop = (vmaxEst / wr) * 60 / (2 * Math.PI);
    const topRatio = rpmAtTop / wheelRpmTop;
    const final = 3.6 * (tr.fd || 1);
    const topGear = topRatio / final;
    const spread = F.clamp(2.6 + gears * 0.28, 3, 4.6);
    const g1 = topGear * spread;
    const ratios = gearSet(gears, g1, topGear).map(r => r * (tr.fd || 1));
    const grip = c.grip + (ti.grip || 0) + (su.grip || 0);
    const off = F.clamp(c.off + (ti.off || 0) + (su.off || 0), 0, 1);
    const cg = Math.max(0.32, (sh.hgt * 0.36) + (su.cg || 0));
    const L = sh.wb;
    const a = L * (1 - c.wf), b = L * c.wf;
    const Iz = mass * (sh.len * sh.len + sh.wid * sh.wid) / 12 * 1.05;
    const alphaPeak = (c.off > 0.8 ? 0.15 : 0.12) * (su.resp || 1) * (ti.grip > 0.1 ? 0.88 : 1);
    return {
      id, car: c, up: Object.assign({}, up), mass, P, T, idle: 850, red, rpmT: c.rpmT, rpmP, ratios, final, wr, eta,
      shift: (c.year < 1975 ? 0.45 : c.country === 'su' || c.country === 'lv' ? 0.4 : 0.26) * (tr.shift || 1), dt: c.dt, grip, off, brake: c.brake + (br.brake || 0),
      cda, cla: (ae.cla || 0) + (c.cla || 0), crr, cg, L, a, b, Iz,
      track: sh.wid * 0.84, len: sh.len, wid: sh.wid, hgt: sh.hgt, alphaPeak, maxSteer: c.sh.suv || c.sh.van ? 0.62 : 0.58,
      wing: ae.wing || sh.wing || null, eng: c.eng, turbo: /t$/.test(c.eng)
    };
  }

  function torqueAt(sp, rpm) {
    const w = rpm * 2 * Math.PI / 60;
    const tIdle = sp.T * 0.55;
    const tPeak = sp.T;
    const tP = sp.P / Math.max(1, sp.rpmP * 2 * Math.PI / 60);
    const tRed = 0.86 * sp.P / Math.max(1, sp.red * 2 * Math.PI / 60);
    const mid = sp.rpmT + (sp.rpmP - sp.rpmT) * 0.55;
    let t;
    if (rpm <= sp.idle) t = tIdle;
    else if (rpm <= sp.rpmT) t = F.lerp(tIdle, tPeak, (rpm - sp.idle) / Math.max(1, sp.rpmT - sp.idle));
    else if (rpm <= mid) t = tPeak;
    else if (rpm <= sp.rpmP) t = F.lerp(tPeak, tP, (rpm - mid) / Math.max(1, sp.rpmP - mid));
    else t = F.lerp(tP, tRed, F.clamp((rpm - sp.rpmP) / Math.max(1, sp.red - sp.rpmP), 0, 1));
    const pw = t * w;
    if (pw > sp.P) t = sp.P / w;
    return t;
  }

  function priceFactor(pi) { return F.clamp(0.55 + pi / 520, 0.7, 2.6); }

  F.Cars = { CARS, BY_ID, UPGRADES, COUNTRY, spec, torqueAt, priceFactor, get: id => BY_ID[id] };
})(globalThis.Forza = globalThis.Forza || {});
