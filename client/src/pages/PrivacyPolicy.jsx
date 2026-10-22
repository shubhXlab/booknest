import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | BookNest</title>
        <meta name="description" content="BookNest Privacy Policy - How we collect, use, and protect your personal information." />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-lg text-gray-600">Last updated: October 2026</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-gray max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Account information: name, email address, password (hashed)</li>
                <li>Order information: shipping address, payment details (processed by payment provider)</li>
                <li>Communication preferences</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Process and fulfill orders</li>
                <li>Manage your account</li>
                <li>Send order confirmations and updates</li>
                <li>Improve our services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-700 mb-4">We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Payment processors (Stripe, etc.) for transaction processing</li>
                <li>Shipping carriers for delivery</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Request correction or deletion</li>
                <li>Object to processing</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
              <p className="text-gray-700 mb-4">We use essential cookies for authentication and cart functionality. We do not use tracking or advertising cookies.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="text-gray-700">If you have questions about this Privacy Policy, contact us at <a href="mailto:privacy@booknest.pagecraft.website" className="text-indigo-600 hover:underline">privacy@booknest.pagecraft.website</a>.</p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}