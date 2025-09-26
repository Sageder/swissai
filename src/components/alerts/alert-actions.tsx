'use client';

import React from 'react';
import { AlertAction } from '@/types/alert';

interface AlertActionsProps {
    actions: AlertAction[];
}

export const AlertActions: React.FC<AlertActionsProps> = ({ actions }) => {
    return (
        <div className="flex gap-2">
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        action.action();
                    }}
                    className={`
            px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            backdrop-blur-sm border border-white/20
            ${action.type === 'primary'
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:scale-105'
                            : action.type === 'danger'
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:scale-105'
                                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105'
                        }
            hover:shadow-lg active:scale-95
          `}
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};
