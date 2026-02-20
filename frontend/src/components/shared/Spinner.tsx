export function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 border-2 border-border border-t-accent rounded-full animate-spin align-middle mr-1.5"
      style={{ animation: 'spin 0.6s linear infinite' }}
    />
  )
}
