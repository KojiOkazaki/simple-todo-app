import React, { useState } from 'react';
import useEditorStore, { SnippetNode, Connection, AvatarConfig } from '../../store/editorStore';

const interactionPatterns = ['neutral', 'positive', 'negative', 'questioning'];
const turnTakingModes = ['round-robin', 'free-form', 'directed'];

// Snippet Node Inspector
const SnippetInspector: React.FC<{ node: SnippetNode }> = ({ node }) => {
  const { updateNode, speakers, scenes } = useEditorStore();

  const handleUpdate = (field: string, value: any) => {
    updateNode(node.id, { [field]: value });
  };

  return (
    <div className="inspector-content">
      <div className="inspector-section">
        <label className="inspector-label">Title</label>
        <input
          type="text"
          className="inspector-input"
          value={node.title}
          onChange={(e) => handleUpdate('title', e.target.value)}
        />
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Sub Topic</label>
        <textarea
          className="inspector-textarea"
          value={node.subTopic || ''}
          onChange={(e) => handleUpdate('subTopic', e.target.value)}
          placeholder="Enter conversation topic..."
          rows={3}
        />
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Turns</label>
        <input
          type="number"
          className="inspector-input"
          value={node.turns || 5}
          min={1}
          max={20}
          onChange={(e) => handleUpdate('turns', parseInt(e.target.value))}
        />
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Interaction Pattern</label>
        <select
          className="inspector-select"
          value={node.interactionPattern || 'neutral'}
          onChange={(e) => handleUpdate('interactionPattern', e.target.value)}
        >
          {interactionPatterns.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Turn Taking</label>
        <select
          className="inspector-select"
          value={node.turnTakingMode || 'round-robin'}
          onChange={(e) => handleUpdate('turnTakingMode', e.target.value)}
        >
          {turnTakingModes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Attached Scene</label>
        <select
          className="inspector-select"
          value={node.attachedScene?.id || ''}
          onChange={(e) => {
            const scene = scenes.find(s => s.id === e.target.value);
            handleUpdate('attachedScene', scene || undefined);
          }}
        >
          <option value="">No scene</option>
          {scenes.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Speakers ({node.speakers?.length || 0})</label>
        <div className="inspector-speakers-list">
          {(node.speakers || []).map((speaker, i) => (
            <div key={i} className="inspector-speaker-item">
              <span className={`speaker-gender-dot ${speaker.gender}`} />
              <span className="speaker-name">{speaker.name}</span>
              <span className="speaker-personality">{speaker.personality || 'neutral'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Description</label>
        <textarea
          className="inspector-textarea"
          value={node.description || ''}
          onChange={(e) => handleUpdate('description', e.target.value)}
          placeholder="Optional description..."
          rows={2}
        />
      </div>
    </div>
  );
};

// Connection Inspector
const ConnectionInspector: React.FC<{ connection: Connection }> = ({ connection }) => {
  const { nodes, deleteConnection } = useEditorStore();

  const fromNode = nodes.find(n => n.id === connection.from);
  const toNode = nodes.find(n => n.id === connection.to);

  return (
    <div className="inspector-content">
      <div className="inspector-section">
        <label className="inspector-label">Connection</label>
        <div className="connection-info">
          <div className="connection-endpoint">
            <span className="connection-label">From:</span>
            <span className="connection-node-name">{fromNode?.title || connection.from}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <div className="connection-endpoint">
            <span className="connection-label">To:</span>
            <span className="connection-node-name">{toNode?.title || connection.to}</span>
          </div>
        </div>
      </div>

      <div className="inspector-section">
        <button className="btn-danger" onClick={() => deleteConnection(connection.id)}>
          Delete Connection
        </button>
      </div>
    </div>
  );
};

// Avatar Inspector
const AvatarInspector: React.FC<{ avatar: AvatarConfig }> = ({ avatar }) => {
  const { setSpeakers, speakers } = useEditorStore();

  const handleUpdate = (field: string, value: any) => {
    const updated = speakers.map(s =>
      s.id === avatar.id ? { ...s, [field]: value } : s
    );
    setSpeakers(updated);
  };

  return (
    <div className="inspector-content">
      <div className="inspector-section">
        <label className="inspector-label">Name</label>
        <input
          type="text"
          className="inspector-input"
          value={avatar.name}
          onChange={(e) => handleUpdate('name', e.target.value)}
        />
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Gender</label>
        <select
          className="inspector-select"
          value={avatar.gender}
          onChange={(e) => handleUpdate('gender', e.target.value)}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Personality</label>
        <select
          className="inspector-select"
          value={avatar.personality || 'neutral'}
          onChange={(e) => handleUpdate('personality', e.target.value)}
        >
          <option value="neutral">Neutral</option>
          <option value="friendly">Friendly</option>
          <option value="strict">Strict</option>
          <option value="analytical">Analytical</option>
          <option value="enthusiastic">Enthusiastic</option>
        </select>
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Role Description</label>
        <textarea
          className="inspector-textarea"
          value={avatar.roleDescription || ''}
          onChange={(e) => handleUpdate('roleDescription', e.target.value)}
          rows={3}
        />
      </div>

      <div className="inspector-section">
        <label className="inspector-label">ElevenLabs Voice ID</label>
        <select
          className="inspector-select"
          value={avatar.elevenlabsVoiceId || ''}
          onChange={(e) => handleUpdate('elevenlabsVoiceId', e.target.value)}
          style={{ marginBottom: '4px' }}
        >
          <option value="">-- プリセットから選択 --</option>
          <optgroup label="日本語対応 (Multilingual v2)">
            <option value="cgSgspJ2msm6clMCkdW9">Jessica (女性・落ち着き)</option>
            <option value="iP95p4xoKVk53GoZ742B">Chris (男性・ナレーター)</option>
            <option value="onwK4e9ZLuTAKqWW03F9">Daniel (男性・権威)</option>
            <option value="XB0fDUnXU5powFXDhCwa">Charlotte (女性・明るい)</option>
            <option value="pFZP5JQG7iQjIQuC4Bku">Lily (女性・温かい)</option>
            <option value="TX3LPaxmHKxFdv7VOQHJ">Liam (男性・自然)</option>
            <option value="bIHbv24MWmeRgasZH58o">Will (男性・フレンドリー)</option>
            <option value="nPczCjzI2devNBz1zQrb">Brian (男性・深い)</option>
          </optgroup>
          <optgroup label="クラシック">
            <option value="pNInz6obpgDQGcFmaJgB">Adam (男性・英語)</option>
            <option value="ErXwobaYiN019PkySvjV">Antoni (男性・英語)</option>
            <option value="VR6AewLTigWG4xSOukaG">Arnold (男性・英語)</option>
          </optgroup>
        </select>
        <input
          type="text"
          className="inspector-input"
          value={avatar.elevenlabsVoiceId || ''}
          onChange={(e) => handleUpdate('elevenlabsVoiceId', e.target.value)}
          placeholder="またはVoice IDを直接入力"
          style={{ marginTop: '4px' }}
        />
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Voice (ブラウザ音声フォールバック)</label>
        <input
          type="text"
          className="inspector-input"
          value={avatar.voice || ''}
          onChange={(e) => handleUpdate('voice', e.target.value)}
        />
      </div>

      <div className="inspector-section">
        <label className="inspector-label">Avatar Model</label>
        <select
          className="inspector-select"
          value={avatar.url || '/assets/male-avatar1.glb'}
          onChange={(e) => handleUpdate('url', e.target.value)}
        >
          <option value="/assets/male-avatar1.glb">Male Avatar 1</option>
          <option value="/assets/male-avatar2.glb">Male Avatar 2</option>
          <option value="/assets/male-avatar3.glb">Male Avatar 3</option>
          <option value="/assets/male-avatar4.glb">Male Avatar 4</option>
          <option value="/assets/male-avatar5.glb">Male Avatar 5</option>
          <option value="/assets/female-avatar1.glb">Female Avatar 1</option>
          <option value="/assets/female-avatar2.glb">Female Avatar 2</option>
        </select>
      </div>
    </div>
  );
};

// Main Inspector Component
const Inspector: React.FC = () => {
  const { selectedItem, closeInspector, speakers } = useEditorStore();

  if (!selectedItem) {
    return (
      <div className="inspector-panel">
        <div className="inspector-header">
          <span>Inspector</span>
        </div>
        <div className="inspector-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p>Select a node or connection to inspect</p>
        </div>
      </div>
    );
  }

  const isNode = 'type' in selectedItem && (selectedItem as SnippetNode).type === 'snippet';
  const isConnection = 'from' in selectedItem && 'to' in selectedItem;
  const isAvatar = 'gender' in selectedItem && 'voice' in selectedItem && !isNode && !isConnection;

  return (
    <div className="inspector-panel">
      <div className="inspector-header">
        <span>
          {isNode ? 'Snippet Inspector' : isConnection ? 'Connection' : isAvatar ? 'Avatar Inspector' : 'Inspector'}
        </span>
        <button className="inspector-close-btn" onClick={closeInspector}>&times;</button>
      </div>

      {isNode && <SnippetInspector node={selectedItem as SnippetNode} />}
      {isConnection && <ConnectionInspector connection={selectedItem as Connection} />}
      {isAvatar && <AvatarInspector avatar={selectedItem as unknown as AvatarConfig} />}
    </div>
  );
};

export default Inspector;
