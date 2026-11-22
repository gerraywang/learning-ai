import { describe, it, expect } from 'vitest';
import {
  validateTitle,
  validateInput,
  addTodo,
  editTodo,
  toDateString,
  isOverdue,
  toggleTodo,
  removeTodo,
  filterTodos,
} from '../../src/todo.js';

const TODAY = '2026-11-22';

describe('validateInput', () => {
  it('正しい入力なら ok: true と、前後の空白を除いた title', () => {
    expect(validateInput({ title: '  買い物  ', due: TODAY }, TODAY)).toEqual({
      ok: true,
      title: '買い物',
      due: TODAY,
    });
  });

  it('内容が空・空白だけは不可', () => {
    expect(validateInput({ title: '', due: TODAY }, TODAY)).toEqual({ ok: false, errors: ['titleRequired'] });
    expect(validateInput({ title: ' \t　', due: TODAY }, TODAY)).toEqual({ ok: false, errors: ['titleRequired'] });
  });

  it('内容は 200 文字まで可、201 文字は不可（前後の空白は数えない）', () => {
    expect(validateInput({ title: 'あ'.repeat(200), due: TODAY }, TODAY).ok).toBe(true);
    expect(validateInput({ title: `  ${'あ'.repeat(200)}  `, due: TODAY }, TODAY).ok).toBe(true);
    expect(validateInput({ title: 'あ'.repeat(201), due: TODAY }, TODAY)).toEqual({
      ok: false,
      errors: ['titleTooLong'],
    });
  });

  it('期限が空は不可', () => {
    expect(validateInput({ title: 'a', due: '' }, TODAY)).toEqual({ ok: false, errors: ['dueRequired'] });
  });

  it('期限は昨日は不可、今日と明日は可', () => {
    expect(validateInput({ title: 'a', due: '2026-11-21' }, TODAY)).toEqual({ ok: false, errors: ['duePast'] });
    expect(validateInput({ title: 'a', due: '2026-11-22' }, TODAY).ok).toBe(true);
    expect(validateInput({ title: 'a', due: '2026-11-23' }, TODAY).ok).toBe(true);
  });

  it('複数の誤りを決まった順ですべて返す', () => {
    expect(validateInput({ title: '', due: '' }, TODAY)).toEqual({
      ok: false,
      errors: ['titleRequired', 'dueRequired'],
    });
    expect(validateInput({ title: 'あ'.repeat(201), due: '2026-11-21' }, TODAY)).toEqual({
      ok: false,
      errors: ['titleTooLong', 'duePast'],
    });
  });
});

describe('addTodo', () => {
  it('末尾に未完了で追加した新しい配列を返す（元の配列は変えない）', () => {
    const before = [{ id: 'x', title: '前', done: true, due: TODAY }];
    const after = addTodo(before, { title: '買い物', due: TODAY });
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(2);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toMatchObject({ title: '買い物', due: TODAY, done: false });
    expect(typeof after[1].id).toBe('string');
  });

  it('内容と期限が同じでも別々の id で追加する', () => {
    const once = addTodo([], { title: 'a', due: TODAY });
    const twice = addTodo(once, { title: 'a', due: TODAY });
    expect(twice).toHaveLength(2);
    expect(twice[0].id).not.toBe(twice[1].id);
  });
});

describe('toDateString', () => {
  it('ローカル日付を YYYY-MM-DD で返す', () => {
    expect(toDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDateString(new Date(2026, 10, 22, 0, 0))).toBe('2026-11-22');
  });
});

describe('isOverdue', () => {
  const t = (due, done) => ({ id: 'a', title: 'a', due, done });
  it.each([
    ['2026-11-21', false, true],
    ['2026-11-22', false, false],
    ['2026-11-23', false, false],
    ['2026-11-21', true, false],
    ['2026-11-22', true, false],
    ['2026-11-23', true, false],
  ])('期限 %s・完了 %s → %s', (due, done, expected) => {
    expect(isOverdue(t(due, done), TODAY)).toBe(expected);
  });
});

const sample = () => [
  { id: 'a', title: 'a', due: TODAY, done: false },
  { id: 'b', title: 'b', due: TODAY, done: true },
  { id: 'c', title: 'a', due: TODAY, done: false },
];

describe('toggleTodo', () => {
  it('指定した 1 件の done だけを反転し、順番は変えない', () => {
    const before = sample();
    const after = toggleTodo(before, 'a');
    expect(after.map((t) => [t.id, t.done])).toEqual([['a', true], ['b', true], ['c', false]]);
    expect(before[0].done).toBe(false);
    expect(toggleTodo(after, 'a')[0].done).toBe(false);
    expect(toggleTodo(before, 'b')[1].done).toBe(false);
  });
});

describe('removeTodo', () => {
  it('指定した 1 件だけを除く（内容と期限が同じものが他にあっても）', () => {
    expect(removeTodo(sample(), 'c').map((t) => t.id)).toEqual(['a', 'b']);
    expect(removeTodo(sample(), 'a').map((t) => t.id)).toEqual(['b', 'c']);
    expect(removeTodo(sample(), 'b').map((t) => t.id)).toEqual(['a', 'c']);
  });
});

describe('filterTodos', () => {
  it('all はすべて、active は未完了、completed は完了だけを順番どおりに返す', () => {
    expect(filterTodos(sample(), 'all').map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(filterTodos(sample(), 'active').map((t) => t.id)).toEqual(['a', 'c']);
    expect(filterTodos(sample(), 'completed').map((t) => t.id)).toEqual(['b']);
  });
});

describe('validateTitle（追加と編集で共通の内容の決まり）', () => {
  it('8.2: 正しい内容なら ok: true と、前後の空白を除いた title', () => {
    expect(validateTitle('  買い物  ')).toEqual({ ok: true, title: '買い物' });
  });

  it('8.4: 空・空白だけは不可', () => {
    expect(validateTitle('')).toEqual({ ok: false, errors: ['titleRequired'] });
    expect(validateTitle(' \t　')).toEqual({ ok: false, errors: ['titleRequired'] });
    expect(validateTitle(undefined)).toEqual({ ok: false, errors: ['titleRequired'] });
  });

  it('8.5: 200 文字まで可、201 文字は不可（前後の空白は数えない）', () => {
    expect(validateTitle('あ'.repeat(200))).toEqual({ ok: true, title: 'あ'.repeat(200) });
    expect(validateTitle(`  ${'あ'.repeat(200)}  `)).toEqual({ ok: true, title: 'あ'.repeat(200) });
    expect(validateTitle('あ'.repeat(201))).toEqual({ ok: false, errors: ['titleTooLong'] });
  });
});

describe('editTodo', () => {
  it('8.2・8.8: 指定した 1 件の title だけを変え、id・due・done・順番と元の配列は変えない', () => {
    const before = sample();
    const after = editTodo(before, 'b', '新しい内容');
    expect(after).toEqual([before[0], { ...before[1], title: '新しい内容' }, before[2]]);
    expect(before[1].title).not.toBe('新しい内容');
    expect(after).not.toBe(before);
  });

  it('内容と期限が同じものが他にあっても、指定した 1 件だけを変える', () => {
    const todos = [
      { id: 'x', title: '同じ', done: false, due: TODAY },
      { id: 'y', title: '同じ', done: false, due: TODAY },
    ];
    expect(editTodo(todos, 'y', '変えた').map((t) => t.title)).toEqual(['同じ', '変えた']);
  });
});
