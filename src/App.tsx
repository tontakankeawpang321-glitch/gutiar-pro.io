import React, { useState, useEffect } from 'react';
import { GuitarView } from './components/GuitarView';
import { SoundCustomizer } from './components/SoundCustomizer';
import { SongComposer } from './components/SongComposer';
import { ProjectManager } from './components/ProjectManager';
import { ChordLibraryModal } from './components/ChordLibraryModal';
import { GuitarChord, AudioSettings, SongProject, NoteEvent } from './types/guitar';
import { DEFAULT_CHORDS, DEMO_PROJECTS, TUNINGS } from './data/guitarData';
import { globalGuitarEngine } from './audio/GuitarAudioEngine';

export default function App() {
  // 1. Chords State
  const [chords, setChords] = useState<GuitarChord[]>(() => {
    const saved = localStorage.getItem('real_guitar_chords');
    return saved ? JSON.parse(saved) : DEFAULT_CHORDS;
  });
  const [activeChord, setActiveChord] = useState<GuitarChord>(chords[0] || DEFAULT_CHORDS[0]);

  // 2. Audio Engine Settings State
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(globalGuitarEngine.getSettings());
  const [selectedTuningId, setSelectedTuningId] = useState<string>('standard');

  // 3. Orientation State (Default Vertical Portrait Mobile as requested)
  const [isPortraitMode, setIsPortraitMode] = useState<boolean>(true);

  // 4. Recording & Song Project State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordedEvents, setRecordedEvents] = useState<NoteEvent[]>([]);

  const [savedProjects, setSavedProjects] = useState<SongProject[]>(() => {
    const saved = localStorage.getItem('real_guitar_projects');
    return saved ? JSON.parse(saved) : DEMO_PROJECTS;
  });
  const [currentProject, setCurrentProject] = useState<SongProject>(savedProjects[0] || DEMO_PROJECTS[0]);

  // 5. Active Modal Windows State
  const [activeModal, setActiveModal] = useState<'settings' | 'composer' | 'projects' | 'chordLibrary' | null>(null);

  // Save Chords to localStorage
  useEffect(() => {
    localStorage.setItem('real_guitar_chords', JSON.stringify(chords));
  }, [chords]);

  // Save Projects to localStorage
  useEffect(() => {
    localStorage.setItem('real_guitar_projects', JSON.stringify(savedProjects));
  }, [savedProjects]);

  // Update Audio Engine Settings
  const handleUpdateAudioSettings = (newSettings: Partial<AudioSettings>) => {
    const updated = { ...audioSettings, ...newSettings };
    setAudioSettings(updated);
    globalGuitarEngine.updateSettings(updated);
  };

  // Toggle Live Recording
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop Recording
      setIsRecording(false);
      setRecordingStartTime(null);

      // Save recorded events to current project
      if (recordedEvents.length > 0) {
        const updatedProject: SongProject = {
          ...currentProject,
          events: [...currentProject.events, ...recordedEvents],
          updatedAt: new Date().toISOString(),
        };
        setCurrentProject(updatedProject);

        // Update in saved projects list
        setSavedProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
      }
    } else {
      // Start Recording
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordedEvents([]);
    }
  };

  const handleAddRecordedEvent = (event: NoteEvent) => {
    setRecordedEvents((prev) => [...prev, event]);
  };

  // Project Actions
  const handleSaveCurrentProject = () => {
    const exists = savedProjects.some((p) => p.id === currentProject.id);
    let updatedList: SongProject[];

    if (exists) {
      updatedList = savedProjects.map((p) =>
        p.id === currentProject.id ? { ...currentProject, updatedAt: new Date().toISOString() } : p
      );
    } else {
      updatedList = [{ ...currentProject, updatedAt: new Date().toISOString() }, ...savedProjects];
    }

    setSavedProjects(updatedList);
  };

  const handleDeleteProject = (projId: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== projId));
    if (currentProject.id === projId) {
      setCurrentProject(savedProjects[0] || DEMO_PROJECTS[0]);
    }
  };

  const handleAddCustomChord = (newChord: GuitarChord) => {
    setChords((prev) => [...prev, newChord]);
    setActiveChord(newChord);
  };

  const handleDeleteChord = (chordId: string) => {
    setChords((prev) => prev.filter((c) => c.id !== chordId));
    if (activeChord.id === chordId) {
      setActiveChord(chords[0] || DEFAULT_CHORDS[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#2A2624] text-stone-100 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      
      {/* Primary Guitar Instrument Screen */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 pb-16 sm:p-4 sm:pb-20">
        <GuitarView
          activeChord={activeChord}
          onSelectChord={setActiveChord}
          chordsList={chords}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          recordedEvents={recordedEvents}
          onAddRecordedEvent={handleAddRecordedEvent}
          recordingStartTime={recordingStartTime}
          capo={audioSettings.capo}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenComposer={() => setActiveModal('composer')}
          isPortraitMode={isPortraitMode}
          onToggleOrientation={() => setIsPortraitMode(!isPortraitMode)}
        />
      </main>

      {/* Floating Bottom Navigation Toolbar in Natural Tones theme */}
      <footer className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 bg-[#26211E]/95 backdrop-blur-md border border-[#3F3935] rounded-full shadow-2xl text-[11px] sm:text-xs max-w-[96vw] overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveModal('settings')}
          className={`px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all ${
            activeModal === 'settings' 
              ? 'bg-orange-500 text-stone-900 shadow-md shadow-orange-950/50' 
              : 'hover:bg-[#3F3935]/60 text-stone-300 hover:text-orange-400'
          }`}
        >
          🎛️ ปรับแต่งเสียง
        </button>

        <span className="w-px h-3.5 bg-[#3F3935] shrink-0" />

        <button
          onClick={() => setActiveModal('composer')}
          className={`px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all ${
            activeModal === 'composer' 
              ? 'bg-orange-500 text-stone-900 shadow-md shadow-orange-950/50' 
              : 'hover:bg-[#3F3935]/60 text-stone-300 hover:text-orange-400'
          }`}
        >
          🎼 แต่งเพลง & แท็บ
        </button>

        <span className="w-px h-3.5 bg-[#3F3935] shrink-0" />

        <button
          onClick={() => setActiveModal('projects')}
          className={`px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all ${
            activeModal === 'projects' 
              ? 'bg-orange-500 text-stone-900 shadow-md shadow-orange-950/50' 
              : 'hover:bg-[#3F3935]/60 text-stone-300 hover:text-orange-400'
          }`}
        >
          📁 เซฟโปรเจค
        </button>

        <span className="w-px h-3.5 bg-[#3F3935] shrink-0" />

        <button
          onClick={() => setActiveModal('chordLibrary')}
          className={`px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all ${
            activeModal === 'chordLibrary' 
              ? 'bg-orange-500 text-stone-900 shadow-md shadow-orange-950/50' 
              : 'hover:bg-[#3F3935]/60 text-stone-300 hover:text-orange-400'
          }`}
        >
          🎸 คลังคอร์ด
        </button>
      </footer>

      {/* MODALS */}
      {activeModal === 'settings' && (
        <SoundCustomizer
          settings={audioSettings}
          onUpdateSettings={handleUpdateAudioSettings}
          selectedTuningId={selectedTuningId}
          onSelectTuning={setSelectedTuningId}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'composer' && (
        <SongComposer
          currentProject={currentProject}
          onUpdateProject={(updated) => setCurrentProject({ ...currentProject, ...updated })}
          availableChords={chords}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'projects' && (
        <ProjectManager
          currentProject={currentProject}
          onLoadProject={(proj) => {
            setCurrentProject(proj);
            setActiveModal(null);
          }}
          savedProjects={savedProjects}
          onSaveCurrentProject={handleSaveCurrentProject}
          onDeleteProject={handleDeleteProject}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'chordLibrary' && (
        <ChordLibraryModal
          chords={chords}
          onAddChord={handleAddCustomChord}
          onDeleteChord={handleDeleteChord}
          onClose={() => setActiveModal(null)}
        />
      )}

    </div>
  );
}
