import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NEXUS E-Commerce | Premium Retail Store',
  description: 'Enterprise production-ready e-commerce catalog application built with Next.js 15, NestJS and Prisma.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
