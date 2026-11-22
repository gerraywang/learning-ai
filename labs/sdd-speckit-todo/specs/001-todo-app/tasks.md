---

description: "ブラウザで使う TODO アプリの実装タスク"
---

# Tasks: ブラウザで使う TODO アプリ

**Input**: Design documents from `specs/001-todo-app/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, contracts/storage.md, quickstart.md

**Tests**: 必須。constitution の原則 I（テスト先行・NON-NEGOTIABLE）により、各ストーリーのテストを
実装より先に書き、**失敗することを確認してから**実装する。受け入れシナリオ（US1〜US5 の計 21 個）は
すべて `tests/ui/app.test.js` のテストに 1 対 1 で対応させ、テスト名に `US1-1` のような番号を入れる。

**Organization**: ユーザーストーリーごとにフェーズを分け、各ストーリーを単独でテストできるようにする。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行して進められる（別ファイルで、未完了のタスクに依存しない）
- **[Story]**: どのユーザーストーリーのタスクか（US1〜US5）
- パスはすべて `labs/sdd-speckit-todo/` からの相対パス

## Path Conventions

単一プロジェクト（plan.md の Project Structure）: `index.html`、`src/`、`tests/unit/`、`tests/ui/`、
`tests/helpers/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクトの初期化

- [X] T001 Node.js 24.15 以上が入っていることを確認し（`node -v`。なければ quickstart.md の前提に従って入れる）、`package.json` を作る: `"type": "module"`、`"private": true`、scripts `dev`=`vite` / `build`=`vite build` / `test`=`vitest run`、`dependencies` は空、`devDependencies` は `vite ^8.3.8`・`vitest ^5.1.1`・`jsdom ^31.0.1`（research.md R6）。`npm install` を実行して `package-lock.json` を作る（plan.md Technical Context）
- [X] T002 [P] `vite.config.js` を作る: Vitest の既定環境は `node`、`tests/ui/**` だけ `jsdom` 環境にする（research.md R5。設定の書き方は Vitest 5 のドキュメントで確認）
- [X] T003 [P] `index.html` を作る: contracts/ui.md の「画面の要素」の表にある要素（追加フォーム・「やること」入力欄・「期限（任意）」入力欄・「追加」ボタン・絞り込みボタン 3 つ・「やることの一覧」の `<ul>`・空の表示・`role="status"` のお知らせ領域）を置き、`src/style.css` と `src/main.js` を読み込む（FR-001, FR-008, FR-011, FR-015 の要素）
- [X] T004 [P] `src/style.css` を空で作り、`.gitignore` に `node_modules/` と `dist/` を書く（plan.md Project Structure）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのストーリーが使う、保存と画面の土台

**⚠️ CRITICAL**: このフェーズが終わるまでストーリーの作業は始めない

- [X] T005 [P] テスト用の偽 Storage を `tests/helpers/memory-storage.js` に作る: `getItem`/`setItem`/`removeItem` を持つメモリ上の Storage、`setItem` で例外を投げる版、アクセスで例外を投げる版の 3 種類（FR-012, FR-014 のテスト用）
- [X] T006 [P] 画面テスト用のヘルパーを `tests/helpers/render-app.js` に作る: `index.html` の `<body>` 部分を jsdom の `document` に入れ、偽 Storage と固定した「今日」（`YYYY-MM-DD`）を渡して app を起動し、ラベルや文言で要素を探す関数（contracts/ui.md のラベル）を返す。n 番目の行、または `data-id` で指定した行の中から部品を探す関数も返す（contracts/ui.md「一覧の 1 行」）（SC-006: 受け入れシナリオを画面テストにするため）
- [X] T007 `tests/unit/storage.test.js` に `load`/`save` のテストを書き、**失敗を確認する**: contracts/storage.md の「読み込み」の表の 4 行すべて（キーなし／正しい形式／壊れた形式／アクセスで例外）と「保存」（成功・`setItem` の例外で失敗を返し例外を外に出さない）。壊れた形式には、data-model.md の `Todo.id`・`Todo.title`・`Todo.done`・`Todo.due` の制約を満たさない要素を含むケースを入れる（FR-012, FR-014）
- [X] T008 `src/storage.js` に `load(storage)` と `save(storage, todos)` を実装し T007 を通す: キー・形式・戻り値は contracts/storage.md。要素の検証は data-model.md の `Todo.id`・`Todo.title`・`Todo.done`・`Todo.due` を引用して行う。壊れた値は消さない（FR-012, FR-013, FR-014）
- [X] T009 `src/app.js` に `createApp({ document, storage, today })` の骨組みを作る: 起動時に `load` を呼び、画面の状態（data-model.md の「画面の状態」: `todos`・`filter`・`message`）を持ち、`render()` で一覧・空の表示「やることはありません」・お知らせを丸ごと描き直す。読み込み失敗時は contracts/ui.md の「お知らせの文言」を出す。状態の初期値 `filter` は data-model.md の `Filter`（`all`）（FR-014, FR-015）
- [X] T010 `src/main.js` を作る: `window.localStorage` と端末のローカル日付の `YYYY-MM-DD`（research.md R3）を `createApp` に渡す。`localStorage` へのアクセスが例外を投げても起動できるようにする（FR-012, FR-014）

