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
  private checkDatabase(): boolean {
    if (!db) {
      console.warn('Firebase database not available');
      return false;
    }
    return true;
  }

  private getDatabase() {
    if (!db) {
      throw new Error('Firebase database not available');
    }
    return db;
  }

  // Events collection
  async getEvents(): Promise<EmergencyEvent[]> {
    if (!this.checkDatabase()) return [];
    const database = this.getDatabase();
    const eventsRef = collection(database, 'events');
    const snapshot = await getDocs(eventsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as EmergencyEvent));
  }

  async getEvent(eventId: string): Promise<EmergencyEvent | null> {
    if (!this.checkDatabase()) return null;
    const database = this.getDatabase();
    const eventRef = doc(database, 'events', eventId);
    const snapshot = await getDoc(eventRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as unknown as EmergencyEvent : null;
  }

  async createEvent(event: Omit<EmergencyEvent, 'id'>): Promise<string> {
    if (!this.checkDatabase()) return '';
    const database = this.getDatabase();
    const eventsRef = collection(database, 'events');
    const docRef = await addDoc(eventsRef, event);
    return docRef.id;
  }

  async updateEvent(eventId: string, updates: Partial<EmergencyEvent>): Promise<void> {
    if (!this.checkDatabase()) return;
    const database = this.getDatabase();
    const eventRef = doc(database, 'events', eventId);
    await updateDoc(eventRef, updates);
  }

  // Monitoring stations collection
  async getMonitoringStations(): Promise<MonitoringStation[]> {
    if (!this.checkDatabase()) return [];
    const database = this.getDatabase();
    const stationsRef = collection(database, 'monitoring_data');
    const snapshot = await getDocs(stationsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MonitoringStation));
  }

  async getMonitoringStation(sensorId: string): Promise<(MonitoringStation & { id: string }) | null> {
    if (!this.checkDatabase()) return null;
    const database = this.getDatabase();
    const stationsRef = collection(database, 'monitoring_data');
    const q = query(stationsRef, where('sensorId', '==', sensorId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as (MonitoringStation & { id: string });
  }

  async updateMonitoringStation(sensorId: string, updates: Partial<MonitoringStation>): Promise<void> {
    if (!this.checkDatabase()) return;
    const station = await this.getMonitoringStation(sensorId);
    if (station) {
      const database = this.getDatabase();
      const stationRef = doc(database, 'monitoring_data', station.id);
      await updateDoc(stationRef, updates);
    }
  }

  async addSensorReading(sensorId: string, reading: any): Promise<void> {
    if (!this.checkDatabase()) return;
    const station = await this.getMonitoringStation(sensorId);
    if (station) {
      const updatedReadings = [...station.readings, reading];
      await this.updateMonitoringStation(sensorId, { readings: updatedReadings });
    }
  }

  // Authorities collection
  async getAuthorities(): Promise<Authority[]> {
    if (!this.checkDatabase()) return [];
    const database = this.getDatabase();
    const authoritiesRef = collection(database, 'authorities');
    const snapshot = await getDocs(authoritiesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Authority));
  }

  async getAuthority(authorityId: string): Promise<(Authority & { id: string }) | null> {
    if (!this.checkDatabase()) return null;
    const database = this.getDatabase();
    const authoritiesRef = collection(database, 'authorities');
    const q = query(authoritiesRef, where('authorityId', '==', authorityId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as (Authority & { id: string });
  }

  async updateAuthorityStatus(authorityId: string, status: string): Promise<void> {
    const authority = await this.getAuthority(authorityId);
    if (authority) {
      const database = this.getDatabase();
      const authorityRef = doc(database, 'authorities', authority.id);
      await updateDoc(authorityRef, { currentStatus: status });
    }
  }

  // Resources collection
  async getResources(): Promise<Resource[]> {
    const database = this.getDatabase();
    const resourcesRef = collection(database, 'resources');
    const snapshot = await getDocs(resourcesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Resource));
  }

  async getResource(resourceId: string): Promise<(Resource & { id: string }) | null> {
    const database = this.getDatabase();
    const resourcesRef = collection(database, 'resources');
    const q = query(resourcesRef, where('resourceId', '==', resourceId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as (Resource & { id: string });
  }

  async updateResourceStatus(resourceId: string, status: string, assignment?: string): Promise<void> {
    const resource = await this.getResource(resourceId);
    if (resource) {
      const database = this.getDatabase();
      const resourceRef = doc(database, 'resources', resource.id);
      const updates: any = { status };
      if (assignment) {
        updates.currentAssignment = assignment;
      }
      await updateDoc(resourceRef, updates);
    }
  }

  // Evacuees subcollection
  async getEvacuees(eventId: string): Promise<Evacuee[]> {
    const database = this.getDatabase();
    const evacueesRef = collection(database, 'events', eventId, 'evacuees');
    const snapshot = await getDocs(evacueesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Evacuee));
  }

  async addEvacuee(eventId: string, evacuee: Omit<Evacuee, 'id'>): Promise<string> {
    const database = this.getDatabase();
    const evacueesRef = collection(database, 'events', eventId, 'evacuees');
    const docRef = await addDoc(evacueesRef, evacuee);
    return docRef.id;
  }

  async updateEvacueeStatus(eventId: string, evacueeId: string, status: string): Promise<void> {
    const database = this.getDatabase();
    const evacueeRef = doc(database, 'events', eventId, 'evacuees', evacueeId);
    await updateDoc(evacueeRef, { status });
  }

  // Decision log collection
  async getDecisions(): Promise<Decision[]> {
    const database = this.getDatabase();
    const decisionsRef = collection(database, 'decision_log');
    const q = query(decisionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Decision));
  }

  async getDecisionsForEvent(eventId: string): Promise<Decision[]> {
    const database = this.getDatabase();
    const decisionsRef = collection(database, 'decision_log');
    const q = query(decisionsRef, where('eventId', '==', eventId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Decision));
  }

  async addDecision(decision: Omit<Decision, 'id'>): Promise<string> {
    const database = this.getDatabase();
    const decisionsRef = collection(database, 'decision_log');
    const docRef = await addDoc(decisionsRef, decision);
    return docRef.id;
  }

  async updateDecisionStatus(decisionId: string, status: string): Promise<void> {
    const database = this.getDatabase();
    const decisionRef = doc(database, 'decision_log', decisionId);
    await updateDoc(decisionRef, { status });
  }

  // Timeline events subcollection
  async getTimelineEvents(eventId: string): Promise<TimelineEvent[]> {
    const database = this.getDatabase();
    const timelineRef = collection(database, 'events', eventId, 'timeline');
    const q = query(timelineRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as TimelineEvent));
  }

  async addTimelineEvent(eventId: string, event: Omit<TimelineEvent, 'id'>): Promise<string> {
    const database = this.getDatabase();
    const timelineRef = collection(database, 'events', eventId, 'timeline');
    const docRef = await addDoc(timelineRef, event);
    return docRef.id;
  }

  // Real-time listeners
  subscribeToEvent(eventId: string, callback: (event: EmergencyEvent | null) => void): () => void {
    const database = this.getDatabase();
    const eventRef = doc(database, 'events', eventId);
    return onSnapshot(eventRef, (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } as unknown as EmergencyEvent : null);
    });
  }

  subscribeToMonitoringStations(callback: (stations: MonitoringStation[]) => void): () => void {
    const database = this.getDatabase();
    const stationsRef = collection(database, 'monitoring_data');
    return onSnapshot(stationsRef, (snapshot) => {
      const stations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MonitoringStation));
      callback(stations);
    });
  }

  subscribeToTimelineEvents(eventId: string, callback: (events: TimelineEvent[]) => void): () => void {
    const database = this.getDatabase();
    const timelineRef = collection(database, 'events', eventId, 'timeline');
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
      const database = this.getDatabase();
      const eventRef = doc(database, 'events', event.eventId);
      batch.push(setDoc(eventRef, event));
    }

    // Upload monitoring stations
    for (const station of data.monitoringStations) {
      const database = this.getDatabase();
      const stationRef = doc(database, 'monitoring_data', station.sensorId);
      batch.push(setDoc(stationRef, station));
    }

    // Upload authorities
    for (const authority of data.authorities) {
      const database = this.getDatabase();
      const authorityRef = doc(database, 'authorities', authority.authorityId);
      batch.push(setDoc(authorityRef, authority));
    }

    // Upload resources
    for (const resource of data.resources) {
      const database = this.getDatabase();
      const resourceRef = doc(database, 'resources', resource.resourceId);
      batch.push(setDoc(resourceRef, resource));
    }

    // Upload decisions
    for (const decision of data.decisions) {
      const database = this.getDatabase();
      const decisionRef = doc(database, 'decision_log', decision.decisionId);
      batch.push(setDoc(decisionRef, decision));
    }

    // Upload evacuees and timeline events for each event
    for (const event of data.events) {
      for (const evacuee of data.evacuees) {
        const database = this.getDatabase();
        const evacueeRef = doc(database, 'events', event.eventId, 'evacuees', evacuee.evacueeId);
        batch.push(setDoc(evacueeRef, evacuee));
      }

      for (const timelineEvent of data.timelineEvents) {
        const database = this.getDatabase();
        const timelineRef = doc(database, 'events', event.eventId, 'timeline', timelineEvent.timestamp);
        batch.push(setDoc(timelineRef, timelineEvent));
      }
    }

    // Execute all operations
    await Promise.all(batch);
  }
}
