#!/usr/bin/env bun

import { resolve } from "node:path"
import Anthropic from "@anthropic-ai/sdk"
import Papa from "papaparse"
import pc from "picocolors"
import { createScriptRunner, type ScriptOptions } from "./shared/script-runner"

const MODEL = "claude-haiku-4-5-20251001"
const CLASSIFY_BATCH_SIZE = 10
const CATEGORY_BATCH_SIZE = 50
const BATCH_DELAY_MS = 500
const RETRY_DELAY_MS = 2000
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
  country: string
  skills: string
  interests: string
  when: string
}

interface IntroData extends ClassifyResult {
  author: string
  authorId: string
}

interface MonthData {
  month: string
  totalIntros: number
  countries: Record<string, number>
  skillCategories: Record<string, number>
  interestCategories: Record<string, number>
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

const CLASSIFY_SYSTEM_PROMPT = `You classify Discord messages from a community reception channel. Each message has an index and a post date.

For each message, return a JSON object keyed by index with:
- "type": "intro" if the person is introducing themselves, otherwise "skip"
- "country": 2-letter ISO country code based on where they say they're from, or "-" if not stated or ambiguous (use "-" for regional areas like EU/Europe/Asia)
- "skills": comma-separated skills/expertise they mention, or "-"
- "interests": comma-separated interests/hobbies they mention, or "-"
- "when": the month they plan to attend in "MMM YYYY" format (e.g. "Sep 2024"), or "-" if not mentioned. Use the post date to resolve relative dates like "next month" or "this September".

Return ONLY valid JSON, no markdown or explanation.`

async function classifyBatch(
  client: Anthropic,
  rows: { index: number; date: string; content: string }[],
): Promise<Record<number, ClassifyResult>> {
  const lines = rows.map(
    (r) => `[${r.index}] (posted ${r.date}): ${r.content.slice(0, 500)}`,
  )

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: CLASSIFY_SYSTEM_PROMPT,
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
  const context =
    termType === "skills"
      ? "Map each skill/expertise term to a broad category. Aim for 8-15 categories like: Software Engineering, Crypto & Web3, Design & Creative, Marketing & Growth, Finance & Trading, Data & AI, Product Management, Research & Academia, Healthcare, Law & Policy, Content Creation, Education, Business & Entrepreneurship, Operations."
      : "Map each interest/hobby term to a broad category. Aim for 8-15 categories like: Health & Fitness, Networking & Community, Technology, Travel & Culture, Arts & Music, Gaming, Sports, Reading & Learning, Nature & Outdoors, Food & Cooking, Philosophy & Mindfulness, Social Impact, Finance & Investing."

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You categorize terms into broad categories. ${context}\n\nReturn a JSON object mapping each input term (lowercase) to its broad category string. Return ONLY valid JSON, no markdown or explanation.`,
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

function parseMonth(monthStr: string): Date | null {
  if (!monthStr || monthStr === "-") return null
  const parsed = new Date(`1 ${monthStr}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

  for (let i = 0; i < rows.length; i += CLASSIFY_BATCH_SIZE) {
    const batch = rows.slice(i, i + CLASSIFY_BATCH_SIZE)
    const batchItems = batch.map((row, idx) => ({
      index: i + idx,
      date: row.Date?.split("T")[0] || "unknown",
      content: row.Content || "",
    }))

    const messagesProcessed = Math.min(i + CLASSIFY_BATCH_SIZE, rows.length)
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
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
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

    if (i + CLASSIFY_BATCH_SIZE < rows.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
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

  const skillMapping: Record<string, string> = {}
  const interestMapping: Record<string, string> = {}

  const skillTerms = [...allSkills]
  const interestTerms = [...allInterests]

  const totalCategBatches =
    Math.ceil(skillTerms.length / CATEGORY_BATCH_SIZE) +
    Math.ceil(interestTerms.length / CATEGORY_BATCH_SIZE)
  let categBatchNum = 0

  for (let i = 0; i < skillTerms.length; i += CATEGORY_BATCH_SIZE) {
    const batch = skillTerms.slice(i, i + CATEGORY_BATCH_SIZE)
    categBatchNum++
    progressBar("Categorizing terms", categBatchNum, totalCategBatches)

    try {
      const result = await categorizeBatch(client, batch, "skills")
      Object.assign(skillMapping, result)
    } catch {
      // Skip failed batch
    }

    if (i + CATEGORY_BATCH_SIZE < skillTerms.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  for (let i = 0; i < interestTerms.length; i += CATEGORY_BATCH_SIZE) {
    const batch = interestTerms.slice(i, i + CATEGORY_BATCH_SIZE)
    categBatchNum++
    progressBar("Categorizing terms", categBatchNum, totalCategBatches)

    try {
      const result = await categorizeBatch(client, batch, "interests")
      Object.assign(interestMapping, result)
    } catch {
      // Skip failed batch
    }

    if (i + CATEGORY_BATCH_SIZE < interestTerms.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  process.stdout.write("\n")
  console.log(
    pc.green(
      `  Mapped ${Object.keys(skillMapping).length} skills, ${Object.keys(interestMapping).length} interests\n`,
    ),
  )

  // Phase 4: Aggregate & output
  console.log(pc.cyan("Phase 4: Aggregating results..."))

  const monthMap = new Map<
    string,
    {
      countries: Map<string, number>
      skills: Map<string, number>
      interests: Map<string, number>
    }
  >()

  for (const intro of intros) {
    const month = intro.when || "-"
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        countries: new Map(),
        skills: new Map(),
        interests: new Map(),
      })
    }
    const data = monthMap.get(month)!

    if (intro.country && intro.country !== "-") {
      data.countries.set(
        intro.country,
        (data.countries.get(intro.country) || 0) + 1,
      )
    }

    for (const raw of splitTerms(intro.skills)) {
      const category = skillMapping[raw] || "Other"
      data.skills.set(category, (data.skills.get(category) || 0) + 1)
    }

    for (const raw of splitTerms(intro.interests)) {
      const category = interestMapping[raw] || "Other"
      data.interests.set(category, (data.interests.get(category) || 0) + 1)
    }
  }

  const sortedMonths = [...monthMap.keys()].sort((a, b) => {
    if (a === "-") return 1
    if (b === "-") return -1
    const da = parseMonth(a)
    const db = parseMonth(b)
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return da.getTime() - db.getTime()
  })

  const months: MonthData[] = sortedMonths.map((month) => {
    const data = monthMap.get(month)!
    const sortDesc = (m: Map<string, number>) =>
      Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]))

    return {
      month,
      totalIntros:
        [...data.countries.values()].reduce((a, b) => a + b, 0) ||
        intros.filter((i) => (i.when || "-") === month).length,
      countries: sortDesc(data.countries),
      skillCategories: sortDesc(data.skills),
      interestCategories: sortDesc(data.interests),
    }
  })

  const output = {
    generatedAt: new Date().toISOString(),
    totalMessages: rows.length,
    totalIntros: intros.length,
    months,
    skillCategoryMapping: skillMapping,
    interestCategoryMapping: interestMapping,
  }

  await Bun.write(outputPath, JSON.stringify(output, null, 2))
  console.log(pc.green(`  Written to ${outputPath}`))
  console.log(pc.green(`  ${months.length} months, ${intros.length} intros\n`))
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
