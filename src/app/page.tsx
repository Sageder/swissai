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
import { LiveModeIndicator } from "@/components/live-mode-indicator";
import { Button } from "@/components/ui/button";
import { onPlanChange, isLiveModeActive as getLiveModeStatus, getVehiclePredictions, onLiveModeChange } from "@/lib/plan-store";
import {
    convertResourcesToPOIs,
    convertMonitoringStationsToPOIs,
    combinePOIs,
} from "@/utils/resource-to-poi";
import { blattentPOIs } from "@/data/pois";
import { useAlert } from "@/lib/alert-context";
import { setAlertContext, createLandslideAlert, setCrisisManagementCallback } from "@/lib/alert-service";
import { shouldShowPOIs, getCurrentPOIs, onPOIVisibilityChange, setDataContextRef, setTimelineRef, addBlatten, sendVehicle, sendHelicopter, addAllPOIs, setMapControlRef } from "@/lib/util";

function DashboardContent() {
    const { resources, monitoringStations, authorities, isLoading, addVehicleMovement, vehicleMovements } = useData();
    const alertContext = useAlert();
    const { getDisplayTime, timeOffset, setTimeOffset, isRealTimeEnabled, toggleRealTime } = useTime();
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
    const [liveMode, setLiveMode] = useState(false);
    const mapRef = useRef<MapRef>(null);

    const toggleLiveMode = () => {
        setLiveMode(!liveMode);
    };

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

    // Provide map control ref for util-driven camera moves
    useEffect(() => {
        if (mapRef.current && mapRef.current.flyToLocation) {
            setMapControlRef({
                flyToLocation: (coordinates: [number, number], zoom?: number) => {
                    mapRef.current?.flyToLocation(coordinates, zoom ?? 13);
                }
            });
        }
    }, [mapRef.current]);

    // Sync live mode with central live-mode module (accept plan triggers)
    useEffect(() => {
        const unsubscribe = onLiveModeChange((active) => setLiveMode(active));
        return unsubscribe;
    }, []);

    // When live mode turns on, execute pending vehicle predictions as movements
    useEffect(() => {
        if (!liveMode) return;
        try {
            const preds = getVehiclePredictions();
            if (!preds || preds.length === 0) return;
            // Ensure POIs are present for lookups
            addAllPOIs({ monitoringStations, resources, authorities });
            preds.forEach((p) => {
                if (p.vehicle === 'helicopter') {
                    void sendHelicopter(p.from, p.to, 20000);
                } else {
                    void sendVehicle(p.from, p.to, p.vehicle as any);
                }
            });
            // eslint-disable-next-line no-console
            console.log('[LiveMode] Executed', preds.length, 'vehicle predictions');
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Failed to execute vehicle predictions on live mode:', e);
        }
        // Only run once when liveMode flips to true with current inputs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveMode]);

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
        <div className={`h-screen w-full bg-background text-foreground overflow-hidden dark transition-all duration-300 ${getLiveModeStatus() ? 'border-4 border-red-500 border-dashed' : ''
            }`}>
            {/* Live Mode Vehicle Time Slider */}
            {getLiveModeStatus() && (vehicleMovements?.length || 0) > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[560px]">
                    <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 shadow-lg">
                        <div className="flex items-center gap-3">
                            <Button
                                size="sm"
                                className={`${isRealTimeEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                                onClick={() => toggleRealTime(!isRealTimeEnabled)}
                            >
                                {isRealTimeEnabled ? 'Pause' : 'Play'}
                            </Button>
                            <input
                                type="range"
                                min={0}
                                max={12}
                                step={0.01}
                                value={timeOffset}
                                onChange={(e) => {
                                    if (isRealTimeEnabled) toggleRealTime(false);
                                    const v = parseFloat(e.target.value);
                                    setTimeOffset(Number.isNaN(v) ? 0 : v);
                                }}
                                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-xs text-white/80 w-36 text-right tabular-nums">
                                {getDisplayTime().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
                    liveMode={liveMode}
                    onLiveModeToggle={toggleLiveMode}
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




            {/* Live Mode Indicator */}
            <LiveModeIndicator />
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