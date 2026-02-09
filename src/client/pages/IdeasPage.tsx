import { format } from "date-fns"
import { Info } from "lucide-react"
import { useMemo, useState } from "react"
import { RANKED_ITEM_COLORS } from "../../shared/constants"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/Dialog"
import { DonutChart } from "../components/DonutChart"
import { RankedList } from "../components/RankedList"
import { ViewToggle } from "../components/ViewToggle"
import type { RankedItem } from "../contexts/DataContext"
import { useData } from "../contexts/DataContext"

type IdeaView = "ideas" | "apps"

function buildRankedColorMap(items: RankedItem[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (let i = 0; i < items.length; i++) {
    result[items[i]!.name] = RANKED_ITEM_COLORS[i % RANKED_ITEM_COLORS.length]!
  }
  return result
}

function toDonutData(items: RankedItem[]): [string, number][] {
  return items.map((item) => [item.name, item.score])
}

export function IdeasPage() {
  const { discussionStats } = useData()
  const [view, setView] = useState<IdeaView>("ideas")
  const [showInfo, setShowInfo] = useState(false)

  const ideaColorMap = useMemo(
    () => buildRankedColorMap(discussionStats.ideas),
    [discussionStats.ideas],
  )

  const appColorMap = useMemo(
    () => buildRankedColorMap(discussionStats.apps),
    [discussionStats.apps],
  )

  const ideaDonutData = useMemo(
    () => toDonutData(discussionStats.ideas),
    [discussionStats.ideas],
  )

  const appDonutData = useMemo(
    () => toDonutData(discussionStats.apps),
    [discussionStats.apps],
  )

  const activeItems =
    view === "ideas" ? discussionStats.ideas : discussionStats.apps
  const activeColorMap = view === "ideas" ? ideaColorMap : appColorMap
  const activeDonutData = view === "ideas" ? ideaDonutData : appDonutData

  return (
    <div className="px-8 md:px-12 py-8 max-w-[1200px]">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-3xl font-bold text-nspulse-heading">Ideas</h1>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="text-nspulse-muted hover:text-nspulse-text transition-colors"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-8">
        <ViewToggle
          options={["ideas", "apps"] as IdeaView[]}
          value={view}
          onChange={setView}
        />
      </div>

      {activeItems.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold text-nspulse-heading mb-5">
            {view === "ideas" ? "Top Ideas" : "Top Apps & Projects"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RankedList data={activeItems} colorMap={activeColorMap} />
            <DonutChart data={activeDonutData} colorMap={activeColorMap} />
          </div>
        </div>
      ) : (
        <p className="text-nspulse-muted">No data available yet.</p>
      )}

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="border-nspulse-card-border bg-nspulse-card-bg text-nspulse-text"
        >
          <DialogHeader>
            <DialogTitle className="text-nspulse-heading">
              Data Source
            </DialogTitle>
            <DialogDescription className="text-nspulse-muted">
              {discussionStats.totalMessages > 0 ? (
                <>
                  {discussionStats.totalMessages.toLocaleString()} messages from{" "}
                  {format(new Date(discussionStats.firstDate), "MMM yyyy")} to{" "}
                  {format(new Date(discussionStats.lastDate), "MMM yyyy")},
                  sourced from the NS Discord #discussion channel and ranked via
                  AI.
                </>
              ) : (
                "No discussion data has been processed yet."
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
