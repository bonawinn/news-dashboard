interface Props {
  label: string
  value: string
  sub?: string
}

export function MetricCard({ label, value, sub }: Props) {
  return (
    <div className="card-gradient border border-border rounded-[14px] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
      <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent mb-1">
        {label}
      </div>
      <div className="text-[1.1rem] font-bold font-mono">{value}</div>
      {sub && <div className="text-[0.72rem] text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}
