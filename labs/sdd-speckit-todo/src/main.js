// 入口: localStorage と「今日」を渡して app を起動する（FR-012, FR-014）
import { createApp } from './app.js';

/** 設定で保存が禁止されていると、localStorage を読むだけで例外になることがある */
function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 端末のローカル日付を YYYY-MM-DD で返す（research.md R3） */
function todayString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

createApp({ document, storage: getStorage(), today: todayString() });