**Checkpoint**: `npm test` で storage のテストが通り、`npm run dev` で空の画面が出る

---

## Phase 3: User Story 1 - やることを追加して、あとで見返す (Priority: P1) 🎯 MVP

**Goal**: やることを追加でき、再読み込み後も残る

**Independent Test**: 3 件追加 → 再読み込み → 3 件が追加順に表示される（spec.md US1）

### Tests for User Story 1 ⚠️

> **NOTE: テストを先に書き、失敗することを確認してから実装する**

- [X] T011 [P] [US1] `tests/unit/todo.test.js` に文言の検証と追加のテストを書く: `validateTitle`（前後の空白を除く／空と空白だけは不可／200 文字は可・201 文字は不可）、`addTodo`（末尾に追加・`done` は `false`・`id` は毎回異なる・同じ文言を 2 件追加できる）
- [X] T012 [P] [US1] `tests/ui/app.test.js` に US1-1〜US1-4 のテストを書く。あわせて、201 文字で入力が残りお知らせが出ること（FR-002）、0 件で「やることはありません」が出ること（FR-015）、`setItem` が失敗する偽 Storage で「保存できませんでした」が出て画面には追加されること（FR-014）、再読み込みは同じ偽 Storage で app を起動し直して再現する。アクセスで例外を投げる偽 Storage で起動すると、お知らせ「この端末に保存できません。閉じると内容は消えます」が出て、そのまま追加でき、追加後もそのお知らせが残ること（spec.md Edge Cases、FR-014、contracts/ui.md「お知らせの文言」）

### Implementation for User Story 1

- [X] T013 [US1] `src/todo.js` に `validateTitle(input)` と `addTodo(todos, { title })` を実装し T011 を通す: data-model.md の `Todo.title`（検証ルールの表）、`Todo.id`（`crypto.randomUUID()`）、`Todo.done`（初期値 `false`）を引用。配列は書き換えず新しい配列を返す
- [X] T014 [US1] `src/app.js` に追加フォームの処理を実装し T012 を通す: 送信で検証 → 追加 → `save` → `render`。成功時は入力欄を空に戻しお知らせを消す。失敗時は contracts/ui.md の「操作と結果」「お知らせの文言」どおりにする。一覧の 1 行は文言だけを表示する（完了チェック・削除・期限は後のストーリーで足す）。各行に `data-id` を付ける（contracts/ui.md「一覧の 1 行」）。起動時に保存先が使えないと分かっている場合は、操作のたびの「保存できませんでした」を出さず最初のお知らせを残す（contracts/ui.md「お知らせの文言」）

**Checkpoint**: US1 だけで使える状態（MVP）。`npm test` がすべて通る

---

## Phase 4: User Story 2 - 終わったやることに完了の印を付ける (Priority: P2)

**Goal**: 完了／未完了を切り替えられ、見た目で区別できる

**Independent Test**: 1 件追加 → 完了 → 再読み込みで完了のまま → 未完了に戻せる（spec.md US2）

### Tests for User Story 2 ⚠️

- [ ] T015 [P] [US2] `tests/unit/todo.test.js` に `toggleTodo` のテストを書く: 指定した `id` だけ `done` が反転する、存在しない `id` では変わらない
- [ ] T016 [P] [US2] `tests/ui/app.test.js` に US2-1〜US2-3 のテストを書く: 完了の行に `done` クラスが付く（FR-006）。初期データは偽 Storage に直接入れて用意する

### Implementation for User Story 2

