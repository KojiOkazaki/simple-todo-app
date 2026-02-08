import { useState } from 'react';
import { Player, GameEvent } from '../types';
import { getRandomEvent } from '../data/gameData';

interface EventScreenProps {
  player: Player;
  onContinue: (updatedPlayer: Player) => void;
}

function EventScreen({ player, onContinue }: EventScreenProps) {
  const [event] = useState<GameEvent>(() => getRandomEvent());
  const [applied, setApplied] = useState(false);
  const [updatedPlayer, setUpdatedPlayer] = useState<Player>(player);

  const handleApply = () => {
    const newPlayer = event.effect(player);
    setUpdatedPlayer(newPlayer);
    setApplied(true);
  };

  return (
    <div className="event-screen">
      <h2>ランダムイベント</h2>

      <div className="event-card">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.description}</p>

        {!applied ? (
          <button className="btn-primary" onClick={handleApply}>
            確認する
          </button>
        ) : (
          <div className="event-result">
            <div className="effect-text">{event.effectText}</div>
            <div className="player-status-after">
              <div>HP: {updatedPlayer.hp} / {updatedPlayer.maxHp}</div>
              <div>
                コミュ力: {updatedPlayer.stats.communication} / 技術力: {updatedPlayer.stats.technical} / やる気: {updatedPlayer.stats.motivation} / 運: {updatedPlayer.stats.luck}
              </div>
            </div>
            <button className="btn-primary btn-large" onClick={() => onContinue(updatedPlayer)}>
              次のステージへ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventScreen;
