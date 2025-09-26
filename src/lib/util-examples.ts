/**
 * Example usage of the utility functions
 * This file demonstrates how AI models or other parts of the application
 * can use the utility functions to control the UI
 */

import { 
  showTimeline, 
  hideTimeline, 
  addMonitoringSources, 
  addResources, 
  addAuthorities,
  onlyShowSelectedResources,
  clearAllPOIs,
  getStateSummary 
} from './util';

// Example data (in real usage, this would come from the data context)
const exampleMonitoringStations = [
  {
    sensorId: 'sensor-1',
    name: 'Glacier Monitoring Station 1',
    location: { lat: 46.5197, lng: 7.8725 },
    sensorType: 'movement',
    readings: [],
    alertThresholds: { warning: 1.0, alert: 1.5, critical: 2.0 }
  }
];

const exampleResources = [
  {
    resourceId: 'heli-1',
    location: { name: 'Air Rescue Base', lat: 46.5197, lng: 7.8725 },
    status: 'active',
    currentAssignment: 'standby'
  }
];

const exampleAuthorities = [
  {
    authorityId: 'police-1',
    name: 'Valais Cantonal Police',
    location: { lat: 46.5197, lng: 7.8725 },
    currentStatus: 'active'
  }
];

/**
 * Example 1: Show timeline and add monitoring sources
 */
export function exampleShowTimelineWithMonitoring() {
  console.log('=== Example 1: Show Timeline with Monitoring ===');
  
  // Show the timeline
  showTimeline();
  
  // Add monitoring sources to POI display
  addMonitoringSources(exampleMonitoringStations);
  
  // Check current state
  console.log('Current state:', getStateSummary());
}

/**
 * Example 2: Add all resources to POI display
 */
export function exampleAddAllResources() {
  console.log('=== Example 2: Add All Resources ===');
  
  // Add all resources to POI display
  addResources(exampleResources);
  
  // Check current state
  console.log('Current state:', getStateSummary());
}

/**
 * Example 3: Add all authorities to POI display
 */
export function exampleAddAllAuthorities() {
  console.log('=== Example 3: Add All Authorities ===');
  
  // Add all authorities to POI display
  addAuthorities(exampleAuthorities);
  
  // Check current state
  console.log('Current state:', getStateSummary());
}

/**
 * Example 4: Show only selected resources
 */
export function exampleShowOnlySelectedResources() {
  console.log('=== Example 4: Show Only Selected Resources ===');
  
  // Clear all POIs first
  clearAllPOIs();
  
  // Show only specific resources
  const selectedResources = exampleResources.filter(r => r.resourceId === 'heli-1');
  onlyShowSelectedResources(selectedResources);
  
  // Check current state
  console.log('Current state:', getStateSummary());
}

/**
 * Example 5: Hide timeline and clear all POIs
 */
export function exampleHideEverything() {
  console.log('=== Example 5: Hide Everything ===');
  
  // Hide timeline
  hideTimeline();
  
  // Clear all POIs
  clearAllPOIs();
  
  // Check current state
  console.log('Current state:', getStateSummary());
}

/**
 * Example 6: Complete emergency response setup
 */
export function exampleEmergencyResponseSetup() {
  console.log('=== Example 6: Emergency Response Setup ===');
  
  // Show timeline for monitoring
  showTimeline();
  
  // Add all monitoring sources
  addMonitoringSources(exampleMonitoringStations);
  
  // Add all resources
  addResources(exampleResources);
  
  // Add all authorities
  addAuthorities(exampleAuthorities);
  
  // Check final state
  console.log('Final state:', getStateSummary());
}

/**
 * Example 7: Show default static POIs (if needed)
 */
export function exampleShowStaticPOIs() {
  console.log('=== Example 7: Show Static POIs ===');
  
  // Note: By default, no POIs are shown. This function demonstrates
  // how you could add static POIs if needed in the future.
  // Currently, all POIs must be explicitly added via utility functions.
  
  console.log('No static POIs are shown by default');
  console.log('Use addMonitoringSources(), addResources(), or addAuthorities() to show POIs');
}

// Export all examples for easy testing
export const examples = {
  showTimelineWithMonitoring: exampleShowTimelineWithMonitoring,
  addAllResources: exampleAddAllResources,
  addAllAuthorities: exampleAddAllAuthorities,
  showOnlySelectedResources: exampleShowOnlySelectedResources,
  hideEverything: exampleHideEverything,
  emergencyResponseSetup: exampleEmergencyResponseSetup,
  showStaticPOIs: exampleShowStaticPOIs
};

// Example of how an AI model might use these functions
export function aiModelExample() {
  console.log('=== AI Model Example ===');
  
  // AI model decides to show timeline for monitoring
  showTimeline();
  
  // AI model adds monitoring sources to help with situation awareness
  addMonitoringSources(exampleMonitoringStations);
  
  // AI model adds resources for emergency response
  addResources(exampleResources);
  
  console.log('AI model has set up the interface for emergency monitoring');
  console.log('Current state:', getStateSummary());
}
