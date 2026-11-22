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
    editButton: [...r.querySelectorAll('button')].find((b) => b.textContent.trim() === '編集'),
    // 編集中の行だけにあるもの【要件 8】
    editForm: r.querySelector('form.edit-form'),
    editInput: r.querySelector('input[aria-label="内容を編集"]'),
    saveButton: [...r.querySelectorAll('button')].find((b) => b.textContent.trim() === '保存'),
    cancelButton: [...r.querySelectorAll('button')].find((b) => b.textContent.trim() === '取り消し'),
    editErrors: [...r.querySelectorAll('ul.edit-errors[role="alert"] > li')].map((li) => li.textContent),
  });
  /** 編集中の行（なければ undefined） */
  const editingRow = () => rows().find((r) => r.querySelector('form.edit-form'));

  const ui = {
    storage,
    byLabel,
    button,
    list,
    rows,
    row,
    rowParts,
    editingRow,
    /** 編集中の行は、編集を始める前の内容（title）が出ていないので、その行は入力欄の値ではなく null を返す */
    titles: () => rows().map((r) => rowParts(r).title?.textContent ?? null),
    /** 追加の誤り（フォームの下）だけ。編集の誤りは rowParts(r).editErrors */
    errors: () => [...document.querySelectorAll('#input-errors > li')].map((li) => li.textContent),
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
    /** index 行目の「編集」を押す */
    startEdit(index) {
      rowParts(rows()[index]).editButton.click();
    },
    /** 編集中の入力欄に文字を入れる */
    typeEdit(text) {
      const input = rowParts(editingRow()).editInput;
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    /** 「保存」を押す */
    confirmEdit() {
      rowParts(editingRow()).saveButton.click();
    },
    /** 入力欄で Enter（jsdom はフォームの暗黙の送信を再現しないので requestSubmit で代える。追加の submit() と同じ） */
    confirmEditByEnter() {
      rowParts(editingRow()).editForm.requestSubmit();
    },
    /** 「取り消し」を押す */
    cancelEdit() {
      rowParts(editingRow()).cancelButton.click();
    },
    /** 入力欄で Esc */
    cancelEditByEscape() {
      rowParts(editingRow()).editInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    },
    saved: () => JSON.parse(storage.getItem(STORAGE_KEY)),
    /** 同じ Storage で起動し直す（再読み込み・開き直し） */
    reload({ today: nextToday = today } = {}) {
      start(nextToday);
    },
  };
  return ui;
}
