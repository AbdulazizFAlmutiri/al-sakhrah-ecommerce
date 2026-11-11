const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;
export const AUTH_EMAIL_DOMAIN = "users.ops.local";

export function normalizeUsername(s: string): string {
  return s.trim().toLowerCase();
}

export function isValidUsername(s: string): boolean {
  return USERNAME_RE.test(s);
}

export function toAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}
