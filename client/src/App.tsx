import { useState, useEffect } from 'react';
import ViewSwitcher, { type ViewMode } from './components/ViewSwitcher';
import ScheduleDashboard from './components/ScheduleDashboard';
import ContextExplorer from './components/ContextExplorer';
import CommandInput from './components/CommandInput';
import CommandDetailModal from './components/CommandDetailModal';
import type { Command, Context } from './types';

// Mock Data: Contexts
const MOCK_CONTEXTS: Context[] = [
  { id: 1, namespace: 'Dev-Project', description: 'Active development commands' },
  { id: 2, namespace: 'Life-Routine', description: 'Daily routines and habits' },
  { id: 3, namespace: 'Ideas', description: 'Future ideas and experiments' },
];

// Mock Data: Commands with various dates/times
const INITIAL_COMMANDS: Command[] = [
  {
    id: 1001,
    syntax: 'Refactor authentication module',
    details: 'Split auth flow into middleware, add refresh token handling, and update unit coverage.',
    status: 'EXECUTING',
    type: 'TASK',
    contextId: 1,
    deadline: '2026-01-05T14:00:00',
    startedAt: '2026-01-04T09:00:00',
  },
  {
    id: 1002,
    syntax: 'Write unit tests for API endpoints',
    details: 'Cover edge cases for rate limiting, payload validation, and error formatting.',
    status: 'PENDING',
    type: 'TASK',
    contextId: 1,
    deadline: '2026-01-06T10:30:00',
  },
  {
    id: 1003,
    syntax: 'Code review for pull request #42',
    details: 'Focus on data migrations, backward compatibility, and rollback safety.',
    status: 'PENDING',
    type: 'TASK',
    contextId: 1,
    deadline: '2026-01-05T16:00:00',
  },
  {
    id: 1004,
    syntax: 'Deploy to staging environment',
    details: 'Verify build artifacts, run smoke tests, and confirm environment variables.',
    status: 'PENDING',
    type: 'SCHEDULE',
    contextId: 1,
    deadline: '2026-01-07T09:00:00',
  },
  {
    id: 1005,
    syntax: 'Morning workout routine',
    details: 'Strength training + 20 min cardio. Track heart rate and cooldown.',
    status: 'EXIT_SUCCESS',
    type: 'SCHEDULE',
    contextId: 2,
    deadline: '2026-01-04T07:00:00',
    startedAt: '2026-01-04T06:20:00',
    completedAt: '2026-01-04T06:55:00',
  },
  {
    id: 1006,
    syntax: 'Buy groceries',
    details: 'Milk, eggs, protein, and fresh vegetables for the week.',
    status: 'PENDING',
    type: 'TASK',
    contextId: 2,
    deadline: '2026-01-05T18:00:00',
  },
  {
    id: 1007,
    syntax: 'Team meeting - Sprint planning',
    details: 'Finalize scope, assign owners, and lock next sprint goals.',
    status: 'PENDING',
    type: 'SCHEDULE',
    contextId: 1,
    deadline: '2026-01-06T14:00:00',
  },
  {
    id: 1008,
    syntax: 'Explore Rust for system programming',
    details: 'Prototype CLI parser and benchmark memory usage.',
    status: 'PENDING',
    type: 'TASK',
    contextId: 3,
    deadline: '2026-01-08T20:00:00',
  },
  {
    id: 1009,
    syntax: 'Read research paper on distributed systems',
    details: 'Summarize consensus model and note open questions.',
    status: 'PENDING',
    type: 'TASK',
    contextId: 3,
    deadline: '2026-01-09T15:00:00',
  },
  {
    id: 1010,
    syntax: 'Evening meditation',
    details: '10-minute breathing session, log focus level.',
    status: 'PENDING',
    type: 'SCHEDULE',
    contextId: 2,
    deadline: '2026-01-05T21:00:00',
  },
];

