export const metadata = {
  title: 'Terms of Service | AFP UGC',
  description: 'Terms of Service for AFP UGC platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using the AFP UGC platform (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
            <p className="leading-relaxed">
              AFP UGC provides an AI-powered platform for generating user-generated content (UGC) videos from product information. The Service allows users to create professional videos by providing product URLs or manual product details. The Service operates on a credit-based system where each video generation consumes one credit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Obligations</h2>
            <p className="leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and truthful information when using the Service</li>
              <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
              <li>Not attempt to reverse engineer, decompile, or disassemble the Service</li>
              <li>Not use the Service to generate content that is illegal, harmful, or violates any third-party rights</li>
              <li>Maintain the security of your account credentials</li>
              <li>Not share your account with others or allow unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Payment & Refunds</h2>
            <p className="leading-relaxed mb-4">
              The Service operates on a credit-based payment system:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Credits are purchased in advance and used to generate videos</li>
              <li>Each video generation consumes one credit</li>
              <li>Credits do not expire</li>
              <li>Refunds for unused credits may be requested within 30 days of purchase</li>
              <li>All payments are processed through secure third-party payment providers</li>
              <li>Prices are subject to change, but existing credits retain their value</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p className="leading-relaxed mb-4">
              Intellectual property rights:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain ownership of all videos generated using the Service</li>
              <li>You grant AFP UGC a license to use generated content for service improvement and quality assurance</li>
              <li>The Service itself, including all software, algorithms, and technology, remains the property of AFP UGC</li>
              <li>You may not use the Service to infringe upon the intellectual property rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="leading-relaxed">
              AFP UGC shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability for any claims arising from the Service shall not exceed the amount you paid for credits in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Service Availability</h2>
            <p className="leading-relaxed">
              We strive to maintain high availability of the Service but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or unforeseen circumstances. We are not liable for any losses resulting from Service unavailability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Account Termination</h2>
            <p className="leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account if you:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate these Terms of Service</li>
              <li>Engage in fraudulent or illegal activities</li>
              <li>Attempt to abuse or exploit the Service</li>
              <li>Fail to pay for credits or services</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Upon termination, you will lose access to your account and any unused credits may be forfeited unless otherwise specified.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be communicated through the Service or via email. Continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
            <p className="leading-relaxed">
              If you have questions about these Terms, please contact us at support@afpugc.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

