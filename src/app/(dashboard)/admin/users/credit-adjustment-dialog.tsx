'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminUser, adjustUserCredits } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'

interface CreditAdjustmentDialogProps {
  user: AdminUser
  onAdjusted?: (userId: string, amount: number) => void
}

export function CreditAdjustmentDialog({ user, onAdjusted }: CreditAdjustmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const amountNum = parseInt(amount, 10)
    if (isNaN(amountNum) || amountNum === 0) {
      setError('Amount must be a non-zero integer')
      setLoading(false)
      return
    }

    if (!reason.trim()) {
      setError('Reason is required')
      setLoading(false)
      return
    }

    const result = await adjustUserCredits(user.id, amountNum, reason.trim())

    if (result.success) {
      // Notify parent component to update state
      onAdjusted?.(user.id, amountNum)
      setOpen(false)
      setAmount('')
      setReason('')
      router.refresh()
    } else {
      setError(result.error || 'Failed to adjust credits')
    }

    setLoading(false)
  }

  const isPositive = amount !== '' && parseInt(amount, 10) > 0
  const isNegative = amount !== '' && parseInt(amount, 10) < 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Credits</DialogTitle>
          <DialogDescription>
            Adjust credits for {user.email}. Positive amounts add credits (BONUS), negative
            amounts remove credits (REFUND).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="+10 or -5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${
                    isPositive
                      ? 'border-[#10B981] focus-visible:ring-[#10B981]'
                      : isNegative
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                  }`}
                />
                {isPositive && (
                  <span className="text-[#10B981] text-sm font-medium">+{amount} credits</span>
                )}
                {isNegative && (
                  <span className="text-destructive text-sm font-medium">{amount} credits</span>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                placeholder="e.g., Customer support refund, Promotional bonus"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setAmount('')
                setReason('')
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

