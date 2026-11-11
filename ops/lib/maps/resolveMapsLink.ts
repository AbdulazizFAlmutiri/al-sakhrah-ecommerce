import "server-only";
import { parseMapsLink, type LatLng } from "./parseMapsLink";

const SHORT_HOSTS = ["maps.app.goo.gl", "goo.gl"];

/** Parses a Google Maps link; follows up to 5 redirects for short links like maps.app.goo.gl. */
export async function resolveMapsLink(input: string): Promise<LatLng | null> {
  const direct = parseMapsLink(input);
  if (direct) return direct;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (!SHORT_HOSTS.includes(url.hostname)) return null;
  let current = url.toString();
  for (let i = 0; i < 5; i++) {
    const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    const next = res.headers.get("location");
    if (!next) return null;
    const parsed = parseMapsLink(next);
    if (parsed) return parsed;
    current = new URL(next, current).toString();
  }
  return null;
}
