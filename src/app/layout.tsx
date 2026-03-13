import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelGrab — Image Color Palette Extractor",
  description: "Extract dominant colors from any image and export them as CSS variables, JSON tokens, or a Tailwind config. Built for designers and developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="border-b border-white/[0.06] px-6 py-4">
            <div className="max-w-5xl mx-auto w-full flex items-center">
              <Link href="/" className="flex items-center group">
                <span className="text-lg font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                  PixelGrab
                </span>
              </Link>
            </div>
          </header>
          <main className="flex-1 flex flex-col px-4 py-6 sm:p-6 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
