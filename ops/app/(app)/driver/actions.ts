"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { planRoute, refreshEtas } from "@/lib/routing";
import { getActiveTrip, getWarehousePoint } from "@/lib/trips/queries";
import type { Stop } from "@/lib/routing/local";

type Result = { ok?: boolean; error?: string };
const RIYADH = { lat: 24.7136, lng: 46.6753 };

async function tripStops(tripId: string, onlyOpen: boolean): Promise<Stop[]> {
  const supabase = await createClient();
  let q = supabase.from("orders").select("id, status, stop_seq, branch:branches(lat, lng)").eq("trip_id", tripId).order("stop_seq", { nullsFirst: false });
  if (onlyOpen) q = q.eq("status", "on_the_way");
  const { data } = await q;
  return ((data ?? []) as unknown as { id: string; branch: { lat: number; lng: number } | null }[])
    .filter((o) => o.branch)
    .map((o) => ({ id: o.id, lat: o.branch!.lat, lng: o.branch!.lng }));
}

async function saveRoute(tripId: string, plan: { order: string[]; etas: Record<string, string>; polyline: string | null; distanceM: number }, seqOffset = 0) {
  const supabase = await createClient();
  const stops = plan.order.map((id, i) => ({ order_id: id, seq: seqOffset + i + 1, eta: plan.etas[id] }));
  await supabase.rpc("set_trip_route", { p_trip: tripId, p_stops: stops, p_polyline: plan.polyline ?? undefined, p_distance_m: plan.distanceM || undefined });
}

export async function startTripAction(pos: { lat: number; lng: number } | null): Promise<Result> {
  await requireRole(["driver"]);
  const supabase = await createClient();
  const { data: tripId, error } = await supabase.rpc("start_trip", pos ? { p_lat: pos.lat, p_lng: pos.lng } : {});
  if (error || !tripId) return { error: error?.message.includes("trip_already_active") ? "active" : "drv.error_trip" };
  const origin = pos ?? (await getWarehousePoint()) ?? RIYADH;
  const plan = await planRoute(origin, await tripStops(tripId, false));
  await saveRoute(tripId, plan);
  revalidatePath("/driver");
  revalidatePath("/board");
  return { ok: true };
}

export async function reportLocationAction(p: {
  client_id: string; lat: number; lng: number; accuracy: number | null; speed: number | null; recorded_at: string; refresh: boolean;
}): Promise<Result> {
  const user = await requireRole(["driver"]);
  const trip = await getActiveTrip(user.id);
  if (!trip) return { error: "no_trip" };
  const supabase = await createClient();
  const { error } = await supabase.from("driver_locations").upsert(
    { client_id: p.client_id, trip_id: trip.id, driver_id: user.id, lat: p.lat, lng: p.lng, accuracy_m: p.accuracy, speed: p.speed, recorded_at: p.recorded_at },
    { onConflict: "client_id", ignoreDuplicates: true },
  );
  if (error) return { error: "common.error_generic" };
  if (p.refresh) {
    const remaining = await tripStops(trip.id, true);
    if (remaining.length) {
      const { data: done } = await supabase.from("orders").select("id", { count: "exact", head: false }).eq("trip_id", trip.id).neq("status", "on_the_way");
      await saveRoute(trip.id, await refreshEtas({ lat: p.lat, lng: p.lng }, remaining), done?.length ?? 0);
    }
  }
  return { ok: true };
}

export async function recordProofAction(p: {
  client_id: string; order_id: string; outcome: "delivered" | "failed"; reason_id: string | null; note: string | null;
  photo_path: string | null; lat: number | null; lng: number | null; accuracy: number | null; recorded_at: string;
}): Promise<Result> {
  await requireRole(["driver"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_proof", {
    p_client_id: p.client_id, p_order_id: p.order_id, p_outcome: p.outcome,
    p_reason_id: p.reason_id ?? undefined, p_note: p.note ?? undefined, p_photo_path: p.photo_path ?? undefined,
    p_lat: p.lat ?? undefined, p_lng: p.lng ?? undefined, p_accuracy: p.accuracy ?? undefined, p_recorded_at: p.recorded_at,
  });
  if (error) return { error: error.message.includes("photo_required") ? "drv.error_photo" : "common.error_generic" };
  revalidatePath("/driver");
  revalidatePath("/board");
  return { ok: true };
}

export async function endTripAction(): Promise<Result> {
  await requireRole(["driver"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_trip", {});
  if (error) return { error: error.message.includes("stops_remaining") ? "drv.stops_remaining" : "common.error_generic" };
  revalidatePath("/driver");
  return { ok: true };
}
