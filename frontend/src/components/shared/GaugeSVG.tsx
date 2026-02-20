import { describeArc } from '../../utils/svg.ts'

interface Props {
  value: number
  size?: number
}

export function GaugeSVG({ value, size = 120 }: Props) {
  const r = size * 0.38
  const cx = size / 2
  const cy = size * 0.55
  const strokeW = size * 0.08

  const pct = Math.max(0, Math.min(100, value || 0))
  const angle = (pct / 100) * 180

  const bgArc = describeArc(cx, cy, r, 180, 360)
  const valArc = describeArc(cx, cy, r, 180, 180 + angle)

  let color: string
  if (pct < 30) color = '#33E29A'
  else if (pct < 60) color = '#E9B86E'
  else color = '#ef4444'

  return (
    <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
      <path d={bgArc} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} strokeLinecap="round" />
      <path d={valArc} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
    </svg>
  )
}
