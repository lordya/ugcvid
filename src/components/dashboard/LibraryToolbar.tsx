'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckSquare, Square } from 'lucide-react'

export type VideoStatusFilter = 'ALL' | 'READY' | 'PROCESSING' | 'FAILED'
export type SortOption = 'NEWEST' | 'OLDEST'

interface LibraryToolbarProps {
  statusFilter: VideoStatusFilter
  onStatusFilterChange: (filter: VideoStatusFilter) => void
  sortOption: SortOption
  onSortChange: (sort: SortOption) => void
  isSelectionMode: boolean
  onToggleSelectionMode: () => void
  selectedCount: number
}

export function LibraryToolbar({
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortChange,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
}: LibraryToolbarProps) {
  // Map status filter to display values
  const statusMap: Record<VideoStatusFilter, string> = {
    ALL: 'All',
    READY: 'Ready',
    PROCESSING: 'Processing',
    FAILED: 'Failed',
  }

  // Map sort option to display values
  const sortMap: Record<SortOption, string> = {
    NEWEST: 'Newest First',
    OLDEST: 'Oldest First',
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            Status:
          </label>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as VideoStatusFilter)
            }
          >
            <SelectTrigger className="w-[140px] bg-[#161B22] border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusMap).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Option */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            Sort:
          </label>
          <Select
            value={sortOption}
            onValueChange={(value) => onSortChange(value as SortOption)}
          >
            <SelectTrigger className="w-[150px] bg-[#161B22] border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortMap).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection Mode Toggle */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
        )}
        <Button
          variant={isSelectionMode ? 'default' : 'outline'}
          onClick={onToggleSelectionMode}
          className="bg-[#161B22] border-border hover:bg-[#1F2937]"
        >
          {isSelectionMode ? (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Exit Selection
            </>
          ) : (
            <>
              <Square className="h-4 w-4 mr-2" />
              Select
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

