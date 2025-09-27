'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onPlanChange, getPlanSummary } from '@/lib/plan-store';

interface LiveModeIndicatorProps {
    className?: string;
}

export const LiveModeIndicator: React.FC<LiveModeIndicatorProps> = ({ className = '' }) => {
    const [planSummary, setPlanSummary] = useState(getPlanSummary());

    useEffect(() => {
        const unsubscribe = onPlanChange(() => {
            setPlanSummary(getPlanSummary());
        });

        return unsubscribe;
    }, []);

    if (!planSummary.hasPlan || !planSummary.isLive) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`fixed top-4 right-4 z-50 ${className}`}
            >
                <div className="bg-red-600 border-2 border-red-400 rounded-lg px-3 py-2 shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white font-medium text-sm">LIVE MODE</span>
                    </div>
                    <div className="text-xs text-red-100 mt-1">
                        Plan: {planSummary.nodeCount} nodes, {planSummary.connectionCount} connections
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
