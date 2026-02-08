import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, EnemyData, BattleLog } from '../types';
import { PLAYER_ACTIONS, calculatePlayerDamage, randomInt } from '../data/gameData';

interface BattleScreenProps {
  player: Player;
  enemy: EnemyData;
  onBattleEnd: (won: boolean, updatedPlayer: Player) => void;
}

function BattleScreen({ player, enemy, onBattleEnd }: BattleScreenProps) {
  const [currentPlayer, setCurrentPlayer] = useState<Player>({ ...player });
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [logs, setLogs] = useState<BattleLog[]>([
    { text: `${enemy.stageName}`, type: 'system' },
    { text: `${enemy.title}「${enemy.name}」が現れた！`, type: 'system' },
  ]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleOver, setBattleOver] = useState(false);
  const [won, setWon] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((text: string, type: BattleLog['type']) => {
    setLogs((prev) => [...prev, { text, type }]);
  }, []);

  const handleEnemyTurn = useCallback(
    (playerAfterAction: Player) => {
      const action = enemy.actions[randomInt(0, enemy.actions.length - 1)];
      const damage = randomInt(action.minDamage, action.maxDamage);
      const newHp = Math.max(0, playerAfterAction.hp - damage);

      addLog(`${enemy.name}の「${action.name}」！`, 'enemy');
      addLog(action.message, 'enemy');
      addLog(`${damage}のダメージ！`, 'enemy');

      const updatedPlayer = { ...playerAfterAction, hp: newHp };
      setCurrentPlayer(updatedPlayer);

      if (newHp <= 0) {
        addLog(`${updatedPlayer.name}は力尽きた...`, 'system');
        setBattleOver(true);
        setWon(false);
      } else {
        setIsPlayerTurn(true);
      }
    },
    [enemy, addLog],
  );

  useEffect(() => {
    if (!isPlayerTurn && !battleOver) {
      const timer = setTimeout(() => {
        handleEnemyTurn(currentPlayer);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, battleOver, currentPlayer, handleEnemyTurn]);

  const handlePlayerAction = (actionIndex: number) => {
    if (!isPlayerTurn || battleOver) return;

    const action = PLAYER_ACTIONS[actionIndex];
    const statValue = currentPlayer.stats[action.statKey];
    const { damage, isCritical } = calculatePlayerDamage(statValue, action.statKey);

    addLog(`${currentPlayer.name}の「${action.name}」！`, 'player');

    if (damage === 0) {
      addLog('しかし、うまくいかなかった...', 'player');
    } else {
      if (isCritical) {
        addLog('会心の一撃！', 'player');
      }
      addLog(`${damage}のダメージ！`, 'player');
    }

    const newEnemyHp = Math.max(0, enemyHp - damage);
    setEnemyHp(newEnemyHp);

    if (newEnemyHp <= 0) {
      addLog(`${enemy.name}を突破した！`, 'system');
      const leveledPlayer = {
        ...currentPlayer,
        level: currentPlayer.level + 1,
      };
      setCurrentPlayer(leveledPlayer);
      setBattleOver(true);
      setWon(true);
    } else {
      setIsPlayerTurn(false);
    }
  };

  const handleContinue = () => {
    onBattleEnd(won, currentPlayer);
  };

  const hpPercent = (currentPlayer.hp / currentPlayer.maxHp) * 100;
  const enemyHpPercent = (enemyHp / enemy.hp) * 100;

  return (
    <div className="battle-screen">
      <div className="battle-header">
        <h2>{enemy.stageName}</h2>
      </div>

      <div className="battle-field">
        <div className="combatant enemy-side">
          <div className="combatant-name">{enemy.name}</div>
          <div className="combatant-title">{enemy.title}</div>
          <div className="hp-bar-container">
            <div className="hp-bar hp-bar-enemy" style={{ width: `${enemyHpPercent}%` }} />
            <span className="hp-text">
              {enemyHp} / {enemy.hp}
            </span>
          </div>
        </div>

        <div className="vs-divider">VS</div>

        <div className="combatant player-side">
          <div className="combatant-name">
            {currentPlayer.name} <span className="level-badge">Lv.{currentPlayer.level}</span>
          </div>
          <div className="hp-bar-container">
            <div
              className={`hp-bar ${hpPercent < 25 ? 'hp-bar-danger' : 'hp-bar-player'}`}
              style={{ width: `${hpPercent}%` }}
            />
            <span className="hp-text">
              HP {currentPlayer.hp} / {currentPlayer.maxHp}
            </span>
          </div>
          <div className="player-stats-mini">
            <span>コミュ {currentPlayer.stats.communication}</span>
            <span>技術 {currentPlayer.stats.technical}</span>
            <span>やる気 {currentPlayer.stats.motivation}</span>
            <span>運 {currentPlayer.stats.luck}</span>
          </div>
        </div>
      </div>

      <div className="battle-log" ref={logRef}>
        {logs.map((log, i) => (
          <div key={i} className={`log-entry log-${log.type}`}>
            {log.text}
          </div>
        ))}
      </div>

      {!battleOver && isPlayerTurn && (
        <div className="action-panel">
          <div className="action-label">行動を選択：</div>
          <div className="action-buttons">
            {PLAYER_ACTIONS.map((action, i) => (
              <button
                key={action.id}
                className="btn-action"
                onClick={() => handlePlayerAction(i)}
              >
                <span className="action-name">{action.name}</span>
                <span className="action-desc">{action.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!battleOver && !isPlayerTurn && (
        <div className="action-panel">
          <div className="waiting-text">相手のターン...</div>
        </div>
      )}

      {battleOver && (
        <div className="battle-result">
          <div className={won ? 'result-win' : 'result-lose'}>
            {won ? 'STAGE CLEAR!' : 'GAME OVER...'}
          </div>
          <button className="btn-primary btn-large" onClick={handleContinue}>
            {won ? '次へ進む' : '結果を見る'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BattleScreen;
