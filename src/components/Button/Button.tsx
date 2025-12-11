import React from 'react';


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

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
    // Map props to classes
    const variantClass = variant === 'primary' ? 'primary' : variant === 'danger' ? 'danger' : '';

    // Custom styles for sizes or ghost variant can be handled here or via additional CSS classes
    // For now, we rely on the existing global CSS for basic variants, but we could extend it.

    const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        position: 'relative',
        opacity: disabled || isLoading ? 0.7 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    };

    return (
        <button
            className={`${variantClass} ${className}`}
            disabled={disabled || isLoading}
            style={{ ...baseStyle, ...(props.style || {}) }}
            {...props}
        >
            {isLoading ? (
                // Small spinner for button
                <div style={{ width: '16px', height: '16px', position: 'relative' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'currentColor', borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>
            ) : (
                <>
                    {icon && <span style={{ display: 'flex' }}>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
}
