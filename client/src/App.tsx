import { useState, useEffect } from 'react';
import ViewSwitcher, { type ViewMode } from './components/ViewSwitcher';
import ScheduleDashboard from './components/ScheduleDashboard';
import ContextExplorer from './components/ContextExplorer';
import ConsoleInput from './components/ConsoleInput';
import CommandDetailModal from './components/CommandDetailModal';
import CommandCreateForm from './components/CommandCreateForm';
import type { Command, Context } from './types';
import { commandApi, contextApi } from './api';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [commands, setCommands] = useState<Command[]>([]);
  const [archivedCommands, setArchivedCommands] = useState<Command[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [createFormDeadline, setCreateFormDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [isArchiveView]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [contextsData, commandsData] = await Promise.all([
        contextApi.getAll(),
        isArchiveView ? commandApi.getArchived() : commandApi.getActive(),
      ]);
      setContexts(contextsData);
      if (isArchiveView) {
        setArchivedCommands(commandsData);
      } else {
        setCommands(commandsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommand = async (newCommand: Omit<Command, 'id'>) => {
    try {
      const createdCommand = await commandApi.create(newCommand);
      setCommands(prev => [createdCommand, ...prev]);
      console.log('[PUSH] New Command:', createdCommand);
    } catch (err) {
      console.error('Error creating command:', err);
      setError(err instanceof Error ? err.message : 'Failed to create command');
    }
  };

  const handleAddContext = async (newContext: Omit<Context, 'id'>) => {
    try {
      const createdContext = await contextApi.create(newContext);
      setContexts(prev => [createdContext, ...prev]);
      console.log('[PUSH] New Context:', createdContext);
      return createdContext;
    } catch (err) {
      console.error('Error creating context:', err);
      setError(err instanceof Error ? err.message : 'Failed to create context');
      return null;
    }
  };

  const handleCommandClick = (command: Command) => {
    setSelectedCommand(command);
  };

  const handleStatusChange = async (id: number, status: Command['status']) => {
    try {
      const updatedCommand = await commandApi.updateStatus(id, status);

      if (status === 'EXIT_SUCCESS') {
        // Move to archive
        setCommands(prev => prev.filter(cmd => cmd.id !== id));
        setArchivedCommands(prev => [updatedCommand, ...prev]);
      } else {
        // Update in active list
        setCommands(prev =>
          prev.map(cmd => (cmd.id === id ? updatedCommand : cmd))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteCommand = async (id: number) => {
    try {
      await commandApi.delete(id);
      setCommands(prev => prev.filter(cmd => cmd.id !== id));
    } catch (err) {
      console.error('Error deleting command:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete command');
    }
  };

  const handleCreateCommand = (deadline: string) => {
    setCreateFormDeadline(deadline);
  };

  const handleOpenCreateForm = () => {
    // Set default deadline to tomorrow at noon
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    setCreateFormDeadline(tomorrow.toISOString());
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-terminal-bg">
        <div className="text-terminal-green font-mono">
          <div className="text-lg mb-2">$ Loading...</div>
          <div className="text-sm text-terminal-text/50">Fetching commands from server</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-terminal-bg">
        <div className="text-red-500 font-mono text-center">
          <div className="text-lg mb-2">⚠️ ERROR</div>
          <div className="text-sm">{error}</div>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-terminal-green text-terminal-bg rounded hover:bg-terminal-green/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            onCreateCommand={handleCreateCommand}
            isArchiveView={isArchiveView}
            onToggleArchive={() => setIsArchiveView(true)}
          />
        ) : (
          <ContextExplorer
            contexts={contexts}
            commands={commands}
            onAddCommand={handleAddCommand}
            onAddContext={handleAddContext}
            onCommandClick={handleCommandClick}
          />
        )}
      </div>

      {/* Bottom Console Input */}
      {!isArchiveView && (
        <ConsoleInput onOpenCreateForm={handleOpenCreateForm} />
      )}

      {/* Command Detail Modal */}
      {selectedCommand && (
        <CommandDetailModal
          command={selectedCommand}
          context={contexts.find(c => c.id === selectedCommand.contextId)}
          onClose={() => setSelectedCommand(null)}
          onStatusChange={isArchiveView ? undefined : handleStatusChange}
          onDelete={isArchiveView ? undefined : handleDeleteCommand}
        />
      )}

      {/* Command Create Form */}
      {createFormDeadline && (
        <CommandCreateForm
          contexts={contexts}
          prefilledDeadline={createFormDeadline}
          onSubmit={handleAddCommand}
          onClose={() => setCreateFormDeadline(null)}
        />
      )}
    </div>
  );
}

export default App;
