# 01 SDD（Spec-Driven Development, 仕様駆動開発）
<!-- Last updated: 2026-11-22 -->

## 一言で
コードより先に「仕様」を正として書き、AI はその仕様から計画・タスク・実装を作る。
「雰囲気でプロンプトして書かせる（vibe coding）」の反対側。

## 学ぶこと
1. 考え方: なぜ仕様を正にするのか（意図の固定・レビュー単位・再生成できること）
2. 成果物の型: 原則（constitution）→ 仕様（spec / requirements）→ 設計（plan / design）→ タスク（tasks）→ 実装
3. 要件の書き方: ユーザーストーリー、受け入れ条件、EARS 記法（「〜のとき、システムは〜しなければならない」）
4. ツール比較: GitHub Spec Kit／Kiro／Claude Code だけで回す方法
5. 限界: 仕様と実装のずれ、仕様の書きすぎ、変更時の運用

## 教材（2026-11-22 時点。版が変わりやすいので使う前に要確認）
| 教材 | 何が分かるか |
|---|---|
| GitHub Spec Kit（github.com/github/spec-kit、1.4.3 を 2026-11-22 に確認） | `/speckit-constitution` → `specify` → `plan` → `tasks` → `implement` → `converge`（収束判定）。Claude Code では `.claude/skills/` にスキルとして入る |
| Kiro（kiro.dev）の Specs | requirements.md（EARS）・design.md・tasks.md の 3 点セット |
| Anthropic のエンジニアリングブログ（Claude Code のベストプラクティス、コンテキストエンジニアリング） | 計画を先に書かせる・CLAUDE.md の書き方 |

## 課題
- [x] lab1: Spec Kit で小さな TODO アプリを最後まで作る（[labs/sdd-speckit-todo](../labs/sdd-speckit-todo/README.md)、2026-11-22 修了）
- [x] lab2: 同じアプリを Kiro 風の 3 点セット（requirements / design / tasks）を手で書いて Claude Code に作らせ、違いを比べる（[labs/sdd-kiro-todo](../labs/sdd-kiro-todo/README.md)、2026-11-22 修了）
- [ ] lab3: 仕様を 1 か所変えて再生成し、どこまで追従するかを見る（[labs/sdd-spec-change](../labs/sdd-spec-change/README.md)、準備済み 2026-11-22）
- [ ] まとめ: 実務の業務システム改修に持ち込むなら何を仕様にするかを一般論で書く

## 理解度チェック（自分の言葉で答えられたら ✅）
- [ ] SDD と TDD・従来の設計書駆動の違い
- [ ] 仕様に書くこと／書かないこと
- [ ] 仕様と実装がずれたとき、どちらを直すか
