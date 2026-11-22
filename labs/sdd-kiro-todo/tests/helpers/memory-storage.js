// テスト用の偽 Storage（design.md テスト方針「保存の失敗」）

/** 普通に読み書きできる Storage */
export function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
  };
}

/** 読めるが setItem で例外を投げる Storage（容量不足など） */
export function createQuotaStorage(initial = {}) {
  const storage = createMemoryStorage(initial);
  storage.setItem = () => {
    const error = new Error('QuotaExceededError');
    error.name = 'QuotaExceededError';
    throw error;
  };
  return storage;
}

/** 何をしても例外を投げる Storage（ブラウザの設定で禁止） */
export function createBlockedStorage() {
  const fail = () => {
    const error = new Error('SecurityError');
    error.name = 'SecurityError';
    throw error;
  };
  return {
    getItem: fail,
    setItem: fail,
    removeItem: fail,
    clear: fail,
    get length() {
      return fail();
    },
    key: fail,
  };
}
