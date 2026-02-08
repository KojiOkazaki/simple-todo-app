import { Player } from '../types';

interface ResultScreenProps {
  player: Player;
  won: boolean;
  stage: number;
  onRestart: () => void;
}

function ResultScreen({ player, won, stage, onRestart }: ResultScreenProps) {
  return (
    <div className="result-screen">
      {won ? (
        <>
          <div className="result-banner result-win-banner">
            <h1>内定獲得！</h1>
            <p>おめでとうございます！</p>
          </div>
          <div className="result-message">
            <p>{player.name}は見事、全ての選考を突破し</p>
            <p>内定を勝ち取った！</p>
          </div>
        </>
      ) : (
        <>
          <div className="result-banner result-lose-banner">
            <h1>不採用...</h1>
            <p>お祈りメールが届いた...</p>
          </div>
          <div className="result-message">
            <p>{player.name}はステージ{stage}で力尽きた...</p>
            <p>「今後のご活躍をお祈り申し上げます」</p>
          </div>
        </>
      )}

      <div className="final-stats">
        <h3>最終ステータス</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-key">レベル</span>
            <span className="stat-val">{player.level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">到達ステージ</span>
            <span className="stat-val">{stage} / 5</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">残りHP</span>
            <span className="stat-val">{player.hp} / {player.maxHp}</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">コミュ力</span>
            <span className="stat-val">{player.stats.communication}</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">技術力</span>
            <span className="stat-val">{player.stats.technical}</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">やる気</span>
            <span className="stat-val">{player.stats.motivation}</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">運</span>
            <span className="stat-val">{player.stats.luck}</span>
          </div>
        </div>
      </div>

      <button className="btn-primary btn-large" onClick={onRestart}>
        もう一度チャレンジ！
      </button>
    </div>
  );
}

export default ResultScreen;
