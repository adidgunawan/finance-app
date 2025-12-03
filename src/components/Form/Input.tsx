import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${className}`} {...props} />
      {error && <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}


