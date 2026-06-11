# 3DE MVP Public Preview

3DE MVPを知人にURL共有して試してもらうための公開プレビュー手順です。

## このアプリについて

3DEは、自分の意見と外部の声を比較し、近い声・違う声・足りない視点を見つけるための試作アプリです。現在はMVP段階であり、取得精度や分析精度は改善中です。

知人に見せるときは、次の説明を添えてください。

> これは開発中の試用版です。分析結果は参考表示です。正解や世論全体を示すものではありません。

## 公開プレビューの方針

- パスコードはありません。
- 知人向けにURLを共有して試してもらう想定です。
- X取得は1回あたり最大200件です。
- AI評価軸生成、AI要約、AI分析は利用できます。
- 開発者向けログ、内部検索条件の詳細、APIエラー原文は通常表示しません。
- 公開URLで実際に動作確認してから共有してください。

## 必要な環境変数

`.env.example` をコピーして `.env` を作成し、必要な値を設定します。

```env
OPENAI_API_KEY=
X_BEARER_TOKEN=
X_API_KEY=
PORT=3001
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_SUMMARY_MODEL=gpt-4.1-mini
VITE_API_BASE_URL=http://localhost:3001
VITE_PUBLIC_PREVIEW=false
```

`OPENAI_API_KEY` と `X_BEARER_TOKEN` または `X_API_KEY` はサーバー側だけで使います。React側に直接書かないでください。

## ローカル起動

依存関係をインストール済みの場合:

```powershell
npm.cmd run dev
node server.js
```

フロントエンドとAPIサーバーを別のターミナルで起動してください。

## 公開プレビューモード

公開用に見せる場合は、フロントエンド環境変数を設定します。

```env
VITE_PUBLIC_PREVIEW=true
VITE_API_BASE_URL=https://your-api.example.com
```

`VITE_PUBLIC_PREVIEW=true` のとき:

- 初期表示はユーザーmodeです。
- 開発者mode切替は表示しません。
- 開発者ログ、保存データ詳細、段階取得ログ詳細は表示しません。
- raw / safe / fallback / final query の詳細は表示しません。
- APIエラー原文は表示しません。
- 文字化けデータリセットは表示しません。
- 外部意見取得中・AI要約中は強制ストップできます。

## APIキー保護

- `.env` をGitHubや公開サーバーの静的配信物に含めないでください。
- `.env.example` だけを公開用テンプレートとして管理してください。
- `OPENAI_API_KEY`、`X_BEARER_TOKEN`、`X_API_KEY` はReactコードに書かないでください。
- `VITE_` で始まる環境変数はブラウザに含まれるため、秘密情報を入れないでください。
- server.js側でのみAPIキーを読み込む構成を維持してください。

## Web公開時の注意

- APIサーバーはHTTPSで公開してください。
- 公開URLから外部データ取得とAI要約が動くことを確認してください。
- 利用量が増える場合は、X APIとOpenAI APIの課金・レート制限を確認してください。
- 共有前に `VITE_PUBLIC_PREVIEW=true` でビルドされていることを確認してください。

## ビルド確認

```powershell
npm.cmd run build
node --check server.js
```

## 既知の制限

- 分析結果は統計的代表性を保証しません。
- X取得結果は検索条件、外部データ取得の状態、レート制限に左右されます。
- AI生成・AI要約はOpenAI APIの状態や設定に左右されます。
- MVP段階のため、UIや分析ロジックは今後変更されます。
