import React from 'react';

interface PanelHeaderProps {
  title: string;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  rightContent?: React.ReactNode;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ title, isEditing, onToggleEdit, rightContent }) => {
  return (
    <div className="panel-header">
      <div className="panel-header-left">
        {onToggleEdit && (
          <button
            className={`panel-toggle-btn ${isEditing ? 'active' : ''}`}
            onClick={onToggleEdit}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d={isEditing ? "M2 3L5 7L8 3" : "M3 2L7 5L3 8"} stroke="currentColor" fill="none" strokeWidth="1.5" />
            </svg>
          </button>
        )}
        <span className="panel-title">{title}</span>
      </div>
      {rightContent && <div className="panel-header-right">{rightContent}</div>}
    </div>
  );
};

export default PanelHeader;
