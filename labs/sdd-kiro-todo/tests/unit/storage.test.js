import { describe, it, expect } from 'vitest';
import { load, save, STORAGE_KEY } from '../../src/storage.js';
import {
  createMemoryStorage,
  createQuotaStorage,
  createBlockedStorage,
} from '../helpers/memory-storage.js';

const todo = (over = {}) => ({ id: 'a', title: '買い物', done: false, due: '2026-11-30', ...over });
const stored = (todos) => JSON.stringify({ version: 1, todos });

describe('load', () => {
  it('キーがなければ空の一覧で ok', () => {
    expect(load(createMemoryStorage())).toEqual({ todos: [], status: 'ok' });
  });

  it('正しいデータを並び順どおりに読み込む', () => {
    const todos = [todo({ id: 'a' }), todo({ id: 'b', title: '掃除', done: true, due: '2026-12-01' })];
    const storage = createMemoryStorage({ [STORAGE_KEY]: stored(todos) });
    expect(load(storage)).toEqual({ todos, status: 'ok' });
  });

  it.each([
    ['JSON でない', '{壊れている'],
    ['オブジェクトでない', '[]'],
    ['version が違う', JSON.stringify({ version: 2, todos: [] })],
    ['todos が配列でない', JSON.stringify({ version: 1, todos: {} })],
    ['id がない', stored([todo({ id: undefined })])],
    ['id が空', stored([todo({ id: '' })])],
    ['id が重複', stored([todo({ id: 'a' }), todo({ id: 'a' })])],
    ['title が空', stored([todo({ title: '' })])],
    ['title が空白だけ', stored([todo({ title: '   ' })])],
    ['title の前後に空白', stored([todo({ title: ' 買い物 ' })])],
    ['title が 201 文字', stored([todo({ title: 'あ'.repeat(201) })])],
    ['title が文字列でない', stored([todo({ title: 1 })])],
    ['done が真偽値でない', stored([todo({ done: 'false' })])],
    ['due が null', stored([todo({ due: null })])],
    ['due の形式が違う', stored([todo({ due: '2026/11/30' })])],
    ['due が存在しない日付', stored([todo({ due: '2026-02-30' })])],
  ])('壊れている（%s）なら空の一覧で corrupt、値は消さない', (_, raw) => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: raw });
    expect(load(storage)).toEqual({ todos: [], status: 'corrupt' });
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('title がちょうど 200 文字なら ok', () => {
    const todos = [todo({ title: 'あ'.repeat(200) })];
    const storage = createMemoryStorage({ [STORAGE_KEY]: stored(todos) });
    expect(load(storage).status).toBe('ok');
  });

  it('読めない（例外）なら空の一覧で unavailable', () => {
    expect(load(createBlockedStorage())).toEqual({ todos: [], status: 'unavailable' });
  });

  it('Storage が null なら unavailable', () => {
    expect(load(null)).toEqual({ todos: [], status: 'unavailable' });
  });
});

describe('save', () => {
  it('成功すると保存形式で書き込み ok: true', () => {
    const storage = createMemoryStorage();
    const todos = [todo()];
    expect(save(storage, todos)).toEqual({ ok: true });
    expect(JSON.parse(storage.getItem(STORAGE_KEY))).toEqual({ version: 1, todos });
  });

  it('失敗しても例外を出さず ok: false', () => {
    expect(save(createQuotaStorage(), [todo()])).toEqual({ ok: false });
    expect(save(createBlockedStorage(), [todo()])).toEqual({ ok: false });
    expect(save(null, [todo()])).toEqual({ ok: false });
  });
});
