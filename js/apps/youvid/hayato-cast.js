(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const { Figure, restPose } = window.P3DFigure;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, spherePatch, tube, mesh } = K;

  const DIM = { hip: 0.075, thigh: 0.37, shin: 0.35, sole: 0.045, shoulder: 0.135, upper: 0.225, fore: 0.2, torso: 0.4, waist: 0.1, chest: 0.13, depth: 0.095, headR: 0.118 };
  const MALE = { hip: 0.085, thigh: 0.42, shin: 0.4, sole: 0.05, shoulder: 0.18, upper: 0.27, fore: 0.24, torso: 0.47, waist: 0.14, chest: 0.18, depth: 0.11, headR: 0.118 };
  const HEAD = 0.118;

  const LOOKS = {
    hayato: {
      name: 'Hayato', skin: 0xfbe4da, hair: 0x2a2d38, hairHi: 0x3a3e4a, teal: 0x2f9aa6, eyes: '#34a9cf', hairStyle: 'wavy', bangs: 'side', hairLen: 0.62,
      top: 0x2f5f70, trim: 0xd9b25a, collar: 0x1c2638, gem: 0xc21e3a, pearls: true, shawl: 0xf3f1ee, gloves: 0x34445e, skirt: 0x2a5566, skirtPanel: 0xd9b25a, skirtLen: 0.62,
      legs: 0xf6e2d8, boots: 0xf0eee9, clip: 0xe6c35c, flowers: 0xf6f4f0, bust: 1.05
    },
    bronya: {
      name: 'Броня', skin: 0xfbe8de, hair: 0xc8c4d6, hairHi: 0xe4e2ee, eyes: '#6f86b0', hairStyle: 'long', bangs: 'side', hairLen: 0.7,
      top: 0xf2f2f6, trim: 0x2f4e9a, collar: 0x2f4e9a, gloves: 0x1e1f26, skirt: 0xf2f2f6, skirtPanel: 0x2f4e9a, skirtLen: 0.3, coat: 0xf2f2f6, coatTrim: 0x2f4e9a,
      legs: 0x1d1d24, boots: 0xe8e8ee, bootsHigh: true, weapon: 'rifle'
    },
    asta: {
      name: 'Аста', skin: 0xfbe6dc, hair: 0xd24f76, hairHi: 0xe98aa6, eyes: '#b04a86', hairStyle: 'long', bangs: 'straight', hairLen: 0.62, sideTail: true,
      top: 0xf6f2ee, trim: 0x1b1b22, collar: 0x1b1b22, gloves: null, sleeves: 0xf6f2ee, skirt: 0xc8354f, skirtPanel: 0xf6f2ee, skirtLen: 0.28, jacket: 0xc8354f,
      legs: 0x1c1c22, boots: 0xf4f0ec, bootsHigh: true, weapon: 'staff'
    },
    tingyun: {
      name: 'Тинъюнь', skin: 0xfbe6dc, hair: 0x7c4a30, hairHi: 0xa0684a, eyes: '#5aa86a', hairStyle: 'pony', bangs: 'straight', hairLen: 0.55, ears: 'fox', tail: 0xf2e6da,
      top: 0x1e1a1c, trim: 0xc9a14a, collar: 0xb8262e, gloves: null, sleeves: 0xf4ece4, skirt: 0xb8262e, skirtPanel: 0x1e1a1c, skirtLen: 0.34,
      legs: 0xf6e2d8, boots: 0x2a1e1c, weapon: 'fan'
    },
    yukong: {
      name: 'Юйкун', skin: 0xfbe6dc, hair: 0x1d2338, hairHi: 0x2f8e9c, eyes: '#d7a646', hairStyle: 'long', bangs: 'side', hairLen: 0.5, ears: 'fox', tail: 0x1d2338,
      top: 0xf2f2f0, trim: 0xc9a14a, collar: 0x1f3d6c, gloves: 0x1f3d6c, skirt: 0x1f3d6c, skirtPanel: 0xf2f2f0, skirtLen: 0.4, coat: 0x1f3d6c, coatTrim: 0xc9a14a,
      legs: 0x1c1c22, boots: 0x1f3d6c, bootsHigh: true, weapon: 'bow'
    },
    robin: {
      name: 'Робин', skin: 0xfbe8de, hair: 0x9cc2ea, hairHi: 0xd0e4f8, eyes: '#6e8fd8', hairStyle: 'long', bangs: 'straight', hairLen: 0.55, wings: true, halo: 0xf2d06a,
      top: 0xf6f4f2, trim: 0xd8b458, collar: 0x5b4fa6, gloves: 0xf6f4f2, skirt: 0xf6f4f2, skirtPanel: 0x5b4fa6, skirtLen: 0.6, legs: 0xf6f4f2, boots: 0xf6f4f2
    },
    march: {
      name: 'Март 7', skin: 0xfbe6dc, hair: 0xf0a0bf, hairHi: 0xf8c8da, eyes: '#6aa8e0', hairStyle: 'bob', bangs: 'straight', hairLen: 0.2,
      top: 0xf4f4f6, trim: 0x3a78c8, collar: 0x3a78c8, gloves: null, sleeves: 0xf4f4f6, skirt: 0x1f2a44, skirtLen: 0.24, legs: 0xf6e2d8, boots: 0x2a3550, bootsHigh: true, weapon: 'bow'
    },
    firefly: {
      name: 'Светлячок', skin: 0xfbe6dc, hair: 0x9ea6b4, hairHi: 0x5fc8b0, eyes: '#e07ab8', hairStyle: 'long', bangs: 'straight', hairLen: 0.52,
      top: 0xf2f0ee, trim: 0x2a2e38, collar: 0x2a2e38, gloves: null, sleeves: 0x2a2e38, skirt: 0xf2f0ee, skirtLen: 0.42, legs: 0x1c1c22, boots: 0x2a2e38
    },
    caelus: {
      name: 'Келус', male: true, skin: 0xf6e0d2, hair: 0x7a7a80, hairHi: 0x9a9aa2, eyes: '#d6a646', hairStyle: 'short', bangs: 'side', hairLen: 0,
      top: 0x2a2a30, trim: 0xd8b458, collar: 0xf2f2f2, gloves: 0x1c1c20, sleeves: 0x2a2a30, jacket: 0x1c1c22, legs: 0x2c2c34, boots: 0x1c1c20, weapon: 'bat'
    },
    archer: {
      name: 'Арчер', male: true, skin: 0x9a6a4c, hair: 0xecebea, hairHi: 0xffffff, eyes: '#8a8f98', hairStyle: 'spiky', bangs: 'up', hairLen: 0,
      top: 0x1e1e24, trim: 0xb8262c, collar: 0x1e1e24, gloves: 0x1e1e24, sleeves: 0xb8262c, coat: 0xb8262c, coatTrim: 0x1e1e24, legs: 0x1e1e24, boots: 0x2a2a30
    },
    himeko: {
      name: 'Химеко', skin: 0xfbe6dc, hair: 0xb8342a, hairHi: 0xd8584a, eyes: '#d8a646', hairStyle: 'wavy', bangs: 'side', hairLen: 0.62,
      top: 0xf2f0ee, trim: 0x1c1c22, collar: 0xb8342a, gloves: 0x1c1c22, skirt: 0x1c1c22, skirtPanel: 0xb8342a, skirtLen: 0.5, legs: 0x1c1c22, boots: 0x1c1c22
    },
    guard: {
      name: 'Серебряная Грива', male: true, skin: 0xf0d6c4, hair: 0x5a4a3c, hairHi: 0x6a5a4c, eyes: '#44506a', hairStyle: 'helmet', bangs: 'none', hairLen: 0, helmet: 0x8a96a8,
      top: 0x5c6f8e, trim: 0xd8d8e0, collar: 0x3a4a64, gloves: 0x2a3040, sleeves: 0x5c6f8e, coat: 0x5c6f8e, coatTrim: 0xc8ccd6, legs: 0x3a4a64, boots: 0x2a2a30, weapon: 'spear'
    },
    bluegirl: {
      name: 'Девочка', skin: 0xfbe8de, hair: 0x5a86d8, hairHi: 0x8ab0f0, eyes: '#3ac8c8', hairStyle: 'long', bangs: 'straight', hairLen: 0.35, ahoge: true,
      top: 0xd87ab8, trim: 0x2a3a8a, collar: 0x2a3a8a, sleeves: 0xd87ab8, skirt: 0xb07ad8, skirtLen: 0.3, legs: 0xf6e2d8, boots: 0x2a3a8a
    },
    redbob: {
      name: 'Рыжая', skin: 0xfbe6dc, hair: 0xc8342a, hairHi: 0xe85a4a, eyes: '#8a4ac8', hairStyle: 'bob', bangs: 'straight', hairLen: 0.2,
      top: 0x2a2a34, trim: 0xc8342a, collar: 0xf2f2f2, sleeves: 0x2a2a34, skirt: 0x2a2a34, skirtLen: 0.25, legs: 0x1c1c22, boots: 0x1c1c22
    },
    ears: {
      name: 'Ушастая', skin: 0xfbe6dc, hair: 0x14141a, hairHi: 0x2a2a3a, eyes: '#6a4a8a', hairStyle: 'long', bangs: 'straight', hairLen: 0.6, horns: 'back',
      top: 0xf6f6f6, trim: 0xd8b448, collar: 0x14141a, sleeves: 0x2a8a8a, jacket: 0x2a8a8a, skirt: 0x1c1c22, skirtLen: 0.3, legs: 0x1c1c22, boots: 0x1c1c22
    },
    ramgirl: {
      name: 'Рогатая', skin: 0xfbe6dc, hair: 0xe8782a, hairHi: 0xf8a050, eyes: '#e8a830', hairStyle: 'long', bangs: 'side', hairLen: 0.4, horns: true,
      top: 0x8a8a92, trim: 0xe8782a, collar: 0x8a8a92, sleeves: 0x8a8a92, skirt: 0x2a2a30, skirtLen: 0.2, legs: 0x2a2a30, boots: 0x2a2a30
    },
    capgirl: {
      name: 'Кепка', skin: 0xfbe6dc, hair: 0x9a9aa8, hairHi: 0xc0c0cc, eyes: '#e05a9a', hairStyle: 'bob', bangs: 'straight', hairLen: 0.25, cap: 0x2a2630,
      top: 0xb8262e, trim: 0x5a0e14, collar: 0xb8262e, sleeves: 0xb8262e, skirt: 0x2a2630, skirtLen: 0.25, legs: 0x2a2630, boots: 0x2a2630
    },
    twintails: {
      name: 'Хвостики', skin: 0xfbe6dc, hair: 0xf0802a, hairHi: 0xf8a45a, eyes: '#5a8ac8', hairStyle: 'twin', bangs: 'straight', hairLen: 0.6, horns: true,
      top: 0x1c1c22, trim: 0xf0802a, collar: 0x1c1c22, sleeves: 0x1c1c22, jacket: 0x1c1c22, skirt: 0x1c1c22, skirtLen: 0.25, legs: 0x1c1c22, boots: 0x1c1c22
    },
    smugman: {
      name: 'Самодовольный', male: true, skin: 0xf6e0d2, hair: 0x3aa89a, hairHi: 0x6ad0c0, eyes: '#e8c030', hairStyle: 'short', bangs: 'side', hairLen: 0, monocle: true,
      top: 0xf4f0e6, trim: 0xd8b448, collar: 0x3aa89a, sleeves: 0xf4f0e6, legs: 0x2a2a30, boots: 0x2a2a30
    },
    elf: {
      name: 'Эльфийка', skin: 0xfbeae2, hair: 0xe8e6ee, hairHi: 0xffffff, eyes: '#3aa87a', hairStyle: 'twin', bangs: 'straight', hairLen: 0.7, elfEars: true,
      top: 0xf4f2ee, trim: 0xc8a448, collar: 0x2a2a30, gem: true, sleeves: 0xf4f2ee, skirt: 0xf4f2ee, skirtLen: 0.5, legs: 0x2a2a30, boots: 0x6a4a3a
    },
    woman: {
      name: 'Женщина', skin: 0xf0cdb8, hair: 0x2a1c18, hairHi: 0x4a342a, eyes: '#4a3a2a', hairStyle: 'long', bangs: 'side', hairLen: 0.35,
      top: 0x2a2a30, trim: 0x2a2a30, collar: 0x2a2a30, sleeves: 0x2a2a30, legs: 0x2a2a3a, boots: 0x1a1a1a
    },
    lifter: {
      name: 'Силач', male: true, skin: 0xf0cdb8, hair: 0x3a2a1c, hairHi: 0x5a4030, eyes: '#3a2a1c', hairStyle: 'short', bangs: 'straight', hairLen: 0, scale: 1.12,
      top: 0xc8262a, trim: 0xc8262a, collar: 0xc8262a, legs: 0x2a3a5a, boots: 0x1c1c1c
    },
    redscythe: {
      name: 'Рыжая с косой', skin: 0xfbe6dc, hair: 0xc8302a, hairHi: 0xe85040, eyes: '#6a8ac8', hairStyle: 'bob', bangs: 'side', hairLen: 0.15, sideTail: true,
      top: 0xf4f2ee, trim: 0x2a2a30, collar: 0x2a2a30, sleeves: 0xf4f2ee, skirt: 0xf4f2ee, skirtLen: 0.35, legs: 0x1c1c22, boots: 0x1c1c22, weapon: 'scythe'
    },
    miner: {
      name: 'Шахтёр', male: true, skin: 0xe8c8b0, hair: 0x4a3a2a, hairHi: 0x5a4a3a, eyes: '#3a2a1c', hairStyle: 'helmet', bangs: 'none', hairLen: 0, helmet: 0xd8a830,
      top: 0x6a5a3a, trim: 0x3a3226, collar: 0x6a5a3a, sleeves: 0x6a5a3a, legs: 0x3a3a44, boots: 0x2a2a2a
    },
    welt: {
      name: 'Вельт', male: true, skin: 0xf6e0d2, hair: 0x6a4a2a, hairHi: 0x8a6a4a, eyes: '#c8a448', hairStyle: 'short', bangs: 'side', hairLen: 0, specs: true,
      top: 0xe8e2d6, trim: 0x2a2a30, collar: 0x2a2a30, sleeves: 0x2a2a30, coat: 0x2a2a30, coatTrim: 0xd8b448, legs: 0x2a2a30, boots: 0x3a2a1c, weapon: 'staff'
    },
    cerydra: {
      name: 'Керидра', skin: 0xfbe8de, hair: 0xeef0f4, hairHi: 0x6ad0d0, eyes: '#3ab8c8', hairStyle: 'long', bangs: 'side', hairLen: 0.55,
      top: 0x1c2438, trim: 0x3ab8b8, collar: 0x1c2438, sleeves: 0x3ab8b8, skirt: 0x1c2438, skirtPanel: 0x3ab8b8, skirtLen: 0.5, legs: 0x1c1c22, boots: 0x1c2438
    },
    silverwolf: {
      name: 'Серебряный Волк', skin: 0xfbe6dc, hair: 0x9a9aa8, hairHi: 0xc0c0cc, eyes: '#6a7ac8', hairStyle: 'pony', bangs: 'straight', hairLen: 0.4,
      top: 0x1c1c22, trim: 0xe060a0, collar: 0x1c1c22, sleeves: 0x1c1c22, jacket: 0xe060a0, legs: 0x2a2a30, boots: 0x1c1c22
    },
    gepard: {
      name: 'Гепард', male: true, skin: 0xf6e0d2, hair: 0xe8c860, hairHi: 0xf8e090, eyes: '#4a8ad8', hairStyle: 'short', bangs: 'side', hairLen: 0, scale: 1.1,
      top: 0x2a4a8a, trim: 0xd8d8e0, collar: 0x2a4a8a, gloves: 0x2a2a34, sleeves: 0x2a4a8a, coat: 0x2a4a8a, coatTrim: 0xd8b448, legs: 0x2a3050, boots: 0x2a2a30, weapon: 'spear'
    },
    purpleman: {
      name: 'Хто', male: true, skin: 0xf6e0d2, hair: 0x7a5ab0, hairHi: 0x9a7ad0, eyes: '#8a6ab0', hairStyle: 'short', bangs: 'side', hairLen: 0,
      top: 0x6a4a2a, trim: 0x1c1c22, collar: 0x6a4a2a, sleeves: 0x1c1c22, jacket: 0x1c1c22, legs: 0x2a2a30, boots: 0x1c1c22
    },
    herta: {
      name: 'Герта', skin: 0xfbe8de, hair: 0x7a5a48, hairHi: 0x9a7a68, eyes: '#8a6ab0', hairStyle: 'long', bangs: 'straight', hairLen: 0.65, cap: 0x1c1c22,
      top: 0x4a3a5a, trim: 0x1c1c22, collar: 0x1c1c22, sleeves: 0x4a3a5a, skirt: 0x2a2030, skirtLen: 0.55, legs: 0x1c1c22, boots: 0x1c1c22
    },
    kidgirl: {
      name: 'Девочка', skin: 0xf6dcc8, hair: 0x8a8a90, hairHi: 0xa8a8b0, eyes: '#4a4a5a', hairStyle: 'bob', bangs: 'straight', hairLen: 0.2, scale: 0.62,
      top: 0x7a5a3a, trim: 0x5a3a2a, collar: 0x7a5a3a, sleeves: 0x7a5a3a, skirt: 0x7a5a3a, skirtLen: 0.35, legs: 0xf6dcc8, boots: 0x3a2a1c
    },
    kidboy: {
      name: 'Мальчик', male: true, skin: 0xf6dcc8, hair: 0x2a2020, hairHi: 0x3a3030, eyes: '#3a2a1c', hairStyle: 'short', bangs: 'straight', hairLen: 0, scale: 0.6,
      top: 0xe8c83a, trim: 0x3a3a44, collar: 0xf2f2f2, sleeves: 0xf2f2f2, legs: 0x3a3a50, boots: 0x2a2a2a
    },
    serval: {
      name: 'Сервал', skin: 0xfbe6dc, hair: 0xe8d070, hairHi: 0x6ab8e8, eyes: '#6aa8e0', hairStyle: 'long', bangs: 'side', hairLen: 0.4,
      top: 0x2a2a34, trim: 0x6ab8e8, collar: 0x2a2a34, sleeves: 0x2a2a34, coat: 0x2a2a34, coatTrim: 0x6ab8e8, legs: 0x1c1c22, boots: 0x1c1c22, weapon: 'bat'
    },
    hook: {
      name: 'Хук', skin: 0xfbe6dc, hair: 0xf0d070, hairHi: 0xf8e098, eyes: '#6a8a3a', hairStyle: 'twin', bangs: 'straight', hairLen: 0.3, cap: 0x7a4a2a, scale: 0.8,
      top: 0xe8c030, trim: 0x1c1c22, collar: 0x1c1c22, sleeves: 0x1c1c22, coat: 0xe8c030, coatTrim: 0x1c1c22, legs: 0x1c1c22, boots: 0x3a2a1c, weapon: 'bat'
    },
    stelle: {
      name: 'Стелла', skin: 0xf2d8cc, hair: 0x8c8c94, hairHi: 0xa8a8b0, eyes: '#d8a646', hairStyle: 'long', bangs: 'side', hairLen: 0.55,
      top: 0xf2f2f2, trim: 0xd8b448, collar: 0xf2f2f2, sleeves: 0x2a2a30, jacket: 0x1c1c22, skirt: 0x2a2a30, skirtLen: 0.22, legs: 0x1c1c22, boots: 0x2a2a30, weapon: 'bat'
    },
    seele: {
      name: 'Зеле', skin: 0xfbe6dc, hair: 0x5a3a9a, hairHi: 0x8a5ad0, eyes: '#8a4ad8', hairStyle: 'long', bangs: 'side', hairLen: 0.45,
      top: 0x1c1c26, trim: 0x8a4ad8, collar: 0x1c1c26, sleeves: 0x1c1c26, skirt: 0x1c1c26, skirtLen: 0.2, legs: 0x1c1c26, boots: 0x1c1c26, weapon: 'scythe'
    },
    danheng: {
      name: 'Дань Хэн', male: true, skin: 0xf6e0d2, hair: 0x1c1c26, hairHi: 0x2a2a3a, eyes: '#4a8a6a', hairStyle: 'short', bangs: 'side', hairLen: 0,
      top: 0x1c1c22, trim: 0x3a8a6a, collar: 0xf2f2f2, sleeves: 0x1c1c22, coat: 0xf2f2f2, coatTrim: 0x3a8a6a, legs: 0x1c1c22, boots: 0x1c1c22, weapon: 'spear'
    },
    jingyuan: {
      name: 'Цзин Юань', male: true, skin: 0xf6e0d2, hair: 0xe8e8ee, hairHi: 0xffffff, eyes: '#d8a646', hairStyle: 'long', bangs: 'side', hairLen: 0.4,
      top: 0x1c1c22, trim: 0xd8b448, collar: 0x1c1c22, sleeves: 0x1c1c22, coat: 0x1c1c22, coatTrim: 0xd8b448, legs: 0x1c1c22, boots: 0x1c1c22
    },
    cipher: {
      name: 'Сайфер', skin: 0xfbe8de, hair: 0xc8c8d8, hairHi: 0xe8e8f0, eyes: '#8a6ab0', hairStyle: 'bob', bangs: 'straight', hairLen: 0.25, ears: 'fox', cap: 0x2a2436,
      top: 0x2a2436, trim: 0xd8b448, collar: 0x2a2436, sleeves: 0x2a2436, skirt: 0x2a2436, skirtLen: 0.2, legs: 0x1c1c22, boots: 0x1c1c22
    },
    vagrant: {
      name: 'Бродяга', male: true, skin: 0xd8c0b0, hair: 0xe8e8e8, hairHi: 0xffffff, eyes: '#3a2a1c', hairStyle: 'helmet', bangs: 'none', hairLen: 0, helmet: 0xe8e8e8,
      top: 0xd8d8d0, trim: 0x6a6a6a, collar: 0xd8d8d0, sleeves: 0xd8d8d0, coat: 0xd8d8d0, coatTrim: 0x8a8a8a, legs: 0x5a5a60, boots: 0x3a3a3a, weapon: 'spear'
    },
    sampo: {
      name: 'Сампо', male: true, skin: 0xf6e0d2, hair: 0x3a5a8a, hairHi: 0x5a7aaa, eyes: '#4a8a3a', hairStyle: 'short', bangs: 'side', hairLen: 0,
      top: 0xb8262e, trim: 0xd8b448, collar: 0xb8262e, sleeves: 0xb8262e, coat: 0xb8262e, coatTrim: 0x1c1c22, legs: 0x1c1c22, boots: 0x1c1c22
    },
    moonman: {
      name: 'Лунный', male: true, skin: 0xf6e0d2, hair: 0x7a4ab0, hairHi: 0x9a6ad0, eyes: '#e8c030', hairStyle: 'short', bangs: 'side', hairLen: 0,
      top: 0x2a2436, trim: 0xd8b448, collar: 0x2a2436, sleeves: 0x2a2436, legs: 0x2a2a30, boots: 0x2a2a30
    },
    shirtless: {
      name: 'Качок', male: true, skin: 0xd8a888, hair: 0x2a3a6a, hairHi: 0x4a5a8a, eyes: '#3a2a1c', hairStyle: 'short', bangs: 'side', hairLen: 0, scale: 1.1,
      top: 0xd8a888, trim: 0xb88868, collar: 0xd8a888, legs: 0x3a3a44, boots: 0x2a2a2a
    },
    whitehat: {
      name: 'Девушка в шляпе', skin: 0xfbeae2, hair: 0xeeeef4, hairHi: 0xffffff, eyes: '#8a6ab0', hairStyle: 'long', bangs: 'straight', hairLen: 0.5, cap: 0xf4f4f4,
      top: 0x7a4ab0, trim: 0xf4f4f4, collar: 0x7a4ab0, sleeves: 0x7a4ab0, skirt: 0x7a4ab0, skirtLen: 0.5, legs: 0xf4f4f4, boots: 0x2a2a30
    },
    brownhair: {
      name: 'Шатенка', skin: 0xfbe6dc, hair: 0x6b4a3a, hairHi: 0x8a6450, eyes: '#6a4a3a', hairStyle: 'long', bangs: 'side', hairLen: 0.55,
      top: 0xe8c040, trim: 0x1c1c22, collar: 0xf2f2f2, sleeves: 0x1c1c22, jacket: 0x1c1c22, skirt: 0x2a2a30, skirtLen: 0.22, legs: 0x1c1c22, boots: 0x2a2a30
    },
    streamer: {
      name: 'Зритель', male: true, skin: 0xf2d2bc, hair: 0x8a5a2c, hairHi: 0xa8743c, eyes: '#4a3a2a', hairStyle: 'short', bangs: 'straight', hairLen: 0, specs: true,
      top: 0xe8d23c, trim: 0x2a2a2a, collar: 0xe8d23c, gloves: null, sleeves: 0xe8d23c, legs: 0x2a3a5a, boots: 0x2a2a2a
    }
  };

  const EXPRESSIONS = ['calm', 'talk', 'open', 'smile', 'happy', 'wink', 'angry', 'shock', 'smug', 'blink', 'sad'];

  function faceDrawer(look, kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const eyeY = 128;
      const male = !!look.male;
      const closed = ['happy', 'blink', 'smile'].includes(kind);
      if (!male) {
        ctx.fillStyle = 'rgba(255,140,150,0.45)';
        [52, 204].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 168, 18, 8, 0, 0, PI * 2); ctx.fill(); });
      }
      [[84, -1], [172, 1]].forEach(([x, side]) => {
        const shut = closed || (kind === 'wink' && side < 0);
        ctx.strokeStyle = '#1a1216';
        if (shut) {
          ctx.lineWidth = 7;
          ctx.beginPath();
          if (kind === 'blink') {
            ctx.moveTo(x - 24, eyeY + 4);
            ctx.quadraticCurveTo(x, eyeY + 14, x + 24, eyeY + 4);
          } else {
            ctx.moveTo(x - 24, eyeY + 10);
            ctx.quadraticCurveTo(x, eyeY - 14, x + 24, eyeY + 10);
          }
          ctx.stroke();
          return;
        }
        const tall = male ? 22 : 29;
        const wide = male ? 20 : 23;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x, eyeY + 2, wide, tall, 0, 0, PI * 2);
        ctx.fill();
        const g = ctx.createLinearGradient(0, eyeY - tall, 0, eyeY + tall);
        g.addColorStop(0, '#15121c');
        g.addColorStop(0.45, look.eyes);
        g.addColorStop(1, '#f4f8ff');
        ctx.fillStyle = g;
        const small = kind === 'shock' ? 0.55 : 1;
        ctx.beginPath();
        ctx.ellipse(x - side * 2, eyeY + 4, (wide - 5) * small, (tall - 4) * small, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#120e16';
        ctx.beginPath();
        ctx.ellipse(x - side * 2, eyeY + 6, 7 * small, 11 * small, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x - 8, eyeY - 8, 6, 7, 0, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 7, eyeY + 14, 3, 0, PI * 2);
        ctx.fill();
        ctx.lineWidth = male ? 6 : 8;
        ctx.beginPath();
        ctx.moveTo(x - side * (wide + 6), eyeY - tall * 0.2);
        ctx.quadraticCurveTo(x, eyeY - tall - 10, x + side * (wide + 4), eyeY - tall * 0.55);
        ctx.stroke();
        if (kind === 'smug' || kind === 'sad') {
          ctx.fillStyle = '#' + ((look.skin >>> 0) & 0xffffff).toString(16).padStart(6, '0');
          ctx.fillRect(x - wide - 4, eyeY - tall - 14, wide * 2 + 8, tall * 0.9 + 8);
          ctx.beginPath();
          ctx.moveTo(x - wide - 2, eyeY - tall * 0.12);
          ctx.lineTo(x + wide + 2, eyeY - tall * 0.12);
          ctx.stroke();
        }
      });
      const hairCss = '#' + ((look.hair >>> 0) & 0xffffff).toString(16).padStart(6, '0');
      ctx.strokeStyle = shadeCss(hairCss, 0.7);
      ctx.lineWidth = male ? 6 : 4;
      [[84, -1], [172, 1]].forEach(([x, side]) => {
        ctx.beginPath();
        if (kind === 'angry') {
          ctx.moveTo(x - side * 22, 72);
          ctx.lineTo(x + side * 16, 88);
        } else if (kind === 'sad') {
          ctx.moveTo(x - side * 22, 88);
          ctx.lineTo(x + side * 16, 74);
        } else {
          ctx.moveTo(x - 20, 80);
          ctx.quadraticCurveTo(x, 72, x + 20, 80);
        }
        ctx.stroke();
      });
      const mx = 128, my = 200;
      ctx.fillStyle = '#8a2a36';
      ctx.strokeStyle = '#6a2a2a';
      ctx.lineWidth = 4;
      if (kind === 'talk') {
        ctx.beginPath();
        ctx.ellipse(mx, my, 14, 8, 0, 0, PI * 2);
        ctx.fill();
      } else if (kind === 'open' || kind === 'angry') {
        ctx.beginPath();
        ctx.moveTo(mx - 15, my - 5);
        ctx.quadraticCurveTo(mx, my + 20, mx + 15, my - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff9aa6';
        ctx.beginPath();
        ctx.ellipse(mx, my + 6, 7, 4, 0, 0, PI * 2);
        ctx.fill();
      } else if (kind === 'shock') {
        ctx.beginPath();
        ctx.ellipse(mx, my + 2, 8, 11, 0, 0, PI * 2);
        ctx.fill();
      } else if (kind === 'happy' || kind === 'smile' || kind === 'wink') {
        ctx.beginPath();
        ctx.moveTo(mx - 16, my - 6);
        ctx.quadraticCurveTo(mx, my + 16, mx + 16, my - 6);
        ctx.closePath();
        ctx.fill();
      } else if (kind === 'smug') {
        ctx.beginPath();
        ctx.moveTo(mx - 12, my);
        ctx.quadraticCurveTo(mx + 2, my + 6, mx + 14, my - 6);
        ctx.stroke();
      } else if (kind === 'sad') {
        ctx.beginPath();
        ctx.moveTo(mx - 10, my + 4);
        ctx.quadraticCurveTo(mx, my - 4, mx + 10, my + 4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(mx - 15, my);
        ctx.quadraticCurveTo(mx, my + 7, mx + 15, my);
        ctx.stroke();
      }
      if (look.specs) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 5;
        [84, 172].forEach(x => { ctx.strokeRect(x - 30, 100, 60, 48); });
        ctx.beginPath();
        ctx.moveTo(114, 118);
        ctx.lineTo(142, 118);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  function shadeCss(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
    return `rgb(${r},${g},${b})`;
  }

  function hairSheet(b, pts, widths, col, depth) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const wa = widths[i], wc = widths[i + 1];
      const n = [0, 0, -1];
      b.quad([a[0] - wa, a[1], a[2]], [a[0] + wa, a[1], a[2]], [c[0] + wc, c[1], c[2]], [c[0] - wc, c[1], c[2]], col, null, [n, n, n, n]);
      if (depth) {
        b.quad([a[0] - wa, a[1], a[2] + depth], [a[0] - wa, a[1], a[2]], [c[0] - wc, c[1], c[2]], [c[0] - wc, c[1], c[2] + depth], shade(col, 0.8));
        b.quad([a[0] + wa, a[1], a[2]], [a[0] + wa, a[1], a[2] + depth], [c[0] + wc, c[1], c[2] + depth], [c[0] + wc, c[1], c[2]], shade(col, 0.8));
      }
    }
  }

  function buildHair(b, look) {
    const R = HEAD;
    const H = look.hair;
    const Hi = look.hairHi || shade(H, 1.2);
    const dark = shade(H, 0.78);
    const P = (yaw, pit, k) => [S(yaw) * C(pit) * R * k, S(pit) * R * 0.98 * k, C(yaw) * C(pit) * R * 0.95 * k];
    const style = look.hairStyle;
    if (style === 'helmet') {
      spherePatch(b, R * 1.18, R * 1.12, R * 1.15, -PI, PI, -0.1, PI / 2, 12, 5, look.helmet);
      b.at(0, R * 0.05, R * 0.9, h => h.box(R * 1.8, R * 0.18, R * 0.3, shade(look.helmet, 0.8)));
      return;
    }
    const k = 1.07;
    spherePatch(b, R * k, R * 0.98 * k, R * 0.95 * k, -PI, PI, 0.28, PI / 2, 14, 5, H);
    spherePatch(b, R * k, R * 0.98 * k, R * 0.95 * k, 0.95, 2 * PI - 0.95, -0.85, 0.28, 12, 6, H);
    spherePatch(b, R * 1.09, R * 0.98 * 1.09, R * 0.95 * 1.09, -0.5, 0.3, 0.9, 1.2, 4, 2, Hi);
    const N = (yaw, pit) => V3.norm([S(yaw) * C(pit), S(pit), C(yaw) * C(pit)]);
    const bang = look.bangs;
    if (bang === 'up') {
      for (let i = 0; i < 9; i++) {
        const a = -1 + i * 0.25;
        b.push(M4.translate(...P(a, 0.55, 1.0)), M4.rotY(a), M4.rotX(-0.9 - (i % 2) * 0.3));
        b.prism(4, 0.03, 0.014, 0, 0.003, 0.003, 0.09, H);
        b.pop();
      }
    } else if (bang !== 'none') {
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a0 = -0.95 + (1.9 * i) / n, a1 = a0 + 1.9 / n;
        const sweep = bang === 'side' ? 0.18 : 0;
        const tip = (a0 + a1) / 2 + sweep;
        const long = bang === 'side' ? 0.02 + 0.14 * (i / n) : 0.1 + ((i * 5) % 3) * 0.04;
        b.tri(P(a0, 0.34, 1.08), P(a1, 0.34, 1.08), P(tip, long, 1.07), i % 3 === 1 ? Hi : H, null, [N(a0, 0.34), N(a1, 0.34), N(tip, long)]);
      }
      [-1, 1].forEach(s => hairSheet(b, [P(s * 1.25, 0.2, 1.06), P(s * 1.3, -0.5, 1.06), [s * R * 0.98, -R * 1.25, R * 0.25]], [0.03, 0.028, 0.01], H, 0));
    }
    if (style === 'spiky') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        b.push(M4.translate(...P(a, 0.45, 0.95)), M4.rotY(a), M4.rotX(-1.9 + (i % 3) * 0.2));
        b.prism(4, 0.035, 0.018, 0, 0.003, 0.003, 0.1, H);
        b.pop();
      }
    }
    const len = look.hairLen || 0;
    if (style === 'long' || style === 'wavy') {
      const w0 = R * 1.05, w1 = style === 'wavy' ? R * 1.35 : R * 1.12;
      const pts = [];
      const ws = [];
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const wig = style === 'wavy' ? S(t * PI * 3) * 0.02 : 0;
        pts.push([wig, R * 0.3 - t * (R * 0.3 + len), -R * 0.72 - t * 0.05]);
        ws.push(w0 + (w1 - w0) * Math.min(1, t * 2) - (t > 0.8 ? (t - 0.8) * R * 2 : 0));
      }
      hairSheet(b, pts, ws, H, 0.05);
      if (style === 'wavy') {
        [-1, 1].forEach(s => {
          const side = [];
          for (let i = 0; i <= 5; i++) {
            const t = i / 5;
            side.push([s * (R * 0.95 + S(t * PI * 2.5) * 0.025), -R * 0.2 - t * (len * 0.8), -R * 0.1 + t * 0.03]);
          }
          hairSheet(b, side, [0.045, 0.05, 0.05, 0.045, 0.035, 0.012], dark, 0);
        });
      }
    } else if (style === 'pony') {
      b.at(0, R * 0.55, -R * 0.95, h => h.ellipsoid(0.04, 0.04, 0.04, 6, 4, look.trim || dark));
      tube(b, [[0, R * 0.55, -R * 1.05], [0, R * 0.2, -R * 1.35], [0, -len * 0.5, -R * 1.45], [0, -len, -R * 1.3]], [0.05, 0.07, 0.06, 0.012], 7, H);
      hairSheet(b, [[0, R * 0.3, -R * 0.8], [0, -R * 0.6, -R * 0.82]], [R * 1.0, R * 0.9], H, 0.04);
    } else if (style === 'bob') {
      spherePatch(b, R * 1.12, R * 1.0, R * 1.08, 0.9, 2 * PI - 0.9, -1.15, 0.3, 12, 4, H);
      [-1, 1].forEach(s => hairSheet(b, [[s * R * 1.02, R * 0.1, R * 0.2], [s * R * 1.08, -R * 0.85, R * 0.28]], [0.04, 0.03], H, 0.02));
    } else if (style === 'short') {
      spherePatch(b, R * 1.1, R * 1.0, R * 1.06, 1.0, 2 * PI - 1.0, -0.7, 0.3, 10, 3, H);
    }
    if (look.teal) {
      [-1, 1].forEach(s => hairSheet(b, [[s * R * 0.96, R * 0.1, R * 0.36], [s * R * 1.06, -R * 0.9, R * 0.32], [s * R * 1.0, -R * 2.6, R * 0.12]], [0.008, 0.009, 0.004], look.teal, 0));
    }
    if (look.sideTail) {
      tube(b, [[R * 1.0, R * 0.2, -R * 0.2], [R * 1.25, -R * 0.4, -R * 0.1], [R * 1.2, -R * 1.6, 0], [R * 1.05, -R * 3.2, 0.02]], [0.035, 0.05, 0.045, 0.01], 6, H);
    }
    if (look.ears === 'fox') {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 0.62, R * 0.82, -R * 0.1), M4.rotZ(-s * 0.35), M4.rotX(-0.1));
        b.prism(4, 0.05, 0.022, 0, 0.004, 0.004, 0.13, H, { phase: PI / 4 });
        b.at(0, 0.012, 0.012, e => e.prism(4, 0.03, 0.008, 0, 0.003, 0.003, 0.09, 0xf4e6e0, { phase: PI / 4 }));
        b.pop();
      });
    }
    if (style === 'twin') {
      [-1, 1].forEach(s => {
        b.at(s * R * 0.78, R * 0.62, -R * 0.35, h => h.ellipsoid(0.02, 0.02, 0.02, 6, 4, dark));
        tube(b, [[s * R * 0.85, R * 0.6, -R * 0.4], [s * R * 1.45, R * 0.2, -R * 0.5], [s * R * 1.6, -len * 0.5, -R * 0.45], [s * R * 1.35, -len, -R * 0.3]], [0.04, 0.075, 0.065, 0.015], 7, H);
      });
      hairSheet(b, [[0, R * 0.3, -R * 0.8], [0, -R * 0.5, -R * 0.82]], [R * 1.0, R * 0.95], H, 0.03);
    }
    if (look.ahoge) {
      b.push(M4.translate(0, R * 1.0, R * 0.2), M4.rotX(-0.5));
      tube(b, [[0, 0, 0], [0, 0.05, 0.02], [0.02, 0.08, 0.06]], [0.012, 0.008, 0.002], 4, H);
      b.pop();
    }
    if (look.ears === 'tall') {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 0.55, R * 0.88, -R * 0.1), M4.rotZ(-s * 0.18));
        b.prism(4, 0.04, 0.02, 0, 0.006, 0.006, 0.2, H, { phase: PI / 4 });
        b.pop();
      });
    }
    if (look.horns === 'back') {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 0.5, R * 0.86, R * 0.05));
        tube(b, [[0, 0, 0], [s * 0.035, 0.045, -0.03], [s * 0.075, 0.06, -0.09], [s * 0.1, 0.025, -0.14]], [0.024, 0.019, 0.012, 0.004], 6, 0x2a2a30);
        b.pop();
      });
    } else if (look.horns) {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 0.72, R * 0.72, -R * 0.1));
        tube(b, [[0, 0, 0], [s * 0.05, 0.05, -0.02], [s * 0.1, 0.02, 0.02], [s * 0.09, -0.04, 0.05]], [0.028, 0.024, 0.018, 0.006], 6, 0x5a4a44);
        b.pop();
      });
    }
    if (look.cap) {
      spherePatch(b, R * 1.14, R * 1.04, R * 1.12, -PI, PI, 0.35, PI / 2, 14, 4, look.cap);
      b.at(0, R * 0.42, R * 0.95, h => { h.push(M4.rotX(0.25)); h.box(R * 1.4, 0.012, R * 0.8, look.cap); h.pop(); });
    }
    if (look.elfEars) {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 1.0, -R * 0.12, R * 0.12), M4.rotZ(-s * 1.35), M4.rotY(s * 0.1));
        b.prism(4, 0.03, 0.012, 0, 0.004, 0.004, 0.17, look.skin, { phase: PI / 4 });
        b.pop();
        b.at(s * R * 1.02, -R * 0.35, 0, h => h.ellipsoid(0.008, 0.02, 0.008, 4, 3, [0.85, 0.1, 0.15, 0.4]));
      });
    }
    if (look.monocle) {
      b.at(R * 0.34, R * 0.22, R * 0.96, h => K.tube(h, Array.from({ length: 9 }, (_, i) => [C((i / 8) * PI * 2) * 0.03, S((i / 8) * PI * 2) * 0.03, 0]), Array(9).fill(0.005), 4, [0.9, 0.75, 0.3, 0.6]));
    }
    if (look.wings) {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 0.95, R * 0.25, -R * 0.1), M4.rotY(s * 0.4));
        for (let f = 0; f < 3; f++) b.tri([0, 0, 0], [s * (0.12 + f * 0.03), 0.05 + f * 0.03, -0.02 - f * 0.02], [s * (0.1 + f * 0.03), -0.02 + f * 0.02, -0.04 - f * 0.02], 0xfafafa);
        b.pop();
      });
    }
    if (look.clip) {
      b.at(-R * 0.82, R * 0.55, R * 0.45, h => {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * PI * 2;
          h.at(C(a) * 0.02, S(a) * 0.02, 0, p => p.ellipsoid(0.016, 0.016, 0.008, 5, 3, look.clip));
        }
        h.ellipsoid(0.01, 0.01, 0.012, 4, 3, 0xf6f0e0);
      });
    }
  }

  function buildHeadMesh(b, look) {
    const R = HEAD;
    spherePatch(b, R, R * 1.02, R * 0.95, -PI, PI, -PI / 2, PI / 2, 14, 10, P3D.rgb(look.skin, 0.3));
    [-1, 1].forEach(s => b.at(s * R * 0.97, -R * 0.08, 0, h => h.ellipsoid(0.014, 0.026, 0.018, 5, 3, shade(look.skin, 0.93))));
  }

  function buildTorso(b, look, d) {
    const top = look.top;
    const bust = look.male ? 1 : (look.bust || 1);
    b.prism(10, d.waist, d.depth * 0.95, 0, d.chest * 1.02, d.depth * 1.1 * bust, d.torso * 0.72, top, { capTop: false });
    b.at(0, d.torso * 0.72, 0, h => h.prism(10, d.chest * 1.02, d.depth * 1.1 * bust, 0, d.chest * 0.62, d.depth * 0.78, d.torso * 0.28, top));
    if (look.trim) b.at(0, d.torso * 0.02, 0, h => h.prism(10, d.waist * 1.04, d.depth, 0, d.waist * 1.06, d.depth * 1.01, 0.03, look.trim, { capTop: false }));
    if (look.collar) b.at(0, d.torso * 0.97, 0, h => h.prism(8, 0.05, 0.048, 0, 0.046, 0.044, 0.07, look.collar));
    if (look.gem) b.at(0, d.torso * 1.02, 0.046, h => h.box(0.022, 0.026, 0.012, [0.9, 0.12, 0.22, 0.4]));
    if (look.pearls) {
      for (let i = 0; i < 14; i++) {
        const a = -PI * 0.5 + (PI * i) / 13;
        b.at(S(a) * 0.07, d.torso * 0.95 - C(a) * 0.035, 0.03 + C(a) * 0.07, h => h.ellipsoid(0.011, 0.011, 0.011, 5, 3, [1, 0.98, 0.94, 0.5]));
      }
    }
    if (look.jacket) {
      b.prism(10, d.waist * 1.14, d.depth * 1.12, d.torso * 0.25, d.chest * 1.14, d.depth * 1.22, d.torso * 0.72, look.jacket, { capTop: false, phase: -PI / 10 * 1.5, skip: [0] });
      b.at(0, d.torso * 0.72, 0, h => h.prism(10, d.chest * 1.14, d.depth * 1.22, 0, d.chest * 0.66, d.depth * 0.84, d.torso * 0.27, look.jacket, { phase: -PI / 10 * 1.5, skip: [0], capTop: false }));
    }
    if (look.shawl) {
      b.at(0, d.torso * 0.86, -0.01, h => h.prism(12, d.chest * 1.32, d.depth * 1.5, 0, d.chest * 0.7, d.depth * 0.95, d.torso * 0.16, look.shawl, { phase: -PI / 12, skip: [0, 11, 1] }));
      b.at(0, d.torso * 0.45, -0.01, h => h.prism(12, d.chest * 1.45, d.depth * 1.55, 0, d.chest * 1.32, d.depth * 1.5, d.torso * 0.41, look.shawl, { phase: -PI / 12, skip: [0, 11, 1, 10, 2], capTop: false }));
    }
    b.at(0, d.torso, 0, h => h.prism(8, 0.034, 0.034, 0, 0.032, 0.032, 0.08, look.skin));
  }

  function buildHips(b, look, d) {
    b.prism(10, d.waist * 1.08, d.depth * 0.98, -0.1, d.waist, d.depth * 0.95, 0.1, look.skirt || look.legs, { capBottom: true });
  }

  function buildSkirt(b, look, d) {
    const len = look.skirtLen || 0;
    if (look.coat) {
      b.prism(12, d.waist * 2.0, d.depth * 2.1, -0.55, d.waist * 1.12, d.depth * 1.15, 0.1, look.coat, { capTop: false, phase: -PI / 12, skip: [0, 11] });
      b.prism(12, d.waist * 2.02, d.depth * 2.12, -0.58, d.waist * 1.98, d.depth * 2.08, -0.5, look.coatTrim || shade(look.coat, 0.7), { capTop: false, phase: -PI / 12, skip: [0, 11] });
    }
    if (len > 0) {
      b.prism(12, d.waist * (1.6 + len * 1.6), d.depth * (1.6 + len * 1.6), -len - 0.05, d.waist * 1.06, d.depth, 0.1, look.skirt, { capTop: false });
      if (look.skirtPanel) b.prism(12, d.waist * (1.62 + len * 1.6), d.depth * (1.62 + len * 1.6), -len - 0.06, d.waist * (1.54 + len * 1.6), d.depth * (1.54 + len * 1.6), -len + 0.02, look.skirtPanel, { capTop: false });
    }
    if (look.flowers) [-1, 1].forEach(s => b.at(s * d.waist * 0.95, 0.02, d.depth * 0.8, h => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2;
        h.at(C(a) * 0.022, S(a) * 0.022, 0, p => p.ellipsoid(0.018, 0.018, 0.01, 5, 3, look.flowers));
      }
    }));
    if (look.tail) {
      tube(b, [[0, 0, -d.depth], [0, -0.12, -d.depth - 0.15], [0.06, -0.32, -d.depth - 0.22], [0.1, -0.5, -d.depth - 0.12]], [0.03, 0.08, 0.09, 0.02], 7, look.tail);
    }
  }

  function buildUpper(b, look, d) {
    const col = look.sleeves || look.coat || look.jacket || (look.shawl ? look.shawl : look.skin);
    b.prism(12, 0.036, 0.036, -d.upper, 0.043, 0.043, 0.02, col, { capBottom: true });
  }

  function buildHand(b, look, pose) {
    const col = look.gloves || look.skin;
    b.box(0.052, 0.07, 0.022, col);
    if (look.gloves) b.at(0, 0.03, 0, h => h.prism(10, 0.031, 0.026, -0.006, 0.031, 0.026, 0.006, look.cuff || [0.86, 0.88, 0.92, 0.25]));
    if (pose === 'point') {
      b.at(0, -0.05, 0.006, h => h.box(0.08, 0.06, 0.058, col));
      b.at(0.02, -0.11, 0, h => h.box(0.026, 0.075, 0.024, col));
      b.at(0.02, -0.15, 0, h => h.ellipsoid(0.013, 0.012, 0.012, 6, 4, col));
    } else if (pose === 'fist') {
      b.at(0, -0.045, 0.006, h => h.box(0.05, 0.03, 0.03, col));
    } else if (pose === 'peace') {
      b.at(-0.012, -0.055, 0.004, h => h.box(0.026, 0.026, 0.026, col));
      [-0.004, 0.018].forEach((x, i) => b.at(x + 0.006, -0.07, 0, h => { h.push(M4.rotZ(i ? -0.25 : 0.1)); h.box(0.012, 0.055, 0.014, col); h.pop(); }));
    } else {
      for (let i = 0; i < 4; i++) b.at(-0.022 + i * 0.0145, -0.062, 0, h => { h.push(M4.rotZ((i - 1.5) * 0.18)); h.at(0, -0.03, 0, f => f.box(0.012, 0.06 - Math.abs(i - 1.5) * 0.008, 0.013, col)); h.pop(); });
    }
    b.at(0.03, -0.012, 0.006, h => { h.push(M4.rotZ(0.6)); h.box(0.013, 0.035, 0.015, col); h.pop(); });
  }

  function buildFore(b, look, d) {
    const col = look.gloves || look.sleeves || look.coat || look.skin;
    b.prism(12, 0.028, 0.028, -d.fore, 0.036, 0.036, 0.01, col, { capBottom: true });
    if (look.gloves && look.trim) b.at(0, -0.03, 0, h => h.prism(12, 0.037, 0.037, -0.012, 0.038, 0.038, 0.012, look.trim));
  }

  function buildThigh(b, look, d) {
    b.prism(8, 0.042, 0.044, -d.thigh, 0.052, 0.056, 0.01, look.legs, { capBottom: true });
  }

  function buildShin(b, look, d) {
    const high = look.bootsHigh;
    b.prism(8, 0.032, 0.034, -d.shin, 0.042, 0.044, 0.01, high ? look.boots : look.legs, { capBottom: true });
    b.at(0, -d.shin - d.sole / 2, 0.02, h => h.box(0.06, d.sole, 0.13, look.boots));
  }

  function buildWeapon(b, kind, look) {
    if (kind === 'rifle') {
      b.box(0.03, 0.05, 0.62, 0x2a2e3a);
      b.at(0, 0.02, 0.2, h => h.box(0.02, 0.02, 0.4, 0x2f4e9a));
      b.at(0, -0.06, -0.08, h => h.box(0.025, 0.1, 0.035, 0x1e1f26));
    } else if (kind === 'bow') {
      tube(b, [[0, 0.45, 0.05], [0, 0.22, 0.12], [0, 0, 0.14], [0, -0.22, 0.12], [0, -0.45, 0.05]], [0.012, 0.016, 0.02, 0.016, 0.012], 5, look.trim || 0x2f8e9c);
      b.quad([0, 0.45, 0.05], [0.003, 0.45, 0.05], [0.003, -0.45, 0.05], [0, -0.45, 0.05], [1, 1, 1, 1]);
    } else if (kind === 'spear') {
      b.at(0, -0.4, 0, h => h.prism(6, 0.014, 0.014, 0, 0.014, 0.014, 1.6, 0x5a4a3a));
      b.at(0, 1.2, 0, h => h.prism(4, 0.035, 0.012, 0, 0.002, 0.002, 0.2, 0xd8dce4));
    } else if (kind === 'staff') {
      b.at(0, -0.3, 0, h => h.prism(6, 0.014, 0.014, 0, 0.014, 0.014, 1.0, 0xe8e0d6));
      b.at(0, 0.72, 0, h => h.ellipsoid(0.05, 0.05, 0.05, 6, 4, [0.95, 0.5, 0.7, 0.8]));
    } else if (kind === 'fan') {
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + i * 0.3;
        b.tri([0, 0, 0], [S(a) * 0.16, C(a) * 0.16, 0], [S(a + 0.3) * 0.16, C(a + 0.3) * 0.16, 0], i % 2 ? 0xb8262e : 0xf2e6da);
      }
    } else if (kind === 'scythe') {
      b.at(0, -0.5, 0, h => h.prism(6, 0.02, 0.02, 0, 0.02, 0.02, 1.4, 0x3a3a44));
      b.at(0, 0.85, 0.1, h => { h.push(M4.rotX(0.4)); h.box(0.04, 0.12, 0.6, 0xc8262a); h.pop(); });
    } else if (kind === 'bat') {
      b.at(0, -0.1, 0, h => h.prism(6, 0.02, 0.02, 0, 0.04, 0.04, 0.7, 0x9a7a52));
    }
  }

  class Anime {
    constructor(r, key) {
      const look = LOOKS[key];
      this.key = key;
      this.look = look;
      this.r = r;
      this.d = look.male ? MALE : DIM;
      const d = this.d;
      const mk = (fn) => mesh(r, b => fn(b, look, d));
      this.parts = {
        hips: mk(buildHips),
        skirt: (look.skirtLen || look.coat || look.flowers || look.tail) ? mk(buildSkirt) : null,
        torso: mk(buildTorso),
        head: mesh(r, b => buildHeadMesh(b, look)),
        hair: mesh(r, b => buildHair(b, look)),
        face: mesh(r, b => spherePatch(b, HEAD * 1.008, HEAD * 1.02 * 1.008, HEAD * 0.95 * 1.008, -0.98, 0.98, -0.8, 0.45, 10, 8, [1, 1, 1, 0.3], [1, 1])),
        upper: mk(buildUpper),
        fore: mk(buildFore),
        thigh: mk(buildThigh),
        shin: mk(buildShin),
        hands: {},
        weapon: look.weapon ? mesh(r, b => buildWeapon(b, look.weapon, look)) : null,
        halo: look.halo ? mesh(r, b => K.tube(b, Array.from({ length: 13 }, (_, i) => [C((i / 12) * PI * 2) * 0.1, 0, S((i / 12) * PI * 2) * 0.1]), Array(13).fill(0.008), 4, [0.95, 0.82, 0.4, 0.9])) : null
      };
      ['open', 'point', 'fist', 'peace'].forEach(p => { this.parts.hands[p] = mesh(r, b => buildHand(b, look, p)); });
      this.faces = {};
      EXPRESSIONS.forEach(e => { this.faces[e] = r.texture(128, faceDrawer(look, e), { clamp: true }); });
      this.solver = { d, scale: look.scale || 1 };
    }

    solve(pose) {
      this.pose = pose;
      this.m = Figure.prototype.solve.call(this.solver, pose);
      return this.m;
    }

    draw(opts) {
      const r = this.r;
      const m = this.m;
      const P = this.parts;
      const pose = this.pose;
      const o = opts || {};
      const pass = o.flat ? { flat: o.flat, blend: o.flat[3] < 1 } : o.tint ? { tint: o.tint } : {};
      r.draw(P.hips, m.hips, pass);
      if (P.skirt) r.draw(P.skirt, m.hips, pass);
      r.draw(P.torso, m.torso, pass);
      ['L', 'R'].forEach(s => {
        r.draw(P.upper, m['upper' + s], pass);
        r.draw(P.fore, m['fore' + s], pass);
        const hand = (s === 'L' ? pose.handL : pose.handR) || 'open';
        r.draw(P.hands[hand], M4.chain(m['fore' + s], M4.translate(0, -this.d.fore - 0.035, 0), M4.rotY(s === 'L' ? -(pose.wristL || 0) : (pose.wristR || 0)), M4.rotX(pose['wristPitch' + s] || 0), M4.rotZ(pose['wristRoll' + s] || 0)), pass);
        if (!o.noLegs) {
          r.draw(P.thigh, m['thigh' + s], pass);
          r.draw(P.shin, m['shin' + s], pass);
        }
      });
      const head = o.headScale ? M4.chain(m.head, M4.translate(0, -0.02 + HEAD * (o.headScale - 1), 0), M4.scale(o.headScale)) : M4.mul(m.head, M4.translate(0, -0.02, 0));
      r.draw(P.head, head, pass);
      r.draw(P.hair, head, pass);
      if (!o.flat) r.draw(P.face, head, { texture: this.faces[pose.face || 'calm'], tint: pass.tint });
      if (P.halo) r.draw(P.halo, M4.chain(head, M4.translate(0, HEAD * 1.35, -0.02), M4.rotX(-0.25)), { noFog: true });
      if (P.weapon && pose.weapon !== false) {
        const side = pose.weaponSide || 'R';
        r.draw(P.weapon, M4.chain(m['fore' + side], M4.translate(0, -this.d.fore - 0.05, 0.02), M4.rotX(pose.weaponPitch === undefined ? -PI / 2 : pose.weaponPitch)), pass);
      }
    }

    headPoint() {
      return M4.point(this.m.head, [0, 0, 0]);
    }
  }

  function basePose(x, z, ry) {
    const p = restPose();
    p.x = x || 0;
    p.z = z || 0;
    p.ry = ry || 0;
    p.shL = [0.06, 0, 0.12];
    p.shR = [0.06, 0, 0.12];
    p.elL = [0.25, 0, 0];
    p.elR = [0.25, 0, 0];
    p.face = 'calm';
    return p;
  }

  const GESTURES = {
    rest: (p) => p,
    pointUp: (p, k) => {
      p.shR = [0.95 + 0.04 * k, 0.45, 0.55];
      p.elR = [1.95, 0, 0];
      p.handR = 'point';
      p.wristR = -0.3;
      return p;
    },
    palmsUp: (p, k) => {
      p.shL = [0.4, 0.6, 0.4 + 0.05 * k];
      p.shR = [0.45, 0.5, 0.4 + 0.05 * k];
      p.elL = [2.05, 0, 0];
      p.elR = [2.15, 0, 0];
      p.wristL = -0.49;
      p.wristR = -0.59;
      return p;
    },
    holdChest: (p) => {
      p.shL = [0.45, -0.35, 0.1];
      p.shR = [0.45, -0.35, 0.1];
      p.elL = [1.75, 0, 0];
      p.elR = [1.75, 0, 0];
      p.handL = 'fist';
      p.handR = 'fist';
      return p;
    },
    handsHigh: (p, k) => {
      p.shL = [1.0, 1.25, 0.05];
      p.shR = [0.85, 1.1, 0.1];
      p.elL = [1.8 + 0.05 * k, 0, 0];
      p.elR = [2.15 + 0.05 * k, 0, 0];
      p.wristL = 1.86;
      p.wristR = 1.96;
      return p;
    },
    pointUpNear: (p, k) => {
      p.shR = [0.25, 0, 0.5];
      p.elR = [2.0 + 0.04 * k, 0, 0];
      p.handR = 'point';
      p.wristR = -3.1;
      p.wristPitchR = 0.9;
      p.wristRollR = 0.5;
      p.shL = [0.2, 0, 0.55];
      p.elL = [1.9, 0, 0];
      p.handL = 'fist';
      return p;
    },
    pointLeft: (p) => {
      p.shR = [1.3, -0.2, 0.75];
      p.elR = [0.3, 0, 0];
      p.handR = 'point';
      return p;
    },
    raiseSide: (p, k) => {
      p.shL = [0.95, 1.2, 0.2];
      p.elL = [1.85 + 0.05 * S(k * PI * 3), 0, 0];
      p.wristL = 1.86;
      return p;
    },
    raiseSideR: (p, k) => {
      p.shR = [1.05, 1.2, 0.1];
      p.elR = [1.65 + 0.05 * S(k * PI * 3), 0, 0];
      p.wristR = 1.91;
      return p;
    },
    pointUpL: (p, k) => {
      p.shL = [1.25 + 0.05 * k, 0.1, 0.35];
      p.elL = [1.9, 0, 0];
      p.handL = 'point';
      return p;
    },
    shrug: (p, k) => {
      p.shL = [0.35, 0, 0.75 + 0.1 * k];
      p.shR = [0.35, 0, 0.75 + 0.1 * k];
      p.elL = [1.4, 0, 0];
      p.elR = [1.4, 0, 0];
      return p;
    },
    chest: (p) => {
      p.shR = [0.7, 0.2, 0.05];
      p.elR = [2.2, 0, 0];
      return p;
    },
    wave: (p, k) => {
      p.shR = [1.3, -0.1, 0.8];
      p.elR = [1.0 + 0.3 * S(k * PI * 6), 0, 0];
      return p;
    },
    pointSide: (p) => {
      p.shL = [1.35, 0, 0.5];
      p.elL = [0.25, 0, 0];
      p.handL = 'point';
      return p;
    },
    pointCam: (p) => {
      p.shR = [1.45, 0.1, 0.1];
      p.elR = [0.35, 0, 0];
      p.handR = 'point';
      return p;
    },
    thinking: (p) => {
      p.shR = [0.9, 0.3, 0.1];
      p.elR = [2.4, 0, 0];
      p.handR = 'fist';
      p.shL = [0.5, 0.3, 0.05];
      p.elL = [1.6, 0, 0];
      return p;
    },
    peace: (p) => {
      p.shR = [1.3, 0.2, 0.3];
      p.elR = [2.0, 0, 0];
      p.handR = 'peace';
      return p;
    },
    armsUp: (p, k) => {
      p.shL = [2.3 + 0.1 * S(k * 3), 0, 0.75];
      p.shR = [2.3 + 0.1 * S(k * 3), 0, 0.75];
      p.elL = [0.4, 0, 0];
      p.elR = [0.4, 0, 0];
      return p;
    },
    facepalm: (p) => {
      p.shR = [1.2, 0.35, 0.1];
      p.elR = [2.45, 0, 0];
      p.neck = [0.35, 0, 0];
      return p;
    },
    aim: (p) => {
      p.shR = [1.5, 0.15, 0.05];
      p.elR = [0.25, 0, 0];
      p.shL = [1.45, -0.35, 0.05];
      p.elL = [0.7, 0, 0];
      p.weaponPitch = 0;
      return p;
    },
    bow: (p) => {
      p.shL = [1.5, 0, 0.45];
      p.elL = [0.1, 0, 0];
      p.shR = [1.5, 0.2, 0.2];
      p.elR = [2.1, 0, 0];
      p.weaponSide = 'L';
      p.weaponPitch = 0;
      return p;
    },
    cast: (p, k) => {
      p.shR = [2.1 + 0.2 * k, 0, 0.4];
      p.elR = [0.3, 0, 0];
      p.shL = [0.6, 0, 0.6];
      p.elL = [0.8, 0, 0];
      return p;
    },
    pointUpHip: (p, k) => {
      p.shR = [0.3, 0.9, 0.2];
      p.elR = [2.3 + 0.04 * k, 0, 0];
      p.handR = 'point';
      p.wristR = 2.11;
      p.shL = [0.2, 0, 0.55];
      p.elL = [1.9, 0, 0];
      p.handL = 'fist';
      return p;
    },
    hands: (p) => {
      p.shL = [0.55, -0.35, 0.05];
      p.shR = [0.55, -0.35, 0.05];
      p.elL = [1.0, 0, 0];
      p.elR = [1.0, 0, 0];
      return p;
    },
    present: (p, k) => {
      p.shR = [1.9 + 0.1 * k, 0, 0.7];
      p.elR = [1.3, 0, 0];
      p.shL = [0.2, 0, 0.55];
      p.elL = [1.9, 0, 0];
      p.handL = 'fist';
      return p;
    },
    waveL: (p, k) => {
      p.shL = [2.2, 0, 0.7];
      p.elL = [0.9 + 0.3 * S(k * PI * 4), 0, 0];
      return p;
    },
    waveR: (p, k) => {
      p.shR = [2.2, 0, 0.7];
      p.elR = [0.9 + 0.3 * S(k * PI * 4), 0, 0];
      return p;
    },
    steeple: (p) => {
      p.shL = [0.75, -0.45, 0.05];
      p.shR = [0.75, -0.45, 0.05];
      p.elL = [1.55, 0, 0];
      p.elR = [1.55, 0, 0];
      return p;
    },
    shh: (p) => {
      p.shR = [0.95, -0.55, 0.05];
      p.elR = [2.55, 0, 0];
      p.handR = 'point';
      return p;
    },
    ok: (p) => {
      p.shR = [1.0, -0.3, 0.2];
      p.elR = [1.9, 0, 0];
      p.handR = 'fist';
      return p;
    },
    palmUp: (p) => {
      p.shR = [0.9, 0.3, 0.45];
      p.elR = [1.5, 0, 0];
      p.shL = [0.2, 0, 0.55];
      p.elL = [1.9, 0, 0];
      p.handL = 'fist';
      return p;
    },
    tpose: (p) => {
      p.shL = [0, 0, 1.55];
      p.shR = [0, 0, 1.55];
      p.elL = [0, 0, 0];
      p.elR = [0, 0, 0];
      return p;
    },
    blush: (p) => {
      p.shR = [0.9, -0.5, 0.05];
      p.elR = [2.5, 0, 0];
      p.handR = 'fist';
      return p;
    },
    staff: (p) => {
      p.shR = [0.45, 0, 0.55];
      p.elR = [1.3, 0, 0];
      p.handR = 'fist';
      p.shL = [0.6, 0.3, 0.1];
      p.elL = [1.2, 0, 0];
      return p;
    },
    staffUp: (p) => {
      p.shL = [2.8, 0, 0.3];
      p.shR = [2.8, 0, 0.3];
      p.elL = [0.3, 0, 0];
      p.elR = [0.3, 0, 0];
      return p;
    },
    slump: (p) => {
      p.spine = [0.45, 0, 0];
      p.neck = [0.55, 0, 0];
      p.shL = [0.4, 0, 0.1];
      p.shR = [0.4, 0, 0.1];
      p.elL = [0.6, 0, 0];
      p.elR = [0.6, 0, 0];
      return p;
    },
    guard: (p) => {
      p.shR = [0.4, 0, 0.2];
      p.elR = [1.2, 0, 0];
      p.weaponPitch = -0.2;
      return p;
    }
  };

  function gesture(p, name, k) {
    const fn = GESTURES[name] || GESTURES.rest;
    return fn(p, k || 0);
  }

  window.HayatoCast = { LOOKS, DIM, MALE, HEAD, Anime, basePose, gesture, GESTURES, EXPRESSIONS, faceDrawer };
})();
