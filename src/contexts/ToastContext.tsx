import { createContext, useContext, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/Modal/ConfirmModal';
import { useState } from 'react';

interface ConfirmState {
  id: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => string;
  showSuccess: (message: string) => string;
  showError: (message: string) => string;
  showWarning: (message: string) => string;
  showInfo: (message: string) => string;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number) => {
      const id = `toast-${++toastIdCounter}`;
      const options = duration ? { duration } : {};
      
      switch (type) {
        case 'success':
          toast.success(message, options);
          break;
        case 'error':
          toast.error(message, options);
          break;
        case 'warning':
          toast.warning(message, options);
          break;
        case 'info':
        default:
          toast.info(message, options);
          break;
      }
      
      return id;
    },
    []
  );

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error', 5000), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning', 4000), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const showConfirm = useCallback(
    (message: string, onConfirm: () => void, onCancel?: () => void) => {
      const id = `confirm-${++toastIdCounter}`;
      
      const handleConfirm = () => {
        setConfirmModal(null);
        onConfirm();
      };

      const handleCancel = () => {
        setConfirmModal(null);
        if (onCancel) {
          onCancel();
        }
      };

      setConfirmModal({
        id,
        message,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      });

      return id;
    },
    []
  );

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
