"use client";

import { 
  BookOpen, 
  Briefcase, 
  Target, 
  ArrowUpRight 
} from "lucide-react";
import Link from "next/link";

interface StatsOverviewProps {
  courseCount: number;
  applicationCount: number;
  imminentGoal: any;
}

export function StatsOverview({ courseCount, applicationCount, imminentGoal }: StatsOverviewProps) {
  // Simple calculation for progress percentage
const progress = imminentGoal
  ? Math.round((imminentGoal.current / imminentGoal.target) * 100)
  : 0;


const isCompleted = imminentGoal?.isDone;
const isUrgent =
  imminentGoal?.deadline &&
  !isCompleted &&
  new Date(imminentGoal.deadline).getTime() - Date.now() <
    3 * 24 * 60 * 60 * 1000; // < 3 days

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      
      {/* 1. Learning Now Card */}
      <div className="bg-[#090909] border border-zinc-900 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-zinc-800 transition-all">
        <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-800 shadow-2xl">
          <BookOpen size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Learning Now</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums tracking-tighter">{courseCount}</span>
            <span className="text-xs font-bold text-zinc-700 uppercase">Courses</span>
          </div>
        </div>
      </div>

      {/* 2. Job Search Card */}
      
      <Link href={imminentGoal ? `/applications` : "#"} className="block">
      <div className="bg-[#090909] border border-zinc-900 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-zinc-800 transition-all">
        <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-800 shadow-2xl">
          <Briefcase size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Job Search</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums tracking-tighter">{applicationCount}</span>
            <span className="text-xs font-bold text-zinc-700 uppercase">Applied</span>
          </div>
        </div>
      </div>
      </Link>


      {/* 3. Active Goal Card with Urgency Alerts */}
      <Link href={imminentGoal ? `/goals/${imminentGoal.id}` : "#"} className="block">
        <div className="bg-[#090909] border border-zinc-900 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-emerald-500/30 transition-all relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] pointer-events-none" />
          
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl">
            <Target size={24} className="animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Finish Soon</p>
                {/* Red Urgency Text */}
                <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded animate-pulse uppercase tracking-tighter">
                  Deadline Soon
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-500">{progress}%</span>
                {/* Continue Arrow */}
                <ArrowUpRight size={14} className="text-zinc-700 group-hover:text-white transition-colors" />
              </div>
            </div>

            <h4 className="text-sm font-black text-zinc-200 uppercase truncate italic">
              {imminentGoal?.title || "No Active Goals"}
            </h4>

            {/* Heatmap Progress Bar (Red to Green) */}
            <div className="mt-3 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
               <div 
                className="h-full bg-gradient-to-r from-[#FF5F6D] via-[#FFC371] to-[#2ecc71] transition-all duration-1000 shadow-[0_0_10px_rgba(46,204,113,0.3)]" 
                style={{ width: `${progress}%` }} 
               />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}