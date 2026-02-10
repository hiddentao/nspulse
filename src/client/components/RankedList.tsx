import type { RankedItem } from "../contexts/DataContext"
import { useTheme } from "../contexts/ThemeContext"

export interface RankedListProps {
  data: RankedItem[]
  colorMap: Record<string, string>
}

export function RankedList({ data, colorMap }: RankedListProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const maxScore = data[0]?.score || 1

  return (
    <div>
      {data.map((item, i) => (
        <div key={item.name} className="mb-4">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-[13px] font-mono text-nspulse-muted w-5 shrink-0">
              {i + 1}.
            </span>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium hover:underline"
              >
                {item.name}
              </a>
            ) : (
              <span className="text-[13px] font-medium text-nspulse-text">
                {item.name}
              </span>
            )}
            <span className="text-[13px] font-mono text-nspulse-muted ml-auto shrink-0">
              {item.score}
            </span>
          </div>
          <div className="ml-7 mb-1.5">
            <span className="text-[12px] text-nspulse-muted leading-tight">
              {item.description}
            </span>
          </div>
          <div
            className="ml-7 h-1.5 rounded-sm overflow-hidden"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{
                width: `${(item.score / maxScore) * 100}%`,
                background: colorMap[item.name] || "#6b7280",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
