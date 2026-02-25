import { useState, useEffect, useCallback } from 'react'
import { getTemplates, runScreenAdvanced, runTemplate, getFilterOptions } from '../api/screener.ts'
import { SCREENER_CATEGORIES } from '../config/screenerFilters.ts'
import { AdvancedFilterPanel } from '../components/shared/AdvancedFilterPanel.tsx'
import { ColumnSelector } from '../components/shared/ColumnSelector.tsx'
import { DataTable } from '../components/shared/DataTable.tsx'
import type { Column } from '../components/shared/DataTable.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import { TickerLink } from '../components/shared/TickerLink.tsx'
import { formatNumber, formatPct, formatUSD, colorClass } from '../utils/format.ts'
import type { ScreenerTemplate, ScreenerRow, FilterOptionsResponse } from '../types/api.ts'

const ALL_COLUMNS: { key: string; label: string; type: 'str' | 'num'; render?: (r: ScreenerRow) => React.ReactNode }[] = [
  { key: 'ticker', label: 'Ticker', type: 'str', render: (r) => <TickerLink ticker={r.ticker} /> },
  { key: 'name', label: 'Name', type: 'str' },
  { key: 'price', label: 'Price', type: 'num', render: (r) => <>{formatNumber(r.price)}</> },
  { key: 'sector', label: 'Sector', type: 'str' },
  { key: 'industry', label: 'Industry', type: 'str' },
  { key: 'market_cap', label: 'Mkt Cap', type: 'num', render: (r) => <>{formatUSD(r.market_cap)}</> },
  { key: 'pe_ratio', label: 'P/E', type: 'num', render: (r) => <span className={colorClass(r.pe_ratio)}>{formatNumber(r.pe_ratio)}</span> },
  { key: 'forward_pe', label: 'Fwd P/E', type: 'num', render: (r) => <>{formatNumber(r.forward_pe)}</> },
  { key: 'peg_ratio', label: 'PEG', type: 'num', render: (r) => <>{formatNumber(r.peg_ratio)}</> },
  { key: 'pb_ratio', label: 'P/B', type: 'num', render: (r) => <>{formatNumber(r.pb_ratio)}</> },
  { key: 'price_to_sales', label: 'P/S', type: 'num', render: (r) => <>{formatNumber(r.price_to_sales)}</> },
  { key: 'ev_to_ebitda', label: 'EV/EBITDA', type: 'num', render: (r) => <>{formatNumber(r.ev_to_ebitda)}</> },
  { key: 'roe', label: 'ROE%', type: 'num', render: (r) => <span className={colorClass(r.roe)}>{formatPct(r.roe)}</span> },
  { key: 'roa', label: 'ROA%', type: 'num', render: (r) => <span className={colorClass(r.roa)}>{formatPct(r.roa)}</span> },
  { key: 'gross_margin', label: 'Gross M%', type: 'num', render: (r) => <>{formatPct(r.gross_margin)}</> },
  { key: 'operating_margin', label: 'Oper M%', type: 'num', render: (r) => <>{formatPct(r.operating_margin)}</> },
  { key: 'net_margin', label: 'Net M%', type: 'num', render: (r) => <>{formatPct(r.net_margin)}</> },
  { key: 'dividend_yield', label: 'Div%', type: 'num', render: (r) => <>{formatPct(r.dividend_yield)}</> },
  { key: 'debt_to_equity', label: 'D/E', type: 'num', render: (r) => <>{formatNumber(r.debt_to_equity)}</> },
  { key: 'current_ratio', label: 'Curr Ratio', type: 'num', render: (r) => <>{formatNumber(r.current_ratio)}</> },
  { key: 'revenue_growth', label: 'Rev Grw%', type: 'num', render: (r) => <span className={colorClass(r.revenue_growth)}>{formatPct(r.revenue_growth)}</span> },
  { key: 'earnings_growth', label: 'Earn Grw%', type: 'num', render: (r) => <span className={colorClass(r.earnings_growth)}>{formatPct(r.earnings_growth)}</span> },
  { key: 'beta', label: 'Beta', type: 'num', render: (r) => <>{formatNumber(r.beta)}</> },
  { key: '52w_change', label: '52W%', type: 'num', render: (r) => <span className={colorClass(r['52w_change'])}>{formatPct(r['52w_change'])}</span> },
  { key: 'avg_volume', label: 'Avg Vol', type: 'num', render: (r) => <>{formatNumber(r.avg_volume, 0)}</> },
  { key: 'relative_volume', label: 'Rel Vol', type: 'num', render: (r) => <>{formatNumber(r.relative_volume)}</> },
  { key: 'rsi', label: 'RSI', type: 'num', render: (r) => <>{formatNumber(r.rsi)}</> },
  { key: 'sma20_dist', label: 'SMA20%', type: 'num', render: (r) => <span className={colorClass(r.sma20_dist)}>{formatPct(r.sma20_dist)}</span> },
  { key: 'sma50_dist', label: 'SMA50%', type: 'num', render: (r) => <span className={colorClass(r.sma50_dist)}>{formatPct(r.sma50_dist)}</span> },
  { key: 'sma200_dist', label: 'SMA200%', type: 'num', render: (r) => <span className={colorClass(r.sma200_dist)}>{formatPct(r.sma200_dist)}</span> },
  { key: 'volatility', label: 'Vol%', type: 'num', render: (r) => <>{formatPct(r.volatility)}</> },
  { key: 'change_pct', label: 'Chg%', type: 'num', render: (r) => <span className={colorClass(r.change_pct)}>{formatPct(r.change_pct)}</span> },
  { key: 'short_float', label: 'Short%', type: 'num', render: (r) => <>{formatPct(r.short_float)}</> },
  { key: 'insider_pct', label: 'Insider%', type: 'num', render: (r) => <>{formatPct(r.insider_pct)}</> },
  { key: 'institutional_pct', label: 'Inst%', type: 'num', render: (r) => <>{formatPct(r.institutional_pct)}</> },
]

