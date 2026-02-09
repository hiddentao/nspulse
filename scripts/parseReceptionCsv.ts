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
  AI_MODEL,
  AI_RECEPTION_CLASSIFY_PROMPT,
  AI_RETRY_DELAY_MS,
  MEMBER_INTEREST_CATEGORIES,
  MEMBER_SKILL_CATEGORIES,
} from "../src/shared/constants"
import { createScriptRunner, type ScriptOptions } from "./shared/script-runner"

const BAR_WIDTH = 30

interface CsvRow {
  AuthorID: string
  Author: string
  Date: string
  Content: string
  Attachments: string
  Reactions: string
}

interface ClassifyResult {
  type: "intro" | "skip"
  skills: string
  interests: string
}

interface IntroData extends ClassifyResult {
  author: string
  authorId: string
}

function progressBar(
  label: string,
  current: number,
  total: number,
  extra = "",
) {
  const pct = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * BAR_WIDTH)
  const bar =
    pc.green("█".repeat(filled)) + pc.gray("░".repeat(BAR_WIDTH - filled))
  const line = `${pc.cyan(label)}  ${bar}  ${pc.bold(pc.white(`${pct}%`))} (${current}/${total})${extra ? `  ${extra}` : ""}`
  process.stdout.write(`\r${line}`)
}

function cleanJsonResponse(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim()
}

function splitTerms(raw: string): string[] {
  if (!raw || raw === "-") return []
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

async function classifyBatch(
  client: Anthropic,
  rows: { index: number; date: string; content: string }[],
): Promise<Record<number, ClassifyResult>> {
  const lines = rows.map(
    (r) => `[${r.index}]: ${r.content.slice(0, AI_CONTENT_SLICE_LIMIT)}`,
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

async function categorizeBatch(
  client: Anthropic,
  terms: string[],
  termType: "skills" | "interests",
): Promise<Record<string, string>> {
  const categories =
    termType === "skills" ? MEMBER_SKILL_CATEGORIES : MEMBER_INTEREST_CATEGORIES

  const categoryList = categories.filter((c) => c !== "Unknown").join(", ")

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    system: `You categorize ${termType} terms into predefined categories. You MUST use ONLY these exact category names: ${categoryList}. If a term does not fit any category, map it to "Unknown".\n\nReturn a JSON object mapping each input term (lowercase) to its category string. Return ONLY valid JSON, no markdown or explanation.`,
    messages: [
      {
        role: "user",
        content: `Categorize these ${termType}:\n\n${terms.join("\n")}`,
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
      date: row.Date?.split("T")[0] || "unknown",
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
      try {
        result = await classifyBatch(client, batchItems)
      } catch {
        // Skip this batch on second failure
      }
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

  // Phase 3: Categorize skills & interests
  console.log(pc.cyan("Phase 3: Categorizing skills & interests with AI..."))

  const allSkills = new Set<string>()
  const allInterests = new Set<string>()
  for (const intro of intros) {
    for (const s of splitTerms(intro.skills)) allSkills.add(s)
    for (const i of splitTerms(intro.interests)) allInterests.add(i)
  }

  const skillTerms = [...allSkills]
  const interestTerms = [...allInterests]

  let skillMapping: Record<string, string> = {}
  let interestMapping: Record<string, string> = {}

  console.log(pc.gray(`  Categorizing ${skillTerms.length} skill terms...`))
  try {
    skillMapping = await categorizeBatch(client, skillTerms, "skills")
  } catch {
    console.log(pc.yellow("  Failed to categorize skills"))
  }

  console.log(
    pc.gray(`  Categorizing ${interestTerms.length} interest terms...`),
  )
  try {
    interestMapping = await categorizeBatch(client, interestTerms, "interests")
  } catch {
    console.log(pc.yellow("  Failed to categorize interests"))
  }

  console.log(
    pc.green(
      `  Mapped ${Object.keys(skillMapping).length} skills, ${Object.keys(interestMapping).length} interests\n`,
    ),
  )

  // Phase 4: Aggregate & output
  console.log(pc.cyan("Phase 4: Aggregating results..."))

  const validSkillCategories = new Set<string>(MEMBER_SKILL_CATEGORIES)
  const validInterestCategories = new Set<string>(MEMBER_INTEREST_CATEGORIES)

  const skillCounts = new Map<string, number>()
  const interestCounts = new Map<string, number>()

  for (const intro of intros) {
    for (const raw of splitTerms(intro.skills)) {
      const mapped = skillMapping[raw] || "Unknown"
      const category = validSkillCategories.has(mapped) ? mapped : "Unknown"
      skillCounts.set(category, (skillCounts.get(category) || 0) + 1)
    }

    for (const raw of splitTerms(intro.interests)) {
      const mapped = interestMapping[raw] || "Unknown"
      const category = validInterestCategories.has(mapped) ? mapped : "Unknown"
      interestCounts.set(category, (interestCounts.get(category) || 0) + 1)
    }
  }

  const dates = rows
    .map((r) => r.Date?.split("T")[0])
    .filter(Boolean)
    .sort()
  const firstDate = dates[0] || ""
  const lastDate = dates[dates.length - 1] || ""

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
