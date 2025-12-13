import * as React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export function DateInput({ label, error, description, required, className, ...props }: DateInputProps) {
  return (
    <FormField label={label} error={error} description={description} required={required}>
      <ShadcnInput
        type="date"
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    </FormField>
  );
}
