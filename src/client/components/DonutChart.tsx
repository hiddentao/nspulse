import { useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useTheme } from "../contexts/ThemeContext"

export interface DonutChartProps {
  data: [string, number][]
  colorMap: Record<string, string>
}

export function DonutChart({ data, colorMap }: DonutChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const pieData = useMemo(
    () =>
      data.map(([name, value]) => ({
        name,
        value,
        color: colorMap[name] || "#6b7280",
      })),
    [data, colorMap],
  )

  return (
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
            {pieData.map((entry) => (
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
  )
}
