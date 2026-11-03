const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SCRIPTS = ['js/apps/poligon/p3d.js', 'js/apps/poligon/figure.js', 'js/apps/youvid/kit.js', 'js/apps/youvid/zoo.js', 'js/apps/youvid/rig.js', 'js/apps/youvid/vlad-cast.js', 'js/apps/youvid/vlad-room.js', 'js/apps/youvid/vlad-motion.js', 'js/apps/youvid/vlad-script.js', 'js/apps/youvid/vlad.js', 'js/apps/youvid/nice-cast.js', 'js/apps/youvid/nice-room.js', 'js/apps/youvid/nice-overlay.js', 'js/apps/youvid/nice-motion.js', 'js/apps/youvid/nice.js', 'js/apps/youvid/slay-street.js', 'js/apps/youvid/slay-cast.js', 'js/apps/youvid/slay-motion.js', 'js/apps/youvid/slay-script.js', 'js/apps/youvid/slay.js', 'js/apps/youvid/linging-yard.js', 'js/apps/youvid/linging-cast.js', 'js/apps/youvid/linging-script.js', 'js/apps/youvid/linging.js', 'js/apps/youvid/konosuba-world.js', 'js/apps/youvid/konosuba-critters.js', 'js/apps/youvid/konosuba-cast.js', 'js/apps/youvid/konosuba-script.js', 'js/apps/youvid/konosuba.js', 'js/apps/youvid/otpusk-world.js', 'js/apps/youvid/otpusk-cast.js', 'js/apps/youvid/otpusk-beats.js', 'js/apps/youvid/otpusk-voice.js', 'js/apps/youvid/otpusk-motion.js', 'js/apps/youvid/otpusk-script.js', 'js/apps/youvid/otpusk.js', 'js/apps/youvid/pamparam-world.js', 'js/apps/youvid/pamparam-cast.js', 'js/apps/youvid/pamparam-script.js', 'js/apps/youvid/pamparam.js', 'js/apps/youvid/roman-world.js', 'js/apps/youvid/roman-cast.js', 'js/apps/youvid/roman-script.js', 'js/apps/youvid/roman.js', 'js/apps/youvid/sparkle-world.js', 'js/apps/youvid/sparkle-cast.js', 'js/apps/youvid/sparkle-script.js', 'js/apps/youvid/sparkle.js', 'js/apps/youvid/stray-set.js', 'js/apps/youvid/stray-script.js', 'js/apps/youvid/stray.js', 'js/apps/youvid/osudil-script.js', 'js/apps/youvid/osudil.js', 'js/apps/youvid/trek-script.js', 'js/apps/youvid/trek.js', 'js/apps/youvid/podskochil-script.js', 'js/apps/youvid/podskochil.js', 'js/apps/youvid/ultra-script.js', 'js/apps/youvid/ultra.js', 'js/apps/youvid/klee-faces.js', 'js/apps/youvid/klee-textures.js', 'js/apps/youvid/klee-cast.js', 'js/apps/youvid/klee-foes.js', 'js/apps/youvid/klee-world.js', 'js/apps/youvid/klee-cards.js', 'js/apps/youvid/klee-script.js', 'js/apps/youvid/klee.js', 'js/apps/youvid/nope-world.js', 'js/apps/youvid/nope-cast.js', 'js/apps/youvid/nope-script.js', 'js/apps/youvid/nope.js', 'js/apps/youvid/keanu-art.js', 'js/apps/youvid/keanu-script.js', 'js/apps/youvid/keanu.js', 'js/apps/youvid/siega-room.js', 'js/apps/youvid/siega-cast.js', 'js/apps/youvid/siega-track.js', 'js/apps/youvid/siega-motion.js', 'js/apps/youvid/siega-screens.js', 'js/apps/youvid/siega-script.js', 'js/apps/youvid/siega.js', 'js/apps/youvid/ozon-art.js', 'js/apps/youvid/ozon-world.js', 'js/apps/youvid/ozon-cast.js', 'js/apps/youvid/ozon-overlay.js', 'js/apps/youvid/ozon-script.js', 'js/apps/youvid/ozon.js', 'js/apps/youvid/yegud-cast.js', 'js/apps/youvid/yegud-office.js', 'js/apps/youvid/yegud-script.js', 'js/apps/youvid/yegud.js', 'js/apps/youvid/kafka-art.js', 'js/apps/youvid/kafka-cast.js', 'js/apps/youvid/kafka-world.js', 'js/apps/youvid/kafka-fx.js', 'js/apps/youvid/kafka-shots.js', 'js/apps/youvid/kafka-act1.js', 'js/apps/youvid/kafka-act2.js', 'js/apps/youvid/kafka-act3.js', 'js/apps/youvid/kafka-script.js', 'js/apps/youvid/kafka.js', 'js/apps/youvid/kart-script.js', 'js/apps/youvid/kart-vlad.js', 'js/apps/youvid/kart-sets.js', 'js/apps/youvid/kart-anime.js', 'js/apps/youvid/kart.js', 'js/apps/youvid/hogw-set.js', 'js/apps/youvid/hogw-cast.js', 'js/apps/youvid/hogw-props.js', 'js/apps/youvid/hogw-track.js', 'js/apps/youvid/hogw-script.js', 'js/apps/youvid/hogw.js', 'js/apps/youvid/kalam-art.js', 'js/apps/youvid/kalam-cast.js', 'js/apps/youvid/kalam-sets.js', 'js/apps/youvid/kalam-script.js', 'js/apps/youvid/kalam.js', 'js/apps/youvid/fab-cast.js', 'js/apps/youvid/fab-art.js', 'js/apps/youvid/fab-pose.js', 'js/apps/youvid/fab-world.js', 'js/apps/youvid/fab-voice.js', 'js/apps/youvid/fab-script-1.js', 'js/apps/youvid/fab-script-2.js', 'js/apps/youvid/fab-script-3.js', 'js/apps/youvid/fab-script-4.js', 'js/apps/youvid/fab-script-5.js', 'js/apps/youvid/fab-script.js', 'js/apps/youvid/fab.js', 'js/apps/youvid/mth-fx.js', 'js/apps/youvid/mth-art.js', 'js/apps/youvid/mth-heavy.js', 'js/apps/youvid/mth-props.js', 'js/apps/youvid/mth-sets.js', 'js/apps/youvid/mth-voice.js', 'js/apps/youvid/mth-script.js', 'js/apps/youvid/mth.js', 'js/apps/youvid/grub-cast.js', 'js/apps/youvid/grub-world.js', 'js/apps/youvid/grub-ui.js', 'js/apps/youvid/grub-script.js', 'js/apps/youvid/grub.js', 'js/apps/youvid/mukbang-room.js', 'js/apps/youvid/mukbang-cast.js', 'js/apps/youvid/mukbang-motion.js', 'js/apps/youvid/mukbang-script.js', 'js/apps/youvid/mukbang.js', 'js/apps/youvid/buff-art.js', 'js/apps/youvid/buff-cast.js', 'js/apps/youvid/buff-hall.js', 'js/apps/youvid/buff-script.js', 'js/apps/youvid/buff.js', 'js/apps/youvid/sts-art.js', 'js/apps/youvid/sts-world.js', 'js/apps/youvid/sts-cast.js', 'js/apps/youvid/sts-track.js', 'js/apps/youvid/sts-script.js', 'js/apps/youvid/sts.js', 'js/apps/youvid/vaz-art.js', 'js/apps/youvid/vaz-diner.js', 'js/apps/youvid/vaz-cast.js', 'js/apps/youvid/vaz-script.js', 'js/apps/youvid/vaz.js', 'js/apps/youvid/konop-art.js', 'js/apps/youvid/konop-world.js', 'js/apps/youvid/konop-cast.js', 'js/apps/youvid/konop-foes.js', 'js/apps/youvid/konop-fx.js', 'js/apps/youvid/konop-shots.js', 'js/apps/youvid/konop-act1.js', 'js/apps/youvid/konop-act2.js', 'js/apps/youvid/konop-act3.js', 'js/apps/youvid/konop-script.js', 'js/apps/youvid/konop.js', 'js/apps/youvid/bb-art.js', 'js/apps/youvid/bb-faces.js', 'js/apps/youvid/bb-cast.js', 'js/apps/youvid/bb-sets.js', 'js/apps/youvid/bb-shots.js', 'js/apps/youvid/bb-script.js', 'js/apps/youvid/bb.js', 'js/apps/youvid/saira-art.js', 'js/apps/youvid/saira-props.js', 'js/apps/youvid/saira-hands.js', 'js/apps/youvid/saira-sets.js', 'js/apps/youvid/saira-track.js', 'js/apps/youvid/saira-script.js', 'js/apps/youvid/saira.js', 'js/apps/youvid/nag-fx.js', 'js/apps/youvid/nag-art.js', 'js/apps/youvid/nag-cast.js', 'js/apps/youvid/nag-world.js', 'js/apps/youvid/nag-shots.js', 'js/apps/youvid/nag-act1.js', 'js/apps/youvid/nag-act2.js', 'js/apps/youvid/nag-script.js', 'js/apps/youvid/nag.js', 'js/apps/youvid/stairs-art.js', 'js/apps/youvid/stairs-world.js', 'js/apps/youvid/stairs-cast.js', 'js/apps/youvid/stairs-motion.js', 'js/apps/youvid/stairs-script.js', 'js/apps/youvid/stairs.js', 'js/apps/youvid/parad-track.js', 'js/apps/youvid/parad-cam.js', 'js/apps/youvid/parad-art.js', 'js/apps/youvid/parad-world.js', 'js/apps/youvid/parad-cast.js', 'js/apps/youvid/parad-gun.js', 'js/apps/youvid/parad-script.js', 'js/apps/youvid/parad.js', 'js/apps/youvid/down-track.js', 'js/apps/youvid/down-cam.js', 'js/apps/youvid/down-art.js', 'js/apps/youvid/down-world.js', 'js/apps/youvid/down-cast.js', 'js/apps/youvid/down-gun.js', 'js/apps/youvid/down-script.js', 'js/apps/youvid/down.js', 'js/apps/youvid/mts-voice.js', 'js/apps/youvid/mts-art.js', 'js/apps/youvid/mts-soldier.js', 'js/apps/youvid/mts-props.js', 'js/apps/youvid/mts-sets.js', 'js/apps/youvid/mts-script.js', 'js/apps/youvid/mts.js', 'js/apps/youvid/mte-voice.js', 'js/apps/youvid/mte-engineer.js', 'js/apps/youvid/mte-art.js', 'js/apps/youvid/mte-props.js', 'js/apps/youvid/mte-sets.js', 'js/apps/youvid/mte-script.js', 'js/apps/youvid/mte.js', 'js/apps/youvid/msc-voice.js', 'js/apps/youvid/msc-scout.js', 'js/apps/youvid/msc-art.js', 'js/apps/youvid/msc-props.js', 'js/apps/youvid/msc-sets.js', 'js/apps/youvid/msc-shots.js', 'js/apps/youvid/msc-act.js', 'js/apps/youvid/msc-talk.js', 'js/apps/youvid/msc-script.js', 'js/apps/youvid/msc.js', 'js/apps/youvid/msn-voice.js', 'js/apps/youvid/msn-sniper.js', 'js/apps/youvid/msn-art.js', 'js/apps/youvid/msn-props.js', 'js/apps/youvid/msn-sets.js', 'js/apps/youvid/msn-shots.js', 'js/apps/youvid/msn-act1.js', 'js/apps/youvid/msn-act2.js', 'js/apps/youvid/msn-script.js', 'js/apps/youvid/msn.js', 'js/apps/youvid/mtd-voice.js', 'js/apps/youvid/mtd-demoman.js', 'js/apps/youvid/mtd-art.js', 'js/apps/youvid/mtd-props.js', 'js/apps/youvid/mtd-sets.js', 'js/apps/youvid/mtd-script.js', 'js/apps/youvid/mtd.js', 'js/apps/youvid/mtm-voice.js', 'js/apps/youvid/mtm-medic.js', 'js/apps/youvid/mtm-art.js', 'js/apps/youvid/mtm-props.js', 'js/apps/youvid/mtm-sets.js', 'js/apps/youvid/mtm-shots.js', 'js/apps/youvid/mtm-act1.js', 'js/apps/youvid/mtm-act2.js', 'js/apps/youvid/mtm-act3.js', 'js/apps/youvid/mtm-act4.js', 'js/apps/youvid/mtm-script.js', 'js/apps/youvid/mtm.js', 'js/apps/youvid/mpy-voice.js', 'js/apps/youvid/mpy-pyro.js', 'js/apps/youvid/mpy-heads.js', 'js/apps/youvid/mpy-baby.js', 'js/apps/youvid/mpy-art.js', 'js/apps/youvid/mpy-props.js', 'js/apps/youvid/mpy-sets.js', 'js/apps/youvid/mpy-shots.js', 'js/apps/youvid/mpy-real.js', 'js/apps/youvid/mpy-land.js', 'js/apps/youvid/mpy-script.js', 'js/apps/youvid/mpy.js', 'js/apps/youvid/msp-voice.js', 'js/apps/youvid/msp-spy.js', 'js/apps/youvid/msp-art.js', 'js/apps/youvid/msp-props.js', 'js/apps/youvid/msp-sets.js', 'js/apps/youvid/msp-shots.js', 'js/apps/youvid/msp-act1.js', 'js/apps/youvid/msp-act2.js', 'js/apps/youvid/msp-act3.js', 'js/apps/youvid/msp-act4.js', 'js/apps/youvid/msp-script.js', 'js/apps/youvid/msp.js'];
const SOURCES = {
  jNQXAC9IVRw: 'content/YouVid/Me at the zoo.mp4',
  i9AyI356ye4: 'content/video/\u0412\u043b\u0430\u0434 \u0421\u0430\u0432\u0435\u043b\u044c\u0435\u0432 \u043b\u043e\u0436\u0438\u0442\u0441\u044f \u0441\u043f\u0430\u0442\u044c.mp4',
  vEryN1ceGdN: 'content/video/verynicegoodnice.mp4',
  eXtr3meSlay: 'content/video/\u0422\u0435\u043f\u0435\u0440\u044c \u044f extremely slay, \u043c\u0435\u043d\u044c\u0448\u0435 \u0432\u043e\u043b\u043e\u0441.mp4',
  y0Ph0neL1ng: 'content/YouVid/yo phone linging.mp4',
  k0n0SuBa3Ed: 'content/YouVid/KONOSUBA 3 - Ending.mp4',
  Sav3lOtpusk: 'content/YouVid/\u0421\u0430\u0432\u0435\u043b\u044c\u0435\u0432 \u0431\u0435\u0440\u0435\u0442 \u043e\u0442\u043f\u0443\u0441\u043a \u0442\u043b\u0438 \u0442\u043e\u0442\u0430\u043b\u044c\u043d\u043e\u0435 \u043d\u0435\u0443\u0432\u0430\u0436\u0435\u043d\u0438\u0435.mp4',
  pAmPaRam98: 'content/YouVid/\u041f\u0430\u043c\u043f\u0430\u0440\u0430\u043c-\u043f\u0430\u043c\u043f\u0430\u0440\u0430\u043c,\u043f\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e \u0441\u043c\u043e\u0442\u0440\u044f\u0449\u0438\u0445.mp4',
  wAk3UpR0mAn: 'content/YouVid/WAKE UP ROMAN.mp4',
  sPaRkL3Mono: 'content/YouVid/Sparkle Trailer - Monodrama.mp4',
  Str3yHarmon1: 'content/YouVid/\u0421\u0442\u0440\u0435\u0439 \u041d\u0435 \u041e\u0446\u0435\u043d\u0438\u043b \u0413\u0443\u0431\u043d\u0443\u044e \u0413\u0430\u0440\u043c\u043e\u0448\u043a\u0443.mp4',
  Str3yOsud1l: 'content/YouVid/\u0421\u0442\u0440\u0435\u0439 \u041e\u0441\u0443\u0434\u0438\u043b \u041d\u0430\u043f\u043e\u043b\u043e\u0432\u0438\u043d\u0443.mp4',
  Str3yTr3k98: 'content/YouVid/\u0421\u0442\u0440\u0435\u0439 \u041f\u0435\u0440\u0435\u043f\u0443\u0442\u0430\u043b \u0422\u0440\u044d\u043a.mp4',
  Str3yP0dsk0: 'content/YouVid/\u0421\u0442\u0440\u0435\u0439 \u041f\u043e\u0434\u0441\u043a\u043e\u0447\u0438\u043b.mp4',
  Str3yUltr498: 'content/YouVid/\u0421\u0442\u0440\u0435\u0439 \u0423\u043b\u044c\u0442\u0440\u0430 \u0413\u0438\u043f\u0435\u0440 \u041e\u0441\u0443\u0436\u0434\u0430\u0435\u0442.mp4',
  kL33T4T4T4a: 'content/YouVid/klee.mp4',
  n0p3Av1Eng1: 'content/YouVid/nope.avi.mp4',
  k3An4uH0rnY: 'content/YouVid/Keanu Reeves is Extremely Horny.mp4',
  S1egaStrad4: 'content/YouVid/\u0416\u0438\u0437\u043d\u044c \u0438 \u0421\u0442\u0440\u0430\u0434\u0430\u043d\u0438\u044f \u0421\u0438\u0435\u0433\u0438.mp4',
  Kl4dbTvOz0n: 'content/YouVid/\u041a\u043b\u0430\u0434\u0431\u0438\u0449\u0435 \u0442\u0435\u043b\u0435\u0432\u0438\u0437\u043e\u0440\u043e\u0432 \u041e\u0437\u043e\u043d\u0430.mp4',
  YeGuDNa1s98: 'content/YouVid/YEGUDNAIS.mp4',
  K4fkaIr0ny9: "content/YouVid/Kafka's The Irony of Drama.mp4",
  VladK4rt1nk: 'content/YouVid/Влад Савельев картинки.mp4',
  H4rryG3rm4n: 'content/YouVid/Гарри Поттер, если бы его снимала Валерия Гай Германика в 3D.mp4',
  Ka1amBurg98: 'content/YouVid/каламбург.mp4',
  T3amFabu1s2: 'content/YouVid/Team Fabulous 2.mp4',
  M33tTh3H3vy: 'content/YouVid/Meet the Heavy.mp4',
  cAtsBG3r34L: "content/YouVid/Cats in Baldur's Gate 3 are too real.mp4",
  Str4nnInTr0: 'content/YouVid/Самое странное начало видео от Влада Савельева.mp4',
  n33dAbUfF98: 'content/YouVid/When you need a buff.mp4',
  Vl4dNaCTC98: 'content/YouVid/Влад Савельев на СТС, но он реально на СТС.mp4',
  Vaz3l1nD4dy: 'content/YouVid/я мажу жопу вазелином.mp4',
  k0n0SuBaOp1: 'content/YouVid/KONOSUBA - Opening.mp4',
  Br3akBadRmx: 'content/YouVid/Breaking Bad Remix (Seasons 3-5).mp4',
  S4iraSuP0sm: 'content/YouVid/Я приготовил суп из сайры Влада Савельева. Дичайшее хрючево..mp4',
  N4gat0r0Op1: "content/YouVid/DON'T TOY WITH ME, MISS NAGATORO Opening   EASY LOVE.mp4",
  St41rsD4nc3: 'content/YouVid/Stairs Dance Complete Scene.mp4',
  P4radB3dy98: 'content/YouVid/Парад беды - STALKER.mp4',
  D0wngr4d3Ed: 'content/YouVid/STALKER - Downgrade Edition Trailer.mp4',
  M33tTh3S0ld: 'content/YouVid/Meet the Soldier.mp4',
  M33tTh3Eng1: 'content/YouVid/Meet the Engineer.mp4',
  M33tTh3Sc0t: 'content/YouVid/Meet the Scout.mp4',
  M33tTh3Sp1y: 'content/YouVid/Meet the Spy.mp4',
  M33tTh3D3mo: 'content/YouVid/Meet the Demoman.mp4',
  M33tTh3Pyr0: 'content/YouVid/Meet the Pyro.mp4',
  M33tTh3Sn1p: 'content/YouVid/Meet the Sniper.mp4',
  M33tTh3M3d1: 'content/YouVid/Meet the Medic.mp4'
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

async function open(width, height) {
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yv-edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${width},${height}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let ws = null, target = null;
  const close = async () => {
    try {
      const info = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(info.webSocketDebuggerUrl);
      await new Promise(resolve => {
        bws.onopen = () => bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
        bws.onclose = resolve;
        bws.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    } catch {}
    try { if (ws) ws.close(); } catch {}
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
    server.kill();
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }, 500);
  };
  try {
    for (let i = 0; i < 80 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch {}
    }
    if (!target) throw new Error('Edge did not start');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  } catch (e) {
    await close();
    throw e;
  }
  let id = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  const base = `http://127.0.0.1:${sport}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/index.html`)).status === 200) break; } catch {}
    await sleep(250);
  }
  const navigate = async (url, ready) => {
    await send('Page.navigate', { url: base + url });
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try { if (await ev(ready)) return; } catch {}
    }
    throw new Error('page did not load: ' + url);
  };
  const capture = async (clip) => Buffer.from((await send('Page.captureScreenshot', Object.assign({ format: 'png' }, clip ? { clip: Object.assign({ scale: 1 }, clip) } : {}))).data, 'base64');
  return { ev, send, navigate, close, errors, capture, base };
}

