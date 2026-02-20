import { apiGet, apiPost } from './client.ts'
import type { NewsResponse } from '../types/api.ts'

export function fetchNews(params: { q?: string; freshness?: string } = {}): Promise<NewsResponse> {
  const sp = new URLSearchParams()
  if (params.freshness) sp.set('freshness', params.freshness)
  if (params.q) sp.set('q', params.q)
  return apiGet<NewsResponse>(`/api/news?${sp}`)
}

export function fetchStocks(tickers: string[]): Promise<Record<string, unknown>> {
  return apiGet(`/api/stocks?tickers=${encodeURIComponent(tickers.join(','))}`)
}

export function claudeSentiment(articles: { url: string; title: string }[]): Promise<unknown> {
  return apiPost('/api/news/sentiment/claude', { articles })
}
