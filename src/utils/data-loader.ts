import { EmergencyDataService } from '@/services/emergency-data.service';
import type {
  EmergencyEvent,
  MonitoringStation,
  Authority,
  Resource,
  Evacuee,
  Decision,
  TimelineEvent
} from '@/types/emergency';

export class DataLoader {
  private dataService: EmergencyDataService;

  constructor(dataService: EmergencyDataService) {
    this.dataService = dataService;
  }

  async loadBlattenSimulationData(): Promise<void> {

    try {
      // Load all JSON files
      const [
        mainEventData,
        monitoringStationsData,
        authoritiesData,
        resourcesData,
        evacueesData,
        decisionsData,
        timelineEventsData
      ] = await Promise.all([
        this.loadJSONFile('/data/blatten_simulation_main_event.json'),
        this.loadJSONFile('/data/blatten_simulation_monitoring_stations.json'),
        this.loadJSONFile('/data/blatten_simulation_authorities.json'),
        this.loadJSONFile('/data/blatten_simulation_resources.json'),
        this.loadJSONFile('/data/blatten_simulation_evacuees.json'),
        this.loadJSONFile('/data/blatten_simulation_decision_log.json'),
        this.loadJSONFile('/data/blatten_simulation_timeline_events.json')
      ]);

      // Prepare data for upload
      const simulationData = {
        events: [mainEventData as EmergencyEvent],
        monitoringStations: monitoringStationsData as MonitoringStation[],
        authorities: authoritiesData as Authority[],
        resources: resourcesData as Resource[],
        evacuees: evacueesData as Evacuee[],
        decisions: decisionsData as Decision[],
        timelineEvents: timelineEventsData as TimelineEvent[]
      };

      // Upload to Firebase
      await this.dataService.uploadSimulationData(simulationData);

    } catch (error) {
      throw error;
    }
  }

  private async loadJSONFile(path: string): Promise<any> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      // Note: In a real implementation, you would need to implement
      // batch delete operations in the EmergencyDataService
    } catch (error) {
      throw error;
    }
  }

  async validateData(): Promise<boolean> {
    
    try {
      const [
        events,
        monitoringStations,
        authorities,
        resources,
        decisions
      ] = await Promise.all([
        this.dataService.getEvents(),
        this.dataService.getMonitoringStations(),
        this.dataService.getAuthorities(),
        this.dataService.getResources(),
        this.dataService.getDecisions()
      ]);

      const isValid = 
        events.length > 0 &&
        monitoringStations.length > 0 &&
        authorities.length > 0 &&
        resources.length > 0 &&
        decisions.length > 0;

      // Validation completed

      return isValid;
    } catch (error) {
      return false;
    }
  }
}

// Utility function to create and use the data loader
export async function loadSimulationData(): Promise<void> {
  const dataService = new EmergencyDataService();
  const dataLoader = new DataLoader(dataService);
  
  await dataLoader.loadBlattenSimulationData();
}

export async function validateSimulationData(): Promise<boolean> {
  const dataService = new EmergencyDataService();
  const dataLoader = new DataLoader(dataService);
  
  return await dataLoader.validateData();
}
