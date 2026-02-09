import pc from "picocolors"

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
