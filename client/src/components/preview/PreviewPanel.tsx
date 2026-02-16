import React, { useRef, useEffect } from 'react';
import useEditorStore from '../../store/editorStore';

const PreviewPanel: React.FC = () => {
  const { messages, clearMessages, conversationMode, setConversationMode } = useEditorStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <div className="preview-mode-toggle">
          <button
            className={`preview-mode-btn ${conversationMode === 'autonomous' ? 'active' : ''}`}
            onClick={() => setConversationMode('autonomous')}
          >
            Auto
          </button>
          <button
            className={`preview-mode-btn ${conversationMode === 'human-control' ? 'active' : ''}`}
            onClick={() => setConversationMode('human-control')}
          >
            Manual
          </button>
        </div>
        {messages.length > 0 && (
          <button className="preview-clear-btn" onClick={clearMessages}>
            Clear
          </button>
        )}
      </div>

      <div className="preview-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="preview-empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No messages yet</p>
            <span>Play a snippet to see the conversation</span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`preview-message ${msg.type}`}
            >
              {msg.type !== 'system' && (
                <div className="preview-message-header">
                  <span className="preview-speaker-name">{msg.speakerName}</span>
                  <span className="preview-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div className="preview-message-content">
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
