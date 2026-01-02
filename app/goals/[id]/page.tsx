"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Target, Layers, TrendingUp,
  History, Trash2, PlayCircle, CheckCircle2, Circle, Clock, AlertTriangle,
  CircleAlert
} from "lucide-react";
import Link from "next/link";
import { deleteGoalAction } from "@actions/goals";
import { getGoalById } from "@actions/goals";
import { getCourses } from "@actions/course";
import { DashboardLoader } from "@components/Loader";

export default function GoalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<any[]>([]);
  const [goalState, setGoalState] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const [goalRes, coursesRes] = await Promise.all([
        getGoalById(id as string),
        getCourses()
      ]);

      setData(goalRes);
      setCourses(coursesRes);
      setLoading(false);
    }

    load();
  }, [id]);

  useEffect(() => {
    setGoalState(data);
  }, [data]);

 if (loading) return (
    <DashboardLoader/>
  );
  const goal = data?.goal;      // ← IMPORTANT (because getGoalById returns { goal, target })
  const target = data?.target;
  if (!goal) return <div className="h-screen bg-black flex items-center justify-center text-zinc-700 uppercase tracking-widest">Objective Offline</div>;

  // --- PREDICTION LOGIC ---
  const itemsRemaining = goal.target - goal.current;
  const unitsPerWeek = 2.5; // Default velocity
  const weeksNeeded = itemsRemaining / unitsPerWeek;
  const estCompletionDate = new Date();
  estCompletionDate.setDate(estCompletionDate.getDate() + (weeksNeeded * 7));

  // Risk Assessment
  const isOverdueRisk = goal.deadline && estCompletionDate > new Date(goal.deadline);

  // Find linked course data
   const linkedCourse =
    goal.category === "COURSE"
      ? courses.find(c => c.id === goal.targetId)
      : courses.find(c =>
          c.modules?.some((m: any) => m.id === goal.targetId)
        );
const allTopics =
  linkedCourse?.modules?.flatMap((m: any) => m.topics) ?? [];

const completedTopics = allTopics.filter(
  (t: any) => t.isCompleted
).length;
const completedUnits = allTopics
  .filter((t: any) => t.isCompleted || t.completedAt)
  .sort(
    (a: any, b: any) =>
      new Date(b.completedAt).getTime() -
      new Date(a.completedAt).getTime() || ''
  ) || [];


  function calculateGoalProgress(goal: any, linkedCourse?: any) {
  if (goal.category === "COURSE" && linkedCourse) {
    const totalTopics = linkedCourse.modules.flatMap((m: any) => m.topics).length;
    const completedTopics = linkedCourse.modules
      .flatMap((m: any) => m.topics)
      .filter((t: any) => t.isCompleted).length;

    return totalTopics > 0
      ? Math.round((completedTopics / totalTopics) * 100)
      : 0;
  }

  if (goal.category === "MODULE" && linkedCourse) {
    const module = linkedCourse.modules.find(
      (m: any) => m.id === goal.targetId
    );

    if (!module) return 0;

    const total = module.topics.length;
    const completed = module.topics.filter((t: any) => t.isCompleted).length;

    return total > 0
      ? Math.round((completed / total) * 100)
      : 0;
  }

  // fallback (simple numeric goals)
  return goal.target > 0
    ? Math.min(100, Math.round((goal.current / goal.target) * 100))
    : 0;
}

