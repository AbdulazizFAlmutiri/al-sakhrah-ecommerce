import "server-only";
import { createClient } from "@/lib/db/server";
import type { OrderStatus } from "@/lib/orders/status";

export type StopBranch = { name: string; lat: number; lng: number; phone: string | null; customer: { name: string } | null };
export type DriverOrder = {
  id: string; status: OrderStatus; stop_seq: number | null; eta: string | null; po_number: string; notes: string | null;
  trip_id: string | null; delivery_date: string; branch: StopBranch | null;
};
const COLS = "id, status, stop_seq, eta, po_number, notes, trip_id, delivery_date, branch:branches(name, lat, lng, phone, customer:customers(name))";

export async function getActiveTrip(driverId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("trips").select("id, started_at, polyline").eq("driver_id", driverId).is("ended_at", null).maybeSingle();
  return data;
}

export async function getWarehousePoint(): Promise<{ lat: number; lng: number } | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("warehouses").select("lat, lng").order("created_at").limit(1).maybeSingle();
  return data && data.lat != null && data.lng != null ? { lat: data.lat, lng: data.lng } : null;
}

/** Everything the driver tablet shows: the active trip's stops, or the orders waiting to start. */
export async function getDriverView(driverId: string, today: string) {
  const supabase = await createClient();
  const trip = await getActiveTrip(driverId);
  if (trip) {
    const { data } = await supabase.from("orders").select(COLS).eq("trip_id", trip.id).order("stop_seq", { nullsFirst: false });
    return { trip, stops: (data ?? []) as unknown as DriverOrder[], waiting: [] as DriverOrder[] };
  }
  const { data } = await supabase
    .from("orders").select(COLS)
    .eq("driver_id", driverId).in("status", ["new", "ready"]).lte("delivery_date", today)
    .order("status", { ascending: false }).order("created_at");
  return { trip: null, stops: [] as DriverOrder[], waiting: (data ?? []) as unknown as DriverOrder[] };
}

export type MapTrip = {
  id: string; driver: string; started_at: string; polyline: string | null;
  last: { lat: number; lng: number; recorded_at: string } | null;
  stops: { id: string; seq: number | null; status: OrderStatus; eta: string | null; name: string; lat: number; lng: number }[];
};

export async function getLiveMapData(): Promise<{ trips: MapTrip[]; warehouse: { lat: number; lng: number } | null }> {
  const supabase = await createClient();
  const [{ data: trips }, warehouse] = await Promise.all([
    supabase.from("trips").select("id, driver_id, started_at, polyline, driver:profiles(full_name)").is("ended_at", null).order("started_at"),
    getWarehousePoint(),
  ]);
  const list = (trips ?? []) as unknown as { id: string; driver_id: string; started_at: string; polyline: string | null; driver: { full_name: string } | null }[];
  const out: MapTrip[] = await Promise.all(list.map(async (t) => {
    const [{ data: loc }, { data: orders }] = await Promise.all([
      supabase.from("driver_locations").select("lat, lng, recorded_at").eq("trip_id", t.id).order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("orders").select("id, stop_seq, status, eta, branch:branches(name, lat, lng, customer:customers(name))").eq("trip_id", t.id).order("stop_seq"),
    ]);
    const stops = ((orders ?? []) as unknown as { id: string; stop_seq: number | null; status: OrderStatus; eta: string | null; branch: { name: string; lat: number; lng: number; customer: { name: string } | null } | null }[])
      .filter((o) => o.branch)
      .map((o) => ({ id: o.id, seq: o.stop_seq, status: o.status, eta: o.eta, name: `${o.branch!.customer?.name ?? ""} — ${o.branch!.name}`, lat: o.branch!.lat, lng: o.branch!.lng }));
    return { id: t.id, driver: t.driver?.full_name ?? "", started_at: t.started_at, polyline: t.polyline, last: loc ?? null, stops };
  }));
  return { trips: out, warehouse };
}
