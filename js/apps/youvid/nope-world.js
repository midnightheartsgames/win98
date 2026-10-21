(function () {
  const { M4, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;

  const COL = {
    sky: 0xfef2a8,
    eaves: 0x4a3726,
    plaster: 0x94877c,
    plasterShade: 0x5c4e43,
    cornerSun: 0xbf9768,
    cornerMid: 0x8a6544,
    metalTop: 0x655a60,
    metalDark: 0x4b4348,
    doorDark: 0x282425,
    woodWarm: 0x7c5c40,
    woodDark: 0x4c3a2c,
    sand: 0xb4864f,
    sandBright: 0xc29257,
    sandShadow: 0x3b3b39
  };

  const BG_GRID = [
    'fff0a7fff4aafff7acfff1a8ffeea6ffeca3fff2a9fef9b1fef9b2fef2acd0bb9074666865595f514b516d616561565270636672646b75676e6d626a70646c75676e75666e76686f74666d6c6168675f66655e65655e65655e655b555d574e52',
    'ffefa6fff4aafff7adffefa6fff1a7fff1a7fff4abfef7affff5acffeba5cfb789685b5e5c51564b454b5e54584f463f5c5253655a60655a605e555d61585f665b61665b61665b62655a60655a605f565d5a535a5c555c5b545b504d554d474e',
    'ad9566b7a370c4b27ccebb81d8c98ce1d494e9dc9aefe09df4de9cf9db9acdaf84665a5b5f54584a43495d535651483e574d4a665a60665a605f555d645b61706466695e61685c6064585e65595f64595f63585e61565d60565c5750574e464c',
    '4836274b38284f3b29533f2b59442f5f4b326550376a553a705a3f82694db699756457565b50524842455a5050544a3e564c4664585d63575d5b5259565259776d66665f60766d6b685d5f65595f65595f61565c61565c64585e5a5158534a50',
    '4334264736284836274836264a38264b37264a37264c38274e3a2b534236a78d6c6a5a4d4b403c3f393a5047434d44394b43394f45423f373b3d383f3532393c35364e48496058566056565f54585a5055544b50554b4e52494b4d45484a4144',
    '48392b4b3a2c4c3a2b4b392a4b392a4b38294c3929513d2d54413457473d9982659479595d4d413f393a4c44415950485b51484a413c342f33393840393840373439444042554e4c4c4441443d3d4a3f3d5545405f4b4359463e4e413c4c3f3d',
    '5d4a3e5d4e425d4e4159493d544438503f334f3e3254423458463b594a40836f59bf976886614343393648403f4f4a4a4f4b4d453e3d353035302c322c292d2d2b2f3b3b414541443c36383a34363b343542383857443e674c4055423b5d473f',
    '79695d7f7165796c607164596a5c525f51475a4b405c4c405e4d435d4e446f5e4fc39c6d8d623f42332c6b533f57483a4a3e34564739403731292425322b262f28262a2627403834423a383b35373933353a333543393858443a4d3c36534039',
    '95897e95887c8d8075877a707f726871655c64584e5c4f46594c43554942584b42b490658e633f3f2f257b5b3f8063476d563d66513b3c3128362d28634e3a5b473531292639312c433a383b34363a3436413a3b493f3d56453d4c3e3952443d',
    'a1958a9e9187988b8092867c897f76796f67665c55564b454f443f493f394c3f37886d4e694f364a382960493467513b5b4937524234372d26312a273c332c382f2a2c26252924242d2a2c2e2b2f2d2b2f3330323733343935353733343b3738',
    '96847194816e8f7c698876637f6e5c7261506957476b5643725b42745b407b6043816545765c40725a40725c42755e44765e447b6347715c45574a3d3f3b3834333330302e2f2e2d2f2f30323234333435353637363738383839383738373637',
    '99744b977249a07a4e9a7449926e449a7346916d447a5d3e6650395e4c3b55483b494037413d37403d393e3c393d3c383c3a36423f3a45433e42413e3e403f3e403f3f403e3e3f3e3d3e3d3c3d3d3f4141414342424342424443424342424242',
    '9a72449971439972449f7748a47b4ab2854fbe8e55b98b54aa804f916f49705a4352473c433f393e3c383b3a383a3a39393a383a3a383a3a38373939383a3a393b3b3b3d3c3d3f3f3c3e3e3b3d3d3d3d3c3b3b383c3b373f3d393e3e3940403b',
    'a97e4ba27948af844fb18550b18550bd8e55bf9056c09157c49358bc8d54b185519b764c7d6345685440584b3d4a423a413d383d39363937343736343736353635343636353938373b39363f3b36423c3649413853493e584d40594e405d5142',
    'a87d4bae824eb38650b3864fb3864eb88a52b88a52b48750b58750b68951b68951b58851b28651ac814fa37a4b9773488a6a457f6344775e436d5942615140594c3e564b3e57493b5a4a395f4d3a604d38654f396f573e7c62448469498d6f4b',
    'a97b47a67946aa7d49ad7f4ab1834db3864fb5874eae7f48a57641a0723fa37542a87a46ab7d48ac7d48ab7c45ab7c45ac7d47ac7e48ae814cab804e9b76498e6c448566428365418364408364407b5e3c7557377457357c5d3a8a68429b774d',
    'a376438c6438956c3ea67945af814cb1834db3854eb88a51b2834da77945a57744a27442a27441a77843aa7c47ae804bb6874eb8884fb98951b58751ad8351a47c4c9671458d69408b684088663e85643e7e603b7c5e3a7a5b38805f3b8f6c45',
    '946b3c946a3b966c3ba47744af814cad7f49b0814bb6864fb4854eae814cae804bb1824cb3844db88850b98951b6874eb6874db8894fb68850b78a53ba8d56b18652a0794a997347947045936f46916d4588684182643e7f613c7b5d397b5c39'
  ];

  const DECODED = (() => {
    const GW = 32, GH = 18;
    const out = new Uint8Array(GW * GH * 3);
    for (let y = 0; y < GH; y++) {
      const s = BG_GRID[y];
      for (let x = 0; x < GW; x++) {
        const idx = (y * GW + x) * 3;
        const p = x * 6;
        out[idx] = parseInt(s.slice(p, p + 2), 16);
        out[idx + 1] = parseInt(s.slice(p + 2, p + 4), 16);
        out[idx + 2] = parseInt(s.slice(p + 4, p + 6), 16);
      }
    }
    return { GW, GH, data: out };
  })();

  function sampleGrid(u, v) {
    const { GW, GH, data } = DECODED;
    const gx = clamp(u * (GW - 1), 0, GW - 1.001);
    const gy = clamp(v * (GH - 1), 0, GH - 1.001);
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = gx - x0, fy = gy - y0;
    const x1 = Math.min(GW - 1, x0 + 1), y1 = Math.min(GH - 1, y0 + 1);
    const i00 = (y0 * GW + x0) * 3, i10 = (y0 * GW + x1) * 3;
    const i01 = (y1 * GW + x0) * 3, i11 = (y1 * GW + x1) * 3;
    const c = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const top = lerp(data[i00 + k], data[i10 + k], fx);
      const bot = lerp(data[i01 + k], data[i11 + k], fx);
      c[k] = Math.round(lerp(top, bot, fy));
    }
    return c;
  }

  function texCourtyard(ctx, w, h) {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const g = rand(73);
    for (let y = 0; y < h; y++) {
      const v = y / h;
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const c = sampleGrid(u, v);
        let dr = 0, dg = 0, db = 0;
        if (u > 0.35 && v < 0.25) {
          const rib = S(u * w * 0.45) * 4;
          dr += rib; dg += rib; db += rib;
        }
        if (v > 0.58) {
          const n = (g() - 0.5) * 8;
          dr += n; dg += n * 0.85; db += n * 0.65;
        } else if (u < 0.35 && v > 0.14) {
          const n = (g() - 0.5) * 5;
          dr += n; dg += n; db += n;
        }
        const i = (y * w + x) * 4;
        d[i] = clamp(Math.round(c[0] + dr), 0, 255);
        d[i + 1] = clamp(Math.round(c[1] + dg), 0, 255);
        d[i + 2] = clamp(Math.round(c[2] + db), 0, 255);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    ctx.save();
    ctx.strokeStyle = 'rgba(58, 42, 26, 0.45)';
    ctx.lineWidth = Math.max(2, h * 0.011);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.115);
    ctx.lineTo(w * 0.335, h * 0.165);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(218, 182, 132, 0.26)';
    ctx.lineWidth = Math.max(2, w * 0.005);
    ctx.beginPath();
    ctx.moveTo(w * 0.335, 0);
    ctx.lineTo(w * 0.335, h * 0.58);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(32, 26, 24, 0.42)';
    ctx.lineWidth = Math.max(2, h * 0.01);
    ctx.beginPath();
    ctx.moveTo(w * 0.56, h * 0.24);
    ctx.lineTo(w * 0.96, h * 0.27);
    ctx.stroke();
    ctx.restore();
  }

  function slab(b, x0, y0, z0, x1, y1, z1, col) {
    b.at((x0 + x1) / 2, y0, (z0 + z1) / 2, h => h.box(x1 - x0, y1 - y0, z1 - z0, col, { base: true }));
  }

  function buildStructures(b) {
    slab(b, -8.8, 0.0, -9.6, -2.25, 3.2, -8.2, COL.plaster);
    slab(b, -8.8, 3.05, -9.5, -2.15, 3.55, -8.0, COL.eaves);
    slab(b, -2.35, 0.0, -9.4, -1.85, 3.6, -8.1, COL.cornerSun);
    slab(b, -1.85, 2.7, -9.8, 8.8, 5.4, -8.4, COL.metalTop);
    slab(b, -1.85, 0.0, -9.6, 0.65, 2.75, -8.4, COL.woodWarm);
    slab(b, 0.65, 0.0, -10.2, 6.8, 2.75, -9.0, COL.doorDark);
    slab(b, 1.15, 0.0, -9.3, 1.65, 2.45, -8.65, COL.woodWarm);
    slab(b, 5.15, 0.0, -9.2, 8.6, 2.8, -8.35, COL.woodDark);
  }

  function build(r) {
    const T = {
      courtyard: r.texture(512, texCourtyard, { height: 256, clamp: true })
    };

    const halfH = 4.06896;
    const halfW = 7.23371;
    const yc = 1.42;
    const zBack = -7.8;
    const backdrop = mesh(r, b => {
      const n = [0, 0, 1];
      b.quad(
        [-halfW, yc - halfH, zBack],
        [halfW, yc - halfH, zBack],
        [halfW, yc + halfH, zBack],
        [-halfW, yc + halfH, zBack],
        [1, 1, 1, 1],
        [[0, 0], [1, 0], [1, 1], [0, 1]],
        [n, n, n, n]
      );
    });

    const structures = mesh(r, buildStructures);

    const shadowBlob = mesh(r, b => {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri([0, 0, 0], [C(a1), 0, S(a1)], [C(a0), 0, S(a0)], [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      }
    });

    return { T, backdrop, structures, shadowBlob };
  }

  function draw(r, W) {
    r.draw(W.structures);
    r.draw(W.backdrop, null, { texture: W.T.courtyard, noFog: true });
  }

  window.NopeWorld = { COL, sampleGrid, build, draw };
})();
