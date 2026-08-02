import React, { useRef, useState } from 'react';
import { SongProject } from '../types/guitar';
import { DEMO_PROJECTS } from '../data/guitarData';
import { globalGuitarEngine } from '../audio/GuitarAudioEngine';
import { 
  Download, Upload, Save, FolderOpen, Trash2, Music, Check, X, FileAudio 
} from 'lucide-react';

interface ProjectManagerProps {
  currentProject: SongProject;
  onLoadProject: (project: SongProject) => void;
  savedProjects: SongProject[];
  onSaveCurrentProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentProject,
  onLoadProject,
  savedProjects,
  onSaveCurrentProject,
  onDeleteProject,
  onClose,
}) => {
  const [isExportingAudio, setIsExportingAudio] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export Project JSON file ("บันทึกโปรเจคเพลงดาวน์โหลดไฟล์")
  const handleExportProjectJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentProject.title.replace(/\s+/g, '_')}.guitarproj`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccessMessage('ดาวน์โหลดไฟล์โปรเจค (.guitarproj) สำเร็จแล้ว!');
    setTimeout(() => setDownloadSuccessMessage(null), 3000);
  };

  // 2. Import Project JSON file ("นำโปรเจคเข้าได้")
  const handleImportProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedProj = JSON.parse(event.target?.result as string) as SongProject;
        if (importedProj.title && Array.isArray(importedProj.events)) {
          onLoadProject(importedProj);
          setDownloadSuccessMessage(`นำเข้าโปรเจค "${importedProj.title}" เรียบร้อยแล้ว!`);
          setTimeout(() => setDownloadSuccessMessage(null), 3000);
        } else {
          alert('รูปแบบไฟล์โปรเจคไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการเปิดไฟล์โปรเจค');
      }
    };
    reader.readAsText(file);
  };

  // 3. Export Audio WAV file ("ดาวน์โหลดเสียงที่แต่งได้")
  const handleExportAudioWav = async () => {
    if (currentProject.events.length === 0) {
      alert('ยังไม่มีโน้ตเพลงที่บันทึกไว้ โปรดลองอัดเสียงหรือสร้างโน้ตเพลงก่อน');
      return;
    }

    setIsExportingAudio(true);
    
    // Start engine recording
    globalGuitarEngine.startAudioRecording();

    // Render events with timing
    const maxTime = Math.max(...currentProject.events.map((e) => e.time), 3);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > maxTime + 1) {
        clearInterval(interval);
        finishAudioExport();
        return;
      }

      currentProject.events.forEach((evt) => {
        if (Math.abs(evt.time - elapsed) < 0.03) {
          if (evt.isRimSlap) {
            globalGuitarEngine.playRimSlap(evt.rimType || 'wood_knock', evt.velocity);
          } else {
            globalGuitarEngine.playString(evt.stringIndex, evt.fret, evt.velocity);
          }
        }
      });
    }, 25);

    const finishAudioExport = async () => {
      const blob = await globalGuitarEngine.stopAudioRecording();
      setIsExportingAudio(false);

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProject.title.replace(/\s+/g, '_')}_Audio.wav`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setDownloadSuccessMessage('ดาวน์โหลดไฟล์เสียง (.wav) สำเร็จเรียบร้อย!');
        setTimeout(() => setDownloadSuccessMessage(null), 3000);
      }
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1C1917] border border-[#3F3935] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1C1917] border-b border-[#3F3935]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2A2624] border border-[#3F3935] text-orange-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">จัดการโปรเจค & ส่งออกไฟล์เสียง</h2>
              <p className="text-xs text-stone-400">Save, Export Audio, Import/Export Project</p>
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
          
          {/* Toast Alert */}
          {downloadSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-600/60 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              {downloadSuccessMessage}
            </div>
          )}

          {/* Current Active Song Details & Export Actions */}
          <div className="p-4 rounded-2xl bg-[#2A2624] border border-[#3F3935] space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F3935] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">โปรเจคปัจจุบัน</span>
                <h3 className="text-base font-extrabold text-stone-100">{currentProject.title}</h3>
                <p className="text-xs text-stone-400">ศิลปิน: {currentProject.artist} | โน้ตที่บันทึก: {currentProject.events.length} ตัว</p>
              </div>

              <button
                onClick={onSaveCurrentProject}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-stone-900 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> บันทึกเพลงนี้
              </button>
            </div>

            {/* Main File Export Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* 1. Export Audio WAV */}
              <button
                onClick={handleExportAudioWav}
                disabled={isExportingAudio}
                className={`p-3.5 rounded-2xl border transition-all text-left flex items-start gap-3 ${
                  isExportingAudio 
                    ? 'bg-[#2A2624]/40 border-[#3F3935] text-stone-400 opacity-80 cursor-wait' 
                    : 'bg-[#1C1917] hover:bg-[#2A2624] border-[#3F3935] text-orange-300 shadow-md'
                }`}
              >
                <div className="p-2 rounded-xl bg-[#2A2624] border border-[#3F3935] text-orange-400">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-100">
                    {isExportingAudio ? 'กำลังเรนเดอร์ไฟล์เสียง...' : 'ดาวน์โหลดเสียงที่แต่ง (.WAV)'}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    ดาวน์โหลดไฟล์เสียงกีต้าร์สมจริงนำไปเปิดฟังได้ทันที
                  </p>
                </div>
              </button>

              {/* 2. Export Project File (.guitarproj) */}
              <button
                onClick={handleExportProjectJson}
                className="p-3.5 rounded-2xl bg-[#1C1917] hover:bg-[#2A2624] border border-[#3F3935] text-orange-300 shadow-md text-left flex items-start gap-3 transition-all"
              >
                <div className="p-2 rounded-xl bg-[#2A2624] border border-[#3F3935] text-orange-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-100">ดาวน์โหลดโปรเจค (.guitarproj)</div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    บันทึกโครงสร้างคอร์ด & โน้ตเก็บไว้ในเครื่อง
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Import Existing Project File */}
          <div className="p-4 rounded-2xl bg-[#2A2624]/80 border border-[#3F3935] space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>📥</span> นำโปรเจคเข้า (Import Project File)
            </label>
            <p className="text-xs text-stone-400">
              เปิดไฟล์ `.guitarproj` หรือ `.json` ที่เคยบันทึกไว้กลับเข้ามาเล่นและแก้ไขต่อ
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".guitarproj,.json"
              onChange={handleImportProjectJson}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl bg-[#1C1917] hover:bg-[#2A2624] border border-dashed border-orange-500/60 text-orange-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-orange-400" />
              คลิกเพื่อเลือกไฟล์โปรเจคจากเครื่องของคุณ
            </button>
          </div>

          {/* Saved Songs List */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>📚</span> รายการเพลงที่บันทึกไว้ในเครื่อง (Saved Songs)
            </label>

            <div className="space-y-2">
              {savedProjects.map((proj) => {
                const isActive = proj.id === currentProject.id;
                return (
                  <div
                    key={proj.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-[#2A2624] border-orange-500 ring-1 ring-orange-500' 
                        : 'bg-[#2A2624]/60 hover:bg-[#2A2624] border-[#3F3935]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-orange-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-stone-100">{proj.title}</div>
                        <div className="text-[11px] text-stone-400">ศิลปิน: {proj.artist} | {proj.events.length} โน้ต</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoadProject(proj)}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-stone-900 font-bold text-xs shadow transition-all"
                      >
                        เปิดเพลงนี้
                      </button>

                      {proj.id !== 'demo_1' && (
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1.5 rounded-lg bg-[#1C1917] hover:bg-red-950 text-stone-400 hover:text-red-400 border border-[#3F3935] transition-colors"
                          title="ลบเพลง"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1C1917] border-t border-[#3F3935] flex items-center justify-between">
          <span className="text-xs text-stone-400">ระบบบันทึกโปรเจคแบบออฟไลน์ 100%</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2A2624] hover:bg-[#3F3935] text-stone-200 text-xs font-bold transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
