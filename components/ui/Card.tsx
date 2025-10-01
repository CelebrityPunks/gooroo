'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 shadow-sm';

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `${baseClasses} ${paddingClasses[padding]} ${className}`;

  return <div className={classes}>{children}</div>;
}
