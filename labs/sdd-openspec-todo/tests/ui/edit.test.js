// specs/002-edit-todo-text/spec.md の受け入れシナリオを画面の操作として再現する（SC-006）
// テスト名の先頭の US1-1 などは spec 002 の User Story とシナリオ番号。
import { describe, expect, it } from 'vitest';
import { createFailingSetStorage, createMemoryStorage } from '../helpers/memory-storage.js';
import { renderApp, storedData } from '../helpers/render-app.js';

/** id を固定したやることで始める */
function seeded(todos) {
  return renderApp({ storage: createMemoryStorage(storedData(todos)) });
}

const milk = { id: 'milk', title: '牛乳を買う', done: false, due: null };

describe('User Story 1 - 書き間違えたやることを直す', () => {
  it('US1-1: 編集を始めると、今の文言が入った入力欄が出る', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);

    expect(ui.editInput()).not.toBeNull();
    expect(ui.editInput().value).toBe('牛乳を買う');
  });

  it('US1-2: 書き換えて確定すると新しい文言になり、編集中の状態が終わる', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);
    ui.confirmEdit('豆乳を買う');

    expect(ui.titles()).toEqual(['豆乳を買う']);
    expect(ui.editInput()).toBeNull();
    expect(ui.editingRows()).toHaveLength(0);
  });

  it('US1-3: 期限付き・未完了のやることを編集しても、期限と未完了はそのまま', () => {
    const ui = seeded([{ ...milk, due: '2026-12-01' }]);
    ui.startEdit(0);
    ui.confirmEdit('豆乳を買う');

    expect(ui.row(0).querySelector('.due').textContent).toBe('期限: 2026-12-01');
    expect(ui.checkbox(0).checked).toBe(false);
    expect(ui.getStoredTodos()).toEqual([
      { id: 'milk', title: '豆乳を買う', done: false, due: '2026-12-01' },
    ]);
  });

  it('US1-4: 完了のやることを編集しても、完了のまま文言だけ変わる', () => {
    const ui = seeded([{ ...milk, done: true }]);
    ui.startEdit(0);
    ui.confirmEdit('豆乳を買う');

    expect(ui.titles()).toEqual(['豆乳を買う']);
    expect(ui.checkbox(0).checked).toBe(true);
    expect(ui.row(0).classList.contains('done')).toBe(true);
  });

  it('US1-5: 3 件中 2 件目を編集しても、2 件目の位置のまま', () => {
    const ui = seeded([
      { id: 'a', title: '1 件目', done: false, due: null },
      { id: 'b', title: '2 件目', done: false, due: null },
      { id: 'c', title: '3 件目', done: false, due: null },
    ]);
    ui.startEdit(1);
    ui.confirmEdit('2 件目（直した）');

    expect(ui.titles()).toEqual(['1 件目', '2 件目（直した）', '3 件目']);
  });

  it('US1-6: 確定した文言は再読み込みしても残る', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);
    ui.confirmEdit('豆乳を買う');
    ui.reload();

    expect(ui.titles()).toEqual(['豆乳を買う']);
  });

  it('US1-7: 前後の空白は除いて確定する', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);
    ui.confirmEdit('  豆乳を買う  ');

    expect(ui.titles()).toEqual(['豆乳を買う']);
    expect(ui.getStoredTodos()[0].title).toBe('豆乳を買う');
  });

  it('US1-8: Enter（フォームの送信）でも確定できる', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);
    ui.submitEditWithEnter('豆乳を買う');

    expect(ui.titles()).toEqual(['豆乳を買う']);
    expect(ui.editInput()).toBeNull();
  });

  it('文言を変えずに確定しても、エラーにならず通常の行に戻る（Edge Cases）', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);
    ui.confirmEdit('牛乳を買う');

    expect(ui.titles()).toEqual(['牛乳を買う']);
    expect(ui.editInput()).toBeNull();
    expect(ui.message()).toBe('');
  });

  it('前後の空白を除くと元と同じ文言も、変えずに確定したのと同じ（Edge Cases）', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);
    ui.confirmEdit('  牛乳を買う ');

    expect(ui.titles()).toEqual(['牛乳を買う']);
    expect(ui.editInput()).toBeNull();
    expect(ui.message()).toBe('');
  });

  it('同じ文言の行が 2 つあっても、編集した行だけが変わる（Edge Cases）', () => {
    const ui = seeded([milk, { ...milk, id: 'milk2' }]);
    ui.startEdit('milk2');
    ui.confirmEdit('豆乳を買う');

    expect(ui.titles()).toEqual(['牛乳を買う', '豆乳を買う']);
    expect(ui.getStoredTodos().map((t) => t.id)).toEqual(['milk', 'milk2']);
  });

  it('確定したときに保存に失敗すると、表示は新しい文言で「保存できませんでした」（FR-011）', () => {
    const ui = renderApp({ storage: createFailingSetStorage(storedData([milk])) });
    ui.startEdit(0);
    ui.confirmEdit('豆乳を買う');

    expect(ui.titles()).toEqual(['豆乳を買う']);
    expect(ui.message()).toBe('保存できませんでした');
  });

  it('編集を始めると入力欄に、確定するとその行の「編集」にフォーカスがある（contracts/ui.md、research.md R7）', () => {
    const ui = seeded([milk]);
    ui.startEdit(0);
    expect(document.activeElement).toBe(ui.editInput());

    ui.confirmEdit('豆乳を買う');
    expect(document.activeElement).toBe(ui.editButton(0));
  });

  it('「編集」ボタンの読み上げ名は「<文言> を編集」（contracts/ui.md）', () => {
    const ui = seeded([milk]);

    expect(ui.editButton(0).textContent).toBe('編集');
    expect(ui.editButton(0).getAttribute('aria-label')).toBe('牛乳を買う を編集');
  });
});

