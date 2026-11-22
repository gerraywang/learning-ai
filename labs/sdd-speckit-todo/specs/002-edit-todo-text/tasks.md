---

description: "やることの文言を後から編集する機能の実装タスク"
---

# Tasks: やることの文言を後から編集する

**Input**: Design documents from `specs/002-edit-todo-text/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: 必須。constitution の原則 I（テスト先行・NON-NEGOTIABLE）により、各ストーリーのテストを
実装より先に書き、**失敗することを確認してから**実装する。受け入れシナリオ（US1: 8、US2: 5、US3: 5 の
計 18 個）は `tests/ui/edit.test.js` のテストに 1 対 1 で対応させ、テスト名に `US1-1` のような番号を入れる。
001 のテスト（96 件）は壊さない（SC-005）。

**Organization**: ユーザーストーリーごとにフェーズを分け、各ストーリーを単独でテストできるようにする。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行して進められる（別ファイルで、未完了のタスクに依存しない）
- **[Story]**: どのユーザーストーリーのタスクか（US1〜US3）
- パスはすべて `labs/sdd-speckit-todo/` からの相対パス

## Path Conventions

単一プロジェクト（plan.md の Project Structure）。既存の `src/`、`tests/unit/`、`tests/ui/`、
`tests/helpers/` に足す。新しいソースファイルは作らない。

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 変更前の状態を確かめる

- [ ] T001 `npm test` を実行し、001 のテストが 96 件すべて通ることを確かめて件数を記録する（変更前の基準。plan.md Technical Context の Constraints）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのストーリーが使うテストの道具と、文言を変える純粋関数

**⚠️ CRITICAL**: このフェーズが終わるまでストーリーの作業に入らない

- [ ] T002 `tests/helpers/render-app.js` を直す: `deleteButton` は行の中の `button.remove` で探す（research.md R8）。編集用の操作を足す: `editButton(indexOrId)`（行の中の `button.edit`）、`startEdit(indexOrId)`、`editInput()`（編集中の行の「やることの文言」入力欄）、`confirmEditButton()`／`cancelEditButton()`（「確定」「取り消し」）、`confirmEdit(text)`（入力欄に文言を入れて「確定」を押す）、`pressKey(key, { isComposing })`（編集の入力欄で keydown を起こす）、`submitEditWithEnter(text)`（入力欄に文言を入れてフォームを送信する）。要素はすべて contracts/ui.md のラベル・文言・クラスで探す。直した後に `npm test` で 96 件が通ることを確かめる
- [ ] T003 [P] `tests/unit/todo.test.js` に `editTodo` の単体テストを足し、失敗することを確認する: 指定した id の `title` だけが変わる／`done`・`due`・`id`・配列の順番は変わらない／ほかのやることは変わらない／同じ文言のやることが複数あっても指定した id だけ変わる／元の配列を変えない（data-model.md Todo.title・Todo.id・Todo.done・Todo.due、FR-003 / FR-007）
- [ ] T004 `src/todo.js` に `editTodo(todos, id, title)` を足して T003 を通す。`title` は `validateTitle` を通したものを受け取る（research.md R6、data-model.md Todo.title、FR-003 / FR-007）

**Checkpoint**: 96 件 + `editTodo` の単体テストが通る

---

## Phase 3: User Story 1 - 書き間違えたやることを直す (Priority: P1) 🎯 MVP

**Goal**: 各行の「編集」から文言を書き換え、「確定」か Enter で確定できる。期限・完了・位置は変わらず、再読み込み後も残る

**Independent Test**: 期限付きのやることを追加 → 編集して確定 → 新しい文言・期限・完了・位置がそのまま → 再読み込み後も新しい文言

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T005 [US1] `tests/ui/edit.test.js` を新しく作り、US1-1〜US1-8 の画面テストを書いて失敗することを確認する（spec.md US1 の Acceptance Scenarios 1〜8）。あわせて次も書く: 文言を変えずに確定してもエラーにならず通常の行に戻る／前後の空白を除くと元と同じなら同じ扱い／同じ文言の行が 2 つあっても編集した行だけ変わる（spec.md Edge Cases）／確定時に保存に失敗すると表示は新しい文言で「保存できませんでした」が出る（FR-011、`tests/helpers/memory-storage.js` の `createFailingSetStorage`）／編集を始めると入力欄にフォーカスがあり、確定後はその行の「編集」にフォーカスがある（contracts/ui.md「操作と結果」、research.md R7）

### Implementation for User Story 1

- [ ] T006 [US1] `src/app.js` の行の描画に「編集」ボタンを足す: 削除ボタンの前、`edit` クラス、読み上げ名「<文言> を編集」（contracts/ui.md「一覧の 1 行（通常のとき）に足す部品」、FR-001）
- [ ] T007 [US1] `src/app.js` に画面の状態 `editing`（`null` または `{ id, draft }`）を足し、編集中の行を描く: `<li>` に `editing` クラス、`<form class="edit-form">` の中に「やることの文言」入力欄（`draft` を入れる）と「確定」（submit）。期限・期限切れの印は通常どおり（data-model.md「画面の状態」editing、contracts/ui.md「一覧の 1 行（編集中のとき）」、FR-002）
- [ ] T008 [US1] `src/app.js` で「編集」を押したら `editing = { id, draft: 今の文言 }` にして描き直し、入力欄にフォーカスする。お知らせは `baseMessage()` に戻す。別の行が編集中なら置き換える（FR-001 / FR-002 / FR-010、contracts/ui.md「操作と結果」）
- [ ] T009 [US1] `src/app.js` で編集フォームの submit を受け、`validateTitle` を通った文言を `editTodo` で反映し、`editing = null` にして既存の `updateTodos`（保存と描き直し）を通す。その後その行の「編集」にフォーカスする（data-model.md Todo.title、FR-003 / FR-005 / FR-007 / FR-008 / FR-011 / FR-012、research.md R2 / R7）
- [ ] T010 [P] [US1] `src/style.css` に編集中の行（`#todo-list li.editing`、`.edit-form`）と「編集」ボタン（`.edit`）の見た目を足す（contracts/ui.md）

