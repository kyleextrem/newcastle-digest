import type { Metadata } from 'next';
import './globals.css';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { ClientShell } from '@/components/ClientShell';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  newsMediaOrganizationJsonLd,
} from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | Newcastle Digest',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_OG_IMAGE],
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
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Fira+Mono&family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans-main antialiased bg-[#faf9f6] text-[#251f18]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(newsMediaOrganizationJsonLd) }}
        />
        <ClientShell>{children}</ClientShell>
        <GoogleAnalytics />
        <FacebookPixel />
      </body>
    </html>
  );
}
