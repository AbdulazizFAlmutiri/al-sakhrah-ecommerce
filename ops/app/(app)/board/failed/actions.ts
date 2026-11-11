"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { isIsoDate } from "@/lib/time";
import type { ActionState } from "../../admin/users/actions";

export async function rescheduleAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const date = String(fd.get("delivery_date") ?? "");
  const driver = String(fd.get("driver") ?? "");
  if (!isIsoDate(date) || !driver) return { error: "order.error_required" };
  const external = driver === "external";
  const meta = { delivery_date: date, external, ...(external ? {} : { driver_id: driver }) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: "new", p_meta: meta });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board");
  revalidatePath("/board/failed");
  return { ok: true };
}

export async function cancelFailedAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const note = String(fd.get("note") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: "cancelled", p_meta: note ? { note } : {} });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board/failed");
  return { ok: true };
}
