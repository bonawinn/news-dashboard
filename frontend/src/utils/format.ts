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

export function formatAccounting(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '\u2014'
  const abs = Math.abs(n)
  let formatted: string
  if (abs >= 1e12) formatted = (abs / 1e12).toFixed(1) + 'T'
  else if (abs >= 1e9) formatted = (abs / 1e9).toFixed(1) + 'B'
  else if (abs >= 1e6) formatted = (abs / 1e6).toFixed(1) + 'M'
  else if (abs >= 1e3) formatted = (abs / 1e3).toFixed(1) + 'K'
  else formatted = abs.toFixed(2)
  return n < 0 ? `(${formatted})` : formatted
}
