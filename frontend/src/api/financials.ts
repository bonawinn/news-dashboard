import { apiGet } from './client.ts'
import type { FinancialLookupResponse, CompareResponse } from '../types/api.ts'

export function lookupFinancials(ticker: string): Promise<FinancialLookupResponse> {
  return apiGet<FinancialLookupResponse>(`/api/financials/lookup?ticker=${encodeURIComponent(ticker)}`)
}

export function compareFinancials(tickers: string): Promise<CompareResponse> {
  return apiGet<CompareResponse>(`/api/financials/compare?tickers=${encodeURIComponent(tickers)}`)
}
