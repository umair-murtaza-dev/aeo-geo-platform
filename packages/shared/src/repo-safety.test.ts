import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function trackedSourceFiles(directory: string): string[] {
  const skip = new Set(['node_modules', 'dist', '.next', '.git', 'coverage', '.turbo']);
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (skip.has(entry)) continue;
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...trackedSourceFiles(fullPath));
    } else if (/\.(ts|tsx|js|mjs|md|json|yml|yaml|example|prisma)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('repository safety', () => {
  it('gitignores secret-bearing env files and keeps the example', () => {
    for (const fileName of ['.env', '.env.local', '.env.production']) {
      execFileSync('git', ['check-ignore', '-q', fileName], { cwd: root });
    }
    expect(() => execFileSync('git', ['check-ignore', '-q', '.env.example'], { cwd: root })).toThrow();
  });

  it('keeps .env.example limited to placeholders', () => {
    const example = readFileSync(path.join(root, '.env.example'), 'utf8');
    expect(example).toContain('DATABASE_URL=postgresql://USER:PASSWORD@');
    expect(example).toContain('DIRECT_URL=postgresql://USER:PASSWORD@');
    expect(example).not.toMatch(/sk_live_|sk_test_|AKIA[0-9A-Z]{16}|npg_[A-Za-z0-9]{8,}/);
  });

  it('does not embed live connection strings in source', () => {
    const pattern = /postgres(?:ql)?:\/\/([^:\s'"]+):([^@\s'"]+)@([^\s'")/]+)/gi;
    const allowedUsers = new Set(['USER', 'aeo', 'user']);
    const allowedPasswords = new Set(['PASSWORD', 'aeo', 'supersecret']);
    const offenders: string[] = [];
    for (const filePath of trackedSourceFiles(root)) {
      const text = readFileSync(filePath, 'utf8');
      for (const match of text.matchAll(pattern)) {
        const user = match[1] ?? '';
        const password = match[2] ?? '';
        const host = (match[3] ?? '').split(':')[0] ?? '';
        const placeholderHost = host.startsWith('HOST') || host === 'localhost' || host === '127.0.0.1' || host === 'db.example';
        if (allowedUsers.has(user) && allowedPasswords.has(password) && placeholderHost) continue;
        offenders.push(`${path.relative(root, filePath)} host=${host}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
