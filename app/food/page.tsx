"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { Search } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { foods, readStore, type FoodItem } from "@/lib/macromaama";

export default function FoodDatabasePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.resolve().then(() => { try { setCustomFoods(readStore().customFoods); } catch { setError("Saved custom foods could not be read. Showing the starter database."); } }); }, []);
  const allFoods = useMemo(() => [...foods, ...customFoods], [customFoods]);
  const categories = useMemo(() => ["All", ...new Set(allFoods.map((food) => food.category))], [allFoods]);
  const results = useMemo(() => allFoods.filter((food) => (category === "All" || food.category === category) && food.name.toLowerCase().includes(query.toLowerCase())), [allFoods, query, category]);
  return <div>
    <PageTitle eyebrow="Tamil & Indian food database" title="Know what’s on your plate." description="A practical starter list of familiar foods. Values are broad estimates, not verified measurements; home recipes, brands, and cooking oil can change them." />
    <label className="relative block"><Search size={17} className="absolute left-3 top-3.5 text-neutral-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 w-full rounded-xl border border-neutral-700 bg-neutral-900 pl-10 pr-3 text-sm outline-none focus:border-amber-400" placeholder="Search idli, dal, curd…" aria-label="Search food database" /></label>
    <div className="my-4 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold ${category === item ? "bg-amber-400 text-neutral-950" : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"}`}>{item}</button>)}</div>
    <p className="mb-3 text-xs text-neutral-500">{results.length} foods · values per listed serving</p>
    {results.length ? <div className="grid gap-3 sm:grid-cols-2">{results.map((food) => <article key={food.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-bold">{food.name}</h2><p className="mt-1 text-xs text-neutral-500">{food.category} · {food.serving} {food.unit}{food.cooked ? " · cooked" : ""}</p></div><span className="shrink-0 rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs font-extrabold text-amber-300">{food.calories} kcal</span></div><p className="mt-4 text-xs text-neutral-400">Protein {food.protein}g · Carbs {food.carbs}g · Fat {food.fat}g · Fibre {food.fiber ?? "not listed"}g</p><p className="mt-2 text-[10px] text-neutral-600">Reference estimate · recipe and portion dependent</p></article>)}</div> : <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center text-sm text-neutral-500">No foods found. Try another name or category.</div>}
    {error && <p role="alert" className="mt-4 text-xs text-amber-200">{error}</p>}
  </div>;
}
