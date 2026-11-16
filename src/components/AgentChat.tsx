"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { from: "customer" | "agent"; text: string; bookingId?: number };

const SUGGESTIONS = ["What times are free tomorrow?", "How much does it cost?", "هل يوجد موعد اليوم؟"];

export default function AgentChat({
  providerId,
  providerName,
}: {
  providerId: number;
  providerName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setDraft("");
    setError(null);
    setPending(true);
    setMessages((m) => [...m, { from: "customer", text: message }]);
    try {
      const res = await fetch(`/api/agent/${providerId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        { from: "agent", text: data.reply, bookingId: data.booking?.id },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      // Put the message back so the customer can resend it.
      setMessages((m) => m.slice(0, -1));
      setDraft(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <header className="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <h2 className="font-bold text-stone-900 dark:text-stone-50">Chat with the front desk</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          An AI assistant for {providerName}. It can answer questions and book a time for you.
        </p>
      </header>

      <div ref={listRef} className="flex max-h-96 min-h-40 flex-col gap-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-brand dark:border-stone-700 dark:text-stone-200"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            dir="auto"
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
              m.from === "customer"
                ? "self-end bg-brand text-white"
                : "self-start bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-100"
            }`}
          >
            {m.text}
            {m.bookingId && (
              <a
                href={`/book/${providerId}/confirmation/${m.bookingId}`}
                className="mt-1 block font-semibold underline"
              >
                View booking
              </a>
            )}
          </div>
        ))}
        {pending && (
          <div className="self-start rounded-2xl bg-stone-100 px-4 py-2 text-sm text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            Typing…
          </div>
        )}
      </div>

      {error && (
        <p className="mx-4 mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex gap-2 border-t border-stone-200 p-3 dark:border-stone-800"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          dir="auto"
          placeholder="Ask a question or request a time"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-stone-200 px-4 py-2 text-sm dark:border-stone-700 dark:bg-stone-950"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
