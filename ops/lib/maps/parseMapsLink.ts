export type LatLng = { lat: number; lng: number };

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

function valid(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseMapsLink(input: string): LatLng | null {
  const s = decodeURIComponent(input.trim());
  const patterns = [
    new RegExp(`!3d${NUM}!4d${NUM}`),
    new RegExp(`[?&](?:q|query|ll|destination)=${NUM},\\s*${NUM}`),
    new RegExp(`@${NUM},${NUM}`),
    new RegExp(`^${NUM},\\s*${NUM}$`),
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return valid(parseFloat(m[1]), parseFloat(m[2]));
  }
  return null;
}
