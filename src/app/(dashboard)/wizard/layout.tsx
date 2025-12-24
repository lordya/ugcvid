'use client'

import { useWizardStore } from '@/store/useWizardStore'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const regularSteps = [
  { number: 1, label: 'Input', path: '/wizard' },
  { number: 2, label: 'Review', path: '/wizard/script' },
  { number: 3, label: 'Processing', path: '/wizard/processing' },
]

const bulkSteps = [
  { number: 1, label: 'Upload', path: '/wizard' },
  { number: 2, label: 'Validate', path: '/wizard' },
  { number: 3, label: 'Review', path: '/wizard/batch/[id]' },
  { number: 4, label: 'Process', path: '/wizard/bulk-process' },
]

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentStep = useWizardStore((state) => state.step)
  const isBulkMode = useWizardStore((state) => state.isBulkMode)

  const steps = isBulkMode ? bulkSteps : regularSteps

  return (
    <div className="min-h-screen bg-layer-1">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Wizard Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              const isLast = index === steps.length - 1

              return (
                <div key={step.number} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'bg-success text-success-foreground'
                            : 'bg-layer-2 text-muted-foreground border border-border'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-sm font-medium',
                        isActive
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-success'
                            : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-4 transition-colors',
                        isCompleted ? 'bg-success' : 'bg-layer-2'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Wizard Content */}
        <div className="bg-layer-2 rounded-lg border border-border p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

