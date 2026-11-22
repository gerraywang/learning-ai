// 画面の描画とイベント。todo.js（ロジック）と storage.js（保存）をつなぐ。
// 画面の約束は contracts/ui.md。
import { load, save } from './storage.js';
import { addTodo, validateTitle } from './todo.js';

// contracts/ui.md「お知らせの文言」
export const MESSAGES = {
  empty: 'やることを入力してください',
  tooLong: '200 文字以内で入力してください',
  saveFailed: '保存できませんでした',
  unavailable: 'この端末に保存できません。閉じると内容は消えます',
  corrupt: '保存されたデータを読み込めませんでした',
};

// contracts/ui.md「空の表示」（FR-015）
const EMPTY_TEXT = {
  none: 'やることはありません',
  filtered: '該当するやることはありません',
};

const LOAD_MESSAGES = { ok: '', corrupt: MESSAGES.corrupt, unavailable: MESSAGES.unavailable };

/**
 * @param {{ document: Document, storage: Storage | null, today: string }} options
 *   today は端末のローカル日付の YYYY-MM-DD（research.md R3）
 */
export function createApp({ document, storage, today }) {
  const loaded = load(storage);
  const storageUnavailable = loaded.status === 'unavailable';

  // data-model.md「画面の状態」
  const state = {
    todos: loaded.todos,
    filter: 'all', // data-model.md Filter の初期値
    message: LOAD_MESSAGES[loaded.status],
  };

  const els = {
    form: document.getElementById('add-form'),
    titleInput: document.getElementById('title-input'),
    dueInput: document.getElementById('due-input'),
    list: document.getElementById('todo-list'),
    empty: document.getElementById('empty-message'),
    message: document.getElementById('message'),
  };

  function renderRow(todo) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = todo.title;
    li.append(title);

    return li;
  }

  function render() {
    els.list.replaceChildren(...state.todos.map(renderRow));

    const isEmpty = state.todos.length === 0;
    els.list.hidden = isEmpty;
    els.empty.hidden = !isEmpty;
    els.empty.textContent = isEmpty ? EMPTY_TEXT.none : '';

    els.message.textContent = state.message;
  }

  /** 操作のあとに保存する。保存先が使えないときは試さず、最初のお知らせを残す */
  function persist() {
    if (storageUnavailable) return;
    if (!save(storage, state.todos).ok) state.message = MESSAGES.saveFailed;
  }

  /** 何も問題がないときのお知らせ（保存先が使えない間はそのお知らせを残す） */
  function baseMessage() {
    return storageUnavailable ? MESSAGES.unavailable : '';
  }

  // 追加（contracts/ui.md「操作と結果」）
  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = validateTitle(els.titleInput.value);
    if (!result.ok) {
      state.message = result.error === 'empty' ? MESSAGES.empty : MESSAGES.tooLong;
      render();
      return;
    }
    state.todos = addTodo(state.todos, { title: result.title });
    state.message = baseMessage();
    persist();
    els.titleInput.value = '';
    els.dueInput.value = '';
    render();
  });

  render();

  // テストやデバッグで状態を確かめるため
  return { getState: () => state };
}
