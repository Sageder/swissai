// POI visibility management utility functions
// These are placeholder implementations for the POI visibility system

import { MonitoringStation, Resource, Authority } from '@/types/emergency';

// POI state management
let showPOIsState = false;
let currentPOIsState: any[] = [];
let listeners: (() => void)[] = [];

// Timeline state management
let timelineVisibleState = true;
let timelineListeners: (() => void)[] = [];

export const shouldShowPOIs = (): boolean => {
  return showPOIsState;
};

export const getCurrentPOIs = (): any[] => {
  return currentPOIsState;
};

export const onPOIVisibilityChange = (callback: () => void): (() => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(listener => listener !== callback);
  };
};

export const setPOIVisibility = (visible: boolean, pois: any[] = []): void => {
  showPOIsState = visible;
  currentPOIsState = pois;

  // Notify all listeners
  listeners.forEach(callback => callback());
};

export const togglePOIVisibility = (): void => {
  showPOIsState = !showPOIsState;
  if (!showPOIsState) {
    currentPOIsState = [];
  }

  // Notify all listeners
  listeners.forEach(callback => callback());
};

// Timeline visibility management
export const isTimelineVisible = (): boolean => {
  return timelineVisibleState;
};

export const onTimelineVisibilityChange = (callback: () => void): (() => void) => {
  timelineListeners.push(callback);

  // Return unsubscribe function
  return () => {
    timelineListeners = timelineListeners.filter(listener => listener !== callback);
  };
};

export const setTimelineVisibility = (visible: boolean): void => {
  timelineVisibleState = visible;

  // Notify all listeners
  timelineListeners.forEach(callback => callback());
};

export const toggleTimelineVisibility = (): void => {
  timelineVisibleState = !timelineVisibleState;

  // Notify all listeners
  timelineListeners.forEach(callback => callback());
};

// Additional utility functions for examples
export const showTimeline = (): void => {
  setTimelineVisibility(true);
};

export const hideTimeline = (): void => {
  setTimelineVisibility(false);
};

export const addMonitoringSources = (sources: any[]): void => {
  setPOIVisibility(true, sources);
};

export const addResources = (resources: any[]): void => {
  setPOIVisibility(true, resources);
};

export const addAuthorities = (authorities: any[]): void => {
  setPOIVisibility(true, authorities);
};

export const addAllPOIs = (pois: any[]): void => {
  setPOIVisibility(true, pois);
};

export const onlyShowSelectedResources = (resources: any[]): void => {
  setPOIVisibility(true, resources);
};

export const clearAllPOIs = (): void => {
  setPOIVisibility(false, []);
};

export const getStateSummary = (): any => {
  return {
    poisVisible: showPOIsState,
    currentPOIs: currentPOIsState.length,
    timelineVisible: timelineVisibleState
  };
};