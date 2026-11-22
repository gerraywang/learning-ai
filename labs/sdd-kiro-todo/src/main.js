// 入口。localStorage と「今日」を用意して app を起動する
import { createApp } from './app.js';
import { toDateString } from './todo.js';

function getLocalStorage() {
  try {
    // 設定で禁止されていると、触るだけで例外になる【6.4】
    return window.localStorage;
  } catch {
    return null;
  }
}

createApp({ root: document, storage: getLocalStorage(), today: toDateString(new Date()) });
