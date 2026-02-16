import React, { useState } from 'react';
import useEditorStore, { AvatarConfig } from '../../store/editorStore';
import PanelHeader from '../ui/PanelHeader';

// Predefined interview avatar templates
const avatarTemplates: Omit<AvatarConfig, 'id'>[] = [
  {
    name: '田中 部長',
    gender: 'male',
    voice: 'ja-JP-Standard-C',
    personality: 'neutral',
    roleDescription: '人事部長。経験豊富で冷静に本質を見抜く。',
    url: '/assets/male-avatar1.glb',
    settings: { body: 'M', cameraDistance: 0.4, cameraRotateY: 0, cameraView: 'upper', lipsyncLang: 'en', mood: 'neutral', ttsLang: 'ja-JP' },
  },
  {
    name: '鈴木 課長',
    gender: 'male',
    voice: 'ja-JP-Standard-D',
    personality: 'friendly',
    roleDescription: '現場マネージャー。親しみやすく実務経験を重視。',
    url: '/assets/male-avatar3.glb',
    settings: { body: 'M', cameraDistance: 0.4, cameraRotateY: 0, cameraView: 'upper', lipsyncLang: 'en', mood: 'neutral', ttsLang: 'ja-JP' },
  },
  {
    name: '山田 取締役',
    gender: 'male',
    voice: 'ja-JP-Standard-B',
    personality: 'strict',
    roleDescription: '役員。厳しく論理性と高い志を求める。',
    url: '/assets/male-avatar5.glb',
    settings: { body: 'M', cameraDistance: 0.4, cameraRotateY: 0, cameraView: 'upper', lipsyncLang: 'en', mood: 'neutral', ttsLang: 'ja-JP' },
  },
  {
    name: '佐藤 主任',
    gender: 'male',
    voice: 'ja-JP-Standard-A',
    personality: 'analytical',
    roleDescription: '技術リーダー。技術的な深さを重視する。',
    url: '/assets/male-avatar4.glb',
    settings: { body: 'M', cameraDistance: 0.4, cameraRotateY: 0, cameraView: 'upper', lipsyncLang: 'en', mood: 'neutral', ttsLang: 'ja-JP' },
  },
  {
    name: '渡辺 人事',
    gender: 'female',
    voice: 'ja-JP-Standard-A',
    personality: 'enthusiastic',
    roleDescription: '採用担当。圧迫面接で候補者の耐性をテスト。',
    url: '/assets/female-avatar1.glb',
    settings: { body: 'F', cameraDistance: 0.4, cameraRotateY: 0, cameraView: 'upper', lipsyncLang: 'en', mood: 'neutral', ttsLang: 'ja-JP' },
  },
  {
    name: 'Alice',
    gender: 'female',
    voice: 'en-GB-Standard-A',
    personality: 'analytical',
    roleDescription: 'Senior researcher. Analytical and methodical.',
    url: '/assets/female-avatar2.glb',
    settings: { body: 'F', cameraDistance: 0.4, cameraRotateY: 0, cameraView: 'upper', lipsyncLang: 'en', mood: 'neutral', ttsLang: 'en-GB' },
  },
  {
    name: 'Bob',
    gender: 'male',
    voice: 'en-GB-Standard-B',
    personality: 'enthusiastic',
    roleDescription: 'Enthusiastic researcher. Passionate about innovation.',
    url: '/assets/male-avatar2.glb',
    settings: { body: 'M', cameraDistance: 0.4, cameraRotateY: 0, cameraView: 'upper', lipsyncLang: 'en', mood: 'neutral', ttsLang: 'en-GB' },
  },
];

const AvatarLibrary: React.FC = () => {
  const { speakers, setSpeakers, setSelectedItem } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const addSpeaker = (template: typeof avatarTemplates[number]) => {
    const id = `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newSpeaker = { id, ...template } as AvatarConfig;
    setSpeakers([...speakers, newSpeaker]);
  };

  const removeSpeaker = (id: string) => {
    setSpeakers(speakers.filter(s => s.id !== id));
  };

  return (
    <div className="avatar-library">
      <PanelHeader
        title="Avatar Library"
        isEditing={isExpanded}
        onToggleEdit={() => setIsExpanded(!isExpanded)}
        rightContent={
          <span className="avatar-count">{speakers.length}</span>
        }
      />

      {isExpanded && (
        <>
          {/* Current speakers */}
          <div className="avatar-current-list">
            <div className="avatar-list-header">Active Speakers</div>
            {speakers.map(speaker => (
              <div
                key={speaker.id}
                className="avatar-list-item"
                onClick={() => setSelectedItem(speaker as any)}
              >
                <span className={`speaker-gender-dot ${speaker.gender}`} />
                <div className="avatar-list-info">
                  <span className="avatar-list-name">{speaker.name}</span>
                  <span className="avatar-list-role">{speaker.personality}</span>
                </div>
                <button
                  className="avatar-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSpeaker(speaker.id);
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Template library */}
          <div className="avatar-templates">
            <div className="avatar-list-header">Templates</div>
            {avatarTemplates.map((template, i) => {
              const isActive = speakers.some(s => s.name === template.name);
              return (
                <div
                  key={i}
                  className={`avatar-template-item ${isActive ? 'active' : ''}`}
                  onClick={() => !isActive && addSpeaker(template)}
                >
                  <span className={`speaker-gender-dot ${template.gender}`} />
                  <div className="avatar-list-info">
                    <span className="avatar-list-name">{template.name}</span>
                    <span className="avatar-list-role">{template.personality}</span>
                  </div>
                  {isActive ? (
                    <span className="avatar-active-badge">Active</span>
                  ) : (
                    <span className="avatar-add-badge">+</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AvatarLibrary;
