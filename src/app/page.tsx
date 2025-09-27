"use client";

import { useState, useRef, useEffect } from "react";
import { MapContainer, type MapRef } from "@/components/map-container";
import { Sidebar } from "@/components/sidebar";
import { SettingsOverlay } from "@/components/overlays/settings-overlay";
import { Timeline } from "@/components/timeline";
import { TimeProvider, useTime } from "@/lib/time-context";
import { DataProvider, useData } from "@/lib/data-context";
import { MapSearch } from "@/components/map-search";
import { PolygonEditor, type PolygonData } from "@/components/polygon-editor";
import { PolygonPopup } from "@/components/polygon-popup";
import { motion } from "framer-motion";
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
import { setAlertContext, createLandslideAlert, setCrisisManagementCallback } from "@/lib/alert-service";
import { shouldShowPOIs, getCurrentPOIs, onPOIVisibilityChange, setDataContextRef, setTimelineRef, addBlatten, sendVehicle, sendHelicopter, addAllPOIs } from "@/lib/util";

function DashboardContent() {
  const { resources, monitoringStations, authorities, isLoading, addVehicleMovement } = useData();
  const alertContext = useAlert();
  const { getDisplayTime } = useTime();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState("map");
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [editingPolygon, setEditingPolygon] = useState<PolygonData | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [crisisManagementOpen, setCrisisManagementOpen] = useState(false);
  const [crisisEvent, setCrisisEvent] = useState<any>(null);
  const [showPOIs, setShowPOIs] = useState(false);
  const [currentPOIs, setCurrentPOIs] = useState<any[]>([]);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [actionsPanelOpen, setActionsPanelOpen] = useState(false);
  const [actionsPanelPolygon, setActionsPanelPolygon] = useState<PolygonData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Initialize alert context for programmatic use
  useEffect(() => {
    setAlertContext(alertContext);

    // Set up crisis management callback
    setCrisisManagementCallback((event) => {
      setCrisisEvent(event);
      setCrisisManagementOpen(true);
    });
  }, [alertContext]);

  // Initialize data context reference for utility functions
  useEffect(() => {
    setDataContextRef({ addVehicleMovement });
  }, [addVehicleMovement]);

  // Initialize timeline reference for utility functions
  useEffect(() => {
    setTimelineRef({ getCurrentTime: getDisplayTime });
  }, [getDisplayTime]);

  // Demo alert for Blatten landslide
  useEffect(() => {
    const timer = setTimeout(() => {
      createLandslideAlert("Blatten, Valais", { lat: 46.4, lng: 7.5 });
    }, 2000); // Show alert 2 seconds after component mounts

    return () => clearTimeout(timer);
  }, []);

  // Demo vehicle movement scenario
  useEffect(() => {
    if (isLoading || resources.length === 0) return;

    const timer = setTimeout(() => {
      // Set up emergency scenario
      addAllPOIs({
        monitoringStations,
        resources,
        authorities
      });

      // Add Blatten city center
      addBlatten();

      // Wait a bit then send a vehicle from research station to Blatten
      setTimeout(async () => {
        const currentPOIs = getCurrentPOIs();
        const blattenPOI = currentPOIs.find(poi => poi.id === 'blatten-city-center');
        const researchPOI = currentPOIs.find(poi => poi.id === 'blatten-research-station');

        if (blattenPOI && researchPOI) {
          await sendVehicle(researchPOI.id, blattenPOI.id, 'fire_truck', 20000); // 20 second journey
        }
      }, 3000);
    }, 5000); // Start demo 5 seconds after component mounts

    return () => clearTimeout(timer);
  }, [isLoading, resources, monitoringStations, authorities]);

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


  const handleViewChange = (view: string) => {
    setActiveView(view);
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

  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
  };

  const handleLocationSelect = (coordinates: [number, number], name: string, boundingBox?: [number, number, number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyToLocation(coordinates, 14, boundingBox);
    }
    setSearchOpen(false);
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
            <div className="absolute inset-0">
              <MapContainer
                ref={mapRef}
                pois={allPOIs}
                onPolygonClick={handlePolygonClick}
              />

              {/* MapSearch Overlay - Centered */}
              {searchOpen && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                  <div className="pointer-events-auto">
                    <MapSearch
                      onLocationSelect={handleLocationSelect}
                      className="w-96"
                    />
                  </div>
                </div>
              )}
            </div>

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
          </div>

          {/* Sidebar */}
          <Sidebar
            expanded={sidebarExpanded}
            onToggle={() => setSidebarExpanded(!sidebarExpanded)}
            activeView={activeView}
            onViewChange={handleViewChange}
            onAIChatOpen={handleAIChatOpen}
            onDebugPanelOpen={() => setDebugPanelOpen(!debugPanelOpen)}
            onSearchOpen={handleSearchOpen}
          />

          {/* AI Chat Overlay */}
          <AIChat
            isOpen={aiChatOpen}
            onClose={handleAIChatClose}
          />

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
        />

        {/* Alert Container */}
        <AlertContainer />
      </div>
  );
}

export default function Dashboard() {
  return (
    <DataProvider>
      <TimeProvider>
        <DashboardContent />
      </TimeProvider>
    </DataProvider>
  );
}