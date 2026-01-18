import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import UnicornBackground from './UnicornBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vanish - Decentralized Git Storage',
  description: 'Store your code permanently on the decentralized web',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UnicornBackground />

        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg text-white">
              Vanish
            </Link>
            <div className="flex items-center gap-8">
              <Link href="/docs" className="nav-link text-sm text-white/70 hover:text-white transition-colors">
                Docs
              </Link>
              <a
                href="https://github.com/getvanish/vanish"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link text-sm text-white/70 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </nav>
        <main className="pt-14 relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}
