"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { readStore, today, totalsFor, writeStore, type Store, type WeightEntry } from "@/lib/macromaama";

const field = "min-h-11 rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-amber-400";
function startDate(days: number, anchor: string) { if (!anchor) return ""; const date = new Date(`${anchor}T12:00:00`); date.setDate(date.getDate() - days); return date.toISOString().slice(0, 10); }

export default function ProgressPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [range, setRange] = useState(30);
  const [date, setDate] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [kg, setKg] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState("");
  const [measurements, setMeasurements] = useState({ waist: "", chest: "", arms: "", thighs: "" });
  const [notice, setNotice] = useState("");
  useEffect(() => { Promise.resolve().then(() => { try { setStore(readStore()); const current = today(); setCurrentDate(current); setDate(current); } catch { setNotice("Could not read progress data."); } }); }, []);
  const start = startDate(range, currentDate);
  const weights = useMemo(() => (store?.weights ?? []).filter((entry) => entry.date >= start).sort((a, b) => a.date.localeCompare(b.date)), [store, start]);
  const nutrition = useMemo(() => {
    if (!store) return [];
    const days = new Map<string, typeof store.entries>();
    store.entries.filter((entry) => entry.date >= start && entry.date <= currentDate).forEach((entry) => days.set(entry.date, [...(days.get(entry.date) ?? []), entry]));
    return [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, entries]) => ({ date: day.slice(5), calories: Math.round(totalsFor(entries).calories), protein: Math.round(totalsFor(entries).protein), fiber: Math.round(totalsFor(entries).fiber), meals: entries.length }));
  }, [store, start, currentDate]);
  const activityData = useMemo(() => {
    if (!store) return { water: [], workouts: [] };
    const water = new Map<string, number>();
    store.water.filter((entry) => entry.date >= start && entry.date <= currentDate).forEach((entry) => water.set(entry.date, (water.get(entry.date) ?? 0) + entry.ml));
    const workouts = new Map<string, number>();
    store.workouts.filter((entry) => entry.date >= start && entry.date <= currentDate).forEach((entry) => workouts.set(entry.date, (workouts.get(entry.date) ?? 0) + 1));
    return {
      water: [...water].sort(([a], [b]) => a.localeCompare(b)).map(([day, ml]) => ({ date: day.slice(5), ml })),
      workouts: [...workouts].sort(([a], [b]) => a.localeCompare(b)).map(([day, sessions]) => ({ date: day.slice(5), sessions })),
    };
  }, [store, start, currentDate]);
  const actualMacros = useMemo(() => totalsFor((store?.entries ?? []).filter((entry) => entry.date >= start && entry.date <= currentDate)), [store, start, currentDate]);
  const exerciseNames = useMemo(() => [...new Set((store?.workouts ?? []).flatMap((workout) => workout.sets.map((set) => set.exercise)))], [store]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const strengthData = useMemo(() => (store?.workouts ?? []).filter((workout) => workout.date >= start && workout.date <= currentDate).flatMap((workout) => workout.sets.filter((set) => set.exercise === selectedExercise).map((set) => ({ date: workout.date.slice(5), load: set.weightKg, reps: set.reps }))), [store, start, currentDate, selectedExercise]);
  const report = useMemo(() => {
    const lastWeek = startDate(6, currentDate);
    const weekEntries = store?.entries.filter((entry) => entry.date >= lastWeek && entry.date <= currentDate) ?? [];
    const distinctDays = new Set(weekEntries.map((entry) => entry.date)).size;
    const consumed = totalsFor(weekEntries);
    const weekWorkoutEntries = store?.workouts.filter((item) => item.date >= lastWeek && item.date <= currentDate) ?? [];
    const sleepValues = weekWorkoutEntries.map((item) => item.sleepHours).filter((hours): hours is number => typeof hours === "number");
    const recoveryNotes = weekWorkoutEntries.map((item) => item.note).filter(Boolean).slice(0, 3);
    return {
      weekEntries: weekEntries.length, distinctDays, consumed, weekWorkouts: weekWorkoutEntries.length,
      averageSleep: sleepValues.length ? sleepValues.reduce((sum, hours) => sum + hours, 0) / sleepValues.length : null,
      recoveryNotes,
    };
  }, [store, currentDate]);

  function addWeight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store || Number(kg) <= 0) return;
    const entry: WeightEntry = {
      id: editingId || crypto.randomUUID(), date, kg: Number(kg), note,
      waist: Number(measurements.waist) || undefined, chest: Number(measurements.chest) || undefined,
      arms: Number(measurements.arms) || undefined, thighs: Number(measurements.thighs) || undefined,
    };
    const updated = { ...store, weights: [entry, ...store.weights.filter((item) => item.id !== entry.id)] };
    setStore(updated); writeStore(updated); setKg(""); setNote(""); setEditingId(""); setMeasurements({ waist: "", chest: "", arms: "", thighs: "" }); setNotice(editingId ? "Measurement updated." : "Weigh-in saved. Normal day-to-day changes are expected.");
  }
  function editWeight(entry: WeightEntry) {
    setEditingId(entry.id); setDate(entry.date); setKg(String(entry.kg)); setNote(entry.note);
    setMeasurements({ waist: String(entry.waist ?? ""), chest: String(entry.chest ?? ""), arms: String(entry.arms ?? ""), thighs: String(entry.thighs ?? "") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function removeWeight(id: string) {
    if (!store) return;
    const updated = { ...store, weights: store.weights.filter((entry) => entry.id !== id) };
    setStore(updated); writeStore(updated);
  }

  return <div>
    <PageTitle eyebrow="Progress & analytics" title="Your real data, over time." description="Charts show only entries you actually recorded. No sample history, trend forecasts, or missing days filled in." />
    <div className="mb-4 flex gap-2">{[[7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([days, label]) => <button key={days} onClick={() => setRange(Number(days))} className={`min-h-10 rounded-xl px-4 text-xs font-bold ${range === days ? "bg-amber-400 text-neutral-950" : "bg-neutral-900 text-neutral-400"}`}>{label}</button>)}</div>
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Recorded body weight" empty={weights.length ? "" : "No weigh-ins in this range. Record measurements on the same scale and similar conditions if you choose to track."}>
        {weights.length > 0 && <ResponsiveContainer width="100%" height={250}><LineChart data={weights} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 10 }} /><YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#a3a3a3", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 12 }} formatter={(value) => [`${value ?? 0} kg`, "Recorded weight"]} /><Line dataKey="kg" stroke="#fbbf24" strokeWidth={3} dot={{ fill: "#fbbf24", r: 4 }} /></LineChart></ResponsiveContainer>}
        {weights.length === 1 && <p className="mt-2 text-xs text-neutral-500">Add another measurement on a different date to see a trend.</p>}
      </ChartCard>
      <ChartCard title="Logged energy & protein" empty={nutrition.length ? "" : "No food logs in this range. Add meals in Food & Meals to build an actual intake chart."}>
        {nutrition.length > 0 && <ResponsiveContainer width="100%" height={250}><LineChart data={nutrition} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 10 }} /><YAxis yAxisId="left" tick={{ fill: "#a3a3a3", fontSize: 10 }} /><YAxis yAxisId="right" orientation="right" tick={{ fill: "#a3a3a3", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 12 }} /><Line yAxisId="left" dataKey="calories" name="kcal logged" stroke="#fbbf24" strokeWidth={2.5} connectNulls={false} /><Line yAxisId="right" dataKey="protein" name="protein g" stroke="#38bdf8" strokeWidth={2.5} connectNulls={false} /></LineChart></ResponsiveContainer>}
      </ChartCard>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <ChartCard title="Recorded water intake" empty={activityData.water.length ? "" : "No water entries in this range. Use +250 ml on your dashboard to record intake; there is no assumed hydration target."}>
        {activityData.water.length > 0 && <ResponsiveContainer width="100%" height={220}><BarChart data={activityData.water}><CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 10 }} /><YAxis tick={{ fill: "#a3a3a3", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 12 }} formatter={(value) => [`${value ?? 0} ml`, "Recorded water"]} /><Bar dataKey="ml" name="ml" fill="#38bdf8" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>}
      </ChartCard>
      <ChartCard title="Workout sessions recorded" empty={activityData.workouts.length ? "" : "No workout sessions in this range. Add a session in Workout Manager; unlogged days are not assumed to be rest days."}>
        {activityData.workouts.length > 0 && <ResponsiveContainer width="100%" height={220}><BarChart data={activityData.workouts}><CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: "#a3a3a3", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 12 }} /><Bar dataKey="sessions" name="Sessions logged" fill="#fbbf24" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>}
      </ChartCard>
      <ChartCard title="Macro distribution · logged estimates" empty={actualMacros.protein + actualMacros.carbs + actualMacros.fat > 0 ? "" : "No macro data in this range. Log a food with nutrition values to see its estimated distribution."}>
        {actualMacros.protein + actualMacros.carbs + actualMacros.fat > 0 && <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={[{ name: "Protein", value: Math.round(actualMacros.protein) }, { name: "Carbs", value: Math.round(actualMacros.carbs) }, { name: "Fat", value: Math.round(actualMacros.fat) }]} dataKey="value" nameKey="name" outerRadius={78} label={({ name, value }) => `${name} ${value}g`}>{["#fbbf24", "#38bdf8", "#fb7185"].map((color) => <Cell key={color} fill={color} />)}</Pie><Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 12 }} /></PieChart></ResponsiveContainer>}
      </ChartCard>
      <ChartCard title="Exercise performance" empty={strengthData.length ? "" : "No recorded sets for an exercise in this range. Log sets and loads in Workout Manager to compare sessions."}>
        <div className="mb-3"><select aria-label="Choose exercise to chart" className={`${field} w-full`} value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}><option value="">Choose a recorded exercise</option>{exerciseNames.map((name) => <option key={name}>{name}</option>)}</select></div>
        {strengthData.length > 0 && <><ResponsiveContainer width="100%" height={200}><LineChart data={strengthData}><CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 10 }} /><YAxis tick={{ fill: "#a3a3a3", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 12 }} formatter={(value) => [`${value ?? 0} kg`, "Recorded load"]} /><Line dataKey="load" name="Load kg" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: "#a78bfa", r: 4 }} /></LineChart></ResponsiveContainer><p className="text-xs text-neutral-500">Recorded load per set; compare like-for-like technique and reps with coaching, not max attempts.</p></>}
      </ChartCard>
    </div>

    <section className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Past 7 days · based on logged data</p><h2 className="mt-1 text-lg font-extrabold">Weekly check-in</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[
        ["Meals logged", `${report.weekEntries}`], ["Days with food logs", `${report.distinctDays}/7`], ["Workout attendance", `${report.weekWorkouts}`], ["Protein logged", `${Math.round(report.consumed.protein)}g`],
      ].map(([label, value]) => <div key={label} className="rounded-xl bg-neutral-800 p-3"><p className="text-[11px] text-neutral-500">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>)}</div>
      <p className="mt-3 text-xs text-neutral-400">Fibre logged: {Math.round(report.consumed.fiber)}g · No target scoring. Consistency is information, not a judgment.</p>
      {(report.averageSleep !== null || report.recoveryNotes.length > 0) && <p className="mt-2 text-xs leading-5 text-neutral-500">Recorded sleep/recovery: {report.averageSleep !== null ? `average ${report.averageSleep.toFixed(1)}h across entries` : "no sleep duration saved"}{report.recoveryNotes.length ? ` · ${report.recoveryNotes.join("; ")}` : ""}</p>}
    </section>

    <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={addWeight} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
        <h2 className="font-extrabold">Add a weigh-in</h2><p className="mt-1 text-xs text-neutral-500">Optional. Your profile weight is not treated as a recorded measurement.</p>
        <div className="mt-4 grid grid-cols-2 gap-2"><label className="text-xs text-neutral-400">Date<input className={`${field} mt-1.5 w-full`} type="date" value={date} max={currentDate} onChange={(event) => setDate(event.target.value)} required /></label><label className="text-xs text-neutral-400">Weight (kg)<input className={`${field} mt-1.5 w-full`} type="number" min="1" max="400" step="0.1" value={kg} onChange={(event) => setKg(event.target.value)} required /></label></div>
        <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-neutral-400">Optional body measurements (cm)</summary><div className="mt-2 grid grid-cols-2 gap-2">{(["waist", "chest", "arms", "thighs"] as const).map((key) => <label key={key} className="text-xs capitalize text-neutral-500">{key}<input className={`${field} mt-1 w-full`} type="number" min="0" step="0.1" value={measurements[key]} onChange={(event) => setMeasurements({ ...measurements, [key]: event.target.value })} /></label>)}</div></details>
        <label className="mt-3 block text-xs text-neutral-400">Note<input className={`${field} mt-1.5 w-full`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional context" /></label>
        <button className="mt-4 min-h-11 w-full rounded-xl bg-amber-400 text-sm font-extrabold text-neutral-950">{editingId ? "Save measurement changes" : "Save actual measurement"}</button>
      </form>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5"><h2 className="font-extrabold">Measurement history</h2>{store?.weights.length ? <div className="mt-3 divide-y divide-neutral-800">{[...store.weights].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => <article key={entry.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold">{entry.kg} kg <span className="ml-2 text-xs font-normal text-neutral-500">{entry.date}</span></p><p className="mt-1 text-xs text-neutral-500">{[entry.waist && `Waist ${entry.waist}cm`, entry.chest && `Chest ${entry.chest}cm`, entry.arms && `Arms ${entry.arms}cm`, entry.thighs && `Thighs ${entry.thighs}cm`, entry.note].filter(Boolean).join(" · ") || "No notes"}</p></div><div className="flex gap-1"><button onClick={() => editWeight(entry)} className="min-h-11 rounded-lg px-3 text-xs font-bold text-amber-300 hover:bg-neutral-800">Edit</button><button onClick={() => removeWeight(entry.id)} aria-label={`Delete measurement ${entry.date}`} className="grid size-11 place-items-center rounded-lg text-neutral-500 hover:bg-red-950 hover:text-red-300"><Trash2 size={16} /></button></div></article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-neutral-700 p-6 text-sm text-neutral-500">No measurements recorded yet. The chart uses actual entries only.</p>}</section>
    </div>
    {notice && <p role="status" className="mt-4 text-sm text-amber-300">{notice}</p>}
  </div>;
}

function ChartCard({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5"><h2 className="mb-4 font-extrabold">{title}</h2>{empty ? <p className="rounded-xl border border-dashed border-neutral-700 p-6 text-sm leading-6 text-neutral-500">{empty}</p> : children}</section>;
}
