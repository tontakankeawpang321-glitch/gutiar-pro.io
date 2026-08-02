import React from 'react';
import { AudioSettings, BodyPreset } from '../types/guitar';
import { TUNINGS } from '../data/guitarData';
import { Sliders, Volume2, Sparkles, X, RotateCcw, Flame } from 'lucide-react';

interface SoundCustomizerProps {
  settings: AudioSettings;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  selectedTuningId: string;
  onSelectTuning: (tuningId: string) => void;
  onClose: () => void;
}

export const SoundCustomizer: React.FC<SoundCustomizerProps> = ({
  settings,
  onUpdateSettings,
  selectedTuningId,
  onSelectTuning,
  onClose,
}) => {
  const bodyPresets: { id: BodyPreset; name: string; desc: string; icon: string }[] = [
    { id: 'dreadnought', name: 'Dreadnought Spruce (มาตรฐาน)', desc: 'เสียงใส มีมิติ กังวาน เบสแน่น', icon: '🪵' },
    { id: 'nylon', name: 'Nylon Classical (คลาสสิค)', desc: 'เสียงนุ่มละมุน สายไนล่อน หวานละมุน', icon: '🎼' },
    { id: 'jumbo', name: 'Jumbo Mahogany (จัมโบ้)', desc: 'เสียงใหญ่ กังวาน พลังพุ่งกังวาน', icon: '🔊' },
    { id: 'parlor', name: 'Vintage Parlor (พาร์เลอร์)', desc: 'เสียงกลางชัด สไตล์วินเทจ ยุค 70s', icon: '📻' },
    { id: '12string', name: '12-String Shimmer (12 สาย)', desc: 'เสียงคอรัสระยิบระยับ มิติแน่นตึ้บ', icon: '✨' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#1C1917] border border-[#3F3935] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1C1917] border-b border-[#3F3935]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2A2624] border border-[#3F3935] text-orange-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">ปรับแต่งเสียงกีต้าร์โปร่ง</h2>
              <p className="text-xs text-stone-400">Custom Acoustic Guitar Sound Engine & EQ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2A2624] text-stone-400 hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-stone-800">
          
          {/* 1. Body Material Presets */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>🎸</span> ชนิดบอดี้กีต้าร์ (Body Preset)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bodyPresets.map((preset) => {
                const isActive = settings.bodyPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onUpdateSettings({ bodyPreset: preset.id })}
                    className={`flex items-start gap-3 p-3 rounded-2xl text-left border transition-all ${
                      isActive 
                        ? 'bg-[#2A2624] border-orange-500 ring-2 ring-orange-500/50 shadow-lg' 
                        : 'bg-[#2A2624]/60 hover:bg-[#2A2624] border-[#3F3935]'
                    }`}
                  >
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-stone-100">{preset.name}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{preset.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Equalizer (3-Band EQ) */}
          <div className="p-4 rounded-2xl bg-[#2A2624]/80 border border-[#3F3935] space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">🎛️ อีควอไลเซอร์ (3-Band EQ)</span>
              <button 
                onClick={() => onUpdateSettings({ bassLevel: 2.0, midLevel: 0.0, trebleLevel: 1.5 })}
                className="text-[10px] text-stone-400 hover:text-orange-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> รีเซ็ต EQ
              </button>
            </label>

            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Bass */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-stone-300">เสียงทุ้ม (Bass)</span>
                <input
                  type="range"
                  min="-6"
                  max="8"
                  step="0.5"
                  value={settings.bassLevel}
                  onChange={(e) => onUpdateSettings({ bassLevel: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
                <span className="text-[11px] font-mono text-orange-400">{settings.bassLevel > 0 ? `+${settings.bassLevel}` : settings.bassLevel} dB</span>
              </div>

              {/* Mid */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-stone-300">เสียงกลาง (Mid)</span>
                <input
                  type="range"
                  min="-6"
                  max="8"
                  step="0.5"
                  value={settings.midLevel}
                  onChange={(e) => onUpdateSettings({ midLevel: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
                <span className="text-[11px] font-mono text-orange-400">{settings.midLevel > 0 ? `+${settings.midLevel}` : settings.midLevel} dB</span>
              </div>

              {/* Treble */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-stone-300">เสียงแหลม (Treble)</span>
                <input
                  type="range"
                  min="-6"
                  max="8"
                  step="0.5"
                  value={settings.trebleLevel}
                  onChange={(e) => onUpdateSettings({ trebleLevel: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
                <span className="text-[11px] font-mono text-orange-400">{settings.trebleLevel > 0 ? `+${settings.trebleLevel}` : settings.trebleLevel} dB</span>
              </div>
            </div>
          </div>

          {/* 3. Reverb & Acoustics */}
          <div className="p-4 rounded-2xl bg-[#2A2624]/80 border border-[#3F3935] space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400">
              🔊 มิติเสียงกังวาน (Acoustic Reverb & Attack)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reverb Level */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300">ความกังวานห้อง (Reverb):</span>
                  <span className="text-orange-400 font-mono">{Math.round(settings.reverbLevel * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={settings.reverbLevel}
                  onChange={(e) => onUpdateSettings({ reverbLevel: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Pick Hardness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300">น้ำหนักปิ๊กกระทบสาย (Pick Attack):</span>
                  <span className="text-orange-400 font-mono">{Math.round(settings.pickHardness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.pickHardness}
                  onChange={(e) => onUpdateSettings({ pickHardness: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Rim Slap Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300">ความดังเสียงตบขอบไม้ (Rim Volume):</span>
                  <span className="text-orange-400 font-mono">{Math.round(settings.rimVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={settings.rimVolume}
                  onChange={(e) => onUpdateSettings({ rimVolume: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* String Damping */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300">ความยาวหางเสียงสาย (String Sustain):</span>
                  <span className="text-orange-400 font-mono">{Math.round(settings.stringDamping * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.2"
                  step="0.05"
                  value={settings.stringDamping}
                  onChange={(e) => onUpdateSettings({ stringDamping: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Guitar Tuning & Capo */}
          <div className="p-4 rounded-2xl bg-[#2A2624]/80 border border-[#3F3935] space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400">
              🎼 ตั้งสาย & หนีบคาโป้ (Tuning & Capo)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tuning selector */}
              <div className="space-y-1.5">
                <span className="text-xs text-stone-300">การตั้งสาย (Tuning):</span>
                <select
                  value={selectedTuningId}
                  onChange={(e) => onSelectTuning(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1C1917] border border-[#3F3935] text-xs text-orange-300 focus:outline-none focus:border-orange-500"
                >
                  {TUNINGS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capo position */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300">ตำแหน่งคาโป้ (Capo Fret):</span>
                  <span className="text-orange-400 font-mono">{settings.capo > 0 ? `เฟรต ${settings.capo}` : 'ไม่มี (Open)'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={settings.capo}
                  onChange={(e) => onUpdateSettings({ capo: parseInt(e.target.value, 10) })}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1C1917] border-t border-[#3F3935] flex items-center justify-between">
          <span className="text-xs text-stone-400">เสียงปรับเปลี่ยนแบบเรียลไทม์พร้อมเล่น</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-stone-900 text-xs font-bold shadow-lg transition-all"
          >
            เรียบร้อย (Done)
          </button>
        </div>

      </div>
    </div>
  );
};
