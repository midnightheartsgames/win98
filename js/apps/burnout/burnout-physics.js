/**
 * Burnout: Championship Drag Racing - Physics & Simulation Engine
 * Simulates quarter-mile drag racing, engine torque/HP curves, tire temperature & grip,
 * 4-speed transmission, staging sensor beams, Christmas Tree timing, and telemetry logging.
 */

class BurnoutPhysics {
  constructor(audio) {
    this.audio = audio;

    // Track configuration (in feet)
    this.TRACK = {
      WATER_BOX_START: -80,
      WATER_BOX_END: -25,
      PRE_STAGE: -8,
      STAGE: 0,
      D60: 60,
      D330: 330,
      D660: 660,   // 1/8 Mile
      D1000: 1000,
      D1320: 1320, // 1/4 Mile
      SHUTOFF: 2600
    };

    // Default car setup & specs
    this.setup = {
      carName: '1969 Chevy Chevelle SS 540 Blown',
      engineCID: 540,
      baseHP: 1650,
      baseTorque: 1350,
      revLimiter: 8200,
      idleRpm: 1100,
      launchRpm: 5500,
      blowerBoostPsi: 24, // 15 to 35
      tirePressurePsi: 16, // 12 to 22
      tireCompound: 'Soft Slicks',
      wheelieBarHeight: 'Medium', // Low, Medium, High
      nitrousShotHP: 250,
      hasNitrous: true,
      gearRatios: [2.65, 1.85, 1.34, 1.00], // 1st, 2nd, 3rd, 4th
      finalDrive: 4.10,
      weightLbs: 2750
    };

    // Race state
    // 'BURNOUT' -> 'STAGING' -> 'COUNTDOWN' -> 'RACING' -> 'FINISHED'
    this.state = 'BURNOUT';
    this.treeState = {
      preStagePlayer: false,
      stagePlayer: false,
      preStageRival: false,
      stageRival: false,
      amber1: false,
      amber2: false,
      amber3: false,
      green: false,
      redPlayer: false,
      redRival: false,
      countdownTimer: 0
    };

    // Race mode ('race' vs AI, 'test' solo)
    this.gameMode = 'race';

    // Player car dynamics
    this.player = this.createCarState('player', -60);

    // AI Rival car dynamics
    this.rival = this.createCarState('rival', -60);
    this.rival.isAI = true;
    this.rival.targetReactionTime = 0.45 + Math.random() * 0.12;
    this.rival.shiftRpm = 7500 + Math.random() * 300;
    this.rival.targetET = 6.85 + Math.random() * 0.4;

    // Time slip records
    this.timeSlip = null;
    this.reactionTimePlayer = 0;
    this.reactionTimeRival = 0;
    this.greenTimestamp = 0;
    this.raceStartTime = 0;
  }

  createCarState(id, startPos = -60) {
    return {
      id: id,
      pos: startPos,       // Distance in feet along strip
      speedFps: 0,        // Feet per second (1 MPH = 1.4667 FPS)
      speedMph: 0,
      rpm: 1100,
      gear: 1,            // 1 to 4
      clutch: false,       // false = engaged, true = disengaged
      throttle: 0,        // 0.0 to 1.0
      brake: 0,           // 0.0 to 1.0
      lineLock: false,    // Burnout brake
      nitrousActive: false,
      nitrousRemaining: 100, // percentage
      parachuteDeployed: false,
      tireTemp: 85,       // °F (ambient)
      tireGrip: 0.85,     // dynamic friction coefficient
      wheelieAngle: 0,    // degrees of front wheel lift
      squat: 0,           // rear suspension compression
      burnoutSmoke: 0,    // 0.0 to 1.0 smoke intensity
      isStaged: false,
      isFoul: false,
      hasFinished: false,

      // Sensor telemetry times (seconds from green)
      times: {
        rt: null,
        t60: null,
        t330: null,
        t660: null,
        mph660: null,
        t1000: null,
        t1320: null,
        mph1320: null
      }
    };
  }

  resetRace(gameMode = 'race') {
    this.gameMode = gameMode; // 'race' (vs AI) or 'test' (solo)
    this.state = 'BURNOUT';
    this.treeState = {
      preStagePlayer: false,
      stagePlayer: false,
      preStageRival: false,
      stageRival: false,
      amber1: false,
      amber2: false,
      amber3: false,
      green: false,
      redPlayer: false,
      redRival: false,
      countdownTimer: 0
    };

    this.player = this.createCarState('player', -60);
    this.rival = this.createCarState('rival', -60);
    this.rival.isAI = true;

    // AI config
    this.rival.targetReactionTime = 0.44 + Math.random() * 0.14; // 0.44s to 0.58s
    this.rival.shiftRpm = 7500 + Math.random() * 300;
    this.rival.targetET = 6.85 + Math.random() * 0.5;

    this.timeSlip = null;
    this.greenTimestamp = 0;
    this.raceStartTime = 0;
  }

