// contracts/storage.md の「読み込み」「保存」（FR-012, FR-014）
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, load, save } from '../../src/storage.js';
import {
  createFailingSetStorage,
  createInaccessibleStorage,
  createMemoryStorage,
} from '../helpers/memory-storage.js';

const todoA = { id: 'a', title: '牛乳を買う', done: false, due: '2026-11-30' };
const todoB = { id: 'b', title: '本を返す', done: true, due: null };
const withValue = (value) => createMemoryStorage({ [STORAGE_KEY]: value });
const withData = (data) => withValue(JSON.stringify(data));

describe('load', () => {
  it('キーは sdd-speckit-todo', () => {
    expect(STORAGE_KEY).toBe('sdd-speckit-todo');
  });

  it('キーがなければ空の一覧で、お知らせなし', () => {
    expect(load(createMemoryStorage())).toEqual({ todos: [], status: 'ok' });
  });

  it('正しい形式ならその一覧を順番どおりに返す', () => {
    const storage = withData({ version: 1, todos: [todoA, todoB] });
    expect(load(storage)).toEqual({ todos: [todoA, todoB], status: 'ok' });
  });

  it.each([
    ['JSON として読めない', '{壊れたデータ'],
    ['version が違う', JSON.stringify({ version: 2, todos: [] })],
    ['todos が配列でない', JSON.stringify({ version: 1, todos: {} })],
    ['オブジェクトでない', JSON.stringify(null)],
  ])('%s → 空の一覧と corrupt', (_, value) => {
    expect(load(withValue(value))).toEqual({ todos: [], status: 'corrupt' });
  });

  // data-model.md の Todo.id / Todo.title / Todo.done / Todo.due の制約
  it.each([
    ['id が空', { ...todoA, id: '' }],
    ['id が文字列でない', { ...todoA, id: 1 }],
    ['title が空', { ...todoA, title: '' }],
    ['title が空白だけ', { ...todoA, title: '   ' }],
    ['title が 201 文字', { ...todoA, title: 'あ'.repeat(201) }],
    ['done が真偽値でない', { ...todoA, done: 'yes' }],
    ['due の形式が違う', { ...todoA, due: '2026/11/30' }],
    ['due がない', { id: 'a', title: 'x', done: false }],
  ])('要素が制約を満たさない（%s）→ 空の一覧と corrupt', (_, bad) => {
    const storage = withData({ version: 1, todos: [todoB, bad] });
    expect(load(storage)).toEqual({ todos: [], status: 'corrupt' });
  });

  it('title がちょうど 200 文字なら読み込める', () => {
    const ok = { ...todoA, title: 'あ'.repeat(200) };
    expect(load(withData({ version: 1, todos: [ok] })).status).toBe('ok');
  });

  it('壊れた値は消さない', () => {
    const storage = withValue('{壊れたデータ');
    load(storage);
    expect(storage.getItem(STORAGE_KEY)).toBe('{壊れたデータ');
  });

  it('Storage へのアクセスが例外を投げたら空の一覧と unavailable', () => {
    expect(load(createInaccessibleStorage())).toEqual({ todos: [], status: 'unavailable' });
  });

  it('Storage がない（null）ときも unavailable', () => {
    expect(load(null)).toEqual({ todos: [], status: 'unavailable' });
  });
});

describe('save', () => {
  it('全体を version 1 の形式で書き、成功を返す', () => {
    const storage = createMemoryStorage();
    expect(save(storage, [todoA, todoB])).toEqual({ ok: true });
    expect(JSON.parse(storage.getItem(STORAGE_KEY))).toEqual({
      version: 1,
      todos: [todoA, todoB],
    });
  });

  it('保存したものを load で同じ内容に戻せる', () => {
    const storage = createMemoryStorage();
    save(storage, [todoA, todoB]);
    expect(load(storage).todos).toEqual([todoA, todoB]);
  });

  it('setItem が例外を投げたら失敗を返し、例外を外に出さない', () => {
    expect(save(createFailingSetStorage(), [todoA])).toEqual({ ok: false });
  });

  it('Storage がない（null）ときは失敗を返す', () => {
    expect(save(null, [todoA])).toEqual({ ok: false });
  });
});
