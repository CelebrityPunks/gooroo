import React from 'react';
import { Card } from '../../components/ui';
import { SignInForm } from '../../components/auth/SignInForm';

export default function MarketingPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-24'>
      <div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm'>
        <h1 className='text-4xl font-bold text-center mb-8'>
          AI Guru Meditation
        </h1>
        <p className='text-center text-lg text-gray-600 mb-8'>
          A voice-first meditation app where users speak to an AI Guru who
          guides meditation in real time
        </p>

        <Card className='max-w-md mx-auto'>
          <h2 className='text-xl font-semibold mb-4 text-center'>
            Get Started
          </h2>
          <SignInForm />
        </Card>
      </div>
    </div>
  );
}
