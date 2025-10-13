'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, ExecutionContext } from '@/types/disaster-control';
import { Send, Bot, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AgentChatProps {
  messages: ChatMessage[];
  isWaitingForUser: boolean;
  currentPrompt?: string;
  executionContext?: ExecutionContext;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
}

export function AgentChat({
  messages,
  isWaitingForUser,
  currentPrompt,
  executionContext,
  onSendMessage,
  onClearChat,
}: AgentChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when waiting for user
  useEffect(() => {
    if (isWaitingForUser) {
      inputRef.current?.focus();
    }
  }, [isWaitingForUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isSystem ? 'justify-center' : ''}`}
      >
        {/* Avatar */}
        {!isSystem && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500' : 'bg-purple-500'
          }`}>
            {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
          </div>
        )}

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${isSystem ? 'items-center' : ''} max-w-[80%]`}>
          {/* Message bubble */}
          <div className={`rounded-lg px-4 py-2 ${
            isSystem 
              ? 'bg-gray-800/50 border border-gray-700 text-gray-400 text-xs'
              : isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-800 text-gray-200'
          }`}>
            {/* Node reference if available */}
            {message.nodeId && !isSystem && (
              <div className="text-xs opacity-70 mb-1">
                From node: {message.nodeId}
              </div>
            )}
            
            {/* Message text */}
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Metadata if available */}
            {message.metadata && Object.keys(message.metadata).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs opacity-70">
                {Object.entries(message.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 mt-1 px-1">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-medium">Agent Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Execution status */}
          {executionContext && (
            <div className="flex items-center gap-1 text-[10px]">
              {executionContext.status === 'running' && (
                <>
                  <Clock className="w-3 h-3 text-zinc-400 animate-pulse" />
                  <span className="text-zinc-400">Running</span>
                </>
              )}
              {executionContext.status === 'completed' && (
                <>
                  <CheckCircle className="w-3 h-3 text-zinc-500" />
                  <span className="text-zinc-500">Done</span>
                </>
              )}
              {executionContext.status === 'error' && (
                <>
                  <AlertCircle className="w-3 h-3 text-white" />
                  <span className="text-white">Error</span>
                </>
              )}
              {executionContext.status === 'paused' && (
                <>
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-zinc-500">Paused</span>
                </>
              )}
            </div>
          )}
          <button
            onClick={onClearChat}
            className="px-1.5 py-0.5 text-[10px] hover:bg-zinc-900 rounded transition-colors text-zinc-500"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600">
            <div className="text-center">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No messages</p>
              <p className="text-[10px] mt-1 text-zinc-700">Agent will communicate here</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Current prompt indicator */}
      {currentPrompt && isWaitingForUser && (
        <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 text-zinc-400 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-zinc-400">
              <p className="font-medium mb-0.5">Waiting for response:</p>
              <p className="text-zinc-500">{currentPrompt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge base summary */}
      {executionContext && executionContext.knowledgeBase.length > 0 && (
        <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <div className="w-1 h-1 rounded-full bg-white" />
            <span>KB: {executionContext.knowledgeBase.length}</span>
            <span className="text-zinc-700">|</span>
            <span>Vars: {Object.keys(executionContext.variables).length}</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-zinc-800 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isWaitingForUser ? "Type response..." : "Message agent..."}
            className="flex-1 px-2 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
            disabled={!isWaitingForUser && executionContext?.status === 'running'}
          />
          <button
            type="submit"
            disabled={!input.trim() || (!isWaitingForUser && executionContext?.status === 'running')}
            className="px-2 py-1.5 bg-white hover:bg-zinc-100 disabled:bg-zinc-900 disabled:cursor-not-allowed rounded transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-black" />
          </button>
        </form>
        
        {/* Help text */}
        <div className="mt-1.5 text-[10px] text-zinc-600">
          {isWaitingForUser 
            ? "Waiting for input"
            : executionContext?.status === 'running'
              ? "Processing..."
              : "Send messages to agent"}
        </div>
      </div>
    </div>
  );
}
