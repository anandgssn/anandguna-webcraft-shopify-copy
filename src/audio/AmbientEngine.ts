export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private nodes: ReturnType<AmbientEngine["createGraph"]> | null = null;
  private source: AudioBufferSourceNode | null = null;
  private running = false;
  private reverbBuffer: AudioBuffer | null = null;

  private transitionAmount = 0;
  private scrollSpeedAmount = 0;
  private scrollAccelAmount = 0;
  private pannerDriftPhase = 0;
  private pannerDriftElevationPhase = Math.PI * 0.37;
  private lastKineticsTick = performance.now();

  private walkingLfoTimer: ReturnType<typeof setInterval> | null = null;
  private walkingLfoPhase = 0;
  private lastWalkingTick = 0;

  private DEFAULTS = {
    masterOutput: 1,
    volume: 0.1,
    delayTime: 0.36,
    delayMix: 0.39,
    delayFeedback: 0.3,
    pannerAzimuth: 110,
    pannerElevation: 12,
    stereoWidth: 1.2,
    reverb: 0.38,
    walkingLfoRate: 0.05,
    walkingLfoDepth: 0.5,
    scrollWhooshIntensity: 1.07,
  };

  private EQ_CURVE = [
    ...Array(12).fill(2.5),
    ...Array(12).fill(1.9),
    ...Array(16).fill(1.2),
    ...Array(16).fill(-0.7),
    ...Array(16).fill(0.6),
    ...Array(16).fill(-3.3),
    ...Array(16).fill(-6.0),
    ...Array(24).fill(-6.5),
  ];

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.nodes = this.createGraph(this.ctx);
    this.applyDefaults(0);
  }

  async start(fadeTime = 0.8) {
    if (!this.ctx || !this.nodes || this.running) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const source = this.createNoiseSource(this.ctx);
    source.connect(this.nodes.sourceInput);
    source.start();
    this.source = source;
    const t = this.ctx.currentTime;
    this.nodes.finalMasterGain.gain.cancelScheduledValues(t);
    this.nodes.finalMasterGain.gain.setValueAtTime(0, t);
    this.nodes.finalMasterGain.gain.linearRampToValueAtTime(this.DEFAULTS.masterOutput, t + Math.max(0.01, fadeTime));
    this.running = true;
    this.updateWalkingLfoTimer();
  }

  stop(fadeTime = 0.35) {
    if (!this.ctx || !this.nodes || !this.running) return;
    const t = this.ctx.currentTime;
    this.running = false;
    this.stopWalkingLfo();
    this.nodes.finalMasterGain.gain.cancelScheduledValues(t);
    this.nodes.finalMasterGain.gain.setValueAtTime(this.nodes.finalMasterGain.gain.value, t);
    this.nodes.finalMasterGain.gain.linearRampToValueAtTime(0, t + Math.max(0.01, fadeTime));
    if (this.source) {
      try { this.source.stop(t + Math.max(0.02, fadeTime) + 0.03); } catch {}
      this.source = null;
    }
  }

  setTransitionAmount(amount: number, timeConstant = 0.04) {
    const clamped = Math.max(0, Math.min(1, amount));
    if (Math.abs(clamped - this.transitionAmount) < 0.0001) return;
    this.transitionAmount = clamped;
    this.applyVolume(timeConstant);
    this.applyDelayTime(timeConstant);
    this.applyDelayMix(timeConstant);
    this.applyStereoWidth(timeConstant);
    this.applyReverbMix(timeConstant);
    this.applyTransitionTone(timeConstant);
    this.applyAirBus(timeConstant);
    this.applySaturation(timeConstant);
    this.advanceDriftPhase();
    this.applyPannerPosition(timeConstant);
  }

  setScrollKinetics(vel: number, accel: number, timeConstant = 0.04) {
    const speed = Math.max(0, Math.min(1, Math.abs(vel) / 650));
    const a = Math.max(0, Math.min(1, Math.abs(accel) / 3200));
    if (Math.abs(speed - this.scrollSpeedAmount) < 0.0005 && Math.abs(a - this.scrollAccelAmount) < 0.0005) return;
    this.scrollSpeedAmount = speed;
    this.scrollAccelAmount = a;
    this.advanceDriftPhase();
    this.applyEq(timeConstant);
    this.applyAirBus(timeConstant);
    this.applySaturation(timeConstant);
    this.applyPannerPosition(timeConstant);
    this.applyStereoWidth(timeConstant);
    this.applyDelayMix(timeConstant);
    this.applyReverbMix(timeConstant);
  }

  private createNoiseSource(ctx: AudioContext) {
    const length = Math.floor(ctx.sampleRate * 30);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const fade = Math.floor(ctx.sampleRate * 0.01);
      for (let i = 0; i < fade; i++) {
        const t = i / fade;
        data[i] = data[i] * t + data[data.length - fade + i] * (1 - t);
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  private createGraph(ctx: AudioContext) {
    const sourceInput = ctx.createGain();
    const eqFilters: BiquadFilterNode[] = [];
    let current: AudioNode = sourceInput;
    for (let i = 0; i < 128; i++) {
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.Q.value = 1.5;
      filter.frequency.value = 20 * Math.pow(20000 / 20, i / 127);
      filter.gain.value = 0;
      current.connect(filter);
      current = filter;
      eqFilters.push(filter);
    }
    const masterGain = ctx.createGain();
    current.connect(masterGain);

    const delayDryGain = ctx.createGain();
    const delayNode = ctx.createDelay(2);
    const delayFeedback = ctx.createGain();
    const delayGain = ctx.createGain();
    const delayMerge = ctx.createGain();
    masterGain.connect(delayDryGain); delayDryGain.connect(delayMerge);
    masterGain.connect(delayNode); delayNode.connect(delayFeedback); delayFeedback.connect(delayNode);
    delayNode.connect(delayGain); delayGain.connect(delayMerge);

    const pannerNode = ctx.createPanner();
    pannerNode.panningModel = "HRTF";
    pannerNode.distanceModel = "inverse";
    pannerNode.refDistance = 1;
    pannerNode.maxDistance = 10000;
    pannerNode.rolloffFactor = 0;
    pannerNode.coneInnerAngle = 360;
    delayMerge.connect(pannerNode);

    const stereoWidthNode = ctx.createGain();
    pannerNode.connect(stereoWidthNode);

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass"; highpass.frequency.value = 35; highpass.Q.value = 0.7;
    stereoWidthNode.connect(highpass);

    const transitionToneFilter = ctx.createBiquadFilter();
    transitionToneFilter.type = "lowpass"; transitionToneFilter.frequency.value = 20000; transitionToneFilter.Q.value = 0.7;
    highpass.connect(transitionToneFilter);

    const saturationDrive = ctx.createGain(); saturationDrive.gain.value = 1.2;
    const waveShaper = ctx.createWaveShaper();
    waveShaper.curve = this.makeDistortionCurve(1.8);
    waveShaper.oversample = "4x";
    const saturationTrim = ctx.createGain(); saturationTrim.gain.value = 0.88;
    transitionToneFilter.connect(saturationDrive); saturationDrive.connect(waveShaper); waveShaper.connect(saturationTrim);

    const masterGain2 = ctx.createGain();
    saturationTrim.connect(masterGain2);

    const comp1 = ctx.createDynamicsCompressor();
    comp1.threshold.value = -26; comp1.knee.value = 28; comp1.ratio.value = 2.5; comp1.attack.value = 0.01; comp1.release.value = 0.2;
    masterGain2.connect(comp1);
    const comp2 = ctx.createDynamicsCompressor();
    comp2.threshold.value = -9; comp2.knee.value = 0; comp2.ratio.value = 12; comp2.attack.value = 0.001; comp2.release.value = 0.08;
    comp1.connect(comp2);
    const comp3 = ctx.createDynamicsCompressor();
    comp3.threshold.value = -2; comp3.knee.value = 0; comp3.ratio.value = 20; comp3.attack.value = 0.0003; comp3.release.value = 0.04;
    comp2.connect(comp3);

    const dryGain = ctx.createGain();
    const convolver = ctx.createConvolver();
    const reverbGain = ctx.createGain();
    const earlyReflectionDelay = ctx.createDelay(0.25); earlyReflectionDelay.delayTime.value = 0.048;
    const earlyReflectionGain = ctx.createGain(); earlyReflectionGain.gain.value = 0.1;

    const airHighpass = ctx.createBiquadFilter(); airHighpass.type = "highpass"; airHighpass.frequency.value = 2200; airHighpass.Q.value = 0.7;
    const airLowpass = ctx.createBiquadFilter(); airLowpass.type = "lowpass"; airLowpass.frequency.value = 9000; airLowpass.Q.value = 0.7;
    const airGain = ctx.createGain(); airGain.gain.value = 0;

    const finalMix = ctx.createGain();
    comp3.connect(dryGain); dryGain.connect(finalMix);
    comp3.connect(convolver); convolver.connect(reverbGain); reverbGain.connect(finalMix);
    comp3.connect(earlyReflectionDelay); earlyReflectionDelay.connect(earlyReflectionGain); earlyReflectionGain.connect(finalMix);
    comp3.connect(airHighpass); airHighpass.connect(airLowpass); airLowpass.connect(airGain); airGain.connect(finalMix);

    const finalMasterGain = ctx.createGain();
    finalMix.connect(finalMasterGain);
    finalMasterGain.connect(ctx.destination);

    return {
      sourceInput, eqFilters, masterGain, delayDryGain, delayNode, delayFeedback, delayGain,
      pannerNode, stereoWidthNode, transitionToneFilter, saturationDrive, saturationTrim,
      dryGain, convolver, reverbGain, earlyReflectionGain, airHighpass, airLowpass, airGain,
      finalMasterGain,
    };
  }

  private makeDistortionCurve(amount: number) {
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  private generateImpulseResponse(sampleRate: number) {
    const duration = 4.8;
    const decay = 4.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx!.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / (length - 1);
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - 0.32 * t);
      }
    }
    return buffer;
  }

  private applyDefaults(tc: number) {
    if (!this.ctx || !this.nodes) return;
    if (!this.reverbBuffer) {
      this.reverbBuffer = this.generateImpulseResponse(this.ctx.sampleRate);
      this.nodes.convolver.buffer = this.reverbBuffer;
    }
    this.applyVolume(tc); this.applyDelayTime(tc); this.applyDelayMix(tc);
    this.applyDelayFeedback(tc); this.applyStereoWidth(tc); this.applyReverbMix(tc);
    this.applyTransitionTone(tc); this.applyAirBus(tc); this.applySaturation(tc);
    this.applyPannerPosition(tc); this.applyEq(tc);
  }

  private setParam(param: AudioParam, val: number, tc: number) {
    if (tc > 0) param.setTargetAtTime(val, this.ctx!.currentTime, tc);
    else param.setValueAtTime(val, this.ctx!.currentTime);
  }

  private transitionProfile() {
    const e = this.transitionAmount;
    return {
      suction: Math.exp(-Math.pow((e - 0.16) / 0.12, 2)),
      crossing: Math.exp(-Math.pow((e - 0.5) / 0.09, 2)),
      settle: Math.max(0, Math.min(1, (e - 0.56) / (0.95 - 0.56))),
      depth: 1 - Math.pow(1 - e, 2.2),
    };
  }

  private motionProfile() {
    const speed = this.scrollSpeedAmount;
    const accel = this.scrollAccelAmount;
    const rush = Math.max(0, Math.min(1, speed * 0.62 + accel * 0.92));
    return { speed, accel, rush, wetDuck: rush * 0.12, depth: Math.max(0, Math.min(1, speed * 0.5 + accel * 0.35)) };
  }

  private applyVolume(tc: number) {
    const t = this.transitionProfile();
    const val = Math.max(0, Math.min(0.5, this.DEFAULTS.volume - t.suction * 0.006 - t.crossing * 0.012 - t.settle * 0.01));
    this.setParam(this.nodes!.masterGain.gain, val, tc);
  }

  private applyDelayTime(tc: number) {
    const t = this.transitionProfile();
    const r = this.motionProfile();
    const val = Math.max(0.05, Math.min(2, this.DEFAULTS.delayTime + t.suction * 0.025 + t.crossing * 0.05 + t.settle * 0.06 + r.rush * 0.03));
    this.setParam(this.nodes!.delayNode.delayTime, val, tc);
  }

  private applyDelayMix(tc: number) {
    const t = this.transitionProfile();
    const r = this.motionProfile();
    const mix = Math.max(0, Math.min(1, this.DEFAULTS.delayMix + t.crossing * 0.08 + t.settle * 0.11 + r.rush * 0.04));
    const ducked = Math.max(0, Math.min(1, mix * (1 - r.wetDuck)));
    this.setParam(this.nodes!.delayGain.gain, ducked, tc);
    this.setParam(this.nodes!.delayDryGain.gain, 1 - ducked, tc);
  }

  private applyDelayFeedback(tc: number) {
    this.setParam(this.nodes!.delayFeedback.gain, this.DEFAULTS.delayFeedback, tc);
  }

  private applyStereoWidth(tc: number) {
    const t = this.transitionProfile();
    const r = this.motionProfile();
    const val = Math.max(1, Math.min(2, this.DEFAULTS.stereoWidth + t.crossing * 0.04 + t.settle * 0.07 + r.speed * 0.05));
    this.setParam(this.nodes!.stereoWidthNode.gain, 1 + (val - 1) * 0.2, tc);
  }

  private applyReverbMix(tc: number) {
    const t = this.transitionProfile();
    const r = this.motionProfile();
    const mix = Math.max(0, Math.min(1, this.DEFAULTS.reverb + t.crossing * 0.1 + t.settle * 0.16 + r.depth * 0.02));
    const ducked = Math.max(0, Math.min(1, mix * (1 - r.wetDuck * 1.2)));
    this.setParam(this.nodes!.reverbGain.gain, ducked * 1.5, tc);
    this.setParam(this.nodes!.dryGain.gain, 1 - ducked * 0.72, tc);
    this.setParam(this.nodes!.earlyReflectionGain.gain, 0.075 + r.depth * 0.07 + r.rush * 0.05, tc);
  }

  private applyTransitionTone(tc: number) {
    const t = this.transitionProfile();
    this.setParam(this.nodes!.transitionToneFilter.frequency, 19000 - t.depth * 13200 - t.crossing * 2600, tc);
    this.setParam(this.nodes!.transitionToneFilter.Q, 0.7 + t.crossing * 0.7, tc);
  }

  private applyAirBus(tc: number) {
    const t = this.motionProfile();
    const r = this.transitionProfile();
    const gain = Math.max(0, Math.min(0.42, (t.rush * 0.12 + t.accel * 0.07 + r.crossing * 0.035) * this.DEFAULTS.scrollWhooshIntensity));
    this.setParam(this.nodes!.airGain.gain, gain, tc);
    this.setParam(this.nodes!.airHighpass.frequency, 1900 + t.speed * 800 + t.accel * 400, tc);
    this.setParam(this.nodes!.airLowpass.frequency, 8800 + t.speed * 2600, tc);
  }

  private applySaturation(tc: number) {
    const t = this.transitionProfile();
    const r = this.motionProfile();
    this.setParam(this.nodes!.saturationDrive.gain, 1.2 + t.crossing * 0.55 + r.accel * 0.35, tc);
    this.setParam(this.nodes!.saturationTrim.gain, Math.max(0.7, Math.min(1, 0.92 - t.crossing * 0.08 - r.accel * 0.04)), tc);
  }

  private advanceDriftPhase() {
    const dt = Math.max(0, Math.min(0.08, (performance.now() - this.lastKineticsTick) / 1000));
    this.lastKineticsTick = performance.now();
    const t = this.motionProfile();
    const r = this.transitionProfile();
    const speed = 0.08 + t.speed * 0.22 + r.settle * 0.05;
    this.pannerDriftPhase += dt * speed * Math.PI * 2;
    this.pannerDriftElevationPhase += dt * (speed * 0.63) * Math.PI * 2;
  }

  private applyPannerPosition(tc: number) {
    const t = this.motionProfile();
    const r = this.transitionProfile();
    const az = this.DEFAULTS.pannerAzimuth + Math.sin(this.pannerDriftPhase) * (1.8 + r.settle * 4 + t.speed * 3.2);
    const el = this.DEFAULTS.pannerElevation + Math.sin(this.pannerDriftElevationPhase) * (0.75 + r.crossing * 1.8 + t.speed * 1.3);
    const azRad = (az * Math.PI) / 180;
    const elRad = (el * Math.PI) / 180;
    const x = Math.sin(azRad) * Math.cos(elRad);
    const y = Math.sin(elRad);
    const z = Math.cos(azRad) * Math.cos(elRad);
    const p = this.nodes!.pannerNode;
    if (p.positionX) {
      this.setParam(p.positionX, x, tc);
      this.setParam(p.positionY, y, tc);
      this.setParam(p.positionZ, z, tc);
    } else {
      p.setPosition(x, y, z);
    }
  }

  private applyEq(tc: number) {
    const active = this.running && this.DEFAULTS.walkingLfoDepth > 0.001;
    const r = this.motionProfile();
    for (let i = 0; i < 128; i++) {
      let val = this.EQ_CURVE[i] || 0;
      if (active) {
        val += Math.sin(this.walkingLfoPhase + (i / 128) * Math.PI * 6) * this.DEFAULTS.walkingLfoDepth;
      }
      let whoosh = 0;
      if (r.rush > 0.0001) {
        if (i >= 40 && i <= 55) whoosh = r.rush * this.DEFAULTS.scrollWhooshIntensity * 0.85;
        else if (i >= 56 && i <= 71) whoosh = r.rush * this.DEFAULTS.scrollWhooshIntensity * 1.22;
        else if (i >= 72 && i <= 79) whoosh = r.rush * this.DEFAULTS.scrollWhooshIntensity * 0.42;
      }
      val += whoosh;
      this.setParam(this.nodes!.eqFilters[i].gain, Math.max(-15, Math.min(15, val)), tc);
    }
  }

  private updateWalkingLfoTimer() {
    if (this.running) {
      if (this.walkingLfoTimer !== null) return;
      this.lastWalkingTick = performance.now();
      this.walkingLfoTimer = setInterval(() => {
        const now = performance.now();
        const dt = Math.max(0, (now - this.lastWalkingTick) / 1000);
        this.lastWalkingTick = now;
        this.walkingLfoPhase += dt * this.DEFAULTS.walkingLfoRate * Math.PI * 2;
        this.applyEq(0.04);
      }, 50);
    } else {
      this.stopWalkingLfo();
      this.applyEq(0.04);
    }
  }

  private stopWalkingLfo() {
    if (this.walkingLfoTimer !== null) {
      clearInterval(this.walkingLfoTimer);
      this.walkingLfoTimer = null;
    }
  }
}
