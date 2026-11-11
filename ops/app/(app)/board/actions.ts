"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import type { ActionState } from "../admin/users/actions";

export async function cancelOrderAction(fd: FormData): Promise<void> {
  await requireRole(["admin", "sales"]);
  const supabase = await createClient();
  await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: "cancelled", p_meta: {} });
  revalidatePath("/board");
}

export async function closeExternalAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const outcome = fd.get("outcome") === "delivered" ? "delivered" : "failed";
  const meta: Record<string, string> = {};
  const reason = String(fd.get("reason_id") ?? "");
  const note = String(fd.get("note") ?? "").trim();
  if (outcome === "failed" && reason) meta.reason_id = reason;
  if (note) meta.note = note;
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: outcome, p_meta: meta });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board");
  return { ok: true };
}