  update(dt) {
    // 1. Update Christmas Tree logic
    this.updateTree(dt);

    // 2. Update Player Car Physics
    this.updateCarPhysics(this.player, dt);

    // 3. Update AI Rival Car Physics
    if (this.gameMode === 'race') {
      this.updateRivalAI(this.rival, dt);
      this.updateCarPhysics(this.rival, dt);
    }

    // 4. Update Staging Beams
    this.updateStagingBeams();

    // 5. Update Audio
    if (this.audio) {
      this.audio.updateEngine(
        this.player.rpm,
        this.player.throttle,
        this.player.lineLock && this.player.throttle > 0.3,
        this.player.nitrousActive
      );
    }

    // 6. Check Race Finish
    if (this.state === 'RACING') {
      if (this.player.hasFinished && (this.gameMode === 'test' || this.rival.hasFinished)) {
        this.finishRace();
      }
    }
  }

  updateStagingBeams() {
    // Player sensor checks
    this.treeState.preStagePlayer = (this.player.pos >= this.TRACK.PRE_STAGE && this.player.pos < this.TRACK.STAGE);
    this.treeState.stagePlayer = (this.player.pos >= this.TRACK.STAGE && this.player.pos <= this.TRACK.STAGE + 2.5);

    // Rival sensor checks
    this.treeState.preStageRival = (this.rival.pos >= this.TRACK.PRE_STAGE && this.rival.pos < this.TRACK.STAGE);
    this.treeState.stageRival = (this.rival.pos >= this.TRACK.STAGE && this.rival.pos <= this.TRACK.STAGE + 2.5);

    // Transition from BURNOUT to STAGING once player moves past burnout area
    if (this.state === 'BURNOUT') {
      if (this.player.pos > this.TRACK.WATER_BOX_END) {
        this.state = 'STAGING';
        this.rival.lineLock = false;
      }
    }

    // When both cars are staged, initiate Christmas tree countdown
    if (this.state === 'STAGING') {
      const playerReady = this.treeState.stagePlayer;
      const rivalReady = (this.gameMode === 'test') ? true : this.treeState.stageRival;

      if (playerReady && rivalReady && this.player.speedMph < 1.5 && (this.gameMode === 'test' || this.rival.speedMph < 1.5)) {
        this.startCountdown();
      }
    }
  }

  startCountdown() {
    this.state = 'COUNTDOWN';
    this.treeState.countdownTimer = 0;
    this.treeState.amber1 = false;
    this.treeState.amber2 = false;
    this.treeState.amber3 = false;
    this.treeState.green = false;
    this.treeState.redPlayer = false;
    this.treeState.redRival = false;
  }

  updateTree(dt) {
    if (this.state === 'COUNTDOWN') {
      this.treeState.countdownTimer += dt;
      const t = this.treeState.countdownTimer;

      // Sportsman 0.500-second step tree
      if (t >= 0.5 && !this.treeState.amber1) {
        this.treeState.amber1 = true;
        if (this.audio) this.audio.playTreeAmber();
      }
      if (t >= 1.0 && !this.treeState.amber2) {
        this.treeState.amber2 = true;
        if (this.audio) this.audio.playTreeAmber();
      }
      if (t >= 1.5 && !this.treeState.amber3) {
        this.treeState.amber3 = true;
        if (this.audio) this.audio.playTreeAmber();
      }
      if (t >= 2.0 && !this.treeState.green) {
        this.treeState.green = true;
        this.greenTimestamp = performance.now();
        this.state = 'RACING';
        if (this.audio) this.audio.playTreeGreen();
      }

      // Check for FOUL / False start before green light!
      if (!this.treeState.green) {
        if (this.player.pos > this.TRACK.STAGE + 1.2 && !this.player.isFoul) {
          this.player.isFoul = true;
          this.treeState.redPlayer = true;
          this.player.times.rt = -Math.max(0.01, (2.0 - t));
          if (this.audio) this.audio.playTreeFoul();
        }
      }
    }
  }

