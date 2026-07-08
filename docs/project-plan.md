# Open Campus Transportation Board Plan

## 目的

オープンキャンパス来場者向けに、バスと電車の発車時刻を大型モニターへ表示する交通案内Webアプリを作る。

このアプリは、毎年のオープンキャンパスで再利用できるようにし、将来的には校内で常設運用できる構成を目指す。

## 技術スタック

### Frontend

- Vite
- React
- TypeScript
- Tailwind CSS

### Backend

- Go
- chi
- SQLite
- modernc.org/sqlite

### Runtime

- Ubuntu PC
- Chromium / Google Chrome kiosk mode

## 基本方針

- 時刻表データをReactコンポーネントに直接書かない
- PDFを直接DBとして扱わない
- 毎年の更新はCSVで行う
- CSVをSQLiteに取り込む
- ReactはGo APIから時刻表を取得して表示する
- 本番ではGoサーバーがReactのビルド済みファイルを配信する

## データの流れ

```text
公式PDF・時刻表
↓
CSVに整理
↓
SQLiteにインポート
↓
Go API
↓
React UI
↓
大型モニター表示