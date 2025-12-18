import { getAdminUsers } from '@/app/actions/admin'
import { AdminUsersTable } from './admin-users-table'

export default async function AdminUsersPage() {
  const { users, error } = await getAdminUsers()

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, view credit balances, and adjust credits as needed.
        </p>
      </div>
      <AdminUsersTable initialUsers={users} />
    </div>
  )
}

