import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'var(--success)';
      case 'error':
        return 'var(--error)';
      case 'warning':
        return '#ff9800';
      case 'info':
        return 'var(--accent)';
      default:
        return 'var(--text-primary)';
    }
  };

  return (
    <div
      style={{
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '12px 16px',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: '1',
          padding: '0',
          marginLeft: '12px',
          opacity: 0.8,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        ×
      </button>
    </div>
  );
}

