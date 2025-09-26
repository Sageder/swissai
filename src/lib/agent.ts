import { openai } from '@ai-sdk/openai';
import { tool, stepCountIs } from 'ai';
import { z } from 'zod';

// Agent Configuration
export const AGENT_CONFIG = {
    // Model configuration
    model: openai('gpt-4o'),

    // System prompt for the agent
    systemPrompt: `You are a helpful AI assistant specialized in emergency management and disaster response. 
You have access to various tools to help with emergency situations, data analysis, and simulation management.

Your capabilities include:
- Analyzing emergency data and simulation results
- Managing evacuation procedures and resource allocation
- Processing geospatial data and mapping information
- Handling emergency communication and coordination
- Providing insights on disaster response strategies

Always be helpful, accurate, and prioritize safety in emergency situations.`,

    // Stop condition for multi-step tool calls
    stopWhen: stepCountIs(5),

    // Maximum duration for streaming responses (30 seconds)
    maxDuration: 30,
};

// MCP Tools Configuration
export const MCP_TOOLS = {
    // Weather tool for emergency weather monitoring
    weather: tool({
        description: 'Get current weather conditions for emergency monitoring and evacuation planning',
        inputSchema: z.object({
            location: z.string().describe('The location to get weather data for (city, coordinates, or region)'),
            units: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature units (default: celsius)'),
        }),
        execute: async ({ location, units = 'celsius' }) => {
            // Simulate weather data - in production, integrate with real weather API
            const temperature = Math.round(Math.random() * (35 - (-10)) + (-10));
            const conditions = ['Clear', 'Cloudy', 'Rainy', 'Stormy', 'Foggy'][Math.floor(Math.random() * 5)];
            const windSpeed = Math.round(Math.random() * 50 + 5);

            return {
                location,
                temperature: units === 'fahrenheit' ? Math.round(temperature * 9 / 5 + 32) : temperature,
                units,
                conditions,
                windSpeed,
                timestamp: new Date().toISOString(),
                emergencyLevel: conditions === 'Stormy' ? 'HIGH' : conditions === 'Rainy' ? 'MEDIUM' : 'LOW'
            };
        },
    }),

    // Emergency resource management tool
    emergencyResources: tool({
        description: 'Manage emergency resources, evacuation centers, and emergency services',
        inputSchema: z.object({
            action: z.enum(['list', 'allocate', 'status']).describe('Action to perform on emergency resources'),
            resourceType: z.string().optional().describe('Type of resource (shelters, medical, food, transport)'),
            location: z.string().optional().describe('Location for resource allocation'),
            quantity: z.number().optional().describe('Quantity of resources needed'),
        }),
        execute: async ({ action, resourceType, location, quantity }) => {
            // Simulate emergency resource management
            const resources = {
                shelters: { available: 15, capacity: 500, locations: ['Community Center', 'School Gym', 'Church Hall'] },
                medical: { available: 8, capacity: 200, locations: ['Hospital', 'Clinic', 'Mobile Units'] },
                food: { available: 1000, capacity: 5000, locations: ['Food Bank', 'Restaurant', 'Catering'] },
                transport: { available: 25, capacity: 300, locations: ['Bus Depot', 'Taxi Service', 'Volunteer Cars'] }
            };

            if (action === 'list') {
                return {
                    action: 'list',
                    resources: resourceType ? { [resourceType]: resources[resourceType as keyof typeof resources] } : resources,
                    timestamp: new Date().toISOString()
                };
            }

            if (action === 'allocate' && resourceType && location && quantity) {
                const resource = resources[resourceType as keyof typeof resources];
                if (resource && resource.available >= quantity) {
                    resource.available -= quantity;
                    return {
                        action: 'allocate',
                        resourceType,
                        location,
                        quantity,
                        status: 'ALLOCATED',
                        remaining: resource.available,
                        timestamp: new Date().toISOString()
                    };
                } else {
                    return {
                        action: 'allocate',
                        resourceType,
                        location,
                        quantity,
                        status: 'INSUFFICIENT_RESOURCES',
                        available: resource?.available || 0,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            return {
                action,
                status: 'INVALID_REQUEST',
                message: 'Missing required parameters for resource allocation',
                timestamp: new Date().toISOString()
            };
        },
    }),

    // Geospatial analysis tool
    geospatialAnalysis: tool({
        description: 'Analyze geospatial data for evacuation routes, risk assessment, and area mapping',
        inputSchema: z.object({
            analysisType: z.enum(['evacuation_routes', 'risk_assessment', 'population_density', 'infrastructure']).describe('Type of geospatial analysis'),
            coordinates: z.object({
                lat: z.number().describe('Latitude coordinate'),
                lng: z.number().describe('Longitude coordinate')
            }).optional().describe('Center coordinates for analysis'),
            radius: z.number().optional().describe('Analysis radius in kilometers'),
        }),
        execute: async ({ analysisType, coordinates, radius = 5 }) => {
            // Simulate geospatial analysis
            const analysis = {
                evacuation_routes: {
                    primary: ['Route A: Main Highway', 'Route B: Secondary Road', 'Route C: Emergency Path'],
                    capacity: 1500,
                    estimatedTime: '45 minutes',
                    riskLevel: 'LOW'
                },
                risk_assessment: {
                    floodRisk: 'MEDIUM',
                    landslideRisk: 'LOW',
                    fireRisk: 'HIGH',
                    overallRisk: 'MEDIUM'
                },
                population_density: {
                    totalPopulation: 25000,
                    density: 'HIGH',
                    vulnerableGroups: ['Elderly: 15%', 'Children: 20%', 'Disabled: 5%']
                },
                infrastructure: {
                    hospitals: 2,
                    schools: 8,
                    shelters: 3,
                    communication: 'GOOD',
                    power: 'STABLE'
                }
            };

            return {
                analysisType,
                coordinates,
                radius,
                results: analysis[analysisType],
                timestamp: new Date().toISOString()
            };
        },
    }),

    // Emergency communication tool
    emergencyCommunication: tool({
        description: 'Send emergency alerts, notifications, and coordinate communication during disasters',
        inputSchema: z.object({
            messageType: z.enum(['alert', 'evacuation', 'all_clear', 'update']).describe('Type of emergency message'),
            priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).describe('Message priority level'),
            target: z.string().describe('Target audience (residents, emergency_services, volunteers)'),
            message: z.string().describe('Emergency message content'),
            location: z.string().optional().describe('Affected location'),
        }),
        execute: async ({ messageType, priority, target, message, location }) => {
            // Simulate emergency communication
            const communication = {
                messageType,
                priority,
                target,
                message,
                location,
                status: 'SENT',
                deliveryTime: new Date().toISOString(),
                estimatedReach: target === 'residents' ? '95%' : target === 'emergency_services' ? '100%' : '80%',
                channels: ['SMS', 'Email', 'Radio', 'Social Media']
            };

            return communication;
        },
    }),

    // Data analysis tool for simulation results
    simulationAnalysis: tool({
        description: 'Analyze emergency simulation data, evacuation patterns, and response effectiveness',
        inputSchema: z.object({
            dataType: z.enum(['evacuation', 'resource_usage', 'timeline', 'effectiveness']).describe('Type of simulation data to analyze'),
            timeRange: z.object({
                start: z.string().describe('Start time (ISO format)'),
                end: z.string().describe('End time (ISO format)')
            }).optional().describe('Time range for analysis'),
            metrics: z.array(z.string()).optional().describe('Specific metrics to analyze'),
        }),
        execute: async ({ dataType, timeRange, metrics }) => {
            // Simulate simulation data analysis
            const analysis = {
                evacuation: {
                    totalEvacuees: 1250,
                    averageEvacuationTime: '2.5 hours',
                    bottlenecks: ['Highway Junction', 'Bridge Crossing'],
                    successRate: '92%'
                },
                resource_usage: {
                    shelters: { utilized: 85, available: 15, efficiency: 'HIGH' },
                    medical: { utilized: 70, available: 30, efficiency: 'MEDIUM' },
                    transport: { utilized: 90, available: 10, efficiency: 'HIGH' }
                },
                timeline: {
                    alertTime: '00:00',
                    evacuationStart: '00:15',
                    peakEvacuation: '01:30',
                    completion: '03:45'
                },
                effectiveness: {
                    overallScore: 8.5,
                    communication: 9.0,
                    coordination: 8.0,
                    resourceManagement: 8.5,
                    recommendations: ['Improve bridge capacity', 'Add more medical units']
                }
            };

            return {
                dataType,
                timeRange,
                metrics,
                analysis: analysis[dataType],
                timestamp: new Date().toISOString()
            };
        },
    }),
};

// Export the complete agent configuration
export const createAgent = () => ({
    ...AGENT_CONFIG,
    tools: MCP_TOOLS,
});