  updateCarPhysics(car, dt) {
    const isPlayer = (car.id === 'player');

    // 1. Tire Temperature & Grip Model
    if (car.lineLock && car.throttle > 0.2) {
      // Burnout tire heating
      const heatRate = 60 * car.throttle; // up to +60°F per sec
      car.tireTemp = Math.min(320, car.tireTemp + heatRate * dt);
      car.burnoutSmoke = Math.min(1.0, car.burnoutSmoke + 1.8 * dt);
    } else {
      // Natural tire cooling towards ambient (85°F)
      car.tireTemp -= (car.tireTemp - 85) * 0.04 * dt;
      car.burnoutSmoke = Math.max(0, car.burnoutSmoke - 2.5 * dt);
    }

    // Optimal tire temperature: 190°F - 235°F
    if (car.tireTemp < 140) {
      car.tireGrip = 0.80; // cold tires slide
    } else if (car.tireTemp < 185) {
      car.tireGrip = 0.95; // warming up
    } else if (car.tireTemp <= 235) {
      car.tireGrip = 1.15; // peak sweet spot!
    } else {
      car.tireGrip = 0.82; // overheated / greasy
    }

    // Pressure adjustment (optimal is ~15-17 PSI)
    const psiDiff = Math.abs(this.setup.tirePressurePsi - 16);
    car.tireGrip -= (psiDiff * 0.015);

    // 2. Engine RPM & Torque Calculation
    const effectiveBoost = this.setup.blowerBoostPsi;
    let currentHP = this.setup.baseHP * (1 + (effectiveBoost - 15) * 0.025);
    if (car.nitrousActive && car.nitrousRemaining > 0) {
      currentHP += this.setup.nitrousShotHP;
      car.nitrousRemaining = Math.max(0, car.nitrousRemaining - 18 * dt);
    }

    const currentGearRatio = this.setup.gearRatios[car.gear - 1] || 1.0;
    const totalGearRatio = currentGearRatio * this.setup.finalDrive;
    const tireCircumferenceFeet = 7.85; // ~30 inch drag slick

    // Calculate vehicle wheel speed in RPM
    const wheelRpm = (car.speedFps / tireCircumferenceFeet) * 60;
    const driveRpm = wheelRpm * totalGearRatio;

    // RPM dynamics
    if (car.lineLock) {
      // Line lock burnout revving
      const targetRpm = this.setup.idleRpm + (this.setup.revLimiter - this.setup.idleRpm) * car.throttle;
      car.rpm += (targetRpm - car.rpm) * 12 * dt;
      car.speedFps = 0;
    } else if (this.state === 'COUNTDOWN' && car.pos <= 0.5) {
      // Launch limiter / 2-step
      const targetLaunchRpm = this.setup.launchRpm * car.throttle + this.setup.idleRpm * (1 - car.throttle);
      car.rpm += (targetLaunchRpm - car.rpm) * 15 * dt;
    } else if (car.speedFps < 5 && car.gear === 1 && car.throttle > 0) {
      // Launch slip phase
      car.rpm += ((this.setup.revLimiter * 0.85) - car.rpm) * 10 * dt;
    } else {
      // Coupled to drivetrain with slip allowance
      const coupledRpm = Math.max(this.setup.idleRpm, driveRpm);
      car.rpm += (coupledRpm - car.rpm) * 16 * dt;
    }

    // Enforce rev limiter
    if (car.rpm > this.setup.revLimiter) {
      car.rpm = this.setup.revLimiter - 150;
      if (this.audio && isPlayer && Math.random() < 0.2) {
        this.audio.playBackfire();
      }
    }

    // 3. Acceleration & Traction Force
    // Force = (Torque * GearRatio) / TireRadius
    const rpmFactor = Math.sin((car.rpm / this.setup.revLimiter) * Math.PI);
    const engineTorque = this.setup.baseTorque * Math.max(0.6, rpmFactor);
    const driveForceLbf = (engineTorque * totalGearRatio) / 1.25;

    // Traction limit = Weight * Grip
    const normalForce = this.setup.weightLbs;
    const maxTractionForce = normalForce * car.tireGrip;

    let appliedTraction = Math.min(driveForceLbf * car.throttle, maxTractionForce);

    // Wheelie & squat effect
    if (car.throttle > 0.7 && car.speedMph < 60) {
      const wheelieMult = this.setup.wheelieBarHeight === 'High' ? 1.4 : (this.setup.wheelieBarHeight === 'Medium' ? 1.0 : 0.6);
      car.wheelieAngle = Math.min(18 * wheelieMult, (appliedTraction / 400));
      car.squat = Math.min(1.0, appliedTraction / 1800);
    } else {
      car.wheelieAngle = Math.max(0, car.wheelieAngle - 25 * dt);
      car.squat = Math.max(0, car.squat - 3 * dt);
    }

    // Resistance forces
    // Aero drag = 0.5 * rho * Cd * A * v^2
    const airDrag = 0.0016 * car.speedFps * car.speedFps;
    const chuteDrag = car.parachuteDeployed ? (0.012 * car.speedFps * car.speedFps) : 0;
    const brakeForce = car.brake * 3500;

    // Net acceleration: a = F / m (m = lbs / 32.174)
    const massSlugs = this.setup.weightLbs / 32.174;
    let netForce = (appliedTraction - airDrag - chuteDrag - brakeForce);

    if (this.state === 'BURNOUT' && !car.lineLock && car.pos < this.TRACK.WATER_BOX_END) {
      // Limit speed in water box
      netForce = Math.min(netForce, 600);
    }

    let accelFps2 = netForce / massSlugs;

    if (car.lineLock) {
      accelFps2 = 0;
      car.speedFps = 0;
    }

    car.speedFps = Math.max(0, car.speedFps + accelFps2 * dt);
    car.speedMph = car.speedFps * 0.681818;
    car.pos += car.speedFps * dt;

    // 4. Record Sensors & Timing in RACING state
    if (this.state === 'RACING') {
      const now = performance.now();
      const elapsed = (now - this.greenTimestamp) / 1000;

      // Reaction time (at start line crossover or first movement)
      if (car.times.rt === null) {
        if (car.pos >= this.TRACK.STAGE + 0.3) {
          car.times.rt = elapsed;
          if (isPlayer) this.reactionTimePlayer = elapsed;
          else this.reactionTimeRival = elapsed;
        }
      }

      if (car.times.t60 === null && car.pos >= this.TRACK.D60) {
        car.times.t60 = elapsed;
      }
      if (car.times.t330 === null && car.pos >= this.TRACK.D330) {
        car.times.t330 = elapsed;
      }
      if (car.times.t660 === null && car.pos >= this.TRACK.D660) {
        car.times.t660 = elapsed;
        car.times.mph660 = car.speedMph;
      }
      if (car.times.t1000 === null && car.pos >= this.TRACK.D1000) {
        car.times.t1000 = elapsed;
      }
      if (car.times.t1320 === null && car.pos >= this.TRACK.D1320) {
        car.times.t1320 = elapsed;
        car.times.mph1320 = car.speedMph;
        car.hasFinished = true;
      }
    }
  }

