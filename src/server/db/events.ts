import { asc } from "drizzle-orm"
import {
  EVENT_CATEGORIES,
  type EventCategory,
  SETTINGS_KEYS,
} from "../../shared/constants"
import { events, type NewEvent } from "./schema"
import { getSetting, setSetting } from "./settings"
import type { DatabaseOrTransaction } from "./shared"

export async function getExistingEventKeys(
  db: DatabaseOrTransaction,
): Promise<Set<string>> {
  const rows = await db
    .select({
      lumaId: events.lumaId,
      title: events.title,
      startTime: events.startTime,
    })
    .from(events)
  return new Set(
    rows.map((r) => r.lumaId ?? `${r.title}|${r.startTime.toISOString()}`),
  )
}

export async function insertEvents(
  db: DatabaseOrTransaction,
  newEvents: NewEvent[],
): Promise<number> {
  if (newEvents.length === 0) return 0

  const result = await db
    .insert(events)
    .values(newEvents)
    .onConflictDoNothing()
    .returning({ id: events.id })

  return result.length
}

export async function getAllEvents(db: DatabaseOrTransaction) {
  return db.select().from(events).orderBy(asc(events.startTime))
}

export interface EventStatsData {
  monthlyData: Record<string, any>[]
  categoryTotals: [string, number][]
  totalEvents: number
  lastUpdated: string
}

export async function computeAndSaveEventStats(
  db: DatabaseOrTransaction,
): Promise<EventStatsData> {
  const allEvents = await getAllEvents(db)

  const monthlyMap = new Map<string, Record<string, number>>()
  const categoryCountMap = new Map<string, number>()

  for (const cat of EVENT_CATEGORIES) {
    categoryCountMap.set(cat, 0)
  }

  for (const event of allEvents) {
    const month = event.startTime.toISOString().slice(0, 7)

    if (!monthlyMap.has(month)) {
      const entry: Record<string, number> = { total: 0 }
      for (const cat of EVENT_CATEGORIES) {
        entry[cat] = 0
      }
      monthlyMap.set(month, entry)
    }

    const monthEntry = monthlyMap.get(month)!
    monthEntry["total"] = (monthEntry["total"] || 0) + 1

    const cats = (event.categories as string[]) || []
    for (const cat of cats) {
      if (EVENT_CATEGORIES.includes(cat as EventCategory)) {
        monthEntry[cat] = (monthEntry[cat] || 0) + 1
        categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1)
      }
    }
  }

  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }))

  const categoryTotals = Array.from(categoryCountMap.entries()).sort(
    (a, b) => b[1] - a[1],
  ) as [string, number][]

  const stats: EventStatsData = {
    monthlyData,
    categoryTotals,
    totalEvents: allEvents.length,
    lastUpdated: new Date().toISOString(),
  }

  await setSetting(db, SETTINGS_KEYS.EVENT_STATS_CACHE, JSON.stringify(stats))

  return stats
}

export async function getEventStats(
  db: DatabaseOrTransaction,
): Promise<EventStatsData | null> {
  const raw = await getSetting(db, SETTINGS_KEYS.EVENT_STATS_CACHE)
  if (!raw) return null

  try {
    return JSON.parse(raw) as EventStatsData
  } catch {
    return null
  }
}

export async function getLastFetchedDate(
  db: DatabaseOrTransaction,
): Promise<Date | null> {
  const raw = await getSetting(db, SETTINGS_KEYS.LUMA_LAST_FETCHED_DATE)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function setLastFetchedDate(
  db: DatabaseOrTransaction,
  date: Date,
): Promise<void> {
  await setSetting(db, SETTINGS_KEYS.LUMA_LAST_FETCHED_DATE, date.toISOString())
}
