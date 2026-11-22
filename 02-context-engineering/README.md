# 02 コンテキストエンジニアリング
<!-- Last updated: 2026-11-22 -->
（01 SDD が終わってから中身を作る。ねらいはトップの README のロードマップ表）

## 学ぶこと
## 教材（2026-11-22 に確認。AI ツールの情報は変わりやすいので、使う前に要確認）
| 教材 | 何が分かるか |
|---|---|
| Best practices for Claude Code（Claude Code 公式ドキュメント、https://code.claude.com/docs/en/best-practices 。日付の記載なし） | CLAUDE.md は短く（200 行未満が目安）、コードを読めば分かることは書かない。必ず守らせたいことは hook や deny rule に。まず仕様を `SPEC.md` に書かせ、実装は新しいセッションで。元はブログ記事（2025-04 ごろ、要確認）で、今は旧 URL からこのページに転送される |
| Effective context engineering for AI agents（Anthropic のエンジニアリングブログ、https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents 。記事のページでは 2025-09-29、一覧では 2025-09-17 と表示。要確認） | AI に渡す情報の設計の考え方。指示は細かすぎず曖昧すぎない高さで、最小から始めて失敗したところだけ足す。必要なファイルはその都度取りにいかせる。長い作業は外部のメモに書いて読み戻す |
| （候補・未読）The components of agent memory（同ブログ、2026-11-06） | エージェントのメモリの組み立て。06 とも関わる |

## 課題
## 理解度チェック
