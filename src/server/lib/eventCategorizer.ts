import Anthropic from "@anthropic-ai/sdk"
import { EVENT_CATEGORIES } from "../../shared/constants"

interface CategorizableEvent {
  id: string
  title: string
  description?: string
}

const SYSTEM_PROMPT = `You are an event categorizer for a community dashboard. Categorize each event into exactly one of these categories:

${EVENT_CATEGORIES.map((c) => `- ${c}`).join("\n")}

For each event, return a JSON object mapping event IDs to a single category string.
Pick the single most relevant category for each event.
Only use categories from the list above.
If unsure, use "Other".
Return ONLY valid JSON, no markdown or explanation.`

function buildUserPrompt(events: CategorizableEvent[]): string {
  const lines = events.map((e) => {
    const desc = e.description ? ` — ${e.description.slice(0, 200)}` : ""
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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
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
  const batchSize = 15

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize)
    log?.(
      `Categorizing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)} (${batch.length} events)`,
    )

    const batchResult = await categorizeBatch(client, batch, log)
    for (const [id, category] of batchResult) {
      result.set(id, category)
    }

    if (i + batchSize < events.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return result
}
