/**
 * Web File System Access API wrapper
 * For managing workspace folders and creating directory structures
 */

export interface WorkspaceFolderStructure {
  op1?: {
    keyboard: string;
    firmware: string;
    content: string;
    mods: string;
    backups: string;
  };
  ep133?: {
    clone: string;
    samples: string;
    library: string;
    projects: string;
    exercises: string;
  };
  shared: string;
}

/**
 * Request user to pick a workspace directory
 */
export async function pickWorkspaceFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });
    return dirHandle;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('📁 User cancelled folder selection');
      return null;
    }
    console.error('❌ Error picking folder:', error);
    return null;
  }
}

/**
 * Create folder structure for OP-1
 */
async function createOP1Structure(
  workspaceHandle: FileSystemDirectoryHandle,
): Promise<WorkspaceFolderStructure['op1']> {
  const op1Handle = await getOrCreateFolder(workspaceHandle, 'op1');

  return {
    keyboard: (await getOrCreateFolder(op1Handle, 'keyboard')).name,
    firmware: (await getOrCreateFolder(op1Handle, 'firmware')).name,
    content: (await getOrCreateFolder(op1Handle, 'content')).name,
    mods: (await getOrCreateFolder(op1Handle, 'mods')).name,
    backups: (await getOrCreateFolder(op1Handle, 'backups')).name,
  };
}

/**
 * Create folder structure for EP-133
 */
async function createEP133Structure(
  workspaceHandle: FileSystemDirectoryHandle,
): Promise<WorkspaceFolderStructure['ep133']> {
  const ep133Handle = await getOrCreateFolder(workspaceHandle, 'ep133');

  return {
    clone: (await getOrCreateFolder(ep133Handle, 'clone')).name,
    samples: (await getOrCreateFolder(ep133Handle, 'samples')).name,
    library: (await getOrCreateFolder(ep133Handle, 'library')).name,
    projects: (await getOrCreateFolder(ep133Handle, 'projects')).name,
    exercises: (await getOrCreateFolder(ep133Handle, 'exercises')).name,
  };
}

/**
 * Create full workspace structure based on enabled machines
 */
export async function createWorkspaceStructure(
  workspaceHandle: FileSystemDirectoryHandle,
  enableOP1: boolean,
  enableEP133: boolean,
): Promise<WorkspaceFolderStructure> {
  const structure: WorkspaceFolderStructure = {
    shared: (await getOrCreateFolder(workspaceHandle, 'shared')).name,
  };

  if (enableOP1) {
    structure.op1 = await createOP1Structure(workspaceHandle);
  }

  if (enableEP133) {
    structure.ep133 = await createEP133Structure(workspaceHandle);
  }

  return structure;
}

/**
 * Get or create a subfolder
 */
async function getOrCreateFolder(
  parentHandle: FileSystemDirectoryHandle,
  folderName: string,
): Promise<FileSystemDirectoryHandle> {
  try {
    return await parentHandle.getDirectoryHandle(folderName, { create: true });
  } catch (error) {
    console.error(`❌ Error creating/accessing ${folderName}:`, error);
    throw error;
  }
}

/**
 * Check if File System Access API is available
 */
export function isFileSystemAccessAvailable(): boolean {
  return typeof (window as any).showDirectoryPicker === 'function';
}
