import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Lineage 2 Epic Boss Radar — Pay2KILL Alliance',
  description: 'Тематический радар боссов Lineage 2 (UE5). Контроль спотов эпик-боссов, дежурство скаутов на точках и созыв Командного Канала при респауне.',
  openGraph: {
    title: 'Lineage 2 Epic Boss Radar — Pay2KILL Alliance',
    description: 'Тематический радар боссов Lineage 2 (UE5). Контроль спотов эпик-боссов, дежурство скаутов на точках и созыв Командного Канала при респауне.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lineage 2 Epic Boss Radar — Pay2KILL Alliance',
    description: 'Тематический радар боссов Lineage 2 (UE5). Контроль спотов эпик-боссов, дежурство скаутов на точках и созыв Командного Канала при респауне.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#090b0e',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#090b0e] text-slate-100 antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
