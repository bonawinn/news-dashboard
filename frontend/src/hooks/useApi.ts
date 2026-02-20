import { useState, useCallback } from 'react'

export function useApi<T, A extends unknown[] = []>(
  fetcher: (...args: A) => Promise<T>,
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetcher(...args)
        setData(result)
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        return null
      } finally {
        setLoading(false)
      }
    },
    [fetcher],
  )

  return { data, loading, error, execute }
}
