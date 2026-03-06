import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Privacy Policy | LaunchPe',
    description: 'Privacy Policy for LaunchPe',
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#f0ede8] font-sans text-stone-900 flex flex-col">
            <header className="sticky top-0 z-40 bg-[#f0ede8]/92 backdrop-blur border-b border-stone-200">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center">
                    <Link href="/" className="font-serif text-xl text-stone-900 flex items-center gap-1.5">
                        <span className="w-6 h-6 bg-stone-900 text-white rounded flex items-center justify-center text-xs font-bold">L</span>
                        LaunchPe
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-3xl mx-auto px-6 py-12 md:py-20 w-full">
                <h1 className="font-serif text-4xl mb-8">Privacy Policy</h1>
                <div className="prose prose-stone">
                    <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
                    <p className="mb-4">
                        When you use LaunchPe, we collect information that you expressly provide to us, including your email address (via Google OAuth) and the URLs/product descriptions you submit for analysis.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
                    <p className="mb-4">
                        We use the information we collect to provide, maintain, and improve our services, including generating AI-powered analysis and content formats specific to your product. Your generation data is saved to your account to provide you with a persistent dashboard.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. Third-Party Integrations</h2>
                    <p className="mb-4">
                        We use Google for authentication and Razorpay for payment processing. We do not store your credit card information on our servers. We use Groq to process text for our AI generations; data sent to Groq is subject to their privacy policies.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Security</h2>
                    <p className="mb-4">
                        We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Contact Us</h2>
                    <p className="mb-4">
                        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:aniketsharma224124@gmail.com" className="text-blue-600 hover:underline">aniketsharma224124@gmail.com</a>.
                    </p>
                </div>
            </main>
        </div>
    );
}
