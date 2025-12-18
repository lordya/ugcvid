export const metadata = {
  title: 'Privacy Policy | AFP UGC',
  description: 'Privacy Policy for AFP UGC platform',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We collect information that you provide directly to us and information that is automatically collected when you use our Service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong>Payment Information:</strong> Processed through secure third-party payment providers (we do not store full payment details)</li>
              <li><strong>Usage Data:</strong> Information about how you use the Service, including videos generated, credits used, and interaction patterns</li>
              <li><strong>Product Information:</strong> Product URLs, descriptions, and images you provide for video generation</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and access logs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process payments and manage your account</li>
              <li>Generate videos based on your product information</li>
              <li>Communicate with you about your account, service updates, and support requests</li>
              <li>Analyze usage patterns to improve service quality and user experience</li>
              <li>Detect and prevent fraud, abuse, and security issues</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Storage & Security</h2>
            <p className="leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data is encrypted in transit using SSL/TLS protocols</li>
              <li>Sensitive information is encrypted at rest</li>
              <li>Access to personal data is restricted to authorized personnel only</li>
              <li>We use secure cloud infrastructure providers with industry-standard security practices</li>
              <li>Regular security audits and updates are performed</li>
            </ul>
            <p className="leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Cookies & Tracking Technologies</h2>
            <p className="leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze service usage and performance</li>
              <li>Provide personalized content and features</li>
            </ul>
            <p className="leading-relaxed mt-4">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="leading-relaxed mb-4">
              We use third-party services that may collect or process your information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processors:</strong> Lemon Squeezy and Cryptomus for payment processing</li>
              <li><strong>Authentication:</strong> Supabase for user authentication and database services</li>
              <li><strong>AI Services:</strong> OpenAI and Kie.ai for video generation and script creation</li>
              <li><strong>Analytics:</strong> We may use analytics services to understand service usage</li>
            </ul>
            <p className="leading-relaxed mt-4">
              These third parties have their own privacy policies. We encourage you to review their policies to understand how they handle your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy. Account information and generated videos are retained until you delete your account. We may retain certain information for longer periods as required by law or for legitimate business purposes such as fraud prevention.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p className="leading-relaxed mt-4">
              To exercise these rights, please contact us at support@afpugc.com. We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Children&apos;s Privacy</h2>
            <p className="leading-relaxed">
              Our Service is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. International Data Transfers</h2>
            <p className="leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using the Service, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="leading-relaxed mt-4">
              <strong>Email:</strong> support@afpugc.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

