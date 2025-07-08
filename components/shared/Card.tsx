/**
 * Card Component
 * Reusable card container with consistent styling
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'bordered':
        return 'border border-slate-200 dark:border-slate-700';
      case 'elevated':
        return 'shadow-lg';
      default:
        return 'shadow-sm';
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-8';
      default:
        return 'p-6';
    }
  };

  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-lg
        ${getVariantClasses()}
        ${getPaddingClasses()}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;