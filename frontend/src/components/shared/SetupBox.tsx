interface Props {
  title: string
  children: React.ReactNode
}

export function SetupBox({ title, children }: Props) {
  return (
    <div className="card-gradient border border-border rounded-[14px] p-6 text-center max-w-[500px] mx-auto mt-10 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
      <h3 className="text-base mb-2.5 text-amber font-bold">{title}</h3>
      <div className="text-[0.85rem] text-text-muted [&>p]:mb-2 [&_code]:inline-block [&_code]:bg-bg [&_code]:border [&_code]:border-border [&_code]:rounded-lg [&_code]:px-2 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.82rem] [&_code]:text-accent">
        {children}
      </div>
    </div>
  )
}
