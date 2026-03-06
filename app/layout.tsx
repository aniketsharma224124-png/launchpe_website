import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";

const serif = DM_Serif_Display({ subsets: ["latin"], variable: "--font-serif", weight: ["400"], style: ["normal","italic"] });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400","500","600","700"] });

export const metadata: Metadata = {
  title: "LaunchPe — Viral Launch Intelligence for Indian Founders",
  description: "Paste your URL. LaunchPe maps your audience across 40+ communities and writes every post, in your voice, at the right time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{
            style: { background: "#1c1917", color: "#f0ede8", borderRadius: "10px", fontSize: "14px" }
          }} />
        </Providers>
      </body>
    </html>
  );
}
