"use client";

import { useState, useRef } from "react";
import { MapContainer, type MapRef } from "@/components/map-container";
import { Sidebar } from "@/components/sidebar";
import { BottomDock } from "@/components/bottom-dock";
import { SettingsOverlay } from "@/components/overlays/settings-overlay";
import { AnalyticsOverlay } from "@/components/overlays/analytics-overlay";
import { Timeline } from "@/components/timeline";
import { TimeProvider } from "@/lib/time-context";
import { MapSearch } from "@/components/map-search";
import { AIChat } from "@/components/ai-chat";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [dockHeight, setDockHeight] = useState(33); // percentage
  const [activeView, setActiveView] = useState("map");
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);

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
    <TimeProvider>
      <div className="h-screen w-full bg-background text-foreground overflow-hidden dark">
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
              <MapContainer ref={mapRef} />
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

        {/* AI Chat Overlay */}
        <AIChat
          isOpen={aiChatOpen}
          onClose={handleAIChatClose}
        />
      </div>
    </TimeProvider>
  );
}
