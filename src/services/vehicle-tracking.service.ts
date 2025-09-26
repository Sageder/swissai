/**
 * Vehicle Tracking Service using Mapbox Navigation API
 * Provides smooth vehicle movement tracking with proper route rendering
 */

import type { VehicleMovement } from '@/lib/data-context';

export interface VehicleTrackingOptions {
  mapboxToken: string;
  onPositionUpdate: (vehicleId: string, position: { lat: number; lng: number }, progress: number) => void;
  onRouteUpdate: (vehicleId: string, route: { coordinates: [number, number][]; distance: number; duration: number }) => void;
  onVehicleArrived: (vehicleId: string) => void;
}

export class VehicleTrackingService {
  private activeVehicles: Map<string, VehicleTrackingInstance> = new Map();
  private options: VehicleTrackingOptions;

  constructor(options: VehicleTrackingOptions) {
    this.options = options;
  }

  /**
   * Start tracking a vehicle movement
   */
  async startVehicleTracking(movement: VehicleMovement): Promise<void> {
    if (this.activeVehicles.has(movement.id)) {
      console.warn(`Vehicle ${movement.id} is already being tracked`);
      return;
    }

    try {
      // Get route from Mapbox Directions API
      const route = await this.getRoute(movement.from, movement.to);
      
      const trackingInstance = new VehicleTrackingInstance(
        movement,
        route,
        this.options
      );

      this.activeVehicles.set(movement.id, trackingInstance);
      trackingInstance.start();

      // Notify about route
      if (route) {
        this.options.onRouteUpdate(movement.id, route);
      }
    } catch (error) {
      console.error(`Failed to start tracking vehicle ${movement.id}:`, error);
    }
  }

  /**
   * Stop tracking a vehicle
   */
  stopVehicleTracking(vehicleId: string): void {
    const trackingInstance = this.activeVehicles.get(vehicleId);
    if (trackingInstance) {
      trackingInstance.stop();
      this.activeVehicles.delete(vehicleId);
    }
  }

  /**
   * Update vehicle movement data
   */
  updateVehicleMovement(vehicleId: string, updates: Partial<VehicleMovement>): void {
    const trackingInstance = this.activeVehicles.get(vehicleId);
    if (trackingInstance) {
      trackingInstance.updateMovement(updates);
    }
  }

  /**
   * Get route from Mapbox Directions API
   */
  private async getRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${this.options.mapboxToken}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          coordinates: route.geometry.coordinates,
          distance: route.distance,
          duration: route.duration
        };
      }
    } catch (error) {
      console.error('Error getting route from Mapbox:', error);
    }
    
    return null;
  }

  /**
   * Get all active vehicle IDs
   */
  getActiveVehicleIds(): string[] {
    return Array.from(this.activeVehicles.keys());
  }

  /**
   * Cleanup all tracking instances
   */
  cleanup(): void {
    this.activeVehicles.forEach((instance) => instance.stop());
    this.activeVehicles.clear();
  }
}

/**
 * Individual vehicle tracking instance
 */
class VehicleTrackingInstance {
  private movement: VehicleMovement;
  private route: { coordinates: [number, number][]; distance: number; duration: number } | null;
  private options: VehicleTrackingOptions;
  private animationFrameId: number | null = null;
  private startTime: number;
  private isRunning = false;

  constructor(
    movement: VehicleMovement,
    route: { coordinates: [number, number][]; distance: number; duration: number } | null,
    options: VehicleTrackingOptions
  ) {
    this.movement = movement;
    this.route = route;
    this.options = options;
    this.startTime = Date.now();
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  updateMovement(updates: Partial<VehicleMovement>): void {
    this.movement = { ...this.movement, ...updates };
  }

  private animate(): void {
    if (!this.isRunning) return;

    const now = Date.now();
    const elapsed = now - this.startTime;
    
    // Calculate normalized speed based on route distance
    // Base speed: 20 km/h = 5.56 m/s (slower for better visibility)
    const baseSpeed = 5.56; // meters per second
    let normalizedDuration = this.movement.duration;
    
    if (this.route) {
      // Calculate expected duration based on distance and base speed
      const expectedDuration = (this.route.distance / baseSpeed) * 1000; // convert to milliseconds
      // Use the shorter of the two durations, but cap at reasonable limits
      normalizedDuration = Math.min(Math.max(expectedDuration, 5000), 120000); // 5s to 2min
    }
    
    const progress = Math.min(elapsed / normalizedDuration, 1);

    let currentPosition: { lat: number; lng: number };

    if (this.route && this.route.coordinates.length > 0) {
      // Smooth movement along route coordinates
      currentPosition = this.getPositionAlongRoute(progress);
    } else {
      // Fallback to direct linear interpolation
      currentPosition = this.getDirectPosition(progress);
    }

    // Update position
    this.options.onPositionUpdate(this.movement.id, currentPosition, progress);

    if (progress < 1) {
      // Continue animation
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      // Vehicle has arrived
      this.options.onVehicleArrived(this.movement.id);
      this.stop();
    }
  }

  private getPositionAlongRoute(progress: number): { lat: number; lng: number } {
    if (!this.route || this.route.coordinates.length === 0) {
      return this.getDirectPosition(progress);
    }

    // Calculate distance-based progress for consistent speed
    const totalDistance = this.route.distance;
    const targetDistance = progress * totalDistance;
    
    let accumulatedDistance = 0;
    let currentIndex = 0;
    
    // Find the segment where the target distance falls
    for (let i = 0; i < this.route.coordinates.length - 1; i++) {
      const currentCoord = this.route.coordinates[i];
      const nextCoord = this.route.coordinates[i + 1];
      
      // Calculate distance between current and next coordinate
      const segmentDistance = this.calculateDistance(
        currentCoord[1], currentCoord[0], // lat, lng
        nextCoord[1], nextCoord[0]        // lat, lng
      );
      
      if (accumulatedDistance + segmentDistance >= targetDistance) {
        // Target distance is within this segment
        const segmentProgress = (targetDistance - accumulatedDistance) / segmentDistance;
        
        // Interpolate position within this segment
        const lng = currentCoord[0] + (nextCoord[0] - currentCoord[0]) * segmentProgress;
        const lat = currentCoord[1] + (nextCoord[1] - currentCoord[1]) * segmentProgress;
        
        return { lat, lng };
      }
      
      accumulatedDistance += segmentDistance;
      currentIndex = i;
    }
    
    // If we've reached the end, return the last coordinate
    const lastCoord = this.route.coordinates[this.route.coordinates.length - 1];
    return { lat: lastCoord[1], lng: lastCoord[0] };
  }

  // Helper function to calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private getDirectPosition(progress: number): { lat: number; lng: number } {
    const lat = this.movement.from.lat + (this.movement.to.lat - this.movement.from.lat) * progress;
    const lng = this.movement.from.lng + (this.movement.to.lng - this.movement.from.lng) * progress;
    return { lat, lng };
  }
}
