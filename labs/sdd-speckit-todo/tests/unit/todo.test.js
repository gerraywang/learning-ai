// src/todo.js の純粋関数（data-model.md Todo）
import { describe, expect, it } from 'vitest';
import { addTodo, validateTitle } from '../../src/todo.js';

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