- [ ] T017 [US2] `src/todo.js` に `toggleTodo(todos, id)` を実装し T015 を通す（data-model.md の `Todo.done` と「状態の変化」）
- [ ] T018 [US2] `src/app.js` の 1 行に完了チェック（ラベルは文言）を足し、変更で `toggleTodo` → `save` → `render`。完了の行に `done` クラスを付ける。T016 を通す

**Checkpoint**: US1 と US2 がどちらも動く

---

## Phase 5: User Story 3 - 要らなくなったやることを消す (Priority: P3)

**Goal**: やることを確認なしで削除できる

**Independent Test**: 2 件追加 → 1 件削除 → 再読み込みでも戻らない（spec.md US3）

### Tests for User Story 3 ⚠️

- [ ] T019 [P] [US3] `tests/unit/todo.test.js` に `removeTodo` のテストを書く: 指定した `id` だけ消え、残りの順番は変わらない
- [ ] T020 [P] [US3] `tests/ui/app.test.js` に US3-1〜US3-3 のテストを書く: 削除ボタンは読み上げ名「<文言> を削除」で探す。US3-3 の完了済みのやることは偽 Storage に直接入れて用意する（US2 に依存しない）。同じ文言のやることを 2 件用意し、2 件目だけを削除すると 1 件目が残ること（spec.md Edge Cases。行は `data-id` で特定する）

### Implementation for User Story 3

- [ ] T021 [US3] `src/todo.js` に `removeTodo(todos, id)` を実装し T019 を通す（data-model.md の `Todo.id`）
- [ ] T022 [US3] `src/app.js` の 1 行に「削除」ボタン（`aria-label` は「<文言> を削除」）を足し、押すと確認なしで `removeTodo` → `save` → `render`。T020 を通す

**Checkpoint**: US1〜US3 が動く

---

## Phase 6: User Story 4 - 期限を付けて、過ぎたものに気づく (Priority: P4)

**Goal**: 期限を付けられ、期限を過ぎた未完了のやることが目立つ

**Independent Test**: 期限が昨日と明日のやることを追加 → 昨日の分だけ「期限切れ」（spec.md US4）

### Tests for User Story 4 ⚠️

- [ ] T023 [P] [US4] `tests/unit/todo.test.js` にテストを書く: `addTodo` に期限を渡すと保存され、空文字なら `null` になる。`isOverdue(todo, today)` は「昨日が期限・未完了」だけ `true`、「今日が期限」「明日が期限」「期限なし」「昨日が期限・完了」は `false`。`toDateString(date)` が端末のローカル日付で `YYYY-MM-DD` を返す
- [ ] T024 [P] [US4] `tests/ui/app.test.js` に US4-1〜US4-5 のテストを書く: 「今日」は T006 のヘルパーで固定する。期限切れの行に `overdue` クラスと「期限切れ」の文字がある（FR-010）、期限は「期限: YYYY-MM-DD」で表示される（FR-009）

### Implementation for User Story 4

- [ ] T025 [US4] `src/todo.js` の `addTodo` が `due` を受け取るようにし、`isOverdue(todo, today)` と `toDateString(date)` を実装して T023 を通す: data-model.md の `Todo.due` と「導出される値」を引用。比べるのは `YYYY-MM-DD` の文字列どうし（research.md R3）
- [ ] T026 [US4] `src/app.js` で「期限（任意）」入力欄の値を `addTodo` に渡し、追加後に空に戻す。1 行に期限と期限切れの印を表示する（contracts/ui.md の「一覧の 1 行」）。`src/main.js` の日付作成を `toDateString` に置き換える。T024 を通す

**Checkpoint**: US1〜US4 が動く

---

## Phase 7: User Story 5 - 状態で絞り込む (Priority: P5)

**Goal**: 「すべて／未完了／完了」で表示を切り替えられる

**Independent Test**: 未完了 2 件・完了 1 件 → 「未完了」2 件、「完了」1 件、「すべて」3 件（spec.md US5）

### Tests for User Story 5 ⚠️

- [ ] T027 [P] [US5] `tests/unit/todo.test.js` に `filterTodos(todos, filter)` のテストを書く: data-model.md の `Filter` の 3 つの値それぞれで正しいやることだけを順番どおりに返す
- [ ] T028 [P] [US5] `tests/ui/app.test.js` に US5-1〜US5-6 のテストを書く: 選択中のボタンは `aria-pressed="true"`、0 件のときは「該当するやることはありません」（FR-015）。初期データは偽 Storage に直接入れて用意する

### Implementation for User Story 5

