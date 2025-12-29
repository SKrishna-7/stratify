"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, Plus, MoreHorizontal, PlayCircle, 
  CheckCircle2, Search, GraduationCap, Loader2, 
  X
} from "lucide-react";
import Link from "next/link";
// Make sure createCourseAction in your backend accepts (title, desc, startDate, endDate)
import { getCourses, createCourseAction } from "@/src/actions/course"; 

// --- TYPES ---
interface Course {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  totalModules: number;
  completedModules: number;
  lastAccessed: string;
  color: string;
  icon: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 1. Load Data from DB
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

  // 2. Add Course via Server Action
  const handleAddCourse = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);

    try {
      console.log("Submitting:", { newTitle, newDesc, startDate, endDate }); // Log what you send

      const result = await createCourseAction(newTitle, newDesc, startDate, endDate);

      if (result.success) {
        const updatedData = await getCourses();
        setCourses(updatedData);
        setNewTitle("");
        setNewDesc("");
        setStartDate("");
        setEndDate("");
        setIsModalOpen(false);
      } else {
        alert("Failed to create course. Check server console for details.");
      }
    } catch (error) {
      console.error("FRONTEND ERROR:", error); // <--- Look at this in Browser Console (F12)
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (!isLoaded) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  const activeCourse = courses.length > 0 ? courses[0] : null;

  return (
    <div className="h-full flex flex-col gap-8 p-2">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Courses</h1>
          <p className="text-text-secondary text-sm">Library of your active learning paths.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> Create Course
          </button>
        </div>
      </div>

      {/* 2. HERO SECTION (Active Course) */}
      {activeCourse && (
        <div className="relative overflow-hidden bg-gradient-to-r from-surface to-surface-highlight border border-border rounded-2xl p-8 shadow-sm group">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-accent-blue uppercase tracking-wider">
                <PlayCircle size={14} className="animate-pulse" /> Ready to Resume
              </div>
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-2">{activeCourse.title}</h2>
                <p className="text-text-secondary max-w-md">{activeCourse.description || "No description provided."}</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-text-muted">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} /> {activeCourse.completedModules}/{activeCourse.totalModules} Modules</span>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-sm font-medium">
                 <span className="text-text-primary">Current Progress</span>
                 <span className="text-primary">{activeCourse.progress}%</span>
              </div>
              <div className="h-3 w-full bg-surface-highlight/50 border border-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${activeCourse.color} rounded-full transition-all duration-1000`} 
                  style={{ width: `${activeCourse.progress}%` }} 
                />
              </div>
              <Link href={`/courses/${activeCourse.id}`} className="block w-full">
                <button className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                  Continue Learning
                </button>
              </Link>
            </div>
          </div>
          <GraduationCap size={300} className="absolute -right-10 -bottom-10 text-white/5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        </div>
      )}

      {/* 3. COURSE GRID */}
      <div>
        <h3 className="font-semibold text-text-primary mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-text-muted" /> All Courses
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link href={`/courses/${course.id}`} key={course.id}>
              <div className="group h-full bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-xl ${course.color} bg-opacity-10 flex items-center justify-center text-xl font-bold ${course.color.replace('bg-', 'text-')}`}>
                    {course.icon}
                  </div>
                  <button className="text-text-muted hover:text-text-primary p-1 hover:bg-surface-highlight rounded-lg transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">{course.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex justify-between text-xs text-text-muted mb-2">
                    <span>{course.completedModules} / {course.totalModules} Modules</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-highlight rounded-full overflow-hidden">
                    <div className={`h-full ${course.color} rounded-full transition-all duration-500`} style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* "Add New" Card */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-full min-h-[250px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 text-text-muted hover:text-primary hover:border-primary hover:bg-surface-highlight/30 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-surface-highlight group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus size={32} />
            </div>
            <span className="font-medium">Create New Course</span>
          </button>
        </div>
      </div>

      {/* 4. CREATE COURSE MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-surface border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCourse(); 
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text-primary">Create Course</h3>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary p-1 hover:bg-surface-highlight rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    autoFocus 
                    type="text" 
                    required
                    placeholder="e.g. Advanced React Patterns" 
                    className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                  />
                </div>

                {/* Date Range Section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                    Course Schedule
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input 
                        type="date" 
                        aria-label="Start Date"
                        className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [color-scheme:dark] text-sm" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                      />
                      <span className="text-[10px] text-text-secondary pl-1 pt-1 block">Start Date</span>
                    </div>
                    <div>
                      <input 
                        type="date" 
                        aria-label="End Date"
                        min={startDate} 
                        className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [color-scheme:dark] text-sm" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                      />
                      <span className="text-[10px] text-text-secondary pl-1 pt-1 block">End Date (Target)</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
                    Description
                  </label>
                  <textarea 
                    placeholder="What will students learn in this course?" 
                    className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all h-24 resize-none" 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-highlight rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : null}
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}