export function Footer() {
  return (
    <footer className="border-t border-nspulse-card-border px-8 md:px-12 py-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 text-[11px] font-mono text-nspulse-subtle">
        <span>
          Made with ❤️ by{" "}
          <a
            href="https://x.com/taoofdev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-nspulse-text"
          >
            @taoofdev
          </a>
        </span>
        <span className="flex gap-3">
          <a
            href="https://github.com/hiddentao/nspulse"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-nspulse-text"
          >
            View on Github
          </a>
        </span>
      </div>
      <div className="mt-2 text-[11px] font-mono text-nspulse-subtle">
        This is an unofficial dashboard and is not affiliated with NS
      </div>
    </footer>
  )
}
