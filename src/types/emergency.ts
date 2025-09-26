// Core emergency management types for Swiss Emergency Management Platform

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface Contact {
  phone: string;
  email?: string;
  radio?: string;
  emergency?: string;
}

export interface AlertThresholds {
  warning: number;
  alert: number;
  critical: number;
  emergency?: number;
}

export interface SensorReading {
  timestamp: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'alert' | 'critical' | 'emergency' | 'major_event' | 'aftershock' | 'failure_imminent' | 'blocked' | 'flood_risk';
  temperature?: number;
  humidity?: number;
  precipitation?: number;
  wind_speed?: number;
  visibility?: number;
}

export interface MonitoringStation {
  sensorId: string;
  sensorType: 'glacier_movement' | 'glacier_stress' | 'seismic' | 'water_level' | 'weather';
  location: Location;
  readings: SensorReading[];
  alertThresholds?: AlertThresholds;
  responsibleOrganization: 'WSL' | 'SED-ETHZ' | 'FOEN' | 'MeteoSwiss';
  batteryStatus: number;
  connectivity: 'online' | 'offline' | 'degraded';
}

export interface Authority {
  authorityId: string;
  name: string;
  type: 'police' | 'federal_civil_protection' | 'municipal' | 'veterinary' | 'research' | 'humanitarian';
  level: 'federal' | 'cantonal' | 'municipal';
  jurisdiction: string;
  specialization: string[];
  contact: Contact;
  currentStatus: 'available' | 'activated' | 'coordinating' | 'deployed' | 'evacuated' | 'monitoring';
  personnelCount?: number;
  responseTime?: string;
  headquarters?: Coordinates;
  equipmentInventory?: string[];
  population?: number;
  buildings?: {
    residential: number;
    commercial: number;
    agricultural: number;
  };
  equipment?: string[];
  experts?: string[];
  volunteers?: number;
  facilities?: string[];
}

export interface Vehicle {
  type: string;
  capacity?: string;
  crew: number;
  equipment?: string;
}

export interface Resource {
  resourceId: string;
  type: 'fire_station' | 'hospital' | 'medical_center' | 'helicopter' | 'emergency_shelter' | 'power_grid' | 'water_system' | 'communication';
  subtype?: string;
  location: Location;
  status: 'available' | 'activated' | 'standby' | 'deployed' | 'en_route' | 'normal_operations' | 'emergency_mode' | 'operational';
  personnel?: number;
  vehicles?: Vehicle[];
  specializations?: string[];
  responseTime?: string;
  operatingRadius?: number;
  equipment?: string[];
  currentAssignment?: string;
  capacity?: {
    beds?: number;
    emergency?: number;
    icu?: number;
    surgery?: number;
    treatment_rooms?: number;
    staff?: number;
    passengers?: number;
    cargo_kg?: number;
    meals_per_day?: number;
    parking?: number;
    classrooms?: number;
    mw_total?: number;
    backup_mw?: number;
    liters_per_day?: number;
    reserve_days?: number;
  };
  evacuationCapacity?: number;
  helicopter_pad?: boolean;
  staff?: {
    doctors?: number;
    nurses?: number;
    support?: number;
  };
  hoist?: boolean;
  crew?: {
    pilot?: string;
    paramedic?: string;
    technician?: string;
    pilots?: number;
    crew_chief?: number;
    loadmaster?: number;
  };
  fuel_status?: number;
  flight_hours_remaining?: number;
  eta?: string;
  facilities?: string[];
  occupancy?: number;
  services?: string[];
  supplies?: {
    food_days: number;
    water_days: number;
    medical_basic: boolean;
  };
  preparation_time?: string;
  affectedCustomers?: number;
  backupSystems?: string[];
  vulnerableLines?: string[];
  vulnerabilities?: string[];
  backup_sources?: string[];
  channels?: {
    emergency: string;
    police: string;
    fire: string;
    medical: string;
    coordination: string;
  };
  redundancy?: string;
  coverage_quality?: {
    [key: string]: string;
  };
}

export interface Individual {
  name: string;
  age: number;
  role: 'head_of_household' | 'spouse' | 'child' | 'temporary_residents';
  medical?: string;
  count?: number;
}

