// ロジック（純粋関数）。DOM にも Storage にも触れない（design.md「todo.js」）

export const MAX_TITLE_LENGTH = 200;

/**
 * 入力を検証する。誤りは design.md「入力の誤り」の順に返す【1.8】
 * @returns {{ ok: true, title: string, due: string } | { ok: false, errors: string[] }}
 */
export function validateInput({ title, due }, today) {
  const trimmed = (title ?? '').trim();
  const errors = [];
  if (trimmed === '') errors.push('titleRequired');
  else if (trimmed.length > MAX_TITLE_LENGTH) errors.push('titleTooLong');
  if (!due) errors.push('dueRequired');
  else if (due < today) errors.push('duePast');
  return errors.length === 0 ? { ok: true, title: trimmed, due } : { ok: false, errors };
}

/** 末尾に未完了で追加した新しい配列を返す */
export function addTodo(todos, { title, due }) {
  return [...todos, { id: crypto.randomUUID(), title, done: false, due }];
}

/** 端末のローカル日付を YYYY-MM-DD で返す */
export function toDateString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 未完了で、期限が今日より前なら期限切れ（YYYY-MM-DD は文字列の大小が日付の前後と一致する） */
export function isOverdue(todo, today) {
  return !todo.done && todo.due < today;
}

/** 指定した 1 件の done を反転した新しい配列を返す */
export function toggleTodo(todos, id) {
  return todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

/** 指定した 1 件を除いた新しい配列を返す */
export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

const FILTERS = {
  all: () => true,
  active: (todo) => !todo.done,
  completed: (todo) => todo.done,
};

/** 選んだ表示（all / active / completed）に合うものを順番どおりに返す */
export function filterTodos(todos, filter) {
  return todos.filter(FILTERS[filter]);
}
