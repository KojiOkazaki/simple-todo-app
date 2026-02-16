import React, { useRef, useState } from 'react';
import useEditorStore from '../store/editorStore';
import Header from './Header';
import ScenePanel from './scene/ScenePanel';
import NodeEditor from './nodeeditor/NodeEditor';
import Inspector from './inspector/Inspector';
import PreviewPanel from './preview/PreviewPanel';
import AvatarLibrary from './avatar/AvatarLibrary';
import InterviewPanel from './interview/InterviewPanel';
import PanelHeader from './ui/PanelHeader';

const Home: React.FC = () => {
  const { mode } = useEditorStore();
  const avatarInstancesRef = useRef<Record<string, any>>({});

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showScenePanel, setShowScenePanel] = useState(true);
  const [showConversationPanel, setShowConversationPanel] = useState(true);

  return (
    <>
      <Header />
      <div className="app-container">
        {mode === 'authoring' ? (
          <>
            {/* Left Panel - Avatar Library & Preview */}
            {showLeftPanel && (
              <div className="left-panel">
                <AvatarLibrary />

                <div className="left-panel-divider" />

                <PanelHeader
                  title="Preview Panel"
                  isEditing={showPreview}
                  onToggleEdit={() => setShowPreview(!showPreview)}
                />
                {showPreview && <PreviewPanel />}
              </div>
            )}

            {/* Main Content - Scene + Node Editor */}
            <div className="main-content">
              {/* Scene Panel (top) */}
              {showScenePanel && (
                <div className="main-top">
                  <ScenePanel avatarInstancesRef={avatarInstancesRef} />
                </div>
              )}

              {/* Node Editor (bottom) */}
              {showConversationPanel && (
                <div className="main-bottom">
                  <PanelHeader
                    title="Conversation Panel"
                    isEditing={showConversationPanel}
                    onToggleEdit={() => setShowConversationPanel(!showConversationPanel)}
                  />
                  <NodeEditor avatarInstancesRef={avatarInstancesRef} />
                </div>
              )}
            </div>

            {/* Right Panel - Inspector */}
            <Inspector />
          </>
        ) : mode === 'verification' ? (
          /* Interview Simulation Mode */
          <div className="interview-mode-layout">
            <div className="interview-scene-area">
              <ScenePanel avatarInstancesRef={avatarInstancesRef} />
            </div>
            <div className="interview-chat-area">
              <InterviewPanel avatarInstancesRef={avatarInstancesRef} />
            </div>
          </div>
        ) : (
          <div className="experience-placeholder">
            <h3>Experience Mode</h3>
            <p>Coming soon...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
