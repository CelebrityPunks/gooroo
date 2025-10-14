import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '../components/auth/AuthProvider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'AI Guru Meditation',
  description:
    'A voice-first meditation app where users speak to an AI Guru who guides meditation in real time',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='app-body font-sans antialiased'>
        <AuthProvider>
          <main className='app-shell'>
            <div className='app-shell__content'>{children}</div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
