import type { VehicleMovement } from "@/lib/data-context"

export interface VehicleTrackingConfig {
    mapboxToken: string
    onPositionUpdate: (vehicleId: string, position: { lat: number; lng: number }, progress: number) => void
    onRouteUpdate: (vehicleId: string, route: { coordinates: [number, number][], distance: number, duration: number }) => void
    onVehicleArrived: (vehicleId: string) => void
}

export class VehicleTrackingService {
    private config: VehicleTrackingConfig
    private trackedVehicles: Map<string, any> = new Map()
    private animationFrames: Map<string, number> = new Map()

    constructor(config: VehicleTrackingConfig) {
        this.config = config
    }

    startVehicleTracking(movement: VehicleMovement) {
        if (this.trackedVehicles.has(movement.id)) {
            return // Already tracking this vehicle
        }

        this.trackedVehicles.set(movement.id, movement)

        // Start the animation loop for this vehicle
        this.animateVehicle(movement.id)
    }

    stopVehicleTracking(vehicleId: string) {
        if (this.animationFrames.has(vehicleId)) {
            cancelAnimationFrame(this.animationFrames.get(vehicleId)!)
            this.animationFrames.delete(vehicleId)
        }
        this.trackedVehicles.delete(vehicleId)
    }

    private animateVehicle(vehicleId: string) {
        const movement = this.trackedVehicles.get(vehicleId)
        if (!movement) return

        const animate = () => {
            const currentMovement = this.trackedVehicles.get(vehicleId)
            if (!currentMovement) return

            // Update position based on progress
            if (currentMovement.route && currentMovement.route.coordinates.length > 0) {
                const route = currentMovement.route.coordinates
                const progress = currentMovement.progress

                // Calculate current position along the route
                const segmentIndex = Math.floor(progress * (route.length - 1))
                const segmentProgress = (progress * (route.length - 1)) - segmentIndex

                if (segmentIndex < route.length - 1) {
                    const currentPoint = route[segmentIndex]
                    const nextPoint = route[segmentIndex + 1]

                    const lat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress
                    const lng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress

                    this.config.onPositionUpdate(vehicleId, { lat, lng }, progress)
                }
            } else {
                // Direct path calculation
                const from = currentMovement.from
                const to = currentMovement.to
                const progress = currentMovement.progress

                const lat = from.lat + (to.lat - from.lat) * progress
                const lng = from.lng + (to.lng - from.lng) * progress

                this.config.onPositionUpdate(vehicleId, { lat, lng }, progress)
            }

            // Continue animation if vehicle is still traveling
            if (currentMovement.status === 'traveling') {
                const frameId = requestAnimationFrame(animate)
                this.animationFrames.set(vehicleId, frameId)
            } else if (currentMovement.status === 'arrived') {
                this.config.onVehicleArrived(vehicleId)
            }
        }

        const frameId = requestAnimationFrame(animate)
        this.animationFrames.set(vehicleId, frameId)
    }

    cleanup() {
        // Stop all animations
        this.animationFrames.forEach((frameId) => {
            cancelAnimationFrame(frameId)
        })
        this.animationFrames.clear()
        this.trackedVehicles.clear()
    }
}
