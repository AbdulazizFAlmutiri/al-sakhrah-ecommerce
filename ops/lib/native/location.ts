import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";

export type Fix = { lat: number; lng: number; accuracy: number | null; speed: number | null };
export type Stop = () => void;

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

export const isNativeApp = () => Capacitor.isNativePlatform();

/**
 * Watch the device position. In the Android app this runs a foreground service, so it keeps
 * reporting with the screen off; in a browser it uses navigator.geolocation (screen must stay on).
 */
export function watchLocation(onFix: (f: Fix) => void, onDenied: () => void, notice: { title: string; message: string }): Stop {
  if (isNativeApp()) {
    let id: string | null = null;
    let stopped = false;
    BackgroundGeolocation.addWatcher(
      { backgroundTitle: notice.title, backgroundMessage: notice.message, requestPermissions: true, stale: false, distanceFilter: 25 },
      (loc, err) => {
        if (err) { if (err.code === "NOT_AUTHORIZED") onDenied(); return; }
        if (loc) onFix({ lat: loc.latitude, lng: loc.longitude, accuracy: loc.accuracy ?? null, speed: loc.speed ?? null });
      },
    ).then((w) => { id = w; if (stopped) BackgroundGeolocation.removeWatcher({ id: w }); });
    return () => { stopped = true; if (id) BackgroundGeolocation.removeWatcher({ id }); };
  }
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) { queueMicrotask(onDenied); return () => {}; }
  const wid = navigator.geolocation.watchPosition(
    (p) => onFix({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? null, speed: p.coords.speed ?? null }),
    (e) => { if (e.code === e.PERMISSION_DENIED) onDenied(); },
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
  );
  return () => navigator.geolocation.clearWatch(wid);
}
