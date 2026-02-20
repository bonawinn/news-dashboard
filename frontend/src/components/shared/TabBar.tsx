interface Tab {
  key: string
  label: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-0.5 border-b-2 border-border mb-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 border-none bg-transparent font-mono text-[0.8rem] font-semibold cursor-pointer border-b-2 -mb-0.5 transition-all ${
            active === t.key
              ? 'text-accent border-b-accent'
              : 'text-text-muted border-b-transparent hover:text-text'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
