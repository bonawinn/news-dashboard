interface Props {
  label: string
  value: string
  sub?: string
}

export function MetricCard({ label, value, sub }: Props) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="text-[0.7rem] font-bold uppercase tracking-wider text-text-muted mb-1">
        {label}
      </div>
      <div className="text-[1.1rem] font-bold">{value}</div>
      {sub && <div className="text-[0.72rem] text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}
