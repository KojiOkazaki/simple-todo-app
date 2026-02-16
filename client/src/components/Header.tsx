import React, { useState, useEffect, useRef } from 'react';
import useEditorStore from '../store/editorStore';
import API_CONFIG from '../config';

const Header: React.FC = () => {
  const { mode, setMode, currentProvider, currentModel, setCurrentModel, setCurrentProvider } = useEditorStore();
  const [models, setModels] = useState<Record<string, string>>({});
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchedRef = useRef(false);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LLM_MODELS}`);
      if (response.ok) {
        const data = await response.json();
        setModels(data.availableModels || {});
        if (data.currentProvider) setCurrentProvider(data.currentProvider);
        if (data.currentModel) setCurrentModel(data.currentModel);
      }
    } catch {
      // Server not running - use defaults from store
    }
  };

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchModels();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelChange = async (model: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_MODEL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: currentProvider, model }),
      });
      if (response.ok) {
        setCurrentModel(model);
        setShowModelDropdown(false);
      }
    } catch (err) {
      console.error('Error updating model:', err);
    }
  };

  const clearStorage = () => {
    if (window.confirm('全てのローカルストレージを削除しますか？')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <span className="header-logo">InterviewLab</span>
        <span className="header-sep">|</span>
        <span className="header-version">v1.0.0</span>
      </div>

      <div className="header-center">
        <button
          className={`header-mode-btn ${mode === 'authoring' ? 'active authoring' : ''}`}
          onClick={() => setMode('authoring')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <circle cx="11" cy="11" r="2" />
          </svg>
          Authoring
        </button>
        <button
          className={`header-mode-btn ${mode === 'verification' ? 'active verification' : ''}`}
          onClick={() => setMode('verification')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Verification
        </button>
      </div>

      <div className="header-right">
        <button className="header-btn" onClick={clearStorage}>Clear Storage</button>

        <div className="model-selector" ref={dropdownRef}>
          <button
            className="header-btn model-btn"
            onClick={async () => {
              if (!showModelDropdown) await fetchModels();
              setShowModelDropdown(!showModelDropdown);
            }}
          >
            <span className={`provider-dot ${currentProvider}`} />
            <span>{currentModel || 'Select Model'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showModelDropdown && (
            <div className="model-dropdown">
              <div className="model-dropdown-header">
                {currentProvider === 'gemini' ? 'Gemini Models' : 'OpenAI Models'}
              </div>
              {Object.values(models).map((model) => (
                <div
                  key={model}
                  className={`model-option ${model === currentModel ? 'active' : ''}`}
                  onClick={() => handleModelChange(model)}
                >
                  <span className={`provider-dot ${currentProvider}`} />
                  {model}
                  {model === currentModel && <span className="check">&#10003;</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
