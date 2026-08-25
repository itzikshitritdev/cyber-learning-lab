import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cyber-learning-lab.xyxy60.chatgpt.site'),
  title: {
    default: 'Cyber Learning Lab',
    template: '%s | Cyber Learning Lab',
  },
  description:
    'Interactive cybersecurity foundations, starting with bits, bytes, binary, decimal, and hexadecimal.',
  openGraph: {
    title: 'How Computers See Information | Cyber Learning Lab',
    description: 'Learn bits, bytes, binary, decimal, and hexadecimal through an interactive lesson.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Cyber Learning Lab — How Computers See Information' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Computers See Information | Cyber Learning Lab',
    description: 'Learn bits, bytes, binary, decimal, and hexadecimal through an interactive lesson.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
