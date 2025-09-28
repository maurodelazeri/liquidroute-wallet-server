import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LiquidRoute',
  description: 'Secure passkey wallet for Solana',
}

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ background: 'transparent' }}>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body style={{ 
        margin: 0, 
        background: 'transparent',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>
        {children}
      </body>
    </html>
  )
}