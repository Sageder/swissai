import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  EmergencyEvent,
  MonitoringStation,
  Authority,
  Resource,
  Evacuee,
  Decision,
  TimelineEvent
} from '@/types/emergency';

export class EmergencyDataService {
  // Events collection
  async getEvents(): Promise<EmergencyEvent[]> {
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyEvent));
  }

  async getEvent(eventId: string): Promise<EmergencyEvent | null> {
    const eventRef = doc(db, 'events', eventId);
    const snapshot = await getDoc(eventRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as EmergencyEvent : null;
  }

  async createEvent(event: Omit<EmergencyEvent, 'id'>): Promise<string> {
    const eventsRef = collection(db, 'events');
    const docRef = await addDoc(eventsRef, event);
    return docRef.id;
  }

  async updateEvent(eventId: string, updates: Partial<EmergencyEvent>): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, updates);
  }

  // Monitoring stations collection
  async getMonitoringStations(): Promise<MonitoringStation[]> {
    const stationsRef = collection(db, 'monitoring_data');
    const snapshot = await getDocs(stationsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonitoringStation));
  }

  async getMonitoringStation(sensorId: string): Promise<MonitoringStation | null> {
    const stationsRef = collection(db, 'monitoring_data');
    const q = query(stationsRef, where('sensorId', '==', sensorId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as MonitoringStation;
  }

  async updateMonitoringStation(sensorId: string, updates: Partial<MonitoringStation>): Promise<void> {
    const station = await this.getMonitoringStation(sensorId);
    if (station) {
      const stationRef = doc(db, 'monitoring_data', station.id);
      await updateDoc(stationRef, updates);
    }
  }

  async addSensorReading(sensorId: string, reading: any): Promise<void> {
    const station = await this.getMonitoringStation(sensorId);
    if (station) {
      const updatedReadings = [...station.readings, reading];
      await this.updateMonitoringStation(sensorId, { readings: updatedReadings });
    }
  }

  // Authorities collection
  async getAuthorities(): Promise<Authority[]> {
    const authoritiesRef = collection(db, 'authorities');
    const snapshot = await getDocs(authoritiesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Authority));
  }

  async getAuthority(authorityId: string): Promise<Authority | null> {
    const authoritiesRef = collection(db, 'authorities');
    const q = query(authoritiesRef, where('authorityId', '==', authorityId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Authority;
  }

  async updateAuthorityStatus(authorityId: string, status: string): Promise<void> {
    const authority = await this.getAuthority(authorityId);
    if (authority) {
      const authorityRef = doc(db, 'authorities', authority.id);
      await updateDoc(authorityRef, { currentStatus: status });
    }
  }

  // Resources collection
  async getResources(): Promise<Resource[]> {
    const resourcesRef = collection(db, 'resources');
    const snapshot = await getDocs(resourcesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
  }

  async getResource(resourceId: string): Promise<Resource | null> {
    const resourcesRef = collection(db, 'resources');
    const q = query(resourcesRef, where('resourceId', '==', resourceId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Resource;
  }

  async updateResourceStatus(resourceId: string, status: string, assignment?: string): Promise<void> {
    const resource = await this.getResource(resourceId);
    if (resource) {
      const resourceRef = doc(db, 'resources', resource.id);
      const updates: any = { status };
      if (assignment) {
        updates.currentAssignment = assignment;
      }
      await updateDoc(resourceRef, updates);
    }
  }

  // Evacuees subcollection
  async getEvacuees(eventId: string): Promise<Evacuee[]> {
    const evacueesRef = collection(db, 'events', eventId, 'evacuees');
    const snapshot = await getDocs(evacueesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evacuee));
  }

  async addEvacuee(eventId: string, evacuee: Omit<Evacuee, 'id'>): Promise<string> {
    const evacueesRef = collection(db, 'events', eventId, 'evacuees');
    const docRef = await addDoc(evacueesRef, evacuee);
    return docRef.id;
  }

  async updateEvacueeStatus(eventId: string, evacueeId: string, status: string): Promise<void> {
    const evacueeRef = doc(db, 'events', eventId, 'evacuees', evacueeId);
    await updateDoc(evacueeRef, { status });
  }

  // Decision log collection
  async getDecisions(): Promise<Decision[]> {
    const decisionsRef = collection(db, 'decision_log');
    const q = query(decisionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Decision));
  }

  async getDecisionsForEvent(eventId: string): Promise<Decision[]> {
    const decisionsRef = collection(db, 'decision_log');
    const q = query(decisionsRef, where('eventId', '==', eventId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Decision));
  }

  async addDecision(decision: Omit<Decision, 'id'>): Promise<string> {
    const decisionsRef = collection(db, 'decision_log');
    const docRef = await addDoc(decisionsRef, decision);
    return docRef.id;
  }

  async updateDecisionStatus(decisionId: string, status: string): Promise<void> {
    const decisionRef = doc(db, 'decision_log', decisionId);
    await updateDoc(decisionRef, { status });
  }

  // Timeline events subcollection
  async getTimelineEvents(eventId: string): Promise<TimelineEvent[]> {
    const timelineRef = collection(db, 'events', eventId, 'timeline');
    const q = query(timelineRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineEvent));
  }

  async addTimelineEvent(eventId: string, event: Omit<TimelineEvent, 'id'>): Promise<string> {
    const timelineRef = collection(db, 'events', eventId, 'timeline');
    const docRef = await addDoc(timelineRef, event);
    return docRef.id;
  }

  // Real-time listeners
  subscribeToEvent(eventId: string, callback: (event: EmergencyEvent | null) => void): () => void {
    const eventRef = doc(db, 'events', eventId);
    return onSnapshot(eventRef, (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } as EmergencyEvent : null);
    });
  }

  subscribeToMonitoringStations(callback: (stations: MonitoringStation[]) => void): () => void {
    const stationsRef = collection(db, 'monitoring_data');
    return onSnapshot(stationsRef, (snapshot) => {
      const stations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonitoringStation));
      callback(stations);
    });
  }

  subscribeToTimelineEvents(eventId: string, callback: (events: TimelineEvent[]) => void): () => void {
    const timelineRef = collection(db, 'events', eventId, 'timeline');
    const q = query(timelineRef, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineEvent));
      callback(events);
    });
  }

  // Bulk data operations for simulation setup
  async uploadSimulationData(data: {
    events: EmergencyEvent[];
    monitoringStations: MonitoringStation[];
    authorities: Authority[];
    resources: Resource[];
    evacuees: Evacuee[];
    decisions: Decision[];
    timelineEvents: TimelineEvent[];
  }): Promise<void> {
    const batch = [];
    
    // Upload events
    for (const event of data.events) {
      const eventRef = doc(db, 'events', event.eventId);
      batch.push(setDoc(eventRef, event));
    }

    // Upload monitoring stations
    for (const station of data.monitoringStations) {
      const stationRef = doc(db, 'monitoring_data', station.sensorId);
      batch.push(setDoc(stationRef, station));
    }

    // Upload authorities
    for (const authority of data.authorities) {
      const authorityRef = doc(db, 'authorities', authority.authorityId);
      batch.push(setDoc(authorityRef, authority));
    }

    // Upload resources
    for (const resource of data.resources) {
      const resourceRef = doc(db, 'resources', resource.resourceId);
      batch.push(setDoc(resourceRef, resource));
    }

    // Upload decisions
    for (const decision of data.decisions) {
      const decisionRef = doc(db, 'decision_log', decision.decisionId);
      batch.push(setDoc(decisionRef, decision));
    }

    // Upload evacuees and timeline events for each event
    for (const event of data.events) {
      for (const evacuee of data.evacuees) {
        const evacueeRef = doc(db, 'events', event.eventId, 'evacuees', evacuee.evacueeId);
        batch.push(setDoc(evacueeRef, evacuee));
      }

      for (const timelineEvent of data.timelineEvents) {
        const timelineRef = doc(db, 'events', event.eventId, 'timeline', timelineEvent.timestamp);
        batch.push(setDoc(timelineRef, timelineEvent));
      }
    }

    // Execute all operations
    await Promise.all(batch);
  }
}
