import type { Metadata } from 'next'
import './globals.css'
import { AuthProviderWrapper } from '@/components/auth/AuthProviderWrapper'
import { Toaster } from '@/components/ui/Toast'
import dynamic from 'next/dynamic'

// FloatingChat uses usePathname — must be client-only, no SSR
const FloatingChat = dynamic(
  () => import('@/components/ui/FloatingChat').then(m => ({ default: m.FloatingChat })),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'GATI - Governance & Aadhaar Tracking Intelligence',
  description: "India's Digital Nervous System — AI-driven platform for Aadhaar intelligence, monitoring, prediction, and field-level governance.",
  keywords: ['GATI', 'Aadhaar', 'UIDAI', 'Governance', 'India', 'Digital Identity', 'AI'],
  authors: [{ name: 'GATI Platform' }],
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        <AuthProviderWrapper>
          {children}
          <FloatingChat />
          <Toaster position="top-right" richColors closeButton />
        </AuthProviderWrapper>
      </body>
    </html>
  )
}
