/**
 * Exercises the agent loop and its tools with a scripted stand-in for the
 * model, against a throwaway database. Run: npm run test:agent
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), "agent-test-")));

type Block = Record<string, unknown>;
const reply = (content: Block[], stop_reason: string) =>
  ({ content, stop_reason }) as unknown as Anthropic.Beta.BetaMessage;
const text = (t: string) => reply([{ type: "text", text: t }], "end_turn");
const call = (name: string, input: unknown, id = `tu_${name}_${Math.random()}`) =>
  reply([{ type: "tool_use", id, name, input }], "tool_use");

async function main() {
  const db = await import("../src/lib/db");
  const { runTurn, AgentError } = await import("../src/lib/agent/engine");
  const { upcomingDates } = await import("../src/lib/slots");

  const provider = db.getAllProviders()[0];
  const now = new Date("2026-11-16T08:00:00Z");
  const [today, tomorrow] = upcomingDates(undefined, now);

  /** Plays back `steps` and records the tool results the engine sends. */
  function scripted(steps: Anthropic.Beta.BetaMessage[]) {
    const seen: string[] = [];
    const callModel = async ({ messages }: { messages: Anthropic.Beta.BetaMessageParam[] }) => {
      const last = messages[messages.length - 1];
      if (Array.isArray(last.content)) {
        for (const b of last.content) {
          if (b.type === "tool_result") seen.push(String(b.content));
        }
      }
      const next = steps.shift();
      if (!next) throw new Error("model called more often than scripted");
      return next;
    };
    return { callModel, seen };
  }

  // 1. Plain answer, conversation is created and stored.
  let s = scripted([text("We charge $25 per session.")]);
  const first = await runTurn({ provider, text: "How much?", now, ...s });
  assert.equal(first.reply, "We charge $25 per session.");
  assert.equal(db.getConversationMessages(first.conversationId).length, 2);

  // 2. Availability then booking, in the same conversation.
  s = scripted([
    call("check_availability", { date: tomorrow }),
    call("book_appointment", {
      date: tomorrow,
      time: "10:00",
      customerName: "Sara Ali",
      customerPhone: "+971 50 123 4567",
      note: "First session",
    }),
    text("Booked for 10:00 tomorrow."),
  ]);
  const booked = await runTurn({
    provider, conversationId: first.conversationId, text: "Book 10 tomorrow", now, ...s,
  });
  assert.ok(booked.booking, "booking should be reported");
  assert.match(s.seen[0], /"10:00"/);
  const row = db.getBookingById(booked.booking.id)!;
  assert.deepEqual(
    [row.date, row.time, row.status, row.source, row.conversationId],
    [tomorrow, "10:00", "reserved", "agent", first.conversationId],
  );
  // user, assistant, user, tool call, result, tool call, result, assistant
  assert.equal(db.getConversationMessages(first.conversationId).length, 8);

  // 3. The same slot cannot be booked twice; availability no longer lists it.
  s = scripted([
    call("book_appointment", {
      date: tomorrow, time: "10:00", customerName: "Omar", customerPhone: "0501234567", note: "",
    }),
    call("check_availability", { date: tomorrow }),
    text("Sorry, 10:00 is taken."),
  ]);
  const clash = await runTurn({ provider, text: "10 tomorrow please", now, ...s });
  assert.equal(clash.booking, undefined);
  assert.match(s.seen[0], /not available/);
  assert.doesNotMatch(s.seen[1], /"10:00"/);

  // 4. Bad inputs are rejected in code, whatever the model sends.
  s = scripted([
    call("book_appointment", { date: "2031-01-01", time: "10:00", customerName: "A B", customerPhone: "0501234567", note: "" }),
    call("book_appointment", { date: tomorrow, time: "03:30", customerName: "A B", customerPhone: "0501234567", note: "" }),
    call("book_appointment", { date: tomorrow, time: "11:00", customerName: "A B", customerPhone: "12", note: "" }),
    call("book_appointment", { date: today, time: "08:00", customerName: "A B", customerPhone: "0501234567", note: "" }),
    call("drop_tables", {}),
    text("I could not book that."),
  ]);
  const bad = await runTurn({ provider, text: "book something odd", now, ...s });
  assert.equal(bad.booking, undefined);
  assert.equal(s.seen.length, 5);
  for (const r of s.seen) assert.match(r, /"error"/);

  // 5. Handoff is recorded for the provider.
  s = scripted([
    call("hand_off_to_provider", { question: "Group discount for 5?", customerName: "Lina", customerPhone: "0551112222" }),
    text("I've passed that to the owner."),
  ]);
  const handoff = await runTurn({ provider, text: "discount for 5 people?", now, ...s });
  assert.equal(handoff.handedOff, true);
  assert.equal(db.getHandoffsForProvider(provider.id)[0].question, "Group discount for 5?");

  // 6. A model that never stops calling tools is cut off with a safe reply.
  s = scripted(Array.from({ length: 6 }, () => call("check_availability", { date: tomorrow })));
  const loop = await runTurn({ provider, text: "hi", now, ...s });
  assert.match(loop.reply, /couldn't finish/);
  const stored = db.getConversationMessages(loop.conversationId);
  assert.equal(stored[stored.length - 1].role, "assistant");

  // 7. Model failure after a booking still tells the customer it is reserved,
  //    and the stored conversation stays replayable.
  let n = 0;
  const flaky = async () => {
    if (n++ === 0) {
      return call("book_appointment", {
        date: tomorrow, time: "14:00", customerName: "Huda", customerPhone: "0509998888", note: "",
      });
    }
    throw new Error("network down");
  };
  const partial = await runTurn({ provider, text: "2pm tomorrow, Huda 0509998888, yes confirm", now, callModel: flaky });
  assert.ok(partial.booking);
  assert.match(partial.reply, /reserved for .* at 14:00/);
  s = scripted([text("See you then.")]);
  await runTurn({ provider, conversationId: partial.conversationId, text: "thanks", now, ...s });

  // 8. Model failure before anything happened surfaces as "unavailable".
  await assert.rejects(
    runTurn({ provider, text: "hello", now, callModel: async () => { throw new Error("down"); } }),
    (e: unknown) => e instanceof AgentError && e.code === "unavailable",
  );

  // 9. Input limits and conversation ownership.
  await assert.rejects(runTurn({ provider, text: "x".repeat(1001), now, ...scripted([]) }));
  const other = db.getAllProviders()[1];
  await assert.rejects(
    runTurn({ provider: other, conversationId: first.conversationId, text: "hi", now, ...scripted([]) }),
    (e: unknown) => e instanceof AgentError && e.code === "not_found",
  );

  console.log("agent tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
