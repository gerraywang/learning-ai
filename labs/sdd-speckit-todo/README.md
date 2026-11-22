# lab1: Spec Kit で TODO アプリを作る
<!-- Last updated: 2026-11-22 -->
GitHub Spec Kit（specify-cli 1.4.3、2026-11-19 リリース）の流れを最後まで体験する。

## 準備（済み 2026-11-22）
- `brew install uv` → `uv tool install --python 3.12 specify-cli`
- `specify init sdd-speckit-todo --integration claude --non-interactive`
- `.claude/skills/speckit-*` に 9 つのスキル、`.specify/` にテンプレートと原則（constitution）が入る

## 進め方
このフォルダで Claude Code を起動し、1 段ずつ実行する。**各段の出力を自分で読んで直してから次へ**（ここが学習の本体）。

```bash
cd labs/sdd-speckit-todo && claude
```

| 段 | コマンド（例） | 読むもの | できた |
|---|---|---|---|
| 1 原則 | `/speckit-constitution テストを先に書く・依存は最小・シンプルさ優先` | `.specify/memory/constitution.md` | ⬜ |
| 2 仕様 | `/speckit-specify ブラウザで使う TODO アプリ。追加・完了・削除・期限・絞り込み。データは端末内に保存` | `specs/001-*/spec.md` | ⬜ |
| 2.5 明確化 | `/speckit-clarify` | spec.md に追記された Q&A | ⬜ |
| 3 計画 | `/speckit-plan Vite と素の JavaScript。保存は localStorage。テストは Vitest` | `plan.md`・`research.md`・`data-model.md` | ⬜ |
| 4 タスク | `/speckit-tasks` → `/speckit-analyze` | `tasks.md`・一貫性レポート | ⬜ |
| 5 実装 | `/speckit-implement` | コードとテスト | ⬜ |
| 6 収束 | `/speckit-converge`（`Converged` になるまで 5 と繰り返す） | tasks.md に足された残作業 | ⬜ |

## 観察メモ（段ごとに書く）
- spec.md に「何を」「なぜ」が書かれ、「どう作るか」が入っていないか
- plan で技術を決めた理由が残っているか
- tasks の粒度と順番（テストが先か）
- 実装が仕様からずれた箇所と、そのときどちらを直したか

## 学んだこと
（終わってから）
