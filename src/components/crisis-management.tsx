'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Network } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

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


export const CrisisManagement: React.FC<CrisisManagementProps> = ({
    isOpen,
    onClose,
    event
}) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showGraphEditor, setShowGraphEditor] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Use the same chat hook as AI Chat component
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
                        onClick={() => setShowGraphEditor(!showGraphEditor)}
                        className="flex-1 justify-start text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <Network className="w-4 h-4 mr-2" />
                        {showGraphEditor ? 'Hide Graph Editor' : 'Show Graph Editor'}
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
    );
};
