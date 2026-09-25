"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MEMORIAL_LIMITS } from "@/lib/memorial";

type PublicMessage = { displayName: string; location: string | null; message: string; approvedAt: string | null };
type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  size: "compact";
};
declare global {
  interface Window {
    turnstile?: {
      render: (target: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const date = (value: string | null) => value ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(value)) : "";
const TURNSTILE_SCRIPT_ID = "nangsoul-turnstile-script";

function submissionError(form: FormData, message: string) {
  const displayName = String(form.get("displayName") || "").trim();
  const location = String(form.get("location") || "").trim();
  if (!displayName) return { field: "displayName", message: "Please include a display name." };
  if (displayName.length > MEMORIAL_LIMITS.name) return { field: "displayName", message: "Display name must be 60 characters or fewer." };
  if (location.length > MEMORIAL_LIMITS.location) return { field: "location", message: "Location must be 80 characters or fewer." };
  if (!message.trim()) return { field: "message", message: "Please include a message." };
  if (message.length > MEMORIAL_LIMITS.message) return { field: "message", message: "Message must be 1000 characters or fewer." };
  if (form.get("consent") !== "on") return { field: "consent", message: "Please confirm that your message may be reviewed for publication." };
  return null;
}

async function responseJson(response: Response) {
  const value: unknown = await response.json().catch(() => ({}));
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export default function MemorialBoard() {
  const [messages, setMessages] = useState<PublicMessage[]>([]); const [offset, setOffset] = useState(0); const [hasMore, setHasMore] = useState(false);
  const [messagesError, setMessagesError] = useState(""); const [messagesLoading, setMessagesLoading] = useState(false);
  const [message, setMessage] = useState(""); const [feedback, setFeedback] = useState(""); const [feedbackIsError, setFeedbackIsError] = useState(false); const [sending, setSending] = useState(false); const [turnstileToken, setTurnstileToken] = useState(""); const [captchaError, setCaptchaError] = useState("");
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileMount = useRef<HTMLDivElement>(null);
  const submissionInFlight = useRef(false);
  const messagesInFlight = useRef(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const resetTurnstile = () => {
    setTurnstileToken("");
    if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
  };
  const load = async (next = 0) => {
    if (messagesInFlight.current) return;
    messagesInFlight.current = true;
    setMessagesError("");
    setMessagesLoading(true);
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(`/api/memorial/messages?offset=${next}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
          const data = await responseJson(response);
          if (!response.ok || !Array.isArray(data.messages) || !Number.isInteger(data.nextOffset) || typeof data.hasMore !== "boolean") throw new Error();
          const nextMessages = data.messages as PublicMessage[];
          setMessages((current) => next ? [...current, ...nextMessages] : nextMessages);
          setOffset(data.nextOffset as number);
          setHasMore(data.hasMore);
          return;
        } catch {
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
      setMessagesError("Messages are temporarily unavailable. Please try again later.");
    } finally {
      setMessagesLoading(false);
      messagesInFlight.current = false;
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const mount = turnstileMount.current;
    if (!key) {
      setCaptchaError("Message verification is unavailable. Please try again later.");
      return;
    }
    if (!mount) return;

    let active = true;
    const cleanupWidget = () => {
      active = false;
      if (turnstileWidgetId.current !== null) {
        window.turnstile?.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
    const render = () => {
      if (!active || !window.turnstile || turnstileWidgetId.current !== null) return;
      try {
        turnstileWidgetId.current = window.turnstile.render(mount, {
          sitekey: key,
          size: "compact",
          callback: (token) => { if (active) { setTurnstileToken(token); setCaptchaError(""); } },
          "expired-callback": () => { if (active) { setTurnstileToken(""); setCaptchaError("Verification expired. Please complete it again."); } },
          "error-callback": () => { if (active) { setTurnstileToken(""); setCaptchaError("Verification could not be completed. Please try again."); } },
        });
      } catch {
        if (active) setCaptchaError("Verification could not be loaded. Please refresh and try again.");
      }
    };
    const onScriptError = () => { if (active) setCaptchaError("Verification could not be loaded. Please refresh and try again."); };
    if (window.turnstile) render();
    else {
      let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", onScriptError);
      return () => {
        cleanupWidget();
        script?.removeEventListener("load", render);
        script?.removeEventListener("error", onScriptError);
      };
    }
    return cleanupWidget;
  }, []);

  function showFeedback(value: string, error = false) {
    setFeedback(value);
    setFeedbackIsError(error);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const validation = submissionError(form, message);
    if (validation) {
      showFeedback(validation.message, true);
      fieldRefs.current[validation.field]?.focus();
      return;
    }
    if (captchaError || !turnstileToken) {
      showFeedback(captchaError || "Please complete the verification before submitting.", true);
      return;
    }

    submissionInFlight.current = true;
    setSending(true);
    showFeedback("");
    try {
      const response = await fetch("/api/memorial/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: form.get("displayName"), location: form.get("location"), message, consent: true, website: form.get("website"), turnstileToken }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = await responseJson(response);
      if (!response.ok || data.ok !== true) throw new Error(typeof data.error === "string" ? data.error : "We could not send your message. Please try again.");
      formElement.reset();
      setMessage("");
      resetTurnstile();
      showFeedback("Thank you. Your message has been received and will appear here if approved.");
    } catch (error) {
      // Turnstile tokens are one-use. Keep the visitor's text but require a
      // fresh challenge for any retry after the request may have reached us.
      resetTurnstile();
      const message = error instanceof Error && !/^(failed to fetch|signal timed out)$/i.test(error.message)
        ? error.message
        : "We could not send your message. Please try again.";
      showFeedback(message, true);
    } finally {
      submissionInFlight.current = false;
      setSending(false);
    }
  }
  return <section id="messages" className="memorial-board" aria-labelledby="messages-heading">
    <div className="memorial-intro"><p className="section-label">Memorial guestbook</p><h2 id="messages-heading">Messages for Elijah</h2><p>Leave a few words about Elijah, his music, or what his work has meant to you.</p></div>
    <div className="memorial-layout"><form className="memorial-form" onSubmit={submit} noValidate><div><label htmlFor="displayName">Display Name</label><input id="displayName" name="displayName" required maxLength={60} autoComplete="name" ref={(element) => { fieldRefs.current.displayName = element; }} /></div><div><label htmlFor="location">Location <span>optional</span></label><input id="location" name="location" maxLength={80} autoComplete="address-level2" ref={(element) => { fieldRefs.current.location = element; }} /></div><div><label htmlFor="message">Message</label><textarea id="message" name="message" required maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} ref={(element) => { fieldRefs.current.message = element; }} /><p className="character-count">{message.length} / 1000</p></div><div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div><label className="consent"><input type="checkbox" name="consent" required ref={(element) => { fieldRefs.current.consent = element; }} /> <span>By submitting this message, I understand that it may be published publicly on NangSoul after review.</span></label><p className="memorial-note">Please do not include private contact information or sensitive personal information in your message.</p><p className="memorial-note">Messages are reviewed before publication. Spam, advertising, hateful content, impersonation, private information, or messages unrelated to Elijah and his work may not be published.</p><div ref={turnstileMount} />{captchaError && <p className="form-feedback" role="alert">{captchaError}</p>}<button className="button-primary" disabled={sending || message.length > MEMORIAL_LIMITS.message} type="submit">{sending ? "Sending…" : "Send message"}</button><p className="form-feedback" role={feedbackIsError ? "alert" : "status"} aria-live={feedbackIsError ? "assertive" : "polite"}>{feedback}</p></form>
      <div className="message-list" aria-live="polite">{messages.map((entry, index) => <article className="memorial-entry" key={`${entry.approvedAt}-${entry.displayName}-${index}`}><header><strong>{entry.displayName}</strong>{entry.location && <span>{entry.location}</span>}</header><p>{entry.message}</p><time dateTime={entry.approvedAt || undefined}>{date(entry.approvedAt)}</time></article>)}{messagesError && <div className="memorial-empty"><p>{messagesError}</p><button className="button-secondary" disabled={messagesLoading} onClick={() => load(0)} type="button">{messagesLoading ? "Trying again…" : "Try again"}</button></div>}{!messages.length && !messagesError && <p className="memorial-empty">{messagesLoading ? "Loading messages…" : "Approved messages will be preserved here."}</p>}{hasMore && <button className="button-secondary" disabled={messagesLoading} onClick={() => load(offset)} type="button">{messagesLoading ? "Loading…" : "Load more messages"}</button>}</div></div>
  </section>;
}
