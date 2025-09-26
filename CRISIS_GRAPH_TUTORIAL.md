# Crisis Management Graph Creation Tutorial

This tutorial explains how to programmatically create crisis response graphs using the utility functions in `util.ts`. These functions are designed for LLM agents to generate structured crisis management visualizations.

## Overview

The crisis management system supports three main graph creation patterns:
1. **Direct LLM Data** - Create graphs from structured JSON
2. **Crisis Workflows** - Create scenario-based response flows
3. **Crisis Hierarchies** - Create organizational management structures

## Function Reference

### 1. Direct LLM Graph Creation

**Function**: `createCrisisGraphFromLLM(graphData: LLMGraphData)`

Creates a complete graph from structured LLM data. This is the most flexible approach.

#### Input Structure
```typescript
interface LLMGraphData {
  nodes: LLMNodeData[];
  connections: LLMConnectionData[];
}

interface LLMNodeData {
  id: string;
  type: 'alert' | 'monitoring' | 'response' | 'resource' | 'authority';
  title: string;
  description: string;
  status: string;
  severity?: 'low' | 'medium' | 'high';
  position: { x: number; y: number };
}

interface LLMConnectionData {
  from: string;
  to: string;
  type: 'data_flow' | 'response' | 'coordination' | 'dependency';
  label?: string;
  status?: string;
}
```

#### Example Usage
```javascript
import { createCrisisGraphFromLLM, validateLLMGraphData } from '@/lib/util';

// Create a crisis response graph
const crisisData = {
  nodes: [
    {
      id: 'earthquake_alert',
      type: 'alert',
      title: 'Earthquake Alert',
      description: 'Magnitude 6.2 detected in downtown area',
      status: 'active',
      severity: 'high',
      position: { x: 100, y: 100 }
    },
    {
      id: 'emergency_response',
      type: 'response',
      title: 'Emergency Response Team',
      description: 'Deployed to affected areas',
      status: 'pending',
      severity: 'high',
      position: { x: 300, y: 100 }
    },
    {
      id: 'fire_department',
      type: 'resource',
      title: 'Fire Department',
      description: '3 units deployed',
      status: 'active',
      severity: 'medium',
      position: { x: 200, y: 250 }
    }
  ],
  connections: [
    {
      from: 'earthquake_alert',
      to: 'emergency_response',
      type: 'response',
      label: 'TRIGGERS',
      status: 'active'
    },
    {
      from: 'emergency_response',
      to: 'fire_department',
      type: 'coordination',
      label: 'DEPLOYS',
      status: 'active'
    }
  ]
};

// Validate data before creating graph
const validation = validateLLMGraphData(crisisData);
if (validation.valid) {
  createCrisisGraphFromLLM(crisisData);
  console.log('Crisis graph created successfully');
} else {
  console.error('Validation errors:', validation.errors);
}
```

### 2. Crisis Workflow Creation

**Function**: `createCrisisWorkflow(scenario)`

Creates a structured crisis response workflow with automatic connection logic.

#### Input Structure
```typescript
{
  alert: { title: string; description: string; severity: 'low' | 'medium' | 'high' };
  monitoring: Array<{ title: string; description: string; position: { x: number; y: number } }>;
  responses: Array<{ title: string; description: string; position: { x: number; y: number } }>;
  resources: Array<{ title: string; description: string; position: { x: number; y: number } }>;
  authorities: Array<{ title: string; description: string; position: { x: number; y: number } }>;
}
```

