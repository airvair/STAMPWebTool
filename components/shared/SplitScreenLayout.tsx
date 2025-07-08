import React from 'react';

export interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftWidth?: 'sm' | 'md' | 'lg'; // 1/3, 2/5, 1/2
  rightWidth?: 'sm' | 'md' | 'lg'; // 2/3, 3/5, 1/2
  className?: string;
  minLeftWidth?: string;
  minRightWidth?: string;
  showDivider?: boolean;
}

const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  leftPanel,
  rightPanel,
  leftWidth = 'md',
  rightWidth = 'md',
  className = '',
  minLeftWidth = '300px',
  minRightWidth = '400px',
  showDivider = true
}) => {
  const leftWidthClasses = {
    sm: 'w-1/3',
    md: 'w-2/5', 
    lg: 'w-1/2'
  };
  
  const rightWidthClasses = {
    sm: 'w-2/3',
    md: 'w-3/5',
    lg: 'w-1/2'
  };

  return (
    <div className={`flex h-full gap-6 ${className}`}>
      <div 
        className={`${leftWidthClasses[leftWidth]} flex flex-col`}
        style={{ minWidth: minLeftWidth }}
      >
        {leftPanel}
      </div>
      
      {showDivider && (
        <div className="w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
      )}
      
      <div 
        className={`${rightWidthClasses[rightWidth]} flex flex-col`}
        style={{ minWidth: minRightWidth }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

export default SplitScreenLayout;