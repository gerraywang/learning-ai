// spec.md の受け入れシナリオを画面の操作として再現する（SC-006）
// テスト名の先頭の US1-1 などは spec.md の User Story とシナリオ番号。
import { describe, expect, it } from 'vitest';
import {
  createFailingSetStorage,
  createInaccessibleStorage,
  createMemoryStorage,
} from '../helpers/memory-storage.js';
import { renderApp } from '../helpers/render-app.js';

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
