#!/usr/bin/env bun

import { resolve } from "node:path"
import Anthropic from "@anthropic-ai/sdk"
import Papa from "papaparse"
import pc from "picocolors"
import {
  AI_CONTENT_SLICE_LIMIT,
  AI_DISCUSSION_CONSOLIDATE_PROMPT,
  AI_DISCUSSION_EXTRACT_PROMPT,
  AI_DISCUSSION_SEED_KEYWORDS,
  AI_DISCUSSION_SEED_MIN_CONTENT_LENGTH,
  AI_DISCUSSION_SEED_MIN_REACTION_SCORE,
  AI_DISCUSSION_SEED_NOISE_PATTERNS,
  AI_DISCUSSION_SNIPPET_CONTEXT_SIZE,
  AI_DISCUSSION_SNIPPETS_PER_BATCH,
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_RETRY_DELAY_MS,
} from "../src/shared/constants"
import {
  type CsvRow,
  cleanJsonResponse,
  clearProgress,
  createAnthropicClient,
  getDateRange,
  parseReactionCount,
  runBatches,
  safeSlice,
  sanitizeForApi,
} from "./shared/parserShared"
import { createScriptRunner, type ScriptOptions } from "./shared/script-runner"

interface Snippet {
  seed: {
    author: string
    content: string
    reactions: number
    attachments?: string
  }
  replies: { author: string; content: string }[]
}

interface ExtractedItem {
  name: string
  description: string
  url?: string
  engagement: number
}

interface ExtractResult {
  ideas: ExtractedItem[]
  apps: ExtractedItem[]
}

interface ScoredItem {
  name: string
  description: string
  url?: string
  score: number
}

interface ConsolidateResult {
  ideas: ScoredItem[]
  apps: ScoredItem[]
}

function isNoise(content: string): boolean {
  if (content.length < AI_DISCUSSION_SEED_MIN_CONTENT_LENGTH) return true
  for (const pattern of AI_DISCUSSION_SEED_NOISE_PATTERNS) {
    if (content.startsWith(pattern)) return true
  }
  const trimmed = content.trim()
  if (/^https?:\/\/\S+$/.test(trimmed)) return true
  return false
}

function isSeedMessage(content: string, reactionScore: number): boolean {
  if (isNoise(content)) return false
  if (reactionScore >= AI_DISCUSSION_SEED_MIN_REACTION_SCORE) return true
  const lower = content.toLowerCase()
  for (const keyword of AI_DISCUSSION_SEED_KEYWORDS) {
    if (lower.includes(keyword)) return true
  }
  return false
}

function buildSnippets(rows: CsvRow[]): Snippet[] {
  const snippets: Snippet[] = []
  const claimed = new Set<number>()

  for (let i = 0; i < rows.length; i++) {
    if (claimed.has(i)) continue
    const row = rows[i]!
    const content = sanitizeForApi(row.Content || "")
    const reactionScore = parseReactionCount(row.Reactions)

    if (!isSeedMessage(content, reactionScore)) continue

    claimed.add(i)
    const replies: { author: string; content: string }[] = []

    for (
      let j = i + 1;
      j < Math.min(i + 1 + AI_DISCUSSION_SNIPPET_CONTEXT_SIZE, rows.length);
      j++
    ) {
      if (claimed.has(j)) continue
      claimed.add(j)
      const reply = rows[j]!
      const replyContent = sanitizeForApi(reply.Content || "")
      if (replyContent.length > 0) {
        replies.push({
          author: sanitizeForApi(reply.Author || "unknown"),
          content: safeSlice(replyContent, AI_CONTENT_SLICE_LIMIT),
        })
      }
    }

    const attachments = sanitizeForApi(row.Attachments || "")

    snippets.push({
      seed: {
        author: sanitizeForApi(row.Author || "unknown"),
        content: safeSlice(content, AI_CONTENT_SLICE_LIMIT),
        reactions: reactionScore,
        ...(attachments && { attachments }),
      },
      replies,
    })
  }

  return snippets
}

function formatSnippet(snippet: Snippet, index: number): string {
  let seedLine = `[SEED] (reactions: ${snippet.seed.reactions}) ${snippet.seed.author}: "${snippet.seed.content}"`
  if (snippet.seed.attachments) {
    seedLine += ` [Attachments: ${snippet.seed.attachments}]`
  }
  const lines = [`--- Snippet ${index + 1} ---`, seedLine]
  for (const reply of snippet.replies) {
    lines.push(`[REPLY] ${reply.author}: "${reply.content}"`)
  }
  return lines.join("\n")
}

