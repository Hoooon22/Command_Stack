import { useState, type FormEvent } from 'react';
import type { Context } from '../types';
import { Folder, FolderOpen, Plus } from 'lucide-react';

interface SidebarProps {
  contexts: Context[];
  selectedContextId: number | null;
  onSelectContext: (id: number) => void;
  onCreateContext: (context: Omit<Context, 'id'>) => Promise<Context | null>;
}

export default function Sidebar({
  contexts,
  selectedContextId,
  onSelectContext,
  onCreateContext,
}: SidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    namespace: '',
    description: '',
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const namespace = formData.namespace.trim();
    if (!namespace || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await onCreateContext({
        namespace,
        description: formData.description.trim() || 'No description recorded yet.',
      });
      if (created) {
        setFormData({ namespace: '', description: '' });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating context:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4 pb-2 border-b border-terminal-border flex items-center justify-between">
        <h2 className="text-sm font-bold text-terminal-green">~/contexts</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-terminal-green border border-terminal-green/40 rounded hover:bg-terminal-green/10 transition-colors"
        >
          <Plus size={12} />
          Push
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 space-y-2 rounded border border-terminal-border bg-terminal-border/10 p-3"
        >
          <div>
            <label className="block text-[10px] text-terminal-text/60 mb-1 font-mono">
              Namespace
            </label>
            <input
              type="text"
              value={formData.namespace}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              placeholder="core | infra | cli"
              className="w-full px-2 py-1.5 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-xs outline-none focus:border-terminal-green"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] text-terminal-text/60 mb-1 font-mono">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Refactor auth module | Deploy to prod"
              className="w-full px-2 py-1.5 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-xs outline-none focus:border-terminal-green min-h-[60px] resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-terminal-green/20 text-terminal-green rounded border border-terminal-green hover:bg-terminal-green/30 font-mono text-xs disabled:opacity-50"
            >
              Push Context
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 bg-terminal-border/20 text-terminal-text/60 rounded border border-terminal-border hover:bg-terminal-border/30 font-mono text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
