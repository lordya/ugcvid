'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/store/useWizardStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Loader2 } from 'lucide-react'
import StyleSelector from '@/components/wizard/StyleSelector'
import CSVUploader, { CSVValidationResult } from '@/components/wizard/CSVUploader'
import CSVValidationModal from '@/components/wizard/CSVValidationModal'

export default function WizardInputPage() {
  const router = useRouter()
  const { setUrl, setMetadata, setStep, setManualInput } = useWizardStore()
  const [activeTab, setActiveTab] = useState<'amazon' | 'manual' | 'bulk'>('amazon')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Amazon URL state
  const [amazonUrl, setAmazonUrl] = useState('')

  // Manual input state
  const [manualTitle, setManualTitle] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Bulk upload state
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [bulkValidationResult, setBulkValidationResult] = useState<CSVValidationResult | null>(null)

  const validateAmazonUrl = (url: string): boolean => {
    if (!url.trim()) return false
    // Basic Amazon URL validation
    const amazonPattern = /^https?:\/\/(www\.)?(amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)|amzn\.to)/
    return amazonPattern.test(url.trim())
  }

  const handleAmazonFetch = async () => {
    setError(null)
    
    if (!validateAmazonUrl(amazonUrl)) {
      setError('Please enter a valid Amazon URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: amazonUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch product data')
      }

      const data = await response.json()
      
      // Update store
      setUrl(amazonUrl)
      setMetadata({
        title: data.title,
        description: data.description,
        images: data.images,
      })
      setStep(2)
      
      // Navigate to review step
      router.push('/wizard/script')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = () => {
    setError(null)

    if (!manualTitle.trim() || !manualDescription.trim()) {
      setError('Title and Description are required')
      return
    }

    // Update store with manual input
    setManualInput({
      title: manualTitle,
      description: manualDescription,
      uploadedImages: uploadedFiles,
    })

    // Create metadata from manual input
    setMetadata({
      title: manualTitle,
      description: manualDescription,
      images: uploadedFiles.map((file) => URL.createObjectURL(file)),
    })

    setStep(2)
    router.push('/wizard/script')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    // Limit to 5 images as per requirements
    const limitedFiles = files.slice(0, 5)
    setUploadedFiles(limitedFiles)
  }

  // Bulk upload handlers
  const handleBulkValidationComplete = (result: CSVValidationResult) => {
    setBulkValidationResult(result)
    setShowValidationModal(true)
  }

  const handleBulkFileSelect = (file: File) => {
    // Store file in wizard store for later use
    const { setBulkFile } = useWizardStore.getState()
    setBulkFile(file)
  }

  const handleBulkConfirm = async (correctedRows: any[]) => {
    // Store corrected rows
    const { setBulkCorrectedRows, setBulkMode, setStep } = useWizardStore.getState()
    setBulkCorrectedRows(correctedRows)
    setBulkMode(true)
    setStep(2) // Go to processing step
    setShowValidationModal(false)

    // Navigate to processing page
    router.push('/wizard/bulk-process')
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Create Your Video</h1>
        <p className="text-muted-foreground">
          Start by providing product information or an Amazon URL
        </p>
      </div>

      {/* Creative Strategy Step */}
      <StyleSelector />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'amazon' | 'manual' | 'bulk')}>
        <TabsList className="w-full bg-layer-3 border border-border">
          <TabsTrigger value="amazon" className="flex-1 data-[state=active]:bg-layer-2">
            Amazon URL
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 data-[state=active]:bg-layer-2">
            Manual Input
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1 data-[state=active]:bg-layer-2">
            Bulk Generate
          </TabsTrigger>
        </TabsList>

        {/* Amazon URL Tab */}
        <TabsContent value="amazon" className="mt-6">
          <Card className="bg-layer-2 border-border">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amazon-url" className="text-base font-medium">
                    Amazon Product URL
                  </Label>
                  <Input
                    id="amazon-url"
                    type="url"
                    placeholder="https://www.amazon.com/dp/..."
                    value={amazonUrl}
                    onChange={(e) => setAmazonUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        handleAmazonFetch()
                      }
                    }}
                    className="h-12 text-base"
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste an Amazon product URL to automatically fetch product details
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleAmazonFetch}
                  disabled={loading || !amazonUrl.trim()}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Product Details'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Input Tab */}
        <TabsContent value="manual" className="mt-6">
          <Card className="bg-layer-2 border-border">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="manual-title" className="text-base font-medium">
                    Product Title *
                  </Label>
                  <Input
                    id="manual-title"
                    type="text"
                    placeholder="Enter product title"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-description" className="text-base font-medium">
                    Product Description *
                  </Label>
                  <textarea
                    id="manual-description"
                    placeholder="Enter product description"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-images" className="text-base font-medium">
                    Product Images (Optional)
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="manual-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="manual-images"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <span className="text-primary hover:underline">
                          Click to upload
                        </span>
                        <span className="text-muted-foreground"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Up to 5 images (PNG, JPG, GIF)
                      </p>
                    </label>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="text-xs bg-layer-3 px-2 py-1 rounded border border-border"
                          >
                            {file.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualTitle.trim() || !manualDescription.trim()}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  Continue to Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="mt-6">
          <Card className="bg-layer-2 border-border">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Bulk Video Generation</h3>
                  <p className="text-muted-foreground">
                    Upload a CSV file with multiple Amazon product URLs to generate videos in batch
                  </p>
                </div>

                <div className="bg-layer-3 border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">CSV Format Requirements</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• <strong>url</strong> (required): Amazon product URL</p>
                    <p>• <strong>custom_title</strong> (optional): Override product title</p>
                    <p>• <strong>style</strong> (optional): Video style (ugc_auth, green_screen, pas_framework, asmr_visual, before_after)</p>
                    <p>• Maximum 50 rows per upload</p>
                    <p>• File size limit: 2MB</p>
                  </div>
                </div>

                <CSVUploader
                  onValidationComplete={handleBulkValidationComplete}
                  onFileSelect={handleBulkFileSelect}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Validation Modal */}
      {showValidationModal && bulkValidationResult && (
        <CSVValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          validationResult={bulkValidationResult}
          onConfirm={handleBulkConfirm}
        />
      )}
    </div>
  )
}

