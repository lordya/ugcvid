'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Video,
  Library,
  CreditCard,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/actions/auth'

const navigation = [
  { name: 'Create', href: '/wizard', icon: Video },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'Model Prompts', href: '/admin/prompts', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [creditsBalance, setCreditsBalance] = useState<number>(0)
  const [videoCount, setVideoCount] = useState<number>(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setUser(authUser)

        // Fetch user credits balance
        const { data: userData } = await supabase
          .from('users')
          .select('credits_balance')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setCreditsBalance(userData.credits_balance || 0)
        }

        // Fetch video count
        const { count } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)

        setVideoCount(count || 0)

        // Check if user is admin by trying to access an admin route
        try {
          const response = await fetch('/api/admin/check-access', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          setIsAdmin(response.ok)
        } catch {
          setIsAdmin(false)
        }
      }
    }

    fetchUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileOpen])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/wizard') {
      return pathname.startsWith('/wizard')
    }
    if (href === '/library') {
      return pathname === '/library' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-layer-2 border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/library" className="text-xl font-semibold text-white">
          AFP UGC
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const isCreateButton = item.href === '/wizard'
          const shouldPulse = isCreateButton && videoCount === 0

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-layer-3 text-[#6366F1]'
                  : 'text-muted-foreground hover:bg-layer-3 hover:text-foreground',
                shouldPulse && 'ring-2 ring-[#6366F1] ring-offset-2 ring-offset-layer-2 animate-pulse'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className="px-3 py-2">
              <div className="border-t border-border"></div>
            </div>
            {adminNavigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-layer-3 text-[#6366F1]'
                      : 'text-muted-foreground hover:bg-layer-3 hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User Profile Dropdown */}
      <div className="border-t border-border p-4">
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-layer-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {creditsBalance} Credits
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              profileOpen && 'rotate-180'
            )} />
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-layer-2 border border-border rounded-md shadow-lg overflow-hidden">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-layer-3 transition-colors"
                onClick={() => setProfileOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-layer-3 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

