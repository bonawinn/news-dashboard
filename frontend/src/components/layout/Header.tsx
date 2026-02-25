import { useState } from 'react'
import { useNavigation } from '../../contexts/NavigationContext.tsx'

interface Props {
  title: string
  onToggleSidebar: () => void
  showBack?: boolean
}

export function Header({ title, onToggleSidebar, showBack }: Props) {
  const [searchTicker, setSearchTicker] = useState('')
  const { navigateToCompany, navigateBack } = useNavigation()

  function handleSearch() {
    const t = searchTicker.trim().toUpperCase()
    if (t) {
      navigateToCompany(t)
      setSearchTicker('')
    }
  }

  return (
    <header className="sticky top-0 z-[100] bg-bg/80 backdrop-blur-xl border-b border-border px-5 py-3 flex items-center gap-3">
      <button
        onClick={onToggleSidebar}
        className="bg-transparent border border-border rounded-lg text-text-muted text-[1.1rem] px-2 py-1 cursor-pointer hover:text-text hover:border-accent/30 transition-colors"
        title="Toggle sidebar"
      >
        &#x2630;
      </button>

      {showBack && (
        <button
          onClick={navigateBack}
          className="bg-transparent border border-border rounded-lg text-text-muted text-[0.9rem] px-2 py-1 cursor-pointer hover:text-text hover:border-accent/30 transition-colors"
          title="Go back"
        >
          &#x2190;
        </button>
      )}

      <h1 className="text-[1.1rem] font-bold whitespace-nowrap">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <input
          type="text"
          value={searchTicker}
          onChange={(e) => setSearchTicker(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Ticker lookup..."
          className="px-3 py-1 rounded-lg border border-border bg-bg text-text font-mono text-[0.82rem] placeholder:text-text-muted focus:outline-none focus:border-accent w-[130px]"
        />
        <button
          onClick={handleSearch}
          className="px-2.5 py-1 rounded-lg border border-border bg-surface text-text-muted text-[0.82rem] cursor-pointer hover:bg-surface-hover hover:text-text hover:border-accent transition-colors"
        >
          Go
        </button>
      </div>
    </header>
  )
}
