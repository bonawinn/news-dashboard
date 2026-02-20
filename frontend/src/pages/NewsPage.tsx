import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchNews } from '../api/news.ts'
import { useDebounce } from '../hooks/useDebounce.ts'
import { useInterval } from '../hooks/useInterval.ts'
import { SentimentBadge } from '../components/shared/SentimentBadge.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import type { Article } from '../types/api.ts'

const AUTO_REFRESH_MS = 5 * 60 * 1000

export function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [freshness, setFreshness] = useState('pd')
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  const debouncedQuery = useDebounce(searchQuery, 250)

  const doFetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = searchQuery.trim()
      const data = await fetchNews({ q: q || undefined, freshness })
      setArticles(data.articles || [])
      setActiveSource(null)
      setStatusText(`${(data.articles || []).length} headlines loaded`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, freshness])

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false)
      doFetch()
    }
  }, [initialLoad, doFetch])

  // Auto-refresh
  useInterval(doFetch, autoRefresh ? AUTO_REFRESH_MS : null)

  // Client-side filter
  const visible = useMemo(() => {
    let list = articles
    if (activeSource) {
      list = list.filter((a) => (a.source || '') === activeSource)
    }
    const q = debouncedQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((a) => {
        const hay = `${a.title} ${a.description || ''} ${(a.tickers || []).join(' ')}`.toLowerCase()
        return hay.includes(q)
      })
    }
    return list
  }, [articles, activeSource, debouncedQuery])

  // Source counts
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    articles.forEach((a) => {
      const s = a.source || ''
      if (s) counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [articles])

  const sources = useMemo(() => Object.keys(sourceCounts).sort(), [sourceCounts])

  // Sentiment counts
  const sentimentCounts = useMemo(() => {
    let bull = 0, bear = 0, neut = 0
    articles.forEach((a) => {
      if (a.sentiment === 'bullish') bull++
      else if (a.sentiment === 'bearish') bear++
      else neut++
    })
    return { bull, bear, neut }
  }, [articles])

  const total = articles.length || 1
  const bullPct = ((sentimentCounts.bull / total) * 100).toFixed(1)
  const neutPct = ((sentimentCounts.neut / total) * 100).toFixed(1)
  const bearPct = ((sentimentCounts.bear / total) * 100).toFixed(1)
  const showSentiment = articles.length > 0 && (sentimentCounts.bull > 0 || sentimentCounts.bear > 0)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      doFetch()
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search headlines or ticker..."
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-text font-mono text-[0.82rem] placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <select
          value={freshness}
          onChange={(e) => { setFreshness(e.target.value); }}
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-text text-[0.82rem] focus:outline-none focus:border-accent"
        >
          <option value="pd">Past 24h</option>
          <option value="pw">Past week</option>
          <option value="pm">Past month</option>
        </select>
        <button
          onClick={doFetch}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg border border-accent bg-accent text-bg text-[0.82rem] font-semibold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &#x21bb; Refresh
        </button>
        <label className="flex items-center gap-1 text-[0.78rem] text-text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="accent-accent"
          />
          Auto
        </label>
      </div>

      {/* Sentiment bar */}
      {showSentiment && (
        <div className="card-gradient border border-border rounded-[14px] px-4 py-3 mb-3 flex items-center gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
          <div className="flex gap-3 text-[0.75rem] font-semibold">
            <span className="text-green">{sentimentCounts.bull} Bull</span>
            <span className="text-text-muted">{sentimentCounts.neut} Neutral</span>
            <span className="text-red">{sentimentCounts.bear} Bear</span>
          </div>
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden flex">
            <div className="bg-green h-full transition-[width] duration-300" style={{ width: `${bullPct}%` }} />
            <div className="bg-text-muted h-full transition-[width] duration-300" style={{ width: `${neutPct}%` }} />
            <div className="bg-red h-full transition-[width] duration-300" style={{ width: `${bearPct}%` }} />
          </div>
        </div>
      )}

      {/* Source filters */}
      {sources.length > 0 && (
        <div className="card-gradient border border-border rounded-[14px] px-4 py-3 mb-3">
          <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Filter by source
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveSource(null)}
              className={`px-2.5 py-0.5 rounded-lg text-[0.72rem] font-semibold cursor-pointer transition-all border ${
                !activeSource
                  ? 'bg-accent border-accent text-bg'
                  : 'bg-bg border-border text-text-muted hover:border-accent hover:text-text'
              }`}
            >
              All <span className="font-normal opacity-70 ml-0.5">({articles.length})</span>
            </button>
            {sources.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSource(activeSource === s ? null : s)}
                className={`px-2.5 py-0.5 rounded-lg text-[0.72rem] font-semibold cursor-pointer transition-all border ${
                  activeSource === s
                    ? 'bg-accent border-accent text-bg'
                    : 'bg-bg border-border text-text-muted hover:border-accent hover:text-text'
                }`}
              >
                {s} <span className="font-normal opacity-70 ml-0.5">({sourceCounts[s]})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {loading && (
        <div className="text-center py-3 text-text-muted text-[0.85rem]">
          <Spinner /> Loading headlines...
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-3 text-red text-[0.85rem]">Error: {error}</div>
      )}
      {!loading && !error && statusText && (
        <div className="text-center py-3 text-text-muted text-[0.85rem]">{statusText}</div>
      )}

      {/* News list */}
      <ul className="list-none">
        {!loading && visible.length === 0 && (
          <li className="text-center py-3 text-text-muted text-[0.85rem]">No headlines found.</li>
        )}
        {visible.map((art, i) => (
          <li
            key={art.url + i}
            className="group flex items-baseline gap-2 px-3 py-[7px] border-b border-border relative hover:bg-surface-hover transition-colors"
          >
            <span className="shrink-0 text-[0.7rem] font-bold text-accent w-[110px] overflow-hidden text-ellipsis whitespace-nowrap">
              {art.source || ''}
            </span>
            <span className="flex-1 min-w-0">
              <a
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text no-underline font-semibold text-[0.84rem] leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis block hover:text-accent transition-colors"
              >
                {art.title}
              </a>
            </span>
            {art.sentiment && <SentimentBadge sentiment={art.sentiment} />}
            {art.age && (
              <span className="shrink-0 text-[0.7rem] text-text-muted whitespace-nowrap font-mono">
                {art.age}
              </span>
            )}
            {art.description && (
              <div className="hidden group-hover:block absolute left-2.5 top-full z-50 max-w-[440px] px-3 py-2 rounded-[14px] card-gradient border border-border text-text-muted text-[0.78rem] leading-relaxed shadow-[0_12px_30px_rgba(0,0,0,0.45)] pointer-events-none whitespace-normal">
                {art.description}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
