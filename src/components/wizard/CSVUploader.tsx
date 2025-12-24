'use client'

import { useState, useCallback, DragEvent, ChangeEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react'
import Papa from 'papaparse'

export interface CSVRow {
  url: string
  custom_title?: string
  style?: string
  rowIndex: number
  isValid?: boolean
  error?: string
}

export interface CSVValidationResult {
  total: number
  valid: number
  invalid: number
  invalidRows: number[]
  rows: CSVRow[]
}

interface CSVUploaderProps {
  onValidationComplete: (result: CSVValidationResult) => void
  onFileSelect: (file: File) => void
  disabled?: boolean
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_ROWS = 50

const validateCSVRow = (row: any, index: number): CSVRow => {
  const csvRow: CSVRow = {
    url: row.url || '',
    custom_title: row.custom_title || '',
    style: row.style || '',
    rowIndex: index,
  }

  // Check if URL is present
  if (!csvRow.url.trim()) {
    csvRow.isValid = false
    csvRow.error = 'URL is required'
    return csvRow
  }

  // Validate Amazon URL format
  const amazonPattern = /^https?:\/\/(www\.)?(amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)|amzn\.to)/
  if (!amazonPattern.test(csvRow.url.trim())) {
    csvRow.isValid = false
    csvRow.error = 'Invalid Amazon URL format'
    return csvRow
  }

  csvRow.isValid = true
  return csvRow
}

export default function CSVUploader({
  onValidationComplete,
  onFileSelect,
  disabled = false
}: CSVUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Please select a CSV file (.csv)'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB'
    }

    return null
  }

  const parseAndValidateCSV = async (file: File): Promise<CSVValidationResult> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const { data, errors } = results

            if (errors.length > 0) {
              reject(new Error('Invalid CSV format'))
              return
            }

            // Check row count
            if (data.length > MAX_ROWS) {
              reject(new Error(`CSV contains ${data.length} rows. Maximum allowed is ${MAX_ROWS} rows.`))
              return
            }

            // Validate each row
            const validatedRows: CSVRow[] = data.map((row: any, index: number) =>
              validateCSVRow(row, index + 1) // +1 for 1-based indexing in UI
            )

            const validRows = validatedRows.filter(row => row.isValid)
            const invalidRows = validatedRows.filter(row => !row.isValid)

            const result: CSVValidationResult = {
              total: validatedRows.length,
              valid: validRows.length,
              invalid: invalidRows.length,
              invalidRows: invalidRows.map(row => row.rowIndex),
              rows: validatedRows
            }

            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    setValidationResult(null)

    // Validate file
    const fileError = validateFile(file)
    if (fileError) {
      setError(fileError)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
    setIsValidating(true)

    try {
      const result = await parseAndValidateCSV(file)
      setValidationResult(result)
      onValidationComplete(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate CSV')
      setSelectedFile(null)
    } finally {
      setIsValidating(false)
    }
  }, [onFileSelect, onValidationComplete])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, handleFileSelect])

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setValidationResult(null)
    setError(null)
  }

  return (
    <Card className="bg-layer-2 border-border">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">
              Upload CSV File
            </Label>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file containing Amazon product URLs. Format: url (required), custom_title (optional), style (optional)
            </p>
          </div>

          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : disabled
                    ? 'border-border/50 bg-layer-3/50'
                    : 'border-border hover:border-primary/50 hover:bg-layer-3'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled}
              />
              <label
                htmlFor="csv-file"
                className={`cursor-pointer flex flex-col items-center space-y-4 ${
                  disabled ? 'cursor-not-allowed' : ''
                }`}
              >
                <div className={`p-4 rounded-full ${
                  disabled ? 'bg-layer-3' : 'bg-layer-3 hover:bg-primary/10'
                }`}>
                  <Upload className={`h-8 w-8 ${
                    disabled ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="space-y-2">
                  <div>
                    <span className={`text-primary hover:underline ${
                      disabled ? 'text-muted-foreground' : ''
                    }`}>
                      Click to upload
                    </span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CSV files up to 2MB, max 50 rows
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-layer-3 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Validation Status */}
              {isValidating && (
                <div className="flex items-center space-x-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <p className="text-sm">Validating CSV...</p>
                </div>
              )}

              {validationResult && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {validationResult.invalid === 0 ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                    <p className="font-medium">
                      Validation Complete
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-layer-3 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-primary">
                        {validationResult.total}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Rows</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-success">
                        {validationResult.valid}
                      </p>
                      <p className="text-xs text-muted-foreground">Valid</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-destructive">
                        {validationResult.invalid}
                      </p>
                      <p className="text-xs text-muted-foreground">Invalid</p>
                    </div>
                  </div>

                  {validationResult.invalid > 0 && (
                    <div className="p-3 bg-warning/5 border border-warning/20 rounded-md">
                      <p className="text-sm text-warning">
                        Invalid rows: {validationResult.invalidRows.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
