import { EmergencyDataService } from './emergency-data.service';
import type {
  EmergencyEvent,
  MonitoringStation,
  Authority,
  Resource,
  Decision,
  TimelineEvent,
  SimulationState,
  SimulationConfig,
  SensorReading
} from '@/types/emergency';

export class SimulationService {
  private dataService: EmergencyDataService;
  private state: SimulationState;
  private config: SimulationConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, (data: any) => void> = new Map();

  constructor(dataService: EmergencyDataService) {
    this.dataService = dataService;
    this.state = {
      currentTime: '2025-05-17T06:00:00Z',
      isRunning: false,
      speed: 1,
      phase: 'detection'
    };
    this.config = {
      startTime: '2025-05-17T06:00:00Z',
      endTime: '2025-05-28T18:00:00Z',
      timeStep: 1000, // 1 second
      autoAdvance: true,
      eventTriggers: {
        'glacier_acceleration': {
          condition: 'sensor_value > 1.5',
          action: 'trigger_warning'
        },
        'critical_threshold': {
          condition: 'sensor_value > 2.5',
          action: 'trigger_evacuation'
        }
      }
    };
  }

  // Event system for UI updates
  on(event: string, callback: (data: any) => void): void {
    this.eventListeners.set(event, callback);
  }

  off(event: string): void {
    this.eventListeners.delete(event);
  }