**Checkpoint**: US1 のテストと 001 の 96 件が通る。ここで止めても「直して確定」はできる（MVP）

---

## Phase 4: User Story 2 - 編集をやめて元に戻す (Priority: P2)

**Goal**: 「取り消し」・Esc・ほかの操作・行の外のクリックで、元の文言のまま編集を終える

**Independent Test**: 追加 → 編集して書き換え → 取り消す → 元の文言のまま → 再読み込みしても元の文言

### Tests for User Story 2 ⚠️

- [ ] T011 [US2] `tests/ui/edit.test.js` に US2-1〜US2-5 の画面テストを足して失敗することを確認する（spec.md US2 の Acceptance Scenarios 1〜5。US2-5 は「別の行の完了切り替え」「別の行の編集開始」「絞り込みの切り替え」「行の外のクリック」をそれぞれ確かめる）。あわせて次も書く: 編集中に別の行の編集を始めると、前の行は元の文言・新しい行が編集中で、編集中の行は常に 1 つ（FR-010）／編集中に別の行を削除・正しい文言で追加すると編集は取り消される（spec.md Edge Cases）／取り消しは保存しない（FR-009。Storage の中身が変わらない）／日本語の変換中（`isComposing: true`）の Esc では取り消さない（research.md R3）／取り消し後はその行の「編集」にフォーカスがある（research.md R7）

### Implementation for User Story 2

- [ ] T012 [US2] `src/app.js` の編集フォームに「取り消し」ボタン（`type="button"`）を足し、押したら `editing = null` にして描き直し、その行の「編集」にフォーカスする。保存はしない（contracts/ui.md、FR-004 / FR-009 / FR-012、research.md R7）
- [ ] T013 [US2] `src/app.js` で編集の入力欄の `keydown` を受け、`key === 'Escape'` かつ `isComposing` でなければ T012 と同じ取り消しをする（FR-012、research.md R3）
- [ ] T014 [US2] `src/app.js` の `updateTodos` と絞り込みの処理で `editing = null` にする（ほかの操作をしたら編集は取り消し。FR-004、spec.md Clarifications）
- [ ] T015 [US2] `src/app.js` で `document` の `click` を受け、編集中で、クリックした要素が `isConnected` で、編集中の行の外なら、**編集中の行だけ**を通常の行に描き直して `editing = null` にする（FR-004、research.md R4）

**Checkpoint**: US1・US2 のテストと 001 の 96 件が通る

---

## Phase 5: User Story 3 - 決まりに合わない文言では確定できない (Priority: P3)

