import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Avatar Config ---
export interface AvatarConfig {
  id: string;
  name: string;
  gender: string;
  voice: string;
  personality?: string;
  roleDescription?: string;
  party?: string;
  url?: string;
  settings?: {
    body: string;
    cameraDistance: number;
    cameraRotateY: number;
    cameraView: string;
    lipsyncLang: string;
    mood: string;
    ttsLang: string;
    url?: string;
    voice?: string;
  };
  [key: string]: any;
}

// --- Scene ---
export interface SceneElement {
  id: string;
  elementType: 'avatar' | 'content';
  avatarData?: {
    id: string;
    name: string;
    gender: string;
    elementType: string;
    settings: Record<string, any>;
    isHuman?: boolean;
  };
}

export interface SceneBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  party: string | null;
  elements: SceneElement[];
  layoutMode: string;
  elementRatio: number;
  view: string;
}

export interface Scene {
  id: string;
  name: string;
  boxes: SceneBox[];
  backgroundImage: string | null;
  hasUnsavedChanges: boolean;
}

// --- Node ---
export interface SnippetNode {
  id: string;
  type: 'snippet';
  title: string;
  x: number;
  y: number;
  speakers: AvatarConfig[];
  subTopic?: string;
  turns?: number;
  interactionPattern?: string;
  turnTakingMode?: string;
  attachedScene?: Scene;
  isScripted?: boolean;
  description?: string;
  conversationPrompt?: string;
  audioSegments?: AudioSegment[];
  totalDuration?: number;
  initiator?: AvatarConfig;
}

export interface AudioSegment {
  avatarId: string;
  avatarName: string;
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
}

// --- Connection ---
export interface Connection {
  id: string;
  from: string;
  to: string;
  condition: string;
}

// --- Message ---
export interface ConversationMessage {
  id: string;
  speaker: string;
  speakerName: string;
  content: string;
  timestamp: number;
  type: 'agent' | 'human' | 'system';
  avatarId?: string;
  isDerailing?: boolean;
  needsApproval?: boolean;
  isApproved?: boolean;
  isSystemMessage?: boolean;
}

// --- Store ---
export interface EditorState {
  // Mode
  mode: 'authoring' | 'experience' | 'verification';
  setMode: (mode: 'authoring' | 'experience' | 'verification') => void;

  // Selected item
  selectedItem: SnippetNode | Connection | null;
  setSelectedItem: (item: SnippetNode | Connection | null) => void;
  closeInspector: () => void;

  // Nodes
  nodes: SnippetNode[];
  addNode: (node: SnippetNode) => void;
  updateNode: (nodeId: string, updates: Partial<SnippetNode>) => void;
  deleteNode: (nodeId: string) => void;

  // Connections
  connections: Connection[];
  addConnection: (connection: Connection) => void;
  deleteConnection: (connectionId: string) => void;

  // Scenes
  scenes: Scene[];
  activeSceneId: string | null;
  setScenes: (scenes: Scene[]) => void;
  setActiveSceneId: (id: string | null) => void;
  addScene: (scene: Scene) => void;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (sceneId: string) => void;

  // Speakers
  speakers: AvatarConfig[];
  setSpeakers: (speakers: AvatarConfig[]) => void;

  // Messages
  messages: ConversationMessage[];
  addMessage: (msg: ConversationMessage) => void;
  setMessages: (msgs: ConversationMessage[]) => void;
  clearMessages: () => void;

  // Conversation mode
  conversationMode: 'human-control' | 'autonomous';
  setConversationMode: (mode: 'human-control' | 'autonomous') => void;

  // Provider
  currentProvider: string;
  currentModel: string;
  setCurrentProvider: (provider: string) => void;
  setCurrentModel: (model: string) => void;
}

// Default speakers for interview simulation
const defaultInterviewSpeakers: AvatarConfig[] = [
  {
    id: 'tanaka',
    name: '田中 部長',
    gender: 'male',
    voice: 'ja-JP-Standard-C',
    elevenlabsVoiceId: 'iP95p4xoKVk53GoZ742B', // Chris - 多言語対応・落ち着いた男性ナレーター
    personality: 'neutral',
    roleDescription: '人事部長。経験豊富で冷静に本質を見抜く。',
    url: '/assets/male-avatar1.glb',
    settings: {
      body: 'M',
      cameraDistance: 0.4,
      cameraRotateY: 0,
      cameraView: 'upper',
      lipsyncLang: 'en',
      mood: 'neutral',
      ttsLang: 'ja-JP',
    },
  },
  {
    id: 'suzuki',
    name: '鈴木 課長',
    gender: 'male',
    voice: 'ja-JP-Standard-D',
    elevenlabsVoiceId: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - 多言語対応・明るい男性
    personality: 'friendly',
    roleDescription: '現場マネージャー。親しみやすく実務経験を重視。',
    url: '/assets/male-avatar3.glb',
    settings: {
      body: 'M',
      cameraDistance: 0.4,
      cameraRotateY: 0,
      cameraView: 'upper',
      lipsyncLang: 'en',
      mood: 'neutral',
      ttsLang: 'ja-JP',
    },
  },
  {
    id: 'yamada',
    name: '山田 取締役',
    gender: 'male',
    voice: 'ja-JP-Standard-B',
    elevenlabsVoiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel - 多言語対応・権威ある男性
    personality: 'strict',
    roleDescription: '役員。厳しく論理性と高い志を求める。',
    url: '/assets/male-avatar5.glb',
    settings: {
      body: 'M',
      cameraDistance: 0.4,
      cameraRotateY: 0,
      cameraView: 'upper',
      lipsyncLang: 'en',
      mood: 'neutral',
      ttsLang: 'ja-JP',
    },
  },
];