  private emit(event: string, data: any): void {
    const callback = this.eventListeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  // Simulation control
  start(): void {
    if (this.state.isRunning) return;
    
    this.state.isRunning = true;
    this.state.currentTime = this.config.startTime;
    
    this.intervalId = setInterval(() => {
      this.advanceTime();
    }, this.config.timeStep / this.state.speed);
    
    this.emit('simulation_started', this.state);
  }

  pause(): void {
    if (!this.state.isRunning) return;
    
    this.state.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.emit('simulation_paused', this.state);
  }

  stop(): void {
    this.pause();
    this.state.currentTime = this.config.startTime;
    this.state.phase = 'detection';
    
    this.emit('simulation_stopped', this.state);
  }

  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10, speed));
    
    if (this.state.isRunning && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.advanceTime();
      }, this.config.timeStep / this.state.speed);
    }
    
    this.emit('speed_changed', { speed: this.state.speed });
  }

  setTime(time: string): void {
    this.state.currentTime = time;
    this.updatePhase();
    this.emit('time_changed', { currentTime: this.state.currentTime, phase: this.state.phase });
  }

  // Time progression
  private advanceTime(): void {
    const currentDate = new Date(this.state.currentTime);
    const newDate = new Date(currentDate.getTime() + (this.config.timeStep * this.state.speed));
    this.state.currentTime = newDate.toISOString();
    
    this.updatePhase();
    this.processEvents();
    
    this.emit('time_advanced', {
      currentTime: this.state.currentTime,
      phase: this.state.phase
    });
  }

  private updatePhase(): void {
    const currentTime = new Date(this.state.currentTime);
    const startTime = new Date(this.config.startTime);
    const timeDiff = currentTime.getTime() - startTime.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff < 1) {
      this.state.phase = 'detection';
    } else if (daysDiff < 3) {
      this.state.phase = 'escalation';
    } else if (daysDiff < 5) {
      this.state.phase = 'evacuation';
    } else if (daysDiff < 12) {
      this.state.phase = 'response';
    } else {
      this.state.phase = 'recovery';
    }
  }

  // Event processing
  private async processEvents(): Promise<void> {
    const currentTime = new Date(this.state.currentTime);
    
    // Process sensor readings based on timeline
    await this.processSensorReadings(currentTime);
    
    // Process authority status changes
    await this.processAuthorityUpdates(currentTime);
    
    // Process resource deployments
    await this.processResourceDeployments(currentTime);
    
    // Process evacuation events
    await this.processEvacuationEvents(currentTime);
  }

  private async processSensorReadings(currentTime: Date): Promise<void> {
    const stations = await this.dataService.getMonitoringStations();
    
    for (const station of stations) {
      // Find readings that should be active at current time
      const activeReadings = station.readings.filter(reading => {
        const readingTime = new Date(reading.timestamp);
        return readingTime <= currentTime;
      });

      if (activeReadings.length > 0) {
        const latestReading = activeReadings[activeReadings.length - 1];
        
        // Check for threshold breaches
        if (station.alertThresholds) {
          const thresholds = station.alertThresholds;
          let alertLevel = 'normal';
          
          if (latestReading.value >= thresholds.critical) {
            alertLevel = 'critical';
          } else if (latestReading.value >= thresholds.alert) {
            alertLevel = 'alert';
          } else if (latestReading.value >= thresholds.warning) {
            alertLevel = 'warning';
          }

          if (alertLevel !== 'normal') {
            this.emit('sensor_alert', {
              sensorId: station.sensorId,
              sensorType: station.sensorType,
              value: latestReading.value,
              alertLevel,
              timestamp: this.state.currentTime
            });
          }
        }
      }
    }
  }

  private async processAuthorityUpdates(currentTime: Date): Promise<void> {
    // Update authority statuses based on timeline events
    const authorities = await this.dataService.getAuthorities();
    
    for (const authority of authorities) {
      let newStatus = authority.currentStatus;
      
      // Example logic for status changes based on time
      if (authority.authorityId === 'valais-cantonal-police') {
        if (currentTime >= new Date('2025-05-19T09:30:00Z')) {
          newStatus = 'activated';
        }
      } else if (authority.authorityId === 'focp-bern') {
        if (currentTime >= new Date('2025-05-18T14:30:00Z')) {
          newStatus = 'coordinating';
        }
      }
      
      if (newStatus !== authority.currentStatus) {
        await this.dataService.updateAuthorityStatus(authority.authorityId, newStatus);
        this.emit('authority_status_changed', {
          authorityId: authority.authorityId,
          name: authority.name,
          oldStatus: authority.currentStatus,
          newStatus
        });
      }
    }
  }

  private async processResourceDeployments(currentTime: Date): Promise<void> {
    const resources = await this.dataService.getResources();
    
    for (const resource of resources) {
      let newStatus = resource.status;
      let newAssignment = resource.currentAssignment;
      
      // Example deployment logic
      if (resource.resourceId === 'fire-naters-volunteer') {
        if (currentTime >= new Date('2025-05-19T09:45:00Z')) {
          newStatus = 'activated';
          newAssignment = 'evacuation_support';
        }
      } else if (resource.resourceId === 'heli-air-rescue-1') {
        if (currentTime >= new Date('2025-05-20T08:00:00Z')) {
          newStatus = 'deployed';
          newAssignment = 'livestock_evacuation';
        }
      }
      
      if (newStatus !== resource.status || newAssignment !== resource.currentAssignment) {
        await this.dataService.updateResourceStatus(resource.resourceId, newStatus, newAssignment);
        this.emit('resource_deployed', {
          resourceId: resource.resourceId,
          name: resource.location.name,
          status: newStatus,
          assignment: newAssignment
        });
      }
    }
  }

  private async processEvacuationEvents(currentTime: Date): Promise<void> {
    // Process evacuation events based on timeline
    const events = await this.dataService.getEvents();
    
    for (const event of events) {
      if (event.eventId === 'blatten-glacier-2025-05-28') {
        // Partial evacuation
        if (currentTime >= new Date('2025-05-19T09:45:00Z') && currentTime < new Date('2025-05-19T11:45:00Z')) {
          this.emit('evacuation_started', {
            type: 'partial',
            affectedPopulation: 92,
            areas: ['blatten_zone_a']
          });
        }
        
        // Full evacuation
        if (currentTime >= new Date('2025-05-19T11:45:00Z') && currentTime < new Date('2025-05-20T08:00:00Z')) {
          this.emit('evacuation_started', {
            type: 'full',
            affectedPopulation: 320,
            areas: ['blatten_complete', 'surrounding_farmsteads']
          });
        }
        
        // Livestock evacuation
        if (currentTime >= new Date('2025-05-20T08:00:00Z')) {
          this.emit('livestock_evacuation_started', {
            cattle: 180,
            sheep: 340,
            goats: 75,
            horses: 12
          });
        }
        
        // Glacier collapse
        if (currentTime >= new Date('2025-05-28T14:32:17Z')) {
          this.emit('disaster_event', {
            type: 'glacier_collapse',
            magnitude: 3.1,
            volume: '9 million tons',
            impact: 'total_destruction_blatten'
          });
        }
      }
    }
  }

  // Data access methods
  getState(): SimulationState {
    return { ...this.state };
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  // Simulation data loading
  async loadSimulationData(): Promise<void> {
    try {
      // Load the JSON data files
      const [
        mainEvent,
        monitoringStations,
        authorities,
        resources,
        evacuees,
        decisions,
        timelineEvents
      ] = await Promise.all([
        import('@/data/blatten_simulation_main_event.json'),
        import('@/data/blatten_simulation_monitoring_stations.json'),
        import('@/data/blatten_simulation_authorities.json'),
        import('@/data/blatten_simulation_resources.json'),
        import('@/data/blatten_simulation_evacuees.json'),
        import('@/data/blatten_simulation_decision_log.json'),
        import('@/data/blatten_simulation_timeline_events.json')
      ]);

      const simulationData = {
        events: [mainEvent.default],
        monitoringStations: monitoringStations.default,
        authorities: authorities.default,
        resources: resources.default,
        evacuees: evacuees.default,
        decisions: decisions.default,
        timelineEvents: timelineEvents.default
      };

      await this.dataService.uploadSimulationData(simulationData);
      this.emit('data_loaded', { success: true });
    } catch (error) {
      console.error('Failed to load simulation data:', error);
      this.emit('data_loaded', { success: false, error });
    }
  }

  // Utility methods
  formatTime(time: string): string {
    return new Date(time).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
  }

  getTimeProgress(): number {
    const startTime = new Date(this.config.startTime).getTime();
    const endTime = new Date(this.config.endTime).getTime();
    const currentTime = new Date(this.state.currentTime).getTime();
    
    return Math.max(0, Math.min(100, ((currentTime - startTime) / (endTime - startTime)) * 100));
  }
}
