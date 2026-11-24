export default function App() {
  const toggle = () => document.documentElement.classList.toggle('dark')

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-card">
        <h1 className="text-xl font-semibold text-ink">Book &amp; Store Admin</h1>
        <p className="mt-1 text-sm text-muted">Tailwind və rənglər işləyir.</p>
        <button
          onClick={toggle}
          className="mt-4 h-10 w-full rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover"
        >
          Temanı dəyiş
        </button>
      </div>
    </div>
  )
}