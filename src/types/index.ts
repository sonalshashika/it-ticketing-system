export type UserRole = 'EMPLOYEE' | 'IT_STAFF' | 'IT_EXECUTIVE' | 'IT_MANAGER' | 'ADMIN';
export type TicketStatus = 'Open' | 'In Progress' | 'Waiting for User' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketCategory = 'Hardware' | 'Software' | 'Network' | 'Access Request' | 'Security' | 'Other';
export type ReminderStatus = 'Pending' | 'Completed';

export interface User {
  id?: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  createdAt: string;
}

export interface Ticket {
  id?: string;
  ticketId: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string; // User ID
  assignedTo?: string | null; // User ID
  attachmentUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id?: string;
  commentId: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  comment: string;
  isInternalNote: boolean;
  createdAt: string;
}

export interface Reminder {
  id?: string;
  reminderId: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  reminderDateTime: string; // ISO String
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id?: string;
  logId: string;
  entityType: 'TICKET' | 'USER' | 'REMINDER';
  entityId: string;
  action: string;
  performedBy: string; // User ID
  timestamp: string;
  metadata?: any;
}
