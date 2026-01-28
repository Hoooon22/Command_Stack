export type TaskStatus = 'PENDING' | 'EXECUTING' | 'EXIT_SUCCESS' | 'SIGKILL';
export type TaskType = 'TASK' | 'SCHEDULE';

export interface Task {
  id: number;
  syntax: string;
  details: string;
  status: TaskStatus;
  type: TaskType;
  contextId: number;
  deadline?: string;
  startedAt?: string;
  completedAt?: string;
  syncToGoogle?: boolean;
  googleEventId?: string;
}

export interface Context {
  id: number;
  namespace: string;
  description: string;
  color?: string;
}

export interface User {
  id: number;
  googleId: string;
  email: string;
  name: string;
  pictureUrl?: string;
  hasCalendarAccess: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink: string;
  isAllDay: boolean;
}
