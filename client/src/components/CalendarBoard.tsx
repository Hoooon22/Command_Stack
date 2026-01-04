import { useState } from 'react';
import type { Command } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarBoardProps {
  commands: Command[];
  onCommandClick?: (command: Command) => void;
}

export default function CalendarBoard({ commands, onCommandClick }: CalendarBoardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Split into weeks (7 days per week)
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getCommandsForDay = (day: number | null) => {
    if (!day) return [];
    const targetDate = new Date(year, month, day);
    return commands.filter(cmd => {
      if (!cmd.deadline) return false;
      const cmdDate = new Date(cmd.deadline);
      return (
        cmdDate.getFullYear() === targetDate.getFullYear() &&
        cmdDate.getMonth() === targetDate.getMonth() &&
        cmdDate.getDate() === targetDate.getDate()
      );
    });
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
      <div className="flex-1 overflow-y-auto">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7">
            {week.map((day, dayIdx) => {
              const dayCommands = getCommandsForDay(day);
              const isToday =
                day !== null &&
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={dayIdx}
                  className={`
                    border-r border-b border-terminal-border p-2 min-h-[100px]
                    ${day ? 'hover:bg-terminal-border/10 cursor-pointer' : 'bg-terminal-border/5'}
                    ${isToday ? 'bg-terminal-green/10' : ''}
                  `}
                >
                  {day && (
                    <>
                      <div className={`
                        text-xs font-mono mb-1
                        ${isToday ? 'text-terminal-green font-bold' : 'text-terminal-text/60'}
                      `}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayCommands.map(cmd => (
                          <div
                            key={cmd.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCommandClick?.(cmd);
                            }}
                            className="text-xs truncate px-1 py-0.5 rounded bg-terminal-green/20 text-terminal-green hover:bg-terminal-green/30 cursor-pointer transition-colors"
                            title={cmd.syntax}
                          >
                            {cmd.syntax}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
