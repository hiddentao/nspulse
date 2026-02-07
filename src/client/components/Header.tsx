import { Info } from "lucide-react"
import { useState } from "react"
import { NavLink } from "react-router-dom"
import { cn } from "../utils/cn"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./Dialog"
import { ThemeSwitcher } from "./ThemeSwitcher"

function NavTab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-4 py-1.5 rounded-md text-sm font-medium transition-colors no-anchor-hover-styles",
          isActive
            ? "bg-nspulse-heading text-nspulse-bg"
            : "text-nspulse-muted hover:text-nspulse-text",
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function Header() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-nspulse-card-border bg-nspulse-bg/80 backdrop-blur-md">
        <div className="px-8 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              className="text-sm font-mono font-bold text-nspulse-accent tracking-wide no-anchor-hover-styles"
            >
              NS Pulse
            </NavLink>
            <nav className="flex items-center gap-1">
              <NavTab to="/events">Events</NavTab>
              <NavTab to="/members">Members</NavTab>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="text-nspulse-muted hover:text-nspulse-text transition-colors"
            >
              <Info className="h-5 w-5" />
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="border-nspulse-card-border bg-nspulse-card-bg text-nspulse-text"
        >
          <DialogHeader>
            <DialogTitle className="text-nspulse-heading">
              About NS Pulse
            </DialogTitle>
            <DialogDescription className="text-nspulse-muted">
              A stats dashboard for{" "}
              <a
                href="https://ns.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-nspulse-text"
              >
                Network School
              </a>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs font-mono text-nspulse-subtle flex flex-col gap-1">
            <span>
              Built by{" "}
              <a
                href="https://ns.com/taoofdev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-nspulse-text"
              >
                @taoofdev
              </a>
            </span>
            <span>
              View on{" "}
              <a
                href="https://github.com/hiddentao/nspulse"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-nspulse-text"
              >
                Github
              </a>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
