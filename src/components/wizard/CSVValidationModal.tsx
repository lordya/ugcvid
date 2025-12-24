'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  Save,
  X
} from 'lucide-react'
import { CSVRow, CSVValidationResult } from './CSVUploader'

interface CSVValidationModalProps {
  isOpen: boolean
  onClose: () => void
  validationResult: CSVValidationResult | null
  onConfirm: (correctedRows: CSVRow[]) => void
  isProcessing?: boolean
}

const STYLE_OPTIONS = [
  { value: 'ugc_auth', label: 'UGC' },
  { value: 'green_screen', label: 'Green Screen' },
  { value: 'pas_framework', label: 'PAS' },
  { value: 'asmr_visual', label: 'ASMR' },
  { value: 'before_after', label: 'Before/After' },
]

export default function CSVValidationModal({
  isOpen,
  onClose,
  validationResult,
  onConfirm,
  isProcessing = false
}: CSVValidationModalProps) {
  const [rows, setRows] = useState<CSVRow[]>([])
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    url: '',
    custom_title: '',
    style: ''
  })

  useEffect(() => {
    if (validationResult) {
      setRows([...validationResult.rows])
    }
  }, [validationResult])

  const handleEditRow = (rowIndex: number) => {
    const row = rows.find(r => r.rowIndex === rowIndex)
    if (row) {
      setEditingRow(rowIndex)
      setEditForm({
        url: row.url,
        custom_title: row.custom_title || '',
        style: row.style || ''
      })
    }
  }

  const handleSaveEdit = () => {
    if (editingRow === null) return

    const updatedRows = rows.map(row => {
      if (row.rowIndex === editingRow) {
        // Validate the updated row
        const updatedRow = {
          ...row,
          url: editForm.url.trim(),
          custom_title: editForm.custom_title.trim(),
          style: editForm.style
        }

        // Re-validate
        const amazonPattern = /^https?:\/\/(www\.)?(amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)|amzn\.to)/
        updatedRow.isValid = Boolean(updatedRow.url && amazonPattern.test(updatedRow.url))
        updatedRow.error = updatedRow.isValid ? undefined : 'Invalid Amazon URL format'

        return updatedRow
      }
      return row
    })

    setRows(updatedRows)
    setEditingRow(null)
  }

  const handleDeleteRow = (rowIndex: number) => {
    setRows(rows.filter(row => row.rowIndex !== rowIndex))
  }

  const handleAddRow = () => {
    const newRowIndex = Math.max(...rows.map(r => r.rowIndex), 0) + 1
    const newRow: CSVRow = {
      url: '',
      custom_title: '',
      style: '',
      rowIndex: newRowIndex,
      isValid: false,
      error: 'URL is required'
    }
    setRows([...rows, newRow])
    setEditingRow(newRowIndex)
    setEditForm({
      url: '',
      custom_title: '',
      style: ''
    })
  }

  const handleConfirm = () => {
    const validRows = rows.filter(row => row.isValid)
    onConfirm(validRows)
  }

  const validCount = rows.filter(row => row.isValid).length
  const invalidCount = rows.filter(row => !row.isValid).length

  if (!validationResult) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-layer-1 border-border overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            Review & Correct CSV Data
          </DialogTitle>
          <p className="text-muted-foreground">
            Review your CSV data and correct any invalid rows before proceeding.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-layer-2 border-border">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-primary">{rows.length}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-success">{validCount}</p>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-destructive">{invalidCount}</p>
                    <p className="text-xs text-muted-foreground">Invalid</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardContent className="p-4">
                <div className="text-center">
                  <Button
                    onClick={handleAddRow}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Row
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rows List */}
          <div className="flex-1 overflow-y-auto border border-border rounded-lg">
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <div key={row.rowIndex} className="p-4 hover:bg-layer-2">
                  {editingRow === row.rowIndex ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Editing Row {row.rowIndex}</h4>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRow(null)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`url-${row.rowIndex}`} className="text-sm font-medium">
                            URL *
                          </Label>
                          <Input
                            id={`url-${row.rowIndex}`}
                            value={editForm.url}
                            onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://www.amazon.com/dp/..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`title-${row.rowIndex}`} className="text-sm font-medium">
                            Custom Title
                          </Label>
                          <Input
                            id={`title-${row.rowIndex}`}
                            value={editForm.custom_title}
                            onChange={(e) => setEditForm(prev => ({ ...prev, custom_title: e.target.value }))}
                            placeholder="Optional custom title"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`style-${row.rowIndex}`} className="text-sm font-medium">
                            Style
                          </Label>
                          <Select
                            value={editForm.style}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, style: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Default style" />
                            </SelectTrigger>
                            <SelectContent>
                              {STYLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge
                            variant={row.isValid ? "default" : "destructive"}
                            className={row.isValid ? "bg-success/10 text-success hover:bg-success/10" : ""}
                          >
                            {row.isValid ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            Row {row.rowIndex}
                          </Badge>

                          {row.custom_title && (
                            <span className="text-sm font-medium text-primary">
                              {row.custom_title}
                            </span>
                          )}

                          {row.style && (
                            <Badge variant="outline" className="text-xs">
                              {STYLE_OPTIONS.find(s => s.value === row.style)?.label || row.style}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground truncate">
                          {row.url}
                        </p>

                        {row.error && (
                          <p className="text-sm text-destructive mt-1">
                            {row.error}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditRow(row.rowIndex)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRow(row.rowIndex)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <div className="flex items-center space-x-4">
              {invalidCount > 0 && (
                <p className="text-sm text-warning">
                  {invalidCount} invalid row{invalidCount > 1 ? 's' : ''} will be excluded
                </p>
              )}

              <Button
                onClick={handleConfirm}
                disabled={validCount === 0 || isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : (
                  `Generate ${validCount} Video${validCount > 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
