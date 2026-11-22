// FR-013 / SC-005: やることのデータを端末の外へ送るコードを含めない
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const FORBIDDEN = ['fetch', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource'];

describe('外部通信のコードがない（FR-013）', () => {
  const files = readdirSync(SRC).filter((name) => name.endsWith('.js'));

  it('src/ に JS ファイルがある', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s に通信の API がない', (name) => {
    const code = readFileSync(join(SRC, name), 'utf8');
    for (const word of FORBIDDEN) {
      expect(code, `${name} に ${word} がある`).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});
