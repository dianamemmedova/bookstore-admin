import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { ApiError } from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!email.trim() || !password) {
      setError('Email və parolu daxil edin.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Email və ya parol yanlışdır.')
        else if (err.status === 429) setError('Çox sayda uğursuz cəhd. Bir az sonra yenidən cəhd edin.')
        else setError(err.message)
      } else {
        setError('Xəta baş verdi. Yenidən cəhd edin.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-surface hover:text-ink"
        aria-label="Temanı dəyiş"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="animate-fade-in w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white shadow-lg">B</div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Book &amp; Store Admin</h1>
          <p className="mt-1 text-sm text-muted">Davam etmək üçün administrator hesabı ilə daxil olun</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8" noValidate>
          {error && (
            <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</div>
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@bookstore.az"
            icon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <Input
            label="Parol"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            right={
              <button type="button" onClick={() => setShow((v) => !v)} className="rounded p-1.5 text-muted hover:text-ink" aria-label={show ? 'Parolu gizlət' : 'Parolu göstər'}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <Button type="submit" size="lg" loading={submitting} className="w-full">Daxil ol</Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={14} /> Yalnız səlahiyyətli işçilər üçün
        </p>
      </div>
    </div>
  )
}