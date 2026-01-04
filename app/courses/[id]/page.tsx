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
} from "@actions/course-details";

import {
  addPlannerEvent,
  deletePlannerEvent,
  getPlannerEvents,
  toggleEventStatus
} from "@actions/planner";
import { PlannerWidget } from "@components/PlannerWidget";
import { DashboardLoader } from "@components/Loader";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
    try {
      const [courseRes, plannerEvents] = await Promise.all([
        getCourseDetails(courseId),
        getPlannerEvents()
      ]);

      if (courseRes?.course) {
        setCourse(courseRes.course);

        if (!isLoaded && courseRes.course.modules.length > 0) {
          setOpenModules({ [courseRes.course.modules[0].id]: true });
        }
      }

      setEvents(plannerEvents ?? []);
      setIsLoaded(true);
    } catch (err) {
      console.error("LOAD_DATA_ERROR", err);
    }
  };


  useEffect(() => {
    if (!courseId) return;
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

    const newEvent = {
      id: crypto.randomUUID(), // temporary
      title: inputText,
      subtitle: newEventSubtitle || newEventType,
      startTime: newEventTime,
      type: newEventType,
      date: currentDate.toDateString(),
      isDone: false,
    };

    // ⚡ INSTANT UI UPDATE
    setEvents(prev => [...prev, newEvent]);

    closeModal();
    setIsSubmitting(true);

    try {
      await addPlannerEvent({
        title: newEvent.title,
        subtitle: newEvent.subtitle,
        startTime: newEvent.startTime,
        type: newEvent.type,
        date: newEvent.date,
      });

      // sync real DB state
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await deletePlannerEvent(id);
  };

  const handleToggleEvent = async (id: string, current: boolean) => {
    // Optimistic
    setEvents(prev =>
      prev.map(e =>
        e.id === id ? { ...e, isDone: !current } : e
      )
    );

    await toggleEventStatus(id, !current);
  };


  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // --- HELPERS ---
  const selectedDateKey = currentDate.toDateString();

  const filteredEvents = events.filter(
    e => e.date === selectedDateKey
  );


  const formattedDate = currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const modules = course?.modules || [];
  const totalTopics = modules.reduce((acc: number, m: any) => acc + m.topics.length, 0);
  const completedTopics = modules.reduce((acc: number, m: any) => acc + m.topics.filter((t: any) => t.isCompleted).length, 0);
  const progress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
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
      <DashboardLoader/>
    );
  return (
  <div className="h-full flex flex-col gap-10 p-4 bg-black text-white max-w-7xl mx-auto font-sans antialiased">
      
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
        <Link href="/courses" className="hover:text-white transition-colors flex items-center gap-1 group">
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform"/> My Courses
        </Link>
        <span className="opacity-30">/</span>
        <span className="text-zinc-400">Course Details</span>
      </div>

      {/* 2. COURSE HERO PANEL */}
      <div className="bg-[#090909] border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
              {course.title}
            </h1>
            <div className="flex items-center gap-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><BookOpen size={14} /> {totalTopics} Topics</span>
              <span className="flex items-center gap-2"><Clock size={14} /> {totalTopics * 15} Min Total</span>
            </div>
          </div>

          <div className="w-full md:w-72 space-y-4">
            <div className="flex justify-between items-end text-[9px] font-black text-zinc-600 uppercase tracking-widest">
              <span>Overall Progress</span>
              <span className="text-xl text-emerald-500 font-black italic">{progress}%</span>
            </div>
            <div className="h-2.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#FF5F6D] via-[#FFC371] to-[#2ecc71] transition-all duration-1000 shadow-[0_0_15px_rgba(46,204,113,0.3)]"
                style={{ width: `${progress}%` }} 
              />
            </div>
            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest text-right">{completedTopics} / {totalTopics} Finalized</p>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-8 border-b border-zinc-900">
        <button 
          onClick={() => setActiveTab('syllabus')} 
          className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'syllabus' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Curriculum
        </button>
        <button 
          onClick={() => setActiveTab('planner')} 
          className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all hidden ${
            activeTab === 'planner' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Study Schedule
        </button>
      </div>

      {/* 4. CONTENT VIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: SYLLABUS */}
        {activeTab === 'syllabus' && (
          <>
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Module Hierarchy</h3>
                <button 
                  onClick={openAddModule} 
                  className="bg-zinc-900 border border-zinc-800 text-[9px] font-black text-white px-4 py-2 rounded-xl
                   hover:bg-white hover:text-black transition-all uppercase tracking-widest"
                >
                  + Create Module
                </button>
              </div>

              <div className="space-y-4">
                {modules.map((module: any) => (
                  <div key={module.id} className="bg-[#090909] border border-zinc-900 rounded-[2rem]  transition-all duration-300">
                    <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-900/40 transition-all group" onClick={() => toggleModuleOpen(module.id)}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-zinc-500">
                           {openModules[module.id] ? <ChevronDown size={18} className="text-emerald-500" /> : <ChevronRight size={18} />}
                        </div>
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tight">{module.title}</h4>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveStatusMenuId(activeStatusMenuId === module.id ? null : module.id); }} 
                            className={`text-[9px] font-black px-3 py-1 rounded-md border uppercase tracking-widest flex items-center gap-1.5 transition-all ${getStatusColor(module.status)}`}
                          >
                            {getStatusLabel(module.status)} <ChevronDown size={10} />
                          </button>
                          {activeStatusMenuId === module.id && (
                            <div ref={statusMenuRef} className="absolute right-0 top-10 w-40 bg-black border border-zinc-800 rounded-xl shadow-2xl z-[100] py-1 overflow-hidden animate-in fade-in zoom-in-95">
                               <button onClick={() => handleUpdateStatus(module.id, 'pending')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 flex items-center gap-2 text-zinc-500"><Circle size={12}/> Pending</button>
                               <button onClick={() => handleUpdateStatus(module.id, 'in-progress')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 flex items-center gap-2 text-indigo-500"><PlayCircle size={12}/> Progress</button>
                               <button onClick={() => handleUpdateStatus(module.id, 'completed')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 flex items-center gap-2 text-emerald-500"><CheckCircle2 size={12}/> Finalized</button>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <button onClick={(e) => {e.stopPropagation(); setActiveMenuId(activeMenuId === module.id ? null : module.id)}} className="text-zinc-700 hover:text-white p-2 transition-colors"><MoreVertical size={16} /></button>
                          {activeMenuId === module.id && (
                            <div ref={menuRef} className="absolute right-0 top-10 w-36 bg-black border border-zinc-800 rounded-xl shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95">
                              <button onClick={() => openRenameModule(module.id, module.title)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 flex items-center gap-2 text-zinc-400"><Edit2 size={12} /> Rename</button>
                              <button onClick={() => handleDeleteModule(module.id)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 text-rose-500 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {openModules[module.id] && (
                      <div className="border-t border-zinc-900 divide-y divide-zinc-900/50">
                        {module.topics.map((topic: any) => (
                          <div key={topic.id} className={`group flex items-center justify-between p-4 pl-16 transition-all ${topic.isFocus ? 'bg-indigo-500/5 border-l-2 border-indigo-500' : 'hover:bg-zinc-900/20'}`}>
                            <div className="flex items-center gap-4 flex-1">
                              <button 
                                onClick={() => handleToggleTopic(topic.id, topic.isCompleted)} 
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  topic.isCompleted ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-800 bg-black hover:border-zinc-600'
                                }`}
                              >
                                {topic.isCompleted && <CheckCircle2 size={12} />}
                              </button>
                              <span className={`text-sm font-bold ${topic.isCompleted ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{topic.title}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/learn/${topic.id}`} className="p-2 text-zinc-600 hover:text-white transition-colors"><Play size={14} fill="currentColor" /></Link>
                              <button onClick={() => handleToggleFocus(topic.id, topic.isFocus)} className={`p-2 transition-colors ${topic.isFocus ? 'text-indigo-500' : 'text-zinc-700 hover:text-indigo-500'}`}><Star size={14} fill={topic.isFocus ? "currentColor" : "none"} /></button>
                              <button onClick={() => handleDeleteTopic(topic.id)} className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => openAddTopic(module.id)} className="w-full py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-white hover:bg-zinc-900/30 transition-all flex items-center justify-center gap-2 border-t border-zinc-900">+ Add Topic</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: FOCUS SIDEBAR */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#090909] border border-zinc-900 p-8 rounded-[2.5rem] sticky top-10">
                <div className="flex items-center gap-2 mb-8 text-indigo-500">
                  <Star size={18} fill="currentColor" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Priority Focus</h3>
                </div>
                <div className="space-y-3">
                  {modules.flatMap((m: any) => m.topics).filter((t: any) => t.isFocus).length > 0 ? (
                    modules.flatMap((m: any) => m.topics).filter((t: any) => t.isFocus).map((t: any) => (
                      <div key={t.id} className="bg-black border border-zinc-900 p-4 rounded-2xl flex items-center justify-between group">
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors truncate mr-4">{t.title}</span>
                        <Link href={`/learn/${t.id}`}>
                          <button className="text-[9px] font-black bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 uppercase tracking-widest transition-all">Start</button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 border border-dashed border-zinc-900 rounded-2xl">
                       <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Focus List Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* PLANNER VIEW */}
    {activeTab === 'planner' && (
  /* Removed max-w-5xl and added w-full + flex-1 */
  <div className="w-full flex-1 flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
    
    {/* 1. FULL WIDTH INDEXER PANEL */}
    <div className="w-full bg-[#090909] border border-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-8 w-full">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-5 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Resource Indexer</h4>
          </div>
          <p className="text-xs text-zinc-500 font-medium italic pl-5 max-w-2xl">
            Archive URLs for documentation, research, or external video references for this course.
          </p>
        </div>

        {/* This container forces the input and button to use the full width of the header above */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
          <div className="relative flex-1 w-full">
            <input 
              type="url" 
              placeholder="HTTPS://RESOURCE-URL.COM" 
              className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-800 uppercase tracking-widest transition-all"
            />
          </div>
          <button className="w-full lg:w-64 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all shrink-0">
            Index Link
          </button>
        </div>
      </div>
    </div>

    {/* 2. INVENTORY LIST */}
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-4 w-full">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Resource Inventory</h3>
        <div className="h-px flex-1 mx-6 bg-zinc-900/50" />
      </div>
      
      <div className="grid grid-cols-1 gap-4 w-full">
        {/* Link Entry */}
        <div className="w-full bg-[#090909] border border-zinc-900 p-6 rounded-[2rem] flex items-center justify-between group hover:border-zinc-700 transition-all">
          <div className="flex items-center gap-8 overflow-hidden flex-1">
            <div className="w-14 h-14 bg-black border border-zinc-800 rounded-2xl flex-shrink-0 flex items-center justify-center text-indigo-500 shadow-inner group-hover:border-indigo-500/30 transition-colors">
               <BookOpen size={20} />
            </div>
            <div className="truncate flex-1">
              <p className="text-base font-black text-zinc-200 uppercase italic tracking-tight group-hover:text-white transition-colors truncate">
                Official Course Documentation Reference
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">external-link.com</span>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Verified</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pl-6 border-l border-zinc-900 ml-4">
            <a href="#" className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all">
              <Play size={16} fill="currentColor" />
            </a>
            <button className="w-12 h-12 flex items-center justify-center text-zinc-800 hover:text-rose-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>

      {/* 5. BLACKOUT MODALS */}
      {modalMode && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#090909] border border-zinc-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                {modalMode === 'add-module' ? 'New Module' : modalMode === 'add-topic' ? 'Add Topic' : modalMode === 'rename-module' ? 'Update Title' : 'System Event'}
              </h3>
              <button onClick={closeModal} className="text-zinc-600 hover:text-white transition-colors p-2"><X size={24} /></button>
            </div>
            
            <div className="space-y-8 mb-10">
              {modalMode === 'add-event' && (
                <div className="grid grid-cols-3 gap-2">
                  {['Class', 'Study', 'Test', 'Break', 'Project'].map((type) => (
                    <button key={type} onClick={() => setNewEventType(type as EventType)} className={`text-[9px] py-3 rounded-xl border font-black uppercase tracking-widest transition-all ${newEventType === type ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}>{type}</button>
                  ))}
                </div>
              )}
              
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Label Input</label>
                <input autoFocus type="text" placeholder="Topic" className="w-full bg-black border border-zinc-900 rounded-2xl p-5 text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-800 transition-all font-bold" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()} />
              </div>

              {modalMode === 'add-event' && (
                <>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Temporal Entry</label>
                    <input type="time" className="w-full bg-black border border-zinc-900 rounded-2xl p-5 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Descriptor</label>
                    <input type="text" placeholder="Operational Context" className="w-full bg-black border border-zinc-900 rounded-2xl p-5 text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-800 transition-all" value={newEventSubtitle} onChange={(e) => setNewEventSubtitle(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={closeModal} className="flex-1 py-5 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancle</button>
              <button 
                onClick={handleModalSubmit} 
                disabled={isSubmitting}
                className="flex-[2] py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}