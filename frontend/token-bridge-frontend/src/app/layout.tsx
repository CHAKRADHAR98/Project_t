import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { SolanaProvider } from '@/contexts/SolanaContext'
import { Layout } from '@/components/Layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Token Bridge - Trade Token2022 on Any AMM',
  description: 'Bridge Token2022 tokens with Transfer Hooks to make them tradeable on all Solana AMMs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <SolanaProvider>
            <Layout>
              {children}
            </Layout>
          </SolanaProvider>
        </WalletProvider>
      </body>
    </html>
  )
}