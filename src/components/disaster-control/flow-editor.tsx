'use client';

import React, { useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ConnectionLineType,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode, CustomNodeData } from './flow-nodes/custom-node';
import { GraphNode, NodeConnection, NodeType } from '@/types/disaster-control';
import { Plus } from 'lucide-react';

interface FlowEditorProps {
  nodes: GraphNode[];
  connections: NodeConnection[];
  selectedNodeId?: string;
  onNodeSelect: (nodeId: string | undefined) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeAdd: (type: NodeType, position: { x: number; y: number }) => void;
  onConnectionCreate: (connection: NodeConnection) => void;
  onConnectionDelete: (connectionId: string) => void;
}

// Convert our GraphNode to React Flow Node
function graphNodeToFlowNode(node: GraphNode): Node<CustomNodeData> {
  return {
    id: node.id,
    type: 'custom',
    position: node.position,
    data: {
      label: node.label,
      type: node.type,
      status: node.status,
      description: node.description,
      data: node.data,
    },
  };
}

// Convert our NodeConnection to React Flow Edge
function nodeConnectionToEdge(connection: NodeConnection): Edge {
  return {
    id: connection.id,
    source: connection.sourceNodeId,
    target: connection.targetNodeId,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    type: 'smoothstep',
    animated: connection.metadata?.animated || false,
    style: {
      stroke: connection.sourceHandle === 'true' ? '#22c55e' : 
              connection.sourceHandle === 'false' ? '#ef4444' : '#6b7280',
      strokeWidth: 2,
    },
  };
}

