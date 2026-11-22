// requirements.md の受け入れ条件ごとの画面テスト。テスト名の先頭は要件番号
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderApp, STORAGE_KEY } from '../helpers/render-app.js';
import {
  createMemoryStorage,
  createQuotaStorage,
  createBlockedStorage,
} from '../helpers/memory-storage.js';

afterEach(() => {
  vi.useRealTimers();
});

const TODAY = '2026-11-22';
const YESTERDAY = '2026-11-21';
const TOMORROW = '2026-11-23';

const MSG = {
  titleRequired: '内容を入力してください',
  titleTooLong: '内容は 200 文字以内で入力してください',
  dueRequired: '期限を入力してください',
  duePast: '期限は今日以降の日付を入力してください',
};

describe('要件 1: TODO を追加する', () => {
  it('1.1: 内容と期限を入れて追加すると、未完了として一覧に追加される', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', TOMORROW);
    expect(ui.titles()).toEqual(['買い物']);
    const parts = ui.rowParts(ui.row(0));
    expect(parts.checkbox.checked).toBe(false);
    expect(ui.row(0).classList.contains('done')).toBe(false);
    expect(parts.due.textContent).toBe(`期限: ${TOMORROW}`);
  });

  it('1.2: 内容が空・空白だけなら追加せず、内容が必要と示す', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('', TODAY);
    expect(ui.rows()).toHaveLength(0);
    expect(ui.errors()).toEqual([MSG.titleRequired]);
    ui.add('  　 ', TODAY);
    expect(ui.rows()).toHaveLength(0);
    expect(ui.errors()).toEqual([MSG.titleRequired]);
  });

  it('1.3: 期限が空なら追加せず、期限が必要と示す', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', '');
    expect(ui.rows()).toHaveLength(0);
    expect(ui.errors()).toEqual([MSG.dueRequired]);
  });

  it('1.4: 200 文字を超える内容は追加せず、200 文字以内と示す（前後の空白は数えない）', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('あ'.repeat(201), TODAY);
    expect(ui.rows()).toHaveLength(0);
    expect(ui.errors()).toEqual([MSG.titleTooLong]);
    ui.add(`  ${'あ'.repeat(200)}  `, TODAY);
    expect(ui.titles()).toEqual(['あ'.repeat(200)]);
  });

  it('1.5: 内容の前後の空白を取り除いて保存する', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('  買い物  ', TODAY);
    expect(ui.titles()).toEqual(['買い物']);
    expect(ui.saved().todos[0].title).toBe('買い物');
  });

  it('1.6: 追加できたら内容と期限の入力欄を空に戻す', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', TODAY);
    expect(ui.byLabel('内容').value).toBe('');
    expect(ui.byLabel('期限').value).toBe('');
  });

  it('1.7: 追加できなかったら入力した内容と期限をそのまま残す', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('  買い物  ', YESTERDAY);
    expect(ui.byLabel('内容').value).toBe('  買い物  ');
    expect(ui.byLabel('期限').value).toBe(YESTERDAY);
  });

  it('1.8: 複数に当てはまるときは、当てはまるものをすべて示す', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('', '');
    expect(ui.errors()).toEqual([MSG.titleRequired, MSG.dueRequired]);
    ui.add('あ'.repeat(201), YESTERDAY);
    expect(ui.errors()).toEqual([MSG.titleTooLong, MSG.duePast]);
    expect(ui.rows()).toHaveLength(0);
  });

  it('1.9: 誤りを示したあとで追加できたら、誤りの表示を消す', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('', '');
    expect(ui.errors()).toHaveLength(2);
    ui.add('買い物', TODAY);
    expect(ui.errors()).toEqual([]);
  });

  it('1.10: 内容と期限が同じ TODO も別々に追加できる', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', TODAY);
    ui.add('買い物', TODAY);
    expect(ui.titles()).toEqual(['買い物', '買い物']);
    const ids = ui.rows().map((r) => r.dataset.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('1.11: 追加した順（古いものが上）に表示し、再読み込みでも順番を変えない', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('1 件目', TODAY);
    ui.add('2 件目', TOMORROW);
    ui.add('3 件目', TODAY);
    expect(ui.titles()).toEqual(['1 件目', '2 件目', '3 件目']);
    ui.reload();
    expect(ui.titles()).toEqual(['1 件目', '2 件目', '3 件目']);
  });

  it('1.12: 記号や HTML の文字が含まれていても、入力された文字のとおりに表示する', () => {
    const ui = renderApp({ today: TODAY });
    const title = '<b>太字</b> & "引用" <script>x</script>';
    ui.add(title, TODAY);
    const titleEl = ui.rowParts(ui.row(0)).title;
    expect(titleEl.textContent).toBe(title);
    expect(titleEl.querySelector('b')).toBeNull();
    expect(titleEl.querySelector('script')).toBeNull();
  });
});

