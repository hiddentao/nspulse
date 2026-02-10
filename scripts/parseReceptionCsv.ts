#!/usr/bin/env bun

import { resolve } from "node:path"
import Anthropic from "@anthropic-ai/sdk"
import Papa from "papaparse"
import pc from "picocolors"
import {
  AI_CLASSIFY_BATCH_SIZE,
  AI_CONTENT_SLICE_LIMIT,
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_RECEPTION_CLASSIFY_PROMPT,
  MEMBER_INTEREST_CATEGORIES,
  MEMBER_SKILL_CATEGORIES,
} from "../src/shared/constants"
import {
  type CsvRow,
  cleanJsonResponse,
  clearProgress,
  createAnthropicClient,
  getDateRange,
  runBatches,
  safeSlice,
  sanitizeForApi,
} from "./shared/parserShared"
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
    (r) => `[${r.index}]: ${safeSlice(r.content, AI_CONTENT_SLICE_LIMIT)}`,
  )

  const response = await client.messages.create({
    model: AI_MODEL,
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
  const client = createAnthropicClient()
  const csvPath = resolve(config.rootFolder, "data", "reception.csv")
  const outputPath = resolve(
    config.rootFolder,
    "src",
    "shared",
    "stats",
    "reception.json",
  )
  const progressFile = resolve(config.rootFolder, ".parseReception.progress")

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

  const intros = await runBatches<IntroData[]>({
    label: "Classifying messages",
    batchSize: AI_CLASSIFY_BATCH_SIZE,
    total: rows.length,
    progressFile,
    initial: [],
    extra: (accum) => `Intros: ${accum.length}`,
    processBatch: async (startIndex, accum) => {
      const batch = rows.slice(startIndex, startIndex + AI_CLASSIFY_BATCH_SIZE)
      const batchItems = batch.map((row, idx) => ({
        index: startIndex + idx,
        content: sanitizeForApi(row.Content || ""),
      }))

      const result = await classifyBatch(client, batchItems)
      const newIntros: IntroData[] = []

      if (result) {
        for (const [idxStr, classification] of Object.entries(result)) {
          if (classification.type === "intro") {
            const rowIdx = Number(idxStr)
            const row = rows[rowIdx] || batch[rowIdx - startIndex]
            newIntros.push({
              ...classification,
              author: row?.Author || "unknown",
              authorId: row?.AuthorID || "unknown",
            })
          }
        }
      }

      return [...accum, ...newIntros]
    },
  })

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
  await clearProgress(progressFile)
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
