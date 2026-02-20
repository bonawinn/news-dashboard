import { useState, useEffect } from 'react'
import { getStatus, getOverview, getRecession } from '../api/macro.ts'
import { SetupBox } from '../components/shared/SetupBox.tsx'
import { GaugeSVG } from '../components/shared/GaugeSVG.tsx'
import { SparklineSVG } from '../components/shared/SparklineSVG.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import { formatNumber, colorClass } from '../utils/format.ts'
import type { MacroOverviewResponse, RecessionResponse } from '../types/api.ts'

export function MacroPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [notImplemented, setNotImplemented] = useState<string | null>(null)
  const [overview, setOverview] = useState<MacroOverviewResponse | null>(null)
  const [recession, setRecession] = useState<RecessionResponse | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const status = await getStatus()
        if (status.status === 'not_implemented') {
          setNotImplemented(status.message || '')
          setLoading(false)
          return
        }
        if (!status.configured) {
          setConfigured(false)
          setLoading(false)
          return
        }
        setConfigured(true)

        const [overData, recData] = await Promise.all([
          getOverview(),
          getRecession().catch(() => null),
        ])
        if (overData.error) throw new Error(overData.error)
        setOverview(overData)
        setRecession(recData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-3 text-text-muted text-[0.85rem]">
        <Spinner /> Checking FRED configuration...
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-3 text-red text-[0.85rem]">Error: {error}</div>
  }

  if (notImplemented !== null) {
    return <SetupBox title="Coming Soon"><p>{notImplemented}</p></SetupBox>
  }

  if (configured === false) {
    return (
      <SetupBox title="FRED API Key Required">
        <p>The macro dashboard needs a free FRED API key.</p>
        <p>1. Sign up at <code>https://fred.stlouisfed.org/docs/api/api_key.html</code></p>
        <p>2. Add to your <code>.env</code> file:</p>
        <p><code>FRED_API_KEY=your_key_here</code></p>
        <p>3. Restart the server.</p>
      </SetupBox>
    )
  }

  const categories = overview?.categories || {}

  return (
    <>
      {/* Recession gauge */}
      {recession && recession.probability !== undefined && (
        <div className="flex flex-col items-center mb-5">
          <div className="text-[0.8rem] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
            Recession Probability
          </div>
          <GaugeSVG value={recession.probability} size={140} />
          <div className={`text-2xl font-bold mt-1.5 ${
            recession.probability > 50 ? 'text-red' : recession.probability > 30 ? 'text-yellow' : 'text-green'
          }`}>
            {recession.probability.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Categories grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3.5 max-md:grid-cols-1">
        {Object.entries(categories).map(([catKey, cat]) => (
          <div key={catKey} className="bg-surface border border-border rounded-lg p-3.5">
            <div className="text-[0.78rem] font-bold uppercase tracking-wider text-accent mb-2.5 pb-1.5 border-b border-border">
              {cat.name || catKey}
            </div>
            {(cat.indicators || []).map((ind, ii) => (
              <div
                key={ii}
                className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-b-0"
              >
                <span className="text-[0.78rem] text-text-muted">{ind.name}</span>
                <span className="flex items-center">
                  <span className="text-[0.85rem] font-bold">{formatNumber(ind.value)}</span>
                  {ind.change !== undefined && (
                    <span className={`text-[0.72rem] ml-1.5 ${colorClass(ind.change)}`}>
                      {ind.change > 0 ? '+' : ''}{formatNumber(ind.change)}
                    </span>
                  )}
                  {ind.history && ind.history.length > 1 && (
                    <span className="ml-2">
                      <SparklineSVG data={ind.history} width={60} height={18} />
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
