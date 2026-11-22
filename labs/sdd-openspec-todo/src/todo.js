// やることの操作（純粋関数）。DOM にも保存にも触れない。
// データの形と制約は data-model.md の Todo。

export const MAX_TITLE_LENGTH = 200; // data-model.md Todo.title

/**
 * 入力された文言を検証する（data-model.md Todo.title の検証ルール、FR-002）
 * @returns {{ ok: true, title: string } | { ok: false, error: 'empty' | 'too-long' }}
 */
export function validateTitle(input) {
  const title = String(input ?? '').trim();
  if (title.length === 0) return { ok: false, error: 'empty' };
  if (title.length > MAX_TITLE_LENGTH) return { ok: false, error: 'too-long' };
  return { ok: true, title };
}

/**
 * 末尾に新しいやることを足した配列を返す（元の配列は変えない、FR-003 / FR-004 / FR-008）
 * title は validateTitle を通したものを渡す。due は YYYY-MM-DD か、空なら期限なし。
 */
export function addTodo(todos, { title, due }) {
  const todo = {
    id: crypto.randomUUID(), // data-model.md Todo.id
    title, // data-model.md Todo.title
    done: false, // data-model.md Todo.done の初期値
    due: due || null, // data-model.md Todo.due（空文字は期限なし）
  };
  return [...todos, todo];
}

/** 指定した id の完了／未完了を切り替えた配列を返す（data-model.md Todo.done、FR-005） */
export function toggleTodo(todos, id) {
  return todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

/**
 * 指定した id の文言だけを変えた配列を返す（data-model.md Todo.title、spec 002 FR-003 / FR-007）
 * title は validateTitle を通したものを渡す。done・due・順番は変えない。
 */
export function editTodo(todos, id, title) {
  return todos.map((todo) => (todo.id === id ? { ...todo, title } : todo));
}

/**
 * 指定した id の期限だけを変えた配列を返す（openspec change add-due-edit）
 * due は YYYY-MM-DD。空文字・null は期限なし。title・done・順番は変えない。
 */
export function editDue(todos, id, due) {
  return todos.map((todo) => (todo.id === id ? { ...todo, due: due || null } : todo));
}

/** 指定した id のやることを除いた配列を返す（data-model.md Todo.id、FR-007） */
export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

/**
 * 期限切れか（data-model.md「導出される値」、FR-010）
 * today は YYYY-MM-DD。YYYY-MM-DD は文字列の大小が日付の前後と一致する（research.md R3）
 */
export function isOverdue(todo, today) {
  return !todo.done && todo.due !== null && todo.due < today;
}

/** 端末のローカル日付を YYYY-MM-DD で返す（research.md R3） */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 絞り込み条件に合うやることだけを順番どおりに返す（data-model.md Filter、FR-011） */
export function filterTodos(todos, filter) {
  if (filter === 'active') return todos.filter((todo) => !todo.done);
  if (filter === 'completed') return todos.filter((todo) => todo.done);
  return todos;
}
