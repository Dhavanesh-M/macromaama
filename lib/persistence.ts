"use client";

import { getSupabaseClient } from "@/lib/supabase";
import type { FoodLog, MacroTargets, SavedPlan, UserProfile } from "@/lib/types";

const PROFILE_ID = "local-user";
const LOGS_KEY = "macromaama:logs";
const PLANS_KEY = "macromaama:plans";
const PROFILE_KEY = "macromaama:profile";

function readLocal<T>(key: string): T[] {
  const value = localStorage.getItem(key);
  return value ? (JSON.parse(value) as T[]) : [];
}

function writeLocal<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export async function getFoodLogs(date = getToday()): Promise<FoodLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("profile_id", PROFILE_ID)
      .eq("date", date)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }
  return readLocal<FoodLog>(LOGS_KEY).filter((log) => log.date === date);
}

export async function getLogsForRange(
  startDate: string,
  endDate: string,
): Promise<FoodLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("profile_id", PROFILE_ID)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });
    if (error) throw error;
    return data;
  }
  return readLocal<FoodLog>(LOGS_KEY).filter(
    (log) => log.date >= startDate && log.date <= endDate,
  );
}

export async function addFoodLog(
  input: Omit<FoodLog, "id" | "profile_id" | "date" | "created_at">,
): Promise<FoodLog> {
  const supabase = getSupabaseClient();
  const row = {
    ...input,
    profile_id: PROFILE_ID,
    date: getToday(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("food_logs")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
  const log: FoodLog = {
    ...row,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  writeLocal(LOGS_KEY, [log, ...readLocal<FoodLog>(LOGS_KEY)]);
  return log;
}

export async function deleteFoodLog(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("food_logs")
      .delete()
      .eq("id", id)
      .eq("profile_id", PROFILE_ID);
    if (error) throw error;
    return;
  }
  writeLocal(
    LOGS_KEY,
    readLocal<FoodLog>(LOGS_KEY).filter((log) => log.id !== id),
  );
}

export async function getPlans(): Promise<SavedPlan[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("profile_id", PROFILE_ID)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data.map((row) => ({
      ...(row.meals as Omit<SavedPlan, "id" | "date" | "created_at">),
      id: row.id,
      date: row.date,
      created_at: row.created_at,
    }));
  }
  return readLocal<SavedPlan>(PLANS_KEY).slice(0, 20);
}

export async function savePlan(
  plan: Omit<SavedPlan, "id" | "date" | "created_at">,
): Promise<SavedPlan> {
  const supabase = getSupabaseClient();
  const date = getToday();
  const createdAt = new Date().toISOString();
  if (supabase) {
    const { data, error } = await supabase
      .from("plans")
      .insert({
        profile_id: PROFILE_ID,
        date,
        meals: plan,
        total_calories: plan.total.calories,
        total_protein: plan.total.protein,
        total_fat: plan.total.fat,
        total_carbs: plan.total.carbs,
      })
      .select("*")
      .single();
    if (error) throw error;
    return {
      ...plan,
      id: data.id,
      date: data.date,
      created_at: data.created_at,
    };
  }
  const saved: SavedPlan = {
    ...plan,
    id: crypto.randomUUID(),
    date,
    created_at: createdAt,
  };
  writeLocal(PLANS_KEY, [saved, ...readLocal<SavedPlan>(PLANS_KEY)]);
  return saved;
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", PROFILE_ID)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  const value = localStorage.getItem(PROFILE_KEY);
  return value ? (JSON.parse(value) as UserProfile) : null;
}

export async function saveProfile(
  profile: Omit<UserProfile, "id" | "updated_at">,
): Promise<UserProfile> {
  const userProfile: UserProfile = {
    ...profile,
    id: PROFILE_ID,
    updated_at: new Date().toISOString(),
  };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(userProfile)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
  return userProfile;
}

export function sumMacros(logs: FoodLog[]): MacroTargets {
  return logs.reduce<MacroTargets>(
    (sum, log) => ({
      calories: sum.calories + log.calories,
      protein: sum.protein + log.protein,
      fat: sum.fat + log.fat,
      carbs: sum.carbs + log.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}
