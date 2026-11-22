// 保存と読み込み（contracts/storage.md、FR-012 / FR-013 / FR-014）
// Storage は引数で受け取る。失敗は例外ではなく戻り値で返す。

import { MAX_TITLE_LENGTH } from './todo.js'; // data-model.md Todo.title の上限

export const STORAGE_KEY = 'sdd-speckit-todo';
const VERSION = 1;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/; // data-model.md Todo.due

/** data-model.md の Todo.id / Todo.title / Todo.done / Todo.due の制約を満たすか */
function isValidTodo(todo) {
  if (todo === null || typeof todo !== 'object') return false;
  const { id, title, done, due } = todo;
  if (typeof id !== 'string' || id === '') return false;
  if (typeof title !== 'string') return false;
  const length = title.trim().length;
  if (length === 0 || length > MAX_TITLE_LENGTH) return false;
  if (typeof done !== 'boolean') return false;
  if (!(due === null || (typeof due === 'string' && DATE_PATTERN.test(due)))) return false;
  return true;
}

/**
 * @returns {{ todos: object[], status: 'ok' | 'corrupt' | 'unavailable' }}
 */
export function load(storage) {
  let raw;
  try {
    if (!storage) throw new Error('storage がない');
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { todos: [], status: 'unavailable' };
  }
  if (raw === null) return { todos: [], status: 'ok' };

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { todos: [], status: 'corrupt' };
  }
  if (
    data === null ||
    typeof data !== 'object' ||
    data.version !== VERSION ||
    !Array.isArray(data.todos) ||
    !data.todos.every(isValidTodo)
  ) {
    return { todos: [], status: 'corrupt' };
  }
  const todos = data.todos.map(({ id, title, done, due }) => ({ id, title, done, due }));
  return { todos, status: 'ok' };
}

/**
 * 全体を 1 回書き直す。
 * @returns {{ ok: boolean }}
 */
export function save(storage, todos) {
  try {
    if (!storage) throw new Error('storage がない');
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, todos }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
