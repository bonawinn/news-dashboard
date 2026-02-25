export type FilterType = 'numeric_range' | 'select' | 'multi_select' | 'preset_range' | 'boolean' | 'coming_soon'

export interface FilterConfig {
  key: string
  label: string
  type: FilterType
  metric?: string
  options?: { value: string; label: string }[]
  optionsKey?: string // key in FilterOptionsResponse to pull dynamic options
  suffix?: string
}

export interface FilterCategory {
  key: string
  label: string
  filters: FilterConfig[]
}

export const SCREENER_CATEGORIES: FilterCategory[] = [
  {
    key: 'descriptive',
    label: 'Descriptive',
    filters: [
      { key: 'exchange', label: 'Exchange', type: 'select', optionsKey: 'exchanges' },
      { key: 'sector', label: 'Sector', type: 'select', optionsKey: 'sectors' },
      { key: 'industry', label: 'Industry', type: 'select', optionsKey: 'industries' },
      { key: 'market_cap_range', label: 'Market Cap', type: 'preset_range', optionsKey: 'market_cap_presets' },
      { key: 'market_cap', label: 'Market Cap ($)', type: 'numeric_range', metric: 'market_cap' },
      { key: 'price', label: 'Price ($)', type: 'numeric_range', metric: 'price' },
      { key: 'avg_volume', label: 'Avg Volume', type: 'numeric_range', metric: 'avg_volume' },
      { key: 'relative_volume', label: 'Relative Volume', type: 'numeric_range', metric: 'relative_volume' },
      { key: 'analyst_recommendation', label: 'Analyst Rec.', type: 'select', optionsKey: 'recommendations' },
      { key: 'short_float', label: 'Short Float (%)', type: 'numeric_range', suffix: '%' },
      { key: 'beta', label: 'Beta', type: 'numeric_range', metric: 'beta' },
    ],
  },
  {
    key: 'fundamental',
    label: 'Fundamental',
    filters: [
      { key: 'pe_ratio', label: 'P/E (TTM)', type: 'numeric_range' },
      { key: 'forward_pe', label: 'Forward P/E', type: 'numeric_range' },
      { key: 'peg_ratio', label: 'PEG', type: 'numeric_range' },
      { key: 'pb_ratio', label: 'P/B', type: 'numeric_range' },
      { key: 'price_to_sales', label: 'P/S', type: 'numeric_range' },
      { key: 'ev_to_ebitda', label: 'EV/EBITDA', type: 'numeric_range' },
      { key: 'ev_to_revenue', label: 'EV/Revenue', type: 'numeric_range' },
      { key: 'eps_trailing', label: 'EPS (TTM)', type: 'numeric_range' },
      { key: 'roe', label: 'ROE (%)', type: 'numeric_range', suffix: '%' },
      { key: 'roa', label: 'ROA (%)', type: 'numeric_range', suffix: '%' },
      { key: 'gross_margin', label: 'Gross Margin (%)', type: 'numeric_range', suffix: '%' },
      { key: 'operating_margin', label: 'Oper. Margin (%)', type: 'numeric_range', suffix: '%' },
      { key: 'net_margin', label: 'Net Margin (%)', type: 'numeric_range', suffix: '%' },
      { key: 'debt_to_equity', label: 'Debt/Equity', type: 'numeric_range' },
      { key: 'current_ratio', label: 'Current Ratio', type: 'numeric_range' },
      { key: 'quick_ratio', label: 'Quick Ratio', type: 'numeric_range' },
      { key: 'dividend_yield', label: 'Div Yield (%)', type: 'numeric_range', suffix: '%' },
      { key: 'payout_ratio', label: 'Payout Ratio (%)', type: 'numeric_range', suffix: '%' },
      { key: 'revenue_growth', label: 'Rev Growth (%)', type: 'numeric_range', suffix: '%' },
      { key: 'earnings_growth', label: 'Earnings Growth (%)', type: 'numeric_range', suffix: '%' },
      { key: 'insider_pct', label: 'Insider Own (%)', type: 'numeric_range', suffix: '%' },
      { key: 'institutional_pct', label: 'Inst. Own (%)', type: 'numeric_range', suffix: '%' },
      { key: 'short_ratio', label: 'Short Ratio', type: 'numeric_range' },
    ],
  },
  {
    key: 'technical',
    label: 'Technical',
    filters: [
      { key: 'perf_1w', label: '1W Return (%)', type: 'numeric_range', suffix: '%' },
      { key: 'perf_1m', label: '1M Return (%)', type: 'numeric_range', suffix: '%' },
      { key: 'perf_3m', label: '3M Return (%)', type: 'numeric_range', suffix: '%' },
      { key: 'perf_6m', label: '6M Return (%)', type: 'numeric_range', suffix: '%' },
      { key: 'perf_1y', label: '1Y Return (%)', type: 'numeric_range', suffix: '%' },
      { key: '52w_change', label: '52W Change (%)', type: 'numeric_range', suffix: '%' },
      { key: 'volatility', label: 'Volatility (%)', type: 'numeric_range', suffix: '%' },
      { key: 'rsi', label: 'RSI (14)', type: 'numeric_range' },
      { key: 'sma20_dist', label: 'SMA20 Dist (%)', type: 'numeric_range', suffix: '%' },
      { key: 'sma50_dist', label: 'SMA50 Dist (%)', type: 'numeric_range', suffix: '%' },
      { key: 'sma200_dist', label: 'SMA200 Dist (%)', type: 'numeric_range', suffix: '%' },
      { key: 'gap', label: 'Gap (%)', type: 'numeric_range', suffix: '%' },
      { key: 'change_pct', label: 'Change (%)', type: 'numeric_range', suffix: '%' },
      { key: 'atr', label: 'ATR (14)', type: 'numeric_range' },
      { key: 'high_20d_dist', label: '20D High Dist (%)', type: 'numeric_range', suffix: '%' },
      { key: 'low_20d_dist', label: '20D Low Dist (%)', type: 'numeric_range', suffix: '%' },
      { key: 'high_52w_dist', label: '52W High Dist (%)', type: 'numeric_range', suffix: '%' },
      { key: 'chart_pattern', label: 'Chart Pattern', type: 'coming_soon' },
      { key: 'candlestick', label: 'Candlestick', type: 'coming_soon' },
    ],
  },
]
