// 画面の描画とイベント。todo.js（ロジック）と storage.js（保存）をつなぐ。
// 画面の約束は contracts/ui.md。
import { load, save } from './storage.js';
import {
  addTodo,
  editDue,
  editTodo,
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
    editing: null, // null または { id, draft, dueDraft }（dueDraft は日付欄の値、YYYY-MM-DD か空文字）。保存しない
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

    if (state.editing?.id === todo.id) {
      li.classList.add('editing');
      li.append(renderEditForm());
      appendDue(li, todo, { showDate: false }); // 期限の文字は日付欄に置き換え、期限切れの印だけ出す
      return li;
    }

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
    appendDue(li, todo);

    // 編集ボタン（spec 002 FR-001）。削除ボタンの前に置く
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'edit';
    edit.textContent = '編集';
    edit.setAttribute('aria-label', `${todo.title} を編集`);
    li.append(edit);

    // 削除ボタン（FR-007）。読み上げ名で、どのやることを消すか分かるようにする
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = '削除';
    remove.setAttribute('aria-label', `${todo.title} を削除`);
    li.append(remove);

    return li;
  }

  /**
   * 期限と期限切れの印（FR-009, FR-010）。色だけに頼らず文字でも示す。
   * 編集中の行では期限の文字を出さず（日付欄で示す）、期限切れの印は保存されている期限で出す
   */
  function appendDue(li, todo, { showDate = true } = {}) {
    if (showDate && todo.due !== null) {
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
  }

  /** 編集中の行のフォーム（spec 002 contracts/ui.md「一覧の 1 行（編集中のとき）」） */
  function renderEditForm() {
    const form = document.createElement('form');
    form.className = 'edit-form';
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'やることの文言');
    input.value = state.editing.draft;
    const due = document.createElement('input');
    due.type = 'date';
    due.className = 'edit-due';
    due.setAttribute('aria-label', '期限');
    due.value = state.editing.dueDraft;
    const confirm = document.createElement('button');
    confirm.type = 'submit';
    confirm.textContent = '確定';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel';
    cancel.textContent = '取り消し';
    form.append(input, due, confirm, cancel);
    return form;
  }

  /** 編集中の行の入力欄、または指定した行の「編集」ボタンにフォーカスする（research.md R7） */
  function focusRow(id, selector) {
    els.list.querySelector(`li[data-id="${CSS.escape(id)}"] ${selector}`)?.focus();
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
    const due = els.dueInput.value;
    els.titleInput.value = '';
    els.dueInput.value = '';
    updateTodos(addTodo(state.todos, { title: result.title, due }));
  });

  /** 一覧の中の操作は 1 か所で受け取り、どの行かは data-id で決める */
  function updateTodos(next) {
    state.todos = next;
    state.editing = null; // ほかの操作をしたら編集は取り消し（spec 002 FR-004）
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

  // 編集を始める（spec 002 FR-001 / FR-002 / FR-010）。ほかの行の編集は置き換える
  els.list.addEventListener('click', (event) => {
    const button = event.target.closest('button.edit');
    if (!button) return;
    const id = button.closest('li').dataset.id;
    const todo = state.todos.find((t) => t.id === id);
    state.editing = { id, draft: todo.title, dueDraft: todo.due ?? '' };
    state.message = baseMessage();
    render();
    focusRow(id, '.edit-form input');
  });

  // 編集の確定（文言と期限）。入力欄・日付欄での Enter でもフォームの送信になる
  els.list.addEventListener('submit', (event) => {
    if (!event.target.matches('form.edit-form')) return;
    event.preventDefault();
    const { id } = state.editing;
    const input = event.target.querySelector('input[aria-label="やることの文言"]');
    const dueValue = event.target.querySelector('input.edit-due').value;
    const result = validateTitle(input.value);
    if (!result.ok) {
      // 決まりに合わないときは文言も期限も変えず、編集中のまま両方の入力を残して理由を示す（spec 002 FR-006）
      state.editing = { id, draft: input.value, dueDraft: dueValue };
      state.message = result.error === 'empty' ? MESSAGES.empty : MESSAGES.tooLong;
      render();
      focusRow(id, '.edit-form input');
      return;
    }
    // 日付欄が空なら期限なし（追加のフォームと同じ扱い）
    updateTodos(editDue(editTodo(state.todos, id, result.title), id, dueValue));
    focusRow(id, 'button.edit');
  });

  /** 編集を取り消して、その行の「編集」にフォーカスする。保存はしない（spec 002 FR-004 / FR-009） */
  function cancelEdit() {
    const { id } = state.editing;
    state.editing = null;
    state.message = baseMessage(); // 確定できなかった理由を残さない（spec 002 contracts/ui.md）
    render();
    focusRow(id, 'button.edit');
  }

  // 「取り消し」ボタン（spec 002 FR-004 / FR-012）
  els.list.addEventListener('click', (event) => {
    if (event.target.closest('li.editing button.cancel')) cancelEdit();
  });

  // Esc で取り消し。日本語の変換中の Esc は変換をやめる操作なので除く（research.md R3）
  els.list.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.isComposing) return;
    if (event.target.closest('li.editing')) cancelEdit();
  });

  // 編集中の行の外のクリックで取り消し（spec 002 FR-004、research.md R4）。
  // 一覧の操作で描き直されて画面から外れた要素は除く。ほかの行の部品を残すため、編集中の行だけを描き直す
  document.addEventListener('click', (event) => {
    if (!state.editing || !event.target.isConnected) return;
    const li = els.list.querySelector('li.editing');
    if (!li || li.contains(event.target)) return;
    const todo = state.todos.find((t) => t.id === state.editing.id);
    state.editing = null;
    state.message = baseMessage();
    els.message.textContent = state.message;
    li.replaceWith(renderRow(todo));
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
      state.editing = null; // spec 002 FR-004
      render();
    });
  }

  render();
}