const INITIAL_ACTIVE_COMMANDS = INITIAL_COMMANDS.filter(cmd => cmd.status !== 'EXIT_SUCCESS');
const INITIAL_ARCHIVED_COMMANDS = INITIAL_COMMANDS.filter(cmd => cmd.status === 'EXIT_SUCCESS');

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [commands, setCommands] = useState<Command[]>(INITIAL_ACTIVE_COMMANDS);
  const [archivedCommands, setArchivedCommands] = useState<Command[]>(INITIAL_ARCHIVED_COMMANDS);
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [nextId, setNextId] = useState(1011);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);

  const handleAddCommand = (newCommand: Omit<Command, 'id'>) => {
    const command: Command = {
      ...newCommand,
      id: nextId,
    };
    setCommands(prev => [command, ...prev]);
    setNextId(prev => prev + 1);
    console.log('[PUSH] New Command:', command);
  };

  const handleQuickPush = (syntax: string) => {
    // Quick add without datetime - defaults to now + 1 hour
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 1);

    handleAddCommand({
      syntax,
      details: 'Quick push entry. Add execution notes when ready.',
      status: 'PENDING',
      type: 'TASK',
      contextId: MOCK_CONTEXTS[0].id,
      deadline: deadline.toISOString(),
    });
  };

  const handleCommandClick = (command: Command) => {
    setSelectedCommand(command);
  };

  const handleStatusChange = (id: number, status: Command['status']) => {
    const now = new Date().toISOString();

    setCommands(prev => {
      const target = prev.find(cmd => cmd.id === id);
      if (!target) return prev;

      const updates: Partial<Command> = { status };

      // Set startedAt when starting execution
      if (status === 'EXECUTING' && !target.startedAt) {
        updates.startedAt = now;
      }

      // Set completedAt when completing or killing
      if ((status === 'EXIT_SUCCESS' || status === 'SIGKILL') && !target.completedAt) {
        updates.completedAt = now;
      }

      const updated = { ...target, ...updates };

      if (status === 'EXIT_SUCCESS') {
        setArchivedCommands(archive => [updated, ...archive]);
        return prev.filter(cmd => cmd.id !== id);
      }

      return prev.map(cmd => (cmd.id === id ? updated : cmd));
    });
  };

  const handleDeleteCommand = (id: number) => {
    handleStatusChange(id, 'SIGKILL');
  };

  // ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCommand) {
        setSelectedCommand(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedCommand]);

  useEffect(() => {
    setSelectedCommand(null);
  }, [isArchiveView]);

  return (
    <div className="flex flex-col h-screen bg-terminal-bg">
      {/* Header */}
      <header className="border-b border-terminal-border px-6 py-4">
        <h1 className="text-xl font-bold text-terminal-green font-mono">
          $ COMMAND_STACK
        </h1>
        <p className="text-xs text-terminal-text/50 mt-1">
          {isArchiveView
            ? `${archivedCommands.length} archived commands`
            : `${commands.length} total commands | ${commands.filter(c => c.status === 'EXECUTING').length} executing`}
        </p>
      </header>

      {/* View Switcher */}
      {!isArchiveView && (
        <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {isArchiveView ? (
          <ScheduleDashboard
            commands={archivedCommands}
            onCommandClick={handleCommandClick}
            isArchiveView={isArchiveView}
            onToggleArchive={() => setIsArchiveView(false)}
          />
        ) : viewMode === 'schedule' ? (
          <ScheduleDashboard
            commands={commands}
            onCommandClick={handleCommandClick}
            isArchiveView={isArchiveView}
            onToggleArchive={() => setIsArchiveView(true)}
          />
        ) : (
          <ContextExplorer
            contexts={MOCK_CONTEXTS}
            commands={commands}
            onAddCommand={handleAddCommand}
            onCommandClick={handleCommandClick}
          />
        )}
      </div>

      {/* Bottom Command Input */}
      {!isArchiveView && (
        <CommandInput onPushCommand={handleQuickPush} />
      )}

      {/* Command Detail Modal */}
      {selectedCommand && (
        <CommandDetailModal
          command={selectedCommand}
          context={MOCK_CONTEXTS.find(c => c.id === selectedCommand.contextId)}
          onClose={() => setSelectedCommand(null)}
          onStatusChange={isArchiveView ? undefined : handleStatusChange}
          onDelete={isArchiveView ? undefined : handleDeleteCommand}
        />
      )}
    </div>
  );
}

export default App;
