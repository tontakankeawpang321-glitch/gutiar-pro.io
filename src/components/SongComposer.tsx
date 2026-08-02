import React, { useState, useEffect, useRef } from 'react';
import { GuitarChord, NoteEvent, SongProject, StrumPattern } from '../types/guitar';
import { DEFAULT_CHORDS, STRUM_PATTERNS } from '../data/guitarData';
import { globalGuitarEngine } from '../audio/GuitarAudioEngine';
import { SongNoteVisualizer } from './SongNoteVisualizer';
import { 
  Play, Pause, Square, Plus, Trash2, Save, Download, Upload, 
  Music, Clock, FileText, Sparkles, X, ChevronRight 
} from 'lucide-react';

interface SongComposerProps {
  currentProject: SongProject;
  onUpdateProject: (updated: Partial<SongProject>) => void;
  availableChords: GuitarChord[];
  onClose: () => void;
}

export const SongComposer: React.FC<SongComposerProps> = ({
  currentProject,
  onUpdateProject,
  availableChords,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [selectedChordId, setSelectedChordId] = useState<string>(availableChords[0]?.id || 'c');
  const [lyricsText, setLyricsText] = useState(currentProject.lyrics || '');
  const [bpm, setBpm] = useState(currentProject.bpm || 85);
  const [selectedStrumPattern, setSelectedStrumPattern] = useState<StrumPattern>(STRUM_PATTERNS[0]);
  
  const animFrameRef = useRef<number | null>(null);
  const playbackStartRealTimeRef = useRef<number>(0);
  const pauseTimeOffsetRef = useRef<number>(0);
  const playedEventsSetRef = useRef<Set<string>>(new Set());

  // Total song duration
  const totalSongDuration = Math.max(
    ...currentProject.events.map((e) => e.time + e.duration),
    8.0
  );

  // Auto-generate strum sequence for chord progression
  const handleAutoGenerateStrumSequence = () => {
    const chordList = currentProject.chords.length > 0 ? currentProject.chords : [availableChords[0], availableChords[1], availableChords[2], availableChords[3]];
    const secondsPerBeat = 60 / bpm;
    const generatedEvents: NoteEvent[] = [];

    chordList.forEach((chord, chordIdx) => {
      const baseTime = chordIdx * 4 * secondsPerBeat; // 4 beats per chord bar

      selectedStrumPattern.pattern.forEach((p, pIdx) => {
        const beatOffset = (p.beat - 1) * secondsPerBeat;
        const time = baseTime + beatOffset;

        if (p.type === 'rim') {
          generatedEvents.push({
            id: `gen_rim_${chordIdx}_${pIdx}`,
            stringIndex: 0,
            fret: 0,
            time,
            duration: 0.2,
            velocity: 0.9,
            isRimSlap: true,
            rimType: 'wood_knock',
          });
        } else {
          // Strum or Pluck
          const strRange = p.stringRange || [0, 5];
          for (let strIdx = strRange[0]; strIdx <= strRange[1]; strIdx++) {
            const fret = chord.frets[strIdx];
            if (fret !== -1) {
              generatedEvents.push({
                id: `gen_${chordIdx}_${pIdx}_${strIdx}`,
                stringIndex: strIdx,
                fret,
                time: time + (p.type === 'down' ? strIdx * 0.012 : (5 - strIdx) * 0.012),
                duration: 0.8,
                velocity: p.type === 'down' ? 0.85 : 0.7,
                chordName: chord.name,
              });
            }
          }
        }
      });
    });

    onUpdateProject({
      events: generatedEvents,
      bpm,
      lyrics: lyricsText,
    });
  };

  // High-precision playback loop
  const stopPlayback = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    globalGuitarEngine.stopAllVoices();
    setIsPlaying(false);
  };

  const handleSeek = (seekTime: number) => {
    pauseTimeOffsetRef.current = seekTime;
    setPlaybackTime(seekTime);
    playedEventsSetRef.current.clear();
    if (isPlaying) {
      playbackStartRealTimeRef.current = Date.now() - seekTime * 1000;
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    let eventsToPlay = currentProject.events;
    if (eventsToPlay.length === 0) {
      handleAutoGenerateStrumSequence();
      eventsToPlay = currentProject.events;
    }

    setIsPlaying(true);
    const startRealTime = Date.now() - pauseTimeOffsetRef.current * 1000;
    playbackStartRealTimeRef.current = startRealTime;

    const maxTime = Math.max(...eventsToPlay.map((e) => e.time + e.duration), 4.0);

    const tick = () => {
      const now = Date.now();
      const elapsed = (now - playbackStartRealTimeRef.current) / 1000;
      setPlaybackTime(elapsed);

      if (elapsed >= maxTime + 0.5) {
        stopPlayback();
        setPlaybackTime(0);
        pauseTimeOffsetRef.current = 0;
        playedEventsSetRef.current.clear();
        return;
      }

      // Schedule notes that fall in the current time frame
      eventsToPlay.forEach((evt) => {
        if (!playedEventsSetRef.current.has(evt.id) && evt.time <= elapsed + 0.04) {
          playedEventsSetRef.current.add(evt.id);
          const delaySec = Math.max(0, evt.time - elapsed);

          if (evt.isRimSlap) {
            globalGuitarEngine.playRimSlap(evt.rimType || 'wood_knock', evt.velocity, delaySec);
          } else {
            globalGuitarEngine.playString(evt.stringIndex, evt.fret, evt.velocity, undefined, delaySec);
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      globalGuitarEngine.stopAllVoices();
    };
  }, []);

  const handleAddChordToBar = (chord: GuitarChord) => {
    onUpdateProject({
      chords: [...currentProject.chords, chord],
    });
  };

  const handleRemoveChordFromBar = (idx: number) => {
    const updated = [...currentProject.chords];
    updated.splice(idx, 1);
    onUpdateProject({ chords: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1C1917] border border-[#3F3935] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1C1917] border-b border-[#3F3935]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2A2624] border border-[#3F3935] text-orange-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">ห้องแต่งเพลง & แต่งแท็ปคอร์ด</h2>
              <p className="text-xs text-stone-400">Song Composer, Strum Sequencer & Lyrics Sheet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2A2624] text-stone-400 hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-stone-800">
          
          {/* Live Note & Tab Visualizer */}
          <SongNoteVisualizer
            events={currentProject.events}
            currentTime={playbackTime}
            duration={totalSongDuration}
            isPlaying={isPlaying}
            onSeek={handleSeek}
            chordsList={availableChords}
            bpm={bpm}
            lyrics={lyricsText}
          />

          {/* Song Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#2A2624]/80 border border-[#3F3935]">
            <div>
              <label className="text-[11px] text-stone-400 font-semibold block mb-1">ชื่อเพลง (Song Title):</label>
              <input
                type="text"
                value={currentProject.title}
                onChange={(e) => onUpdateProject({ title: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#1C1917] border border-[#3F3935] text-xs text-orange-300 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-stone-400 font-semibold block mb-1">ศิลปิน / ผู้แต่ง:</label>
              <input
                type="text"
                value={currentProject.artist}
                onChange={(e) => onUpdateProject({ artist: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#1C1917] border border-[#3F3935] text-xs text-orange-300 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-stone-400 font-semibold block mb-1">ความเร็วเพลง (BPM): {bpm}</label>
              <input
                type="range"
                min="50"
                max="160"
                value={bpm}
                onChange={(e) => {
                  setBpm(parseInt(e.target.value, 10));
                  onUpdateProject({ bpm: parseInt(e.target.value, 10) });
                }}
                className="w-full accent-orange-500"
              />
            </div>
          </div>

          {/* Chord Progression Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <span>🎼</span> ลำดับคอร์ดในเพลง (Chord Progression Bar)
              </label>
              <span className="text-[11px] text-stone-400">คลิกที่คอร์ดเพื่อเพิ่มเข้าห้องเพลง</span>
            </div>

            {/* Selected Chords Timeline */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#2A2624] border border-[#3F3935] min-h-[60px] overflow-x-auto">
              {currentProject.chords.length === 0 ? (
                <span className="text-xs text-stone-400 italic px-2">ยังไม่มีคอร์ดในตาราง (กดปุ่มคอร์ดด้านล่างเพื่อเพิ่ม)</span>
              ) : (
                currentProject.chords.map((chord, idx) => (
                  <div
                    key={`${chord.id}_${idx}`}
                    className="relative group shrink-0 px-3.5 py-2 rounded-xl bg-[#1C1917] border border-[#3F3935] text-orange-300 font-bold text-xs flex items-center gap-2 shadow-md"
                  >
                    <span>{chord.name}</span>
                    <button
                      onClick={() => handleRemoveChordFromBar(idx)}
                      className="text-stone-400 hover:text-red-400 transition-colors"
                      title="ลบคอร์ด"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Chord Add Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {availableChords.map((chord) => (
                <button
                  key={chord.id}
                  onClick={() => handleAddChordToBar(chord)}
                  style={{ backgroundColor: chord.color || '#f97316' }}
                  className="px-3 py-1 rounded-lg text-stone-900 font-bold text-xs shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {chord.name}
                </button>
              ))}
            </div>
          </div>

          {/* Strumming Pattern Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>🥁</span> เลือกจังหวะดีดอัตโนมัติ (Strumming Pattern)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STRUM_PATTERNS.map((p) => {
                const isSelected = selectedStrumPattern.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedStrumPattern(p)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected 
                        ? 'bg-[#2A2624] border-orange-500 ring-2 ring-orange-500/50' 
                        : 'bg-[#2A2624]/60 hover:bg-[#2A2624] border-[#3F3935]'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-100">{p.name}</div>
                    <div className="text-[11px] text-stone-400 mt-1">อัตราจังหวะ: {p.timeSignature}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleAutoGenerateStrumSequence}
              className="w-full py-2.5 rounded-xl bg-[#2A2624] hover:bg-[#3F3935] border border-[#3F3935] text-orange-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
              สร้างโน้ตดีดตามจังหวะคอร์ดอัตโนมัติ (Generate Notes)
            </button>
          </div>

          {/* Lyrics & Chord Editor Sheet */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>📝</span> โน้ตเนื้อเพลง & คอร์ดประกอบ (Lyrics Sheet)
            </label>
            <textarea
              rows={5}
              value={lyricsText}
              onChange={(e) => {
                setLyricsText(e.target.value);
                onUpdateProject({ lyrics: e.target.value });
              }}
              placeholder={`พิมพ์เนื้อเพลงพร้อมตำแหน่งคอร์ด เช่น:\nC          G          Am         F\nสายลมแผ่วเบา ยามเย็นวันพรุ่งนี้...`}
              className="w-full p-3 rounded-2xl bg-[#2A2624] border border-[#3F3935] text-xs font-mono text-stone-100 focus:outline-none focus:border-orange-500 leading-relaxed"
            />
          </div>

        </div>

        {/* Footer Playback & Controls */}
        <div className="p-4 bg-[#1C1917] border-t border-[#3F3935] flex items-center justify-between">
          <button
            onClick={togglePlayback}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                : 'bg-orange-600 hover:bg-orange-500 text-stone-900'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'หยุดเล่น (Stop)' : 'ทดลองเล่นเพลงที่แต่ง (Play Song)'}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2A2624] hover:bg-[#3F3935] text-stone-200 text-xs font-bold transition-all"
          >
            ปิดหน้าจอ
          </button>
        </div>

      </div>
    </div>
  );
};
