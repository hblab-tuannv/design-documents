import type { ReactNode } from 'react'

// Dedicated root layout for the `/` redirect page (Next.js allows
// multiple root layouts via route groups when there is no shared app/layout.tsx)
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang='vi'>
      <body>{children}</body>
    </html>
  )
}
