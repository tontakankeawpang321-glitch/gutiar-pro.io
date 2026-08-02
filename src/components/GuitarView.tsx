import React, { useState, useRef, useEffect, useCallback } from 'react';
import { globalGuitarEngine } from '../audio/GuitarAudioEngine';
import { GuitarChord, NoteEvent } from '../types/guitar';
import { DEFAULT_CHORDS } from '../data/guitarData';
import { 
  Play, Pause, Mic, Square, Sparkles, Volume2, 
  Settings, Music2, Sliders, ChevronDown, Hand, RotateCcw
} from 'lucide-react';

interface GuitarViewProps {
  activeChord: GuitarChord;
  onSelectChord: (chord: GuitarChord) => void;
  chordsList: GuitarChord[];
  isRecording: boolean;
  onToggleRecording: () => void;
  recordedEvents: NoteEvent[];
  onAddRecordedEvent: (event: NoteEvent) => void;
  recordingStartTime: number | null;
  capo: number;
  onOpenSettings: () => void;
  onOpenComposer: () => void;
  isPortraitMode: boolean;
  onToggleOrientation: () => void;
}

export const GuitarView: React.FC<GuitarViewProps> = ({
  activeChord,
  onSelectChord,
  chordsList,
  isRecording,
  onToggleRecording,
  recordedEvents,
  onAddRecordedEvent,
  recordingStartTime,
  capo,
  onOpenSettings,
  onOpenComposer,
  isPortraitMode,
  onToggleOrientation
}) => {
  const [vibratingStrings, setVibratingStrings] = useState<boolean[]>([false, false, false, false, false, false]);
  const [activeRimZone, setActiveRimZone] = useState<string | null>(null);
  const [pickPosition, setPickPosition] = useState<{ x: number; y: number } | null>(null);
  const [strumDirection, setStrumDirection] = useState<'down' | 'up' | null>(null);
  const [playMode, setPlayMode] = useState<'chord' | 'single' | 'arpeggio'>('chord');
  
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const guitarContainerRef = useRef<HTMLDivElement>(null);

  // String Gauge thickness (in px for visual)
  const stringGauges = [4.2, 3.6, 2.8, 2.2, 1.6, 1.0]; // E2, A2, D3, G3, B3, E4
  const stringColors = [
    'linear-gradient(to right, #92400e, #d97706, #92400e)', // Wound Bronze E2
    'linear-gradient(to right, #92400e, #f59e0b, #92400e)', // Wound Bronze A2
    'linear-gradient(to right, #b45309, #fbbf24, #b45309)', // Wound Bronze D3
    'linear-gradient(to right, #94a3b8, #e2e8f0, #64748b)', // Silver G3
    'linear-gradient(to right, #cbd5e1, #ffffff, #94a3b8)', // Plain Silver B3
    'linear-gradient(to right, #e2e8f0, #ffffff, #cbd5e1)', // Plain Silver E4
  ];

  const triggerStringAnimation = useCallback((stringIdx: number) => {
    setVibratingStrings((prev) => {
      const next = [...prev];
      next[stringIdx] = true;
      return next;
    });
    setTimeout(() => {
      setVibratingStrings((prev) => {
        const next = [...prev];
        next[stringIdx] = false;
        return next;
      });
    }, 450);
  }, []);

  const handlePluckString = useCallback((stringIndex: number, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    const fret = activeChord.frets[stringIndex];
    if (fret === -1) return; // Muted

    globalGuitarEngine.playString(stringIndex, fret, 0.85);
    triggerStringAnimation(stringIndex);

    if (isRecording && recordingStartTime) {
      const timeOffset = (Date.now() - recordingStartTime) / 1000;
      onAddRecordedEvent({
        id: `evt_${Date.now()}_${Math.random()}`,
        stringIndex,
        fret,
        time: timeOffset,
        duration: 0.8,
        velocity: 0.85,
        chordName: activeChord.name,
      });
    }
  }, [activeChord, isRecording, recordingStartTime, onAddRecordedEvent, triggerStringAnimation]);

  const handleStrumChord = useCallback((isDown: boolean = true) => {
    setStrumDirection(isDown ? 'down' : 'up');
    setTimeout(() => setStrumDirection(null), 300);

    globalGuitarEngine.playChord(activeChord.frets, isDown, 80);

    // Trigger animations for non-muted strings in order of strum direction
    const indices = isDown ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
    indices.forEach((strIdx, step) => {
      const fret = activeChord.frets[strIdx];
      if (fret !== -1) {
        setTimeout(() => triggerStringAnimation(strIdx), step * 12);
      }
    });

    if (isRecording && recordingStartTime) {
      const timeOffset = (Date.now() - recordingStartTime) / 1000;
      indices.forEach((strIdx, step) => {
        const fret = activeChord.frets[strIdx];
        if (fret !== -1) {
          onAddRecordedEvent({
            id: `evt_${Date.now()}_${strIdx}`,
            stringIndex: strIdx,
            fret,
            time: timeOffset + step * 0.015,
            duration: 0.8,
            velocity: 0.85,
            chordName: activeChord.name,
          });
        }
      });
    }
  }, [activeChord, isRecording, recordingStartTime, onAddRecordedEvent, triggerStringAnimation]);

  // "มีเสียงขอบ" Rim / Wood Slap Trigger
  const handleRimSlap = useCallback((type: 'wood_knock' | 'string_slap' | 'soundhole_edge') => {
    setActiveRimZone(type);
    globalGuitarEngine.playRimSlap(type, 0.95);
    setTimeout(() => setActiveRimZone(null), 250);

    if (isRecording && recordingStartTime) {
      const timeOffset = (Date.now() - recordingStartTime) / 1000;
      onAddRecordedEvent({
        id: `evt_rim_${Date.now()}`,
        stringIndex: 0,
        fret: 0,
        time: timeOffset,
        duration: 0.2,
        velocity: 0.95,
        isRimSlap: true,
        rimType: type,
      });
    }
  }, [isRecording, recordingStartTime, onAddRecordedEvent]);

  // Strum Touch Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartY.current = clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartY.current === null) return;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = clientY - touchStartY.current;
    const timeTaken = Date.now() - touchStartTime.current;

    // If drag distance is significant, treat as strum
    if (Math.abs(deltaY) > 25 && timeTaken < 400) {
      const isDown = deltaY > 0;
      handleStrumChord(isDown);
    }
    touchStartY.current = null;
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full min-h-screen bg-[#2A2624] p-2 pb-20 sm:p-4 sm:pb-24 text-stone-100 select-none overflow-hidden font-sans`}>
      
      {/* Phone Mockup Frame wrapper in Natural Tones theme */}
      <div 
        ref={guitarContainerRef}
        className={`relative flex flex-col w-full transition-all duration-300 rounded-[24px] border-[5px] border-[#3F3935] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden bg-[#2D1B0E] ${
          isPortraitMode 
            ? 'max-w-[400px] h-[calc(100vh-110px)] max-h-[660px] min-h-[480px]' 
            : 'max-w-4xl h-[calc(100vh-110px)] max-h-[500px] min-h-[380px]'
        }`}
      >
        
        {/* Top Header Control Bar */}
        <div className="relative z-30 flex items-center justify-between px-4 py-3 bg-[#1C1917]/90 backdrop-blur-md border-b border-[#3F3935]">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOrientation}
              title="สลับแนวตั้ง / แนวนอน"
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#2A2624] hover:bg-[#3F3935] text-stone-200 border border-[#3F3935] flex items-center gap-1 transition-all"
            >
              📱 {isPortraitMode ? 'แนวตั้ง' : 'แนวนอน'}
            </button>

            {/* Capo Display */}
            <span className="text-xs font-medium px-2 py-1 bg-[#2A2624] border border-[#3F3935] rounded-md text-orange-400">
              คาโป้: {capo > 0 ? `เฟรต ${capo}` : 'ไม่มี'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Record Toggle Button */}
            <button
              onClick={onToggleRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${
                isRecording 
                  ? 'bg-red-600 text-white animate-pulse shadow-red-950/50' 
                  : 'bg-[#2A2624] hover:bg-[#3F3935] text-red-400 border border-red-900/50'
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
              {isRecording ? 'บันทึกอยู่...' : 'บันทึกเสียง'}
            </button>

            {/* Sound Customizer Button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-[#2A2624] hover:bg-[#3F3935] text-orange-400 border border-[#3F3935] transition-all"
              title="ปรับแต่งเสียง"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Song Composer / Tab Button */}
            <button
              onClick={onOpenComposer}
              className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-stone-900 font-bold border border-orange-400 transition-all"
              title="แต่งเพลง / แท็บ"
            >
              <Music2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN GUITAR BODY & STRINGS AREA */}
        <div className="relative flex-1 flex flex-col justify-between overflow-hidden bg-[#2D1B0E] shadow-inner">
          
          {/* Wood Grain Texture Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 30%, #4A3728 0%, #2D1B0E 70%, #1C1917 100%),
                                repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 6px)`
            }}
          />

          {/* CHORD SELECTION BADGES */}
          <div className="relative z-20 flex items-center justify-start gap-2 p-2.5 overflow-x-auto bg-[#1C1917]/80 backdrop-blur-sm border-b border-[#3F3935] scrollbar-none">
            <span className="text-[11px] font-bold tracking-wider uppercase text-orange-400/90 shrink-0 px-1">
              คอร์ด:
            </span>
            {chordsList.map((chord) => {
              const isSelected = activeChord.id === chord.id;
              return (
                <button
                  key={chord.id}
                  onClick={() => onSelectChord(chord)}
                  style={{ backgroundColor: isSelected ? chord.color : '#2A2624' }}
                  className={`relative shrink-0 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all transform active:scale-95 shadow-md flex items-center gap-1.5 ${
                    isSelected 
                      ? 'text-white ring-2 ring-orange-400 ring-offset-2 ring-offset-[#1C1917] scale-105 z-10' 
                      : 'text-stone-300 hover:text-white border border-[#3F3935] hover:border-orange-500/50'
                  }`}
                >
                  {/* Pick Shape Icon */}
                  <span 
                    className="w-2.5 h-3 rounded-t-sm rounded-b-full border border-white/40"
                    style={{ backgroundColor: chord.color || '#f97316' }}
                  />
                  {chord.name}
                </button>
              );
            })}
          </div>

          {/* ACOUSTIC SOUNDHOLE & ROSETTE DECORATION */}
          <div className="relative flex-1 flex flex-col items-center justify-center my-1 min-h-[160px] max-h-[260px]">
            
            {/* Soundhole Outer Body Edge Knock Zone ("มีเสียงขอบ" - Body Rim) */}
            <button
              onClick={() => handleRimSlap('wood_knock')}
              className={`group absolute w-52 h-52 rounded-full border-6 border-amber-950/90 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all ${
                activeRimZone === 'wood_knock' ? 'scale-98 border-amber-500 ring-4 ring-amber-400/50' : 'hover:border-amber-900'
              }`}
            >
              {/* Rosette Inlay Rings */}
              <div className="w-44 h-44 rounded-full border-[8px] border-amber-800/80 bg-gradient-to-tr from-amber-950 via-amber-900 to-amber-950 flex items-center justify-center shadow-inner relative overflow-hidden">
                
                {/* Decorative Rosette Mosaic Pattern */}
                <div 
                  className="absolute inset-0 opacity-70 pointer-events-none"
                  style={{
                    backgroundImage: `repeating-conic-gradient(#d97706 0deg 15deg, #78350f 15deg 30deg, #451a03 30deg 45deg)`
                  }}
                />

                {/* Soundhole Inner Rosette Rim ("ขอบช่องเสียง") */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRimSlap('soundhole_edge');
                  }}
                  className={`relative z-10 w-32 h-32 rounded-full border-2 border-amber-400/40 bg-neutral-950 flex items-center justify-center shadow-[inset_0_8px_20px_rgba(0,0,0,0.95)] transition-all ${
                    activeRimZone === 'soundhole_edge' ? 'ring-2 ring-amber-300 ring-opacity-80 scale-95' : 'hover:border-amber-300/80'
                  }`}
                >
                  {/* Inside Dark Cavity */}
                  <div className="w-24 h-24 rounded-full bg-black shadow-inner flex flex-col items-center justify-center text-center p-1 opacity-90">
                    <span className="text-[9px] font-bold tracking-widest text-amber-500/70 uppercase">
                      Real Guitar
                    </span>
                    <span className="text-[8px] text-neutral-400 font-medium leading-tight">
                      แตะขอบ = ตบขอบ
                    </span>
                  </div>
                </button>
              </div>
            </button>

            {/* GUITAR STRINGS OVER SOUNDHOLE (Vertical / Horizontal Layout) */}
            <div 
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative z-20 w-full h-full flex items-center justify-around px-8 cursor-pointer"
            >
              {/* Render 6 Strings */}
              {stringGauges.map((thickness, stringIdx) => {
                const fret = activeChord.frets[stringIdx];
                const isMuted = fret === -1;
                const isVibrating = vibratingStrings[stringIdx];

                return (
                  <div
                    key={stringIdx}
                    onClick={(e) => handlePluckString(stringIdx, e)}
                    className="relative flex flex-col items-center justify-center h-full group py-4 px-2"
                  >
                    {/* String Fret Indicator Badge at Top */}
                    <div className="absolute top-2 z-30 flex flex-col items-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        isMuted 
                          ? 'bg-red-950/80 text-red-400 border border-red-800/40' 
                          : 'bg-amber-950/90 text-amber-300 border border-amber-700/50'
                      }`}>
                        {isMuted ? 'X' : (fret === 0 ? 'O' : `${fret}`)}
                      </span>
                    </div>

                    {/* Interactive String Line */}
                    <div 
                      style={{
                        width: `${thickness}px`,
                        background: stringColors[stringIdx],
                        boxShadow: isVibrating ? '0 0 12px #f59e0b, 0 0 4px #ffffff' : '0 1px 3px rgba(0,0,0,0.8)'
                      }}
                      className={`h-full transition-all duration-75 relative ${
                        isVibrating ? 'animate-bounce scale-x-125' : 'group-hover:brightness-125'
                      }`}
                    >
                      {/* String Wound Thread Detail */}
                      {stringIdx <= 2 && (
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_3px)] opacity-50" />
                      )}
                    </div>

                    {/* Interactive Floating Pick (Real Guitar Picks like screenshot) */}
                    {stringIdx % 2 === 0 && !isMuted && (
                      <div 
                        className={`absolute z-30 transition-transform ${
                          stringIdx === 0 ? 'top-1/4' : stringIdx === 2 ? 'top-1/2' : 'top-3/4'
                        }`}
                      >
                        <div 
                          style={{ backgroundColor: activeChord.color || '#3b82f6' }}
                          className="w-7 h-8 rounded-t-sm rounded-b-2xl shadow-lg border border-white/60 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-transform"
                        >
                          <span className="text-[7px] font-black text-white uppercase tracking-tighter rotate-[-90deg]">
                            REAL
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* BOTTOM EXPRESSION & ACTION CONTROL BAR */}
          <div className="relative z-30 p-3 bg-gradient-to-t from-[#1C1917] via-[#1C1917]/95 to-transparent flex flex-col gap-2">
            
            {/* Quick Strum & Rim Slap Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleStrumChord(true)}
                className="py-2.5 px-2 bg-gradient-to-b from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 text-stone-900 font-extrabold text-xs rounded-xl shadow-lg border border-orange-400 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
              >
                <span>⬇️ ดีดลง</span>
                <span className="text-[9px] text-stone-900/80 font-semibold">Strum Down</span>
              </button>

              <button
                onClick={() => handleStrumChord(false)}
                className="py-2.5 px-2 bg-gradient-to-b from-orange-700 to-orange-900 hover:from-orange-600 hover:to-orange-800 text-stone-100 font-extrabold text-xs rounded-xl shadow-lg border border-orange-500/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
              >
                <span>⬆️ ดีดขึ้น</span>
                <span className="text-[9px] text-orange-200/80 font-normal">Strum Up</span>
              </button>

              <button
                onClick={() => handleRimSlap('wood_knock')}
                className={`py-2.5 px-2 bg-[#2A2624] hover:bg-[#3F3935] text-stone-200 font-extrabold text-xs rounded-xl border border-[#3F3935] shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 ${
                  activeRimZone === 'wood_knock' ? 'bg-orange-950/60 ring-2 ring-orange-400' : ''
                }`}
              >
                <span>🪵 เคาะขอบ</span>
                <span className="text-[9px] text-stone-400 font-normal">Body Knock</span>
              </button>

              <button
                onClick={() => handleRimSlap('string_slap')}
                className={`py-2.5 px-2 bg-[#2A2624] hover:bg-[#3F3935] text-stone-200 font-extrabold text-xs rounded-xl border border-[#3F3935] shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 ${
                  activeRimZone === 'string_slap' ? 'bg-orange-950/60 ring-2 ring-orange-400' : ''
                }`}
              >
                <span>🎸 ตบสาย</span>
                <span className="text-[9px] text-stone-400 font-normal">String Slap</span>
              </button>
            </div>

            {/* Hint bar */}
            <div className="flex items-center justify-between text-[10px] text-stone-400 px-1 pt-1 border-t border-[#3F3935]">
              <span>💡 ลากนิ้วขึ้น-ลงเพื่อดีด หรือ แตะสายเพื่อเกาเพลง</span>
              <span className="font-semibold text-orange-400">คอร์ดปัจจุบัน: {activeChord.name}</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
