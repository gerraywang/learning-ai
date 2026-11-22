# Implementation Plan: ブラウザで使う TODO アプリ

**Branch**: `001-todo-app`（実際は `main` で作業） | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-todo-app/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

1 人用の TODO アプリをブラウザだけで動かす。追加・完了・削除・期限・絞り込みの 5 つのユーザー
ストーリーを、**ランタイム依存 0 の素の JavaScript**で作る。データは **localStorage** に JSON で
丸ごと保存する。開発サーバーとビルドに **Vite**、テストに **Vitest + jsdom** を使う。

ロジック（`todo.js`）・保存（`storage.js`）・画面（`app.js`）の 3 つに分ける。前の 2 つは DOM に
触れない純粋な関数として単体テストし、画面は jsdom 上で spec の受け入れシナリオをそのまま
結合テストにする（詳しくは [research.md](./research.md)）。

## Technical Context

**Language/Version**: JavaScript（ES2022、ES Modules）。型チェックや TypeScript は使わない

**Primary Dependencies**: ランタイム依存なし。開発時依存のみ: Vite 8.3.x（開発サーバー・ビルド）、
Vitest 5.1.x（テスト）、jsdom 31.0.x（テスト用 DOM）。バージョンは npm registry で 2026-11-22 に確認

**Storage**: ブラウザの localStorage。キーは 1 つで、JSON に丸ごと保存（[contracts/storage.md](./contracts/storage.md)）

**Testing**: Vitest。単体テストは Node 環境、画面のテストは jsdom 環境

**Target Platform**: パソコンの最新ブラウザ（Chrome / Edge / Firefox / Safari）。開発には
Node.js 24 LTS 以上が必要（jsdom 31 は `^22.22.2 || ^24.15.0 || >=26`）。**この端末には
Node.js がまだ入っていない**（2026-11-22 確認）→ quickstart の前提に記載

**Project Type**: 単一のフロントエンド Web アプリ（静的ファイルのみ。サーバーなし）

**Performance Goals**: やること 500 件で、各操作の画面反映が 0.1 秒以内（SC-002）

**Constraints**: オフラインで全操作ができる（SC-005）。データを端末の外へ送らない（FR-013）

**Scale/Scope**: 1 画面、利用者 1 人、やること数百件まで。ソースは 4 ファイル程度

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 確認内容 | 判定 |
|---|---|---|
| I. テスト先行 | 受け入れシナリオ（21 個）をすべて Vitest の結合テストに対応させる。tasks では各ストーリーのテストを実装より先に置く | ✅ |
| II. 依存は最小 | ランタイム依存 0。外部サービスなし。開発時依存は 3 つ（ビルド 1・テスト 2）→ テスト用が 2 つなので下の Complexity Tracking に理由を記載 | ✅（理由付き） |
| III. シンプルさ優先 | フレームワーク・状態管理ライブラリ・ルーター・CSS フレームワークなし。spec にない機能（編集・並べ替え等）は作らない。ファイルは 3 つの役割だけ（2026-11-22 追記: 文言の編集は 002 で追加。[002 plan.md](../002-edit-todo-text/plan.md)） | ✅ |
| IV. 仕様が正 | spec.md には技術を書かず、技術は本書と research.md に分けた。data-model の検証ルールは FR 番号を参照 | ✅ |
| 追加の制約 | ブラウザだけで動く・端末内保存・Public リポジトリに社内情報なし・出典に確認日 | ✅ |

**Post-design 再チェック（Phase 1 後）**: data-model・contracts・quickstart を作った後も違反なし。
新たな依存や層は増えていない。✅

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-app/
├── plan.md              # 本書
├── research.md          # Phase 0: 技術の決定と理由
├── data-model.md        # Phase 1: やること・絞り込み・保存データ
├── quickstart.md        # Phase 1: 動かし方と確認手順
├── contracts/
│   ├── ui.md            # 画面の約束（要素・ラベル・メッセージ）
│   └── storage.md       # localStorage の保存形式
├── checklists/
│   └── requirements.md  # /speckit-specify の品質チェック
└── tasks.md             # Phase 2（/speckit-tasks で作る）
```

### Source Code (repository root)

```text
index.html               # 画面の骨組み（contracts/ui.md の要素）
package.json             # scripts: dev / build / test。dependencies は空
vite.config.js           # Vitest の設定（tests/ui は jsdom 環境）
.gitignore               # node_modules/ と dist/
src/
├── main.js              # 入口: localStorage を渡して app を起動
├── todo.js              # 純粋関数: 文言の検証・追加・切り替え・削除・期限切れ判定・絞り込み
├── storage.js           # 読み込み・保存（Storage を引数で受け取る。失敗を結果として返す）
├── app.js               # DOM の描画とイベント。todo.js と storage.js をつなぐ
└── style.css
tests/
├── helpers/
│   ├── memory-storage.js    # 偽 Storage（正常／setItem 失敗／アクセス失敗）
│   └── render-app.js        # jsdom に画面を作って app を起動する
├── unit/
│   ├── todo.test.js
│   ├── storage.test.js
│   └── no-network.test.js   # 外部通信のコードがないこと（FR-013）
└── ui/
    ├── app.test.js          # spec の受け入れシナリオ（US1〜US5）を jsdom で再現
    └── performance.test.js  # 500 件で 0.1 秒（SC-002）
```

**Structure Decision**: 単一プロジェクト。`labs/sdd-speckit-todo/` の直下に置く。`models/`
`services/` のような層フォルダは作らず、役割ごとに 1 ファイルとする（原則 III）。テストは
「DOM なしの単体」と「画面の受け入れ」の 2 種類と、両方が使うヘルパーだけ。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| テスト用の開発時依存が 2 つ（Vitest + jsdom） | 原則 I と SC-006 により、受け入れシナリオ（クリック・表示の変化）を自動テストにする必要がある。Vitest は DOM を持たないため、DOM の環境が別に要る | DOM なしでロジックだけテストする案は、画面の受け入れシナリオ（FR-006 の見た目の区別、FR-015 の空表示など）を確かめられない。Playwright 等の実ブラウザテストは依存が大きく、ブラウザ本体のダウンロードも要る |
