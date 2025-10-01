'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { Button } from '../ui';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setIsSubmitted(true);
        setMessage('Check your email for the magic link!');
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className='text-center'>
        <div className='text-green-600 mb-4'>
          <svg
            className='w-16 h-16 mx-auto mb-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 13l4 4L19 7'
            />
          </svg>
          <h3 className='text-lg font-semibold'>Check Your Email</h3>
        </div>
        <p className='text-gray-600 mb-4'>
          We’ve sent a magic link to <strong>{email}</strong>
        </p>
        <p className='text-sm text-gray-500 mb-4'>
          Click the link in your email to sign in. You can close this window.
        </p>
        <Button
          variant='outline'
          onClick={() => {
            setIsSubmitted(false);
            setEmail('');
            setMessage('');
          }}
        >
          Try Different Email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignIn} className='space-y-4'>
      <div>
        <label
          htmlFor='email'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Email Address
        </label>
        <input
          id='email'
          type='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          placeholder='Enter your email'
        />
      </div>

      <Button type='submit' className='w-full' disabled={isLoading || !email}>
        {isLoading ? 'Sending...' : 'Send Magic Link'}
      </Button>

      {message && (
        <div
          className={`text-sm text-center ${
            message.includes('Error') ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
