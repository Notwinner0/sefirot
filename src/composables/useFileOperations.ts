import { ref, computed } from 'vue';
import { useWindowsFS } from './useFS';
import { useEventBus } from './useEventBus';

export interface FileOperationResult {
  success: boolean;
  error?: string;
}

export function useFileOperations() {
  const fs = useWindowsFS();
  const eventBus = useEventBus();
  const isLoading = ref(false);

  const createFile = async (path: string, name: string): Promise<FileOperationResult> => {
    if (!name.trim()) {
      return { success: false, error: 'File name cannot be empty' };
    }

    isLoading.value = true;
    try {
      const filePath = `${path}\\${name}`;
      await fs.writeFile(filePath, new ArrayBuffer(0));

      // Emit desktop refresh if creating on desktop
      if (path === 'C:\\System\\Desktop') {
        eventBus.emit('desktop-refresh');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create file'
      };
    } finally {
      isLoading.value = false;
    }
  };

  const createDirectory = async (path: string, name: string): Promise<FileOperationResult> => {
    if (!name.trim()) {
      return { success: false, error: 'Directory name cannot be empty' };
    }

    isLoading.value = true;
    try {
      const dirPath = `${path}\\${name}`;
      await fs.mkdir(dirPath);

      // Emit desktop refresh if creating on desktop
      if (path === 'C:\\System\\Desktop') {
        eventBus.emit('desktop-refresh');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create directory'
      };
    } finally {
      isLoading.value = false;
    }
  };

  const deleteItems = async (paths: string[]): Promise<FileOperationResult> => {
    if (paths.length === 0) return { success: true };

    isLoading.value = true;
    try {
      for (const path of paths) {
        const node = await fs.stat(path);
        if (!node) continue;

        if (node.type === 'directory') {
          await fs.rmdir(path, true);
        } else {
          await fs.rm(path);
        }
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete items'
      };
    } finally {
      isLoading.value = false;
    }
  };

  const renameItem = async (oldPath: string, newName: string): Promise<FileOperationResult> => {
    if (!newName.trim()) {
      return { success: false, error: 'New name cannot be empty' };
    }

    isLoading.value = true;
    try {
      const pathParts = oldPath.split('\\');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('\\');

      await fs.move(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rename item'
      };
    } finally {
      isLoading.value = false;
    }
  };

  const copyItems = async (
    sourcePaths: string[],
    destinationPath: string,
    isMove = false
  ): Promise<FileOperationResult> => {
    if (sourcePaths.length === 0) return { success: true };

    isLoading.value = true;
    try {
      for (const sourcePath of sourcePaths) {
        const node = await fs.stat(sourcePath);
        if (!node) continue;

        const fileName = isMove ? node.name : `${node.name} - Copy`;
        const destPath = `${destinationPath}\\${fileName}`;

        if (isMove) {
          await fs.move(sourcePath, destPath);
        } else {
          await fs.copy(sourcePath, destPath);
        }
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to copy/move items'
      };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading: computed(() => isLoading.value),
    createFile,
    createDirectory,
    deleteItems,
    renameItem,
    copyItems
  };
}
