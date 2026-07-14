# 本番前チェックリスト

Goバイナリにフロントエンドを埋め込んだ本番構成を、オープンキャンパス前に検証するための手順です。

原則として、最初の検証は本番DBを変更しないよう一時ディレクトリで行います。各項目の実施日、担当者、結果、問題があった場合の内容を記録してください。

## 0. 準備

- [ ] 表示用Ubuntu PC、接続するモニター、キーボードを用意した
- [ ] PCの日時とタイムゾーンが正しいことを確認した
- [ ] 当日用CSVをUTF-8で用意した
- [ ] 当日用CSVを別媒体または別ディレクトリへコピーし、バックアップCSVを用意した
- [ ] 当日用CSVとバックアップCSVが同一であることを確認した

```bash
sha256sum /path/to/timetable.csv /path/to/backup/timetable.csv
```

期待結果: 2ファイルのハッシュ値が一致する。

- [ ] CSVのヘッダー、全便、時刻、行き先、のりば、備考を担当者2名で確認した
- [ ] 検証用の作業ディレクトリを作成した

```bash
PREFLIGHT_DIR="$(mktemp -d)"
echo "$PREFLIGHT_DIR"
```

## 1. frontend build

リポジトリのルートから実行します。

```bash
cd frontend
npm ci
npm run build
```

- [ ] コマンドが終了コード0で完了した
- [ ] TypeScriptまたはViteのビルドエラーがない
- [ ] `frontend/dist/index.html` とJS/CSSアセットが生成された

## 2. Go build

フロントエンドのビルド後に実行します。

```bash
cd ../backend
go build -o server ./cmd/server
```

- [ ] コマンドが終了コード0で完了した
- [ ] `backend/server` が生成され、実行可能である

## 3. 埋め込み済みバイナリの起動確認

バイナリだけを一時ディレクトリへコピーし、ソースツリーや `frontend/dist` に依存せず起動できることを確認します。

```bash
cp server "$PREFLIGHT_DIR/server"
cd "$PREFLIGHT_DIR"
./server
```

このターミナルは起動したままにし、以降の確認は別ターミナルで行います。

- [ ] `server started: http://localhost:8080` が表示された
- [ ] 起動直後に異常終了しない
- [ ] 一時ディレクトリに `data/timetable.db` が作成された
- [ ] `frontend/dist` を一時ディレクトリへコピーしていなくても画面が配信される

## 4. `/` と `/admin` の表示確認

- [ ] `http://localhost:8080/` を開き、交通案内板が表示された
- [ ] バスと電車の表示、時計、日本語、配色、文字サイズ、画面内の収まりを確認した
- [ ] ブラウザで `http://localhost:8080/admin` を直接開き、CSVインポート画面が表示された
- [ ] `/admin` で再読み込みしても404にならない
- [ ] 開発者ツールのConsoleに重大なエラーがない
- [ ] NetworkでJS/CSS/APIに404または500がない

## 5. API確認

```bash
curl -i http://localhost:8080/api/health
curl -fsS http://localhost:8080/api/departures
curl -fsS http://localhost:8080/api/departures/upcoming
```

- [ ] `/api/health` がHTTP 200と `{"status":"ok"}` を返した
- [ ] `/api/departures` がHTTP 200で、`departures` 配列を含むJSONを返した
- [ ] `/api/departures/upcoming` がHTTP 200で、`bus`、`train`、`updatedAt` を含むJSONを返した
- [ ] 存在しないAPIパスが画面のHTMLではなくHTTP 404を返した

```bash
curl -i http://localhost:8080/api/not-found
```

## 6. CSVインポート確認

まず当日用CSVを管理画面からインポートします。

1. `http://localhost:8080/admin` を開く
2. 当日用CSVを選択して「アップロード」を押す
3. 成功メッセージと登録済み時刻表を確認する

- [ ] 成功メッセージの件数がCSVのデータ行数と一致した
- [ ] `/admin` の一覧が当日用CSVの全内容と一致した
- [ ] `/` に現在時刻以降の便が正しい順序で表示された
- [ ] CSVの日本語が文字化けしていない
- [ ] ページを再読み込みしてもインポート内容が表示された

API経由でも応答を確認する場合は、次を実行します。

```bash
curl -fsS -X POST \
  -F "file=@/path/to/timetable.csv" \
  http://localhost:8080/api/import/csv
```

- [ ] HTTP 200で `{"imported":<件数>}` が返った

## 7. 不正CSVでDBが変わらないことの確認

不正CSVを送る前の全件データを保存します。

```bash
curl -fsS http://localhost:8080/api/departures > "$PREFLIGHT_DIR/before-invalid.json"
```

ヘッダーまたはデータ行を意図的に不正にした検証用CSVを用意します。例として、`kind` を許可されていない値にしたCSVを作成します。

```csv
kind,route_name,origin,destination,departure_time,arrival_time,platform,note
airplane,不正データ,高専前,大楽毛駅,10:15,10:35,高専前,
```

不正CSVを `/admin` からアップロードするか、APIへ送信します。

```bash
curl -i -X POST \
  -F "file=@/path/to/invalid.csv" \
  http://localhost:8080/api/import/csv
```

