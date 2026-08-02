export interface NoteEvent {
  id: string;
  stringIndex: number; // 0 to 5 (0 = Low E, 5 = High E)
  fret: number;        // 0 = open string, 1..22
  time: number;        // timestamp in seconds from start
  duration: number;    // duration in seconds
  velocity: number;    // 0.0 to 1.0
  isRimSlap?: boolean; // if it's a body/rim knock sound
  rimType?: 'wood_knock' | 'string_slap' | 'soundhole_edge';
  chordName?: string;
}

export interface GuitarChord {
  id: string;
  name: string;
  frets: number[]; // Array of 6 numbers: -1 for mute (X), 0 for open, 1..12 for fret
  baseFret?: number;
  fingerings?: number[]; // fingers 1-4 or 0 for open
  color?: string; // Pick/badge color e.g., '#3b82f6'
}

export type BodyPreset = 'dreadnought' | 'nylon' | 'jumbo' | 'parlor' | '12string';

export interface GuitarTuning {
  id: string;
  name: string;
  notes: string[]; // 6 notes e.g., ["E2", "A2", "D3", "G3", "B3", "E4"]
  frequencies: number[]; // In Hz
}

export interface AudioSettings {
  masterVolume: number;
  bodyPreset: BodyPreset;
  reverbLevel: number;
  bassLevel: number; // EQ
  midLevel: number;
  trebleLevel: number;
  stringDamping: number; // Decay length 0.1 to 1.0
  pickHardness: number;  // Brightness/transient attack
  rimVolume: number;     // Rim slap/knock volume
  capo: number;          // 0 to 7
  chorusEffect: boolean; // For 12-string sound
}

export interface StrumPattern {
  id: string;
  name: string;
  timeSignature: '4/4' | '3/4' | '6/8';
  pattern: { beat: number; type: 'down' | 'up' | 'mute' | 'rim'; stringRange?: [number, number] }[];
}

export interface SongProject {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  timeSignature: string;
  tuning: string;
  capo: number;
  chords: GuitarChord[];
  events: NoteEvent[];
  strumPatternId?: string;
  lyrics?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomPick {
  id: string;
  color: string;
  label: string;
  chordName: string;
}
