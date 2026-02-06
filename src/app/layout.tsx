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
    default: "Muslim Salah App",
    template: "%s | Muslim Salah",
  },
  description: "Accurate prayer times, Qibla direction, and Quran reader for Muslims worldwide.",
  keywords: ["prayer times", "salah", "namaz", "qibla", "quran", "islamic app", "muslim"],
  authors: [{ name: "Muslim Salah" }],
  creator: "Muslim Salah",
  metadataBase: new URL("https://muslimsalah.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_SA",
    title: "Muslim Salah App",
    description: "Accurate prayer times, Qibla direction, and Quran reader for Muslims worldwide.",
    siteName: "Muslim Salah",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muslim Salah App",
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
        {/* Arabic Fonts for Quran */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Scheherazade+New:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
