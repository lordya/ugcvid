'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Video, Library, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNav = [
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Create', href: '/wizard', icon: Video },
  { name: 'Account', href: '/settings', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/wizard') {
      return pathname.startsWith('/wizard')
    }
    if (href === '/library') {
      return pathname === '/library' || pathname === '/'
    }
    if (href === '/settings') {
      return pathname.startsWith('/settings') || pathname.startsWith('/billing')
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-layer-2 border-t border-border lg:hidden z-40">
      <div className="flex items-center justify-around h-16">
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                active
                  ? 'text-[#6366F1]'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

