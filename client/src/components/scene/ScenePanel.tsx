import React, { useState, useEffect, useRef, useCallback } from 'react';
import useEditorStore, { Scene, SceneBox, AvatarConfig } from '../../store/editorStore';
import PanelHeader from '../ui/PanelHeader';

// Avatar box within a scene - hosts TalkingHead 3D avatar
const AvatarBox: React.FC<{
  box: SceneBox;
  sceneId: string;
  avatarInstancesRef: React.MutableRefObject<Record<string, any>>;
  registerAvatar: (id: string, instance: any) => void;
  removeAvatar: (id: string) => void;
}> = ({ box, avatarInstancesRef, registerAvatar, removeAvatar }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const thContainerRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wrapperRef.current || box.elements.length === 0) return;

    const avatarElement = box.elements.find(e => e.elementType === 'avatar');
    if (!avatarElement?.avatarData) return;

    let cancelled = false;

    const initAvatar = async () => {
      try {
        const { TalkingHead } = await import('../../libs/talkinghead.mjs');

        if (cancelled || !wrapperRef.current) return;

        // Create a standalone DOM element for TalkingHead (outside React's virtual DOM)
        if (thContainerRef.current && wrapperRef.current.contains(thContainerRef.current)) {
          wrapperRef.current.removeChild(thContainerRef.current);
        }
        const thDiv = document.createElement('div');
        thDiv.style.width = '100%';
        thDiv.style.height = '100%';
        thContainerRef.current = thDiv;
        wrapperRef.current.appendChild(thDiv);

        const head = new TalkingHead(thDiv, {
          ttsEndpoint: '/api/tts',
          lipsyncLang: avatarElement.avatarData!.settings?.lipsyncLang || 'en',
          lipsyncModules: ['en'],
        });

        const avatarUrl = avatarElement.avatarData!.settings?.url || '/assets/male-avatar1.glb';
        const bodyType = avatarElement.avatarData!.settings?.body || 'M';

        await head.showAvatar({
          url: avatarUrl,
          body: bodyType,
          avatarMood: avatarElement.avatarData!.settings?.mood || 'neutral',
          ttsVoice: avatarElement.avatarData!.settings?.voice || 'en-GB-Standard-A',
          lipsyncLang: avatarElement.avatarData!.settings?.lipsyncLang || 'en',
        }, (ev: any) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            if (pct % 25 === 0) console.log(`Loading avatar: ${pct}%`);
          }
        });

        if (cancelled) return;

        if (avatarElement.avatarData!.settings?.cameraView) {
          head.setView(
            avatarElement.avatarData!.settings.cameraView,
            avatarElement.avatarData!.settings.cameraDistance || 0.4,
            avatarElement.avatarData!.settings.cameraRotateY || 0
          );
        }

        const canvas = thDiv.querySelector('canvas');
        if (canvas) {
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.borderRadius = '8px';
        }

        headRef.current = head;
        registerAvatar(avatarElement.avatarData!.id, head);
        setLoaded(true);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load TalkingHead avatar:', err);
        setError(err.message || 'Avatar load failed');
        setLoaded(false);
      }
    };

    initAvatar();

    return () => {
      cancelled = true;
      const avatarEl = box.elements.find(e => e.elementType === 'avatar');
      if (avatarEl?.avatarData) {
        removeAvatar(avatarEl.avatarData.id);
      }
      // Dispose TalkingHead instance if it has a dispose method
      if (headRef.current) {
        try { headRef.current.stop?.(); } catch {}
        try { headRef.current.dispose?.(); } catch {}
      }
      // Explicitly lose WebGL context to prevent "Too many active WebGL contexts"
      if (thContainerRef.current) {
        const canvas = thContainerRef.current.querySelector('canvas');
        if (canvas) {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (gl) {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
          }
        }
      }
      // Remove TalkingHead container manually (outside React's control)
      if (thContainerRef.current && wrapperRef.current) {
        try { wrapperRef.current.removeChild(thContainerRef.current); } catch {}
        thContainerRef.current = null;
      }
      headRef.current = null;
    };
  }, [box.elements]);

  const avatarData = box.elements.find(e => e.elementType === 'avatar')?.avatarData;

  return (
    <div
      className="scene-avatar-box"
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
    >
      <div ref={wrapperRef} className="avatar-3d-container">
        {!loaded && !error && (
          <div className="avatar-loading">
            <div className="loading-spinner" />
            <span>Loading 3D Avatar...</span>
          </div>
        )}
        {error && (
          <div className="avatar-fallback">
            <div className="avatar-fallback-icon">
              {avatarData?.gender === 'female' ? '👩' : '👨'}
            </div>
            <span className="avatar-fallback-name">{avatarData?.name || 'Avatar'}</span>
          </div>
        )}
      </div>
      {avatarData && (
        <div className="avatar-name-plate">
          {avatarData.name}
        </div>
      )}
      {box.party && (
        <div className="avatar-party-badge">{box.party}</div>
      )}
    </div>
  );
};

