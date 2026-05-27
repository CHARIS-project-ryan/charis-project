interface OrgNameListProps {
  names?: string[]
  emptyLabel?: string
}

export function OrgNameList({ names, emptyLabel = '—' }: OrgNameListProps) {
  if (!names?.length) {
    return <span className="text-muted-foreground">{emptyLabel}</span>
  }

  if (names.length === 1) {
    return <span>{names[0]}</span>
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {names.map((name) => (
        <span
          key={name}
          className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
        >
          {name}
        </span>
      ))}
    </span>
  )
}
