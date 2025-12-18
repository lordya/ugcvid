import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-[#0A0E14] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Library</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.email}
            </p>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              className="bg-[#161B22] border-border hover:bg-[#1F2937]"
            >
              Sign Out
            </Button>
          </form>
        </div>
        <div className="rounded-lg border bg-[#161B22] p-12 text-center">
          <p className="text-muted-foreground text-lg">
            Your video library is empty—let's create something
          </p>
        </div>
      </div>
    </main>
  )
}

