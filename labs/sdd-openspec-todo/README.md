# lab4: OpenSpec で「既存を整理し、改修分を足す」を試す
<!-- Last updated: 2026-11-22 -->
01 SDD のまとめで書いた進め方（**現状あるものをベースに既存を整理し、改修分は足していく**）を、
既存コード（brownfield）向けをうたう OpenSpec で確かめる。lab3 の Spec Kit で残った
「古い記述が 001 に残る」「いまの仕様を知るには 001 と 002 を重ねて読む」が解消されるかを見る。

## OpenSpec の要点（出典: https://github.com/Fission-AI/OpenSpec 、https://openspec.dev/docs/quickstart ほか、確認日 2026-11-22）
- `openspec/specs/` = システムが**いま**どう振る舞うかの正本。`openspec/changes/` = 進行中の変更（1 変更 = 1 フォルダ）
- 1 つの変更: `proposal.md`（Why / What Changes / Capabilities / Impact）、仕様の差分 `specs/<capability>/spec.md`、
  必要なときだけ `design.md`、`tasks.md`
- 差分の書き方: `## ADDED / MODIFIED / REMOVED / RENAMED Requirements` → `### Requirement: <名前>` → `#### Scenario: <名前>`（WHEN / THEN）。
  MODIFIED は要件を丸ごと書き直す。REMOVED には理由（Reason）と移行（Migration）が必須
- 流れ: explore → propose → review（人）→ apply → archive。**archive で差分が `specs/` に反映**され、変更フォルダは日付付きで履歴に残る
- スラッシュコマンド（v2）: `/openspec-explore`・`/openspec-propose <名前>`・`/openspec-apply-change`・`/openspec-archive-change`
- 最新は v2.1.1（2026-11-19）。v2.0.0（2026-11-11）でコマンド名が変わったばかり。**手順は使う前に要確認**
- インストール: `npm install -g @fission-ai/openspec@latest`（Node.js 22.20 以上）または `brew install openspec`
- `openspec init` の既定はスキルを**マシン全体**に入れる。この lab では `--scope project` でリポジトリの中に置く
- **正本の `specs/` は、変更を archive したときにだけ埋まる。** explore は考えるためのモードで、正本には書かない
  （書けるのは変更の文書だけで、書く前に yes / no の確認を取る）。そのため「既存の整理」も 1 つの変更として作り、archive する
  （`.agents/skills/openspec-explore/SKILL.md` で確認、2026-11-22）
- 正本は**機能のまとまり（capability）ごと**に `openspec/specs/<capability>/spec.md`。変更の差分も、触れる capability ごとに置く
- `openspec/config.yaml` の `context` に「成果物は日本語で書く」と「コメントの FR 番号は以前の仕様の名残」を書いた

## 題材と条件
- lab1 の TODO アプリ（001 と 002 の実装後、テスト 144 件）の **コードとテストだけ** をコピーした（2026-11-22）。
  Spec Kit の文書（`specs/`・`.specify/`・`.claude/`）は持ち込んでいない＝「仕様書のない既存システム」
- **条件の注意**: コードのコメントとテスト名に lab1 の仕様の番号（`FR-012`・`US1-1` など）が 152 か所残っている。
  AI はそこから元の仕様を読み取れるので、実務の「仕様書もコメントもないシステム」より簡単な条件
- 保存キーは lab1 と同じ `sdd-speckit-todo`。同じ localhost で lab1 と同時に動かすとデータが混ざる

## 進め方
新しい Claude Code をこのフォルダで起動して行う。

```bash
cd ~/repositories/learning-ai/labs/sdd-openspec-todo
npm install && npm test          # 144 件が通ることを先に確かめる
openspec init --tools claude --scope project
claude
```

| 段 | やること | 誰が | できた |
|---|---|---|---|
| 1-a 既存の調査 | `/openspec-explore` で今のコードを調べさせ、機能のまとまり（capability）の分け方の案を出させる。分け方は自分で決める | Claude＋自分 | ⬜ |
| 1-b 既存の記録 | 「`baseline-current-behavior` という変更として記録して」と頼み、今の振る舞いを ADDED Requirements として書かせる（コードは変えない。tasks は既存のテストが通ることの確認だけ） | Claude | ⬜ |
| 1-c 正本にする | 中身を確かめてから `/openspec-archive-change` → 正本の `openspec/specs/<capability>/spec.md` が埋まる | 自分＋Claude | ⬜ |
| 2 確認 | 起こした `specs/` を読み、実際の画面の振る舞いと合っているかを確かめる | 自分 | ⬜ |
| 3 変更の提案 | `/openspec-propose add-due-edit` で「期限の編集」を提案させる（下の依頼文） | Claude | ⬜ |
| 4 レビュー | proposal・差分・tasks を読み、直す（「やらないこと: 期限の編集」が REMOVED か MODIFIED になっているか） | 自分 | ⬜ |
| 5 実装 | `/openspec-apply-change` | Claude | ⬜ |
| 6 反映 | `/openspec-archive-change` で `specs/` に反映 | Claude | ⬜ |
| 7 確認 | 画面で期限の編集を確かめる。`specs/` だけを読んで「いまの仕様」が分かるか | 自分 | ⬜ |

### 変更の依頼（段 3）
```text
TODO の期限を後から編集できるようにしたい。
- 内容の編集と同じように、一覧の各 TODO で編集を始め、確定すると期限が変わる。取り消すと元に戻る
- 期限は空にもできる（期限なしに戻せる）
- 編集した結果も、ほかの操作と同じように保存され、再読み込みしても残る
```

## 比べること（lab3 の Spec Kit と）
| 観点 | Spec Kit（lab3） | OpenSpec（lab4） |
|---|---|---|
| 既存の仕様をどう用意したか | 最初から AI が作った 001 があった | 段 1 でコードから起こした |
| 改修の足し方 | 002 を新しく作る | 変更フォルダの差分 → archive で正本に反映 |
| 古い記述（「やらないこと」）が残らなかったか | 001 に残った（追記で対応） | |
| 「いまの仕様」を知るのに読むファイル | 001 と 002 を重ねて読む | |
| 人がレビューする段と、気づけたこと | clarify・analyze | |
| 依頼文にない判断を AI がしたか | | |
| 変更前のテストは壊れなかったか（件数の変化） | 壊れなかった（96 → 144） | |
| かかった手間 | 段が多い | |

## 学んだこと
（終わってから）
