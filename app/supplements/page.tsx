import { ShieldCheck } from "lucide-react";
import PageTitle from "@/components/PageTitle";

const guides = [
  { title: "Food first", text: "Regular meals, varied foods, enough overall nourishment, and supportive recovery are the foundation. Supplements are not a substitute for food, sleep, or a good training plan." },
  { title: "Whey protein", text: "A convenient milk-derived food supplement for some people, not a requirement. Check milk allergy/intolerance, ingredients, and whether it fits your household's preferences. A food-first protein source can work just as well." },
  { title: "Creatine monohydrate", text: "Research exists in adults, but suitability for a 17-year-old needs discussion with a parent/guardian and qualified healthcare professional. This app does not recommend a dose or tell you to start it." },
  { title: "Vitamin D & other nutrients", text: "Consider testing and supplements only when indicated by an appropriate clinician. Avoid self-diagnosing deficiencies or taking high-dose products without guidance." },
  { title: "Product quality", text: "Read the full label, allergen statement, serving information, and batch details. Prefer independently third-party tested products where available. Supplements can interact with medicines or health conditions." },
];

export default function SupplementsPage() {
  return <div>
    <PageTitle eyebrow="Education, not prescriptions" title="Supplements, thoughtfully." description="Evidence-informed basics to discuss with a trusted adult and qualified health professional. Nothing here is a personal recommendation." />
    <div className="mb-5 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={18} /><p className="text-xs leading-5 text-amber-100/80">Because the profile is 17, this guide does not suggest doses, products, or starting supplements. Check allergies, medical conditions, medications, and product quality with a clinician and parent/guardian first.</p></div>
    <div className="space-y-3">{guides.map((item, index) => <article key={item.title} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-400">0{index + 1} · Guide</p><h2 className="mt-2 text-lg font-extrabold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-neutral-400">{item.text}</p></article>)}</div>
    <p className="mt-5 text-xs leading-5 text-neutral-600">Avoid hormone products, anabolic steroids, fat burners, and unverified performance products. Seek professional advice for medical nutrition questions.</p>
  </div>;
}