const BENCH = `(async (scripts) => {
  document.body.style.margin = '0';
  document.body.style.background = '#000';
  for (const s of scripts) {
    await new Promise((resolve) => {
      const el = document.createElement('script');
      el.src = '/' + s + '?v=' + Date.now();
      el.onload = resolve;
      el.onerror = resolve;
      document.head.appendChild(el);
    });
  }
  window.yvBench = {
    scenes: {},
    frame(id, t, w, h) {
      const clip = window.youvidClips.find(c => c.id === id);
      const key = id + ':' + w + 'x' + h;
      if (!this.scenes[key]) {
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const r = new P3D.Renderer(cv);
        this.scenes[key] = { cv, scene: clip.create(r) };
      }
      const s = this.scenes[key];
      const info = s.scene.render(t);
      return { url: s.cv.toDataURL('image/png'), polys: info.polys };
    },
    still(spec) {
      const clip = window.youvidClips.find(c => c.id === spec.id);
      const key = spec.id + ':' + spec.w + 'x' + spec.h;
      if (!this.scenes[key]) {
        const cv = document.createElement('canvas');
        cv.width = spec.w;
        cv.height = spec.h;
        const r = new P3D.Renderer(cv);
        this.scenes[key] = { cv, scene: clip.create(r) };
      }
      const s = this.scenes[key];
      s.scene.render(spec.t);
      const c = spec.crop || [0, 0, 1, 1];
      const out = document.createElement('canvas');
      out.width = spec.size[0];
      out.height = spec.size[1];
      const ctx = out.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s.cv, c[0] * spec.w, c[1] * spec.h, c[2] * spec.w, c[3] * spec.h, 0, 0, out.width, out.height);
      if (spec.lasers) {
        ctx.fillStyle = 'rgba(200, 30, 40, 0.35)';
        ctx.fillRect(0, 0, out.width, out.height);
        spec.lasers.forEach(([x0, y0, x1, y1]) => {
          [[18, 'rgba(140,0,10,0.8)'], [8, 'rgba(255,70,70,0.95)'], [3, 'rgba(255,235,235,1)']].forEach(([lw, col]) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.shadowColor = 'rgba(255,40,40,0.9)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(x0 * out.width, y0 * out.height);
            ctx.lineTo(x1 * out.width, y1 * out.height);
            ctx.stroke();
          });
        });
      }
      return out.toDataURL('image/png');
    }
  };
  return window.youvidClips.map(c => c.id);
})`;

