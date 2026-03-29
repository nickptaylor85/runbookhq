import React from 'react';
import type { Metadata, Viewport } from 'next';
import React from 'react';
import Script from 'next/script';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050508',
};

export const metadata: Metadata = {
  title: 'Watchtower — AI-Powered SOC Dashboard',
  description: 'Single pane of glass for security operations. AI triage in 3.2s, 80+ tool integrations, autonomous response. Built for MSSPs and enterprise SOCs.',
  metadataBase: new URL('https://getwatchtower.io'),
  alternates: { canonical: 'https://getwatchtower.io' },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Watchtower — AI-Powered SOC Dashboard',
    description: 'Single pane of glass for security operations. AI triage in 3.2s, 80+ tool integrations, autonomous response. Built for MSSPs and enterprise SOCs.',
    url: 'https://getwatchtower.io',
    siteName: 'Watchtower',
    type: 'website',
    images: [{ url: 'https://getwatchtower.io/og-image.png', width: 1200, height: 630, alt: 'Watchtower SOC Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watchtower — AI-Powered SOC Dashboard',
    description: 'Single pane of glass for security operations. AI triage in 3.2s, 80+ tool integrations, autonomous response.',
    images: ['https://getwatchtower.io/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};


// Minimal GDPR/UK cookie consent banner — no external dependency
function CookieBanner() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('wt_cookie_consent')) {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  function accept() {
    localStorage.setItem('wt_cookie_consent', 'accepted');
    setShow(false);
  }
  function decline() {
    localStorage.setItem('wt_cookie_consent', 'declined');
    setShow(false);
    // Disable GA if loaded
    if (typeof window !== 'undefined') {
      (window as any)['ga-disable-' + (process.env.NEXT_PUBLIC_GA_ID || '')] = true;
    }
  }
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, padding: '12px 20px', background: '#0a0d14', borderTop: '1px solid #1d2535', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between', fontFamily: 'Inter,sans-serif' }}>
      <p style={{ fontSize: '0.78rem', color: '#8a9ab0', lineHeight: 1.6, margin: 0, flex: 1, minWidth: 240 }}>
        We use analytics cookies (Google Analytics, LinkedIn Insight Tag) to understand how visitors use the site.{' '}
        <a href="/privacy" style={{ color: '#4f8fff', textDecoration: 'none' }}>Privacy policy</a>
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline} style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid #263044', background: 'transparent', color: '#6b7a94', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>Decline</button>
        <button onClick={accept} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#4f8fff', color: '#fff', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 700 }}>Accept cookies</button>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
  const LI_ID = process.env.NEXT_PUBLIC_LINKEDIN_ID || '';
  return (
    <>
      {children}
      <CookieBanner />
      {/* Google Analytics / GTM — set NEXT_PUBLIC_GA_ID in Vercel env vars */}
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}</Script>
        </>
      )}
      {/* LinkedIn Insight Tag — set NEXT_PUBLIC_LINKEDIN_ID in Vercel env vars */}
      {LI_ID && (
        <Script id="li-init" strategy="afterInteractive">{`
          _linkedin_partner_id = "${LI_ID}";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
          var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");
          b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
          s.parentNode.insertBefore(b,s);})(window.lintrk);
        `}</Script>
      )}
    </>
  );
}
