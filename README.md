# learning-ai
<!-- Last updated: 2026-11-22 -->
AI を使った開発を体系的に学ぶ。最初の柱は **SDD（Spec-Driven Development, 仕様駆動開発）**。

## ロードマップ
| # | テーマ | ねらい | 課題（labs） | 状態 |
|---|---|---|---|---|
| 01 | [SDD 仕様駆動開発](01-sdd/README.md) | 仕様 → 計画 → タスク → 実装の流れで AI に作らせる | 小さなアプリを Spec Kit で 1 本＋比べる課題 3 本（Kiro 風・仕様の変更・OpenSpec で既存に改修。lab1〜4） | ✅ |
| 02 | [コンテキストエンジニアリング](02-context-engineering/README.md) | プロンプトでなく「AI に渡す情報の設計」を学ぶ | CLAUDE.md の良し悪しを比べる | 🟡 |
| 03 | [エージェントとツール（MCP）](03-agents-and-tools/README.md) | ツール呼び出し・MCP・マルチエージェントの仕組み | 自作 MCP サーバーを 1 つ | ⬜ |
| 04 | [Claude Code のハーネス](04-claude-code-harness/README.md) | Skills・Subagents・Hooks・ルーチンを設計として理解する | 自分の Claude Code 設定を図にする | ⬜ |
| 05 | [Evals（評価）](05-evals/README.md) | AI の出力の良し悪しを測る方法 | 小さな評価セットを作って回す | ⬜ |
| 06 | [RAG とメモリ](06-rag-and-memory/README.md) | 検索拡張・長期記憶の設計 | 手元の文書で RAG を 1 本 | ⬜ |

## フォルダ
```
learning-ai/
├── CLAUDE.md      ← 入口とルール
├── README.md      ← ロードマップ（進み具合はここだけ）
├── 01-sdd/ … 06-rag-and-memory/   ← テーマごとの README（学ぶこと・教材・課題）
├── notes/         ← 学習ログ（YYYY-MM-DD-<テーマ>.md）
└── labs/          ← 手を動かす課題
```
