// openspec change add-due-edit: 編集で期限を変える・外す・付ける
// シナリオは openspec/specs/todo-title-edit・todo-due-date・todo-persistence（archive 後）を画面の操作として再現する
import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '../helpers/memory-storage.js';
import { renderApp, storedData } from '../helpers/render-app.js';

function seeded(todos) {
  return renderApp({ storage: createMemoryStorage(storedData(todos)) });
}

const milk = { id: 'milk', title: '牛乳を買う', done: false, due: '2026-12-01' };
const book = { id: 'book', title: '本を返す', done: false, due: null };

const dueText = (ui, id) => ui.row(id).querySelector('.due')?.textContent ?? null;
const isOverdue = (ui, id) => ui.row(id).querySelector('.overdue-badge') !== null;

describe('編集を始める（todo-title-edit）', () => {
  it('期限付きのやることの編集を始めると、日付欄にいまの期限が入っている', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');

    expect(ui.editDueInput()).not.toBeNull();
    expect(ui.editDueInput().type).toBe('date');
    expect(ui.editDueInput().value).toBe('2026-12-01');
  });

  it('期限なしのやることの編集を始めると、日付欄は空', () => {
    const ui = seeded([book]);
    ui.startEdit('book');

    expect(ui.editDueInput().value).toBe('');
  });

  it('日付欄は文言の入力欄の次にあり、編集中の行には「期限: 〜」の文字を出さない', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    const inputs = [...ui.editForm().querySelectorAll('input')];

    expect(inputs.map((el) => el.getAttribute('aria-label'))).toEqual(['やることの文言', '期限']);
    expect(dueText(ui, 'milk')).toBeNull();
  });

  it('期限切れのやることの編集中の行にも「期限切れ」が出る', () => {
    const ui = seeded([{ ...milk, due: '2026-11-21' }]);
    ui.startEdit('milk');

    expect(isOverdue(ui, 'milk')).toBe(true);
  });

  it('編集を始めると文言の入力欄にフォーカスがある', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');

    expect(document.activeElement).toBe(ui.editInput());
  });
});

describe('編集を確定する（todo-title-edit / todo-due-date）', () => {
  it('期限を変えて確定すると、新しい期限が表示され、保存される', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.confirmEditButton().click();

    expect(ui.editingRows()).toHaveLength(0);
    expect(dueText(ui, 'milk')).toBe('期限: 2026-12-24');
    expect(ui.getStoredTodos()[0]).toEqual({ ...milk, due: '2026-12-24' });
  });

  it('日付欄を空にして確定すると、期限なしになる', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('');
    ui.confirmEditButton().click();

    expect(dueText(ui, 'milk')).toBeNull();
    expect(ui.getStoredTodos()[0].due).toBeNull();
  });

  it('期限なしのやることに期限を付けられる', () => {
    const ui = seeded([book]);
    ui.startEdit('book');
    ui.setEditDue('2026-12-01');
    ui.confirmEditButton().click();

    expect(dueText(ui, 'book')).toBe('期限: 2026-12-01');
  });

  it('文言と期限を一緒に変えて確定すると、両方が変わる', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.confirmEdit('豆乳を買う');

    expect(ui.titles()).toEqual(['豆乳を買う']);
    expect(dueText(ui, 'milk')).toBe('期限: 2026-12-24');
  });

  it('文言も期限も変えずに確定すると、同じ文言と期限のまま通常の行に戻る', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.confirmEditButton().click();

    expect(ui.editingRows()).toHaveLength(0);
    expect(ui.getStoredTodos()[0]).toEqual(milk);
  });

  it('完了の状態と位置は変わらない', () => {
    const done = { id: 'done', title: '済んだこと', done: true, due: null };
    const ui = seeded([book, done, milk]);
    ui.startEdit('done');
    ui.setEditDue('2026-12-01');
    ui.confirmEditButton().click();

    expect(ui.getStoredTodos().map((t) => t.id)).toEqual(['book', 'done', 'milk']);
    expect(ui.getStoredTodos()[1]).toEqual({ ...done, due: '2026-12-01' });
    expect(ui.checkbox('done').checked).toBe(true);
  });

  it('日付欄での Enter（フォームの送信）でも確定できる', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.editDueInput().focus();
    ui.editForm().requestSubmit();

    expect(ui.editingRows()).toHaveLength(0);
    expect(dueText(ui, 'milk')).toBe('期限: 2026-12-24');
  });

  it('確定すると、その行の「編集」にフォーカスがある', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.confirmEditButton().click();

    expect(document.activeElement).toBe(ui.editButton('milk'));
  });
});

