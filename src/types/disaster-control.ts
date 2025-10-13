/**
 * Disaster Control Node Graph Data Model
 * 
 * This system allows creating AI-powered disaster response workflows
 * using a visual node editor. Nodes can call tools, make decisions,
 * and interact with users.
 */

// ============================================================================
// Core Node Types
// ============================================================================

export type NodeType = 
  | 'start'           // Entry point for the workflow
  | 'if'              // Conditional branching based on AI evaluation
  | 'user-interaction' // Interact with user via chat panel
  | 'tool-call'       // Call emergency action tools
  | 'data-query'      // Query knowledge base or Firebase
  | 'decision'        // AI makes a decision based on context
  | 'parallel'        // Execute multiple branches in parallel
  | 'merge'           // Merge multiple branches back together
  | 'end';            // Terminal node

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error' | 'waiting';

// ============================================================================
// Node Data Structures
// ============================================================================

export interface BaseNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  status: NodeStatus;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface StartNode extends BaseNode {
  type: 'start';
  data: {
    initialContext: string;
    triggerConditions?: string[];
  };
}

export interface IfNode extends BaseNode {
  type: 'if';
  data: {
    condition: string; // Natural language condition for AI to evaluate
    evaluationPrompt?: string;
    trueOutputId?: string;
    falseOutputId?: string;
  };
}

export interface UserInteractionNode extends BaseNode {
  type: 'user-interaction';
  data: {
    prompt: string; // Message to show user
    expectedResponseType?: 'text' | 'confirmation' | 'choice' | 'data';
    choices?: string[];
    timeout?: number; // Timeout in seconds
    saveResponseAs?: string; // Variable name to save response
  };
}

export interface ToolCallNode extends BaseNode {
  type: 'tool-call';
  data: {
    toolName: string;
    toolDescription: string;
    parameters: Record<string, any>;
    saveResultAs?: string;
    retryOnFailure?: boolean;
    maxRetries?: number;
  };
}

export interface DataQueryNode extends BaseNode {
  type: 'data-query';
  data: {
    queryType: 'firebase' | 'knowledge-base' | 'simulation';
    collection?: string;
    query: string;
    filters?: Record<string, any>;
    saveResultAs?: string;
  };
}

export interface DecisionNode extends BaseNode {
  type: 'decision';
  data: {
    decisionPrompt: string;
    options: string[];
    context?: string;
    saveDecisionAs?: string;
  };
}

export interface ParallelNode extends BaseNode {
  type: 'parallel';
  data: {
    branches: string[]; // IDs of nodes to execute in parallel
    waitForAll?: boolean;
  };
}

export interface MergeNode extends BaseNode {
  type: 'merge';
  data: {
    mergeStrategy: 'wait-all' | 'first-complete' | 'any-success';
    combineResults?: boolean;
  };
}

export interface EndNode extends BaseNode {
  type: 'end';
  data: {
    summary?: string;
    outputVariables?: string[];
  };
}

export type GraphNode = 
  | StartNode 
  | IfNode 
  | UserInteractionNode 
  | ToolCallNode 
  | DataQueryNode 
  | DecisionNode 
  | ParallelNode 
  | MergeNode 
  | EndNode;

// ============================================================================
// Connections
// ============================================================================

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string; // For nodes with multiple outputs (e.g., 'true', 'false')
  targetHandle?: string;
  label?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Execution Context
// ============================================================================

export interface ExecutionContext {
  variables: Record<string, any>; // Stored variables from node executions
  knowledgeBase: KnowledgeEntry[]; // Accumulated knowledge from tool calls
  history: ExecutionHistoryEntry[];
  currentNodeId?: string;
  startTime: Date;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
}

export interface KnowledgeEntry {
  id: string;
  timestamp: Date;
  nodeId: string;
  type: 'tool-result' | 'user-input' | 'decision' | 'query-result';
  content: any;
  summary: string;
  tags?: string[];
}

export interface ExecutionHistoryEntry {
  id: string;
  timestamp: Date;
  nodeId: string;
  nodeType: NodeType;
  action: string;
  input?: any;
  output?: any;
  duration?: number;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

// ============================================================================
// Graph Structure
// ============================================================================

export interface DisasterControlGraph {
  id: string;
  name: string;
  description: string;
  nodes: GraphNode[];
  connections: NodeConnection[];
  metadata: {
    created: Date;
    modified: Date;
    version: string;
    author?: string;
    tags?: string[];
  };
}

// ============================================================================
// UI State
// ============================================================================

export interface NodeEditorState {
  selectedNodeId?: string;
  selectedConnectionId?: string;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  isDragging: boolean;
  isConnecting: boolean;
  connectionStart?: {
    nodeId: string;
    handle?: string;
  };
}

// ============================================================================
// Agent Chat
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  nodeId?: string; // Associated node if message is from a node
  metadata?: Record<string, any>;
}

export interface AgentChatState {
  messages: ChatMessage[];
  isWaitingForUser: boolean;
  currentPrompt?: string;
  expectedResponseType?: string;
}

// ============================================================================
// Tool Definitions
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
  }[];
  category: 'emergency' | 'communication' | 'data' | 'analysis';
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'dispatch-emergency-vehicle',
    description: 'Dispatch emergency vehicles (ambulance, fire truck, police, helicopter)',
    parameters: [
      { name: 'vehicleType', type: 'string', description: 'Type of vehicle', required: true },
      { name: 'location', type: 'coordinates', description: 'Destination coordinates', required: true },
      { name: 'priority', type: 'string', description: 'Priority level (low/medium/high/critical)', required: true },
      { name: 'crew', type: 'number', description: 'Number of crew members', required: false, default: 2 },
    ],
    category: 'emergency',
  },
  {
    name: 'initiate-evacuation',
    description: 'Initiate evacuation for a specific area',
    parameters: [
      { name: 'area', type: 'polygon', description: 'Area to evacuate', required: true },
      { name: 'shelterLocation', type: 'coordinates', description: 'Shelter coordinates', required: true },
      { name: 'estimatedPopulation', type: 'number', description: 'Estimated population', required: true },
      { name: 'urgency', type: 'string', description: 'Urgency level', required: true },
    ],
    category: 'emergency',
  },
  {
    name: 'send-mass-notification',
    description: 'Send mass notification via multiple channels',
    parameters: [
      { name: 'message', type: 'string', description: 'Notification message', required: true },
      { name: 'channels', type: 'array', description: 'Communication channels', required: true },
      { name: 'area', type: 'polygon', description: 'Target area', required: true },
      { name: 'languages', type: 'array', description: 'Languages for message', required: false },
    ],
    category: 'communication',
  },
  {
    name: 'query-simulation-data',
    description: 'Query simulation data for analysis',
    parameters: [
      { name: 'dataType', type: 'string', description: 'Type of data to query', required: true },
      { name: 'timeRange', type: 'object', description: 'Time range for query', required: false },
      { name: 'filters', type: 'object', description: 'Additional filters', required: false },
    ],
    category: 'data',
  },
  {
    name: 'analyze-risk-level',
    description: 'Analyze risk level for a specific area',
    parameters: [
      { name: 'area', type: 'polygon', description: 'Area to analyze', required: true },
      { name: 'factors', type: 'array', description: 'Risk factors to consider', required: true },
    ],
    category: 'analysis',
  },
];
