export interface Article {
  title: string
  url: string
  description?: string
  source?: string
  age?: string
  thumbnail?: string
  tickers?: string[]
  sentiment?: 'bullish' | 'bearish' | 'neutral'
  sentiment_score?: number
}

export interface NewsResponse {
  articles: Article[]
}

export interface StockQuote {
  ticker: string
  price: number
  change: number
  change_pct: number
}

export interface FinancialMetrics {
  revenue?: number
  net_income?: number
  gross_margin?: number
  operating_margin?: number
  net_margin?: number
  roe?: number
  roa?: number
  current_ratio?: number
  debt_to_equity?: number
  free_cash_flow?: number
  eps?: number
  pe_ratio?: number
  revenue_growth?: number
  earnings_growth?: number
}

export interface StatementData {
  _years?: string[]
  [key: string]: number | number[] | string[] | undefined
}

export interface FinancialLookupResponse {
  ticker: string
  metrics: FinancialMetrics
  statements: {
    income?: StatementData
    balance?: StatementData
    cashflow?: StatementData
  }
  status?: string
  message?: string
  error?: string
}

export interface CompanyComparison {
  ticker: string
  metrics: FinancialMetrics
}

export interface CompareResponse {
  companies: CompanyComparison[]
  status?: string
  message?: string
  error?: string
}

export interface ScreenerTemplate {
  name: string
  description?: string
  filters: Record<string, number>
}

export interface TemplatesResponse {
  templates: Record<string, ScreenerTemplate>
}

export interface ScreenerRow {
  ticker: string
  name: string
  price?: number
  pe_ratio?: number
  pb_ratio?: number
  roe?: number
  dividend_yield?: number
  market_cap?: number
  '52w_change'?: number
}

export interface ScreenerResponse {
  results: ScreenerRow[]
  template?: string
  status?: string
  message?: string
  error?: string
}

export interface InsiderTrade {
  filing_date?: string
  ticker?: string
  insider_name?: string
  title?: string
  trade_type?: string
  shares?: number
  price?: number
  value?: number
}

export interface TradesResponse {
  trades: InsiderTrade[]
  status?: string
  message?: string
  error?: string
}

export interface InsiderCluster {
  ticker: string
  insider_count: number
  trades: InsiderTrade[]
}

export interface ClustersResponse {
  clusters: InsiderCluster[]
  status?: string
  message?: string
  error?: string
}

export interface MacroIndicator {
  name: string
  value?: number
  change?: number
  history?: number[]
  series_id?: string
}

export interface MacroCategory {
  name: string
  indicators: MacroIndicator[]
}

export interface MacroStatusResponse {
  configured: boolean
  status?: string
  message?: string
}

export interface MacroOverviewResponse {
  categories: Record<string, MacroCategory>
  error?: string
}

export interface RecessionResponse {
  probability: number
  factors?: Record<string, number>
}

export interface Alert {
  id: number
  name: string
  alert_type: string
  config?: Record<string, unknown>
  enabled: boolean
  last_triggered?: string
  created_at?: string
}

export interface AlertsListResponse {
  alerts: Alert[]
  status?: string
  message?: string
  error?: string
}

export interface AlertCreatePayload {
  name: string
  alert_type: string
  config: Record<string, unknown>
}

export interface TelegramTestResponse {
  message?: string
  error?: string
}
