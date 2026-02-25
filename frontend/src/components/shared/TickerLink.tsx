import { useNavigation } from '../../contexts/NavigationContext.tsx'

interface Props {
  ticker: string
}

export function TickerLink({ ticker }: Props) {
  const { navigateToCompany } = useNavigation()

  return (
    <span
      onClick={() => navigateToCompany(ticker)}
      className="text-accent font-semibold cursor-pointer hover:underline font-mono"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigateToCompany(ticker) }}
    >
      {ticker}
    </span>
  )
}
