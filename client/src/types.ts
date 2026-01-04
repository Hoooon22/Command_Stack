export type CommandStatus = 'PENDING' | 'EXECUTING' | 'EXIT_SUCCESS' | 'SIGKILL';
export type CommandType = 'TASK' | 'SCHEDULE';

export interface Command {
  id: number;
  syntax: string;
  status: CommandStatus;
  type: CommandType;
  contextId: number;
  deadline?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Context {
  id: number;
  namespace: string;
  description: string;
}
