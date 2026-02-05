'use client';

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { Alert, type AlertType } from '@/components/ui';

interface AlertItem {
  id: string;
  type: AlertType;
  message: string;
}

interface AlertContextValue {
  showAlert: (type: AlertType, message: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const MAX_ALERTS = 5;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const showAlert = useCallback((type: AlertType, message: string) => {
    const id = crypto.randomUUID();
    setAlerts((prev) => {
      const next = [...prev, { id, type, message }];
      return next.length > MAX_ALERTS ? next.slice(-MAX_ALERTS) : next;
    });
  }, []);

  const showSuccess = useCallback((msg: string) => showAlert('success', msg), [showAlert]);
  const showError = useCallback((msg: string) => showAlert('error', msg), [showAlert]);
  const showWarning = useCallback((msg: string) => showAlert('warning', msg), [showAlert]);
  const showInfo = useCallback((msg: string) => showAlert('info', msg), [showAlert]);

  return (
    <AlertContext value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-80 flex-col gap-3">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            id={alert.id}
            type={alert.type}
            message={alert.message}
            onClose={removeAlert}
          />
        ))}
      </div>
    </AlertContext>
  );
}

export function useAlerts(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
}