const DEFAULT_VISIBLE = ['ticker', 'name', 'price', 'sector', 'market_cap', 'pe_ratio', 'roe', 'dividend_yield', '52w_change']

export function ScreenerPage() {
  const [templates, setTemplates] = useState<Record<string, ScreenerTemplate>>({})
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null)
  const [results, setResults] = useState<ScreenerRow[]>([])
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string | null>(null)

  useEffect(() => {
    getTemplates()
      .then((data) => setTemplates(data.templates || {}))
      .catch(() => {})
    getFilterOptions()
      .then((data) => setFilterOptions(data))
      .catch(() => {})
  }, [])

  function handleTemplateChange(key: string) {
    setSelectedTemplate(key)
    const newVals: Record<string, string> = {}
    if (key && templates[key]) {
      const filters = templates[key].filters || {}
      for (const [k, v] of Object.entries(filters)) {
        newVals[k] = String(v)
      }
    }
    setFilterValues(newVals)
  }

  function handleFilterChange(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
  }

  const doRun = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      let data
      if (selectedTemplate && templates[selectedTemplate]) {
        data = await runTemplate(selectedTemplate)
      } else {
        // Build filter object for POST
        const filters: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(filterValues)) {
          if (v === '') continue
          // Try to convert to number for numeric filters
          const num = Number(v)
          filters[k] = isNaN(num) ? v : num
        }
        data = await runScreenAdvanced(filters)
      }
      if (data.error) throw new Error(data.error)
      setResults(data.results || [])
      setStatusText(`${(data.results || []).length} stocks found out of ${data.total_screened || '?'} screened`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate, templates, filterValues])

  function handleClearFilters() {
    setFilterValues({})
    setSelectedTemplate('')
  }

  const columns: Column<ScreenerRow>[] = ALL_COLUMNS
    .filter((c) => visibleCols.includes(c.key))
    .map((c) => ({ key: c.key, label: c.label, type: c.type, render: c.render }))

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <select
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-text text-[0.82rem] focus:outline-none focus:border-accent"
        >
          <option value="">Custom Filters</option>
          {Object.entries(templates).map(([key, tpl]) => (
            <option key={key} value={key}>{tpl.name || key}</option>
          ))}
        </select>
        <button
          onClick={doRun}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg border border-accent bg-accent text-bg text-[0.82rem] font-semibold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Run Screen
        </button>
        <button
          onClick={handleClearFilters}
          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-muted text-[0.82rem] cursor-pointer hover:bg-surface-hover hover:text-text"
        >
          Clear
        </button>
        <div className="ml-auto">
          <ColumnSelector
            columns={ALL_COLUMNS.map((c) => ({ key: c.key, label: c.label }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilterPanel
        categories={SCREENER_CATEGORIES}
        values={filterValues}
        onChange={handleFilterChange}
        filterOptions={filterOptions}
      />

      {/* Status */}
      {loading && (
        <div className="text-center py-3 text-text-muted text-[0.85rem]"><Spinner /> Running screen...</div>
      )}
      {!loading && error && (
        <div className="text-center py-3 text-red text-[0.85rem]">Error: {error}</div>
      )}
      {!loading && !error && statusText && (
        <div className="text-center py-3 text-text-muted text-[0.85rem]">{statusText}</div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <DataTable columns={columns} data={results} getKey={(r) => r.ticker} />
      )}
      {!loading && !error && results.length === 0 && statusText && (
        <p className="text-text-muted text-center">No stocks match filters.</p>
      )}
    </>
  )
}
