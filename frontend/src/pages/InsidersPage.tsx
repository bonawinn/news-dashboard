import { useState, useCallback } from 'react'
import { getTrades, getClusters } from '../api/insiders.ts'
import { SetupBox } from '../components/shared/SetupBox.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import { formatNumber, formatUSD } from '../utils/format.ts'
import type { InsiderTrade, InsiderCluster } from '../types/api.ts'

export function InsidersPage() {
  const [ticker, setTicker] = useState('')
  const [days, setDays] = useState('90')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [trades, setTrades] = useState<InsiderTrade[] | null>(null)
  const [clusters, setClusters] = useState<InsiderCluster[] | null>(null)
  const [notImplemented, setNotImplemented] = useState<string | null>(null)

  const searchTrades = useCallback(async () => {
    const t = ticker.trim().toUpperCase()
    setLoading(true)
    setError(null)
    setNotImplemented(null)
    setClusters(null)
    setTrades(null)

    try {
      const data = await getTrades({ ticker: t || undefined, days })
      if (data.error) throw new Error(data.error)
      if (data.status === 'not_implemented') {
        setNotImplemented(data.message || '')
      } else {
        setTrades(data.trades || [])
        setStatusText(`${(data.trades || []).length} trades found`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [ticker, days])

  const fetchClusters = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotImplemented(null)
    setTrades(null)
    setClusters(null)

    try {
      const data = await getClusters()
      if (data.error) throw new Error(data.error)
      if (data.status === 'not_implemented') {
        setNotImplemented(data.message || '')
      } else {
        setClusters(data.clusters || [])
        setStatusText(`${(data.clusters || []).length} clusters detected`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  function isBuy(tradeType: string) {
    const t = tradeType.toLowerCase()
    return t.includes('buy') || t.includes('purchase')
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') searchTrades() }}
          placeholder="Ticker (blank = all clusters)..."
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-text font-mono text-[0.82rem] placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-text text-[0.82rem] focus:outline-none focus:border-accent"
        >
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
          <option value="180">180 days</option>
        </select>
        <button
          onClick={searchTrades}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg border border-accent bg-accent text-bg text-[0.82rem] font-semibold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Search
        </button>
        <button
          onClick={fetchClusters}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg border border-border bg-surface text-text text-[0.82rem] font-semibold cursor-pointer hover:bg-surface-hover hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clusters
        </button>
      </div>

      {/* Status */}
      {loading && (
        <div className="text-center py-3 text-text-muted text-[0.85rem]"><Spinner /> Loading...</div>
      )}
      {!loading && error && (
        <div className="text-center py-3 text-red text-[0.85rem]">Error: {error}</div>
      )}
      {!loading && !error && statusText && (
        <div className="text-center py-3 text-text-muted text-[0.85rem]">{statusText}</div>
      )}

      {notImplemented !== null && (
        <SetupBox title="Coming Soon"><p>{notImplemented}</p></SetupBox>
      )}

      {/* Trades table */}
      {!loading && trades !== null && trades.length > 0 && (
        <table className="w-full border-collapse text-[0.82rem] font-mono">
          <thead>
            <tr>
              {['Date', 'Ticker', 'Insider', 'Title', 'Type', 'Shares', 'Price', 'Value'].map((h) => (
                <th key={h} className="text-left px-3 py-2 border-b border-border text-text-muted font-semibold text-[0.72rem] uppercase tracking-wider font-sans">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="hover:[&>td]:bg-surface-hover transition-colors">
                <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{t.filing_date || ''}</td>
                <td className="px-3 py-1.5 border-b border-border whitespace-nowrap text-accent font-semibold">{t.ticker || ''}</td>
                <td className="px-3 py-1.5 border-b border-border whitespace-nowrap font-sans">{t.insider_name || ''}</td>
                <td className="px-3 py-1.5 border-b border-border whitespace-nowrap text-text-muted font-sans">{t.title || ''}</td>
                <td className={`px-3 py-1.5 border-b border-border whitespace-nowrap ${isBuy(t.trade_type || '') ? 'text-green' : 'text-red'}`}>
                  {t.trade_type || ''}
                </td>
                <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{formatNumber(t.shares, 0)}</td>
                <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{formatUSD(t.price)}</td>
                <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{formatUSD(t.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && trades !== null && trades.length === 0 && (
        <p className="text-text-muted text-center">No insider trades found.</p>
      )}

      {/* Clusters */}
      {!loading && clusters !== null && clusters.length > 0 && (
        <div>
          {clusters.map((c, ci) => (
            <div key={ci} className="card-gradient border border-border rounded-[14px] p-4 mb-3 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-bold text-accent">{c.ticker}</span>
                <span className="text-[0.75rem] bg-green-bg text-green px-2.5 py-0.5 rounded-full font-bold">
                  {c.insider_count} insiders buying
                </span>
              </div>
              <table className="w-full border-collapse text-[0.82rem] font-mono">
                <thead>
                  <tr>
                    {['Insider', 'Date', 'Shares', 'Value'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 border-b border-border text-text-muted font-semibold text-[0.72rem] uppercase tracking-wider font-sans">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(c.trades || []).map((t, ti) => (
                    <tr key={ti} className="hover:[&>td]:bg-surface-hover transition-colors">
                      <td className="px-3 py-1.5 border-b border-border whitespace-nowrap font-sans">{t.insider_name || ''}</td>
                      <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{t.filing_date || ''}</td>
                      <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{formatNumber(t.shares, 0)}</td>
                      <td className="px-3 py-1.5 border-b border-border whitespace-nowrap">{formatUSD(t.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {!loading && clusters !== null && clusters.length === 0 && (
        <p className="text-text-muted text-center">No buying clusters detected.</p>
      )}
    </>
  )
}