// Ensure speakers have elevenlabsVoiceId (fix stale localStorage)
const ensureVoiceIds = (speakers: AvatarConfig[]): AvatarConfig[] => {
  const voiceMap: Record<string, string> = {
    tanaka: 'iP95p4xoKVk53GoZ742B',  // Chris
    suzuki: 'TX3LPaxmHKxFdv7VOQHJ',  // Liam
    yamada: 'onwK4e9ZLuTAKqWW03F9',  // Daniel
  };
  return speakers.map(s => {
    if (!s.elevenlabsVoiceId && voiceMap[s.id]) {
      return { ...s, elevenlabsVoiceId: voiceMap[s.id] };
    }
    return s;
  });
};

const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Mode
      mode: 'authoring',
      setMode: (mode) => set({ mode }),

      // Selected item
      selectedItem: null,
      setSelectedItem: (item) => set({ selectedItem: item }),
      closeInspector: () => set({ selectedItem: null }),

      // Nodes
      nodes: [],
      addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
      updateNode: (nodeId, updates) =>
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
          selectedItem:
            state.selectedItem?.id === nodeId
              ? { ...state.selectedItem, ...updates }
              : state.selectedItem,
        })),
      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          connections: state.connections.filter((c) => c.from !== nodeId && c.to !== nodeId),
          selectedItem: state.selectedItem?.id === nodeId ? null : state.selectedItem,
        })),

      // Connections
      connections: [],
      addConnection: (connection) =>
        set((state) => ({ connections: [...state.connections, connection] })),
      deleteConnection: (connectionId) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== connectionId),
          selectedItem:
            state.selectedItem?.id === connectionId ? null : state.selectedItem,
        })),

      // Scenes
      scenes: [],
      activeSceneId: null,
      setScenes: (scenes) => set({ scenes }),
      setActiveSceneId: (id) => set({ activeSceneId: id }),
      addScene: (scene) => set((state) => ({ scenes: [...state.scenes, scene] })),
      updateScene: (sceneId, updates) =>
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s)),
        })),
      deleteScene: (sceneId) =>
        set((state) => ({
          scenes: state.scenes.filter((s) => s.id !== sceneId),
          activeSceneId: state.activeSceneId === sceneId ? null : state.activeSceneId,
        })),

      // Speakers
      speakers: defaultInterviewSpeakers,
      setSpeakers: (speakers) => set({ speakers }),

      // Messages
      messages: [],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      setMessages: (msgs) => set({ messages: msgs }),
      clearMessages: () => set({ messages: [] }),

      // Conversation mode
      conversationMode: 'autonomous',
      setConversationMode: (mode) => set({ conversationMode: mode }),

      // Provider
      currentProvider: 'gemini',
      currentModel: 'gemini-2.0-flash',
      setCurrentProvider: (provider) => set({ currentProvider: provider }),
      setCurrentModel: (model) => set({ currentModel: model }),
    }),
    {
      name: 'interview-editor-storage',
      version: 2,
      partialize: (state) => ({
        nodes: state.nodes,
        connections: state.connections,
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
        speakers: state.speakers,
        conversationMode: state.conversationMode,
        currentProvider: state.currentProvider,
        currentModel: state.currentModel,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version < 1 && persistedState.speakers) {
          persistedState.speakers = ensureVoiceIds(persistedState.speakers);
        }
        // v2: update to multilingual voices for better Japanese
        if (version < 2 && persistedState.speakers) {
          const oldToNew: Record<string, string> = {
            'pNInz6obpgDQGcFmaJgB': 'iP95p4xoKVk53GoZ742B',  // Adam → Chris
            'ErXwobaYiN019PkySvjV': 'TX3LPaxmHKxFdv7VOQHJ',  // Antoni → Liam
            'VR6AewLTigWG4xSOukaG': 'onwK4e9ZLuTAKqWW03F9',  // Arnold → Daniel
          };
          persistedState.speakers = persistedState.speakers.map((s: any) => {
            if (s.elevenlabsVoiceId && oldToNew[s.elevenlabsVoiceId]) {
              return { ...s, elevenlabsVoiceId: oldToNew[s.elevenlabsVoiceId] };
            }
            return s;
          });
        }
        return persistedState;
      },
    }
  )
);

export default useEditorStore;
