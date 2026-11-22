// SC-002（001・002）: やること 500 件で、各操作の画面反映が 0.1 秒以内
// jsdom 上の計測なので実際のブラウザとは一致しない（目安。research.md / analyze の C5）
import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '../helpers/memory-storage.js';
import { renderApp, storedData } from '../helpers/render-app.js';

const LIMIT_MS = 100;

function seed500() {
  const todos = Array.from({ length: 500 }, (_, i) => ({
    id: `id-${i}`,
    title: `やること ${i}`,
    done: i % 2 === 0,
    due: i % 3 === 0 ? '2026-11-01' : null,
  }));
  return createMemoryStorage(storedData(todos));
}

function measure(action) {
  const start = performance.now();
  action();
  return performance.now() - start;
}

describe('500 件での操作の速さ（SC-002）', () => {
  it.each([
    ['追加', (ui) => ui.add('新しいやること')],
    ['完了の切り替え', (ui) => ui.toggle('id-250')],
    ['削除', (ui) => ui.remove('id-250')],
    ['絞り込み', (ui) => ui.filterButton('未完了').click()],
    // spec 002 SC-002: 編集の確定・取り消し（編集の開始は計測の前に済ませる）
    ['編集の確定', (ui) => ui.confirmEdit('直したやること'), (ui) => ui.startEdit('id-250')],
    ['編集の取り消し', (ui) => ui.cancelEditButton().click(), (ui) => ui.startEdit('id-250')],
  ])('%s が 0.1 秒以内', (_, action, prepare = () => {}) => {
    const ui = renderApp({ storage: seed500() });
    prepare(ui);
    action(ui); // 1 回目は準備（JIT など）を含むので捨てる
    const ui2 = renderApp({ storage: seed500() });
    prepare(ui2);
    const elapsed = measure(() => action(ui2));

    expect(elapsed).toBeLessThan(LIMIT_MS);
  });
});
