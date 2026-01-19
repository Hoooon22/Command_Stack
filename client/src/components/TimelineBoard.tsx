import { useState } from 'react';
import type { Task } from '../types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface TimelineBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (deadline: string) => void;
}

type TimelineView = 'week' | 'month' | 'year';

export default function TimelineBoard({ tasks, onTaskClick, onCreateTask }: TimelineBoardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<TimelineView>('month');

  // Get tasks with deadlines
  const scheduledTasks = tasks.filter(task => task.deadline);

  // Navigation functions
  const goPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const goNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get timeline headers based on view mode
  const getTimelineHeaders = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return {
          label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          date: date,
        };
      });
    } else if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      return Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        return {
          label: `${i + 1}`,
          date: date,
        };
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, idx) => ({
        label: month,
        date: new Date(currentDate.getFullYear(), idx, 1),
      }));
    }
  };

  const headers = getTimelineHeaders();

  // Get period label
  const getPeriodLabel = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  // Calculate position for any timestamp
  const getTimePosition = (timestamp: string) => {
    const date = new Date(timestamp);

    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      if (date < startOfWeek || date >= endOfWeek) return null;

      const dayOfWeek = date.getDay();
      const hourFraction = (date.getHours() + date.getMinutes() / 60) / 24;
      return ((dayOfWeek + hourFraction) / 7) * 100;
    } else if (viewMode === 'month') {
      if (date.getFullYear() !== currentDate.getFullYear() || date.getMonth() !== currentDate.getMonth()) {
        return null;
      }

      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const day = date.getDate();
      const hourFraction = (date.getHours() + date.getMinutes() / 60) / 24;
      return ((day - 1 + hourFraction) / daysInMonth) * 100;
    } else {
      if (date.getFullYear() !== currentDate.getFullYear()) return null;

      const month = date.getMonth();
      const day = date.getDate();
      const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();
      const dayFraction = day / daysInMonth;
      return ((month + dayFraction) / 12) * 100;
    }
  };

  const getClampedWeekPosition = (timestamp: string, clampToEnd: boolean) => {
    const date = new Date(timestamp);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    if (date < startOfWeek) return 0;
    if (date >= endOfWeek) return 100;

    const dayOfWeek = date.getDay();
    const hourFraction = (date.getHours() + date.getMinutes() / 60) / 24;
    const pos = ((dayOfWeek + hourFraction) / 7) * 100;
    return clampToEnd ? Math.min(100, pos) : Math.max(0, pos);
  };

  // Calculate execution bar positions
  const getExecutionBar = (cmd: Task) => {
    if (!cmd.startedAt) return null;

    const startPos = viewMode === 'week'
      ? getClampedWeekPosition(cmd.startedAt, false)
      : getTimePosition(cmd.startedAt);
    if (startPos === null) return null;

    let endPos: number | null;

    if (cmd.completedAt) {
      endPos = viewMode === 'week'
        ? getClampedWeekPosition(cmd.completedAt, true)
        : getTimePosition(cmd.completedAt);
    } else if (cmd.deadline) {
      endPos = viewMode === 'week'
        ? getClampedWeekPosition(cmd.deadline, true)
        : getTimePosition(cmd.deadline);
    } else {
      // If no end time, use current time
      endPos = viewMode === 'week'
        ? getClampedWeekPosition(new Date().toISOString(), true)
        : getTimePosition(new Date().toISOString());
    }

    if (endPos === null) return null;

    return {
      left: Math.min(startPos, endPos),
      width: Math.abs(endPos - startPos),
      status: cmd.status,
    };
  };

  const getTypeColor = (type: Task['type']) => {
    return type === 'SCHEDULE' ? 'bg-terminal-green' : 'bg-terminal-cyan';
  };

  const getTypeLabel = (type: Task['type']) => {
    return type === 'SCHEDULE' ? 'Schedule' : 'Task';
  };

  const getTypeBadgeClass = (type: Task['type']) => {
    return type === 'SCHEDULE'
      ? 'bg-terminal-green/20 text-terminal-green'
      : 'bg-terminal-cyan/20 text-terminal-cyan';
  };

  return (
    <div className="flex flex-col h-full bg-terminal-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-mono text-terminal-green">
            {getPeriodLabel()}
          </h2>

          {/* View Mode Selector */}
          <div className="flex gap-1 bg-terminal-border/20 rounded p-1">
            {(['week', 'month', 'year'] as TimelineView[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-2 py-1 text-xs font-mono rounded transition-colors
                  ${viewMode === mode
                    ? 'bg-terminal-green/20 text-terminal-green'
                    : 'text-terminal-text/50 hover:text-terminal-text'}
                `}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {onCreateTask && (
            <button
              onClick={() => {
                const now = new Date();
                now.setHours(12, 0, 0, 0);
                onCreateTask(now.toISOString());
              }}
              className="flex items-center gap-1 px-3 py-1 bg-terminal-green/20 hover:bg-terminal-green/30
                         rounded text-terminal-green font-mono text-xs transition-colors"
            >
              <Plus size={14} />
              Push
            </button>
          )}
          <button
            onClick={goPrevious}
            className="p-1 hover:bg-terminal-border/30 rounded text-terminal-text"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            className="p-1 hover:bg-terminal-border/30 rounded text-terminal-text"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[900px]">
          {/* Headers */}
          <div className="flex mb-6 border-b border-terminal-border">
            <div className="w-48 flex-shrink-0" />
            <div className="flex-1 flex">
              {headers.map((header, idx) => (
                <div
                  key={idx}
                  className={`
                    flex-1 text-center py-2 text-xs font-mono border-l border-terminal-border
                    ${viewMode === 'month' ? 'text-terminal-text/50' : 'text-terminal-text/70'}
                  `}
                >
                  {header.label}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-4">
            {scheduledTasks.length === 0 ? (
              <div className="text-center text-terminal-text/30 py-20">
                <p className="font-mono text-sm">No scheduled tasks for this period</p>
              </div>
            ) : (
              scheduledTasks.map(task => {
                const executionBar = getExecutionBar(task);
                const deadlinePos = task.deadline ? getTimePosition(task.deadline) : null;

                // Skip if neither execution bar nor deadline is visible
                if (!executionBar && deadlinePos === null) return null;

                return (
                  <div
                    key={task.id}
                    className="flex items-center group cursor-pointer"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {/* Task Name */}
                    <div className="w-48 flex-shrink-0 pr-4 relative">
                      <div className="text-sm text-terminal-text font-mono truncate group-hover:text-terminal-green transition-colors">
                        {task.syntax}
                      </div>
                      <div className="absolute left-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <div className="bg-terminal-bg border border-terminal-border px-2 py-1 rounded text-xs font-mono text-terminal-text max-w-[220px]">
                          {task.details}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-terminal-text/40 font-mono">
                          PID:{task.id}
                        </span>
                        <span className={`
                          text-xs px-1 py-0.5 rounded font-mono
                          ${getTypeBadgeClass(task.type)}
                        `}>
                          {getTypeLabel(task.type)}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-8 border-l border-terminal-border">
                      {/* Grid lines */}
                      {headers.map((_, idx) => (
                        <div
                          key={idx}
                          className="absolute top-0 h-full border-l border-terminal-border/30"
                          style={{ left: `${(idx / headers.length) * 100}%` }}
                        />
                      ))}

                      {/* Execution Bar (if started) */}
                      {executionBar && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full transition-all"
                          style={{
                            left: `${executionBar.left}%`,
                            width: `${executionBar.width}%`,
                          }}
                        >
                          <div className={`
                            h-full rounded-full
                            ${executionBar.status === 'EXECUTING'
                              ? 'bg-terminal-green/40 border-2 border-terminal-green animate-pulse'
                              : executionBar.status === 'EXIT_SUCCESS'
                              ? 'bg-terminal-text/30 border-2 border-terminal-text/50'
                              : 'bg-terminal-red/40 border-2 border-terminal-red'}
                          `} />

                          {/* Tooltip on hover */}
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-terminal-bg border border-terminal-green px-2 py-1 rounded text-xs font-mono text-terminal-green whitespace-nowrap">
                              {task.startedAt && new Date(task.startedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' → '}
                              {task.completedAt
                                ? new Date(task.completedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : task.deadline
                                ? new Date(task.deadline).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Now'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Deadline Marker (if no execution bar) */}
                      {!executionBar && deadlinePos !== null && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                          style={{ left: `${deadlinePos}%` }}
                        >
                          <div className={`
                            w-6 h-6 rounded-full border-2 border-terminal-bg
                            flex items-center justify-center
                            ${getTypeColor(task.type)}
                            shadow-lg
                          `}>
                            <div className="w-2 h-2 bg-terminal-bg rounded-full" />
                          </div>

                          {/* Tooltip on hover */}
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-terminal-bg border border-terminal-green px-2 py-1 rounded text-xs font-mono text-terminal-green whitespace-nowrap">
                              {new Date(task.deadline!).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="w-32 flex-shrink-0 pl-4 text-xs text-terminal-text/50 font-mono">
                      {task.startedAt
                        ? `${new Date(task.startedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            ...(viewMode === 'week' && { hour: '2-digit', minute: '2-digit' })
                          })}`
                        : task.deadline && new Date(task.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            ...(viewMode === 'week' && { hour: '2-digit', minute: '2-digit' })
                          })}
                    </div>
                  </div>
                );
              }).filter(Boolean)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
