import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api';

const AuthCallback: React.FC = () => {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const processedRef = useRef(false); // 중복 처리 방지

  const addLog = (msg: string) => {
    console.log('[AuthCallback]', msg);
    setDebugLog(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0,8)} ${msg}`]);
  };

  useEffect(() => {
    // 이미 처리했으면 스킵
    if (processedRef.current) {
      addLog('Already processed, skipping...');
      return;
    }

    const processToken = async () => {
      processedRef.current = true;
      addLog('Starting token processing...');
      
      try {
        // 해시에서 쿼리 파라미터 파싱 (Ex: #/auth/callback?token=...)
        const hash = window.location.hash;
        addLog(`Hash: ${hash}`);
        
        const queryString = hash.split('?')[1];
        if (!queryString) {
          throw new Error('No query parameters found in hash');
        }
        
        const params = new URLSearchParams(queryString);
        const token = params.get('token');
        addLog(`Token: ${token ? token.substring(0, 8) + '...' : 'null'}`);

        if (!token) {
          throw new Error('No token found in URL');
        }

        addLog('Calling exchangeToken API...');
        
        // 타임아웃 설정 (10초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          await authApi.exchangeToken(token);
          clearTimeout(timeoutId);
          addLog('Token exchange successful!');
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Token exchange timed out (10s)');
          }
          throw fetchError;
        }
        
        setStatus('success');
        addLog('Refreshing user info...');
        
        // 유저 정보 갱신
        await refreshUser();
        addLog('User refresh complete');
        
        // 약간의 딜레이 후 메인 화면으로 이동
        setTimeout(() => {
          addLog('Redirecting to main...');
          window.location.hash = '';
        }, 500);
        
      } catch (err) {
        console.error('Auth Callback Error:', err);
        addLog(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    processToken();
  }, []); // refreshUser 의존성 제거 - 한 번만 실행

  return (
    <div className="flex items-center justify-center h-screen bg-terminal-bg font-mono">
      <div className="text-center max-w-md">
        <h1 className="text-xl text-terminal-green mb-4">$ AUTH_SEQUENCE</h1>
        
        {status === 'processing' && (
          <div className="text-terminal-text">
            <span>Processing token exchange...</span>
            <span className="animate-pulse">_</span>
          </div>
        )}

        {status === 'success' && (
          <div className="text-terminal-green">
            <span>[SUCCESS] Session established. Redirecting...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-500">
            <div>[ERROR] Authentication failed</div>
            <div className="text-sm opacity-70 mt-2">{errorMessage}</div>
            <button 
                className="mt-4 px-4 py-2 border border-red-500 hover:bg-red-500/10"
                onClick={() => window.location.hash = ''}
            >
                Return to Main
            </button>
          </div>
        )}

        {/* Debug Log */}
        <div className="mt-6 text-left text-xs text-terminal-text/50 max-h-32 overflow-y-auto">
          {debugLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;

