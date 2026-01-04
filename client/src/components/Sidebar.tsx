import type { Context } from '../types';
import { Folder, FolderOpen } from 'lucide-react';

interface SidebarProps {
  contexts: Context[];
  selectedContextId: number | null;
  onSelectContext: (id: number) => void;
}

export default function Sidebar({ contexts, selectedContextId, onSelectContext }: SidebarProps) {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4 pb-2 border-b border-terminal-border">
        <h2 className="text-sm font-bold text-terminal-green">~/contexts</h2>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {contexts.map((ctx) => {
          const isSelected = selectedContextId === ctx.id;
          const isExpanded = isSelected;

          return (
            <div key={ctx.id} className="mb-1">
              <button
                onClick={() => onSelectContext(ctx.id)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded
                  text-left text-sm transition-colors
                  ${isSelected
                    ? 'bg-terminal-green/20 text-terminal-green'
                    : 'text-terminal-text hover:bg-terminal-border/50'}
                `}
              >
                {isExpanded ? (
                  <FolderOpen size={16} className="text-terminal-green" />
                ) : (
                  <Folder size={16} className="text-terminal-text" />
                )}
                <span className="truncate">{ctx.namespace}</span>
              </button>

              {isExpanded && (
                <div className="ml-6 mt-1 text-xs text-terminal-text/60 px-2">
                  {ctx.description}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