describe('User Story 2 - 編集をやめて元に戻す', () => {
  const book = { id: 'book', title: '本を返す', done: false, due: null };

  /** milk を編集して「豆乳を買う」に書き換えた（まだ確定していない）状態 */
  function editingMilk(todos = [milk, book]) {
    const ui = seeded(todos);
    ui.startEdit('milk');
    ui.editInput().value = '豆乳を買う';
    return ui;
  }

  it('US2-1: 書き換えてから取り消すと元の文言のまま、編集中の状態が終わる', () => {
    const ui = editingMilk();
    ui.cancelEditButton().click();

    expect(ui.titles()).toEqual(['牛乳を買う', '本を返す']);
    expect(ui.editInput()).toBeNull();
  });

  it('US2-2: 取り消した後に再読み込みしても元の文言', () => {
    const ui = editingMilk();
    ui.cancelEditButton().click();
    ui.reload();

    expect(ui.titles()).toEqual(['牛乳を買う', '本を返す']);
  });

  it('US2-3: 取り消した後にもう一度編集すると、元の文言から始まる', () => {
    const ui = editingMilk();
    ui.cancelEditButton().click();
    ui.startEdit('milk');

    expect(ui.editInput().value).toBe('牛乳を買う');
  });

  it('US2-4: Esc キーでも取り消せる', () => {
    const ui = editingMilk();
    ui.pressKey('Escape');

    expect(ui.titles()).toEqual(['牛乳を買う', '本を返す']);
    expect(ui.editInput()).toBeNull();
  });

  it.each([
    ['別のやることの完了を切り替える', (ui) => ui.toggle('book')],
    ['別のやることの編集を始める', (ui) => ui.startEdit('book')],
    ['絞り込みを切り替える', (ui) => ui.filterButton('未完了').click()],
    ['編集中の行の外（見出し）をクリックする', () => document.querySelector('h1').click()],
  ])('US2-5: 確定せずに%sと、元の文言のまま編集中の状態が終わる', (_, action) => {
    const ui = editingMilk();
    action(ui);

    expect(ui.row('milk').querySelector('.title').textContent).toBe('牛乳を買う');
    expect(ui.row('milk').classList.contains('editing')).toBe(false);
    expect(ui.getStoredTodos()[0].title).toBe('牛乳を買う');
  });

  it('US2-5 の補足: 完了の切り替えは、編集の取り消しと一緒に通常どおり行われる', () => {
    const ui = editingMilk();
    ui.toggle('book');

    expect(ui.checkbox('book').checked).toBe(true);
    expect(ui.getStoredTodos()[1].done).toBe(true);
  });

  it('編集中に別の行の編集を始めると、前の行は元の文言、新しい行が編集中で、編集中は常に 1 行（FR-010）', () => {
    const ui = editingMilk();
    ui.startEdit('book');

    expect(ui.editingRows()).toHaveLength(1);
    expect(ui.row('book').classList.contains('editing')).toBe(true);
    expect(ui.editInput().value).toBe('本を返す');
    expect(ui.row('milk').querySelector('.title').textContent).toBe('牛乳を買う');
  });

  it.each([
    ['別の行を削除する', (ui) => ui.remove('book')],
    ['正しい文言で新しいやることを追加する', (ui) => ui.add('歯医者')],
  ])('編集中に%sと、編集は取り消される（Edge Cases）', (_, action) => {
    const ui = editingMilk();
    action(ui);

    expect(ui.editingRows()).toHaveLength(0);
    expect(ui.row('milk').querySelector('.title').textContent).toBe('牛乳を買う');
  });

  it('取り消しは保存しない（FR-009）', () => {
    const ui = editingMilk();
    const before = ui.storage.getItem('sdd-speckit-todo');
    ui.cancelEditButton().click();

    expect(ui.storage.getItem('sdd-speckit-todo')).toBe(before);
  });

  it('編集中に再読み込みすると元の文言で、編集中の行はない（FR-009、spec Assumptions）', () => {
    const ui = editingMilk();
    ui.reload();

    expect(ui.titles()).toEqual(['牛乳を買う', '本を返す']);
    expect(ui.editingRows()).toHaveLength(0);
  });

  it('日本語の変換中の Esc では取り消さない（research.md R3）', () => {
    const ui = editingMilk();
    ui.pressKey('Escape', { isComposing: true });

    expect(ui.editInput()).not.toBeNull();
    expect(ui.editInput().value).toBe('豆乳を買う');
  });

  it.each([
    ['「取り消し」', (ui) => ui.cancelEditButton().click()],
    ['Esc', (ui) => ui.pressKey('Escape')],
  ])('%sで取り消した後は、その行の「編集」にフォーカスがある（research.md R7）', (_, action) => {
    const ui = editingMilk();
    action(ui);

    expect(document.activeElement).toBe(ui.editButton('milk'));
  });

  it('編集中の行の中（入力欄・期限の表示）をクリックしても取り消さない（spec Edge Cases）', () => {
    const ui = editingMilk([{ ...milk, due: '2026-12-01' }, book]);
    ui.editInput().click();
    ui.row('milk').querySelector('.due').click();

    expect(ui.editInput()).not.toBeNull();
    expect(ui.editInput().value).toBe('豆乳を買う');
  });
});

