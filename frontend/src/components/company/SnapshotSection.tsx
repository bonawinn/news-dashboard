interface SnapshotItem {
  label: string
  value: string
}

interface Props {
  title: string
  items: SnapshotItem[]
}

export function SnapshotSection({ title, items }: Props) {
  return (
    <div className="mb-4">
      <h4 className="text-[0.68rem] font-semibold uppercase tracking-wider text-accent mb-2">{title}</h4>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-[0.78rem]">
            <span className="text-text-muted">{item.label}</span>
            <span className="font-mono font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
