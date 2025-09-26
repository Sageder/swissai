import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Firebase data access tool for emergency management data
export const firebaseDataTool = tool({
  description:
    "Access emergency management data from Firebase with smart filtering capabilities",
  inputSchema: z.object({
    collection: z
      .enum([
        "events",
        "monitoring_data",
        "authorities",
        "resources",
        "infrastructure",
        "decision_log",
        "public_communications",
      ])
      .describe("Firebase collection to query"),
    filters: z
      .object({
        location: z
          .object({
            lat: z
              .number()
              .optional()
              .describe("Latitude for location-based filtering"),
            lng: z
              .number()
              .optional()
              .describe("Longitude for location-based filtering"),
            radius: z
              .number()
              .optional()
              .describe("Search radius in kilometers"),
            address: z
              .string()
              .optional()
              .describe("Address or location name to search for"),
          })
          .optional()
          .describe("Location-based filtering"),
        timeRange: z
          .object({
            start: z.string().optional().describe("Start time (ISO format)"),
            end: z.string().optional().describe("End time (ISO format)"),
            lastHours: z
              .number()
              .optional()
              .describe("Get data from last N hours"),
          })
          .optional()
          .describe("Time-based filtering"),
        status: z
          .string()
          .optional()
          .describe("Filter by status (e.g., active, available, critical)"),
        type: z.string().optional().describe("Filter by type or category"),
        severity: z
          .enum(["low", "medium", "high", "critical", "emergency"])
          .optional()
          .describe("Filter by severity level"),
        organization: z
          .string()
          .optional()
          .describe("Filter by responsible organization"),
        resourceType: z.string().optional().describe("Filter by resource type"),
        eventId: z.string().optional().describe("Filter by specific event ID"),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(20)
          .describe("Maximum number of results to return"),
      })
      .optional()
      .describe("Filtering options"),
    searchText: z
      .string()
      .optional()
      .describe("Text search across relevant fields"),
    sortBy: z
      .enum(["timestamp", "severity", "name", "status", "createdAt"])
      .default("timestamp")
      .describe("Field to sort results by"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort order"),
  }),
  execute: async ({
    collection: collectionName,
    filters = {},
    searchText,
    sortBy = "timestamp",
    sortOrder = "desc",
  }) => {
    try {
      console.log("🔥 Firebase Data Tool - Request:", {
        collection: collectionName,
        filters,
        searchText,
        sortBy,
        sortOrder,
        timestamp: new Date().toISOString(),
      });

      // Build the base query
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef);

      // Apply filters based on collection type
      const whereConditions = [];

      // Common filters for all collections
      if (filters.status) {
        whereConditions.push(where("status", "==", filters.status));
      }

      if (filters.type) {
        whereConditions.push(where("type", "==", filters.type));
      }

      if (filters.severity) {
        whereConditions.push(where("severity", "==", filters.severity));
      }

      if (filters.organization) {
        whereConditions.push(
          where("responsibleOrganization", "==", filters.organization)
        );
      }

      if (filters.eventId) {
        whereConditions.push(where("eventId", "==", filters.eventId));
      }

      // Collection-specific filters
      if (collectionName === "resources" && filters.resourceType) {
        whereConditions.push(where("type", "==", filters.resourceType));
      }

      if (collectionName === "monitoring_data" && filters.organization) {
        whereConditions.push(
          where("responsibleOrganization", "==", filters.organization)
        );
      }

      // Time-based filtering
      if (filters.timeRange) {
        if (filters.timeRange.start) {
          whereConditions.push(
            where("timestamp", ">=", new Date(filters.timeRange.start))
          );
        }
        if (filters.timeRange.end) {
          whereConditions.push(
            where("timestamp", "<=", new Date(filters.timeRange.end))
          );
        }
        if (filters.timeRange.lastHours) {
          const cutoffTime = new Date(
            Date.now() - filters.timeRange.lastHours * 60 * 60 * 1000
          );
          whereConditions.push(where("timestamp", ">=", cutoffTime));
        }
      }

      // Apply all where conditions
      if (whereConditions.length > 0) {
        q = query(collectionRef, ...whereConditions);
      }

      // Add sorting
      const sortField =
        sortBy === "timestamp"
          ? "timestamp"
          : sortBy === "severity"
          ? "severity"
          : sortBy === "name"
          ? "name"
          : sortBy === "status"
          ? "status"
          : "createdAt";

      q = query(q, orderBy(sortField, sortOrder));

      // Add limit
      q = query(q, limit(filters.limit || 20));

      // Execute query
      const querySnapshot = await getDocs(q);
      const results: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to ISO strings for better readability
          timestamp:
            data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          detectedAt:
            data.detectedAt?.toDate?.()?.toISOString() || data.detectedAt,
          eventOccurred:
            data.eventOccurred?.toDate?.()?.toISOString() || data.eventOccurred,
        });
      });

      // Apply text search if provided
      let filteredResults: any[] = results;
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filteredResults = results.filter((item) => {
          return Object.values(item).some((value) => {
            if (typeof value === "string") {
              return value.toLowerCase().includes(searchLower);
            }
            if (typeof value === "object" && value !== null) {
              return JSON.stringify(value).toLowerCase().includes(searchLower);
            }
            return false;
          });
        });
      }

      // Apply location-based filtering if coordinates provided
      if (filters.location?.lat && filters.location?.lng) {
        const { lat, lng, radius = 10 } = filters.location;
        filteredResults = filteredResults.filter((item) => {
          if (item.location?.lat && item.location?.lng) {
            const distance = calculateDistance(
              lat,
              lng,
              item.location.lat,
              item.location.lng
            );
            return distance <= radius;
          }
          return true; // Include items without location data
        });
      }

      const response = {
        collection: collectionName,
        totalResults: filteredResults.length,
        requestedLimit: filters.limit || 20,
        filters: filters,
        searchText: searchText,
        sortBy: sortBy,
        sortOrder: sortOrder,
        results: filteredResults,
        timestamp: new Date().toISOString(),
        queryTime: new Date().toISOString(),
      };

      console.log("🔥 Firebase Data Tool - Response:", {
        collection: collectionName,
        totalResults: filteredResults.length,
        filters: filters,
        searchText: searchText,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      console.error("🔥 Firebase Data Tool - Error:", error);
      return {
        collection: collectionName,
        error: true,
        message: `Failed to query ${collectionName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date().toISOString(),
      };
    }
  },
});

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Weather tool for emergency weather monitoring
export const weatherTool = tool({
  description: "Get the weather in a location (fahrenheit)",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => {
    const temperature = Math.round(Math.random() * (90 - 32) + 32);
    return {
      location,
      temperature,
    };
  },
});

// Temperature conversion tool
export const convertFahrenheitToCelsiusTool = tool({
  description: "Convert a temperature in fahrenheit to celsius",
  inputSchema: z.object({
    temperature: z
      .number()
      .describe("The temperature in fahrenheit to convert"),
  }),
  execute: async ({ temperature }) => {
    const celsius = Math.round((temperature - 32) * (5 / 9));
    return {
      celsius,
    };
  },
});

// Emergency resource management tool
export const emergencyResourcesTool = tool({
  description:
    "Manage emergency resources, evacuation centers, and emergency services",
  inputSchema: z.object({
    action: z
      .enum(["list", "allocate", "status"])
      .describe("Action to perform on emergency resources"),
    resourceType: z
      .string()
      .optional()
      .describe("Type of resource (shelters, medical, food, transport)"),
    location: z
      .string()
      .optional()
      .describe("Location for resource allocation"),
    quantity: z.number().optional().describe("Quantity of resources needed"),
  }),
  execute: async ({ action, resourceType, location, quantity }) => {
    // Simulate emergency resource management
    const resources = {
      shelters: {
        available: 15,
        capacity: 500,
        locations: ["Community Center", "School Gym", "Church Hall"],
      },
      medical: {
        available: 8,
        capacity: 200,
        locations: ["Hospital", "Clinic", "Mobile Units"],
      },
      food: {
        available: 1000,
        capacity: 5000,
        locations: ["Food Bank", "Restaurant", "Catering"],
      },
      transport: {
        available: 25,
        capacity: 300,
        locations: ["Bus Depot", "Taxi Service", "Volunteer Cars"],
      },
    };

    if (action === "list") {
      return {
        action: "list",
        resources: resourceType
          ? {
              [resourceType]: resources[resourceType as keyof typeof resources],
            }
          : resources,
        timestamp: new Date().toISOString(),
      };
    }

    if (action === "allocate" && resourceType && location && quantity) {
      const resource = resources[resourceType as keyof typeof resources];
      if (resource && resource.available >= quantity) {
        resource.available -= quantity;
        return {
          action: "allocate",
          resourceType,
          location,
          quantity,
          status: "ALLOCATED",
          remaining: resource.available,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          action: "allocate",
          resourceType,
          location,
          quantity,
          status: "INSUFFICIENT_RESOURCES",
          available: resource?.available || 0,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      action,
      status: "INVALID_REQUEST",
      message: "Missing required parameters for resource allocation",
      timestamp: new Date().toISOString(),
    };
  },
});

// Geospatial analysis tool
export const geospatialAnalysisTool = tool({
  description:
    "Analyze geospatial data for evacuation routes, risk assessment, and area mapping",
  inputSchema: z.object({
    analysisType: z
      .enum([
        "evacuation_routes",
        "risk_assessment",
        "population_density",
        "infrastructure",
      ])
      .describe("Type of geospatial analysis"),
    coordinates: z
      .object({
        lat: z.number().describe("Latitude coordinate"),
        lng: z.number().describe("Longitude coordinate"),
      })
      .optional()
      .describe("Center coordinates for analysis"),
    radius: z.number().optional().describe("Analysis radius in kilometers"),
  }),
  execute: async ({ analysisType, coordinates, radius = 5 }) => {
    // Simulate geospatial analysis
    const analysis = {
      evacuation_routes: {
        primary: [
          "Route A: Main Highway",
          "Route B: Secondary Road",
          "Route C: Emergency Path",
        ],
        capacity: 1500,
        estimatedTime: "45 minutes",
        riskLevel: "LOW",
      },
      risk_assessment: {
        floodRisk: "MEDIUM",
        landslideRisk: "LOW",
        fireRisk: "HIGH",
        overallRisk: "MEDIUM",
      },
      population_density: {
        totalPopulation: 25000,
        density: "HIGH",
        vulnerableGroups: ["Elderly: 15%", "Children: 20%", "Disabled: 5%"],
      },
      infrastructure: {
        hospitals: 2,
        schools: 8,
        shelters: 3,
        communication: "GOOD",
        power: "STABLE",
      },
    };

    return {
      analysisType,
      coordinates,
      radius,
      results: analysis[analysisType],
      timestamp: new Date().toISOString(),
    };
  },
});

// Emergency communication tool
export const emergencyCommunicationTool = tool({
  description:
    "Send emergency alerts, notifications, and coordinate communication during disasters",
  inputSchema: z.object({
    messageType: z
      .enum(["alert", "evacuation", "all_clear", "update"])
      .describe("Type of emergency message"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .describe("Message priority level"),
    target: z
      .string()
      .describe("Target audience (residents, emergency_services, volunteers)"),
    message: z.string().describe("Emergency message content"),
    location: z.string().optional().describe("Affected location"),
  }),
  execute: async ({ messageType, priority, target, message, location }) => {
    // Simulate emergency communication
    const communication = {
      messageType,
      priority,
      target,
      message,
      location,
      status: "SENT",
      deliveryTime: new Date().toISOString(),
      estimatedReach:
        target === "residents"
          ? "95%"
          : target === "emergency_services"
          ? "100%"
          : "80%",
      channels: ["SMS", "Email", "Radio", "Social Media"],
    };

    return communication;
  },
});

// Data analysis tool for simulation results
export const simulationAnalysisTool = tool({
  description:
    "Analyze emergency simulation data, evacuation patterns, and response effectiveness",
  inputSchema: z.object({
    dataType: z
      .enum(["evacuation", "resource_usage", "timeline", "effectiveness"])
      .describe("Type of simulation data to analyze"),
    timeRange: z
      .object({
        start: z.string().describe("Start time (ISO format)"),
        end: z.string().describe("End time (ISO format)"),
      })
      .optional()
      .describe("Time range for analysis"),
    metrics: z
      .array(z.string())
      .optional()
      .describe("Specific metrics to analyze"),
  }),
  execute: async ({ dataType, timeRange, metrics }) => {
    // Simulate simulation data analysis
    const analysis = {
      evacuation: {
        totalEvacuees: 1250,
        averageEvacuationTime: "2.5 hours",
        bottlenecks: ["Highway Junction", "Bridge Crossing"],
        successRate: "92%",
      },
      resource_usage: {
        shelters: { utilized: 85, available: 15, efficiency: "HIGH" },
        medical: { utilized: 70, available: 30, efficiency: "MEDIUM" },
        transport: { utilized: 90, available: 10, efficiency: "HIGH" },
      },
      timeline: {
        alertTime: "00:00",
        evacuationStart: "00:15",
        peakEvacuation: "01:30",
        completion: "03:45",
      },
      effectiveness: {
        overallScore: 8.5,
        communication: 9.0,
        coordination: 8.0,
        resourceManagement: 8.5,
        recommendations: ["Improve bridge capacity", "Add more medical units"],
      },
    };

    return {
      dataType,
      timeRange,
      metrics,
      analysis: analysis[dataType],
      timestamp: new Date().toISOString(),
    };
  },
});

// Emergency vehicle dispatch tool
export const emergencyVehicleDispatchTool = tool({
  description:
    "Dispatch emergency vehicles (ambulances, fire trucks, police, helicopters, evacuation buses) to specific locations",
  inputSchema: z.object({
    vehicleType: z
      .enum(["ambulance", "fire_truck", "police", "helicopter", "evacuation_bus"])
      .describe("Type of emergency vehicle to dispatch"),
    fromLocation: z.string().describe("Starting location or station"),
    toLocation: z.string().describe("Destination location"),
    coordinates: z
      .object({
        lat: z.number().describe("Destination latitude"),
        lng: z.number().describe("Destination longitude"),
      })
      .optional()
      .describe("Exact coordinates of destination"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .describe("Dispatch priority level"),
    estimatedDuration: z
      .number()
      .optional()
      .describe("Estimated travel time in minutes"),
    specialInstructions: z
      .string()
      .optional()
      .describe("Special instructions for the crew"),
  }),
  execute: async ({
    vehicleType,
    fromLocation,
    toLocation,
    coordinates,
    priority,
    estimatedDuration,
    specialInstructions,
  }) => {
    // TODO: Integrate with actual vehicle dispatch system
    const dispatchId = `DISPATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = {
      dispatchId,
      vehicleType,
      fromLocation,
      toLocation,
      coordinates,
      priority,
      status: "DISPATCHED",
      estimatedArrival: estimatedDuration
        ? new Date(Date.now() + estimatedDuration * 60000).toISOString()
        : new Date(Date.now() + 15 * 60000).toISOString(), // Default 15 min
      specialInstructions,
      dispatchTime: new Date().toISOString(),
      vehicleId: `${vehicleType.toUpperCase()}_${Math.floor(Math.random() * 100)}`,
      crewSize: vehicleType === "helicopter" ? 4 : vehicleType === "evacuation_bus" ? 2 : 3,
    };

    console.log("🚨 Emergency Vehicle Dispatched:", response);
    return response;
  },
});

