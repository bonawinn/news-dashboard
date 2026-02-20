export type Section = 'news' | 'financials' | 'screener' | 'insiders' | 'macro' | 'alerts'

interface NavItem {
  key: Section
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'news', label: 'News & Sentiment', icon: '\u2139' },
  { key: 'financials', label: 'Financials', icon: '\u2261' },
  { key: 'screener', label: 'Screener', icon: '\u25A3' },
  { key: 'insiders', label: 'Insiders', icon: '\u2302' },
  { key: 'macro', label: 'Macro', icon: '\u2616' },
  { key: 'alerts', label: 'Alerts', icon: '\u266A' },
]

interface Props {
  active: Section
  collapsed: boolean
  mobileOpen: boolean
  onNavigate: (section: Section) => void
}

export function Sidebar({ active, collapsed, mobileOpen, onNavigate }: Props) {
  const transform = collapsed && !mobileOpen ? 'translateX(-220px)' : 'translateX(0)'

  return (
    <nav
      className="fixed top-0 left-0 w-[220px] h-screen bg-[#0a0a0a] border-r border-border flex flex-col z-[200] transition-transform duration-200 max-md:translate-x-[-220px]"
      style={{ transform }}
    >
      <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
        <span className="text-[1.3rem] text-accent">&#x25C8;</span>
        <span className="text-base font-bold tracking-tight">Alpha Terminal</span>
      </div>

      <ul className="list-none flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-none bg-transparent text-[0.82rem] font-semibold cursor-pointer transition-all text-left ${
                active === item.key
                  ? 'bg-accent-dim text-accent border-r-2 border-r-accent shadow-[inset_0_0_20px_rgba(51,226,154,0.05)]'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4 py-3 border-t border-border">
        <span className="text-[0.7rem] text-amber font-medium">v2.0 React</span>
      </div>
    </nav>
  )
}
