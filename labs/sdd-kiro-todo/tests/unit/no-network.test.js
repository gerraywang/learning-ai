import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');
const files = readdirSync(SRC).filter((f) => f.endsWith('.js'));
const FORBIDDEN = ['fetch', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource'];

describe('要件 7: 非機能', () => {
  it('7.3: src/ に通信の API がない（TODO を端末の外へ送らない）', () => {
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const code = readFileSync(join(SRC, file), 'utf8');
      for (const word of FORBIDDEN) {
        expect(code, `${file} に ${word}`).not.toMatch(new RegExp(`\\b${word}\\b`));
      }
    }
  });
});
