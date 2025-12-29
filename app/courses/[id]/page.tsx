"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, ChevronDown, ChevronRight, ChevronLeft,
  CheckCircle2, Plus, PlayCircle, 
  BookOpen, Clock, Star, MoreVertical, 
  Trash2, Edit2, X, Calendar as CalendarIcon,
  List, Circle, Loader2, Play
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  getCourseDetails, 
  createModuleAction, updateModuleStatusAction, deleteModuleAction, renameModuleAction,
  createTopicAction, toggleTopicCompletionAction, toggleTopicFocusAction, deleteTopicAction,
  createEventAction, deleteEventAction, toggleEventAction
} from "@/src/actions/course-details";

// --- TYPES ---
type ModuleStatus = 'pending' | 'in-progress' | 'completed';
type EventType = "Class" | "Study" | "Test" | "Break" | "Project";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'syllabus' | 'planner'>('syllabus');
  const [course, setCourse] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // <--- NEW LOADING STATE

  // --- UI STATE ---
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // --- MODAL STATE ---
  const [modalMode, setModalMode] = useState<'add-module' | 'add-topic' | 'rename-module' | 'add-event' | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventSubtitle, setNewEventSubtitle] = useState("");
  const [newEventType, setNewEventType] = useState<EventType>("Study");

  const menuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // --- 1. LOAD DATA ---
  const loadData = async () => {
    const data = await getCourseDetails(courseId);
    if (data.course) {
      setCourse(data.course);
      if (!isLoaded && data.course.modules.length > 0) {
        setOpenModules({ [data.course.modules[0].id]: true });
      }
    }
    setEvents(data.events || []);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setActiveMenuId(null);
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) setActiveStatusMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---

  // Module Actions
  const handleAddModule = async () => {
    if (!inputText.trim()) return;
    setIsSubmitting(true); // Start Loading
    await createModuleAction(courseId, inputText);
    await loadData();
    setIsSubmitting(false); // Stop Loading
    closeModal();
  };

  const handleUpdateStatus = async (moduleId: string, status: string) => {
    await updateModuleStatusAction(moduleId, status, courseId);
    setActiveStatusMenuId(null);
    loadData();
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm("Delete this module?")) {
      await deleteModuleAction(moduleId, courseId);
      loadData();
    }
  };

  const handleRenameModule = async () => {
    if (!inputText.trim() || !targetId) return;
    setIsSubmitting(true);
    await renameModuleAction(targetId, inputText, courseId);
    await loadData();
    setIsSubmitting(false);
    closeModal();
  };

  const toggleModuleOpen = (moduleId: string) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  // Topic Actions
  const handleAddTopic = async () => {
    if (!inputText.trim() || !targetId) return;
    setIsSubmitting(true);
    await createTopicAction(targetId, inputText, courseId);
    await loadData();
    setIsSubmitting(false);
    closeModal();
  };

  const handleToggleTopic = async (topicId: string, currentStatus: boolean) => {
    // Optimistic Update
    setCourse((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any) => ({
        ...m,
        topics: m.topics.map((t: any) => t.id === topicId ? { ...t, isCompleted: !currentStatus } : t)
      }))
    }));
    await toggleTopicCompletionAction(topicId, !currentStatus, courseId);
    loadData();
  };

  const handleToggleFocus = async (topicId: string, currentStatus: boolean) => {
    // Optimistic Update
    setCourse((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any) => ({
        ...m,
        topics: m.topics.map((t: any) => t.id === topicId ? { ...t, isFocus: !currentStatus } : t)
      }))
    }));
    await toggleTopicFocusAction(topicId, !currentStatus, courseId);
    loadData();
  };

  const handleDeleteTopic = async (topicId: string) => {
    await deleteTopicAction(topicId, courseId);
    loadData();
  };

  // Planner Actions
  const handleAddEvent = async () => {
    if (!inputText.trim() || !newEventTime) return;
    setIsSubmitting(true);
    const dateKey = currentDate.toISOString().split('T')[0];
    const newEvent = {
      title: inputText,
      subtitle: newEventSubtitle || newEventType,
      startTime: newEventTime,
      date: dateKey,
      type: newEventType
    };
    await createEventAction(newEvent, courseId);
    await loadData();
    setIsSubmitting(false);
    closeModal();
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEventAction(id, courseId);
    loadData();
  };

  const handleToggleEvent = async (id: string, currentStatus: boolean) => {
    await toggleEventAction(id, !currentStatus, courseId);
    loadData();
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // --- HELPERS ---
  const filteredEvents = events.filter(e => e.date === currentDate.toISOString().split('T')[0]);
  const formattedDate = currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const modules = course?.modules || [];
  const totalTopics = modules.reduce((acc: number, m: any) => acc + m.topics.length, 0);
  const completedTopics = modules.reduce((acc: number, m: any) => acc + m.topics.filter((t: any) => t.isCompleted).length, 0);
  const progress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      default: return 'Pending';
    }
  };

  // Modals
  const openAddModule = () => { setModalMode('add-module'); setInputText(""); };
  const openRenameModule = (id: string, title: string) => { setModalMode('rename-module'); setTargetId(id); setInputText(title); setActiveMenuId(null); };
  const openAddTopic = (moduleId: string) => { setModalMode('add-topic'); setTargetId(moduleId); setInputText(""); };
  const openAddEvent = () => { setModalMode('add-event'); setInputText(""); setNewEventTime(""); setNewEventSubtitle(""); setNewEventType("Study"); };
  const closeModal = () => { setModalMode(null); setTargetId(null); setInputText(""); };
  
  const handleModalSubmit = () => {
    if (modalMode === 'add-module') handleAddModule();
    if (modalMode === 'add-topic') handleAddTopic();
    if (modalMode === 'rename-module') handleRenameModule();
    if (modalMode === 'add-event') handleAddEvent();
  };

  if (!isLoaded || !course) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 p-2 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
        <Link href="/courses" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Courses
        </Link>
        <span className="opacity-30">/</span>
        <span>Course Details</span>
      </div>

      {/* COURSE INFO */}
      <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-text-primary">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5"><BookOpen size={16} /> {totalTopics} Topics</span>
              <span className="flex items-center gap-1.5"><Clock size={16} /> Est. Time: {totalTopics * 15} mins</span>
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-text-primary">Course Progress</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="h-2.5 w-full bg-surface-highlight rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-text-muted text-right">{completedTopics} of {totalTopics} completed</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-6 border-b border-border">
        <button onClick={() => setActiveTab('syllabus')} className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'syllabus' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
          <List size={16} /> Syllabus
        </button>
        <button onClick={() => setActiveTab('planner')} className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'planner' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
          <CalendarIcon size={16} /> Study Schedule
        </button>
      </div>

      {/* SYLLABUS VIEW */}
      {activeTab === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-text-primary text-lg">Modules</h3>
              <button onClick={openAddModule} className="flex items-center gap-1 text-xs bg-surface-highlight hover:bg-primary/10 text-text-primary hover:text-primary px-3 py-1.5 rounded-lg border border-border transition-colors">
                <Plus size={14} /> Add Module
              </button>
            </div>

            {modules.map((module: any) => (
              <div key={module.id} className="border border-border rounded-xl bg-surface/50 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-surface hover:bg-surface-highlight/30 transition-colors group">
                  <button onClick={() => toggleModuleOpen(module.id)} className="flex items-center gap-3 flex-1 text-left">
                    {openModules[module.id] ? <ChevronDown size={18} className="text-text-muted" /> : <ChevronRight size={18} className="text-text-muted" />}
                    <h4 className="font-semibold text-text-primary">{module.title}</h4>
                  </button>
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveStatusMenuId(activeStatusMenuId === module.id ? null : module.id); }} className={`text-[10px] font-medium px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${getStatusColor(module.status)}`}>
                         {getStatusLabel(module.status)} <ChevronDown size={10} />
                      </button>
                      {activeStatusMenuId === module.id && (
                        <div ref={statusMenuRef} className="absolute right-0 top-8 w-32 bg-surface border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                          <button onClick={() => handleUpdateStatus(module.id, 'pending')} className="w-full text-left px-3 py-2 text-xs hover:bg-surface-highlight flex items-center gap-2 text-yellow-500"><Loader2 size={12}/> Pending</button>
                          <button onClick={() => handleUpdateStatus(module.id, 'in-progress')} className="w-full text-left px-3 py-2 text-xs hover:bg-surface-highlight flex items-center gap-2 text-blue-500"><PlayCircle size={12}/> In Progress</button>
                          <button onClick={() => handleUpdateStatus(module.id, 'completed')} className="w-full text-left px-3 py-2 text-xs hover:bg-surface-highlight flex items-center gap-2 text-green-500"><CheckCircle2 size={12}/> Completed</button>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs text-text-muted bg-surface-highlight px-2 py-1 rounded">
                      {module.topics.filter((t: any) => t.isCompleted).length}/{module.topics.length}
                    </span>

                    <div className="relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === module.id ? null : module.id)} className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-highlight transition-colors"><MoreVertical size={16} /></button>
                      {activeMenuId === module.id && (
                        <div ref={menuRef} className="absolute right-0 top-8 w-32 bg-surface border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                          <button onClick={() => openRenameModule(module.id, module.title)} className="w-full text-left px-3 py-2 text-xs hover:bg-surface-highlight flex items-center gap-2 text-text-secondary"><Edit2 size={12} /> Rename</button>
                          <button onClick={() => handleDeleteModule(module.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {openModules[module.id] && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {module.topics.map((topic: any) => (
                      <div key={topic.id} className={`group flex items-center justify-between p-3 pl-10 transition-colors ${topic.isCompleted ? 'bg-surface-highlight/20' : 'hover:bg-surface-highlight/30'} ${topic.isFocus ? 'border-l-2 border-l-primary bg-primary/5' : 'border-l-2 border-l-transparent'}`}>
                        <div className="flex items-center gap-4 flex-1">
                          <button onClick={() => handleToggleTopic(topic.id, topic.isCompleted)} className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${topic.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-text-muted text-transparent hover:border-primary'}`}>
                            <CheckCircle2 size={14} />
                          </button>
                          <p className={`text-sm font-medium ${topic.isCompleted ? 'text-text-muted line-through' : 'text-text-primary'}`}>{topic.title}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Link href={`/learn/${topic.id}`} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-surface-highlight">
                            <Play size={14} fill="currentColor" />
                          </Link>
                          <button onClick={() => handleToggleFocus(topic.id, topic.isFocus)} title="Add to Today" className={`p-1.5 rounded-md ${topic.isFocus ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-surface-highlight'}`}>
                            <Star size={14} fill={topic.isFocus ? "currentColor" : "none"} />
                          </button>
                          <button onClick={() => handleDeleteTopic(topic.id)} className="p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => openAddTopic(module.id)} className="w-full py-3 flex items-center justify-center gap-2 text-xs text-text-muted hover:text-primary hover:bg-surface-highlight/30 transition-colors"><Plus size={14} /> Add Topic</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-surface to-surface-highlight border border-border p-6 rounded-2xl sticky top-6">
              <div className="flex items-center gap-2 mb-4 text-primary font-semibold">
                <Star size={18} fill="currentColor" />
                <h3>Today's Focus</h3>
              </div>
              <div className="space-y-2">
                {modules.flatMap((m: any) => m.topics).filter((t: any) => t.isFocus).length > 0 ? (
                  modules.flatMap((m: any) => m.topics).filter((t: any) => t.isFocus).map((t: any) => (
                    <div key={t.id} className="bg-surface border border-border p-3 rounded-xl flex items-center justify-between shadow-sm">
                      <span className="text-sm text-text-primary truncate flex-1 mr-2">{t.title}</span>
                      <Link href={`/learn/${t.id}`}>
                        <button className="text-[10px] uppercase font-bold bg-primary text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors">Start</button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border rounded-xl"><p>Focus list empty.</p></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLANNER VIEW */}
      {activeTab === 'planner' && (
        <div className="max-w-3xl mx-auto w-full space-y-6">
           <div className="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl shadow-sm">
             <button onClick={() => changeDate(-1)} className="p-2 hover:bg-surface-highlight rounded-lg text-text-muted hover:text-text-primary transition-colors"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-3"><CalendarIcon size={18} className="text-primary" /><span className="font-bold text-text-primary text-lg">{formattedDate}</span></div>
             <button onClick={() => changeDate(1)} className="p-2 hover:bg-surface-highlight rounded-lg text-text-muted hover:text-text-primary transition-colors"><ChevronRight size={20} /></button>
           </div>
           <div className="flex items-center justify-between">
             <h3 className="font-semibold text-text-primary text-lg">Timeline</h3>
             <button onClick={openAddEvent} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 shadow-lg shadow-blue-500/20"><Plus size={16} /> Add Block</button>
           </div>
           <div className="bg-surface border border-border rounded-2xl p-6 min-h-[500px]">
             <div className="space-y-8 relative">
               <div className="absolute left-[85px] top-2 bottom-2 w-px bg-border/50 hidden sm:block"></div>
               {filteredEvents.length === 0 && <div className="text-center py-12 text-text-muted"><p>No study blocks.</p></div>}
               {filteredEvents.map((event) => (
                 <div key={event.id} className="group flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 relative">
                    <div className="w-[85px] flex-shrink-0 pt-1">
                      <span className={`text-lg font-bold block leading-none ${event.isDone ? 'text-text-muted' : 'text-text-primary'}`}>{event.startTime}</span>
                      <span className="text-xs text-text-muted mt-1 block pl-0.5">{parseInt(event.startTime) >= 12 ? 'PM' : 'AM'}</span>
                    </div>
                    <div className={`flex-1 pl-4 sm:pl-8 relative transition-opacity ${event.isDone ? 'opacity-50' : 'opacity-100'}`}>
                       <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${event.type === 'Class' ? 'bg-purple-500' : event.type === 'Study' ? 'bg-blue-500' : event.type === 'Test' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                       <div className="flex justify-between items-start">
                         <div>
                            <span className="text-[10px] font-medium uppercase tracking-wider mb-1 block text-text-secondary">{event.type}</span>
                            <h4 className={`text-base font-bold text-text-primary ${event.isDone ? 'line-through text-text-muted' : ''}`}>{event.title}</h4>
                            <p className="text-sm text-text-secondary mt-1">{event.subtitle}</p>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={() => handleToggleEvent(event.id, event.isDone)} className={`p-2 rounded-lg transition-all ${event.isDone ? 'text-green-500 bg-green-500/10' : 'text-text-muted hover:text-text-primary hover:bg-surface-highlight'}`}>
                             {event.isDone ? <CheckCircle2 size={18} fill="currentColor" className="text-green-500" /> : <Circle size={18} />}
                           </button>
                           <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                         </div>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {/* SHARED MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                {modalMode === 'add-module' ? 'Create Module' : modalMode === 'add-topic' ? 'Add Topic' : modalMode === 'rename-module' ? 'Rename' : 'Add Block'}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
            </div>
            <div className="space-y-4 mb-6">
              {modalMode === 'add-event' && (
                <div className="grid grid-cols-5 gap-2">
                  {['Class', 'Study', 'Test', 'Break', 'Project'].map((type) => (
                    <button key={type} onClick={() => setNewEventType(type as EventType)} className={`text-[10px] py-2 rounded-lg border transition-all ${newEventType === type ? 'bg-primary/20 border-primary text-primary font-bold' : 'bg-surface-highlight border-transparent text-text-secondary hover:bg-surface-highlight/80'}`}>{type}</button>
                  ))}
                </div>
              )}
              <input autoFocus type="text" placeholder="Title" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()} />
              {modalMode === 'add-event' && (
                <>
                  <input type="time" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} />
                  <input type="text" placeholder="Subtitle" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newEventSubtitle} onChange={(e) => setNewEventSubtitle(e.target.value)} />
                </>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm">Cancel</button>
              <button 
                onClick={handleModalSubmit} 
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 text-sm font-medium flex items-center gap-2"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (modalMode === 'rename-module' ? 'Save' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}