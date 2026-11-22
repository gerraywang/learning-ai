// src/todo.js の純粋関数（data-model.md Todo）
import { describe, expect, it } from 'vitest';
import {
  addTodo,
  editDue,
  editTodo,
  filterTodos,
  isOverdue,
  removeTodo,
  toDateString,
  toggleTodo,
  validateTitle,
} from '../../src/todo.js';

describe('validateTitle（FR-001, FR-002）', () => {
  it('前後の空白を除いた文言を返す', () => {
    expect(validateTitle('  牛乳を買う　')).toEqual({ ok: true, title: '牛乳を買う' });
  });

  it.each([
    ['空', ''],
    ['空白だけ', '   '],
    ['全角空白と改行だけ', '　\n\t'],
  ])('%s は不可（empty）', (_, input) => {
    expect(validateTitle(input)).toEqual({ ok: false, error: 'empty' });
  });

  it('200 文字は可', () => {
    expect(validateTitle('あ'.repeat(200))).toEqual({ ok: true, title: 'あ'.repeat(200) });
  });

  it('201 文字は不可（too-long）', () => {
    expect(validateTitle('あ'.repeat(201))).toEqual({ ok: false, error: 'too-long' });
  });

  it('前後の空白を除いて 200 文字なら可', () => {
    expect(validateTitle(` ${'あ'.repeat(200)} `).ok).toBe(true);
  });
});

describe('addTodo（FR-003, FR-004）', () => {
  it('末尾に未完了・期限なしで追加し、元の配列は変えない', () => {
    const before = [{ id: 'x', title: '先', done: true, due: null }];
    const after = addTodo(before, { title: '後' });

    expect(before).toHaveLength(1);
    expect(after).toHaveLength(2);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toMatchObject({ title: '後', done: false, due: null });
    expect(typeof after[1].id).toBe('string');
    expect(after[1].id).not.toBe('');
  });

  it('同じ文言を 2 件追加でき、id は毎回異なる', () => {
    const todos = addTodo(addTodo([], { title: '同じ' }), { title: '同じ' });
    expect(todos.map((t) => t.title)).toEqual(['同じ', '同じ']);
    expect(todos[0].id).not.toBe(todos[1].id);
  });
});

describe('toggleTodo（FR-005）', () => {
  const todos = [
    { id: 'a', title: 'A', done: false, due: null },
    { id: 'b', title: 'B', done: true, due: null },
  ];

  it('指定した id だけ done が反転し、元の配列は変えない', () => {
    const after = toggleTodo(todos, 'a');
    expect(after.map((t) => t.done)).toEqual([true, true]);
    expect(after[1]).toBe(todos[1]);
    expect(todos[0].done).toBe(false);

    expect(toggleTodo(after, 'a')[0].done).toBe(false);
  });

  it('存在しない id では変わらない', () => {
    expect(toggleTodo(todos, 'zzz')).toEqual(todos);
  });
});

describe('removeTodo（FR-007）', () => {
  const todos = [
    { id: 'a', title: 'A', done: false, due: null },
    { id: 'b', title: 'B', done: true, due: null },
    { id: 'c', title: 'C', done: false, due: null },
  ];

  it('指定した id だけ消え、残りの順番は変わらない', () => {
    expect(removeTodo(todos, 'b').map((t) => t.id)).toEqual(['a', 'c']);
    expect(todos).toHaveLength(3);
  });

  it('存在しない id では変わらない', () => {
    expect(removeTodo(todos, 'zzz')).toEqual(todos);
  });
});

describe('editTodo（spec 002 FR-003, FR-007、data-model.md Todo.title）', () => {
  const todos = [
    { id: 'a', title: '牛乳を買う', done: false, due: '2026-12-01' },
    { id: 'b', title: '牛乳を買う', done: true, due: null },
    { id: 'c', title: '本を返す', done: false, due: null },
  ];

  it('指定した id の title だけが変わり、done・due・id・順番は変わらない', () => {
    const after = editTodo(todos, 'a', '豆乳を買う');
    expect(after).toEqual([
      { id: 'a', title: '豆乳を買う', done: false, due: '2026-12-01' },
      todos[1],
      todos[2],
    ]);
  });

  it('完了のやることも title だけが変わる', () => {
    expect(editTodo(todos, 'b', '豆乳')[1]).toEqual({ id: 'b', title: '豆乳', done: true, due: null });
  });

  it('同じ文言が複数あっても、指定した id だけが変わり、ほかは同じオブジェクトのまま', () => {
    const after = editTodo(todos, 'b', '豆乳');
    expect(after[0]).toBe(todos[0]);
    expect(after[2]).toBe(todos[2]);
  });

  it('元の配列を変えない', () => {
    editTodo(todos, 'a', '豆乳を買う');
    expect(todos[0].title).toBe('牛乳を買う');
  });

  it('存在しない id では変わらない', () => {
    expect(editTodo(todos, 'zzz', 'X')).toEqual(todos);
  });
});

