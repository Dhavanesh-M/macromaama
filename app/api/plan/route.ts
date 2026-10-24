import { generatePlanFallback } from "@/lib/meals";
import type { DayPlan, MacroTargets, Meal, MealType } from "@/lib/types";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function isTargets(value: unknown): value is MacroTargets {
  if (!value || typeof value !== "object") return false;
  const target = value as Record<string, unknown>;
  return ["calories", "protein", "fat", "carbs"].every(
    (key) => typeof target[key] === "number" && Number.isFinite(target[key]),
  );
}

function parseMeal(value: unknown, mealType: MealType): Meal | null {
  if (!value || typeof value !== "object") return null;
  const meal = value as Record<string, unknown>;
  if (
    typeof meal.name !== "string" ||
    typeof meal.calories !== "number" ||
    typeof meal.protein !== "number" ||
    typeof meal.fat !== "number" ||
    typeof meal.carbs !== "number" ||
    ![meal.calories, meal.protein, meal.fat, meal.carbs].every(Number.isFinite)
  ) {
    return null;
  }
  return {
    name: meal.name.slice(0, 100),
    mealType,
    calories: meal.calories,
    protein: meal.protein,
    fat: meal.fat,
    carbs: meal.carbs,
    tags: Array.isArray(meal.tags)
      ? meal.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 8)
      : ["AI generated"],
  };
}

function normalizePlan(value: unknown): DayPlan | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const parsed = Object.fromEntries(
    mealTypes.map((type) => [type, parseMeal(candidate[type], type)]),
  ) as Record<MealType, Meal | null>;
  if (mealTypes.some((type) => !parsed[type])) return null;
  const chosen = mealTypes.map((type) => parsed[type] as Meal);
  const total = chosen.reduce<MacroTargets>(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      fat: sum.fat + meal.fat,
      carbs: sum.carbs + meal.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
  return {
    breakfast: parsed.breakfast as Meal,
    lunch: parsed.lunch as Meal,
    dinner: parsed.dinner as Meal,
    snack: parsed.snack as Meal,
    total,
  };
}

async function generateWithGroq(targets: MacroTargets): Promise<DayPlan | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.6,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'Return only a JSON object with breakfast, lunch, dinner, and snack. Each is {name, calories, protein, fat, carbs, tags}. Macros are grams; calories are kcal.',
            },
            {
              role: "user",
              content: `Create one balanced day of meals near these daily targets: ${JSON.stringify(targets)}.`,
            },
          ],
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!response.ok) {
      console.warn(`Groq meal generation returned HTTP ${response.status}; using local meals.`);
      return null;
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return null;
    const choices = (result as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") {
      return null;
    }
    const message = (choices[0] as { message?: unknown }).message;
    if (!message || typeof message !== "object") return null;
    const content = (message as { content?: unknown }).content;
    if (typeof content !== "string") return null;
    const plan = normalizePlan(JSON.parse(content) as unknown);
    if (!plan) console.warn("Groq returned an invalid meal plan; using local meals.");
    return plan;
  } catch (error) {
    console.warn("Groq meal generation failed; using local meals.", error);
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !isTargets((body as { targets?: unknown }).targets)) {
    return Response.json({ error: "Valid macro targets are required." }, { status: 400 });
  }
  const targets = (body as { targets: MacroTargets }).targets;
  if (targets.calories <= 0 || Object.values(targets).some((value) => value < 0)) {
    return Response.json({ error: "Targets must be positive." }, { status: 400 });
  }
  const plan =
    (await generateWithGroq(targets)) ?? generatePlanFallback(targets);
  return Response.json(plan);
}
