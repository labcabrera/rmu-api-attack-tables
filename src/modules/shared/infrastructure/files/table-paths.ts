import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Tables shipped with the image (tracked in this repository): <repo>/tables, from src/ or dist/ alike. */
export const BUNDLED_DIR = fileURLToPath(new URL('../../../../../tables', import.meta.url));

/** Kinds of table, each one a subfolder of the tables folder. */
export type TableKind = 'attack' | 'critical' | 'fumble' | 'spellcasting' | 'spell-failure';

const TEMPLATE_FILE = 'empty-template.json';

/**
 * Where the table files are. RMU_ATTACK_TABLES_DIR points to a folder with one subfolder per kind, in either layout:
 * `<dir>/attack`, `<dir>/critical`... (this repo's tables/) or `<dir>/attack-tables`, `<dir>/critical-tables`...
 * (workspace data/core-law). A file missing from the configured folder falls back to the bundled one.
 */
@Injectable()
export class TablePaths implements OnModuleInit {
  private readonly logger = new Logger(TablePaths.name);
  private readonly cache = new Map<string, unknown>();
  readonly root: string;

  constructor(config: ConfigService) {
    const value = config.get<string>('RMU_ATTACK_TABLES_DIR')?.trim();
    this.root = value ? path.resolve(value) : BUNDLED_DIR;
  }

  onModuleInit() {
    if (this.root === BUNDLED_DIR) this.logger.log(`Tables: bundled (${BUNDLED_DIR})`);
    else if (existsSync(this.root)) this.logger.log(`Tables: ${this.root} (bundled tables as fallback)`);
    else this.logger.warn(`Tables: ${this.root} does not exist, using the bundled tables (${BUNDLED_DIR})`);
  }

  /** Folders searched for a kind, in order. */
  candidateDirs(kind: TableKind): string[] {
    const dirs = [path.join(this.root, kind), path.join(this.root, `${kind}-tables`)];
    if (this.root !== BUNDLED_DIR) dirs.push(path.join(BUNDLED_DIR, kind));
    return dirs;
  }

  /** Path of the first existing file of that name, or null. */
  resolve(kind: TableKind, fileName: string): string | null {
    return (
      this.candidateDirs(kind)
        .map(dir => path.join(dir, fileName))
        .find(file => existsSync(file)) ?? null
    );
  }

  /** Names (without the extension) of the files of a kind, in every folder, without duplicates and sorted. */
  list(kind: TableKind, extension: string): string[] {
    const names = new Set<string>();
    for (const dir of this.candidateDirs(kind).filter(candidate => existsSync(candidate))) {
      readdirSync(dir)
        .filter(file => file.endsWith(extension) && file !== TEMPLATE_FILE)
        .forEach(file => names.add(file.slice(0, -extension.length)));
    }
    return [...names].sort();
  }

  /** Contents of a table file, parsed once and kept in memory; null when no folder has it. */
  read<T>(kind: TableKind, fileName: string, parse: (text: string) => T): T | null {
    const file = this.resolve(kind, fileName);
    if (!file) return null;
    if (!this.cache.has(file)) this.cache.set(file, parse(readFileSync(file, 'utf8')));
    return this.cache.get(file) as T;
  }

  readJson<T>(kind: TableKind, fileName: string): T | null {
    return this.read(kind, fileName, text => JSON.parse(text) as T);
  }
}
