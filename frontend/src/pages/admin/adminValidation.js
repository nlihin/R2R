export const ADMIN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidAdminEmail(value) {
  return ADMIN_EMAIL_RE.test(String(value ?? "").trim());
}
