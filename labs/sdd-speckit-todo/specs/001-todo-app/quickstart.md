# Quickstart: ブラウザで使う TODO アプリ

**Date**: 2026-11-22 | **Plan**: [plan.md](./plan.md)

実装（`/speckit-implement`）が終わった後に、動くことを確かめる手順。

## 前提

- Node.js 24 LTS 以上（jsdom 31 の条件。[research.md](./research.md) R6）
- 2026-11-22 時点でこの端末には Node.js が入っていない。例:

  ```bash
  brew install node@24     # または brew install node（最新）
  node -v                  # v24.15 以上 / v26 以上を確認
  ```

## セットアップと実行

```bash
cd labs/sdd-speckit-todo
npm install
npm test          # すべてのテストが通る（SC-006）
npm run dev       # 表示された http://localhost:5173/ をブラウザで開く
npm run build     # dist/ に静的ファイルができる
```

## 手で確かめる流れ（ブラウザ）

画面の要素と文言は [contracts/ui.md](./contracts/ui.md) のとおり。

| # | 操作 | 期待する結果 | spec |
|---|---|---|---|
| 1 | 初めて開く | 「やることはありません」、絞り込みは「すべて」 | US5-6, FR-015 |
| 2 | 「牛乳を買う」を追加 | 一覧に 1 件、入力欄が空に戻る | US1-1 |
| 3 | 何も入れずに「追加」 | 追加されず「やることを入力してください」 | US1-4 |
| 4 | 期限を昨日にして「本を返す」を追加、期限を明日にして「歯医者」を追加 | 「本を返す」だけ「期限切れ」 | US4-1, US4-3 |
| 5 | 「本を返す」を完了にする | 取り消し線が付き、「期限切れ」が消える | US2-1, US4-4 |
| 6 | 「未完了」→「完了」→「すべて」 | 2 件 → 1 件 → 3 件 | US5-1〜3 |
| 7 | ページを再読み込み | 3 件・状態・期限・順番がそのまま | US1-3, SC-003 |
| 8 | 「歯医者」を削除 → 再読み込み | 「歯医者」は戻らない | US3-1, US3-2 |
| 9 | 開発者ツールのネットワークをオフラインにして操作 | すべての操作ができる | SC-005 |

## 保存の失敗を確かめる（任意）

開発者ツールのコンソールで、保存データを壊してから再読み込みする:

```js
localStorage.setItem('sdd-speckit-todo', '{壊れたデータ')
```

→ 空の一覧と「保存されたデータを読み込めませんでした」が出る（[contracts/storage.md](./contracts/storage.md)）。
