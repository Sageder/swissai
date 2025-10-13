# Disaster Control System

An AI-powered visual workflow system for emergency response management using a node-based editor.

## Overview

The Disaster Control System allows you to create, configure, and execute complex disaster response workflows using a visual node editor. The system combines:

- **Node Editor**: Visual workflow designer with Blender-style grid background
- **Properties Panel**: Configure individual nodes with specific parameters
- **Agent Chat**: Real-time communication with AI agent during workflow execution

## Architecture

### Layout (AAAABBCC)

```
┌─────────────────────────────────────────────────┐
│                   Toolbar                       │
├──────────────────────┬──────────┬───────────────┤
│                      │          │               │
│   Node Editor (60%)  │Props(20%)│  Chat (20%)   │
│   AAAA               │  BB      │   CC          │
│                      │          │               │
└──────────────────────┴──────────┴───────────────┘
```

## Node Types

### Control Nodes

1. **Start Node** (Always present)
   - Entry point for workflow
   - Define initial context
   - Single output

2. **If Node**
   - Conditional branching based on AI evaluation
   - Natural language condition
   - Two outputs: true (green) and false (red)

3. **Decision Node**
   - AI makes a decision from multiple options
   - Provides context and available choices
   - Single output with decision result

4. **Parallel Node**
   - Execute multiple branches simultaneously
   - Wait for all or first completion
   - Multiple outputs

5. **Merge Node**
   - Combine results from parallel branches
   - Different merge strategies
   - Single output

6. **End Node**
   - Terminal node for workflow
   - Summarize results
   - No outputs

### Tool Nodes

1. **User Interaction Node**
   - Interact with user via chat panel
   - Different response types: text, confirmation, choice, data
   - Timeout support
   - Save response to variable

2. **Tool Call Node**
   - Execute emergency action tools
   - Available tools:
     - `dispatch-emergency-vehicle`: Deploy emergency vehicles
     - `initiate-evacuation`: Start evacuation procedures
     - `send-mass-notification`: Send multi-channel alerts
     - `query-simulation-data`: Query simulation data
     - `analyze-risk-level`: Analyze area risk
   - Retry on failure support
   - Save result to knowledge base

3. **Data Query Node**
   - Query Firebase collections
   - Query knowledge base
   - Query simulation data
   - Filter and transform results

## Data Model

### Graph Structure

```typescript
DisasterControlGraph {
  id: string
  name: string
  description: string
  nodes: GraphNode[]
  connections: NodeConnection[]
  metadata: {
    created: Date
    modified: Date
    version: string
  }
}
```

### Execution Context

The system maintains rich execution context:

```typescript
ExecutionContext {
  variables: Record<string, any>        // Stored variables
  knowledgeBase: KnowledgeEntry[]       // Accumulated knowledge
  history: ExecutionHistoryEntry[]      // Execution history
  currentNodeId?: string                // Current executing node
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
}
```

### Knowledge Base

All tool call results are automatically saved to the knowledge base:

```typescript
KnowledgeEntry {
  id: string
  timestamp: Date
  nodeId: string
  type: 'tool-result' | 'user-input' | 'decision' | 'query-result'
  content: any
  summary: string
  tags?: string[]
}
```

## Features

### Node Editor

- **Blender-style grid background**: Black background with light gray dots
- **Pan and zoom**: Middle-mouse or Alt+Left-click to pan, scroll to zoom
- **Drag nodes**: Click and drag nodes to reposition
- **Create connections**: Drag from output handle to input handle
- **Visual feedback**: Selected nodes highlighted, status indicators
- **Multiple output handles**: If nodes have separate true/false outputs

### Properties Panel

- **Dynamic configuration**: Properties adapt to node type
- **Real-time updates**: Changes immediately reflected in graph
- **Tool selection**: Browse and configure available emergency tools
- **JSON parameter editing**: Advanced parameter configuration
- **Node actions**: Duplicate or delete nodes

### Agent Chat

- **Real-time communication**: Chat with AI agent during execution
- **User interaction**: Agent can request user input
- **Status indicators**: See execution status and progress
- **Knowledge base tracking**: View accumulated knowledge entries
- **Message history**: Full conversation history with timestamps

## Usage

### Creating a Workflow

1. **Start with the Start node** (automatically created)
2. **Add nodes** using the "Add Node" button in toolbar
3. **Configure nodes** by selecting them and editing properties
4. **Connect nodes** by dragging from output to input handles
5. **Execute workflow** using the Play button

### Example Workflow

```
Start
  ↓
[Data Query: Get current evacuees]
  ↓
[If: Are there more than 100 evacuees?]
  ├─ True → [Tool Call: Dispatch additional buses]
  │           ↓
  │         [User Interaction: Confirm dispatch]
  │           ↓
  │         [Merge]
  └─ False → [Merge]
               ↓
             [End]
```

### Execution Flow

1. **Click Play**: Workflow execution starts
2. **AI processes nodes**: Follows connections and executes nodes
3. **User interaction**: When needed, agent prompts user in chat
4. **Tool execution**: Emergency tools are called with configured parameters
5. **Knowledge accumulation**: Results stored in knowledge base
6. **Completion**: Workflow ends at End node

## Node Configuration Examples

### If Node

```yaml
Condition: "Is the risk level high or critical?"
Evaluation Prompt: "Consider weather data, population density, and terrain"
```

### User Interaction Node

```yaml
Prompt: "Should we proceed with evacuation?"
Response Type: confirmation
Save Response As: evacuationApproved
Timeout: 300 seconds
```

### Tool Call Node

```yaml
Tool: dispatch-emergency-vehicle
Parameters:
  vehicleType: "ambulance"
  location: [46.8182, 8.2275]
  priority: "high"
  crew: 4
Save Result As: ambulanceDispatch
Retry on Failure: true
```

### Data Query Node

```yaml
Query Type: firebase
Collection: evacuees
Query: "Get all evacuees in high-risk zones"
Save Result As: highRiskEvacuees
```

## AI Context

The AI agent has access to:

1. **Current graph structure**: All nodes and connections
2. **Execution context**: Variables, knowledge base, history
3. **Node configurations**: All parameters and settings
4. **Emergency tools**: Full tool definitions and capabilities
5. **Firebase data**: Access to simulation data
6. **User inputs**: All chat messages and responses

This rich context enables the AI to:
- Make informed decisions at Decision nodes
- Evaluate conditions at If nodes
- Provide relevant suggestions during User Interaction
- Execute tools with appropriate parameters
- Query relevant data sources

## Future Enhancements

- [ ] Save/Load workflows to/from Firebase
- [ ] Real-time collaboration on workflows
- [ ] Workflow templates for common scenarios
- [ ] Visual execution animation
- [ ] Breakpoints and step-through debugging
- [ ] Variable inspector panel
- [ ] Knowledge base search and filtering
- [ ] Export execution reports
- [ ] Integration with actual emergency services APIs
- [ ] Workflow validation and error checking
- [ ] Undo/Redo support
- [ ] Node grouping and subgraphs
- [ ] Custom node types via plugins

## Access

Navigate to `/disaster-control` to access the full-screen interface.

The component is also available for embedding:

```tsx
import { DisasterControlPane } from '@/components/disaster-control';

<DisasterControlPane className="w-full h-96" />
```