describe('要件 2: 期限は今日以降だけ', () => {
  it('2.1: 今日より前の日付は（手で入力されても）追加せず、今日以降と示す', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', YESTERDAY);
    expect(ui.rows()).toHaveLength(0);
    expect(ui.errors()).toEqual([MSG.duePast]);
  });

  it('2.2: 期限は日付だけで扱い、「今日」は起動時に渡された端末の日付で判断する', () => {
    const ui = renderApp({ today: TODAY });
    expect(ui.byLabel('期限').min).toBe(TODAY);
    ui.add('今日が期限', TODAY);
    expect(ui.saved().todos[0].due).toBe(TODAY);
    ui.add('明日が期限', TOMORROW);
    expect(ui.titles()).toEqual(['今日が期限', '明日が期限']);
  });
});

// 過去の期限の TODO は偽 Storage に直接入れて用意する（tasks.md 5.2）
const storageWith = (todos) =>
  createMemoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, todos }) });
const item = (id, title, due, done = false) => ({ id, title, due, done });

describe('要件 2: 期限切れの表示', () => {
  const isMarkedOverdue = (row) =>
    row.classList.contains('overdue') && row.textContent.includes('期限切れ');

  it('2.3: 未完了で期限が今日より前の TODO は、期限切れと分かるように表示する', () => {
    const ui = renderApp({
      today: TODAY,
      storage: storageWith([
        item('a', '昨日まで', YESTERDAY),
        item('b', '今日まで', TODAY),
        item('c', '明日まで', TOMORROW),
      ]),
    });
    expect(isMarkedOverdue(ui.row('a'))).toBe(true);
    expect(isMarkedOverdue(ui.row('b'))).toBe(false);
    expect(ui.row('b').textContent).not.toContain('期限切れ');
    expect(isMarkedOverdue(ui.row('c'))).toBe(false);
    expect(ui.rowParts(ui.row('a')).due.textContent).toBe(`期限: ${YESTERDAY}`);
  });

  it('2.4: 期限が今日より前でも完了している TODO は、期限切れの表示をしない', () => {
    const ui = renderApp({ today: TODAY, storage: storageWith([item('a', '昨日まで', YESTERDAY, true)]) });
    expect(ui.row('a').classList.contains('overdue')).toBe(false);
    expect(ui.row('a').textContent).not.toContain('期限切れ');
  });

  it('2.5: 期限切れは開いたときの「今日」で判断し、日付が変わっても再読み込みまで表示は変えない', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 22, 23, 59));
    const ui = renderApp({ today: TODAY, storage: storageWith([item('a', '今日まで', TODAY)]) });
    // 開いたまま日付が翌日に変わり、操作して描き直しても表示は変えない
    vi.setSystemTime(new Date(2026, 10, 23, 0, 1));
    ui.add('もう 1 件', TOMORROW);
    expect(ui.row('a').classList.contains('overdue')).toBe(false);
    expect(ui.row('a').textContent).not.toContain('期限切れ');
    // 翌日に再読み込みすると期限切れになる
    ui.reload({ today: TOMORROW });
    expect(ui.row('a').classList.contains('overdue')).toBe(true);
    expect(ui.row('a').textContent).toContain('期限切れ');
  });
});

