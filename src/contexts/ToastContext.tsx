import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from '../components/Toast/Toast';
import { ToastContainer } from '../components/Toast/ToastContainer';
import { ConfirmModal } from '../components/Modal/ConfirmModal';

interface ConfirmState {
  id: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  showSuccess: (message: string) => string;
  showError: (message: string) => string;
  showWarning: (message: string) => string;
  showInfo: (message: string) => string;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const id = `toast-${++toastIdCounter}`;
      const newToast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
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
      <ToastContainer toasts={toasts} onClose={removeToast} />
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

