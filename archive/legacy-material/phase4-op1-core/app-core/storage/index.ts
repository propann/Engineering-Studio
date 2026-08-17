/**
 * Storage module exports
 * File system abstraction (Tauri + Web FSA)
 */

export {
  forgetDirectoryHandle,
  hasStoredPermission,
  loadDirectoryHandle,
  requestStoredPermission,
  saveDirectoryHandle,
} from './directoryHandleStore';
export { getFileSystem } from './webFileSystem';
export type { IFileSystem } from './webFileSystem';
