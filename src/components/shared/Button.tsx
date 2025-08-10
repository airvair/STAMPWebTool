import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-sky-500 transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm';

  // Always-dark styles
  const variantStyles = {
    primary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300',
    secondary:
      'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 active:bg-neutral-600',
    danger:
      'bg-red-900/50 text-red-300 border border-red-800/80 hover:bg-red-900/80 active:bg-red-900',
    ghost:
      'bg-transparent text-slate-400 hover:bg-neutral-800 hover:text-slate-200 active:bg-neutral-700 shadow-none',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2 text-base',
    lg: 'px-7 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="-mr-1 ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
