import type Anthropic from "@anthropic-ai/sdk";
import {
  countAgentBookings,
  createBooking,
  createHandoff,
  getTakenTimes,
  isSlotTaken,
  type Provider,
} from "../db";
import { slotsNotStarted, upcomingDates } from "../slots";

/**
 * The only things the front-desk agent can do. Every rule that matters
 * (bookable dates, free slots, valid contact details) is enforced here in
 * code, so a confused or manipulated model cannot create a bad booking.
 */
export const AGENT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "check_availability",
    description:
      "List the free appointment times on one date. Call this before offering or booking a time; never guess availability.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date as YYYY-MM-DD" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "book_appointment",
    description:
      "Reserve an appointment. Call only after the customer has given their name and phone number and has explicitly confirmed the date and time.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date as YYYY-MM-DD" },
        time: { type: "string", description: "Start time as HH:MM, 24-hour" },
        customerName: { type: "string" },
        customerPhone: { type: "string" },
        note: {
          type: "string",
          description: "What the customer wants done, in their words. Empty string if nothing.",
        },
      },
      required: ["date", "time", "customerName", "customerPhone", "note"],
      additionalProperties: false,
    },
  },
  {
    name: "hand_off_to_provider",
    description:
      "Pass a question to the business owner when you cannot answer it from the business details you were given (custom quotes, discounts, complaints, anything unusual). The owner will contact the customer.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The customer's question, summarized" },
        customerName: { type: "string", description: "Empty string if unknown" },
        customerPhone: { type: "string", description: "Empty string if unknown" },
      },
      required: ["question", "customerName", "customerPhone"],
      additionalProperties: false,
    },
  },
];

const MAX_BOOKINGS_PER_CONVERSATION = 2;

export type ToolContext = { provider: Provider; conversationId: string; now: Date };

export type ToolOutcome = {
  /** JSON handed back to the model. */
  result: Record<string, unknown>;
  isError: boolean;
  booking?: { id: number; date: string; time: string };
  handoff?: boolean;
};

function fail(message: string): ToolOutcome {
  return { result: { error: message }, isError: true };
}

function str(input: Record<string, unknown>, key: string): string {
  const v = input[key];
  return typeof v === "string" ? v.trim() : "";
}

function freeTimes(ctx: ToolContext, date: string): string[] {
  const taken = new Set(getTakenTimes(ctx.provider.id, date));
  return slotsNotStarted(date, ctx.now).filter((t) => !taken.has(t));
}

export function runTool(name: string, rawInput: unknown, ctx: ToolContext): ToolOutcome {
  const input =
    rawInput && typeof rawInput === "object" ? (rawInput as Record<string, unknown>) : {};
  const dates = upcomingDates(undefined, ctx.now);

  if (name === "check_availability") {
    const date = str(input, "date");
    if (!dates.includes(date)) {
      return fail(`Bookings are only open for these dates: ${dates.join(", ")}.`);
    }
    return { result: { date, freeTimes: freeTimes(ctx, date) }, isError: false };
  }

  if (name === "book_appointment") {
    const date = str(input, "date");
    const time = str(input, "time");
    const customerName = str(input, "customerName").slice(0, 80);
    const customerPhone = str(input, "customerPhone");
    const note = str(input, "note").slice(0, 500);

    if (!dates.includes(date)) {
      return fail(`Bookings are only open for these dates: ${dates.join(", ")}.`);
    }
    if (customerName.length < 2) return fail("A customer name is required. Ask for it.");
    const digits = customerPhone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return fail("That phone number does not look valid. Ask the customer to repeat it.");
    }
    if (countAgentBookings(ctx.conversationId) >= MAX_BOOKINGS_PER_CONVERSATION) {
      return fail(
        "This chat has reached its booking limit. Offer to hand the request to the owner instead.",
      );
    }
    const free = freeTimes(ctx, date);
    if (!free.includes(time) || isSlotTaken(ctx.provider.id, date, time)) {
      return fail(`${time} on ${date} is not available. Free times: ${free.join(", ") || "none"}.`);
    }
    try {
      const id = createBooking({
        providerId: ctx.provider.id,
        customerName,
        customerPhone,
        date,
        time,
        note: note || undefined,
        status: "reserved",
        source: "agent",
        conversationId: ctx.conversationId,
      });
      return {
        result: { booked: true, bookingId: id, date, time, payment: "pay at the appointment" },
        isError: false,
        booking: { id, date, time },
      };
    } catch {
      // Lost a race for the slot (unique index on provider + date + time).
      return fail(`${time} on ${date} was just taken. Check availability again.`);
    }
  }

  if (name === "hand_off_to_provider") {
    const question = str(input, "question").slice(0, 500);
    if (!question) return fail("A question is required.");
    createHandoff({
      providerId: ctx.provider.id,
      conversationId: ctx.conversationId,
      question,
      customerName: str(input, "customerName").slice(0, 80) || undefined,
      customerPhone: str(input, "customerPhone").slice(0, 30) || undefined,
    });
    return { result: { passedToOwner: true }, isError: false, handoff: true };
  }

  return fail(`Unknown tool: ${name}`);
}
