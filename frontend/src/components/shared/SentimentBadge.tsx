interface Props {
  sentiment: string
}

const STYLES: Record<string, string> = {
  bullish: 'bg-green-bg text-green',
  bearish: 'bg-red-bg text-red',
  neutral: 'bg-[rgba(182,182,182,0.1)] text-text-muted',
}

export function SentimentBadge({ sentiment }: Props) {
  const cls = STYLES[sentiment] ?? STYLES.neutral
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider shrink-0 ${cls}`}
    >
      {sentiment}
    </span>
  )
}
