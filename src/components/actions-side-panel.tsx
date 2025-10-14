"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  AlertTriangle, 
  Clock, 
  Users, 
  Phone, 
  Truck, 
  MapPin,
  Zap,
  Loader2,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from '@ai-sdk/react';
import type { PolygonData } from "./polygon-editor";

interface ActionsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  polygon: PolygonData | null;
  embedded?: boolean; // When true, renders without slide-in animation and close button
}

interface EmergencyAction {
  id: string;
  category: "evacuation" | "medical" | "communication" | "resources" | "coordination";
  title: string;
  description: string;
  priority: "immediate" | "high" | "medium" | "low";
  timeline: string;
  resources?: string[];
}

interface EmergencyResponse {
  situation: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  actions: EmergencyAction[];
  timeline: {
    immediate: EmergencyAction[];
    shortTerm: EmergencyAction[];
    longTerm: EmergencyAction[];
  };
  nearbyResources: string[];
}

const categoryIcons = {
  evacuation: Users,
  medical: AlertTriangle,
  communication: Phone,
  resources: Truck,
  coordination: MapPin,
};

const priorityColors = {
  immediate: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-green-500 text-white",
};

const riskLevelColors = {
  low: "text-green-600 bg-green-100",
  medium: "text-yellow-600 bg-yellow-100",
  high: "text-orange-600 bg-orange-100",
  critical: "text-red-600 bg-red-100",
};

