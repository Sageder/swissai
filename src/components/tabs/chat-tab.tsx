"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    id: string
    content: string
    sender: "user" | "agent"
    timestamp: Date
}

export function ChatTab() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            content: "Hello! I'm your AI assistant for this mapping application. I can help you analyze geographic data, explain POI information, and assist with map interactions. How can I help you today?",
            sender: "agent",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)

    const handleSendMessage = () => {
        if (!inputValue.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue,
            sender: "user",
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setIsTyping(true)

        // Simulate agent response (demo)
        setTimeout(() => {
            const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "I received your message: \"" + inputValue + "\". This is a demo response. In the future, I'll be connected to OpenAI to provide intelligent assistance with your mapping and data analysis needs.",
                sender: "agent",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, agentMessage])
            setIsTyping(false)
        }, 1500)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3",
                                    message.sender === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.sender === "agent" && (
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                )}

                                <Card
                                    className={cn(
                                        "max-w-[80%] p-3",
                                        message.sender === "user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-muted"
                                    )}
                                >
                                    <p className="text-sm">{message.content}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </Card>

                                {message.sender === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                                        <User size={16} className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <Card className="bg-muted p-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
                <div className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about the map, POIs, or data analysis..."
                        className="flex-1"
                        disabled={isTyping}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        size="sm"
                        className="px-3"
                    >
                        <Send size={16} />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    )
}
