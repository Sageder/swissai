'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface AIChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChat({ isOpen, onClose }: AIChatProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { messages, sendMessage } = useChat();

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

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-background border rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">Emergency AI Assistant</h2>
                        <p className="text-sm text-muted-foreground">
                            Specialized in emergency management and disaster response
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        ✕
                    </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <p className="text-lg mb-2">Welcome to the Emergency AI Assistant</p>
                                <p className="text-sm">
                                    I can help you with emergency management, disaster response, and simulation analysis.
                                </p>
                                <div className="mt-4 space-y-2 text-xs">
                                    <p>Try asking me about:</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        <Badge variant="outline">Weather conditions</Badge>
                                        <Badge variant="outline">Emergency resources</Badge>
                                        <Badge variant="outline">Evacuation routes</Badge>
                                        <Badge variant="outline">Simulation analysis</Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <Card className={`max-w-[80%] p-3 ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        }`}>
                                        <div className="space-y-2">
                                            {message.parts.map((part, i) => {
                                                switch (part.type) {
                                                    case 'text':
                                                        return (
                                                            <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                                                                {part.text}
                                                            </div>
                                                        );
                                                    case 'tool-weather':
                                                    case 'tool-convertFahrenheitToCelsius':
                                                    case 'tool-emergencyResources':
                                                    case 'tool-geospatialAnalysis':
                                                    case 'tool-emergencyCommunication':
                                                    case 'tool-simulationAnalysis':
                                                        return (
                                                            <div key={`${message.id}-${i}`} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {part.type.replace('tool-', '').replace(/([A-Z])/g, ' $1').trim()}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {part.toolCallId ? 'Calling...' : 'Result'}
                                                                    </span>
                                                                </div>
                                                                <pre className="text-xs overflow-x-auto">
                                                                    {JSON.stringify(part.input || part.output || part, null, 2)}
                                                                </pre>
                                                            </div>
                                                        );
                                                    default:
                                                        return null;
                                                }
                                            })}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <Card className="bg-muted p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about emergency management, weather, resources..."
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()}>
                            Send
                        </Button>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
}