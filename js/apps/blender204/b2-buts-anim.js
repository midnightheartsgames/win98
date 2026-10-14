(function (B) {
  'use strict';
  const COL = B.UI.COL;
  const L = B.Buts.LAYOUTS;
  const { frame, kit } = B.ButsKit;
  const rgb = B.rgb;

  L.anim = {
    w: 640, h: 92, X0: 195, Y0: 640,
    header(ctx, area, blk, x) {
      const ob = B.Buts.activeOb(ctx);
      x = Math.max(x, 546);
      if (!ob) return x;
      blk.col = COL.GREY;
      blk.tex('OB:', x - 10, 0, 140, 22, () => ob.name, v => { ctx.main.rename(ob, v); ctx.redrawAll(); }, 19, 'Active Object name');
      return x + 140;
    },
    build(ctx, blk) {
      const R = frame(195, 640, 92);
      const k = kit(ctx, blk, R);
      const ob = B.Buts.activeOb(ctx);
      if (!ob) return;
      const sce = ctx.scene;
      const tr = ['X', 'Y', 'Z', '-X', '-Y', '-Z'];
      tr.forEach((a, i) => k.row(R(203 + (i === 0 ? 0 : 23 + (i - 1) * 12), 645, (i === 0 ? 225 : 23 + i * 12 + 203 - 1), 652), (i === 0 ? 'Track' : '') + a, ob, 'trackflag', a, 'Specify the axis that points to another object'));
      ['X', 'Y', 'Z'].forEach((a, i) => k.row(R(290 + (i === 0 ? 0 : 18 + (i - 1) * 12), 645, i === 0 ? 307 : 290 + 18 + i * 12 - 1, 652), (i === 0 ? 'Up' : '') + a, ob, 'upflag', a, 'Specify the axis that points up'));
      k.tog(R(203, 656, 245, 663), 'Draw Key', ob.ipoflag, 'drawkey', 'Draw object as key position');
      k.tog(R(247, 656, 298, 663), 'DupliFrames', ob.transflag, 'dupliframes', 'Make copy of object for every frame');
      k.num(R(300, 656, 346, 663), 'DupSta:', ob, 'dupsta', 1, 17999, 1, 0, 'Specify startframe for Duplicates');
      k.num(R(348, 656, 392, 663), 'DupEnd', ob, 'dupend', 1, 18000, 1, 0, 'Specify endframe for Duplicates');
      k.tog(R(395, 656, 440, 663), 'No Speed', ob.transflag, 'nospeed', 'Set dupliframes to still, regardless of frame');
      k.tog(R(203, 666, 241, 673), 'Draw Key Sel', ob.ipoflag, 'drawkeysel', 'Limit the drawing of object keys');
      k.tog(R(247, 666, 285, 673), 'DupliVerts', ob.transflag, 'dupliverts', 'Duplicate child objects on all vertices');
      k.tog(R(287, 666, 298, 673), 'Rot', ob.transflag, 'duplirot', 'Rotate dupli according to facenormal');
      k.num(R(300, 666, 346, 673), 'DupOn:', ob, 'dupon', 1, 1500, 1, 0, 'Specify the number of frames to use between DupOff frames');
      k.num(R(348, 666, 392, 673), 'DupOff', ob, 'dupoff', 0, 1500, 1, 0, 'Specify recurring frames to exclude from the Dupliframes');
      k.tog(R(395, 666, 440, 673), 'Powertrack', ob.transflag, 'powertrack', 'Extreme tracking');
      k.tog(R(203, 694, 232, 701), 'Offs Ob', ob.ipoflag, 'offsOb', 'Let the timeoffset work on its own objectipo');
      k.tog(R(233, 694, 261, 701), 'Offs Par', ob.ipoflag, 'offsPar', 'Let the timeoffset work on the parent');
      k.tog(R(262, 694, 291, 701), 'Offs Parti', ob.ipoflag, 'offsParti', 'Let the timeoffset work on the particle effect');
      k.tog(R(292, 694, 322, 701), 'SlowPar', ob, 'slowpar', 'Create a delay in the parent relationship');
      k.num(R(203, 712, 257, 725), 'TimeOffset:', ob, 'sf', -9000, 9000, 1, 2, 'Specify an offset in frames');
      k.tog(R(260, 712, 310, 725), 'Automatic Time', ob.transflag, 'autotime', 'Generate automatic timeoffset values for all selected frames', COL.SALMON);
      k.but(R(314, 712, 345, 725), 'PrSpeed', () => {}, 'Print objectspeed');
      blk.label('0.0000', ...R(316, 705, 343, 710)).textcol = rgb(255, 255, 255);
      k.num(R(349, 691, 396, 699), 'Map Old:', sce.r, 'maplen', 1, 900, 1, 0, 'Specify old map value in frames');
      k.num(R(398, 691, 445, 699), 'Map New:', sce.r, 'mapnew', 1, 900, 1, 0, 'Specify how many frames the Map Old will last');
      k.num(R(349, 703, 445, 711), 'AnimSpeed:', sce.r, 'framapto', 1, 50, 1, 0, 'Set the step for the frames');
      k.num(R(349, 714, 396, 728), 'Sta:', sce.r, 'sfra', 1, 18000, 1, 0, 'Specify the start frame of the animation');
      k.num(R(398, 714, 445, 728), 'End:', sce.r, 'efra', 1, 18000, 1, 0, 'Specify the end frame of the animation');
      if (ob.type === 'mesh') {
        k.but(R(464, 650, 520, 658), 'NEW Effect', () => {
          B.UI.pupmenu(ctx, 'Build %x0|Particles %x1|Wave %x2').then(v => {
            if (v == null || v < 0) return;
            ob.effects.forEach(e => { e.sel = false; });
            ob.effects.push(B.Effects.newEffect(['build', 'particles', 'wave'][v]));
            ctx.redrawAll();
          });
        }, 'Create a new effect', COL.SALMON);
        k.but(R(522, 650, 550, 658), 'Delete', () => { ob.effects = ob.effects.filter(e => !e.sel); ctx.redrawAll(); }, 'Delete the effect', COL.SALMON);
        const eff = ob.effects.find(e => e.sel) || ob.effects[0];
        ob.effects.forEach((e, i) => {
          const b = blk.tog(`Eff ${i + 1}`, ...R(552 + i * 24, 650, 574 + i * 24, 658), () => e === eff, () => {}, e.type);
          b.func = () => { ob.effects.forEach(x => { x.sel = x === e; }); ctx.redrawAll(); };
        });
        if (eff) {
          k.menu(R(464, 662, 520, 670), 'Build %x0|Particles %x1|Wave %x2', () => ['build', 'particles', 'wave'].indexOf(eff.type), v => { const ne = B.Effects.newEffect(['build', 'particles', 'wave'][v]); Object.keys(eff).forEach(kk => delete eff[kk]); Object.assign(eff, ne); }, 'Effect type');
          if (eff.type === 'build') {
            k.num(R(464, 676, 540, 684), 'Len:', eff, 'len', 1, 9000, 1, 0, 'Specify the total time the building requires');
            k.num(R(542, 676, 618, 684), 'Sfra:', eff, 'sfra', 1, 9000, 1, 0, 'Specify the startframe of the effect');
          } else if (eff.type === 'wave') {
            k.tog(R(464, 676, 490, 684), 'X', eff.flag, 'x', 'Enable X axis motion');
            k.tog(R(492, 676, 518, 684), 'Y', eff.flag, 'y', 'Enable Y axis motion');
            k.tog(R(520, 676, 546, 684), 'Cycl', eff.flag, 'cycl', 'Enable cyclic wave efefct');
            k.num(R(464, 688, 540, 696), 'Sta x:', eff, 'startx', -100, 100, 0.1, 2, 'Starting position for the X axis');
            k.num(R(542, 688, 618, 696), 'Sta y:', eff, 'starty', -100, 100, 0.1, 2, 'Starting position for the Y axis');
            k.num(R(464, 700, 540, 708), 'Speed:', eff, 'speed', -2, 2, 0.01, 3, 'Specify the wave speed');
            k.num(R(542, 700, 618, 708), 'Heigth:', eff, 'height', -2, 2, 0.01, 3, 'Specify the amplitude of the wave');
            k.num(R(464, 712, 540, 720), 'Width:', eff, 'width', 0, 5, 0.1, 3, 'Specify the width of the wave');
            k.num(R(542, 712, 618, 720), 'Narrow:', eff, 'narrow', 0, 10, 0.1, 3, 'Specify how narrow the wave follows');
            k.num(R(464, 724, 540, 732), 'Time sta:', eff, 'timeoffs', -1000, 1000, 1, 2, 'Specify startingframe of the wave');
            k.num(R(542, 724, 618, 732), 'Lifetime:', eff, 'lifetime', -1000, 1000, 1, 2, 'Specify the lifespan of the wave');
          } else {
            k.but(R(530, 662, 600, 670), 'RecalcAll', () => ctx.redrawAll(), 'Update the particle system');
            k.tog(R(602, 662, 640, 670), 'Static', eff.flag, 'static', 'Make static particles');
            k.num(R(464, 674, 540, 682), 'Tot:', eff, 'totpart', 1, 100000, 10, 0, 'Set the total number of particles');
            k.num(R(542, 674, 618, 682), 'Keys:', eff, 'totkey', 1, 32, 1, 0, 'Specify the number of key positions');
            k.num(R(464, 686, 540, 694), 'Sta:', eff, 'sta', -250, 9000, 1, 2, 'Specify the startframe');
            k.num(R(542, 686, 618, 694), 'End:', eff, 'end', 1, 9000, 1, 2, 'Specify the endframe');
            k.num(R(464, 698, 540, 706), 'Life:', eff, 'lifetime', 1, 9000, 1, 2, 'Specify the life span of the particles');
            k.num(R(542, 698, 618, 706), 'Randlife:', eff, 'randlife', 0, 2, 0.01, 3, 'Give the particlelife a random variation');
            k.num(R(464, 710, 540, 718), 'Norm:', eff, 'normfac', -2, 2, 0.01, 3, "Let the mesh give the particle a starting speed");
            k.num(R(542, 710, 618, 718), 'Rand:', eff, 'randfac', 0, 2, 0.01, 3, 'Give the startingspeed a random variation');
            k.num(R(464, 722, 540, 730), 'Damp:', eff, 'damp', 0, 1, 0.01, 3, 'Specify the damping factor');
            k.num(R(542, 722, 618, 730), 'Seed:', eff, 'seed', 0, 255, 1, 0, 'Set an offset in the random table');
            ['X', 'Y', 'Z'].forEach((a, i) => blk.num('Force' + a + ':', ...R(620 + 0, 674 + i * 12, 690, 682 + i * 12), () => eff.force[i], v => { eff.force[i] = v; }, -1, 1, 0.01, 3, 'Specify the force'));
          }
        }
      }
      blk.postDraw = () => {
        const r = blk.r;
        [460, 694].forEach(x => r.vline(blk.px(x - 195), blk.py(0), blk.py(92), rgb(0, 0, 0)));
      };
    }
  };
})(globalThis.B204 = globalThis.B204 || {});
