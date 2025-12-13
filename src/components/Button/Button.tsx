import React from 'react';
import { Button as ShadcnButton, ButtonProps as ShadcnButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<ShadcnButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantMap: Record<string, ShadcnButtonProps['variant']> = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  ghost: 'ghost',
  outline: 'outline',
  link: 'link',
  default: 'default',
};

const sizeMap: Record<string, ShadcnButtonProps['size']> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
  default: 'default',
  icon: 'icon',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      variant={variantMap[variant] || 'secondary'}
      size={sizeMap[size] || 'default'}
      disabled={disabled || isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {icon && <span className="flex">{icon}</span>}
          {children}
        </>
      )}
    </ShadcnButton>
  );
}
