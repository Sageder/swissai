'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
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
  Panel,
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

export function FlowEditor({
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

  // Handle connection creation
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
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
    [onConnectionCreate]
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

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setAddMenuPosition({ x: event.clientX, y: event.clientY });
    setShowAddMenu(true);
  }, []);

  const handleAddNode = useCallback(
    (type: NodeType) => {
      // Convert screen coordinates to flow coordinates
      const flowPane = document.querySelector('.react-flow__pane');
      if (flowPane) {
        const rect = flowPane.getBoundingClientRect();
        const position = {
          x: addMenuPosition.x - rect.left,
          y: addMenuPosition.y - rect.top,
        };
        onNodeAdd(type, position);
      }
      setShowAddMenu(false);
    },
    [addMenuPosition, onNodeAdd]
  );

  return (
    <div className="relative w-full h-full">
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
        fitView
        className="bg-gray-950"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background color="#374151" gap={16} />
        <Controls className="bg-gray-800 border-gray-700" />
        <MiniMap
          className="bg-gray-900 border-gray-700"
          nodeColor={(node) => {
            const data = node.data as CustomNodeData;
            return data.type === 'start' ? '#22c55e' : '#6b7280';
          }}
        />
        
        {/* Add Node Panel */}
        <Panel position="top-left" className="bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg border border-gray-700">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>
        </Panel>
      </ReactFlow>

      {/* Add Node Context Menu */}
      {showAddMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAddMenu(false)}
          />
          <div
            className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 min-w-[200px]"
            style={{ left: addMenuPosition.x, top: addMenuPosition.y }}
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
        </>
      )}
    </div>
  );
}
