export interface StatCardProps {
  label: string
  value: string | number
  sub?: string
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-nspulse-card-bg border border-nspulse-card-border rounded-xl px-6 py-5 flex-1 min-w-[160px]">
      <div className="text-[13px] text-nspulse-muted tracking-[0.05em] uppercase mb-2">
        {label}
      </div>
      <div className="text-4xl font-bold leading-none text-nspulse-heading">
        {value}
      </div>
      {sub && (
        <div className="text-[13px] text-nspulse-muted mt-1.5">{sub}</div>
      )}
    </div>
  )
}
