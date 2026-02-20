import { useState, useCallback } from 'react'
import { lookupFinancials, compareFinancials } from '../api/financials.ts'
import { MetricCard } from '../components/shared/MetricCard.tsx'
import { TabBar } from '../components/shared/TabBar.tsx'
import { SetupBox } from '../components/shared/SetupBox.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import { formatNumber, formatPct, formatUSD, colorClass } from '../utils/format.ts'
import type { FinancialLookupResponse, CompareResponse, StatementData } from '../types/api.ts'

const STATEMENT_TABS = [
  { key: 'income', label: 'Income Statement' },
  { key: 'balance', label: 'Balance Sheet' },
  { key: 'cashflow', label: 'Cash Flow' },
]

const METRIC_DEFS: [string, (m: Record<string, number | undefined>) => string][] = [
  ['Revenue', (m) => formatUSD(m.revenue)],
  ['Net Income', (m) => formatUSD(m.net_income)],
  ['Gross Margin', (m) => formatPct(m.gross_margin)],
  ['Operating Margin', (m) => formatPct(m.operating_margin)],
  ['Net Margin', (m) => formatPct(m.net_margin)],
  ['ROE', (m) => formatPct(m.roe)],
  ['ROA', (m) => formatPct(m.roa)],
  ['Current Ratio', (m) => formatNumber(m.current_ratio)],
  ['Debt/Equity', (m) => formatNumber(m.debt_to_equity)],
  ['FCF', (m) => formatUSD(m.free_cash_flow)],
  ['EPS', (m) => formatNumber(m.eps)],
  ['P/E Ratio', (m) => formatNumber(m.pe_ratio)],
  ['Revenue Growth', (m) => formatPct(m.revenue_growth)],
  ['Earnings Growth', (m) => formatPct(m.earnings_growth)],
]

const COMPARE_KEYS = [
  'revenue', 'net_income', 'gross_margin', 'operating_margin',
  'net_margin', 'roe', 'roa', 'current_ratio', 'debt_to_equity',
  'free_cash_flow', 'eps', 'pe_ratio', 'revenue_growth', 'earnings_growth',
]

function isPctKey(key: string) {
  return key.includes('margin') || key.includes('growth') || key === 'roe' || key === 'roa'
}

export function FinancialsPage() {
  const [ticker, setTicker] = useState('')
  const [compareTickers, setCompareTickers] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lookupData, setLookupData] = useState<FinancialLookupResponse | null>(null)
  const [compareData, setCompareData] = useState<CompareResponse | null>(null)
  const [activeTab, setActiveTab] = useState('income')

  const doLookup = useCallback(async () => {
    const t = ticker.trim().toUpperCase()
    if (!t) return
    setLoading(true)
    setError(null)
    setCompareData(null)
    try {
      const data = await lookupFinancials(t)
      if (data.error) throw new Error(data.error)
      setLookupData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [ticker])

  const doCompare = useCallback(async () => {
    const raw = compareTickers.trim().toUpperCase()
    if (!raw) return
    setLoading(true)
    setError(null)
    setLookupData(null)
    try {
      const data = await compareFinancials(raw)
      if (data.error) throw new Error(data.error)
      setCompareData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [compareTickers])

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doLookup() }}
          placeholder="Enter ticker (e.g. NVDA)..."
          className="px-3 py-1.5 rounded-md border border-border bg-bg text-text font-mono text-[0.82rem] placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={doLookup}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-md border border-accent bg-accent text-white font-mono text-[0.82rem] font-semibold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Lookup
        </button>
        <input
          type="text"
          value={compareTickers}
          onChange={(e) => setCompareTickers(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doCompare() }}
          placeholder="Compare (e.g. NVDA,AAPL)..."
          className="px-3 py-1.5 rounded-md border border-border bg-bg text-text font-mono text-[0.82rem] placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={doCompare}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-md border border-border bg-surface text-text font-mono text-[0.82rem] font-semibold cursor-pointer hover:bg-surface-hover hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Compare
        </button>
      </div>

      {/* Status */}
      {loading && (
        <div className="text-center py-3 text-text-muted text-[0.85rem]"><Spinner /> Fetching financials...</div>
      )}
      {!loading && error && (
        <div className="text-center py-3 text-red text-[0.85rem]">Error: {error}</div>
      )}

      {/* Lookup result */}
      {!loading && lookupData && (
        lookupData.status === 'not_implemented' ? (
          <SetupBox title="Coming Soon"><p>{lookupData.message || ''}</p></SetupBox>
        ) : (
          <>
            <h3 className="mb-3 font-bold">{lookupData.ticker} Key Metrics</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5 mb-5">
              {METRIC_DEFS.map(([label, fn]) => (
                <MetricCard key={label} label={label} value={fn(lookupData.metrics as Record<string, number | undefined>)} />
              ))}
            </div>

            <TabBar tabs={STATEMENT_TABS} active={activeTab} onChange={setActiveTab} />
            <StatementTable data={(lookupData.statements as Record<string, StatementData>)?.[activeTab]} />
          </>
        )
      )}

      {/* Compare result */}
      {!loading && compareData && (
        compareData.status === 'not_implemented' ? (
          <SetupBox title="Coming Soon"><p>{compareData.message || ''}</p></SetupBox>
        ) : (
          <ComparisonTable data={compareData} />
        )
      )}
    </>
  )
}

