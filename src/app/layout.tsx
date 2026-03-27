import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watchtower — SOC Dashboard',
  description: 'Single pane of glass for security operations. AI-powered triage, unified alerts, automated runbooks.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
