import React, { useState, useRef } from 'react';
import { SnippetNode } from '../../store/editorStore';

interface NodeDisplayProps {
  node: SnippetNode;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onDrag: (nodeId: string, x: number, y: number) => void;
  onDelete: () => void;
  onConnectionStart: (nodeId: string, portX: number, portY: number) => void;
  onConnectionEnd: () => void;
  onPlay: () => void;
  scale: number;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;
const HEADER_HEIGHT = 30;
const PORT_RADIUS = 6;

const NodeDisplay: React.FC<NodeDisplayProps> = ({
  node, isSelected, isPlaying, onSelect, onDrag, onDelete,
  onConnectionStart, onConnectionEnd, onPlay, scale
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).classList.contains('node-port')) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX / scale - node.x,
      y: e.clientY / scale - node.y,
    };

    const handleMove = (ev: MouseEvent) => {
      onDrag(
        node.id,
        ev.clientX / scale - dragOffset.current.x,
        ev.clientY / scale - dragOffset.current.y
      );
    };

    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Scene preview - miniature view of attached scene boxes
  const renderScenePreview = () => {
    if (!node.attachedScene) return null;
    return (
      <g transform={`translate(${node.x + 10}, ${node.y + HEADER_HEIGHT + 5})`}>
        {node.attachedScene.boxes.map((box, i) => {
          const previewX = (box.x / 100) * (NODE_WIDTH - 20);
          const previewY = (box.y / 100) * 35;
          const previewW = (box.width / 100) * (NODE_WIDTH - 20);
          const previewH = (box.height / 100) * 35;
          return (
            <rect
              key={i}
              x={previewX}
              y={previewY}
              width={Math.max(previewW, 8)}
              height={Math.max(previewH, 8)}
              rx="2"
              fill={box.party ? '#dbeafe' : '#e5e7eb'}
              stroke={box.party ? '#3b82f6' : '#9ca3af'}
              strokeWidth="0.5"
            />
          );
        })}
      </g>
    );
  };

  const speakerCount = node.speakers?.length || 0;

  return (
    <g className="node-display" onMouseDown={handleMouseDown}>
      {/* Node shadow */}
      <rect
        x={node.x + 2}
        y={node.y + 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx="8"
        fill="rgba(0,0,0,0.1)"
      />

      {/* Node body */}
      <rect
        x={node.x}
        y={node.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx="8"
        fill="white"
        stroke={isSelected ? '#3b82f6' : isPlaying ? '#10b981' : '#d1d5db'}
        strokeWidth={isSelected ? 2 : 1}
        className="node-body"
      />

      {/* Header */}
      <rect
        x={node.x}
        y={node.y}
        width={NODE_WIDTH}
        height={HEADER_HEIGHT}
        rx="8"
        fill={isPlaying ? '#10b981' : '#1e293b'}
        className="node-header"
      />
      <rect
        x={node.x}
        y={node.y + HEADER_HEIGHT - 8}
        width={NODE_WIDTH}
        height={8}
        fill={isPlaying ? '#10b981' : '#1e293b'}
      />

      {/* Title */}
      <text
        x={node.x + 10}
        y={node.y + 19}
        fill="white"
        fontSize="11"
        fontWeight="600"
      >
        {node.title}
      </text>

      {/* Delete button */}
      <g
        className="node-delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={node.x + NODE_WIDTH - 14} cy={node.y + 15} r="8" fill="transparent" />
        <text
          x={node.x + NODE_WIDTH - 14}
          y={node.y + 19}
          fill="white"
          fontSize="12"
          textAnchor="middle"
          style={{ cursor: 'pointer' }}
        >
          &times;
        </text>
      </g>

      {/* Scene preview */}
      {renderScenePreview()}

      {/* Info section */}
      <g transform={`translate(${node.x + 10}, ${node.y + HEADER_HEIGHT + 45})`}>
        {/* Speakers */}
        <text fill="#6b7280" fontSize="9" y="0">
          Speakers: {speakerCount}
        </text>
        <text fill="#6b7280" fontSize="9" y="14">
          Turns: {node.turns || 5} | {node.interactionPattern || 'neutral'}
        </text>
        {node.subTopic && (
          <text fill="#374151" fontSize="9" fontWeight="500" y="28">
            {node.subTopic.substring(0, 30)}{node.subTopic.length > 30 ? '...' : ''}
          </text>
        )}
      </g>

      {/* Action bar */}
      <g transform={`translate(${node.x}, ${node.y + NODE_HEIGHT - 25})`}>
        <line x1="0" y1="0" x2={NODE_WIDTH} y2="0" stroke="#e5e7eb" strokeWidth="0.5" />

        {/* Play button */}
        <g
          className="node-play-btn"
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          style={{ cursor: 'pointer' }}
        >
          <rect x="5" y="3" width="50" height="18" rx="4" fill={isPlaying ? '#10b981' : '#3b82f6'} />
          <text x="30" y="15" fill="white" fontSize="9" textAnchor="middle" fontWeight="500">
            {isPlaying ? 'Playing' : 'Play'}
          </text>
        </g>
      </g>

      {/* Input port (left) */}
      <circle
        className="node-port input-port"
        cx={node.x}
        cy={node.y + 60}
        r={PORT_RADIUS}
        fill="#10b981"
        stroke="white"
        strokeWidth="2"
        onMouseUp={(e) => { e.stopPropagation(); onConnectionEnd(); }}
      />

      {/* Output port (right) */}
      <circle
        className="node-port output-port"
        cx={node.x + NODE_WIDTH}
        cy={node.y + 60}
        r={PORT_RADIUS}
        fill="#f59e0b"
        stroke="white"
        strokeWidth="2"
        onMouseDown={(e) => {
          e.stopPropagation();
          onConnectionStart(node.id, node.x + NODE_WIDTH, node.y + 60);
        }}
      />
    </g>
  );
};

export default NodeDisplay;
