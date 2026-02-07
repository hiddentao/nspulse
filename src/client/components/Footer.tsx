export function Footer() {
  return (
    <footer className="border-t border-nspulse-card-border px-8 md:px-12 py-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 text-[11px] font-mono text-nspulse-subtle">
        <span>
          Made with ❤️ by{" "}
          <a
            href="https://ns.com/taoofdev"
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
    </footer>
  )
}
