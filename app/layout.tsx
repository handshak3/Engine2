import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Engine - Hybrid Athlete OS',
  description: 'Piattaforma avanzata per atleti ibridi: workout tracking, meal planning, dispensa intelligente, intervals.icu sync, coach AI severo e calcolatori sportivi.',
  openGraph: {
    title: 'Engine - Hybrid Athlete OS',
    description: 'Piattaforma avanzata per atleti ibridi: workout tracking, meal planning, dispensa intelligente, intervals.icu sync, coach AI severo e calcolatori sportivi.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Engine - Hybrid Athlete OS',
    description: 'Piattaforma avanzata per atleti ibridi: workout tracking, meal planning, dispensa intelligente, intervals.icu sync, coach AI severo e calcolatori sportivi.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
