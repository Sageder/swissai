# Comprehensive Firestore Database Structure for Swiss Emergency Management Platform

## Database Overview
This Firestore database structure supports a complete emergency management platform that centralizes data from multiple sources, automates coordination, and provides real-time decision support for natural disasters like the 2025 Blatten glacier collapse.

## Core Collections

### 1. `events` Collection
**Purpose**: Master records for all emergency events
**Document Structure**:
```json
{
  "eventId": "blatten-glacier-2025-05-28",
  "name": "Blatten Glacier Collapse - Mass Evacuation Event",
  "type": "glacier_collapse",
  "category": "natural_disaster",
  "detectedAt": "2025-05-17T06:23:00Z",
  "eventOccurred": "2025-05-28T14:32:17Z",
  "location": {
    "primary": "Blatten, Valais, CH",
    "coordinates": {"lat": 46.369, "lng": 7.814},
    "impactRadius": 5.2,
    "evacuationZones": ["zone_a_immediate", "zone_b_precautionary", "zone_c_monitoring"]
  },
  "severity": "critical",
  "status": "response_active",
  "affectedPopulation": {
    "residents": 320,
    "tourists": 45,
    "emergency_personnel": 95,
    "livestock": {"cattle": 180, "sheep": 340, "goats": 75, "horses": 12}
  },
  "scenarioModeling": {
    "primaryImpact": {"area_km2": 2.8, "volume_m3": 9000000},
    "secondaryRisks": [
      {"type": "river_blockage", "probability": 0.9, "impact": "severe"},
      {"type": "flooding", "probability": 0.8, "impact": "moderate"}
    ],
    "economicImpact": {"estimate": "CHF 85M", "confidence": "medium"}
  },
  "authoritiesInvolved": ["valais-cantonal-police", "focp-bern", "wsl-birmensdorf"],
  "resourcesDeployed": ["fire-naters-volunteer", "heli-air-rescue-1", "shelter-naters-sports"],
  "weatherConditions": {"temperature": 19.2, "helicopterConditions": "favorable"}
}
```

### 2. `monitoring_data` Collection  
**Purpose**: Real-time sensor data from all monitoring systems
**Key Features**: 
- Automated threshold detection
- Multi-source integration (WSL, MeteoSwiss, FOEN, SED-ETHZ)
- Real-time alert generation
- Battery status and connectivity monitoring

**Example Document**:
```json
{
  "sensorId": "WSL-GLAC-345",
  "sensorType": "glacier_movement", 
  "location": {"name": "Blatten Glacier Terminus", "lat": 46.369, "lng": 7.814},
  "readings": [
    {"timestamp": "2025-05-17T06:00:00Z", "value": 1.7, "unit": "m/day", "status": "warning"},
    {"timestamp": "2025-05-28T14:32:17Z", "value": 3.1, "unit": "magnitude", "status": "major_event"}
  ],
  "alertThresholds": {"warning": 1.5, "alert": 2.0, "critical": 2.5},
  "responsibleOrganization": "WSL",
  "batteryStatus": 87,
  "connectivity": "online"
}
```

### 3. `authorities` Collection
**Purpose**: Complete directory of emergency response organizations
**Auto-Discovery**: Platform automatically identifies relevant authorities based on:
- Geographic jurisdiction
- Hazard type specialization  
- Resource capabilities
- Response protocols

**Example Document**:
```json
{
  "authorityId": "valais-cantonal-police",
  "name": "Valais Cantonal Police",
  "type": "police",
  "level": "cantonal",
  "jurisdiction": "Valais Canton",
  "specialization": ["evacuation", "traffic_control", "coordination"],
  "contact": {"phone": "+41-27-326-5611", "radio": "POLYCOM-VS-1"},
  "currentStatus": "activated",
  "personnelCount": 45,
  "responseTime": "15 minutes",
  "equipmentInventory": ["patrol_vehicles", "traffic_barriers"]
}
```

### 4. `resources` Collection
**Purpose**: Real-time inventory of all emergency resources  
**Auto-Discovery**: Platform automatically maps all resources within operational radius:
- Fire stations (professional, volunteer, industrial)
- Medical facilities (hospitals, clinics, emergency centers)
- Aviation resources (helicopters, aircraft)
- Shelter facilities (sports centers, schools, community centers)
- Infrastructure systems (power, water, communications)

**Example Fire Station**:
```json
{
  "resourceId": "fire-brig-central",
  "type": "fire_station",
  "subtype": "professional", 
  "location": {"name": "Brig Fire Station", "lat": 46.319, "lng": 7.987},
  "status": "available",
  "personnel": 18,
  "vehicles": [
    {"type": "ladder_truck", "capacity": "30m ladder", "crew": 4},
    {"type": "pumper", "capacity": "3000L/min", "crew": 6}
  ],
  "specializations": ["structural_fire", "rescue", "hazmat"],
  "responseTime": "12 minutes",
  "operatingRadius": 25
}
```