describe('要件 3: 完了にする・未完了に戻す', () => {
  it('3.1: 未完了の TODO を完了にすると、完了として見分けられるように表示する（保存もする）', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', TODAY);
    ui.add('掃除', TODAY);
    ui.toggle(0);
    expect(ui.row(0).classList.contains('done')).toBe(true);
    expect(ui.rowParts(ui.row(0)).checkbox.checked).toBe(true);
    expect(ui.row(1).classList.contains('done')).toBe(false);
    expect(ui.saved().todos.map((t) => t.done)).toEqual([true, false]);
  });

  it('3.2: 完了の TODO を未完了に戻すと、未完了として表示する（保存もする）', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', TODAY);
    ui.toggle(0);
    ui.toggle(0);
    expect(ui.row(0).classList.contains('done')).toBe(false);
    expect(ui.rowParts(ui.row(0)).checkbox.checked).toBe(false);
    expect(ui.saved().todos[0].done).toBe(false);
  });

  it('1.11: 完了・未完了を切り替えても順番を変えない', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('1 件目', TODAY);
    ui.add('2 件目', TODAY);
    ui.add('3 件目', TODAY);
    ui.toggle(1);
    ui.toggle(0);
    expect(ui.titles()).toEqual(['1 件目', '2 件目', '3 件目']);
    ui.toggle(1);
    ui.reload();
    expect(ui.titles()).toEqual(['1 件目', '2 件目', '3 件目']);
  });
});

