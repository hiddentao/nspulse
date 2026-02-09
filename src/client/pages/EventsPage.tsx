import { format, parse, startOfWeek } from "date-fns"
import { Info } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_COLORS,
  EVENT_CATEGORY_ICONS,
} from "../../shared/constants"
import { CategoryBars } from "../components/CategoryBars"
import { ChartTooltip } from "../components/ChartTooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/Dialog"
import { DonutChart } from "../components/DonutChart"
import { Loading } from "../components/Loading"
import { StatCard } from "../components/StatCard"
import { SyncingIndicator } from "../components/SyncingIndicator"
import { ViewToggle } from "../components/ViewToggle"
import { formatMonth, useData } from "../contexts/DataContext"
import { useTheme } from "../contexts/ThemeContext"

function formatDay(d: string): string {
  return format(new Date(d), "MMM d")
}

type View = "overview" | "categories"
type TimeGranularity = "month" | "week" | "day"

export function EventsPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const axisTick = {
    fill: isDark ? "#5C5F66" : "#9CA3AF",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  }

  const [showInfo, setShowInfo] = useState(false)
  const [selectedCats, setSelectedCats] = useState(
    () => new Set<string>(EVENT_CATEGORIES),
  )
  const [view, setView] = useState<View>("overview")
  const [granularity, setGranularity] = useState<TimeGranularity>("month")

  const { eventStats, isLoading } = useData()

  const monthlyData = eventStats?.monthlyData || []
  const categoryTotals = eventStats?.categoryTotals || []
  const totalEvents = eventStats?.totalEvents || 0
  const dailyData = eventStats?.dailyData || []

  const sinceDate = useMemo(() => {
    const first = monthlyData[0]
    if (!first) return ""
    return format(parse(first.month, "yyyy-MM", new Date()), "MMM yyyy")
  }, [monthlyData])

  const avgPerMonth = useMemo(() => {
    const activeMonths = monthlyData.filter((m: any) => m.total > 5)
    return activeMonths.length > 0
      ? Math.round(totalEvents / activeMonths.length)
      : 0
  }, [monthlyData, totalEvents])

  const peakMonth = useMemo(() => {
    if (monthlyData.length === 0) return { month: "—", count: 0 }
    const m = monthlyData.reduce((a: any, b: any) =>
      a.total > b.total ? a : b,
    )
    return { month: formatMonth(m.month), count: m.total }
  }, [monthlyData])

  const chartData = useMemo(
    () =>
      monthlyData
        .filter((m: any) => m.total > 5)
        .map((m: any) => ({ ...m, name: formatMonth(m.month) })),
    [monthlyData],
  )

  const weeklyData = useMemo(() => {
    if (dailyData.length === 0) return []
    const weeks = new Map<string, number>()
    for (const d of dailyData) {
      const date = new Date(d.date)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      const key = format(weekStart, "yyyy-MM-dd")
      weeks.set(key, (weeks.get(key) || 0) + d.total)
    }
    return Array.from(weeks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({
        name: format(new Date(key), "MMM d"),
        total,
      }))
  }, [dailyData])

  const dayChartData = useMemo(
    () => dailyData.map((d) => ({ name: formatDay(d.date), total: d.total })),
    [dailyData],
  )

  const timeSeriesData = useMemo(() => {
    if (granularity === "month") return chartData
    if (granularity === "week") return weeklyData
    return dayChartData
  }, [granularity, chartData, weeklyData, dayChartData])

  const toggleCat = useCallback((cat: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const activeCats = useMemo(
    () => EVENT_CATEGORIES.filter((c) => selectedCats.has(c)),
    [selectedCats],
  )

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex-center">
        <Loading size="lg" text="Loading events..." />
      </div>
    )
  }

  if (totalEvents === 0) {
    return (
      <div className="min-h-[60vh] flex-center">
        <SyncingIndicator />
      </div>
    )
  }

  return (
    <div className="px-8 md:px-12 py-8 max-w-[1200px]">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-3xl font-bold text-nspulse-heading">Events</h1>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="text-nspulse-muted hover:text-nspulse-text transition-colors"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-4 flex-wrap mb-10">
        <StatCard
          label="Total Events"
          value={totalEvents.toLocaleString()}
          sub={`Since ${sinceDate}`}
        />
        <StatCard
          label="Avg / Month"
          value={avgPerMonth}
          sub="Active months only"
        />
        <StatCard
          label="Peak Month"
          value={peakMonth.count}
          sub={peakMonth.month}
        />
        <StatCard
          label="Categories"
          value={EVENT_CATEGORIES.length}
          sub="Active categories"
        />
      </div>

      <div className="mb-8">
        <ViewToggle
          options={["overview", "categories"] as View[]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === "overview" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-nspulse-heading">
              Events Over Time
            </h2>
            <ViewToggle
              options={["month", "week", "day"] as TimeGranularity[]}
              value={granularity}
              onChange={setGranularity}
              size="sm"
            />
          </div>
          <div className="h-[360px] mb-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="#E8590C"
                      stopOpacity={isDark ? 0.3 : 0.15}
                    />
                    <stop offset="100%" stopColor="#E8590C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  interval={
                    granularity === "day" ? "preserveStartEnd" : undefined
                  }
                />
                <YAxis
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#E8590C"
                  strokeWidth={2}
                  fill="url(#totalGrad)"
                  dot={
                    granularity === "month" ? { r: 3, fill: "#E8590C" } : false
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <h2 className="text-xl font-semibold text-nspulse-heading mb-5">
            Category Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CategoryBars
              data={categoryTotals}
              total={totalEvents}
              colorMap={EVENT_CATEGORY_COLORS}
              iconMap={EVENT_CATEGORY_ICONS}
            />
            <DonutChart
              data={categoryTotals}
              colorMap={EVENT_CATEGORY_COLORS}
            />
          </div>
        </div>
      )}

      {view === "categories" && (
        <div>
          <h2 className="text-xl font-semibold text-nspulse-heading mb-4">
            Category Filter
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                type="button"
                className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200"
                style={{
                  border: `1px solid ${selectedCats.has(cat) ? EVENT_CATEGORY_COLORS[cat] : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                  background: selectedCats.has(cat)
                    ? `${EVENT_CATEGORY_COLORS[cat]}22`
                    : "transparent",
                  color: selectedCats.has(cat)
                    ? EVENT_CATEGORY_COLORS[cat]
                    : isDark
                      ? "#5C5F66"
                      : "#9CA3AF",
                }}
              >
                {EVENT_CATEGORY_ICONS[cat]} {cat}
              </button>
            ))}
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {activeCats.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={EVENT_CATEGORY_COLORS[cat]}
                    radius={0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="border-nspulse-card-border bg-nspulse-card-bg text-nspulse-text"
        >
          <DialogHeader>
            <DialogTitle className="text-nspulse-heading">
              Data Source
            </DialogTitle>
            <DialogDescription className="text-nspulse-muted">
              {totalEvents.toLocaleString()} events
              {sinceDate ? ` from ${sinceDate}` : ""}
              {monthlyData.length > 1
                ? ` to ${formatMonth(monthlyData.at(-1)!.month)}`
                : ""}
              , compiled from the NS calendar at{" "}
              <a
                href="https://lu.ma/ns"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-nspulse-text"
              >
                lu.ma/ns
              </a>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
