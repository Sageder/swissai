'use client';

import React from 'react';
import { useAlert } from '@/lib/alert-context';
import { AlertItem } from './alert-item';

export const AlertContainer: React.FC = () => {
    const { alerts } = useAlert();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
            {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
            ))}
        </div>
    );
};
