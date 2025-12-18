'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { 
  Video, 
  Library, 
  CreditCard, 
  Settings,
  Search
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

const navigationItems = [
  { id: 'create', label: 'Create Video', href: '/wizard', icon: Video },
  { id: 'library', label: 'Library', href: '/library', icon: Library },
  { id: 'billing', label: 'Billing', href: '/billing', icon: CreditCard },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
]

const actionItems = [
  { id: 'new-video', label: 'New Video', href: '/wizard', icon: Video },
]

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 bg-layer-2 border-border max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Group heading="Navigation">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.id}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-3 px-2 py-3 text-sm cursor-pointer hover:bg-layer-3 aria-selected:bg-layer-3 aria-selected:text-[#6366F1]"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                )
              })}
            </Command.Group>
            <Command.Group heading="Actions">
              {actionItems.map((item) => {
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.id}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-3 px-2 py-3 text-sm cursor-pointer hover:bg-layer-3 aria-selected:bg-layer-3 aria-selected:text-[#6366F1]"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                )
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

