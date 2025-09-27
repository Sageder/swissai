"use client"

import { useEffect, useRef } from 'react'
import type { VehicleMovement } from '@/lib/data-context'

interface VehicleMarkerProps {
  vehicle: VehicleMovement
  map: any
  onHover?: (vehicle: VehicleMovement, pos: { x: number; y: number }) => void
  onLeave?: () => void
}

export function VehicleMarker({ vehicle, map, onHover, onLeave }: VehicleMarkerProps) {
  const markerRef = useRef<any>(null)
  const animRef = useRef<number | null>(null)
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null)
  const lastUpdateTimeRef = useRef<number | null>(null)

  // Get vehicle emoji based on type
  const getVehicleEmoji = (vehicleType: VehicleMovement['vehicleType']): string => {
    switch (vehicleType) {
      case 'helicopter':
        return '🚁'
      case 'ambulance':
        return '🚑'
      case 'fire_truck':
        return '🚒'
      case 'police':
        return '🚔'
      case 'evacuation_bus':
        return '🚌'
      default:
        return '🚗'
    }
  }

  // Get vehicle color based on type
  const getVehicleColor = (vehicleType: VehicleMovement['vehicleType']): string => {
    switch (vehicleType) {
      case 'helicopter':
        return '#3b82f6' // Blue
      case 'ambulance':
        return '#ef4444' // Red
      case 'fire_truck':
        return '#dc2626' // Dark red
      case 'police':
        return '#1f2937' // Dark gray
      case 'evacuation_bus':
        return '#f59e0b' // Orange
      default:
        return '#6b7280' // Gray
    }
  }

  useEffect(() => {
    if (!map) return
    if (markerRef.current) return

    // Create vehicle marker element (once per marker)
    const el = document.createElement('div')
    el.className = 'vehicle-marker'
    el.innerHTML = `
      <div class="vehicle-marker-container" style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
        backdrop-filter: blur(20px);
        border: 2px solid ${getVehicleColor(vehicle.vehicleType)};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 
          0 4px 16px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        cursor: pointer;
      ">
        <div class="vehicle-glow" style="
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: ${getVehicleColor(vehicle.vehicleType)};
          border-radius: 50%;
          opacity: 0.3;
          filter: blur(4px);
          animation: pulse 2s ease-in-out infinite;
        "></div>
        <div style="
          font-size: 20px;
          z-index: 1;
          position: relative;
        ">
          ${getVehicleEmoji(vehicle.vehicleType)}
        </div>
      </div>
    `

    // Add CSS animation for pulse effect (once)
    if (!document.getElementById('vehicle-marker-styles')) {
      const style = document.createElement('style')
      style.id = 'vehicle-marker-styles'
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .vehicle-marker-container:hover {
          transform: scale(1.1);
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3);
        }
      `
      document.head.appendChild(style)
    }

    // Add click/hover handlers
    el.onclick = () => {
      const status = vehicle.status === 'arrived' ? 'Arrived' : 'Traveling'
      const progress = Math.round(vehicle.progress * 100)
      alert(`${getVehicleEmoji(vehicle.vehicleType)} ${vehicle.vehicleType.replace('_', ' ').toUpperCase()}\nStatus: ${status}\nProgress: ${progress}%\nFrom: ${vehicle.from.name || 'Unknown'}\nTo: ${vehicle.to.name || 'Unknown'}`)
    }
    el.onmouseenter = (e) => {
      const evt = e as MouseEvent
      onHover?.(vehicle, { x: evt.clientX, y: evt.clientY })
    }
    el.onmousemove = (e) => {
      const evt = e as MouseEvent
      onHover?.(vehicle, { x: evt.clientX, y: evt.clientY })
    }
    el.onmouseleave = () => {
      onLeave?.()
    }

    // Create and add marker to map
    const mapboxgl = require('mapbox-gl')
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([vehicle.currentPosition.lng, vehicle.currentPosition.lat])
      .addTo(map)

    markerRef.current = marker
    prevPosRef.current = { lat: vehicle.currentPosition.lat, lng: vehicle.currentPosition.lng }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (markerRef.current) {
        markerRef.current.remove()
      }
      markerRef.current = null
    }
  }, [map, vehicle.id])

  // Update marker position when vehicle position changes
  useEffect(() => {
    if (!markerRef.current || !vehicle) return

    const start = prevPosRef.current || { lat: vehicle.currentPosition.lat, lng: vehicle.currentPosition.lng }
    const end = { lat: vehicle.currentPosition.lat, lng: vehicle.currentPosition.lng }
    prevPosRef.current = end

    // Constant-speed smoothing: animate over the actual time since last update
    const now = performance.now()
    const last = lastUpdateTimeRef.current ?? (now - 1000)
    const durationMs = Math.min(1100, Math.max(120, now - last))
    lastUpdateTimeRef.current = now
    const startTime = now

    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs)
      const lat = start.lat + (end.lat - start.lat) * t
      const lng = start.lng + (end.lng - start.lng) * t
      markerRef.current.setLngLat([lng, lat])
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        animRef.current = null
      }
    }

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(animate)
  }, [vehicle.currentPosition.lat, vehicle.currentPosition.lng])

  return null
}
