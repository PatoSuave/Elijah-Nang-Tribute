"use client";

import { useRef, useState } from "react";

type Entry = { id: string; display_name: string; location: string | null; message: string; status: string; created_at: string };

async function apiError(response: Response, fallback: string) {
  const value: unknown = await response.json().catch(() => ({}));
  if (value && typeof value === "object" && typeof (value as Record<string, unknown>).error === "string") {
    return (value as Record<string, unknown>).error as string;
  }
  return fallback;
}

export function AdminLogin() {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);

  async function login(form: FormData) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password") }), signal: AbortSignal.timeout(10_000) });
      if (response.ok) location.reload();
      else setError(await apiError(response, "Could not sign in. Please try again."));
    } catch {
      setError("Could not sign in right now. Please check your connection and try again.");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return <form className="admin-login" action={login}><label htmlFor="password">Admin password</label><input id="password" name="password" type="password" required autoComplete="current-password" /><button className="button-primary" disabled={sending} type="submit">{sending ? "Signing in…" : "Sign in"}</button><p role="alert">{error}</p></form>;
}

export function AdminQueue({ entries, csrf, emptyMessage = "No messages are awaiting review." }: { entries: Entry[]; csrf: string; emptyMessage?: string }) {
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inFlight = useRef<string | null>(null);

  async function moderate(id: string, status: "approved" | "rejected") {
    if (inFlight.current) return;
    inFlight.current = id;
    setPendingId(id);
    setError("");
    let navigatingToFreshQueue = false;
    try {
      const response = await fetch(`/api/admin/memorial/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ status }), signal: AbortSignal.timeout(10_000) });
      if (!response.ok) {
        setError(await apiError(response, "Could not update the message. Please try again."));
        return;
      }
      // Offset pagination changes after moderation, so a local removal could
      // skip the item that moves from the next page into this one.
      navigatingToFreshQueue = true;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- A full reload intentionally discards the stale queue and its offset pagination state.
      window.location.assign("/admin/memorial");
    } catch {
      setError("Could not update the message right now. Please check your connection and try again.");
    } finally {
      if (!navigatingToFreshQueue) {
        inFlight.current = null;
        setPendingId(null);
      }
    }
  }

  return <div className="admin-queue"><p role="alert">{error}</p>{entries.length === 0 ? <p>{emptyMessage}</p> : entries.map((entry) => {
    const pending = pendingId === entry.id;
    return <article key={entry.id} className="admin-entry"><p><strong>{entry.display_name}</strong>{entry.location ? ` · ${entry.location}` : ""}</p><p>{entry.message}</p><small>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(entry.created_at))}</small><div><button className="button-primary" disabled={Boolean(pendingId)} onClick={() => moderate(entry.id, "approved")} type="button">{pending ? "Saving…" : "Approve"}</button><button className="button-secondary" disabled={Boolean(pendingId)} onClick={() => moderate(entry.id, "rejected")} type="button">Reject</button></div></article>;
  })}</div>;
}
