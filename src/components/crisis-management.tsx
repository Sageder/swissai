'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Network } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import {
    getCrisisNodes,
    getCrisisConnections,
    onNodeEditorChange,
    initializeCrisisNodes,
    addCrisisConnection,
    addCrisisNode,
    removeCrisisNode,
    removeCrisisConnection
} from '@/lib/util';
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
            case 'alert': return 'border-orange-400 bg-orange-500/20';
            case 'monitoring': return 'border-blue-400 bg-blue-500/20';
            case 'response': return 'border-red-400 bg-red-500/20';
            case 'resource': return 'border-green-400 bg-green-500/20';
            case 'authority': return 'border-purple-400 bg-purple-500/20';
            default: return 'border-white/30 bg-white/10';
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

const nodeTypes: NodeTypes = {
    crisis: CrisisNode,
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        return crisisNodes.map((node) => ({
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
    }, [crisisNodes]);

    // Convert crisis connections to React Flow format
    const convertToReactFlowEdges = useMemo(() => {
        return crisisConnections.map((connection) => ({
            id: connection.id,
            source: connection.from,
            target: connection.to,
            type: 'smoothstep',
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


    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const initializeCrisisAnalysis = useCallback(async () => {
        setIsLoading(true);

        // Send initial crisis analysis request
        const crisisPrompt = `Analyze this crisis: ${event?.type || 'Emergency'} in ${event?.location || 'Unknown location'} (${event?.severity || 'Unknown'} severity). Provide situation summary, monitoring sources, and recommended actions.`;

        try {
            await sendMessage({ text: crisisPrompt });
        } catch (error) {
            console.error('Error sending initial crisis analysis:', error);
        } finally {
            setIsLoading(false);
        }
    }, [event, sendMessage]);

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
                await sendMessage({ text: input });
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
                                            <header className="border-b border-white/20 pb-4">
                                                <h1 className="text-2xl font-bold text-white mb-2">
                                                    Crisis Management Report
                                                </h1>
                                                <p className="text-sm text-white/70">
                                                    {event?.location} • {event?.timestamp ? new Date(event.timestamp).toLocaleString() : 'Active'}
                                                </p>
                                            </header>

                                            {/* AI Analysis Section */}
                                            <section>
                                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                    AI Situation Analysis
                                                </h2>

                                                {messages.filter(m => m.role === 'assistant').map((message, index) => (
                                                    <div key={`analysis-${message.id}-${index}`} className="mb-6">
                                                        <div className="text-sm text-white/90 leading-relaxed">
                                                            {message.parts.map((part, i) => {
                                                                if (part.type === 'text') {
                                                                    return (
                                                                        <div
                                                                            key={`analysis-part-${message.id}-${i}`}
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: part.text
                                                                                    .replace(/---/g, '') // Remove ---
                                                                                    .replace(/^#{1,} (.*?)$/gm, '<strong class="text-orange-400 font-semibold">$1</strong>') // Convert any # headers to bold
                                                                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400">$1</strong>')
                                                                                    .replace(/\n\n/g, '</p><p class="mt-3">')
                                                                                    .replace(/\n/g, '<br>')
                                                                                    .replace(/^/, '<p>')
                                                                                    .replace(/$/, '</p>')
                                                                            }}
                                                                        />
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}

                                                {isLoading && (
                                                    <div className="flex items-center gap-2 text-white/60 mb-4">
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                                        <span className="text-sm">AI is thinking...</span>
                                                    </div>
                                                )}
                                            </section>

                                            {/* User Questions Section - Only show actual user questions, not system prompts */}
                                            {messages.filter(m => m.role === 'user' && !m.parts.some(part =>
                                                part.type === 'text' && part.text.includes('Analyze this crisis:')
                                            )).length > 0 && (
                                                    <section>
                                                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                                            Questions & Responses
                                                        </h2>

                                                        <div className="space-y-4">
                                                            {messages.filter(m => m.role === 'user' && !m.parts.some(part =>
                                                                part.type === 'text' && part.text.includes('Analyze this crisis:')
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
                                                                            return (
                                                                                <div className="bg-white/5 rounded-lg p-3">
                                                                                    <p className="text-xs text-white/60 mb-2">AI Response:</p>
                                                                                    <div className="text-sm text-white/90">
                                                                                        {aiResponse.parts.map((part, i) => {
                                                                                            if (part.type === 'text') {
                                                                                                return (
                                                                                                    <div
                                                                                                        key={`response-${aiResponse.id}-${i}`}
                                                                                                        dangerouslySetInnerHTML={{
                                                                                                            __html: part.text
                                                                                                                .replace(/---/g, '') // Remove ---
                                                                                                                .replace(/^#{1,} (.*?)$/gm, '<strong class="text-orange-400 font-semibold">$1</strong>') // Convert any # headers to bold
                                                                                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400">$1</strong>')
                                                                                                                .replace(/\n\n/g, '</p><p class="mt-2">')
                                                                                                                .replace(/\n/g, '<br>')
                                                                                                                .replace(/^/, '<p>')
                                                                                                                .replace(/$/, '</p>')
                                                                                                        }}
                                                                                                    />
                                                                                                );
                                                                                            }
                                                                                            return null;
                                                                                        })}
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
                        className="fixed top-4 right-[400px] w-[600px] h-[500px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 resize overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">Crisis Response Graph Editor</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowGraphPopout(false)}
                                className="text-white/60 hover:text-white/80"
                            >
                                ✕
                            </Button>
                        </div>
                        <div className="h-[calc(100%-60px)]">
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
                                fitView
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
        </>
    );
};
