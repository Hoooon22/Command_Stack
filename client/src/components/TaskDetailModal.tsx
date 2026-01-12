import { X, Calendar, Clock, Terminal, CheckCircle2, XCircle, Play, ListChecks, CalendarClock } from 'lucide-react';
import type { Task, Context } from '../types';

interface TaskDetailModalProps {
  task: Task;
  context?: Context;
  onClose: () => void;
  onStatusChange?: (id: number, status: Task['status']) => void;
  onDelete?: (id: number) => void;
}

export default function TaskDetailModal({
  task,
  context,
  onClose,
  onStatusChange,
  onDelete,
}: TaskDetailModalProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'EXECUTING':
        return <Play size={20} className="text-terminal-green animate-pulse" />;
      case 'EXIT_SUCCESS':
        return <CheckCircle2 size={20} className="text-terminal-green" />;
      case 'SIGKILL':
        return <XCircle size={20} className="text-terminal-red" />;
      default:
        return <Clock size={20} className="text-terminal-text/50" />;
    }
  };

  const getStatusLabel = () => {
    switch (task.status) {
      case 'EXECUTING':
        return 'EXECUTING';
      case 'EXIT_SUCCESS':
        return 'EXIT_SUCCESS (0)';
      case 'SIGKILL':
        return 'SIGKILL (9)';
      default:
        return 'PENDING';
    }
  };

  const getTypeColor = () => {
    return task.type === 'SCHEDULE'
      ? 'text-terminal-green'
      : 'text-terminal-cyan';
  };

  const getTypeLabel = () => {
    return task.type === 'SCHEDULE' ? 'Schedule' : 'Task';
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-terminal-border">
          <div className="flex items-center gap-3">
            <Terminal className="text-terminal-green" size={24} />
            <div>
              <h2 className="text-lg font-bold text-terminal-green font-mono">
                Command Details
              </h2>
              <p className="text-xs text-terminal-text/50 font-mono mt-1">
                PID: {task.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-terminal-border/30 rounded text-terminal-text/60 hover:text-terminal-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Command Syntax */}
          <div>
            <label className="block text-xs text-terminal-text/50 font-mono mb-2">
              COMMAND SYNTAX
            </label>
            <div className="bg-terminal-border/10 border border-terminal-border rounded p-4">
              <p className="text-terminal-text font-mono text-sm leading-relaxed">
                {task.syntax}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-terminal-text/50 font-mono mb-2">
              DETAILS
            </label>
            <div className="bg-terminal-border/10 border border-terminal-border rounded p-4">
              <p className="text-terminal-text/80 font-mono text-sm leading-relaxed">
                {task.details}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-terminal-text/50 font-mono mb-2">
                STATUS
              </label>
              <div className="flex items-center gap-2 bg-terminal-border/10 border border-terminal-border rounded p-3">
                {getStatusIcon()}
                <span className="text-terminal-text font-mono text-sm">
                  {getStatusLabel()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-terminal-text/50 font-mono mb-2">
                TYPE
              </label>
              <div className="flex items-center gap-2 bg-terminal-border/10 border border-terminal-border rounded p-3">
                {task.type === 'SCHEDULE' ? (
                  <CalendarClock size={20} className={getTypeColor()} />
                ) : (
                  <ListChecks size={20} className={getTypeColor()} />
                )}
                <span className={`font-mono text-sm ${getTypeColor()}`}>
                  {getTypeLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Context */}
          {context && (
            <div>
              <label className="block text-xs text-terminal-text/50 font-mono mb-2">
                CONTEXT
              </label>
              <div className="bg-terminal-border/10 border border-terminal-border rounded p-3">
                <p className="text-terminal-green font-mono text-sm">
                  {context.namespace}
                </p>
                <p className="text-terminal-text/50 text-xs mt-1">
                  {context.description}
                </p>
              </div>
            </div>
          )}

          {/* Deadline */}
          {task.deadline && (
            <div>
              <label className="block text-xs text-terminal-text/50 font-mono mb-2">
                DEADLINE
              </label>
              <div className="flex items-center gap-2 bg-terminal-border/10 border border-terminal-border rounded p-3">
                <Calendar size={20} className="text-terminal-text/50" />
                <div className="flex-1">
                  <p className="text-terminal-text font-mono text-sm">
                    {new Date(task.deadline).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-terminal-text/40 text-xs mt-1">
                    {(() => {
                      const now = new Date();
                      const deadline = new Date(task.deadline);
                      const diff = deadline.getTime() - now.getTime();
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                      if (diff < 0) return 'Overdue';
                      if (days > 0) return `${days}d ${hours}h remaining`;
                      return `${hours}h remaining`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-terminal-border">
            <label className="block text-xs text-terminal-text/50 font-mono mb-3">
              ACTIONS
            </label>
            <div className="flex gap-2">
              {task.status === 'PENDING' && onStatusChange && task.type === 'SCHEDULE' && (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'EXECUTING');
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-terminal-green/20 text-terminal-green border border-terminal-green rounded hover:bg-terminal-green/30 transition-colors font-mono text-sm"
                >
                  <Play size={16} />
                  Start Execution
                </button>
              )}

              {task.status === 'EXECUTING' && onStatusChange && (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'EXIT_SUCCESS');
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-terminal-green/20 text-terminal-green border border-terminal-green rounded hover:bg-terminal-green/30 transition-colors font-mono text-sm"
                >
                  <CheckCircle2 size={16} />
                  Mark Complete
                </button>
              )}

              {task.status === 'PENDING' && onStatusChange && task.type === 'TASK' && (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'EXIT_SUCCESS');
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-terminal-green/20 text-terminal-green border border-terminal-green rounded hover:bg-terminal-green/30 transition-colors font-mono text-sm"
                >
                  <CheckCircle2 size={16} />
                  Return 0
                </button>
              )}

              {onDelete && task.status !== 'EXIT_SUCCESS' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to kill this command?')) {
                      onDelete(task.id);
                      onClose();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-terminal-red/20 text-terminal-red border border-terminal-red rounded hover:bg-terminal-red/30 transition-colors font-mono text-sm"
                >
                  <XCircle size={16} />
                  Kill Process
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-terminal-border bg-terminal-border/5">
          <p className="text-xs text-terminal-text/40 font-mono text-center">
            Press ESC or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
