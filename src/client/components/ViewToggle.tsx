import { cn } from "../utils/cn"

export interface ViewToggleProps<T extends string> {
  options: T[]
  value: T
  onChange: (v: T) => void
  size?: "sm" | "md"
}

export function ViewToggle<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: ViewToggleProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          type="button"
          className={cn(
            "rounded-md border-none font-semibold font-mono uppercase tracking-[0.05em] cursor-pointer",
            size === "sm" ? "px-3 py-1 text-xs" : "px-5 py-2 text-sm",
            value === v
              ? "bg-nspulse-heading text-nspulse-bg"
              : "bg-transparent text-nspulse-muted hover:text-nspulse-text",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
