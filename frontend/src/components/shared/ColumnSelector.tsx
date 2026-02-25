import { useState, useRef, useEffect } from 'react'

interface ColumnOption {
  key: string
  label: string
}

interface Props {
  columns: ColumnOption[]
  visible: string[]
  onChange: (visible: string[]) => void
}

export function ColumnSelector({ columns, visible, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(key: string) {
    if (visible.includes(key)) {
      onChange(visible.filter((k) => k !== key))
    } else {
      onChange([...visible, key])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text text-[0.82rem] font-semibold cursor-pointer hover:bg-surface-hover hover:border-accent"
      >
        Columns
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-surface border border-border rounded-lg shadow-[0_12px_30px_rgba(0,0,0,0.45)] p-2 max-h-[300px] overflow-y-auto min-w-[200px]">
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-2 py-1 hover:bg-surface-hover rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visible.includes(col.key)}
                onChange={() => toggle(col.key)}
                className="accent-accent"
              />
              <span className="text-[0.78rem] text-text">{col.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
