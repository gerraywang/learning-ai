// 入口: localStorage と「今日」を渡して app を起動する（FR-012, FR-014）
import { createApp } from './app.js';
import { toDateString } from './todo.js';

/** 設定で保存が禁止されていると、localStorage を読むだけで例外になることがある */
function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

createApp({ document, storage: getStorage(), today: toDateString(new Date()) });
