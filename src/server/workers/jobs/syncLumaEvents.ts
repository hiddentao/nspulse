import { serverConfig } from "../../../shared/config/server"
import {
  computeAndSaveEventStats,
  getExistingEventKeys,
  getLastFetchedDate,
  insertEvents,
  setLastFetchedDate,
} from "../../db/events"
import type { NewEvent } from "../../db/schema"
import { categorizeEvents } from "../../lib/eventCategorizer"
import { eventKey, fetchLumaEvents } from "../../lib/luma"
import type { JobParams, JobRunner } from "./types"

export const run: JobRunner = async (params: JobParams) => {
  const { serverApp, log } = params
  const db = serverApp.db

  const lastFetchedDate = await getLastFetchedDate(db)
  log.info(
    `Starting Luma sync${lastFetchedDate ? ` (after ${lastFetchedDate.toISOString()})` : " (full sync)"}`,
  )

  const existingKeys = await getExistingEventKeys(db)
  let totalInserted = 0

  const lumaEvents = await fetchLumaEvents({
    afterDate: lastFetchedDate || undefined,
    log: (...args: any[]) => log.info(...args),
    onBatch: async (batchEvents) => {
      const newEvents = batchEvents.filter(
        (e) => !existingKeys.has(eventKey(e)),
      )

      const safeEvents = batchEvents.filter((e) => {
        const titleTimeKey = `${e.title}|${e.startTime.toISOString()}`
        const isUpdate = existingKeys.has(eventKey(e))
        return isUpdate || !existingKeys.has(titleTimeKey)
      })

      const categoryMap =
        newEvents.length > 0
          ? await categorizeEvents(
              newEvents.map((e) => ({
                id: eventKey(e),
                title: e.title,
                description: e.description,
              })),
              serverConfig.ANTHROPIC_API_KEY,
              (...args: any[]) => log.info(...args),
            )
          : new Map<string, string>()

      const dbRows: NewEvent[] = safeEvents.map((e) => ({
        lumaId: e.lumaId ?? null,
        title: e.title,
        startTime: e.startTime,
        category: categoryMap.get(eventKey(e)) ?? "Other",
        guestCount: e.guestCount,
      }))

      await insertEvents(db, dbRows)
      totalInserted += newEvents.length
      for (const e of safeEvents) {
        existingKeys.add(eventKey(e))
        existingKeys.add(`${e.title}|${e.startTime.toISOString()}`)
      }
      log.info(
        `Batch: ${newEvents.length} new, ${safeEvents.length - newEvents.length} updated, ${batchEvents.length - safeEvents.length} skipped duplicates (${totalInserted} new total)`,
      )
    },
  })

  log.info(
    `Fetched ${lumaEvents.length} events from Luma, inserted ${totalInserted} total`,
  )

  if (lumaEvents.length > 0) {
    const latestDate = lumaEvents.reduce(
      (max, e) => (e.startTime > max ? e.startTime : max),
      lastFetchedDate || new Date(0),
    )
    await setLastFetchedDate(db, latestDate)
  }

  await computeAndSaveEventStats(db)
  log.info("Stats cache updated")

  return { eventsInserted: totalInserted }
}

export const syncLumaEventsJob = {
  run,
}
