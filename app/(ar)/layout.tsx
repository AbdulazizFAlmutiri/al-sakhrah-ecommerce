import { RootShell, buildMetadata } from "@/components/RootShell";

// Arabic site at "/" (default).
export const metadata = buildMetadata("ar");
export { viewport } from "@/components/RootShell";

export default function ArabicLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="ar">{children}</RootShell>;
}