#### Example Usage
```javascript
import { createCrisisWorkflow } from '@/lib/util';

createCrisisWorkflow({
  alert: {
    title: 'Flood Warning',
    description: 'River levels rising rapidly',
    severity: 'high'
  },
  monitoring: [
    { 
      title: 'Water Level Monitor', 
      description: 'Real-time river tracking', 
      position: { x: 50, y: 200 } 
    },
    { 
      title: 'Weather Station', 
      description: 'Rainfall monitoring', 
      position: { x: 150, y: 200 } 
    }
  ],
  responses: [
    { 
      title: 'Evacuation Plan', 
      description: 'Zone A & B evacuation', 
      position: { x: 100, y: 300 } 
    },
    { 
      title: 'Emergency Shelters', 
      description: 'Community centers activated', 
      position: { x: 250, y: 300 } 
    }
  ],
  resources: [
    { 
      title: 'Rescue Teams', 
      description: '5 units available', 
      position: { x: 50, y: 400 } 
    },
    { 
      title: 'Medical Teams', 
      description: '3 units on standby', 
      position: { x: 200, y: 400 } 
    }
  ],
  authorities: [
    { 
      title: 'Crisis Commander', 
      description: 'Overall coordination', 
      position: { x: 300, y: 200 } 
    }
  ]
});
```

### 3. Crisis Hierarchy Creation

**Function**: `createCrisisHierarchy(hierarchy)`

Creates hierarchical organizational structures for crisis management.

#### Input Structure
```typescript
{
  root: { title: string; description: string; type: 'authority' | 'response' };
  levels: Array<{
    level: number;
    nodes: Array<{
      title: string;
      description: string;
      type: 'alert' | 'monitoring' | 'response' | 'resource' | 'authority';
      connections: string[]; // IDs of nodes to connect to
    }>;
  }>;
}
```

#### Example Usage
```javascript
import { createCrisisHierarchy } from '@/lib/util';

createCrisisHierarchy({
  root: {
    title: 'Crisis Command Center',
    description: 'Central coordination hub',
    type: 'authority'
  },
  levels: [
    {
      level: 0,
      nodes: [
        {
          title: 'Emergency Response Team',
          description: 'First responders',
          type: 'response',
          connections: ['root']
        },
        {
          title: 'Medical Team',
          description: 'Healthcare response',
          type: 'response',
          connections: ['root']
        }
      ]
    },
    {
      level: 1,
      nodes: [
        {
          title: 'Fire Department',
          description: 'Fire suppression',
          type: 'resource',
          connections: ['level_0_node_0']
        },
        {
          title: 'Police Department',
          description: 'Security and order',
          type: 'resource',
          connections: ['level_0_node_0']
        }
      ]
    }
  ]
});
```

## Node Types and Their Meanings

### Alert Nodes
- **Purpose**: Represent crisis events or warnings
- **Color**: Orange border
- **Common uses**: Earthquake alerts, flood warnings, fire incidents

### Monitoring Nodes
- **Purpose**: Represent monitoring systems and sensors
- **Color**: Blue border
- **Common uses**: Seismic monitors, weather stations, GPS trackers

### Response Nodes
- **Purpose**: Represent response actions and plans
- **Color**: Red border
- **Common uses**: Emergency response teams, evacuation plans, rescue operations

### Resource Nodes
- **Purpose**: Represent available resources and assets
- **Color**: Green border
- **Common uses**: Fire departments, medical teams, equipment

### Authority Nodes
- **Purpose**: Represent decision-makers and coordinators
- **Color**: Purple border
- **Common uses**: Crisis commanders, government officials, coordinators

## Connection Types and Their Meanings

### Data Flow
- **Purpose**: Information transfer between systems
- **Color**: Blue
- **Common uses**: Alert → Monitoring, Sensor → Analysis

### Response
- **Purpose**: Direct response actions triggered by events
- **Color**: Red
- **Common uses**: Alert → Emergency Response, Crisis → Action

### Coordination
- **Purpose**: Coordination between teams and resources
- **Color**: Green
- **Common uses**: Response Team → Resources, Authority → Teams

### Dependency
- **Purpose**: Dependencies between resources or processes
- **Color**: Yellow
- **Common uses**: Resource A → Resource B, Process → Prerequisite

## Best Practices

### 1. Data Validation
Always validate LLM data before creating graphs:
```javascript
const validation = validateLLMGraphData(graphData);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}
```

### 2. Positioning Strategy
- **Alert nodes**: Place at top (y: 100-150)
- **Monitoring nodes**: Place below alerts (y: 200-250)
- **Response nodes**: Place in middle (y: 300-350)
- **Resource nodes**: Place at bottom (y: 400-450)
- **Authority nodes**: Place on sides (x: 300-400)

