interface Props {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function SparklineSVG({ data, width = 80, height = 24, color = '#33E29A' }: Props) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data
    .map((v, i) => {
      const x = (i * step).toFixed(1)
      const y = (height - 2 - ((v - min) / range) * (height - 4)).toFixed(1)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="align-middle inline-block"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
