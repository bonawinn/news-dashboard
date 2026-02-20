export interface FilterDef {
  key: string
  label: string
}

interface Props {
  filters: FilterDef[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}

export function FilterGrid({ filters, values, onChange }: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2 mb-4">
      {filters.map((f) => (
        <div
          key={f.key}
          className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2"
        >
          <label className="text-[0.75rem] text-text-muted whitespace-nowrap min-w-[100px]">
            {f.label}
          </label>
          <input
            type="number"
            step="any"
            value={values[f.key] ?? ''}
            onChange={(e) => onChange(f.key, e.target.value)}
            className="w-20 px-2 py-1 rounded-lg border border-border bg-bg text-text font-mono text-[0.8rem] focus:outline-none focus:border-accent"
          />
        </div>
      ))}
    </div>
  )
}
