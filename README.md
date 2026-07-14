# オープンキャンパス交通案内板

オープンキャンパス来場者向けに、バス・JRの発車時刻を大型モニターに表示するシステムです。

- 掲示板画面(`/`): これから発車する便を電光掲示板風に表示する
- 管理画面(`/admin`): CSVで時刻表データを入れ替える

毎年のオープンキャンパスで使い回すことを想定しています。当日の運用手順は [docs/operation-manual.md](docs/operation-manual.md) を参照してください。

## 技術スタック

| 区分 | 使用技術 |
| --- | --- |
| フロントエンド | Vite / React / TypeScript / Tailwind CSS |
| バックエンド | Go / chi / SQLite (modernc.org/sqlite) |
| 実行環境 | Ubuntu PC + Chromium(キオスクモード) |

データの流れ: CSV → SQLite → Go API → React UI

## ディレクトリ構成

```text
digital-board/
├── backend/
│   ├── cmd/server/          # エントリーポイント(ルーター設定・起動)
│   ├── internal/db/         # SQLite接続・テーブル初期化・初期データ投入
│   ├── internal/timetable/  # 型定義・DB取得処理・APIハンドラー・CSV取り込み
│   ├── internal/webui/      # ビルド済みReactの埋め込み配信(SPAフォールバック)
│   └── data/timetable.db    # SQLite DBファイル(初回起動時に自動作成・git管理外)
├── frontend/
│   ├── src/pages/           # BoardPage(掲示板) / AdminPage(管理画面)
│   ├── src/components/      # 掲示板のUI部品
│   ├── src/api/             # APIクライアント
│   └── dist/                # npm run build の出力(git管理外)
└── docs/
    ├── operation-manual.md  # オープンキャンパス当日の運用手順
    └── sample_timetable.csv # CSVのサンプル
```

## 必要なもの

- Go 1.26 以上
- Node.js 20 以上(npm 同梱)

## 開発サーバーの起動方法

ターミナルを2つ使います。

**1. Goバックエンド(ポート8080)**

```bash
cd backend
go run ./cmd/server
```

> **注意:** 必ず `backend/` ディレクトリから実行してください。DBファイルのパスが相対パス(`data/timetable.db`)のためです。

**2. Vite開発サーバー(ポート5173)**

```bash
cd frontend
npm install   # 初回のみ
npm run dev
```

ブラウザで <http://localhost:5173/> を開くと掲示板画面、<http://localhost:5173/admin> を開くと管理画面が表示されます。`/api` へのリクエストはViteがバックエンド(8080)へプロキシします。

## 本番ビルド方法

```bash
cd frontend
npm install   # 初回のみ
npm run build
```

`backend/internal/webui/dist/` にビルド済みファイルが出力されます。このファイル群は次のGoビルド時にバイナリへ埋め込まれます。

## 本番起動方法(Goサーバー単体)

フロントエンドをビルド済みであれば、Goサーバーだけで画面もAPIも配信できます。

```bash
cd backend
go run ./cmd/server
```

- <http://localhost:8080/> … 掲示板画面
- <http://localhost:8080/admin> … 管理画面

バイナリにしたい場合は `go build ./cmd/server` で `backend/server` が作られます(起動は同じく `backend/` ディレクトリから `./server`)。

> **注意:**
> - 画面のファイルはGoバイナリに埋め込まれているため、バイナリはどのディレクトリからでも画面とAPIを配信できます。
> - DBファイルは起動時の作業ディレクトリを基準に `data/timetable.db` へ作成されます。本番運用ではDBの保存場所を固定するため、systemd等の `WorkingDirectory` を `backend/` に指定してください。

