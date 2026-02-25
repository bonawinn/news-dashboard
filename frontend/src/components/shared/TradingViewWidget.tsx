import { useEffect, useRef } from 'react'

interface Props {
  ticker: string
  interval?: string // 'D' for daily, '1' for 1-minute
}

export function TradingViewWidget({ ticker, interval = 'D' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: interval,
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#070707',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })

    const wrapper = document.createElement('div')
    wrapper.className = 'tradingview-widget-container__widget'
    wrapper.style.height = '100%'
    wrapper.style.width = '100%'
    container.appendChild(wrapper)
    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [ticker, interval])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '400px', width: '100%' }}
    />
  )
}
