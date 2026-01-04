import { useState, KeyboardEvent } from 'react';
import { Terminal } from 'lucide-react';

interface CommandInputProps {
  onPushCommand: (syntax: string) => void;
}

export default function CommandInput({ onPushCommand }: CommandInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      console.log('[PUSH] New Command:', input);
      onPushCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="border-t border-terminal-border bg-terminal-bg px-4 py-3">
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <Terminal size={18} className="text-terminal-green" />
        <span className="text-terminal-green font-mono select-none">{'>'}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="push new command..."
          className="
            flex-1 bg-transparent text-terminal-text font-mono text-sm
            outline-none placeholder:text-terminal-text/30
          "
          autoFocus
        />
        <span className="text-terminal-green font-mono animate-pulse select-none">_</span>
      </div>
    </div>
  );
}
