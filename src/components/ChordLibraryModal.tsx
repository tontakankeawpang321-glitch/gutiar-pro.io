import React, { useState } from 'react';
import { GuitarChord } from '../types/guitar';
import { Plus, X, Trash2, Check, Sparkles } from 'lucide-react';

interface ChordLibraryModalProps {
  chords: GuitarChord[];
  onAddChord: (newChord: GuitarChord) => void;
  onDeleteChord: (id: string) => void;
  onClose: () => void;
}

export const ChordLibraryModal: React.FC<ChordLibraryModalProps> = ({
  chords,
  onAddChord,
  onDeleteChord,
  onClose,
}) => {
  const [newChordName, setNewChordName] = useState('');
  const [frets, setFrets] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [pickColor, setPickColor] = useState('#3b82f6');

  const handleCreateChord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChordName.trim()) return;

    const newChord: GuitarChord = {
      id: `custom_${Date.now()}`,
      name: newChordName.trim(),
      frets: [...frets],
      color: pickColor,
    };

    onAddChord(newChord);
    setNewChordName('');
    setFrets([0, 0, 0, 0, 0, 0]);
  };

  const stringLabels = ['E (Low)', 'A', 'D', 'G', 'B', 'E (High)'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[#1C1917] border border-[#3F3935] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1C1917] border-b border-[#3F3935]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2A2624] border border-[#3F3935] text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">คลังคอร์ด & สร้างคอร์ดใหม่</h2>
              <p className="text-xs text-stone-400">Guitar Chord Library & Custom Fingering Builder</p>
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
          
          {/* Create New Custom Chord Form */}
          <form onSubmit={handleCreateChord} className="p-4 rounded-2xl bg-[#2A2624] border border-[#3F3935] space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 block">
              ➕ สร้างคอร์ดใหม่ของคุณ (Custom Chord Builder)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 font-semibold block mb-1">ชื่อคอร์ด (Chord Name):</label>
                <input
                  type="text"
                  placeholder="เช่น Cadd9, Gsus4"
                  value={newChordName}
                  onChange={(e) => setNewChordName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1C1917] border border-[#3F3935] text-xs text-orange-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 font-semibold block mb-1">สีปิ๊กคอร์ด (Pick Color):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={pickColor}
                    onChange={(e) => setPickColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-stone-300">{pickColor}</span>
                </div>
              </div>
            </div>

            {/* 6 String Fret Selection */}
            <div className="space-y-2">
              <label className="text-[11px] text-stone-400 font-semibold block">
                ตำแหน่งเฟรตทั้ง 6 สาย (-1 = ปิด X, 0 = เปิด O, 1-12 = ช่องเฟรต):
              </label>

              <div className="grid grid-cols-6 gap-2 text-center">
                {stringLabels.map((lbl, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] text-orange-400/90 font-bold">{lbl}</span>
                    <input
                      type="number"
                      min="-1"
                      max="12"
                      value={frets[idx]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        const next = [...frets];
                        next[idx] = val;
                        setFrets(next);
                      }}
                      className="w-full py-1 text-center rounded-lg bg-[#1C1917] border border-[#3F3935] text-xs font-bold text-orange-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-stone-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> เพิ่มคอร์ดใหม่นี้
            </button>
          </form>

          {/* Existing Chords List */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 block">
              🎸 คอร์ดทั้งหมดในระบบ ({chords.length} คอร์ด)
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {chords.map((chord) => (
                <div
                  key={chord.id}
                  className="p-3 rounded-2xl bg-[#2A2624]/70 border border-[#3F3935] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-4 rounded-t-sm rounded-b-full shadow border border-white/40"
                      style={{ backgroundColor: chord.color || '#f97316' }}
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-100">{chord.name}</div>
                      <div className="text-[9px] font-mono text-stone-400">
                        {chord.frets.map(f => f === -1 ? 'X' : f).join('-')}
                      </div>
                    </div>
                  </div>

                  {chord.id.startsWith('custom_') && (
                    <button
                      onClick={() => onDeleteChord(chord.id)}
                      className="p-1 text-stone-400 hover:text-red-400 transition-colors"
                      title="ลบคอร์ด"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1C1917] border-t border-[#3F3935] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2A2624] hover:bg-[#3F3935] text-stone-200 text-xs font-bold transition-all"
          >
            ปิดหน้าจอ
          </button>
        </div>

      </div>
    </div>
  );
};
