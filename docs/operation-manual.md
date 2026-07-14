# オープンキャンパス当日 運用マニュアル

交通案内板を当日運用するための手順書です。セットアップやCSV形式の詳細は [README.md](../README.md) を参照してください。

## 前日までの準備

- [ ] 表示用Ubuntu PCとモニターの動作確認(HDMI接続・電源)
- [ ] フロントエンドをビルド後、Goバイナリを作成済みであることを確認(`cd frontend && npm run build`、続いて `cd ../backend && go build ./cmd/server`)
- [ ] 当日の時刻表CSVを用意する(形式は [README.md の「CSV形式」](../README.md#csv形式) を参照)
- [ ] CSVを一度インポートして、掲示板画面に正しく表示されることを確認する
- [ ] Ubuntuの「設定 → 電源」で画面のブランク(スリープ)を「しない」にする
- [ ] OSの自動アップデート再起動が当日に走らないか確認する

## 当日朝の手順

**1. サーバーを起動する**

```bash
cd ~/digital-board/backend
go run ./cmd/server
```

`server started: http://localhost:8080` と表示されればOK。

**2. 表示を確認する**

ブラウザで `http://localhost:8080/` を開き、当日のバス・電車が表示されることを確認する。

- 何も表示されない場合、時刻表が入っていないか、すべて発車済みの時刻になっている。`http://localhost:8080/admin` の一覧を確認する

**3. キオスクモードで全画面表示にする**

```bash
chromium-browser --kiosk --noerrdialogs --disable-session-crashed-bubble --incognito http://localhost:8080/
```

(Google Chromeの場合は `google-chrome`、終了は `Alt+F4`)

## 時刻表を差し替えたいとき

1. `http://localhost:8080/admin` を開く(同一ネットワークの別PCからは `http://<表示PCのIP>:8080/admin`)
2. CSVファイルを選択して「アップロード」を押す
3. 成功メッセージと一覧を確認する

- インポートは**全件置き換え**。CSVには当日の全便を入れておくこと
- エラーが出た場合はDBは変更されない。「◯行目: ...」の内容に従ってCSVを直して再アップロードする
- 掲示板は30秒ごとに自動更新されるので、キオスク画面の操作は不要

## よくあるトラブル(当日用クイックリファレンス)

| 症状 | 対処 |
| --- | --- |
| 画面が真っ暗になった | モニター電源・スリープ設定を確認。マウスを動かして復帰するならスリープ設定を「しない」に変更 |
| 掲示板が空になった | 残りの便がない時間帯なら正常。おかしい場合は `/admin` で時刻表を確認 |
| 画面下に「最新の情報を取得できませんでした」 | サーバーが落ちている。ターミナルを確認し、`cd ~/digital-board/backend && go run ./cmd/server` で再起動 |
| キオスクを抜けたい | `Alt+F4`(効かない場合は `Ctrl+Alt+T` でターミナルを開いて `pkill chromium`) |
| サーバーが `address already in use` で起動しない | `lsof -ti :8080 \| xargs kill` してから再起動 |

## 終了時

1. `Alt+F4` でキオスクモードを終了する
2. サーバーのターミナルで `Ctrl+C`
3. 来年に向けて、使ったCSVを `docs/` などに残しておくと翌年の準備が楽になります
