'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Network } from 'lucide-react';

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

interface Message {
    id: string;
    type: 'ai' | 'user' | 'system';
    content: string;
    timestamp: string;
    isTyping?: boolean;
}

export const CrisisManagement: React.FC<CrisisManagementProps> = ({
    isOpen,
    onClose,
    event
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showGraphEditor, setShowGraphEditor] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const addMessage = useCallback((content: string, type: 'ai' | 'user' | 'system', isTyping = false) => {
        const newMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            content,
            timestamp: new Date().toISOString(),
            isTyping
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage.id;
    }, []);

    const updateMessage = useCallback((id: string, content: string) => {
        setMessages(prev =>
            prev.map(msg =>
                msg.id === id ? { ...msg, content, isTyping: false } : msg
            )
        );
    }, []);

    const simulateTyping = useCallback(async (messageId: string, fullContent: string, delay = 30) => {
        const words = fullContent.split(' ');
        let currentContent = '';

        for (let i = 0; i < words.length; i++) {
            currentContent += (i > 0 ? ' ' : '') + words[i];
            updateMessage(messageId, currentContent);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }, [updateMessage]);

    const initializeCrisisAnalysis = useCallback(async () => {
        setIsAnalyzing(true);

        // Initial situation summary
        const summaryId = addMessage('', 'ai', true);
        await simulateTyping(summaryId,
            `**SITUATION ANALYSIS: ${event?.type?.toUpperCase()} - ${event?.location}**\n\n` +
            `📍 **Location**: ${event?.location}\n` +
            `⚠️ **Severity**: ${event?.severity?.toUpperCase()}\n` +
            `🕒 **Detection Time**: ${event?.timestamp ? new Date(event.timestamp).toLocaleString() : 'Current'}\n\n` +
            `**Initial Assessment:**\n` +
            `A landslide event has been detected in the Blatten area. Based on geological monitoring data and terrain analysis, this represents a significant hazard requiring immediate attention and potential evacuation measures.`
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Monitoring sources analysis
        const monitoringId = addMessage('', 'ai', true);
        await simulateTyping(monitoringId,
            `**AVAILABLE MONITORING SOURCES:**\n\n` +
            `🏔️ **Geological Monitoring:**\n` +
            `• WSL Institute Sensors: 3 active stations\n` +
            `• SED-ETHZ Seismic Network: Real-time data\n` +
            `• Slope stability sensors: 5 units operational\n\n` +
            `🌦️ **Weather Data:**\n` +
            `• MeteoSwiss stations: 2 nearby stations\n` +
            `• Precipitation radar: Active coverage\n` +
            `• Temperature/humidity sensors: 4 units\n\n` +
            `📡 **Infrastructure:**\n` +
            `• Communication towers: 2 operational\n` +
            `• Emergency sirens: 3 units tested\n` +
            `• Access routes: Status being assessed`
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock geological data report
        const geoReportId = addMessage('', 'ai', true);
        await simulateTyping(geoReportId,
            `**GEOLOGICAL DATA REPORT:**\n\n` +
            `📊 **Slope Movement Analysis:**\n` +
            `• Current displacement rate: 2.3 mm/hour\n` +
            `• Acceleration trend: +15% over last 6 hours\n` +
            `• Critical threshold: 5.0 mm/hour\n` +
            `• Estimated time to critical: 8-12 hours\n\n` +
            `⚡ **Seismic Activity:**\n` +
            `• Micro-seismic events: 23 detected (last 2 hours)\n` +
            `• Largest magnitude: 1.2 ML\n` +
            `• Frequency increasing: +40% trend\n\n` +
            `🧪 **Stability Factors:**\n` +
            `• Soil moisture: 85% saturation\n` +
            `• Rock fracture density: High\n` +
            `• Vegetation root support: Limited`
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Weather report
        const weatherReportId = addMessage('', 'ai', true);
        await simulateTyping(weatherReportId,
            `**WEATHER CONDITIONS REPORT:**\n\n` +
            `🌧️ **Current Conditions:**\n` +
            `• Temperature: 8°C (stable)\n` +
            `• Humidity: 78%\n` +
            `• Wind: 12 km/h SW\n` +
            `• Visibility: 6 km (fog patches)\n\n` +
            `☔ **Precipitation Analysis:**\n` +
            `• Last 24h: 45mm rainfall\n` +
            `• Last 7 days: 120mm total\n` +
            `• Soil saturation: Critical levels\n` +
            `• Drainage capacity: Exceeded\n\n` +
            `📈 **12-Hour Forecast:**\n` +
            `• Additional rainfall: 15-25mm expected\n` +
            `• Temperature: Stable 6-10°C\n` +
            `• Risk assessment: Conditions worsening`
        );

        await new Promise(resolve => setTimeout(resolve, 1500));

        // Action recommendations
        const actionId = addMessage('', 'ai', true);
        await simulateTyping(actionId,
            `**RECOMMENDED ACTIONS:**\n\n` +
            `🚨 **Immediate (0-2 hours):**\n` +
            `• Alert residents in risk zone\n` +
            `• Deploy monitoring teams\n` +
            `• Prepare evacuation routes\n` +
            `• Coordinate with emergency services\n\n` +
            `⏰ **Short-term (2-8 hours):**\n` +
            `• Consider precautionary evacuation\n` +
            `• Establish emergency shelter\n` +
            `• Monitor acceleration trends\n` +
            `• Regular status updates to authorities\n\n` +
            `📞 **How can I assist you further with this crisis?**`
        );

        setIsAnalyzing(false);
    }, [event, addMessage, simulateTyping]);

    // Initialize crisis analysis when opened with an event
    useEffect(() => {
        if (isOpen && event && !hasInitialized) {
            setHasInitialized(true);
            initializeCrisisAnalysis();
        } else if (!isOpen) {
            setHasInitialized(false);
            setMessages([]);
        }
    }, [isOpen, event, hasInitialized, initializeCrisisAnalysis]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setInputValue('');
        addMessage(userMessage, 'user');

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1000));

        const responseId = addMessage('', 'ai', true);

        // Simple response logic based on keywords
        let response = '';
        if (userMessage.toLowerCase().includes('evacuat')) {
            response = `**EVACUATION ANALYSIS:**\n\nBased on current data, I recommend a phased evacuation approach:\n\n1. **Immediate**: High-risk households (within 200m of slope)\n2. **Precautionary**: Extended zone (200-500m)\n3. **Monitoring**: Wider area with evacuation readiness\n\nEstimated affected population: 45 residents in immediate zone, 120 in extended zone.\n\nEvacuation shelter "Blatten Community Center" has capacity for 200 people with basic amenities.`;
        } else if (userMessage.toLowerCase().includes('monitor')) {
            response = `**MONITORING STRATEGY:**\n\nI'm maintaining continuous surveillance through:\n\n• Real-time sensor data (5-minute intervals)\n• Automated threshold alerts\n• Weather correlation analysis\n• Satellite imagery when available\n\nCurrent alert thresholds:\n• Yellow: 3.0 mm/hour displacement\n• Orange: 4.0 mm/hour displacement  \n• Red: 5.0 mm/hour displacement\n\nWould you like me to adjust any monitoring parameters?`;
        } else if (userMessage.toLowerCase().includes('weather')) {
            response = `**WEATHER IMPACT ANALYSIS:**\n\nCurrent precipitation is a major contributing factor:\n\n• Soil saturation at 85% - above critical threshold\n• Additional 15-25mm rain expected\n• Ground water pressure increasing\n• Drainage systems at capacity\n\nThe weather is actively destabilizing the slope. Each additional millimeter of rain increases displacement rate by approximately 0.1 mm/hour.`;
        } else {
            response = `I understand your concern about "${userMessage}". Let me analyze this in the context of our current landslide situation.\n\nBased on the latest monitoring data, the situation remains critical. The displacement rate is still 2.3 mm/hour and weather conditions continue to contribute to instability.\n\nWhat specific aspect would you like me to focus on? I can provide more details about:\n• Risk assessment\n• Evacuation planning\n• Resource coordination\n• Monitoring updates`;
        }

        await simulateTyping(responseId, response);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed right-0 top-0 h-full w-96 bg-black/40 backdrop-blur-xl border-l border-white/20 z-40 flex flex-col"
            >





                {/* Toggle Button */}
                <div className="px-4 py-2 border-b border-white/20">
                    <Button
                        variant="ghost"
                        onClick={() => setShowGraphEditor(!showGraphEditor)}
                        className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <Network className="w-4 h-4 mr-2" />
                        {showGraphEditor ? 'Hide Graph Editor' : 'Show Graph Editor'}
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

                                            {messages.filter(m => m.type === 'ai' && !m.isTyping).map((message, index) => (
                                                <div key={message.id} className="mb-6">
                                                    <div
                                                        className="text-sm text-white/90 leading-relaxed"
                                                        dangerouslySetInnerHTML={{
                                                            __html: message.content
                                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400">$1</strong>')
                                                                .replace(/\n\n/g, '</p><p class="mt-3">')
                                                                .replace(/\n/g, '<br>')
                                                                .replace(/^/, '<p>')
                                                                .replace(/$/, '</p>')
                                                        }}
                                                    />
                                                </div>
                                            ))}

                                            {isAnalyzing && (
                                                <div className="flex items-center gap-2 text-white/60 mb-4">
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                                    <span className="text-sm">Analyzing situation...</span>
                                                </div>
                                            )}
                                        </section>

                                        {/* User Questions Section */}
                                        {messages.filter(m => m.type === 'user').length > 0 && (
                                            <section>
                                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                                    Questions & Responses
                                                </h2>

                                                <div className="space-y-4">
                                                    {messages.filter(m => m.type === 'user').map((message, index) => (
                                                        <div key={message.id} className="border-l-2 border-white/30 pl-4">
                                                            <h3 className="text-sm font-medium text-white/90 mb-2">
                                                                Question {index + 1}
                                                            </h3>
                                                            <p className="text-sm text-white/80 mb-3">{message.content}</p>

                                                            {/* Find corresponding AI response */}
                                                            {(() => {
                                                                const userIndex = messages.findIndex(m => m.id === message.id);
                                                                const aiResponse = messages[userIndex + 1];
                                                                if (aiResponse && aiResponse.type === 'ai' && !aiResponse.isTyping) {
                                                                    return (
                                                                        <div className="bg-white/5 rounded-lg p-3">
                                                                            <p className="text-xs text-white/60 mb-2">AI Response:</p>
                                                                            <div
                                                                                className="text-sm text-white/90"
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: aiResponse.content
                                                                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400">$1</strong>')
                                                                                        .replace(/\n\n/g, '</p><p class="mt-2">')
                                                                                        .replace(/\n/g, '<br>')
                                                                                        .replace(/^/, '<p>')
                                                                                        .replace(/$/, '</p>')
                                                                                }}
                                                                            />
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

                                        {/* System Messages */}
                                        {messages.filter(m => m.type === 'system').length > 0 && (
                                            <section>
                                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                                                    System Updates
                                                </h2>

                                                <div className="space-y-3">
                                                    {messages.filter(m => m.type === 'system').map((message) => (
                                                        <div key={message.id} className="bg-white/5 border border-white/20 rounded-lg p-3">
                                                            <div className="text-sm text-white/80">
                                                                {message.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                )}

                                {messages.length === 0 && !isAnalyzing && (
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

                    {/* Graph Editor (when toggled) */}
                    {showGraphEditor && (
                        <div className="h-64 border-t border-white/20">
                            {/* Graph Editor Toolbar */}
                            <div className="p-2 border-b border-white/20 bg-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-medium text-white">Crisis Response Graph</h3>
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
                                                <pattern id="crisis-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                                                </pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill="url(#crisis-grid)" />
                                        </svg>
                                    </div>

                                    {/* Crisis Response Nodes */}
                                    <div className="absolute top-4 left-4">
                                        <Card className="bg-white/10 border-white/30 p-2 w-32">
                                            <CardContent className="p-0">
                                                <div className="text-xs font-medium text-orange-400 mb-1">Landslide Alert</div>
                                                <div className="text-[10px] text-white/80">Blatten, CH</div>
                                                <div className="text-[10px] text-white/60">High Severity</div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="absolute top-4 right-4">
                                        <Card className="bg-white/10 border-white/30 p-2 w-32">
                                            <CardContent className="p-0">
                                                <div className="text-xs font-medium text-white mb-1">Monitoring</div>
                                                <div className="text-[10px] text-white/80">5 Sensors</div>
                                                <div className="text-[10px] text-white/60">Real-time</div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="absolute bottom-4 left-4">
                                        <Card className="bg-white/10 border-white/30 p-2 w-32">
                                            <CardContent className="p-0">
                                                <div className="text-xs font-medium text-white mb-1">Response</div>
                                                <div className="text-[10px] text-white/80">Evacuation</div>
                                                <div className="text-[10px] text-white/60">120 People</div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="absolute bottom-4 right-4">
                                        <Card className="bg-white/10 border-white/30 p-2 w-32">
                                            <CardContent className="p-0">
                                                <div className="text-xs font-medium text-white mb-1">Resources</div>
                                                <div className="text-[10px] text-white/80">Teams</div>
                                                <div className="text-[10px] text-white/60">Standby</div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-white/20">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about the crisis situation..."
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-orange-400"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                size="sm"
                                className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
