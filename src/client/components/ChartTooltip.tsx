import { useTheme } from "../contexts/ThemeContext"

export function ChartTooltip({ active, payload, label }: any) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  if (!active || !payload?.length) return null

  const filtered = payload
    .filter((p: any) => p.value > 0)
    .sort((a: any, b: any) => b.value - a.value)

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
      {filtered.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
      {filtered.length > 1 && (
        <div
          className="flex justify-between gap-4 pt-1.5 mt-1.5 font-semibold"
          style={{
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
          }}
        >
          <span>Total</span>
          <span>
            {filtered.reduce((sum: number, p: any) => sum + p.value, 0)}
          </span>
        </div>
      )}
    </div>
  )
}
