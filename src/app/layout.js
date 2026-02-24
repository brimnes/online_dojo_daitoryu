import './globals.css';
import { Cormorant_Garamond, Jost, Noto_Serif_JP } from 'next/font/google';

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

export const metadata = {
  title:       'Online Dojo — Дайто-рю Айкидзюдзюцу',
  description: 'Образовательная платформа для изучения Дайто-рю Айкидзюдзюцу',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${jost.variable} ${notoSerifJP.variable}`}>
      <body>{children}</body>
    </html>
  );
}
