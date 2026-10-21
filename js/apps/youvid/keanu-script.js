(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease, envelope } = K;

  const ID = 'k3An4uH0rnY';
  const DURATION = 23.1;

  const VOICE = envelope('0006aijxpjilfccmsnfdabqssqdhkrmlffec9voa9nwKLKyBzyyzwyCGFFyAABBCABCJNLzDCADBADDFFFyAyyBzw9bLKBJAIGwwNAqnsvzCzJKLyBAyyzxyAGFGxABABDAADHMNzDDADCzCCx899pGzrd986oJLLzAAyyAwyAGFGyABABCAADHNNzDDADCzCCFEGyEwzDBCqsxBALLHyBzzyzyzEFGEyBABCCACDLNJADBBEABCTFIRZQSSKNOPOABCsCsvnqhnpuozKLHyBzyyyxyDFGDyBBCCCACDLMJADBBEAByuMExBzAtjuCuopslkmAypwtrpmkwztkgnihjBxhbiwtmlAoikuutruCrqmnsosuKvrvtsrvFJKLNSyDyqMAtnzGBCHHHFAxHIIKODEKIBBIJICrheeckqlsrrILLyBAxzzxyAGFGyACABCAADHNNzDDADCi', 20);

  const SHOTS = [
    { from: 0, to: 2.0, scene: 'streetFront', boxed: false, logo: true, zoom: [1.0, 1.08], pan: [0, 0.01] },
    { from: 2.0, to: 4.33, scene: 'streetBack', boxed: true, caption: "I'll fuck it", zoom: [1.0, 1.1], pan: [0, 0] },
    { from: 4.33, to: 5.33, scene: 'closeA', boxed: false, zoom: [1.0, 1.06], pan: [0, 0], talk: [0.5, 0.43, 0.05] },
    { from: 5.33, to: 7.2, scene: 'closeA', boxed: true, caption: 'Why do you cum?', zoom: [1.06, 1.14], pan: [0, 0], talk: [0.5, 0.43, 0.05] },
    { from: 7.2, to: 7.8, scene: 'desk', boxed: false, logo: true, zoom: [1.0, 1.05], pan: [0, 0], talk: [0.56, 0.47, 0.045] },
    { from: 7.8, to: 9.8, scene: 'desk', boxed: true, caption: 'Dick', zoom: [1.05, 1.12], pan: [0, 0], talk: [0.56, 0.47, 0.045] },
    { from: 9.8, to: 12.1, scene: 'window', boxed: true, caption: 'Well cum', zoom: [1.0, 1.1], pan: [0, 0] },
    { from: 12.1, to: 12.9, scene: 'neon', boxed: false, zoom: [1.0, 1.08], pan: [0, 0] },
    { from: 12.9, to: 15.27, scene: 'johnny', boxed: true, caption: 'You can be cum', zoom: [1.0, 1.08], pan: [0, 0] },
    { from: 15.27, to: 18.73, scene: 'closeB', boxed: false, rating: true, zoom: [1.0, 1.32], pan: [0, 0.03], talk: [0.5, 0.45, 0.05] },
    { from: 18.73, to: 19.23, scene: 'guy', boxed: false, zoom: [1.0, 1.04], pan: [0, 0] },
    { from: 19.23, to: 19.5, scene: 'closeB', boxed: false, rating: true, zoom: [1.1, 1.12], pan: [0, 0], talk: [0.5, 0.45, 0.05] },
    { from: 19.5, to: 19.9, scene: 'guy', boxed: false, zoom: [1.04, 1.08], pan: [0, 0] },
    { from: 19.9, to: 21.3, scene: 'closeC', boxed: false, zoom: [1.0, 1.1], pan: [0, 0], talk: [0.5, 0.46, 0.05] },
    { from: 21.3, to: 23.1, scene: 'closeC', boxed: true, caption: 'Getting cock', zoom: [1.1, 1.18], pan: [0, 0], talk: [0.5, 0.46, 0.05] }
  ];

  const CUTS = SHOTS.map(s => s.from);

  function shotAt(t) {
    const tt = clamp(t, 0, DURATION - 0.001);
    return SHOTS.find(s => tt >= s.from && tt < s.to) || SHOTS[SHOTS.length - 1];
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const shot = shotAt(tt);
    const k = ease((tt - shot.from) / Math.max(0.001, shot.to - shot.from));
    const voice = VOICE(tt);
    return {
      t: tt,
      shot,
      index: SHOTS.indexOf(shot),
      zoom: lerp(shot.zoom[0], shot.zoom[1], k),
      pan: [lerp(0, shot.pan[0], k), lerp(0, shot.pan[1], k)],
      voice,
      mouth: shot.talk ? clamp((voice - 0.12) / 0.5, 0, 1) : 0
    };
  }

  window.KeanuScript = { ID, DURATION, CUTS, SHOTS, VOICE, stage, shotAt };
})();
