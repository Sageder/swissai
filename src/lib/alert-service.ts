import { Alert } from '@/types/alert';

// Global alert functions that can be called from anywhere
let alertContext: any = null;

export const setAlertContext = (context: any) => {
    alertContext = context;
};

export const createAlert = (alertData: Omit<Alert, 'id' | 'timestamp'>): string | null => {
    if (!alertContext) {
        console.warn('Alert context not initialized. Call setAlertContext first.');
        return null;
    }
    return alertContext.addAlert(alertData);
};

export const removeAlert = (id: string): void => {
    if (!alertContext) {
        console.warn('Alert context not initialized. Call setAlertContext first.');
        return;
    }
    alertContext.removeAlert(id);
};

export const markAsRead = (id: string): void => {
    if (!alertContext) {
        console.warn('Alert context not initialized. Call setAlertContext first.');
        return;
    }
    alertContext.markAsRead(id);
};

export const clearAllAlerts = (): void => {
    if (!alertContext) {
        console.warn('Alert context not initialized. Call setAlertContext first.');
        return;
    }
    alertContext.clearAll();
};

// Global crisis management callback
let onOpenCrisisManagement: ((event: any) => void) | null = null;

export const setCrisisManagementCallback = (callback: (event: any) => void) => {
    onOpenCrisisManagement = callback;
};

// Predefined alert templates
export const createLandslideAlert = (location: string, coordinates?: { lat: number; lng: number }) => {
    const crisisEvent = {
        id: `landslide_${Date.now()}`,
        type: 'Landslide',
        location,
        coordinates,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        description: `Immediate landslide risk detected in ${location}. Evacuation recommended for affected areas.`
    };

    const alertId = createAlert({
        type: 'critical',
        title: 'Landslide Alert',
        message: `Immediate landslide risk detected in ${location}. Evacuation recommended for affected areas. Monitor for further developments.`,
        location,
        coordinates,
        severity: 'critical',
        category: 'geological',
        source: 'Geological Monitoring System',
        metadata: {
            affectedPopulation: 150,
            evacuationZone: 'Zone A - High Risk',
            estimatedImpact: 'Moderate to High',
            responseTime: '15 minutes',
            authoritiesNotified: ['Cantonal Emergency Services', 'Geological Survey', 'Local Authorities'],
            eventId: crisisEvent.id
        },
        actions: [
            {
                id: 'crisis_management',
                label: 'Open Crisis Management',
                type: 'danger',
                action: () => {
                    console.log('Opening crisis management for', location);
                    if (onOpenCrisisManagement) {
                        onOpenCrisisManagement(crisisEvent);
                    }
                    // Auto-close this specific alert after opening crisis management
                    if (alertContext && alertId) {
                        setTimeout(() => {
                            alertContext.removeAlert(alertId);
                        }, 500); // Small delay to let the crisis management open first
                    }
                }
            }
        ]
    });

    return alertId;
};

export const createWeatherAlert = (location: string, condition: string, severity: 'low' | 'medium' | 'high' | 'critical' | 'emergency') => {
    return createAlert({
        type: severity === 'emergency' || severity === 'critical' ? 'critical' : 'warning',
        title: 'Weather Alert',
        message: `Severe weather conditions detected in ${location}: ${condition}. Take appropriate precautions.`,
        location,
        severity,
        category: 'weather',
        source: 'MeteoSwiss',
        metadata: {
            responseTime: '5 minutes',
            authoritiesNotified: ['MeteoSwiss', 'Emergency Services']
        }
    });
};

export const createEvacuationAlert = (location: string, reason: string, urgency: 'immediate' | 'precautionary') => {
    return createAlert({
        type: 'emergency',
        title: urgency === 'immediate' ? 'IMMEDIATE EVACUATION' : 'Evacuation Order',
        message: `${urgency === 'immediate' ? 'IMMEDIATE EVACUATION REQUIRED' : 'Evacuation order issued'} for ${location}. Reason: ${reason}. Follow evacuation routes immediately.`,
        location,
        severity: urgency === 'immediate' ? 'emergency' : 'critical',
        category: 'evacuation',
        source: 'Emergency Command Center',
        metadata: {
            affectedPopulation: 500,
            evacuationZone: 'Zone A & B',
            estimatedImpact: 'High',
            responseTime: 'Immediate',
            authoritiesNotified: ['Emergency Services', 'Police', 'Fire Department', 'Medical Services']
        },
        actions: [
            {
                id: 'evacuate_now',
                label: 'Evacuate Now',
                type: 'danger',
                action: () => {
                    console.log('Initiating immediate evacuation for', location);
                }
            },
            {
                id: 'evacuation_routes',
                label: 'View Routes',
                type: 'primary',
                action: () => {
                    console.log('Opening evacuation routes for', location);
                }
            }
        ]
    });
};

export const createSystemAlert = (message: string, severity: 'low' | 'medium' | 'high' | 'critical' | 'emergency') => {
    return createAlert({
        type: severity === 'critical' || severity === 'emergency' ? 'critical' : 'info',
        title: 'System Alert',
        message,
        severity,
        category: 'system',
        source: 'Emergency Management System',
        metadata: {
            responseTime: '2 minutes',
            authoritiesNotified: ['System Administrators']
        }
    });
};

export const createInfrastructureAlert = (location: string, issue: string, severity: 'low' | 'medium' | 'high' | 'critical' | 'emergency') => {
    return createAlert({
        type: severity === 'critical' || severity === 'emergency' ? 'critical' : 'warning',
        title: 'Infrastructure Alert',
        message: `Infrastructure issue detected in ${location}: ${issue}. Assessment and repair in progress.`,
        location,
        severity,
        category: 'infrastructure',
        source: 'Infrastructure Monitoring',
        metadata: {
            responseTime: '10 minutes',
            authoritiesNotified: ['Infrastructure Team', 'Emergency Services']
        }
    });
};
