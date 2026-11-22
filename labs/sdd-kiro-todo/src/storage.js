// 保存と読み込み（design.md「storage.js」「保存形式」）
// Storage は引数で受け取り、失敗は例外ではなく戻り値で返す。

export const STORAGE_KEY = 'sdd-kiro-todo';
const VERSION = 1;
const MAX_TITLE_LENGTH = 200;

function isDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function isTodo(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.title === 'string' &&
    value.title === value.title.trim() &&
    value.title.length >= 1 &&
    value.title.length <= MAX_TITLE_LENGTH &&
    typeof value.done === 'boolean' &&
    isDateString(value.due)
  );
}

function parse(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return null;
  if (data.version !== VERSION || !Array.isArray(data.todos)) return null;
  if (!data.todos.every(isTodo)) return null;
  const ids = new Set(data.todos.map((t) => t.id));
  if (ids.size !== data.todos.length) return null;
  return data.todos.map(({ id, title, done, due }) => ({ id, title, done, due }));
}

/** @returns {{ todos: object[], status: 'ok' | 'corrupt' | 'unavailable' }} */
export function load(storage) {
  let raw;
  try {
    if (!storage) throw new Error('storage unavailable');
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { todos: [], status: 'unavailable' };
  }
  if (raw === null) return { todos: [], status: 'ok' };
  const todos = parse(raw);
  // 壊れた値は消さない（次の保存で上書きされる）【6.5】
  if (todos === null) return { todos: [], status: 'corrupt' };
  return { todos, status: 'ok' };
}

/** @returns {{ ok: boolean }} */
export function save(storage, todos) {
  try {
    if (!storage) throw new Error('storage unavailable');
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, todos }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
