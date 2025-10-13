'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const baseClasses =
    'rounded-3xl border border-white/15 bg-white/10 text-slate-100 shadow-xl backdrop-blur-xl transition-shadow duration-300';

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `${baseClasses} ${paddingClasses[padding]} ${className}`;

  return <div className={classes}>{children}</div>;
}
