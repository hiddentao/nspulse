import { validateClientConfig } from "@shared/config/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useMemo } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Layout } from "./components/Layout"
import { ToastProvider } from "./components/Toast"
import { AuthProvider } from "./contexts/AuthContext"
import { DataProvider } from "./contexts/DataContext"
import { SocketProvider } from "./contexts/SocketContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { EventsPage } from "./pages/EventsPage"
import { HomePage } from "./pages/HomePage"
import { MembersPage } from "./pages/MembersPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
})

export function App() {
  useMemo(() => {
    validateClientConfig()
  }, [])

  return (
    <div className="flex flex-col w-full min-h-screen">
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <DataProvider>
                <SocketProvider>
                  <ToastProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route element={<Layout />}>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/events" element={<EventsPage />} />
                          <Route path="/members" element={<MembersPage />} />
                        </Route>
                      </Routes>
                    </BrowserRouter>
                  </ToastProvider>
                </SocketProvider>
              </DataProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  )
}
