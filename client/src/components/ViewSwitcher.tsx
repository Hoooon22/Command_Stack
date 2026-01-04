import { Calendar, FolderTree } from 'lucide-react';

export type ViewMode = 'schedule' | 'context';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex gap-2 border-b border-terminal-border bg-terminal-bg px-4 py-2">
      <button
        onClick={() => onViewChange('schedule')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded font-mono text-sm
          transition-colors
          ${currentView === 'schedule'
            ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green'
            : 'text-terminal-text/60 hover:text-terminal-text hover:bg-terminal-border/30'}
        `}
      >
        <Calendar size={16} />
        Schedule Mode
      </button>

      <button
        onClick={() => onViewChange('context')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded font-mono text-sm
          transition-colors
          ${currentView === 'context'
            ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green'
            : 'text-terminal-text/60 hover:text-terminal-text hover:bg-terminal-border/30'}
        `}
      >
        <FolderTree size={16} />
        Context Mode
      </button>
    </div>
  );
}
