import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Traditions By Tiya | Royal Handcrafted Indian Ethnic Wear',
  description:
    'Discover authentic Banarasi silk sarees, zardozi lehengas, temple jewellery, and handcrafted Pashmina dupattas woven by generational Indian artisans.',
  keywords: [
    'Traditions By Tiya',
    'Banarasi Silk Sarees',
    'Handcrafted Kurtas',
    'Temple Jewellery',
    'Indian Ethnic Wear',
    'Zardozi Lehenga',
    'Heritage Handlooms',
  ],
  openGraph: {
    title: 'Traditions By Tiya - Royal Handcrafted Ethnic Couture',
    description: 'Timeless handloom weaves and generational royal Indian craftsmanship.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-cream-200 text-charcoal antialiased">
        <AuthProvider>
          <CartProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#7B1E3A',
                  color: '#FFF8EE',
                  border: '1px solid #C9A24B',
                  fontSize: '14px',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(123, 30, 58, 0.15)',
                },
                success: {
                  iconTheme: {
                    primary: '#C9A24B',
                    secondary: '#7B1E3A',
                  },
                },
              }}
            />
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
