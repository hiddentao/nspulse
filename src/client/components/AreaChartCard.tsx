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

export interface AreaChartCardProps {
  title: string
  linkTo: string
  linkLabel: string
  data: { name: string; total: number }[]
  gradientId: string
  color?: string
}

export function AreaChartCard({
  title,
  linkTo,
  linkLabel,
  data,
  gradientId,
  color = "#E8590C",
}: AreaChartCardProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const axisTick = {
    fill: isDark ? "#5C5F66" : "#9CA3AF",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
  }

  return (
    <Link to={linkTo} className="block no-anchor-hover-styles group">
      <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl p-6 transition-shadow hover:shadow-md">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold text-nspulse-heading">
            {title}
          </h2>
          <span className="text-[13px] text-nspulse-muted group-hover:text-nspulse-accent transition-colors">
            {linkLabel}
          </span>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={color}
                    stopOpacity={isDark ? 0.3 : 0.15}
                  />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
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
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Link>
  )
}