### 3. Connection Logic
- **Alert → Monitoring**: Data flow connections
- **Alert → Response**: Response connections
- **Response → Resources**: Coordination connections
- **Authority → Response**: Coordination connections

### 4. Error Handling
```javascript
try {
  const result = createCrisisGraphFromLLM(graphData);
  console.log('Graph created with', result.nodeIds.length, 'nodes');
} catch (error) {
  console.error('Failed to create graph:', error);
}
```

## Common Patterns

### 1. Simple Crisis Response
```javascript
// Alert triggers response, response deploys resources
const simpleCrisis = {
  nodes: [
    { id: 'alert', type: 'alert', title: 'Crisis Alert', ... },
    { id: 'response', type: 'response', title: 'Emergency Response', ... },
    { id: 'resource', type: 'resource', title: 'Response Team', ... }
  ],
  connections: [
    { from: 'alert', to: 'response', type: 'response' },
    { from: 'response', to: 'resource', type: 'coordination' }
  ]
};
```

### 2. Multi-Level Coordination
```javascript
// Authority coordinates multiple response teams
const multiLevel = {
  nodes: [
    { id: 'authority', type: 'authority', title: 'Crisis Commander', ... },
    { id: 'response1', type: 'response', title: 'Team A', ... },
    { id: 'response2', type: 'response', title: 'Team B', ... }
  ],
  connections: [
    { from: 'authority', to: 'response1', type: 'coordination' },
    { from: 'authority', to: 'response2', type: 'coordination' }
  ]
};
```

### 3. Monitoring Network
```javascript
// Multiple monitoring systems feeding into analysis
const monitoring = {
  nodes: [
    { id: 'sensor1', type: 'monitoring', title: 'Sensor A', ... },
    { id: 'sensor2', type: 'monitoring', title: 'Sensor B', ... },
    { id: 'analysis', type: 'response', title: 'Data Analysis', ... }
  ],
  connections: [
    { from: 'sensor1', to: 'analysis', type: 'data_flow' },
    { from: 'sensor2', to: 'analysis', type: 'data_flow' }
  ]
};
```

## Troubleshooting

### Common Issues

1. **Invalid node types**: Ensure all node types are from the allowed list
2. **Missing connections**: Check that all connection `from` and `to` IDs exist in nodes
3. **Position conflicts**: Avoid overlapping positions by spacing nodes appropriately
4. **Validation errors**: Use `validateLLMGraphData()` to catch issues early

### Debug Tips

1. **Check console logs**: All functions log their progress
2. **Validate data first**: Always validate before creating graphs
3. **Test with simple data**: Start with basic examples before complex graphs
4. **Use debug panel**: Test functions using the debug panel buttons

## Integration with LLMs

### Prompt Template for LLMs
```
Create a crisis response graph for the following scenario: [SCENARIO]

Use this structure:
{
  "nodes": [
    {
      "id": "unique_id",
      "type": "alert|monitoring|response|resource|authority",
      "title": "Node Title",
      "description": "Node Description",
      "status": "active|inactive|pending|completed",
      "severity": "low|medium|high",
      "position": {"x": number, "y": number}
    }
  ],
  "connections": [
    {
      "from": "source_node_id",
      "to": "target_node_id",
      "type": "data_flow|response|coordination|dependency",
      "label": "Connection Label",
      "status": "active|inactive|pending"
    }
  ]
}
```

### LLM Response Processing
```javascript
// Process LLM response
const llmResponse = await processLLMResponse(response);
const graphData = JSON.parse(llmResponse);

// Validate and create graph
const validation = validateLLMGraphData(graphData);
if (validation.valid) {
  createCrisisGraphFromLLM(graphData);
} else {
  // Handle validation errors
  console.error('LLM data validation failed:', validation.errors);
}
```

This tutorial provides everything needed to programmatically create crisis management graphs using the utility functions. The system is designed to be flexible and robust for LLM integration while maintaining data integrity and user experience.