describe('決まりに合わない文言では確定しない（todo-title-edit）', () => {
  it('日付欄を変えたうえで文言を空にして確定しようとすると、期限は元のまま、日付欄には書きかけの日付が残る', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.confirmEdit('');

    expect(ui.editingRows()).toHaveLength(1);
    expect(ui.editDueInput().value).toBe('2026-12-24');
    expect(ui.message()).toBe('やることを入力してください');
    expect(ui.getStoredTodos()[0]).toEqual(milk);
    expect(document.activeElement).toBe(ui.editInput());
  });

  it('確定できなかったあとに文言を直して確定すると、書きかけの期限も一緒に確定する', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.confirmEdit('');
    ui.confirmEdit('豆乳を買う');

    expect(ui.getStoredTodos()[0]).toEqual({ ...milk, title: '豆乳を買う', due: '2026-12-24' });
  });
});

describe('編集を取り消す（todo-title-edit）', () => {
  /** milk の日付欄を 2026-12-24 に書き換えた（まだ確定していない）状態 */
  function editingMilkDue() {
    const ui = seeded([milk, book]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    return ui;
  }

  it.each([
    ['「取り消し」を押す', (ui) => ui.cancelEditButton().click()],
    ['入力欄で Esc を押す', (ui) => ui.pressKey('Escape')],
    ['日付欄で Esc を押す', (ui) => ui.pressKey('Escape', { target: ui.editDueInput() })],
    ['行の外（見出し）をクリックする', () => document.querySelector('h1').click()],
    ['別のやることの完了を切り替える', (ui) => ui.toggle('book')],
    ['別のやることを削除する', (ui) => ui.remove('book')],
    ['新しいやることを追加する', (ui) => ui.add('歯医者')],
    ['絞り込みを切り替える', (ui) => ui.filterButton('未完了').click()],
    ['別の行の編集を始める', (ui) => ui.startEdit('book')],
  ])('期限を書き換えてから%sと、期限は元のまま', (_, action) => {
    const ui = editingMilkDue();
    action(ui);

    expect(ui.row('milk').classList.contains('editing')).toBe(false);
    expect(dueText(ui, 'milk')).toBe('期限: 2026-12-01');
    expect(ui.getStoredTodos()[0].due).toBe('2026-12-01');
  });

  it('日付欄での日本語の変換中の Esc では取り消さない', () => {
    const ui = editingMilkDue();
    ui.pressKey('Escape', { isComposing: true, target: ui.editDueInput() });

    expect(ui.editDueInput()).not.toBeNull();
    expect(ui.editDueInput().value).toBe('2026-12-24');
  });

  it('取り消したあとにもう一度編集すると、日付欄には元の期限が入っている', () => {
    const ui = editingMilkDue();
    ui.cancelEditButton().click();
    ui.startEdit('milk');

    expect(ui.editDueInput().value).toBe('2026-12-01');
  });
});

describe('保存と再読み込み（todo-title-edit / todo-persistence）', () => {
  it('期限を変えて確定すると、再読み込みしても残る', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.confirmEditButton().click();
    ui.reload();

    expect(dueText(ui, 'milk')).toBe('期限: 2026-12-24');
  });

  it('期限を外して確定すると、再読み込みしても期限なしのまま', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('');
    ui.confirmEditButton().click();
    ui.reload();

    expect(dueText(ui, 'milk')).toBeNull();
  });

  it('期限を書き換えている途中で再読み込みすると、元の期限で編集中の行はない', () => {
    const ui = seeded([milk]);
    ui.startEdit('milk');
    ui.setEditDue('2026-12-24');
    ui.reload();

    expect(ui.editingRows()).toHaveLength(0);
    expect(dueText(ui, 'milk')).toBe('期限: 2026-12-01');
  });
});

describe('期限切れの表示が変わる（todo-due-date、今日は 2026-11-22）', () => {
  it('期限切れのやることの期限を先に延ばすと、「期限切れ」が消える', () => {
    const ui = seeded([{ ...milk, due: '2026-11-21' }]);
    expect(isOverdue(ui, 'milk')).toBe(true);

    ui.startEdit('milk');
    ui.setEditDue('2026-11-30');
    ui.confirmEditButton().click();

    expect(isOverdue(ui, 'milk')).toBe(false);
  });

  it('期限なしのやることに過去の期限を付けると、「期限切れ」が出る', () => {
    const ui = seeded([book]);
    ui.startEdit('book');
    ui.setEditDue('2026-11-01');
    ui.confirmEditButton().click();

    expect(isOverdue(ui, 'book')).toBe(true);
  });
});
