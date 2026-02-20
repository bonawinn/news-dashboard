import { apiGet } from './client.ts'
import type { TradesResponse, ClustersResponse } from '../types/api.ts'

export function getTrades(params: { ticker?: string; days?: string }): Promise<TradesResponse> {
  const sp = new URLSearchParams()
  if (params.days) sp.set('days', params.days)
  if (params.ticker) sp.set('ticker', params.ticker)
  return apiGet<TradesResponse>(`/api/insiders/trades?${sp}`)
}

export function getClusters(): Promise<ClustersResponse> {
  return apiGet<ClustersResponse>('/api/insiders/clusters')
}
