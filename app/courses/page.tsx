"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, Plus, PlayCircle, 
  CheckCircle2, GraduationCap, Loader2, 
  X
} from "lucide-react";
import Link from "next/link";
// Make sure updateCourseAction is imported here
import { getCourses, createCourseAction, updateCourseAction } from "@actions/course"; 
import { CourseMenu } from "@components/CourseMenu"; 
import { DashboardLoader } from "@components/Loader";

// --- TYPES ---
interface Course {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  totalModules: number;
  completedModules: number;
  lastAccessed ?:Date | string;
  updatedAt: Date;
  color: string;
  icon: string;
  startDate?: string | Date; // Added optional date types
  endDate?: string | Date;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // --- CREATE MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- EDIT MODAL STATE (NEW) ---
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Helper to remove course from list instantly
  const handleRemoveCourse = (deletedId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== deletedId));
  };

  // 1. Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to load courses", error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // 2. Add Course
  const handleAddCourse = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);

    try {
      const result = await createCourseAction(newTitle, newDesc, startDate, endDate);

      if (result.success) {
        const updatedData = await getCourses();
        setCourses(updatedData);
        // Reset Form
        setNewTitle("");
        setNewDesc("");
        setStartDate("");
        setEndDate("");
        setIsModalOpen(false);
      } else {
        alert("Failed to create course.");
      }
    } catch (error) {
      console.error("CREATE ERROR:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Open Edit Modal (Pre-fill Data)
  const openEditModal = (course: Course) => {
    setEditTitle(course.title);
    setEditDesc(course.description || "");
    
    // Safely format dates for input type="date" (YYYY-MM-DD)
    const formatForInput = (dateVal: string | Date | undefined) => {
      if (!dateVal) return "";
      return new Date(dateVal).toISOString().split('T')[0];
    };

    setEditStartDate(formatForInput(course.startDate));
    setEditEndDate(formatForInput(course.endDate));
    
    setEditingCourse(course); // Triggers modal to open
  };

  // 4. Update Course
  const handleUpdateCourse = async () => {
    if (!editingCourse || !editTitle.trim()) return;
    setIsUpdating(true);

    try {
        const result = await updateCourseAction(
            editingCourse.id, 
            editTitle, 
            editDesc, 
            editStartDate, 
            editEndDate
        );

        if (result.success) {
            const updatedData = await getCourses();
            setCourses(updatedData);
            setEditingCourse(null); // Close modal
        } else {
            alert("Failed to update course");
        }
    } catch (error) {
        console.error("UPDATE ERROR", error);
    } finally {
        setIsUpdating(false);
    }
  };

  // Loading State
  // if (!isLoaded) return (
  //   <div className="h-full flex items-center justify-center">
  //     <Loader2 size={32} className="animate-spin text-primary" />
  //   </div>
  // );

  if (!isLoaded) return (
  <DashboardLoader/>
  );


  const activeCourse = courses.length > 0 ? courses[0] : null;

  return (
 <div className="h-full flex flex-col gap-10 p-4 bg-black text-white">
  
  {/* 1. PAGE HEADER */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-900">
    <div>
      <h1 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Learning Repository</h1>
      <span className="text-2xl font-black text-white uppercase italic">My Strategic Tracks</span>
    </div>
    
    <button 
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5"
    >
      <Plus size={14} /> Create Course
    </button>
  </div>

  {/* 2. HERO SECTION (ACTIVE COURSE) */}
  {activeCourse && (
    <div className="relative overflow-hidden bg-[#090909] border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl group">
      {/* HUD Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="bg-zinc-800/50 border border-zinc-700/50 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready to Resume
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-zinc-100 mb-3">
              {activeCourse.title}
            </h2>
            <p className="text-zinc-500 text-xs max-w-md font-medium italic leading-relaxed">
              {activeCourse.description || "Operational parameters defined."}
            </p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            <span className="flex items-center gap-2"><CheckCircle2 size={14} /> {activeCourse.completedModules}/{activeCourse.totalModules} Units</span>
          </div>
        </div>

        <div className="w-full lg:w-72 space-y-5">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Unit Progress</span>
            <span className="text-xl font-black text-emerald-500">{activeCourse.progress}%</span>
          </div>
          
          {/* Dashboard-Style Gradient Progress Bar */}
          <div className="h-2.5 w-full bg-zinc-900 border border-zinc-800/50 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#FF5F6D] via-[#FFC371] to-[#2ecc71] transition-all duration-1000 shadow-[0_0_15px_rgba(46,204,113,0.2)]"
              style={{ width: `${activeCourse.progress}%` }} 
            />
          </div>
          
          <Link href={`/courses/${activeCourse.id}`} className="block w-full pt-2">
            <button className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all active:scale-95">
   Continue Learning
</button>
          </Link>
        </div>
      </div>
      <GraduationCap size={300} className="absolute -right-16 -bottom-16 text-white/5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
    </div>
  )}

  {/* 3. COURSE GRID */}
  <div className="space-y-8">
    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
      <BookOpen size={16} /> Track Inventory
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {courses.map((course) => (
        <Link href={`/courses/${course.id}`} key={course.id}>
          <div className="group h-full bg-[#090909] border border-zinc-900 rounded-[2rem] p-8 hover:border-zinc-700 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex flex-col">
            
            <div className="flex justify-between items-start mb-8">
              <div className={`w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-colors`}>
                <div className={`w-3 h-3 rounded-full ${course.color === 'bg-primary' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
              </div>
              <CourseMenu courseId={course.id} 
                  onDeleteSuccess={handleRemoveCourse}
                  onEdit={() => openEditModal(course)}/>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-black text-zinc-100 uppercase italic mb-3 group-hover:text-white transition-colors">
                {course.title}
              </h3>
              <p className="text-xs text-zinc-600 font-medium italic line-clamp-2 leading-relaxed mb-6">
                {course.description || "No parameters provided."}
              </p>
            </div>

            <div className="mt-4 pt-6 border-t border-zinc-900/50">
              <div className="flex justify-between text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">
                <span>{course.completedModules} / {course.totalModules} Units</span>
                <span className="text-zinc-400">{course.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                <div 
                  className={`h-full ${course.color === 'bg-primary' ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-full transition-all duration-500`} 
                  style={{ width: `${course.progress}%` }} 
                />
              </div>
            </div>
          </div>
        </Link>
      ))}

      {/* "Add New" Card */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="h-full min-h-[300px] border-2 border-dashed border-zinc-900 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-zinc-700 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/20 transition-all group"
      >
        <div className="w-16 h-16 rounded-full bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center transition-colors border border-zinc-800">
          <Plus size={32} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">Create New Course</span>
      </button>
    </div>
  </div>

  {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#090909] border border-zinc-800 p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Initialize Course</h3>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Add New Strategic Track</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-600 hover:text-white transition-colors p-2"><X size={24} /></button>
            </div>

            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Course Title</label>
                <input autoFocus type="text" placeholder="E.G. DATA STRUCTURES & ALGORITHMS" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest transition-all" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                <textarea placeholder="OPTIONAL PARAMETERS..." className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest transition-all h-24 resize-none" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Start Date</label>
                  <input type="date" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest [color-scheme:dark]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Estimated End</label>
                  <input type="date" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest [color-scheme:dark]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Abort</button>
              <button onClick={handleAddCourse} disabled={isSubmitting || !newTitle.trim()} className="flex-[2] py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#090909] border border-zinc-800 p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Modify Repository</h3>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Update Strategic Track</p>
              </div>
              <button onClick={() => setEditingCourse(null)} className="text-zinc-600 hover:text-white transition-colors p-2"><X size={24} /></button>
            </div>

            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Course Title</label>
                <input type="text" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                <textarea className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest h-24 resize-none" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Start Date</label>
                  <input type="date" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest [color-scheme:dark]" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Estimated End</label>
                  <input type="date" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest [color-scheme:dark]" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setEditingCourse(null)} className="flex-1 py-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
              <button onClick={handleUpdateCourse} disabled={isUpdating || !editTitle.trim()} className="flex-[2] py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}