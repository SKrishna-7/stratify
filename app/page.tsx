"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, CheckCircle2, Plus, Clock,
  Calendar as CalendarIcon, Flame, ChevronRight,
  MoreHorizontal, ArrowRight, Check, Trophy, Loader2
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/src/actions/dashboard";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [date] = useState(new Date());

  useEffect(() => {
    async function load() {
      const stats = await getDashboardStats();
      setData(stats);
      setIsLoaded(true);
    }
    load();
  }, []);

  if (!isLoaded) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  const { user, recentCourse, activeCourses, dailyTasks } = data || {};

  return (
    <div className="h-full p-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. WELCOME & STREAK */}
          <div className="flex items-center justify-between bg-surface border border-border p-6 rounded-2xl shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Welcome back, {user?.name || "Student"}
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                You're on a roll! Keep the momentum going.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl text-orange-500">
              <Flame size={20} fill="currentColor" />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-lg">{user?.streak || 0}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">Day Streak</span>
              </div>
            </div>
          </div>

          {/* 2. DYNAMIC GOAL TRACKER (Courses as Goals) */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" /> Goal Tracker
              </h3>
              <span className="text-xs text-text-muted bg-surface-highlight px-2 py-1 rounded">
                Based on Active Courses
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Map Active Courses to Goals */}
              {activeCourses && activeCourses.length > 0 ? (
                activeCourses.map((course: any) => (
                  <Link href={`/courses/${course.id}`} key={course.id} className="block">
                    <GoalItem 
                      title={course.title} 
                      category="Module Tracker"
                      current={course.completedModules}
                      target={course.totalModules || 1} // Avoid 0 division visually
                      color={course.color || "bg-blue-500"}
                      isCompleted={course.completedModules === course.totalModules && course.totalModules > 0}
                    />
                  </Link>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-text-muted border border-dashed border-border rounded-xl">
                  <p>No active goals. Create a course to track progress!</p>
                </div>
              )}

              {/* Add New Goal Button */}
              <Link href="/courses" className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl p-4 text-text-muted hover:text-accent-blue hover:border-accent-blue hover:bg-surface-highlight/20 transition-all group min-h-[120px]">
                <div className="w-8 h-8 rounded-full bg-surface-highlight group-hover:bg-accent-blue/10 flex items-center justify-center transition-colors">
                  <Plus size={18} />
                </div>
                <span className="text-xs font-medium">Create New Course Goal</span>
              </Link>
            </div>
          </div>

          {/* 3. CONTINUE LEARNING */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Clock size={18} className="text-text-muted" /> Continue Learning
            </h3>
            {recentCourse ? (
              <Link href={`/courses/${recentCourse.id}`}>
                <div className="group relative bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-accent-blue bg-accent-blue/10 px-2 py-1 rounded-md border border-accent-blue/20">
                        Resume
                      </span>
                      <h2 className="text-xl font-bold text-text-primary mt-2">
                        {recentCourse.title}
                      </h2>
                      <p className="text-sm text-text-secondary">
                        {recentCourse.totalModules - recentCourse.completedModules} modules remaining
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface-highlight border border-border flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Total Progress</span>
                      <span>{recentCourse.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-highlight rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full relative overflow-hidden" style={{ width: `${recentCourse.progress}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
               <div className="bg-surface border border-dashed border-border rounded-2xl p-6 text-center text-text-muted">
                 No active courses.
               </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 1. CALENDAR */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-text-muted" />
                <span className="font-bold text-text-primary">
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-text-muted font-medium opacity-60">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {[...Array(30)].map((_, i) => {
                const day = i + 1;
                const isToday = day === date.getDate();
                const isDeadline = [5, 12, 25].includes(day);
                return (
                  <div 
                    key={i} 
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all relative
                      ${isToday ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'text-text-secondary hover:bg-surface-highlight'}
                      ${isDeadline && !isToday ? 'border border-red-500/30 text-red-400' : ''}
                    `}
                  >
                    {day}
                    {isDeadline && !isToday && <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full"></span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. DAILY TASK */}
          <div className="bg-surface border border-border rounded-2xl p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary">Daily Tasks</h3>
              <Link href="/tasks" className="text-xs text-accent-blue hover:underline">+ View All</Link>
            </div>
            <div className="space-y-3">
              {dailyTasks && dailyTasks.length > 0 ? (
                dailyTasks.map((task: any) => (
                  <TaskItem 
                    key={task.id} 
                    label={task.content} 
                    time="Today" 
                    isDone={false} 
                    urgent={task.priority === 'high'} 
                  />
                ))
              ) : (
                <p className="text-sm text-text-muted">No pending tasks.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function GoalItem({ title, category, current, target, color, isCompleted }: any) {
  // Safe calculation to avoid NaN if target is 0
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  
  return (
    <div className={`
      relative p-4 rounded-xl border transition-all group h-full
      ${isCompleted 
        ? 'bg-surface-highlight/30 border-transparent' 
        : 'bg-surface border-border hover:border-primary/30 hover:bg-surface-highlight/10'
      }
    `}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-[10px] font-medium text-text-muted bg-surface-highlight px-1.5 py-0.5 rounded border border-border/50">
            {category}
          </span>
          <h4 className={`text-sm font-semibold mt-1.5 line-clamp-1 ${isCompleted ? 'text-text-muted line-through' : 'text-text-primary'}`}>
            {title}
          </h4>
        </div>
        {isCompleted && (
          <div className="bg-green-500/10 text-green-500 p-1 rounded-full">
            <Check size={14} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-text-secondary mb-1.5">
          <span>{current} / {target} Modules</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="h-1.5 w-full bg-surface-highlight rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : color}`} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

function TaskItem({ label, time, isDone, urgent }: any) {
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group
      ${isDone ? 'bg-surface-highlight/50 border-transparent opacity-60' : 'bg-transparent border-border hover:border-primary/30 hover:bg-surface-highlight/20'}
    `}>
      <div className={`
        w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors
        ${isDone ? 'bg-green-500 border-green-500 text-white' : 'border-text-muted text-transparent group-hover:border-primary'}
      `}>
        <Check size={12} strokeWidth={3} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium line-clamp-1 ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-text-muted">{time}</span>
          {urgent && !isDone && <span className="text-[9px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">URGENT</span>}
        </div>
      </div>
    </div>
  );
}