import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  setDoc
} from "firebase/firestore";
import { db } from "./config";
import { Ticket, TicketComment, Reminder, ActivityLog } from "@/types";

// --- TICKETS ---

export const getTickets = async (role: string, userId: string) => {
  const ticketsRef = collection(db, "tickets");
  let q;
  if (role === "EMPLOYEE") {
    // Employees only see their own tickets
    q = query(ticketsRef, where("createdBy", "==", userId), orderBy("createdAt", "desc"));
  } else {
    // Admin and IT staff see all
    q = query(ticketsRef, orderBy("createdAt", "desc"));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

export const getTicketById = async (ticketId: string) => {
  const ticketRef = doc(db, "tickets", ticketId);
  const snapshot = await getDoc(ticketRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Ticket;
  }
  return null;
};

export const createTicket = async (ticketData: Omit<Ticket, "id" | "ticketId">) => {
  const ticketsRef = collection(db, "tickets");
  const newTicketRef = doc(ticketsRef); // strictly to get a random ID for ticketId
  const ticketIdStr = `TKT-${Math.floor(Math.random() * 10000)}`;

  const fullTicket: Ticket = {
    ...ticketData,
    id: newTicketRef.id,
    ticketId: ticketIdStr,
  };

  await setDoc(newTicketRef, fullTicket);
  return fullTicket;
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
  const ticketRef = doc(db, "tickets", ticketId);
  await updateDoc(ticketRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

// --- REMINDERS ---

export const getReminders = async (userId: string) => {
  const remindersRef = collection(db, "reminders");
  const q = query(remindersRef, where("userId", "==", userId), orderBy("reminderDateTime", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
};

export const createReminder = async (reminderData: Omit<Reminder, "id" | "reminderId">) => {
  const remindersRef = collection(db, "reminders");
  const docRef = await addDoc(remindersRef, {
    ...reminderData,
    reminderId: `REM-${Math.floor(Math.random() * 10000)}`
  });
  return docRef.id;
};

export const updateReminderStatus = async (reminderId: string, status: 'Pending' | 'Completed') => {
  const reminderRef = doc(db, "reminders", reminderId);
  await updateDoc(reminderRef, { status, updatedAt: new Date().toISOString() });
};

// --- COMMENTS ---

export const getComments = async (ticketId: string) => {
  const commentsRef = collection(db, "ticketComments");
  const q = query(commentsRef, where("ticketId", "==", ticketId), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketComment));
};

export const addComment = async (commentData: Omit<TicketComment, "id" | "commentId">) => {
  const commentsRef = collection(db, "ticketComments");
  const docRef = await addDoc(commentsRef, {
    ...commentData,
    commentId: `CMT-${Date.now()}`
  });
  return docRef.id;
};

// --- ACTIVITY LOGS ---

export const logActivity = async (logData: Omit<ActivityLog, "id" | "logId" | "timestamp">) => {
  const logsRef = collection(db, "activityLogs");
  await addDoc(logsRef, {
    ...logData,
    logId: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString()
  });
};
