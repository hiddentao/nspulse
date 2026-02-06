import { validateClientConfig } from "@shared/config/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useMemo } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ToastProvider } from "./components/Toast"
import { AuthProvider } from "./contexts/AuthContext"
import { SocketProvider } from "./contexts/SocketContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { HomePage } from "./pages/HomePage"

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
              <SocketProvider>
                <ToastProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                    </Routes>
                  </BrowserRouter>
                </ToastProvider>
              </SocketProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  )
}