describe('User Story 3 - 決まりに合わない文言では確定できない', () => {
  /** milk の編集を始めた状態と、そのときの保存データ */
  function editing() {
    const ui = seeded([milk]);
    ui.startEdit(0);
    return { ui, before: ui.storage.getItem('sdd-speckit-todo') };
  }

  it('US3-1: 空にして確定しようとすると、変わらず編集中のままで、入力が必要だと分かる', () => {
    const { ui, before } = editing();
    ui.confirmEdit('');

    expect(ui.editInput()).not.toBeNull();
    expect(ui.message()).toBe('やることを入力してください');
    expect(ui.storage.getItem('sdd-speckit-todo')).toBe(before);
  });

  it('US3-2: 空白だけで確定しようとすると、編集中のまま入力も残り、入力が必要だと分かる', () => {
    const { ui, before } = editing();
    ui.confirmEdit('   ');

    expect(ui.editInput().value).toBe('   ');
    expect(ui.message()).toBe('やることを入力してください');
    expect(ui.storage.getItem('sdd-speckit-todo')).toBe(before);
  });

  it('US3-3: 201 文字で確定しようとすると、編集中のまま 201 文字も残り、上限を超えたと分かる', () => {
    const { ui, before } = editing();
    const long = 'あ'.repeat(201);
    ui.confirmEdit(long);

    expect(ui.editInput().value).toBe(long);
    expect(ui.message()).toBe('200 文字以内で入力してください');
    expect(ui.storage.getItem('sdd-speckit-todo')).toBe(before);
  });

  it('US3-4: ちょうど 200 文字なら確定できる', () => {
    const { ui } = editing();
    const max = 'あ'.repeat(200);
    ui.confirmEdit(max);

    expect(ui.titles()).toEqual([max]);
    expect(ui.editInput()).toBeNull();
  });

  it('US3-5: 確定できなかった後も、直して確定できる', () => {
    const { ui } = editing();
    ui.confirmEdit('');
    ui.confirmEdit('豆乳を買う');

    expect(ui.titles()).toEqual(['豆乳を買う']);
    expect(ui.message()).toBe('');
  });

  it('US3-5: 確定できなかった後も、取り消せる', () => {
    const { ui, before } = editing();
    ui.confirmEdit('');
    ui.cancelEditButton().click();

    expect(ui.titles()).toEqual(['牛乳を買う']);
    expect(ui.editInput()).toBeNull();
    expect(ui.storage.getItem('sdd-speckit-todo')).toBe(before);
  });

  it.each([
    ['「取り消し」', (ui) => ui.cancelEditButton().click()],
    ['編集中の行の外のクリック', () => document.querySelector('h1').click()],
  ])('確定できなかった後に%sで取り消すと、理由のお知らせは消える（contracts/ui.md）', (_, action) => {
    const { ui } = editing();
    ui.confirmEdit('');
    action(ui);

    expect(ui.message()).toBe('');
  });

  it('確定できなかったときは、入力欄にフォーカスが戻る（tasks.md T017）', () => {
    const { ui } = editing();
    ui.confirmEdit('');

    expect(document.activeElement).toBe(ui.editInput());
  });
});
