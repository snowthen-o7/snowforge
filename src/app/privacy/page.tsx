import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingHeader />
      <div className="mx-auto w-full max-w-4xl flex-1 py-16 px-4 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: January 2025</p>
      </header>

      <div className="prose prose-lg max-w-none space-y-8">
        <p className="text-foreground/80 leading-relaxed text-lg">
          At SnowForge, we are committed to protecting your privacy and ensuring the security of your personal
          information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you use our suite of developer tools and services.
        </p>

        {/* Information We Collect */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Account Information</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            When you create an account, we collect:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Name and email address</li>
            <li>Username and password (stored securely using encryption)</li>
            <li>Profile information you choose to provide</li>
            <li>Billing information and payment details (processed by secure third-party payment processors)</li>
            <li>Communication preferences</li>
          </ul>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Service-Specific Data</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Depending on which SnowForge tools you use, we may collect:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Social media account identifiers and profile information from connected platforms</li>
            <li>Access tokens required to interact with third-party services on your behalf</li>
            <li>Web scraping configurations, schedules, and collected data</li>
            <li>Content generation inputs, prompts, and generated outputs</li>
            <li>Analytics data and performance metrics</li>
            <li>Platform-specific settings and preferences</li>
          </ul>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Usage Data</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            We automatically collect information about how you use our Service:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Device information (browser type, operating system, device identifiers)</li>
            <li>IP address and approximate location</li>
            <li>Pages visited and features used</li>
            <li>Time spent on the platform</li>
            <li>Referral sources and exit pages</li>
            <li>Error logs and performance data</li>
          </ul>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">AI-Generated Content</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            When you use AI features across our tools, we collect:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Prompts and inputs you provide to our AI tools</li>
            <li>Generated content (text, images, audio)</li>
            <li>Content preferences and generation settings</li>
            <li>Feedback and ratings on generated content</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li><strong>Provide and maintain our Service:</strong> To deliver the features and functionality you request</li>
            <li><strong>Process transactions:</strong> To handle billing, payments, and subscription management</li>
            <li><strong>Improve our Service:</strong> To analyze usage patterns and enhance user experience</li>
            <li><strong>Personalization:</strong> To customize content recommendations and outputs</li>
            <li><strong>Communication:</strong> To send service updates, security alerts, and marketing communications (with your consent)</li>
            <li><strong>Customer support:</strong> To respond to inquiries and resolve issues</li>
            <li><strong>Security:</strong> To detect, prevent, and address fraud, abuse, and security threats</li>
            <li><strong>Legal compliance:</strong> To comply with applicable laws and regulations</li>
            <li><strong>Service improvement:</strong> To enhance the quality and accuracy of our tools and features (with appropriate safeguards)</li>
          </ul>
        </section>

        {/* Third-Party Services */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">3. Third-Party Services</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            We work with trusted third-party service providers to deliver our Service. These include:
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Social Media Platforms</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Some of our tools integrate with the following platforms, each with their own privacy policies:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>TikTok</li>
            <li>Instagram (Meta)</li>
            <li>Facebook (Meta)</li>
            <li>YouTube (Google)</li>
            <li>LinkedIn</li>
            <li>X (formerly Twitter)</li>
            <li>Reddit</li>
          </ul>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">AI Service Providers</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Our AI features are powered by industry-leading providers:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li><strong>OpenAI:</strong> For text generation and language processing</li>
            <li><strong>Google:</strong> For various AI and machine learning capabilities</li>
            <li>Other AI providers as needed to deliver specific features</li>
          </ul>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Text-to-Speech Providers</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Our voice synthesis features utilize:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li><strong>ElevenLabs:</strong> For high-quality voice generation and text-to-speech conversion</li>
            <li>Other TTS providers as needed for different voice options</li>
          </ul>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Cloud Infrastructure</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Our services are hosted on secure cloud infrastructure providers that maintain appropriate security and privacy standards.
          </p>

          <p className="text-foreground/80 leading-relaxed">
            We carefully select third-party providers that maintain appropriate security and privacy standards.
            However, we encourage you to review the privacy policies of these services.
          </p>
        </section>

        {/* Data Storage and Security */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Storage and Security</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            We implement industry-standard security measures to protect your information:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Encryption of data in transit (TLS/SSL) and at rest</li>
            <li>Secure authentication mechanisms and password hashing</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls limiting employee access to personal data</li>
            <li>Secure cloud infrastructure with leading providers</li>
            <li>Regular backups with encryption</li>
          </ul>
          <p className="text-foreground/80 leading-relaxed">
            While we strive to protect your information, no method of transmission over the Internet or electronic
            storage is 100% secure. We cannot guarantee absolute security, but we continuously work to improve our
            security practices.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            We retain your information for as long as necessary to:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Provide our Service and maintain your account</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce our agreements</li>
            <li>Improve our Service and develop new features</li>
          </ul>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Specific retention periods:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li><strong>Account data:</strong> Retained while your account is active, plus 30 days after deletion request</li>
            <li><strong>Generated content:</strong> Retained until you delete it or close your account</li>
            <li><strong>Usage logs:</strong> Retained for up to 12 months for analytics and security purposes</li>
            <li><strong>Financial records:</strong> Retained for 7 years as required by law</li>
          </ul>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Right to Access</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            You can request a copy of the personal information we hold about you. We will provide this information
            in a structured, commonly used, and machine-readable format.
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Right to Correction</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            You can update or correct inaccurate personal information through your account settings or by contacting
            us directly.
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Right to Deletion</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            You can request deletion of your personal information. We will delete your data unless we are legally
            required to retain it or need it for legitimate business purposes.
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Additional Rights</h3>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Right to restrict processing of your data</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent at any time</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>
          <p className="text-foreground/80 leading-relaxed">
            To exercise any of these rights, please contact us at alexitofrancis@gmail.com.
          </p>
        </section>

        {/* Cookies and Tracking */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies and Tracking</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            We use cookies and similar tracking technologies to enhance your experience:
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Essential Cookies</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Required for basic functionality, including authentication, security, and session management.
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Analytics Cookies</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Help us understand how visitors interact with our Service to improve functionality and user experience.
          </p>

          <h3 className="text-xl font-medium text-foreground/90 mt-6 mb-3">Preference Cookies</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Remember your settings and preferences for a personalized experience.
          </p>

          <p className="text-foreground/80 leading-relaxed">
            You can manage cookie preferences through your browser settings. Note that disabling certain cookies
            may affect the functionality of our Service.
          </p>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">8. Children&apos;s Privacy</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Our Service is not intended for children under the age of 18. We do not knowingly collect personal
            information from children. If you are a parent or guardian and believe your child has provided us
            with personal information, please contact us immediately.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            If we discover that we have collected personal information from a child under 18, we will take steps
            to delete that information as quickly as possible.
          </p>
        </section>

        {/* International Data Transfers */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Your information may be transferred to and processed in countries other than your country of residence.
            These countries may have different data protection laws.
          </p>
          <p className="text-foreground/80 leading-relaxed mb-4">
            When we transfer data internationally, we implement appropriate safeguards:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>Standard contractual clauses approved by relevant authorities</li>
            <li>Data processing agreements with our service providers</li>
            <li>Compliance with applicable data protection frameworks</li>
          </ul>
          <p className="text-foreground/80 leading-relaxed">
            By using our Service, you consent to the transfer of your information to countries outside your
            country of residence.
          </p>
        </section>

        {/* Changes to Policy */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to This Privacy Policy</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal,
            operational, or regulatory reasons. When we make changes:
          </p>
          <ul className="list-disc pl-6 text-foreground/80 space-y-2 mb-4">
            <li>We will update the &ldquo;Last updated&rdquo; date at the top of this page</li>
            <li>For material changes, we will notify you via email or prominent notice on our Service</li>
            <li>We will provide the previous version for comparison when possible</li>
          </ul>
          <p className="text-foreground/80 leading-relaxed">
            We encourage you to review this Privacy Policy periodically. Your continued use of the Service after
            changes are posted constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Us</h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact our Privacy Team:
          </p>
          <div className="bg-surface p-6 rounded-lg">
            <p className="text-foreground/80 mb-2">
              <strong>Email:</strong>{' '}
              <a href="mailto:alexitofrancis@gmail.com" className="text-accent hover:text-accent/80 underline">
                alexitofrancis@gmail.com
              </a>
            </p>
            <p className="text-foreground/80">
              <strong>Response Time:</strong> We aim to respond to all privacy-related inquiries within 30 days.
            </p>
          </div>
          <p className="text-foreground/80 leading-relaxed mt-4">
            For general support inquiries, please contact{' '}
            <a href="mailto:alexitofrancis@gmail.com" className="text-accent hover:text-accent/80 underline">
              alexitofrancis@gmail.com
            </a>.
          </p>
        </section>
      </div>
      </div>
      <LandingFooter />
    </main>
  );
}
