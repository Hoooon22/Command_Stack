import { useState, useEffect } from 'react';
import ViewSwitcher, { type ViewMode } from './components/ViewSwitcher';
import ScheduleDashboard from './components/ScheduleDashboard';
import ContextExplorer from './components/ContextExplorer';
import MemoBoard from './components/MemoBoard';
import ConsoleInput from './components/ConsoleInput';
import TaskDetailModal from './components/TaskDetailModal';
import TaskCreateForm from './components/TaskCreateForm';
import type { Task, Context } from './types';
import { taskApi, contextApi } from './api';
import pkg from '../package.json';

import AuthCallback from './components/Auth/AuthCallback';

import { useAuth } from './contexts/AuthContext';

function App() {
  useAuth(); // Auth context initialization
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createFormDeadline, setCreateFormDeadline] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simple hash-based routing for Auth Callback
  const [isAuthCallback, setIsAuthCallback] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash.startsWith('#/auth/callback')) {
        setIsAuthCallback(true);
      } else {
        setIsAuthCallback(false);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // IPC Deep Link Listener (Backup/Primary for packaged app)
  useEffect(() => {
    // @ts-ignore
    if (window.electron && window.electron.onDeepLink) {
      // @ts-ignore
      const cleanup = window.electron.onDeepLink(async (token) => {
        console.log('[IPC] Received token:', token);
        try {
          setIsAuthCallback(true); // Show loading state (AuthCallback component)
          // Manually manipulate hash to trigger AuthCallback component logic
          // OR better yet, just do the exchange here if AuthCallback relies on URL parmas.
          // Let's set the hash so AuthCallback picks it up, as it has the logic.
          window.location.hash = `#/auth/callback?token=${token}`;
        } catch (e: any) {
          console.error('[IPC] Error handling token:', e);
        }
      });
      return cleanup;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (!isAuthCallback) {
      loadData();
    }
  }, [isArchiveView, isAuthCallback]);

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
      // Ignore auth errors during initial load, user might be guests
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

  const handleUpdateTask = async (updatedData: Omit<Task, 'id'>) => {
    if (!editingTask) return;
    try {
      const updatedTask = await taskApi.update(editingTask.id, updatedData);
      setTasks(prev => prev.map(t => (t.id === editingTask.id ? updatedTask : t)));
      console.log('[UPDATE] Task:', updatedTask);
      setEditingTask(null);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
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
      if (e.key === 'Escape') {
        if (selectedTask) setSelectedTask(null);
        if (editingTask) setEditingTask(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedTask, editingTask]);

  useEffect(() => {
    setSelectedTask(null);
  }, [isArchiveView]);

  if (isAuthCallback) {
    return <AuthCallback />;
  }

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
        ) : viewMode === 'context' ? (
          <ContextExplorer
            contexts={contexts}
            tasks={tasks}
            onAddTask={handleAddTask}
            onAddContext={handleAddContext}
            onUpdateContext={handleUpdateContext}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <MemoBoard />
        )}
      </div>

      {/* Bottom Console Input */}
      {!isArchiveView && (
        <ConsoleInput
          onOpenCreateForm={handleOpenCreateForm}
          tasks={tasks}
          onDeleteTask={handleDeleteTask}
          onEditTask={setEditingTask}
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
          onEdit={isArchiveView ? undefined : (task) => {
            setEditingTask(task);
            setSelectedTask(null);
          }}
        />
      )}

      {/* Task Create/Edit Form */}
      {(createFormDeadline || editingTask) && (
        <TaskCreateForm
          contexts={contexts}
          prefilledDeadline={createFormDeadline || undefined}
          initialData={editingTask || undefined}
          onSubmit={editingTask ? handleUpdateTask : handleAddTask}
          onClose={() => {
            setCreateFormDeadline(null);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
