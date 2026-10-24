import { Flame, Leaf, Utensils } from "lucide-react";
import type { Meal } from "@/lib/types";

const mealLabels: Record<Meal["mealType"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            {mealLabels[meal.mealType]}
          </p>
          <h3 className="mt-1 text-sm font-bold leading-5 text-stone-800">{meal.name}</h3>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">
          <Flame size={13} />
          {Math.round(meal.calories)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
        <span className="flex items-center gap-1"><Utensils size={12} /> P {Math.round(meal.protein)}g</span>
        <span>F {Math.round(meal.fat)}g</span>
        <span>C {Math.round(meal.carbs)}g</span>
        {meal.tags[0] && <span className="ml-auto flex items-center gap-1 text-emerald-700"><Leaf size={12} />{meal.tags[0]}</span>}
      </div>
    </article>
  );
}
