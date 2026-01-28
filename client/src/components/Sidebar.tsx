import { useState, type FormEvent } from 'react';
import type { Context } from '../types';
import { Folder, FolderOpen, Plus, Edit2, X, Check } from 'lucide-react';

interface SidebarProps {
  contexts: Context[];
  selectedContextId: number | null;
  onSelectContext: (id: number) => void;
  onCreateContext: (context: Omit<Context, 'id'>) => Promise<Context | null>;
  onUpdateContext: (id: number, context: Omit<Context, 'id'>) => Promise<Context | null>;
}

export default function Sidebar({
  contexts,
  selectedContextId,
  onSelectContext,
  onCreateContext,
  onUpdateContext,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
}: SidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingContextId, setEditingContextId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    namespace: '',
    description: '',
    color: '#50fa7b',
  });


  // Terminal-themed color palette
  const colorPalette = [
    '#50fa7b', // Green
    '#8be9fd', // Cyan
    '#ff79c6', // Pink
    '#bd93f9', // Purple
    '#ffb86c', // Orange
    '#f1fa8c', // Yellow
    '#ff5555', // Red
    '#6272a4', // Blue
  ];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const namespace = formData.namespace.trim();
    if (!namespace || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await onCreateContext({
        namespace,
        description: formData.description.trim() || 'No description recorded yet.',
        color: formData.color,
      });
      if (created) {
        setFormData({ namespace: '', description: '', color: '#50fa7b' });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating context:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (context: Context) => {
    setEditingContextId(context.id);
    setFormData({
      namespace: context.namespace,
      description: context.description || '',
      color: context.color || '#50fa7b',
    });
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingContextId || isSubmitting) return;

    const namespace = formData.namespace.trim();
    if (!namespace) return;

    setIsSubmitting(true);
    try {
      await onUpdateContext(editingContextId, {
        namespace,
        description: formData.description.trim() || 'No description recorded yet.',
        color: formData.color,
      });
      setEditingContextId(null);
      setFormData({ namespace: '', description: '', color: '#50fa7b' });
    } catch (error) {
      console.error('Error updating context:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEditing = () => {
    setEditingContextId(null);
    setFormData({ namespace: '', description: '', color: '#50fa7b' });
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
          <div>
            <label className="block text-[10px] text-terminal-text/60 mb-1 font-mono">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded border-2 transition-all ${
                    formData.color === color
                      ? 'border-terminal-text scale-110'
                      : 'border-terminal-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
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
          const isEditing = editingContextId === ctx.id;

          if (isEditing) {
            return (
              <div key={ctx.id} className="mb-1">
                <form
                  onSubmit={handleUpdate}
                  className="space-y-2 rounded border border-terminal-green bg-terminal-border/10 p-2"
                >
                  <div>
                    <label className="block text-[10px] text-terminal-text/60 mb-1 font-mono">
                      Namespace
                    </label>
                    <input
                      type="text"
                      value={formData.namespace}
                      onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                      className="w-full px-2 py-1 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-xs outline-none focus:border-terminal-green"
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
                      className="w-full px-2 py-1 bg-terminal-bg text-terminal-text border border-terminal-border rounded font-mono text-xs outline-none focus:border-terminal-green min-h-[50px] resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-terminal-text/60 mb-1 font-mono">
                      Color
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-5 h-5 rounded border transition-all ${
                            formData.color === color
                              ? 'border-terminal-text scale-110'
                              : 'border-terminal-border hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-terminal-green/20 text-terminal-green rounded border border-terminal-green hover:bg-terminal-green/30 font-mono text-xs disabled:opacity-50"
                    >
                      <Check size={12} />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-terminal-border/20 text-terminal-text/60 rounded border border-terminal-border hover:bg-terminal-border/30 font-mono text-xs"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            );
          }

          return (
            <div key={ctx.id} className="mb-1 group">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSelectContext(ctx.id)}
                  className={`
                    flex-1 flex items-center gap-2 px-2 py-1.5 rounded
                    text-left text-sm transition-colors
                    ${isSelected
                      ? 'bg-opacity-20'
                      : 'text-terminal-text hover:bg-terminal-border/50'}
                  `}
                  style={
                    isSelected && ctx.color
                      ? {
                          backgroundColor: `${ctx.color}20`,
                          color: ctx.color,
                        }
                      : {}
                  }
                >
                  {isExpanded ? (
                    <FolderOpen size={16} style={{ color: ctx.color || '#50fa7b' }} />
                  ) : (
                    <Folder size={16} style={{ color: ctx.color || '#6272a4' }} />
                  )}
                  <span className="truncate">{ctx.namespace}</span>
                </button>
                <button
                  onClick={() => startEditing(ctx)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-terminal-text/60 hover:text-terminal-green transition-all"
                  title="Edit context"
                >
                  <Edit2 size={14} />
                </button>
              </div>

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
