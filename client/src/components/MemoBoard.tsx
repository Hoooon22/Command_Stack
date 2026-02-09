import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'lucide-react';

const MEMOS_STORAGE_KEY = 'commandstack_memos';

interface MemoFile {
  content: string;
  updatedAt: string;
}

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'success';
  content: string;
}

export default function MemoBoard() {
  const [mode, setMode] = useState<'terminal' | 'editor'>('terminal');
  const [memos, setMemos] = useState<Record<string, MemoFile>>({});
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { type: 'output', content: 'Welcome to MEMO_PAD Terminal. Type "help" for available commands.' },
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load memos from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(MEMOS_STORAGE_KEY);
    if (saved) {
      try {
        setMemos(JSON.parse(saved));
      } catch {
        console.error('Failed to parse saved memos');
      }
    }
  }, []);

  // Save memos to localStorage
  const saveMemos = useCallback((newMemos: Record<string, MemoFile>) => {
    setMemos(newMemos);
    localStorage.setItem(MEMOS_STORAGE_KEY, JSON.stringify(newMemos));
  }, []);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Focus input when in terminal mode
  useEffect(() => {
    if (mode === 'terminal' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  // Focus editor when entering editor mode
  useEffect(() => {
    if (mode === 'editor' && editorRef.current) {
      editorRef.current.focus();
    }
  }, [mode]);

  const addHistory = (line: TerminalLine) => {
    setTerminalHistory(prev => [...prev, line]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addHistory({ type: 'command', content: `$ ${trimmed}` });

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        addHistory({ type: 'output', content: '┌─────────────────────────────────────────┐' });
        addHistory({ type: 'output', content: '│ Available Commands:                     │' });
        addHistory({ type: 'output', content: '├─────────────────────────────────────────┤' });
        addHistory({ type: 'output', content: '│ ls              List all memo files    │' });
        addHistory({ type: 'output', content: '│ vi <file>       Edit/create a memo     │' });
        addHistory({ type: 'output', content: '│ vim <file>      Same as vi              │' });
        addHistory({ type: 'output', content: '│ cat <file>      View memo content       │' });
        addHistory({ type: 'output', content: '│ rm <file>       Delete a memo           │' });
        addHistory({ type: 'output', content: '│ clear           Clear terminal          │' });
        addHistory({ type: 'output', content: '│ help            Show this help          │' });
        addHistory({ type: 'output', content: '└─────────────────────────────────────────┘' });
        break;

      case 'ls':
        const files = Object.keys(memos);
        if (files.length === 0) {
          addHistory({ type: 'output', content: '(no files)' });
        } else {
          addHistory({ type: 'output', content: '┌──────────────────────┬───────────────────┬────────┐' });
          addHistory({ type: 'output', content: '│ FILENAME             │ MODIFIED          │ SIZE   │' });
          addHistory({ type: 'output', content: '├──────────────────────┼───────────────────┼────────┤' });
          files.forEach(filename => {
            const memo = memos[filename];
            const name = filename.padEnd(20).slice(0, 20);
            const date = formatDate(memo.updatedAt).padEnd(17).slice(0, 17);
            const size = `${memo.content.length}B`.padStart(6);
            addHistory({ type: 'output', content: `│ ${name} │ ${date} │ ${size} │` });
          });
          addHistory({ type: 'output', content: '└──────────────────────┴───────────────────┴────────┘' });
          addHistory({ type: 'output', content: `Total: ${files.length} file(s)` });
        }
        break;

      case 'vi':
      case 'vim':
        if (args.length === 0) {
          addHistory({ type: 'error', content: `Error: usage: ${command} <filename>` });
        } else {
          const filename = args[0];
          const existing = memos[filename];
          setCurrentFile(filename);
          setEditorContent(existing?.content || '');
          setMode('editor');
          addHistory({ type: 'success', content: `Opening ${filename}...` });
        }
        break;

      case 'cat':
        if (args.length === 0) {
          addHistory({ type: 'error', content: 'Error: usage: cat <filename>' });
        } else {
          const filename = args[0];
          const memo = memos[filename];
          if (!memo) {
            addHistory({ type: 'error', content: `Error: ${filename}: file not found` });
          } else {
            const lines = memo.content.split('\n');
            const maxLen = Math.max(filename.length + 4, ...lines.map(l => l.length), 20);
            const border = '─'.repeat(maxLen + 2);
            addHistory({ type: 'output', content: `┌${border}┐` });
            addHistory({ type: 'output', content: `│ 📄 ${filename.padEnd(maxLen - 3)} │` });
            addHistory({ type: 'output', content: `├${border}┤` });
            lines.forEach(line => {
              addHistory({ type: 'output', content: `│ ${line.padEnd(maxLen)} │` });
            });
            addHistory({ type: 'output', content: `└${border}┘` });
            addHistory({ type: 'output', content: `📅 Modified: ${formatDate(memo.updatedAt)} | 📏 ${memo.content.length} chars` });
          }
        }
        break;

      case 'rm':
        if (args.length === 0) {
          addHistory({ type: 'error', content: 'Error: usage: rm <filename>' });
        } else {
          const filename = args[0];
          if (!memos[filename]) {
            addHistory({ type: 'error', content: `Error: ${filename}: file not found` });
          } else {
            const newMemos = { ...memos };
            delete newMemos[filename];
            saveMemos(newMemos);
            addHistory({ type: 'success', content: `Deleted: ${filename}` });
          }
        }
        break;

      case 'clear':
        setTerminalHistory([]);
        break;

      default:
        addHistory({ type: 'error', content: `Command not found: ${command}. Type "help" for available commands.` });
    }

    setCommandInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(commandInput);
    } else if (e.key === 'Tab') {
      e.preventDefault(); // 기본 탭 동작 방지
      
      const trimmed = commandInput.trim();
      const parts = trimmed.split(/\s+/);
      const command = parts[0]?.toLowerCase();
      
      // vi, vim, cat, rm 명령어인 경우만 자동완성
      if (['vi', 'vim', 'cat', 'rm'].includes(command) && parts.length >= 1) {
        const partial = parts[1] || ''; // 입력 중인 파일명 (없으면 빈 문자열)
        const files = Object.keys(memos);
        
        // 입력 중인 문자열로 시작하는 파일 찾기
        const matches = files.filter(f => 
          f.toLowerCase().startsWith(partial.toLowerCase())
        );
        
        if (matches.length === 1) {
          // 정확히 하나만 매칭되면 자동완성
          setCommandInput(`${command} ${matches[0]}`);
        } else if (matches.length > 1) {
          // 여러 개 매칭되면 공통 접두사로 자동완성 + 목록 표시
          const commonPrefix = findCommonPrefix(matches);
          if (commonPrefix.length > partial.length) {
            setCommandInput(`${command} ${commonPrefix}`);
          }
          // 매칭되는 파일 목록 표시
          addHistory({ type: 'command', content: `$ ${commandInput}` });
          addHistory({ type: 'output', content: matches.join('  ') });
        }
      }
    }
  };

  // 문자열 배열의 공통 접두사 찾기
  const findCommonPrefix = (strings: string[]): string => {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];
    
    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
      while (!strings[i].toLowerCase().startsWith(prefix.toLowerCase())) {
        prefix = prefix.slice(0, -1);
        if (prefix.length === 0) return '';
      }
    }
    return prefix;
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      // Save and exit
      if (currentFile) {
        const newMemos = {
          ...memos,
          [currentFile]: {
            content: editorContent,
            updatedAt: new Date().toISOString(),
          },
        };
        saveMemos(newMemos);
        addHistory({ type: 'success', content: `Saved: ${currentFile}` });
      }
      setMode('terminal');
      setCurrentFile(null);
      setEditorContent('');
    }
  };

  // Click anywhere to focus terminal input
  const handleTerminalClick = () => {
    if (mode === 'terminal' && inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (mode === 'editor') {
    return (
      <div className="flex flex-col h-full bg-terminal-bg">
        {/* Editor Header */}
        <header className="border-b border-terminal-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal size={18} className="text-terminal-green" />
            <span className="font-mono text-terminal-green text-sm">
              VIM - {currentFile}
            </span>
            <span className="text-xs text-terminal-text/40 font-mono">
              (Press ESC to save and exit)
            </span>
          </div>
          <span className="text-xs text-terminal-text/40 font-mono">
            {editorContent.length} chars
          </span>
        </header>

        {/* Editor Body */}
        <div className="flex-1 p-4 flex flex-col">
          <textarea
            ref={editorRef}
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            onKeyDown={handleEditorKeyDown}
            className="w-full flex-1 bg-black/30 text-terminal-text font-mono text-sm 
                       border border-terminal-border rounded-lg p-4
                       resize-none outline-none focus:border-terminal-green
                       leading-relaxed"
            placeholder="Start typing your memo..."
            spellCheck={false}
          />
          {/* ESC hint at bottom */}
          <div className="flex justify-center mt-3">
            <span className="text-xs text-terminal-text/30 font-mono">
              💡 Press ESC to save and exit
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full bg-terminal-bg"
      onClick={handleTerminalClick}
    >
      {/* Terminal Header */}
      <header className="border-b border-terminal-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-terminal-green" />
          <span className="font-mono text-terminal-green text-sm font-bold">
            $ MEMO_PAD
          </span>
          <span className="text-xs text-terminal-text/40 font-mono">
            ~/memo
          </span>
        </div>
      </header>

      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {terminalHistory.map((line, i) => (
          <div 
            key={i}
            className={`whitespace-pre-wrap mb-1 ${
              line.type === 'command' ? 'text-terminal-green' :
              line.type === 'error' ? 'text-red-400' :
              line.type === 'success' ? 'text-blue-400' :
              'text-terminal-text/80'
            }`}
          >
            {line.content}
          </div>
        ))}

        {/* Command Input Line */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-terminal-green">user@memo $</span>
          <input
            ref={inputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-terminal-text outline-none caret-terminal-green"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
