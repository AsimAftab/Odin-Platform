/**
 * Normalizes a device user_code to the canonical `XXXX-XXXX` form used as the
 * stored/lookup key. Accepts lowercase, missing dash, or surrounding spaces so
 * a user can type the code loosely and still match. Codes that aren't 8
 * alphanumerics are returned uppercased/trimmed (they simply won't match).
 */
export function normalizeUserCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.length === 8
    ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
    : raw.trim().toUpperCase();
}
