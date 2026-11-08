import { RootShell, buildMetadata } from "@/components/RootShell";

// English site at "/en".
export const metadata = buildMetadata("en");
export { viewport } from "@/components/RootShell";

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
