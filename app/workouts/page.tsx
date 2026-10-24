"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CirclePause, Plus, Timer, Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { readStore, today, writeStore, type Store, type WorkoutSet } from "@/lib/macromaama";

const split = [
  ["Monday", "Chest & triceps"], ["Tuesday", "Back & biceps"], ["Wednesday", "Legs"],
  ["Thursday", "Shoulders & core"], ["Friday", "Balanced full-body"], ["Saturday", "Optional session or rest"], ["Sunday", "Rest & recovery"],
];
const library = [
  ["Bench press", "Chest · barbell", "Use a spotter and a comfortable range; stop for pain."],
  ["Dumbbell row", "Back · dumbbells", "Brace your trunk and use controlled reps."],
  ["Lat pulldown", "Back · cable", "Pull smoothly; avoid swinging or behind-neck pulls."],
  ["Goblet squat", "Legs · dumbbell", "Choose a manageable range and keep the movement controlled."],
  ["Leg press", "Legs · machine", "Do not lock knees; use a range that feels comfortable."],
  ["Romanian deadlift", "Hamstrings · barbell/dumbbells", "Learn the hinge with light load and coaching."],
  ["Overhead press", "Shoulders · dumbbells/barbell", "Use a stable stance and a pain-free range."],
  ["Biceps curl", "Arms · dumbbells", "Avoid momentum and use a controlled tempo."],
  ["Triceps extension", "Arms · cable/dumbbell", "Use light resistance and keep elbows comfortable."],
];
const inputClass = "min-h-11 rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm outline-none focus:border-amber-400";

