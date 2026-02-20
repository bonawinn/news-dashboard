import { useState, useCallback } from 'react'
import { Sidebar } from './components/layout/Sidebar.tsx'
import type { Section } from './components/layout/Sidebar.tsx'
import { Header } from './components/layout/Header.tsx'
import { NewsPage } from './pages/NewsPage.tsx'
import { FinancialsPage } from './pages/FinancialsPage.tsx'
import { ScreenerPage } from './pages/ScreenerPage.tsx'
import { InsidersPage } from './pages/InsidersPage.tsx'
import { MacroPage } from './pages/MacroPage.tsx'
import { AlertsPage } from './pages/AlertsPage.tsx'

const TITLES: Record<Section, string> = {
  news: 'News & Sentiment',
  financials: 'Financial Statements',
  screener: 'Equity Screener',
  insiders: 'Insider Trading',
  macro: 'Macro Dashboard',
  alerts: 'Alerts',
}

const PAGES: Record<Section, React.FC> = {
  news: NewsPage,
  financials: FinancialsPage,
  screener: ScreenerPage,
  insiders: InsidersPage,
  macro: MacroPage,
  alerts: AlertsPage,
}

export default function App() {
  const [active, setActive] = useState<Section>('news')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavigate = useCallback((section: Section) => {
    setActive(section)
    setMobileOpen(false)
  }, [])

  const handleToggle = useCallback(() => {
    if (window.innerWidth <= 768) {
      setMobileOpen((p) => !p)
    } else {
      setCollapsed((p) => !p)
    }
  }, [])

  const PageComponent = PAGES[active]

  return (
    <>
      <Sidebar
        active={active}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={handleNavigate}
      />
      <div
        className="flex-1 min-h-screen transition-[margin-left] duration-200"
        style={{ marginLeft: collapsed ? 0 : 220 }}
      >
        <Header title={TITLES[active]} onToggleSidebar={handleToggle} />
        <main className="px-5 py-4 pb-10 max-w-[1200px] mx-auto">
          <PageComponent />
        </main>
      </div>
    </>
  )
}
