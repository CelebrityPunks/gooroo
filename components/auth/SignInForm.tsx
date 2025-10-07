'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AUTH_ENABLED } from '../../lib/config';
import { createClient } from '../../lib/supabaseClient';
import { Button } from '../ui';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!AUTH_ENABLED) {
    return (
      <div className='space-y-4 text-center'>
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Demo mode active
          </h3>
          <p className='text-sm text-gray-600'>
            Email sign-in is disabled for this preview. Jump straight into the
            meditation lobby to try the guided experience.
          </p>
        </div>
        <Link
          href='/meditate'
          className='inline-flex justify-center rounded-lg bg-blue-600 px-5 py-2 text-base font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
        >
          Start a Session
        </Link>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
      const redirectOrigin = siteUrl
        ? siteUrl.replace(/\/$/, '')
        : window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${redirectOrigin}/auth/callback`,
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
