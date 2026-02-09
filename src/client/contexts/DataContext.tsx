import { getGraphQLClient } from "@shared/graphql/client"
import { GET_EVENT_STATS } from "@shared/graphql/queries"
import { useQuery } from "@tanstack/react-query"
import { createContext, type ReactNode, useContext } from "react"

export interface EventStatsData {
  monthlyData: Record<string, any>[]
  categoryTotals: [string, number][]
  totalEvents: number
  lastUpdated: string | null
  dailyData: { date: string; total: number }[]
}

interface DataContextValue {
  eventStats: EventStatsData | undefined
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

  return (
    <DataContext.Provider value={{ eventStats: data, isLoading }}>
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
