"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { readStore, writeStore, type GroceryItem, type Store } from "@/lib/macromaama";

const input = "min-h-11 rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm outline-none focus:border-amber-400";
const affordable = ["Eggs", "Dal", "Chickpeas", "Soy chunks", "Peanuts", "Curd", "Seasonal vegetables"];

export default function GroceryPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: "", category: "Produce", quantity: "", cost: "0" });
  const [notice, setNotice] = useState("");
  useEffect(() => { Promise.resolve().then(() => { try { setStore(readStore()); } catch { setNotice("Could not load your list."); } }); }, []);
  function update(groceries: GroceryItem[]) {
    if (!store) return;
    const next = { ...store, groceries };
    setStore(next); writeStore(next);
  }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store || !form.name.trim()) return;
    update([{ id: crypto.randomUUID(), name: form.name.trim(), category: form.category, quantity: form.quantity || "As needed", cost: Math.max(0, Number(form.cost) || 0), checked: false }, ...store.groceries]);
    setForm({ name: "", category: "Produce", quantity: "", cost: "0" });
    setNotice("Item added.");
  }
  const items = store?.groceries ?? [];
  const cost = items.reduce((sum, item) => sum + item.cost, 0);
  const groups = [...new Set(items.map((item) => item.category))];

  return <div>
    <PageTitle eyebrow="Grocery & budget manager" title="A list that fits your kitchen." description="Build a list from your saved plan or add your own items. Prices start blank/zero because local shop prices are estimates you control." />
    <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-5 text-amber-100/80">All prices are your own estimates in Indian rupees (₹), not live or verified market prices. Edit them for your local shop. Duplicate planned ingredients are consolidated where possible.</div>
    <form onSubmit={add} className="grid gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:grid-cols-5">
      <input className={`${input} sm:col-span-2`} placeholder="Item name" aria-label="Grocery item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      <select className={input} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{["Produce", "Protein", "Grains", "Dairy", "Pantry", "Other"].map((category) => <option key={category}>{category}</option>)}</select>
      <input className={input} placeholder="Quantity" aria-label="Quantity" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
      <div className="flex gap-2"><input className={`${input} min-w-0 flex-1`} type="number" min="0" step="1" aria-label="Estimated price in rupees" placeholder="₹ estimate" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} /><button className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-neutral-950" aria-label="Add grocery"><Plus size={18} /></button></div>
    </form>
    <section className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
      <div className="flex items-end justify-between"><div><p className="text-xs text-neutral-500">{items.filter((item) => item.checked).length} of {items.length} purchased</p><h2 className="mt-1 text-lg font-extrabold">Shopping list</h2></div><p className="text-right text-sm font-bold">Est. ₹{cost.toLocaleString("en-IN")}<span className="block text-[10px] font-normal text-neutral-500">editable estimates</span></p></div>
      {items.length ? <div className="mt-4 space-y-5">{groups.map((category) => <div key={category}><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300">{category}</h3><div className="space-y-2">{items.filter((item) => item.category === category).map((item) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-neutral-800/70 p-3"><input aria-label={`Mark ${item.name} as purchased`} type="checkbox" checked={item.checked} onChange={(event) => update(items.map((row) => row.id === item.id ? { ...row, checked: event.target.checked } : row))} className="size-5 accent-amber-400" /><span className={`min-w-[100px] flex-1 text-sm font-semibold ${item.checked ? "text-neutral-500 line-through" : "text-neutral-100"}`}>{item.name}</span><input aria-label={`${item.name} quantity`} className={`${input} w-28`} value={item.quantity} onChange={(event) => update(items.map((row) => row.id === item.id ? { ...row, quantity: event.target.value } : row))} /><label className="flex items-center gap-1 text-xs text-neutral-500">₹<input aria-label={`${item.name} estimated cost`} className={`${input} w-20`} type="number" min="0" step="1" value={item.cost} onChange={(event) => update(items.map((row) => row.id === item.id ? { ...row, cost: Math.max(0, Number(event.target.value) || 0) } : row))} /></label><button onClick={() => update(items.filter((row) => row.id !== item.id))} aria-label={`Delete ${item.name}`} className="grid size-10 place-items-center rounded-lg text-neutral-500 hover:bg-red-950 hover:text-red-300"><Trash2 size={15} /></button></div>)}</div></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-neutral-700 p-6 text-sm text-neutral-500">Your list is empty. Add an item above or build it from your saved meal plan.</p>}
    </section>
    <section className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-4"><h2 className="font-extrabold">Affordable staples to consider</h2><p className="mt-1 text-xs text-neutral-500">Availability and prices vary by season and location; choose what suits your household.</p><div className="mt-3 flex flex-wrap gap-2">{affordable.map((item) => <button key={item} onClick={() => { setForm({ name: item, category: "Pantry", quantity: "", cost: "0" }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="min-h-10 rounded-full bg-neutral-800 px-3 text-xs font-bold text-neutral-300 hover:bg-neutral-700">{item}</button>)}</div></section>
    {notice && <p role="status" className="mt-4 text-sm text-amber-300">{notice}</p>}
  </div>;
}