describe('要件 4: 削除する', () => {
  it('4.1: 確認せずに選んだ 1 件だけを取り除く（同じ内容・期限の 2 件目だけ／完了済みも）', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('買い物', TODAY);
    ui.add('買い物', TODAY);
    ui.add('掃除', TODAY);
    const [firstId, , thirdId] = ui.rows().map((r) => r.dataset.id);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    expect(ui.rowParts(ui.row(1)).deleteButton.getAttribute('aria-label')).toBe('買い物 を削除');
    ui.remove(1);
    expect(ui.rows().map((r) => r.dataset.id)).toEqual([firstId, thirdId]);

    ui.toggle(1);
    ui.remove(1);
    expect(ui.rows().map((r) => r.dataset.id)).toEqual([firstId]);
    expect(ui.saved().todos.map((t) => t.id)).toEqual([firstId]);
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

describe('要件 5: すべて・未完了・完了で表示を切り替える', () => {
  const setup = () => {
    const ui = renderApp({
      today: TODAY,
      storage: storageWith([
        item('a', '未完了 1', TODAY),
        item('b', '完了 1', TODAY, true),
        item('c', '未完了 2', TOMORROW),
      ]),
    });
    return ui;
  };
  const pressed = (ui) =>
    ['すべて', '未完了', '完了'].filter((t) => ui.button(t).getAttribute('aria-pressed') === 'true');

  it('5.1: 「すべて」を選ぶと、完了・未完了を問わずすべて表示する', () => {
    const ui = setup();
    ui.chooseFilter('完了');
    ui.chooseFilter('すべて');
    expect(ui.titles()).toEqual(['未完了 1', '完了 1', '未完了 2']);
    expect(pressed(ui)).toEqual(['すべて']);
  });

  it('5.2: 「未完了」を選ぶと、未完了だけを表示する', () => {
    const ui = setup();
    ui.chooseFilter('未完了');
    expect(ui.titles()).toEqual(['未完了 1', '未完了 2']);
    expect(pressed(ui)).toEqual(['未完了']);
  });

  it('5.3: 「完了」を選ぶと、完了だけを表示する', () => {
    const ui = setup();
    ui.chooseFilter('完了');
    expect(ui.titles()).toEqual(['完了 1']);
    expect(pressed(ui)).toEqual(['完了']);
  });

  it('5.4: 選んでいる表示に合わなくなった TODO は、すぐ表示から外す', () => {
    const ui = setup();
    ui.chooseFilter('未完了');
    ui.toggle(0); // 未完了 1 を完了に
    expect(ui.titles()).toEqual(['未完了 2']);

    ui.chooseFilter('完了');
    ui.add('新しい TODO', TODAY); // 未完了で追加される
    expect(ui.titles()).toEqual(['未完了 1', '完了 1']);
    ui.toggle(1); // 完了 1 を未完了に戻す
    expect(ui.titles()).toEqual(['未完了 1']);

    ui.chooseFilter('すべて');
    expect(ui.titles()).toEqual(['未完了 1', '完了 1', '未完了 2', '新しい TODO']);
  });

  it('5.5: 開いたとき（再読み込みを含む）は「すべて」を選んだ状態で、選んだ表示は保存しない', () => {
    const ui = setup();
    expect(pressed(ui)).toEqual(['すべて']);
    ui.chooseFilter('完了');
    ui.reload();
    expect(pressed(ui)).toEqual(['すべて']);
    expect(ui.titles()).toEqual(['未完了 1', '完了 1', '未完了 2']);
    expect(Object.keys(ui.saved())).toEqual(['version', 'todos']);
  });

  it('5.6: TODO が 1 件もないときは、TODO がないことを示す', () => {
    const ui = renderApp({ today: TODAY });
    expect(ui.emptyMessage()).toBe('TODO はありません');
    ui.chooseFilter('完了');
    expect(ui.emptyMessage()).toBe('TODO はありません');
    ui.chooseFilter('すべて');
    ui.add('買い物', TODAY);
    expect(ui.emptyMessage()).toBe('');
    ui.remove(0);
    expect(ui.emptyMessage()).toBe('TODO はありません');
  });

  it('5.7: TODO はあるが選んだ表示に合うものが 0 件なら、6 とは区別して示す', () => {
    const ui = renderApp({ today: TODAY, storage: storageWith([item('a', '未完了', TODAY)]) });
    expect(ui.emptyMessage()).toBe('');
    ui.chooseFilter('完了');
    expect(ui.emptyMessage()).toBe('該当する TODO はありません');
    expect(ui.rows()).toHaveLength(0);
  });
});

describe('7.2 の補助: 描き直してもキーボードの位置を失わない（自動テストの対象外の要件を支える確認）', () => {
  it('削除すると隣の行の削除ボタンへ、最後の 1 件なら内容の入力欄へフォーカスが移る', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('1', TODAY);
    ui.add('2', TODAY);
    ui.remove(0);
    expect(document.activeElement).toBe(ui.rowParts(ui.row(0)).deleteButton);
    ui.remove(0);
    expect(document.activeElement).toBe(ui.byLabel('内容'));
  });

  it('編集を始めると入力欄へ、確定できなければ入力欄に残り、確定・取り消しのあとはその行の「編集」ボタンへ移る', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('1', TODAY);
    ui.add('2', TODAY);
    ui.startEdit(1);
    expect(document.activeElement).toBe(ui.rowParts(ui.row(1)).editInput);
    ui.typeEdit(' ');
    ui.confirmEdit();
    expect(document.activeElement).toBe(ui.rowParts(ui.row(1)).editInput);
    ui.typeEdit('二');
    ui.confirmEdit();
    expect(document.activeElement).toBe(ui.rowParts(ui.row(1)).editButton);
    ui.startEdit(0);
    ui.cancelEditByEscape();
    expect(document.activeElement).toBe(ui.rowParts(ui.row(0)).editButton);
  });

  it('完了を切り替えても、その行のチェックにフォーカスが残る', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('1', TODAY);
    ui.rowParts(ui.row(0)).checkbox.focus();
    ui.toggle(0);
    expect(document.activeElement).toBe(ui.rowParts(ui.row(0)).checkbox);
  });
});

