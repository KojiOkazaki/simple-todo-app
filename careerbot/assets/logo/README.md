# CareerBot ロゴ

ブランド表示用ロゴ（spec 6.3）。**`careerbot.png` が正本**です。バックエンドは
`careerbot.png` があれば最優先で配信し、無ければ `careerbot.svg`（暫定再現版）に
フォールバックします。

| ファイル | 用途 | 状態 |
|----------|------|------|
| `careerbot.png` | **正本**。起動スプラッシュ / 待機メイン / 管理画面ヘッダー | ⬜ 要配置（元画像を置いてください） |
| `careerbot.svg` | 暫定フォールバック（自動生成の再現版・目の位置はラフ） | ✅ 配置済み（PNG を置けば不使用） |
| `careerbot_round.png` | 発話中アニメーションの中心アイコン（円形） | ⬜ 任意 |

## 元画像（PNG）の置き方

手元の元ロゴ画像をこのディレクトリに `careerbot.png` として置き、コミット＆プッシュ
してください。置いた瞬間にバックエンドの `/logo`（および `/` スプラッシュ）が本物の
画像を返すようになります。

```bash
cp /path/to/あなたのロゴ.png careerbot/assets/logo/careerbot.png
git add careerbot/assets/logo/careerbot.png
git commit -m "Add CareerBot logo (original PNG)"
git push
```

> ファームウェア表示用には、PNG を LVGL image converter 等で C 配列に変換して
> `display_draw_logo()` から描画します。
