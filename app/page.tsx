"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Clock3, Droplets, Dumbbell, Plus, Scale, Sparkles, Utensils } from "lucide-react";
import { readStore, today, totalsFor, writeStore, type Store } from "@/lib/macromaama";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-surface rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5 ${className}`}>{children}</section>;
}

const trainingThoughts = [
  "Strength is built one honest rep at a time.",
  "Show up with patience. Leave a little stronger.",
  "Progress is a practice, not a finish line.",
  "Train with intent. Recover with pride.",
  "Small promises kept become real strength.",
  "Your next good session starts with the choice to begin.",
  "Consistency makes ordinary effort extraordinary.",
  "Lift with focus. Nourish with care. Rest without guilt.",
  "The best routine is the one you can return to.",
  "Build strength steadily; give your body time to adapt.",
  "A focused set today is a vote for the athlete you are becoming.",
  "Strong habits outlast short bursts of motivation.",
  "Respect the process, especially on the quiet days.",
  "Every session is a chance to practice getting better.",
];

export default function Dashboard() {
  const [store, setStore] = useState<Store | null>(null);
  const [loadError, setLoadError] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    Promise.resolve().then(() => {
      try { setStore(readStore()); setDate(today()); }
      catch { setLoadError("Saved data could not be read. Check browser storage settings."); }
    });
  }, []);

  if (!store || !date) return <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">{loadError || "Loading your dashboard…"}</div>;
  const logs = store.entries.filter((entry) => entry.date === date);
  const totals = totalsFor(logs);
  const weights = [...store.weights].sort((a, b) => b.date.localeCompare(a.date));
  const workouts = store.workouts.filter((workout) => workout.date === date);
  const water = store.water.filter((entry) => entry.date === date).reduce((sum, item) => sum + item.ml, 0);
  const targetCal = store.profile.targetCalories;
  const scoreLabel = logs.length ? `${logs.length} food ${logs.length === 1 ? "entry" : "entries"} today` : "No meals logged yet";
  const displayDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00`));
  const thoughtIndex = Math.floor((new Date(`${date}T12:00:00`).getTime() - new Date("2026-01-01T12:00:00").getTime()) / 86_400_000) % trainingThoughts.length;
  const trainingThought = trainingThoughts[(thoughtIndex + trainingThoughts.length) % trainingThoughts.length];
  function addWater() {
    if (!store) return;
    const updated = { ...store, water: [{ id: crypto.randomUUID(), date, ml: 250 }, ...store.water] };
    setStore(updated);
    writeStore(updated);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Macromaama · {displayDate}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"><span className="text-amber-300">Kadinama Iru.</span> <span className="text-neutral-400">Your progress, your pace.</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">{store.profile.objective || "Build consistent habits with a focus on strength, nourishment, and recovery."}</p>
        </div>
        <Link href="/checker" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-extrabold text-neutral-950 hover:bg-amber-300"><Plus size={17} />Log food</Link>
      </header>

      <section aria-label="Daily bodybuilding motivation" className="glass-surface relative overflow-hidden rounded-2xl border border-amber-200/15 bg-neutral-900 p-5 sm:p-6">
        <div className="absolute -right-10 -top-16 size-48 rounded-full bg-amber-300/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-200/15 bg-amber-200/10 text-amber-200"><Sparkles size={18} /></span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200/75">Today’s training thought</p>
            <blockquote className="mt-2 text-lg font-semibold leading-7 tracking-tight text-white sm:text-xl">“{trainingThought}”</blockquote>
            <p className="mt-2 text-xs text-neutral-400">A fresh thought every day. Keep building, at your own pace.</p>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100/90">
        <strong className="text-amber-300">A note on targets:</strong> Nutrition estimates for a 17-year-old need individualized professional guidance. No calorie or weight-change target is set here. You can track meals and review them with a parent/guardian and qualified clinician.
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Today’s nutrition · estimates</p><p className="mt-2 text-3xl font-black">{Math.round(totals.calories).toLocaleString()} <span className="text-sm font-semibold text-neutral-500">kcal logged</span></p></div>
            <span className="rounded-full bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300">{scoreLabel}</span>
          </div>
          {targetCal !== null && <p className="mt-3 text-sm text-neutral-400">Reference you entered: {targetCal.toLocaleString()} kcal <span className="text-neutral-600">· not a medical recommendation</span></p>}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Protein", totals.protein, "g", "text-amber-300", store.profile.targetProtein],
              ["Carbs", totals.carbs, "g", "text-sky-300", store.profile.targetCarbs],
              ["Fat", totals.fat, "g", "text-rose-300", store.profile.targetFat],
              ["Fiber", totals.fiber, "g", "text-emerald-300", null],
            ].map(([label, value, unit, color, target]) => <div key={String(label)} className="rounded-xl bg-neutral-800/70 p-3"><p className="text-[11px] text-neutral-500">{label} · logged</p><p className={`mt-1 text-lg font-extrabold ${color}`}>{Math.round(Number(value))}<span className="ml-1 text-xs font-medium text-neutral-500">{unit}</span></p>{target !== null && target !== undefined && <p className="mt-1 text-[10px] text-neutral-500">Reference entered: {Math.round(Number(target))}{unit}</p>}</div>)}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between"><h2 className="font-bold">Daily basics</h2><Activity size={17} className="text-amber-400" /></div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2 text-neutral-400"><Droplets size={16} />Water logged</span><strong className="ml-auto">{water.toLocaleString()} ml</strong><button onClick={addWater} className="min-h-11 rounded-lg bg-neutral-800 px-3 text-xs font-bold text-amber-300 hover:bg-neutral-700">+ 250 ml</button></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-neutral-400"><Dumbbell size={16} />Training today</span><strong>{workouts.length ? `${workouts.length} session${workouts.length > 1 ? "s" : ""}` : "Not recorded"}</strong></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-neutral-400"><Scale size={16} />Latest weigh-in</span><strong>{weights[0] ? `${weights[0].kg} kg` : "Not recorded"}</strong></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-neutral-400"><Clock3 size={16} />Gym time</span><strong>{store.profile.gymTime || "Not set"}</strong></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Food diary</p><h2 className="mt-1 text-lg font-extrabold">Today’s meals</h2></div><Link href="/checker" aria-label="Open food logger" className="grid size-10 place-items-center rounded-xl bg-neutral-800 text-amber-300 hover:bg-neutral-700"><ArrowUpRight size={18} /></Link></div>
          {logs.length ? <div className="mt-4 divide-y divide-neutral-800">{logs.map((entry) => <div key={entry.entryId} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{entry.name}</p><p className="mt-1 text-xs text-neutral-500">{entry.slot} · {entry.amount} {entry.unit} · P {Math.round(entry.protein * entry.amount / entry.serving)}g</p></div><span className="shrink-0 text-sm font-bold">{Math.round(entry.calories * entry.amount / entry.serving)} kcal</span></div>)}</div> : <Empty text="Your meals appear here after you log them. Food values are estimates; check the recipe and serving you actually ate." />}
        </Card>
        <Card>
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Strength & recovery</p><h2 className="mt-1 text-lg font-extrabold">Training today</h2></div><Link href="/workouts" className="grid size-10 place-items-center rounded-xl bg-neutral-800 text-amber-300 hover:bg-neutral-700"><Dumbbell size={18} /></Link></div>
          {workouts.length ? <div className="mt-4 space-y-3">{workouts.map((workout) => <div key={workout.id} className="rounded-xl bg-neutral-800/70 p-3"><p className="font-bold">{workout.title}</p><p className="mt-1 text-xs text-neutral-400">{workout.duration} min · {workout.sets.length} sets · effort {workout.effort}/10</p></div>)}</div> : <Empty text="No workout recorded today. Rest days are part of training too." />}
          <div className="mt-4 flex gap-2"><Link href="/workouts" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 text-xs font-extrabold text-neutral-950 hover:bg-amber-300"><Dumbbell size={15} />Log workout</Link><Link href="/history" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-200 hover:bg-neutral-700"><Utensils size={15} />Review trends</Link></div>
        </Card>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-4 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/50 p-4 text-sm leading-6 text-neutral-500">{text}</p>;
}
