(function () {
  const K = window.YouVidKit;
  const { clamp, envelope } = K;

  const ID = 'Br3akBadRmx';
  const DURATION = 141.36;

  const VOICE = envelope('00000000000UTLFAl00qXTLHyc00NWQIrZZSDUUMDzp0000000000000000000eOHBl0000000000000vWRHqXZUHRWOEDZYPtSTIyOZVNxXTJFye8000000000000000000yPBw00000KUOFjVULtNTNEyr300STKFCk20iVQMqXYTCLVOHCj00000000000000000000GKxi00000000000000TRJtVUUXHVPIoYZUBOTMCKYIZDUSKHw90BH000a003Lw0000000NOMJNMJOMPF3wPMo3CWTUPMLl0PSNJUSLAJTVUHPOMdvOIEMRNo8PZVUSPMb2QPMKSREyMSUTVTVLELMLLHXY72QXSUMLE0zSPLNURAEQUTQKNMJ5MNGGLHONiXZXPj940000000000RZZZWQUya50000000SSSywOGsfLROxKXUWURVRVUQMGFd700000000000000000000000000000000000000000LWXWQQM600000000000000000000000000000000000000000000000000000000000000PUWVEBKMARTXNzOUPwJPNVQKykVPHhHWWJBWUGWXPFPOOFXZSyuoWXWErHRRRVQABPRNIGYXYWJSWVPPCEWUUENWWWZZUu5MXWXZYUAmJROGPVVUXWUSPLEo0EPC60OZZYORMk00000ILFszDzCycnpw00000000000000000000000000000000000000000000000000000qP1lHBgijzqx6k00005c10b00085a000000000000000000000000000000000000000EMNEAAKDIz310000000000000000000000000000000000000000000000000rDszEuboBquzrCDr00wBvb500000ege000005000000000000000000000000000000000000000000mHMOBYVWYYYUNNSQOGFIHFtBmkff0dJRMLCvYWZWWNFj00008ih00000AFNOQLoodwQTPMzFCLrpg0000007e0000000500000000000000000000000000000000DSOyn00qj00000bFKOCTUTWWXUMHQQOFtxEEpAlha00000000BQVVJOOJwQNA50000qqga0000000000lVZs0Gp00000000000000UZXCWXRWWUTSd0030000000000003glwAx00000ORVUVH000ATSRJzCNKzs8020000kc0000000e0000000000000000000000000000000000000000mAMTUMWEi0NVPByKXXJwPKITXZYsliGrwmCKzVVSI0CykSXTZWONKHYZXKaFOgRUTTPNMDHSOHDDPANTQURROHwCwyqfmsx000IRKxejKLTVWTVSAkDWWWZWINGRZYUorNGFUVRTQNNlQZXMxuVIzYZYS45PJNJ04s300jozud0000cWT00ulCIGvEun04fc100000000000000000YV000zLU0JTTVXXYZVVXUSLFC0PT00MYg0fSWXXCvPOsEzJKU0TCLJ00MQ00bSWWVRNLpiLn00mFUGwEJMHTvZ0KVXXTLJsqXC00UT00ITXWWUJWYULiQMwSZZZWQPv000RVf0kdpAzpvni0065000000310001fECyy3mQH0tRU00HLOPNFNQ0lhDIQlcdfr006B00CSRSRQLHzpfh800sMI00jz5ylLbozMUQKEr1TJ00QU00CSVVVOJG0puIJIPvU0Pj00QL0000000Ur00NTWURMIz0PB4tOSGtFXSpf00000000000000000VUtbqWNnrXPl7KWPpg0000000000000000CQMAPLKI01LL02FQw0zUp0cHc00NC0000000JBFIGC00AH00tOj00LRFQSG00eMj00000000000QTroTUu7yYTAf00000000000000000UVvbmTSpqVRm4JWRsf0000000000000000tQNCONKN40HOct0008xRIsrFo00NH0000000IHMQIQl0pJ0NP6000ERGNSG000Ox0000000000fzQTSLPOB0000BVTFGVUI00Gh00zTQSRDn0dSWNKXVz0goyuzNZy3wOKEoHJ0iONIHHVSLBDSTRRL00JLMvtL08HOMLKQNz00xOMC400nELOVQHyAj0000NTGvxUUVVVw0000000USmgQUXWYWPkd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000vHEBCHD00000ELDCGGH50al000HIIIBe00uKKzONF00cwhqGTJi6vDznbC50tzuxpMNIxhwEMxEa0pwyz0Ao0gEzCBDBx00dAExa000fBGQNwsih0000AKKgsEOOPRF0000000sNt0KMTTYTUCn36ktrj000000000000000000000000000000000000000000000000000JNJCgxEOBHq0lwHG0Cu00AtxzACB500zHze00000000000000000000000000000000000Fr01CLIFFt20000000000000000000000000000000000000000000000000000000000INJy2tDOAHp0cwGFbyz00zvxzzCC900tGAi00000000000000000000000000000000000Ds00ENMFMD8d00000000000000000000000000', 20);

  const TRACKS = {
    F: [[0, 'drive'], [7.433, ''], [12.667, 'carPhone'], [13.2, 'carLaugh'], [14.067, 'saulOffice'], [19.4, 'hankCar'], [19.933, 'saulAd'], [21.033, 'labWide'], [22.667, 'lab'], [24.833, 'jesseHouse'], [25.167, 'lab'], [28.3, 'jesseRV'], [28.733, 'jesseDark'], [29.167, 'jesseClose'], [30.033, 'jessePoint'], [31.333, 'waltApron'], [31.8, 'jesseProfile'], [32.233, 'roundRoom'], [32.6, 'jesseJump'], [33.5, ''], [34.7, 'knock'], [35.833, ''], [38.5, 'knock'], [39.2, ''], [41.767, 'knock'], [42.666, ''], [44.8, 'knock'], [46.1, ''], [48.533, 'sayName'], [50.4, 'jesseCam'], [51.267, 'waltLow'], [55.067, 'waltSky'], [55.8, 'sayName'], [57.433, 'hankNight'], [58.3, 'waltSweater'], [60.167, 'hankNight'], [61.367, 'waltLow'], [65.933, ''], [90.9, 'doctor'], [94.166, ''], [104.833, 'carMike'], [109.9, ''], [124.833, 'gus'], [125.933, ''], [139.4, 'mikeSide'], [140.5, 'black'], [141.4, '']],
    L: [[7.433, 'drive'], [12.666, ''], [33.5, 'waltDark'], [34.7, ''], [35.833, 'hand'], [38.5, ''], [39.2, 'hand'], [41.766, ''], [65.933, 'waltSky'], [72.867, 'waltWhite'], [74.633, 'waltTrees'], [77.867, 'waltTurn'], [78.767, 'black'], [78.833, 'waltTurn'], [78.867, 'black'], [78.9, 'waltTurn'], [79, 'black'], [79.067, 'waltTurn'], [79.1, 'black'], [79.167, 'waltTurn'], [79.2, 'black'], [79.367, 'waltTurn'], [79.433, 'black'], [79.6, 'waltTrees'], [80.533, 'black'], [80.567, 'waltTurn'], [80.633, 'black'], [80.667, 'waltTurn'], [80.733, 'black'], [80.8, 'waltTurn'], [80.833, 'black'], [80.9, 'waltTrees'], [81.867, 'waltHall'], [82.967, 'waltTrees'], [84, 'waltTurn'], [84.933, 'black'], [85.033, 'waltTurn'], [85.133, 'black'], [85.233, 'waltTrees'], [85.733, 'black'], [85.8, 'waltTurn'], [85.867, 'black'], [85.9, 'waltTurn'], [85.967, 'black'], [86, 'waltTurn'], [86.067, 'black'], [86.133, 'waltTurn'], [86.167, 'black'], [86.333, 'waltTurn'], [86.4, 'black'], [86.433, 'hankWall'], [87.433, 'waltTrees'], [87.467, 'black'], [87.533, 'waltTurn'], [87.6, 'black'], [87.633, 'waltTurn'], [87.7, 'black'], [87.733, 'waltTurn'], [87.8, 'black'], [87.867, 'waltTrees'], [88.3, 'waltTurn'], [89.167, 'waltTrees'], [89.2, 'black'], [89.267, 'waltTurn'], [89.3, 'black'], [89.333, 'waltTurn'], [89.433, 'black'], [89.5, 'waltTurn'], [89.533, 'black'], [89.6, 'waltTurn'], [89.667, 'black'], [89.8, 'waltTurn'], [89.867, 'black'], [90.033, 'waltTurn'], [90.1, 'black'], [90.233, 'waltTurn'], [90.3, 'black'], [90.467, 'waltTrees'], [90.9, ''], [109.9, 'gus'], [112.1, 'black'], [112.233, 'warehouse'], [112.5, 'black'], [112.533, 'warehouse'], [112.6, 'black'], [112.667, 'warehouse'], [112.767, 'black'], [112.867, 'warehouse'], [113.2, 'black'], [113.3, 'warehouse'], [113.4, 'black'], [113.533, 'warehouse'], [113.833, 'black'], [113.967, 'warehouse'], [114.067, 'black'], [114.167, 'warehouse'], [115.267, 'green'], [115.833, 'black'], [115.9, 'green'], [115.967, 'black'], [116.033, 'green'], [116.067, 'black'], [116.133, 'green'], [116.733, 'black'], [116.767, 'green'], [116.833, 'black'], [116.9, 'green'], [116.933, 'black'], [117, 'green'], [117.133, 'black'], [117.233, 'green'], [118.367, 'black'], [118.4, 'green'], [118.467, 'black'], [118.533, 'green'], [118.733, '']],
    R: [[7.433, 'rub'], [12.666, ''], [33.5, 'jesseBruise'], [34.7, ''], [35.833, 'blinds'], [38.5, ''], [39.2, 'blinds'], [41.766, ''], [65.933, 'hankSand'], [68.3, 'hankBooks'], [70.9, 'hankSand'], [71.767, 'hankBooks'], [74.633, 'hankWall'], [80.5, 'basket'], [82.967, 'hankWall'], [83.933, 'black'], [84, ''], [109.9, 'mikeSide'], [112.1, 'black'], [112.233, 'waltRead'], [112.533, 'ring'], [113.3, 'aztek'], [113.967, 'clip'], [115.267, 'aztek'], [115.7, 'waltRead'], [116, 'ring'], [116.767, 'aztek'], [117.433, 'clip'], [118.733, '']],
    TL: [[42.667, 'gun'], [44.8, ''], [46.1, 'gun'], [48.533, '']],
    TR: [[42.667, 'cards'], [43.4, 'hankBed'], [43.8, 'cards'], [44.8, ''], [46.1, 'cards'], [46.9, 'hankBed'], [47.267, 'cards'], [48.533, ''], [84, 'bar'], [84.567, 'yellow'], [85.467, 'blueRoom'], [87.233, 'yellow'], [87.467, 'bar'], [88.067, 'yellow'], [88.933, 'blueRoom'], [90.7, 'yellow'], [90.9, '']],
    BL: [[42.667, 'hand'], [44.8, ''], [46.1, 'hand'], [48.533, '']],
    BR: [[42.667, 'blinds'], [44.8, ''], [46.1, 'blinds'], [48.533, ''], [84, 'basket'], [90.9, '']],
    T3: [[118.733, 'carMike'], [123.8, 'mikeSide'], [124.833, '']],
    T3L: [[94.167, 'doctor'], [104.833, ''], [125.933, 'warehouse'], [126.033, 'black'], [126.133, 'warehouse'], [126.4, 'black'], [126.467, 'warehouse'], [126.5, 'black'], [126.567, 'warehouse'], [126.667, 'black'], [126.767, 'warehouse'], [127.1, 'black'], [127.233, 'warehouse'], [127.333, 'black'], [127.433, 'warehouse'], [127.767, 'black'], [127.867, 'warehouse'], [127.967, 'black'], [128.1, 'green'], [129.733, 'black'], [129.833, 'green'], [129.867, 'black'], [129.933, 'green'], [130, 'black'], [130.033, 'green'], [130.633, 'black'], [130.7, 'green'], [130.767, 'black'], [130.8, 'green'], [130.867, 'black'], [130.9, 'green'], [131.067, 'black'], [131.133, 'green'], [132.267, 'black'], [132.333, 'green'], [132.367, 'black'], [132.433, 'green'], [132.667, 'warehouse'], [132.767, 'black'], [132.867, 'warehouse'], [132.967, 'black'], [133.1, 'warehouse'], [133.367, 'black'], [133.4, 'warehouse'], [133.467, 'black'], [133.533, 'warehouse'], [133.633, 'black'], [133.733, 'warehouse'], [134.067, 'black'], [134.167, 'warehouse'], [134.267, 'black'], [134.4, 'warehouse'], [134.733, 'black'], [134.833, 'warehouse'], [134.933, 'black'], [135.033, 'green'], [136.7, 'black'], [136.767, 'green'], [136.833, 'black'], [136.9, 'green'], [136.933, 'black'], [137, 'green'], [137.6, 'black'], [137.667, 'green'], [137.7, 'black'], [137.767, 'green'], [137.8, 'black'], [137.867, 'green'], [138, 'black'], [138.1, 'green'], [139.233, 'black'], [139.267, 'green'], [139.333, 'black'], [139.4, '']],
    T3R: [[94.167, 'eladio'], [104.833, ''], [125.933, 'aztek'], [126.133, 'waltRead'], [126.367, 'ring'], [126.4, 'waltRead'], [126.433, 'ring'], [127.233, 'aztek'], [127.867, 'clip'], [128.967, 'mikeClose'], [130.767, 'aztek'], [131.333, 'clip'], [132.467, 'mikeSide'], [133.533, 'ring'], [134.167, 'aztek'], [134.833, 'clip'], [135.933, 'mikeClose'], [137.733, 'aztek'], [138.3, 'clip'], [139.4, '']],
    B4: [[94.167, 'granite'], [104.833, '']],
    B4L: [[118.733, 'garlic'], [124.833, ''], [125.933, 'garlic'], [139.4, '']],
    B4R: [[118.733, 'oldMan'], [124.833, ''], [125.933, 'oldMan'], [139.4, '']]
  };

  const PANELS = {
    F: [0, 0, 1, 1], L: [0, 0, 0.5, 1], R: [0.5, 0, 0.5, 1],
    TL: [0, 0, 0.5, 0.5], TR: [0.5, 0, 0.5, 0.5], BL: [0, 0.5, 0.5, 0.5], BR: [0.5, 0.5, 0.5, 0.5],
    T3: [0, 0, 1, 0.75], T3L: [0, 0, 0.5, 0.75], T3R: [0.5, 0, 0.5, 0.75], B4: [0, 0.75, 1, 0.25], B4L: [0, 0.75, 0.5, 0.25], B4R: [0.5, 0.75, 0.5, 0.25]
  };

  const SING = [
    [0.4, 12.7, 'hank'], [12.67, 14.07, 'hank'], [13.7, 19.4, 'saul'], [19.4, 19.95, 'hank'], [19.95, 21.1, 'saul'], [21.1, 28.2, 'jesse'],
    [28.1, 31.4, 'jesse'], [31.4, 31.8, 'walt'], [31.8, 33.55, 'jesse'], [33.55, 34.2, 'walt'], [34.3, 34.9, 'jesse'], [34.9, 48.5, 'walt'],
    [48.5, 50.42, 'walt'], [50.42, 51.27, 'jesse'], [51.27, 57.43, 'walt'], [57.43, 58.3, 'hank'], [58.3, 60.17, 'walt'], [60.17, 61.37, 'hank'], [61.37, 65.9, 'walt'],
    [65.9, 67.8, 'hank'], [67.8, 68.4, 'walt'], [68.4, 69.87, 'hank'], [69.87, 71.3, 'walt'], [71.3, 72.95, 'hank'], [72.95, 74.8, 'walt'], [74.8, 75.8, 'hank'],
    [75.8, 81.3, 'walt'], [81.3, 83.1, 'walt'], [83.1, 84.4, 'hank'], [84.4, 86.6, 'walt'], [86.6, 87.45, 'hank'], [87.45, 90.9, 'walt'],
    [90.9, 94.2, 'doctor'], [94.2, 97.4, 'eladio'], [97.4, 100.9, 'doctor'], [100.9, 104.8, 'eladio'], [104.8, 141.4, 'mike']
  ];

  const keys = Object.keys(TRACKS);

  function shotAt(panel, t) {
    const tr = TRACKS[panel];
    if (!tr || t < tr[0][0]) return '';
    let lo = 0, hi = tr.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (tr[mid][0] <= t) lo = mid; else hi = mid - 1;
    }
    return tr[lo][1];
  }

  function singer(t) {
    for (let i = SING.length - 1; i >= 0; i--) {
      const s = SING[i];
      if (t >= s[0] && t < s[1]) return s[2];
    }
    return '';
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const panels = [];
    keys.forEach(p => {
      const shot = shotAt(p, tt);
      if (shot) panels.push({ panel: p, shot, rect: PANELS[p] });
    });
    return { t: tt, panels, voice: VOICE(tt), singer: singer(tt) };
  }

  const CUTS = [];
  keys.forEach(p => TRACKS[p].forEach(([t, s]) => { if (s && s !== 'black' && !CUTS.some(c => Math.abs(c - t) < 0.05)) CUTS.push(t); }));
  CUTS.sort((a, b) => a - b);

  window.BreakScript = { ID, DURATION, VOICE, TRACKS, PANELS, SING, CUTS, shotAt, singer, stage };
})();
