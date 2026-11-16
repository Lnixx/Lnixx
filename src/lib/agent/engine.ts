import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import {
  appendConversationMessages,
  createConversation,
  getConversation,
  getConversationMessages,
  type Provider,
  type StoredMessage,
} from "../db";
import { buildSystemPrompt } from "./prompt";
import { AGENT_TOOLS, runTool } from "./tools";

type BetaMessage = Anthropic.Beta.BetaMessage;
type BetaMessageParam = Anthropic.Beta.BetaMessageParam;

/** One model request. Injectable so the loop can be tested without the API. */
export type CallModel = (params: {
  system: string;
  messages: BetaMessageParam[];
}) => Promise<BetaMessage>;

export const MAX_MESSAGE_LENGTH = 1000;
const MAX_STORED_MESSAGES = 120; // caps the length, and so the cost, of one chat
const MAX_STEPS = 6; // model requests per customer message

const MODEL = process.env.AGENT_MODEL || "claude-opus-5-5";

let client: Anthropic | undefined;

const callClaude: CallModel = ({ system, messages }) => {
  client ??= new Anthropic();
  return client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // Short receptionist replies: low effort keeps answers fast and cheap.
    output_config: { effort: "low" },
    // If the model declines a request, the API retries it on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    tools: AGENT_TOOLS,
    messages,
  });
};

export class AgentError extends Error {
  constructor(
    public code: "bad_request" | "not_found" | "too_long" | "unavailable",
    message: string,
  ) {
    super(message);
  }
}

export type TurnResult = {
  conversationId: string;
  reply: string;
  booking?: { id: number; date: string; time: string };
  handedOff: boolean;
};

const FALLBACK_REPLY =
  "Sorry, I couldn't finish that. Please try again, or use the Book Now button to pick a time yourself.";

function textOf(message: BetaMessage): string {
  return message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/**
 * Handles one customer message: replays the stored conversation, lets the
 * model answer and call tools until it is done, and saves the new messages.
 */
export async function runTurn(input: {
  provider: Provider;
  conversationId?: string;
  text: string;
  callModel?: CallModel;
  now?: Date;
}): Promise<TurnResult> {
  const { provider } = input;
  const callModel = input.callModel ?? callClaude;
  const now = input.now ?? new Date();
  const text = input.text.trim();

  if (!text) throw new AgentError("bad_request", "Message is empty.");
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new AgentError("bad_request", `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const isNew = !input.conversationId;
  const conversationId = input.conversationId ?? randomUUID();
  if (!isNew) {
    const existing = getConversation(conversationId);
    if (!existing || existing.providerId !== provider.id) {
      throw new AgentError("not_found", "Conversation not found.");
    }
  }

  const history = isNew ? [] : getConversationMessages(conversationId);
  if (history.length >= MAX_STORED_MESSAGES) {
    throw new AgentError(
      "too_long",
      "This chat has reached its limit. Please start a new one or use the Book Now button.",
    );
  }

  const system = buildSystemPrompt(provider, now);
  const messages = history as BetaMessageParam[];
  const added: StoredMessage[] = [{ role: "user", content: text }];
  messages.push({ role: "user", content: text });

  const result: TurnResult = { conversationId, reply: "", handedOff: false };
  // How many of `added` form a replayable history: it must never end on an
  // assistant tool call that has no result.
  let safeLength = 0;

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await callModel({ system, messages });

      if (response.stop_reason === "refusal") break;

      const toolUses = response.content.filter(
        (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
      );

      // Content goes back exactly as received (thinking blocks included).
      messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
      added.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        if (toolUses.length === 0) {
          result.reply = textOf(response);
          safeLength = added.length;
        } else {
          // Cut off mid tool call (max_tokens): drop the unfinished assistant turn.
          added.pop();
        }
        break;
      }

      const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((use) => {
        const outcome = runTool(use.name, use.input, { provider, conversationId, now });
        if (outcome.booking) result.booking = outcome.booking;
        if (outcome.handoff) result.handedOff = true;
        return {
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(outcome.result),
          is_error: outcome.isError,
        };
      });
      messages.push({ role: "user", content: toolResults });
      added.push({ role: "user", content: toolResults });
      safeLength = added.length;
    }
  } catch (err) {
    console.error("[agent] model call failed", err);
    if (!result.booking && !result.handedOff) {
      // Nothing happened yet: leave the conversation untouched so a retry is clean.
      throw new AgentError("unavailable", "The assistant is unavailable right now.");
    }
  }

  // A new conversation is stored only once it has a reply to go with it.
  if (isNew) createConversation(conversationId, provider.id);

  if (!result.reply) {
    // The loop ended without a final answer. Never leave the customer unsure
    // about something that already happened.
    if (result.booking) {
      result.reply = `Your appointment is reserved for ${result.booking.date} at ${result.booking.time}. You pay at the appointment.`;
    } else if (result.handedOff) {
      result.reply = "I've passed your question to the owner, who will get back to you.";
    } else {
      result.reply = FALLBACK_REPLY;
    }
    const kept = added.slice(0, safeLength);
    if (kept.length === 0) kept.push(added[0]);
    kept.push({ role: "assistant", content: [{ type: "text", text: result.reply }] });
    appendConversationMessages(conversationId, kept);
  } else {
    appendConversationMessages(conversationId, added);
  }

  return result;
}
