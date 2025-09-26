"use client";

import { useState, useRef, useEffect } from "react";
import { MapContainer, type MapRef } from "@/components/map-container";
import { Sidebar } from "@/components/sidebar";
import { BottomDock } from "@/components/bottom-dock";
import { SettingsOverlay } from "@/components/overlays/settings-overlay";
import { AnalyticsOverlay } from "@/components/overlays/analytics-overlay";
import { Timeline } from "@/components/timeline";
import { TimeProvider } from "@/lib/time-context";
// import { DataProvider, useData } from "@/lib/data-context";
import { MapSearch } from "@/components/map-search";
import { PolygonEditor, type PolygonData } from "@/components/polygon-editor";
import { PolygonPopup } from "@/components/polygon-popup";
// import { AIChat } from "@/components/ai-chat";
// import { AlertContainer } from "@/components/alerts/alert-container";
import { motion } from "framer-motion";
// import { convertResourcesToPOIs, convertMonitoringStationsToPOIs, combinePOIs } from "@/utils/resource-to-poi";
// import { blattentPOIs } from "@/data/pois";
// import { useAlert } from "@/lib/alert-context";
// import { setAlertContext, createLandslideAlert } from "@/lib/alert-service";
// import { shouldShowPOIs, getCurrentPOIs, onPOIVisibilityChange } from "@/lib/util";

export default function Dashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [dockHeight, setDockHeight] = useState(33); // percentage
  const [activeView, setActiveView] = useState("map");
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingPolygon, setEditingPolygon] = useState<PolygonData | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [showPOIs, setShowPOIs] = useState(false);
  const [currentPOIs, setCurrentPOIs] = useState<any[]>([]);
  const mapRef = useRef<MapRef>(null);

  // Simplified POI handling
  const allPOIs: any[] = [];

  const handleTerrainToggle = (enabled: boolean, exaggeration?: number) => {
    if (mapRef.current) {
      mapRef.current.toggleTerrain(enabled, exaggeration);
    }
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleLocationSelect = (
    coordinates: [number, number],
    name: string,
    boundingBox?: [number, number, number, number]
  ) => {
    if (mapRef.current) {
      mapRef.current.flyToLocation(coordinates, 14, boundingBox);
    }
  };

  const handleCloseOverlay = () => {
    setActiveView("map");
  };

  const handlePolygonComplete = (polygon: PolygonData) => {
    console.log("[Dashboard] Polygon completed:", polygon);
    console.log("[Dashboard] Polygon vertices:", polygon.vertices);
    console.log("[Dashboard] Adding polygon to map...");
    if (mapRef.current) {
      mapRef.current.addPolygon(polygon);
      console.log("[Dashboard] Polygon added to map successfully");
    } else {
      console.error("[Dashboard] MapRef is null, cannot add polygon");
    }
  };

  const handlePolygonClick = (polygon: PolygonData, clickPosition: { x: number; y: number }) => {
    console.log("[Dashboard] Polygon clicked:", polygon);
    setSelectedPolygon(polygon);
    setPopupPosition(clickPosition);
  };

  const handleClosePopup = () => {
    setSelectedPolygon(null);
    setPopupPosition(null);
  };

  const handleUpdatePolygonName = (polygonId: string, newName: string) => {
    console.log("[Dashboard] Updating polygon name:", polygonId, newName);
    if (mapRef.current) {
      mapRef.current.updatePolygon(polygonId, { name: newName });
    }
    // Update the selected polygon state
    if (selectedPolygon && selectedPolygon.id === polygonId) {
      setSelectedPolygon({ ...selectedPolygon, name: newName });
    }
  };

  const handleEditPolygon = (polygonId: string) => {
    console.log("[Dashboard] Edit polygon:", polygonId);
    
    // Find the polygon data
    const polygonToEdit = selectedPolygon;
    if (!polygonToEdit) {
      console.warn("[Dashboard] No polygon data found for editing");
      return;
    }
    
    // Remove the polygon from the map
    if (mapRef.current) {
      mapRef.current.removePolygon(polygonId);
    }
    
    // Set the polygon for editing
    setEditingPolygon(polygonToEdit);
    handleClosePopup();
    
    console.log("[Dashboard] Started editing polygon:", polygonToEdit);
  };

  const handlePolygonUpdate = (polygonId: string, updatedPolygon: PolygonData) => {
    console.log("[Dashboard] Polygon updated:", polygonId, updatedPolygon);
    
    // Add the updated polygon back to the map
    if (mapRef.current) {
      mapRef.current.addPolygon(updatedPolygon);
    }
    
    // Clear editing state
    setEditingPolygon(null);
  };

  const handleDeletePolygon = (polygonId: string) => {
    console.log("[Dashboard] Delete polygon:", polygonId);
    if (mapRef.current) {
      mapRef.current.removePolygon(polygonId);
    }
    handleClosePopup();
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
            <MapContainer 
              ref={mapRef} 
              pois={allPOIs}
              onPolygonClick={handlePolygonClick}
            />
          </motion.div>

            {/* Polygon Editor */}
            <PolygonEditor 
              onPolygonComplete={handlePolygonComplete}
              onPolygonUpdate={handlePolygonUpdate}
              editingPolygon={editingPolygon}
              mapRef={mapRef}
            />

            {/* Polygon Popup */}
            <PolygonPopup
              polygon={selectedPolygon}
              position={popupPosition}
              onClose={handleClosePopup}
              onUpdateName={handleUpdatePolygonName}
              onEdit={handleEditPolygon}
              onDelete={handleDeletePolygon}
            />

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

        {/* AI Chat Overlay - Commented out */}
        {/* <AIChat
          isOpen={aiChatOpen}
          onClose={handleAIChatClose}
        /> */}
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
    </TimeProvider>
  );
}
