import { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { X, Terminal } from 'lucide-react';
import type { Task, Context } from '../types';

interface TaskCreateFormProps {
  contexts: Context[];
  prefilledDeadline?: string;
  onSubmit: (task: Omit<Task, 'id'>) => void;
  onClose: () => void;
}

export default function TaskCreateForm({
  contexts,
  prefilledDeadline,
  onSubmit,
  onClose,
}: TaskCreateFormProps) {
  const [syntax, setSyntax] = useState('');
  const [details, setDetails] = useState('');
  const [type, setType] = useState<Task['type']>('TASK');
  const [contextId, setContextId] = useState(contexts[0]?.id || 1);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  // Initialize deadline if prefilled
  useEffect(() => {
    if (prefilledDeadline) {
      const date = new Date(prefilledDeadline);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);
      setDeadlineDate(dateStr);
      setDeadlineTime(timeStr);
    } else {
      // Default to tomorrow at noon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      const dateStr = tomorrow.toISOString().split('T')[0];
      setDeadlineDate(dateStr);
      setDeadlineTime('12:00');
    }
  }, [prefilledDeadline]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!syntax.trim()) return;

    const deadline = deadlineDate && deadlineTime
      ? new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString()
      : undefined;

    onSubmit({
      syntax: syntax.trim(),
      details: details.trim() || 'No additional details provided.',
      status: 'PENDING',
      type,
      contextId,
      deadline,
    });

    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-terminal-bg border-2 border-terminal-green rounded-lg max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-terminal-green" />
            <h2 className="text-lg font-mono text-terminal-green">
              Push New Command
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-terminal-border/30 rounded text-terminal-text/70 hover:text-terminal-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Syntax */}
          <div>
            <label className="block text-xs font-mono text-terminal-green mb-2">
              Command Syntax *
            </label>
            <input
              type="text"
              value={syntax}
              onChange={(e) => setSyntax(e.target.value)}
              placeholder="e.g., Deploy to production"
              className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2
                         text-terminal-text font-mono text-sm outline-none
                         focus:border-terminal-green transition-colors
                         placeholder:text-terminal-text/30"
              autoFocus
              required
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-mono text-terminal-green mb-2">
              Details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add execution notes, dependencies, or context..."
              rows={3}
              className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2
                         text-terminal-text font-mono text-sm outline-none resize-none
                         focus:border-terminal-green transition-colors
                         placeholder:text-terminal-text/30"
            />
          </div>

          {/* Type and Context */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-terminal-green mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Task['type'])}
                className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2
                           text-terminal-text font-mono text-sm outline-none
                           focus:border-terminal-green transition-colors cursor-pointer"
              >
                <option value="TASK">Task</option>
                <option value="SCHEDULE">Schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-terminal-green mb-2">
                Context
              </label>
              <select
                value={contextId}
                onChange={(e) => setContextId(Number(e.target.value))}
                className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2
                           text-terminal-text font-mono text-sm outline-none
                           focus:border-terminal-green transition-colors cursor-pointer"
              >
                {contexts.map(ctx => (
                  <option key={ctx.id} value={ctx.id}>
                    {ctx.namespace}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-mono text-terminal-green mb-2">
              Deadline
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="bg-terminal-bg border border-terminal-border rounded px-3 py-2
                           text-terminal-text font-mono text-sm outline-none
                           focus:border-terminal-green transition-colors cursor-pointer"
              />
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="bg-terminal-bg border border-terminal-border rounded px-3 py-2
                           text-terminal-text font-mono text-sm outline-none
                           focus:border-terminal-green transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-terminal-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-mono text-terminal-text/70
                         hover:text-terminal-text transition-colors"
            >
              Cancel (ESC)
            </button>
            <button
              type="submit"
              disabled={!syntax.trim()}
              className="px-6 py-2 bg-terminal-green text-terminal-bg font-mono text-sm rounded
                         hover:bg-terminal-green/90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Push (Ctrl+Enter)
            </button>
          </div>
        </form>

        {/* Hint */}
        <div className="px-6 pb-4 text-xs text-terminal-text/40 font-mono text-center">
          Press Ctrl+Enter to submit, ESC to cancel
        </div>
      </div>
    </div>
  );
}
