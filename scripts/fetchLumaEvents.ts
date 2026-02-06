import { categorizeEvents } from "../src/server/lib/eventCategorizer"
import { eventKey, fetchLumaEvents } from "../src/server/lib/luma"

const args = process.argv.slice(2)
const afterIdx = args.indexOf("--after")
const afterDate =
  afterIdx >= 0 && args[afterIdx + 1]
    ? new Date(args[afterIdx + 1]!)
    : undefined
const shouldCategorize = args.includes("--categorize")

const log = (...msgs: any[]) => console.log(...msgs)

async function main() {
  log("Fetching events from Luma...")
  if (afterDate) {
    log(`  Filtering events after: ${afterDate.toISOString()}`)
  }

  const events = await fetchLumaEvents({ afterDate, log })
  log(`\nTotal events fetched: ${events.length}\n`)

  for (const event of events) {
    const date = event.startTime.toISOString().split("T")[0]
    log(`  [${date}] ${event.title}`)
  }

  if (shouldCategorize) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      log("\nError: ANTHROPIC_API_KEY env var required for --categorize")
      process.exit(1)
    }

    log("\nCategorizing events with AI...")
    const eventsToCateg = events.map((e) => ({
      id: eventKey(e),
      title: e.title,
      description: e.description,
    }))

    const categoryMap = await categorizeEvents(eventsToCateg, apiKey, log)

    log("\nCategory breakdown:")
    const counts = new Map<string, number>()
    for (const cats of categoryMap.values()) {
      for (const cat of cats) {
        counts.set(cat, (counts.get(cat) || 0) + 1)
      }
    }

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    for (const [cat, count] of sorted) {
      log(`  ${cat}: ${count}`)
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
