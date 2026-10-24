export default function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-stone-900">
        {title}
      </h1>
      <p className="mt-1.5 text-sm leading-5 text-stone-500">{description}</p>
    </header>
  );
}
