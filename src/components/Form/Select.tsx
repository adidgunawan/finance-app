import * as React from 'react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

export function Select({
  label,
  options,
  error,
  placeholder,
  value,
  onChange,
  disabled,
  className,
  description,
  required,
}: SelectProps) {
  const handleValueChange = (newValue: string) => {
    if (onChange) {
      // Create a synthetic event-like object for backward compatibility
      const syntheticEvent = {
        target: { value: newValue },
        currentTarget: { value: newValue },
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        nativeEvent: {} as Event,
        preventDefault: () => {},
        isDefaultPrevented: () => false,
        stopPropagation: () => {},
        isPropagationStopped: () => false,
        persist: () => {},
        timeStamp: Date.now(),
        type: 'change',
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <FormField label={label} error={error} description={description} required={required}>
      <ShadcnSelect value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            error && 'border-destructive focus:ring-destructive',
            className
          )}
        >
          <SelectValue placeholder={placeholder || 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((option) => option.value !== '') // Filter out empty string values (not allowed by Radix UI)
            .map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
        </SelectContent>
      </ShadcnSelect>
    </FormField>
  );
}
