import { useState, useEffect, useCallback } from 'react'
import { listAlerts, createAlert, deleteAlert as apiDeleteAlert, testTelegram } from '../api/alerts.ts'
import { Modal } from '../components/shared/Modal.tsx'
import { SetupBox } from '../components/shared/SetupBox.tsx'
import { Spinner } from '../components/shared/Spinner.tsx'
import type { Alert } from '../types/api.ts'

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notImplemented, setNotImplemented] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAlerts()
      if (data.error) throw new Error(data.error)
      if (data.status === 'not_implemented') {
        setNotImplemented(data.message || '')
      } else {
        setAlerts(data.alerts || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  async function handleDelete(id: number) {
    try {
      await apiDeleteAlert(id)
      fetchAlerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function handleTestTelegram() {
    setStatusMsg(null)
    setError(null)
    try {
      const data = await testTelegram()
      if (data.error) throw new Error(data.error)
      setStatusMsg(data.message || 'Test sent!')
    } catch (err) {
      setError(`Telegram: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-3 text-text-muted text-[0.85rem]"><Spinner /> Loading alerts...</div>
    )
  }

  if (notImplemented !== null) {
    return <SetupBox title="Coming Soon"><p>{notImplemented}</p></SetupBox>
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg border border-accent bg-accent text-bg text-[0.82rem] font-semibold cursor-pointer hover:opacity-85"
        >
          + New Alert
        </button>
        <button
          onClick={handleTestTelegram}
          className="px-3.5 py-1.5 rounded-lg border border-border bg-surface text-text text-[0.82rem] font-semibold cursor-pointer hover:bg-surface-hover hover:border-accent"
        >
          Test Telegram
        </button>
      </div>

      {/* Status */}
      {error && <div className="text-center py-3 text-red text-[0.85rem]">{error}</div>}
      {statusMsg && <div className="text-center py-3 text-text-muted text-[0.85rem]">{statusMsg}</div>}

      {/* Alert cards */}
      {alerts.length === 0 ? (
        <p className="text-text-muted text-center py-6">
          No alerts configured. Click &quot;+ New Alert&quot; to create one.
        </p>
      ) : (
        alerts.map((a) => (
          <div key={a.id} className="card-gradient border border-border rounded-[14px] p-4 mb-3 flex justify-between items-center shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
            <div className="flex-1">
              <div className="font-bold text-[0.88rem] mb-0.5">{a.name}</div>
              <div className="text-[0.72rem] text-text-muted">
                {a.alert_type}{' '}
                {a.enabled
                  ? <span className="text-green">Active</span>
                  : <span className="text-red">Disabled</span>
                }
              </div>
            </div>
            <button
              onClick={() => handleDelete(a.id)}
              className="px-3 py-1 rounded-lg border border-red bg-red-bg text-red text-[0.82rem] font-semibold cursor-pointer hover:bg-red hover:text-white transition-colors"
            >
              Delete
            </button>
          </div>
        ))
      )}

      {/* Create modal */}
      <CreateAlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); fetchAlerts() }}
        onError={(msg) => setError(msg)}
      />
    </>
  )
}

function CreateAlertModal({
  open,
  onClose,
  onCreated,
  onError,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  onError: (msg: string) => void
}) {
  const [name, setName] = useState('')
  const [alertType, setAlertType] = useState('insider_cluster')
  const [ticker, setTicker] = useState('')
  const [threshold, setThreshold] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    try {
      await createAlert({
        name: name.trim(),
        alert_type: alertType,
        config: {
          ticker: ticker.trim().toUpperCase(),
          threshold: threshold ? parseFloat(threshold) : null,
        },
      })
      setName('')
      setTicker('')
      setThreshold('')
      onCreated()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error creating alert')
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-base font-bold mb-3.5">Create Alert</h3>
      <div className="mb-3">
        <label className="block text-[0.75rem] text-text-muted mb-1 font-semibold">Alert Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. NVDA Insider Cluster"
          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-bg text-text font-mono text-[0.82rem] focus:outline-none focus:border-accent"
        />
      </div>
      <div className="mb-3">
        <label className="block text-[0.75rem] text-text-muted mb-1 font-semibold">Alert Type</label>
        <select
          value={alertType}
          onChange={(e) => setAlertType(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-bg text-text text-[0.82rem] focus:outline-none focus:border-accent"
        >
          <option value="insider_cluster">Insider Buying Cluster</option>
          <option value="price_above">Price Above</option>
          <option value="price_below">Price Below</option>
          <option value="sentiment_bullish">Sentiment Bullish Spike</option>
          <option value="sentiment_bearish">Sentiment Bearish Spike</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-[0.75rem] text-text-muted mb-1 font-semibold">Ticker (optional)</label>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="e.g. NVDA"
          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-bg text-text font-mono text-[0.82rem] focus:outline-none focus:border-accent"
        />
      </div>
      <div className="mb-3">
        <label className="block text-[0.75rem] text-text-muted mb-1 font-semibold">Threshold (if applicable)</label>
        <input
          type="number"
          step="any"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="e.g. 150.00"
          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-bg text-text font-mono text-[0.82rem] focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-lg border border-border bg-surface text-text text-[0.82rem] font-semibold cursor-pointer hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3.5 py-1.5 rounded-lg border border-accent bg-accent text-bg text-[0.82rem] font-semibold cursor-pointer hover:opacity-85"
        >
          Create
        </button>
      </div>
    </Modal>
  )
}
