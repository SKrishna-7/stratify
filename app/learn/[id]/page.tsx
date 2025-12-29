"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, Clock, Play, Pause, RotateCcw, 
  CheckCircle2, Save, Youtube, ExternalLink, 
  StickyNote, PenTool, Globe, X, MonitorPlay, Loader2
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { 
  getTopicDetails, 
  saveNoteAction, 
  saveResourceAction, 
  completeTopicAction 
} from "@/src/actions/focus-room";

type ResourceMode = 'video' | 'whiteboard' | 'browser';

export default function FocusRoom() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;

  // --- STATE ---
  const [topic, setTopic] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // For Note Auto-save status
  
  // Content State
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<ResourceMode>('video');
  const [resourceLink, setResourceLink] = useState("");
  const [isResourceSet, setIsResourceSet] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');

  // --- 1. LOAD DATA ---
  useEffect(() => {
    async function load() {
      const data = await getTopicDetails(topicId);
      if (data) {
        setTopic(data);
        setNote(data.note || "");
        
        if (data.resourceUrl) {
          setResourceLink(data.resourceUrl);
          setIsResourceSet(true);
        }
        
        if (data.resourceMode) {
          setMode(data.resourceMode as ResourceMode);
        }
      }
      setIsLoaded(true);
    }
    load();
  }, [topicId]);

  // --- 2. AUTO-SAVE NOTES (Debounced) ---
  useEffect(() => {
    if (!isLoaded) return;

    // Only save if the note changed from what's in the DB
    const timeoutId = setTimeout(async () => {
      if (note !== topic?.note) {
        setIsSaving(true);
        await saveNoteAction(topicId, note);
        setIsSaving(false);
      }
    }, 1000); // Wait 1 second after typing stops

    return () => clearTimeout(timeoutId);
  }, [note, topicId, isLoaded, topic?.note]);

  // --- ACTIONS ---
  const handleSaveResource = async () => {
    await saveResourceAction(topicId, resourceLink, mode);
    setIsResourceSet(true);
  };

  const handleClearResource = async () => {
    setResourceLink("");
    setIsResourceSet(false);
    await saveResourceAction(topicId, "", mode); // Clear in DB
  };

  const handleComplete = async () => {
    await completeTopicAction(topicId);
    router.back();
  };

  const handleModeChange = async (newMode: ResourceMode) => {
    setMode(newMode);
    // Optional: Save mode preference to DB immediately if resource exists
    if (isResourceSet) {
      await saveResourceAction(topicId, resourceLink, newMode);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerMode === 'focus') {
        setTimerMode('break');
        setTimeLeft(5 * 60);
      } else {
        setTimerMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, timerMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      if (!url.includes('youtube') && !url.includes('youtu.be')) return null;
      let videoId = '';
      if (url.includes('youtu.be')) videoId = url.split('youtu.be/')[1];
      else videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (e) { return null; }
  };

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-surface">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-surface-highlight/10">
      
      {/* HEADER */}
      <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-muted hover:text-text-primary">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-text-primary text-lg leading-none">
              {topic?.title || "Focus Session"}
            </h1>
            <p className="text-xs text-text-muted mt-1">
              {topic?.module?.course?.title} / {topic?.module?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-surface-highlight px-3 py-1.5 rounded-lg border border-border">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-mono font-medium text-text-primary">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={handleComplete} 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-green-500/20"
          >
            <CheckCircle2 size={18} /> Finish
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3">
          
          {/* LEFT: MULTI-MODE RESOURCE VIEWER */}
          <div className="lg:col-span-2 bg-black/95 relative flex flex-col border-r border-border">
            
            {/* Toolbar */}
            <div className="h-12 border-b border-white/10 bg-surface/50 flex items-center px-4 gap-2">
               <button onClick={() => handleModeChange('video')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'video' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}>
                 <MonitorPlay size={14} /> Video Player
               </button>
               <button onClick={() => handleModeChange('whiteboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'whiteboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}>
                 <PenTool size={14} /> Whiteboard
               </button>
               <button onClick={() => handleModeChange('browser')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'browser' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}>
                 <Globe size={14} /> Browser / Docs
               </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full h-full relative">
              {mode === 'whiteboard' && (
                <iframe src="https://excalidraw.com?theme=dark" className="w-full h-full bg-surface" title="Whiteboard" />
              )}

              {(mode === 'video' || mode === 'browser') && (
                !isResourceSet ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8">
                     <div className="max-w-md w-full bg-surface border border-border p-8 rounded-2xl shadow-2xl text-center">
                        <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                          {mode === 'video' ? <Youtube size={32} /> : <Globe size={32} />}
                        </div>
                        <h2 className="text-xl font-bold text-text-primary mb-2">
                          {mode === 'video' ? 'Add Video Resource' : 'Add Web Resource'}
                        </h2>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder={mode === 'video' ? "https://youtube.com..." : "https://react.dev..."} 
                            className="flex-1 bg-surface-highlight border border-border rounded-xl px-4 py-2 text-text-primary text-sm focus:border-primary focus:outline-none"
                            value={resourceLink}
                            onChange={(e) => setResourceLink(e.target.value)}
                          />
                          <button onClick={handleSaveResource} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Load</button>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    {mode === 'video' && <iframe src={getYoutubeEmbedUrl(resourceLink) || resourceLink} className="w-full h-full" allowFullScreen />}
                    {mode === 'browser' && <iframe src={resourceLink} className="w-full h-full bg-white" />}
                    
                    <button onClick={handleClearResource} className="absolute top-4 right-4 bg-black/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors text-xs flex items-center gap-2 border border-white/10 font-medium z-10">
                       <X size={14} /> Change Source
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT: TOOLS PANEL */}
          <div className="lg:col-span-1 bg-surface border-l border-border flex flex-col h-full">
            
            {/* Timer */}
            <div className="p-6 border-b border-border bg-surface-highlight/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2"><Clock size={16} className="text-primary"/> Pomodoro</h3>
                <div className="flex bg-surface border border-border rounded-lg p-0.5">
                  <button onClick={() => { setTimerMode('focus'); setTimeLeft(25*60); setIsActive(false); }} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timerMode === 'focus' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}>Focus</button>
                  <button onClick={() => { setTimerMode('break'); setTimeLeft(5*60); setIsActive(false); }} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timerMode === 'break' ? 'bg-green-500 text-white' : 'text-text-muted hover:text-text-primary'}`}>Break</button>
                </div>
              </div>
              <div className="text-center py-6 bg-surface border border-border rounded-2xl mb-4 relative overflow-hidden">
                <div className={`absolute inset-0 opacity-5 ${timerMode === 'focus' ? 'bg-primary' : 'bg-green-500'}`}></div>
                <span className="text-5xl font-mono font-bold text-text-primary tracking-widest relative z-10">{formatTime(timeLeft)}</span>
                <p className="text-xs text-text-secondary mt-1 relative z-10 uppercase tracking-wider">{isActive ? 'Running' : 'Paused'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsActive(!isActive)} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${isActive ? 'bg-surface border border-border text-text-primary' : 'bg-primary text-white'}`}>{isActive ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}</button>
                <button onClick={() => { setIsActive(false); setTimeLeft(timerMode === 'focus' ? 25*60 : 5*60); }} className="px-4 bg-surface border border-border text-text-muted hover:text-text-primary rounded-xl"><RotateCcw size={18} /></button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex-1 flex flex-col min-h-0 bg-surface">
              <div className="px-6 py-3 border-b border-border flex justify-between items-center bg-surface-highlight/5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2"><StickyNote size={16} className="text-yellow-500"/> Notes</h3>
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  {isSaving ? <><Loader2 size={10} className="animate-spin"/> Saving...</> : <><Save size={10} /> Saved</>}
                </span>
              </div>
              <textarea 
                className="flex-1 w-full bg-transparent p-6 text-sm text-text-primary resize-none focus:outline-none leading-relaxed font-mono"
                placeholder="Start typing your notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}