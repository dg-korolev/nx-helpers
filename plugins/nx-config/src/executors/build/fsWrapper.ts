import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';

export interface IFsWrapper {
  getFilesByPathPattern(pattern: string[], options: { ignore: string | string[] }): string[];

  existsFile(path: string): boolean;

  readFile(path: string): Buffer;

  writeFile(path: string, text: string): void;

  deleteFile(path: string): void;
}

export class FsWrapper implements IFsWrapper {
  getFilesByPathPattern(pattern: string[], options: { ignore: string | string[] }): string[] {
    return globSync(pattern, options);
  }

  existsFile(path: string): boolean {
    return existsSync(path);
  }

  readFile(path: string): Buffer {
    return readFileSync(path);
  }

  writeFile(path: string, text: string): void {
    return writeFileSync(path, text);
  }

  deleteFile(path: string): void {
    return unlinkSync(path);
  }
}
