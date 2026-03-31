import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wowcado',
  description: 'Internal ERP platform for Wowcado operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
