import { LUMA_API_BASE, LUMA_CALENDAR_API_ID } from "../../shared/constants"

export interface LumaEvent {
  lumaId?: string
  title: string
  description?: string
  startTime: Date
  guestCount: number
}

interface LumaApiEntry {
  event: {
    api_id?: string
    name: string
    description?: string
    start_at: string
    geo_address_info?: {
      city_state?: string
    }
  }
  calendar_api_id?: string
  guest_count?: number
}

interface LumaApiResponse {
  entries: LumaApiEntry[]
  has_more: boolean
  next_cursor?: string
}

function parseEntry(entry: LumaApiEntry): LumaEvent {
  const evt = entry.event
  return {
    lumaId: evt.api_id || undefined,
    title: evt.name,
    description: evt.description || undefined,
    startTime: new Date(evt.start_at),
    guestCount: entry.guest_count ?? 0,
  }
}

export function eventKey(e: LumaEvent): string {
  return e.lumaId ?? `${e.title}|${e.startTime.toISOString()}`
}

async function fetchPeriod(
  period: "past" | "future",
  seen: Set<string>,
  afterDate?: Date,
  log?: (...args: any[]) => void,
  onBatch?: (events: LumaEvent[]) => Promise<void>,
): Promise<LumaEvent[]> {
  const results: LumaEvent[] = []
  let cursor: string | undefined

  while (true) {
    const params = new URLSearchParams({
      calendar_api_id: LUMA_CALENDAR_API_ID,
      pagination_limit: "50",
      period,
    })

    if (cursor) {
      params.set("pagination_cursor", cursor)
    }

    const url = `${LUMA_API_BASE}/calendar/get-items?${params.toString()}`
    log?.(`Fetching ${period} events: ${url}`)

    let response: Response | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(url)
        if (response.ok) break
        if (response.status < 500) {
          throw new Error(
            `Luma API error: ${response.status} ${response.statusText}`,
          )
        }
      } catch (err) {
        if (attempt === 2) throw err
        const delay = 500 * 2 ** attempt
        log?.(
          `  Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
    if (!response?.ok) {
      throw new Error(
        `Luma API error: ${response?.status} ${response?.statusText}`,
      )
    }

    const data = (await response.json()) as LumaApiResponse
    const entries = data.entries || []

    const pageEvents: LumaEvent[] = []
    for (const entry of entries) {
      const event = parseEntry(entry)
      if (afterDate && event.startTime <= afterDate) {
        continue
      }
      const key = eventKey(event)
      const titleTimeKey = `${event.title}|${event.startTime.toISOString()}`
      if (!seen.has(key) && !seen.has(titleTimeKey)) {
        seen.add(key)
        seen.add(titleTimeKey)
        pageEvents.push(event)
      }
    }

    results.push(...pageEvents)
    log?.(
      `  Got ${entries.length} entries, ${pageEvents.length} new (${results.length} total so far)`,
    )

    if (onBatch && pageEvents.length > 0) {
      await onBatch(pageEvents)
    }

    if (!data.has_more || !data.next_cursor) {
      break
    }

    cursor = data.next_cursor
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return results
}

export async function fetchLumaEvents(options?: {
  afterDate?: Date
  log?: (...args: any[]) => void
  onBatch?: (events: LumaEvent[]) => Promise<void>
}): Promise<LumaEvent[]> {
  const { afterDate, log, onBatch } = options || {}
  const seen = new Set<string>()
  const allEvents: LumaEvent[] = []

  for (const period of ["past"] as const) {
    const events = await fetchPeriod(period, seen, afterDate, log, onBatch)
    allEvents.push(...events)
  }

  allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  log?.(`Total unique events: ${allEvents.length}`)

  return allEvents
}
