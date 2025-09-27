'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Network, Search, Phone, Users, PhoneCall, Check, CircleDot } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import {
    getCrisisNodes,
    getCrisisConnections,
    onNodeEditorChange,
    initializeCrisisNodes,
    addCrisisConnection,
    addCrisisNode,
    removeCrisisNode,
    removeCrisisConnection,
    getPOIsWithContext
} from '@/lib/util';
import { createCrisisGraphFromLLM } from '@/lib/util';
import { useData } from '@/lib/data-context';
import { useTime } from '@/lib/time-context';
import { showOnlyMonitoringSources, showResourcesAndTour, sendVehicle, sendHelicopter, getCurrentPOIs } from '@/lib/util';
import { setCurrentPlanExport, setLiveMode, CrisisPlan } from '@/lib/plan-store';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    NodeTypes,
    EdgeTypes,
    BackgroundVariant,
    Panel,
    useReactFlow,
    ConnectionLineType,
    Handle,
    Position,
    BaseEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom styles for React Flow components
const reactFlowStyles = `
  .react-flow__controls {
    background: rgba(30, 41, 59, 0.9) !important;
    border: 1px solid #475569 !important;
    border-radius: 8px !important;
  }
  
  .react-flow__controls-button {
    background: #1e293b !important;
    color: #e2e8f0 !important;
    border: 1px solid #475569 !important;
    border-radius: 4px !important;
  }
  
  .react-flow__controls-button:hover {
    background: #334155 !important;
  }
  
  .react-flow__minimap {
    background: rgba(30, 41, 59, 0.9) !important;
    border: 1px solid #475569 !important;
    border-radius: 8px !important;
  }
  
  .react-flow__minimap-mask {
    fill: rgba(0, 0, 0, 0.1) !important;
  }
  
  .react-flow__minimap-node {
    fill: #6b7280 !important;
    stroke: #374151 !important;
  }
  
  .react-flow__handle {
    opacity: 0.7 !important;
    transition: all 0.2s ease !important;
  }
  
  .react-flow__handle:hover {
    opacity: 1 !important;
    transform: scale(1.2) !important;
  }
  
  .react-flow__handle-connecting {
    opacity: 1 !important;
    transform: scale(1.3) !important;
  }
`;

interface CrisisEvent {
    id: string;
    type: string;
    location: string;
    coordinates?: { lat: number; lng: number };
    severity: string;
    timestamp: string;
    description: string;
}

interface CrisisManagementProps {
    isOpen: boolean;
    onClose: () => void;
    event?: CrisisEvent;
}

