import { useState } from 'react'
import { TabBar } from './TabBar.tsx'
import type { FilterCategory, FilterConfig } from '../../config/screenerFilters.ts'
import type { FilterOptionsResponse } from '../../types/api.ts'

interface Props {
  categories: FilterCategory[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  filterOptions: FilterOptionsResponse | null
}

const CATEGORY_TABS = [
  { key: 'descriptive', label: 'Descriptive' },
  { key: 'fundamental', label: 'Fundamental' },
  { key: 'technical', label: 'Technical' },
]

export function AdvancedFilterPanel({ categories, values, onChange, filterOptions }: Props) {
  const [activeCategory, setActiveCategory] = useState('descriptive')

  const category = categories.find((c) => c.key === activeCategory)
  if (!category) return null

  function getOptions(filter: FilterConfig): { value: string; label: string }[] {
    if (filter.options) return filter.options
    if (filter.optionsKey && filterOptions) {
      const raw = (filterOptions as Record<string, unknown>)[filter.optionsKey]
      if (Array.isArray(raw)) {
        return raw.map((v: string) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) }))
      }
    }
    return []
  }

  const activeCount = Object.values(values).filter((v) => v !== '').length

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <TabBar tabs={CATEGORY_TABS} active={activeCategory} onChange={setActiveCategory} />
        {activeCount > 0 && (
          <span className="text-[0.72rem] text-accent font-semibold">
            {activeCount} filter{activeCount !== 1 ? 's' : ''} active
          </span>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2">
        {category.filters.map((filter) => {
          if (filter.type === 'coming_soon') {
            return (
              <div
                key={filter.key}
                className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2 opacity-50"
              >
                <label className="text-[0.75rem] text-text-muted whitespace-nowrap flex-1">{filter.label}</label>
                <span className="text-[0.65rem] bg-amber/20 text-amber px-2 py-0.5 rounded font-semibold">Soon</span>
              </div>
            )
          }

          if (filter.type === 'numeric_range') {
            const minKey = `${filter.key}_min`
            const maxKey = `${filter.key}_max`
            return (
              <div
                key={filter.key}
                className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2"
              >
                <label className="text-[0.75rem] text-text-muted whitespace-nowrap min-w-[100px]">{filter.label}</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Min"
                  value={values[minKey] ?? ''}
                  onChange={(e) => onChange(minKey, e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg border border-border bg-bg text-text font-mono text-[0.8rem] focus:outline-none focus:border-accent"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Max"
                  value={values[maxKey] ?? ''}
                  onChange={(e) => onChange(maxKey, e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg border border-border bg-bg text-text font-mono text-[0.8rem] focus:outline-none focus:border-accent"
                />
              </div>
            )
          }

          if (filter.type === 'select' || filter.type === 'preset_range') {
            const opts = getOptions(filter)
            const filterKey = filter.type === 'preset_range' ? `${filter.key}` : filter.key
            return (
              <div
                key={filter.key}
                className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2"
              >
                <label className="text-[0.75rem] text-text-muted whitespace-nowrap min-w-[100px]">{filter.label}</label>
                <select
                  value={values[filterKey] ?? ''}
                  onChange={(e) => onChange(filterKey, e.target.value)}
                  className="flex-1 px-2 py-1 rounded-lg border border-border bg-bg text-text text-[0.8rem] focus:outline-none focus:border-accent"
                >
                  <option value="">Any</option>
                  {opts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )
          }

          if (filter.type === 'boolean') {
            return (
              <div
                key={filter.key}
                className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2"
              >
                <label className="text-[0.75rem] text-text-muted whitespace-nowrap flex-1">{filter.label}</label>
                <input
                  type="checkbox"
                  checked={values[filter.key] === 'true'}
                  onChange={(e) => onChange(filter.key, e.target.checked ? 'true' : '')}
                  className="accent-accent"
                />
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
