interface TitleScreenProps {
  onStart: () => void;
}

function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="title-screen">
      <div className="title-logo">
        <span className="title-icon">&#x1F4BC;</span>
        <h1>就活RPG</h1>
        <p className="title-subtitle">~ 内定への道 ~</p>
      </div>
      <div className="title-description">
        <p>エントリーシートから最終面接まで、</p>
        <p>全5ステージを突破して内定を勝ち取れ！</p>
      </div>
      <button className="btn-primary btn-large" onClick={onStart}>
        冒険をはじめる
      </button>
      <div className="title-instructions">
        <h3>遊び方</h3>
        <ul>
          <li>キャラクターを作成してステータスを振り分けよう</li>
          <li>面接官とのバトルに勝利してステージを進めよう</li>
          <li>ステージ間ではランダムイベントが発生！</li>
          <li>全5ステージクリアで内定ゲット！</li>
        </ul>
      </div>
    </div>
  );
}

export default TitleScreen;
