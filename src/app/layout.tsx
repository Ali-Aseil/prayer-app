import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { BottomNav } from "@/components/layout/bottom-nav"
import { LanguageProvider } from "@/contexts/language-context"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Prayer Times - Islamic Prayer App",
    template: "%s | Prayer Times",
  },
  description: "Accurate prayer times, Qibla direction, and Quran reader for Muslims worldwide.",
  keywords: ["prayer times", "salah", "namaz", "qibla", "quran", "islamic app", "muslim"],
  authors: [{ name: "Prayer App" }],
  creator: "Prayer App",
  metadataBase: new URL("https://prayer-app.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_SA",
    title: "Prayer Times - Islamic Prayer App",
    description: "Accurate prayer times, Qibla direction, and Quran reader for Muslims worldwide.",
    siteName: "Prayer Times",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prayer Times - Islamic Prayer App",
    description: "Accurate prayer times, Qibla direction, and Quran reader for Muslims worldwide.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#22c55e" },
    { media: "(prefers-color-scheme: dark)", color: "#16a34a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem("prayer-app-settings")||"{}");var t=s.theme||"system";if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <LanguageProvider>
          {/* Skip Link for Accessibility */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>

          {/* Main Content */}
          <main id="main-content" className="pb-20">
            {children}
          </main>

          {/* Bottom Navigation */}
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  )
}
