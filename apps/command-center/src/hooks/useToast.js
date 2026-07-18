import { createContext, createElement, useContext, useMemo, useRef, useState } from 'react';
import Toast from '../components/UI/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };

  const showToast = (message, type = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, type }]);
    const timer = setTimeout(() => dismissToast(id), 4000);
    timersRef.current.set(id, timer);
    return id;
  };

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [toasts],
  );

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    createElement(Toast, { toasts, onDismiss: dismissToast }),
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