  updateRivalAI(rival, dt) {
    if (this.state === 'BURNOUT') {
      // AI warms tires in water box then drives toward staging
      if (rival.pos < -36) {
        if (rival.tireTemp < 205) {
          rival.lineLock = true;
          rival.throttle = 0.85;
          rival.brake = 0;
        } else {
          rival.lineLock = false;
          rival.throttle = 0.40;
          rival.brake = 0;
        }
      } else {
        rival.lineLock = false;
        rival.throttle = 0.40;
        rival.brake = 0;
      }
    } else if (this.state === 'STAGING') {
      rival.lineLock = false;
      // Approach staging beams
      if (rival.pos < -8) {
        // Rolling forward from burnout box
        rival.throttle = 0.45;
        rival.brake = 0;
      } else if (rival.pos < this.TRACK.PRE_STAGE) {
        // Approaching pre-stage beam (-1.5)
        rival.throttle = 0.15;
        rival.brake = 0;
      } else if (rival.pos < this.TRACK.STAGE) {
        // Creeping between pre-stage and stage
        rival.throttle = 0.05;
        rival.brake = 0;
      } else {
        // Staged! Full stop inside stage beam
        rival.throttle = 0;
        rival.brake = 1.0;
        rival.speedFps = 0;
        rival.speedMph = 0;
        rival.pos = 0.3;
      }
    } else if (this.state === 'COUNTDOWN') {
      // Staged, revving engine on transbrake / 2-step
      rival.lineLock = false;
      rival.brake = 1.0;
      rival.speedFps = 0;
      rival.speedMph = 0;
      rival.pos = 0.3;
      rival.throttle = 0.75;
      rival.gear = 1;
    } else if (this.state === 'RACING') {
      rival.lineLock = false;
      const now = performance.now();
      const elapsed = (now - this.greenTimestamp) / 1000;

      if (elapsed < rival.targetReactionTime) {
        // Waiting for reaction time
        rival.brake = 1.0;
        rival.speedFps = 0;
        rival.speedMph = 0;
        rival.pos = 0.3;
        rival.throttle = 0.75;
      } else {
        // Launch and run!
        rival.brake = 0;
        rival.throttle = 1.0;

        // Auto shift for rival at shift RPM
        if (rival.rpm >= rival.shiftRpm && rival.gear < 4) {
          rival.gear++;
          rival.rpm *= 0.72;
        }

        // Rival nitrous boost in 2nd/3rd gear
        if (rival.pos > 250 && rival.pos < 1000 && rival.nitrousRemaining > 0) {
          rival.nitrousActive = true;
        } else {
          rival.nitrousActive = false;
        }

        // Deploy parachute and brake after finish line
        if (rival.pos >= this.TRACK.D1320 + 35) {
          rival.parachuteDeployed = true;
          rival.throttle = 0;
          rival.brake = 0.85;
        }
      }
    } else if (this.state === 'FINISHED') {
      rival.throttle = 0;
      rival.brake = 0.9;
      rival.parachuteDeployed = true;
    }
  }