// Custom Node Components
const CrisisNode = ({ data }: { data: any }) => {
    const getNodeColor = (type: string) => {
        switch (type) {
            case 'alert': return 'border-orange-500 bg-orange-700';
            case 'monitoring': return 'border-blue-500 bg-blue-700';
            case 'response': return 'border-red-500 bg-red-700';
            case 'resource': return 'border-green-500 bg-green-700';
            case 'authority': return 'border-purple-500 bg-purple-700';
            default: return 'border-slate-500 bg-slate-700';
        }
    };

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'high': return 'text-red-300';
            case 'medium': return 'text-yellow-300';
            case 'low': return 'text-green-300';
            default: return 'text-white/60';
        }
    };

    return (
        <div className={`px-4 py-2 shadow-lg rounded-lg border-2 min-w-[120px] relative ${getNodeColor(data.type)}`}>
            {/* Connection Handles */}
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                style={{
                    background: '#3b82f6',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left"
                style={{
                    background: '#3b82f6',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />
            <Handle
                type="source"
                position={Position.Top}
                id="top"
                style={{
                    background: '#3b82f6',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{
                    background: '#3b82f6',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />

            {/* Target Handles */}
            <Handle
                type="target"
                position={Position.Right}
                id="target-right"
                style={{
                    background: '#10b981',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="target-left"
                style={{
                    background: '#10b981',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />
            <Handle
                type="target"
                position={Position.Top}
                id="target-top"
                style={{
                    background: '#10b981',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="target-bottom"
                style={{
                    background: '#10b981',
                    width: 8,
                    height: 8,
                    border: '2px solid #1e293b'
                }}
            />

            <div className="text-xs font-medium text-white mb-1">
                {data.title}
            </div>
            <div className="text-[10px] text-white/80 mb-1">
                {data.description}
            </div>
            <div className={`text-[10px] ${getSeverityColor(data.severity)}`}>
                {data.severity ? `${data.severity} severity` : data.status}
            </div>
        </div>
    );
};

// Header node for column labels (non-interactive)
const HeaderNode = ({ data }: { data: any }) => {
    return (
        <div className="px-3 py-1 rounded-md border border-white/10 bg-white/5 text-[11px] tracking-wider uppercase text-white/70 shadow-sm backdrop-blur-sm">
            {data.label}
        </div>
    );
};

const nodeTypes: NodeTypes = {
    crisis: CrisisNode,
    header: HeaderNode,
};

// Custom orthogonal "highway" edge to route between columns without crossing nodes
const HighwayEdge = (props: any) => {
    const { id, sourceX, sourceY, targetX, targetY, markerEnd, style } = props;
    const midX = sourceX + (targetX - sourceX) / 2;
    const path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    return (
        <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
    );
};

const edgeTypes: EdgeTypes = {
    highway: HighwayEdge,
};


export const CrisisManagement: React.FC<CrisisManagementProps> = ({
    isOpen,
    onClose,
    event
}) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showGraphEditor, setShowGraphEditor] = useState(false);
    const [showGraphPopout, setShowGraphPopout] = useState(false);
    const [isPlanMinimized, setIsPlanMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const appliedToolMessageIds = useRef<Set<string>>(new Set());
    const appliedDispatchMessageIds = useRef<Set<string>>(new Set());
    const [opSteps, setOpSteps] = useState<{
        gatherMonitoring: 'pending' | 'in_progress' | 'done';
        contactMonitoring: 'pending' | 'in_progress' | 'done';
        gatherAuthorities: 'pending' | 'in_progress' | 'done';
        contactAuthorities: 'pending' | 'in_progress' | 'done';
    }>({
        gatherMonitoring: 'pending',
        contactMonitoring: 'pending',
        gatherAuthorities: 'pending',
        contactAuthorities: 'pending'
    });

    // Get data context for POI information
    const { monitoringStations, authorities, resources } = useData();
    const { getDisplayTime } = useTime();

    // Placeholder AI call for accepted plan
    const callAIWithPlan = useCallback((plan: CrisisPlan) => {
        console.log('AI plan submission (stub):', plan);
    }, []);

    // Predicted vehicle dispatches extracted from AI responses
    const [predictedDispatches, setPredictedDispatches] = useState<Array<{
        vehicle: 'ambulance' | 'fire_truck' | 'police' | 'helicopter' | 'evacuation_bus';
        from: string; // POI id
        to: string;   // POI id
    }>>([]);

    // Resolve a POI identifier that may be an id or human name to a concrete POI id
    const resolvePoiId = useCallback((input: string): string | null => {
        const pois = getCurrentPOIs();
        if (!Array.isArray(pois)) return null;
        // Exact id match
        const byId = pois.find((p: any) => p?.id === input);
        if (byId) return byId.id;
        // Case-insensitive title match
        const normalized = input.trim().toLowerCase();
        const byTitle = pois.find((p: any) => typeof p?.title === 'string' && p.title.trim().toLowerCase() === normalized);
        if (byTitle) return byTitle.id;
        // StartsWith or includes match as last resort
        const byLoose = pois.find((p: any) => typeof p?.title === 'string' && (p.title.toLowerCase().includes(normalized) || normalized.includes(p.title.toLowerCase())));
        return byLoose ? byLoose.id : null;
    }, []);

    // Use the same chat hook as AI Chat component
    const { messages, sendMessage } = useChat();

    // React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [crisisNodes, setCrisisNodes] = useState<any[]>([]);
    const [crisisConnections, setCrisisConnections] = useState<any[]>([]);

    // Connection mode state
    const [connectionType, setConnectionType] = useState<'data_flow' | 'response' | 'coordination' | 'dependency'>('data_flow');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Convert crisis nodes to React Flow format
    const convertToReactFlowNodes = useMemo(() => {
        const baseNodes = crisisNodes.map((node) => ({
            id: node.id,
            type: 'crisis',
            position: { x: node.position.x, y: node.position.y },
            data: {
                title: node.title,
                description: node.description,
                type: node.type,
                severity: node.severity,
                status: node.status,
            },
        }));

        // Compute header nodes for categories: alert -> monitoring -> response
        const categories: Array<'alert' | 'monitoring' | 'response'> = ['alert', 'monitoring', 'response'];
        const headerNodes: any[] = [];
        categories.forEach((cat) => {
            const group = crisisNodes.filter((n: any) => n.type === cat);
            if (group.length === 0) return;
            const minX = Math.min(...group.map((n: any) => n.position.x));
            const minY = Math.min(...group.map((n: any) => n.position.y));
            const headerY = Math.max(-20, minY - 60);
            headerNodes.push({
                id: `header-${cat}`,
                type: 'header',
                position: { x: minX, y: headerY },
                data: { label: cat === 'alert' ? 'Alert' : cat === 'monitoring' ? 'Monitoring' : 'Response' },
                draggable: false,
                selectable: false,
                connectable: false,
                focusable: false,
            });
        });

        return [...headerNodes, ...baseNodes];
    }, [crisisNodes]);

    // Convert crisis connections to React Flow format
    const convertToReactFlowEdges = useMemo(() => {
        return crisisConnections.map((connection) => ({
            id: connection.id,
            source: connection.from,
            target: connection.to,
            type: 'highway',
            animated: connection.status === 'active',
            style: {
                stroke: connection.type === 'data_flow' ? '#3b82f6' :
                    connection.type === 'response' ? '#ef4444' :
                        connection.type === 'coordination' ? '#10b981' :
                            connection.type === 'dependency' ? '#f59e0b' : '#6b7280',
                strokeWidth: 2,
            },
            label: connection.label,
        }));
    }, [crisisConnections]);

    // Load crisis nodes and connections
    useEffect(() => {
        const loadNodes = () => {
            setCrisisNodes(getCrisisNodes());
            setCrisisConnections(getCrisisConnections());
        };

        // Load initial nodes
        loadNodes();

        // Listen for changes
        const unsubscribe = onNodeEditorChange(loadNodes);

        return unsubscribe;
    }, []);

    // Update React Flow nodes and edges when crisis data changes
    useEffect(() => {
        setNodes(convertToReactFlowNodes);
        setEdges(convertToReactFlowEdges);
    }, [convertToReactFlowNodes, convertToReactFlowEdges, setNodes, setEdges]);

    // Connection validation
    const isValidConnection = useCallback((connection: Connection | Edge) => {
        // Allow all connections for now
        return true;
    }, []);

    // Handle new connections
    const onConnect = useCallback((params: Connection) => {
        if (!isValidConnection(params)) {
            console.log('Connection rejected:', params);
            return;
        }

        const connectionId = addCrisisConnection({
            from: params.source!,
            to: params.target!,
            type: connectionType,
            status: 'active',
            label: connectionType.replace('_', ' ').toUpperCase()
        });
        if (connectionId) {
            console.log('Created connection:', connectionId);
        }
    }, [connectionType, isValidConnection]);

    // Handle connection start (when user starts dragging from a node)
    const onConnectStart = useCallback((event: any, { nodeId }: any) => {
        console.log('Connection started from node:', nodeId);
    }, []);

    // Handle connection end (when user finishes dragging to a node)
    const onConnectEnd = useCallback((event: any, { nodeId }: any) => {
        console.log('Connection ended at node:', nodeId);
    }, []);


    // Parse LLM response to extract executive summary and detailed analysis
    const parseLLMResponse = useCallback((response: string) => {
        const executiveSummaryMatch = response.match(/EXECUTIVE SUMMARY:\s*([\s\S]*?)(?=DETAILED ANALYSIS:|$)/i);
        const detailedAnalysisMatch = response.match(/DETAILED ANALYSIS:\s*([\s\S]*?)$/i);

        const executiveSummary = executiveSummaryMatch ? executiveSummaryMatch[1].trim() : response;
        const detailedAnalysis = detailedAnalysisMatch ? detailedAnalysisMatch[1].trim() : '';

        return { executiveSummary, detailedAnalysis };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Parse vehicle dispatch predictions from assistant messages
    useEffect(() => {
        messages.forEach((m) => {
            if (m.role !== 'assistant') return;
            if (appliedDispatchMessageIds.current.has(m.id)) return;
            const fullText = m.parts.map((part: any) => part?.type === 'text' ? part.text : '').join('');
            const marker = 'VEHICLE_PREDICTIONS_JSON:';
            const idx = fullText.indexOf(marker);
            if (idx === -1) return;
            try {
                const after = fullText.slice(idx + marker.length);
                const jsonMatch = after.match(/\[[\s\S]*?\]/);
                if (!jsonMatch) return;
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    const allowed = new Set(['ambulance', 'fire_truck', 'police', 'helicopter', 'evacuation_bus']);
                    const sanitized = parsed
                        .filter((d: any) => d && typeof d === 'object')
                        .map((d: any) => ({
                            vehicle: (typeof d.vehicle === 'string' && allowed.has(d.vehicle)) ? d.vehicle : undefined,
                            from: typeof d.from === 'string' ? d.from : undefined,
                            to: typeof d.to === 'string' ? d.to : undefined,
                        }))
                        .filter((d: any) => d.vehicle && d.from && d.to) as Array<{ vehicle: 'ambulance' | 'fire_truck' | 'police' | 'helicopter' | 'evacuation_bus'; from: string; to: string; }>;
                    if (sanitized.length > 0) {
                        setPredictedDispatches(sanitized);
                        appliedDispatchMessageIds.current.add(m.id);
                        console.log('Parsed VEHICLE_PREDICTIONS_JSON:', sanitized);
                    }
                }
            } catch (err) {
                console.error('Failed to parse VEHICLE_PREDICTIONS_JSON:', err);
            }
        });
    }, [messages]);

    // Apply graph updates from tool results (tool-crisis_graph)
    useEffect(() => {
        messages.forEach((m) => {
            if (m.role !== 'assistant') return;
            if (appliedToolMessageIds.current.has(m.id)) return;
            const toolParts = m.parts.filter((p: any) => p?.type === 'tool-crisis_graph');
            if (toolParts.length === 0) return;
            toolParts.forEach((part: any) => {
                try {
                    const result = part?.result || part?.output || part?.data;
                    const graphData = result?.graphData || result;
                    if (graphData?.nodes && graphData?.connections) {
                        createCrisisGraphFromLLM(graphData);
                        appliedToolMessageIds.current.add(m.id);
                        // Auto-open the graph editor when a graph is created/updated
                        setShowGraphPopout(true);
                        // Mark contacting authorities as done when graph is applied
                        setOpSteps(s => ({ ...s, contactAuthorities: 'done' }));
                    }
                } catch (err) {
                    console.error('Failed to apply crisis graph from tool result:', err);
                }
            });
        });
    }, [messages]);

    // Create POI context for LLM
    const createPOIContext = useCallback(() => {
        const allPOIs = getPOIsWithContext(monitoringStations, authorities, resources);

        // Group POIs by category for better organization
        const monitoringPOIs = allPOIs.filter(poi => poi.category === 'monitoring');
        const resourcePOIs = allPOIs.filter(poi => poi.category === 'resource');
        const authorityPOIs = allPOIs.filter(poi => poi.category === 'authority');
        const activePOIs = allPOIs.filter(poi => poi.status === 'active');
        const highSeverityPOIs = allPOIs.filter(poi => poi.severity === 'high');

        return {
            totalPOIs: allPOIs.length,
            monitoring: {
                count: monitoringPOIs.length,
                stations: monitoringPOIs.map(poi => ({
                    id: poi.id,
                    name: poi.title,
                    type: poi.metadata.specializations?.[0] || 'unknown',
                    status: poi.status,
                    severity: poi.severity,
                    location: poi.location.name,
                    organization: poi.metadata.organization,
                    connectivity: poi.metadata.connectivity
                }))
            },
            resources: {
                count: resourcePOIs.length,
                facilities: resourcePOIs.map(poi => ({
                    id: poi.id,
                    name: poi.title,
                    type: poi.type,
                    status: poi.status,
                    severity: poi.severity,
                    location: poi.location.name,
                    personnel: poi.metadata.personnel,
                    equipment: poi.metadata.equipment,
                    currentAssignment: poi.metadata.currentAssignment
                }))
            },
            authorities: {
                count: authorityPOIs.length,
                agencies: authorityPOIs.map(poi => ({
                    id: poi.id,
                    name: poi.title,
                    type: poi.metadata.organization,
                    level: poi.metadata.level,
                    status: poi.status,
                    severity: poi.severity,
                    jurisdiction: poi.metadata.jurisdiction,
                    specializations: poi.metadata.specializations,
                    contact: poi.contact
                }))
            },
            activeInfrastructure: {
                count: activePOIs.length,
                facilities: activePOIs.map(poi => ({
                    name: poi.title,
                    category: poi.category,
                    type: poi.type,
                    location: poi.location.name,
                    coordinates: poi.coordinates
                }))
            },
            criticalAssets: {
                count: highSeverityPOIs.length,
                facilities: highSeverityPOIs.map(poi => ({
                    name: poi.title,
                    category: poi.category,
                    severity: poi.severity,
                    status: poi.status,
                    location: poi.location.name
                }))
            }
        };
    }, [monitoringStations, authorities, resources]);

    const initializeCrisisAnalysis = useCallback(async () => {
        setIsLoading(true);

        // Get POI context for the LLM
        const poiContext = createPOIContext();

        // Create comprehensive crisis analysis prompt with POI context
        const crisisPrompt = `You are a crisis management AI assistant with access to the following infrastructure and resources:

CRISIS SITUATION:
- Type: ${event?.type || 'Emergency'}
- Location: ${event?.location || 'Unknown location'}
- Severity: ${event?.severity || 'Unknown'}
- Description: ${event?.description || 'No additional details provided'}

AVAILABLE INFRASTRUCTURE (${poiContext.totalPOIs} total assets):

MONITORING CAPABILITIES (${poiContext.monitoring.count} stations):
${poiContext.monitoring.stations.map(station =>
            `- ${station.name} (${station.type}) - Status: ${station.status}, Severity: ${station.severity}, Location: ${station.location}, Organization: ${station.organization}, Connectivity: ${station.connectivity}`
        ).join('\n')}

RESOURCE ASSETS (${poiContext.resources.count} facilities):
${poiContext.resources.facilities.map(resource =>
            `- ${resource.name} (${resource.type}) - Status: ${resource.status}, Personnel: ${resource.personnel || 'N/A'}, Equipment: ${resource.equipment?.join(', ') || 'N/A'}, Assignment: ${resource.currentAssignment || 'None'}`
        ).join('\n')}

AUTHORITY AGENCIES (${poiContext.authorities.count} agencies):
${poiContext.authorities.agencies.map(authority =>
            `- ${authority.name} (${authority.type}) - Level: ${authority.level}, Status: ${authority.status}, Jurisdiction: ${authority.jurisdiction}, Specializations: ${authority.specializations?.join(', ') || 'N/A'}`
        ).join('\n')}

ACTIVE INFRASTRUCTURE (${poiContext.activeInfrastructure.count} facilities):
${poiContext.activeInfrastructure.facilities.map(facility =>
            `- ${facility.name} (${facility.category}/${facility.type}) - Location: ${facility.location}`
        ).join('\n')}

CRITICAL ASSETS (${poiContext.criticalAssets.count} high-priority facilities):
${poiContext.criticalAssets.facilities.map(asset =>
            `- ${asset.name} (${asset.category}) - Severity: ${asset.severity}, Status: ${asset.status}, Location: ${asset.location}`
        ).join('\n')}

Based on this comprehensive infrastructure data, provide your response in TWO PARTS:

PART 1 - EXECUTIVE SUMMARY (displayed to users):
Provide a concise bullet-point summary with 3-5 key action items that can be immediately implemented. Keep this section brief and actionable.

PART 2 - DETAILED ANALYSIS (saved for reference):
Provide a comprehensive analysis including:
1. SITUATION ASSESSMENT: Analyze the crisis severity and immediate threats
2. MONITORING RECOMMENDATIONS: Which monitoring stations should be prioritized
3. RESOURCE DEPLOYMENT: Which resources should be activated and where
4. AUTHORITY COORDINATION: Which agencies should be involved and their roles
5. CRISIS RESPONSE PLAN: Step-by-step action plan using available assets
6. COMMUNICATION STRATEGY: How to coordinate between different agencies and resources

Vehicle dispatch capability: You can propose vehicle movements using only these vehicle types: [ambulance, fire_truck, police, helicopter, evacuation_bus]. Use EXACT POI ids when specifying origins and destinations (POI ids are included below in the infrastructure lists).

Format your response as:
EXECUTIVE SUMMARY:
[Your bullet points here]

DETAILED ANALYSIS:
[Your comprehensive analysis here]

VEHICLE_PREDICTIONS_JSON:
[{"vehicle":"ambulance","from":"<poi-id>","to":"<poi-id>"}]

Focus on practical, actionable recommendations based on the actual available infrastructure.`;

        try {
            // 1) Immediately highlight monitoring sources (system-controlled)
            setOpSteps(s => ({ ...s, gatherMonitoring: 'in_progress' }));
            showOnlyMonitoringSources(monitoringStations);
            setOpSteps(s => ({ ...s, gatherMonitoring: 'done', contactMonitoring: 'in_progress' }));

            // 2) Immediately show key resources and briefly tour them (system-controlled)
            //    This tours available resources; adjust zoom/delay as needed
            showResourcesAndTour(resources, 11, 800);
            setOpSteps(s => ({ ...s, contactMonitoring: 'done', gatherAuthorities: 'in_progress' }));

            // 3) Send the LLM prompt to produce executive summary and plan graph via tool call
            await sendMessage({ text: crisisPrompt });
            setOpSteps(s => ({ ...s, gatherAuthorities: 'done', contactAuthorities: 'in_progress' }));
        } catch (error) {
            console.error('Error sending initial crisis analysis:', error);
        } finally {
            setIsLoading(false);
            // Finalize if not already moved to done by tool callback
            setTimeout(() => setOpSteps(s => ({ ...s, contactAuthorities: s.contactAuthorities === 'in_progress' ? 'done' : s.contactAuthorities })), 500);
        }
    }, [event, sendMessage, createPOIContext, monitoringStations, resources]);

    // Initialize crisis analysis when opened with an event
    useEffect(() => {
        if (isOpen && event && !hasInitialized) {
            setHasInitialized(true);
            initializeCrisisAnalysis();
        } else if (!isOpen) {
            setHasInitialized(false);
        }
    }, [isOpen, event, hasInitialized, initializeCrisisAnalysis]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            setIsLoading(true);
            try {
                // Get current POI context for enhanced responses
                const poiContext = createPOIContext();

                // Enhance user message with POI context
                const enhancedMessage = `${input}

CURRENT INFRASTRUCTURE CONTEXT:
- Total Assets: ${poiContext.totalPOIs}
- Active Monitoring: ${poiContext.monitoring.count} stations
- Available Resources: ${poiContext.resources.count} facilities  
- Authority Agencies: ${poiContext.authorities.count} agencies
- Active Infrastructure: ${poiContext.activeInfrastructure.count} facilities
- Critical Assets: ${poiContext.criticalAssets.count} high-priority facilities

Please provide specific recommendations based on the available infrastructure.`;

                await sendMessage({ text: enhancedMessage });
                setInput('');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed right-0 top-0 h-full w-96 bg-black/40 backdrop-blur-xl border-l border-white/20 z-40 flex flex-col"
                >





                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between p-4 border-b border-white/20">
                        <Button
                            variant="ghost"
                            onClick={() => setShowGraphPopout(!showGraphPopout)}
                            className="flex-1 justify-start text-white/80 hover:text-white hover:bg-white/10"
                        >
                            <Network className="w-4 h-4 mr-2" />
                            {showGraphPopout ? 'Hide Graph Editor' : 'Show Graph Editor'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-white/40 hover:text-white/60 ml-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Chat Messages */}
                        <div className="flex-1 min-h-0">
                            <ScrollArea className="h-full p-4">
                                <div className="prose prose-invert max-w-none">
                                    {messages.length > 0 && (
                                        <div className="space-y-6">
                                            {/* Main Header */}
                                            <header className="border-b border-white/20 pb-3 pt-3">
                                                <h1 className="text-2xl font-bold text-white">
                                                    Crisis Management Report
                                                </h1>
                                                <p className="text-sm text-white/70">
                                                    {event?.location} • {event?.timestamp ? new Date(event.timestamp).toLocaleString() : 'Active'}
                                                </p>
                                            </header>


                                            {/* Operational Steps - prominent, below header, neutral colors, animated like LLM thinking */}
                                            <div className="border-b border-white/10 pb-4">
                                                <div className="flex flex-wrap items-center gap-6 text-sm">
                                                    {[
                                                        { key: 'gatherMonitoring', label: 'Gathering monitoring sources', icon: Search },
                                                        { key: 'contactMonitoring', label: 'Contacting monitoring sources', icon: Phone },
                                                        { key: 'gatherAuthorities', label: 'Gathering authorities', icon: Users },
                                                        { key: 'contactAuthorities', label: 'Contacting authorities', icon: PhoneCall },
                                                    ].map((step: any, idx: number) => {
                                                        const state = (opSteps as any)[step.key];
                                                        const Icon = step.icon;
                                                        const isDone = state === 'done';
                                                        const isRunning = state === 'in_progress';
                                                        return (
                                                            <div key={step.key} className="flex items-center gap-3 text-white/80">
                                                                <div className="relative flex items-center justify-center">
                                                                    {/* icon capsule */}
                                                                    <div className={`w-8 h-8 rounded-full border border-white/25 bg-white/5 flex items-center justify-center ${isDone ? 'animate-pop-in' : ''}`}>
                                                                        {isDone ? (
                                                                            <Check className="w-4 h-4 text-white/80" />
                                                                        ) : (
                                                                            <Icon className="w-4 h-4 text-white/70" />
                                                                        )}
                                                                    </div>
                                                                    {/* spinner ring for in-progress */}
                                                                    {isRunning && (
                                                                        <div className="pointer-events-none absolute w-8 h-8 rounded-full animate-think-spin" style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.15)', borderTop: '2px solid rgba(255,255,255,0.7)' }} />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="leading-tight whitespace-nowrap">{step.label}</span>
                                                                    {isRunning && (
                                                                        <span className="inline-flex items-center ml-1">
                                                                            <span className="w-1 h-1 rounded-full bg-white/70 mr-1 animate-dots"></span>
                                                                            <span className="w-1 h-1 rounded-full bg-white/60 mr-1 animate-dots" style={{ animationDelay: '0.2s' }}></span>
                                                                            <span className="w-1 h-1 rounded-full bg-white/50 animate-dots" style={{ animationDelay: '0.4s' }}></span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* connector shimmer */}
                                                                {idx < 3 && (
                                                                    <div className="hidden md:block w-10 h-[2px] bg-white/10 rounded overflow-hidden">
                                                                        {(isRunning || isDone) && <div className="h-full w-1/2 bg-white/25 animate-shimmer" />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* AI Analysis Section */}
                                            <section>
                                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                    AI Situation Analysis
                                                </h2>

                                                {messages.filter(m => m.role === 'assistant').map((message, index) => {
                                                    const fullText = message.parts.map(part => part.type === 'text' ? part.text : '').join('');
                                                    const { executiveSummary } = parseLLMResponse(fullText);

                                                    // Extract bullet points: lines starting with -, •, *, or numbered 1.
                                                    const lines = executiveSummary.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                                                    const bullets = lines.filter(l => /^[-•*]\s+/.test(l) || /^\d+\.\s+/.test(l))
                                                        .map(l => l.replace(/^([-•*]|\d+\.)\s+/, ''))
                                                        .slice(0, 8);

                                                    return (
                                                        <div key={`analysis-${message.id}-${index}`} className="mb-6">
                                                            {bullets.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    <div className="text-xs uppercase tracking-wider text-white/50">Executive Summary</div>
                                                                    <ul className="space-y-2">
                                                                        {bullets.map((b, i) => (
                                                                            <li key={`bullet-${i}`} className="list-disc list-inside text-white/90 text-sm leading-relaxed">
                                                                                {b}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-white/90 leading-relaxed">
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: executiveSummary
                                                                                .replace(/---/g, '')
                                                                                .replace(/^#{1,} (.*?)$/gm, '<strong class="text-orange-400 font-semibold">$1</strong>')
                                                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400">$1</strong>')
                                                                                .replace(/\n\n/g, '</p><p class="mt-3">')
                                                                                .replace(/\n/g, '<br>')
                                                                                .replace(/^/, '<p>')
                                                                                .replace(/$/, '</p>')
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {isLoading && (
                                                    <div className="flex items-center gap-2 text-white/60 mb-4">
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                                        <span className="text-sm">AI is thinking...</span>
                                                    </div>
                                                )}
                                            </section>

                                            {/* Detailed analysis is not rendered; only short summary is shown */}

                                            {/* User Questions Section - Only show actual user questions, not system prompts */}
                                            {messages.filter(m => m.role === 'user' && !m.parts.some(part =>
                                                part.type === 'text' && (
                                                    part.text.includes('Analyze this crisis:') ||
                                                    part.text.includes('You are a crisis management AI assistant') ||
                                                    part.text.includes('AVAILABLE INFRASTRUCTURE') ||
                                                    part.text.includes('MONITORING CAPABILITIES') ||
                                                    part.text.includes('RESOURCE ASSETS') ||
                                                    part.text.includes('AUTHORITY AGENCIES') ||
                                                    part.text.includes('CURRENT INFRASTRUCTURE CONTEXT')
                                                )
                                            )).length > 0 && (
                                                    <section>
                                                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                                            Questions & Responses
                                                        </h2>

                                                        <div className="space-y-4">
                                                            {messages.filter(m => m.role === 'user' && !m.parts.some(part =>
                                                                part.type === 'text' && (
                                                                    part.text.includes('Analyze this crisis:') ||
                                                                    part.text.includes('You are a crisis management AI assistant') ||
                                                                    part.text.includes('AVAILABLE INFRASTRUCTURE') ||
                                                                    part.text.includes('MONITORING CAPABILITIES') ||
                                                                    part.text.includes('RESOURCE ASSETS') ||
                                                                    part.text.includes('AUTHORITY AGENCIES') ||
                                                                    part.text.includes('CURRENT INFRASTRUCTURE CONTEXT')
                                                                )
                                                            )).map((message, index) => (
                                                                <div key={`question-${message.id}-${index}`} className="border-l-2 border-white/30 pl-4">
                                                                    <h3 className="text-sm font-medium text-white/90 mb-2">
                                                                        Question {index + 1}
                                                                    </h3>
                                                                    <p className="text-sm text-white/80 mb-3">
                                                                        {message.parts.map((part, i) => {
                                                                            if (part.type === 'text') {
                                                                                return part.text;
                                                                            }
                                                                            return null;
                                                                        }).join('')}
                                                                    </p>

                                                                    {/* Find corresponding AI response */}
                                                                    {(() => {
                                                                        const userIndex = messages.findIndex(m => m.id === message.id);
                                                                        const aiResponse = messages[userIndex + 1];
                                                                        if (aiResponse && aiResponse.role === 'assistant') {
                                                                            // Parse the AI response to extract executive summary
                                                                            const fullText = aiResponse.parts.map(part => part.type === 'text' ? part.text : '').join('');
                                                                            const { executiveSummary } = parseLLMResponse(fullText);

                                                                            return (
                                                                                <div className="bg-white/5 rounded-lg p-3">
                                                                                    <p className="text-xs text-white/60 mb-2">AI Response:</p>
                                                                                    <div className="text-sm text-white/90">
                                                                                        <div
                                                                                            dangerouslySetInnerHTML={{
                                                                                                __html: executiveSummary
                                                                                                    .replace(/---/g, '') // Remove ---
                                                                                                    .replace(/^#{1,} (.*?)$/gm, '<strong class="text-orange-400 font-semibold">$1</strong>') // Convert any # headers to bold
                                                                                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400">$1</strong>')
                                                                                                    .replace(/\n\n/g, '</p><p class="mt-2">')
                                                                                                    .replace(/\n/g, '<br>')
                                                                                                    .replace(/^/, '<p>')
                                                                                                    .replace(/$/, '</p>')
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}

                                        </div>
                                    )}

                                    {messages.length === 0 && !isLoading && (
                                        <div className="text-center text-white/60 py-8">
                                            <div className="text-4xl mb-4">🚨</div>
                                            <h2 className="text-lg font-medium mb-2">Crisis Management Ready</h2>
                                            <p className="text-sm">Ask questions about the emergency situation below.</p>
                                        </div>
                                    )}
                                </div>
                                <div ref={messagesEndRef} />
                            </ScrollArea>
                        </div>


                        {/* Input */}
                        <div className="p-4 border-t border-white/20">
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about the crisis situation..."
                                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-orange-400"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    size="sm"
                                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                                >
                                    Send
                                </Button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Graph Editor Popout Window */}
            <AnimatePresence>
                {showGraphPopout && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 resize overflow-hidden transition-all duration-300 ${isPlanMinimized
                            ? 'bottom-4 right-4 w-[400px] h-[200px]'
                            : 'top-4 w-[780px] h-[600px]'
                            }`}
                        style={!isPlanMinimized ? { right: 'calc(24rem + 16px)' } : {}}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-white">Suggested plan</h3>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                    onClick={async () => {
                                        // Export current plan
                                        const plan = {
                                            nodes: getCrisisNodes(),
                                            connections: getCrisisConnections(),
                                            acceptedAt: getDisplayTime().getTime(),
                                            title: 'Crisis Response Plan',
                                            description: 'AI-generated crisis response plan'
                                        };
                                        setCurrentPlanExport(plan);
                                        // Call AI with the accepted plan (stubbed)
                                        callAIWithPlan(plan);
                                        // Send predicted vehicle movements if available
                                        if (predictedDispatches.length > 0) {
                                            for (const d of predictedDispatches) {
                                                try {
                                                    const fromId = resolvePoiId(d.from);
                                                    const toId = resolvePoiId(d.to);
                                                    if (!fromId || !toId) {
                                                        console.warn('Skipping dispatch due to unresolved POI:', d);
                                                        continue;
                                                    }
                                                    if (d.vehicle === 'helicopter') {
                                                        await sendHelicopter(fromId, toId);
                                                    } else {
                                                        await sendVehicle(fromId, toId, d.vehicle);
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to send predicted dispatch:', d, err);
                                                }
                                            }
                                        }
                                        // Minimize and enable live mode
                                        setIsPlanMinimized(true);
                                        // Close graph editor
                                        setShowGraphPopout(false);
                                        setLiveMode(true);
                                    }}
                                >
                                    Accept plan
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowGraphPopout(false)}
                                className="text-white/60 hover:text-white/80"
                            >
                                ✕
                            </Button>
                        </div>
                        <div className={`transition-all duration-300 ${isPlanMinimized ? 'h-[calc(100%-60px)] opacity-60' : 'h-[calc(100%-60px)]'}`}>
                            <style dangerouslySetInnerHTML={{ __html: reactFlowStyles }} />
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onConnectStart={onConnectStart}
                                onConnectEnd={onConnectEnd}
                                isValidConnection={isValidConnection}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                fitView
                                fitViewOptions={{ padding: 0.04 }}
                                className="bg-slate-900"
                                connectionLineType={ConnectionLineType.SmoothStep}
                                connectionLineStyle={{
                                    strokeWidth: 2,
                                    stroke: connectionType === 'data_flow' ? '#3b82f6' :
                                        connectionType === 'response' ? '#ef4444' :
                                            connectionType === 'coordination' ? '#10b981' :
                                                connectionType === 'dependency' ? '#f59e0b' : '#3b82f6',
                                }}
                            >
                                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                                <Controls />

                            </ReactFlow>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Local styles for thinking animations */}
            <style>{`
              @keyframes thinkRing {
                0% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.05); opacity: 0.9; }
                100% { transform: scale(0.95); opacity: 0.5; }
              }
              .animate-think-ring { animation: thinkRing 1.6s ease-in-out infinite; }
              .animate-pulse-slow { animation: pulse 2s ease-in-out infinite; }
              @keyframes thinkSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .animate-think-spin { animation: thinkSpin 1.2s linear infinite; border-radius: 9999px; }
              @keyframes dots {
                0%, 80%, 100% { transform: translateY(0); opacity: .5; }
                40% { transform: translateY(-2px); opacity: 1; }
              }
              .animate-dots { animation: dots 1.2s infinite ease-in-out; }
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .animate-shimmer { animation: shimmer 1.6s linear infinite; }
              @keyframes popIn {
                0% { transform: scale(0.9); opacity: 0.6; }
                60% { transform: scale(1.05); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              .animate-pop-in { animation: popIn .3s ease-out; }
            `}</style>
        </>
    );
};