const ScenePanel: React.FC<{
  avatarInstancesRef: React.MutableRefObject<Record<string, any>>;
}> = ({ avatarInstancesRef }) => {
  const {
    scenes, activeSceneId, setActiveSceneId, addScene, updateScene, deleteScene,
    speakers, setSelectedItem
  } = useEditorStore();

  const [showNewSceneModal, setShowNewSceneModal] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');

  const activeScene = scenes.find(s => s.id === activeSceneId);

  const registerAvatar = useCallback((id: string, instance: any) => {
    avatarInstancesRef.current[id] = instance;
  }, [avatarInstancesRef]);

  const removeAvatar = useCallback((id: string) => {
    delete avatarInstancesRef.current[id];
  }, [avatarInstancesRef]);

  const createNewScene = () => {
    const id = `scene-${Date.now()}`;
    const name = newSceneName || `Scene ${scenes.length + 1}`;

    // Create boxes from current speakers
    const boxes: SceneBox[] = speakers.map((speaker, index) => ({
      id: `box-${id}-${index}`,
      x: 10 + (index * 30),
      y: 10,
      width: 25,
      height: 80,
      party: null,
      elements: [{
        id: `el-${id}-${index}`,
        elementType: 'avatar' as const,
        avatarData: {
          id: speaker.id,
          name: speaker.name,
          gender: speaker.gender,
          elementType: 'avatar',
          settings: {
            body: speaker.settings?.body || 'M',
            cameraDistance: speaker.settings?.cameraDistance || 0.4,
            cameraRotateY: 0,
            cameraView: 'upper',
            lipsyncLang: 'en',
            mood: 'neutral',
            ttsLang: speaker.settings?.ttsLang || 'ja-JP',
            url: speaker.url || '/assets/male-avatar1.glb',
            voice: speaker.voice,
          },
        },
      }],
      layoutMode: 'vertical',
      elementRatio: 1,
      view: 'upper',
    }));

    const scene: Scene = {
      id,
      name,
      boxes,
      backgroundImage: null,
      hasUnsavedChanges: false,
    };

    addScene(scene);
    setActiveSceneId(id);
    setShowNewSceneModal(false);
    setNewSceneName('');
  };

  return (
    <div className="scene-panel">
      <PanelHeader
        title="Scene Panel"
        rightContent={
          <div className="scene-header-actions">
            <button className="scene-add-btn" onClick={() => setShowNewSceneModal(true)}>
              + New Scene
            </button>
          </div>
        }
      />

      {/* Scene tabs */}
      <div className="scene-tabs">
        {scenes.map(scene => (
          <button
            key={scene.id}
            className={`scene-tab ${scene.id === activeSceneId ? 'active' : ''}`}
            onClick={() => setActiveSceneId(scene.id)}
          >
            {scene.name}
            <span
              className="scene-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete scene "${scene.name}"?`)) {
                  deleteScene(scene.id);
                }
              }}
            >
              &times;
            </span>
          </button>
        ))}
      </div>

      {/* Scene viewport */}
      <div className="scene-viewport">
        {activeScene ? (
          <div className="scene-canvas">
            {activeScene.boxes.map(box => (
              <AvatarBox
                key={box.id}
                box={box}
                sceneId={activeScene.id}
                avatarInstancesRef={avatarInstancesRef}
                registerAvatar={registerAvatar}
                removeAvatar={removeAvatar}
              />
            ))}
          </div>
        ) : (
          <div className="scene-empty">
            <div className="scene-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <p>No scene selected</p>
            <button className="scene-create-btn" onClick={() => setShowNewSceneModal(true)}>
              Create Scene
            </button>
          </div>
        )}
      </div>

      {/* New scene modal */}
      {showNewSceneModal && (
        <div className="modal-overlay" onClick={() => setShowNewSceneModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>New Scene</h3>
            <input
              type="text"
              value={newSceneName}
              onChange={e => setNewSceneName(e.target.value)}
              placeholder="Scene name..."
              className="modal-input"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && createNewScene()}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowNewSceneModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createNewScene}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenePanel;
