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
    <section className={`border-t-4 border-royal-600 bg-white p-5 shadow-sm ${className}`}>
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
