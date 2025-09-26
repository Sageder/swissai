'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
                className="fixed right-0 top-0 h-full w-96 bg-black/40 backdrop-blur-xl border-l border-red-500/30 z-40 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-red-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <div>
                            <h2 className="text-lg font-semibold text-red-400">Crisis Management</h2>
                            <p className="text-xs text-white/60">AI Crisis Response System</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white/40 hover:text-white/60"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </div>

                {/* Event Info */}
                {event && (
                    <div className="p-4 border-b border-red-500/20">
                        <Card className="bg-red-500/10 border-red-500/30 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                                    {event.severity?.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-white/80">{event.type}</span>
                            </div>
                            <p className="text-sm text-white/60">{event.location}</p>
                            <p className="text-xs text-white/40 mt-1">
                                {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Active'}
                            </p>
                        </Card>
                    </div>
                )}

                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-lg p-3 ${message.type === 'user'
                                        ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                                        : message.type === 'system'
                                            ? 'bg-orange-500/20 text-orange-100 border border-orange-500/30 text-center'
                                            : 'bg-white/10 text-white/90 border border-white/20'
                                        }`}
                                >
                                    <div className="text-sm whitespace-pre-line">
                                        {message.content}
                                        {message.isTyping && (
                                            <span className="inline-block w-2 h-4 bg-white/40 ml-1 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="text-xs text-white/40 mt-1">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isAnalyzing && (
                            <div className="flex justify-center">
                                <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                        <span className="text-sm">Analyzing situation...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-white/20">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about the crisis situation..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                            size="sm"
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
