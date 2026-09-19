export const MEMORIAL_LIMITS = { name: 60, location: 80, message: 1000 } as const;

export type MemorialSubmission = {
  displayName: string;
  location: string | null;
  message: string;
};

const clean = (value: unknown) =>
  typeof value === "string"
    ? value.normalize("NFC").replace(/\r\n?/g, "\n").trim()
    : "";

export function validateMemorialSubmission(input: Record<string, unknown>):
  | { ok: true; value: MemorialSubmission }
  | { ok: false; error: string } {
  const displayName = clean(input.displayName);
  const location = clean(input.location);
  const message = clean(input.message);

  if (!displayName) return { ok: false, error: "Please include a display name." };
  if (displayName.length > MEMORIAL_LIMITS.name)
    return { ok: false, error: "Display name must be 60 characters or fewer." };
  if (location.length > MEMORIAL_LIMITS.location)
    return { ok: false, error: "Location must be 80 characters or fewer." };
  if (!message) return { ok: false, error: "Please include a message." };
  if (message.length > MEMORIAL_LIMITS.message)
    return { ok: false, error: "Message must be 1000 characters or fewer." };
  if (input.consent !== true)
    return { ok: false, error: "Please confirm that your message may be reviewed for publication." };

  return { ok: true, value: { displayName, location: location || null, message } };
}

export function isValidStatusTransition(from: string, to: string) {
  return from === "pending" && (to === "approved" || to === "rejected");
}

export function adminPaging(offset: number, limit: number) {
  return {
    offset: Number.isInteger(offset) && offset >= 0 ? Math.min(offset, 9_975) : 0,
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, 25) : 25,
  };
}
