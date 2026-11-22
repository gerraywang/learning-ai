// index.html の中身を jsdom に入れ、偽 Storage と固定した「今日」で app を起動する
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '../../src/app.js';
import { createMemoryStorage } from './memory-storage.js';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const mainHtml = html.match(/<main[\s\S]*<\/main>/)[0];

export const STORAGE_KEY = 'sdd-kiro-todo';

export function renderApp({ storage = createMemoryStorage(), today = '2026-11-22' } = {}) {
  const start = (startToday) => {
    document.body.innerHTML = mainHtml;
    return createApp({ root: document, storage, today: startToday });
  };
  start(today);

  const byLabel = (text) => {
    const label = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === text);
    if (!label) throw new Error(`ラベル「${text}」が見つからない`);
    return document.getElementById(label.htmlFor);
  };
  const button = (text, scope = document) => {
    const found = [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
    if (!found) throw new Error(`ボタン「${text}」が見つからない`);
    return found;
  };
  const list = () => document.querySelector('[aria-label="TODO の一覧"]');
  const rows = () => [...list().querySelectorAll(':scope > li')];
  const row = (indexOrId) =>
    typeof indexOrId === 'number' ? rows()[indexOrId] : list().querySelector(`li[data-id="${indexOrId}"]`);
  const rowParts = (r) => ({
    checkbox: r.querySelector('input[type="checkbox"]'),
    title: r.querySelector('.title'),
    due: r.querySelector('.due'),
    deleteButton: [...r.querySelectorAll('button')].find((b) => b.textContent.trim() === '削除'),
  });

  const ui = {
    storage,
    byLabel,
    button,
    list,
    rows,
    row,
    rowParts,
    titles: () => rows().map((r) => rowParts(r).title.textContent),
    errors: () => [...document.querySelectorAll('ul[role="alert"] > li')].map((li) => li.textContent),
    notice: () => document.querySelector('[role="status"]').textContent,
    emptyMessage: () => {
      const el = document.getElementById('empty-message');
      return el.hidden ? '' : el.textContent;
    },
    fill(title, due) {
      byLabel('内容').value = title;
      byLabel('期限').value = due;
    },
    submit() {
      byLabel('内容').form.requestSubmit();
    },
    add(title, due) {
      ui.fill(title, due);
      ui.submit();
    },
    toggle(index) {
      rowParts(rows()[index]).checkbox.click();
    },
    remove(index) {
      rowParts(rows()[index]).deleteButton.click();
    },
    chooseFilter(text) {
      button(text).click();
    },
    saved: () => JSON.parse(storage.getItem(STORAGE_KEY)),
    /** 同じ Storage で起動し直す（再読み込み・開き直し） */
    reload({ today: nextToday = today } = {}) {
      start(nextToday);
    },
  };
  return ui;
}
