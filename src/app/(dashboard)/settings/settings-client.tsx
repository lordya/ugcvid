'use client'

import { useState, useTransition } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { updateProfile, updatePreferences, uploadAvatar, getUserTransactions } from '@/app/actions/settings'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface SettingsClientProps {
  initialDisplayName: string
  initialAvatarUrl: string
  initialEmailNotifications: boolean
  initialCreditsBalance: number
  userEmail: string
}

export function SettingsClient({
  initialDisplayName,
  initialAvatarUrl,
  initialEmailNotifications,
  initialCreditsBalance,
  userEmail,
}: SettingsClientProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications)
  const [creditsBalance] = useState(initialCreditsBalance)
  const [transactions, setTransactions] = useState<Array<{
    id: string
    amount: number
    type: string
    provider: string
    created_at: string
    payment_id: string | null
  }>>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Handle theme mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load transactions on mount
  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const { transactions: txns } = await getUserTransactions()
      setTransactions(txns)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateProfile({ display_name: displayName })
      if (result.success) {
        // Show success toast or message
        console.log('Profile updated successfully')
      } else {
        console.error('Error updating profile:', result.error)
        alert(result.error || 'Failed to update profile')
      }
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadAvatar(formData)
      if (result.success && result.url) {
        setAvatarUrl(result.url)
        console.log('Avatar uploaded successfully')
      } else {
        console.error('Error uploading avatar:', result.error)
        alert(result.error || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked)
    startTransition(async () => {
      const result = await updatePreferences({ email_notifications: checked })
      if (result.success) {
        console.log('Preferences updated successfully')
      } else {
        console.error('Error updating preferences:', result.error)
        alert(result.error || 'Failed to update preferences')
      }
    })
  }

  const formatAmount = (amount: number) => {
    return amount > 0 ? `+${amount}` : `${amount}`
  }

  const formatProvider = (provider: string) => {
    const providerMap: Record<string, string> = {
      LEMON: 'Lemon Squeezy',
      CRYPTO: 'Cryptomus',
      SYSTEM: 'System',
    }
    return providerMap[provider] || provider
  }

  const formatType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')
  }

  return (
    <div className="min-h-screen bg-[#0A0E14] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#161B22] border border-border">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#1F2937]">
              Profile
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-[#1F2937]">
              Billing
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-[#1F2937]">
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-[#161B22] border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your display name and avatar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#1F2937] border-2 border-border flex items-center justify-center">
                        <span className="text-2xl text-muted-foreground">
                          {userEmail.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {uploadingAvatar ? 'Uploading...' : 'Upload a new avatar (max 5MB)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display Name Form */}
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      disabled={isPending}
                    />
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-[#161B22] border-border">
              <CardHeader>
                <CardTitle>Billing & Transactions</CardTitle>
                <CardDescription>
                  Current balance: <span className="font-semibold text-foreground">{creditsBalance} credits</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>{formatType(tx.type)}</TableCell>
                            <TableCell
                              className={`font-mono ${
                                tx.amount > 0 ? 'text-success' : 'text-foreground'
                              }`}
                            >
                              {formatAmount(tx.amount)} credits
                            </TableCell>
                            <TableCell>{formatProvider(tx.provider)}</TableCell>
                            <TableCell>
                              <span className="text-success">Completed</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/billing'}
                    className="w-full"
                  >
                    Buy More Credits
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Manage your subscription through the billing portal
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="bg-[#161B22] border-border">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Manage your notification and display preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications when your video is ready
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={handleEmailNotificationsChange}
                    disabled={isPending}
                  />
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  {mounted && (
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

