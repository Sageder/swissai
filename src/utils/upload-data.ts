import { EmergencyDataService } from '@/services/emergency-data.service';

export async function uploadSimulationData() {
  console.log('🚀 Starting data upload to Firebase...');
  
  const dataService = new EmergencyDataService();
  
  try {
    // Load JSON files dynamically
    const [
      mainEventResponse,
      monitoringStationsResponse,
      authoritiesResponse,
      resourcesResponse,
      evacueesResponse,
      decisionsResponse,
      timelineEventsResponse
    ] = await Promise.all([
      fetch('/data/blatten_simulation_main_event.json'),
      fetch('/data/blatten_simulation_monitoring_stations.json'),
      fetch('/data/blatten_simulation_authorities.json'),
      fetch('/data/blatten_simulation_resources.json'),
      fetch('/data/blatten_simulation_evacuees.json'),
      fetch('/data/blatten_simulation_decision_log.json'),
      fetch('/data/blatten_simulation_timeline_events.json')
    ]);

    const [
      mainEventData,
      monitoringStationsData,
      authoritiesData,
      resourcesData,
      evacueesData,
      decisionsData,
      timelineEventsData
    ] = await Promise.all([
      mainEventResponse.json(),
      monitoringStationsResponse.json(),
      authoritiesResponse.json(),
      resourcesResponse.json(),
      evacueesResponse.json(),
      decisionsResponse.json(),
      timelineEventsResponse.json()
    ]);

    const simulationData = {
      events: [mainEventData],
      monitoringStations: monitoringStationsData,
      authorities: authoritiesData,
      resources: resourcesData,
      evacuees: evacueesData,
      decisions: decisionsData,
      timelineEvents: timelineEventsData
    };

    console.log('📊 Uploading data:');
    console.log(`   - ${simulationData.events.length} events`);
    console.log(`   - ${simulationData.monitoringStations.length} monitoring stations`);
    console.log(`   - ${simulationData.authorities.length} authorities`);
    console.log(`   - ${simulationData.resources.length} resources`);
    console.log(`   - ${simulationData.evacuees.length} evacuees`);
    console.log(`   - ${simulationData.decisions.length} decisions`);
    console.log(`   - ${simulationData.timelineEvents.length} timeline events`);

    await dataService.uploadSimulationData(simulationData);
    
    console.log('✅ Data upload completed successfully!');
    console.log('🎯 You can now start the simulation in the browser.');
    
    return true;
  } catch (error) {
    console.error('❌ Data upload failed:', error);
    return false;
  }
}

// Function to validate data after upload
export async function validateUploadedData() {
  console.log('🔍 Validating uploaded data...');
  
  const dataService = new EmergencyDataService();
  
  try {
    const [
      events,
      monitoringStations,
      authorities,
      resources,
      decisions
    ] = await Promise.all([
      dataService.getEvents(),
      dataService.getMonitoringStations(),
      dataService.getAuthorities(),
      dataService.getResources(),
      dataService.getDecisions()
    ]);

    console.log('📊 Validation results:');
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Monitoring Stations: ${monitoringStations.length}`);
    console.log(`   - Authorities: ${authorities.length}`);
    console.log(`   - Resources: ${resources.length}`);
    console.log(`   - Decisions: ${decisions.length}`);

    const isValid = events.length > 0 && monitoringStations.length > 0 && 
                   authorities.length > 0 && resources.length > 0 && decisions.length > 0;

    if (isValid) {
      console.log('✅ Data validation passed!');
    } else {
      console.log('❌ Data validation failed - some collections are empty');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  }
}
