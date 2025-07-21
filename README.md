# YouTube プレイリスト エディター

大規模なYouTubeプレイリスト（1000本以上の動画）を効率的に管理・並び替えできるWebアプリケーションです。YouTube APIを使用して、ページネーション付きで動画を表示し、数値指定による素早い並び替えが可能です。

## 機能

- ✅ YouTube OAuth 2.0 認証
- ✅ プレイリスト一覧表示と選択
- ✅ 動画リストの表示（ページネーション対応）
- ✅ 動画の位置指定による並び替え
- ✅ 検索・フィルタリング機能
- ✅ 一括更新機能（変更キュー）
- ✅ エラーハンドリングと進行状況表示

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **認証**: NextAuth.js
- **スタイリング**: Tailwind CSS
- **API**: YouTube Data API v3
- **アイコン**: Lucide React

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd youtube-playlist-editor
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
```

### 4. YouTube API の設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. YouTube Data API v3を有効化
4. OAuth 2.0 認証情報を作成
   - アプリケーションタイプ: Webアプリケーション
   - リダイレクトURI: `http://localhost:3000/api/auth/callback/google`
5. クライアントIDとクライアントシークレットを環境変数に設定

### 5. アプリケーションの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

### 1. サインイン
- YouTubeアカウントでサインインします
- 必要な権限（プレイリストの読み取りと編集）を許可してください

### 2. プレイリストの選択
- 自分のプレイリスト一覧から編集したいプレイリストを選択します

### 3. 動画の並び替え
- 動画リストで各動画の「目標位置」欄に新しい位置番号を入力
- 「移動」ボタンをクリックして変更をキューに追加
- 「決定」ボタンで一括実行

### 4. 検索機能
- ヘッダーの検索ボックスで動画タイトルを検索できます
- 検索結果内でも並び替えが可能です

## 開発

### プロジェクト構造

```
src/
├── app/                    # Next.js App Router
├── components/            # React コンポーネント
├── lib/                   # ユーティリティとAPI クライアント
│   ├── auth.ts           # NextAuth.js 設定
│   ├── youtube-client.ts # YouTube API クライアント
│   ├── rate-limiter.ts   # APIレート制限管理
│   └── types.ts          # TypeScript型定義
```

### 主要コンポーネント

- `PlaylistCard`: プレイリストカード
- `VideoItem`: 動画アイテムと並び替えコントロール
- `Pagination`: ページネーションコンポーネント
- `LoadingSpinner`: ローディングスピナー

### API Routes

- `GET /api/playlists`: プレイリスト一覧取得
- `GET /api/playlists/[id]/videos`: 動画一覧取得
- `POST /api/playlists/[id]/reorder`: 動画並び替え実行

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

プルリクエストや課題報告を歓迎します。大きな変更を行う前に、まずissueを開いて変更内容について話し合うことをお勧めします。