describe('要件 6: データを保存する', () => {
  const NOTICE = {
    unavailable: 'この端末に保存できません。閉じると内容は消えます',
    saveFailed: '保存できませんでした。閉じると内容は消えます',
    corrupt: '保存されたデータを読み込めませんでした',
  };

  it('6.1: 追加・内容の編集・完了・未完了に戻す・削除のたびに、すぐ保存する', () => {
    const ui = renderApp({ today: TODAY });
    const ids = () => ui.saved().todos.map((t) => [t.title, t.done]);
    ui.add('買いもの', TODAY);
    expect(ids()).toEqual([['買いもの', false]]);
    ui.startEdit(0);
    ui.typeEdit('買い物');
    ui.confirmEdit();
    expect(ids()).toEqual([['買い物', false]]);
    ui.toggle(0);
    expect(ids()).toEqual([['買い物', true]]);
    ui.toggle(0);
    expect(ids()).toEqual([['買い物', false]]);
    ui.remove(0);
    expect(ids()).toEqual([]);
  });

  it('6.2: 再読み込みすると、内容・期限・完了かどうか・並び順を元どおりに表示する', () => {
    const ui = renderApp({ today: TODAY });
    ui.add('1 件目', TOMORROW);
    ui.add('2 件目', TODAY);
    ui.add('3 件目', TOMORROW);
    ui.toggle(1);
    const before = ui.rows().map((r) => r.outerHTML);
    ui.reload();
    expect(ui.rows().map((r) => r.outerHTML)).toEqual(before);
    expect(ui.titles()).toEqual(['1 件目', '2 件目', '3 件目']);
    expect(ui.rowParts(ui.row(1)).checkbox.checked).toBe(true);
    expect(ui.rowParts(ui.row(0)).due.textContent).toBe(`期限: ${TOMORROW}`);
  });

  it('6.3: 閉じて同じ端末・同じブラウザで開き直すと、元どおりに表示する', () => {
    // 同じ偽 Storage で起動し直すことで、開き直しを確かめたとする（design.md テスト方針）
    const storage = createMemoryStorage();
    const first = renderApp({ today: TODAY, storage });
    first.add('買い物', TOMORROW);
    first.toggle(0);
    const second = renderApp({ today: TOMORROW, storage });
    expect(second.titles()).toEqual(['買い物']);
    expect(second.rowParts(second.row(0)).checkbox.checked).toBe(true);
    expect(second.notice()).toBe('');
  });

  it('6.4: 保存先が使えないときは知らせ、操作は続けられる（知らせるのは 1 回）', () => {
    const ui = renderApp({ today: TODAY, storage: createBlockedStorage() });
    expect(ui.notice()).toBe(NOTICE.unavailable);
    const status = document.querySelector('[role="status"]');
    const changes = [];
    new MutationObserver(() => changes.push(status.textContent)).observe(status, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    ui.add('買い物', TODAY);
    ui.toggle(0);
    ui.add('掃除', TODAY);
    ui.remove(1);
    expect(ui.titles()).toEqual(['買い物']);
    expect(ui.rowParts(ui.row(0)).checkbox.checked).toBe(true);
    expect(ui.notice()).toBe(NOTICE.unavailable);
    return Promise.resolve().then(() => expect(changes).toEqual([]));
  });

  it('6.4: 保存に失敗したら知らせ、操作は続けられる（同じ原因につき 1 回、次に保存できるまで残す）', async () => {
    const storage = createMemoryStorage();
    const ui = renderApp({ today: TODAY, storage });
    expect(ui.notice()).toBe('');
    const setItem = storage.setItem;
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    ui.add('買い物', TODAY);
    expect(ui.titles()).toEqual(['買い物']);
    expect(ui.notice()).toBe(NOTICE.saveFailed);

    const status = document.querySelector('[role="status"]');
    const changes = [];
    new MutationObserver(() => changes.push(status.textContent)).observe(status, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    ui.toggle(0);
    ui.add('掃除', TODAY);
    await Promise.resolve();
    expect(changes).toEqual([]);
    expect(ui.notice()).toBe(NOTICE.saveFailed);
    expect(ui.titles()).toEqual(['買い物', '掃除']);

    // 保存できるようになったら、お知らせを消す
    storage.setItem = setItem;
    ui.remove(1);
    expect(ui.notice()).toBe('');
    expect(ui.saved().todos.map((t) => [t.title, t.done])).toEqual([['買い物', true]]);
  });

  it('6.4: 編集の確定で保存に失敗したら知らせ、画面の内容は変えたまま操作を続けられる', () => {
    const storage = storageWith([item('a', '買いもの', TODAY)]);
    const ui = renderApp({ today: TODAY, storage });
    const raw = storage.getItem(STORAGE_KEY);
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    ui.startEdit(0);
    ui.typeEdit('買い物');
    ui.confirmEdit();
    expect(ui.titles()).toEqual(['買い物']);
    expect(ui.editingRow()).toBeUndefined();
    expect(ui.notice()).toBe(NOTICE.saveFailed);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('6.4: 起動時から容量不足の Storage でも、保存に失敗した時点で知らせる', () => {
    const ui = renderApp({ today: TODAY, storage: createQuotaStorage() });
    expect(ui.notice()).toBe('');
    ui.add('買い物', TODAY);
    expect(ui.notice()).toBe(NOTICE.saveFailed);
    expect(ui.titles()).toEqual(['買い物']);
  });

  it('6.5: 保存したデータが壊れていたら空の一覧で始めて知らせ、次に保存するまで消さない', () => {
    const raw = '{壊れている';
    const storage = createMemoryStorage({ [STORAGE_KEY]: raw });
    const ui = renderApp({ today: TODAY, storage });
    expect(ui.rows()).toHaveLength(0);
    expect(ui.emptyMessage()).toBe('TODO はありません');
    expect(ui.notice()).toBe(NOTICE.corrupt);
    ui.chooseFilter('完了');
    ui.chooseFilter('すべて');
    ui.add('', ''); // 追加できない操作では保存しない
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);

    ui.add('買い物', TODAY);
    expect(ui.saved().todos.map((t) => t.title)).toEqual(['買い物']);
    expect(ui.notice()).toBe('');
  });

  it('6.5: 形式が違うデータ（due が null など）も壊れているとして扱う', () => {
    const storage = storageWith([item('a', '買い物', null)]);
    const ui = renderApp({ today: TODAY, storage });
    expect(ui.rows()).toHaveLength(0);
    expect(ui.notice()).toBe(NOTICE.corrupt);
  });
});

describe('要件 8: TODO の内容を編集する', () => {
  // 1 行目: 未完了・期限切れ、2 行目: 完了、3 行目: 未完了
  const setup = () =>
    renderApp({
      today: TODAY,
      storage: storageWith([
        item('a', '買い物', YESTERDAY),
        item('b', '掃除', TODAY, true),
        item('c', '洗濯', TOMORROW),
      ]),
    });

  it('8.1: 編集を始めると、その TODO の今の内容を入れた入力欄で書き換えられる', () => {
    const ui = setup();
    ui.startEdit(1);
    const parts = ui.rowParts(ui.row(1));
    expect(parts.editInput.value).toBe('掃除');
    expect(parts.editInput.disabled).toBe(false);
    expect(parts.editButton).toBeUndefined();
    expect(parts.saveButton).toBeDefined();
    expect(parts.cancelButton).toBeDefined();
    expect(ui.editingRow()).toBe(ui.row(1));
    expect(ui.rowParts(ui.row(0)).editInput).toBeNull();
  });

  it('8.1: 「編集」ボタンの読み上げ名は「<内容> を編集」', () => {
    const ui = setup();
    expect(ui.rowParts(ui.row(0)).editButton.getAttribute('aria-label')).toBe('買い物 を編集');
  });

  it('8.2: 確定すると、前後の空白を取り除いた新しい内容に変わる（「保存」と Enter）', () => {
    const ui = setup();
    ui.startEdit(0);
    ui.typeEdit('  牛乳を買う  ');
    ui.confirmEdit();
    expect(ui.titles()).toEqual(['牛乳を買う', '掃除', '洗濯']);
    expect(ui.editingRow()).toBeUndefined();
    expect(ui.saved().todos[0].title).toBe('牛乳を買う');

    ui.startEdit(2);
    ui.typeEdit('洗濯物を干す');
    ui.confirmEditByEnter();
    expect(ui.titles()).toEqual(['牛乳を買う', '掃除', '洗濯物を干す']);
    expect(ui.saved().todos[2].title).toBe('洗濯物を干す');
  });

  it('8.2: 編集した内容に HTML の文字が含まれていても、文字のとおりに表示する（1.12）', () => {
    const ui = setup();
    ui.startEdit(0);
    ui.typeEdit('<b>太字</b>');
    ui.confirmEdit();
    expect(ui.titles()[0]).toBe('<b>太字</b>');
    expect(ui.row(0).querySelector('b')).toBeNull();
    expect(ui.rowParts(ui.row(0)).editButton.getAttribute('aria-label')).toBe('<b>太字</b> を編集');
  });

  it('8.3: 取り消すと、内容は編集を始める前のまま変わらない（「取り消し」と Esc）', () => {
    const ui = setup();
    const raw = ui.storage.getItem(STORAGE_KEY);
    ui.startEdit(0);
    ui.typeEdit('別の内容');
    ui.cancelEdit();
    expect(ui.titles()).toEqual(['買い物', '掃除', '洗濯']);
    expect(ui.editingRow()).toBeUndefined();

    ui.startEdit(0);
    ui.typeEdit('別の内容');
    ui.cancelEditByEscape();
    expect(ui.titles()).toEqual(['買い物', '掃除', '洗濯']);
    expect(ui.editingRow()).toBeUndefined();
    expect(ui.storage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('8.4: 空・空白だけの内容では確定せず、内容が必要と示す', () => {
    const ui = setup();
    const raw = ui.storage.getItem(STORAGE_KEY);
    ui.startEdit(0);
    ui.typeEdit('');
    ui.confirmEdit();
    expect(ui.rowParts(ui.row(0)).editErrors).toEqual([MSG.titleRequired]);
    ui.typeEdit('  　 ');
    ui.confirmEditByEnter();
    expect(ui.rowParts(ui.row(0)).editErrors).toEqual([MSG.titleRequired]);
    expect(ui.storage.getItem(STORAGE_KEY)).toBe(raw);
    ui.cancelEdit();
    expect(ui.titles()[0]).toBe('買い物');
  });

  it('8.5: 200 文字を超える内容では確定せず、200 文字以内と示す（前後の空白は数えない）', () => {
    const ui = setup();
    const raw = ui.storage.getItem(STORAGE_KEY);
    ui.startEdit(0);
    ui.typeEdit('あ'.repeat(201));
    ui.confirmEdit();
    expect(ui.rowParts(ui.row(0)).editErrors).toEqual([MSG.titleTooLong]);
    expect(ui.storage.getItem(STORAGE_KEY)).toBe(raw);

    ui.typeEdit(`  ${'あ'.repeat(200)}  `);
    ui.confirmEdit();
    expect(ui.titles()[0]).toBe('あ'.repeat(200));
    expect(ui.saved().todos[0].title).toBe('あ'.repeat(200));
  });

  it('8.4・8.5: 編集の誤りは追加の誤り（フォームの下）とは別に出す', () => {
    const ui = setup();
    ui.startEdit(0);
    ui.typeEdit('');
    ui.confirmEdit();
    expect(ui.errors()).toEqual([]);
    expect(ui.rowParts(ui.row(0)).editErrors).toEqual([MSG.titleRequired]);
  });

  it('8.6: 確定できなかったら、入力した内容を残したまま編集を続けられる', () => {
    const ui = setup();
    ui.startEdit(0);
    const long = `  ${'い'.repeat(201)}  `;
    ui.typeEdit(long);
    ui.confirmEdit();
    expect(ui.editingRow()).toBe(ui.row(0));
    expect(ui.rowParts(ui.row(0)).editInput.value).toBe(long);
    ui.typeEdit('直した');
    ui.confirmEdit();
    expect(ui.titles()[0]).toBe('直した');
  });

  it('8.7: 誤りを示したあとで、確定できたら・取り消したら、その表示を消す', () => {
    const ui = setup();
    ui.startEdit(0);
    ui.typeEdit('');
    ui.confirmEdit();
    ui.typeEdit('直した');
    ui.confirmEdit();
    expect(document.querySelectorAll('ul.edit-errors > li')).toHaveLength(0);

    ui.startEdit(0);
    expect(ui.rowParts(ui.row(0)).editErrors).toEqual([]);
    ui.typeEdit('');
    ui.confirmEdit();
    ui.cancelEdit();
    expect(document.querySelectorAll('ul.edit-errors > li')).toHaveLength(0);
    ui.startEdit(0);
    expect(ui.rowParts(ui.row(0)).editErrors).toEqual([]);
  });

  it('8.8: 編集しても、期限・完了かどうか・並び順は変わらない', () => {
    const ui = setup();
    const before = ui.saved().todos;
    ui.startEdit(1);
    ui.typeEdit('お風呂の掃除');
    ui.confirmEdit();
    ui.startEdit(0);
    ui.typeEdit('牛乳を買う');
    ui.confirmEdit();
    expect(ui.saved().todos).toEqual([
      { ...before[0], title: '牛乳を買う' },
      { ...before[1], title: 'お風呂の掃除' },
      before[2],
    ]);
    expect(ui.titles()).toEqual(['牛乳を買う', 'お風呂の掃除', '洗濯']);
    expect(ui.rowParts(ui.row(1)).checkbox.checked).toBe(true);
    expect(ui.row(1).classList.contains('done')).toBe(true);
    expect(ui.row(0).classList.contains('overdue')).toBe(true);
    expect(ui.rowParts(ui.row(0)).due.textContent).toBe(`期限: ${YESTERDAY}`);
  });

  it('8.9: 同時に編集できるのは 1 件だけ', () => {
    const ui = setup();
    ui.startEdit(0);
    ui.startEdit(2);
    expect(document.querySelectorAll('form.edit-form')).toHaveLength(1);
    expect(ui.editingRow()).toBe(ui.row(2));
  });

  describe('8.10: 編集中にほかの操作をすると、編集を取り消してからその操作をする', () => {
    const startTyping = (ui) => {
      ui.startEdit(0);
      ui.typeEdit('打ちかけ');
    };

    it('8.10: 別の TODO の編集を始める', () => {
      const ui = setup();
      startTyping(ui);
      ui.startEdit(2);
      expect(ui.rowParts(ui.row(0)).title.textContent).toBe('買い物');
      expect(ui.rowParts(ui.row(2)).editInput.value).toBe('洗濯');
      expect(ui.saved().todos[0].title).toBe('買い物');
    });

    it('8.10: 追加する（追加で誤りが出ても、編集は取り消したまま）', () => {
      const ui = setup();
      startTyping(ui);
      ui.add('', '');
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()).toEqual(['買い物', '掃除', '洗濯']);
      expect(ui.errors()).toEqual([MSG.titleRequired, MSG.dueRequired]);

      startTyping(ui);
      ui.add('料理', TODAY);
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()).toEqual(['買い物', '掃除', '洗濯', '料理']);
      expect(ui.saved().todos.map((t) => t.title)).toEqual(['買い物', '掃除', '洗濯', '料理']);
    });

    it('8.10: 完了を切り替える（編集中の行のチェックでも）', () => {
      const ui = setup();
      startTyping(ui);
      ui.toggle(0);
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()[0]).toBe('買い物');
      expect(ui.rowParts(ui.row(0)).checkbox.checked).toBe(true);
      expect(ui.saved().todos[0]).toMatchObject({ title: '買い物', done: true });

      startTyping(ui);
      ui.toggle(2);
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()[0]).toBe('買い物');
      expect(ui.saved().todos[2].done).toBe(true);
    });

    it('8.10: 削除する（別の行でも、編集中の行でも）', () => {
      const ui = setup();
      startTyping(ui);
      ui.remove(2);
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()).toEqual(['買い物', '掃除']);

      startTyping(ui);
      ui.remove(0);
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()).toEqual(['掃除']);
      expect(ui.saved().todos.map((t) => t.title)).toEqual(['掃除']);
    });

    it('8.10: 表示を切り替える', () => {
      const ui = setup();
      startTyping(ui);
      ui.chooseFilter('未完了');
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()).toEqual(['買い物', '洗濯']);
      ui.chooseFilter('すべて');
      expect(ui.editingRow()).toBeUndefined();
      expect(ui.titles()[0]).toBe('買い物');
    });
  });

  it('8.11: 編集中に再読み込みすると、編集していない状態で開き、確定していない編集は保存しない', () => {
    const ui = setup();
    ui.startEdit(0);
    ui.typeEdit('打ちかけ');
    ui.reload();
    expect(ui.editingRow()).toBeUndefined();
    expect(ui.titles()).toEqual(['買い物', '掃除', '洗濯']);
    expect(ui.saved().todos[0].title).toBe('買い物');
  });
});
