import { EmergencyDataService } from '@/services/emergency-data.service';

export async function uploadCoreData() {
  console.log('🚀 Starting complete simulation data upload to Firebase...');
  
  const dataService = new EmergencyDataService();
  
  try {
    // Load all the JSON files including the new ones
    const [
      mainEventResponse,
      monitoringStationsResponse,
      authoritiesResponse,
      expandedResourcesResponse,
      evacueesResponse,
      platformEventsResponse,
      resourceMovementsResponse,
      activityLogResponse
    ] = await Promise.all([
      fetch('/data/blatten_simulation_main_event.json'),
      fetch('/data/blatten_simulation_monitoring_stations.json'),
      fetch('/data/blatten_simulation_authorities.json'),
      fetch('/data/blatten_simulation_expanded_resources.json'),
      fetch('/data/blatten_simulation_evacuees.json'),
      fetch('/data/blatten_simulation_platform_events.json'),
      fetch('/data/blatten_simulation_resource_movements.json'),
      fetch('/data/blatten_simulation_activity_log.json')
    ]);

    const [
      mainEventData,
      monitoringStationsData,
      authoritiesData,
      expandedResourcesData,
      evacueesData,
      platformEventsData,
      resourceMovementsData,
      activityLogData
    ] = await Promise.all([
      mainEventResponse.json(),
      monitoringStationsResponse.json(),
      authoritiesResponse.json(),
      expandedResourcesResponse.json(),
      evacueesResponse.json(),
      platformEventsResponse.json(),
      resourceMovementsResponse.json(),
      activityLogResponse.json()
    ]);

    console.log('📊 Uploading complete simulation data:');
    console.log(`   - ${1} emergency event`);
    console.log(`   - ${monitoringStationsData.length} monitoring stations`);
    console.log(`   - ${authoritiesData.length} authorities`);
    console.log(`   - ${expandedResourcesData.length} resources (expanded)`);
    console.log(`   - ${evacueesData.length} evacuee groups`);
    console.log(`   - ${platformEventsData.length} platform events`);
    console.log(`   - ${resourceMovementsData.length} resource movements`);
    console.log(`   - ${activityLogData.length} activity logs`);

    // Use the existing uploadSimulationData method with all data
    const simulationData = {
      events: [mainEventData],
      monitoringStations: monitoringStationsData,
      authorities: authoritiesData,
      resources: expandedResourcesData, // Use expanded resources
      evacuees: evacueesData,
      decisions: [], // Empty - will be created in app
      timelineEvents: [] // Empty - will be created in app
    };

    await dataService.uploadSimulationData(simulationData);

    // Upload the new data types to separate collections
    console.log('📝 Uploading platform events...');
    for (const event of platformEventsData) {
      const eventRef = await dataService.createEvent({ ...event, id: event.eventId } as any);
      console.log(`✅ Platform event ${event.eventId} uploaded`);
    }

    console.log('🚁 Uploading resource movements...');
    for (const movement of resourceMovementsData) {
      const movementRef = await dataService.createEvent({ ...movement, id: movement.movementId } as any);
      console.log(`✅ Resource movement ${movement.movementId} uploaded`);
    }

    console.log('📋 Uploading activity logs...');
    for (const log of activityLogData) {
      const logRef = await dataService.createEvent({ ...log, id: log.logId } as any);
      console.log(`✅ Activity log ${log.logId} uploaded`);
    }

    console.log('✅ Complete simulation data upload completed successfully!');
    console.log('🎯 You can now start the simulation in the browser.');
    
    return true;
  } catch (error) {
    console.error('❌ Complete data upload failed:', error);
    return false;
  }
}

// Function to validate core data after upload
export async function validateCoreData() {
  console.log('🔍 Validating uploaded core data...');
  
  const dataService = new EmergencyDataService();
  
  try {
    const [
      events,
      monitoringStations,
      authorities,
      resources
    ] = await Promise.all([
      dataService.getEvents(),
      dataService.getMonitoringStations(),
      dataService.getAuthorities(),
      dataService.getResources()
    ]);

    console.log('📊 Validation results:');
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Monitoring Stations: ${monitoringStations.length}`);
    console.log(`   - Authorities: ${authorities.length}`);
    console.log(`   - Resources: ${resources.length}`);

    const isValid = events.length > 0 && monitoringStations.length > 0 && 
                   authorities.length > 0 && resources.length > 0;

    if (isValid) {
      console.log('✅ Core data validation passed!');
    } else {
      console.log('❌ Core data validation failed - some collections are empty');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  }
}
