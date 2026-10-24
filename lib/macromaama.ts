"use client";

import foodRows from "@/data/indian-foods.json";

export type MealSlot = "Breakfast" | "Mid-morning" | "Lunch" | "Evening snack" | "Pre-workout" | "Post-workout" | "Dinner" | "Other";
export interface FoodItem {
  id: string;
  name: string;
  category: string;
  serving: number;
  unit: "g" | "ml" | "piece";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source: "estimate";
  cooked?: boolean;
  recipeIngredients?: { foodId: string; amount: number }[];
  recipeServings?: number;
}
export interface Entry extends FoodItem {
  entryId: string;
  date: string;
  slot: MealSlot;
  amount: number;
}
export interface WeightEntry { id: string; date: string; kg: number; note: string; waist?: number; chest?: number; arms?: number; thighs?: number }
export interface WorkoutSet { id: string; exercise: string; reps: number; weightKg: number }
export interface WorkoutEntry { id: string; date: string; title: string; duration: number; sets: WorkoutSet[]; effort: number; note: string; sleepHours?: number }
export interface WaterEntry { id: string; date: string; ml: number }
export interface GroceryItem { id: string; name: string; category: string; quantity: string; cost: number; checked: boolean }
export interface PlannerMeal { id: string; slot: MealSlot; time: string; foods: { foodId: string; amount: number }[] }
export interface PlannerDay { id: string; date: string; meals: PlannerMeal[] }
export interface UserProfile {
  age: number; height: number; weight: number; weightGoal: number; gender: string; activity: string;
  trainingExperience: string; diet: string; allergies: string; dislikes: string; budget: number;
  gymTime: string; schedule: string; equipment: string; location: string; objective: string; reviewDate: string; targetCalories: number | null;
  targetProtein: number | null; targetCarbs: number | null; targetFat: number | null;
}
export interface Store {
  profile: UserProfile;
  entries: Entry[];
  weights: WeightEntry[];
  workouts: WorkoutEntry[];
  water: WaterEntry[];
  groceries: GroceryItem[];
  plans: PlannerDay[];
  customFoods: FoodItem[];
  favoriteFoods: string[];
}

const profileDefaults: UserProfile = {
  age: 17, height: 180, weight: 63, weightGoal: 80, gender: "Prefer not to say",
  activity: "", trainingExperience: "", diet: "", allergies: "", dislikes: "", budget: 0,
  gymTime: "8:30 PM–10:00 PM", schedule: "", equipment: "", location: "Tamil Nadu, India", objective: "Build strength, support healthy development, and improve nutrition consistency. Reassess body composition with a qualified professional before considering future changes.", reviewDate: "",
  targetCalories: null, targetProtein: null, targetCarbs: null, targetFat: null,
};
const STORAGE_KEY = "macromaama:store:v1";
const LEGACY_STORAGE_KEY = "ironcore:store:v1";

export function blankStore(): Store {
  return { profile: profileDefaults, entries: [], weights: [], workouts: [], water: [], groceries: [], plans: [], customFoods: [], favoriteFoods: [] };
}

export function readStore(): Store {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) localStorage.setItem(STORAGE_KEY, raw);
  }
  if (!raw) return blankStore();
  const saved = JSON.parse(raw) as Partial<Store>;
  return { ...blankStore(), ...saved, profile: { ...profileDefaults, ...saved.profile } };
}

export function writeStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("macromaama:change"));
}

export function today(): string {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export const foods = foodRows as FoodItem[];
export function isFoodExcluded(name: string, avoidanceText: string): boolean {
  const normalizedName = name.toLowerCase();
  const terms = avoidanceText.toLowerCase().split(/[,;|\n]/).map((term) => term.trim()).filter(Boolean);
  const aliases: Record<string, string[]> = {
    dairy: ["milk", "curd", "paneer"],
    milk: ["milk", "curd", "paneer"],
    peanut: ["peanut"],
    groundnut: ["peanut"],
    nut: ["almond", "peanut"],
    nuts: ["almond", "peanut"],
    gluten: ["wheat", "chapati", "bread"],
    wheat: ["wheat", "chapati", "bread"],
    seafood: ["fish"],
    fish: ["fish"],
    egg: ["egg"],
    soy: ["soy"],
  };
  return terms.some((term) => (aliases[term] ?? [term]).some((blocked) => normalizedName.includes(blocked)));
}
export function nutritionFor(food: FoodItem, amount: number) {
  const multiplier = amount / food.serving;
  return {
    calories: food.calories * multiplier, protein: food.protein * multiplier,
    carbs: food.carbs * multiplier, fat: food.fat * multiplier,
    fiber: (food.fiber ?? 0) * multiplier,
  };
}

export function addFoodEntry(store: Store, food: FoodItem, amount: number, slot: MealSlot): Store {
  const entry: Entry = { ...food, entryId: crypto.randomUUID(), date: today(), slot, amount };
  return { ...store, entries: [entry, ...store.entries] };
}

export function totalsFor(entries: Entry[]) {
  return entries.reduce((total, entry) => {
    const values = nutritionFor(entry, entry.amount);
    return {
      calories: total.calories + values.calories, protein: total.protein + values.protein,
      carbs: total.carbs + values.carbs, fat: total.fat + values.fat, fiber: total.fiber + values.fiber,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
}
