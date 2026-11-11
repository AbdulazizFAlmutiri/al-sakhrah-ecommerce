export function FormMessage({ kind, children }: { kind: "error" | "success"; children?: React.ReactNode }) {
  if (!children) return null;
  const cls = kind === "error" ? "bg-bad-50 text-bad-600" : "bg-ok-50 text-ok-600";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`px-3 py-2 text-sm font-semibold ${cls}`}>
      {children}
    </p>
  );
}