function StatementTable({ data }: { data?: StatementData }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-text-muted">No data available</p>
  }

  const years = (data._years as string[]) || []
  const entries = Object.entries(data).filter(([k]) => k !== '_years')

  return (
    <table className="w-full border-collapse text-[0.82rem]">
      <thead>
        <tr>
          <th className="text-left px-3 py-2 border-b-2 border-border text-text-muted font-bold text-[0.72rem] uppercase tracking-wider">
            Item
          </th>
          {years.length > 0
            ? years.map((y) => (
                <th key={y} className="text-left px-3 py-2 border-b-2 border-border text-text-muted font-bold text-[0.72rem] uppercase tracking-wider">
                  {y}
                </th>
              ))
            : (
                <th className="text-left px-3 py-2 border-b-2 border-border text-text-muted font-bold text-[0.72rem] uppercase tracking-wider">
                  Value
                </th>
              )}
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, val]) => (
          <tr key={key} className="hover:[&>td]:bg-surface-hover">
            <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{key}</td>
            {Array.isArray(val)
              ? (val as number[]).map((v, i) => (
                  <td key={i} className={`px-3 py-1.5 border-b border-border whitespace-nowrap ${colorClass(v)}`}>
                    {formatNumber(v)}
                  </td>
                ))
              : (
                  <td className={`px-3 py-1.5 border-b border-border whitespace-nowrap ${colorClass(val as number)}`}>
                    {formatNumber(val as number)}
                  </td>
                )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ComparisonTable({ data }: { data: CompareResponse }) {
  const companies = data.companies || []
  if (!companies.length) return <p className="text-text-muted">No data</p>

  return (
    <table className="w-full border-collapse text-[0.82rem]">
      <thead>
        <tr>
          <th className="text-left px-3 py-2 border-b-2 border-border text-text-muted font-bold text-[0.72rem] uppercase tracking-wider">
            Metric
          </th>
          {companies.map((c) => (
            <th key={c.ticker} className="text-left px-3 py-2 border-b-2 border-border text-text-muted font-bold text-[0.72rem] uppercase tracking-wider">
              {c.ticker}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {COMPARE_KEYS.map((key) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
          return (
            <tr key={key} className="hover:[&>td]:bg-surface-hover">
              <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{label}</td>
              {companies.map((c) => {
                const v = (c.metrics as Record<string, number | undefined>)[key]
                return (
                  <td key={c.ticker} className={`px-3 py-1.5 border-b border-border whitespace-nowrap ${colorClass(v)}`}>
                    {isPctKey(key) ? formatPct(v) : formatNumber(v)}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
