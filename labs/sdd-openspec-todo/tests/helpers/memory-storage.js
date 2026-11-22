// テスト用の偽 Storage（plan.md Project Structure / contracts/storage.md）

/** メモリ上で動く普通の Storage。initial は { キー: 文字列 } */
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
    /** テストで中身を確かめるため */
    dump: () => Object.fromEntries(data),
  };
}

/** 読み込みはできるが、setItem で例外を投げる（容量不足などを想定） */
export function createFailingSetStorage(initial = {}) {
  const storage = createMemoryStorage(initial);
  return {
    ...storage,
    setItem: () => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    },
  };
}

/** どの操作でも例外を投げる（ブラウザの設定で保存が禁止されている状態を想定） */
export function createInaccessibleStorage() {
  const deny = () => {
    throw new DOMException('access denied', 'SecurityError');
  };
  return { getItem: deny, setItem: deny, removeItem: deny };
}
