"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, ShoppingBasket, Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { foods, isFoodExcluded, nutritionFor, readStore, today, writeStore, type MealSlot, type PlannerDay, type PlannerMeal, type Store } from "@/lib/macromaama";

const slots: { slot: MealSlot; time: string; choices: string[][] }[] = [
  { slot: "Breakfast", time: "7:30 AM", choices: [["idli", "dosa", "upma", "pongal", "oats"], ["sambar", "egg", "curd", "milk", "banana"]] },
  { slot: "Mid-morning", time: "10:30 AM", choices: [["banana", "apple", "curd", "milk", "peanuts"]] },
  { slot: "Lunch", time: "1:30 PM", choices: [["rice", "brownrice", "chapati"], ["sambar", "dal", "chickencurry", "fishcurry", "paneer", "vegmeals"]] },
  { slot: "Evening snack", time: "5:30 PM", choices: [["sundal", "banana", "peanuts", "curd", "milk", "chickpeas"]] },
  { slot: "Pre-workout", time: "7:30 PM", choices: [["banana", "bread", "curd", "milk", "oats"]] },
  { slot: "Dinner", time: "10:00 PM", choices: [["rice", "chapati", "brownrice"], ["chickencurry", "fishcurry", "dal", "paneer", "vegmeals", "sambar"]] },
];
const byId = new Map(foods.map((food) => [food.id, food]));

function makePlan(profile: Store["profile"], offset: number): PlannerDay {
  const diet = profile.diet.toLowerCase();
  const vegetarian = diet === "vegetarian";
  const vegan = diet === "vegan";
  const eggBased = diet === "egg-based";
  const avoidance = `${profile.allergies};${profile.dislikes}`;
  const safe = (id: string) => {
    const item = byId.get(id);
    if (!item) return false;
    const name = item.name.toLowerCase();
    if (isFoodExcluded(name, avoidance)) return false;
    if ((vegetarian || vegan || eggBased) && ["chicken", "fish"].some((word) => name.includes(word))) return false;
    if ((vegetarian || vegan) && name.includes("egg")) return false;
    if (vegan && ["milk", "curd", "paneer"].some((word) => name.includes(word))) return false;
    return true;
  };
  const meals = slots.filter((meal) => !(meal.slot === "Pre-workout" && !profile.gymTime)).map((item, index) => {
    const candidates = item.choices.map((group) => group.filter(safe)).filter((group) => group.length > 0);
    return {
      id: crypto.randomUUID(), slot: item.slot, time: item.time,
      foods: candidates.map((pool, i) => {
        const foodId = pool[(offset + index + i) % pool.length];
        return { foodId, amount: byId.get(foodId)?.serving ?? 1 };
      }),
    } satisfies PlannerMeal;
  });
  return { id: crypto.randomUUID(), date: today(), meals };
}

