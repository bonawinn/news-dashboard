import { useState, useEffect, useCallback } from 'react'
import { getTemplates, runScreen, runTemplate } from '../api/screener.ts'
import { FilterGrid } from '../components/shared/FilterGrid.tsx'
import type { FilterDef } from '../components/shared/FilterGrid.tsx'
import { DataTable } from '../components/shared/DataTable.tsx'
import type { Column } from '../components/shared/DataTable.tsx'
import { SetupBox } from '../components/shared/SetupBox.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import { formatNumber, formatUSD, colorClass } from '../utils/format.ts'
import type { ScreenerTemplate, ScreenerRow } from '../types/api.ts'

const FILTER_DEFS: FilterDef[] = [
  { key: 'roe_min', label: 'ROE Min (%)' },
  { key: 'pe_max', label: 'P/E Max' },
  { key: 'pb_max', label: 'P/B Max' },
  { key: 'debt_equity_max', label: 'Debt/Equity Max' },
  { key: 'market_cap_min', label: 'Mkt Cap Min ($)' },
  { key: 'dividend_yield_min', label: 'Div Yield Min (%)' },
  { key: 'payout_ratio_max', label: 'Payout Max (%)' },
  { key: 'revenue_growth_min', label: 'Rev Growth Min (%)' },
  { key: 'gross_margin_min', label: 'Gross Margin Min (%)' },
  { key: '52w_change_min', label: '52W Change Min (%)' },
]

const COLUMNS: Column<ScreenerRow>[] = [
  { key: 'ticker', label: 'Ticker', type: 'str', render: (r) => <span className="text-accent font-semibold">{r.ticker}</span> },
  { key: 'name', label: 'Name', type: 'str' },
  { key: 'price', label: 'Price', type: 'num', render: (r) => <>{formatNumber(r.price)}</> },
  { key: 'pe_ratio', label: 'P/E', type: 'num', render: (r) => <span className={colorClass(r.pe_ratio)}>{formatNumber(r.pe_ratio)}</span> },
  { key: 'pb_ratio', label: 'P/B', type: 'num', render: (r) => <span className={colorClass(r.pb_ratio)}>{formatNumber(r.pb_ratio)}</span> },
  { key: 'roe', label: 'ROE%', type: 'num', render: (r) => <span className={colorClass(r.roe)}>{formatNumber(r.roe)}</span> },
  { key: 'dividend_yield', label: 'Div%', type: 'num', render: (r) => <>{formatNumber(r.dividend_yield)}</> },
  { key: 'market_cap', label: 'Mkt Cap', type: 'num', render: (r) => <>{formatUSD(r.market_cap)}</> },
  { key: '52w_change', label: '52W%', type: 'num', render: (r) => <span className={colorClass(r['52w_change'])}>{formatNumber(r['52w_change'])}</span> },
]

export function ScreenerPage() {
  const [templates, setTemplates] = useState<Record<string, ScreenerTemplate>>({})
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [results, setResults] = useState<ScreenerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [notImplemented, setNotImplemented] = useState<string | null>(null)

  // Fetch templates on mount
  useEffect(() => {
    getTemplates()
      .then((data) => setTemplates(data.templates || {}))
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
    setNotImplemented(null)
    setResults([])

    try {
      let data
      if (selectedTemplate && templates[selectedTemplate]) {
        data = await runTemplate(selectedTemplate)
      } else {
        const params: Record<string, string> = {}
        for (const [k, v] of Object.entries(filterValues)) {
          if (v !== '') params[k] = v
        }
        data = await runScreen(params)
      }
      if (data.error) throw new Error(data.error)
      if (data.status === 'not_implemented') {
        setNotImplemented(data.message || '')
      } else {
        setResults(data.results || [])
        setStatusText(`${(data.results || []).length} stocks found`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate, templates, filterValues])

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
      </div>

      {/* Filters */}
      <FilterGrid filters={FILTER_DEFS} values={filterValues} onChange={handleFilterChange} />

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
      {notImplemented !== null && (
        <SetupBox title="Coming Soon"><p>{notImplemented}</p></SetupBox>
      )}
      {!loading && results.length > 0 && (
        <DataTable columns={COLUMNS} data={results} getKey={(r) => r.ticker} />
      )}
      {!loading && !error && !notImplemented && results.length === 0 && statusText && (
        <p className="text-text-muted text-center">No stocks match filters.</p>
      )}
    </>
  )
}
