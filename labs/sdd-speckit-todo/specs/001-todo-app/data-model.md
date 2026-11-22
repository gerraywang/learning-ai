# Data Model: ブラウザで使う TODO アプリ

**Date**: 2026-11-22 | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Todo（やること）

| 項目 | 型 | 必須 | 説明 | 根拠 |
|---|---|---|---|---|
| `id` | string | ✅ | `crypto.randomUUID()` で作る識別子。変わらない | 同じ文言を複数持てる（Edge Cases） |
| `title` | string | ✅ | 前後の空白を除いた文言。1〜200 文字 | FR-001 / FR-002 |
| `done` | boolean | ✅ | 完了なら `true`。追加時は `false` | FR-004 / FR-005 |
| `due` | string \| null | ✅ | 期限。`YYYY-MM-DD` または `null`（期限なし） | FR-008 |

- **順番**: 配列の並び順＝追加した順（古いものが先頭）。順番のための項目は持たない（FR-003）。
- **作成日時などは持たない**: spec にそれを使う要求がないため（原則 III）。

### 検証ルール

| ルール | 違反したとき | 根拠 |
|---|---|---|
| `title.trim()` の長さが 0 | 追加しない。「やることを入力してください」 | FR-002 |
| `title.trim()` の長さが 200 を超える | 追加しない。「200 文字以内で入力してください」 | FR-002 |
| `due` が空文字 | `null` として扱う（期限なし） | FR-008 |
| 文字数は「見た目の 1 文字」ではなく JavaScript の文字列長で数える | — | 単純さ優先。絵文字などで差が出るのは許容 |

### 状態の変化

```text
           追加
            │
            ▼
       ┌─────────┐  完了の印を付ける   ┌──────┐
       │ 未完了   │ ─────────────────▶ │ 完了  │
       │ done=false│ ◀───────────────── │done=true│
       └─────────┘    印を外す         └──────┘
            │                              │
            └──────────── 削除 ────────────┘
                           ▼
                      （一覧から消える）
```

### 導出される値（保存しない）

- **期限切れ** `isOverdue(todo, today)` = `todo.done === false` かつ `todo.due !== null` かつ
  `todo.due < today`（`today` は端末のローカル日付の `YYYY-MM-DD`）— FR-010、US4 シナリオ 3〜5

## Filter（絞り込み条件）

| 値 | 表示されるやること |
|---|---|
| `all`（初期値） | すべて |
| `active` | `done === false` |
| `completed` | `done === true` |

- 画面の状態としてだけ持ち、保存しない（spec の Assumptions）— FR-011

## 画面の状態（app.js が持つもの）

| 項目 | 説明 |
|---|---|
| `todos` | Todo の配列 |
| `filter` | Filter の値 |
| `message` | 利用者へのお知らせ（入力エラー・保存失敗・読み込み失敗）。なければ空 |

## 保存データ

形式は [contracts/storage.md](./contracts/storage.md) を参照。
