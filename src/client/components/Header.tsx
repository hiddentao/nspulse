import { NavLink } from "react-router-dom"
import { cn } from "../utils/cn"
import { ThemeSwitcher } from "./ThemeSwitcher"

function NavTab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-2 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors no-anchor-hover-styles",
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
  return (
    <header className="sticky top-0 z-50 border-b border-nspulse-card-border bg-nspulse-bg/80 backdrop-blur-md">
      <div className="px-4 md:px-12 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6">
          <NavLink
            to="/"
            className="text-xs md:text-sm font-mono font-bold text-nspulse-accent tracking-wide no-anchor-hover-styles"
          >
            NS Pulse
          </NavLink>
          <nav className="flex items-center">
            <NavTab to="/events">Events</NavTab>
            <NavTab to="/members">Members</NavTab>
            <NavTab to="/ideas">Ideas</NavTab>
          </nav>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  )
}
