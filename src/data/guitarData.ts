import { GuitarChord, GuitarTuning, StrumPattern, SongProject } from '../types/guitar';

export const DEFAULT_CHORDS: GuitarChord[] = [
  { id: 'c', name: 'C', frets: [-1, 3, 2, 0, 1, 0], color: '#ef4444' },     // Red pick
  { id: 'g', name: 'G', frets: [3, 2, 0, 0, 0, 3], color: '#f97316' },     // Orange pick
  { id: 'am', name: 'Am', frets: [-1, 0, 2, 2, 1, 0], color: '#10b981' },   // Green pick
  { id: 'em', name: 'Em', frets: [0, 2, 2, 0, 0, 0], color: '#3b82f6' },   // Blue pick
  { id: 'f', name: 'F', frets: [1, 3, 3, 2, 1, 1], color: '#8b5cf6' },    // Purple pick
  { id: 'dm', name: 'Dm', frets: [-1, -1, 0, 2, 3, 1], color: '#ec4899' }, // Pink pick
  { id: 'd', name: 'D', frets: [-1, -1, 0, 2, 3, 2], color: '#06b6d4' },   // Cyan pick
  { id: 'a', name: 'A', frets: [-1, 0, 2, 2, 2, 0], color: '#eab308' },   // Yellow pick
  { id: 'e', name: 'E', frets: [0, 2, 2, 1, 0, 0], color: '#6366f1' },   // Indigo pick
  { id: 'bm', name: 'Bm', frets: [-1, 2, 4, 4, 3, 2], color: '#2563eb' },  // Bm from screenshot
  { id: 'fm7', name: 'FM7', frets: [-1, 3, 3, 2, 1, 0], color: '#475569' },// FM7 from screenshot
  { id: 'fs7', name: 'F#7', frets: [2, 4, 2, 3, 2, 2], color: '#334155' },// F#7 from screenshot
];

export const TUNINGS: GuitarTuning[] = [
  { id: 'standard', name: 'Standard (E A D G B E)', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], frequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63] },
  { id: 'dropd', name: 'Drop D (D A D G B E)', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], frequencies: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63] },
  { id: 'halfstep', name: 'Half Step Down (Eb Ab Db Gb Bb Eb)', notes: ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'], frequencies: [77.78, 103.83, 138.59, 185.00, 233.08, 311.13] },
  { id: 'opend', name: 'Open D (D A D F# A D)', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], frequencies: [73.42, 110.00, 146.83, 185.00, 220.00, 293.66] },
  { id: 'openg', name: 'Open G (D G D G B D)', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], frequencies: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66] },
];

export const STRUM_PATTERNS: StrumPattern[] = [
  {
    id: 'pop_44',
    name: 'Standard Pop (ตก - ตกขึ้น - ขึ้นตกขึ้น)',
    timeSignature: '4/4',
    pattern: [
      { beat: 1, type: 'down' },
      { beat: 2, type: 'down' },
      { beat: 2.5, type: 'up' },
      { beat: 3.5, type: 'up' },
      { beat: 4, type: 'down' },
      { beat: 4.5, type: 'up' },
    ]
  },
  {
    id: 'folk_44',
    name: 'Folk / Country (ตก - ตกขอบ - ตกขึ้น)',
    timeSignature: '4/4',
    pattern: [
      { beat: 1, type: 'down' },
      { beat: 2, type: 'rim' },
      { beat: 3, type: 'down' },
      { beat: 3.5, type: 'up' },
      { beat: 4, type: 'rim' },
    ]
  },
  {
    id: 'ballad_34',
    name: 'Waltz / 3/4 Ballad (เบส - ตก - ตก)',
    timeSignature: '3/4',
    pattern: [
      { beat: 1, type: 'down', stringRange: [0, 2] },
      { beat: 2, type: 'down', stringRange: [3, 5] },
      { beat: 3, type: 'down', stringRange: [3, 5] },
    ]
  },
  {
    id: 'arpeggio_slow',
    name: 'Fingerpicking Arpeggio (เกา 1-2-3-2-1-2)',
    timeSignature: '4/4',
    pattern: [
      { beat: 1, type: 'down', stringRange: [0, 0] },
      { beat: 1.5, type: 'down', stringRange: [3, 3] },
      { beat: 2, type: 'down', stringRange: [4, 4] },
      { beat: 2.5, type: 'down', stringRange: [5, 5] },
      { beat: 3, type: 'down', stringRange: [4, 4] },
      { beat: 3.5, type: 'down', stringRange: [3, 3] },
      { beat: 4, type: 'rim' },
    ]
  }
];

export const DEMO_PROJECTS: SongProject[] = [
  {
    id: 'demo_1',
    title: 'เพลงโปร่งยามเย็น (Sunset Acoustic)',
    artist: 'Real Guitar Master',
    bpm: 85,
    timeSignature: '4/4',
    tuning: 'Standard (E A D G B E)',
    capo: 0,
    chords: [
      DEFAULT_CHORDS[0], // C
      DEFAULT_CHORDS[1], // G
      DEFAULT_CHORDS[2], // Am
      DEFAULT_CHORDS[4], // F
    ],
    events: [
      { id: 'e1', stringIndex: 0, fret: 0, time: 0.0, duration: 0.5, velocity: 0.9, chordName: 'C' },
      { id: 'e2', stringIndex: 2, fret: 2, time: 0.3, duration: 0.5, velocity: 0.8 },
      { id: 'e3', stringIndex: 3, fret: 0, time: 0.6, duration: 0.5, velocity: 0.8 },
      { id: 'e4', stringIndex: 4, fret: 1, time: 0.9, duration: 0.5, velocity: 0.8 },
      { id: 'e5', stringIndex: 0, fret: 0, time: 1.2, duration: 0.2, velocity: 0.9, isRimSlap: true, rimType: 'wood_knock' },
      
      { id: 'e6', stringIndex: 0, fret: 3, time: 1.8, duration: 0.5, velocity: 0.9, chordName: 'G' },
      { id: 'e7', stringIndex: 3, fret: 0, time: 2.1, duration: 0.5, velocity: 0.8 },
      { id: 'e8', stringIndex: 4, fret: 0, time: 2.4, duration: 0.5, velocity: 0.8 },
      { id: 'e9', stringIndex: 5, fret: 3, time: 2.7, duration: 0.5, velocity: 0.8 },
      { id: 'e10', stringIndex: 0, fret: 0, time: 3.0, duration: 0.2, velocity: 0.9, isRimSlap: true, rimType: 'string_slap' },
    ],
    lyrics: 'C          G          Am         F\nสายลมแผ่วเบา ยามเย็นวันพรุ่งนี้ กีต้าร์โปร่งกล่อมใจ...',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