export function ActionsSidePanel({ isOpen, onClose, polygon, embedded = false }: ActionsSidePanelProps) {
  const [response, setResponse] = useState<EmergencyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showGraphEditor, setShowGraphEditor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the same chat hook as CrisisManagement
  const { messages, sendMessage } = useChat();

  // Graph editor state
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Graph editor functions
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializePolygonAnalysis = useCallback(async () => {
    if (!polygon) {
      console.log('No polygon/context provided');
      return;
    }

    setIsLoading(true);

    // Check if this is a polygon or a crisis event
    const isPolygon = polygon?.vertices !== undefined;
    const isCrisisEvent = (polygon as any)?.type === 'crisis' || (polygon as any)?.severity !== undefined;

    let analysisPrompt = '';

    if (isPolygon) {
      // Polygon analysis
      analysisPrompt = `EMERGENCY POLYGON ANALYSIS REQUEST

**Polygon Details:**
- Name: ${polygon.name || 'Emergency Zone'}
- Vertices: ${polygon.vertices?.length || 0} coordinate points
- Coordinates: ${JSON.stringify(polygon.vertices || [])}
- Area ID: ${polygon.id || 'unknown'}
- Color: ${polygon.color || 'default'}

**Analysis Required:**
1. Assess the geographic area defined by these coordinates
2. Estimate population and vulnerable groups in this area
3. Identify potential risks and hazards
4. Recommend immediate emergency actions
5. Suggest resource deployment and vehicle dispatch
6. Plan evacuation routes and shelter locations
7. Set up communication infrastructure if needed
8. Draft mass notification messages for residents

**Context:** This is a Swiss Alpine region emergency management scenario. Consider terrain, weather, and local infrastructure. Use your tools to gather data, dispatch resources, and coordinate response efforts.

Please provide a comprehensive emergency response plan with specific actionable recommendations.`;
    } else {
      // Crisis event analysis
      analysisPrompt = `CRISIS EVENT ANALYSIS REQUEST

**Event Details:**
${JSON.stringify(polygon, null, 2)}

**Analysis Required:**
1. Assess the crisis situation and severity
2. Identify immediate threats and risks
3. Recommend emergency response actions
4. Suggest resource deployment and coordination
5. Plan evacuation and shelter strategies
6. Set up communication and notification systems
7. Coordinate with relevant authorities

**Context:** This is a Swiss Alpine region emergency management scenario. Use your tools to gather data, dispatch resources, and coordinate response efforts.

Please provide a comprehensive crisis response plan with specific actionable recommendations.`;
    }

    try {
      console.log("Sending message to AI:", analysisPrompt.substring(0, 100) + "...");
      await sendMessage({ text: analysisPrompt });
      console.log("Message sent successfully");
    } catch (error) {
      console.error('Error sending initial analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }, [polygon, sendMessage]);

  // Initialize polygon analysis when opened with a polygon
  useEffect(() => {
    if (isOpen && polygon && !hasInitialized) {
      setHasInitialized(true);
      initializePolygonAnalysis();
    } else if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen, polygon, hasInitialized, initializePolygonAnalysis]);

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

  const generateEmergencyResponse = async (polygonData: PolygonData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const prompt = `You are an emergency response AI assistant. Analyze this emergency polygon area and generate comprehensive emergency response recommendations.

Polygon Details:
- Name: ${polygonData.name}
- Area ID: ${polygonData.id}
- Vertices: ${polygonData.vertices.length} points
- Coordinates: ${JSON.stringify(polygonData.vertices)}

Please provide:
1. Situation assessment and risk level
2. Prioritized emergency actions by category (evacuation, medical, communication, resources, coordination)
3. Timeline breakdown (immediate, short-term, long-term actions)
4. Nearby resource recommendations

Respond ONLY with valid JSON in this exact structure:
{
  "situation": "brief assessment",
  "riskLevel": "low|medium|high|critical",
  "actions": [
    {
      "id": "unique_id",
      "category": "evacuation|medical|communication|resources|coordination",
      "title": "Action title",
      "description": "Action description",
      "priority": "immediate|high|medium|low",
      "timeline": "time estimate",
      "resources": ["resource1", "resource2"]
    }
  ],
  "timeline": {
    "immediate": [],
    "shortTerm": [],
    "longTerm": []
  },
  "nearbyResources": ["resource1", "resource2"]
}`;

      // Call the chat API route with proper message format
      console.log('Sending request to /api/chat...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              id: 'emergency-analysis-1',
              role: 'user',
              content: prompt,
              createdAt: new Date()
            }
          ]
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const jsonStr = line.substring(2);
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                fullResponse += parsed.content;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
      
      // Try to parse JSON response
      let parsedResponse: EmergencyResponse;
      try {
        // Clean the response to extract JSON
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : fullResponse;
        parsedResponse = JSON.parse(jsonStr);
      } catch {
        // Fallback to mock data if parsing fails
        console.warn('Failed to parse AI response, using mock data');
        parsedResponse = generateMockResponse(polygonData);
      }
      
      setResponse(parsedResponse);
    } catch (err) {
      console.error("Error generating emergency response:", err);
      setError("Failed to generate emergency response");
      // Use mock data as fallback
      setResponse(generateMockResponse(polygonData));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (polygonData: PolygonData): EmergencyResponse => {
    return {
      situation: `Emergency response analysis for ${polygonData.name}. Area requires immediate assessment and potential evacuation procedures.`,
      riskLevel: "high",
      actions: [
        {
          id: "1",
          category: "evacuation",
          title: "Establish Evacuation Routes",
          description: "Set up primary and secondary evacuation routes from the affected area",
          priority: "immediate",
          timeline: "0-30 minutes",
          resources: ["Emergency vehicles", "Traffic control personnel"]
        },
        {
          id: "2",
          category: "medical",
          title: "Deploy Medical Teams",
          description: "Position medical response teams at strategic locations",
          priority: "immediate",
          timeline: "0-15 minutes",
          resources: ["Ambulances", "Medical personnel", "First aid stations"]
        },
        {
          id: "3",
          category: "communication",
          title: "Alert Residents",
          description: "Issue emergency alerts to all residents in the affected area",
          priority: "immediate",
          timeline: "0-10 minutes",
          resources: ["Emergency broadcast system", "Mobile alerts"]
        },
        {
          id: "4",
          category: "resources",
          title: "Resource Mobilization",
          description: "Deploy emergency resources and equipment to the area",
          priority: "high",
          timeline: "30-60 minutes",
          resources: ["Heavy machinery", "Emergency supplies", "Personnel"]
        }
      ],
      timeline: {
        immediate: [],
        shortTerm: [],
        longTerm: []
      },
      nearbyResources: [
        "Blatten Fire Station (2.1 km)",
        "Regional Hospital (15.3 km)",
        "Police Station (8.7 km)",
        "Emergency Shelter (5.2 km)"
      ]
    };
  };

  if (!isOpen) return null;

  const panelContent = (
    <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <Button
              variant="ghost"
              onClick={() => setShowGraphEditor(!showGraphEditor)}
              className="flex-1 justify-start text-white/80 hover:text-white hover:bg-white/10"
            >
              <Network className="w-4 h-4 mr-2" />
              {showGraphEditor ? 'Hide Response Graph' : 'Show Response Graph'}
            </Button>
            {!embedded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/40 hover:text-white/60 ml-2"
              >
                <X size={18} />
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Messages */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="prose prose-invert max-w-none">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      <header className="border-b border-white/20 pb-4">
                        <h1 className="text-2xl font-bold text-white mb-2">
                          Emergency Response Analysis
                        </h1>
                        <p className="text-sm text-white/70">
                          {polygon?.name} • {polygon?.vertices.length} vertices • Active
                        </p>
                      </header>

                      {messages.map((message, index) => {
                        const messageContent = (message as any).content || (message as any).text || JSON.stringify(message);
                        console.log("\ud83d\udcac Message structure:", message);
                        console.log("\ud83d\udcac Message content:", messageContent);
                        return (
                          <div key={`message-${message.id}-${index}`} className="mb-4">
                            <div className={`p-3 rounded-lg ${message.role === 'assistant' ? 'bg-orange-500/10 border-l-4 border-orange-500' : 'bg-white/5'}`}>
                              <div className="text-xs text-white/60 mb-2 uppercase font-medium">
                                {message.role === 'assistant' ? '\ud83e\udd16 AI Response' : '\ud83d\udc64 User'}
                              </div>
                              <div className="text-sm text-white/90 leading-relaxed">
                                <pre className="whitespace-pre-wrap font-sans">{messageContent}</pre>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {isLoading && (
                        <div className="flex items-center gap-2 text-white/60 mb-4">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                          <span className="text-sm">AI is analyzing...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-white/60 py-8">
                      <div className="text-4xl mb-4">⚡</div>
                      <h2 className="text-lg font-medium mb-2">Emergency Response Ready</h2>
                      <p className="text-sm">Ask questions about the polygon area below.</p>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </div>

            {/* Graph Editor (when toggled) */}
            {showGraphEditor && (
              <div className="h-64 border-t border-white/20">
                {/* Graph Editor Toolbar */}
                <div className="p-2 border-b border-white/20 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white">Emergency Response Graph</h3>
                      <motion.span
                        key={zoom}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-white/60"
                      >
                        Zoom: {Math.round(zoom * 100)}%
                      </motion.span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom((prev) => Math.min(3, prev * 1.2))}
                        className="text-white/60 hover:text-white/80 h-6 w-6 p-0"
                      >
                        <ZoomIn size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom((prev) => Math.max(0.1, prev * 0.8))}
                        className="text-white/60 hover:text-white/80 h-6 w-6 p-0"
                      >
                        <ZoomOut size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetView}
                        className="text-white/60 hover:text-white/80 h-6 w-6 p-0"
                      >
                        <RotateCcw size={12} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Graph Canvas */}
                <div
                  ref={containerRef}
                  className="h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  <motion.div
                    animate={{
                      x: pan.x,
                      y: pan.y,
                      scale: zoom,
                    }}
                    transition={{
                      type: "tween",
                      duration: isDragging ? 0 : 0.3,
                      ease: "easeOut",
                    }}
                    className="absolute inset-0"
                    style={{
                      transformOrigin: "0 0",
                    }}
                  >
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-20">
                      <svg width="100%" height="100%" className="absolute inset-0">
                        <defs>
                          <pattern id="response-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#response-grid)" />
                      </svg>
                    </div>

                    {/* Emergency Response Nodes */}
                    <div className="absolute top-4 left-4">
                      <Card className="bg-white/10 border-white/30 p-2 w-32">
                        <CardContent className="p-0">
                          <div className="text-xs font-medium text-orange-400 mb-1">{polygon?.name || 'Emergency Zone'}</div>
                          <div className="text-[10px] text-white/80">{polygon?.vertices.length} vertices</div>
                          <div className="text-[10px] text-white/60">Active Response</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="absolute top-4 right-4">
                      <Card className="bg-white/10 border-white/30 p-2 w-32">
                        <CardContent className="p-0">
                          <div className="text-xs font-medium text-white mb-1">AI Analysis</div>
                          <div className="text-[10px] text-white/80">Real-time</div>
                          <div className="text-[10px] text-white/60">Processing</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="absolute bottom-4 left-4">
                      <Card className="bg-white/10 border-white/30 p-2 w-32">
                        <CardContent className="p-0">
                          <div className="text-xs font-medium text-white mb-1">Response</div>
                          <div className="text-[10px] text-white/80">Emergency</div>
                          <div className="text-[10px] text-white/60">Coordinated</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="absolute bottom-4 right-4">
                      <Card className="bg-white/10 border-white/30 p-2 w-32">
                        <CardContent className="p-0">
                          <div className="text-xs font-medium text-white mb-1">Resources</div>
                          <div className="text-[10px] text-white/80">Available</div>
                          <div className="text-[10px] text-white/60">Deployed</div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/20">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about the emergency response..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-orange-400"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </div>
    </div>
  );

  if (embedded) {
    return panelContent;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-96 bg-black/40 backdrop-blur-xl border-l border-white/20 z-40"
      >
        {panelContent}
      </motion.div>
    </AnimatePresence>
  );
}
