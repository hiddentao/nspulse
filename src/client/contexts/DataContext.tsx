import { getGraphQLClient } from "@shared/graphql/client"
import { GET_EVENT_STATS } from "@shared/graphql/queries"
import discussionData from "@shared/stats/discussion.json"
import receptionData from "@shared/stats/reception.json"
import { useQuery } from "@tanstack/react-query"
import { createContext, type ReactNode, useContext, useMemo } from "react"

export interface EventStatsData {
  monthlyData: Record<string, any>[]
  categoryTotals: [string, number][]
  totalEvents: number
  lastUpdated: string | null
  dailyData: { date: string; total: number }[]
  totalRegistrations: number
  monthlyRegistrationData: Record<string, any>[]
  dailyRegistrationData: { date: string; total: number }[]
  categoryRegistrationTotals: [string, number][]
}

export interface MemberStatsData {
  totalIntros: number
  firstDate: string
  lastDate: string
  skillCategories: [string, number][]
  interestCategories: [string, number][]
}

export interface RankedItem {
  name: string
  description: string
  url?: string
  score: number
}

export interface DiscussionStatsData {
  totalMessages: number
  firstDate: string
  lastDate: string
  ideas: RankedItem[]
  apps: RankedItem[]
}

interface DataContextValue {
  eventStats: EventStatsData | undefined
  memberStats: MemberStatsData
  discussionStats: DiscussionStatsData
  isLoading: boolean
}

const DataContext = createContext<DataContextValue | null>(null)

export function formatMonth(m: string): string {
  const [y, mo] = m.split("-")
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return `${months[Number.parseInt(mo!) - 1]} ${y!.slice(2)}`
}

function parseMemberStats(): MemberStatsData {
  const raw = receptionData as unknown as {
    totalIntros: number
    firstDate: string
    lastDate: string
    skillCategories: Record<string, number>
    interestCategories: Record<string, number>
  }

  const sortedSkills = Object.entries(raw.skillCategories).sort(
    ([, a], [, b]) => b - a,
  ) as [string, number][]

  const sortedInterests = Object.entries(raw.interestCategories).sort(
    ([, a], [, b]) => b - a,
  ) as [string, number][]

  return {
    totalIntros: raw.totalIntros,
    firstDate: raw.firstDate,
    lastDate: raw.lastDate,
    skillCategories: sortedSkills,
    interestCategories: sortedInterests,
  }
}

function parseDiscussionStats(): DiscussionStatsData {
  const raw = discussionData as unknown as {
    totalMessages: number
    firstDate: string
    lastDate: string
    ideas: RankedItem[]
    apps: RankedItem[]
  }

  return {
    totalMessages: raw.totalMessages,
    firstDate: raw.firstDate,
    lastDate: raw.lastDate,
    ideas: [...raw.ideas].sort((a, b) => b.score - a.score),
    apps: [...raw.apps].sort((a, b) => b.score - a.score),
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["eventStats"],
    queryFn: async () => {
      const response = await getGraphQLClient().request<{
        getEventStats: EventStatsData
      }>(GET_EVENT_STATS)
      return response.getEventStats
    },
    staleTime: 5 * 60 * 1000,
  })

  const memberStats = useMemo(() => parseMemberStats(), [])
  const discussionStats = useMemo(() => parseDiscussionStats(), [])

  return (
    <DataContext.Provider
      value={{ eventStats: data, memberStats, discussionStats, isLoading }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