async function extractBatch(
  client: Anthropic,
  snippets: Snippet[],
  startIndex: number,
): Promise<ExtractResult> {
  const formatted = snippets
    .map((s, i) => formatSnippet(s, startIndex + i))
    .join("\n\n")

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    system: AI_DISCUSSION_EXTRACT_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract ideas and apps from these conversation snippets:\n\n${formatted}`,
      },
    ],
  })

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : ""
  return JSON.parse(cleanJsonResponse(text))
}

async function consolidateResults(
  client: Anthropic,
  allIdeas: ExtractedItem[],
  allApps: ExtractedItem[],
): Promise<ConsolidateResult> {
  const payload = JSON.stringify({ ideas: allIdeas, apps: allApps })

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    system: AI_DISCUSSION_CONSOLIDATE_PROMPT,
    messages: [
      {
        role: "user",
        content: `Consolidate and rank these extracted items:\n\n${payload}`,
      },
    ],
  })

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : ""
  return JSON.parse(cleanJsonResponse(text))
}

async function discussionHandler(
  _options: ScriptOptions,
  config: { rootFolder: string },
) {
  const client = createAnthropicClient()
  const csvPath = resolve(config.rootFolder, "data", "discussion.csv")
  const outputPath = resolve(
    config.rootFolder,
    "src",
    "shared",
    "stats",
    "discussion.json",
  )
  const progressFile = resolve(config.rootFolder, ".parseDiscussion.progress")

  // Phase 1: Parse CSV
  console.log(pc.cyan("Phase 1: Parsing CSV..."))
  const csvText = await Bun.file(csvPath).text()
  const { data: rows } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  console.log(pc.green(`  Parsed ${rows.length} messages\n`))

  // Phase 2: Identify seeds and build conversation snippets
  console.log(
    pc.cyan("Phase 2: Identifying seed messages & building snippets..."),
  )
  const snippets = buildSnippets(rows)
  console.log(pc.green(`  Built ${snippets.length} conversation snippets\n`))

  // Phase 3: Map — AI extraction in batches
  console.log(pc.cyan("Phase 3: Extracting ideas & apps with AI..."))

  const { ideas: allIdeas, apps: allApps } = await runBatches<ExtractResult>({
    label: "Extracting",
    batchSize: AI_DISCUSSION_SNIPPETS_PER_BATCH,
    total: snippets.length,
    progressFile,
    initial: { ideas: [], apps: [] },
    extra: (accum) =>
      `Ideas: ${accum.ideas.length}  Apps: ${accum.apps.length}`,
    processBatch: async (startIndex, accum) => {
      const batch = snippets.slice(
        startIndex,
        startIndex + AI_DISCUSSION_SNIPPETS_PER_BATCH,
      )
      const result = await extractBatch(client, batch, startIndex)
      return {
        ideas: [...accum.ideas, ...(result.ideas || [])],
        apps: [...accum.apps, ...(result.apps || [])],
      }
    },
  })

  const totalBatches = Math.ceil(
    snippets.length / AI_DISCUSSION_SNIPPETS_PER_BATCH,
  )
  console.log(
    pc.green(
      `  Extracted ${allIdeas.length} ideas, ${allApps.length} apps across ${totalBatches} batches\n`,
    ),
  )

  // Phase 4: Reduce — consolidate with AI
  console.log(pc.cyan("Phase 4: Consolidating results with AI..."))
  let consolidated: ConsolidateResult = { ideas: [], apps: [] }

  if (allIdeas.length > 0 || allApps.length > 0) {
    try {
      consolidated = await consolidateResults(client, allIdeas, allApps)
    } catch {
      await new Promise((r) => setTimeout(r, AI_RETRY_DELAY_MS))
      consolidated = await consolidateResults(client, allIdeas, allApps)
    }
  }

  console.log(
    pc.green(
      `  Final: ${consolidated.ideas.length} ideas, ${consolidated.apps.length} apps\n`,
    ),
  )

  // Phase 5: Output
  console.log(pc.cyan("Phase 5: Writing output..."))

  const { firstDate, lastDate } = getDateRange(rows)

  const output = {
    generatedAt: new Date().toISOString(),
    totalMessages: rows.length,
    firstDate,
    lastDate,
    ideas: consolidated.ideas,
    apps: consolidated.apps,
  }

  await Bun.write(outputPath, JSON.stringify(output, null, 2))
  await clearProgress(progressFile)
  console.log(pc.green(`  Written to ${outputPath}\n`))
  console.log(pc.cyan("Done!"))
}

createScriptRunner(
  {
    name: "Parse Discussion",
    description:
      "Extract popular ideas and apps from Discord discussion messages using AI map-reduce",
    env: "development",
  },
  discussionHandler,
)
