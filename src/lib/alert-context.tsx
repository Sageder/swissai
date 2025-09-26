'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert, AlertContextType } from '@/types/alert';

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp'>): string => {
        const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newAlert: Alert = {
            ...alertData,
            id,
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        setAlerts(prev => [newAlert, ...prev]);

        // Auto-remove alert after 30 seconds for non-critical alerts
        if (alertData.severity !== 'critical' && alertData.severity !== 'emergency') {
            setTimeout(() => {
                setAlerts(prev => prev.filter(alert => alert.id !== id));
            }, 30000);
        }

        return id;
    }, []);

    const removeAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, []);

    const markAsRead = useCallback((id: string) => {
        setAlerts(prev =>
            prev.map(alert =>
                alert.id === id ? { ...alert, isRead: true } : alert
            )
        );
    }, []);

    const clearAll = useCallback(() => {
        setAlerts([]);
    }, []);

    const getUnreadCount = useCallback(() => {
        return alerts.filter(alert => !alert.isRead).length;
    }, [alerts]);

    const value: AlertContextType = {
        alerts,
        addAlert,
        removeAlert,
        markAsRead,
        clearAll,
        getUnreadCount,
    };

    return (
        <AlertContext.Provider value={value}>
            {children}
        </AlertContext.Provider>
    );
};
