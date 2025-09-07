import { ref, readonly } from 'vue';
import { DESKTOP_CONFIG } from '../config/desktop';
import type { FSNode } from '../types/desktop';

export function useDesktopFileOps() {
  const { PATHS } = DESKTOP_CONFIG;
  const isLoading = ref(false);

  async function createFile(
    fs: any,
    loadDesktopItems: () => Promise<void>
  ): Promise<void> {
    const name = prompt("Enter new file name:");
    if (!name) return;

    isLoading.value = true;
    try {
      const filePath = `${PATHS.DESKTOP}\\${name}`;
      await fs.writeFile(filePath, new ArrayBuffer(0));
      await loadDesktopItems();
    } catch (error) {
      console.error(`Failed to create file '${name}':`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Could not create file.'}`);
    } finally {
      isLoading.value = false;
    }
  }

  async function createDirectory(
    fs: any,
    loadDesktopItems: () => Promise<void>
  ): Promise<void> {
    const name = prompt("Enter new directory name:");
    if (!name) return;

    isLoading.value = true;
    try {
      const dirPath = `${PATHS.DESKTOP}\\${name}`;
      await fs.mkdir(dirPath);
      await loadDesktopItems();
    } catch (error) {
      console.error(`Failed to create directory '${name}':`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Could not create directory.'}`);
    } finally {
      isLoading.value = false;
    }
  }

  function openItem(
    node: FSNode,
    windows: any
  ): void {
    if (node.type === "directory") {
      windows.openApp("File Explorer", {
        type: "component",
        name: "FileExplorer",
        props: { initialPath: node.path }
      });
    } else if (node.type === "symlink") {
      if (node.target === "fileexplorer://") {
        windows.openApp("File Explorer", {
          type: "component",
          name: "FileExplorer",
          props: { initialPath: PATHS.DRIVE + ":\\" }
        });
      } else {
        alert(`Opening symlink: ${node.name} -> ${node.target}`);
      }
    } else {
      alert(`Opening file: ${node.name}`);
    }
  }

  function openFileExplorer(windows: any): void {
    windows.openApp("File Explorer", {
      type: "component",
      name: "FileExplorer",
      props: { initialPath: PATHS.DRIVE + ":\\" }
    });
  }

  function getDisplayName(item: FSNode): string {
    if (item.type === 'symlink' && item.name.endsWith('.lnk')) {
      return item.name.slice(0, -4); // Remove .lnk extension
    }
    return item.name;
  }

  return {
    isLoading: readonly(isLoading),
    createFile,
    createDirectory,
    openItem,
    openFileExplorer,
    getDisplayName
  };
}
