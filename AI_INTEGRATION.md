# AI Integration with Vercel AI SDK

This project now includes a comprehensive AI assistant powered by OpenAI and the Vercel AI SDK, specifically designed for emergency management and disaster response scenarios.

## Features

### 🤖 AI Assistant
- **Specialized for Emergency Management**: Trained to help with disaster response, evacuation planning, and emergency coordination
- **Real-time Chat Interface**: Streamlined chat experience with typing indicators and smooth animations
- **Multi-step Tool Execution**: Can perform complex multi-step operations using various tools

### 🛠️ MCP Tools Available

1. **Weather Tool** (`weather`)
   - Get current weather conditions for emergency monitoring
   - Supports both Celsius and Fahrenheit
   - Provides emergency level assessment based on conditions

2. **Emergency Resources Tool** (`emergencyResources`)
   - Manage emergency shelters, medical facilities, food supplies, and transport
   - Allocate resources during emergencies
   - Check resource availability and status

3. **Geospatial Analysis Tool** (`geospatialAnalysis`)
   - Analyze evacuation routes and risk assessment
   - Population density analysis
   - Infrastructure assessment for emergency planning

4. **Emergency Communication Tool** (`emergencyCommunication`)
   - Send emergency alerts and notifications
   - Coordinate communication during disasters
   - Support for different priority levels and target audiences

5. **Simulation Analysis Tool** (`simulationAnalysis`)
   - Analyze emergency simulation data
   - Evaluate evacuation patterns and response effectiveness
   - Generate insights and recommendations

## Setup

### 1. Environment Configuration
Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Dependencies
The following packages are already installed:
- `ai` - Core AI SDK
- `@ai-sdk/react` - React hooks for AI
- `@ai-sdk/openai` - OpenAI provider
- `zod` - Schema validation

### 3. Usage
1. Click the "AI Assistant" button in the sidebar
2. Start chatting with the AI about emergency management topics
3. The AI can use various tools to provide real-time information and analysis

## Architecture

### Agent Configuration (`src/lib/agent.ts`)
- Centralized configuration for the AI agent
- System prompts tailored for emergency management
- All MCP tools defined with proper schemas
- Easy to extend with additional tools

### API Route (`src/app/api/chat/route.ts`)
- Clean API endpoint using the agent configuration
- Handles streaming responses
- Supports multi-step tool execution

### UI Components
- **AIChat** (`src/components/ai-chat.tsx`): Main chat interface
- **Sidebar Integration**: Easy access via sidebar button
- **Responsive Design**: Works on all screen sizes

## Customization

### Adding New Tools
1. Define the tool in `src/lib/agent.ts` in the `MCP_TOOLS` object
2. Add proper Zod schema for input validation
3. Implement the execute function
4. Update the UI to handle the new tool type in `ai-chat.tsx`

### Modifying System Prompts
Edit the `systemPrompt` in `AGENT_CONFIG` in `src/lib/agent.ts` to change the AI's behavior and expertise.

### Tool Display
Customize how tools are displayed in the chat by modifying the `getToolDisplay` function in `ai-chat.tsx`.

## Example Queries

Try asking the AI:
- "What's the weather like in Zurich for emergency planning?"
- "Show me available emergency resources in the area"
- "Analyze evacuation routes for the downtown area"
- "Send an emergency alert to residents about the storm"
- "Analyze the effectiveness of our last evacuation simulation"

## Security Notes

- API keys are stored in `.env.local` and not committed to version control
- All tool executions happen server-side
- Input validation using Zod schemas
- Rate limiting handled by OpenAI's API

## Next Steps

- Add real API integrations for weather, emergency services, etc.
- Implement user authentication and role-based access
- Add data persistence for chat history
- Create specialized tools for your specific emergency management needs
