import { useEffect, useState } from 'react'

// Dəyər dəyişəndən sonra delay ms gözləyir. Axtarışda hər hərfə sorğu getməsin deyə.
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}