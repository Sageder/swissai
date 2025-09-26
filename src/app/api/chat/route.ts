import { createOpenAI } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import {
  mockDataTool,
  weatherTool,
  emergencyResourcesTool,
  geospatialAnalysisTool,
  emergencyCommunicationTool,
  simulationAnalysisTool,
  webSearchTool,
  emergencyVehicleDispatchTool,
  evacuationManagementTool,
  communicationInfrastructureTool,
  massNotificationTool,
} from "@/lib/agent";

// Allow streaming responses up to 60 seconds for complex tool operations
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Get OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

    if (!apiKey) {
      console.error("OpenAI API key not found in environment variables");
      return new Response(
        "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env.local file.",
        { status: 500 }
      );
    }

    // Create OpenAI instance with explicit API key
    const openai = createOpenAI({
      apiKey: apiKey,
    });

    // Enhanced system prompt with SwissAI context
    const systemPrompt = `You are an advanced AI assistant for the SwissAI Emergency Management System, a comprehensive crisis response platform designed for the Swiss Alpine region.

## SYSTEM CONTEXT
You are integrated into a sophisticated emergency management dashboard that includes:
- Interactive 3D map visualization with real-time data
- Polygon-based area management for emergency zones
- Real-time vehicle tracking and dispatch
- POI (Points of Interest) management for resources and infrastructure
- Timeline-based simulation and planning
- Multi-language support (German, French, Italian, English)
- Integration with Swiss emergency services and authorities

## YOUR CAPABILITIES
You have access to powerful tools for:
1. **Data Access**: Query local JSON data files for events, monitoring data, authorities, resources, infrastructure, decision logs, and public communications
2. **Emergency Vehicle Dispatch**: Deploy ambulances, fire trucks, police, helicopters, and evacuation buses
3. **Evacuation Management**: Initiate and coordinate large-scale evacuations with route planning
4. **Communication Infrastructure**: Deploy mobile towers, satellite links, and emergency broadcast systems
5. **Mass Notifications**: Send targeted alerts via SMS, email, radio, TV, social media, and emergency sirens
6. **Resource Management**: Allocate shelters, medical facilities, food, and transport resources
7. **Geospatial Analysis**: Analyze evacuation routes, risk assessment, population density, and infrastructure
8. **Weather Monitoring**: Access real-time weather data for emergency planning
9. **Simulation Analysis**: Evaluate evacuation patterns, resource usage, and response effectiveness

## POLYGON CONTEXT
When analyzing polygon areas, consider:
- Polygon vertices define emergency zones or areas of interest
- Each polygon has coordinates, name, and associated metadata
- Population estimates and vulnerability assessments for each area
- Nearby resources, evacuation routes, and shelter locations
- Geographic challenges specific to Swiss Alpine terrain

## RESPONSE GUIDELINES
1. **Be Proactive**: Suggest concrete actions using your tools
2. **Think Systematically**: Consider immediate, short-term, and long-term responses
3. **Prioritize Safety**: Always prioritize human life and safety
4. **Use Local Context**: Consider Swiss geography, weather, and infrastructure
5. **Coordinate Resources**: Think about resource allocation and logistics
6. **Communicate Clearly**: Provide structured, actionable recommendations
7. **Multi-lingual Awareness**: Consider Switzerland's linguistic diversity

## EMERGENCY RESPONSE PRIORITIES
1. **Life Safety**: Immediate threat to human life
2. **Incident Stabilization**: Contain and control the emergency
3. **Property Protection**: Minimize damage to infrastructure and property
4. **Environmental Protection**: Prevent environmental contamination
5. **Recovery Operations**: Plan for post-incident recovery

When responding to emergency scenarios, always use your tools to:
- Gather relevant data from local JSON files
- Dispatch appropriate emergency vehicles
- Initiate evacuations if necessary
- Set up communication infrastructure
- Send mass notifications to affected populations
- Coordinate resources and logistics

Provide detailed, actionable responses with specific recommendations and tool usage.`;

    const tools = {
      mock_data: mockDataTool,
      weather: weatherTool,
      emergency_resources: emergencyResourcesTool,
      geospatial_analysis: geospatialAnalysisTool,
      emergency_communication: emergencyCommunicationTool,
      simulation_analysis: simulationAnalysisTool,
      web_search: webSearchTool,
      vehicle_dispatch: emergencyVehicleDispatchTool,
      evacuation_management: evacuationManagementTool,
      communication_infrastructure: communicationInfrastructureTool,
      mass_notification: massNotificationTool,
    };

    const convertedMessages = convertToModelMessages(messages);

    const result = streamText({
        model: openai('gpt-4o-mini'),
        messages: convertedMessages,
        system: "You are a helpful AI assistant for emergency management. Provide clear, actionable emergency response recommendations.",
        temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      `Server error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        status: 500,
      }
    );
  }
}