- [ ] T029 [US5] `src/todo.js` に `filterTodos(todos, filter)` を実装し T027 を通す（data-model.md の `Filter`）
- [ ] T030 [US5] `src/app.js` で絞り込みボタンの押下で `filter` を変えて `render` する（保存しない）。`render` は `filterTodos` の結果を表示し、0 件なら全体が 0 件か絞り込みで 0 件かによって空の表示の文言を切り替える。T028 を通す

**Checkpoint**: すべてのストーリーが動く

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 複数のストーリーにまたがる仕上げ

- [ ] T031 [P] `src/style.css` に見た目を足す: `done` の行は取り消し線、`overdue` の行は色と「期限切れ」の文字の両方で目立たせる（research.md R7）。絞り込みの選択中ボタンを区別する（FR-006, FR-010, FR-011）
- [ ] T032 [P] `tests/ui/performance.test.js` を書く: 500 件を偽 Storage に入れて起動し、追加・切り替え・削除・絞り込みのそれぞれで画面反映までが 0.1 秒以内（SC-002）
- [ ] T033 [P] `tests/unit/no-network.test.js` を書く: `src/` のファイルに `fetch`・`XMLHttpRequest`・`WebSocket`・`navigator.sendBeacon` が含まれないこと（FR-013 / SC-005）
- [ ] T034 `npm test` がすべて通り、テスト名に US1-1〜US5-6 の 21 個がそろっていることを確認する（SC-006）。`npm run build` が成功することを確認する
- [ ] T035 quickstart.md の「手で確かめる流れ」9 手順と「保存の失敗を確かめる」をブラウザで実行し、結果を確認する（SC-001, SC-003, SC-004, SC-005）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。T001 が先（T002〜T004 は T001 の後に並行可）
- **Foundational (Phase 2)**: Setup の後。すべてのストーリーをブロックする
- **User Stories (Phase 3〜7)**: Foundational の後。この lab では 1 人で進めるので優先度順（P1 → P5）に行う
- **Polish (Phase 8)**: すべてのストーリーの後

### User Story Dependencies

- **US1 (P1)**: Foundational の後。他のストーリーに依存しない
- **US2 (P2)**: Foundational の後。テストの初期データは偽 Storage に直接入れるので US1 の追加機能に依存しない。ただし `src/app.js` の 1 行の描画は US1 で作ったものに足す
- **US3 (P3)**: 同上。完了済みのデータも偽 Storage に直接入れるので US2 に依存しない
- **US4 (P4)**: `addTodo` の拡張なので US1 の T013 に依存する
- **US5 (P5)**: Foundational の後。初期データは偽 Storage に直接入れる

### Within Each User Story

- テストを先に書き、**失敗を確認してから**実装する（原則 I）
- `src/todo.js`（純粋関数）→ `src/app.js`（画面）の順
- ストーリーが終わったら `npm test` を通してから次へ

### Parallel Opportunities

- Setup: T002・T003・T004
- Foundational: T005・T006
- 各ストーリー: 単体テストと画面テスト（例: T011 と T012）は別ファイルなので並行可
- Polish: T031・T032・T033
- `src/todo.js` と `src/app.js` はどのストーリーでも触るので、ストーリーどうしの並行は勧めない

---

## Parallel Example: User Story 1

```bash
# User Story 1 のテストを同時に書く:
Task: "tests/unit/todo.test.js に validateTitle と addTodo のテストを書く"
Task: "tests/ui/app.test.js に US1-1〜US1-4 のテストを書く"

# 両方が失敗することを確認してから、T013 → T014 の順に実装する
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational（すべてのストーリーをブロックする）
3. Phase 3: User Story 1
4. **止めて確認**: `npm test` と、ブラウザで追加 → 再読み込み
5. ここで一度コミットする

### Incremental Delivery

1. Setup + Foundational → 土台ができる
2. US1 → テスト → コミット（MVP）
3. US2 → テスト → コミット
4. US3 → テスト → コミット
5. US4 → テスト → コミット
6. US5 → テスト → コミット
7. Polish → quickstart で確認 → コミット

---

## Notes

- [P] のタスクは別ファイルで、未完了のタスクに依存しない
- [Story] のラベルで、タスクとユーザーストーリーを対応付ける
- 実装が spec.md・contracts とずれたら、先に文書を直してからコードを直す（原則 IV）
- spec にない機能（編集・並べ替え・検索など）は足さない（原則 III）
- ランタイム依存を足さない。足す必要が出たら先に plan.md の Complexity Tracking に理由を書く（原則 II）