## API一覧

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/departures` | 登録済みの全時刻表 |
| GET | `/api/departures/upcoming` | 現在時刻以降の便(掲示板が使用) |
| POST | `/api/import/csv` | CSVインポート(全件置き換え) |

## CSVインポート方法

### 管理画面から(推奨)

1. ブラウザで `/admin` を開く
2. 「ファイルを選択」でCSVファイルを選ぶ
3. 「アップロード」を押す
4. 「◯件の時刻表をインポートしました。」と出れば成功。画面下部の一覧で内容を確認する

**インポートは全件置き換えです。** 既存の時刻表はすべて削除され、CSVの内容に置き換わります。CSVに1行でもエラーがあると何も変更されず、行番号付きのエラーが表示されます。

### コマンドラインから

```bash
curl -X POST -F "file=@docs/sample_timetable.csv" http://localhost:8080/api/import/csv
```

成功時は `{"imported":3}` のように件数が返ります。

## CSV形式

1行目は必ずこのヘッダーにしてください(列の順番も固定です)。

```csv
kind,route_name,origin,destination,departure_time,arrival_time,platform,note
bus,高専前→大楽毛駅,高専前,大楽毛駅,10:15,10:35,高専前,
train,大楽毛駅→釧路方面,大楽毛駅,釧路方面,10:22,10:41,1番線,普通
```

| 列 | 必須 | 内容 |
| --- | --- | --- |
| kind | ✔ | `bus` または `train` |
| route_name | ✔ | 路線名(掲示板の表示に使用) |
| origin | ✔ | 出発地 |
| destination | ✔ | 行き先(電車は「釧路」「帯広」などを含めると掲示板で方面別に振り分けられる) |
| departure_time | ✔ | 発車時刻。**ゼロ埋めのHH:MM形式**(`09:15` は可、`9:15` は不可) |
| arrival_time | | 到着時刻。空欄可、入れる場合はHH:MM形式 |
| platform | | のりば。空欄可 |
| note | | 備考(「普通」など)。空欄可 |

- 文字コードはUTF-8で保存してください(Excelの場合は「CSV UTF-8」で書き出し)
- サンプル: [docs/sample_timetable.csv](docs/sample_timetable.csv)
- 掲示板は**現在時刻以降**の便だけを表示します。発車済みの便は自動的に消えます

## Ubuntu PCでの表示方法

当日の詳しい手順・チェックリストは [docs/operation-manual.md](docs/operation-manual.md) にまとめています。概要は次のとおりです。

**1. サーバーを起動する**

```bash
cd ~/digital-board/backend
go run ./cmd/server
```

**2. Chromiumをキオスクモードで起動する**

```bash
chromium-browser --kiosk --noerrdialogs --disable-session-crashed-bubble --incognito http://localhost:8080/
```

Google Chromeの場合:

```bash
google-chrome --kiosk --noerrdialogs --disable-session-crashed-bubble --incognito http://localhost:8080/
```

- キオスクモードの終了は `Alt+F4`(または `Ctrl+W`)
- 画面がスリープしないよう、Ubuntuの「設定 → 電源 → 画面のブランク」を「しない」にしておく

**3. 時刻表を差し替える場合**

同じPCのブラウザで別ウィンドウを開くか、同一ネットワークの別PCから `http://<表示PCのIPアドレス>:8080/admin` を開いてCSVをアップロードします。掲示板画面は30秒ごとに自動更新されるので、リロード不要で反映されます。

## トラブルシューティング

| 症状 | 原因と対処 |
| --- | --- |
| 起動時に `bind: address already in use` | ポート8080が使用中。前回のサーバーが残っている。`lsof -ti :8080 \| xargs kill` で停止してから再起動する |
| `go build ./cmd/server` が埋め込み対象なしで失敗する | フロントエンドが未ビルド。先に `cd frontend && npm run build` を実行する |
| 掲示板に何も表示されない | 現在時刻以降の便がない可能性が高い。`/admin` の一覧で時刻表の内容と現在時刻を確認する。当日分のCSVをインポートし直す |
| CSVアップロードで「バリデーションに失敗しました」 | 表示された「◯行目: ...」のエラーに従ってCSVを修正する。よくある原因: 時刻が `9:15` のようにゼロ埋めされていない、kindが `bus`/`train` 以外、ヘッダー行の列名違い |
| CSVの日本語が文字化けする | 文字コードがUTF-8になっていない。「CSV UTF-8」で保存し直してインポートする |
| 画面下部に「最新の情報を取得できませんでした」 | 掲示板がAPIに接続できていない。Goサーバーが起動しているか確認する。表示は前回取得時のデータのまま維持される |
| データを最初からやり直したい | サーバーを停止し `backend/data/timetable.db` を削除して再起動すると、初期サンプルデータで作り直される |
