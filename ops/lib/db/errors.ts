import type { MessageKey } from "@/lib/i18n";

const MAP: [needle: string, key: MessageKey][] = [
  ["username_taken", "users.error_taken"],
  ["invalid_username", "users.error_invalid_username"],
  ["weak_password", "users.error_weak_password"],
  ["cannot_modify_self", "users.error_self"],
  ["not_authorized", "common.not_authorized"],
  ["sales_reps_name_key", "settings.error_rep_taken"],
];

export function dbErrorKey(message: string): MessageKey {
  return MAP.find(([needle]) => message.includes(needle))?.[1] ?? "common.error_generic";
}
