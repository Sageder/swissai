"use client";

import { useState, useRef, useEffect } from "react";
import { MapContainer, type MapRef } from "@/components/map-container";
import { Sidebar } from "@/components/sidebar";
import { BottomDock } from "@/components/bottom-dock";
import { SettingsOverlay } from "@/components/overlays/settings-overlay";
import { AnalyticsOverlay } from "@/components/overlays/analytics-overlay";
import { Timeline } from "@/components/timeline";
import { TimeProvider } from "@/lib/time-context";
import { DataProvider, useData } from "@/lib/data-context";
import { MapSearch } from "@/components/map-search";
import { AIChat } from "@/components/ai-chat";
import { AlertContainer } from "@/components/alerts/alert-container";
import { motion } from "framer-motion";
import { convertResourcesToPOIs, convertMonitoringStationsToPOIs, combinePOIs } from "@/utils/resource-to-poi";
import { blattentPOIs } from "@/data/pois";
import { useAlert } from "@/lib/alert-context";
import { setAlertContext, createLandslideAlert } from "@/lib/alert-service";

// Component that uses data context
function MapWithData() {
  const { resources, monitoringStations, isLoading } = useData();
  const alertContext = useAlert();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [dockHeight, setDockHeight] = useState(33); // percentage
  const [activeView, setActiveView] = useState("map");
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Initialize alert context for programmatic use
  useEffect(() => {
    setAlertContext(alertContext);
  }, [alertContext]);

  // Demo alert for Blatten landslide
  useEffect(() => {
    const timer = setTimeout(() => {
      createLandslideAlert('Blatten, Valais', { lat: 46.4, lng: 7.5 });
    }, 2000); // Show alert 2 seconds after component mounts

    return () => clearTimeout(timer);
  }, []);

  // Convert resources and monitoring stations to POIs and combine with static POIs
  const resourcePOIs = convertResourcesToPOIs(resources);
  const monitoringPOIs = convertMonitoringStationsToPOIs(monitoringStations);
  const allPOIs = combinePOIs(blattentPOIs, resourcePOIs, monitoringPOIs);

  console.log('🗺️ Map POIs:', {
    static: blattentPOIs.length,
    resources: resourcePOIs.length,
    monitoring: monitoringPOIs.length,
    total: allPOIs.length,
    isLoading
  });

  const handleTerrainToggle = (enabled: boolean, exaggeration?: number) => {
    if (mapRef.current) {
      mapRef.current.toggleTerrain(enabled, exaggeration);
    }
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    console.log(`[v0] Switched to ${view} view`);
  };

  const handleLocationSelect = (
    coordinates: [number, number],
    name: string,
    boundingBox?: [number, number, number, number]
  ) => {
    console.log(`Flying to ${name} at coordinates:`, coordinates);
    if (mapRef.current) {
      mapRef.current.flyToLocation(coordinates, 14, boundingBox);
    }
  };

  const handleCloseOverlay = () => {
    setActiveView("map");
  };

  const handleAIChatOpen = () => {
    setAiChatOpen(true);
  };

  const handleAIChatClose = () => {
    setAiChatOpen(false);
  };

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden dark">
      {/* Alert Container */}
      <AlertContainer />

      {/* Timeline - Fixed at top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-96">
        <Timeline />
      </div>

      {/* Main Layout Container */}
      <div className="relative h-full flex">
        {/* Main Content Area - Full Width */}
        <div className="flex-1 relative">
          {/* Full-screen Map */}
          <motion.div
            animate={{
              bottom: `${dockHeight}%`,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <MapContainer ref={mapRef} pois={allPOIs} />
          </motion.div>

          {/* Search Overlay - Positioned on the right side */}
          <div className="absolute top-4 right-4 z-40">
            <MapSearch onLocationSelect={handleLocationSelect} />
          </div>

          {/* Bottom Dock - Positioned to not overlap with sidebar */}
          <motion.div
            animate={{
              height: `${dockHeight}%`,
              left: sidebarExpanded ? "320px" : "60px",
            }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-0 right-0"
          >
            <BottomDock
              height={dockHeight}
              onHeightChange={setDockHeight}
              onTerrainToggle={handleTerrainToggle}
            />
          </motion.div>
        </div>

        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
          activeView={activeView}
          onViewChange={handleViewChange}
          onAIChatOpen={handleAIChatOpen}
        />

        {/* AI Chat Overlay */}
        <AIChat
          isOpen={aiChatOpen}
          onClose={handleAIChatClose}
        />
      </div>

      {/* Overlays */}
      <SettingsOverlay
        isOpen={activeView === "settings"}
        onClose={handleCloseOverlay}
        onTerrainToggle={handleTerrainToggle}
      />

      <AnalyticsOverlay
        isOpen={activeView === "analytics"}
        onClose={handleCloseOverlay}
      />
    </div>
  );
}

// Main Dashboard component that provides the data context
export default function Dashboard() {
  return (
    <DataProvider>
      <TimeProvider>
        <MapWithData />
      </TimeProvider>
    </DataProvider>
  );
}
