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
}

export interface Context {
  id: number;
  namespace: string;
  description: string;
  color?: string;
}
