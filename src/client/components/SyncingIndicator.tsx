import { RefreshCw } from "lucide-react"

export function SyncingIndicator() {
  return (
    <div className="flex flex-col items-center gap-4 text-nspulse-muted">
      <RefreshCw
        size={32}
        className="text-nspulse-accent"
        style={{ animation: "spin 2s linear infinite" }}
      />
      <p className="text-sm font-mono tracking-wide">Syncing event data…</p>
      <style>
        {`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}
      </style>
    </div>
  )
}
