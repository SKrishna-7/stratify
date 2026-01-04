"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  BookOpen,
  Flame
} from "lucide-react";

import { getDashboardStats } from "@actions/dashboard";

export default function TodayPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getDashboardStats();
      setData(res);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-zinc-600 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
        Syncing Today…
      </div>
    );
  }

  const todayKey = new Date().toISOString().split("T")[0];

  // 🔹 Completed topics today
  const completedTopics =
    data?.activeCourses
      ?.flatMap((c: any) => c.modules)
      .flatMap((m: any) => m.topics)
      .filter(
        (t: any) =>
          t.isCompleted &&
          t.completedAt &&
          new Date(t.completedAt).toISOString().startsWith(todayKey)
      ) || [];

  // 🔹 Focus topics studied today
  const focusTopics = completedTopics.filter((t: any) => t.isFocus);

  // 🔹 Planner blocks completed today
  const completedBlocks =
    data?.plannerEvents?.filter(
      (e: any) =>
        e.completed &&
        new Date(e.date).toDateString() === new Date().toDateString()
    ) || [];

  const estimatedMinutes = completedTopics.length * 15;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 max-w-5xl mx-auto space-y-12">

      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Today</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {todayLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-emerald-400 text-xs font-black">
          <Flame size={16} />
          Streak Mode
        </div>
      </header>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Topics Completed" value={completedTopics.length} icon={CheckCircle2} />
        <StatCard label="Focus Sessions" value={focusTopics.length} icon={Star} />
        <StatCard label="Study Blocks" value={completedBlocks.length} icon={BookOpen} />
        <StatCard label="Time Spent" value={`${estimatedMinutes} min`} icon={Clock} />
      </section>

      {/* STUDY LOG */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
          Study Timeline
        </h3>

        {completedTopics.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-600 text-sm">
            Nothing logged today.  
            <br />
            Discipline starts with showing up.
          </div>
        ) : (
          <div className="space-y-4">
            {completedTopics.map((topic: any, idx: number) => (
              <div
                key={topic.id}
                className="bg-[#090909] border border-zinc-900 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-zinc-200 uppercase tracking-tight">
                      {topic.title}
                    </p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      {topic.duration || "15 min"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {topic.isFocus && (
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                      Focus
                    </span>
                  )}
                  <p className="text-[9px] font-black text-zinc-600 mt-1">
                    #{completedTopics.length - idx}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- Helper ---------- */

function StatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: any;
  icon: any;
}) {
  return (
    <div className="bg-[#090909] border border-zinc-900 rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-xl font-black text-zinc-100">
          {value}
        </p>
      </div>
    </div>
  );
}
