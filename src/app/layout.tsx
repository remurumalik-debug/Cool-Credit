import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavigationShell from '@/components/NavigationShell';

export const metadata: Metadata = {
  title: 'CoolCredit — Refrigerant Recovery & Custody Platform',
  description:
    'Technician-centred refrigerant recovery and custody tracking platform for Nigeria. Montreal Protocol & Kigali Amendment compliance.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#010E2A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <NavigationShell>{children}</NavigationShell>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
