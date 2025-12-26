import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadMultipleImagesToStorage } from '@/lib/image-storage'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const files: File[] = []

    // Extract all files from form data
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate file types and sizes
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          error: `File ${file.name} is too large. Maximum size is 10MB.`
        }, { status: 400 })
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({
          error: `File ${file.name} has unsupported type. Allowed: JPEG, PNG, GIF, WebP.`
        }, { status: 400 })
      }
    }

    // Upload images to Supabase storage
    const imageUrls = await uploadMultipleImagesToStorage(files, user.id)

    if (!imageUrls) {
      return NextResponse.json({
        error: 'Failed to upload images to storage'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      urls: imageUrls,
      count: imageUrls.length
    })

  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
