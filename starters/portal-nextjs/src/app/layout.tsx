import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal — Powered by DXP',
  description: 'Enterprise portal built with the DXP delivery accelerator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
