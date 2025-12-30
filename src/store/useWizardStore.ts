import { create } from 'zustand'
import { UGCContent, StructuredScriptContent } from '@/types/supabase'
import { getFormatKey, selectModelForFormat } from '@/lib/kie-models'

export interface ProductMetadata {
  title: string
  description: string
  images: string[]
}

export interface ScriptVariant {
  id?: string
  angle: {
    id: string
    label: string
    description: string
    keywords: string[]
  }
  content: string
  confidence?: number
  isSelected?: boolean
  isEditing?: boolean
}

export interface BulkCSVRow {
  url: string
  custom_title?: string
  style?: string
  rowIndex: number
  isValid?: boolean
  error?: string
}

export interface BulkValidationResult {
  total: number
  valid: number
  invalid: number
  invalidRows: number[]
  rows: BulkCSVRow[]
}

export interface BatchStatus {
  id: string
  status: string
  totalItems: number
  processedItems: number
  failedItems: number
  pendingItems: number
  progress: number
  totalCreditsReserved: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface BatchItemStatus {
  id: string
  rowIndex: number
  url: string
  customTitle?: string
  style?: string
  status: string
  errorMessage?: string
  creditsUsed: number
  video?: {
    id: string
    status: string
    videoUrl?: string
    errorReason?: string
    createdAt: string
    updatedAt: string
  }
  createdAt: string
  updatedAt: string
}

interface WizardState {
  step: number // Regular: 1: Input, 2: Review, 3: Processing | Bulk: 1: Upload, 2: Validate, 3: Review, 4: Process
  style: string // Video style: 'ugc_auth', 'green_screen', 'pas_framework', 'asmr_visual', 'before_after', 'storyboard'
  duration: '10s' | '15s' | '25s' // Video duration
  language: string // Target language code (e.g., 'en', 'es', 'fr')
  url: string
  metadata: ProductMetadata | null
  selectedAngle: string | null // Selected marketing angle ID, null = auto (3 variations)
  scriptVariants: ScriptVariant[] // Array of script variants from different angles
  selectedScriptVariant: ScriptVariant | null // Currently selected script variant
  ugcContent: UGCContent | null // Structured UGC content from AI
  structuredScript: StructuredScriptContent | null // Structured script content with visual cues, voiceover, etc.
  editedVoiceover: string[] // User-edited voiceover segments
  images: string[]
  selectedImages: string[] // Array of selected image URLs
  manualInput: {
    title: string
    description: string
    uploadedImages: File[]
  }
  // Bulk upload state
  isBulkMode: boolean
  bulkFile: File | null
  bulkValidationResult: BulkValidationResult | null
  bulkCorrectedRows: BulkCSVRow[]
  bulkProcessingStatus: 'idle' | 'processing' | 'completed' | 'error'
  // Batch management
  currentBatchId: string | null
  batchStatus: BatchStatus | null
  batchItems: BatchItemStatus[]
  setStep: (step: number) => void
  setStyle: (style: string) => void
  setDuration: (duration: '10s' | '15s' | '25s') => void
  setLanguage: (language: string) => void
  setUrl: (url: string) => void
  setMetadata: (metadata: ProductMetadata) => void
  setSelectedAngle: (angleId: string | null) => void
  setScriptVariants: (variants: ScriptVariant[]) => void
  selectScriptVariant: (variant: ScriptVariant | null) => void
  updateScriptVariant: (index: number, updates: Partial<ScriptVariant>) => void
  regenerateScriptVariant: (index: number, newVariant: ScriptVariant) => void
  setUgcContent: (ugcContent: UGCContent | null) => void
  setStructuredScript: (structuredScript: StructuredScriptContent | null) => void
  setEditedVoiceover: (editedVoiceover: string[]) => void
  updateVoiceoverSegment: (index: number, text: string) => void
  setImages: (images: string[]) => void
  setSelectedImages: (images: string[]) => void
  toggleImageSelection: (imageUrl: string) => void
  getMaxImageLimit: () => number // Get max image limit based on current style and duration
  setManualInput: (input: { title: string; description: string; uploadedImages: File[] }) => void
  // Bulk upload actions
  setBulkMode: (isBulkMode: boolean) => void
  setBulkFile: (file: File | null) => void
  setBulkValidationResult: (result: BulkValidationResult | null) => void
  setBulkCorrectedRows: (rows: BulkCSVRow[]) => void
  setBulkProcessingStatus: (status: 'idle' | 'processing' | 'completed' | 'error') => void
  // Batch management actions
  startBatch: (batchId: string) => void
  updateBatchStatus: (status: BatchStatus, items: BatchItemStatus[]) => void
  clearBatch: () => void
  reset: () => void
}

const initialState = {
  step: 1,
  style: 'ugc_auth',
  duration: '15s' as const,
  language: 'en',
  url: '',
  metadata: null,
  selectedAngle: null, // null = auto mode (3 variations)
  scriptVariants: [],
  selectedScriptVariant: null,
  ugcContent: null,
  structuredScript: null,
  editedVoiceover: [],
  images: [],
  selectedImages: [],
  manualInput: {
    title: '',
    description: '',
    uploadedImages: [],
  },
  // Bulk upload initial state
  isBulkMode: false,
  bulkFile: null,
  bulkValidationResult: null,
  bulkCorrectedRows: [],
  bulkProcessingStatus: 'idle' as const,
  // Batch management initial state
  currentBatchId: null,
  batchStatus: null,
  batchItems: [],
}

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setStyle: (style) => set({ style }),
  setDuration: (duration) => set({ duration }),
  setLanguage: (language) => set({ language }),
  setUrl: (url) => set({ url }),
  setMetadata: (metadata) => set({ metadata }),
  setSelectedAngle: (selectedAngle) => set({ selectedAngle }),
  setScriptVariants: (scriptVariants) => set({ scriptVariants }),
  selectScriptVariant: (selectedScriptVariant) => set({ selectedScriptVariant }),
  updateScriptVariant: (index, updates) => {
    const { scriptVariants } = get()
    const updated = [...scriptVariants]
    updated[index] = { ...updated[index], ...updates }
    set({ scriptVariants: updated })
  },
  regenerateScriptVariant: (index, newVariant) => {
    const { scriptVariants } = get()
    const updated = [...scriptVariants]
    updated[index] = newVariant
    set({ scriptVariants: updated })
  },
  setUgcContent: (ugcContent) => set({ ugcContent }),
  setStructuredScript: (structuredScript) => set({ structuredScript }),
  setEditedVoiceover: (editedVoiceover) => set({ editedVoiceover }),
  updateVoiceoverSegment: (index, text) => {
    const { editedVoiceover } = get()
    const updated = [...editedVoiceover]
    updated[index] = text
    set({ editedVoiceover: updated })
  },
  setImages: (images) => set({ images }),
  setSelectedImages: (images) => set({ selectedImages: images }),
  getMaxImageLimit: () => {
    const { style, duration } = get()
    try {
      const format = getFormatKey(style, duration)
      const model = selectModelForFormat(format)
      // Return maxImageUrls from model, default to 1 if not specified
      return model.maxImageUrls ?? 1
    } catch (error) {
      console.warn('[WizardStore] Error getting max image limit, defaulting to 1:', error)
      return 1
    }
  },
  toggleImageSelection: (imageUrl) => {
    const { selectedImages, getMaxImageLimit } = get()
    const maxLimit = getMaxImageLimit()
    
    if (selectedImages.includes(imageUrl)) {
      // Remove if already selected
      set({ selectedImages: selectedImages.filter((url) => url !== imageUrl) })
    } else {
      // Add if not selected (but limit to model's maxImageUrls)
      if (selectedImages.length < maxLimit) {
        set({ selectedImages: [...selectedImages, imageUrl] })
      }
    }
  },
  setManualInput: (input) => set({ manualInput: input }),
  // Bulk upload actions
  setBulkMode: (isBulkMode) => set({ isBulkMode }),
  setBulkFile: (file) => set({ bulkFile: file }),
  setBulkValidationResult: (result) => set({ bulkValidationResult: result }),
  setBulkCorrectedRows: (rows) => set({ bulkCorrectedRows: rows }),
  setBulkProcessingStatus: (status) => set({ bulkProcessingStatus: status }),
  // Batch management actions
  startBatch: (batchId) => set({
    currentBatchId: batchId,
    bulkProcessingStatus: 'processing'
  }),
  updateBatchStatus: (status, items) => set({
    batchStatus: status,
    batchItems: items,
    bulkProcessingStatus: status.status === 'COMPLETED' ? 'completed' :
                         status.status === 'FAILED' ? 'error' : 'processing'
  }),
  clearBatch: () => set({
    currentBatchId: null,
    batchStatus: null,
    batchItems: [],
    bulkProcessingStatus: 'idle'
  }),
  reset: () => set(initialState),
}))

