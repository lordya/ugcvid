import { getAdminModelPrompts } from '@/app/actions/admin'
import { ModelPromptsTable } from './model-prompts-table'

export default async function AdminPromptsPage() {
  const { prompts, error } = await getAdminModelPrompts()

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
        <h1 className="text-3xl font-bold">Model Prompts Management</h1>
        <p className="text-muted-foreground mt-2">
          View, create, and manage AI model prompts for video generation.
        </p>
      </div>
      <ModelPromptsTable initialPrompts={prompts} />
    </div>
  )
}
