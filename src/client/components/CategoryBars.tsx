import { useTheme } from "../contexts/ThemeContext"

export interface CategoryBarsProps {
  data: [string, number][]
  total: number
  colorMap: Record<string, string>
  iconMap?: Record<string, string>
}

export function CategoryBars({
  data,
  total,
  colorMap,
  iconMap,
}: CategoryBarsProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const maxCount = data[0]?.[1] || 1

  return (
    <div>
      {data.map(([cat, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={cat} className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-[13px] text-nspulse-text">
                {iconMap?.[cat] ? `${iconMap[cat]} ` : ""}
                {cat}
              </span>
              <span className="text-[13px] font-mono text-nspulse-text">
                {count} <span className="text-nspulse-muted">({pct}%)</span>
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
                  background: colorMap[cat] || "#6b7280",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
