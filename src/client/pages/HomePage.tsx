import { getGraphQLClient } from "@shared/graphql/client"
import { GET_EVENT_STATS } from "@shared/graphql/queries"
import { useQuery } from "@tanstack/react-query"
import { format, parse } from "date-fns"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useTheme } from "../contexts/ThemeContext"

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

export function HomePage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const { data } = useQuery({
    queryKey: ["eventStats"],
    queryFn: async () => {
      const response = await getGraphQLClient().request<{
        getEventStats: {
          monthlyData: Record<string, any>[]
          totalEvents: number
        }
      }>(GET_EVENT_STATS)
      return response.getEventStats
    },
    staleTime: 5 * 60 * 1000,
  })

  const monthlyData = data?.monthlyData || []
  const totalEvents = data?.totalEvents || 0

  const sinceDate = useMemo(() => {
    const first = monthlyData[0]
    if (!first) return ""
    return format(parse(first.month, "yyyy-MM", new Date()), "MMM yyyy")
  }, [monthlyData])

  const chartData = useMemo(
    () =>
      monthlyData
        .filter((m: any) => m.total > 5)
        .map((m: any) => ({ ...m, name: formatMonth(m.month) })),
    [monthlyData],
  )

  const axisTick = {
    fill: isDark ? "#5C5F66" : "#9CA3AF",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
  }

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

      {/* Mini events chart */}
      {chartData.length > 0 && (
        <Link to="/events" className="block no-anchor-hover-styles mb-12 group">
          <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl p-6 transition-shadow hover:shadow-md">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-nspulse-heading">
                Events
              </h2>
              <span className="text-[13px] text-nspulse-muted group-hover:text-nspulse-accent transition-colors">
                View all →
              </span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? "#1A1B1E" : "#FFFFFF",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: isDark ? "#C1C2C5" : "#374151",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#E8590C"
                    strokeWidth={2}
                    fill="url(#homeGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Link>
      )}

      {/* Members placeholder */}
      <Link to="/members" className="block no-anchor-hover-styles group">
        <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl p-6 transition-shadow hover:shadow-md">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-nspulse-heading">
              Members
            </h2>
            <span className="text-[13px] text-nspulse-muted group-hover:text-nspulse-accent transition-colors">
              Coming soon →
            </span>
          </div>
          <p className="text-[14px] text-nspulse-muted mt-2">
            Member analytics and community insights.
          </p>
        </div>
      </Link>
    </div>
  )
}
