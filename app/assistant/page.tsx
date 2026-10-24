"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Bot, Send, UserRound } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { foods, readStore, today, type Store } from "@/lib/macromaama";

interface Message { role: "user" | "assistant"; text: string; mode?: string }
const prompts = ["How much protein have I logged today?", "What can I make with eggs, rice, and curd?", "Suggest an affordable vegetarian dinner.", "Make a shopping list from my saved plan."];

export default function AssistantPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { Promise.resolve().then(() => { try { setStore(readStore()); } catch { setError("Could not load saved context."); } }); }, []);

  async function send(event?: FormEvent, suggested?: string) {
    event?.preventDefault();
    if (!store) return;
    const question = (suggested ?? message).trim();
    if (!question || busy) return;
    setError("");
    setMessage("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setBusy(true);
    const context = {
      today: today(),
      logs: store.entries.slice(0, 100),
      foods: foods.map((food) => food.name),
      groceries: store.groceries.map((item) => item.name),
      diet: store.profile.diet,
      allergies: store.profile.allergies,
      gymTime: store.profile.gymTime,
    };
    try {
      const response = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, context }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object" || typeof (result as { answer?: unknown }).answer !== "string") {
        const messageText = result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : "The assistant could not answer right now.";
        throw new Error(messageText);
      }
      const data = result as { answer: string; mode: string };
      setMessages((current) => [...current, { role: "assistant", text: data.answer, mode: data.mode }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The assistant could not answer right now.");
    } finally {
      setBusy(false);
    }
  }

  return <div>
    <PageTitle eyebrow="AI nutrition assistant" title="A helpful food-thinking partner." description="Answers can use your saved meal entries, profile preferences, food list, and grocery list. It will say when the data isn’t there." />
    <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-5 text-amber-100/80">Local demo mode works without an API key. If a server-side Groq key is configured, your question and the context shown below are sent to Groq to generate a reply. Food estimates are not verified; never use this for medical advice or allergy screening.</div>
    <div className="min-h-72 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      {!messages.length && <div className="flex gap-3 rounded-xl bg-neutral-800/70 p-4"><Bot className="shrink-0 text-amber-300" size={19} /><p className="text-sm leading-6 text-neutral-300">Ask about foods in the starter list or your actually recorded meals. I won’t fill in missing log data.</p></div>}
      {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`flex gap-3 rounded-xl p-4 ${item.role === "user" ? "ml-6 bg-amber-400/10" : "mr-4 bg-neutral-800/70"}`}>{item.role === "user" ? <UserRound className="shrink-0 text-amber-300" size={18} /> : <Bot className="shrink-0 text-amber-300" size={18} />}<div><p className="whitespace-pre-wrap text-sm leading-6">{item.text}</p>{item.mode && <p className="mt-2 text-[10px] uppercase tracking-wider text-neutral-600">{item.mode === "local-demo" ? "Local demo · grounded in saved data" : "AI-assisted · verify suggestions"}</p>}</div></div>)}
      {busy && <p className="text-sm text-neutral-500">Thinking from the available data…</p>}
    </div>
    {!messages.length && <div className="mt-3 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} onClick={() => send(undefined, prompt)} className="min-h-10 rounded-full bg-neutral-900 px-3 text-xs text-neutral-300 hover:bg-neutral-800">{prompt}</button>)}</div>}
    <form onSubmit={(event) => send(event)} className="mt-3 flex gap-2"><input className="min-h-12 min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-4 text-sm outline-none focus:border-amber-400" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a nutrition question…" aria-label="Message nutrition assistant" /><button disabled={busy} aria-label="Send message" className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-400 text-neutral-950 disabled:opacity-50"><Send size={18} /></button></form>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  </div>;
}
