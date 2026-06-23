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
  title:       'Online Daito-ryu Dojo — Дайто-рю Айкидзюдзюцу',
  description: 'Цифровое додзё Дайто-рю Айкидзюдзюцу: видеоуроки, база техник, ежемесячные выпуски и архив знаний. Обучение для учеников и исследователей японских боевых искусств.',
  keywords:    'Дайто-рю, Дайто-рю Айкидзюдзюцу, Daito-ryu, боевые искусства, айки, Станислав Копин, онлайн додзё, иккаджо, техники, обучение',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:           true,
    statusBarStyle:    'black-translucent',
    title:             'Online Dojo',
    startupImage:      '/icons/icon-512.png',
  },
  other: {
    'mobile-web-app-capable':            'yes',
    'apple-mobile-web-app-capable':      'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title':        'Online Dojo',
    'msapplication-TileColor':           '#e6e0d2',
    'msapplication-TileImage':           '/icons/icon-192.png',
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
    <html lang="ru" className={`${cormorant.variable} ${jetbrainsMono.variable} ${notoSerifJP.variable}`} style={{ background: '#e6e0d2' }}>
      <head>
        {/* iOS home screen icon — Safari uses the largest apple-touch-icon it finds */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body style={{ background: '#e6e0d2' }}>
        {children}
      </body>
    </html>
  );
}