export interface Evacuee {
  evacueeId: string;
  familyName: string;
  individuals: Individual[];
  address: {
    street: string;
    village: string;
    postal: string;
  };
  evacuationDetails: {
    time: string;
    method: string;
    officer: string;
    coordinator?: string;
    notes: string;
  };
  shelter: {
    assigned: string;
    checkIn: string;
    room: string;
  };
  status: 'safe' | 'evacuated' | 'missing' | 'injured';
  specialNeeds?: string[];
  livestock?: {
    cattle?: number;
    sheep?: number;
    goats?: number;
    horses?: number;
    evacuationStatus: string;
    helicopterEvac?: string;
    temporaryLocation?: string;
  };
  property?: {
    buildings: string[];
    insurance: string;
    documentsSecured: boolean;
  };
  repatriationStatus?: string;
}

export interface Decision {
  decisionId: string;
  eventId?: string;
  decisionType: 'monitoring_enhancement' | 'partial_evacuation' | 'full_evacuation' | 'livestock_evacuation' | 'expanded_evacuation';
  issuedBy: string;
  approvedBy: string;
  timestamp: string;
  rationale: string;
  affectedAreas: string[];
  affectedPopulation?: number;
  resourcesRequired: string[];
  timelineTarget: string;
  communicationPlan?: string;
  contingencyMeasures?: string[];
  specialRequirements?: string[];
  status: 'implemented' | 'completed' | 'in_progress' | 'implementing' | 'pending';
}

export interface TimelineEvent {
  timestamp: string;
  eventType: 'detection' | 'assessment' | 'escalation' | 'coordination' | 'critical_escalation' | 'decision' | 'full_evacuation' | 'livestock_operations' | 'disaster_event' | 'secondary_hazard' | 'federal_response';
  description: string;
  actor: string;
  severity: 'warning' | 'alert' | 'critical' | 'catastrophic';
  automatic?: boolean;
  notifications?: string[];
  decision?: string;
  participants?: string[];
  decisions?: string[];
  triggers?: string[];
  affectedResidents?: number;
  resources?: string[];
  evacuationWindow?: string;
  livestock?: {
    cattle: number;
    sheep: number;
    goats: number;
  };
  seismicDetection?: string;
  impactAssessment?: string;
  waterLevel?: string;
  floodRisk?: string;
}

export interface EventLocation {
  primary: string;
  coordinates: Coordinates;
  impactRadius: number;
  evacuationZones: string[];
}

export interface AffectedPopulation {
  residents: number;
  tourists: number;
  emergency_personnel: number;
  livestock: {
    cattle: number;
    sheep: number;
    goats: number;
    horses: number;
  };
}

export interface InitialDetection {
  source: string;
  detectorId: string;
  initialValue: string;
  threshold: string;
  confidence: number;
}

export interface PrimaryImpact {
  area_km2: number;
  volume_m3: number;
  velocity: string;
}

export interface SecondaryRisk {
  type: string;
  probability: number;
  impact: string;
}

export interface EconomicImpact {
  estimate: string;
  confidence: string;
}

export interface ScenarioModeling {
  primaryImpact: PrimaryImpact;
  secondaryRisks: SecondaryRisk[];
  economicImpact: EconomicImpact;
}

export interface WeatherConditions {
  temperature: number;
  visibility: number;
  windSpeed: number;
  precipitation: number;
  helicopterConditions: string;
}

export interface EmergencyEvent {
  eventId: string;
  name: string;
  type: string;
  category: string;
  detectedAt: string;
  eventOccurred: string;
  location: EventLocation;
  severity: string;
  status: string;
  affectedPopulation: AffectedPopulation;
  description: string;
  initialDetection: InitialDetection;
  scenarioModeling: ScenarioModeling;
  weatherConditions: WeatherConditions;
  mediaAttention: string;
  politicalInvolvement: string[];
}

