import type { Command } from '../types';
import { CheckCircle2, XCircle, Play, Clock } from 'lucide-react';

interface StackItemProps {
  command: Command;
  onClick: () => void;
}

export default function StackItem({ command, onClick }: StackItemProps) {
  const getStatusStyle = () => {
    switch (command.status) {
      case 'EXECUTING':
        return 'border-terminal-green bg-terminal-green/5';
      case 'EXIT_SUCCESS':
        return 'border-terminal-border/30 bg-terminal-bg opacity-60 line-through';
      case 'SIGKILL':
        return 'border-terminal-red/50 bg-terminal-red/5 opacity-60';
      default: // PENDING
        return 'border-terminal-border bg-terminal-bg';
    }
  };

  const getStatusIcon = () => {
    switch (command.status) {
      case 'EXECUTING':
        return <Play size={16} className="text-terminal-green animate-pulse" />;
      case 'EXIT_SUCCESS':
        return <CheckCircle2 size={16} className="text-terminal-text/50" />;
      case 'SIGKILL':
        return <XCircle size={16} className="text-terminal-red/70" />;
      default:
        return <Clock size={16} className="text-terminal-text/50" />;
    }
  };

  const getTypeLabel = () => {
    return command.type === 'SCHEDULE' ? 'Schedule' : 'Task';
  };

  const getTypeClass = () => {
    return command.type === 'SCHEDULE'
      ? 'bg-terminal-green/20 text-terminal-green'
      : 'bg-terminal-border/20 text-terminal-text/60';
  };

  return (
    <div
      onClick={onClick}
      className={`
        border rounded px-4 py-3 mb-2 cursor-pointer
        transition-all hover:shadow-lg
        ${getStatusStyle()}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-0.5">{getStatusIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-terminal-text/50 font-mono">
              PID:{command.id}
            </span>
            <span className={`
              text-xs px-1.5 py-0.5 rounded font-mono
              ${getTypeClass()}
            `}>
              {getTypeLabel()}
            </span>
          </div>

          <p className="text-sm text-terminal-text break-words">
            {command.syntax}
          </p>

          {command.deadline && (
            <div className="mt-2 text-xs text-terminal-text/40">
              ⏱ {new Date(command.deadline).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
