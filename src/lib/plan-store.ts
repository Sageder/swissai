export interface CrisisPlanNode {
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    severity?: string;
    position: { x: number; y: number };
    metadata?: Record<string, any>;
}

export interface CrisisPlanConnection {
    id: string;
    from: string;
    to: string;
    type: string;
    status: string;
    label?: string;
}

export interface CrisisPlanExport {
    nodes: CrisisPlanNode[];
    connections: CrisisPlanConnection[];
    acceptedAt?: number;
}

let currentPlan: CrisisPlanExport | null = null;
let planCallbacks: Array<(plan: CrisisPlanExport | null) => void> = [];

export function setCurrentPlanExport(plan: CrisisPlanExport): void {
    currentPlan = plan;
    planCallbacks.forEach(cb => cb(currentPlan));
    console.log('[PlanStore] Plan exported', { nodes: plan.nodes.length, connections: plan.connections.length });
}

export function getCurrentPlanExport(): CrisisPlanExport | null {
    return currentPlan;
}

export function onPlanExportChange(cb: (plan: CrisisPlanExport | null) => void): () => void {
    planCallbacks.push(cb);
    return () => {
        const idx = planCallbacks.indexOf(cb);
        if (idx > -1) planCallbacks.splice(idx, 1);
    };
}


