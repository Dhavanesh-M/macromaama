import { scoreDay } from "@/lib/calculations";
import type { MacroTargets } from "@/lib/types";

function isMacros(value: unknown): value is MacroTargets {
  if (!value || typeof value !== "object") return false;
  const macros = value as Record<string, unknown>;
  return ["calories", "protein", "fat", "carbs"].every(
    (key) =>
      typeof macros[key] === "number" &&
      Number.isFinite(macros[key]) &&
      (macros[key] as number) >= 0,
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Consumed macros and targets are required." }, { status: 400 });
  }
  const input = body as { consumed?: unknown; targets?: unknown };
  if (!isMacros(input.consumed) || !isMacros(input.targets) || input.targets.calories <= 0) {
    return Response.json({ error: "Valid consumed macros and targets are required." }, { status: 400 });
  }
  const consumed = input.consumed;
  const targets = input.targets;
  const remaining = {
    calories: Math.max(0, targets.calories - consumed.calories),
    protein: Math.max(0, targets.protein - consumed.protein),
    fat: Math.max(0, targets.fat - consumed.fat),
    carbs: Math.max(0, targets.carbs - consumed.carbs),
  };
  const score = scoreDay(consumed, targets);
  return Response.json({
    remaining,
    status: score >= 80 ? "on-track" : score >= 55 ? "getting-there" : "needs-attention",
    score,
  });
}
