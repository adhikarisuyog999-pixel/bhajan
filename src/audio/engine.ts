/**
 * High-Fidelity Web Audio Synthesis & Mixing Engine
 * for Upbeat Nepali Devotional Folk-Pop Fusion
 */

export type InstrumentId = 'madal' | 'harmonium' | 'guitar' | 'flute' | 'vocals';

interface TrackNodes {
  gainNode: GainNode;
  panNode: StereoPannerNode;
  analyserNode: AnalyserNode;
  textureFilter: BiquadFilterNode;
}

export class NepaliStudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private bpm = 112;
  private currentStep = 0;
  private totalSteps = 64; // 4 bars of 16th notes
  private timerId: number | null = null;
  private nextStepTime = 0;
  private lookaheadMs = 25;
  private scheduleAheadSec = 0.1;

  // Master bus nodes
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private vocalPocketFilter: BiquadFilterNode | null = null;
  private masterLowShelf: BiquadFilterNode | null = null;
  private masterHighShelf: BiquadFilterNode | null = null;
  private trackNodes: Map<InstrumentId, TrackNodes> = new Map();

  // Vocal audio playback & recording
  private vocalAudioElement: HTMLAudioElement | null = null;
  private vocalMediaSource: MediaElementAudioSourceNode | null = null;
  private vocalSpaceDucking = true;

  // Listeners for UI state
  private onStepChangeCallbacks: Array<(step: number, currentTime: number) => void> = [];
  private onPlayStateChangeCallbacks: Array<(playing: boolean) => void> = [];

  // Track settings cache
  private volumes: Record<InstrumentId, number> = {
    madal: 0.88,
    harmonium: 0.8,
    guitar: 0.84,
    flute: 0.74,
    vocals: 0.95
  };

  private pans: Record<InstrumentId, number> = {
    madal: 0,
    harmonium: -0.25,
    guitar: 0.35,
    flute: 0.15,
    vocals: 0
  };

  private mutes: Record<InstrumentId, boolean> = {
    madal: false,
    harmonium: false,
    guitar: false,
    flute: false,
    vocals: false
  };

  private solos: Record<InstrumentId, boolean> = {
    madal: false,
    harmonium: false,
    guitar: false,
    flute: false,
    vocals: false
  };

  private textures: Record<InstrumentId, number> = {
    madal: 0.85,
    harmonium: 0.8,
    guitar: 0.9,
    flute: 0.8,
    vocals: 0.7
  };

  constructor() {
    // Lazy init on first user interaction to comply with Web Audio autoplay policies
  }

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Setup Master Chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.masterLowShelf = this.ctx.createBiquadFilter();
    this.masterLowShelf.type = 'lowshelf';
    this.masterLowShelf.frequency.value = 110;
    this.masterLowShelf.gain.value = 1.5; // Warm low-end warmth

    // Vocal Pocket EQ: Cuts 2.2kHz on the instrumental mix to let vocals cut through cleanly!
    this.vocalPocketFilter = this.ctx.createBiquadFilter();
    this.vocalPocketFilter.type = 'peaking';
    this.vocalPocketFilter.frequency.value = 2200;
    this.vocalPocketFilter.Q.value = 1.6;
    this.vocalPocketFilter.gain.value = this.vocalSpaceDucking ? -4.5 : 0;

    this.masterHighShelf = this.ctx.createBiquadFilter();
    this.masterHighShelf.type = 'highshelf';
    this.masterHighShelf.frequency.value = 7500;
    this.masterHighShelf.gain.value = 1.0; // Crisp studio sparkle

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 512;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Connect Master Chain
    this.vocalPocketFilter.connect(this.masterLowShelf);
    this.masterLowShelf.connect(this.masterHighShelf);
    this.masterHighShelf.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Setup Track Channels
    const trackIds: InstrumentId[] = ['madal', 'harmonium', 'guitar', 'flute', 'vocals'];
    for (const id of trackIds) {
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = this.getEffectiveVolume(id);

      const panNode = this.ctx.createStereoPanner();
      panNode.pan.value = this.pans[id];

      const textureFilter = this.ctx.createBiquadFilter();
      textureFilter.type = 'peaking';
      // Fine-tune texture frequency per instrument
      if (id === 'madal') {
        textureFilter.frequency.value = 1800; // skin slap snap
        textureFilter.gain.value = this.textures[id] * 4;
      } else if (id === 'harmonium') {
        textureFilter.frequency.value = 3200; // reed air buzz
        textureFilter.gain.value = this.textures[id] * 3.5;
      } else if (id === 'guitar') {
        textureFilter.frequency.value = 4200; // pick bite & string chime
        textureFilter.gain.value = this.textures[id] * 4;
      } else if (id === 'flute') {
        textureFilter.frequency.value = 5500; // bamboo breath chiff
        textureFilter.gain.value = this.textures[id] * 3;
      } else {
        textureFilter.frequency.value = 3000;
        textureFilter.gain.value = 0;
      }

      const analyserNode = this.ctx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserNode.smoothingTimeConstant = 0.75;

      panNode.connect(gainNode);
      gainNode.connect(textureFilter);
      textureFilter.connect(analyserNode);

      // Route: Vocals bypass the vocal pocket filter so vocals are NEVER ducked!
      if (id === 'vocals') {
        analyserNode.connect(this.masterLowShelf);
      } else {
        analyserNode.connect(this.vocalPocketFilter);
      }

      this.trackNodes.set(id, {
        gainNode,
        panNode,
        analyserNode,
        textureFilter
      });
    }
  }

  // --- Transport Controls ---
  public async play() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    // Start vocal audio if loaded
    if (this.vocalAudioElement && !this.mutes.vocals) {
      this.vocalAudioElement.currentTime = (this.currentStep / 16) * (60 / this.bpm);
      this.vocalAudioElement.play().catch(() => {});
    }

    this.timerId = window.setInterval(() => this.scheduler(), this.lookaheadMs);
    this.notifyPlayState(true);
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.vocalAudioElement) {
      this.vocalAudioElement.pause();
    }
    this.notifyPlayState(false);
  }

  public stop() {
    this.pause();
    this.currentStep = 0;
    if (this.vocalAudioElement) {
      this.vocalAudioElement.currentTime = 0;
    }
    this.notifyStep(0, 0);
  }

  public seek(step: number) {
    this.currentStep = Math.max(0, Math.min(step, this.totalSteps - 1));
    if (this.vocalAudioElement) {
      const stepDuration = 60 / this.bpm / 4;
      this.vocalAudioElement.currentTime = (this.currentStep * stepDuration) % (this.vocalAudioElement.duration || 1);
    }
    if (this.ctx) {
      this.nextStepTime = this.ctx.currentTime;
    }
    this.notifyStep(this.currentStep, this.getElapsedSeconds());
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(70, Math.min(180, newBpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getElapsedSeconds(): number {
    const stepDuration = 60 / this.bpm / 4;
    return this.currentStep * stepDuration;
  }

  // --- Scheduler & Pattern Player ---
  private scheduler() {
    if (!this.ctx) return;
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      const stepDuration = 60 / this.bpm / 4; // 16th note
      this.nextStepTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % this.totalSteps;
    }
  }

  private scheduleStep(step: number, time: number) {
    // Schedule instruments
    this.scheduleMadal(step, time);
    this.scheduleGuitar(step, time);
    this.scheduleHarmonium(step, time);
    this.scheduleFlute(step, time);

    // Notify UI (throttled)
    setTimeout(() => {
      this.notifyStep(step, this.getElapsedSeconds());
    }, Math.max(0, (time - (this.ctx?.currentTime || 0)) * 1000));
  }

  // --- Instrument Scheduling Logic ---

  /**
   * Authentic Nepali Madal Pattern:
   * Combines Bayan (Daa/Dhin bass) and Dayan (Tin/Ta ring + Kha slap)
   * Classic upbeat folk dadra / khemta syncopation (Daa - Ta - Tin - Kha - Daa - Daa - Tin - Ta)
   */
  private scheduleMadal(step: number, time: number) {
    if (this.isMuted('madal')) return;
    const sub = step % 16;
    const texture = this.textures.madal;

    // Upbeat Devotional Folk Groove:
    switch (sub) {
      case 0: // Strong Daa (Bass)
        this.playMadalHit('daa', time, 0.95);
        this.playMadalHit('tin', time, 0.75); // Open ring
        break;
      case 2: // Crisp Dayan Ta
        this.playMadalHit('ta', time, 0.7);
        break;
      case 4: // Chutki / Kha slap (muted folk accent)
        this.playMadalHit('kha', time, 0.85);
        break;
      case 6: // Dayan Tin ring
        this.playMadalHit('tin', time, 0.78);
        break;
      case 8: // Secondary Bayan Daa
        this.playMadalHit('daa', time, 0.88);
        break;
      case 10: // Syncopated double bass tap
        this.playMadalHit('daa', time, 0.65);
        this.playMadalHit('ta', time, 0.6);
        break;
      case 12: // Energetic Dayan Tin
        this.playMadalHit('tin', time, 0.82);
        break;
      case 14: // Quick Kha pickup
        this.playMadalHit('kha', time, 0.68 * texture);
        break;
      case 15: // Rapid micro-fill before bar
        if (step % 32 >= 28) {
          this.playMadalHit('ta', time, 0.6);
        }
        break;
    }
  }

  /**
   * Acoustic Rhythm Guitar:
   * 16th-note folk-pop acoustic strumming with percussive chucks and open chords
   */
  private scheduleGuitar(step: number, time: number) {
    if (this.isMuted('guitar')) return;
    const sub = step % 16;
    const bar = Math.floor(step / 16);

    // Chords: D Major -> G Major -> A Major -> D Major (or Bm)
    const chordRoots = [146.83, 196.00, 220.00, 146.83]; // D3, G3, A3, D3
    const root = chordRoots[bar % 4];

    // Strum pattern: Down, chuck, Up, Down, chuck, Up, etc.
    const isStrum = [0, 3, 6, 8, 10, 12, 14].includes(sub);
    const isChuck = [4, 12].includes(sub);

    if (isChuck) {
      this.playAcousticChuck(time, 0.65);
    } else if (isStrum) {
      const isDown = sub === 0 || sub === 8;
      const velocity = isDown ? 0.85 : 0.62;
      this.playGuitarStrum(root, time, velocity, isDown);
    }
  }

  /**
   * Traditional Harmonium:
   * Dual reed bellows sound playing uplifting devotional chords & lead motifs
   */
  private scheduleHarmonium(step: number, time: number) {
    if (this.isMuted('harmonium')) return;
    const sub = step % 16;
    const bar = Math.floor(step / 16);

    // D Major Bilawal / Bhairav devotional harmony
    // Bar 0: D Maj (D4, F#4, A4)
    // Bar 1: G Maj (D4, G4, B4)
    // Bar 2: A Maj (C#4, E4, A4)
    // Bar 3: D Maj (D4, F#4, A4)
    const chordFrequencies: number[][] = [
      [293.66, 369.99, 440.00], // D4, F#4, A4
      [293.66, 392.00, 493.88], // D4, G4, B4
      [277.18, 329.63, 440.00], // C#4, E4, A4
      [293.66, 369.99, 440.00]  // D4, F#4, A4
    ];

    // Play sustained chord at bar head and 8th notes with subtle bellows pump
    if (sub === 0 || sub === 8) {
      const chord = chordFrequencies[bar % 4];
      const duration = (60 / this.bpm / 4) * (sub === 0 ? 7 : 7);
      this.playHarmoniumChord(chord, time, 0.6, duration);
    }

    // Melodic ornaments (harkat/taan) on specific steps
    const ornamentNotes = [587.33, 554.37, 493.88, 440.00]; // D5, C#5, B4, A4
    if (sub === 6 || sub === 14) {
      const note = ornamentNotes[(bar * 2 + (sub > 8 ? 1 : 0)) % ornamentNotes.length];
      this.playHarmoniumReed(note, time, 0.45, 0.28);
    }
  }

  /**
   * Bansuri Flute:
   * Expressive airy bamboo flute counter-melodies with pitch meend and vibrato
   */
  private scheduleFlute(step: number, time: number) {
    if (this.isMuted('flute')) return;
    const sub = step % 16;
    const bar = Math.floor(step / 16);

    // Soaring devotional flute phrases (accenting call-and-response)
    // D5=587.33, E5=659.25, F#5=739.99, A5=880.00, B5=987.77, D6=1174.66
    const phrases: Record<number, number> = {
      4: 587.33,
      7: 739.99,
      11: 880.00,
      13: 739.99
    };

    if (bar % 2 === 1 && phrases[sub]) {
      const freq = phrases[sub];
      const duration = (60 / this.bpm / 4) * 2.2;
      this.playBansuriNote(freq, time, 0.58, duration);
    }
  }

  // --- Physical Synthesis Models for Nepali Instruments ---

  /**
   * Madal Drum Synthesis:
   * Bayan (left bass head): sliding sine oscillator + tuned bandpass + dough damping
   * Dayan (right head): high-Q metallic resonant wood ring + noise attack
   */
  public playMadalHit(type: 'daa' | 'tin' | 'ta' | 'kha' | 'dhin', time?: number, velocity = 0.8) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const hitTime = time ?? this.ctx.currentTime;
    const track = this.trackNodes.get('madal');
    if (!track) return;

    if (type === 'daa' || type === 'dhin') {
      // Bayan Bass Hit
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      // Pitch envelope: glides down from 145Hz to 68Hz (characteristic Nepali madal bass drop)
      osc.frequency.setValueAtTime(145, hitTime);
      osc.frequency.exponentialRampToValueAtTime(68, hitTime + 0.14);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, hitTime);
      filter.frequency.exponentialRampToValueAtTime(120, hitTime + 0.25);

      gain.gain.setValueAtTime(velocity * 0.9, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(track.panNode);

      osc.start(hitTime);
      osc.stop(hitTime + 0.3);
    }

    if (type === 'tin' || type === 'dhin') {
      // Dayan High Open Ring (Tuneful metallic ring of the iron-slag khari center)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const bandpass = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, hitTime); // Key tuned ring

      bandpass.type = 'bandpass';
      bandpass.frequency.value = 880;
      bandpass.Q.value = 12;

      gain.gain.setValueAtTime(velocity * 0.7, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.38);

      osc.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(track.panNode);

      osc.start(hitTime);
      osc.stop(hitTime + 0.4);
    }

    if (type === 'ta') {
      // Dayan Rim Slap (Crisp attack)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, hitTime);
      osc.frequency.exponentialRampToValueAtTime(260, hitTime + 0.05);

      gain.gain.setValueAtTime(velocity * 0.75, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.08);

      osc.connect(gain);
      gain.connect(track.panNode);

      osc.start(hitTime);
      osc.stop(hitTime + 0.09);
    }

    if (type === 'kha') {
      // Muted Palm Chuck / Chutki (Noise burst)
      const bufferSize = this.ctx.sampleRate * 0.06;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1750;
      filter.Q.value = 4;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(velocity * 0.55, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(track.panNode);

      noise.start(hitTime);
      noise.stop(hitTime + 0.06);
    }
  }

  /**
   * Acoustic Guitar Strum Model:
   * Multi-string simulation with 8ms humanized string dispersion and acoustic body resonance
   */
  private playGuitarStrum(rootFreq: number, time: number, velocity: number, isDown: boolean) {
    if (!this.ctx) return;
    const track = this.trackNodes.get('guitar');
    if (!track) return;

    // Standard acoustic intervals: Root, 5th, Octave, 10th (3rd high)
    const ratios = [1.0, 1.498, 2.0, 2.52];
    const stringDelay = 0.008; // 8ms between strings

    ratios.forEach((ratio, idx) => {
      if (!this.ctx) return;
      const stringIdx = isDown ? idx : (ratios.length - 1 - idx);
      const strTime = time + stringIdx * stringDelay;
      const freq = rootFreq * ratio;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const bodyFilter = this.ctx.createBiquadFilter();

      // Plucked acoustic string tone (blend of saw and triangle)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, strTime);

      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(3200, strTime);
      bodyFilter.frequency.exponentialRampToValueAtTime(750, strTime + 0.35);

      gain.gain.setValueAtTime(velocity * 0.22, strTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, strTime + 0.45);

      osc.connect(bodyFilter);
      bodyFilter.connect(gain);
      gain.connect(track.panNode);

      osc.start(strTime);
      osc.stop(strTime + 0.5);
    });
  }

  private playAcousticChuck(time: number, velocity: number) {
    if (!this.ctx) return;
    const track = this.trackNodes.get('guitar');
    if (!track) return;

    // Chuck / palm slap on guitar body strings
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(track.panNode);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  /**
   * Harmonium Reed Model:
   * Dual reed oscillators (4' and 8' stops) + chorus detune + bellows tremolo LFO
   */
  public playHarmoniumReed(freq: number, time?: number, velocity = 0.6, duration = 0.5) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const hitTime = time ?? this.ctx.currentTime;
    const track = this.trackNodes.get('harmonium');
    if (!track) return;

    // Reed 1: Main pitch
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, hitTime);

    // Reed 2: Dual reed with subtle +4 cents acoustic detune
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.0023, hitTime);

    // Bellows pressure tremolo LFO (5.2 Hz gentle pump)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 5.2;
    lfoGain.gain.value = 0.08;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, hitTime);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    // Bellows swell envelope: gentle 35ms attack, sustained, 60ms release
    gain.gain.setValueAtTime(0.001, hitTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.28, hitTime + 0.04);
    gain.gain.setValueAtTime(velocity * 0.28, hitTime + duration - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + duration);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(track.panNode);

    osc1.start(hitTime);
    osc2.start(hitTime);
    lfo.start(hitTime);

    osc1.stop(hitTime + duration + 0.02);
    osc2.stop(hitTime + duration + 0.02);
    lfo.stop(hitTime + duration + 0.02);
  }

  private playHarmoniumChord(chord: number[], time: number, velocity: number, duration: number) {
    for (const freq of chord) {
      this.playHarmoniumReed(freq, time, velocity / Math.sqrt(chord.length), duration);
    }
  }

  /**
   * Bansuri Flute Model:
   * Breathy sine + 2nd harmonic + vibrato LFO + pink noise breath chiff
   */
  public playBansuriNote(freq: number, time?: number, velocity = 0.6, duration = 0.8) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const hitTime = time ?? this.ctx.currentTime;
    const track = this.trackNodes.get('flute');
    if (!track) return;

    // Fundamental tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    // Subtle portamento (meend)
    osc.frequency.setValueAtTime(freq * 0.98, hitTime);
    osc.frequency.exponentialRampToValueAtTime(freq, hitTime + 0.07);

    // Subtle 2nd harmonic for rich bamboo timbre
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, hitTime);

    // Vibrato LFO (5.4 Hz, begins after 120ms)
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.value = 5.4;
    vibratoGain.gain.setValueAtTime(0, hitTime);
    vibratoGain.gain.linearRampToValueAtTime(freq * 0.015, hitTime + 0.2);

    vibrato.connect(osc.frequency);
    vibrato.connect(osc2.frequency);

    // Breath noise
    const noiseBufferSize = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(1, noiseBufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3800;
    noiseFilter.Q.value = 3;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, hitTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.12);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(track.panNode);

    // Main Note Envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, hitTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.35, hitTime + 0.08); // Soft breath attack
    gain.gain.setValueAtTime(velocity * 0.35, hitTime + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, hitTime + duration);

    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.15; // 2nd harmonic level

    osc.connect(gain);
    osc2.connect(gain2);
    gain2.connect(gain);
    gain.connect(track.panNode);

    osc.start(hitTime);
    osc2.start(hitTime);
    vibrato.start(hitTime);
    noiseSource.start(hitTime);

    osc.stop(hitTime + duration + 0.05);
    osc2.stop(hitTime + duration + 0.05);
    vibrato.stop(hitTime + duration + 0.05);
    noiseSource.stop(hitTime + 0.15);
  }

  // --- Vocal Track & Audio Element Hook ---
  public loadVocalAudio(audioElement: HTMLAudioElement) {
    this.vocalAudioElement = audioElement;
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    try {
      if (!this.vocalMediaSource) {
        this.vocalMediaSource = this.ctx.createMediaElementSource(audioElement);
        const vocalTrack = this.trackNodes.get('vocals');
        if (vocalTrack) {
          this.vocalMediaSource.connect(vocalTrack.panNode);
        }
      }
    } catch {
      // Element might already be connected
    }
  }

  // --- Channel Controls ---
  public setVolume(id: InstrumentId, vol: number) {
    this.volumes[id] = Math.max(0, Math.min(1, vol));
    const node = this.trackNodes.get(id);
    if (node) {
      node.gainNode.gain.setTargetAtTime(this.getEffectiveVolume(id), this.ctx?.currentTime || 0, 0.02);
    }
  }

  public setPan(id: InstrumentId, pan: number) {
    this.pans[id] = Math.max(-1, Math.min(1, pan));
    const node = this.trackNodes.get(id);
    if (node) {
      node.panNode.pan.setTargetAtTime(this.pans[id], this.ctx?.currentTime || 0, 0.02);
    }
  }

  public setMute(id: InstrumentId, muted: boolean) {
    this.mutes[id] = muted;
    this.updateAllGains();
  }

  public setSolo(id: InstrumentId, solo: boolean) {
    this.solos[id] = solo;
    this.updateAllGains();
  }

  public setTextureBoost(id: InstrumentId, texture: number) {
    this.textures[id] = Math.max(0, Math.min(1, texture));
    const node = this.trackNodes.get(id);
    if (node) {
      const multiplier = id === 'madal' ? 4 : id === 'guitar' ? 4 : 3;
      node.textureFilter.gain.setTargetAtTime(this.textures[id] * multiplier, this.ctx?.currentTime || 0, 0.05);
    }
  }

  public setVocalSpaceDucking(enabled: boolean) {
    this.vocalSpaceDucking = enabled;
    if (this.vocalPocketFilter && this.ctx) {
      // Duck mid frequencies (2.2 kHz) by 4.5 dB when enabled, leaving vocal space to shine!
      this.vocalPocketFilter.gain.setTargetAtTime(enabled ? -4.5 : 0, this.ctx.currentTime, 0.05);
    }
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, vol)), this.ctx.currentTime, 0.02);
    }
  }

  private isMuted(id: InstrumentId): boolean {
    const anySolo = Object.values(this.solos).some(Boolean);
    if (anySolo) {
      return !this.solos[id];
    }
    return this.mutes[id];
  }

  private getEffectiveVolume(id: InstrumentId): number {
    return this.isMuted(id) ? 0 : this.volumes[id];
  }

  private updateAllGains() {
    for (const [id, node] of this.trackNodes.entries()) {
      node.gainNode.gain.setTargetAtTime(this.getEffectiveVolume(id), this.ctx?.currentTime || 0, 0.02);
    }
  }

  // --- Visualizer Analysis ---
  public getMasterFrequencyData(dataArray: Uint8Array): void {
    if (this.masterAnalyser) {
      // Cast for compatibility with TS DOM typing variations for Uint8Array
      (this.masterAnalyser as any).getByteFrequencyData(dataArray);
    }
  }

  public getTrackFrequencyData(id: InstrumentId, dataArray: Uint8Array): void {
    const node = this.trackNodes.get(id);
    if (node) {
      (node.analyserNode as any).getByteFrequencyData(dataArray);
    }
  }

  // --- Subscriptions ---
  public onStepChange(cb: (step: number, currentTime: number) => void) {
    this.onStepChangeCallbacks.push(cb);
  }

  public onPlayStateChange(cb: (playing: boolean) => void) {
    this.onPlayStateChangeCallbacks.push(cb);
  }

  private notifyStep(step: number, currentTime: number) {
    this.onStepChangeCallbacks.forEach(cb => cb(step, currentTime));
  }

  private notifyPlayState(playing: boolean) {
    this.onPlayStateChangeCallbacks.forEach(cb => cb(playing));
  }

  // --- Export Full Mix to WAV ---
  public async exportMixToWavBlob(durationSeconds = 30): Promise<Blob> {
    const sampleRate = 44100;
    const totalSamples = Math.floor(sampleRate * durationSeconds);
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // Render multi-track simulation offline
    const stepDuration = 60 / this.bpm / 4;
    const stepsToRender = Math.floor(durationSeconds / stepDuration);

    // Simple offline buffer construction for WAV export
    const leftChannel = new Float32Array(totalSamples);
    const rightChannel = new Float32Array(totalSamples);

    // Synthesize steps into offline buffer
    for (let s = 0; s < stepsToRender; s++) {
      const stepTime = s * stepDuration;
      const startSample = Math.floor(stepTime * sampleRate);
      const sub = s % 16;

      // Madal Daa bass
      if (!this.mutes.madal && (sub === 0 || sub === 8)) {
        const decaySamples = Math.min(Math.floor(sampleRate * 0.25), totalSamples - startSample);
        for (let i = 0; i < decaySamples; i++) {
          const t = i / sampleRate;
          const freq = 140 * Math.exp(-t * 9);
          const val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8) * this.volumes.madal * 0.4;
          if (startSample + i < totalSamples) {
            leftChannel[startSample + i] += val;
            rightChannel[startSample + i] += val;
          }
        }
      }

      // Guitar strum
      if (!this.mutes.guitar && [0, 3, 6, 8, 10, 14].includes(sub)) {
        const decaySamples = Math.min(Math.floor(sampleRate * 0.35), totalSamples - startSample);
        const root = [146.83, 196.0, 220.0, 146.83][Math.floor(s / 16) % 4];
        for (let i = 0; i < decaySamples; i++) {
          const t = i / sampleRate;
          const val = Math.sin(2 * Math.PI * root * 2 * t) * Math.exp(-t * 10) * this.volumes.guitar * 0.25;
          if (startSample + i < totalSamples) {
            leftChannel[startSample + i] += val * 0.7;
            rightChannel[startSample + i] += val * 1.2;
          }
        }
      }

      // Harmonium chords
      if (!this.mutes.harmonium && (sub === 0 || sub === 8)) {
        const durationSamples = Math.min(Math.floor(sampleRate * 0.5), totalSamples - startSample);
        const chord = [293.66, 369.99, 440.0];
        for (let i = 0; i < durationSamples; i++) {
          const t = i / sampleRate;
          let chordVal = 0;
          for (const f of chord) {
            chordVal += Math.sin(2 * Math.PI * f * t) * 0.12;
          }
          const tremolo = 1 + 0.15 * Math.sin(2 * Math.PI * 5.2 * t);
          const val = chordVal * tremolo * this.volumes.harmonium * 0.3;
          if (startSample + i < totalSamples) {
            leftChannel[startSample + i] += val * 1.1;
            rightChannel[startSample + i] += val * 0.85;
          }
        }
      }
    }

    // Convert Float32 buffers to 16-bit PCM WAV Blob
    return this.encodeWAV(leftChannel, rightChannel, sampleRate);
  }

  private encodeWAV(left: Float32Array, right: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + left.length * 2 * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + left.length * 4, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 2, true); // 2 channels (Stereo)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true); // Byte rate
    view.setUint16(32, 4, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, left.length * 4, true);

    // Interleave left and right channels
    let offset = 44;
    for (let i = 0; i < left.length; i++) {
      let l = Math.max(-1, Math.min(1, left[i]));
      let r = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7FFF, true);
      offset += 2;
      view.setInt16(offset, r < 0 ? r * 0x8000 : r * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// Singleton audio engine instance
export const studioEngine = new NepaliStudioEngine();
