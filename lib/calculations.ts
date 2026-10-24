import type { Activity, Goal, MacroTargets } from "./types";

const activityMultipliers: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
): number {
  const offset = gender === "male" ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + offset;
}

export function calculateTdee(bmr: number, activity: Activity): number {
  return bmr * activityMultipliers[activity];
}

export function calculateTargets(tdee: number, goal: Goal): MacroTargets {
  const adjustment: Record<Goal, number> = {
    lose: -500,
    maintain: 0,
    gain: 300,
  };
  return calculateMacros(tdee + adjustment[goal]);
}

export function calculateMacros(calories: number): MacroTargets {
  const protein = (calories * 0.3) / 4;
  const fat = (calories * 0.25) / 9;
  return {
    calories,
    protein,
    fat,
    carbs: Math.max(0, (calories - protein * 4 - fat * 9) / 4),
  };
}

function macroDistance(
  consumed: MacroTargets,
  targets: MacroTargets,
): number {
  const metrics: (keyof MacroTargets)[] = ["calories", "protein", "fat", "carbs"];
  return (
    metrics.reduce((sum, key) => {
      const target = targets[key];
      return sum + Math.abs(consumed[key] - target) / Math.max(target, 1);
    }, 0) / metrics.length
  );
}

export function scoreMeal(meal: MacroTargets, targets: MacroTargets): number {
  return Math.round(Math.max(0, Math.min(100, 100 * (1 - macroDistance(meal, targets)))));
}

export function scoreDay(consumed: MacroTargets, targets: MacroTargets): number {
  return scoreMeal(consumed, targets);
}
