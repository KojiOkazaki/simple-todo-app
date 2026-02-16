import React from 'react';
import { Connection } from '../../store/editorStore';

interface NodeConnectionProps {
  connection: Connection;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const NodeConnection: React.FC<NodeConnectionProps> = ({
  connection, startX, startY, endX, endY, isSelected, onClick, onDelete
}) => {
  const offsetX = Math.abs(endX - startX) * 0.4;

  const pathD = `M ${startX} ${startY} C ${startX + offsetX} ${startY}, ${endX - offsetX} ${endY}, ${endX} ${endY}`;

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  return (
    <g className="node-connection" onClick={onClick}>
      {/* Hit area (wider invisible path for easier clicking) */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="12"
        style={{ cursor: 'pointer' }}
      />

      {/* Visible path */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#9ca3af'}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinecap="round"
      />

      {/* Midpoint circle for delete */}
      <circle
        cx={midX}
        cy={midY}
        r="8"
        fill={isSelected ? '#3b82f6' : '#9ca3af'}
        stroke="white"
        strokeWidth="1.5"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      />
      <text
        x={midX}
        y={midY + 3.5}
        fill="white"
        fontSize="10"
        textAnchor="middle"
        style={{ cursor: 'pointer', pointerEvents: 'none' }}
      >
        &times;
      </text>
    </g>
  );
};

export default NodeConnection;
