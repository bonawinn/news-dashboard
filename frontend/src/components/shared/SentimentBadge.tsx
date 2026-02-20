interface Props {
  sentiment: string
}

const STYLES: Record<string, string> = {
  bullish: 'bg-green-bg text-green',
  bearish: 'bg-red-bg text-red',
  neutral: 'bg-[rgba(139,143,168,0.15)] text-text-muted',
}

export function SentimentBadge({ sentiment }: Props) {
  const cls = STYLES[sentiment] ?? STYLES.neutral
  return (
    <span
      className={`inline-block px-1.5 py-px rounded text-[0.68rem] font-bold uppercase tracking-wider shrink-0 ${cls}`}
    >
      {sentiment}
    </span>
  )
}
