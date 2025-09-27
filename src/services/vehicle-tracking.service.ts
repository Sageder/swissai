/**
 * Vehicle Tracking Service
 * Handles real-time vehicle movement tracking and updates
 */

import type { VehicleMovement } from '@/lib/data-context';

export interface VehicleTrackingServiceConfig {
  mapboxToken: string;
  onPositionUpdate: (vehicleId: string, position: { lat: number; lng: number }, progress: number) => void;
  onRouteUpdate: (vehicleId: string, route: any) => void;
  onVehicleArrived: (vehicleId: string) => void;
}

export class VehicleTrackingService {
  private static instance: VehicleTrackingService;
  private updateCallbacks: Array<(movements: VehicleMovement[]) => void> = [];
  private movements: VehicleMovement[] = [];
  private config: VehicleTrackingServiceConfig | null = null;

  constructor(config?: VehicleTrackingServiceConfig) {
    if (config) {
      this.config = config;
    }
  }

  static getInstance(): VehicleTrackingService {
    if (!VehicleTrackingService.instance) {
      VehicleTrackingService.instance = new VehicleTrackingService();
    }
    return VehicleTrackingService.instance;
  }

  /**
   * Add a vehicle movement to tracking
   */
  addMovement(movement: VehicleMovement): void {
    this.movements.push(movement);
    this.notifyCallbacks();
  }

  /**
   * Remove a vehicle movement from tracking
   */
  removeMovement(movementId: string): void {
    this.movements = this.movements.filter(m => m.id !== movementId);
    this.notifyCallbacks();
  }

  /**
   * Update a vehicle movement
   */
  updateMovement(movementId: string, updates: Partial<VehicleMovement>): void {
    const index = this.movements.findIndex(m => m.id === movementId);
    if (index !== -1) {
      this.movements[index] = { ...this.movements[index], ...updates };
      this.notifyCallbacks();
    }
  }

  /**
   * Get all tracked movements
   */
  getMovements(): VehicleMovement[] {
    return [...this.movements];
  }

  /**
   * Get active movements (not arrived)
   */
  getActiveMovements(): VehicleMovement[] {
    return this.movements.filter(m => m.status !== 'arrived');
  }

  /**
   * Subscribe to movement updates
   */
  onUpdate(callback: (movements: VehicleMovement[]) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Clear all movements
   */
  clearAll(): void {
    this.movements = [];
    this.notifyCallbacks();
  }

  /**
   * Start tracking a vehicle movement
   */
  startVehicleTracking(movement: VehicleMovement): void {
    this.addMovement(movement);
    // Implementation would start actual tracking logic here
    console.log('Starting vehicle tracking for:', movement.id);
  }

  /**
   * Cleanup the service
   */
  cleanup(): void {
    this.movements = [];
    this.updateCallbacks = [];
    this.config = null;
  }

  private notifyCallbacks(): void {
    this.updateCallbacks.forEach(callback => callback([...this.movements]));
  }
}
