import { getGraphQLClient } from "@shared/graphql/client"
import { GET_EVENT_STATS } from "@shared/graphql/queries"
import { useQuery } from "@tanstack/react-query"
import { format, parse, startOfWeek } from "date-fns"
import { useCallback, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_COLORS,
  EVENT_CATEGORY_ICONS,
  type EventCategory,
} from "../../shared/constants"
import { Loading } from "../components/Loading"
import { SyncingIndicator } from "../components/SyncingIndicator"
import { useTheme } from "../contexts/ThemeContext"
import { cn } from "../utils/cn"

function formatMonth(m: string): string {
  const [y, mo] = m.split("-")
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return `${months[Number.parseInt(mo!) - 1]} ${y!.slice(2)}`
}

function formatDay(d: string): string {
  return format(new Date(d), "MMM d")
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl px-6 py-5 flex-1 min-w-[160px]">
      <div className="text-[13px] text-nspulse-muted tracking-[0.05em] uppercase mb-2">
        {label}
      </div>
      <div className="text-4xl font-bold leading-none text-nspulse-heading">
        {value}
      </div>
      {sub && (
        <div className="text-[13px] text-nspulse-muted mt-1.5">{sub}</div>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-4 py-3 text-[13px]"
      style={{
        background: isDark ? "#1A1B1E" : "#FFFFFF",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
        color: isDark ? "#C1C2C5" : "#374151",
      }}
    >
      <div
        className="font-semibold mb-1.5"
        style={{ color: isDark ? "#F1F3F5" : "#111827" }}
      >
        {label}
      </div>
      {payload
        .filter((p: any) => p.value > 0)
        .sort((a: any, b: any) => b.value - a.value)
        .map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4 mb-0.5">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-semibold">{p.value}</span>
          </div>
        ))}
    </div>
  )
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

  const [selectedCats, setSelectedCats] = useState(
    () => new Set<string>(EVENT_CATEGORIES),
  )
  const [view, setView] = useState<View>("overview")
  const [granularity, setGranularity] = useState<TimeGranularity>("month")

  const { data, isLoading } = useQuery({
    queryKey: ["eventStats"],
    queryFn: async () => {
      const response = await getGraphQLClient().request<{
        getEventStats: {
          monthlyData: Record<string, any>[]
          categoryTotals: [string, number][]
          totalEvents: number
          lastUpdated: string | null
          dailyData: { date: string; total: number }[]
        }
      }>(GET_EVENT_STATS)
      return response.getEventStats
    },
    staleTime: 5 * 60 * 1000,
  })

  const monthlyData = data?.monthlyData || []
  const categoryTotals = data?.categoryTotals || []
  const totalEvents = data?.totalEvents || 0
  const dailyData = data?.dailyData || []

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

  const pieData = useMemo(
    () =>
      categoryTotals.map(([name, value]: [string, number]) => ({
        name,
        value,
        color: EVENT_CATEGORY_COLORS[name as EventCategory] || "#6b7280",
      })),
    [categoryTotals],
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
      <h1 className="text-3xl font-bold text-nspulse-heading mb-8">Events</h1>

      {/* Stats Row */}
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

      {/* Tab Nav */}
      <div className="flex gap-1 mb-8">
        {(["overview", "categories"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            type="button"
            className={cn(
              "px-5 py-2 rounded-md border-none font-semibold text-sm font-mono uppercase tracking-[0.05em] cursor-pointer",
              view === v
                ? "bg-nspulse-heading text-nspulse-bg"
                : "bg-transparent text-nspulse-muted hover:text-nspulse-text",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === "overview" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-nspulse-heading">
              Events Over Time
            </h2>
            <div className="flex gap-1">
              {(["month", "week", "day"] as TimeGranularity[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  type="button"
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold font-mono uppercase tracking-[0.05em] cursor-pointer border-none",
                    granularity === g
                      ? "bg-nspulse-heading text-nspulse-bg"
                      : "bg-transparent text-nspulse-muted hover:text-nspulse-text",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
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
            <div>
              {categoryTotals.map(([cat, count]: [string, number]) => {
                const pct =
                  totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0
                const maxCount = categoryTotals[0]?.[1] || 1
                return (
                  <div key={cat} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] text-nspulse-text">
                        {EVENT_CATEGORY_ICONS[cat as EventCategory]} {cat}
                      </span>
                      <span className="text-[13px] font-mono text-nspulse-text">
                        {count}{" "}
                        <span className="text-nspulse-muted">({pct}%)</span>
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-sm overflow-hidden"
                      style={{
                        background: isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        className="h-full rounded-sm transition-all duration-500"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          background:
                            EVENT_CATEGORY_COLORS[cat as EventCategory] ||
                            "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center items-center">
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {pieData.map((entry: { name: string; color: string }) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: isDark ? "#1A1B1E" : "#FFFFFF",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: isDark ? "#C1C2C5" : "#374151",
                    }}
                    itemStyle={{ color: isDark ? "#C1C2C5" : "#374151" }}
                    labelStyle={{ color: isDark ? "#F1F3F5" : "#111827" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Categories View */}
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

      <p className="text-[13px] text-nspulse-muted mt-12">
        This data is compiled from the NS calendar at{" "}
        <a href="https://lu.ma/ns" target="_blank" rel="noopener noreferrer">
          https://lu.ma/ns
        </a>
      </p>
    </div>
  )
}
