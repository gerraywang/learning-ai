# Implementation Plan: やることの文言を後から編集する

**Branch**: `002-edit-todo-text`（実際は `main` で作業） | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-edit-todo-text/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

001 の TODO アプリに、やることの文言だけを後から直す機能を足す。各行の「編集」ボタンで、その行を
小さなフォーム（入力欄・確定・取り消し）に切り替える。確定は「確定」ボタンか Enter、取り消しは
「取り消し」ボタン・Esc・ほかの操作・行の外のクリック。検証は追加と同じ `validateTitle` を使い、
文言の変更は純粋関数 `editTodo` で行う。保存形式は変えない（詳しくは [research.md](./research.md)）。

技術は 001 と同じ（Vite・素の JavaScript・localStorage・Vitest + jsdom）。新しい依存もファイルの
役割も増やさない。

## Technical Context

**Language/Version**: JavaScript（ES2022、ES Modules）。001 と同じ

**Primary Dependencies**: 追加なし。ランタイム依存 0、開発時依存は 001 と同じ（Vite 8.3.x・Vitest 5.1.x・jsdom 31.0.x、package.json で確認 2026-11-22）

**Storage**: localStorage。形式は [001 contracts/storage.md](../001-todo-app/contracts/storage.md) のまま変えない

**Testing**: Vitest。`editTodo` は単体テスト（Node）、編集の受け入れシナリオは jsdom の画面テスト

**Target Platform**: パソコンの最新ブラウザ。Node.js 24 LTS 以上（001 と同じ）

**Project Type**: 単一のフロントエンド Web アプリ（既存）

**Performance Goals**: やること 500 件で、確定・取り消しの画面反映が 0.1 秒以内（SC-002）

**Constraints**: 001 の受け入れシナリオを壊さない（SC-005）。オフラインで動く・端末の外へ送らない（001 FR-013）

**Scale/Scope**: 変更するファイルは `src/todo.js`・`src/app.js`・`src/style.css`・テスト。新しいソースファイルは作らない

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 確認内容 | 判定 |
|---|---|---|
| I. テスト先行 | spec の受け入れシナリオ 18 個（US1: 8、US2: 5、US3: 5）を画面テストに対応させる。`editTodo` の単体テストも先に書く。tasks では各ストーリーのテストを実装より前に置く | ✅ |
| II. 依存は最小 | 依存の追加なし | ✅ |
| III. シンプルさ優先 | 新しいファイル・層・設定なし。編集中の状態は 1 項目（`editing`）だけ。spec にない機能（期限の編集・アンドゥ・履歴・複数同時編集）は作らない | ✅ |
| IV. 仕様が正 | spec.md に技術は書いていない（キー名 Enter / Esc は利用者が触る振る舞いとして spec に記載）。data-model・contracts は FR 番号を参照 | ✅ |
| 追加の制約 | ブラウザだけで動く・端末内保存・Public リポジトリに社内情報なし。外部の情報は使っていない | ✅ |

**001 の文書との関係**: 001 の spec.md の Assumptions に「やることの文言の編集…は今回の範囲外」、
001 の plan.md の Constitution Check（III）に「spec にない機能（編集・並べ替え等）は作らない」とある。
本機能はこれを範囲内に変える。`/speckit-analyze`（2026-11-22）で原則 IV の違反（CRITICAL）として
指摘されたため、実装の前に 001 の両文書へ「文言の編集は 002 で範囲内にした」と追記した（経緯は消さない）。

**Post-design 再チェック（Phase 1 後）**: data-model・contracts・quickstart を作った後も違反なし。
保存形式・依存・ファイル構成は変わらない。✅

## Project Structure

### Documentation (this feature)

```text
specs/002-edit-todo-text/
├── plan.md              # 本書
├── research.md          # Phase 0: 編集の作り方の決定と理由
├── data-model.md        # Phase 1: 001 からの差分（画面の状態 editing）
├── quickstart.md        # Phase 1: 手で確かめる流れ
├── contracts/
│   └── ui.md            # 画面の約束（001 への追加分）
├── checklists/
│   └── requirements.md  # /speckit-specify の品質チェック
└── tasks.md             # Phase 2（/speckit-tasks で作る）
```

### Source Code (repository root)

```text
src/
├── todo.js              # editTodo を足す
├── app.js               # 編集ボタン・編集中の行・確定／取り消し・外のクリック
├── style.css            # 編集中の行の見た目
├── storage.js           # 変更なし
└── main.js              # 変更なし
index.html               # 変更なし（行は app.js が作る）
tests/
├── helpers/
│   └── render-app.js    # deleteButton を button.remove で探す。編集用の操作を足す
├── unit/
│   └── todo.test.js     # editTodo の単体テストを足す
└── ui/
    ├── edit.test.js     # 新規: spec 002 の受け入れシナリオ（US1〜US3）
    └── performance.test.js  # 確定・取り消しの 500 件計測を足す
```

**Structure Decision**: 001 の構成のまま、既存ファイルに足す。画面テストは 001（`app.test.js`）と
分けて `edit.test.js` にし、テスト名の先頭を spec 002 のシナリオ番号（例: `US1-2`）にする。

## Complexity Tracking

違反なし（001 の Complexity Tracking「テスト用の開発時依存が 2 つ」はそのまま）。