export default function PlannerPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [plan, setPlan] = useState<PlannerDay | null>(null);
  const [saved, setSaved] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => { Promise.resolve().then(() => { try { const current = readStore(); setStore(current); setPlan(current.plans.find((item) => item.date === today()) ?? null); } catch { setNotice("Could not load saved planner data."); } }); }, []);

  const estimate = useMemo(() => {
    if (!plan) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    return plan.meals.flatMap((meal) => meal.foods).reduce((total, selected) => {
      const food = byId.get(selected.foodId);
      if (!food) return total;
      const n = nutritionFor(food, selected.amount);
      return { calories: total.calories + n.calories, protein: total.protein + n.protein, carbs: total.carbs + n.carbs, fat: total.fat + n.fat, fiber: total.fiber + n.fiber };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [plan]);
  const safeFoodOptions = useMemo(() => {
    if (!store) return [];
    const diet = store.profile.diet.toLowerCase();
    const vegetarian = diet === "vegetarian";
    const vegan = diet === "vegan";
    const eggBased = diet === "egg-based";
    const avoidance = `${store.profile.allergies},${store.profile.dislikes}`;
    return foods.filter((food) => {
      const name = food.name.toLowerCase();
      if (isFoodExcluded(name, avoidance)) return false;
      if ((vegetarian || vegan || eggBased) && /chicken|fish/i.test(name)) return false;
      if ((vegetarian || vegan) && /egg/i.test(name)) return false;
      if (vegan && /milk|curd|paneer/i.test(name)) return false;
      return true;
    });
  }, [store]);

  function regenerate() {
    if (!store) return;
    setPlan(makePlan(store.profile, cycle + 1));
    setCycle(cycle + 1);
    setSaved(false);
  }
  function updateMeal(mealId: string, updater: (meal: PlannerMeal) => PlannerMeal) {
    if (!plan) return;
    setPlan({ ...plan, meals: plan.meals.map((meal) => meal.id === mealId ? updater(meal) : meal) });
    setSaved(false);
  }
  function save() {
    if (!store || !plan) return;
    const updated = { ...store, plans: [plan, ...store.plans.filter((item) => item.id !== plan.id && item.date !== plan.date)] };
    setStore(updated);
    writeStore(updated);
    setSaved(true);
    setNotice("Plan saved on this device.");
  }
  function makeGroceries() {
    if (!store || !plan) return;
    const consolidated = new Map<string, number>();
    plan.meals.flatMap((meal) => meal.foods).forEach(({ foodId, amount }) => consolidated.set(foodId, (consolidated.get(foodId) ?? 0) + amount));
    const newItems = [...consolidated].map(([id, amount]) => {
      const food = byId.get(id);
      if (!food) return null;
      return { id: crypto.randomUUID(), name: food.name, category: food.category, quantity: `${amount} ${food.unit}`, cost: 0, checked: false };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
    const existing = new Set(store.groceries.map((item) => item.name.toLowerCase()));
    const updated = { ...store, groceries: [...store.groceries, ...newItems.filter((item) => !existing.has(item.name.toLowerCase()))] };
    setStore(updated);
    writeStore(updated);
    setNotice("Plan foods added to the grocery list. Adjust quantities for your household.");
  }

  if (!store) return <p className="text-sm text-neutral-400">{notice || "Loading planner…"}</p>;
  return <div>
    <PageTitle eyebrow="Personalized diet planner" title="Plan around real life." description="Familiar Tamil and Indian food ideas you can swap. Meal times are suggestions; adjust them to your appetite, family meals, gym, and sleep." />
    <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-5 text-amber-100/80"><strong className="text-amber-300">Estimates, not prescriptions:</strong> This planner does not calculate a calorie deficit or bulk target. If you have allergies, verify every ingredient and recipe yourself; this suggestion tool cannot guarantee allergen safety.</div>
    <div className="mb-4 flex flex-wrap gap-2"><button onClick={regenerate} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-extrabold text-neutral-950 hover:bg-amber-300"><RefreshCw size={16} />Generate day plan</button>{plan && <><button onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-700 px-4 text-sm font-bold hover:bg-neutral-900"><Save size={16} />{saved ? "Saved" : "Save plan"}</button><button onClick={makeGroceries} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-700 px-4 text-sm font-bold hover:bg-neutral-900"><ShoppingBasket size={16} />Make grocery list</button></>}</div>
    {plan ? <>
      <div className="space-y-3">
        {plan.meals.map((meal) => (
          <article key={meal.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">{meal.slot}</p>
                <h2 className="mt-1 font-extrabold">{meal.foods.map((selected) => byId.get(selected.foodId)?.name).filter(Boolean).join(" + ") || "No matching foods yet"}</h2>
              </div>
              <label className="text-xs text-neutral-500">Suggested time
                <input className="ml-2 min-h-10 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-sm text-neutral-100" value={meal.time} onChange={(event) => updateMeal(meal.id, (current) => ({ ...current, time: event.target.value }))} />
              </label>
            </div>
            <div className="mt-4 space-y-2">
              {meal.foods.map((selected, index) => (
                <div key={`${meal.id}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_100px]">
                  <select aria-label={`Swap ${meal.slot} food`} className="min-h-11 rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm" value={selected.foodId} onChange={(event) => updateMeal(meal.id, (current) => ({ ...current, foods: current.foods.map((food, i) => i === index ? { ...food, foodId: event.target.value, amount: byId.get(event.target.value)?.serving ?? 1 } : food) }))}>
                    {safeFoodOptions.map((food) => <option key={food.id} value={food.id}>{food.name} · {food.category}</option>)}
                  </select>
                  <input aria-label={`Serving amount for ${byId.get(selected.foodId)?.name ?? "food"}`} type="number" min="0.1" step="0.1" className="min-h-11 rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm" value={selected.amount} onChange={(event) => updateMeal(meal.id, (current) => ({ ...current, foods: current.foods.map((food, i) => i === index ? { ...food, amount: Number(event.target.value) || 0 } : food) }))} />
                </div>
              ))}
            </div>
            {safeFoodOptions.length > 0 && <button onClick={() => updateMeal(meal.id, (current) => ({ ...current, foods: [...current.foods, { foodId: safeFoodOptions[0].id, amount: safeFoodOptions[0].serving }] }))} className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-amber-300"><Plus size={14} />Add an ingredient</button>}
            {!meal.foods.length && <p className="mt-3 text-xs text-amber-200">No foods matched your current diet and avoidance preferences. Check the profile or add a suitable food manually.</p>}
            {meal.slot === "Dinner" && <p className="mt-2 text-xs text-neutral-500">If a late meal feels too heavy, split dinner and recovery food around your appetite and sleep.</p>}
          </article>
        ))}
      </div>
      <section className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-4"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Estimated plan total · approximate reference only</p><p className="mt-2 text-xl font-black">{Math.round(estimate.calories).toLocaleString()} kcal</p><p className="mt-1 text-sm text-neutral-400">Protein {Math.round(estimate.protein)}g · Carbs {Math.round(estimate.carbs)}g · Fat {Math.round(estimate.fat)}g · Fibre {Math.round(estimate.fiber)}g</p></section>
      {saved && <button onClick={() => { if (!store) return; const updated = { ...store, plans: store.plans.filter((item) => item.id !== plan.id) }; setStore(updated); writeStore(updated); setPlan(null); setSaved(false); }} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs text-neutral-500 hover:text-red-300"><Trash2 size={14} />Remove saved plan</button>}
    </> : <div className="rounded-2xl border border-dashed border-neutral-700 p-8 text-center"><p className="font-bold">Your plan starts with one tap</p><p className="mt-1 text-sm text-neutral-500">Generate a flexible day plan using locally curated food estimates.</p></div>}
    {notice && <p role="status" className="mt-4 text-sm text-amber-300">{notice}</p>}
  </div>;
}
