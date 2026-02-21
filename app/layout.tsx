import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ClientShell } from '@/components/ClientShell';

export const metadata: Metadata = {
  title: {
    default: 'Newcastle Digest | The best of Newcastle',
    template: '%s | Newcastle Digest',
  },
  description:
    'Food, events, openings, culture, and local finds — thoughtfully curated into one weekly email. Read by 7,000+ Newcastle locals.',
  openGraph: {
    title: 'Newcastle Digest | The best of Newcastle',
    description: 'The best of Newcastle, delivered directly to you. One weekly email.',
    type: 'website',
  },
  icons: {
    icon: [{ url: '/nd-logo.png', sizes: '32x32' }, { url: '/nd-logo.png', sizes: '16x16' }],
    apple: '/nd-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Instrument+Serif:ital@0;1&family=Fira+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans-main antialiased bg-[#faf9f6] text-[#251f18]">
        <ClientShell>{children}</ClientShell>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XK7000CZS7"
          strategy="afterInteractive"
        />
        <Script id="gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XK7000CZS7');
          `}
        </Script>
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '491977096926796');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=491977096926796&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
