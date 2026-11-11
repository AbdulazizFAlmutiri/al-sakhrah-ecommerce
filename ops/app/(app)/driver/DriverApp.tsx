"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/db/browser";
import { endTripAction, recordProofAction, reportLocationAction, startTripAction } from "./actions";
import { Icon } from "@/components/ui/Icon";

export type DStop = {
  id: string; status: string; seq: number | null; eta: string | null; etaText: string | null;
  po: string; notes: string | null; store: string; branch: string; lat: number; lng: number; phone: string | null;
};
type Reason = { id: string; icon: string; label: string };
type L = Record<
  | "start" | "end" | "preparing" | "readyN" | "noOrders" | "navigate" | "delivered" | "failed" | "takePhoto" | "retake" | "confirm"
  | "cancel" | "uploading" | "chooseReason" | "next" | "doneTitle" | "doneHint" | "gpsOff" | "offline" | "tracking" | "note",
  string
> & { errors: Record<string, string> };

type Pos = { lat: number; lng: number; accuracy: number | null; speed: number | null };
const REPORT_MS = 30_000;

/** Downscale a camera photo to max 1600px JPEG so uploads stay small on mobile data. */
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.8));
}

export function DriverApp({ userId, tripActive, stops, waiting, reasons, labels }: {
  userId: string; tripActive: boolean; stops: DStop[]; waiting: DStop[]; reasons: Reason[]; labels: L;
}) {
  const router = useRouter();
  const [pos, setPos] = useState<Pos | null>(null);
  const [gpsDenied, setGpsDenied] = useState(false);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<{ kind: "photo" | "fail"; stop: DStop } | null>(null);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const posRef = useRef<Pos | null>(null);
  const reports = useRef(0);

  // Location: watch while the page is open (needed to start and for proof positions).
  useEffect(() => {
    if (!("geolocation" in navigator)) { queueMicrotask(() => setGpsDenied(true)); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { const v = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? null, speed: p.coords.speed ?? null }; posRef.current = v; setPos(v); setGpsDenied(false); },
      (e) => { if (e.code === e.PERMISSION_DENIED) setGpsDenied(true); },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);


  // During a trip: report every 30 s, refresh ETAs every 4th report (~2 min), keep the screen on.
  useEffect(() => {
    if (!tripActive) return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => { lock = l; }).catch(() => {});
    const send = () => {
      const p = posRef.current;
      if (!p || !navigator.onLine) return;
      reports.current += 1;
      reportLocationAction({ client_id: crypto.randomUUID(), lat: p.lat, lng: p.lng, accuracy: p.accuracy, speed: p.speed, recorded_at: new Date().toISOString(), refresh: reports.current % 4 === 0 })
        .then(() => { if (reports.current % 4 === 0) router.refresh(); })
        .catch(() => {});
    };
    const first = setTimeout(send, 2_000);
    const i = setInterval(send, REPORT_MS);
    return () => { clearTimeout(first); clearInterval(i); lock?.release().catch(() => {}); };
  }, [tripActive, router]);

  const run = useCallback(async (fn: () => Promise<{ ok?: boolean; error?: string }>) => {
    setBusy(true); setError(null);
    try {
      const r = await fn();
      if (r.error && r.error !== "active") setError(labels.errors[r.error] ?? labels.errors["common.error_generic"]);
      else { setMode(null); setPhoto(null); setReason(null); setNote(""); router.refresh(); }
    } catch {
      setError(labels.errors["common.error_generic"]);
    } finally { setBusy(false); }
  }, [labels.errors, router]);

  const start = () => run(() => startTripAction(posRef.current ? { lat: posRef.current.lat, lng: posRef.current.lng } : null));
  const end = () => run(() => endTripAction());

  const submitDelivered = (stop: DStop) => run(async () => {
    if (!photo) return { error: "drv.error_photo" };
    const clientId = crypto.randomUUID();
    const path = `${userId}/${stop.id}-${clientId}.jpg`;
    const supabase = createBrowserSupabase();
    const up = await supabase.storage.from("proofs").upload(path, photo.blob, { contentType: "image/jpeg", upsert: false });
    if (up.error) return { error: "common.error_generic" };
    const p = posRef.current;
    return recordProofAction({ client_id: clientId, order_id: stop.id, outcome: "delivered", reason_id: null, note: note || null, photo_path: path,
      lat: p?.lat ?? null, lng: p?.lng ?? null, accuracy: p?.accuracy ?? null, recorded_at: new Date().toISOString() });
  });

  const submitFailed = (stop: DStop) => run(async () => {
    const p = posRef.current;
    return recordProofAction({ client_id: crypto.randomUUID(), order_id: stop.id, outcome: "failed", reason_id: reason, note: note || null, photo_path: null,
      lat: p?.lat ?? null, lng: p?.lng ?? null, accuracy: p?.accuracy ?? null, recorded_at: new Date().toISOString() });
  });

  const open = stops.filter((s) => s.status === "on_the_way");
  const nextId = open[0]?.id;
  const readyCount = waiting.filter((w) => w.status === "ready").length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-24">
      {/* status banners */}
      {gpsDenied && <Banner tone="bad" icon="location_off">{labels.gpsOff}</Banner>}
      {!online && <Banner tone="warn" icon="cloud_off">{labels.offline}</Banner>}
      {tripActive && online && !gpsDenied && <Banner tone="ok" icon="my_location">{labels.tracking}</Banner>}
      {error && <Banner tone="bad" icon="error">{error}</Banner>}

      {!tripActive && (
        <>
          {waiting.length === 0 ? (
            <p className="bg-white p-10 text-center text-xl text-ink-500 shadow-sm">{labels.noOrders}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {waiting.map((w) => (
                <li key={w.id} className={`flex items-center justify-between bg-white p-5 shadow-sm ${w.status !== "ready" ? "opacity-50" : ""}`}>
                  <div>
                    <div className="text-xl font-extrabold">{w.store}</div>
                    <div className="text-lg text-ink-500">{w.branch}</div>
                  </div>
                  {w.status === "ready"
                    ? <Icon name="inventory" className="text-4xl text-royal-600" />
                    : <span className="flex items-center gap-1 text-warn-600"><Icon name="hourglass_top" className="text-3xl" />{labels.preparing}</span>}
                </li>
              ))}
            </ul>
          )}
          {readyCount > 0 && (
            <button onClick={start} disabled={busy || gpsDenied} data-testid="start-trip"
              className="fixed inset-x-4 bottom-4 z-20 mx-auto flex h-20 max-w-3xl items-center justify-center gap-3 bg-royal-600 text-2xl font-extrabold text-white shadow-xl disabled:bg-mist-300">
              <Icon name="play_arrow" className="text-4xl" filled />{labels.start} · {labels.readyN.replace("{n}", String(readyCount))}
            </button>
          )}
        </>
      )}

      {tripActive && (
        <>
          <ol className="flex flex-col gap-3">
            {stops.map((s, i) => {
              const isNext = s.id === nextId;
              const done = s.status === "delivered" || s.status === "failed";
              return (
                <li key={s.id} data-testid="stop" className={`bg-white shadow-sm ${isNext ? "border-s-8 border-royal-600" : ""} ${done ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-4 p-5">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center text-2xl font-extrabold text-white ${done ? (s.status === "delivered" ? "bg-ok-600" : "bg-bad-600") : "bg-navy-700"}`}>
                      {done ? <Icon name={s.status === "delivered" ? "check" : "close"} className="text-3xl" /> : (s.seq ?? i + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      {isNext && <div className="text-sm font-bold text-royal-600">{labels.next}</div>}
                      <div className="text-xl font-extrabold">{s.store}</div>
                      <div className="text-lg text-ink-500">{s.branch}</div>
                      {s.etaText && !done && <div className="mt-1 flex items-center gap-1 text-lg font-bold text-navy-700"><Icon name="schedule" />{s.etaText}</div>}
                      {s.notes && <div className="mt-1 text-warn-600">{s.notes}</div>}
                    </div>
                  </div>
                  {!done && (
                    <div className="grid grid-cols-3 border-t border-mist-200">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=driving`} target="_blank" rel="noreferrer"
                        className="flex h-20 flex-col items-center justify-center gap-1 text-royal-600">
                        <Icon name="navigation" className="text-4xl" filled /><span className="text-sm font-bold">{labels.navigate}</span>
                      </a>
                      <button data-testid="deliver" onClick={() => { setMode({ kind: "photo", stop: s }); setPhoto(null); setNote(""); fileRef.current?.click(); }}
                        className="flex h-20 flex-col items-center justify-center gap-1 bg-ok-600 text-white">
                        <Icon name="photo_camera" className="text-4xl" filled /><span className="text-sm font-bold">{labels.delivered}</span>
                      </button>
                      <button data-testid="fail" onClick={() => { setMode({ kind: "fail", stop: s }); setReason(null); setNote(""); }}
                        className="flex h-20 flex-col items-center justify-center gap-1 bg-bad-600 text-white">
                        <Icon name="cancel" className="text-4xl" /><span className="text-sm font-bold">{labels.failed}</span>
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {open.length === 0 && (
            <div className="flex flex-col items-center gap-4 bg-white p-8 text-center shadow-sm">
              <Icon name="flag" className="text-6xl text-ok-600" filled />
              <div className="text-2xl font-extrabold">{labels.doneTitle}</div>
              <div className="text-lg text-ink-500">{labels.doneHint}</div>
              <button onClick={end} disabled={busy} data-testid="end-trip" className="h-16 w-full max-w-md bg-navy-700 text-xl font-extrabold text-white">{labels.end}</button>
            </div>
          )}
        </>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" data-testid="photo-input"
        onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (!f) return;
          try { const blob = await compress(f); setPhoto({ blob, url: URL.createObjectURL(blob) }); } catch { setError(labels.errors["common.error_generic"]); }
        }} />

      {/* sheet: delivered with photo / not delivered with reason */}
      {mode && (
        <div className="fixed inset-0 z-30 flex items-end bg-navy-900/60" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full overflow-auto bg-white p-5">
            <div className="mb-4 text-xl font-extrabold">{mode.stop.store} — {mode.stop.branch}</div>
            {mode.kind === "photo" ? (
              <div className="flex flex-col gap-4">
                {photo
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                  ? <img src={photo.url} alt="" className="max-h-[50vh] w-full object-contain bg-mist-100" />
                  : <button onClick={() => fileRef.current?.click()} className="flex h-48 flex-col items-center justify-center gap-2 border-4 border-dashed border-royal-600 text-royal-600">
                      <Icon name="photo_camera" className="text-6xl" /><span className="text-lg font-bold">{labels.takePhoto}</span></button>}
                {photo && <button onClick={() => fileRef.current?.click()} className="h-12 font-bold text-royal-600">{labels.retake}</button>}
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={labels.note} className="h-12 border border-mist-300 px-3" />
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMode(null)} className="h-16 border border-mist-300 text-lg font-bold">{labels.cancel}</button>
                  <button data-testid="confirm-delivered" onClick={() => submitDelivered(mode.stop)} disabled={!photo || busy}
                    className="h-16 bg-ok-600 text-lg font-extrabold text-white disabled:bg-mist-300">{busy ? labels.uploading : labels.confirm}</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-lg font-bold text-ink-700">{labels.chooseReason}</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {reasons.map((r) => (
                    <button key={r.id} onClick={() => setReason(r.id)} aria-pressed={reason === r.id} data-testid="reason"
                      className={`flex h-24 flex-col items-center justify-center gap-1 border-2 text-lg font-bold ${reason === r.id ? "border-bad-600 bg-bad-50 text-bad-600" : "border-mist-300"}`}>
                      <Icon name={r.icon} className="text-4xl" />{r.label}
                    </button>
                  ))}
                </div>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={labels.note} className="h-12 border border-mist-300 px-3" />
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMode(null)} className="h-16 border border-mist-300 text-lg font-bold">{labels.cancel}</button>
                  <button data-testid="confirm-failed" onClick={() => submitFailed(mode.stop)} disabled={!reason || busy}
                    className="h-16 bg-bad-600 text-lg font-extrabold text-white disabled:bg-mist-300">{busy ? labels.uploading : labels.confirm}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {pos === null && !gpsDenied && <span className="sr-only">locating</span>}
    </div>
  );
}

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb); window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
}

function Banner({ tone, icon, children }: { tone: "ok" | "warn" | "bad"; icon: string; children: React.ReactNode }) {
  const cls = tone === "ok" ? "bg-ok-50 text-ok-600" : tone === "warn" ? "bg-warn-50 text-warn-600" : "bg-bad-50 text-bad-600";
  return <div role="status" className={`flex items-center gap-2 px-4 py-3 text-lg font-bold ${cls}`}><Icon name={icon} className="text-2xl" />{children}</div>;
}
