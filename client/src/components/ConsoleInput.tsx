import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Terminal } from 'lucide-react';

// Available commands
const AVAILABLE_COMMANDS = ['create'];

interface ConsoleInputProps {
  onOpenCreateForm: () => void;
}

export default function ConsoleInput({ onOpenCreateForm }: ConsoleInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Update suggestions based on input
  useEffect(() => {
    if (input.trim()) {
      const filtered = AVAILABLE_COMMANDS.filter(cmd =>
        cmd.toLowerCase().startsWith(input.toLowerCase())
      );
      setSuggestions(filtered);
      // Auto-select first suggestion
      setSelectedIndex(filtered.length > 0 ? 0 : -1);
    } else {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
    setError('');
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow keys for suggestion navigation
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        return;
      }
      // Tab or Enter on selected suggestion
      if ((e.key === 'Tab' || e.key === 'Enter') && selectedIndex >= 0) {
        e.preventDefault();
        setInput(suggestions[selectedIndex]);
        setSuggestions([]);
        setSelectedIndex(-1);
        return;
      }
    }

    // Handle Enter for commands
    if (e.key === 'Enter' && input.trim()) {
      const trimmedInput = input.trim().toLowerCase();

      // Check if command is valid
      if (!AVAILABLE_COMMANDS.includes(trimmedInput)) {
        setError(`Command not found: ${input.trim()}`);
        setTimeout(() => setError(''), 2000);
        return;
      }

      // Execute command
      if (trimmedInput === 'create') {
        console.log('[COMMAND] Opening create form...');
        onOpenCreateForm();
        setInput('');
        setSuggestions([]);
        setError('');
        return;
      }
    }

    // Escape to clear suggestions
    if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative border-t border-terminal-border bg-terminal-bg px-4 py-3">
      {/* Error Message */}
      {error && (
        <div className="absolute bottom-full left-0 right-0 bg-red-900/30 border-t border-red-500/50 max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
            <span>✗</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Autocomplete Suggestions */}
      {!error && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-terminal-bg border-t border-terminal-border max-w-4xl mx-auto px-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                px-4 py-2 font-mono text-sm cursor-pointer border-l-2 transition-colors
                ${index === selectedIndex
                  ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                  : 'border-transparent text-terminal-text/70 hover:bg-terminal-border/30 hover:text-terminal-text'
                }
              `}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <Terminal size={18} className="text-terminal-green" />
        <span className="text-terminal-green font-mono select-none">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='type "create" to push new command...'
          className={`
            flex-1 bg-transparent font-mono text-sm outline-none
            ${error ? 'text-red-400' : 'text-terminal-text'}
            placeholder:text-terminal-text/30
          `}
          autoFocus
        />
        <span className="text-terminal-green font-mono animate-pulse select-none">_</span>
      </div>
    </div>
  );
}
