import { useState } from 'react';
import { PlayerStats } from '../types';
import { INITIAL_STAT_POINTS, BASE_STAT } from '../data/gameData';

interface CharacterCreateProps {
  onComplete: (name: string, stats: PlayerStats) => void;
}

const STAT_LABELS: { key: keyof PlayerStats; label: string; desc: string }[] = [
  { key: 'communication', label: 'コミュ力', desc: '自己PRの威力に影響' },
  { key: 'technical', label: '技術力', desc: '技術アピールの威力に影響' },
  { key: 'motivation', label: 'やる気', desc: '熱意アピールの威力に影響' },
  { key: 'luck', label: '運', desc: '運頼みの威力に影響（ハイリスク）' },
];

function CharacterCreate({ onComplete }: CharacterCreateProps) {
  const [name, setName] = useState('');
  const [stats, setStats] = useState<PlayerStats>({
    communication: BASE_STAT,
    technical: BASE_STAT,
    motivation: BASE_STAT,
    luck: BASE_STAT,
  });

  const usedPoints =
    stats.communication + stats.technical + stats.motivation + stats.luck - BASE_STAT * 4;
  const remainingPoints = INITIAL_STAT_POINTS - usedPoints;

  const handleIncrease = (key: keyof PlayerStats) => {
    if (remainingPoints <= 0) return;
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrease = (key: keyof PlayerStats) => {
    if (stats[key] <= BASE_STAT) return;
    setStats((prev) => ({ ...prev, [key]: prev[key] - 1 }));
  };

  const handleSubmit = () => {
    if (name.trim() === '') return;
    onComplete(name.trim(), stats);
  };

  return (
    <div className="character-create">
      <h2>キャラクター作成</h2>

      <div className="form-group">
        <label>名前</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="あなたの名前を入力"
          maxLength={10}
        />
      </div>

      <div className="stat-allocation">
        <div className="remaining-points">
          残りポイント: <span className={remainingPoints === 0 ? 'points-zero' : 'points-available'}>{remainingPoints}</span>
        </div>

        {STAT_LABELS.map(({ key, label, desc }) => (
          <div key={key} className="stat-row">
            <div className="stat-info">
              <span className="stat-label">{label}</span>
              <span className="stat-desc">{desc}</span>
            </div>
            <div className="stat-controls">
              <button
                className="btn-stat"
                onClick={() => handleDecrease(key)}
                disabled={stats[key] <= BASE_STAT}
              >
                -
              </button>
              <span className="stat-value">{stats[key]}</span>
              <button
                className="btn-stat"
                onClick={() => handleIncrease(key)}
                disabled={remainingPoints <= 0}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary btn-large"
        onClick={handleSubmit}
        disabled={name.trim() === ''}
      >
        就活スタート！
      </button>
    </div>
  );
}

export default CharacterCreate;
