import './globals.css';
import { Cormorant_Garamond, Jost, Noto_Serif_JP } from 'next/font/google';
import localFont from 'next/font/local';

const cormorant = Cormorant_Garamond({
  subsets:  ['latin', 'cyrillic'],
  weight:   ['300', '400', '600'],
  style:    ['normal', 'italic'],
  variable: '--font-cormorant',
  display:  'swap',
});

const jost = Jost({
  subsets:  ['latin', 'cyrillic'],
  weight:   ['300', '400', '500'],
  variable: '--font-jost',
  display:  'swap',
});

const notoSerifJP = Noto_Serif_JP({
  subsets:  ['latin'],
  weight:   ['300', '400'],
  variable: '--font-noto',
  display:  'swap',
});

const arkhip = localFont({
  src:      './fonts/Arkhip.woff2',
  variable: '--font-arkhip',
  display:  'swap',
});

export const metadata = {
  title:       'Online Dojo — Дайто-рю Айкидзюдзюцу',
  description: 'Образовательная платформа для изучения Дайто-рю Айкидзюдзюцу',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:           true,
    statusBarStyle:    'black-translucent',
    title:             'Online Dojo',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       1,
  userScalable:       false,
  viewportFit:        'cover',
  themeColor:         '#f5f3ee',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${jost.variable} ${notoSerifJP.variable} ${arkhip.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
