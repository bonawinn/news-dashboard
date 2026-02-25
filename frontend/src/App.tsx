import { useState, useCallback, useMemo } from 'react'
import { Sidebar } from './components/layout/Sidebar.tsx'
import type { Section, AppView } from './components/layout/Sidebar.tsx'
import { Header } from './components/layout/Header.tsx'
import { NavigationContext } from './contexts/NavigationContext.tsx'
import { NewsPage } from './pages/NewsPage.tsx'
import { FinancialsPage } from './pages/FinancialsPage.tsx'
import { ScreenerPage } from './pages/ScreenerPage.tsx'
import { InsidersPage } from './pages/InsidersPage.tsx'
import { MacroPage } from './pages/MacroPage.tsx'
import { AlertsPage } from './pages/AlertsPage.tsx'
import { CompanyDetailPage } from './pages/CompanyDetailPage.tsx'

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
  const [active, setActive] = useState<AppView>('news')
  const [detailTicker, setDetailTicker] = useState<string | null>(null)
  const [prevSection, setPrevSection] = useState<Section>('news')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigateToCompany = useCallback((ticker: string) => {
    if (active !== 'company') {
      setPrevSection(active as Section)
    }
    setDetailTicker(ticker.toUpperCase())
    setActive('company')
    setMobileOpen(false)
  }, [active])

  const navigateBack = useCallback(() => {
    setActive(prevSection)
    setDetailTicker(null)
    setMobileOpen(false)
  }, [prevSection])

  const handleNavigate = useCallback((section: Section) => {
    setActive(section)
    setDetailTicker(null)
    setMobileOpen(false)
  }, [])

  const handleToggle = useCallback(() => {
    if (window.innerWidth <= 768) {
      setMobileOpen((p) => !p)
    } else {
      setCollapsed((p) => !p)
    }
  }, [])

  const navContext = useMemo(() => ({
    navigateToCompany,
    navigateBack,
  }), [navigateToCompany, navigateBack])

  const isCompany = active === 'company'
  const title = isCompany ? (detailTicker ?? 'Company') : TITLES[active as Section]

  return (
    <NavigationContext.Provider value={navContext}>
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
        <Header title={title} onToggleSidebar={handleToggle} showBack={isCompany} />
        <main className={`px-6 py-5 pb-12 mx-auto ${isCompany ? 'max-w-[1440px]' : 'max-w-[1200px]'}`}>
          {isCompany && detailTicker ? (
            <CompanyDetailPage ticker={detailTicker} />
          ) : (
            (() => {
              const PageComponent = PAGES[active as Section]
              return PageComponent ? <PageComponent /> : null
            })()
          )}
        </main>
      </div>
    </NavigationContext.Provider>
  )
}
