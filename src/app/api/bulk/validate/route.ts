import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'

interface CSVRow {
  url: string
  custom_title?: string
  style?: string
}

interface ValidationResult {
  total: number
  valid: number
  invalid: number
  invalid_rows: number[]
  rows: Array<{
    url: string
    custom_title?: string
    style?: string
    isValid: boolean
    error?: string
  }>
}

// Helper function to validate Amazon URLs
function validateAmazonUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL is required' }
  }

  const trimmedUrl = url.trim()

  // Check for valid Amazon URL format
  const amazonPattern = /^https?:\/\/(www\.)?(amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)|amzn\.to)/
  if (!amazonPattern.test(trimmedUrl)) {
    return { isValid: false, error: 'Invalid Amazon URL format' }
  }

  // Additional validation for basic URL structure
  try {
    const urlObj = new URL(trimmedUrl)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Invalid URL protocol' }
    }
  } catch {
    return { isValid: false, error: 'Invalid URL format' }
  }

  return { isValid: true }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      )
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      )
    }

    // Convert file to string for parsing
    const fileContent = await file.text()

    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
    })

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors)
      return NextResponse.json(
        { error: 'Invalid CSV format' },
        { status: 400 }
      )
    }

    const rows: CSVRow[] = parseResult.data as CSVRow[]

    // Validate row count (max 50)
    if (rows.length > 50) {
      return NextResponse.json(
        { error: `CSV contains ${rows.length} rows. Maximum allowed is 50 rows.` },
        { status: 400 }
      )
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or contains no valid data' },
        { status: 400 }
      )
    }

    // Validate each row
    const validatedRows = rows.map((row, index) => {
      const validation = validateAmazonUrl(row.url)

      return {
        url: row.url || '',
        custom_title: row.custom_title || '',
        style: row.style || '',
        isValid: validation.isValid,
        error: validation.error,
        rowIndex: index + 1 // 1-based indexing for UI
      }
    })

    // Calculate summary
    const validRows = validatedRows.filter(row => row.isValid)
    const invalidRows = validatedRows.filter(row => !row.isValid)

    const result: ValidationResult = {
      total: validatedRows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      invalid_rows: invalidRows.map(row => row.rowIndex),
      rows: validatedRows
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Bulk validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate CSV file' },
      { status: 500 }
    )
  }
}
