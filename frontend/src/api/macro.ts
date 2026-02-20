import { apiGet } from './client.ts'
import type { MacroStatusResponse, MacroOverviewResponse, RecessionResponse } from '../types/api.ts'

export function getStatus(): Promise<MacroStatusResponse> {
  return apiGet<MacroStatusResponse>('/api/macro/status')
}

export function getOverview(): Promise<MacroOverviewResponse> {
  return apiGet<MacroOverviewResponse>('/api/macro/overview')
}

export function getRecession(): Promise<RecessionResponse> {
  return apiGet<RecessionResponse>('/api/macro/recession')
}
