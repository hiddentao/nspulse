import Anthropic from "@anthropic-ai/sdk"
import {
  AI_BATCH_DELAY_MS,
  AI_CATEGORIZE_BATCH_SIZE,
  AI_DESCRIPTION_SLICE_LIMIT,
  AI_EVENT_CATEGORIZE_PROMPT,
  AI_MAX_TOKENS,
  AI_MODEL,
  EVENT_CATEGORIES,
} from "../../shared/constants"

interface CategorizableEvent {
  id: string
  title: string
  description?: string
}

function buildUserPrompt(events: CategorizableEvent[]): string {
  const lines = events.map((e) => {
    const desc = e.description
      ? ` — ${e.description.slice(0, AI_DESCRIPTION_SLICE_LIMIT)}`
      : ""
    return `${e.id}: ${e.title}${desc}`
  })
  return `Categorize these events:\n\n${lines.join("\n")}`
}

async function categorizeBatch(
  client: Anthropic,
  batch: CategorizableEvent[],
  log?: (...args: any[]) => void,
): Promise<Map<string, string>> {
  const result = new Map<string, string>()

  try {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system: AI_EVENT_CATEGORIZE_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(batch) }],
    })

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : ""

    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim()
    const parsed = JSON.parse(cleaned) as Record<string, string>

    for (const [id, category] of Object.entries(parsed)) {
      if (
        typeof category === "string" &&
        EVENT_CATEGORIES.includes(category as any)
      ) {
        result.set(id, category)
      }
    }
  } catch (err) {
    log?.("Categorization batch failed:", err)
    throw err
  }

  return result
}

export async function categorizeEvents(
  events: CategorizableEvent[],
  apiKey: string,
  log?: (...args: any[]) => void,
): Promise<Map<string, string>> {
  const client = new Anthropic({ apiKey })
  const result = new Map<string, string>()
  for (let i = 0; i < events.length; i += AI_CATEGORIZE_BATCH_SIZE) {
    const batch = events.slice(i, i + AI_CATEGORIZE_BATCH_SIZE)
    log?.(
      `Categorizing batch ${Math.floor(i / AI_CATEGORIZE_BATCH_SIZE) + 1}/${Math.ceil(events.length / AI_CATEGORIZE_BATCH_SIZE)} (${batch.length} events)`,
    )

    const batchResult = await categorizeBatch(client, batch, log)
    for (const [id, category] of batchResult) {
      result.set(id, category)
    }

    if (i + AI_CATEGORIZE_BATCH_SIZE < events.length) {
      await new Promise((resolve) => setTimeout(resolve, AI_BATCH_DELAY_MS))
    }
  }

  return result
}
