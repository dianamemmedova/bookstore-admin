import { BookOpen } from 'lucide-react'
import { coverSrc } from '../../lib/media'

export default function BookCover({ url, title, className = 'h-12 w-9' }: { url: string | null; title: string; className?: string }) {
  const src = coverSrc(url)
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded bg-surface-2 text-muted ${className}`}>
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <BookOpen size={16} />
      )}
    </div>
  )
}