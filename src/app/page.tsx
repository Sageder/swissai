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
import { AIChat } from "@/components/ai-chat";
import { AlertContainer } from "@/components/alerts/alert-container";
import { CrisisManagement } from "@/components/crisis-management";
import { DebugAgentPanel } from "@/components/debug-agent-panel";
import { ActionsSidePanel } from "@/components/actions-side-panel";
import { Button } from "@/components/ui/button";
import {
  convertResourcesToPOIs,
  convertMonitoringStationsToPOIs,
  combinePOIs,
} from "@/utils/resource-to-poi";
import { blattentPOIs } from "@/data/pois";
import { useAlert } from "@/lib/alert-context";
import {
  setAlertContext,
  createLandslideAlert,
  setCrisisManagementCallback,
} from "@/lib/alert-service";
import {
  shouldShowPOIs,
  getCurrentPOIs,
  onPOIVisibilityChange,
} from "@/lib/util";

function DashboardContent() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [dockHeight, setDockHeight] = useState(33); // percentage
  const [activeView, setActiveView] = useState("map");
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(
    null
  );
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [editingPolygon, setEditingPolygon] = useState<PolygonData | null>(
    null
  );
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [crisisManagementOpen, setCrisisManagementOpen] = useState(false);
  const [crisisEvent, setCrisisEvent] = useState<any>(null);
  const [showPOIs, setShowPOIs] = useState(false);
  const [currentPOIs, setCurrentPOIs] = useState<any[]>([]);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [actionsPanelOpen, setActionsPanelOpen] = useState(false);
  const [actionsPanelPolygon, setActionsPanelPolygon] = useState<PolygonData | null>(null);
  const mapRef = useRef<MapRef>(null);

  // Get alert context from hook
  const alertContext = useAlert();
  
  // Get data from context
  const { resources, monitoringStations } = useData();

  // Initialize alert context for programmatic use
  useEffect(() => {
    setAlertContext(alertContext);

    // Set up crisis management callback
    setCrisisManagementCallback((event) => {
      setCrisisEvent(event);
      setCrisisManagementOpen(true);
    });
  }, [alertContext]);

  // Demo alert for Blatten landslide
  useEffect(() => {
    const timer = setTimeout(() => {
      createLandslideAlert("Blatten, Valais", { lat: 46.4, lng: 7.5 });
    }, 2000); // Show alert 2 seconds after component mounts

    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut for debug panel (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        setDebugPanelOpen(!debugPanelOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [debugPanelOpen]);

  // Listen for POI visibility changes
  useEffect(() => {
    const unsubscribe = onPOIVisibilityChange(() => {
      setShowPOIs(shouldShowPOIs());
      setCurrentPOIs(getCurrentPOIs());
    });

    // Set initial state
    setShowPOIs(shouldShowPOIs());
    setCurrentPOIs(getCurrentPOIs());

    return unsubscribe;
  }, []);

  // Convert resources and monitoring stations to POIs and combine with static POIs
  const resourcePOIs = convertResourcesToPOIs(resources);
  const monitoringPOIs = convertMonitoringStationsToPOIs(monitoringStations);
  const staticPOIs = combinePOIs(blattentPOIs, resourcePOIs, monitoringPOIs);

  // Only show POIs if explicitly controlled by utility functions
  const allPOIs = showPOIs && currentPOIs.length > 0 ? currentPOIs : [];

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

  const handlePolygonClick = (
    polygon: PolygonData,
    clickPosition: { x: number; y: number }
  ) => {
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

  const handlePolygonUpdate = (
    polygonId: string,
    updatedPolygon: PolygonData
  ) => {
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

  const handleCrisisManagementClose = () => {
    setCrisisManagementOpen(false);
    setCrisisEvent(null);
  };

  const handleActionsOpen = (polygon: PolygonData) => {
    setActionsPanelPolygon(polygon);
    setActionsPanelOpen(true);
  };

  const handleActionsPanelClose = () => {
    setActionsPanelOpen(false);
    setActionsPanelPolygon(null);
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
              onActions={handleActionsOpen}
            />

            {/* Search Overlay - Positioned on the right side */}
            <div className="absolute top-4 right-4 z-40 flex gap-2">
              <MapSearch onLocationSelect={handleLocationSelect} />
              <Button
                onClick={() => setDebugPanelOpen(!debugPanelOpen)}
                variant="outline"
                size="sm"
                className="bg-gray-900/80 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Debug
              </Button>
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

          {/* Crisis Management Overlay */}
          <CrisisManagement
            isOpen={crisisManagementOpen}
            onClose={handleCrisisManagementClose}
            event={crisisEvent}
          />

          {/* Debug Agent Panel */}
          <DebugAgentPanel
            isOpen={debugPanelOpen}
            onClose={() => setDebugPanelOpen(false)}
          />

          {/* Actions Side Panel */}
          <ActionsSidePanel
            isOpen={actionsPanelOpen}
            onClose={handleActionsPanelClose}
            polygon={actionsPanelPolygon}
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

        {/* Alert Container */}
        <AlertContainer />
      </div>
    </TimeProvider>
  );
}

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  );
}
