'use client'

import * as React from 'react'
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, Search, Eye, Edit, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ModelPrompt } from '@/types/model-prompts'
import { PromptEditDialog } from './prompt-edit-dialog'
import { PromptViewDialog } from './prompt-view-dialog'
import { deleteModelPrompt } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ModelPromptsTableProps {
  initialPrompts: ModelPrompt[]
}

export function ModelPromptsTable({ initialPrompts }: ModelPromptsTableProps) {
  const [prompts, setPrompts] = React.useState<ModelPrompt[]>(initialPrompts)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [selectedPrompt, setSelectedPrompt] = React.useState<ModelPrompt | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const router = useRouter()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleView = (prompt: ModelPrompt) => {
    setSelectedPrompt(prompt)
    setViewDialogOpen(true)
  }

  const handleEdit = (prompt: ModelPrompt) => {
    setSelectedPrompt(prompt)
    setEditDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedPrompt(null)
    setCreateDialogOpen(true)
  }

  const handleDelete = async (prompt: ModelPrompt) => {
    if (!confirm(`Are you sure you want to deactivate the prompt for ${prompt.model_name} (${prompt.style}_${prompt.duration})?`)) {
      return
    }

    setIsLoading(true)
    try {
      const { success, error } = await deleteModelPrompt(prompt.id)

      if (success) {
        setPrompts(prev => prev.map(p =>
          p.id === prompt.id ? { ...p, is_active: false } : p
        ))
        showToast('The model prompt has been deactivated successfully.', 'success')
      } else {
        showToast(error || 'Failed to deactivate prompt', 'error')
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogClose = (refresh = false) => {
    setViewDialogOpen(false)
    setEditDialogOpen(false)
    setCreateDialogOpen(false)
    setSelectedPrompt(null)

    if (refresh) {
      router.refresh()
    }
  }

  const columns: ColumnDef<ModelPrompt>[] = [
    {
      accessorKey: 'model_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Model Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('model_name')}</div>
      ),
    },
    {
      accessorKey: 'style',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Style
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('style')}</Badge>
      ),
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Duration
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue('duration')}</Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('updated_at'))
        return (
          <div className="text-sm text-muted-foreground">
            {format(date, 'MMM dd, yyyy')}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const prompt = row.original

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(prompt)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(prompt)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(prompt)}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: prompts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No prompts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      {selectedPrompt && (
        <PromptViewDialog
          prompt={selectedPrompt}
          open={viewDialogOpen}
          onOpenChange={(open) => {
            setViewDialogOpen(open)
            if (!open) handleDialogClose()
          }}
        />
      )}

      {/* Edit Dialog */}
      {selectedPrompt && (
        <PromptEditDialog
          prompt={selectedPrompt}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) handleDialogClose(true)
          }}
        />
      )}

      {/* Create Dialog */}
      <PromptEditDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) handleDialogClose(true)
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg border p-4 shadow-lg ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
