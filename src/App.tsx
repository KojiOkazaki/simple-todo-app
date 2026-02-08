import { useState } from 'react';
import { Scene, Player, PlayerStats } from './types';
import { ENEMIES, INITIAL_HP, HP_RECOVERY_BETWEEN_STAGES } from './data/gameData';
import TitleScreen from './components/TitleScreen';
import CharacterCreate from './components/CharacterCreate';
import BattleScreen from './components/BattleScreen';
import EventScreen from './components/EventScreen';
import ResultScreen from './components/ResultScreen';
import './App.css';

function App() {
  const [scene, setScene] = useState<Scene>('title');
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const handleStart = () => {
    setScene('characterCreate');
  };

  const handleCharacterComplete = (name: string, stats: PlayerStats) => {
    setPlayer({
      name,
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      level: 1,
      stats,
    });
    setCurrentStage(0);
    setScene('battle');
  };

  const handleBattleEnd = (won: boolean, updatedPlayer: Player) => {
    setPlayer(updatedPlayer);
    if (!won) {
      setGameWon(false);
      setScene('result');
      return;
    }

    const nextStage = currentStage + 1;
    if (nextStage >= ENEMIES.length) {
      setGameWon(true);
      setScene('result');
      return;
    }

    setCurrentStage(nextStage);
    setScene('event');
  };

  const handleEventContinue = (updatedPlayer: Player) => {
    const recovered = {
      ...updatedPlayer,
      hp: Math.min(updatedPlayer.maxHp, updatedPlayer.hp + HP_RECOVERY_BETWEEN_STAGES),
    };
    setPlayer(recovered);
    setScene('battle');
  };

  const handleRestart = () => {
    setPlayer(null);
    setCurrentStage(0);
    setGameWon(false);
    setScene('title');
  };

  return (
    <div className="app">
      {scene === 'title' && <TitleScreen onStart={handleStart} />}

      {scene === 'characterCreate' && (
        <CharacterCreate onComplete={handleCharacterComplete} />
      )}

      {scene === 'battle' && player && (
        <BattleScreen
          key={currentStage}
          player={player}
          enemy={ENEMIES[currentStage]}
          onBattleEnd={handleBattleEnd}
        />
      )}

      {scene === 'event' && player && (
        <EventScreen player={player} onContinue={handleEventContinue} />
      )}

      {scene === 'result' && player && (
        <ResultScreen
          player={player}
          won={gameWon}
          stage={currentStage + 1}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
