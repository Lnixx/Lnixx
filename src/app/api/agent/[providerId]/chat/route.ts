import { getProviderById } from "@/lib/db";
import { AgentError, runTurn } from "@/lib/agent/engine";

const STATUS: Record<AgentError["code"], number> = {
  bad_request: 400,
  not_found: 404,
  too_long: 409,
  unavailable: 503,
};

// A small per-address limit so one visitor cannot run up the model bill.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const cutoff = Date.now() - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  recent.push(Date.now());
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const { providerId } = await params;
  const provider = getProviderById(Number(providerId));
  if (!provider) return Response.json({ error: "Provider not found." }, { status: 404 });

  const address = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(`${address}:${provider.id}`)) {
    return Response.json(
      { error: "Too many messages. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: { message?: unknown; conversationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await runTurn({
      provider,
      text: typeof body.message === "string" ? body.message : "",
      conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined,
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof AgentError) {
      return Response.json({ error: err.message }, { status: STATUS[err.code] });
    }
    console.error("[agent] unexpected error", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
