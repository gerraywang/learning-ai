// 画面テスト用のヘルパー（jsdom 環境で使う）
// index.html の <body> を document に入れ、偽 Storage と固定した「今日」で app を起動する。
// 要素は contracts/ui.md のラベル・文言で探す。
import html from '../../index.html?raw';
import { createApp } from '../../src/app.js';
import { createMemoryStorage } from './memory-storage.js';

const body = html
  .match(/<body>([\s\S]*)<\/body>/)[1]
  .replace(/<script[\s\S]*?<\/script>/g, '');

export const DEFAULT_TODAY = '2026-11-22';

export function renderApp({ storage = createMemoryStorage(), today = DEFAULT_TODAY } = {}) {
  function start() {
    document.body.innerHTML = body;
    createApp({ document, storage, today });
  }
  start();

  const byLabel = (text) => {
    const label = [...document.querySelectorAll('label')].find((l) => l.textContent === text);
    if (!label) throw new Error(`ラベル「${text}」が見つかりません`);
    return document.getElementById(label.htmlFor);
  };
  const byText = (selector, text) =>
    [...document.querySelectorAll(selector)].find((el) => el.textContent === text);

  const ui = {
    storage,
    titleInput: () => byLabel('やること'),
    dueInput: () => byLabel('期限（任意）'),
    addButton: () => byText('button', '追加'),
    list: () => document.querySelector('ul[aria-label="やることの一覧"]'),
    rows: () => [...ui.list().querySelectorAll('li')],
    /** n 番目（0 始まり）の行、または data-id で指定した行 */
    row: (indexOrId) =>
      typeof indexOrId === 'number'
        ? ui.rows()[indexOrId]
        : ui.list().querySelector(`li[data-id="${indexOrId}"]`),
    titles: () => ui.rows().map((li) => li.querySelector('.title').textContent),
    message: () => document.querySelector('[role="status"]').textContent,
    emptyText: () => {
      const el = document.getElementById('empty-message');
      return el.hidden ? '' : el.textContent;
    },
    /** 文言（と期限）を入れて「追加」を押す */
    add: (title, due = '') => {
      ui.titleInput().value = title;
      ui.dueInput().value = due;
      ui.addButton().click();
    },
    /** 同じ Storage で app を起動し直す＝ページの再読み込み */
    reload: () => start(),
  };
  return ui;
}

/** contracts/storage.md の形式で保存データを作る */
export function storedData(todos) {
  return { 'sdd-speckit-todo': JSON.stringify({ version: 1, todos }) };
}
