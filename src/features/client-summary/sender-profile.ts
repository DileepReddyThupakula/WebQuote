import { z } from "zod";

/**
 * Optional name and contact line printed in the PDF header. Kept in this
 * browser only, like drafts. It is never part of a quote result, the pricing
 * engine, or any network request.
 */
export const SENDER_PROFILE_STORAGE_KEY = "webquote.sender-profile.v1";
export const SENDER_NAME_MAX_LENGTH = 80;
export const SENDER_CONTACT_MAX_LENGTH = 120;

export type SenderProfile = Readonly<{ name: string; contact: string }>;

const profileSchema = z.strictObject({
  storageVersion: z.literal(1),
  name: z.string().max(SENDER_NAME_MAX_LENGTH),
  contact: z.string().max(SENDER_CONTACT_MAX_LENGTH),
});

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const EMPTY_SENDER_PROFILE: SenderProfile = { name: "", contact: "" };

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Collapses whitespace and removes control characters. Plain text only. */
export function cleanProfileText(value: string, maxLength: number): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeSenderProfile(profile: SenderProfile): SenderProfile {
  return {
    name: cleanProfileText(profile.name, SENDER_NAME_MAX_LENGTH),
    contact: cleanProfileText(profile.contact, SENDER_CONTACT_MAX_LENGTH),
  };
}

export function loadSenderProfile(
  storage: StorageLike | null = browserStorage(),
): SenderProfile {
  if (!storage) return EMPTY_SENDER_PROFILE;
  try {
    const raw = storage.getItem(SENDER_PROFILE_STORAGE_KEY);
    if (!raw) return EMPTY_SENDER_PROFILE;
    const parsed = profileSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_SENDER_PROFILE;
    return normalizeSenderProfile(parsed.data);
  } catch {
    return EMPTY_SENDER_PROFILE;
  }
}

/** Saves the profile, or removes the key when both fields are empty. */
export function saveSenderProfile(
  profile: SenderProfile,
  storage: StorageLike | null = browserStorage(),
): boolean {
  if (!storage) return false;
  const clean = normalizeSenderProfile(profile);
  try {
    if (!clean.name && !clean.contact) {
      storage.removeItem(SENDER_PROFILE_STORAGE_KEY);
    } else {
      storage.setItem(
        SENDER_PROFILE_STORAGE_KEY,
        JSON.stringify({ storageVersion: 1, ...clean }),
      );
    }
    return true;
  } catch {
    return false;
  }
}
