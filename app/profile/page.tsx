"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Download, Save, Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { blankStore, readStore, writeStore, type UserProfile, type Store } from "@/lib/macromaama";

const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20";
const numberFields: [keyof UserProfile, string, string][] = [
  ["age", "Age", "years"], ["height", "Height", "cm"], ["weight", "Current weight (profile only)", "kg"],
  ["weightGoal", "Long-term weight goal (optional)", "kg"],
];

export default function ProfilePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => { Promise.resolve().then(() => { try { setStore(readStore()); } catch { setNotice("Could not load saved settings."); } }); }, []);

  function change<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    if (!store) return;
    setSaved(false);
    setStore({ ...store, profile: { ...store.profile, [key]: value } });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store) return;
    writeStore(store);
    setSaved(true);
    setNotice("Profile saved on this device.");
  }

  function downloadData() {
    if (!store) return;
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "macromaama-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetData() {
    if (!window.confirm("Delete all locally saved Macromaama data? This cannot be undone.")) return;
    const fresh = blankStore();
    writeStore(fresh);
    setStore(fresh);
    setSaved(false);
    setNotice("Local data deleted. Your profile is back to its editable starter values.");
  }

  if (!store) return <p className="text-sm text-neutral-400">Loading profile…</p>;
  const profile = store.profile;

  return <div>
    <PageTitle eyebrow="Macromaama · onboarding & profile" title="Your starting point." description="Personalize Macromaama for your evening gym schedule, food preferences, budget, and changing goals. Starter details are editable; nothing here is a medical prescription." />
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
        <h2 className="font-extrabold">About you</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {numberFields.map(([key, label, unit]) => <label key={key} className="text-xs font-semibold text-neutral-400">{label}<span className="ml-1 text-neutral-600">({unit})</span><input className={inputClass} type="number" min="0" step="any" value={String(profile[key] ?? "")} onChange={(event) => change(key, (event.target.value === "" ? 0 : Number(event.target.value)) as UserProfile[typeof key])} /></label>)}
          <label className="text-xs font-semibold text-neutral-400">Gender (optional)<select className={inputClass} value={profile.gender} onChange={(event) => change("gender", event.target.value)}><option>Prefer not to say</option><option>Female</option><option>Male</option><option>Another identity</option></select></label>
          <label className="text-xs font-semibold text-neutral-400">Usual activity level<select className={inputClass} value={profile.activity} onChange={(event) => change("activity", event.target.value)}><option value="">Select if known</option><option>Mostly sitting</option><option>Lightly active</option><option>Moderately active</option><option>Very active</option></select></label>
          <label className="text-xs font-semibold text-neutral-400">Training experience<select className={inputClass} value={profile.trainingExperience} onChange={(event) => change("trainingExperience", event.target.value)}><option value="">Choose</option><option>New to training</option><option>Less than a year</option><option>1–3 years</option><option>3+ years</option><option>Prefer not to say</option></select></label>
          <label className="text-xs font-semibold text-neutral-400">Equipment available<input className={inputClass} value={profile.equipment} onChange={(event) => change("equipment", event.target.value)} placeholder="e.g. gym, dumbbells, bodyweight" /></label>
          <label className="text-xs font-semibold text-neutral-400">Location / food context<input className={inputClass} value={profile.location} onChange={(event) => change("location", event.target.value)} placeholder="e.g. Tamil Nadu, India" /></label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
        <h2 className="font-extrabold">Food, schedule & preferences</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-neutral-400">Dietary preference<select className={inputClass} value={profile.diet} onChange={(event) => change("diet", event.target.value)}><option value="">Choose</option><option>Vegetarian</option><option>Egg-based</option><option>Non-vegetarian</option><option>Vegan</option><option>No preference</option></select></label>
          <label className="text-xs font-semibold text-neutral-400">Food budget per week (₹ estimate)<input className={inputClass} type="number" min="0" step="100" value={profile.budget || ""} onChange={(event) => change("budget", Number(event.target.value))} placeholder="Optional" /></label>
          <label className="text-xs font-semibold text-neutral-400 sm:col-span-2">Allergies or intolerances<textarea className={`${inputClass} min-h-20 py-3`} value={profile.allergies} onChange={(event) => change("allergies", event.target.value)} placeholder="List known allergies; do not rely on this app to screen foods." /></label>
          <label className="text-xs font-semibold text-neutral-400 sm:col-span-2">Foods you dislike or avoid<textarea className={`${inputClass} min-h-16 py-3`} value={profile.dislikes} onChange={(event) => change("dislikes", event.target.value)} placeholder="Optional" /></label>
          <label className="text-xs font-semibold text-neutral-400">Typical schedule<textarea className={`${inputClass} min-h-20 py-3`} value={profile.schedule} onChange={(event) => change("schedule", event.target.value)} placeholder="School, meals, sleep, commute…" /></label>
          <label className="text-xs font-semibold text-neutral-400">Gym time<input className={inputClass} value={profile.gymTime} onChange={(event) => change("gymTime", event.target.value)} placeholder="e.g. 8:30–10:00 PM" /></label>
          <label className="text-xs font-semibold text-neutral-400 sm:col-span-2">Current objective<textarea className={`${inputClass} min-h-16 py-3`} value={profile.objective} onChange={(event) => change("objective", event.target.value)} /></label>
          <label className="text-xs font-semibold text-neutral-400 sm:col-span-2">Optional review date — choose a new date if useful<input className={inputClass} type="date" value={profile.reviewDate} onChange={(event) => change("reviewDate", event.target.value)} /></label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
        <h2 className="font-extrabold">Nutrition references (optional)</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">No calorie or macro goal is automatically calculated. For someone under 18, discuss targets with a parent/guardian and qualified health professional. These optional fields are references you choose to enter, not recommendations.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{([["targetCalories", "Calories (kcal)"], ["targetProtein", "Protein (g)"], ["targetCarbs", "Carbs (g)"], ["targetFat", "Fat (g)"]] as const).map(([key, label]) => <label key={key} className="text-xs font-semibold text-neutral-400">{label}<input className={inputClass} type="number" min="0" step="any" value={profile[key] ?? ""} onChange={(event) => change(key, event.target.value === "" ? null : Number(event.target.value))} placeholder="Not set" /></label>)}</div>
      </section>

      <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-extrabold text-neutral-950 hover:bg-amber-300"><Save size={17} />{saved ? "Saved" : "Save profile & preferences"}</button>
    </form>
    <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
      <h2 className="font-extrabold">Your data</h2>
      <p className="mt-1 text-xs leading-5 text-neutral-500">Export a local JSON backup or delete the saved data in this browser. Data is not synced to another device.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row"><button onClick={downloadData} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-700 text-sm font-bold hover:bg-neutral-800"><Download size={16} />Export my data</button><button onClick={resetData} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-900/70 text-sm font-bold text-red-300 hover:bg-red-950/50"><Trash2 size={16} />Delete local data</button></div>
    </section>
    {notice && <p role="status" className="mt-4 text-sm text-amber-300">{notice}</p>}
  </div>;
}
