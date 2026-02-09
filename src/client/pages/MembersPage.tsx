import { format } from "date-fns"
import { Info } from "lucide-react"
import { useMemo, useState } from "react"
import {
  getCategoryColor,
  MEMBER_INTEREST_CATEGORY_COLORS,
  MEMBER_SKILL_CATEGORY_COLORS,
} from "../../shared/constants"
import { CategoryBars } from "../components/CategoryBars"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/Dialog"
import { DonutChart } from "../components/DonutChart"
import { ViewToggle } from "../components/ViewToggle"
import { useData } from "../contexts/DataContext"

type MemberView = "skills" | "interests"

function buildColorMap(
  baseMap: Record<string, string>,
  categories: [string, number][],
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [cat] of categories) {
    result[cat] = getCategoryColor(baseMap, cat)
  }
  return result
}

export function MembersPage() {
  const { memberStats } = useData()
  const [view, setView] = useState<MemberView>("skills")
  const [showInfo, setShowInfo] = useState(false)

  const skillColorMap = useMemo(
    () =>
      buildColorMap(MEMBER_SKILL_CATEGORY_COLORS, memberStats.skillCategories),
    [memberStats.skillCategories],
  )

  const interestColorMap = useMemo(
    () =>
      buildColorMap(
        MEMBER_INTEREST_CATEGORY_COLORS,
        memberStats.interestCategories,
      ),
    [memberStats.interestCategories],
  )

  const totalSkills = useMemo(
    () => memberStats.skillCategories.reduce((sum, [, v]) => sum + v, 0),
    [memberStats.skillCategories],
  )

  const totalInterests = useMemo(
    () => memberStats.interestCategories.reduce((sum, [, v]) => sum + v, 0),
    [memberStats.interestCategories],
  )

  return (
    <div className="px-8 md:px-12 py-8 max-w-[1200px]">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-3xl font-bold text-nspulse-heading">Members</h1>
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
          options={["skills", "interests"] as MemberView[]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === "skills" && (
        <div>
          <h2 className="text-xl font-semibold text-nspulse-heading mb-5">
            Skill Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CategoryBars
              data={memberStats.skillCategories}
              total={totalSkills}
              colorMap={skillColorMap}
            />
            <DonutChart
              data={memberStats.skillCategories}
              colorMap={skillColorMap}
            />
          </div>
        </div>
      )}

      {view === "interests" && (
        <div>
          <h2 className="text-xl font-semibold text-nspulse-heading mb-5">
            Interest Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CategoryBars
              data={memberStats.interestCategories}
              total={totalInterests}
              colorMap={interestColorMap}
            />
            <DonutChart
              data={memberStats.interestCategories}
              colorMap={interestColorMap}
            />
          </div>
        </div>
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
              {memberStats.totalIntros.toLocaleString()} introductions from{" "}
              {format(new Date(memberStats.firstDate), "MMM yyyy")} to{" "}
              {format(new Date(memberStats.lastDate), "MMM yyyy")}, sourced from
              the NS Discord #reception channel and categorized via AI.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
