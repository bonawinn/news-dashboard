import { apiGet } from './client.ts'
import type { TemplatesResponse, ScreenerResponse } from '../types/api.ts'

export function getTemplates(): Promise<TemplatesResponse> {
  return apiGet<TemplatesResponse>('/api/screener/templates')
}

export function runScreen(filters: Record<string, string>): Promise<ScreenerResponse> {
  const sp = new URLSearchParams(filters)
  return apiGet<ScreenerResponse>(`/api/screener/screen?${sp}`)
}

export function runTemplate(name: string): Promise<ScreenerResponse> {
  return apiGet<ScreenerResponse>(`/api/screener/template/${encodeURIComponent(name)}`)
}
