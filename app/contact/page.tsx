import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Contact Us | LaunchPe',
    description: 'Get in touch with LaunchPe',
};

export default function ContactUs() {
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
                <h1 className="font-serif text-4xl mb-4">Contact Us</h1>
                <p className="text-stone-500 mb-8 max-w-lg">
                    Have a question about LaunchPe, need help with your launch strategy, or want to discuss a custom plan? We'd love to hear from you.
                </p>

                <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">How to Reach Us</h2>
                    <div className="space-y-6">

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-stone-900 mb-1">Email Support</h3>
                                <p className="text-sm text-stone-500 mb-2">For general inquiries, support, and billing questions.</p>
                                <a href="mailto:aniketsharma224124@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">aniketsharma224124@gmail.com</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-stone-900 mb-1">Response Time</h3>
                                <p className="text-sm text-stone-500">We aim to respond to all inquiries within 24-48 hours during business days.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
