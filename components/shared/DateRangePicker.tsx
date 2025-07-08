/**
 * Date Range Picker Component
 * Allows selection of date ranges for filtering analytics data
 */

import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface DateRangePickerProps {
  value?: {
    startDate: Date;
    endDate: Date;
  };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
  presets?: boolean;
  className?: string;
}

interface DatePreset {
  label: string;
  getValue: () => { startDate: Date; endDate: Date };
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  presets = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState(value || {
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const datePresets: DatePreset[] = [
    {
      label: 'Today',
      getValue: () => ({
        startDate: new Date(),
        endDate: new Date()
      })
    },
    {
      label: 'Yesterday',
      getValue: () => ({
        startDate: subDays(new Date(), 1),
        endDate: subDays(new Date(), 1)
      })
    },
    {
      label: 'Last 7 days',
      getValue: () => ({
        startDate: subDays(new Date(), 7),
        endDate: new Date()
      })
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        startDate: subDays(new Date(), 30),
        endDate: new Date()
      })
    },
    {
      label: 'This week',
      getValue: () => ({
        startDate: startOfWeek(new Date()),
        endDate: endOfWeek(new Date())
      })
    },
    {
      label: 'This month',
      getValue: () => ({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
      })
    },
    {
      label: 'Last month',
      getValue: () => {
        const lastMonth = subDays(startOfMonth(new Date()), 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth)
        };
      }
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: DatePreset) => {
    const range = preset.getValue();
    setTempRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    const range = value || tempRange;
    return `${format(range.startDate, 'MMM d, yyyy')} - ${format(range.endDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <CalendarIcon className="w-5 h-5 text-slate-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {formatDateRange()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
          <div className="p-4 space-y-4">
            {presets && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Quick Select
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {datePresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset)}
                        className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700" />
              </>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={format(tempRange.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setTempRange({
                    ...tempRange,
                    startDate: new Date(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={format(tempRange.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setTempRange({
                    ...tempRange,
                    endDate: new Date(e.target.value)
                  })}
                  min={format(tempRange.startDate, 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;