describe('editDue（openspec change add-due-edit）', () => {
  const todos = [
    { id: 'a', title: '牛乳を買う', done: false, due: '2026-12-01' },
    { id: 'b', title: '本を返す', done: true, due: null },
    { id: 'c', title: '歯医者', done: false, due: null },
  ];

  it('指定した id の due だけが変わり、title・done・id・順番は変わらない', () => {
    expect(editDue(todos, 'a', '2026-12-24')).toEqual([
      { id: 'a', title: '牛乳を買う', done: false, due: '2026-12-24' },
      todos[1],
      todos[2],
    ]);
  });

  it('空文字や null を渡すと期限なしになる', () => {
    expect(editDue(todos, 'a', '')[0].due).toBeNull();
    expect(editDue(todos, 'a', null)[0].due).toBeNull();
  });

  it('期限なしのやることに期限を付けられる（完了のままで）', () => {
    expect(editDue(todos, 'b', '2026-12-01')[1]).toEqual({ id: 'b', title: '本を返す', done: true, due: '2026-12-01' });
  });

  it('ほかのやることは同じオブジェクトのまま、元の配列も変えない', () => {
    const after = editDue(todos, 'a', '2026-12-24');
    expect(after[1]).toBe(todos[1]);
    expect(after[2]).toBe(todos[2]);
    expect(todos[0].due).toBe('2026-12-01');
  });

  it('存在しない id では変わらない', () => {
    expect(editDue(todos, 'zzz', '2026-12-24')).toEqual(todos);
  });
});

describe('期限（FR-008, FR-010）', () => {
  it('addTodo に期限を渡すと保存される', () => {
    expect(addTodo([], { title: 'A', due: '2026-11-30' })[0].due).toBe('2026-11-30');
  });

  it.each([
    ['空文字', ''],
    ['省略', undefined],
  ])('addTodo の期限が%sなら null（期限なし）', (_, due) => {
    expect(addTodo([], { title: 'A', due })[0].due).toBeNull();
  });

  const today = '2026-11-22';
  const todo = (due, done = false) => ({ id: 'x', title: 'x', done, due });

  it.each([
    ['昨日が期限・未完了', true, todo('2026-11-21')],
    ['今日が期限・未完了', false, todo('2026-11-22')],
    ['明日が期限・未完了', false, todo('2026-11-23')],
    ['期限なし・未完了', false, todo(null)],
    ['昨日が期限・完了', false, todo('2026-11-21', true)],
    ['月をまたいで前（10 月 31 日）', true, todo('2026-10-31')],
    ['年をまたいで前（去年の 12 月 31 日）', true, todo('2025-12-31')],
  ])('isOverdue: %s → %s', (_, expected, t) => {
    expect(isOverdue(t, today)).toBe(expected);
  });

  it('toDateString は端末のローカル日付を YYYY-MM-DD で返す', () => {
    // 月・日は 0 埋め。ローカル時刻の 23:59 でも日付が変わらない
    expect(toDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDateString(new Date(2026, 10, 22, 0, 0))).toBe('2026-11-22');
  });
});

describe('filterTodos（FR-011、data-model.md Filter）', () => {
  const todos = [
    { id: 'a', title: 'A', done: false, due: null },
    { id: 'b', title: 'B', done: true, due: null },
    { id: 'c', title: 'C', done: false, due: null },
  ];
  const ids = (list) => list.map((t) => t.id);

  it('all はすべてを順番どおりに返す', () => {
    expect(ids(filterTodos(todos, 'all'))).toEqual(['a', 'b', 'c']);
  });

  it('active は未完了だけを順番どおりに返す', () => {
    expect(ids(filterTodos(todos, 'active'))).toEqual(['a', 'c']);
  });

  it('completed は完了だけを返す', () => {
    expect(ids(filterTodos(todos, 'completed'))).toEqual(['b']);
  });
});
