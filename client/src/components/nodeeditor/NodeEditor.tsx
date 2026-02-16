import React, { useState, useRef, useCallback, useEffect } from 'react';
import useEditorStore, { SnippetNode, Connection } from '../../store/editorStore';
import NodeDisplay from './NodeDisplay';
import NodeConnection from './NodeConnection';
import API_CONFIG from '../../config';

const NodeEditor: React.FC<{
  avatarInstancesRef: React.MutableRefObject<Record<string, any>>;
  onMessagesUpdate?: (msgs: any[]) => void;
}> = ({ avatarInstancesRef, onMessagesUpdate }) => {
  const {
    nodes, connections, speakers, scenes,
    addNode, updateNode, deleteNode,
    addConnection, deleteConnection,
    setSelectedItem, selectedItem,
    addMessage, setMessages, messages,
    currentProvider, currentModel,
  } = useEditorStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [drawingConnection, setDrawingConnection] = useState<{
    from: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNodeId, setPlayingNodeId] = useState<string | null>(null);

  // Convert screen coords to SVG coords
  const screenToSVG = useCallback((screenX: number, screenY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };
    return {
      x: (screenX - rect.left - translate.x) / scale,
      y: (screenY - rect.top - translate.y) / scale,
    };
  }, [scale, translate]);

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).classList.contains('editor-bg')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
      setSelectedItem(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTranslate({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
    if (drawingConnection) {
      const pos = screenToSVG(e.clientX, e.clientY);
      setDrawingConnection({
        ...drawingConnection,
        endX: pos.x,
        endY: pos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (drawingConnection) {
      setDrawingConnection(null);
    }
  };

  // Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, scale * delta));
    setScale(newScale);
  };

  // Add node
  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const viewCenter = screenToSVG(
      (svgRef.current?.clientWidth || 800) / 2,
      (svgRef.current?.clientHeight || 400) / 2
    );

    const newNode: SnippetNode = {
      id,
      type: 'snippet',
      title: `Snippet ${nodes.length + 1}`,
      x: viewCenter.x - 100,
      y: viewCenter.y - 60,
      speakers: [...speakers],
      subTopic: '',
      turns: 5,
      interactionPattern: 'neutral',
      turnTakingMode: 'round-robin',
      isScripted: false,
      attachedScene: scenes.length > 0 ? scenes[0] : undefined,
    };

    addNode(newNode);
    setSelectedItem(newNode);
  };

  // Start connection drawing
  const handleConnectionStart = (nodeId: string, portX: number, portY: number) => {
    setDrawingConnection({
      from: nodeId,
      startX: portX,
      startY: portY,
      endX: portX,
      endY: portY,
    });
  };

  // Complete connection
  const handleConnectionEnd = (targetNodeId: string) => {
    if (drawingConnection && drawingConnection.from !== targetNodeId) {
      const exists = connections.some(
        c => c.from === drawingConnection.from && c.to === targetNodeId
      );
      if (!exists) {
        addConnection({
          id: `conn-${Date.now()}`,
          from: drawingConnection.from,
          to: targetNodeId,
          condition: '',
        });
      }
    }
    setDrawingConnection(null);
  };

  // Node drag
  const handleNodeDrag = (nodeId: string, newX: number, newY: number) => {
    updateNode(nodeId, { x: newX, y: newY });
  };

  // Play conversation for a node
  const handlePlayNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setIsPlaying(true);
    setPlayingNodeId(nodeId);

    try {
      const speakers = node.speakers.map(s => ({
        name: s.name,
        personality: s.personality || 'neutral',
        roleDescription: s.roleDescription || '',
        voice: s.voice,
      }));

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START_CONVERSATION}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speakers,
          topic: node.subTopic || 'Interview discussion',
          turns: node.turns || 5,
          interactionPattern: node.interactionPattern || 'neutral',
          turnTakingMode: node.turnTakingMode || 'round-robin',
        }),
      });

      if (!response.ok) throw new Error('Failed to start conversation');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'message') {
              addMessage({
                id: `msg-${Date.now()}-${Math.random()}`,
                speaker: data.message.speaker || data.message.name,
                speakerName: data.message.name || data.message.speaker,
                content: data.message.content || data.message.message,
                timestamp: Date.now(),
                type: data.message.isSystemMessage ? 'system' : 'agent',
                avatarId: data.message.avatarId,
              });

              // Speak via avatar if available
              const avatarId = data.message.avatarId || data.message.speaker;
              const avatarInstance = avatarInstancesRef.current[avatarId];
              if (avatarInstance && data.message.content) {
                try {
                  await avatarInstance.speakText(data.message.content);
                } catch (speakErr) {
                  console.warn('Avatar speak error:', speakErr);
                }
              }
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }
    } catch (err) {
      console.error('Play node error:', err);
    } finally {
      setIsPlaying(false);
      setPlayingNodeId(null);
    }
  };

  // Play all connected nodes in sequence
  const handlePlayAll = async () => {
    if (nodes.length === 0) return;

    // Find starting nodes (no incoming connections)
    const hasIncoming = new Set(connections.map(c => c.to));
    const startNodes = nodes.filter(n => !hasIncoming.has(n.id));
    const startNode = startNodes.length > 0 ? startNodes[0] : nodes[0];

    // Build ordered list via connections
    const ordered: SnippetNode[] = [];
    const visited = new Set<string>();
    let current: SnippetNode | undefined = startNode;

    while (current && !visited.has(current.id)) {
      ordered.push(current);
      visited.add(current.id);
      const conn = connections.find(c => c.from === current!.id);
      current = conn ? nodes.find(n => n.id === conn.to) : undefined;
    }

    for (const node of ordered) {
      await handlePlayNode(node.id);
    }
  };

  // Get node port positions for connections
  const getNodeOutputPort = (node: SnippetNode) => ({
    x: node.x + 220,
    y: node.y + 60,
  });

  const getNodeInputPort = (node: SnippetNode) => ({
    x: node.x,
    y: node.y + 60,
  });

  return (
    <div className="node-editor">
      <div className="node-editor-toolbar">
        <button className="ne-btn" onClick={handleAddNode}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Snippet
        </button>
        <button
          className="ne-btn ne-play-btn"
          onClick={handlePlayAll}
          disabled={isPlaying || nodes.length === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          {isPlaying ? 'Playing...' : 'Play All'}
        </button>
        <div className="ne-zoom-info">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <svg
        ref={svgRef}
        className="node-editor-svg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <rect className="editor-bg" width="100%" height="100%" fill="transparent" />

        <g transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#grid)" />

          {/* Connections */}
          {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            const start = getNodeOutputPort(fromNode);
            const end = getNodeInputPort(toNode);
            return (
              <NodeConnection
                key={conn.id}
                connection={conn}
                startX={start.x}
                startY={start.y}
                endX={end.x}
                endY={end.y}
                isSelected={selectedItem?.id === conn.id}
                onClick={() => setSelectedItem(conn)}
                onDelete={() => deleteConnection(conn.id)}
              />
            );
          })}

          {/* Drawing connection preview */}
          {drawingConnection && (
            <path
              d={`M ${drawingConnection.startX} ${drawingConnection.startY} C ${drawingConnection.startX + 50} ${drawingConnection.startY}, ${drawingConnection.endX - 50} ${drawingConnection.endY}, ${drawingConnection.endX} ${drawingConnection.endY}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="6,3"
              opacity="0.7"
            />
          )}

          {/* Nodes */}
          {nodes.map(node => (
            <NodeDisplay
              key={node.id}
              node={node}
              isSelected={selectedItem?.id === node.id}
              isPlaying={playingNodeId === node.id}
              onSelect={() => setSelectedItem(node)}
              onDrag={handleNodeDrag}
              onDelete={() => deleteNode(node.id)}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={() => handleConnectionEnd(node.id)}
              onPlay={() => handlePlayNode(node.id)}
              scale={scale}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default NodeEditor;
