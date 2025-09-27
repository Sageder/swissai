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
    if (!db) return [] as EmergencyEvent[];
    const eventsRef = collection(db as any, 'events');
    const snapshot = await getDocs(eventsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as EmergencyEvent));
  }

  async getEvent(eventId: string): Promise<EmergencyEvent | null> {
    if (!db) return null;
    const eventRef = doc(db as any, 'events', eventId);
    const snapshot = await getDoc(eventRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as unknown as EmergencyEvent : null;
  }

  async createEvent(event: Omit<EmergencyEvent, 'id'>): Promise<string> {
    if (!db) return '';
    const eventsRef = collection(db as any, 'events');
    const docRef = await addDoc(eventsRef, event);
    return docRef.id;
  }

  async updateEvent(eventId: string, updates: Partial<EmergencyEvent>): Promise<void> {
    if (!db) return;
    const eventRef = doc(db as any, 'events', eventId);
    await updateDoc(eventRef, updates);
  }

  // Monitoring stations collection
  async getMonitoringStations(): Promise<MonitoringStation[]> {
    if (!db) return [] as MonitoringStation[];
    const stationsRef = collection(db as any, 'monitoring_data');
    const snapshot = await getDocs(stationsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MonitoringStation));
  }

  async getMonitoringStation(sensorId: string): Promise<(MonitoringStation & { id: string }) | null> {
    if (!db) return null;
    const stationsRef = collection(db as any, 'monitoring_data');
    const q = query(stationsRef, where('sensorId', '==', sensorId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as (MonitoringStation & { id: string });
  }

  async updateMonitoringStation(sensorId: string, updates: Partial<MonitoringStation>): Promise<void> {
    const station = await this.getMonitoringStation(sensorId);
    if (!db) return;
    if (station) {
      const stationRef = doc(db as any, 'monitoring_data', station.id);
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
    if (!db) return [] as Authority[];
    const authoritiesRef = collection(db as any, 'authorities');
    const snapshot = await getDocs(authoritiesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Authority));
  }

  async getAuthority(authorityId: string): Promise<(Authority & { id: string }) | null> {
    if (!db) return null;
    const authoritiesRef = collection(db as any, 'authorities');
    const q = query(authoritiesRef, where('authorityId', '==', authorityId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as (Authority & { id: string });
  }

  async updateAuthorityStatus(authorityId: string, status: string): Promise<void> {
    const authority = await this.getAuthority(authorityId);
    if (!db) return;
    if (authority) {
      const authorityRef = doc(db as any, 'authorities', authority.id);
      await updateDoc(authorityRef, { currentStatus: status });
    }
  }

  // Resources collection
  async getResources(): Promise<Resource[]> {
    if (!db) return [] as Resource[];
    const resourcesRef = collection(db as any, 'resources');
    const snapshot = await getDocs(resourcesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Resource));
  }

  async getResource(resourceId: string): Promise<(Resource & { id: string }) | null> {
    if (!db) return null;
    const resourcesRef = collection(db as any, 'resources');
    const q = query(resourcesRef, where('resourceId', '==', resourceId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as (Resource & { id: string });
  }

  async updateResourceStatus(resourceId: string, status: string, assignment?: string): Promise<void> {
    const resource = await this.getResource(resourceId);
    if (!db) return;
    if (resource) {
      const resourceRef = doc(db as any, 'resources', resource.id);
      const updates: any = { status };
      if (assignment) {
        updates.currentAssignment = assignment;
      }
      await updateDoc(resourceRef, updates);
    }
  }

  // Evacuees subcollection
  async getEvacuees(eventId: string): Promise<Evacuee[]> {
    if (!db) return [] as Evacuee[];
    const evacueesRef = collection(db as any, 'events', eventId, 'evacuees');
    const snapshot = await getDocs(evacueesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Evacuee));
  }

  async addEvacuee(eventId: string, evacuee: Omit<Evacuee, 'id'>): Promise<string> {
    if (!db) return '';
    const evacueesRef = collection(db as any, 'events', eventId, 'evacuees');
    const docRef = await addDoc(evacueesRef, evacuee);
    return docRef.id;
  }

  async updateEvacueeStatus(eventId: string, evacueeId: string, status: string): Promise<void> {
    if (!db) return;
    const evacueeRef = doc(db as any, 'events', eventId, 'evacuees', evacueeId);
    await updateDoc(evacueeRef, { status });
  }

  // Decision log collection
  async getDecisions(): Promise<Decision[]> {
    if (!db) return [] as Decision[];
    const decisionsRef = collection(db as any, 'decision_log');
    const q = query(decisionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Decision));
  }

  async getDecisionsForEvent(eventId: string): Promise<Decision[]> {
    if (!db) return [] as Decision[];
    const decisionsRef = collection(db as any, 'decision_log');
    const q = query(decisionsRef, where('eventId', '==', eventId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Decision));
  }

  async addDecision(decision: Omit<Decision, 'id'>): Promise<string> {
    if (!db) return '';
    const decisionsRef = collection(db as any, 'decision_log');
    const docRef = await addDoc(decisionsRef, decision);
    return docRef.id;
  }

  async updateDecisionStatus(decisionId: string, status: string): Promise<void> {
    if (!db) return;
    const decisionRef = doc(db as any, 'decision_log', decisionId);
    await updateDoc(decisionRef, { status });
  }

  // Timeline events subcollection
  async getTimelineEvents(eventId: string): Promise<TimelineEvent[]> {
    if (!db) return [] as TimelineEvent[];
    const timelineRef = collection(db as any, 'events', eventId, 'timeline');
    const q = query(timelineRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as TimelineEvent));
  }

  async addTimelineEvent(eventId: string, event: Omit<TimelineEvent, 'id'>): Promise<string> {
    if (!db) return '';
    const timelineRef = collection(db as any, 'events', eventId, 'timeline');
    const docRef = await addDoc(timelineRef, event);
    return docRef.id;
  }

  // Real-time listeners
  subscribeToEvent(eventId: string, callback: (event: EmergencyEvent | null) => void): () => void {
    if (!db) return () => { };
    const eventRef = doc(db as any, 'events', eventId);
    return onSnapshot(eventRef, (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } as unknown as EmergencyEvent : null);
    });
  }

  subscribeToMonitoringStations(callback: (stations: MonitoringStation[]) => void): () => void {
    if (!db) return () => { };
    const stationsRef = collection(db as any, 'monitoring_data');
    return onSnapshot(stationsRef, (snapshot) => {
      const stations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MonitoringStation));
      callback(stations);
    });
  }

  subscribeToTimelineEvents(eventId: string, callback: (events: TimelineEvent[]) => void): () => void {
    if (!db) return () => { };
    const timelineRef = collection(db as any, 'events', eventId, 'timeline');
    const q = query(timelineRef, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as TimelineEvent));
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
      if (!db) continue;
      const eventRef = doc(db as any, 'events', event.eventId);
      batch.push(setDoc(eventRef, event));
    }

    // Upload monitoring stations
    for (const station of data.monitoringStations) {
      if (!db) continue;
      const stationRef = doc(db as any, 'monitoring_data', station.sensorId);
      batch.push(setDoc(stationRef, station));
    }

    // Upload authorities
    for (const authority of data.authorities) {
      if (!db) continue;
      const authorityRef = doc(db as any, 'authorities', authority.authorityId);
      batch.push(setDoc(authorityRef, authority));
    }

    // Upload resources
    for (const resource of data.resources) {
      if (!db) continue;
      const resourceRef = doc(db as any, 'resources', resource.resourceId);
      batch.push(setDoc(resourceRef, resource));
    }

    // Upload decisions
    for (const decision of data.decisions) {
      if (!db) continue;
      const decisionRef = doc(db as any, 'decision_log', decision.decisionId);
      batch.push(setDoc(decisionRef, decision));
    }

    // Upload evacuees and timeline events for each event
    for (const event of data.events) {
      if (!db) continue;
      for (const evacuee of data.evacuees) {
        const evacueeRef = doc(db as any, 'events', event.eventId, 'evacuees', evacuee.evacueeId);
        batch.push(setDoc(evacueeRef, evacuee));
      }

      for (const timelineEvent of data.timelineEvents) {
        const timelineRef = doc(db as any, 'events', event.eventId, 'timeline', timelineEvent.timestamp);
        batch.push(setDoc(timelineRef, timelineEvent));
      }
    }

    // Execute all operations
    await Promise.all(batch);
  }
}
