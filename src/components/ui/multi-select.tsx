import { X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  className,
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map(option => (
                <Badge
                  variant="secondary"
                  key={option.value}
                  className="mr-1"
                  onClick={e => {
                    e.stopPropagation();
                    handleRemove(option.value);
                  }}
                >
                  {option.label}
                  <X className="ml-1 h-3 w-3 cursor-pointer" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map(option => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <div
                  className={cn(
                    'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                    value.includes(option.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
