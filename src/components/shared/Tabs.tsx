/**
 * Tabs Component
 * Reusable tabbed interface component
 */

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  children,
  className = '',
  variant = 'default',
  size = 'md'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const getTabStyles = () => {
    const baseStyles = 'font-medium transition-all focus:outline-none';
    
    const sizeStyles = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-5 py-2.5'
    };

    const variantStyles = {
      default: {
        tab: 'border-b-2 border-transparent hover:text-slate-700 dark:hover:text-slate-200',
        activeTab: 'border-blue-500 text-blue-600 dark:text-blue-400',
        inactiveTab: 'text-slate-600 dark:text-slate-400'
      },
      pills: {
        tab: 'rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
        activeTab: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        inactiveTab: 'text-slate-600 dark:text-slate-400'
      },
      underline: {
        tab: 'border-b-2 border-transparent',
        activeTab: 'border-slate-800 dark:border-slate-100 text-slate-800 dark:text-slate-100',
        inactiveTab: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }
    };

    return {
      base: `${baseStyles} ${sizeStyles[size]}`,
      variant: variantStyles[variant]
    };
  };

  const styles = getTabStyles();

  return (
    <div className={className}>
      {/* Tab List */}
      <div
        className={`flex items-center ${
          variant === 'default' || variant === 'underline'
            ? 'border-b border-slate-200 dark:border-slate-700'
            : 'gap-2'
        }`}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={`
              ${styles.base}
              ${styles.variant.tab}
              ${activeTab === tab.id ? styles.variant.activeTab : styles.variant.inactiveTab}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${variant === 'default' || variant === 'underline' ? '-mb-px' : ''}
            `}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full
                    ${activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }
                    text-xs font-medium
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={tab.id}
            hidden={activeTab !== tab.id}
          >
            {activeTab === tab.id && children(activeTab)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;