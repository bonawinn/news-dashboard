export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || isNaN(n)) return '\u2014'
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Number(n).toFixed(decimals)
}

export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '\u2014'
  return Number(n).toFixed(2) + '%'
}

export function formatUSD(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '\u2014'
  return '$' + formatNumber(n)
}

export function colorClass(val: number | null | undefined): string {
  if (val === null || val === undefined) return ''
  if (val > 0) return 'text-green'
  if (val < 0) return 'text-red'
  return ''
}