// Platform Events (new)
export interface PlatformEvent {
  eventId: string;
  timestamp: string;
  eventType: 'automated_detection' | 'resource_discovery' | 'expert_validation' | 'escalation_trigger' | 'coordination_meeting' | 'critical_threshold_alert' | 'partial_evacuation_order' | 'full_evacuation_decision' | 'livestock_coordination' | 'disaster_event_detection' | 'secondary_hazard_response' | 'federal_activation';
  title: string;
  description: string;
  systemAction: 'automatic' | 'user_initiated';
  triggeredBy?: string;
  dataSource?: string;
  readings?: {
    value: number;
    unit: string;
    threshold_exceeded?: string;
  };
  automaticActions?: string[];
  notifiedAuthorities?: string[];
  confidence?: number;
  discoveredResources?: {
    fire_stations: number;
    medical_facilities: number;
    aviation: number;
    shelters: number;
    police: number;
    specialized_teams: number;
    infrastructure: number;
  };
  totalResources?: number;
  discoveryTime?: string;
  mapDataUpdated?: boolean;
  user?: string;
  action?: string;
  validationResult?: string;
  recommendedActions?: string[];
  platformSupport?: string;
  confidenceUpdate?: number;
  previousLevel?: string;
  newLevel?: string;
  suggestedResourceMoves?: Array<{
    resource: string;
    action: string;
    eta?: string;
    location?: string;
  }>;
  meetingType?: string;
  participants?: Array<{
    authority: string;
    user: string;
  }>;
  platformFeatures?: string[];
  decisionsLogged?: string[];
  meetingDuration?: string;
  criticalReading?: {
    value: number;
    unit: string;
    status: string;
  };
  aiRecommendations?: {
    primary_action: string;
    affected_population: number;
    evacuation_window: string;
    optimal_shelter: string;
    resource_allocation: string;
  };
  riskAssessment?: {
    collapse_probability: number;
    time_window: string;
    secondary_risks: string[];
  };
  decisionType?: string;
  scope?: string;
  affectedResidents?: number;
  evacuationArea?: string;
  platformActions?: string[];
  assignedResources?: string[];
  estimatedCompletion?: string;
  approvedBy?: string;
  affectedPopulation?: number;
  evacuationWindow?: string;
  platformCoordination?: {
    automatic_resource_optimization?: boolean;
    multi_agency_task_distribution?: boolean;
    real_time_progress_tracking?: boolean;
    public_communication_coordination?: boolean;
  };
  resourceMobilization?: string;
  coordinatedBy?: string;
  livestockInventory?: {
    cattle: number;
    sheep: number;
    goats: number;
    horses: number;
  };
  platformOptimization?: {
    helicopter_scheduling?: string;
    landing_zone_allocation?: string;
    veterinary_team_deployment?: string;
    temporary_grazing_allocation?: string;
  };
  estimatedDuration?: string;
  seismicData?: {
    magnitude: number;
    location: string;
    sensor: string;
  };
  automaticResponses?: string[];
  secondaryThreats?: string[];
  waterLevelData?: {
    current: number;
    normal: number;
    status: string;
  };
  expandedEvacuation?: {
    additional_residents: number;
    new_areas: string[];
    automatic_shelter_allocation: string;
    transport_coordination: string;
  };
  platformEfficiency?: string;
  federalActivation?: {
    emergency_funding: string;
    military_helicopter_support: string;
    federal_coordination_center: string;
    international_aid_protocols: string;
  };
}

// Resource Movements (new)
export interface ResourceMovement {
  movementId: string;
  timestamp: string;
  eventType: 'initial_position' | 'readiness_elevation' | 'strategic_pre_positioning' | 'evacuation_deployment' | 'mass_mobilization' | 'specialized_operations' | 'disaster_response_repositioning' | 'secondary_hazard_response';
  title: string;
  description: string;
  resourcePositions?: Array<{
    resourceId: string;
    position: {
      lat: number;
      lng: number;
      location: string;
    };
    status: string;
    personnel?: number;
    readiness?: string;
    fuel?: number;
    availableBeds?: number;
  }>;
  systemAction?: string;
  totalResourcesTracked?: number;
  triggeredBy?: string;
  affectedResources?: Array<{
    resourceId: string;
    position: {
      lat: number;
      lng: number;
      location: string;
    };
    statusChange: string;
    readinessChange: string;
    preparationActions: string[];
    responseTime: string;
  }>;
  platformOptimization?: string;
  resourceMovements?: Array<{
    resourceId: string;
    movement: {
      from: {
        lat: number;
        lng: number;
        location: string;
      };
      to: {
        lat: number;
        lng: number;
        location: string;
      };
      reason: string;
      distance: string;
      travelTime: string;
    };
    statusChange: string;
    assignedPersonnel: number;
    equipmentDeployed: string[];
  }>;
  platformCalculation2?: string;
  resourceDeployments?: Array<{
    resourceId: string;
    deployment: {
      from: {
        lat: number;
        lng: number;
        location: string;
      };
      to: {
        lat: number;
        lng: number;
        location: string;
      };
      reason: string;
      distance: string;
      deploymentTime: string;
    };
    statusChange: string;
    missionType: string;
    assignedTasks: string[];
  }>;
  coordinatedEvacuees?: number;
  platformEfficiency?: string;
  massDeployment?: Array<{
    resourceId: string;
    deployment: {
      from: {
        lat: number;
        lng: number;
        location: string;
      };
      to: {
        lat: number;
        lng: number;
        location: string;
      };
      reason: string;
      assignedSector?: string;
      equipmentDeployed?: string[];
    };
    statusChange: string;
    assignedFamilies?: number;
    specializations?: string[];
  }>;
  totalResourcesDeployed?: number;
  coordinationTime?: string;
  platformOptimization2?: string;
  specializedDeployments?: Array<{
    resourceId: string;
    deployment: {
      from: {
        lat: number;
        lng: number;
        location: string;
      };
      to: {
        lat: number;
        lng: number;
        location: string;
      };
      reason: string;
      flightTime?: string;
      cargoCapacity?: string;
      transportTime?: string;
    };
    statusChange: string;
    missionSpecialization?: string;
    equipmentConfiguration?: string[];
    teamComposition?: string[];
    livestockManagement?: {
      cattle: number;
      sheep: number;
      goats: number;
      horses: number;
    };
  }>;
  operationComplexity?: string;
  platformCoordination?: string[];
  immediateRepositioning?: Array<{
    resourceId: string;
    emergency_deployment: {
      from: {
        lat: number;
        lng: number;
        location: string;
      };
      to: {
        lat: number;
        lng: number;
        location: string;
      };
      reason: string;
      responseTime: string;
      equipmentDeployed: string[];
    };
    statusChange: string;
    missionProfile: string;
  }>;
  responseTime?: string;
  automaticProtocols?: string[];
  expandedDeployment?: Array<{
    resourceId: string;
    emergency_deployment: {
      from: {
        lat: number;
        lng: number;
        location: string;
      };
      to: {
        lat: number;
        lng: number;
        location: string;
      };
      reason: string;
      responseTime: string;
      equipmentDeployed: string[];
    };
    statusChange: string;
    missionProfile: string;
  }>;
  coordinationEfficiency?: string;
  platformIntelligence?: string;
}