- [ ] HTTP 400または管理画面上のバリデーションエラーになった
- [ ] 行番号を含む、原因が分かるエラーが表示された
- [ ] 成功メッセージが表示されなかった

送信後のデータを保存し、送信前と比較します。

```bash
curl -fsS http://localhost:8080/api/departures > "$PREFLIGHT_DIR/after-invalid.json"
cmp "$PREFLIGHT_DIR/before-invalid.json" "$PREFLIGHT_DIR/after-invalid.json"
```

- [ ] `cmp` が終了コード0となり、送信前後のデータが完全に一致した
- [ ] `/admin` と `/` の表示内容も変わっていない

## 8. 再起動後もDB内容が残ることの確認

1. サーバーを起動したターミナルで `Ctrl+C` を押して正常終了する
2. 同じ一時ディレクトリで `./server` を再度実行する
3. 別ターミナルでAPIと画面を確認する

```bash
cd "$PREFLIGHT_DIR"
./server
```

- [ ] 再起動後も `/api/departures` の内容が当日用CSVと一致した
- [ ] `/admin` の件数と一覧が再起動前と一致した
- [ ] `/` に再起動前と同じ時刻表が表示された（発車済みの便が非表示になる動作は除く）
- [ ] 再起動時にDBが初期サンプルへ戻らなかった

## 9. Chromiumキオスク表示確認

Ubuntu PCで実行します。

```bash
chromium-browser --kiosk --noerrdialogs --disable-session-crashed-bubble --incognito http://localhost:8080/
```

Google Chromeを使用する場合:

```bash
google-chrome --kiosk --noerrdialogs --disable-session-crashed-bubble --incognito http://localhost:8080/
```

- [ ] 全画面で開き、アドレスバーやタブが表示されない
- [ ] 実際に使用するモニターの解像度で、文字切れ、横スクロール、要素の重なりがない
- [ ] 時計と時刻表の自動更新が動作する
- [ ] 30秒以上待ち、リロード操作なしで表示が更新される
- [ ] マウスカーソルや通知、セッション復元ダイアログが運用を妨げない
- [ ] Ubuntuの画面ブランク、スリープ、自動ロックを無効にした
- [ ] `Alt+F4` でキオスク表示を終了できる

## 10. ネットワーク切断時のローカル表示確認

サーバーとChromiumを同じUbuntu PC上で起動した状態で行います。

1. 正常に時刻表が表示されていることを確認する
2. LANケーブルを抜く、またはWi-Fiを無効にする
3. 2分以上待ち、表示と更新を確認する
4. `/` を再読み込みする
5. ネットワークを元に戻す

- [ ] ネットワーク切断中も `http://localhost:8080/` の表示が継続した
- [ ] 時計と30秒ごとの時刻表更新が継続した
- [ ] 切断中に再読み込みしても画面と時刻表が表示された
- [ ] 外部CDN、Webフォント、外部APIなどへの接続失敗で表示が崩れない
- [ ] ネットワーク復旧後も操作なしで正常表示が続いた

## 11. 2〜3時間の連続稼働確認

本番と同じUbuntu PC、モニター、キオスク設定、当日用CSVで行います。

- [ ] 開始時刻、終了予定時刻、サーバーのPIDを記録した
- [ ] Chromiumキオスク表示とGoサーバーを2〜3時間連続で稼働させた
- [ ] 30分ごとに画面、時計、時刻表更新、エラー表示の有無を記録した
- [ ] 稼働中にGoサーバーまたはChromiumが異常終了しなかった
- [ ] 画面のフリーズ、真っ白表示、著しいちらつき、文字崩れがなかった
- [ ] メモリまたはCPU使用量が継続的に増え続けていないことを確認した

確認例:

```bash
ps -o pid,etime,%cpu,%mem,rss,command -p <server-pid>
```

- [ ] 連続稼働後も `/api/health` がHTTP 200を返した
- [ ] 連続稼働後も `/admin` を開け、当日用CSVの内容が残っていた

## 12. 本番投入前の最終確認

- [ ] 一時検証で使用した不正CSVを本番用ディレクトリから除外した
- [ ] 本番環境へ当日用CSVをインポートした
- [ ] 本番DBの `/admin` 一覧を当日用CSVと照合した
- [ ] バックアップCSVの保存場所と復旧手順を当日担当者が把握した
- [ ] バックアップCSVを実際に選択でき、必要時に再インポートできることを確認した
- [ ] Goバイナリ、DB、当日用CSVの配置場所を記録した
- [ ] サーバー起動方法、キオスク起動方法、終了方法を当日担当者が実施できた
- [ ] 全項目の未確認事項と既知の問題がない、または運用上許容する判断を記録した

## 検証記録

| 項目 | 記入欄 |
| --- | --- |
| 実施日 |  |
| 実施者 |  |
| 使用コミット |  |
| Ubuntuバージョン |  |
| Chromium / Chromeバージョン |  |
| モニター解像度 |  |
| 当日用CSV |  |
| バックアップCSV |  |
| 連続稼働時間 |  |
| 結果 | 合格 / 不合格 |
| 備考・既知の問題 |  |
