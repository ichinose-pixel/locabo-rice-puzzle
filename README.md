# LOCABO ごはんパズル

40秒の料理合体ゲームと商品紹介をまとめた、単一HTMLのPlayableです。

## 動作

- 自動開始前の説明を3秒表示。初回合体まで操作案内を保持します。
- 制限時間は `performance.now()` で計測し、物理演算のフレーム制限と分離。一時停止、図鑑閲覧、非表示、横向き中は時間を消費しません。
- タイムアップ／ゲームオーバー後は料理の完成演出を挟んでCTAへ進みます。「商品を見る」から途中終了も可能です。
- CTA写真は提供された元FVの実商品部分をcanvasで表示しています。商品画像の生成・形状変更はしていません。
- 通常ブラウザでは同じタブでLPに移動。ホストがMRAIDを提供している場合は `mraid.open` を使用します。

## 計測連携

`window` の `locabo:analytics` CustomEventを購読するか、ホスト側で `window.dataLayer` を用意してください。イベントは `window.locaboEvents` に直近100件まで保持します。

イベント: `locabo_game_start`, `locabo_first_interaction`, `locabo_first_merge`, `locabo_book_open`, `locabo_game_complete`, `locabo_game_skip`, `locabo_cta_view`, `locabo_cta_click`, `locabo_replay`。

イベントには得点と残り秒数が入り、完了時には終了理由が入ります。外部計測先・ユーザー識別子は追加していません。媒体固有のSDK、入稿要件、実際の計測先との接続は配信先決定後に確認してください。

## 検証

`node --test tests/game.test.cjs`

低フレームレートと描画停止中の終了、一時停止時間の除外、リプレイ、合体、操作キャンセル、図鑑、CTA、画面回転・非表示を検証します。

`tests/layout.html` は320×568、375×667、390×844のiframe表示確認用です。iOS Safari／Android端末や広告枠内のタッチ実機テストを代替しません。
