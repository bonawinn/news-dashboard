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
    <div className="flex gap-1 bg-surface rounded-[10px] p-1 mb-4 w-fit">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-1.5 border-none rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all ${
            active === t.key
              ? 'bg-white text-bg shadow-sm'
              : 'bg-transparent text-text-muted hover:text-text'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
