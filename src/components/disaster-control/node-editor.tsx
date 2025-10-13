'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GraphNode, NodeConnection, NodeEditorState, NodeType } from '@/types/disaster-control';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface NodeEditorProps {
  nodes: GraphNode[];
  connections: NodeConnection[];
  editorState: NodeEditorState;
  onNodeSelect: (nodeId: string | undefined) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeAdd: (type: NodeType, position: { x: number; y: number }) => void;
  onConnectionCreate: (sourceId: string, targetId: string, sourceHandle?: string) => void;
  onConnectionDelete: (connectionId: string) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
}

const NODE_WIDTH = 200;
const NODE_MIN_HEIGHT = 80;

export function NodeEditor({
  nodes,
  connections,
  editorState,
  onNodeSelect,
  onNodeMove,
  onNodeAdd,
  onConnectionCreate,
  onConnectionDelete,
  onViewportChange,
}: NodeEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handle?: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  // Handle canvas panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e.altKey || e.metaKey))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - editorState.viewport.x, y: e.clientY - editorState.viewport.y });
      e.preventDefault();
    } else if (e.button === 0 && !connectionStart) {
      onNodeSelect(undefined);
    }
  }, [editorState.viewport, connectionStart, onNodeSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (isPanning) {
      e.preventDefault();
      // Use RAF for smooth panning
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        onViewportChange({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
          zoom: editorState.viewport.zoom,
        });
      });
    } else if (draggedNode) {
      e.preventDefault();
      // Use RAF for smooth dragging
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const newX = (e.clientX - editorState.viewport.x - dragStart.x) / editorState.viewport.zoom;
        const newY = (e.clientY - editorState.viewport.y - dragStart.y) / editorState.viewport.zoom;
        onNodeMove(draggedNode, { x: newX, y: newY });
      });
    }
  }, [isPanning, draggedNode, panStart, dragStart, editorState.viewport, onNodeMove, onViewportChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(false);
    setDraggedNode(null);
    if (connectionStart && !hoveredHandle) {
      setConnectionStart(null);
    }
  }, [connectionStart, hoveredHandle]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(2, editorState.viewport.zoom * delta));
    
    // Zoom towards mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = mouseX - (mouseX - editorState.viewport.x) * (newZoom / editorState.viewport.zoom);
      const newY = mouseY - (mouseY - editorState.viewport.y) * (newZoom / editorState.viewport.zoom);
      
      onViewportChange({ x: newX, y: newY, zoom: newZoom });
    }
  }, [editorState.viewport, onViewportChange]);

  // Node drag handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button === 0 && !e.altKey && !e.metaKey) {
      e.stopPropagation();
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setDraggedNode(nodeId);
        const nodeScreenX = node.position.x * editorState.viewport.zoom + editorState.viewport.x;
        const nodeScreenY = node.position.y * editorState.viewport.zoom + editorState.viewport.y;
        setDragStart({ x: e.clientX - nodeScreenX, y: e.clientY - nodeScreenY });
        onNodeSelect(nodeId);
      }
    }
  }, [nodes, editorState.viewport, onNodeSelect]);

  // Connection handlers
  const handleConnectionStart = useCallback((e: React.MouseEvent, nodeId: string, handle?: string) => {
    e.stopPropagation();
    e.preventDefault();
    // Prevent node dragging when starting connection
    setDraggedNode(null);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setConnectionStart({ 
        nodeId, 
        handle,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleConnectionEnd = useCallback((e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (connectionStart && connectionStart.nodeId !== targetNodeId) {
      onConnectionCreate(connectionStart.nodeId, targetNodeId, connectionStart.handle);
    }
    setConnectionStart(null);
    setHoveredHandle(null);
  }, [connectionStart, onConnectionCreate]);

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(2, editorState.viewport.zoom * 1.2);
    onViewportChange({ ...editorState.viewport, zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, editorState.viewport.zoom * 0.8);
    onViewportChange({ ...editorState.viewport, zoom: newZoom });
  };

  const handleResetView = () => {
    onViewportChange({ x: 0, y: 0, zoom: 1 });
  };

  // Get handle position
  const getHandlePosition = (node: GraphNode, isOutput: boolean, handle?: string) => {
    const nodeWidth = NODE_WIDTH * editorState.viewport.zoom;
    const nodeHeight = NODE_MIN_HEIGHT * editorState.viewport.zoom;
    const x = node.position.x * editorState.viewport.zoom + editorState.viewport.x;
    const y = node.position.y * editorState.viewport.zoom + editorState.viewport.y;

    if (node.type === 'if' && isOutput && handle) {
      const yOffset = handle === 'true' ? nodeHeight * 0.25 : nodeHeight * 0.75;
      return { x: x + nodeWidth, y: y + yOffset };
    }

    return {
      x: isOutput ? x + nodeWidth : x,
      y: y + nodeHeight / 2
    };
  };

  // Render connection line
  const renderConnection = (conn: NodeConnection) => {
    const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
    const targetNode = nodes.find(n => n.id === conn.targetNodeId);
    
    if (!sourceNode || !targetNode) return null;

    const start = getHandlePosition(sourceNode, true, conn.sourceHandle);
    const end = getHandlePosition(targetNode, false);

    const distance = Math.abs(end.x - start.x);
    const offset = Math.min(distance / 2, 100);

    return (
      <g key={conn.id}>
        <path
          d={`M ${start.x} ${start.y} C ${start.x + offset} ${start.y}, ${end.x - offset} ${end.y}, ${end.x} ${end.y}`}
          stroke="#333"
          strokeWidth="1.5"
          fill="none"
          className="hover:stroke-white cursor-pointer transition-colors"
          onClick={() => editorState.selectedConnectionId === conn.id ? onConnectionDelete(conn.id) : null}
        />
        {conn.label && (
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 10}
            fill="#666"
            fontSize="11"
            textAnchor="middle"
            className="select-none"
          >
            {conn.label}
          </text>
        )}
      </g>
    );
  };

  // Render temporary connection line while dragging
  const renderTempConnection = () => {
    if (!connectionStart) return null;

    const sourceNode = nodes.find(n => n.id === connectionStart.nodeId);
    if (!sourceNode) return null;

    const start = getHandlePosition(sourceNode, true, connectionStart.handle);
    const distance = Math.abs(mousePos.x - start.x);
    const offset = Math.min(distance / 2, 100);

    return (
      <path
        d={`M ${start.x} ${start.y} C ${start.x + offset} ${start.y}, ${mousePos.x - offset} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
        stroke="#666"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="4,4"
      />
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
          backgroundSize: `${20 * editorState.viewport.zoom}px ${20 * editorState.viewport.zoom}px`,
          backgroundPosition: `${editorState.viewport.x % (20 * editorState.viewport.zoom)}px ${editorState.viewport.y % (20 * editorState.viewport.zoom)}px`,
        }}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* SVG for connections */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none">
          <g className="pointer-events-auto">
            {connections.map(renderConnection)}
            {renderTempConnection()}
          </g>
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const x = node.position.x * editorState.viewport.zoom + editorState.viewport.x;
          const y = node.position.y * editorState.viewport.zoom + editorState.viewport.y;
          const isSelected = editorState.selectedNodeId === node.id;
          const width = NODE_WIDTH * editorState.viewport.zoom;
          const height = NODE_MIN_HEIGHT * editorState.viewport.zoom;

          return (
            <div
              key={node.id}
              className={`absolute bg-black border border-zinc-800 rounded-md
                ${isSelected ? 'ring-1 ring-white/20' : ''}
                transition-all cursor-move hover:border-zinc-700`}
              style={{
                left: x,
                top: y,
                width,
                minHeight: height,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              {/* Node header */}
              <div className="px-3 py-2 border-b border-zinc-800">
                <div className="text-xs font-medium text-white">{node.label}</div>
              </div>

              {/* Node content */}
              <div className="px-3 py-2 text-[10px] text-zinc-500 leading-tight">
                {node.description || `${node.type} node`}
              </div>

              {/* Input handle */}
              {node.type !== 'start' && (
                <div
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600 cursor-crosshair hover:bg-white hover:border-white transition-colors"
                  onMouseUp={(e) => handleConnectionEnd(e, node.id)}
                  onMouseEnter={() => setHoveredHandle(`${node.id}-input`)}
                  onMouseLeave={() => setHoveredHandle(null)}
                />
              )}

              {/* Output handle */}
              {node.type !== 'end' && node.type !== 'if' && (
                <div
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600 cursor-crosshair hover:bg-white hover:border-white transition-colors"
                  onMouseDown={(e) => handleConnectionStart(e, node.id)}
                  onMouseEnter={() => setHoveredHandle(`${node.id}-output`)}
                  onMouseLeave={() => setHoveredHandle(null)}
                />
              )}

              {/* Special handles for if node */}
              {node.type === 'if' && (
                <>
                  <div
                    className="absolute -right-1.5 top-1/4 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600 cursor-crosshair hover:bg-white hover:border-white transition-colors"
                    onMouseDown={(e) => handleConnectionStart(e, node.id, 'true')}
                    onMouseEnter={() => setHoveredHandle(`${node.id}-true`)}
                    onMouseLeave={() => setHoveredHandle(null)}
                    title="True"
                  />
                  <div
                    className="absolute -right-1.5 top-3/4 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600 cursor-crosshair hover:bg-white hover:border-white transition-colors"
                    onMouseDown={(e) => handleConnectionStart(e, node.id, 'false')}
                    onMouseEnter={() => setHoveredHandle(`${node.id}-false`)}
                    onMouseLeave={() => setHoveredHandle(null)}
                    title="False"
                  />
                </>
              )}

              {/* Status indicator */}
              {node.status !== 'idle' && (
                <div className="absolute top-2 right-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    node.status === 'running' ? 'bg-white animate-pulse' :
                    node.status === 'completed' ? 'bg-zinc-500' :
                    node.status === 'error' ? 'bg-white' :
                    'bg-zinc-600'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-black hover:bg-zinc-900 rounded border border-zinc-800 hover:border-zinc-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-zinc-400" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-black hover:bg-zinc-900 rounded border border-zinc-800 hover:border-zinc-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-zinc-400" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-black hover:bg-zinc-900 rounded border border-zinc-800 hover:border-zinc-700 transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 px-2 py-1 bg-black border border-zinc-800 rounded text-[10px] text-zinc-500 font-mono">
        {Math.round(editorState.viewport.zoom * 100)}%
      </div>
    </div>
  );
}
