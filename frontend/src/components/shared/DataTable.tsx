import { useState, useMemo } from 'react'

export interface Column<T> {
  key: string
  label: string
  type?: 'str' | 'num'
  render?: (row: T) => React.ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  getKey?: (row: T, i: number) => string | number
}

export function DataTable<T>({ columns, data, getKey }: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    const isNum = col?.type === 'num'
    return [...data].sort((a, b) => {
      let va = (a as Record<string, unknown>)[sortKey] as string | number
      let vb = (b as Record<string, unknown>)[sortKey] as string | number
      if (isNum) {
        const na = typeof va === 'number' ? va : parseFloat(String(va ?? '').replace(/[^0-9.\-]/g, '')) || 0
        const nb = typeof vb === 'number' ? vb : parseFloat(String(vb ?? '').replace(/[^0-9.\-]/g, '')) || 0
        return sortAsc ? na - nb : nb - na
      }
      const sa = String(va ?? '')
      const sb = String(vb ?? '')
      return sortAsc ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [data, sortKey, sortAsc, columns])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <table className="w-full border-collapse text-[0.82rem]">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              onClick={() => handleSort(col.key)}
              className="text-left px-3 py-2 border-b-2 border-border text-text-muted font-bold text-[0.72rem] uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-accent"
            >
              {col.label}
              {sortKey === col.key && (
                <span className="ml-1">{sortAsc ? '\u25B2' : '\u25BC'}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr key={getKey ? getKey(row, i) : i} className="hover:[&>td]:bg-surface-hover">
            {columns.map((col) => (
              <td key={col.key} className="px-3 py-1.5 border-b border-border whitespace-nowrap">
                {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
