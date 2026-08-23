import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'CleanOps Admin Dashboard - Cleaning Ecosystem',
  description: 'Administrative Web Dashboard for professional cleaning services, field operations dispatching, SAC customer support, and Supabase integration.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
