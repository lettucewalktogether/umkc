/**
 * Passcode gate for the instructor dashboard.
 *
 * The dashboard shows aggregated class results, so it is gated by a shared
 * passcode set in the deployment environment rather than a user database. The
 * cookie holds an HMAC of a fixed message keyed by the passcode, so a valid
 * cookie cannot be forged without knowing the passcode, and the passcode
 * itself is never sent to the browser.
 *
 * This is deliberately modest: one shared instructor credential, not per-user
 * authentication. Do not put anything in the dashboard that everyone holding
 * that passcode should not see.
 */

export const SESSION_COOKIE = "gac_instructor";

const SESSION_MESSAGE = "umkc-govtacctclass-instructor-v1";

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** HMAC-SHA-256 of a fixed message, keyed by the passcode. */
export async function sessionToken(passcode: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(SESSION_MESSAGE));
  return bufferToHex(sig);
}

/** Length-independent comparison, to avoid leaking a match by timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function configuredPasscode(): string | null {
  const value = process.env.INSTRUCTOR_PASSCODE?.trim();
  return value ? value : null;
}

/** True when the cookie value matches the configured passcode's token. */
export async function isValidSession(
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  const passcode = configuredPasscode();
  if (!passcode) return false;
  return safeEqual(cookieValue, await sessionToken(passcode));
}
