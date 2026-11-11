"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { resolveMapsLink } from "@/lib/maps/resolveMapsLink";
import type { ActionState } from "../users/actions";

const done = (): ActionState => {
  revalidatePath("/admin/settings");
  return { ok: true };
};

export async function addRepAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "common.error_generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("sales_reps").insert({ name });
  return error ? { error: dbErrorKey(error.message) } : done();
}

export async function toggleRepAction(fd: FormData): Promise<void> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  await supabase.from("sales_reps").update({ active: fd.get("active") === "true" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/settings");
}

export async function saveReasonAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const row = {
    code: String(fd.get("code") ?? "").trim(),
    label_ar: String(fd.get("label_ar") ?? "").trim(),
    label_en: String(fd.get("label_en") ?? "").trim(),
    label_ur: String(fd.get("label_ur") ?? "").trim(),
    icon: String(fd.get("icon") ?? "").trim(),
    sort: Number(fd.get("sort") ?? 0),
    active: fd.get("active") === "on",
  };
  if (!row.code || !row.label_ar || !row.label_en || !row.label_ur || !row.icon) return { error: "common.error_generic" };
  const supabase = await createClient();
  const id = fd.get("id");
  const { error } = id
    ? await supabase.from("failure_reasons").update(row).eq("id", String(id))
    : await supabase.from("failure_reasons").insert(row);
  return error ? { error: dbErrorKey(error.message) } : done();
}

export async function saveWarehouseAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const name = String(fd.get("name") ?? "").trim();
  const link = String(fd.get("location") ?? "").trim();
  const update: { name: string; lat?: number; lng?: number } = { name };
  if (link) {
    const pos = await resolveMapsLink(link);
    if (!pos) return { error: "settings.error_maps_link" };
    update.lat = pos.lat;
    update.lng = pos.lng;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("warehouses").update(update).eq("id", String(fd.get("id")));
  return error ? { error: dbErrorKey(error.message) } : done();
}
