// 画面の描画とイベント。todo.js（ロジック）と storage.js（保存）をつなぐ。
// 画面の約束は contracts/ui.md。
import { load, save } from './storage.js';
import {
  addTodo,
  filterTodos,
  isOverdue,
  removeTodo,
  toggleTodo,
  validateTitle,
} from './todo.js';

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
    filterButtons: [...document.querySelectorAll('#filters button')],
  };

  function renderRow(todo) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    li.classList.toggle('done', todo.done); // FR-006

    // 完了チェック。ラベルはやることの文言（FR-005）
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = todo.title;
    label.append(checkbox, title);
    li.append(label);

    // 期限と期限切れの印（FR-009, FR-010）。色だけに頼らず文字でも示す
    if (todo.due !== null) {
      const due = document.createElement('span');
      due.className = 'due';
      due.textContent = `期限: ${todo.due}`;
      li.append(due);
    }
    if (isOverdue(todo, today)) {
      li.classList.add('overdue');
      const badge = document.createElement('span');
      badge.className = 'overdue-badge';
      badge.textContent = '期限切れ';
      li.append(badge);
    }

    // 削除ボタン（FR-007）。読み上げ名で、どのやることを消すか分かるようにする
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = '削除';
    remove.setAttribute('aria-label', `${todo.title} を削除`);
    li.append(remove);

    return li;
  }

  function render() {
    const visible = filterTodos(state.todos, state.filter);
    els.list.replaceChildren(...visible.map(renderRow));

    // 空の表示（FR-015）: 全体が 0 件か、絞り込みで 0 件かで文言を変える
    const isEmpty = visible.length === 0;
    els.list.hidden = isEmpty;
    els.empty.hidden = !isEmpty;
    els.empty.textContent = !isEmpty
      ? ''
      : state.todos.length === 0
        ? EMPTY_TEXT.none
        : EMPTY_TEXT.filtered;

    // 選択中の絞り込みボタン（contracts/ui.md）
    for (const button of els.filterButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter));
    }

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
    state.todos = addTodo(state.todos, { title: result.title, due: els.dueInput.value });
    state.message = baseMessage();
    persist();
    els.titleInput.value = '';
    els.dueInput.value = '';
    render();
  });

  /** 一覧の中の操作は 1 か所で受け取り、どの行かは data-id で決める */
  function updateTodos(next) {
    state.todos = next;
    state.message = baseMessage();
    persist();
    render();
  }

  // 完了の切り替え（FR-005）
  els.list.addEventListener('change', (event) => {
    if (event.target.type !== 'checkbox') return;
    const id = event.target.closest('li').dataset.id;
    updateTodos(toggleTodo(state.todos, id));
  });

  // 削除。確認なしですぐ消す（FR-007、spec.md Assumptions）
  els.list.addEventListener('click', (event) => {
    const button = event.target.closest('button.remove');
    if (!button) return;
    const id = button.closest('li').dataset.id;
    updateTodos(removeTodo(state.todos, id));
  });

  // 絞り込み（FR-011）。表示を変えるだけで保存はしない
  for (const button of els.filterButtons) {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      render();
    });
  }

  render();

  // テストやデバッグで状態を確かめるため
  return { getState: () => state };
}
