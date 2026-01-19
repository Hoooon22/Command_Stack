import { useState, useEffect } from 'react';
import ViewSwitcher, { type ViewMode } from './components/ViewSwitcher';
import ScheduleDashboard from './components/ScheduleDashboard';
import ContextExplorer from './components/ContextExplorer';
import ConsoleInput from './components/ConsoleInput';
import TaskDetailModal from './components/TaskDetailModal';
import TaskCreateForm from './components/TaskCreateForm';
import type { Task, Context } from './types';
import { taskApi, contextApi } from './api';
import pkg from '../package.json';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
// ... (omitted middle part for brevity, tool will handle it if I provide enough context)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
      const [contextsData, tasksData] = await Promise.all([
        contextApi.getAll(),
        isArchiveView ? taskApi.getArchived() : taskApi.getActive(),
      ]);
      setContexts(contextsData);
      if (isArchiveView) {
        setArchivedTasks(tasksData);
      } else {
        setTasks(tasksData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const createdTask = await taskApi.create(newTask);
      setTasks(prev => [createdTask, ...prev]);
      console.log('[PUSH] New Task:', createdTask);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
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

  const handleUpdateContext = async (id: number, updatedContext: Omit<Context, 'id'>) => {
    try {
      const updated = await contextApi.update(id, updatedContext);
      setContexts(prev => prev.map(ctx => ctx.id === id ? updated : ctx));
      console.log('[UPDATE] Context:', updated);
      return updated;
    } catch (err) {
      console.error('Error updating context:', err);
      setError(err instanceof Error ? err.message : 'Failed to update context');
      return null;
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleStatusChange = async (id: number, status: Task['status']) => {
    try {
      const updatedTask = await taskApi.updateStatus(id, status);

      if (status === 'EXIT_SUCCESS') {
        // Move to archive
        setTasks(prev => prev.filter(t => t.id !== id));
        setArchivedTasks(prev => [updatedTask, ...prev]);
      } else {
        // Update in active list
        setTasks(prev =>
          prev.map(t => (t.id === id ? updatedTask : t))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await taskApi.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleCreateTask = (deadline: string) => {
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
      if (e.key === 'Escape' && selectedTask) {
        setSelectedTask(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedTask]);

  useEffect(() => {
    setSelectedTask(null);
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
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-bold text-terminal-green font-mono">
            $ COMMAND_STACK
          </h1>
          <span className="text-[10px] text-terminal-text/30 font-mono">v{pkg.version}</span>
        </div>
        <p className="text-xs text-terminal-text/50 mt-1">
          {isArchiveView
            ? `${archivedTasks.length} archived tasks`
            : `${tasks.length} total tasks | ${tasks.filter(t => t.status === 'EXECUTING').length} executing`}
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
            tasks={archivedTasks}
            contexts={contexts}
            onTaskClick={handleTaskClick}
            isArchiveView={isArchiveView}
            onToggleArchive={() => setIsArchiveView(false)}
          />
        ) : viewMode === 'schedule' ? (
          <ScheduleDashboard
            tasks={tasks}
            contexts={contexts}
            onTaskClick={handleTaskClick}
            onCreateTask={handleCreateTask}
            isArchiveView={isArchiveView}
            onToggleArchive={() => setIsArchiveView(true)}
          />
        ) : (
          <ContextExplorer
            contexts={contexts}
            tasks={tasks}
            onAddTask={handleAddTask}
            onAddContext={handleAddContext}
            onUpdateContext={handleUpdateContext}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      {/* Bottom Console Input */}
      {!isArchiveView && (
        <ConsoleInput
          onOpenCreateForm={handleOpenCreateForm}
          tasks={tasks}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          context={contexts.find(c => c.id === selectedTask.contextId)}
          onClose={() => setSelectedTask(null)}
          onStatusChange={isArchiveView ? undefined : handleStatusChange}
          onDelete={isArchiveView ? undefined : handleDeleteTask}
        />
      )}

      {/* Task Create Form */}
      {createFormDeadline && (
        <TaskCreateForm
          contexts={contexts}
          prefilledDeadline={createFormDeadline}
          onSubmit={handleAddTask}
          onClose={() => setCreateFormDeadline(null)}
        />
      )}
    </div>
  );
}

export default App;
