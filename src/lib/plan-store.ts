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

export interface VehiclePrediction {
    vehicle: 'ambulance' | 'fire_truck' | 'police' | 'helicopter' | 'evacuation_bus';
    from: string; // POI id
    to: string;   // POI id
}

// Global state for plan management
let currentPlan: CrisisPlan | null = null;
let isLiveMode = false;
let planCallbacks: Array<() => void> = [];
let liveModeCallbacks: Array<(active: boolean) => void> = [];
let vehiclePredictions: VehiclePrediction[] = [];

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
    liveModeCallbacks.forEach(cb => {
        try { cb(active); } catch { }
    });
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
 * Subscribe to live mode changes
 */
export function onLiveModeChange(callback: (active: boolean) => void): () => void {
    liveModeCallbacks.push(callback);
    return () => {
        liveModeCallbacks = liveModeCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Store vehicle predictions parsed from LLM output
 */
export function setVehiclePredictions(preds: VehiclePrediction[]): void {
    vehiclePredictions = Array.isArray(preds) ? preds : [];
    console.log('Stored vehicle predictions:', vehiclePredictions.length);
    planCallbacks.forEach(callback => callback());
}

export function getVehiclePredictions(): VehiclePrediction[] {
    return [...vehiclePredictions];
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