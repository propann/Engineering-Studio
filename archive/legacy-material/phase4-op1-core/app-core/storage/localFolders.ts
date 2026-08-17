/** Contrat minimal partagé par la persistance IndexedDB et le File System Access API. */
export interface LocalDirectoryHandle {
  name: string;
  values(): AsyncIterableIterator<LocalFileHandle | LocalDirectoryHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LocalDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>;
  removeEntry?(name: string, options?: { recursive?: boolean }): Promise<void>;
}

interface LocalFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string | Blob | ArrayBuffer): Promise<void>; close(): Promise<void> }>;
}
