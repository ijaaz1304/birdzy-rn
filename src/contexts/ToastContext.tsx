/**
 * Toast Context
 * Provides toast notification functionality throughout the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Toast } from "../molecules/Toast";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      const id = Date.now().toString();
      setToast({ id, message, type, duration });
      setVisible(true);
    },
    []
  );

  const hideToast = useCallback(() => {
    setVisible(false);
    // Clear toast after animation completes
    setTimeout(() => {
      setToast(null);
    }, 300);
  }, []);

  const value: ToastContextValue = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={visible}
          duration={toast.duration}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

/**
 * Hook to access toast context
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