### 5. `decision_log` Collection
**Purpose**: Complete audit trail of all decisions and approvals
**Key Features**:
- Decision workflow tracking
- Authority approval chains
- Resource allocation history
- Timeline compliance monitoring

**Example Decision**:
```json
{
  "decisionId": "DEC-003",
  "decisionType": "full_evacuation",
  "issuedBy": "valais-cantonal-police", 
  "approvedBy": "focp-bern",
  "timestamp": "2025-05-19T11:45:00Z",
  "rationale": "Glacier movement reaching critical levels - total village evacuation required",
  "affectedAreas": ["blatten_complete", "surrounding_farmsteads"],
  "affectedPopulation": 320,
  "resourcesRequired": ["all_fire_stations", "multiple_shelters", "helicopter_support"],
  "timelineTarget": "2 hours",
  "communicationPlan": "alertswiss_sirens_police",
  "status": "completed"
}
```

### 6. `infrastructure` Collection
**Purpose**: Critical infrastructure monitoring and status
**Systems Tracked**:
- Power grids and backup systems
- Water treatment and distribution
- Communication networks
- Transportation systems
- Healthcare facilities

## Subcollections Structure

### `/events/{eventId}/timeline`
**Purpose**: Chronological event log with automated and manual entries
- Real-time sensor alerts
- Decision milestones  
- Resource deployments
- Status updates

### `/events/{eventId}/actions`
**Purpose**: Response actions and task management
- Task assignments to specific authorities
- Resource deployment tracking
- Progress monitoring
- Completion verification

### `/events/{eventId}/evacuees` 
**Purpose**: Individual and family tracking
**Features**:
- Personal information and special needs
- Evacuation details and timeline
- Shelter assignments
- Livestock coordination
- Property documentation

### `/events/{eventId}/public_communications`
**Purpose**: Public-facing messages and media coordination
- AlertSwiss notifications
- Press releases
- Social media updates
- Multi-language content
- Reach and engagement metrics

### `/authorities/{authorityId}/personnel`
**Purpose**: Staff assignments and availability
- Current deployments
- Shift schedules
- Specialized capabilities
- Contact information

### `/resources/{resourceId}/deployment_history`
**Purpose**: Historical deployment data for optimization
- Previous assignments
- Response times
- Effectiveness metrics
- Maintenance schedules

## Platform Integration Points

### Automated Data Ingestion
- **WSL Sensors**: Glacier movement, snow conditions, avalanche risk
- **MeteoSwiss**: Weather data, precipitation, visibility
- **FOEN**: Water levels, environmental monitoring
- **SED-ETHZ**: Seismic activity, earthquake detection
- **Swisstopo**: Geographic and geological data

### Authority Notification Automation
- **Geographic Matching**: Auto-identify authorities by jurisdiction
- **Specialization Matching**: Route alerts based on hazard type
- **Escalation Protocols**: Automatic federal involvement triggers
- **Multi-Channel Distribution**: POLYCOM radio, email, SMS, app notifications

### Resource Discovery and Allocation
- **Geographic Search**: Find all resources within operational radius
- **Capability Matching**: Match resource specializations to needs
- **Availability Tracking**: Real-time status of personnel and equipment
- **Optimization Engine**: Suggest optimal resource deployment strategies

## Hackathon Demonstration Flow

### Phase 1: Initial Detection (Minutes 1-5)
1. WSL sensor detects glacier acceleration
2. Platform automatically alerts relevant authorities
3. Risk assessment algorithms analyze threat level
4. Dashboard shows real-time situation overview

### Phase 2: Escalation and Coordination (Minutes 6-15)
1. Platform identifies all authorities within jurisdiction
2. Automatic resource discovery maps available capabilities  
3. Decision support system presents evacuation recommendations
4. Multi-agency coordination dashboard activated

### Phase 3: Resource Deployment (Minutes 16-25)
1. Evacuation order triggers automatic resource allocation
2. Platform optimizes fire station, helicopter, and shelter assignments
3. Individual evacuee tracking begins
4. Livestock evacuation coordination initiated

### Phase 4: Public Communication (Minutes 26-30)
1. Coordinated public messaging across all channels
2. Real-time evacuation status updates
3. Media coordination and press release distribution
4. Citizen-facing dashboard with transparent information

### Phase 5: Event Response (Minutes 31-35)
1. Real-time monitoring of glacier collapse
2. Secondary hazard detection (river blockage)
3. Expanded evacuation coordination
4. Federal resource activation

## Data Realism and Accuracy
All simulation data is based on:
- Actual Swiss emergency response protocols
- Real geographic locations and coordinates
- Authentic resource capabilities and response times
- Accurate authority jurisdictions and contact methods
- Historical disaster response patterns
- Current technology capabilities

This comprehensive structure enables demonstration of a complete emergency management ecosystem that would significantly improve coordination, reduce response times, and optimize resource utilization during major disasters like the Blatten glacier collapse.