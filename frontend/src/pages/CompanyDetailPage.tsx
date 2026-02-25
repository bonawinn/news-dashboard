import { useState, useEffect, useCallback } from 'react'
import { getCompanyDetail } from '../api/company.ts'
import { TradingViewWidget } from '../components/shared/TradingViewWidget.tsx'
import { SnapshotSection } from '../components/company/SnapshotSection.tsx'
import { TabBar } from '../components/shared/TabBar.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import { formatNumber, formatPct, formatUSD, colorClass, formatAccounting } from '../utils/format.ts'
import type { CompanyDetailResponse, PeriodStatements } from '../types/api.ts'

const CHART_TABS = [
  { key: 'D', label: '1 Year' },
  { key: '1', label: 'Intraday' },
]

const STATEMENT_TABS = [
  { key: 'balance', label: 'BS' },
  { key: 'income', label: 'IS' },
  { key: 'cashflow', label: 'CF' },
]

const PERIOD_TABS = [
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'yearly', label: 'Yearly' },
]

interface Props {
  ticker: string
}

export function CompanyDetailPage({ ticker }: Props) {
  const [data, setData] = useState<CompanyDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartInterval, setChartInterval] = useState('D')
  const [statementType, setStatementType] = useState('income')
  const [statementPeriod, setStatementPeriod] = useState('quarterly')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCompanyDetail(ticker)
      if (result.error) throw new Error(result.error)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <div className="text-center py-8 text-text-muted"><Spinner /> Loading {ticker}...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red">Error: {error}</div>
  }

  if (!data) return null

  const { header, overview, snapshot, statements, estimates } = data
  const isPositive = (header.change ?? 0) >= 0

  return (
    <div>
      {/* Top Bar */}
      <div className="card-gradient border border-border rounded-[14px] px-4 py-3 mb-4 flex items-center gap-4 flex-wrap shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-accent font-mono">{ticker}</span>
          {snapshot.market_info.exchange && (
            <span className="text-[0.7rem] text-text-muted">{snapshot.market_info.exchange}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono">{formatNumber(header.price)}</span>
          <span className={`text-[0.9rem] font-bold font-mono ${isPositive ? 'text-green' : 'text-red'}`}>
            {isPositive ? '\u25B2' : '\u25BC'} {formatNumber(Math.abs(header.change ?? 0))} ({formatPct(Math.abs(header.change_pct ?? 0))})
          </span>
        </div>
        <div className="flex items-center gap-3 text-[0.75rem] text-text-muted font-mono">
          <span>Vol: {formatNumber(header.volume, 0)}</span>
          {header.bid != null && header.ask != null && (
            <span>
              Bid: {formatNumber(header.bid)}{header.bid_size ? `x${header.bid_size}` : ''} / Ask: {formatNumber(header.ask)}{header.ask_size ? `x${header.ask_size}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[0.72rem] text-text-muted font-mono ml-auto">
          {header.day_low != null && header.day_high != null && (
            <span>Day: {formatNumber(header.day_low)} - {formatNumber(header.day_high)}</span>
          )}
          {header.fifty_two_week_low != null && header.fifty_two_week_high != null && (
            <span>52W: {formatNumber(header.fifty_two_week_low)} - {formatNumber(header.fifty_two_week_high)}</span>
          )}
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-4">
        {/* LEFT PANEL */}
        <div className="space-y-4">
          {/* Company Header */}
          <div className="card-gradient border border-border rounded-[14px] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">{overview.name}</h2>
                  <span className="text-[0.65rem] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-bold">EQ</span>
                </div>
                {overview.address && <p className="text-[0.72rem] text-text-muted mt-1">{overview.address}</p>}
                {overview.ceo && <p className="text-[0.72rem] text-text-muted">CEO: {overview.ceo}</p>}
                {overview.website && (
                  <a
                    href={overview.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.72rem] text-accent hover:underline"
                  >
                    {overview.website}
                  </a>
                )}
              </div>
            </div>
            {overview.sector && (
              <div className="flex gap-2 mb-2">
                <span className="text-[0.68rem] bg-surface border border-border rounded px-2 py-0.5 text-text-muted">{overview.sector}</span>
                {overview.industry && (
                  <span className="text-[0.68rem] bg-surface border border-border rounded px-2 py-0.5 text-text-muted">{overview.industry}</span>
                )}
              </div>
            )}
            {overview.description && (
              <p className="text-[0.75rem] text-text-muted leading-relaxed line-clamp-4">{overview.description}</p>
            )}
          </div>

          {/* TradingView Chart */}
          <div className="card-gradient border border-border rounded-[14px] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
            <div className="mb-2">
              <TabBar tabs={CHART_TABS} active={chartInterval} onChange={setChartInterval} />
            </div>
            <TradingViewWidget ticker={ticker} interval={chartInterval} />
          </div>

          {/* Estimates & Analyst */}
          <div className="card-gradient border border-border rounded-[14px] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
            <h3 className="text-[0.72rem] font-semibold uppercase tracking-wider text-accent mb-3">Analyst Estimates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[0.68rem] text-text-muted block">Target Low</span>
                <span className="font-mono font-semibold">{formatUSD(estimates.target_low)}</span>
              </div>
              <div>
                <span className="text-[0.68rem] text-text-muted block">Target Mean</span>
                <span className="font-mono font-semibold">{formatUSD(estimates.target_mean)}</span>
              </div>
              <div>
                <span className="text-[0.68rem] text-text-muted block">Target Median</span>
                <span className="font-mono font-semibold">{formatUSD(estimates.target_median)}</span>
              </div>
              <div>
                <span className="text-[0.68rem] text-text-muted block">Target High</span>
                <span className="font-mono font-semibold">{formatUSD(estimates.target_high)}</span>
              </div>
              <div>
                <span className="text-[0.68rem] text-text-muted block">Recommendation</span>
                <span className="font-mono font-semibold capitalize">{estimates.recommendation?.replace(/_/g, ' ') ?? '\u2014'}</span>
              </div>
              <div>
                <span className="text-[0.68rem] text-text-muted block">Analysts</span>
                <span className="font-mono font-semibold">{estimates.num_analysts ?? '\u2014'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL - Snapshot */}
        <div className="card-gradient border border-border rounded-[14px] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)] h-fit">
          <SnapshotSection
            title="Market Info"
            items={[
              { label: 'Exchange', value: snapshot.market_info.exchange ?? '\u2014' },
              { label: 'Currency', value: snapshot.market_info.currency ?? '\u2014' },
              { label: 'Float', value: formatNumber(snapshot.market_info.float_shares, 0) },
              { label: 'Shares Out', value: formatNumber(snapshot.market_info.shares_outstanding, 0) },
              { label: 'Market Cap', value: formatUSD(snapshot.market_info.market_cap) },
            ]}
          />
          <SnapshotSection
            title="Company Stats"
            items={[
              { label: 'Employees', value: snapshot.company_stats.employees ? formatNumber(snapshot.company_stats.employees, 0) : '\u2014' },
              { label: 'Insider Own.', value: formatPct(snapshot.company_stats.insider_pct) },
              { label: 'Inst. Own.', value: formatPct(snapshot.company_stats.institutional_pct) },
            ]}
          />
          <SnapshotSection
            title="Valuation"
            items={[
              { label: 'P/E (TTM)', value: formatNumber(snapshot.valuation.trailing_pe) },
              { label: 'Forward P/E', value: formatNumber(snapshot.valuation.forward_pe) },
              { label: 'PEG', value: formatNumber(snapshot.valuation.peg_ratio) },
              { label: 'P/S', value: formatNumber(snapshot.valuation.price_to_sales) },
              { label: 'P/B', value: formatNumber(snapshot.valuation.price_to_book) },
              { label: 'EV/EBITDA', value: formatNumber(snapshot.valuation.ev_to_ebitda) },
              { label: 'EV/Revenue', value: formatNumber(snapshot.valuation.ev_to_revenue) },
              { label: 'EV', value: formatUSD(snapshot.valuation.enterprise_value) },
            ]}
          />
          <SnapshotSection
            title="Dividends & Yield"
            items={[
              { label: 'Div Yield', value: formatPct(snapshot.dividends.dividend_yield) },
              { label: 'Trail. Yield', value: formatPct(snapshot.dividends.trailing_annual_yield) },
              { label: 'Payout Ratio', value: formatPct(snapshot.dividends.payout_ratio) },
              { label: 'Ex-Div Date', value: snapshot.dividends.ex_dividend_date ?? '\u2014' },
            ]}
          />
          <SnapshotSection
            title="Risk & Sentiment"
            items={[
              { label: 'Beta', value: formatNumber(snapshot.risk.beta) },
              { label: 'Short % Float', value: formatPct(snapshot.risk.short_pct_of_float) },
              { label: 'Short Ratio', value: formatNumber(snapshot.risk.short_ratio) },
            ]}
          />
        </div>

        {/* RIGHT PANEL - Financial Statements */}
        <div className="card-gradient border border-border rounded-[14px] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)] h-fit">
          <div className="mb-2">
            <TabBar tabs={STATEMENT_TABS} active={statementType} onChange={setStatementType} />
          </div>
          <div className="mb-3">
            <TabBar tabs={PERIOD_TABS} active={statementPeriod} onChange={setStatementPeriod} />
          </div>
          <StatementPanel
            data={
              (statements[statementType as keyof typeof statements] as { yearly: PeriodStatements; quarterly: PeriodStatements })?.[
                statementPeriod as 'yearly' | 'quarterly'
              ]
            }
          />
        </div>
      </div>
    </div>
  )
}

function StatementPanel({ data }: { data?: PeriodStatements }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-text-muted text-[0.78rem]">No data available</p>
  }

  const periods = (data._periods as string[]) || []
  const entries = Object.entries(data).filter(([k]) => k !== '_periods')

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[0.72rem] font-mono">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 border-b border-border text-text-muted font-semibold text-[0.65rem] uppercase tracking-wider font-sans sticky left-0 bg-surface">
              Item
            </th>
            {periods.map((p) => (
              <th key={p} className="text-right px-2 py-1.5 border-b border-border text-text-muted font-semibold text-[0.65rem] uppercase tracking-wider font-sans whitespace-nowrap">
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, vals]) => (
            <tr key={key} className="hover:[&>td]:bg-surface-hover transition-colors">
              <td className="px-2 py-1 border-b border-border whitespace-nowrap font-sans text-[0.7rem] sticky left-0 bg-surface">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()}
              </td>
              {Array.isArray(vals)
                ? (vals as (number | null)[]).map((v, i) => (
                    <td key={i} className={`px-2 py-1 border-b border-border whitespace-nowrap text-right ${v != null ? colorClass(v) : ''}`}>
                      {v != null ? formatAccounting(v) : '\u2014'}
                    </td>
                  ))
                : (
                    <td className="px-2 py-1 border-b border-border whitespace-nowrap text-right">
                      {String(vals ?? '\u2014')}
                    </td>
                  )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
