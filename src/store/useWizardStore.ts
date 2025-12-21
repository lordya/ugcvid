import { create } from 'zustand'
import { UGCContent } from '@/types/supabase'

export interface ProductMetadata {
  title: string
  description: string
  images: string[]
}

interface WizardState {
  step: number // 1: Input, 2: Review, 3: Processing
  style: string // Video style: 'ugc', 'green_screen', 'pas', 'asmr', 'before_after'
  duration: '10s' | '30s' // Video duration
  url: string
  metadata: ProductMetadata | null
  script: string
  ugcContent: UGCContent | null // Structured UGC content from AI
  images: string[]
  selectedImages: string[] // Array of selected image URLs
  manualInput: {
    title: string
    description: string
    uploadedImages: File[]
  }
  setStep: (step: number) => void
  setStyle: (style: string) => void
  setDuration: (duration: '10s' | '30s') => void
  setUrl: (url: string) => void
  setMetadata: (metadata: ProductMetadata) => void
  setScript: (script: string) => void
  setUgcContent: (ugcContent: UGCContent | null) => void
  setImages: (images: string[]) => void
  setSelectedImages: (images: string[]) => void
  toggleImageSelection: (imageUrl: string) => void
  setManualInput: (input: { title: string; description: string; uploadedImages: File[] }) => void
  reset: () => void
}

const initialState = {
  step: 1,
  style: 'ugc',
  duration: '30s' as const,
  url: '',
  metadata: null,
  script: '',
  ugcContent: null,
  images: [],
  selectedImages: [],
  manualInput: {
    title: '',
    description: '',
    uploadedImages: [],
  },
}

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setStyle: (style) => set({ style }),
  setDuration: (duration) => set({ duration }),
  setUrl: (url) => set({ url }),
  setMetadata: (metadata) => set({ metadata }),
  setScript: (script) => set({ script }),
  setUgcContent: (ugcContent) => set({ ugcContent }),
  setImages: (images) => set({ images }),
  setSelectedImages: (images) => set({ selectedImages: images }),
  toggleImageSelection: (imageUrl) => {
    const { selectedImages } = get()
    if (selectedImages.includes(imageUrl)) {
      // Remove if already selected
      set({ selectedImages: selectedImages.filter((url) => url !== imageUrl) })
    } else {
      // Add if not selected (but limit to 5)
      if (selectedImages.length < 5) {
        set({ selectedImages: [...selectedImages, imageUrl] })
      }
    }
  },
  setManualInput: (input) => set({ manualInput: input }),
  reset: () => set(initialState),
}))

