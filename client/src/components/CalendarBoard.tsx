import { useState } from 'react';
import type { Task, Context } from '../types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarBoardProps {
  tasks: Task[];
  contexts: Context[];
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (deadline: string) => void;
}

export default function CalendarBoard({ tasks, contexts, onTaskClick, onCreateTask }: CalendarBoardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const barHeight = 18;
  const barGap = 4;
  const dayLabelHeight = 22;
  const baseCellTop = dayLabelHeight + 8;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate calendar grid - split into weeks
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const normalizeDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isWithinRangeDay = (target: Date, start: Date, end: Date) => {
    const targetDay = normalizeDay(target).getTime();
    const startDay = normalizeDay(start).getTime();
    const endDay = normalizeDay(end).getTime();
    return targetDay >= startDay && targetDay <= endDay;
  };

  const gridStartDate = new Date(year, month, 1);
  gridStartDate.setDate(gridStartDate.getDate() - firstDay);

  const weekCount = Math.ceil(calendarDays.length / 7);
  const weeks = Array.from({ length: weekCount }, (_, weekIdx) =>
    calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7)
  );

  const getTasksForDay = (day: number | null) => {
    if (!day) return [];
    const targetDate = new Date(year, month, day);
    return tasks.filter(task => {
      if (!task.deadline) return false;
      if (task.type === 'SCHEDULE' && task.startedAt) return false;
      const deadlineDate = new Date(task.deadline);
      return isSameDay(deadlineDate, targetDate);
    });
  };

  const getContextColor = (contextId: number) => {
    const context = contexts.find(ctx => ctx.id === contextId);
    return context?.color || '#50fa7b';
  };

  const getWeekSpans = (weekIdx: number) => {
    const weekStart = new Date(gridStartDate);
    weekStart.setDate(gridStartDate.getDate() + weekIdx * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const spans = tasks
      .filter(task => task.type === 'SCHEDULE' && task.startedAt && task.deadline)
      .map(task => {
        const startDate = new Date(task.startedAt!);
        const endDate = new Date(task.deadline!);
        const spanStart = startDate <= endDate ? startDate : endDate;
        const spanEnd = startDate <= endDate ? endDate : startDate;
        return { task, spanStart, spanEnd };
      })
      .filter(({ spanStart, spanEnd }) =>
        isWithinRangeDay(weekStart, spanStart, spanEnd) ||
        isWithinRangeDay(weekEnd, spanStart, spanEnd) ||
        isWithinRangeDay(spanStart, weekStart, weekEnd)
      )
      .map(({ task, spanStart, spanEnd }) => {
        const start = spanStart < weekStart ? weekStart : spanStart;
        const end = spanEnd > weekEnd ? weekEnd : spanEnd;
        const startCol = Math.max(0, Math.round((normalizeDay(start).getTime() - normalizeDay(weekStart).getTime()) / (1000 * 60 * 60 * 24)));
        const endCol = Math.max(0, Math.round((normalizeDay(end).getTime() - normalizeDay(weekStart).getTime()) / (1000 * 60 * 60 * 24)));
        const durationDays = Math.round((normalizeDay(spanEnd).getTime() - normalizeDay(spanStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          task,
          startCol,
          endCol,
          isSpanStart: isSameDay(start, spanStart),
          isSpanEnd: isSameDay(end, spanEnd),
          durationDays,
        };
      })
      .sort((a, b) => b.durationDays - a.durationDays || a.startCol - b.startCol);

    const rows: Array<{ ranges: Array<{ start: number; end: number }> }> = [];
    const placed = spans.map(span => {
      let rowIndex = 0;
      while (rowIndex < rows.length) {
        const hasOverlap = rows[rowIndex].ranges.some(range =>
          !(span.endCol < range.start || span.startCol > range.end)
        );
        if (!hasOverlap) break;
        rowIndex += 1;
      }
      if (!rows[rowIndex]) {
        rows[rowIndex] = { ranges: [] };
      }
      rows[rowIndex].ranges.push({ start: span.startCol, end: span.endCol });
      return { ...span, rowIndex };
    });

    return {
      spans: placed,
      rowCount: rows.length,
    };
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex flex-col h-full bg-terminal-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
        <h2 className="text-sm font-mono text-terminal-green">
          {monthNames[month]} {year}
        </h2>
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
            onClick={prevMonth}
            className="p-1 hover:bg-terminal-border/30 rounded text-terminal-text"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-terminal-border/30 rounded text-terminal-text"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 border-b border-terminal-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center py-2 text-xs font-mono text-terminal-text/50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Week by Week */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {weeks.map((week, weekIdx) => {
          const { spans, rowCount } = getWeekSpans(weekIdx);
          const barBlockHeight = rowCount ? rowCount * barHeight + (rowCount - 1) * barGap : 0;
          const cellTopPadding = baseCellTop + (barBlockHeight ? barBlockHeight + 8 : 0);

          return (
            <div key={weekIdx} className="relative overflow-visible" style={{ position: 'relative', zIndex: 1 }}>
              <div className="grid grid-cols-7 relative overflow-visible z-20">
                {week.map((day, dayIdx) => {
                  const dayTasks = getTasksForDay(day);
                  const isToday =
                    day !== null &&
                    new Date().getDate() === day &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;

                  return (
                    <div
                      key={dayIdx}
                      className={`
                        relative border-r border-b border-terminal-border p-2 min-h-[100px] overflow-visible
                        ${day ? 'hover:bg-terminal-border/10 cursor-pointer' : 'bg-terminal-border/5'}
                        ${isToday ? 'bg-terminal-green/10' : ''}
                      `}
                      style={{ paddingTop: `${cellTopPadding}px` }}
                      onClick={() => {
                        if (day && onCreateTask) {
                          const deadline = new Date(year, month, day, 12, 0, 0);
                          onCreateTask(deadline.toISOString());
                        }
                      }}
                    >
                      {day && (
                        <>
                          <div className={`
                            absolute top-2 left-2 text-xs font-mono
                            ${isToday ? 'text-terminal-green font-bold' : 'text-terminal-text/60'}
                          `}>
                            {day}
                          </div>
                          <div className="space-y-1 relative z-40">
                            {dayTasks.map(task => {
                              const color = getContextColor(task.contextId);
                              return (
                                <div
                                  key={task.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskClick?.(task);
                                  }}
                                  className="text-xs truncate px-1 py-0.5 rounded cursor-pointer transition-colors"
                                  style={{
                                    backgroundColor: `${color}20`,
                                    color: color,
                                    borderColor: `${color}60`,
                                  }}
                                  title={task.syntax}
                                >
                                  {task.syntax}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {rowCount > 0 && (
                <div
                  className="absolute left-0 right-0 grid grid-cols-7 gap-0 z-30 px-1"
                  style={{
                    top: `${baseCellTop}px`,
                    rowGap: `${barGap}px`,
                    gridAutoRows: `${barHeight}px`,
                  }}
                >
                  {spans.map(span => {
                    const color = getContextColor(span.task.contextId);
                    return (
                      <button
                        key={span.task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(span.task);
                        }}
                        className={`
                          h-full border
                          text-[11px] font-mono px-2 flex items-center
                          cursor-pointer transition-colors mx-0.5
                          ${span.isSpanStart ? 'rounded-l' : ''}
                          ${span.isSpanEnd ? 'rounded-r' : ''}
                        `}
                        style={{
                          backgroundColor: `${color}30`,
                          borderColor: `${color}60`,
                          color: color,
                          gridColumnStart: span.startCol + 1,
                          gridColumnEnd: span.endCol + 2,
                          gridRowStart: span.rowIndex + 1,
                        }}
                        title={span.task.syntax}
                      >
                        {!span.isSpanStart && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r to-transparent pointer-events-none"
                            style={{
                              backgroundImage: `linear-gradient(to right, ${color}60, transparent)`
                            }}
                          />
                        )}
                        {!span.isSpanEnd && (
                          <span
                            className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l to-transparent pointer-events-none"
                            style={{
                              backgroundImage: `linear-gradient(to left, ${color}60, transparent)`
                            }}
                          />
                        )}
                        <span className="relative z-10 truncate pointer-events-none">
                          {span.task.syntax}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
