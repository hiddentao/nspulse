import { format, parse } from "date-fns"
import { useMemo } from "react"
import { AreaChartCard } from "../components/AreaChartCard"
import { formatMonth, useData } from "../contexts/DataContext"

export function HomePage() {
  const { eventStats } = useData()

  const monthlyData = eventStats?.monthlyData || []
  const totalEvents = eventStats?.totalEvents || 0

  const sinceDate = useMemo(() => {
    const first = monthlyData[0]
    if (!first) return ""
    return format(parse(first.month, "yyyy-MM", new Date()), "MMM yyyy")
  }, [monthlyData])

  const eventsChartData = useMemo(
    () =>
      monthlyData
        .filter((m: any) => m.total > 5)
        .map((m: any) => ({ ...m, name: formatMonth(m.month) })),
    [monthlyData],
  )

  return (
    <div className="px-8 md:px-12 py-12 max-w-[1200px]">
      <h1 className="text-4xl font-bold text-nspulse-heading tracking-tight mb-3">
        Community analytics for Network School
      </h1>
      <p className="text-[15px] text-nspulse-muted max-w-[600px] mb-12">
        Tracking {totalEvents.toLocaleString()} events
        {sinceDate ? ` since ${sinceDate}` : ""}. Data sourced from lu.ma/ns and
        categorized via AI.
      </p>

      {eventsChartData.length > 0 && (
        <AreaChartCard
          title="Events"
          linkTo="/events"
          linkLabel="View all →"
          data={eventsChartData}
          gradientId="homeEventsGrad"
        />
      )}
    </div>
  )
}
