import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBookingsForProvider,
  getConversationMessages,
  getConversationsForProvider,
  getHandoffsForProvider,
  getProviderById,
} from "@/lib/db";

export const dynamic = "force-dynamic";

/** The readable lines of a stored conversation (tool traffic left out). */
function transcript(conversationId: string): { role: string; text: string }[] {
  const lines: { role: string; text: string }[] = [];
  for (const m of getConversationMessages(conversationId)) {
    const text =
      typeof m.content === "string"
        ? m.content
        : (m.content as { type: string; text?: string }[])
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("");
    if (text.trim()) lines.push({ role: m.role === "user" ? "Customer" : "Agent", text });
  }
  return lines;
}

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { id } = await params;
  const { key } = await searchParams;

  // The inbox shows customer phone numbers. Until providers have real logins
  // it is opened with a shared key (INBOX_KEY), and is open only in development.
  const inboxKey = process.env.INBOX_KEY;
  const allowed = inboxKey ? key === inboxKey : process.env.NODE_ENV !== "production";
  if (!allowed) notFound();

  const provider = getProviderById(Number(id));
  if (!provider) notFound();

  const handoffs = getHandoffsForProvider(provider.id);
  const bookings = getBookingsForProvider(provider.id);
  const conversations = getConversationsForProvider(provider.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href={`/provider/${provider.id}`} className="text-sm text-brand hover:underline">
        ← {provider.name}
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-stone-900 dark:text-stone-50">Front desk inbox</h1>
      <p className="mt-1 text-stone-600 dark:text-stone-300">
        What your AI front desk has done for {provider.name}.
      </p>

      <h2 className="mt-10 text-lg font-bold text-stone-900 dark:text-stone-50">
        Needs your reply ({handoffs.length})
      </h2>
      {handoffs.length === 0 && <p className="mt-2 text-sm text-stone-500">Nothing waiting.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {handoffs.map((h) => (
          <li key={h.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
            <p dir="auto" className="font-medium text-stone-900 dark:text-stone-50">{h.question}</p>
            <p className="mt-1 text-stone-600 dark:text-stone-300">
              {h.customerName || "No name"} · {h.customerPhone || "no phone"} · {h.createdAt}
            </p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-bold text-stone-900 dark:text-stone-50">
        Bookings ({bookings.length})
      </h2>
      {bookings.length === 0 && <p className="mt-2 text-sm text-stone-500">No bookings yet.</p>}
      <ul className="mt-3 flex flex-col gap-2">
        {bookings.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-stone-200 p-3 text-sm dark:border-stone-800">
            <span className="font-semibold">{b.date} {b.time}</span>
            <span>{b.customerName} · {b.customerPhone}</span>
            {b.note && <span dir="auto" className="text-stone-500">{b.note}</span>}
            <span className="ml-auto rounded-full bg-stone-100 px-2 py-0.5 text-xs dark:bg-stone-800">
              {b.source === "agent" ? "booked by agent · pays on arrival" : "web · paid"}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-bold text-stone-900 dark:text-stone-50">
        Conversations ({conversations.length})
      </h2>
      {conversations.length === 0 && <p className="mt-2 text-sm text-stone-500">No chats yet.</p>}
      <div className="mt-3 flex flex-col gap-2">
        {conversations.map((c) => {
          const lines = transcript(c.id);
          return (
            <details key={c.id} className="rounded-xl border border-stone-200 p-3 text-sm dark:border-stone-800">
              <summary className="cursor-pointer">
                <span className="font-medium">{c.updatedAt}</span>
                <span dir="auto" className="ml-2 text-stone-500">{lines[0]?.text.slice(0, 80)}</span>
              </summary>
              <div className="mt-3 flex flex-col gap-2">
                {lines.map((l, i) => (
                  <p key={i} dir="auto" className="whitespace-pre-wrap">
                    <span className="font-semibold">{l.role}: </span>
                    {l.text}
                  </p>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
