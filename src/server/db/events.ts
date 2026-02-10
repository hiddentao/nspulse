import { asc, sql } from "drizzle-orm"
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
    rows.flatMap((r) => {
      const keys = [`${r.title}|${r.startTime.toISOString()}`]
      if (r.lumaId) keys.push(r.lumaId)
      return keys
    }),
  )
}

export async function insertEvents(
  db: DatabaseOrTransaction,
  newEvents: NewEvent[],
): Promise<number> {
  if (newEvents.length === 0) return 0

  const dedupMap = new Map<string, NewEvent>()
  for (const e of newEvents) {
    const key = `${e.title}|${e.startTime.toISOString()}`
    const existing = dedupMap.get(key)
    if (!existing || (e.guestCount ?? 0) > (existing.guestCount ?? 0)) {
      dedupMap.set(key, e)
    }
  }
  const deduped = Array.from(dedupMap.values())

  const withLumaId = deduped.filter((e) => e.lumaId)
  const withoutLumaId = deduped.filter((e) => !e.lumaId)

  let count = 0

  if (withLumaId.length > 0) {
    const result = await db
      .insert(events)
      .values(withLumaId)
      .onConflictDoUpdate({
        target: events.lumaId,
        set: { guestCount: sql`excluded.guest_count` },
      })
      .returning({ id: events.id })
    count += result.length
  }

  if (withoutLumaId.length > 0) {
    const result = await db
      .insert(events)
      .values(withoutLumaId)
      .onConflictDoUpdate({
        target: [events.title, events.startTime],
        set: { guestCount: sql`excluded.guest_count` },
      })
      .returning({ id: events.id })
    count += result.length
  }

  return count
}

export async function getAllEvents(db: DatabaseOrTransaction) {
  return db.select().from(events).orderBy(asc(events.startTime))
}

export interface EventStatsData {
  monthlyData: Record<string, any>[]
  categoryTotals: [string, number][]
  totalEvents: number
  lastUpdated: string
  dailyData: { date: string; total: number }[]
  totalRegistrations: number
  monthlyRegistrationData: Record<string, any>[]
  dailyRegistrationData: { date: string; total: number }[]
  categoryRegistrationTotals: [string, number][]
}

export async function computeAndSaveEventStats(
  db: DatabaseOrTransaction,
): Promise<EventStatsData> {
  const allEvents = await getAllEvents(db)

  const monthlyMap = new Map<string, Record<string, number>>()
  const dailyMap = new Map<string, number>()
  const categoryCountMap = new Map<string, number>()

  const monthlyRegMap = new Map<string, Record<string, number>>()
  const dailyRegMap = new Map<string, number>()
  const categoryRegMap = new Map<string, number>()
  let totalRegistrations = 0

  for (const cat of EVENT_CATEGORIES) {
    categoryCountMap.set(cat, 0)
    categoryRegMap.set(cat, 0)
  }

  for (const event of allEvents) {
    const month = event.startTime.toISOString().slice(0, 7)
    const day = event.startTime.toISOString().slice(0, 10)
    const guests = event.guestCount ?? 0

    dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    dailyRegMap.set(day, (dailyRegMap.get(day) || 0) + guests)
    totalRegistrations += guests

    if (!monthlyMap.has(month)) {
      const entry: Record<string, number> = { total: 0 }
      const regEntry: Record<string, number> = { total: 0 }
      for (const cat of EVENT_CATEGORIES) {
        entry[cat] = 0
        regEntry[cat] = 0
      }
      monthlyMap.set(month, entry)
      monthlyRegMap.set(month, regEntry)
    }

    const monthEntry = monthlyMap.get(month)!
    monthEntry["total"] = (monthEntry["total"] || 0) + 1

    const monthRegEntry = monthlyRegMap.get(month)!
    monthRegEntry["total"] = (monthRegEntry["total"] || 0) + guests

    const cat = event.category
    if (EVENT_CATEGORIES.includes(cat as EventCategory)) {
      monthEntry[cat] = (monthEntry[cat] || 0) + 1
      categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1)

      monthRegEntry[cat] = (monthRegEntry[cat] || 0) + guests
      categoryRegMap.set(cat, (categoryRegMap.get(cat) || 0) + guests)
    }
  }

  const sortedMonths = Array.from(monthlyMap.keys()).sort((a, b) =>
    a.localeCompare(b),
  )

  const monthlyData = sortedMonths.map((month) => ({
    month,
    ...monthlyMap.get(month)!,
  }))

  const monthlyRegistrationData = sortedMonths.map((month) => ({
    month,
    ...monthlyRegMap.get(month)!,
  }))

  const categoryTotals = Array.from(categoryCountMap.entries()).sort(
    (a, b) => b[1] - a[1],
  ) as [string, number][]

  const categoryRegistrationTotals = Array.from(categoryRegMap.entries()).sort(
    (a, b) => b[1] - a[1],
  ) as [string, number][]

  const sortedDays = Array.from(dailyMap.keys()).sort((a, b) =>
    a.localeCompare(b),
  )

  const dailyData = sortedDays.map((date) => ({
    date,
    total: dailyMap.get(date)!,
  }))

  const dailyRegistrationData = sortedDays.map((date) => ({
    date,
    total: dailyRegMap.get(date)!,
  }))

  const stats: EventStatsData = {
    monthlyData,
    categoryTotals,
    totalEvents: allEvents.length,
    lastUpdated: new Date().toISOString(),
    dailyData,
    totalRegistrations,
    monthlyRegistrationData,
    dailyRegistrationData,
    categoryRegistrationTotals,
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
