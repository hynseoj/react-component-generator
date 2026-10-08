import { useState, useEffect, useRef } from 'react';

interface CodeViewProps {
  code: string;
  isStreaming?: boolean;
}

export function CodeView({ code, isStreaming = false }: CodeViewProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  const followCode = useRef(true);

  useEffect(() => {
    if (isStreaming && followCode.current && codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [code, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-panel">
      <div className="panel-header">
        <h3>{isStreaming ? '코드 생성 중...' : 'Source code'}</h3>
        <button className="btn-copy" onClick={handleCopy} disabled={isStreaming}>
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <pre className={`code-block${isStreaming ? ' code-block--streaming' : ''}`} ref={codeRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          followCode.current = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
        }}>
        <code>{code || (isStreaming ? '첫 번째 코드를 기다리고 있습니다...' : '')}</code>
      </pre>
    </div>
  );
}