**Goal**: 空・空白だけ・201 文字以上では確定せず、編集中のまま入力を残して理由を示す

**Independent Test**: 追加 → 空にして確定 → 確定されず理由 → 201 文字で確定 → 確定されず理由 → 保存されている文言は元のまま

### Tests for User Story 3 ⚠️

- [ ] T016 [US3] `tests/ui/edit.test.js` に US3-1〜US3-5 の画面テストを足して失敗することを確認する（spec.md US3 の Acceptance Scenarios 1〜5）。どのテストでも、確定できなかった後に Storage の中身が変わっていないことも確かめる（SC-004）

### Implementation for User Story 3

- [ ] T017 [US3] `src/app.js` の編集フォームの submit で、`validateTitle` が失敗したら文言を変えず、`editing.draft` に入力した文言を入れ、お知らせを 001 と同じ文言（`MESSAGES.empty` / `MESSAGES.tooLong`）にして描き直す。編集中のまま、入力欄にフォーカスを戻す（data-model.md Todo.title の検証ルール、FR-006、spec.md Clarifications）

**Checkpoint**: すべてのストーリーのテストと 001 の 96 件が通る

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T018 [P] `tests/ui/performance.test.js` に「確定」「取り消し」の 500 件計測を足す（SC-002）
- [ ] T019 `npm test` で 001 の 96 件と 002 のテストがすべて通ることを確かめ、件数を記録する（SC-005 / SC-006）。spec 002 の受け入れシナリオ 18 個それぞれに、テスト名が `US<n>-<m>` のテストが 1 つ以上あることを確かめる（原則 I）
- [ ] T020 `src/` に仕様にない機能・未使用のコードが残っていないか見直す（原則 III）
- [ ] T021 `labs/sdd-speckit-todo/README.md` の「動かし方」のテスト件数を T019 の件数に直す
- [ ] T022 quickstart.md の「手で確かめる流れ」をブラウザで行う（日本語入力の変換中の Enter / Esc を含む。人が行う）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: すぐ始められる
- **Foundational (Phase 2)**: Setup の後。すべてのストーリーをブロックする
- **User Stories (Phase 3〜5)**: Foundational の後。すべて `src/app.js` と `tests/ui/edit.test.js` を触るため、P1 → P2 → P3 の順に 1 つずつ進める
- **Polish (Phase 6)**: すべてのストーリーの後

### User Story Dependencies

- **US1 (P1)**: Foundational の後。ほかに依存しない
- **US2 (P2)**: US1 の編集中の行（T007・T008）がないと取り消す対象がないため、US1 の後
- **US3 (P3)**: US1 の確定（T009）を広げるため、US1 の後。US2 には依存しない（US3-5 の「取り消せる」だけは US2 の「取り消し」ボタンを使う）

### Within Each User Story

- テストを書いて失敗を確認 → 実装 → テストが通る
- 同じ `src/app.js` を触るタスクは番号順に進める

### Parallel Opportunities

- T003（`tests/unit/todo.test.js`）は T002（`tests/helpers/render-app.js`）と並行できる
- T010（`src/style.css`）は T006〜T009（`src/app.js`）と並行できる
- T018（`tests/ui/performance.test.js`）はほかの Polish と並行できる

---

## Parallel Example: Foundational / User Story 1

```text
# Foundational
Task: "T002 tests/helpers/render-app.js を直す"
Task: "T003 tests/unit/todo.test.js に editTodo の単体テスト"

# User Story 1 の実装中
Task: "T006〜T009 src/app.js（番号順）"
Task: "T010 src/style.css に編集中の行の見た目"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2
2. Phase 3（US1）: テスト → 実装
3. **止めて確認**: 「直して確定」ができ、001 の 96 件が通る

### Incremental Delivery

1. US1 → 「直して確定」ができる（MVP）
2. US2 → 書きかけを捨てられる
3. US3 → 決まりに合わない文言で編集中のまま理由が分かる
4. 各段で 001 のテストが通ることを確かめる

---

## Notes

- 各タスクは FR / SC / ユーザーストーリー、または plan.md / research.md の節を参照する（原則 IV）
- 001 の spec.md・plan.md にある「編集は範囲外／作らない」の記述をどう扱うかは、plan.md
  「001 の文書との関係」のとおり未決。`/speckit-analyze` の結果を見て決める（本 tasks には入れていない）
- 各タスクまたはまとまりごとにコミットする
