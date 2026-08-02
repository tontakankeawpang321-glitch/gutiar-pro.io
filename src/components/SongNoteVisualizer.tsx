import React from 'react';
import { NoteEvent, GuitarChord } from '../types/guitar';
import { Music, Play, Pause, Disc, Sparkles } from 'lucide-react';

interface SongNoteVisualizerProps {
  events: NoteEvent[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  activeChordName?: string;
  chordsList: GuitarChord[];
  bpm?: number;
  lyrics?: string;
}

export const SongNoteVisualizer: React.FC<SongNoteVisualizerProps> = ({
  events,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  activeChordName,
  chordsList,
  bpm = 85,
  lyrics = '',
}) => {
  // Find currently active chord from events or activeChordName prop
  const currentEventNearPlayhead = events.find(
    (e) => Math.abs(e.time - currentTime) < 0.25 && e.chordName
  );
  
  const displayChordName = currentEventNearPlayhead?.chordName || activeChordName || 'C';
  const currentChordObj = chordsList.find(
    (c) => c.name.toLowerCase() === displayChordName.toLowerCase()
  ) || chordsList[0];

  // String labels top to bottom: High E (5) -> B (4) -> G (3) -> D (2) -> A (1) -> Low E (0)
  const stringRows = [
    { name: 'E1 (สาย 1)', idx: 5 },
    { name: 'B2 (สาย 2)', idx: 4 },
    { name: 'G3 (สาย 3)', idx: 3 },
    { name: 'D4 (สาย 4)', idx: 2 },
    { name: 'A5 (สาย 5)', idx: 1 },
    { name: 'E6 (สาย 6)', idx: 0 },
  ];

  // Calculate pixel position for notes based on viewport width
  const viewWindowSeconds = 8; // Show 8 seconds window of tab
  const scrollOffset = Math.max(0, currentTime - 1.5); // Playhead sits at ~20% from left

  // Action badge detection
  const currentActiveEvents = events.filter((e) => Math.abs(e.time - currentTime) < 0.15);
  let actionLabel = 'สแตนด์บาย';
  let actionIcon = '🎸';

  if (currentActiveEvents.length > 0) {
    const hasRim = currentActiveEvents.some((e) => e.isRimSlap);
    if (hasRim) {
      actionLabel = 'เคาะขอบกี่ตาร์ (Body Knock)';
      actionIcon = '🪵';
    } else if (currentActiveEvents.length >= 3) {
      actionLabel = 'ดีดคอร์ดเต็มวง (Full Chord Strum)';
      actionIcon = '⚡';
    } else {
      actionLabel = 'เกาสายเดี่ยว (Pluck String)';
      actionIcon = '🎶';
    }
  }

  return (
    <div className="w-full bg-[#1C1917] border border-[#3F3935] rounded-2xl p-4 space-y-4 shadow-xl text-stone-100 overflow-hidden">
      
      {/* Top Bar: Playhead Progress & Song Specs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3F3935]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-[#2A2624] border border-[#3F3935] ${
            isPlaying ? 'text-orange-400 animate-spin' : 'text-stone-400'
          }`}>
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                ตัวอย่างโน้ตขณะเล่น (Note & Tab Preview)
              </span>
              {isPlaying && (
                <span className="px-2 py-0.5 rounded-full bg-orange-950/80 border border-orange-500/50 text-orange-300 text-[10px] font-extrabold animate-pulse">
                  PLAYING
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-stone-300 mt-0.5">
              เวลา: {currentTime.toFixed(1)}s / {Math.max(duration, 1.0).toFixed(1)}s | BPM: {bpm}
            </div>
          </div>
        </div>

        {/* Live Strum Action Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2A2624] border border-[#3F3935]">
          <span className="text-sm">{actionIcon}</span>
          <span className="text-xs font-bold text-stone-200">{actionLabel}</span>
        </div>
      </div>

      {/* Main Tab Visualizer Area */}
      <div className="relative bg-[#181513] rounded-xl border border-[#3F3935] p-3 overflow-hidden">
        
        {/* Animated Playhead Bar (Vertical line) */}
        <div 
          className="absolute top-0 bottom-0 z-30 w-1 bg-gradient-to-b from-orange-400 via-amber-300 to-orange-500 shadow-[0_0_12px_#f97316] pointer-events-none transition-all duration-75"
          style={{
            left: `${((currentTime - scrollOffset) / viewWindowSeconds) * 100}%`,
          }}
        >
          <div className="w-3 h-3 -ml-1 -mt-1 rounded-full bg-orange-400 border-2 border-white shadow-md" />
        </div>

        {/* 6 Guitar String Staff Rows */}
        <div className="space-y-3 relative z-10 py-2">
          {stringRows.map(({ name, idx }) => (
            <div key={idx} className="relative flex items-center h-6">
              
              {/* String Label */}
              <span className="w-16 shrink-0 text-[10px] font-bold font-mono text-stone-400 z-20">
                {name}
              </span>

              {/* Horizontal String Line */}
              <div className="relative flex-1 h-[2px] bg-[#3F3935] overflow-visible">
                
                {/* Notes along this string */}
                {events
                  .filter((e) => e.stringIndex === idx && !e.isRimSlap)
                  .map((evt) => {
                    const relativeTime = evt.time - scrollOffset;
                    if (relativeTime < -1 || relativeTime > viewWindowSeconds + 1) return null;

                    const percentLeft = (relativeTime / viewWindowSeconds) * 100;
                    const isActiveNow = Math.abs(evt.time - currentTime) < 0.18;

                    return (
                      <div
                        key={evt.id}
                        style={{ left: `${percentLeft}%` }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full font-black font-mono text-xs flex items-center justify-center transition-transform ${
                          isActiveNow
                            ? 'bg-orange-500 text-stone-900 border-2 border-white shadow-[0_0_14px_#f97316] scale-125 z-20'
                            : 'bg-[#2A2624] text-stone-300 border border-[#3F3935]'
                        }`}
                      >
                        {evt.fret === 0 ? 'O' : evt.fret}
                      </div>
                    );
                  })}
              </div>

            </div>
          ))}
        </div>

        {/* Rim Slaps Row at bottom */}
        <div className="mt-2 pt-2 border-t border-[#3F3935]/60 flex items-center h-6">
          <span className="w-16 shrink-0 text-[10px] font-bold text-amber-500/90 z-20">
            🪵 Slap
          </span>
          <div className="relative flex-1 h-[2px] bg-amber-950/40">
            {events
              .filter((e) => e.isRimSlap)
              .map((evt) => {
                const relativeTime = evt.time - scrollOffset;
                if (relativeTime < -1 || relativeTime > viewWindowSeconds + 1) return null;

                const percentLeft = (relativeTime / viewWindowSeconds) * 100;
                const isActiveNow = Math.abs(evt.time - currentTime) < 0.18;

                return (
                  <div
                    key={evt.id}
                    style={{ left: `${percentLeft}%` }}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-black transition-transform ${
                      isActiveNow
                        ? 'bg-amber-400 text-stone-900 shadow-[0_0_10px_#f59e0b] scale-125 z-20'
                        : 'bg-[#2A2624] text-amber-400 border border-amber-800/40'
                    }`}
                  >
                    Slap
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      {/* Scrubber Range Bar */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1.0)}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg bg-[#2A2624] accent-orange-500 cursor-pointer"
        />
      </div>

      {/* Bottom Section: Active Chord Diagram & Lyrics Sync */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#3F3935]">
        
        {/* Active Chord Fret Diagram Display */}
        {currentChordObj && (
          <div className="p-3 rounded-xl bg-[#2A2624] border border-[#3F3935] flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                คอร์ดปัจจุบัน
              </span>
              <span className="text-xl font-black text-stone-100">
                {currentChordObj.name}
              </span>
            </div>

            {/* Fret dots diagram */}
            <div className="flex gap-1.5 bg-[#1C1917] p-2 rounded-lg border border-[#3F3935]">
              {currentChordObj.frets.map((fret, strIdx) => (
                <div key={strIdx} className="flex flex-col items-center text-[10px] font-mono">
                  <span className="text-stone-500">{6 - strIdx}</span>
                  <span className={`w-5 h-6 rounded flex items-center justify-center font-bold mt-0.5 ${
                    fret === -1
                      ? 'bg-red-950/80 text-red-400 border border-red-900/50'
                      : fret === 0
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50'
                      : 'bg-orange-600 text-stone-900'
                  }`}>
                    {fret === -1 ? 'X' : fret}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lyrics display */}
        <div className="p-3 rounded-xl bg-[#2A2624] border border-[#3F3935] flex flex-col justify-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
            เนื้อเพลงประกอบ (Lyrics)
          </span>
          <p className="text-xs text-stone-200 font-medium italic line-clamp-2">
            {lyrics || 'ไม่มีเนื้อเพลงที่บันทึกไว้'}
          </p>
        </div>

      </div>

    </div>
  );
};
