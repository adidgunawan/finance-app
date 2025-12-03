import React from 'react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function DateInput({ label, error, className = '', ...props }: DateInputProps) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input type="date" className={`form-input ${className}`} {...props} />
      {error && <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}


