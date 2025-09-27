/**
 * Plan Store - Manages crisis response plans and live mode state
 */

export interface CrisisPlan {
    nodes: any[];
    connections: any[];
    acceptedAt: number;
    title?: string;
    description?: string;
}

// Global state for plan management
let currentPlan: CrisisPlan | null = null;
let isLiveMode = false;
let planCallbacks: Array<() => void> = [];

/**
 * Set the current plan export
 */
export function setCurrentPlanExport(plan: CrisisPlan): void {
    currentPlan = plan;
    planCallbacks.forEach(callback => callback());
    console.log('Plan exported:', plan);
}

/**
 * Get the current plan
 */
export function getCurrentPlan(): CrisisPlan | null {
    return currentPlan;
}

/**
 * Clear the current plan
 */
export function clearCurrentPlan(): void {
    currentPlan = null;
    planCallbacks.forEach(callback => callback());
    console.log('Plan cleared');
}

/**
 * Set live mode state
 */
export function setLiveMode(active: boolean): void {
    isLiveMode = active;
    planCallbacks.forEach(callback => callback());
    console.log('Live mode:', active ? 'activated' : 'deactivated');
}

/**
 * Get live mode state
 */
export function isLiveModeActive(): boolean {
    return isLiveMode;
}

/**
 * Subscribe to plan changes
 */
export function onPlanChange(callback: () => void): () => void {
    planCallbacks.push(callback);
    return () => {
        planCallbacks = planCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Get plan summary for display
 */
export function getPlanSummary(): {
    hasPlan: boolean;
    isLive: boolean;
    nodeCount: number;
    connectionCount: number;
    acceptedAt?: number;
} {
    return {
        hasPlan: currentPlan !== null,
        isLive: isLiveMode,
        nodeCount: currentPlan?.nodes?.length || 0,
        connectionCount: currentPlan?.connections?.length || 0,
        acceptedAt: currentPlan?.acceptedAt
    };
}