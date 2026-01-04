import { useState } from 'react';
import type { Command } from '../types';
import CalendarBoard from './CalendarBoard';
import TimelineBoard from './TimelineBoard';

interface ScheduleDashboardProps {
  commands: Command[];
  onCommandClick?: (command: Command) => void;
  isArchiveView?: boolean;
  onToggleArchive?: () => void;
}

type ScheduleView = 'calendar' | 'timeline';

export default function ScheduleDashboard({
  commands,
  onCommandClick,
  isArchiveView = false,
  onToggleArchive,
}: ScheduleDashboardProps) {
  const [scheduleView, setScheduleView] = useState<ScheduleView>('calendar');

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs for Calendar/Timeline */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-terminal-bg">
        <div className="flex gap-1">
          <button
            onClick={() => setScheduleView('calendar')}
            className={`
              px-3 py-1.5 text-xs font-mono rounded-t transition-colors
              ${scheduleView === 'calendar'
                ? 'bg-terminal-bg text-terminal-green border-b-2 border-terminal-green'
                : 'text-terminal-text/50 hover:text-terminal-text'}
            `}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setScheduleView('timeline')}
            className={`
              px-3 py-1.5 text-xs font-mono rounded-t transition-colors
              ${scheduleView === 'timeline'
                ? 'bg-terminal-bg text-terminal-green border-b-2 border-terminal-green'
                : 'text-terminal-text/50 hover:text-terminal-text'}
            `}
          >
            ⏰ Timeline
          </button>
        </div>
        <button
          onClick={onToggleArchive}
          className={`
            px-3 py-1.5 text-xs font-mono rounded border transition-colors
            ${isArchiveView
              ? 'bg-terminal-green/20 text-terminal-green border-terminal-green'
              : 'bg-terminal-border/10 text-terminal-text/60 border-terminal-border hover:text-terminal-text hover:bg-terminal-border/30'}
          `}
        >
          {isArchiveView ? 'Active Commands' : 'Archived Commands'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {scheduleView === 'calendar' ? (
          <CalendarBoard commands={commands} onCommandClick={onCommandClick} />
        ) : (
          <TimelineBoard commands={commands} onCommandClick={onCommandClick} />
        )}
      </div>
    </div>
  );
}
