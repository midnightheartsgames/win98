(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const ID = 'sPaRkL3Mono';
  const DURATION = 124.92;
  const CUTS = [
    0, 3.33, 6.5, 10.67, 17.5, 23.53, 27.63, 33.77,
    38.2, 44.0, 50.0, 56.17, 58.0, 65.1, 72.27, 77.5,
    84.0, 89.0, 95.43, 103.0, 105.0, 118.9
  ];

  const VOICE = K.envelope('000000000000000000000000101111111111111111111222222222222222332333334454455556667979999aabbcddeefgihhijllllmnopqrsqtttvvwwyADFBCByDFAICyvuywxBNZDa4422u600005ZNIxlmBvpkhpnxyzsxuppjiianGmkd76sudabbadda9869b96755s87554Co86544uqpwpjkgba8gwEutme8vyp98abefgkhdfdagf7EZQJznkErfdcbnHGFwsomhece5tHmjd97vn8555mAusf43vc6dfckvumiebrg9655pHtse53qk988arxpolhhHncabasCyulgdkxgqmeIZIGlfaIGb998qGEBrqmozspmfwwkijjkKAkiooyBvsicawpa975vxb5549En87a5tCyzrlglddb9lyrookfgIvldacrxupjedxnbkhduse977fCj79c8qBywonkkebdbdxstlgfjCqb988DxqicdmCkbbbgAlb432fCa4aebotprpjnvtnhkgCnmjomwHqhggdlBzuuCSAEvzJwzwjedAschrrzzwnahngjxuABouBDvecnnurrrqogktqwnphdhghgoojfebjlswthlBlflfgozpmuuvpg8323yj21lruuionnofdqtltDZZZTFCBHCrmlixttsDEwqpACCJGAzzsAEwwqsxod9cwwugd433346221129gg9544cdcfdfgggeijijjkjkkswrqljluwnsDDBDxzxjpxvrebdnqjg86bifijglrqorqsqrxvpwxnuyrjouxBCnDDuFyyGxKLHRTOHFOEvxROZONEwmpmggdeiqmnBDEnolpqtxyxsnuprqljfdCSLRNNNKLIECyGRGxxrrBBDAwDFDtHFBrsqqnmmryyzGwxJqpnmkosBEvBExsAzyAwHJLDvquwoqvvwyrooojmupglyzywkvBBDJLJLJOXSUUPMMJICzzKPIwkijwIytvxDKOLIHzkmjwyABwynrIBrn7664xGBuopEBstBCDEqBpCpfpqAILLLHMIuxrswtstqqtuqnmllmjwuAPRSSLIAxMSFEKRHzzyFFBCACDEtrorrApmkruxDJDzDCrJLEAXXDZKuyDstBCWVIzKOLJHAKWMNFEKCwrttsELHQLuGQCCCryLICwwDuPLzeIKGJHzxthFECCnjvytjmjlnmmnwMBvvwvrpsriihhwxqotouyoedbaghgDAzzDBDCCAEtlAFxmmiuwjkrtqrklhd87878bbabceggfa998b9a867787767779aa69eJHBBzzj9adJEAyuphb899a9b9a978a878977c77ic8f9bb7f7f7g8j8hagtxyHCvvmCydgtyqcAArBytoAHQPzEHRvzCZZZYMIIyXZSDxGCLYZUBFDEOZXGHCCENZQyyByCTZNvxCKPWZVFETULZZPEyRWPZSFxAFCRZRKJJLPWZGtABBJZUCCAHKPZQuxCyGSZKwyABJVZFtCDEMZTBjcdcQZTHACAIZZLxAEGQYZGEIFDPZWCxDGFSZRCAFCJUZIwxzAJYVExBzBKZSCDyFCRZOFvyyDUZLBTRLKZWHGWTGLZZZOBVNVZSLFIHLWZQGEGELXYNGGIJvhheggijUZQEEDFQZYKvABEOZXGDHGERZOLFJNQVZSCEJAMXZKvzAzJZVAvzyBOZNHzyFFSZQGCILPXZIyDHLOZUDyBCESZPKCFKTVZOBBDCKXZIvDAAJZVEyDEESZSAroorXVLAExzBzBvvuspsomkqkmiomopvxsrwrjonhlrpyszEJIunyzCCECuCFBFGHEUYNIKIGFCFEGCAxzvxyujrsvyzxCAzxxxyzzzyyyBxzvxsCvDtDuAxBtyxAuwyxotgdifddbcca8987776876764554578654334iiaga6ca75544443334423322333366456676776776575566365433222222222bdaa86765564443445777gjjmsmfjjniinhlmmmoplnmjkjblleojjlifigedeeedddcbcaba8987766655544444345433323245645553433233565655434563333323334322223232222222222243322222465555544334433654343335543233222222223522132213322222232222215322222353222222322222255333344555454444444454544747a7667779aa345667a9555759975798bcb767fbtvfewyqlhfbdhpihebbPONFAvBMIcabBQotmgbANrNNncfMQLGCyyxsm100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 20);

  const SPEECH = [
    { t0: 3.6, t1: 6.4, text: 'Мир — это огромная сцена, где каждый носит маску...' },
    { t0: 6.7, t1: 10.4, text: 'Но скажи мне... какая из этих масок — твоё настоящее лицо?' },
    { t0: 11.2, t1: 16.8, text: 'Тихая ученица за последней партой? Какая скучная роль~' },
    { t0: 17.6, t1: 23.2, text: 'Стоит моргнуть — и правила игры уже переписаны!' },
    { t0: 24.0, t1: 27.4, text: 'Дамы и господа, внимание на сцену!' },
    { t0: 27.8, t1: 33.4, text: 'Сегодня в программе — театр одного Недотёпы в маске!' },
    { t0: 34.2, t1: 43.5, text: 'Кружись, золотая рыбка! Вверх, вниз — на ниточке кендамы~' },
    { t0: 44.5, t1: 55.6, text: 'Один выстрел, шесть масок... Угадаешь, где настоящая Искорка?' },
    { t0: 56.3, t1: 57.9, text: 'ИСКОРКА : «МОНОДРАМА»' },
    { t0: 58.3, t1: 64.8, text: 'Танцуйте! Смейтесь! Пока часы Пенаконии не пробили полночь!' },
    { t0: 65.4, t1: 72.0, text: 'Ты думал, что смотришь спектакль? Нет, ты уже на сцене!' },
    { t0: 72.5, t1: 83.8, text: 'Десять тысяч лиц, десять тысяч иллюзий — выбирай любую!' },
    { t0: 84.2, t1: 95.0, text: 'Безумие? Восторг? В Стране грёз нет разницы между правдой и ложью!' },
    { t0: 95.6, t1: 102.6, text: 'Аплодисменты! И... БАХ! Занавес опускается~!' },
    { t0: 106.0, t1: 113.5, text: 'Ну как, понравилось представление? Хи-хи~' },
    { t0: 114.0, t1: 118.4, text: 'Я и есть Радость! До новой встречи во сне~!' }
  ];

  const ENVS = {
    penacony: {
      exposure: 1.05,
      sunDir: [-0.35, -0.72, -0.58],
      sunColor: [0.68, 0.45, 0.85],
      ambTop: [0.58, 0.46, 0.88],
      ambBottom: [0.28, 0.18, 0.46],
      fogColor: [0.18, 0.12, 0.34],
      fogNear: 7,
      fogFar: 26
    },
    classroom: {
      exposure: 1.02,
      sunDir: [-0.52, -0.65, -0.55],
      sunColor: [0.56, 0.68, 0.96],
      ambTop: [0.52, 0.62, 0.92],
      ambBottom: [0.24, 0.28, 0.48],
      fogColor: [0.22, 0.26, 0.46],
      fogNear: 6,
      fogFar: 22
    },
    crimson: {
      exposure: 1.12,
      sunDir: [0.25, -0.76, -0.6],
      sunColor: [0.98, 0.42, 0.52],
      ambTop: [0.92, 0.26, 0.42],
      ambBottom: [0.42, 0.08, 0.18],
      fogColor: [0.38, 0.06, 0.16],
      fogNear: 6,
      fogFar: 24
    },
    noir: {
      exposure: 0.96,
      sunDir: [0.15, -0.82, -0.55],
      sunColor: [0.75, 0.75, 0.82],
      ambTop: [0.58, 0.58, 0.64],
      ambBottom: [0.22, 0.22, 0.26],
      fogColor: [0.18, 0.18, 0.22],
      fogNear: 5,
      fogFar: 20
    },
    kaleido: {
      exposure: 1.16,
      sunDir: [-0.28, -0.74, -0.6],
      sunColor: [0.95, 0.78, 0.92],
      ambTop: [0.72, 0.85, 0.98],
      ambBottom: [0.52, 0.24, 0.68],
      fogColor: [0.24, 0.32, 0.56],
      fogNear: 7,
      fogFar: 26
    },
    curtain: {
      exposure: 1.08,
      sunDir: [0.12, -0.78, -0.61],
      sunColor: [0.98, 0.78, 0.52],
      ambTop: [0.92, 0.68, 0.48],
      ambBottom: [0.46, 0.24, 0.18],
      fogColor: [0.38, 0.22, 0.16],
      fogNear: 6,
      fogFar: 24
    }
  };

  const STAND_LEGS = {
    fL: [0.11, -0.68, 0.02],
    kL: [0.13, -0.32, 0.18],
    fR: [-0.11, -0.68, 0.02],
    kR: [-0.13, -0.32, 0.18]
  };

  const DANCE_LEGS = (t) => {
    const sw = S(t * 4.2);
    const liftL = Math.max(0, sw) * 0.14;
    const liftR = Math.max(0, -sw) * 0.14;
    return {
      fL: [0.12 + sw * 0.05, -0.68 + liftL, 0.04 + sw * 0.08],
      kL: [0.15, -0.3 + liftL * 0.6, 0.22],
      fR: [-0.12 + sw * 0.05, -0.68 + liftR, 0.04 - sw * 0.08],
      kR: [-0.15, -0.3 + liftR * 0.6, 0.22]
    };
  };

  const SIT_LEGS = {
    fL: [0.12, -0.44, 0.28],
    kL: [0.14, -0.08, 0.38],
    fR: [-0.12, -0.44, 0.28],
    kR: [-0.14, -0.08, 0.38]
  };

  function speechAt(t) {
    const s = SPEECH.find(x => t >= x.t0 && t < x.t1);
    return s ? s.text : '';
  }

  function applyVoiceMouth(pose, v) {
    if (pose.mouth === 'smirk' || pose.mouth === 'laugh' || pose.mouth === 'o') return;
    if (v > 0.62) pose.mouth = 'wide';
    else if (v > 0.4) pose.mouth = 'open';
    else if (v > 0.2) pose.mouth = 'talk';
  }

  function stage(rawT) {
    const t = clamp(rawT, 0, DURATION);
    const v = VOICE(t);
    const speech = speechAt(t);

    if (t < 3.33) {
      const fade = t < 0.6 ? t / 0.6 : t > 2.7 ? clamp((3.3 - t) / 0.6, 0, 1) : 1;
      return {
        t,
        set: 'penacony',
        env: ENVS.penacony,
        fade: 0.15,
        banner: 'logoIntro',
        bannerAlpha: fade,
        camera: { eye: [0, 1.4, 2.6], at: [0, 1.3, 0], fov: 44 },
        voice: v,
        speech,
        cast: []
      };
    }

    if (t < 6.5) {
      const u = (t - 3.33) / (6.5 - 3.33);
      const pose = Object.assign({
        pos: [0, 0.9, 0],
        yaw: lerp(PI * 0.85, 0.15, ease(u)),
        lean: 0.03,
        roll: S(t * 2) * 0.03,
        sp: [0.04, S(t * 2.2) * 0.06, 0],
        nk: [0.02, -0.08, 0.04],
        hR: [-0.12, 0.18, 0.18],
        eR: [-0.28, 0.02, 0.06],
        hL: [0.16, -0.04, 0.08],
        eL: [0.3, 0.02, -0.06],
        outfit: 'kimono',
        mask: 'handR',
        prop: 'none',
        eyes: 'half',
        mouth: 'smirk'
      }, STAND_LEGS);
      return {
        t,
        set: 'penacony',
        env: ENVS.penacony,
        fade: clamp((t - 3.33) / 0.4, 0, 1),
        camera: {
          eye: [lerp(-0.45, 0.18, u), lerp(1.18, 1.26, u), lerp(2.1, 1.28, u)],
          at: [0, 1.18, 0],
          fov: 42
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 10.67) {
      const u = (t - 6.5) / (10.67 - 6.5);
      const flash = (t > 7.0 && t < 7.25) || (t > 7.8 && t < 8.05) ? 0.45 : 0;
      const wearMask = t >= 7.0 && t < 8.6;
      const pose = Object.assign({
        pos: [0, 0.9, 0],
        yaw: S(t * 3.2) * 0.18,
        lean: -0.04,
        roll: S(t * 2.5) * 0.06,
        sp: [0.05, 0, S(t * 2.5) * 0.05],
        nk: [0.04, S(t * 3) * 0.08, -0.06],
        hR: [-0.08, 0.24, 0.16],
        eR: [-0.26, 0.06, 0.08],
        hL: [0.14, 0.16, 0.16],
        eL: [0.28, 0.02, 0.06],
        outfit: 'kimono',
        mask: wearMask ? 'face' : 'side',
        prop: 'fan',
        eyes: t > 8.6 ? 'crazy' : 'wide',
        mouth: 'smirk'
      }, STAND_LEGS);
      applyVoiceMouth(pose, v);
      return {
        t,
        set: 'stage',
        env: ENVS.crimson,
        flash,
        floatingMasks: true,
        camera: {
          eye: [S(t * 2.1) * 0.14, 1.29, lerp(0.86, 0.62, u)],
          at: [0, 1.27, 0],
          fov: 36
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 17.5) {
      const u = (t - 10.67) / (17.5 - 10.67);
      const pose = Object.assign({
        pos: [0, 0.62, 0.42],
        yaw: lerp(-0.18, 0.12, u),
        lean: 0.08,
        roll: 0,
        sp: [0.06, 0, 0],
        nk: [0.04, S(t * 1.6) * 0.08, 0.05],
        hR: [-0.06, 0.2, 0.16],
        eR: [-0.22, 0.02, 0.12],
        hL: [0.12, 0.04, 0.18],
        eL: [0.26, -0.02, 0.08],
        outfit: 'school',
        mask: 'none',
        prop: 'none',
        eyes: t > 15.2 ? 'half' : 'open',
        mouth: 'smile'
      }, SIT_LEGS);
      applyVoiceMouth(pose, v);
      return {
        t,
        set: 'classroom',
        env: ENVS.classroom,
        camera: {
          eye: [lerp(0.68, -0.32, u), lerp(1.12, 1.04, u), lerp(1.65, 1.22, u)],
          at: [0, 0.94, 0.38],
          fov: 40
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 23.53) {
      const u = (t - 17.5) / (23.53 - 17.5);
      const turnCrimson = t >= 22.0;
      const pose = Object.assign({
        pos: [0, 0.9, 0.1],
        yaw: lerp(-0.12, 0.08, u),
        lean: -0.02,
        roll: turnCrimson ? -0.08 : 0.03,
        sp: [0.03, 0, 0],
        nk: [0.02, 0, turnCrimson ? -0.1 : 0.04],
        hR: [-0.08, 0.24, 0.18],
        eR: [-0.24, 0.04, 0.08],
        hL: [0.15, -0.04, 0.08],
        eL: [0.3, 0.02, -0.04],
        outfit: turnCrimson ? 'kimono' : 'school',
        mask: turnCrimson ? 'side' : 'none',
        prop: turnCrimson ? 'kendama' : 'none',
        eyes: turnCrimson ? 'crazy' : 'wink',
        mouth: turnCrimson ? 'smirk' : 'smile'
      }, STAND_LEGS);
      applyVoiceMouth(pose, v);
      return {
        t,
        set: 'classroom',
        env: turnCrimson ? ENVS.crimson : ENVS.classroom,
        flash: Math.abs(t - 22.0) < 0.18 ? 0.65 : 0,
        camera: {
          eye: [lerp(-0.12, 0.08, u), 1.28, lerp(0.88, 0.58, u)],
          at: [0, 1.26, 0.1],
          fov: 34
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 27.63) {
      const u = (t - 23.53) / (27.63 - 23.53);
      const pose = Object.assign({
        pos: [0, 0.9, 0],
        yaw: S(t * 2.4) * 0.25,
        lean: 0.04,
        roll: S(t * 2.4) * 0.05,
        sp: [0.04, S(t * 2.4) * 0.08, 0],
        nk: [0.02, -S(t * 2.4) * 0.06, 0.04],
        hR: [-0.14, 0.22, 0.18],
        eR: [-0.3, 0.06, 0.08],
        hL: [0.14, 0.18, 0.16],
        eL: [0.3, 0.04, 0.06],
        outfit: 'kimono',
        mask: 'side',
        prop: 'fan',
        eyes: 'open',
        mouth: 'smile'
      }, DANCE_LEGS(t));
      applyVoiceMouth(pose, v);
      return {
        t,
        set: 'penacony',
        env: ENVS.penacony,
        floatingMasks: true,
        camera: {
          eye: [S(u * PI) * 0.45, 1.18, lerp(1.75, 1.32, u)],
          at: [0, 1.12, 0],
          fov: 44
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 33.77) {
      const u = (t - 27.63) / (33.77 - 27.63);
      const whiteFlash = t > 33.35 ? ease((t - 33.35) / 0.42) * 0.9 : 0;
      const mainPose = Object.assign({
        pos: [0, 0.9, 0.15],
        yaw: S(t * 3.0) * 0.22,
        lean: -0.04,
        roll: S(t * 3.0) * 0.06,
        sp: [0.04, 0, S(t * 3.0) * 0.05],
        nk: [0.03, 0, -0.05],
        hR: [-0.12, 0.26, 0.18],
        eR: [-0.28, 0.08, 0.08],
        hL: [0.16, 0.12, 0.14],
        eL: [0.3, 0.02, 0.04],
        outfit: 'kimono',
        mask: 'side',
        prop: 'kendama',
        eyes: 'crazy',
        mouth: 'laugh'
      }, DANCE_LEGS(t));

      const cloneL = Object.assign({}, mainPose, {
        pos: [-0.75, 0.9, -0.45],
        yaw: 0.35,
        outfit: 'shadow',
        mask: 'face',
        prop: 'none'
      });
      const cloneR = Object.assign({}, mainPose, {
        pos: [0.75, 0.9, -0.45],
        yaw: -0.35,
        outfit: 'shadow',
        mask: 'face',
        prop: 'none'
      });

      return {
        t,
        set: 'stage',
        env: ENVS.crimson,
        flash: whiteFlash,
        floatingMasks: true,
        camera: {
          eye: [lerp(-0.35, 0.35, u), 1.18, lerp(1.65, 1.15, u)],
          at: [0, 1.15, 0],
          fov: 45
        },
        voice: v,
        speech,
        cast: [{ pose: cloneL }, { pose: cloneR }, { pose: mainPose }]
      };
    }

    if (t < 44.0) {
      const u = (t - 33.77) / (44.0 - 33.77);
      const pinkFlash = t > 43.6 ? ease((t - 43.6) / 0.4) * 0.85 : 0;
      const pose = Object.assign({
        pos: [S(t * 2.2) * 0.18, 0.9, 0],
        yaw: S(t * 2.8) * 0.35,
        lean: 0.04,
        roll: S(t * 2.8) * 0.07,
        sp: [0.05, S(t * 2.8) * 0.1, 0],
        nk: [0.02, -S(t * 2.8) * 0.08, 0.04],
        hR: [-0.14, 0.24 + S(t * 5.6) * 0.06, 0.2],
        eR: [-0.3, 0.06, 0.08],
        hL: [0.16, 0.18 - S(t * 5.6) * 0.05, 0.16],
        eL: [0.3, 0.04, 0.06],
        outfit: 'kimono',
        mask: 'side',
        prop: t < 38.2 ? 'kendama' : 'fan',
        eyes: t > 38.2 ? 'wink' : 'open',
        mouth: 'smile'
      }, DANCE_LEGS(t * 1.15));
      applyVoiceMouth(pose, v);
      return {
        t,
        set: 'stage',
        env: ENVS.crimson,
        flash: pinkFlash,
        goldfish: true,
        fireworks: t >= 38.2,
        camera: {
          eye: [C(u * PI * 1.5) * 0.42, lerp(1.16, 1.28, S(u * PI)), lerp(1.55, 0.95, u)],
          at: [0, 1.18, 0],
          fov: 42
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 56.17) {
      const u = (t - 44.0) / (56.17 - 44.0);
      const isClose = t >= 50.0;
      const pose = Object.assign({
        pos: [0, 0.9, 0],
        yaw: lerp(-0.15, 0.15, u),
        lean: -0.05,
        roll: -0.08,
        sp: [0.04, 0, -0.06],
        nk: [0.04, -0.05, -0.1],
        hR: [-0.09, 0.28, 0.14],
        eR: [-0.28, 0.12, 0.08],
        hL: [0.15, 0.02, 0.1],
        eL: [0.3, 0.02, -0.04],
        outfit: 'kimono',
        mask: 'side',
        prop: 'gun',
        eyes: 'crazy',
        mouth: isClose ? 'laugh' : 'smirk'
      }, STAND_LEGS);
      return {
        t,
        set: 'stage',
        env: ENVS.crimson,
        floatingMasks: true,
        flash: (t > 55.8) ? 0.85 : 0,
        camera: isClose ? {
          eye: [lerp(-0.08, 0.08, (t - 50.0) / 6.17), 1.3, 0.62],
          at: [0, 1.28, 0],
          fov: 34
        } : {
          eye: [lerp(0.35, -0.25, u), 1.22, 1.24],
          at: [0, 1.2, 0],
          fov: 40
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 58.0) {
      const u = (t - 56.17) / (58.0 - 56.17);
      const pose = Object.assign({
        pos: [0.22, 0.9, 0],
        yaw: -0.22,
        lean: -0.04,
        roll: 0.06,
        sp: [0.04, 0, 0.04],
        nk: [0.02, 0.12, 0.06],
        hR: [-0.1, 0.26, 0.18],
        eR: [-0.28, 0.08, 0.08],
        hL: [0.14, 0.22, 0.16],
        eL: [0.28, 0.06, 0.06],
        outfit: 'kimono',
        mask: 'side',
        prop: 'gun',
        eyes: 'wink',
        mouth: 'laugh'
      }, STAND_LEGS);
      return {
        t,
        set: 'stage',
        env: ENVS.crimson,
        banner: 'logoTitle',
        bannerAlpha: u < 0.82 ? 0.94 : clamp((1 - u) / 0.18, 0, 0.94),
        camera: { eye: [0, 1.26, 0.92], at: [0.1, 1.24, 0], fov: 38 },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 72.27) {
      const isNoir = t >= 65.1 && t < 66.8;
      const u = (t - 58.0) / (72.27 - 58.0);
      const mainPose = Object.assign({
        pos: [S(t * 3.4) * 0.22, 0.9, 0.1],
        yaw: S(t * 3.4) * 0.4,
        lean: 0.04,
        roll: S(t * 3.4) * 0.08,
        sp: [0.05, S(t * 3.4) * 0.12, 0],
        nk: [0.03, -S(t * 3.4) * 0.08, 0.05],
        hR: [-0.14, 0.26, 0.18],
        eR: [-0.3, 0.08, 0.08],
        hL: [0.14, 0.22, 0.18],
        eL: [0.3, 0.06, 0.08],
        outfit: 'kimono',
        mask: t > 61.0 && t < 63.2 ? 'face' : 'side',
        prop: 'fan',
        eyes: 'crazy',
        mouth: 'laugh'
      }, DANCE_LEGS(t * 1.3));
      applyVoiceMouth(mainPose, v);

      const schoolClone = Object.assign({}, mainPose, {
        pos: [-0.68, 0.9, -0.38],
        yaw: 0.28,
        outfit: 'school',
        mask: 'face',
        prop: 'none'
      });
      const shadowClone = Object.assign({}, mainPose, {
        pos: [0.68, 0.9, -0.38],
        yaw: -0.28,
        outfit: 'shadow',
        mask: 'face',
        prop: 'gun'
      });

      return {
        t,
        set: 'stage',
        env: isNoir ? ENVS.noir : ENVS.crimson,
        floatingMasks: true,
        fireworks: !isNoir,
        camera: {
          eye: [S(u * PI * 2) * 0.48, lerp(1.14, 1.3, S(u * PI)), lerp(1.48, 0.92, (t % 3.5) / 3.5)],
          at: [0, 1.18, 0],
          fov: 42
        },
        voice: v,
        speech,
        cast: [{ pose: schoolClone }, { pose: shadowClone }, { pose: mainPose }]
      };
    }

    if (t < 95.43) {
      const u = (t - 72.27) / (95.43 - 72.27);
      const beatIdx = Math.floor((t - 72.27) * 1.5);
      const sets = ['kaleido', 'stage', 'penacony', 'classroom'];
      const curSet = sets[beatIdx % sets.length];
      const envs = [ENVS.kaleido, ENVS.crimson, ENVS.penacony, ENVS.noir];
      const curEnv = envs[beatIdx % envs.length];
      const isClose = beatIdx % 3 === 1;

      const mainPose = Object.assign({
        pos: [S(t * 3.8) * 0.16, 0.9, 0],
        yaw: S(t * 3.2) * 0.32,
        lean: 0.03,
        roll: S(t * 3.8) * 0.08,
        sp: [0.05, S(t * 3.2) * 0.1, 0],
        nk: [0.02, -S(t * 3.2) * 0.06, 0.06],
        hR: [-0.12, 0.26 + S(t * 6) * 0.05, 0.18],
        eR: [-0.28, 0.08, 0.08],
        hL: [0.14, 0.22 - S(t * 6) * 0.05, 0.18],
        eL: [0.28, 0.06, 0.08],
        outfit: beatIdx % 5 === 3 ? 'school' : 'kimono',
        mask: 'side',
        prop: beatIdx % 2 === 0 ? 'gun' : 'fan',
        eyes: beatIdx % 3 === 0 ? 'crazy' : 'wink',
        mouth: 'laugh'
      }, DANCE_LEGS(t * 1.4));
      applyVoiceMouth(mainPose, v);

      const cast = [{ pose: mainPose }];
      if (!isClose) {
        cast.unshift(
          {
            pose: Object.assign({}, mainPose, {
              pos: [-0.82, 0.9, -0.5],
              yaw: 0.35,
              outfit: 'shadow',
              mask: 'face'
            })
          },
          {
            pose: Object.assign({}, mainPose, {
              pos: [0.82, 0.9, -0.5],
              yaw: -0.35,
              outfit: 'school',
              mask: 'face'
            })
          }
        );
      }

      return {
        t,
        set: curSet,
        env: curEnv,
        goldfish: true,
        floatingMasks: true,
        fireworks: true,
        flash: ((t * 1.5) % 1) < 0.08 ? 0.35 : 0,
        camera: isClose ? {
          eye: [S(t * 2.5) * 0.12, 1.29, 0.64],
          at: [0, 1.27, 0],
          fov: 35
        } : {
          eye: [C(u * PI * 3) * 0.55, 1.18, 1.45],
          at: [0, 1.15, 0],
          fov: 44
        },
        voice: v,
        speech,
        cast
      };
    }

    if (t < 103.0) {
      const u = (t - 95.43) / (103.0 - 95.43);
      const bang = t > 100.8 && t < 101.6 ? S(((t - 100.8) / 0.8) * PI) * 0.92 : 0;
      const pose = Object.assign({
        pos: [0, 0.9, 0],
        yaw: lerp(-0.1, 0.05, u),
        lean: -0.06,
        roll: -0.06,
        sp: [0.05, 0, -0.04],
        nk: [0.04, 0, -0.08],
        hR: [-0.04, 0.24, 0.28],
        eR: [-0.22, 0.04, 0.1],
        hL: [0.16, 0.04, 0.1],
        eL: [0.3, 0.02, -0.04],
        outfit: 'kimono',
        mask: 'side',
        prop: 'gun',
        eyes: 'crazy',
        mouth: 'laugh'
      }, STAND_LEGS);
      return {
        t,
        set: 'stage',
        env: ENVS.crimson,
        fireworks: true,
        floatingMasks: true,
        flash: bang,
        fade: t > 102.2 ? clamp((103.0 - t) / 0.8, 0, 1) : 1,
        camera: {
          eye: [lerp(0.22, 0, u), 1.28, lerp(1.05, 0.64, u)],
          at: [0, 1.26, 0],
          fov: 36
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    if (t < 105.0) {
      const u = (t - 103.0) / 2.0;
      return {
        t,
        set: 'curtain',
        env: ENVS.curtain,
        fade: lerp(0.08, 0.35, u),
        camera: { eye: [0, 1.22, 1.5], at: [0, 1.15, 0], fov: 42 },
        voice: v,
        speech,
        cast: []
      };
    }

    if (t < 118.9) {
      const u = (t - 105.0) / (118.9 - 105.0);
      const bow = t < 110.5 ? S(clamp((t - 105.5) / 4.5, 0, 1) * PI) * 0.38 : 0;
      const endFlash = t > 118.2 ? ease((t - 118.2) / 0.7) * 0.9 : 0;
      const pose = Object.assign({
        pos: [0, 0.9, 0],
        yaw: S(u * PI) * 0.08,
        lean: bow,
        roll: t >= 111.0 ? 0.05 : 0,
        sp: [bow * 0.6, 0, 0],
        nk: [bow * 0.3, 0, t >= 111.0 ? 0.06 : 0],
        hR: [-0.1, 0.16, 0.18],
        eR: [-0.26, 0.02, 0.08],
        hL: [0.14, 0.08, 0.14],
        eL: [0.28, 0.02, 0.04],
        outfit: 'kimono',
        mask: 'side',
        prop: 'fan',
        eyes: t > 113.5 ? 'wink' : 'open',
        mouth: 'smile'
      }, STAND_LEGS);
      applyVoiceMouth(pose, v);
      return {
        t,
        set: 'curtain',
        env: ENVS.curtain,
        flash: endFlash,
        goldfish: true,
        camera: {
          eye: [lerp(-0.18, 0.12, u), lerp(1.18, 1.28, u), lerp(1.38, 0.72, u)],
          at: [0, 1.22 - bow * 0.18, 0],
          fov: 38
        },
        voice: v,
        speech,
        cast: [{ pose }]
      };
    }

    const outroU = (t - 118.9) / (DURATION - 118.9);
    return {
      t,
      set: 'curtain',
      env: ENVS.curtain,
      fade: 0.1,
      banner: 'logoOutro',
      bannerAlpha: clamp(1 - Math.max(0, outroU - 0.85) / 0.15, 0, 1),
      camera: { eye: [0, 1.25, 1.8], at: [0, 1.2, 0], fov: 42 },
      voice: v,
      speech,
      cast: []
    };
  }

  window.SparkleScript = { ID, DURATION, CUTS, VOICE, SPEECH, stage };
})();
