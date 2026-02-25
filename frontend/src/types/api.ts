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
  forward_pe?: number
  peg_ratio?: number
  pb_ratio?: number
  price_to_sales?: number
  ev_to_ebitda?: number
  ev_to_revenue?: number
  eps_trailing?: number
  roe?: number
  roa?: number
  gross_margin?: number
  operating_margin?: number
  net_margin?: number
  debt_to_equity?: number
  current_ratio?: number
  quick_ratio?: number
  dividend_yield?: number
  payout_ratio?: number
  revenue_growth?: number
  earnings_growth?: number
  insider_pct?: number
  institutional_pct?: number
  short_ratio?: number
  short_float?: number
  market_cap?: number
  '52w_change'?: number
  beta?: number
  exchange?: string
  sector?: string
  industry?: string
  avg_volume?: number
  current_volume?: number
  relative_volume?: number
  analyst_recommendation?: string
  options_available?: boolean
  // Technical
  perf_1w?: number
  perf_1m?: number
  perf_3m?: number
  perf_6m?: number
  perf_1y?: number
  volatility?: number
  rsi?: number
  sma20?: number
  sma50?: number
  sma200?: number
  sma20_dist?: number
  sma50_dist?: number
  sma200_dist?: number
  gap?: number
  change_pct?: number
  atr?: number
  high_20d_dist?: number
  low_20d_dist?: number
  high_52w_dist?: number
  low_52w_dist?: number
  [key: string]: unknown
}

export interface ScreenerResponse {
  results: ScreenerRow[]
  template?: string
  total_screened?: number
  status?: string
  message?: string
  error?: string
}

export interface FilterOption {
  value: string
  label: string
}

export interface FilterOptionsResponse {
  exchanges: string[]
  sectors: string[]
  market_cap_presets: string[]
  recommendations: string[]
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

// --- Company Detail Types ---

export interface CompanyHeader {
  price?: number
  change?: number
  change_pct?: number
  volume?: number
  bid?: number
  bid_size?: number
  ask?: number
  ask_size?: number
  day_low?: number
  day_high?: number
  fifty_two_week_low?: number
  fifty_two_week_high?: number
}

export interface CompanyOverview {
  name: string
  address?: string
  website?: string
  description?: string
  sector?: string
  industry?: string
  logo_url?: string
  employees?: number
  ceo?: string
}

export interface CompanySnapshot {
  market_info: {
    exchange?: string
    currency?: string
    float_shares?: number
    shares_outstanding?: number
    market_cap?: number
  }
  company_stats: {
    employees?: number
    insider_pct?: number
    institutional_pct?: number
  }
  valuation: {
    trailing_pe?: number
    forward_pe?: number
    peg_ratio?: number
    price_to_sales?: number
    price_to_book?: number
    ev_to_ebitda?: number
    ev_to_revenue?: number
    enterprise_value?: number
  }
  dividends: {
    dividend_yield?: number
    trailing_annual_yield?: number
    payout_ratio?: number
    ex_dividend_date?: string
  }
  risk: {
    beta?: number
    short_pct_of_float?: number
    short_ratio?: number
  }
}

export interface PeriodStatements {
  _periods?: string[]
  [key: string]: number[] | string[] | null[] | undefined
}

export interface CompanyStatements {
  income: { yearly: PeriodStatements; quarterly: PeriodStatements }
  balance: { yearly: PeriodStatements; quarterly: PeriodStatements }
  cashflow: { yearly: PeriodStatements; quarterly: PeriodStatements }
}

export interface AnalystEstimates {
  target_low?: number
  target_mean?: number
  target_median?: number
  target_high?: number
  recommendation?: string
  recommendation_mean?: number
  num_analysts?: number
}

export interface CompanyDetailResponse {
  ticker: string
  header: CompanyHeader
  overview: CompanyOverview
  snapshot: CompanySnapshot
  statements: CompanyStatements
  estimates: AnalystEstimates
  error?: string
}
