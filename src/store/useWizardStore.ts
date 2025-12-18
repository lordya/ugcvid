import { create } from 'zustand'

export interface ProductMetadata {
  title: string
  description: string
  images: string[]
}

interface WizardState {
  step: number // 1: Input, 2: Review, 3: Processing
  url: string
  metadata: ProductMetadata | null
  script: string
  images: string[]
  manualInput: {
    title: string
    description: string
    uploadedImages: File[]
  }
  setStep: (step: number) => void
  setUrl: (url: string) => void
  setMetadata: (metadata: ProductMetadata) => void
  setScript: (script: string) => void
  setImages: (images: string[]) => void
  setManualInput: (input: { title: string; description: string; uploadedImages: File[] }) => void
  reset: () => void
}

const initialState = {
  step: 1,
  url: '',
  metadata: null,
  script: '',
  images: [],
  manualInput: {
    title: '',
    description: '',
    uploadedImages: [],
  },
}

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setUrl: (url) => set({ url }),
  setMetadata: (metadata) => set({ metadata }),
  setScript: (script) => set({ script }),
  setImages: (images) => set({ images }),
  setManualInput: (input) => set({ manualInput: input }),
  reset: () => set(initialState),
}))