  // Player Input Handlers
  setPlayerThrottle(val) {
    this.player.throttle = Math.max(0, Math.min(1.0, val));
  }

  setPlayerBrake(val) {
    this.player.brake = Math.max(0, Math.min(1.0, val));
  }

  setPlayerLineLock(val) {
    this.player.lineLock = !!val;
  }

  setPlayerNitrous(val) {
    this.player.nitrousActive = !!val && (this.player.nitrousRemaining > 0);
  }

  deployPlayerParachute() {
    if (this.player.pos >= this.TRACK.D660 && !this.player.parachuteDeployed) {
      this.player.parachuteDeployed = true;
      if (this.audio) this.audio.playChuteDeploy();
    }
  }

  shiftUp() {
    if (this.player.gear < 4) {
      this.player.gear++;
      this.player.rpm *= 0.70;
      if (this.audio) this.audio.playShiftClunk();
    }
  }

  shiftDown() {
    if (this.player.gear > 1) {
      this.player.gear--;
      this.player.rpm = Math.min(this.setup.revLimiter, this.player.rpm * 1.4);
      if (this.audio) this.audio.playShiftClunk();
    }
  }

  finishRace() {
    this.state = 'FINISHED';

    const p = this.player;
    const r = this.rival;

    let winner = 'player';
    if (p.isFoul) {
      winner = 'rival';
    } else if (r.isFoul) {
      winner = 'player';
    } else if (p.times.t1320 && r.times.t1320) {
      winner = (p.times.t1320 < r.times.t1320) ? 'player' : 'rival';
    }

    if (winner === 'player' && this.audio) {
      this.audio.playCrowdCheer();
    }

    // Build Time Slip
    this.timeSlip = {
      trackName: 'Bethesda Raceway Dragstrip, 1/4 Mile',
      date: new Date().toLocaleDateString('ru-RU') + ' 1998',
      player: {
        lane: 'LEFT',
        car: this.setup.carName,
        rt: p.times.rt ? p.times.rt.toFixed(3) : '0.000',
        t60: p.times.t60 ? p.times.t60.toFixed(3) : '---',
        t330: p.times.t330 ? p.times.t330.toFixed(3) : '---',
        t660: p.times.t660 ? p.times.t660.toFixed(3) : '---',
        mph660: p.times.mph660 ? p.times.mph660.toFixed(2) : '---',
        t1000: p.times.t1000 ? p.times.t1000.toFixed(3) : '---',
        t1320: p.times.t1320 ? p.times.t1320.toFixed(3) : '---',
        mph1320: p.times.mph1320 ? p.times.mph1320.toFixed(2) : '---',
        isWinner: (winner === 'player'),
        isFoul: p.isFoul
      },
      rival: {
        lane: 'RIGHT',
        car: '1970 Plymouth Hemi Cuda Pro Stock',
        rt: r.times.rt ? r.times.rt.toFixed(3) : '0.000',
        t60: r.times.t60 ? r.times.t60.toFixed(3) : '---',
        t330: r.times.t330 ? r.times.t330.toFixed(3) : '---',
        t660: r.times.t660 ? r.times.t660.toFixed(3) : '---',
        mph660: r.times.mph660 ? r.times.mph660.toFixed(2) : '---',
        t1000: r.times.t1000 ? r.times.t1000.toFixed(3) : '---',
        t1320: r.times.t1320 ? r.times.t1320.toFixed(3) : '---',
        mph1320: r.times.mph1320 ? r.times.mph1320.toFixed(2) : '---',
        isWinner: (winner === 'rival'),
        isFoul: r.isFoul
      }
    };
  }
}

window.BurnoutPhysics = BurnoutPhysics;

