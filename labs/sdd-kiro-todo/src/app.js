// 画面の描画と操作。todo.js と storage.js をつなぐ（design.md「app.js」）
import { validateInput, addTodo, isOverdue, toggleTodo, removeTodo, filterTodos } from './todo.js';
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

  function renderRow(todo) {
    const li = root.createElement('li');
    li.dataset.id = todo.id;
    if (todo.done) li.classList.add('done');

    const label = root.createElement('label');
    const checkbox = root.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    const title = root.createElement('span');
    title.className = 'title';
    title.textContent = todo.title; // HTML として解釈しない【1.12】
    label.append(checkbox, title);

    const due = root.createElement('span');
    due.className = 'due';
    due.textContent = `期限: ${todo.due}`;

    const remove = root.createElement('button');
    remove.type = 'button';
    remove.className = 'delete';
    remove.textContent = '削除';
    remove.setAttribute('aria-label', `${todo.title} を削除`);

    li.append(label, due);

    if (isOverdue(todo, state.today)) {
      li.classList.add('overdue');
      const mark = root.createElement('span');
      mark.className = 'overdue-mark';
      mark.textContent = '期限切れ'; // 色だけに頼らない【2.3】
      li.append(mark);
    }
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

  function render() {
    // 描き直してもキーボードの位置を失わないように、行の中のフォーカスを覚えておく【7.2】
    const focused = root.activeElement;
    const focusedLi = el.list.contains(focused) ? focused.closest('li') : null;
    const focusedIndex = focusedLi ? [...el.list.children].indexOf(focusedLi) : -1;
    const focusedSelector = focused?.matches?.('input[type="checkbox"]') ? 'input[type="checkbox"]' : 'button.delete';

    renderErrors();
    renderNotice();
    renderFilters();
    const visible = filterTodos(state.todos, state.filter);
    el.list.replaceChildren(...visible.map(renderRow));
    renderEmpty(visible);

    if (focusedLi) {
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
  function update(todos) {
    state.todos = todos;
    persist();
    render();
  }

  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
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
    update(toggleTodo(state.todos, checkbox.closest('li').dataset.id));
  });

  el.filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    // 選んでいる表示だけを変えて描き直す。保存しない【5.5】
    state.filter = button.dataset.filter;
    render();
  });

  el.list.addEventListener('click', (event) => {
    const button = event.target.closest('button.delete');
    if (!button) return;
    // 確認せずに、選んだ 1 件だけを取り除く【4.1】
    button.focus(); // クリックでフォーカスが移らないブラウザでも、描き直し後に隣の行へ移せるように
    update(removeTodo(state.todos, button.closest('li').dataset.id));
  });

  render();
  return { state };
}
