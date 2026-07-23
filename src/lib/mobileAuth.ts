import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// The only deep-link scheme the web app will redirect into. Add more entries
// here if the app ever registers additional schemes (e.g. a separate debug
// build) — anything not on this list is refused rather than blindly redirected.
const ALLOWED_MOBILE_SCHEMES = ["soleinsider://"];

const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MOBILE_SESSION_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function generateRawToken() {
  return randomBytes(32).toString("hex");
}

/** Refuses anything that isn't an allow-listed deep link — never redirect on trust alone. */
export function sanitizeMobileRedirectUri(value: string | null | undefined) {
  if (!value) return null;

  const isAllowed = ALLOWED_MOBILE_SCHEMES.some((scheme) => value.startsWith(scheme));

  return isAllowed ? value : null;
}

/** Mints a one-time code for `memberId`, expiring in 5 minutes. Returns the raw code — never stored. */
export async function createMobileAuthCode(memberId: number) {
  const rawCode = generateRawToken();

  await prisma.mobileAuthCode.create({
    data: {
      codeHash: sha256(rawCode),
      memberId,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
    },
  });

  return rawCode;
}

export type MobileAuthCodeExchangeResult =
  | { success: true; token: string }
  | { success: false; error: "invalid_code" | "expired_code" | "code_already_used" };

/**
 * Exchanges a one-time code for a long-lived bearer token. The code is
 * marked used in the same lookup so a code can never be exchanged twice,
 * even under concurrent requests racing on the same code.
 */
export async function exchangeMobileAuthCode(rawCode: string): Promise<MobileAuthCodeExchangeResult> {
  const codeHash = sha256(rawCode);
  const record = await prisma.mobileAuthCode.findUnique({ where: { codeHash } });

  if (!record) {
    return { success: false, error: "invalid_code" };
  }

  if (record.usedAt) {
    return { success: false, error: "code_already_used" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return { success: false, error: "expired_code" };
  }

  // Mark used first — if two requests race on the same code, whichever loses
  // this update either sees usedAt already set (checked above on retry) or,
  // for true concurrency, only one of them can be "the" row we proceed past.
  const updated = await prisma.mobileAuthCode.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (updated.count === 0) {
    return { success: false, error: "code_already_used" };
  }

  const rawToken = generateRawToken();

  await prisma.mobileSession.create({
    data: {
      tokenHash: sha256(rawToken),
      memberId: record.memberId,
      expiresAt: new Date(Date.now() + MOBILE_SESSION_TTL_MS),
    },
  });

  return { success: true, token: rawToken };
}

export type MobileSessionMember = {
  id: number;
  email: string;
  name: string | null;
  profileImage: string;
};

/**
 * Verifies a bearer token and returns the member it belongs to, or null if
 * the token is unknown, revoked, or expired. Touches `lastUsedAt` on every
 * valid check so idle-token cleanup can key off it later.
 */
export async function verifyMobileToken(rawToken: string): Promise<MobileSessionMember | null> {
  const tokenHash = sha256(rawToken);
  const session = await prisma.mobileSession.findUnique({ where: { tokenHash } });

  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const [member] = await Promise.all([
    prisma.member.findUnique({ where: { id: session.memberId } }),
    prisma.mobileSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }),
  ]);

  if (!member) {
    return null;
  }

  return {
    id: member.id,
    email: member.email,
    name: member.name,
    profileImage: member.profileImage,
  };
}

/** Revokes a bearer token so it stops working immediately. Idempotent. */
export async function revokeMobileToken(rawToken: string) {
  const tokenHash = sha256(rawToken);

  await prisma.mobileSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Extracts the bearer token from an `Authorization: Bearer <token>` header, or null. */
export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);

  return match ? match[1].trim() : null;
}
