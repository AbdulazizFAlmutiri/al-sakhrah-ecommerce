"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { resolveMapsLink } from "@/lib/maps/resolveMapsLink";
import type { ActionState } from "../admin/users/actions";

export async function addCustomerAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "order.error_required" };
  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({ name });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/customers");
  return { ok: true };
}

export async function addBranchAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const customer_id = String(fd.get("customer_id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim() || null;
  const link = String(fd.get("location") ?? "").trim();
  if (!customer_id || !name || !link) return { error: "order.error_required" };
  const pos = await resolveMapsLink(link);
  if (!pos) return { error: "settings.error_maps_link" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({ customer_id, name, phone, lat: pos.lat, lng: pos.lng, address_text: link })
    .select("id")
    .single();
  if (error || !data) return { error: dbErrorKey(error?.message ?? "") };
  revalidatePath("/customers");
  revalidatePath("/board/new");
  const ret = String(fd.get("return") ?? "");
  if (ret === "/board/new") redirect(`/board/new?branch=${data.id}`);
  return { ok: true };
}
