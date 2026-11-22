// 画面の描画と操作。todo.js と storage.js をつなぐ（design.md「app.js」）
import {
  validateInput,
  validateTitle,
  addTodo,
  editTodo,
  isOverdue,
  toggleTodo,
  removeTodo,
  filterTodos,
} from './todo.js';
import { load, save } from './storage.js';

const ERROR_MESSAGES = {
  titleRequired: '内容を入力してください',
  titleTooLong: '内容は 200 文字以内で入力してください',
  dueRequired: '期限を入力してください',
  duePast: '期限は今日以降の日付を入力してください',
};

const NOTICES = {
  unavailable: 'この端末に保存できません。閉じると内容は消えます',
  saveFailed: '保存できませんでした。閉じると内容は消えます',
  corrupt: '保存されたデータを読み込めませんでした',
};

/**
 * app を起動する
 * @param {{ root: Document, storage: Storage | null, today: string }} options
 *   today は起動時の端末の日付 YYYY-MM-DD。開いている間は変えない【2.5】
 */
export function createApp({ root = document, storage, today }) {
  const el = {
    form: root.getElementById('add-form'),
    title: root.getElementById('title-input'),
    due: root.getElementById('due-input'),
    errors: root.getElementById('input-errors'),
    list: root.getElementById('todo-list'),
    filters: root.getElementById('filters'),
    empty: root.getElementById('empty-message'),
    notice: root.getElementById('notice'),
  };

  const loaded = load(storage);
  const state = {
    todos: loaded.todos,
    filter: 'all', // 開いたときは「すべて」。保存しない【5.5】
    today,
    inputErrors: [],
    // お知らせは 1 つだけ【6.4, 6.5】。起動時に保存先が使えなければ、保存は試さない
    notice: loaded.status === 'ok' ? null : loaded.status,
    // 編集中の行は 1 つだけ。保存しないので、開いたときは編集していない【8.9, 8.11】
    editing: null, // { id, draft, errors }
  };
  const canSave = loaded.status !== 'unavailable';

  el.due.min = today;

  function persist() {
    if (!canSave) return;
    // 保存の失敗は次に保存できるまで残し、読み込み失敗は次に保存できたら消す
    state.notice = save(storage, state.todos).ok ? null : 'saveFailed';
  }

  function renderNotice() {
    const text = state.notice ? NOTICES[state.notice] : '';
    // 同じ文言をくり返し出さない（読み上げが繰り返されないように、変わったときだけ書き換える）
    if (el.notice.textContent !== text) el.notice.textContent = text;
  }

  function renderErrors() {
    // 変わったときだけ書き換える（role="alert" の読み上げを他の操作でくり返さない）
    const texts = state.inputErrors.map((code) => ERROR_MESSAGES[code]);
    const current = [...el.errors.children].map((li) => li.textContent);
    if (texts.join('\n') === current.join('\n')) return;
    el.errors.replaceChildren(
      ...state.inputErrors.map((code) => {
        const li = root.createElement('li');
        li.textContent = ERROR_MESSAGES[code];
        return li;
      }),
    );
  }

  function createButton(className, text, ariaLabel, type = 'button') {
    const button = root.createElement('button');
    button.type = type;
    button.className = className;
    button.textContent = text;
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
    return button;
  }

  /** 編集中の行の、内容の代わりに出すフォーム【8.1】 */
  function renderEditForm(editing) {
    const form = root.createElement('form');
    form.className = 'edit-form';
    form.noValidate = true;

    const input = root.createElement('input');
    input.type = 'text';
    input.value = editing.draft; // 確定できなかったときは入力を残す【8.6】
    input.setAttribute('aria-label', '内容を編集');

    const errors = root.createElement('ul');
    errors.className = 'edit-errors';
    errors.setAttribute('role', 'alert');
    errors.append(
      ...editing.errors.map((code) => {
        const li = root.createElement('li');
        li.textContent = ERROR_MESSAGES[code];
        return li;
      }),
    );

    form.append(input, createButton('edit-save', '保存', null, 'submit'), createButton('edit-cancel', '取り消し'), errors);
    return form;
  }

  function renderRow(todo) {
    const li = root.createElement('li');
    li.dataset.id = todo.id;
    if (todo.done) li.classList.add('done');
    const editing = state.editing?.id === todo.id ? state.editing : null;

    const checkbox = root.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    let label;
    if (editing) {
      // 編集中も完了チェックは出す。読み上げ名は今の内容【design.md 画面の要素】
      li.classList.add('editing');
      checkbox.setAttribute('aria-label', todo.title);
      label = root.createElement('span');
      label.className = 'check';
      label.append(checkbox);
    } else {
      label = root.createElement('label');
      const title = root.createElement('span');
      title.className = 'title';
      title.textContent = todo.title; // HTML として解釈しない【1.12】
      label.append(checkbox, title);
    }

    const due = root.createElement('span');
    due.className = 'due';
    due.textContent = `期限: ${todo.due}`;

    const remove = createButton('delete', '削除', `${todo.title} を削除`);

    li.append(label);
    if (editing) li.append(renderEditForm(editing));
    li.append(due);

    if (isOverdue(todo, state.today)) {
      li.classList.add('overdue');
      const mark = root.createElement('span');
      mark.className = 'overdue-mark';
      mark.textContent = '期限切れ'; // 色だけに頼らない【2.3】
      li.append(mark);
    }
    if (!editing) li.append(createButton('edit', '編集', `${todo.title} を編集`));
    li.append(remove);
    return li;
  }

  function renderFilters() {
    for (const button of el.filters.querySelectorAll('button[data-filter]')) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter));
    }
  }

  function renderEmpty(visible) {
    if (state.todos.length === 0) {
      el.empty.textContent = 'TODO はありません'; // 【5.6】
    } else if (visible.length === 0) {
      el.empty.textContent = '該当する TODO はありません'; // 【5.7】
    } else {
      el.empty.textContent = '';
    }
    el.empty.hidden = el.empty.textContent === '';
    el.list.hidden = visible.length === 0;
  }

  /**
   * @param {{ id: string, selector: string }} [focusTo] 描き直したあとにフォーカスを移す先（編集の開始・終了で使う）
   */
  function render(focusTo) {
    // 描き直してもキーボードの位置を失わないように、行の中のフォーカスを覚えておく【7.2】
    const focused = root.activeElement;
    const focusedLi = el.list.contains(focused) ? focused.closest('li') : null;
    const focusedIndex = focusedLi ? [...el.list.children].indexOf(focusedLi) : -1;
    const focusedSelector = focused?.matches?.('input[type="checkbox"]')
      ? 'input[type="checkbox"]'
      : focused?.matches?.('button.edit')
        ? 'button.edit'
        : 'button.delete';

    renderErrors();
    renderNotice();
    renderFilters();
    const visible = filterTodos(state.todos, state.filter);
    el.list.replaceChildren(...visible.map(renderRow));
    renderEmpty(visible);

    if (focusTo) {
      el.list.querySelector(`li[data-id="${CSS.escape(focusTo.id)}"] ${focusTo.selector}`)?.focus();
    } else if (focusedLi) {
      // 同じ行があればそこへ。削除や絞り込みで消えたら、隣の行（なければ内容の入力欄）へ
      const rows = [...el.list.children];
      const row =
        rows.find((li) => li.dataset.id === focusedLi.dataset.id) ??
        rows[focusedIndex] ??
        rows[focusedIndex - 1];
      (row?.querySelector(focusedSelector) ?? el.title).focus();
    }
  }

  /** 状態を変える → すぐ保存 → 描き直す【6.1】 */
  function update(todos, focusTo) {
    state.todos = todos;
    persist();
    render(focusTo);
  }

  /** 編集をやめる（保存しない）。ほかの操作の前にも呼ぶ【8.3, 8.10】 */
  function cancelEditing() {
    state.editing = null; // 編集の誤りもいっしょに消える【8.7】
  }

  function finishEditing(id) {
    cancelEditing();
    render({ id, selector: 'button.edit' });
  }

  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    cancelEditing(); // 追加で誤りが出ても、編集は取り消したまま【8.10】
    const result = validateInput({ title: el.title.value, due: el.due.value }, state.today);
    if (!result.ok) {
      state.inputErrors = result.errors; // 入力は残す【1.7】
      render();
      return;
    }
    state.inputErrors = [];
    el.form.reset();
    update(addTodo(state.todos, result));
  });

  el.list.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (!checkbox) return;
    cancelEditing(); // 【8.10】
    update(toggleTodo(state.todos, checkbox.closest('li').dataset.id));
  });

  el.filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    // 選んでいる表示だけを変えて描き直す。保存しない【5.5】
    cancelEditing(); // 【8.10】
    state.filter = button.dataset.filter;
    render();
  });

  el.list.addEventListener('click', (event) => {
    const editButton = event.target.closest('button.edit');
    if (editButton) {
      // 別の行を編集中なら、それを取り消してから始める【8.9, 8.10】
      const id = editButton.closest('li').dataset.id;
      const todo = state.todos.find((t) => t.id === id);
      state.editing = { id, draft: todo.title, errors: [] }; // 今の内容から始める【8.1】
      render({ id, selector: 'form.edit-form input' });
      return;
    }
    if (event.target.closest('button.edit-cancel')) {
      finishEditing(state.editing.id); // 【8.3】
      return;
    }

    const button = event.target.closest('button.delete');
    if (!button) return;
    cancelEditing(); // 【8.10】
    // 確認せずに、選んだ 1 件だけを取り除く【4.1】
    button.focus(); // クリックでフォーカスが移らないブラウザでも、描き直し後に隣の行へ移せるように
    update(removeTodo(state.todos, button.closest('li').dataset.id));
  });

  el.list.addEventListener('input', (event) => {
    if (state.editing && event.target.matches('form.edit-form input')) state.editing.draft = event.target.value;
  });

  el.list.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !state.editing || !event.target.matches('form.edit-form input')) return;
    event.preventDefault();
    finishEditing(state.editing.id); // Esc で取り消し【8.3, 7.2】
  });

  // 「保存」または入力欄で Enter【8.2, 7.2】
  el.list.addEventListener('submit', (event) => {
    const form = event.target.closest('form.edit-form');
    if (!form || !state.editing) return;
    event.preventDefault();
    const { id } = state.editing;
    const draft = form.querySelector('input').value;
    const result = validateTitle(draft);
    if (!result.ok) {
      // 内容は変えず、入力を残して編集を続ける【8.4〜8.6】
      state.editing = { id, draft, errors: result.errors };
      render({ id, selector: 'form.edit-form input' });
      return;
    }
    cancelEditing(); // 誤りの表示も消える【8.7】
    update(editTodo(state.todos, id, result.title), { id, selector: 'button.edit' });
  });

  render();
  return { state };
}
