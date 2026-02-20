import { Spinner } from './Spinner.tsx'

interface Props {
  loading?: boolean
  error?: string | null
  message?: string | null
}

export function StatusMsg({ loading, error, message }: Props) {
  if (!loading && !error && !message) return null

  return (
    <div className="text-center py-3 text-text-muted text-[0.85rem]">
      {loading && <><Spinner /> Loading...</>}
      {!loading && error && <span className="text-red">{error}</span>}
      {!loading && !error && message}
    </div>
  )
}
