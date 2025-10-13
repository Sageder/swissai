'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FlowEditor } from './flow-editor';
import { PropertiesPanel } from './properties-panel';
import { AgentChat } from './agent-chat';
import {
  GraphNode,
  NodeConnection,
  DisasterControlGraph,
  ChatMessage,
  ExecutionContext,
  NodeType,
  StartNode,
} from '@/types/disaster-control';
import { Play, Pause, Square, Save, FolderOpen } from 'lucide-react';
import { ExecutionEngine } from './execution-engine';

interface DisasterControlPaneProps {
  className?: string;
}

export function DisasterControlPane({ className = '' }: DisasterControlPaneProps) {
  // Graph state
  const [graph, setGraph] = useState<DisasterControlGraph>(() => {
    const startNode: StartNode = {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 100 },
      label: 'Start',
      status: 'idle',
      data: {
        initialContext: 'Emergency response workflow',
      },
    };

    return {
      id: 'default-graph',
      name: 'Emergency Response Workflow',
      description: 'AI-powered disaster response coordination',
      nodes: [startNode],
      connections: [],
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: '1.0.0',
      },
    };
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Disaster Control System initialized. Create a workflow and press Execute to begin.',
      timestamp: new Date(),
    },
  ]);

  // Execution state
  const [executionContext, setExecutionContext] = useState<ExecutionContext>({
    variables: {},
    knowledgeBase: [],
    history: [],
    startTime: new Date(),
    status: 'idle',
  });

  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const executionEngineRef = useRef<ExecutionEngine | null>(null);


  // Node operations
  const handleNodeAdd = useCallback((type: NodeType, position: { x: number; y: number }) => {
    const newNode: GraphNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      status: 'idle',
      data: {} as any,
    };

    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      metadata: { ...prev.metadata, modified: new Date() },
    }));
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<GraphNode>) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n),
      metadata: { ...prev.metadata, modified: new Date() },
    }));
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId),
      metadata: { ...prev.metadata, modified: new Date() },
    }));
    setEditorState(prev => ({ ...prev, selectedNodeId: undefined }));
  }, []);

  const handleNodeDuplicate = useCallback((nodeId: string) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const duplicatedNode: GraphNode = {
      ...node,
      id: `node-${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      label: `${node.label} (Copy)`,
      status: 'idle',
    };

    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, duplicatedNode],
      metadata: { ...prev.metadata, modified: new Date() },
    }));
  }, [graph.nodes]);

  // Connection operations
  const handleConnectionAdd = useCallback((connection: Omit<NodeConnection, 'id'>) => {
    const newConnection: NodeConnection = {
      ...connection,
      id: `conn-${Date.now()}`,
    };

    setGraph(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      metadata: { ...prev.metadata, modified: new Date() },
    }));
  }, []);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    setGraph(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionId),
      metadata: { ...prev.metadata, modified: new Date() },
    }));
  }, []);


  // Chat operations
  const handleSendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    if (currentNodeId && executionEngineRef.current) {
      executionEngineRef.current.continueFromUserInput(currentNodeId, content);
    }

    setIsWaitingForUser(false);
    setCurrentPrompt(undefined);
    setCurrentNodeId(null);
  }, [currentNodeId]);

  const handleClearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: 'Chat cleared. Disaster Control System ready.',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Execution controls
  const handleExecute = useCallback(() => {
    try {
      const engine = new ExecutionEngine(
        graph.nodes || [],
        graph.connections || [],
        (nodeId, status) => {
          setGraph(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, status } : n)
          }));
        },
        (context) => {
          setExecutionContext(context);
        },
        (message) => {
          setMessages(prev => [...prev, message]);
        },
        (nodeId, prompt) => {
          setIsWaitingForUser(true);
          setCurrentPrompt(prompt);
          setCurrentNodeId(nodeId);
        }
      );

      executionEngineRef.current = engine;

      setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => ({ ...n, status: 'idle' as const }))
      }));

      engine.start();
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: error instanceof Error ? error.message : 'Failed to start execution',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [graph]);

  const handlePause = useCallback(() => {
    if (executionEngineRef.current) {
      executionEngineRef.current.pause();
    }
    const systemMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: 'Workflow execution paused.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  const handleStop = useCallback(() => {
    if (executionEngineRef.current) {
      executionEngineRef.current.stop();
      executionEngineRef.current = null;
    }
    const systemMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: 'Workflow execution stopped.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const selectedNode = graph.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className={`flex flex-col h-full bg-black ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-black">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-white">{graph.name}</h2>
          <span className="text-xs text-zinc-500">v{graph.metadata.version}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Execution controls */}
          <button
            onClick={handleExecute}
            disabled={executionContext.status === 'running'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-zinc-800 disabled:text-zinc-500 rounded transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Execute
          </button>
          <button
            onClick={handlePause}
            disabled={executionContext.status !== 'running'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-800 disabled:text-zinc-500 rounded transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
          <button
            onClick={handleStop}
            disabled={executionContext.status === 'idle'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 rounded transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>

          <div className="w-px h-6 bg-zinc-800 mx-2" />

          {/* File operations */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
            <FolderOpen className="w-3.5 h-3.5" />
            Load
          </button>

        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Flow Editor */}
        <div className="flex-1 relative">
          <FlowEditor
            nodes={graph.nodes}
            connections={graph.connections}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            onNodeMove={(nodeId, position) => handleNodeUpdate(nodeId, { position })}
            onNodeAdd={handleNodeAdd}
            onConnectionCreate={handleConnectionAdd}
            onConnectionDelete={handleConnectionDelete}
          />
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l border-zinc-800 bg-black overflow-y-auto">
          <PropertiesPanel
            selectedNode={selectedNode}
            onNodeUpdate={handleNodeUpdate}
            onNodeDelete={handleNodeDelete}
            onNodeDuplicate={handleNodeDuplicate}
          />
        </div>

        {/* Agent Chat */}
        <div className="w-96 border-l border-zinc-800 bg-black flex flex-col">
          <AgentChat
            messages={messages}
            executionContext={executionContext}
            isWaitingForUser={isWaitingForUser}
            currentPrompt={currentPrompt}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
          />
        </div>
      </div>
    </div>
  );
}
