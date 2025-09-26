"use client";

import { useState, useRef, useEffect } from "react";
import { MapContainer, type MapRef } from "@/components/map-container";
import { Sidebar } from "@/components/sidebar";
import { SettingsOverlay } from "@/components/overlays/settings-overlay";
import { Timeline } from "@/components/timeline";
import { TimeProvider } from "@/lib/time-context";
import { DataProvider, useData } from "@/lib/data-context";
import { AIChat } from "@/components/ai-chat";
import { AlertContainer } from "@/components/alerts/alert-container";
import { CrisisManagement } from "@/components/crisis-management";
import { DebugAgentPanel } from "@/components/debug-agent-panel";
import { MapSearch } from "@/components/map-search";
import { motion } from "framer-motion";
import { convertResourcesToPOIs, convertMonitoringStationsToPOIs, combinePOIs } from "@/utils/resource-to-poi";
import { blattentPOIs } from "@/data/pois";
import { useAlert } from "@/lib/alert-context";
import { setAlertContext, createLandslideAlert, setCrisisManagementCallback } from "@/lib/alert-service";
import { shouldShowPOIs, getCurrentPOIs, onPOIVisibilityChange, setDataContextRef, addBlatten, sendVehicle, addAllPOIs } from "@/lib/util";

// Component that uses data context
function MapWithData() {
  const { resources, monitoringStations, authorities, isLoading, addVehicleMovement } = useData();
  const alertContext = useAlert();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState("map");
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [crisisManagementOpen, setCrisisManagementOpen] = useState(false);
  const [crisisEvent, setCrisisEvent] = useState<any>(null);
  const [showPOIs, setShowPOIs] = useState(false);
  const [currentPOIs, setCurrentPOIs] = useState<any[]>([]);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
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

  // Demo alert for Blatten landslide
  useEffect(() => {
    const timer = setTimeout(() => {
      createLandslideAlert('Blatten, Valais', { lat: 46.4, lng: 7.5 });
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
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setDebugPanelOpen(!debugPanelOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
          <div className="absolute inset-0">
            <MapContainer ref={mapRef} pois={allPOIs} />
            
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

        </div>

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
      </div>

      {/* Overlays */}
      <SettingsOverlay
        isOpen={activeView === "settings"}
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
