export function Card({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-mist-200/60 ${className}`}>
      {(title || eyebrow) && (
        <header className="mb-4 flex items-baseline justify-between gap-4">
          {title && <h2 className="text-lg font-bold text-navy-700">{title}</h2>}
          {eyebrow && <span className="eyebrow text-royal-600">{eyebrow}</span>}
        </header>
      )}
      {children}
    </section>
  );
}
