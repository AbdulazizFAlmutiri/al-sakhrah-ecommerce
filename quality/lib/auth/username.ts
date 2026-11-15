export const LOGIN_DOMAIN = "alsakhrah.com";

/** Staff sign in with their company email, or just the part before the @. */
export function toLoginEmail(input: string): string {
  const v = input.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${LOGIN_DOMAIN}`;
}
