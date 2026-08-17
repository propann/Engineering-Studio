/**
 * Web File System Access Layer
 * Unified interface for Tauri (native) + FSA (web) file operations
 * Dual-mode: If Tauri available, use it; else use File System Access API
 */

import type { LocalDirectoryHandle } from './localFolders';

type TauriWindow = Window & {
  __TAURI__?: unknown;
};

type FileSystemWindow = Window & {
  showDirectoryPicker?: () => Promise<LocalDirectoryHandle>;
};

export interface IFileSystem {
  mode: 'tauri' | 'web';
  readFile(path: string): Promise<ArrayBuffer>;
  writeFile(path: string, data: ArrayBuffer): Promise<void>;
  listFiles(path: string): Promise<string[]>;
}

/**
 * Get appropriate file system implementation
 * Tries Tauri first (if available), then falls back to FSA (web)
 */
export async function getFileSystem(): Promise<IFileSystem> {
  // Check if Tauri is available
  const nativeWindow = typeof window !== 'undefined' ? window as TauriWindow : null;
  if (nativeWindow?.__TAURI__) {
    const { invoke } = await import('@tauri-apps/api/tauri');

    return {
      mode: 'tauri',
      async readFile(path: string): Promise<ArrayBuffer> {
        const result = await invoke<ArrayBuffer>('read_file', { path });
        return result;
      },
      async writeFile(path: string, data: ArrayBuffer): Promise<void> {
        await invoke('write_file', { path, data });
      },
      async listFiles(path: string): Promise<string[]> {
        const result = await invoke<string[]>('list_files', { path });
        return result;
      },
    };
  }

  // Fall back to File System Access API
  const browserWindow = typeof window !== 'undefined' ? window as FileSystemWindow : null;
  const pickDirectory = browserWindow?.showDirectoryPicker;
  if (pickDirectory) {
    return {
      mode: 'web',
      async readFile(path: string): Promise<ArrayBuffer> {
        const dirHandle = await pickDirectory();
        const parts = path.split('/').filter(p => p);
        let currentHandle = dirHandle as FileSystemDirectoryHandle;

        for (let i = 0; i < parts.length - 1; i++) {
          currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
        }

        const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1]);
        const file = await fileHandle.getFile();
        return file.arrayBuffer();
      },
      async writeFile(path: string, data: ArrayBuffer): Promise<void> {
        const dirHandle = await pickDirectory();
        const parts = path.split('/').filter(p => p);
        let currentHandle = dirHandle as FileSystemDirectoryHandle;

        for (let i = 0; i < parts.length - 1; i++) {
          try {
            currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
          } catch {
            currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true });
          }
        }

        const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1], { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
      },
      async listFiles(path: string): Promise<string[]> {
        const dirHandle = await pickDirectory();
        const parts = path.split('/').filter(p => p);
        let currentHandle = dirHandle as FileSystemDirectoryHandle;

        for (const part of parts) {
          currentHandle = await currentHandle.getDirectoryHandle(part);
        }

        const files: string[] = [];
        for await (const entry of currentHandle.values()) {
          files.push(entry.name);
        }
        return files;
      },
    };
  }

  throw new Error('No file system API available (need Tauri or FSA support)');
}
