'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Play, 
  GitBranch, 
  MessageSquare, 
  Wrench, 
  Database, 
  Brain, 
  GitMerge, 
  Square,
  Loader2
} from 'lucide-react';
import { NodeType, NodeStatus } from '@/types/disaster-control';

const nodeIcons: Record<NodeType, React.ComponentType<any>> = {
  'start': Play,
  'if': GitBranch,
  'user-interaction': MessageSquare,
  'tool-call': Wrench,
  'data-query': Database,
  'decision': Brain,
  'parallel': GitMerge,
  'merge': GitMerge,
  'end': Square,
};

const nodeColors: Record<NodeType, { bg: string; border: string; text: string }> = {
  'start': { bg: 'bg-green-900/40', border: 'border-green-500', text: 'text-green-300' },
  'if': { bg: 'bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-300' },
  'user-interaction': { bg: 'bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-300' },
  'tool-call': { bg: 'bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-300' },
  'data-query': { bg: 'bg-cyan-900/40', border: 'border-cyan-500', text: 'text-cyan-300' },
  'decision': { bg: 'bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-300' },
  'parallel': { bg: 'bg-pink-900/40', border: 'border-pink-500', text: 'text-pink-300' },
  'merge': { bg: 'bg-indigo-900/40', border: 'border-indigo-500', text: 'text-indigo-300' },
  'end': { bg: 'bg-red-900/40', border: 'border-red-500', text: 'text-red-300' },
};

const statusColors: Record<NodeStatus, string> = {
  'idle': 'border-gray-600',
  'running': 'border-blue-500 animate-pulse',
  'completed': 'border-green-500',
  'error': 'border-red-500',
  'waiting': 'border-yellow-500 animate-pulse',
};

export interface CustomNodeData {
  label: string;
  type: NodeType;
  status: NodeStatus;
  description?: string;
  data?: any;
}

export const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const Icon = nodeIcons[data.type];
  const colors = nodeColors[data.type];
  const statusColor = statusColors[data.status];

  const hasInputHandle = data.type !== 'start';
  const hasOutputHandle = data.type !== 'end';
  const hasTwoOutputs = data.type === 'if';

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 backdrop-blur-sm
        ${colors.bg} ${statusColor}
        ${selected ? 'ring-2 ring-white/50' : ''}
        min-w-[180px] max-w-[220px]
        transition-all duration-200
        hover:shadow-lg hover:scale-105
      `}
    >
      {/* Input Handle */}
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          className="w-3 h-3 !bg-gray-400 border-2 border-gray-600"
        />
      )}

      {/* Node Content */}
      <div className="flex items-start gap-2">
        <div className={`${colors.text} mt-0.5`}>
          {data.status === 'running' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${colors.text} truncate`}>
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      {data.status !== 'idle' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-current opacity-75" />
      )}

      {/* Output Handles */}
      {hasOutputHandle && !hasTwoOutputs && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="w-3 h-3 !bg-gray-400 border-2 border-gray-600"
        />
      )}

      {/* Two Outputs for If Node */}
      {hasTwoOutputs && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 !bg-green-500 border-2 border-green-700"
            style={{ left: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 !bg-red-500 border-2 border-red-700"
            style={{ left: '70%' }}
          />
          <div className="absolute -bottom-5 left-0 right-0 flex justify-around text-[10px] font-medium">
            <span className="text-green-400">T</span>
            <span className="text-red-400">F</span>
          </div>
        </>
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
