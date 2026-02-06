import { getGraphQLClient } from "@shared/graphql/client"
import { GET_EVENT_STATS } from "@shared/graphql/queries"
import { useQuery } from "@tanstack/react-query"
import { format, parse } from "date-fns"
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

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: string
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl px-6 py-5 flex-1 min-w-[160px]">
      <div className="text-[13px] text-[#868E96] tracking-[0.05em] uppercase mb-2">
        {label}
      </div>
      <div
        className="text-4xl font-bold leading-none"
        style={{ color: accent || "#F1F3F5" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[13px] text-nspulse-muted mt-1.5">{sub}</div>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1B1E] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-nspulse-text">
      <div className="font-semibold mb-1.5 text-nspulse-heading">{label}</div>
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

export function HomePage() {
  const [selectedCats, setSelectedCats] = useState(
    () => new Set<string>(EVENT_CATEGORIES),
  )
  const [view, setView] = useState<View>("overview")

  const { data, isLoading } = useQuery({
    queryKey: ["eventStats"],
    queryFn: async () => {
      const response = await getGraphQLClient().request<{
        getEventStats: {
          monthlyData: Record<string, any>[]
          categoryTotals: [string, number][]
          totalEvents: number
          lastUpdated: string | null
        }
      }>(GET_EVENT_STATS)
      return response.getEventStats
    },
    staleTime: 5 * 60 * 1000,
  })

  const monthlyData = data?.monthlyData || []
  const categoryTotals = data?.categoryTotals || []
  const totalEvents = data?.totalEvents || 0

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
        color: EVENT_CATEGORY_COLORS[name as EventCategory] || "#868E96",
      })),
    [categoryTotals],
  )

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
      <div className="min-h-screen bg-nspulse-bg flex-center">
        <Loading size="lg" text="Loading community pulse..." />
      </div>
    )
  }

  if (totalEvents === 0) {
    return (
      <div className="min-h-screen bg-nspulse-bg flex-center">
        <SyncingIndicator />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nspulse-bg text-nspulse-text">
      {/* Header */}
      <div
        className="border-b border-nspulse-card-border px-8 md:px-12 py-8"
        style={{
          background:
            "linear-gradient(180deg, rgba(232,89,12,0.04) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-[11px] font-mono text-nspulse-accent tracking-[0.15em] uppercase">
            NS Pulse
          </span>
          <span className="text-[11px] text-nspulse-subtle">•</span>
          <span className="text-[11px] font-mono text-nspulse-subtle">
            network school community dashboard
          </span>
        </div>
        <h1 className="text-[42px] font-bold text-nspulse-heading mt-2 tracking-tight leading-[1.1]">
          Community Pulse
        </h1>
        <p className="text-[15px] text-nspulse-muted mt-2 max-w-[600px]">
          Live analytics from {totalEvents.toLocaleString()} events hosted by
          Network School since {sinceDate}. Data sourced from lu.ma/ns.
        </p>
      </div>

      <div className="px-8 md:px-12 py-8 max-w-[1200px]">
        {/* Stats Row */}
        <div className="flex gap-4 flex-wrap mb-10">
          <StatCard
            label="Total Events"
            value={totalEvents.toLocaleString()}
            sub={`Since ${sinceDate}`}
            accent="#E8590C"
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
            accent="#5C7CFA"
          />
          <StatCard
            label="Categories"
            value={EVENT_CATEGORIES.length}
            sub="Active categories"
          />
        </div>

        {/* Nav */}
        <div className="flex gap-1 mb-8">
          {(["overview", "categories"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              type="button"
              className={cn(
                "px-5 py-2 rounded-md border-none font-semibold text-sm font-mono uppercase tracking-[0.05em] cursor-pointer",
                view === v
                  ? "bg-nspulse-accent/15 text-nspulse-accent"
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
            <h2 className="text-xl font-semibold text-nspulse-heading mb-5">
              Events Over Time
            </h2>
            <div className="h-[360px] mb-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8590C" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#E8590C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "#5C5F66",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: "#5C5F66",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#E8590C"
                    strokeWidth={2}
                    fill="url(#totalGrad)"
                    dot={{ r: 3, fill: "#E8590C" }}
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
                    totalEvents > 0
                      ? Math.round((count / totalEvents) * 100)
                      : 0
                  const maxCount = categoryTotals[0]?.[1] || 1
                  return (
                    <div key={cat} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[13px] text-nspulse-text">
                          {EVENT_CATEGORY_ICONS[cat as EventCategory]} {cat}
                        </span>
                        <span className="text-[13px] font-mono text-[#868E96]">
                          {count}{" "}
                          <span className="text-nspulse-subtle">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all duration-500"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            background:
                              EVENT_CATEGORY_COLORS[cat as EventCategory] ||
                              "#868E96",
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
                        background: "#1A1B1E",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#C1C2C5",
                      }}
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
                    border: `1px solid ${selectedCats.has(cat) ? EVENT_CATEGORY_COLORS[cat] : "rgba(255,255,255,0.08)"}`,
                    background: selectedCats.has(cat)
                      ? `${EVENT_CATEGORY_COLORS[cat]}22`
                      : "transparent",
                    color: selectedCats.has(cat)
                      ? EVENT_CATEGORY_COLORS[cat]
                      : "#5C5F66",
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
                    tick={{
                      fill: "#5C5F66",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: "#5C5F66",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
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

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-nspulse-card-border flex justify-between text-[11px] font-mono text-nspulse-subtle">
          <span>nspulse.com · data from lu.ma/ns</span>
          <span>categorized via AI</span>
        </div>
      </div>
    </div>
  )
}
