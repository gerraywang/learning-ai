# Research: ブラウザで使う TODO アプリ

**Date**: 2026-11-22 | **Plan**: [plan.md](./plan.md)

技術の前提は lab の README の段 3「Vite と素の JavaScript。保存は localStorage。テストは Vitest」。
以下はその前提のうえで決めたこと。

## R1. UI の作り方: 素の JavaScript（フレームワークなし）

- **Decision**: React / Vue などは使わず、DOM API で直接描画する。状態が変わるたびに一覧を
  丸ごと描き直す（`render(state)` 1 本）。
- **Rationale**: 画面は 1 つ、部品は 5 種類程度。ランタイム依存 0（原則 II）で、生成された
  コードを全部読める。500 件の描き直しでも 0.1 秒（SC-002）に十分収まる。
- **Alternatives considered**: React（依存とビルドの概念が増える）、差分更新を自作（複雑になる。
  件数が小さいので不要）。

## R2. 保存: localStorage に JSON を丸ごと

- **Decision**: キー 1 つに `{ version: 1, todos: [...] }` を保存する。変更のたびに全体を書き直す。
  形式は [contracts/storage.md](./contracts/storage.md)。
- **Rationale**: 端末内に保存し、端末の外へ送らない（FR-012 / FR-013）。同期的で扱いやすく、
  数百件なら数十 KB で容量（一般に 1 オリジンあたり約 5MB）にも余裕がある。`version` を
  入れておくと、将来形式を変えたときに古いデータを見分けられる。
- **Alternatives considered**: IndexedDB（非同期で API が大きい。件数に対して過剰）、
  1 件 1 キー（書き込みは減るが、順番の管理と読み込みが複雑になる）。
- **失敗の扱い**（FR-014 / Edge Cases）:
  - `localStorage` へのアクセス自体が例外（設定で禁止）→ メモリ上だけで動かし、保存できない旨を表示
  - `setItem` が例外（容量不足など）→ 画面の状態はそのまま、保存できなかった旨を表示
  - 読んだ値が JSON として壊れている・形式が違う → 空の一覧で始め、読み込めなかった旨を表示。
    壊れた値は次に保存するまで消さない
- **出典**: MDN「Window: localStorage property」https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
  （確認日 2026-11-22。容量の目安はブラウザにより異なるため要確認）

## R3. 期限と「今日」の扱い

- **Decision**: 期限は `YYYY-MM-DD` の文字列で持つ。入力は `<input type="date">`。「今日」は
  端末のローカル日付から同じ形式の文字列を作り、文字列どうしで比べる（`due < today` かつ未完了なら
  期限切れ）。
- **Rationale**: 時刻を扱わない（spec の Assumptions）。`Date` オブジェクトで比べると時差・
  時刻の端数で「今日が期限」が期限切れになる誤りが起きやすい。`YYYY-MM-DD` は文字列の大小が
  日付の前後と一致する。
- **テストのしやすさ**: 期限切れ判定は `isOverdue(todo, today)` のように「今日」を引数で受け取る。
  テストで日付を固定できる。
- **Alternatives considered**: タイムスタンプで保存（時刻の概念が入り、表示時の変換も要る）。

## R4. 識別子

- **Decision**: `crypto.randomUUID()` で作る文字列。
- **Rationale**: 同じ文言のやることを複数持てる（Edge Cases）ため、文言では区別できない。
  標準機能で依存が要らない。localhost でも安全なコンテキストとして使え、Node（テスト）にもある。
- **Alternatives considered**: 連番（削除・再読み込みをまたいだ採番の管理が要る）。

## R5. テストの分け方: Vitest + jsdom

- **Decision**: `tests/unit/` は Node 環境で `todo.js` と `storage.js` をテスト。`tests/ui/` は
  jsdom 環境で `index.html` と同じ要素を作り、`app.js` を起動してクリック・入力を再現する。
  localStorage はテスト用の偽物（メモリ上の Storage）を渡す。
- **Rationale**: spec の受け入れシナリオは画面の操作として書かれているので、そのまま 1 対 1 で
  テストにできる（原則 I・IV）。`storage.js` が Storage を引数で受け取るので、失敗のケース
  （例外を投げる Storage）も簡単に作れる。
- **Alternatives considered**: happy-dom（jsdom より速いが、互換性の差で戸惑う可能性がある。
  学習用なので標準的な jsdom を選ぶ）、Playwright（実ブラウザが要り依存が大きい）。
- **出典**: Vitest「Test Environment」https://vitest.dev/guide/environment
  （確認日 2026-11-22。設定の書き方はバージョンで変わることがあるため実装時に要確認）

## R6. ツールのバージョンと実行環境

| もの | バージョン | 必要な Node.js | 確認 |
|---|---|---|---|
| Vite | 8.3.8 | `^20.19.0 \|\| >=22.12.0` | npm registry、2026-11-22 |
| Vitest | 5.1.1 | `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` | npm registry、2026-11-22 |
| jsdom | 31.0.1 | `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` | npm registry、2026-11-22 |

- **Decision**: Node.js 24 LTS 以上を使う（Homebrew の最新は 26.13.1。2026-11-22 確認）。
  `package.json` ではメジャーを固定（`^8.3.8` など）し、`package-lock.json` をコミットする。
- **注意**: この端末にはまだ Node.js が入っていない。実装の前に入れる（[quickstart.md](./quickstart.md)）。

## R7. アクセシビリティと見た目（最低限）

- **Decision**: 完了は `<input type="checkbox">`、絞り込みはラジオボタン相当（`role` 付きボタン
  でもよい）。期限切れ・完了の区別は色だけに頼らず文字（「期限切れ」の表示、取り消し線）も使う。
  メッセージは `role="status"` の領域に出す。
- **Rationale**: FR-006 / FR-010 の「見た目で区別」を、テストで確かめられる形（クラス名・文字）にする。
  標準の部品を使えばキーボード操作も追加の作業なしで効く。
