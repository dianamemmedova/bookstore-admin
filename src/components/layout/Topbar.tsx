import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { initials } from '../../lib/format'

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Menyudan kənara klik edəndə bağlanır
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!user) return null

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink lg:hidden" aria-label="Menyu">
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label={theme === 'dark' ? 'Açıq rejim' : 'Tünd rejim'}
          title={theme === 'dark' ? 'Açıq rejim' : 'Tünd rejim'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={ref}>
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 rounded-lg p-1.5 pr-3 hover:bg-surface-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials(user.firstName, user.lastName)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-ink">{user.firstName} {user.lastName}</span>
              <span className="block text-xs text-muted">Administrator</span>
            </span>
          </button>

          {open && (
            <div className="animate-fade-in absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-medium text-ink">{user.firstName} {user.lastName}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <button onClick={logout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-surface-2">
                <LogOut size={16} /> Çıxış
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}