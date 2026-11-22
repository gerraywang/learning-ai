// spec.md の受け入れシナリオを画面の操作として再現する（SC-006）
// テスト名の先頭の US1-1 などは spec.md の User Story とシナリオ番号。
import { describe, expect, it } from 'vitest';
import {
  createFailingSetStorage,
  createInaccessibleStorage,
  createMemoryStorage,
} from '../helpers/memory-storage.js';
import { renderApp, storedData } from '../helpers/render-app.js';

describe('User Story 1 - やることを追加して、あとで見返す', () => {
  it('US1-1: 空の一覧に追加すると 1 件表示され、入力欄が空に戻る', () => {
    const ui = renderApp();
    ui.add('牛乳を買う');

    expect(ui.titles()).toEqual(['牛乳を買う']);
    expect(ui.titleInput().value).toBe('');
  });

  it('US1-2: 3 件目は一覧の最後に表示される', () => {
    const ui = renderApp();
    ui.add('1 件目');
    ui.add('2 件目');
    ui.add('3 件目');

    expect(ui.titles()).toEqual(['1 件目', '2 件目', '3 件目']);
  });

  it('US1-3: 再読み込みしても同じ 3 件が同じ順で表示される', () => {
    const ui = renderApp();
    ui.add('1 件目');
    ui.add('2 件目');
    ui.add('3 件目');
    ui.reload();

    expect(ui.titles()).toEqual(['1 件目', '2 件目', '3 件目']);
  });

  it.each([
    ['空', ''],
    ['空白だけ', '   '],
  ])('US1-4: 入力が%sなら追加されず、入力が必要だと分かる', (_, input) => {
    const ui = renderApp();
    ui.add(input);

    expect(ui.rows()).toHaveLength(0);
    expect(ui.message()).toBe('やることを入力してください');
  });

  it('前後の空白は取り除いて追加する（Edge Cases）', () => {
    const ui = renderApp();
    ui.add('  牛乳を買う  ');

    expect(ui.titles()).toEqual(['牛乳を買う']);
  });

  it('201 文字は追加されず、入力が残り、上限を超えたと分かる（FR-002）', () => {
    const ui = renderApp();
    const long = 'あ'.repeat(201);
    ui.add(long);

    expect(ui.rows()).toHaveLength(0);
    expect(ui.titleInput().value).toBe(long);
    expect(ui.message()).toBe('200 文字以内で入力してください');
  });

  it('正しく追加するとお知らせが消える', () => {
    const ui = renderApp();
    ui.add('');
    ui.add('牛乳を買う');

    expect(ui.message()).toBe('');
  });

  it('0 件のときは「やることはありません」が出る（FR-015）', () => {
    const ui = renderApp();
    expect(ui.emptyText()).toBe('やることはありません');

    ui.add('牛乳を買う');
    expect(ui.emptyText()).toBe('');
  });

  it('各行に data-id が付く（contracts/ui.md）', () => {
    const ui = renderApp();
    ui.add('同じ');
    ui.add('同じ');
    const ids = ui.rows().map((li) => li.dataset.id);

    expect(ids[0]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('保存に失敗したら「保存できませんでした」が出て、画面には追加される（FR-014）', () => {
    const ui = renderApp({ storage: createFailingSetStorage() });
    ui.add('牛乳を買う');

    expect(ui.titles()).toEqual(['牛乳を買う']);
    expect(ui.message()).toBe('保存できませんでした');
  });

  it('保存先が使えないとお知らせが出て、そのまま追加でき、お知らせが残る（Edge Cases, FR-014）', () => {
    const ui = renderApp({ storage: createInaccessibleStorage() });
    expect(ui.message()).toBe('この端末に保存できません。閉じると内容は消えます');

    ui.add('牛乳を買う');
    expect(ui.titles()).toEqual(['牛乳を買う']);
    expect(ui.message()).toBe('この端末に保存できません。閉じると内容は消えます');
  });

  it('保存データが壊れていたら空の一覧で始まり、読み込めなかったと分かる（Edge Cases, FR-014）', () => {
    const ui = renderApp({ storage: createMemoryStorage({ 'sdd-speckit-todo': '{壊れた' }) });

    expect(ui.rows()).toHaveLength(0);
    expect(ui.message()).toBe('保存されたデータを読み込めませんでした');
  });
});

describe('User Story 2 - 終わったやることに完了の印を付ける', () => {
  const seed = () =>
    createMemoryStorage(
      storedData([
        { id: 'a', title: '牛乳を買う', done: false, due: null },
        { id: 'b', title: '本を返す', done: true, due: null },
      ]),
    );

  it('US2-1: 未完了に印を付けると完了になり、見た目で区別できる', () => {
    const ui = renderApp({ storage: seed() });
    expect(ui.row('a').classList.contains('done')).toBe(false);

    ui.toggle('a');

    expect(ui.checkbox('a').checked).toBe(true);
    expect(ui.row('a').classList.contains('done')).toBe(true);
  });

  it('US2-2: 完了の印を外すと未完了に戻る', () => {
    const ui = renderApp({ storage: seed() });
    expect(ui.checkbox('b').checked).toBe(true);

    ui.toggle('b');

    expect(ui.checkbox('b').checked).toBe(false);
    expect(ui.row('b').classList.contains('done')).toBe(false);
  });

  it('US2-3: 完了にしたあと再読み込みしても完了のまま', () => {
    const ui = renderApp({ storage: seed() });
    ui.toggle('a');
    ui.reload();

    expect(ui.checkbox('a').checked).toBe(true);
    expect(ui.row('a').classList.contains('done')).toBe(true);
  });

  it('完了チェックのラベルはやることの文言（contracts/ui.md）', () => {
    const ui = renderApp({ storage: seed() });
    expect(ui.checkbox('a').closest('label').textContent).toBe('牛乳を買う');
  });
});

describe('User Story 3 - 要らなくなったやることを消す', () => {
  const seed = () =>
    createMemoryStorage(
      storedData([
        { id: 'a', title: '牛乳を買う', done: false, due: null },
        { id: 'b', title: '本を返す', done: true, due: null },
      ]),
    );

  it('US3-1: 1 件を削除すると、そのやることだけが消える', () => {
    const ui = renderApp({ storage: seed() });
    ui.remove('a');

    expect(ui.titles()).toEqual(['本を返す']);
  });

  it('US3-2: 削除したあと再読み込みしても戻らない', () => {
    const ui = renderApp({ storage: seed() });
    ui.remove('a');
    ui.reload();

    expect(ui.titles()).toEqual(['本を返す']);
  });

  it('US3-3: 完了・未完了どちらのやることも削除できる', () => {
    const ui = renderApp({ storage: seed() });
    ui.remove('b'); // 完了
    ui.remove('a'); // 未完了

    expect(ui.rows()).toHaveLength(0);
    expect(ui.emptyText()).toBe('やることはありません');
  });

  it('削除ボタンの読み上げ名は「<文言> を削除」（contracts/ui.md）', () => {
    const ui = renderApp({ storage: seed() });
    expect(ui.deleteButton('a').textContent).toBe('削除');
    expect(ui.deleteButton('a').getAttribute('aria-label')).toBe('牛乳を買う を削除');
  });

  it('同じ文言の 2 件目だけを削除すると 1 件目が残る（Edge Cases）', () => {
    const ui = renderApp({
      storage: createMemoryStorage(
        storedData([
          { id: 'first', title: '同じ', done: false, due: null },
          { id: 'second', title: '同じ', done: false, due: null },
        ]),
      ),
    });
    ui.remove('second');

    expect(ui.rows().map((li) => li.dataset.id)).toEqual(['first']);
  });
});

describe('User Story 4 - 期限を付けて、過ぎたものに気づく', () => {
  const today = '2026-11-22';
  const dueText = (ui, i) => ui.row(i).querySelector('.due')?.textContent ?? '';
  const isOverdueRow = (ui, i) =>
    ui.row(i).classList.contains('overdue') && ui.row(i).textContent.includes('期限切れ');

  it('US4-1: 期限を指定して追加すると、期限が表示される', () => {
    const ui = renderApp({ today });
    ui.add('本を返す', '2026-11-30');

    expect(dueText(ui, 0)).toBe('期限: 2026-11-30');
    expect(ui.dueInput().value).toBe('');
  });

  it('US4-2: 期限を指定しないと期限なしで追加される', () => {
    const ui = renderApp({ today });
    ui.add('牛乳を買う');

    expect(dueText(ui, 0)).toBe('');
    expect(ui.getStoredTodos()[0].due).toBeNull();
  });

  it('US4-3: 期限が今日より前で未完了なら期限切れと分かる', () => {
    const ui = renderApp({ today });
    ui.add('昨日まで', '2026-11-21');
    ui.add('明日まで', '2026-11-23');

    expect(isOverdueRow(ui, 0)).toBe(true);
    expect(isOverdueRow(ui, 1)).toBe(false);
    expect(ui.row(1).textContent).not.toContain('期限切れ');
  });

  it('US4-4: 期限が今日より前でも完了していれば期限切れにならない', () => {
    const ui = renderApp({
      today,
      storage: createMemoryStorage(
        storedData([{ id: 'a', title: '昨日まで', done: true, due: '2026-11-21' }]),
      ),
    });
    expect(isOverdueRow(ui, 'a')).toBe(false);
    expect(ui.row('a').textContent).not.toContain('期限切れ');
  });

  it('US4-4（続き）: 期限切れのやることを完了にすると期限切れの表示が消える', () => {
    const ui = renderApp({ today });
    ui.add('昨日まで', '2026-11-21');
    ui.toggle(0);

    expect(isOverdueRow(ui, 0)).toBe(false);
  });

  it('US4-5: 期限が今日なら期限切れにならない', () => {
    const ui = renderApp({ today });
    ui.add('今日まで', '2026-11-22');

    expect(isOverdueRow(ui, 0)).toBe(false);
    expect(ui.row(0).textContent).not.toContain('期限切れ');
  });

  it('期限は再読み込みしても残る（FR-012）', () => {
    const ui = renderApp({ today });
    ui.add('本を返す', '2026-11-30');
    ui.reload();

    expect(dueText(ui, 0)).toBe('期限: 2026-11-30');
  });
});

describe('User Story 5 - 状態で絞り込む', () => {
  // 未完了 2 件・完了 1 件
  const seed = () =>
    createMemoryStorage(
      storedData([
        { id: 'a', title: '牛乳を買う', done: false, due: null },
        { id: 'b', title: '本を返す', done: true, due: null },
        { id: 'c', title: '歯医者', done: false, due: null },
      ]),
    );
  const pressed = (ui) =>
    ['すべて', '未完了', '完了'].filter(
      (text) => ui.filterButton(text).getAttribute('aria-pressed') === 'true',
    );

  it('US5-1: 「未完了」を選ぶと未完了の 2 件だけが表示される', () => {
    const ui = renderApp({ storage: seed() });
    ui.filterButton('未完了').click();

    expect(ui.titles()).toEqual(['牛乳を買う', '歯医者']);
    expect(pressed(ui)).toEqual(['未完了']);
  });

  it('US5-2: 「完了」を選ぶと完了の 1 件だけが表示される', () => {
    const ui = renderApp({ storage: seed() });
    ui.filterButton('完了').click();

    expect(ui.titles()).toEqual(['本を返す']);
    expect(pressed(ui)).toEqual(['完了']);
  });

  it('US5-3: 「すべて」を選ぶと 3 件すべてが表示される', () => {
    const ui = renderApp({ storage: seed() });
    ui.filterButton('完了').click();
    ui.filterButton('すべて').click();

    expect(ui.titles()).toEqual(['牛乳を買う', '本を返す', '歯医者']);
    expect(pressed(ui)).toEqual(['すべて']);
  });

  it('US5-4: 「未完了」を選んでいるとき、完了にしたやることはすぐ表示から外れる', () => {
    const ui = renderApp({ storage: seed() });
    ui.filterButton('未完了').click();
    ui.toggle('a');

    expect(ui.titles()).toEqual(['歯医者']);
  });

  it('US5-5: 当てはまるやることが 0 件なら、該当がないと分かる', () => {
    const ui = renderApp({
      storage: createMemoryStorage(
        storedData([{ id: 'a', title: '牛乳を買う', done: false, due: null }]),
      ),
    });
    ui.filterButton('完了').click();

    expect(ui.rows()).toHaveLength(0);
    expect(ui.emptyText()).toBe('該当するやることはありません');
  });

  it('US5-6: 初めて開いたときは「すべて」が選ばれている', () => {
    const ui = renderApp({ storage: seed() });

    expect(pressed(ui)).toEqual(['すべて']);
    expect(ui.titles()).toHaveLength(3);
  });

  it('絞り込みは保存しない（再読み込みで「すべて」に戻る、spec.md Assumptions）', () => {
    const ui = renderApp({ storage: seed() });
    ui.filterButton('完了').click();
    ui.reload();

    expect(pressed(ui)).toEqual(['すべて']);
    expect(ui.titles()).toHaveLength(3);
  });

  it('全体が 0 件なら絞り込み中でも「やることはありません」（FR-015）', () => {
    const ui = renderApp();
    ui.filterButton('未完了').click();

    expect(ui.emptyText()).toBe('やることはありません');
  });
});
