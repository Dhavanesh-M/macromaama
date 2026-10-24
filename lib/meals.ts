import mealData from "@/data/meals.json";
import { scoreMeal } from "@/lib/calculations";
import type { DayPlan, MacroTargets, Meal, MealType } from "@/lib/types";

const meals = mealData as Meal[];

const portions: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

export function suggestMeals(
  targets: MacroTargets,
  mealType: MealType,
  excludeTags: string[] = [],
): Meal[] {
  const portion = portions[mealType];
  const mealTargets: MacroTargets = {
    calories: targets.calories * portion,
    protein: targets.protein * portion,
    fat: targets.fat * portion,
    carbs: targets.carbs * portion,
  };

  return meals
    .filter(
      (meal) =>
        meal.mealType === mealType &&
        !meal.tags.some((tag) => excludeTags.includes(tag)),
    )
    .map((meal) => ({ meal, score: scoreMeal(meal, mealTargets) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ meal }) => meal);
}

export function generatePlanFallback(targets: MacroTargets): DayPlan {
  const pick = (type: MealType) => {
    const choice = suggestMeals(targets, type)[0];
    if (!choice) throw new Error(`No local meals available for ${type}`);
    return choice;
  };
  const breakfast = pick("breakfast");
  const lunch = pick("lunch");
  const dinner = pick("dinner");
  const snack = pick("snack");
  const selected = [breakfast, lunch, dinner, snack];
  const total = selected.reduce<MacroTargets>(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      fat: sum.fat + meal.fat,
      carbs: sum.carbs + meal.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
  return { breakfast, lunch, dinner, snack, total };
}
