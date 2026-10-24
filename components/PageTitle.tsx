export default function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">{description}</p></header>;
}
