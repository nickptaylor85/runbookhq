import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Watchtower — AI-Powered SOC Dashboard',
  description: 'Single pane of glass for security operations. AI triage in 3.2s, 18 tool integrations, autonomous response. Built for MSSPs and enterprise SOCs.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Watchtower — AI-Powered SOC Dashboard',
    description: 'Single pane of glass for security operations. AI triage in 3.2s, 18 tool integrations, autonomous response. Built for MSSPs and enterprise SOCs.',
    url: 'https://getwatchtower.io',
    siteName: 'Watchtower',
    type: 'website',
    images: [
      {
        url: 'https://getwatchtower.io/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Watchtower SOC Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watchtower — AI-Powered SOC Dashboard',
    description: 'Single pane of glass for security operations. AI triage in 3.2s, 18 tool integrations, autonomous response.',
    images: ['https://getwatchtower.io/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  metadataBase: new URL('https://getwatchtower.io'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
