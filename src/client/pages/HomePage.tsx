import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  getCategoryColor,
  MEMBER_SKILL_CATEGORY_COLORS,
  RANKED_ITEM_COLORS,
} from "../../shared/constants"
import { AreaChartCard } from "../components/AreaChartCard"
import { DonutChart } from "../components/DonutChart"
import { formatMonth, type RankedItem, useData } from "../contexts/DataContext"

function buildSkillColorMap(
  categories: [string, number][],
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [cat] of categories) {
    result[cat] = getCategoryColor(MEMBER_SKILL_CATEGORY_COLORS, cat)
  }
  return result
}

function buildRankedColorMap(items: RankedItem[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (let i = 0; i < items.length; i++) {
    result[items[i]!.name] = RANKED_ITEM_COLORS[i % RANKED_ITEM_COLORS.length]!
  }
  return result
}

export function HomePage() {
  const { eventStats, memberStats, discussionStats } = useData()

  const monthlyData = eventStats?.monthlyData || []

  const eventsChartData = useMemo(
    () =>
      monthlyData
        .filter((m: any) => m.total > 5)
        .map((m: any) => ({ ...m, name: formatMonth(m.month) })),
    [monthlyData],
  )

  const skillColorMap = useMemo(
    () => buildSkillColorMap(memberStats.skillCategories),
    [memberStats.skillCategories],
  )

  const ideaColorMap = useMemo(
    () => buildRankedColorMap(discussionStats.ideas),
    [discussionStats.ideas],
  )

  const ideaDonutData: [string, number][] = useMemo(
    () => discussionStats.ideas.map((item) => [item.name, item.score]),
    [discussionStats.ideas],
  )

  return (
    <div className="px-8 md:px-12 py-12 max-w-[1200px]">
      <h1 className="text-4xl font-bold text-nspulse-heading tracking-tight mb-3">
        Community analytics for Network School
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {eventsChartData.length > 0 && (
          <AreaChartCard
            title="Events"
            linkTo="/events"
            linkLabel="View all →"
            data={eventsChartData}
            gradientId="homeEventsGrad"
          />
        )}

        {memberStats.skillCategories.length > 0 && (
          <Link to="/members" className="block no-anchor-hover-styles group">
            <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl p-6 transition-shadow hover:shadow-md h-full">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-semibold text-nspulse-heading">
                  Members
                </h2>
                <span className="text-[13px] text-nspulse-muted group-hover:text-nspulse-accent transition-colors">
                  View all →
                </span>
              </div>
              <div className="h-[200px] flex items-center justify-center">
                <DonutChart
                  data={memberStats.skillCategories}
                  colorMap={skillColorMap}
                  size={190}
                  outerRadius={80}
                  innerRadius={40}
                />
              </div>
            </div>
          </Link>
        )}

        {discussionStats.ideas.length > 0 && (
          <Link to="/ideas" className="block no-anchor-hover-styles group">
            <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl p-6 transition-shadow hover:shadow-md h-full">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-semibold text-nspulse-heading">
                  Ideas
                </h2>
                <span className="text-[13px] text-nspulse-muted group-hover:text-nspulse-accent transition-colors">
                  View all →
                </span>
              </div>
              <div className="h-[200px] flex items-center justify-center">
                <DonutChart
                  data={ideaDonutData}
                  colorMap={ideaColorMap}
                  size={190}
                  outerRadius={80}
                  innerRadius={40}
                />
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