// Evacuation management tool
export const evacuationManagementTool = tool({
  description:
    "Initiate and manage evacuation procedures for specific areas or polygon zones",
  inputSchema: z.object({
    action: z
      .enum(["initiate", "status", "complete", "update_route"])
      .describe("Evacuation action to perform"),
    area: z
      .object({
        name: z.string().describe("Area or polygon name"),
        coordinates: z
          .array(
            z.object({
              lat: z.number(),
              lng: z.number(),
            })
          )
          .optional()
          .describe("Polygon vertices defining evacuation area"),
        estimatedPopulation: z
          .number()
          .optional()
          .describe("Estimated population in area"),
      })
      .describe("Area to evacuate"),
    evacuationRoutes: z
      .array(z.string())
      .optional()
      .describe("Designated evacuation routes"),
    shelterLocations: z
      .array(z.string())
      .optional()
      .describe("Available shelter locations"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .describe("Evacuation priority level"),
    reason: z.string().optional().describe("Reason for evacuation"),
  }),
  execute: async ({
    action,
    area,
    evacuationRoutes,
    shelterLocations,
    priority,
    reason,
  }) => {
    // TODO: Integrate with actual evacuation management system
    const evacuationId = `EVAC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (action === "initiate") {
      const response = {
        evacuationId,
        action: "initiate",
        area,
        status: "EVACUATION_INITIATED",
        priority,
        reason,
        evacuationRoutes: evacuationRoutes || [
          "Primary Route: Main Highway North",
          "Secondary Route: County Road 15",
          "Emergency Route: Forest Service Road",
        ],
        shelterLocations: shelterLocations || [
          "Community Center (Capacity: 200)",
          "High School Gymnasium (Capacity: 150)",
          "Church Hall (Capacity: 100)",
        ],
        estimatedDuration: "2-4 hours",
        transportRequired: Math.ceil((area.estimatedPopulation || 500) / 50), // Buses needed
        initiatedAt: new Date().toISOString(),
        expectedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      };
      
      console.log("🏃 Evacuation Initiated:", response);
      return response;
    }
    
    // Handle other evacuation actions
    return {
      evacuationId,
      action,
      area: area.name,
      status: "ACTION_COMPLETED",
      timestamp: new Date().toISOString(),
    };
  },
});

// Communication infrastructure tool
export const communicationInfrastructureTool = tool({
  description:
    "Deploy and manage communication infrastructure like mobile towers, satellite links, and emergency broadcast systems",
  inputSchema: z.object({
    action: z
      .enum(["deploy_tower", "setup_satellite", "emergency_broadcast", "status_check"])
      .describe("Communication infrastructure action"),
    location: z
      .object({
        name: z.string().describe("Location name"),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional()
          .describe("Exact coordinates"),
      })
      .describe("Deployment location"),
    coverage: z
      .object({
        radius: z.number().describe("Coverage radius in kilometers"),
        capacity: z.number().describe("Maximum simultaneous connections"),
      })
      .optional()
      .describe("Coverage specifications"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .describe("Deployment priority"),
  }),
  execute: async ({ action, location, coverage, priority }) => {
    // TODO: Integrate with actual communication infrastructure systems
    const deploymentId = `COMM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = {
      deploymentId,
      action,
      location,
      status: "DEPLOYMENT_INITIATED",
      priority,
      coverage: coverage || {
        radius: action === "deploy_tower" ? 10 : action === "setup_satellite" ? 50 : 25,
        capacity: action === "deploy_tower" ? 1000 : action === "setup_satellite" ? 5000 : 2000,
      },
      estimatedSetupTime: action === "deploy_tower" ? "2-3 hours" : action === "setup_satellite" ? "30-45 minutes" : "15 minutes",
      equipment: {
        deploy_tower: ["Mobile Cell Tower", "Generator", "Satellite Uplink", "Technician Team"],
        setup_satellite: ["Satellite Dish", "Communication Hub", "Backup Power", "Technical Crew"],
        emergency_broadcast: ["Emergency Alert System", "Radio Transmitter", "Backup Power"],
        status_check: ["Diagnostic Equipment", "Technical Team"],
      }[action],
      deployedAt: new Date().toISOString(),
      expectedOnline: new Date(
        Date.now() + 
        (action === "deploy_tower" ? 3 * 60 * 60 * 1000 : 
         action === "setup_satellite" ? 45 * 60 * 1000 : 15 * 60 * 1000)
      ).toISOString(),
    };
    
    console.log("📡 Communication Infrastructure Deployed:", response);
    return response;
  },
});

// Mass notification tool
export const massNotificationTool = tool({
  description:
    "Send mass notifications to residents, emergency services, and stakeholders via multiple channels",
  inputSchema: z.object({
    notificationType: z
      .enum(["emergency_alert", "evacuation_notice", "shelter_info", "all_clear", "weather_warning"])
      .describe("Type of notification to send"),
    targetAudience: z
      .enum(["residents", "emergency_services", "government", "media", "all"])
      .describe("Target audience for notification"),
    area: z
      .object({
        name: z.string().describe("Area name"),
        coordinates: z
          .array(
            z.object({
              lat: z.number(),
              lng: z.number(),
            })
          )
          .optional()
          .describe("Polygon coordinates for targeted area"),
        radius: z.number().optional().describe("Notification radius in kilometers"),
      })
      .optional()
      .describe("Geographic area for notification"),
    message: z.string().describe("Notification message content"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .describe("Notification priority level"),
    channels: z
      .array(
        z.enum(["sms", "email", "push_notification", "radio", "tv", "social_media", "sirens"])
      )
      .optional()
      .describe("Communication channels to use"),
    language: z
      .array(z.string())
      .optional()
      .describe("Languages for multilingual notifications"),
  }),
  execute: async ({
    notificationType,
    targetAudience,
    area,
    message,
    priority,
    channels,
    language,
  }) => {
    // TODO: Integrate with actual mass notification systems (Emergency Alert System, Wireless Emergency Alerts, etc.)
    const notificationId = `NOTIFY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultChannels = {
      CRITICAL: ["sms", "push_notification", "radio", "tv", "sirens"],
      HIGH: ["sms", "push_notification", "radio", "email"],
      MEDIUM: ["push_notification", "email", "social_media"],
      LOW: ["email", "social_media"],
    };
    
    const estimatedReach = {
      residents: area ? Math.floor(Math.random() * 10000) + 5000 : 25000,
      emergency_services: 150,
      government: 50,
      media: 25,
      all: area ? Math.floor(Math.random() * 15000) + 10000 : 35000,
    };
    
    const response = {
      notificationId,
      notificationType,
      targetAudience,
      area,
      message,
      priority,
      channels: channels || defaultChannels[priority],
      language: language || ["en", "de", "fr", "it"], // Swiss languages
      status: "NOTIFICATION_SENT",
      estimatedReach: estimatedReach[targetAudience],
      deliveryStatus: {
        sms: "95% delivered",
        email: "88% delivered",
        push_notification: "92% delivered",
        radio: "100% broadcast",
        tv: "100% broadcast",
        social_media: "100% posted",
        sirens: "100% activated",
      },
      sentAt: new Date().toISOString(),
      estimatedDeliveryTime: "2-5 minutes",
    };
    
    console.log("📢 Mass Notification Sent:", response);
    return response;
  },
});

// Web search tool for real-time information
export const webSearchTool = tool({
  description:
    "Search the web for real-time information about current events, news, and up-to-date data",
  inputSchema: z.object({
    query: z.string().describe("The search query to find information about"),
    context: z
      .string()
      .optional()
      .describe("Additional context about what type of information is needed"),
  }),
  execute: async ({ query, context }) => {
    // This would integrate with a real web search API
    // For now, we'll simulate the response
    const mockResults = {
      query,
      context,
      results: [
        {
          title: `Latest information about ${query}`,
          url: "https://example.com/news",
          snippet: `Recent developments regarding ${query} show significant updates in the field.`,
          timestamp: new Date().toISOString(),
        },
        {
          title: `Analysis: ${query} trends and implications`,
          url: "https://example.com/analysis",
          snippet: `Comprehensive analysis of ${query} reveals important patterns and considerations.`,
          timestamp: new Date().toISOString(),
        },
      ],
      timestamp: new Date().toISOString(),
    };

    return mockResults;
  },
});

// Function to generate text with custom prompt
export async function generateTextWithPrompt(
  prompt: string,
  systemPrompt?: string
) {
  const model = openai("gpt-5");
  const config = {
    model,
    prompt,
    system: systemPrompt,
  };

  console.log("🤖 generateTextWithPrompt - Request Parameters:", {
    model: "gpt-5",
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
    systemPrompt: systemPrompt
      ? systemPrompt.substring(0, 100) +
        (systemPrompt.length > 100 ? "..." : "")
      : "None",
    promptLength: prompt.length,
    systemPromptLength: systemPrompt?.length || 0,
    timestamp: new Date().toISOString(),
  });

  const result = await generateText(config);

  console.log("🤖 generateTextWithPrompt - Response:", {
    model: "gpt-5",
    text:
      result.text.substring(0, 200) + (result.text.length > 200 ? "..." : ""),
    textLength: result.text.length,
    finishReason: result.finishReason,
    usage: result.usage,
    timestamp: new Date().toISOString(),
  });

  return result;
}

// Function to generate text with tools
export async function generateTextWithTools(
  prompt: string,
  tools: any,
  systemPrompt?: string
) {
  const model = openai("gpt-5");
  const config = {
    model,
    prompt,
    system: systemPrompt,
    tools,
  };

  console.log("🤖 generateTextWithTools - Request Parameters:", {
    model: "gpt-5",
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
    systemPrompt: systemPrompt
      ? systemPrompt.substring(0, 100) +
        (systemPrompt.length > 100 ? "..." : "")
      : "None",
    tools: Object.keys(tools || {}),
    toolCount: Object.keys(tools || {}).length,
    promptLength: prompt.length,
    systemPromptLength: systemPrompt?.length || 0,
    timestamp: new Date().toISOString(),
  });

  const result = await generateText(config);

  console.log("🤖 generateTextWithTools - Response:", {
    model: "gpt-5",
    text:
      result.text.substring(0, 200) + (result.text.length > 200 ? "..." : ""),
    textLength: result.text.length,
    finishReason: result.finishReason,
    usage: result.usage,
    toolCalls: result.toolCalls?.length || 0,
    toolResults: result.toolResults?.length || 0,
    timestamp: new Date().toISOString(),
  });

  return result;
}

// Function to generate text with web search
export async function generateTextWithWebSearch(
  prompt: string,
  systemPrompt?: string
) {
  console.log("🤖 generateTextWithWebSearch - Request Parameters:", {
    model: "gpt-5 (with responses)",
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
    systemPrompt: systemPrompt
      ? systemPrompt.substring(0, 100) +
        (systemPrompt.length > 100 ? "..." : "")
      : "None",
    tools: ["web_search"],
    toolCount: 1,
    promptLength: prompt.length,
    systemPromptLength: systemPrompt?.length || 0,
    timestamp: new Date().toISOString(),
  });

  const result = await generateText({
    model: openai.responses("gpt-5"),
    prompt,
    system: systemPrompt,
    tools: {
      web_search: openai.tools.webSearch({}) as any,
    },
  });

  console.log("🤖 generateTextWithWebSearch - Response:", {
    model: "gpt-5 (with responses)",
    text:
      result.text.substring(0, 200) + (result.text.length > 200 ? "..." : ""),
    textLength: result.text.length,
    finishReason: result.finishReason,
    usage: result.usage,
    toolCalls: result.toolCalls?.length || 0,
    toolResults: result.toolResults?.length || 0,
    webSearchResults:
      result.toolResults?.filter((tr) => tr.toolName === "web_search")
        ?.length || 0,
    timestamp: new Date().toISOString(),
  });

  return result;
}

// Function to generate text with Firebase data access
export async function generateTextWithFirebaseData(
  prompt: string,
  systemPrompt?: string
) {
  const tools = {
    firebase_data: firebaseDataTool,
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

  console.log("🤖 generateTextWithFirebaseData - Request Parameters:", {
    model: "gpt-5",
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
    systemPrompt: systemPrompt
      ? systemPrompt.substring(0, 100) +
        (systemPrompt.length > 100 ? "..." : "")
      : "None",
    tools: Object.keys(tools),
    toolCount: Object.keys(tools).length,
    promptLength: prompt.length,
    systemPromptLength: systemPrompt?.length || 0,
    timestamp: new Date().toISOString(),
  });

  const result = await generateText({
    model: openai("gpt-5"),
    prompt,
    system: systemPrompt,
    tools,
  });

  console.log("🤖 generateTextWithFirebaseData - Response:", {
    model: "gpt-5",
    text:
      result.text.substring(0, 200) + (result.text.length > 200 ? "..." : ""),
    textLength: result.text.length,
    finishReason: result.finishReason,
    usage: result.usage,
    toolCalls: result.toolCalls?.length || 0,
    toolResults: result.toolResults?.length || 0,
    firebaseDataCalls:
      result.toolCalls?.filter((tc) => tc.toolName === "firebase_data")
        ?.length || 0,
    vehicleDispatchCalls:
      result.toolCalls?.filter((tc) => tc.toolName === "vehicle_dispatch")
        ?.length || 0,
    evacuationCalls:
      result.toolCalls?.filter((tc) => tc.toolName === "evacuation_management")
        ?.length || 0,
    communicationCalls:
      result.toolCalls?.filter((tc) => tc.toolName === "communication_infrastructure")
        ?.length || 0,
    notificationCalls:
      result.toolCalls?.filter((tc) => tc.toolName === "mass_notification")
        ?.length || 0,
    timestamp: new Date().toISOString(),
  });

  return result;
}
