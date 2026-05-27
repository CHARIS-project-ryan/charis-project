import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  placeholder?: string
  onChange: (value: string) => void
  debounceMs?: number
}

export function SearchInput({
  placeholder = 'Search…',
  onChange,
  debounceMs = 300,
}: SearchInputProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onChange(value), debounceMs)
    return () => clearTimeout(timer)
  }, [value, debounceMs, onChange])

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="max-w-xs"
    />
  )
}
