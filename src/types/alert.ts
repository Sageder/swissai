export interface Alert {
    id: string;
    type: 'info' | 'warning' | 'critical' | 'emergency';
    title: string;
    message: string;
    location?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
    category: 'weather' | 'geological' | 'infrastructure' | 'evacuation' | 'system' | 'communication';
    source: string;
    actions?: AlertAction[];
    metadata?: {
        eventId?: string;
        affectedPopulation?: number;
        evacuationZone?: string;
        estimatedImpact?: string;
        responseTime?: string;
        authoritiesNotified?: string[];
    };
    isRead?: boolean;
    expiresAt?: string;
}

export interface AlertAction {
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    action: () => void;
}

export interface AlertContextType {
    alerts: Alert[];
    addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => string;
    removeAlert: (id: string) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    getUnreadCount: () => number;
}
