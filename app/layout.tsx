import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'LUXE Store — Premium E-Commerce',
  description:
    'Discover premium products for the modern lifestyle. Shop curated electronics, accessories, and fashion with free shipping on orders over $100.',
  keywords: 'e-commerce, premium, electronics, accessories, fashion, online shopping',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <Header />
            <main style={{ minHeight: '100vh', paddingTop: 'var(--header-height)' }}>
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
