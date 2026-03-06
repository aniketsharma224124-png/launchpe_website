import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Terms of Service | LaunchPe',
    description: 'Terms of Service for LaunchPe',
};

export default function TermsOfService() {
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
                <h1 className="font-serif text-4xl mb-8">Terms of Service</h1>
                <div className="prose prose-stone">
                    <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p className="mb-4">
                        By accessing and using LaunchPe, you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
                    <p className="mb-4">
                        LaunchPe provides an AI-powered launch readiness and distribution strategy mapping tool. You can use the tool to generate and manage custom marketing plans, social posts, and community targeting lists.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. Account Integrity & Free Tier</h2>
                    <p className="mb-4">
                        The free version of LaunchPe is intended for initial evaluation. LaunchPe reserves the right to modify, restrict, or limit free-tier access at its sole discretion. Exploiting multiple accounts to bypass limits may result in account termination.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Content Ownership</h2>
                    <p className="mb-4">
                        You retain ownership of the URLs and descriptions you submit. You are granted a non-exclusive license to use the generated output (posts, actionable insights, distribution strategies) for your business.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
                    <p className="mb-4">
                        LaunchPe makes no guarantees regarding the traffic, business growth, or ROI resulting from the use of its launch templates or generated copy. LaunchPe is provided "as is" and we are not liable for any direct or indirect damages resulting from the use of the platform.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">6. Contact Us</h2>
                    <p className="mb-4">
                        For support or questions regarding these terms, please contact us at <a href="mailto:aniketsharma224124@gmail.com" className="text-blue-600 hover:underline">aniketsharma224124@gmail.com</a>.
                    </p>
                </div>
            </main>
        </div>
    );
}