const progress =
  allTopics.length === 0
    ? 0
    : Math.round((completedTopics / allTopics.length) * 100);

  // console.log(allTopics)

  const handleDelete = async () => {
    if (!confirm("Decommission Objective?")) return;

    // ⚡ instant UX
    router.push("/");

    // background sync
    await deleteGoalAction(goalState.id);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 max-w-6xl mx-auto space-y-16 antialiased">

      {/* 1. NAVIGATION BAR */}
      <nav className="flex items-center justify-between border-b border-zinc-900 pb-8">
        <Link href="/" className="flex items-center gap-3 text-zinc-500 hover:text-zinc-200 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700">
            <ArrowLeft size={14} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Trajectory Dashboard</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href={linkedCourse ? `/courses/${linkedCourse.id}` : "#"}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <PlayCircle size={14} fill="black" /> Start Course
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-all"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </nav>

      {/* 2. HEADER & PREDICTIVE METRICS */}
      <header className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/80">
            Operational Objective
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase leading-[0.9] text-zinc-100">
            {goal.title}
          </h1>

          {/* Predictive Metric Card */}
          <div className={`p-6 bg-[#090909] border rounded-2xl flex flex-col justify-between transition-all max-w-sm
            ${isOverdueRisk ? 'border-red-900/50 ring-1 ring-red-500/10' : 'border-zinc-900'}`}>
            <div className="flex justify-between items-start mb-4">
              <Clock className={isOverdueRisk ? "text-red-500" : "text-zinc-600"} size={18} />
              {isOverdueRisk && (
                <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
                  <AlertTriangle size={8} /> GOAL DELAY
                </span>
              )}
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Predicted Completion</p>
              <p className={`text-2xl font-black ${isOverdueRisk ? 'text-red-400' : 'text-zinc-100'}`}>
                {estCompletionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-1">Based on {unitsPerWeek} units/week velocity</p>
            </div>
          </div>
        </div>

        {/* PROGRESS PANEL */}
        <div className="bg-[#090909] border border-zinc-900 rounded-[2rem] p-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-1">Goal Progress</span>
              <span className="text-5xl font-black tabular-nums tracking-tighter">{progress}%</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-1">Cleared / Total</span>
              <span className="text-lg font-bold text-zinc-300">{goal.current} <span className="text-zinc-700">/ {goal.target}</span></span>
            </div>
          </div>
          <div className="relative h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF5F6D] via-[#FFC371] to-[#2ecc71] transition-all duration-[2s] ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* 3. OPERATIONAL UNITS LIST */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <Target size={16} className="text-zinc-700" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Curriculum Unit Breakdown</h3>
        </div>


{linkedCourse?.modules?.length ? (
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {linkedCourse?.modules.map((module: any) =>
    module.topics.map((topic: any) => (
      <div
        key={topic.id}
        className={`p-5 rounded-2xl border transition-all flex items-center justify-between group
          ${
            topic.isCompleted
              ? "bg-emerald-500/[0.03] border-emerald-500/20"
              : "bg-[#090909] border-zinc-900 hover:border-zinc-800"
          }`}
      >
        <div className="flex items-center gap-4">
          {topic.isCompleted ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <CircleAlert size={18} className="text-zinc-700 group-hover:text-zinc-500 " />
          )}

          <div>
            <h4
              className={`text-xs font-bold uppercase tracking-tight
                ${topic.isCompleted ? "text-zinc-200" : "text-zinc-500"}`}
            >
              {topic.title}
            </h4>

            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-1">
              {topic.duration ?? "15 min"}
            </p>
          </div>
        </div>

        {topic.isCompleted && (
          <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest italic">
            Cleared
          </span>
        )   }
      </div>
    ))
  )
  }
</div> ) :(
   <div className="text-zinc-600 text-xs italic p-6">
    No curriculum units available
  </div>
)}

      </section>

      {/* 4. PERFORMANCE HISTORY */}
     <section className="space-y-6">
  <div className="flex items-center gap-3 px-2">
    <History size={16} className="text-zinc-700" />
    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
      Maturity Event Log
    </h3>
  </div>

  <div className="bg-[#090909] border border-zinc-900 rounded-[2rem] overflow-hidden">
    <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
      {completedUnits.length === 0 ? (
  <div className="p-6 text-center text-zinc-600 text-[10px] uppercase tracking-widest">
    No completed units yet
  </div>
) : (
  completedUnits.map((topic: any, idx: number) => (
    <div
      key={topic.id}
      className="flex items-center justify-between p-5 border-b border-zinc-900/50 last:border-0 hover:bg-zinc-800/20 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        <span className="text-xs font-bold text-zinc-200 tracking-tight uppercase italic">
          {topic.title} Cleared
        </span>
      </div>

      <div className="text-right">
        <span className="block text-[8px] font-black text-zinc-700 uppercase tracking-widest">
          {new Date(topic.completedAt).toLocaleDateString()}
        </span>
        <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">
          Sequence: {completedUnits.length - idx}
        </span>
      </div>
    </div>
  ))
)}

    </div>
  </div>
</section>



    </div>
  );
}