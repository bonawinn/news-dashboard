import { apiGet, apiPost } from './client.ts'
import type { TemplatesResponse, ScreenerResponse, FilterOptionsResponse } from '../types/api.ts'

export function getTemplates(): Promise<TemplatesResponse> {
  return apiGet<TemplatesResponse>('/api/screener/templates')
}

export function runScreen(filters: Record<string, string>): Promise<ScreenerResponse> {
  const sp = new URLSearchParams(filters)
  return apiGet<ScreenerResponse>(`/api/screener/screen?${sp}`)
}

export function runScreenAdvanced(filters: Record<string, unknown>): Promise<ScreenerResponse> {
  return apiPost<ScreenerResponse>('/api/screener/screen', { filters })
}

export function runTemplate(name: string): Promise<ScreenerResponse> {
  return apiGet<ScreenerResponse>(`/api/screener/template/${encodeURIComponent(name)}`)
}

export function getFilterOptions(): Promise<FilterOptionsResponse> {
  return apiGet<FilterOptionsResponse>('/api/screener/filter-options')
}
