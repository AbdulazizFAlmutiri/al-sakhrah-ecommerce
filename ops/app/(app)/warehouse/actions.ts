"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import type { ActionState } from "../admin/users/actions";

export async function setReadyAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "warehouse"]);
  const to = fd.get("to") === "new" ? "new" : "ready";
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: to, p_meta: {} });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/warehouse");
  return { ok: true };
}
