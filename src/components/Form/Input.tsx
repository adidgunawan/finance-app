import * as React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export function Input({ label, error, description, required, className, ...props }: InputProps) {
  return (
    <FormField label={label} error={error} description={description} required={required}>
      <ShadcnInput
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    </FormField>
  );
}