export default function WorkoutPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [title, setTitle] = useState("");
  const [workoutDate, setWorkoutDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [effort, setEffort] = useState("6");
  const [exercise, setExercise] = useState("Bench press");
  const [reps, setReps] = useState("8");
  const [weight, setWeight] = useState("0");
  const [sleepHours, setSleepHours] = useState("");
  const [recoveryNote, setRecoveryNote] = useState("");
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [editingId, setEditingId] = useState("");
  const [notice, setNotice] = useState("");
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => { Promise.resolve().then(() => { try { setStore(readStore()); setWorkoutDate(today()); } catch { setNotice("Could not load workout history."); } }); }, []);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setTimer((current) => current > 0 ? current - 1 : 0), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  function addSet() {
    if (!Number(reps) || Number(reps) < 1 || Number(weight) < 0) return;
    setSets((current) => [...current, { id: crypto.randomUUID(), exercise, reps: Number(reps), weightKg: Number(weight) }]);
    if (!title) setTitle(`${exercise} session`);
  }
  function saveWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store || !sets.length) {
      setNotice("Add at least one exercise set before saving.");
      return;
    }
    const workout = { id: editingId || crypto.randomUUID(), date: workoutDate || today(), title: title.trim() || "Strength session", duration: Number(duration), sets, effort: Number(effort), note: recoveryNote.trim(), sleepHours: Number(sleepHours) || undefined };
    const updated = { ...store, workouts: [workout, ...store.workouts.filter((item) => item.id !== workout.id)] };
    setStore(updated);
    writeStore(updated);
    setSets([]);
    setEditingId("");
    setTitle("");
    setWorkoutDate(today());
    setRecoveryNote("");
    setSleepHours("");
    setNotice(editingId ? "Workout updated." : "Workout saved on this device.");
  }
  function editWorkout(id: string) {
    const workout = store?.workouts.find((item) => item.id === id);
    if (!workout) return;
    setEditingId(workout.id);
    setTitle(workout.title);
    setWorkoutDate(workout.date);
    setDuration(String(workout.duration));
    setEffort(String(workout.effort));
    setSets(workout.sets);
    setRecoveryNote(workout.note);
    setSleepHours(String(workout.sleepHours ?? ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function removeWorkout(id: string) {
    if (!store) return;
    const updated = { ...store, workouts: store.workouts.filter((item) => item.id !== id) };
    setStore(updated);
    writeStore(updated);
  }

  return <div>
    <PageTitle eyebrow="Workout manager" title="Strength, built steadily." description="Log sets, reps, and load to keep a real training history. Technique, coaching, and recovery matter more than chasing numbers." />
    <section className="mb-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
      <h2 className="font-extrabold">Flexible sample week</h2>
      <p className="mt-1 text-xs text-neutral-500">Adjust frequency for experience, school, recovery, and qualified coaching.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{split.map(([day, focus]) => <div key={day} className="flex items-center justify-between rounded-xl bg-neutral-800/70 p-3"><span className="text-xs text-neutral-500">{day}</span><strong className="text-xs">{focus}</strong></div>)}</div>
    </section>
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={saveWorkout} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
        <h2 className="font-extrabold">Record a session</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-neutral-400 sm:col-span-3">Session name<input className={`${inputClass} mt-1.5 w-full`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Upper body" /></label>
          <label className="text-xs text-neutral-400">Date<input className={`${inputClass} mt-1.5 w-full`} type="date" value={workoutDate} onChange={(event) => setWorkoutDate(event.target.value)} required /></label>
          <label className="text-xs text-neutral-400">Duration (min)<input className={`${inputClass} mt-1.5 w-full`} type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
          <label className="text-xs text-neutral-400">Effort (1–10)<input className={`${inputClass} mt-1.5 w-full`} type="number" min="1" max="10" value={effort} onChange={(event) => setEffort(event.target.value)} /></label>
          <label className="text-xs text-neutral-400">Exercise<select className={`${inputClass} mt-1.5 w-full`} value={exercise} onChange={(event) => setExercise(event.target.value)}>{library.map(([name]) => <option key={name}>{name}</option>)}</select></label>
          <label className="text-xs text-neutral-400">Sleep (hours, optional)<input className={`${inputClass} mt-1.5 w-full`} type="number" min="0" max="24" step="0.25" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} placeholder="Not recorded" /></label>
          <label className="text-xs text-neutral-400 sm:col-span-2">Recovery note (optional)<input className={`${inputClass} mt-1.5 w-full`} value={recoveryNote} onChange={(event) => setRecoveryNote(event.target.value)} placeholder="Energy, soreness, sleep quality…" /></label>
          <label className="text-xs text-neutral-400">Reps<input className={`${inputClass} mt-1.5 w-full`} type="number" min="1" value={reps} onChange={(event) => setReps(event.target.value)} /></label>
          <label className="text-xs text-neutral-400">Load (kg)<input className={`${inputClass} mt-1.5 w-full`} type="number" min="0" step="0.5" value={weight} onChange={(event) => setWeight(event.target.value)} /></label>
          <button type="button" onClick={addSet} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-700 text-sm font-bold hover:bg-neutral-800"><Plus size={16} />Add set</button>
        </div>
        {sets.length > 0 && <div className="mt-4 space-y-2">{sets.map((set, index) => <div key={set.id} className="flex items-center justify-between rounded-lg bg-neutral-800 p-3 text-sm"><span><strong>{index + 1}.</strong> {set.exercise}</span><span className="text-neutral-300">{set.weightKg}kg × {set.reps}</span><button type="button" onClick={() => setSets(sets.filter((row) => row.id !== set.id))} aria-label="Remove set" className="grid size-10 place-items-center rounded-lg text-neutral-400 hover:text-red-300"><Trash2 size={15} /></button></div>)}</div>}
        <button className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 text-sm font-extrabold text-neutral-950 hover:bg-amber-300">{editingId ? "Save workout changes" : "Save workout"}</button>
      </form>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
        <h2 className="font-extrabold">Exercise notes & rest timer</h2>
        <div className="mt-3 max-h-56 space-y-2 overflow-auto">{library.map(([name, equipment, note]) => <details key={name} className="rounded-xl bg-neutral-800/70 p-3"><summary className="cursor-pointer text-sm font-bold">{name}<span className="ml-2 text-xs font-normal text-neutral-500">{equipment}</span></summary><p className="mt-2 text-xs leading-5 text-neutral-400">{note}</p></details>)}</div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-800 p-3"><div><p className="text-xs text-neutral-500">Rest timer</p><p className="font-mono text-2xl font-bold text-amber-300">{String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}</p></div><div className="flex gap-2"><button onClick={() => { setTimer(90); setRunning(true); }} className="min-h-11 rounded-lg bg-neutral-800 px-3 text-xs font-bold">90 sec</button><button onClick={() => setRunning(!running)} aria-label={running ? "Pause rest timer" : "Start rest timer"} className="grid size-11 place-items-center rounded-lg bg-amber-400 text-neutral-950">{running ? <CirclePause size={17} /> : <Timer size={17} />}</button></div></div>
        <p className="mt-3 text-[11px] leading-5 text-neutral-500">Stop if you feel pain or unwell. Progress gradually; avoid unsafe max attempts or training through injury.</p>
      </section>
    </div>
    <section className="mt-6"><h2 className="mb-3 text-xl font-extrabold">Workout history</h2>{store?.workouts.length ? <div className="space-y-2">{store.workouts.map((workout) => <article key={workout.id} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4"><div><p className="font-bold">{workout.title}</p><p className="mt-1 text-xs text-neutral-500">{workout.date} · {workout.duration} min · effort {workout.effort}/10{workout.sleepHours ? ` · sleep ${workout.sleepHours}h` : ""}</p><p className="mt-2 text-xs text-neutral-300">{workout.sets.map((set) => `${set.exercise} ${set.weightKg}kg×${set.reps}`).join(" · ")}</p>{workout.note && <p className="mt-2 text-xs text-neutral-500">Recovery: {workout.note}</p>}</div><div className="flex gap-1"><button onClick={() => editWorkout(workout.id)} className="min-h-11 rounded-lg px-3 text-xs font-bold text-amber-300 hover:bg-neutral-800">Edit</button><button onClick={() => removeWorkout(workout.id)} aria-label={`Delete ${workout.title}`} className="grid size-11 place-items-center rounded-xl text-neutral-500 hover:bg-red-950 hover:text-red-300"><Trash2 size={16} /></button></div></article>)}</div> : <p className="rounded-xl border border-dashed border-neutral-700 p-6 text-sm text-neutral-500">No workouts saved yet. Your training history will appear here after your first log.</p>}</section>
    {notice && <p role="status" className="mt-4 text-sm text-amber-300">{notice}</p>}
  </div>;
}
