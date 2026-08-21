import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errorHandling';
import { Employee, Shift, AttendancePunch, ShiftTradeRequest, Announcement } from '../types';

export const firestoreService = {
  // --- EMPLOYEES ---
  subscribeEmployees(onUpdate: (employees: Employee[]) => void): Unsubscribe {
    const colRef = collection(db, 'employees');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Employee[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Employee);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'employees');
      }
    );
  },

  async saveEmployee(emp: Employee): Promise<void> {
    const docRef = doc(db, 'employees', emp.id);
    try {
      await setDoc(docRef, emp, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `employees/${emp.id}`);
    }
  },

  async deleteEmployee(empId: string): Promise<void> {
    const docRef = doc(db, 'employees', empId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${empId}`);
    }
  },

  async seedEmployeesIfEmpty(employees: Employee[]): Promise<void> {
    try {
      for (const emp of employees) {
        const docRef = doc(db, 'employees', emp.id);
        await setDoc(docRef, emp, { merge: true });
      }
    } catch (error) {
      console.warn('[Firebase] Initial seed skipped or offline:', error);
    }
  },

  // --- SHIFTS ---
  subscribeShifts(onUpdate: (shifts: Shift[]) => void): Unsubscribe {
    const colRef = collection(db, 'shifts');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Shift[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Shift);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'shifts');
      }
    );
  },

  async saveShift(shift: Shift): Promise<void> {
    const docRef = doc(db, 'shifts', shift.id);
    try {
      await setDoc(docRef, shift, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shifts/${shift.id}`);
    }
  },

  async deleteShift(shiftId: string): Promise<void> {
    const docRef = doc(db, 'shifts', shiftId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shifts/${shiftId}`);
    }
  },

  // --- PUNCHES ---
  subscribePunches(onUpdate: (punches: AttendancePunch[]) => void): Unsubscribe {
    const q = query(collection(db, 'punches'), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AttendancePunch[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as AttendancePunch);
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'punches');
      }
    );
  },

  async recordPunch(punch: AttendancePunch): Promise<void> {
    const docRef = doc(db, 'punches', punch.id);
    try {
      await setDoc(docRef, punch);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `punches/${punch.id}`);
    }
  },

  // --- SHIFT TRADES ---
  subscribeTrades(onUpdate: (trades: ShiftTradeRequest[]) => void): Unsubscribe {
    const colRef = collection(db, 'shiftTrades');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: ShiftTradeRequest[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as ShiftTradeRequest);
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'shiftTrades');
      }
    );
  },

  async saveTrade(trade: ShiftTradeRequest): Promise<void> {
    const docRef = doc(db, 'shiftTrades', trade.id);
    try {
      await setDoc(docRef, trade, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shiftTrades/${trade.id}`);
    }
  },

  // --- USER PROFILES ---
  async getUserProfile(userId: string): Promise<any | null> {
    const docRef = doc(db, 'users', userId);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    }
  },

  async saveUserProfile(profile: {
    userId: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: string;
    isHostOrAdmin: boolean;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<void> {
    const docRef = doc(db, 'users', profile.userId);
    try {
      await setDoc(docRef, {
        ...profile,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.userId}`);
    }
  },

  subscribeUserProfile(userId: string, onUpdate: (profile: any) => void): Unsubscribe {
    const docRef = doc(db, 'users', userId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data());
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      }
    );
  },

  // --- ANNOUNCEMENTS ---
  subscribeAnnouncements(onUpdate: (announcements: Announcement[]) => void): Unsubscribe {
    const colRef = collection(db, 'announcements');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Announcement[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Announcement);
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'announcements');
      }
    );
  },

  async saveAnnouncement(announcement: Announcement): Promise<void> {
    const docRef = doc(db, 'announcements', announcement.id);
    try {
      await setDoc(docRef, announcement, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `announcements/${announcement.id}`);
    }
  }
};
