import { readFile, unlink, writeFile } from "node:fs/promises"
import Anthropic from "@anthropic-ai/sdk"
import pc from "picocolors"
import {
  AI_BATCH_DELAY_MS,
  AI_RETRY_DELAY_MS,
} from "../../src/shared/constants"

const BAR_WIDTH = 30

export interface CsvRow {
  AuthorID: string
  Author: string
  Date: string
  Content: string
  Attachments: string
  Reactions: string
}

export function progressBar(
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

export function cleanJsonResponse(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim()
}

export function parseReactionCount(reactions: string): number {
  if (!reactions) return 0
  let total = 0
  const matches = reactions.matchAll(/\((\d+)\)/g)
  for (const match of matches) {
    total += Number(match[1])
  }
  return total
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping C0 control characters that break JSON serialization
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g

export function sanitizeForApi(str: string): string {
  return str
    .replace(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
      "",
    )
    .replace(CONTROL_CHAR_RE, "")
}

export function getDateRange(rows: CsvRow[]): {
  firstDate: string
  lastDate: string
} {
  const dates = rows
    .map((r) => r.Date?.split("T")[0])
    .filter(Boolean)
    .sort()
  return {
    firstDate: dates[0] || "",
    lastDate: dates[dates.length - 1] || "",
  }
}

export function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY env var is required")
    process.exit(1)
  }
  return new Anthropic({ apiKey })
}

interface BatchRunnerConfig<TAccum> {
  label: string
  batchSize: number
  total: number
  progressFile: string
  initial: TAccum
  extra: (accum: TAccum) => string
  processBatch: (startIndex: number, accum: TAccum) => Promise<TAccum>
}

interface ProgressData<TAccum> {
  nextIndex: number
  accum: TAccum
}

async function loadProgress<TAccum>(
  progressFile: string,
): Promise<ProgressData<TAccum> | null> {
  try {
    const raw = await readFile(progressFile, "utf-8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function saveProgress<TAccum>(
  progressFile: string,
  data: ProgressData<TAccum>,
): Promise<void> {
  await writeFile(progressFile, JSON.stringify(data), "utf-8")
}

export async function runBatches<TAccum>(
  config: BatchRunnerConfig<TAccum>,
): Promise<TAccum> {
  const saved = await loadProgress<TAccum>(config.progressFile)
  let startIndex = 0
  let accum = config.initial

  if (saved) {
    startIndex = saved.nextIndex
    accum = saved.accum
    const pct = Math.round((startIndex / config.total) * 100)
    console.log(
      pc.yellow(`  Resuming from item ${startIndex}/${config.total} (${pct}%)`),
    )
  }

  for (let i = startIndex; i < config.total; i += config.batchSize) {
    const processed = Math.min(i + config.batchSize, config.total)

    progressBar(config.label, processed, config.total, config.extra(accum))

    try {
      accum = await config.processBatch(i, accum)
    } catch {
      await new Promise((r) => setTimeout(r, AI_RETRY_DELAY_MS))
      try {
        accum = await config.processBatch(i, accum)
      } catch (retryErr) {
        await saveProgress(config.progressFile, { nextIndex: i, accum })
        process.stdout.write("\n")
        console.error(
          pc.red(`  Failed at item ${i}. Progress saved. Re-run to resume.`),
        )
        throw retryErr
      }
    }

    await saveProgress(config.progressFile, {
      nextIndex: i + config.batchSize,
      accum,
    })

    if (i + config.batchSize < config.total) {
      await new Promise((r) => setTimeout(r, AI_BATCH_DELAY_MS))
    }
  }

  process.stdout.write("\n")
  return accum
}

export async function clearProgress(progressFile: string): Promise<void> {
  try {
    await unlink(progressFile)
  } catch {
    // File may not exist on first run
  }
}