// Inner component that uses useReactFlow
function FlowEditorInner({
  nodes: graphNodes,
  connections: graphConnections,
  selectedNodeId,
  onNodeSelect,
  onNodeMove,
  onNodeAdd,
  onConnectionCreate,
  onConnectionDelete,
}: FlowEditorProps) {
  // Convert to React Flow format
  const initialNodes = useMemo(
    () => graphNodes.map(graphNodeToFlowNode),
    [graphNodes]
  );
  
  const initialEdges = useMemo(
    () => graphConnections.map(nodeConnectionToEdge),
    [graphConnections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  // Update nodes when graphNodes change
  React.useEffect(() => {
    setNodes(graphNodes.map(graphNodeToFlowNode));
  }, [graphNodes, setNodes]);

  // Update edges when graphConnections change
  React.useEffect(() => {
    setEdges(graphConnections.map(nodeConnectionToEdge));
  }, [graphConnections, setEdges]);

  // Custom node types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Check if adding a connection would create a cycle
  const wouldCreateCycle = useCallback((sourceId: string, targetId: string, connections: NodeConnection[]): boolean => {
    // Build adjacency list
    const graph = new Map<string, Set<string>>();
    
    // Add existing connections
    connections.forEach(conn => {
      if (!graph.has(conn.sourceNodeId)) {
        graph.set(conn.sourceNodeId, new Set());
      }
      graph.get(conn.sourceNodeId)!.add(conn.targetNodeId);
    });
    
    // Add the proposed connection
    if (!graph.has(sourceId)) {
      graph.set(sourceId, new Set());
    }
    graph.get(sourceId)!.add(targetId);
    
    // DFS to detect cycle
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      
      const neighbors = graph.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (hasCycle(neighbor)) {
              return true;
            }
          } else if (recStack.has(neighbor)) {
            return true; // Cycle detected
          }
        }
      }
      
      recStack.delete(node);
      return false;
    };
    
    // Check all nodes
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          return true;
        }
      }
    }
    
    return false;
  }, []);

  // Handle connection creation
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Check for cycle
        if (wouldCreateCycle(connection.source, connection.target, graphConnections)) {
          console.warn('Cannot create connection: would create a cycle');
          return;
        }
        
        const newConnection: NodeConnection = {
          id: `${connection.source}-${connection.target}-${Date.now()}`,
          sourceNodeId: connection.source,
          targetNodeId: connection.target,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
        };
        onConnectionCreate(newConnection);
      }
    },
    [onConnectionCreate, graphConnections, wouldCreateCycle]
  );


  // Handle node drag end
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeMove(node.id, node.position);
    },
    [onNodeMove]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    onNodeSelect(undefined);
  }, [onNodeSelect]);

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => {
        onConnectionDelete(edge.id);
      });
    },
    [onConnectionDelete]
  );

  // Add node menu
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [addMenuPosition, setAddMenuPosition] = React.useState({ x: 0, y: 0 });
  const [flowPosition, setFlowPosition] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Context menu triggered!', event.clientX, event.clientY);
    
    if (!containerRef.current) {
      console.log('No container ref');
      return;
    }
    
    // Menu position relative to viewport
    const menuX = event.clientX;
    const menuY = event.clientY;
    
    console.log('Setting menu position:', menuX, menuY);
    
    // Store both screen position (for menu) and flow position (for node placement)
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    console.log('Flow position:', position);
    
    setAddMenuPosition({ x: menuX, y: menuY });
    setFlowPosition(position);
    setShowAddMenu(true);
  }, [screenToFlowPosition]);

  const handleAddNodeButtonClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!containerRef.current) return;
    
    // Get the button's position
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate menu position - place it to the right of the button
    // Ensure it stays within viewport bounds
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 400; // Approximate menu height
    
    let menuX = rect.right + 10; // 10px to the right of button
    let menuY = rect.top;
    
    // If menu would go off right edge, place it to the left of button
    if (menuX + menuWidth > window.innerWidth) {
      menuX = rect.left - menuWidth - 10;
    }
    
    // If menu would go off bottom, adjust upward
    if (menuY + menuHeight > window.innerHeight) {
      menuY = window.innerHeight - menuHeight - 10;
    }
    
    // Place node at center of container
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    const centerPosition = screenToFlowPosition({ x: centerX, y: centerY });
    
    console.log('Button click - Menu:', menuX, menuY, 'Flow:', centerPosition);
    
    setFlowPosition(centerPosition);
    setAddMenuPosition({ x: menuX, y: menuY });
    setShowAddMenu(true);
  }, [screenToFlowPosition]);

  const handleAddNode = useCallback(
    (type: NodeType) => {
      // Use the stored flow position
      onNodeAdd(type, flowPosition);
      setShowAddMenu(false);
    },
    [flowPosition, onNodeAdd]
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
    >
      <style jsx global>{`
        .flow-controls {
          background: rgba(24, 24, 27, 0.9) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid #3f3f46 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        
        .flow-controls button {
          background: #27272a !important;
          border: 1px solid #3f3f46 !important;
          color: #a1a1aa !important;
          transition: all 0.2s !important;
        }
        
        .flow-controls button:hover {
          background: #3f3f46 !important;
          color: #ffffff !important;
          border-color: #52525b !important;
        }
        
        .flow-controls button svg {
          fill: #a1a1aa !important;
        }
        
        .flow-controls button:hover svg {
          fill: #ffffff !important;
        }
        
        .flow-minimap {
          background: rgba(24, 24, 27, 0.9) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid #3f3f46 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        
        .flow-minimap svg {
          border-radius: 6px !important;
        }
        
        /* Style the connection line during drag */
        .react-flow__connection-path {
          stroke: #6b7280 !important;
          stroke-width: 2 !important;
        }
        
        /* Subtle handle highlighting */
        .react-flow__handle.valid {
          background: #22c55e !important;
          border-color: #16a34a !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgesDelete={onEdgesDelete}
        onPaneContextMenu={handlePaneContextMenu}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={10}
        fitView
        className="bg-gray-950"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        connectionLineStyle={{ stroke: '#6b7280', strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.Straight}
        snapToGrid={false}
        snapGrid={[1, 1]}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      >
        <Background color="#374151" gap={16} />
        <Controls className="flow-controls" />
        <MiniMap
          className="flow-minimap"
          nodeColor={(node) => {
            const data = node.data as CustomNodeData;
            return data.type === 'start' ? '#22c55e' : '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
        
        {/* Add Node Panel */}
        <Panel position="top-left" className="bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg border border-gray-700">
          <button
            onClick={handleAddNodeButtonClick}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>
        </Panel>
      </ReactFlow>

      {/* Add Node Context Menu - Using Portal */}
      {showAddMenu && typeof window !== 'undefined' && ReactDOM.createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowAddMenu(false)}
          />
          <div
            className="fixed z-[9999] bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 w-[200px] max-h-[400px] overflow-y-auto"
            style={{ 
              left: `${addMenuPosition.x}px`, 
              top: `${addMenuPosition.y}px`
            }}
          >
            <div className="text-xs font-medium text-gray-400 px-2 py-1">Add Node</div>
            {[
              { type: 'user-interaction' as NodeType, label: 'User Interaction', icon: '💬' },
              { type: 'if' as NodeType, label: 'Condition (If)', icon: '🔀' },
              { type: 'tool-call' as NodeType, label: 'Tool Call', icon: '🔧' },
              { type: 'decision' as NodeType, label: 'AI Decision', icon: '🧠' },
              { type: 'data-query' as NodeType, label: 'Data Query', icon: '💾' },
              { type: 'parallel' as NodeType, label: 'Parallel', icon: '⚡' },
              { type: 'merge' as NodeType, label: 'Merge', icon: '🔗' },
              { type: 'end' as NodeType, label: 'End', icon: '⏹️' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddNode(item.type)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm text-gray-200 flex items-center gap-2"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// Wrapper component that provides ReactFlow context
export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
