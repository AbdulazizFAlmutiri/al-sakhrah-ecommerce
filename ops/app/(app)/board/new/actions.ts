"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { isIsoDate, riyadhToday } from "@/lib/time";
import type { ActionState } from "../../admin/users/actions";

export type OrderState = ActionState & { savedAt?: number };
const UUID = /^[0-9a-f-]{36}$/i;

export async function createOrderAction(_p: OrderState, fd: FormData): Promise<OrderState> {
  const user = await requireRole(["admin", "sales"]);
  const branch_id = String(fd.get("branch_id") ?? "");
  const sales_rep_id = String(fd.get("sales_rep_id") ?? "");
  const po_number = String(fd.get("po_number") ?? "").trim();
  const driver = String(fd.get("driver") ?? "");
  const date = String(fd.get("delivery_date") ?? "") || riyadhToday();
  const notes = String(fd.get("notes") ?? "").trim() || null;
  if (!UUID.test(branch_id)) return { error: "order.error_branch" };
  if (!UUID.test(sales_rep_id) || !po_number || !driver || !isIsoDate(date)) return { error: "order.error_required" };
  const external = driver === "external";
  if (!external && !UUID.test(driver)) return { error: "order.error_driver" };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({
    branch_id, sales_rep_id, po_number, notes, delivery_date: date,
    external, driver_id: external ? null : driver, created_by: user.id,
  });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board");
  if (fd.get("intent") === "another") return { ok: true, savedAt: Date.now() };
  redirect(`/board?date=${date}`);
}
