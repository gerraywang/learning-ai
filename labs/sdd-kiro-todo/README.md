# lab2: Kiro 風の 3 点セットを手で書いて TODO アプリを作る
<!-- Last updated: 2026-11-22 -->
lab1（[Spec Kit](../sdd-speckit-todo/README.md)）と**同じアプリ**を、Kiro の Specs の型
（requirements / design / tasks）で**自分の手で**書き、Claude Code に実装させる。
Kiro 本体は使わない。型だけを借りて、Spec Kit との違いを比べる。

## Kiro の Specs の型（出典: https://kiro.dev/docs/specs/ ほか、確認日 2026-11-22）
| ファイル | 中身 | ドキュメントで確認できたこと |
|---|---|---|
| `.kiro/specs/todo-app/requirements.md` | ユーザーストーリーと受け入れ条件 | EARS 記法 `WHEN [条件] THE SYSTEM SHALL [振る舞い]` |
| `.kiro/specs/todo-app/design.md` | 設計 | アーキテクチャと部品、データモデルとインターフェース、技術の選択、エラー処理、テスト方針 |
| `.kiro/specs/todo-app/tasks.md` | 実装タスク | 追跡できるタスク、任意／必須の区別。**番号や要件参照の書き方はドキュメントに記載なし** |

- 順番は Requirements → Design → Tasks（Requirements-First）。各段で人が確かめてから次へ
- Spec Kit との構造の違い: 原則（constitution）がない（Kiro では steering が近い。今回は使わない）、
  plan が design 1 つにまとまる、research / data-model / contracts / quickstart に分かれない、
  analyze / converge に当たるコマンドがない（Kiro 本体には Analyze Requirements がある）
- Kiro は変化が速い。上の内容は 2026-11-22 時点。使う前に要確認

## 進め方
**ルール: lab1 の `specs/001-todo-app/` を見ずに書く**（見ると型の違いではなく写しの比較になる）。
機能の範囲だけは lab1 と揃える: 追加・完了・削除・期限・絞り込み、データは端末内。

| 段 | やること | 誰が | できた |
|---|---|---|---|
| 1 要件 | `requirements.md` を書く | 自分 | ✅ |
| 1.5 確認 | Claude Code に「曖昧・矛盾・抜け」を指摘させ、自分で直す | 自分＋Claude | ✅ 別セッションで 32 件指摘 → 反映 |
| 2 設計 | `design.md` を書く（技術は lab1 と揃えると比べやすい: Vite・素の JS・localStorage・Vitest） | 自分 | ✅（Claude 下書き → 確認） |
| 3 タスク | `tasks.md` を書く | 自分 | ✅ 10 グループ・26 サブタスク（Claude 下書き） |
| 4 実装 | Claude Code に実装させる（下の頼み方） | Claude | ⬜ |
| 5 確認 | 要件の受け入れ条件を 1 つずつ動かして確かめる | 自分 | ⬜ |

### 実装の頼み方（例）
```text
.kiro/specs/todo-app/ の requirements.md・design.md・tasks.md だけを正として、
tasks.md のタスクを上から順に実装して。1 タスク終わるごとに tasks.md にチェックを付けて。
3 つの文書に書いていないことは作らず、迷ったら止まって質問して。
```

## 比べること（終わってから書く）
| 観点 | lab1（Spec Kit） | lab2（Kiro 風・手書き） |
|---|---|---|
| 書くのにかかった時間・手間 | ほぼ AI が生成 | |
| 要件の粒度と、テストへの落としやすさ（FR-xxx と EARS） | | |
| AI が勝手に決めた前提の量 | Assumptions に多数 | |
| 実装が文書からずれた箇所 | なし（analyze で事前に発見） | |
| 文書の量（ファイル数・行数） | 9 ファイル | 3 ファイル |
| 原則（constitution）がないことの影響 | | |

## 学んだこと
（終わってから）
