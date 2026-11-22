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

  it('6.1: 追加・完了・未完了に戻す・削除のたびに、すぐ保存する', () => {
    const ui = renderApp({ today: TODAY });
    const ids = () => ui.saved().todos.map((t) => [t.title, t.done]);
    ui.add('買い物', TODAY);
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
