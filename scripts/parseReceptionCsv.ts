#!/usr/bin/env bun

import { resolve } from "node:path"
import Anthropic from "@anthropic-ai/sdk"
import Papa from "papaparse"
import pc from "picocolors"
import {
  AI_BATCH_DELAY_MS,
  AI_CLASSIFY_BATCH_SIZE,
  AI_CONTENT_SLICE_LIMIT,
  AI_MAX_TOKENS,
  AI_RECEPTION_CLASSIFY_PROMPT,
  AI_RECEPTION_MODEL,
  AI_RETRY_DELAY_MS,
  MEMBER_INTEREST_CATEGORIES,
  MEMBER_SKILL_CATEGORIES,
} from "../src/shared/constants"
import {
  type CsvRow,
  cleanJsonResponse,
  getDateRange,
  progressBar,
} from "./shared/csv-utils"
import { createScriptRunner, type ScriptOptions } from "./shared/script-runner"

interface ClassifyResult {
  type: "intro" | "skip"
  skills: string[]
  interests: string[]
}

interface IntroData extends ClassifyResult {
  author: string
  authorId: string
}

async function classifyBatch(
  client: Anthropic,
  rows: { index: number; content: string }[],
): Promise<Record<number, ClassifyResult>> {
  const lines = rows.map(
    (r) => `[${r.index}]: ${r.content.slice(0, AI_CONTENT_SLICE_LIMIT)}`,
  )

  const response = await client.messages.create({
    model: AI_RECEPTION_MODEL,
    max_tokens: AI_MAX_TOKENS,
    system: AI_RECEPTION_CLASSIFY_PROMPT,
    messages: [
      {
        role: "user",
        content: `Classify these messages:\n\n${lines.join("\n\n")}`,
      },
    ],
  })

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : ""
  return JSON.parse(cleanJsonResponse(text))
}

async function crunchHandler(
  _options: ScriptOptions,
  config: { rootFolder: string },
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY env var is required")
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })
  const csvPath = resolve(config.rootFolder, "data", "reception.csv")
  const outputPath = resolve(
    config.rootFolder,
    "src",
    "shared",
    "stats",
    "reception.json",
  )

  // Phase 1: Parse CSV
  console.log(pc.cyan("Phase 1: Parsing CSV..."))
  const csvText = await Bun.file(csvPath).text()
  const { data: rows } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  console.log(pc.green(`  Parsed ${rows.length} messages\n`))

  // Phase 2: Classify messages
  console.log(pc.cyan("Phase 2: Classifying messages with AI..."))
  const intros: IntroData[] = []

  for (let i = 0; i < rows.length; i += AI_CLASSIFY_BATCH_SIZE) {
    const batch = rows.slice(i, i + AI_CLASSIFY_BATCH_SIZE)
    const batchItems = batch.map((row, idx) => ({
      index: i + idx,
      content: row.Content || "",
    }))

    const messagesProcessed = Math.min(i + AI_CLASSIFY_BATCH_SIZE, rows.length)
    progressBar(
      "Classifying messages",
      messagesProcessed,
      rows.length,
      `Intros: ${intros.length}`,
    )

    let result: Record<number, ClassifyResult> | null = null
    try {
      result = await classifyBatch(client, batchItems)
    } catch {
      await new Promise((r) => setTimeout(r, AI_RETRY_DELAY_MS))
      result = await classifyBatch(client, batchItems)
    }

    if (result) {
      for (const [idxStr, classification] of Object.entries(result)) {
        if (classification.type === "intro") {
          const rowIdx = Number(idxStr)
          const row = rows[rowIdx] || batch[rowIdx - i]
          intros.push({
            ...classification,
            author: row?.Author || "unknown",
            authorId: row?.AuthorID || "unknown",
          })
        }
      }
    }

    if (i + AI_CLASSIFY_BATCH_SIZE < rows.length) {
      await new Promise((r) => setTimeout(r, AI_BATCH_DELAY_MS))
    }
  }

  process.stdout.write("\n")
  console.log(
    pc.green(
      `  Found ${intros.length} intros out of ${rows.length} messages\n`,
    ),
  )

  // Phase 3: Aggregate & output
  console.log(pc.cyan("Phase 3: Aggregating results..."))

  const validSkillCategories = new Set<string>(MEMBER_SKILL_CATEGORIES)
  const validInterestCategories = new Set<string>(MEMBER_INTEREST_CATEGORIES)

  const skillCounts = new Map<string, number>()
  const interestCounts = new Map<string, number>()

  for (const intro of intros) {
    for (const category of intro.skills) {
      const valid = validSkillCategories.has(category) ? category : "Unknown"
      skillCounts.set(valid, (skillCounts.get(valid) || 0) + 1)
    }
    for (const category of intro.interests) {
      const valid = validInterestCategories.has(category) ? category : "Unknown"
      interestCounts.set(valid, (interestCounts.get(valid) || 0) + 1)
    }
  }

  const { firstDate, lastDate } = getDateRange(rows)

  const output = {
    generatedAt: new Date().toISOString(),
    totalMessages: rows.length,
    totalIntros: intros.length,
    firstDate,
    lastDate,
    skillCategories: Object.fromEntries(
      [...skillCounts.entries()].sort((a, b) => b[1] - a[1]),
    ),
    interestCategories: Object.fromEntries(
      [...interestCounts.entries()].sort((a, b) => b[1] - a[1]),
    ),
  }

  await Bun.write(outputPath, JSON.stringify(output, null, 2))
  console.log(pc.green(`  Written to ${outputPath}`))
  console.log(
    pc.green(
      `  ${Object.keys(output.skillCategories).length} skill categories, ${Object.keys(output.interestCategories).length} interest categories\n`,
    ),
  )
  console.log(pc.cyan("Done!"))
}

createScriptRunner(
  {
    name: "Crunch Data",
    description:
      "Classify Discord reception messages and aggregate stats using AI",
    env: "development",
  },
  crunchHandler,
)
