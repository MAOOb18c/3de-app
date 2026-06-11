# 3DE MVP v3.9 X API Prototype

## 追加した機能

- 外部意見欄の下に「X APIから外部意見を取得」パネルを追加
- 検索クエリ、最大件数、置き換え/追加を指定可能
- 取得したX投稿本文を外部意見欄に反映
- 投稿者、いいね、リポスト、返信、引用のメタデータを画面に表示
- 1000件指定時は、サーバー側でRecent Searchをページング取得

## 重要

Bearer Tokenはブラウザ側に置かないでください。
`server.js` 側の `.env` に設定します。

## 追加で必要なnpmパッケージ

```bash
npm install express cors dotenv
```

## 起動手順

ターミナル1：X API用サーバー

```bash
cp .env.example .env
# .envを開いてX_BEARER_TOKENを書き換える
node server.js
```

ターミナル2：React/Vite

```bash
npm run dev
```

画面の「X APIから外部意見を取得」から検索します。

## 検索クエリ例

```text
住宅価格 lang:ja -is:retweet
AI教育 lang:ja -is:retweet
イラン情勢 lang:ja -is:retweet
```

## 取得しているX API項目

- text
- author_id
- created_at
- public_metrics.like_count
- public_metrics.retweet_count
- public_metrics.reply_count
- public_metrics.quote_count
- author username/name

