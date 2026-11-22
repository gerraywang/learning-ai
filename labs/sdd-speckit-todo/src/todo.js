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
 * 末尾に新しいやることを足した配列を返す（元の配列は変えない、FR-003 / FR-004）
 * title は validateTitle を通したものを渡す。
 */
export function addTodo(todos, { title }) {
  const todo = {
    id: crypto.randomUUID(), // data-model.md Todo.id
    title, // data-model.md Todo.title
    done: false, // data-model.md Todo.done の初期値
    due: null, // data-model.md Todo.due（期限は US4 で扱う）
  };
  return [...todos, todo];
}
