import './globals.css';
import { Cormorant_Garamond, Noto_Serif_JP, JetBrains_Mono } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets:  ['latin', 'cyrillic'],
  weight:   ['300', '400'],
  style:    ['normal', 'italic'],
  variable: '--font-cormorant',
  display:  'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin', 'cyrillic'],
  weight:   ['400'],
  variable: '--font-mono',
  display:  'swap',
});

const notoSerifJP = Noto_Serif_JP({
  subsets:  ['latin'],
  weight:   ['400'],
  variable: '--font-noto',
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
  themeColor:         '#e6e0d2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${jetbrainsMono.variable} ${notoSerifJP.variable}`}>
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
