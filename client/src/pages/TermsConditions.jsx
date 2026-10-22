import { Helmet } from 'react-helmet-async';

export default function TermsConditions() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions | BookNest</title>
        <meta name="description" content="BookNest Terms and Conditions - Terms of service for using our online bookstore." />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Terms & Conditions</h1>
            <p className="mt-4 text-lg text-gray-600">Last updated: October 2026</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-gray max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using BookNest, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use of Service</h2>
              <p className="text-gray-700 mb-4">You agree to use BookNest only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to gain unauthorized access to any portion of the service</li>
                <li>Transmit any viruses, worms, or malicious code</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-700 mb-4">To place orders, you must create an account. You agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Orders and Payment</h2>
              <p className="text-gray-700 mb-4">All orders are subject to acceptance and availability. Prices are in INR and include applicable taxes. Payment is processed by third-party providers (Stripe, etc.) — we do not store full payment details.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Shipping and Delivery</h2>
              <p className="text-gray-700 mb-4">We ship within India. Delivery times are estimates and may vary. Risk of loss passes to you upon delivery. We are not responsible for delays caused by carriers or force majeure events.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Returns and Refunds</h2>
              <p className="text-gray-700 mb-4">We accept returns within 14 days of delivery for unused items in original condition. Refunds are processed to the original payment method within 5-10 business days. Shipping costs are non-refundable unless the return is due to our error.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">All content on BookNest (text, graphics, logos, images, software) is our property or licensed to us. You may not reproduce, distribute, or create derivative works without written permission.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-4">The service is provided "as is" and "as available" without warranties of any kind, either express or implied, including merchantability, fitness for a particular purpose, and non-infringement.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">To the fullest extent permitted by law, BookNest shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-700 mb-4">These Terms shall be governed by the laws of India. Any disputes shall be resolved in the courts of Mumbai, Maharashtra.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">We may modify these Terms at any time. Changes are effective upon posting. Continued use constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700">Questions about these Terms? Contact us at <a href="mailto:legal@booknest.pagecraft.website" className="text-indigo-600 hover:underline">legal@booknest.pagecraft.website</a>.</p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}