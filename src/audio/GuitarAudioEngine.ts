import { AudioSettings, BodyPreset } from '../types/guitar';

// Base open string frequencies for standard tuning (E2, A2, D3, G3, B3, E4)
export const STANDARD_FREQUENCIES = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
export const STRING_NAMES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

export class GuitarAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private eqBass: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqTreble: BiquadFilterNode | null = null;
  private bodyResonance: BiquadFilterNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private chorusDelay: DelayNode | null = null;
  
  // Audio recording destination
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingAudio = false;

  // Track active voices for each string (0..5) to smoothly damp previous notes and prevent clipping
  private activeVoices: { gain: GainNode; source: AudioBufferSourceNode }[][] = [[], [], [], [], [], []];

  private settings: AudioSettings = {
    masterVolume: 0.8,
    bodyPreset: 'dreadnought',
    reverbLevel: 0.35,
    bassLevel: 2.0,
    midLevel: 0.0,
    trebleLevel: 1.5,
    stringDamping: 0.85,
    pickHardness: 0.7,
    rimVolume: 0.9,
    capo: 0,
    chorusEffect: false,
  };

  constructor() {
    // AudioContext will be initialized on first user gesture
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

    // Master Volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);

    // 3-Band EQ
    this.eqBass = this.ctx.createBiquadFilter();
    this.eqBass.type = 'lowshelf';
    this.eqBass.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.eqBass.gain.setValueAtTime(this.settings.bassLevel, this.ctx.currentTime);

    this.eqMid = this.ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.setValueAtTime(1000, this.ctx.currentTime);
    this.eqMid.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.eqMid.gain.setValueAtTime(this.settings.midLevel, this.ctx.currentTime);

    this.eqTreble = this.ctx.createBiquadFilter();
    this.eqTreble.type = 'highshelf';
    this.eqTreble.frequency.setValueAtTime(3200, this.ctx.currentTime);
    this.eqTreble.gain.setValueAtTime(this.settings.trebleLevel, this.ctx.currentTime);

    // Body Resonance (Acoustic Box Simulation)
    this.bodyResonance = this.ctx.createBiquadFilter();
    this.bodyResonance.type = 'peaking';
    this.bodyResonance.frequency.setValueAtTime(105, this.ctx.currentTime); // Helmholtz resonance
    this.bodyResonance.Q.setValueAtTime(3.5, this.ctx.currentTime);
    this.bodyResonance.gain.setValueAtTime(4.0, this.ctx.currentTime);

    // Reverb Simulation
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(this.settings.reverbLevel, this.ctx.currentTime);
    this.createSyntheticReverb();

    // Stream Destination for recording
    this.mediaStreamDestination = this.ctx.createMediaStreamDestination();

    // Chain node connections
    // Node -> EQ Bass -> EQ Mid -> EQ Treble -> Body Res -> Master Gain -> Speakers & Recorder
    this.eqBass.connect(this.eqMid);
    this.eqMid.connect(this.eqTreble);
    this.eqTreble.connect(this.bodyResonance);
    this.bodyResonance.connect(this.masterGain);

    if (this.reverbGain) {
      this.bodyResonance.connect(this.reverbGain);
      if (this.reverbConvolver) {
        this.reverbGain.connect(this.reverbConvolver);
        this.reverbConvolver.connect(this.masterGain);
      }
    }

    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.mediaStreamDestination);
  }

  private createSyntheticReverb() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 1.5; // 1.5s impulse
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.3));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = impulse;
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (this.masterGain && newSettings.masterVolume !== undefined) {
      this.masterGain.gain.setValueAtTime(this.settings.masterVolume, now);
    }
    if (this.eqBass && newSettings.bassLevel !== undefined) {
      this.eqBass.gain.setValueAtTime(this.settings.bassLevel, now);
    }
    if (this.eqMid && newSettings.midLevel !== undefined) {
      this.eqMid.gain.setValueAtTime(this.settings.midLevel, now);
    }
    if (this.eqTreble && newSettings.trebleLevel !== undefined) {
      this.eqTreble.gain.setValueAtTime(this.settings.trebleLevel, now);
    }
    if (this.reverbGain && newSettings.reverbLevel !== undefined) {
      this.reverbGain.gain.setValueAtTime(this.settings.reverbLevel, now);
    }

    // Apply Body Preset characteristics
    if (newSettings.bodyPreset && this.bodyResonance) {
      this.applyPresetCharacteristics(newSettings.bodyPreset);
    }
  }

  private applyPresetCharacteristics(preset: BodyPreset) {
    if (!this.ctx || !this.bodyResonance) return;
    const now = this.ctx.currentTime;

    switch (preset) {
      case 'dreadnought':
        this.bodyResonance.frequency.setValueAtTime(105, now);
        this.bodyResonance.gain.setValueAtTime(5.0, now);
        break;
      case 'nylon':
        this.bodyResonance.frequency.setValueAtTime(130, now);
        this.bodyResonance.gain.setValueAtTime(2.5, now);
        this.settings.pickHardness = 0.3;
        break;
      case 'jumbo':
        this.bodyResonance.frequency.setValueAtTime(95, now);
        this.bodyResonance.gain.setValueAtTime(6.5, now);
        break;
      case 'parlor':
        this.bodyResonance.frequency.setValueAtTime(160, now);
        this.bodyResonance.gain.setValueAtTime(3.0, now);
        break;
      case '12string':
        this.bodyResonance.frequency.setValueAtTime(115, now);
        this.bodyResonance.gain.setValueAtTime(4.0, now);
        this.settings.chorusEffect = true;
        break;
    }
  }

  /**
   * Stop all active string voices immediately (e.g. when song playback stops)
   */
  public stopAllVoices() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let strIdx = 0; strIdx < 6; strIdx++) {
      if (this.activeVoices[strIdx]) {
        this.activeVoices[strIdx].forEach((v) => {
          try {
            v.gain.gain.cancelScheduledValues(now);
            v.gain.gain.setValueAtTime(v.gain.gain.value, now);
            v.gain.gain.linearRampToValueAtTime(0.0001, now + 0.01);
            v.source.stop(now + 0.015);
          } catch {
            // Ignore if already stopped
          }
        });
        this.activeVoices[strIdx] = [];
      }
    }
  }

  /**
   * Play an acoustic guitar string note
   * @param stringIndex 0..5 (0 = Low E, 5 = High E)
   * @param fret 0 (open) to 22
   * @param velocity 0.1 to 1.0
   * @param customFreq optional frequency override
   * @param scheduledDelaySec delay in seconds for sample-accurate scheduling
   */
  public playString(
    stringIndex: number, 
    fret: number = 0, 
    velocity: number = 0.8, 
    customFreq?: number,
    scheduledDelaySec: number = 0
  ) {
    this.init();
    if (!this.ctx || !this.eqBass) return;

    if (fret === -1) return; // Muted string (X)

    const baseNow = this.ctx.currentTime;
    const startTime = baseNow + Math.max(0, scheduledDelaySec);

    // DAMP PREVIOUS VOICES ON THIS STRING TO PREVENT STUTTERING / CLIPPING
    if (this.activeVoices[stringIndex] && this.activeVoices[stringIndex].length > 0) {
      this.activeVoices[stringIndex].forEach((prevVoice) => {
        try {
          prevVoice.gain.gain.cancelScheduledValues(startTime);
          prevVoice.gain.gain.setValueAtTime(prevVoice.gain.gain.value, startTime);
          prevVoice.gain.gain.linearRampToValueAtTime(0.0001, startTime + 0.012);
          prevVoice.source.stop(startTime + 0.015);
        } catch {
          // Ignore if already stopped
        }
      });
      this.activeVoices[stringIndex] = [];
    }

    const totalSemis = fret + this.settings.capo;
    const baseFreq = customFreq || STANDARD_FREQUENCIES[stringIndex];
    const freq = baseFreq * Math.pow(2, totalSemis / 12);

    // 1. Physical Karplus-Strong Synthesis Buffer
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = Math.max(2, Math.round(sampleRate / freq));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Initial Pick Strike / Pluck noise burst
    const pickHardness = this.settings.pickHardness;
    for (let i = 0; i < bufferSize; i++) {
      // Pick attack shaping: blend white noise with triangular wave for string bite
      const noise = Math.random() * 2 - 1;
      const tri = (i / bufferSize) * 2 - 1;
      output[i] = (noise * pickHardness + tri * (1 - pickHardness)) * (1 - i / bufferSize);
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Filter feedback loop (string damping)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    // Frequency damping according to string index & preset
    const dampingFreq = Math.min(18000, freq * (3 + (6 - stringIndex) * 1.5) * (1 + this.settings.pickHardness));
    filter.frequency.setValueAtTime(dampingFreq, startTime);

    // String decay envelope
    const gainNode = this.ctx.createGain();
    const decayDuration = (2.2 + (6 - stringIndex) * 0.4) * this.settings.stringDamping;
    
    gainNode.gain.setValueAtTime(velocity * 0.85, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + decayDuration);

    // Connect string loop
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.eqBass);

    noiseNode.start(startTime);
    noiseNode.stop(startTime + decayDuration);

    // Track active voice node for string dampening
    this.activeVoices[stringIndex].push({ gain: gainNode, source: noiseNode });

    // 2. Secondary Harmonic / Doubled 12-string chorus layer if enabled
    if (this.settings.chorusEffect || this.settings.bodyPreset === '12string') {
      const chorusFreq = (stringIndex <= 2) ? freq * 2 : freq * 1.008;
      const chorusBufSize = Math.max(2, Math.round(sampleRate / chorusFreq));
      const chorusBuffer = this.ctx.createBuffer(1, chorusBufSize, sampleRate);
      const cOutput = chorusBuffer.getChannelData(0);
      for (let i = 0; i < chorusBufSize; i++) {
        cOutput[i] = (Math.random() * 2 - 1) * (1 - i / chorusBufSize);
      }
      const cNode = this.ctx.createBufferSource();
      cNode.buffer = chorusBuffer;
      cNode.loop = true;

      const cGain = this.ctx.createGain();
      cGain.gain.setValueAtTime(velocity * 0.35, startTime);
      cGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decayDuration * 0.8);

      cNode.connect(cGain);
      cGain.connect(this.eqBass);
      cNode.start(startTime + 0.003);
      cNode.stop(startTime + decayDuration);
    }
  }

  /**
   * "มีเสียงขอบ" / Body Tap & Rim Slap Sounds
   * - wood_knock: Deep resonant body tap
   * - string_slap: Sharp metallic slap on frets
   * - soundhole_edge: Rim knock sound
   */
  public playRimSlap(type: 'wood_knock' | 'string_slap' | 'soundhole_edge' = 'wood_knock', velocity: number = 0.9, scheduledDelaySec: number = 0) {
    this.init();
    if (!this.ctx || !this.eqBass) return;

    const baseNow = this.ctx.currentTime;
    const now = baseNow + Math.max(0, scheduledDelaySec);
    const vol = velocity * this.settings.rimVolume;

    if (type === 'wood_knock' || type === 'soundhole_edge') {
      // Wood body knock synthesis
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const pitch = type === 'wood_knock' ? 115 : 175;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      oscGain.gain.setValueAtTime(vol * 1.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      // Add wooden click transient
      const clickBuf = this.ctx.createBuffer(1, Math.round(this.ctx.sampleRate * 0.02), this.ctx.sampleRate);
      const clickData = clickBuf.getChannelData(0);
      for (let i = 0; i < clickData.length; i++) {
        clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 100);
      }
      const clickNode = this.ctx.createBufferSource();
      clickNode.buffer = clickBuf;
      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(vol * 0.8, now);

      osc.connect(oscGain);
      oscGain.connect(this.eqBass);
      clickNode.connect(clickGain);
      clickGain.connect(this.eqBass);

      osc.start(now);
      osc.stop(now + 0.25);
      clickNode.start(now);
    } else if (type === 'string_slap') {
      // Metallic string mute slap against fretboard
      const bufferSize = Math.round(this.ctx.sampleRate * 0.08);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 1.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.eqBass);

      noiseNode.start(now);
    }
  }

  /**
   * Strum full chord using sample-accurate Web Audio timing
   */
  public playChord(frets: number[], isDownStrum: boolean = true, durationMs: number = 60, timeOffsetSec: number = 0) {
    const indices = isDownStrum ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
    const delayPerString = (durationMs / 1000) / 6;

    indices.forEach((strIdx, step) => {
      const fret = frets[strIdx];
      if (fret !== -1) {
        const stringDelay = timeOffsetSec + step * delayPerString;
        this.playString(strIdx, fret, 0.85 - step * 0.03, undefined, stringDelay);
      }
    });
  }

  // --- Audio Recording Functions for Downloading Song ---
  public startAudioRecording() {
    this.init();
    if (!this.mediaStreamDestination) return;

    this.recordedChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStreamDestination.stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      this.mediaRecorder.start();
      this.isRecordingAudio = true;
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
    }
  }

  public stopAudioRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecordingAudio) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/wav' });
        this.isRecordingAudio = false;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }
}

export const globalGuitarEngine = new GuitarAudioEngine();
