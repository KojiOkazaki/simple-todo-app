# CareerBot ロゴ

ブランド表示用ロゴをここに配置します（spec 6.3）。

| ファイル | 用途 | 状態 |
|----------|------|------|
| `careerbot.svg` | 正本（ベクター）。バックエンド `/logo.svg` で配信、スプラッシュ画面で表示 | ✅ 配置済み（提供画像のベクター再現） |
| `careerbot.png` | 起動スプラッシュ / 待機メイン / 管理画面ヘッダー（ラスター版） | ⬜ 任意（下記参照） |
| `careerbot_round.png` | 発話中アニメーションの中心アイコン（円形） | ⬜ 任意 |

## 本物の画像に差し替える場合

`careerbot.svg` は提供されたロゴ画像をベクターで再現したものです。元の PNG/SVG を
そのまま使いたい場合は、このディレクトリに上書きコミットしてください:

```bash
# 例: 手元の元画像を正本にする
cp /path/to/careerbot.svg careerbot/assets/logo/careerbot.svg   # SVG をそのまま使う
# もしくは PNG を置き、httpServer の /logo 配信を png に向ける
```

バックエンドは `/logo.svg`（`careerbot.svg`）を配信し、`/` のスプラッシュ画面で表示します。
ラスターが必要なら `rsvg-convert careerbot.svg -o careerbot.png` 等で生成できます。

使用箇所:
- 起動時スプラッシュ画面
- 待機中メイン画面
- 接続中画面
- 発話中アニメーションの中心アイコン
- バックエンド管理画面のヘッダーロゴ

> ファームウェアでは、表示用に C 配列へ変換（`idf.py` の画像変換 or LVGL の
> image converter）して `display_draw_logo()` から描画します。元の PNG をこの
> ディレクトリにコミットしてください（現状は未配置のプレースホルダです）。
