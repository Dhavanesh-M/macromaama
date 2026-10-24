import indianFoods from "@/data/indian-foods.json";
import type { Entry } from "@/lib/macromaama";

interface Context {
  logs?: Pick<Entry, "name" | "amount" | "unit" | "calories" | "protein" | "carbs" | "fat" | "fiber" | "serving" | "date" | "slot">[];
  foods?: string[];
  groceries?: string[];
  diet?: string;
  allergies?: string;
  gymTime?: string;
  today?: string;
}
type SafeLog = NonNullable<Context["logs"]>[number];

function safeContext(value: unknown): Context | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const logs = Array.isArray(input.logs) ? input.logs.slice(0, 100).filter((row): row is SafeLog =>
    Boolean(row && typeof row === "object" && typeof (row as Record<string, unknown>).name === "string" && typeof (row as Record<string, unknown>).amount === "number" && typeof (row as Record<string, unknown>).calories === "number"),
  ) : [];
  return {
    logs,
    foods: Array.isArray(input.foods) ? input.foods.filter((item): item is string => typeof item === "string").slice(0, 50) : [],
    groceries: Array.isArray(input.groceries) ? input.groceries.filter((item): item is string => typeof item === "string").slice(0, 100) : [],
    diet: typeof input.diet === "string" ? input.diet.slice(0, 120) : "",
    allergies: typeof input.allergies === "string" ? input.allergies.slice(0, 300) : "",
    gymTime: typeof input.gymTime === "string" ? input.gymTime.slice(0, 80) : "",
    today: typeof input.today === "string" ? input.today.slice(0, 10) : undefined,
  };
}

function ruleReply(message: string, context: Context): string {
  const lower = message.toLowerCase();
  const date = context.today ?? new Date().toISOString().slice(0, 10);
  const logs = (context.logs ?? []).filter((entry) => entry.date === date);
  const totals = logs.reduce((sum, entry) => {
    const factor = entry.amount / entry.serving;
    return { calories: sum.calories + entry.calories * factor, protein: sum.protein + entry.protein * factor, carbs: sum.carbs + entry.carbs * factor, fat: sum.fat + entry.fat * factor, fiber: sum.fiber + (entry.fiber ?? 0) * factor };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  if (/diagnos|treat|symptom|medical|injur|prescri|medication|allerg|intoleran/i.test(lower)) {
    return "I can’t screen foods for allergies or intolerances, or diagnose/treat health concerns. Check ingredient labels directly and talk with a parent/guardian and qualified healthcare professional.";
  }
  if (/log|today|protein|calorie|macro|fiber|fibre|how much/i.test(lower)) {
    if (!logs.length) return "There are no food entries recorded for today, so I don’t have logged nutrition totals to report. Add foods in Food & Meals and I can summarize the recorded estimates.";
    return `From the ${logs.length} food entries actually logged today (all nutrition values are estimates): ${Math.round(totals.calories)} kcal, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, and ${Math.round(totals.fiber)}g fibre. This is only as complete as the foods and portions entered.`;
  }
  if (/shop|grocery|list/i.test(lower)) {
    return context.groceries?.length ? `Your saved grocery list contains: ${context.groceries.join(", ")}. These are your saved items, not a verified shopping recommendation.` : "Your saved grocery list is empty. Save a flexible meal plan or add items in Grocery Planner.";
  }
  if (/eat|dinner|meal|ingredient|affordable|suggest/i.test(lower)) {
    const availableFoods = (indianFoods as { name: string; category: string }[]).filter((food) => context.foods?.includes(food.name));
    const mentioned = availableFoods.filter((food) => lower.includes(food.name.toLowerCase()));
    const diet = context.diet?.toLowerCase() ?? "";
    const vegetarian = diet === "vegetarian";
    const vegan = diet === "vegan";
    const eggBased = diet === "egg-based";
    const exclusions = (context.allergies ?? "").toLowerCase().split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
    const suggestions = (mentioned.length ? mentioned : availableFoods).filter(({ name }) => {
      const n = name.toLowerCase();
      if (exclusions.some((item) => n.includes(item))) return false;
      if ((vegetarian || vegan || eggBased) && /chicken|fish/i.test(n)) return false;
      if ((vegetarian || vegan) && /egg/i.test(n)) return false;
      if (vegan && /milk|curd|paneer/i.test(n)) return false;
      return true;
    }).map(({ name }) => name).slice(0, 5);
    return suggestions.length
      ? `From the available starter foods${context.gymTime ? ` (your saved gym time is ${context.gymTime})` : ""}, you could consider ${suggestions.join(", ")}. These are idea prompts—not a meal prescription. Review recipe, serving, and ingredients yourself; the database values are estimates.`
      : "I don’t have enough available-food or preference data to make a grounded suggestion. Update your profile preferences and browse the local food database. Check all ingredients yourself, especially for allergies.";
  }
  return "I’m in local demo mode. I can summarize today’s recorded meals, list saved groceries, or suggest familiar foods from the starter database. I won’t invent missing logs or provide medical advice.";
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a valid JSON request." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "A message is required." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const message = typeof input.message === "string" ? input.message.trim().slice(0, 1000) : "";
  const context = safeContext(input.context);
  if (!message || !context) return Response.json({ error: "A message and valid context are required." }, { status: 400 });
  const fallback = ruleReply(message, context);
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ answer: fallback, mode: "local-demo" });
  if (/log|today|protein|calorie|macro|fiber|fibre|how much|shop|grocery|shopping list/i.test(message)) {
    return Response.json({ answer: fallback, mode: "local-data" });
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        messages: [
          { role: "system", content: "You are a cautious nutrition education assistant for a 17-year-old. Answer only from the provided saved records and starter food names. Never invent logged data, treat estimates as verified, prescribe calories/macros/supplements, encourage weight cutting/bulking, or give diagnosis. For health concerns redirect to a parent/guardian and qualified professional. Make clear suggestions are not prescriptions." },
          { role: "user", content: JSON.stringify({ question: message, savedContext: context, verifiedFoodData: false }) },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`Groq assistant returned HTTP ${response.status}; using local answer.`);
      return Response.json({ answer: fallback, mode: "local-demo" });
    }
    const result = await response.json() as { choices?: { message?: { content?: string } }[] };
    const answer = result.choices?.[0]?.message?.content?.trim();
    return Response.json({ answer: answer || fallback, mode: "ai-assisted", disclaimer: "AI suggestions may be inaccurate. Food values are estimates; not medical advice." });
  } catch (error) {
    console.warn("Groq assistant request failed; using local answer.", error);
    return Response.json({ answer: fallback, mode: "local-demo" });
  }
}
