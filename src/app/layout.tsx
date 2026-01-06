import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GATI - Governance & Aadhaar Tracking Intelligence',
  description: 'India\'s Digital Nervous System - A national AI-driven platform for Aadhaar intelligence, monitoring, prediction, and field-level governance execution.',
  keywords: ['GATI', 'Aadhaar', 'UIDAI', 'Governance', 'India', 'Digital Identity', 'AI', 'Government'],
  authors: [{ name: 'GATI Platform' }],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gati-white">
        {children}
      </body>
    </html>
  )
}
