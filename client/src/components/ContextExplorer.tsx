import { useState, type FormEvent } from 'react';
import type { Task, Context } from '../types';
import Sidebar from './Sidebar';
import StackItem from './StackItem';
import { Plus } from 'lucide-react';

interface ContextExplorerProps {
  contexts: Context[];
  commands: Task[];
  onAddCommand: (task: Omit<Task, 'id'>) => void;
  onAddContext: (context: Omit<Context, 'id'>) => Promise<Context | null>;
  onCommandClick: (task: Task) => void;
}

export default function ContextExplorer({
  contexts,
  commands,
  onAddCommand,
  onAddContext,
  onCommandClick,
}: ContextExplorerProps) {
  const [selectedContextId, setSelectedContextId] = useState<number | null>(
    contexts[0]?.id || null
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    syntax: '',
    details: '',
    deadline: '',
    type: 'TASK' as const,
  });

  const handleCreateContext = async (context: Omit<Context, 'id'>) => {
    const createdContext = await onAddContext(context);
    if (createdContext) {
      setSelectedContextId(createdContext.id);
    }
    return createdContext;
  };

  const filteredCommands = selectedContextId
    ? commands.filter(cmd => cmd.contextId === selectedContextId)
    : commands;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.syntax.trim() || !selectedContextId) return;

    onAddCommand({
      syntax: formData.syntax,
      details: formData.details.trim() || 'No details recorded yet.',
      status: 'PENDING',
      type: formData.type,
      contextId: selectedContextId,
      deadline: formData.deadline || undefined,
    });

    setFormData({
      syntax: '',
      details: '',
      deadline: '',
      type: 'TASK',
    });
    setShowForm(false);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 border-r border-terminal-border">
        <Sidebar
          contexts={contexts}
          selectedContextId={selectedContextId}
          onSelectContext={setSelectedContextId}
          onCreateContext={handleCreateContext}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-terminal-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-lg font-bold font-mono"
                style={{
                  color: contexts.find(c => c.id === selectedContextId)?.color || '#50fa7b'
                }}
              >
                {contexts.find(c => c.id === selectedContextId)?.namespace || 'All'}
              </h1>
              <p className="text-xs text-terminal-text/50 mt-1">
                {filteredCommands.length} command(s)
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-3 py-2 bg-terminal-green/20 text-terminal-green rounded border border-terminal-green hover:bg-terminal-green/30 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-mono">New Command</span>
            </button>
          </div>
        </header>

        {/* Add Command Form */}
        {showForm && (
          <div className="border-b border-terminal-border p-4 bg-terminal-border/10">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-terminal-text/60 mb-1 font-mono">
                  Command Syntax
                </label>
                <input
                  type="text"
                  value={formData.syntax}
                  onChange={(e) => setFormData({ ...formData, syntax: e.target.value })}
                  placeholder="Enter command description..."
                  className="w-full px-3 py-2 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-sm outline-none focus:border-terminal-green"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-terminal-text/60 mb-1 font-mono">
                  Details
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Add implementation notes or next steps..."
                  className="w-full px-3 py-2 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-sm outline-none focus:border-terminal-green min-h-[80px] resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-terminal-text/60 mb-1 font-mono">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-sm outline-none focus:border-terminal-green"
                  />
                </div>

                <div>
                  <label className="block text-xs text-terminal-text/60 mb-1 font-mono">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-sm outline-none focus:border-terminal-green"
                  >
                    <option value="TASK">Task</option>
                    <option value="SCHEDULE">Schedule</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-terminal-green/20 text-terminal-green rounded border border-terminal-green hover:bg-terminal-green/30 font-mono text-sm"
                >
                  Push Command
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-terminal-border/20 text-terminal-text/60 rounded border border-terminal-border hover:bg-terminal-border/30 font-mono text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Command List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredCommands.length === 0 ? (
            <div className="text-center text-terminal-text/30 mt-20">
              <p className="font-mono text-sm">No commands in this context.</p>
              <p className="font-mono text-xs mt-2">Click "New Command" to add one ↑</p>
            </div>
          ) : (
            filteredCommands.map(cmd => (
              <StackItem
                key={cmd.id}
                command={cmd}
                onClick={() => onCommandClick(cmd)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
