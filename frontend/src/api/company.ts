import { apiGet } from './client.ts'
import type { CompanyDetailResponse } from '../types/api.ts'

export function getCompanyDetail(ticker: string): Promise<CompanyDetailResponse> {
  return apiGet<CompanyDetailResponse>(`/api/company/${encodeURIComponent(ticker)}`)
}
