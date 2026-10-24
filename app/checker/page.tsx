"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Copy, Search, Star, Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { addFoodEntry, foods, nutritionFor, readStore, today, totalsFor, writeStore, type FoodItem, type MealSlot, type Store } from "@/lib/macromaama";

const slots: MealSlot[] = ["Breakfast", "Mid-morning", "Lunch", "Evening snack", "Pre-workout", "Post-workout", "Dinner", "Other"];
const inputClass = "min-h-11 rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20";

export default function FoodLogger() {
  const [store, setStore] = useState<Store | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [amount, setAmount] = useState("1");
  const [slot, setSlot] = useState<MealSlot>("Breakfast");
  const [notice, setNotice] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => { Promise.resolve().then(() => { try { setStore(readStore()); setCurrentDate(today()); } catch { setNotice("Could not read saved meals from this browser."); } }); }, []);
  const foodOptions = useMemo(() => [...foods, ...(store?.customFoods ?? [])], [store]);
  const matches = useMemo(() => foodOptions.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()) || food.category.toLowerCase().includes(query.toLowerCase())).slice(0, 12), [foodOptions, query]);
  const todayEntries = store?.entries.filter((entry) => entry.date === currentDate) ?? [];
  const previousEntries = store?.entries.filter((entry) => entry.date < currentDate).slice(0, 5) ?? [];
  const totals = totalsFor(todayEntries);
  const amountNumber = Number(amount);
  const preview = selected && Number.isFinite(amountNumber) && amountNumber > 0 ? nutritionFor(selected, amountNumber) : null;

  function saveEntry(food: FoodItem, quantity: number, mealSlot: MealSlot) {
    if (!store || !Number.isFinite(quantity) || quantity <= 0) return;
    const updated = addFoodEntry(store, food, quantity, mealSlot);
    setStore(updated);
    writeStore(updated);
    setSelected(null);
    setQuery("");
    setAmount("1");
    setNotice(`${food.name} added to ${mealSlot.toLowerCase()}.`);
  }

  function removeEntry(id: string) {
    if (!store) return;
    const updated = { ...store, entries: store.entries.filter((entry) => entry.entryId !== id) };
    setStore(updated);
    writeStore(updated);
    setNotice("Food entry removed.");
  }

  function editAmount(id: string, value: string) {
    if (!store) return;
    const nextAmount = Number(value);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) return;
    const updated = { ...store, entries: store.entries.map((entry) => entry.entryId === id ? { ...entry, amount: nextAmount } : entry) };
    setStore(updated);
    writeStore(updated);
  }

  function saveCustomFood(food: FoodItem) {
    if (!store) return;
    const updated = { ...store, customFoods: [food, ...store.customFoods] };
    setStore(updated);
    writeStore(updated);
    setSelected(food);
    setQuery(food.name);
    setAmount(String(food.serving));
    setCustomOpen(false);
  }

  function toggleFavorite(foodId: string) {
    if (!store) return;
    const favoriteFoods = store.favoriteFoods.includes(foodId)
      ? store.favoriteFoods.filter((id) => id !== foodId)
      : [...store.favoriteFoods, foodId];
    const updated = { ...store, favoriteFoods };
    setStore(updated);
    writeStore(updated);
  }

  function duplicate(entry: (typeof todayEntries)[number]) {
    if (!store) return;
    const updated = addFoodEntry(store, entry, entry.amount, entry.slot);
    setStore(updated);
    writeStore(updated);
    setNotice(`${entry.name} duplicated.`);
  }

  return (
    <div>
      <PageTitle eyebrow="Food & meal logger" title="Log what you ate." description="Search familiar foods, adjust the serving, and see an estimate before saving. Home recipes can vary a lot." />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {([["Energy", totals.calories, "kcal"], ["Protein", totals.protein, "g"], ["Carbs", totals.carbs, "g"], ["Fat", totals.fat, "g"], ["Fiber", totals.fiber, "g"]] as const).map(([label, amountValue, unit]) => <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3"><p className="text-[11px] text-neutral-500">{label}</p><p className="mt-1 font-extrabold text-white">{Math.round(amountValue)} <span className="text-xs font-medium text-neutral-500">{unit}</span></p></div>)}
      </div>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
        <h2 className="font-extrabold">Add a food</h2>
        <div className="relative mt-3">
          <Search size={17} className="absolute left-3 top-3.5 text-neutral-500" />
          <input className={`${inputClass} w-full pl-10`} value={query} onChange={(event) => { setQuery(event.target.value); setSelected(null); }} placeholder="Search idli, rice, egg, dal…" aria-label="Search foods" />
        </div>
        {!query && store?.favoriteFoods.length ? <div className="mt-3 flex flex-wrap gap-2">{foodOptions.filter((food) => store.favoriteFoods.includes(food.id)).map((food) => <button key={food.id} onClick={() => { setSelected(food); setQuery(food.name); setAmount(String(food.serving)); }} className="min-h-10 rounded-full border border-neutral-700 px-3 text-xs font-semibold text-amber-200 hover:bg-neutral-800"><Star size={12} className="mr-1 inline" fill="currentColor" />{food.name}</button>)}</div> : null}
        {query && !selected && <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950">{matches.map((food) => <div key={food.id} className="flex items-center border-b border-neutral-800 last:border-0 hover:bg-neutral-800"><button onClick={() => { setSelected(food); setQuery(food.name); setAmount(String(food.serving)); }} className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 px-3 text-left"><span className="min-w-0"><strong className="block truncate text-sm">{food.name}</strong><small className="text-neutral-500">{food.category} · per {food.serving} {food.unit}</small></span><span className="shrink-0 text-xs text-amber-300">{food.calories} kcal</span></button><button type="button" onClick={() => toggleFavorite(food.id)} aria-label={`${store?.favoriteFoods.includes(food.id) ? "Unfavorite" : "Favorite"} ${food.name}`} className={`grid size-11 shrink-0 place-items-center ${store?.favoriteFoods.includes(food.id) ? "text-amber-300" : "text-neutral-500"}`}><Star size={16} fill={store?.favoriteFoods.includes(food.id) ? "currentColor" : "none"} /></button></div>)}
          {!matches.length && <p className="p-3 text-sm text-neutral-400">No match in the starter database. Add a custom entry with your package or recipe label.</p>}</div>}

        {selected && <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
            <label className="text-xs font-semibold text-neutral-400">Amount ({selected.unit})<input className={`${inputClass} mt-1.5 w-full`} type="number" min="0.1" step="0.1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
            <label className="text-xs font-semibold text-neutral-400">Meal<select className={`${inputClass} mt-1.5 w-full`} value={slot} onChange={(event) => setSlot(event.target.value as MealSlot)}>{slots.map((option) => <option key={option}>{option}</option>)}</select></label>
            <div className="text-xs text-neutral-400">{preview ? <><strong className="text-white">{Math.round(preview.calories)} kcal</strong><p className="mt-1">P {preview.protein.toFixed(1)}g · C {preview.carbs.toFixed(1)}g · F {preview.fat.toFixed(1)}g · fibre {preview.fiber.toFixed(1)}g</p></> : "Enter an amount to preview nutrition."}</div>
            <button onClick={() => saveEntry(selected, amountNumber, slot)} disabled={!preview} className="min-h-11 rounded-xl bg-amber-400 px-4 text-sm font-extrabold text-neutral-950 hover:bg-amber-300 disabled:opacity-50">Add food</button>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-neutral-500">Estimate for {selected.cooked ? "cooked" : "as listed"} food. Values are approximate references and may not match your recipe, oil, or brand.</p>
        </div>}
        {!matches.length && query && !selected && <button onClick={() => setCustomOpen(!customOpen)} className="mt-3 min-h-11 rounded-xl border border-neutral-700 px-3 text-xs font-bold text-amber-300 hover:bg-neutral-800">Create a custom food</button>}
        {customOpen && <CustomFood onSave={saveCustomFood} foods={foodOptions} />}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Real entries only</p><h2 className="mt-1 text-xl font-extrabold">Today’s food</h2></div><span className="text-xs text-neutral-500">{todayEntries.length} {todayEntries.length === 1 ? "item" : "items"}</span></div>
        {todayEntries.length ? <div className="space-y-2">{todayEntries.map((entry) => { const nutrition = nutritionFor(entry, entry.amount); return <article key={entry.entryId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3.5"><div className="min-w-[140px] flex-1"><p className="text-sm font-bold">{entry.name}</p><p className="mt-1 text-xs text-neutral-500">{entry.slot} · {Math.round(nutrition.calories)} kcal · P {Math.round(nutrition.protein)}g · C {Math.round(nutrition.carbs)}g</p></div><label className="flex items-center gap-2 text-xs text-neutral-500">Amount<input aria-label={`Amount of ${entry.name}`} className={`${inputClass} w-20`} type="number" min="0.1" step="0.1" value={entry.amount} onChange={(event) => editAmount(entry.entryId, event.target.value)} />{entry.unit}</label><button onClick={() => duplicate(entry)} aria-label={`Duplicate ${entry.name}`} className="grid size-11 place-items-center rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-amber-300"><Copy size={16} /></button><button onClick={() => removeEntry(entry.entryId)} aria-label={`Delete ${entry.name}`} className="grid size-11 place-items-center rounded-xl text-neutral-400 hover:bg-red-950 hover:text-red-300"><Trash2 size={16} /></button></article>; })}</div> : <div className="rounded-2xl border border-dashed border-neutral-700 p-8 text-center"><p className="font-bold">No meals logged today</p><p className="mt-1 text-sm text-neutral-500">Search a food above to add your first entry.</p></div>}
      </section>
      {previousEntries.length > 0 && <section className="mt-6"><h2 className="mb-3 text-lg font-extrabold">Repeat a recent food</h2><div className="space-y-2">{previousEntries.map((entry) => <div key={entry.entryId} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"><div><p className="text-sm font-bold">{entry.name}</p><p className="text-xs text-neutral-500">{entry.date} · {entry.amount} {entry.unit}</p></div><button onClick={() => duplicate(entry)} className="min-h-11 rounded-xl bg-neutral-800 px-3 text-xs font-bold text-amber-300 hover:bg-neutral-700">Repeat today</button></div>)}</div></section>}
      {notice && <p role="status" className="mt-4 text-sm text-amber-300">{notice}</p>}
    </div>
  );
}

function CustomFood({ onSave, foods: availableFoods }: { onSave: (food: FoodItem) => void; foods: FoodItem[] }) {
  const [fields, setFields] = useState({ name: "", serving: "100", unit: "g" as FoodItem["unit"], calories: "", protein: "", carbs: "", fat: "", fiber: "" });
  const [mode, setMode] = useState<"label" | "recipe">("recipe");
  const [ingredientId, setIngredientId] = useState(availableFoods[0]?.id ?? "");
  const [ingredientAmount, setIngredientAmount] = useState("100");
  const [portions, setPortions] = useState("2");
  const [ingredients, setIngredients] = useState<{ foodId: string; amount: number }[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [error, setError] = useState("");
  const recipeTotals = useMemo(() => ingredients.reduce((total, ingredient) => {
    const food = availableFoods.find((item) => item.id === ingredient.foodId);
    if (!food) return total;
    const n = nutritionFor(food, ingredient.amount);
    return { calories: total.calories + n.calories, protein: total.protein + n.protein, carbs: total.carbs + n.carbs, fat: total.fat + n.fat, fiber: total.fiber + n.fiber };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }), [ingredients, availableFoods]);
  function saveLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ id: crypto.randomUUID(), name: fields.name.trim(), category: "Custom", serving: Number(fields.serving), unit: fields.unit, calories: Number(fields.calories), protein: Number(fields.protein), carbs: Number(fields.carbs), fat: Number(fields.fat), fiber: Number(fields.fiber || 0), source: "estimate" });
  }
  function saveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const servingCount = Number(portions);
    if (!ingredients.length || !Number.isFinite(servingCount) || servingCount <= 0) {
      setError("Add at least one ingredient and a valid portion count.");
      return;
    }
    onSave({
      id: crypto.randomUUID(), name: recipeName.trim(), category: "Homemade recipe", serving: 1, unit: "piece",
      calories: recipeTotals.calories / servingCount, protein: recipeTotals.protein / servingCount,
      carbs: recipeTotals.carbs / servingCount, fat: recipeTotals.fat / servingCount,
      fiber: recipeTotals.fiber / servingCount, source: "estimate",
      recipeIngredients: ingredients, recipeServings: servingCount,
    });
  }
  return <section className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
    <div className="mb-3 flex gap-2"><button type="button" onClick={() => setMode("recipe")} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${mode === "recipe" ? "bg-amber-400 text-neutral-950" : "bg-neutral-800 text-neutral-300"}`}>Build recipe</button><button type="button" onClick={() => setMode("label")} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${mode === "label" ? "bg-amber-400 text-neutral-950" : "bg-neutral-800 text-neutral-300"}`}>Enter label values</button></div>
    {mode === "recipe" ? <form className="grid gap-2 sm:grid-cols-3" onSubmit={saveRecipe}>
      <input className={`${inputClass} sm:col-span-2`} placeholder="Recipe name" aria-label="Recipe name" value={recipeName} onChange={(event) => setRecipeName(event.target.value)} required />
      <input className={inputClass} type="number" min="1" step="1" aria-label="Number of recipe portions" placeholder="Portions in batch" value={portions} onChange={(event) => setPortions(event.target.value)} required />
      <select className={`${inputClass} sm:col-span-2`} aria-label="Recipe ingredient" value={ingredientId} onChange={(event) => setIngredientId(event.target.value)}>{availableFoods.map((food) => <option key={food.id} value={food.id}>{food.name} · per {food.serving} {food.unit}</option>)}</select>
      <div className="flex gap-2"><input className={`${inputClass} min-w-0 flex-1`} type="number" min="0.1" step="0.1" aria-label="Ingredient quantity" value={ingredientAmount} onChange={(event) => setIngredientAmount(event.target.value)} /><button type="button" onClick={() => { if (Number(ingredientAmount) <= 0) return; setIngredients([...ingredients, { foodId: ingredientId, amount: Number(ingredientAmount) }]); }} className="min-h-11 rounded-xl border border-neutral-700 px-3 text-xs font-bold">Add ingredient</button></div>
      {ingredients.length > 0 && <div className="space-y-1 sm:col-span-3">{ingredients.map((item, index) => <div key={`${item.foodId}-${index}`} className="flex justify-between text-xs text-neutral-400"><span>{availableFoods.find((food) => food.id === item.foodId)?.name} · {item.amount} {availableFoods.find((food) => food.id === item.foodId)?.unit}</span><button type="button" onClick={() => setIngredients(ingredients.filter((_, itemIndex) => itemIndex !== index))} className="text-red-300">Remove</button></div>)}
        <p className="pt-2 text-xs text-amber-200">Per portion estimate: {Math.round(recipeTotals.calories / Math.max(1, Number(portions)))} kcal · P {(recipeTotals.protein / Math.max(1, Number(portions))).toFixed(1)}g · C {(recipeTotals.carbs / Math.max(1, Number(portions))).toFixed(1)}g · F {(recipeTotals.fat / Math.max(1, Number(portions))).toFixed(1)}g</p>
      </div>}
      <button className="min-h-11 rounded-xl bg-amber-400 text-sm font-extrabold text-neutral-950 sm:col-span-3">Save recipe & log it</button>
      {error && <p role="alert" className="text-xs text-red-300 sm:col-span-3">{error}</p>}
      <p className="text-[11px] leading-5 text-neutral-500 sm:col-span-3">Uses the ingredient database’s approximate values and divides the batch total by portions. Added oil, recipe changes, and cooked weights affect accuracy.</p>
    </form> : <form className="grid grid-cols-2 gap-2 sm:grid-cols-4" onSubmit={saveLabel}>
      <input className={`${inputClass} col-span-2`} placeholder="Food name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} required />
      {(["serving", "calories", "protein", "carbs", "fat", "fiber"] as const).map((key) => <input key={key} className={inputClass} type="number" min={key === "serving" ? "0.1" : "0"} step="0.1" placeholder={key} value={fields[key]} onChange={(event) => setFields({ ...fields, [key]: event.target.value })} required={key !== "fiber"} />)}
      <select className={inputClass} value={fields.unit} onChange={(event) => setFields({ ...fields, unit: event.target.value as FoodItem["unit"] })}><option value="g">grams</option><option value="ml">ml</option><option value="piece">pieces</option></select>
      <button className="min-h-11 rounded-xl bg-amber-400 text-sm font-extrabold text-neutral-950">Use food</button>
      <p className="col-span-full text-[11px] text-neutral-500">Enter per-serving values from a product label or an estimate. Saved custom foods remain available in this browser.</p>
    </form>}
  </section>;
}
