interface Props {
  title: string
  onToggleSidebar: () => void
}

export function Header({ title, onToggleSidebar }: Props) {
  return (
    <header className="sticky top-0 z-[100] bg-surface border-b border-border px-5 py-3 flex items-center gap-3">
      <button
        onClick={onToggleSidebar}
        className="bg-transparent border border-border rounded-md text-text-muted text-[1.1rem] px-2 py-1 cursor-pointer hover:text-text"
        title="Toggle sidebar"
      >
        &#x2630;
      </button>
      <h1 className="text-[1.1rem] font-bold whitespace-nowrap">{title}</h1>
    </header>
  )
}