function ffmpegFrame(src, t, w, h, out) {
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', path.join(ROOT, src), '-frames:v', '1', '-vf', `scale=${w}:${h}`, out]);
}

function sideBySide(a, b, out) {
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', a, '-i', b, '-filter_complex', '[0:v][1:v]hstack=inputs=2', out]);
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const outDir = process.env.YV_OUT || path.join(os.tmpdir(), 'youvid-shots');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await open(1280, 900);
  try {
    if (mode === 'site') {
      await b.navigate('/index.html', 'typeof window.appIE === "object" && !!window.youvidSite');
      await sleep(12000);
      const script = rest[0] ? JSON.parse(fs.readFileSync(rest[0], 'utf8')) : [{ url: 'http://www.youvid.com', name: 'home' }];
      for (const step of script) {
        if (step.url) {
          await b.ev(`(() => { const old = document.querySelector('.ie-content-frame'); if (old && window.appIE.navigate) { const w = [...window.winManager.windows.values()].find(x => x.element && x.element.querySelector('.ie-content-frame')); if (w) { window.appIE.navigate(w, ${JSON.stringify(step.url)}); return 1; } } window.appIE.open(${JSON.stringify(step.url)}); const el = document.querySelector('.ie-content-frame').closest('.win-window'); if (el) { el.style.left = '0px'; el.style.top = '0px'; el.style.width = '1100px'; el.style.height = '860px'; } return 1; })()`);
        }
        if (step.js) console.log(step.name || 'js', JSON.stringify(await b.ev(step.js)));
        await sleep(step.wait || 2500);
        if (step.name && (!step.js || step.shot)) {
          const file = path.join(outDir, `site-${step.name}.png`);
          fs.writeFileSync(file, await b.capture());
          console.log(file);
        }
      }
      if (b.errors.length) console.log(`page errors: ${b.errors.join(' | ')}`);
      return;
    }
    await b.navigate('/tools/', 'document.readyState === "complete"');
    const ids = await b.ev(`${BENCH}(${JSON.stringify(SCRIPTS)})`);
    if (mode === 'frames' || mode === 'compare') {
      const [id, ...times] = rest;
      const clipId = ids.find(x => x === id);
      const w = +(process.env.YV_W || 480), h = +(process.env.YV_H || 360);
      for (const t of times.map(Number)) {
        const res = await b.ev(`yvBench.frame(${JSON.stringify(clipId)}, ${t}, ${w}, ${h})`);
        const file = path.join(outDir, `${id}-${t.toFixed(2)}.png`);
        fs.writeFileSync(file, Buffer.from(res.url.split(',')[1], 'base64'));
        if (mode === 'compare') {
          const src = path.join(outDir, `${id}-${t.toFixed(2)}-src.png`);
          const aspect = id === 'n33dAbUfF98' ? [Math.round(h * 9 / 16), h] : id === 'jNQXAC9IVRw' || id === 'VladK4rt1nk' || id === 'H4rryG3rm4n' || id === 'Ka1amBurg98' ? [w, h] : [w, Math.round(w * 9 / 16)];
          ffmpegFrame(SOURCES[id], t, aspect[0], aspect[1], src);
          const pad = path.join(outDir, `${id}-${t.toFixed(2)}-pad.png`);
          spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`, pad]);
          sideBySide(pad, file, path.join(outDir, `${id}-${t.toFixed(2)}-cmp.png`));
          fs.rmSync(src, { force: true });
          fs.rmSync(pad, { force: true });
        }
        console.log(file, res.polys);
      }
    } else if (mode === 'scan') {
      const [id, step] = rest;
      const w = +(process.env.YV_W || 480), h = +(process.env.YV_H || 270);
      const res = await b.ev(`(() => { const clip = window.youvidClips.find(c => c.id === ${JSON.stringify(id)}); const out = []; const cv = document.createElement('canvas'); cv.width = ${w}; cv.height = ${h}; const r = new P3D.Renderer(cv); const sc = clip.create(r); const t0 = performance.now(); sc.warm(); const warm = performance.now() - t0; let slow = 0, worst = 0, worstT = 0; for (let t = ${Number(process.env.YV_FROM || 0)}; t < Math.min(clip.duration, ${Number(process.env.YV_TO || 1e9)}); t += ${Number(step || 0.5)}) { const a = performance.now(); try { sc.render(t); } catch (e) { out.push(t.toFixed(2) + ': ' + (e && e.stack ? e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' | ') : e)); } const d = performance.now() - a; if (d > worst) { worst = d; worstT = t; } if (d > 50) slow++; } return { errors: out.slice(0, 40), count: out.length, warm: Math.round(warm), worst: Math.round(worst), worstT, slow }; })()`);
      console.log(JSON.stringify(res, null, 1));
    } else if (mode === 'stills') {
      const plan = JSON.parse(fs.readFileSync(rest[0] || path.join(__dirname, 'youvid-stills.json'), 'utf8'));
      for (const s of plan) {
        const url = await b.ev(`yvBench.still(${JSON.stringify(s)})`);
        const file = path.join(ROOT, s.out);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
        console.log(s.out);
      }
    }
    if (b.errors.length) console.log('page errors:\n' + b.errors.join('\n'));
  } finally {
    await b.close();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
