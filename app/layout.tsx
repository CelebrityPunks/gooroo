import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '../components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'AI Guru Meditation',
  description: 'A voice-first meditation app where users speak to an AI Guru who guides meditation in real time',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
