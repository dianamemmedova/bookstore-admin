import { BookOpen, CalendarDays, Gift, LayoutDashboard, Mail, MapPin, Newspaper, ShoppingBag, Ticket, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem { to: string; label: string; icon: LucideIcon }
export interface NavGroup { title: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    title: 'Əsas',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/books', label: 'Kitablar', icon: BookOpen },
      { to: '/orders', label: 'Sifarişlər', icon: ShoppingBag },
      { to: '/users', label: 'İstifadəçilər', icon: Users },
    ],
  },
  {
    title: 'Marketinq',
    items: [
      { to: '/promos', label: 'Promo kodlar', icon: Ticket },
      { to: '/gift-cards', label: 'Hədiyyə kartları', icon: Gift },
      { to: '/newsletter', label: 'Bülleten', icon: Newspaper },
    ],
  },
  {
    title: 'Mağazalar',
    items: [
      { to: '/stores', label: 'Mağazalar', icon: MapPin },
      { to: '/events', label: 'Tədbirlər', icon: CalendarDays },
      { to: '/messages', label: 'Mesajlar', icon: Mail },
    ],
  },
]