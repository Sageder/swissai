'use client';

import React, { useState, useEffect } from 'react';
import { Alert } from '@/types/alert';
import { useAlert } from '@/lib/alert-context';
import { AlertIcon } from './alert-icon';
import { AlertActions } from './alert-actions';

interface AlertItemProps {
    alert: Alert;
}

export const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
    const { removeAlert, markAsRead } = useAlert();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Animate in
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            removeAlert(alert.id);
        }, 300);
    };

    const handleClick = () => {
        if (!alert.isRead) {
            markAsRead(alert.id);
        }
    };

    const getSeverityStyles = () => {
        switch (alert.severity) {
            case 'emergency':
                return {
                    container: 'bg-red-500/10 border-red-400/30 shadow-red-500/20',
                    icon: 'text-red-400',
                    accent: 'bg-red-400',
                    glow: 'shadow-red-500/30'
                };
            case 'critical':
                return {
                    container: 'bg-orange-500/10 border-orange-400/30 shadow-orange-500/20',
                    icon: 'text-orange-400',
                    accent: 'bg-orange-400',
                    glow: 'shadow-orange-500/30'
                };
            case 'high':
                return {
                    container: 'bg-yellow-500/10 border-yellow-400/30 shadow-yellow-500/20',
                    icon: 'text-yellow-400',
                    accent: 'bg-yellow-400',
                    glow: 'shadow-yellow-500/30'
                };
            case 'medium':
                return {
                    container: 'bg-blue-500/10 border-blue-400/30 shadow-blue-500/20',
                    icon: 'text-blue-400',
                    accent: 'bg-blue-400',
                    glow: 'shadow-blue-500/30'
                };
            default:
                return {
                    container: 'bg-gray-500/10 border-gray-400/30 shadow-gray-500/20',
                    icon: 'text-gray-400',
                    accent: 'bg-gray-400',
                    glow: 'shadow-gray-500/30'
                };
        }
    };

    const styles = getSeverityStyles();

    return (
        <div
            className={`
        relative overflow-hidden rounded-2xl backdrop-blur-xl
        border border-white/20
        ${styles.container}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-2xl
        ${styles.glow}
        ${alert.isRead ? 'opacity-70' : 'opacity-100'}
        cursor-pointer
      `}
            onClick={handleClick}
        >
            {/* Liquid glass background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />

            {/* Animated accent line */}
            <div
                className={`absolute top-0 left-0 right-0 h-0.5 ${styles.accent} opacity-80`}
                style={{
                    background: `linear-gradient(90deg, transparent, ${styles.accent.replace('bg-', '')}, transparent)`,
                    animation: 'shimmer 2s infinite'
                }}
            />

            {/* Content */}
            <div className="relative p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <AlertIcon category={alert.category} severity={alert.severity} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`text-sm font-semibold ${styles.icon} truncate`}>
                                {alert.title}
                            </h3>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss();
                                }}
                                className="text-white/40 hover:text-white/60 transition-colors p-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-white/80 text-xs leading-relaxed mb-2">
                            {alert.message}
                        </p>

                        {alert.location && (
                            <div className="flex items-center gap-1 text-white/60 text-xs mb-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{alert.location}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-white/50">
                            <span>
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="uppercase tracking-wide">
                                {alert.severity}
                            </span>
                        </div>
                    </div>
                </div>

                {alert.actions && alert.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <AlertActions actions={alert.actions} />
                    </div>
                )}
            </div>

            {/* Unread indicator */}
            {!alert.isRead && (
                <div className={`absolute top-3 right-3 w-2 h-2 ${styles.accent} rounded-full animate-pulse`} />
            )}
        </div>
    );
};

// CSS for shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Inject the keyframes into the document
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = shimmerKeyframes;
    document.head.appendChild(style);
}