// Activity Log (new)
export interface ActivityLog {
  logId: string;
  timestamp: string;
  category: 'system_automation' | 'resource_management' | 'user_interaction' | 'coordination' | 'ai_decision_support' | 'specialized_coordination' | 'disaster_detection' | 'secondary_hazard' | 'federal_coordination';
  severity: 'info' | 'warning' | 'alert' | 'critical' | 'catastrophic';
  title: string;
  description: string;
  systemDetails?: {
    triggerSensor: string;
    sensorReading: {
      value: number;
      unit: string;
      baseline: number;
    };
    aiConfidence: number;
    processingTime: string;
    alertsGenerated: number;
    authoritiesNotified: string[];
  };
  dataQuality?: string;
  automaticActions?: string[];
  discoveryResults?: {
    totalResourcesFound: number;
    queryRadius: string;
    discoveryTime: string;
    resourceTypes: {
      fire_stations: number;
      medical_facilities: number;
      aviation: number;
      shelters: number;
      police: number;
      specialized: number;
    };
    dataSourcesIntegrated: string[];
  };
  mapDataUpdated?: boolean;
  resourceAvailabilityConfirmed?: boolean;
  userSession?: {
    user: string;
    organization: string;
    role: string;
    sessionDuration: string;
    platformFeatures: string[];
  };
  expertActions?: string[];
  decisionSupport?: {
    scenariosAnalyzed: number;
    probabilityModels: number;
    riskAssessment: string;
    confidenceLevel: number;
  };
  coordinationSession?: {
    sessionType: string;
    participants: Array<{
      name: string;
      org: string;
      role: string;
    }>;
    collaborationTools: string[];
    sessionDuration: string;
  };
  coordinationOutcomes?: string[];
  escalationDetails?: {
    triggerReading: {
      value: number;
      unit: string;
    };
    previousLevel: string;
    newLevel: string;
    automaticActions: number;
    processingTime: string;
  };
  resourceOptimization?: {
    analyzedResources: number;
    optimizationAlgorithm: string;
    recommendedPrePositioning: Array<{
      resource: string;
      rationale: string;
    }>;
    optimizationTime: string;
  };
  notificationsSent?: number;
  authoritiesAlerted?: string[];
  officialMeeting?: {
    meetingType: string;
    chairperson: string;
    participants: Array<{
      name: string;
      org: string;
      role: string;
    }>;
    platformSupport: string[];
  };
  officialDecisions?: Array<{
    decision: string;
    approver: string;
    implementation: string;
  }>;
  meetingEfficiency?: string;
  documentationGenerated?: string;
  aiDecisionSupport?: {
    triggerReading: {
      value: number;
      unit: string;
      status: string;
    };
    aiRecommendation: string;
    confidenceLevel: number;
    processingTime: string;
    analysisFactors: string[];
  };
  evacuationPlan?: {
    affectedPopulation: number;
    evacuationWindow: string;
    primaryShelter: string;
    backupShelters: string[];
    transportCoordination: string;
    specialNeeds: string;
  };
  resourceAllocation?: {
    totalResourcesAssigned: number;
    allocationTime: string;
    optimizationCriteria: string[];
  };
  evacuationOrder?: {
    issuedBy: string;
    authority: string;
    orderType: string;
    legalBasis: string;
    affectedResidents: number;
    evacuationZone: string;
  };
  platformAutomation?: {
    automaticActions: number;
    resourceAssignments: string;
    residentNotifications: string;
    logisticsCoordination: string;
    progressMonitoring: string;
  };
  coordinationEfficiency?: {
    orderToDeployment: string;
    residentNotification: string;
    resourceMobilization: string;
    evacuationCompletion: string;
  };
  communicationChannels?: string[];
  fullEvacuationOrder?: {
    issuedBy: string;
    approvedBy: string;
    orderType: string;
    affectedPopulation: number;
    evacuationWindow: string;
    legalStatus: string;
  };
  platformCoordination?: {
    resourcesCoordinated: number;
    agenciesInvolved: number;
    simultaneousTasks: number;
    coordinationTime: string;
    optimizationAlgorithms: string[];
  };
  realTimeTracking?: {
    evacueeTracking: string;
    resourceStatus: string;
    progressMetrics: string;
    communicationLog: string;
  };
  livestockOperation?: {
    coordinatedBy: string;
    totalAnimals: number;
    animalBreakdown: {
      cattle: number;
      sheep: number;
      goats: number;
      horses: number;
    };
    helicopterAssets: string[];
    veterinaryTeams: number;
  };
  platformOptimization?: {
    flightPathOptimization: string;
    landingZoneAllocation: string;
    animalHandlingScheduling: string;
    temporaryGrazingAllocation: string;
  };
  operationalMetrics?: {
    totalFlightHours: number;
    fuelEfficiencySaving: string;
    animalStressMitigation: string;
    operationDuration: string;
  };
  safetyProtocols?: string;
  disasterDetection?: {
    detectionSensor: string;
    seismicMagnitude: number;
    detectionTime: string;
    automaticClassification: string;
    locationAccuracy: string;
  };
  immediateResponse?: {
    protocolsActivated: number;
    authoritiesNotified: string;
    responseTime: string;
    resourceStatusUpdates: string;
    mediaCoordination: string;
  };
  systemPerformance?: {
    detectionToNotification: string;
    coordinationActivation: string;
    resourceMobilization: string;
    communicationReach: string;
  };
  secondaryHazardDetection?: {
    hazardType: string;
    detectionSensor: string;
    waterLevelChange: {
      from: number;
      to: number;
      unit: string;
    };
    floodRiskAssessment: string;
    affectedArea: string;
  };
  automaticExpansion?: {
    additionalEvacuees: number;
    shelterAllocation: string;
    transportCoordination: string;
    resourceRedeployment: string;
    coordinationTime: string;
  };
  platformIntelligence?: {
    cascadingHazardPrediction: string;
    resourceReallocation: string;
    communicationExpansion: string;
    operationalContinuity: string;
  };
  federalActivation?: {
    activatedBy: string;
    federalAuthority: string;
    emergencyFunding: string;
    militarySupport: string;
    internationalProtocols: string;
  };
  platformIntegration?: {
    federalResourceIntegration: string;
    unifiedCommandStructure: string;
    communicationConsolidation: string;
    situationalAwareness: string;
  };
  operationalOutcome?: {
    coordinationEfficiency: string;
    responseTime: string;
    resourceOptimization: string;
    communicationClarity: string;
  };
}

// Simulation state types
export interface SimulationState {
  currentTime: string;
  isRunning: boolean;
  speed: number; // multiplier for time progression
  phase: 'detection' | 'escalation' | 'evacuation' | 'response' | 'recovery';
  activeEvent?: EmergencyEvent;
}

export interface SimulationConfig {
  startTime: string;
  endTime: string;
  timeStep: number; // milliseconds
  autoAdvance: boolean;
  eventTriggers: {
    [key: string]: {
      condition: string;
      action: string;
    };
  };
}
