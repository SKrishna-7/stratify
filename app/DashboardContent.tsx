"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Plus, ArrowRight, Layers, Book, Loader2, Flame, BookOpen, Target, Clock, CheckCircle2, Play
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlannerWidget } from "@components/PlannerWidget";
import { CreateGoalDialog } from "@components/AddGoalDialog";
import { GoalItem } from "@components/GoalItem";
import { StatsOverview } from "@components/StatsOverview";
import { ActivityHeatmap } from "@components/ActivityHeatmap";
import { toggleGoalAction } from "@actions/goals";
import { DashboardLoader } from "@components/Loader";

// Import your goal action if defined elsewhere
// import { toggleGoalAction } from "@actions/goals"; 

type DashboardData = {
  user: any;
  activityData: any;
  recentCourse: any;
  allCourses: any;
  goals: any[];
  activeCourses: any[];
  plannerEvents?: any[];
  appCount: number;
};




export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // CORE STATE: Initialize with initialData to prevent "unfetching" flicker
  const [data, setData] = useState<DashboardData>(initialData);
  const [isLoaded, setIsLoaded] = useState(!!initialData);
  const [isPending, startTransition] = useTransition();
  const [authStatus, setAuthStatus] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);


  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [localGoals, setLocalGoals] = useState(initialData?.goals ?? []);

  useEffect(() => {
    setLocalGoals(data?.goals ?? []);
  }, [data?.goals]);


  // Auth Status Messages
  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg === "login-success") {
      setAuthStatus({ msg: "System Access Authorized: Welcome", type: 'success' });
      const timer = setTimeout(() => setAuthStatus(null), 4000);
      return () => clearTimeout(timer);
    }
    if (msg === "logout-success") {
      setAuthStatus({ msg: "Terminal Session Terminated", type: 'info' });
      const timer = setTimeout(() => setAuthStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // CORE FUNCTIONALITY: Handle updates with instant revalidation
  const handleUpdate = (action: () => Promise<any>) => {
    startTransition(async () => {
      try {
        await action();
        // This tells the Server Component (page.tsx) to re-run getDashboardStats()
        router.refresh();
        // This fetches the appCount and ensures client-side state is current
      } catch (error) {
        console.error("System Sync Failed:", error);
      }
    });
  };


  if (!isLoaded || isPending) return (
    <DashboardLoader/>
  );
  const {
    user,
    activityData,
    recentCourse,
    allCourses,
    goals,
    activeCourses,
    plannerEvents,
    appCount,

  } = data;

  const imminentGoal =
  goals
    ?.filter((g: any) => !g.isDone && g.target > 0)
    .sort((a: any, b: any) => {
      const remainingA = a.target - a.current;
      const remainingB = b.target - b.current;
      return remainingA - remainingB;
    })[0]
  ??
  goals
    ?.filter((g: any) => g.isDone)
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )[0]
  ??
  null;



    
  const updatePlannerOptimistic = (updater: (events: any[]) => any[]) => {
    setData((prev: any) => ({
      ...prev,
      plannerEvents: updater(prev.plannerEvents ?? []),
    }));
  };


  return (
    <div className={`min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 antialiased relative bg-black text-white ${isPending ? "pointer-events-none" : ""}`}>

      {/* GLOBAL LOADER: Visible during any database synchronization */}
      {isPending && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-emerald-500 opacity-80" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">
              Synchronizing Data...
            </span>
          </div>
        </div>
      )}

      {/* AUTH STATUS TOAST */}
      {authStatus && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-right-8 duration-500">
          <div className={`
            flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl
            ${authStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'}
          `}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${authStatus.type === 'success' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1">
                {authStatus.type === 'success' ? 'Authorization Valid' : 'System Update'}
              </span>
              <span className="text-xs font-bold tracking-tight text-white italic">
                {authStatus.msg}
              </span>
            </div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-40" />
          </div>
        </div>
      )}

      {/* MAIN UI: Dims and blurs during synchronization */}
      <div className={`transition-all duration-500 ${isPending ? "opacity-40 grayscale blur-[1px]" : "opacity-100"}`}>

        {/* 1. HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full mb-10 pb-8 border-b border-zinc-800/50">
          <div>
            <h1 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Welcome</h1>
            <span className="text-2xl font-black text-white uppercase italic">
              {user?.name || "Explorer"}
            </span>
            {!user && (
              <h1 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1 italic">
                Please Sign In to Plan your Goals
              </h1>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl text-orange-500">
              <Flame size={18} fill="currentColor" />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base text-zinc-100">{user?.streak || 0}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Day Streak</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-white font-black text-sm uppercase">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* 2. STATS OVERVIEW */}
        <StatsOverview
          courseCount={allCourses?.length || 0}
          applicationCount={appCount}
          imminentGoal={imminentGoal}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
          <div className="lg:col-span-8 space-y-12">

            {/* 3. CONTINUE LEARNING HERO */}
            <section>
              {recentCourse ? (
                <div className="relative bg-[#090909] border border-zinc-900 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="bg-zinc-800/50 border border-zinc-700/50 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest text-zinc-400">
                          LEARNING TRACK
                        </span>
                        <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Layers size={12} /> {recentCourse.totalModules || 0} MODULES TOTAL
                        </span>
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-zinc-100">
                        {recentCourse.title}
                      </h2>
                      <p className="text-zinc-500 text-xs max-w-xl font-medium leading-relaxed italic">
                        Currently studying: {recentCourse.currentModuleName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">CURRICULUM PROGRESS</span>
                        <div className="text-3xl font-black">
                          {Math.round(recentCourse.progress)} <span className="text-zinc-700 text-sm">/ 100%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">IN ACTIVE STUDY</div>
                      </div>
                    </div>

                    <div className="relative h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF5F6D] via-[#FFC371] to-[#2ecc71] transition-all duration-1000 shadow-[0_0_15px_rgba(46,204,113,0.2)]"
                        style={{ width: `${recentCourse.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-zinc-900 flex items-end justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-800">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">STATUS UPDATE</p>
                        <p className="text-xs font-bold text-zinc-200">
                          {recentCourse.totalModules - recentCourse.completedModules} Modules Remaining
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/courses/${recentCourse.id}`}
                      className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-lg"
                    >
                      <Play fill="black" size={14} /> Continue Learning
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-zinc-900 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center">
                  <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No Recent Activity Detected</p>
                </div>
              )}
            </section>

            {/* 4. GOAL TRACKER */}
            <section className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Target size={20} className="text-zinc-600" />
                  <h2 className="text-xl font-black tracking-tighter uppercase italic">GOAL TRACKER</h2>
                </div>
                {/* <button className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">SEE HISTORY</button> */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localGoals?.map((goal: any) => {
                  const linkedCourse = activeCourses?.find((c: any) => c.id === goal.targetId);
                  return (
                    <GoalItem
                      key={goal.id}
                      goal={goal}
                      courseName={linkedCourse?.title}
                      onToggle={(id) => {
                        // Optimistic toggle
                        setLocalGoals(prev =>
                          prev.map(g =>
                            g.id === id ? { ...g, isDone: !g.isDone } : g
                          )
                        );

                        // Background sync
                        toggleGoalAction(id).catch(() => {
                          setLocalGoals(data.goals); // rollback
                        });
                      }}

                    />
                  );
                })}

                <CreateGoalDialog activeCourses={activeCourses || []} onSuccess={() => router.refresh()}
                >
                  <div className="border-2 border-dashed border-zinc-900 rounded-[2rem] p-8 flex items-center justify-center cursor-pointer hover:border-zinc-800 hover:bg-zinc-900/10 transition-all group">
                    <span className="text-zinc-700 text-[10px] font-black uppercase tracking-widest group-hover:text-zinc-400">+ ADD NEW GOAL</span>
                  </div>
                </CreateGoalDialog>
              </div>
            </section>

            <ActivityHeatmap activityData={activityData || {}} />
          </div>

          {/* 5. PLANNER */}
          <div className="lg:col-span-4 h-fit sticky top-10">
            <PlannerWidget
              events={plannerEvents || []}
              optimisticUpdate={updatePlannerOptimistic}
              handleUpdate={handleUpdate}
            />

          </div>
        </div>
      </div>
    </div>
  );
}