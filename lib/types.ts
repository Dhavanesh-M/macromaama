export type Gender = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active";
export type Goal = "lose" | "maintain" | "gain";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Meal extends MacroTargets {
  name: string;
  mealType: MealType;
  tags: string[];
}

export interface DayPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack: Meal;
  total: MacroTargets;
}

export interface FoodLog extends MacroTargets {
  id: string;
  profile_id: string;
  date: string;
  food_name: string;
  grams: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  activity: Activity;
  goal: Goal;
  updated_at: string;
}

export interface SavedPlan extends DayPlan {
  id: string;
  date: string;
  created_at: string;
}
