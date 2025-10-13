'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses =
    'font-medium rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 backdrop-blur-sm';

  const variantClasses = {
    primary:
      'bg-sky-500/90 text-white hover:bg-sky-400/90 focus:ring-sky-300/60 focus-visible:ring-sky-200/50',
    secondary:
      'bg-white/15 text-white hover:bg-white/25 focus:ring-slate-200/40 focus-visible:ring-slate-100/30',
    outline:
      'border border-white/35 text-white hover:bg-white/15 focus:ring-slate-200/35 focus-visible:ring-slate-100/25',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
