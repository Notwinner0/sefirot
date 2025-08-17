import { openDB } from "idb";

// --- Type Definitions ---

// Define attributes for a file or directory, similar to Windows.
interface FSAttributes {
  readOnly: boolean;
  hidden: boolean;
}

// Define the structure for a file system entry (node).
interface FSNode {
  path: string; // Full, normalized path, e.g., C:\USERS\PUBLIC\FILE.TXT
  parent: string; // Parent directory path, e.g., C:\USERS\PUBLIC
  name: string; // The actual name, e.g., FILE.TXT
  type: "file" | "directory";
  createdAt: Date;
  modifiedAt: Date;
  attributes: FSAttributes;
  content?: ArrayBuffer; // Content is only for files
}

// --- Database Setup ---
// The database is upgraded to version 3 for the new Windows-like features.
const dbPromise = openDB("pseudo-os-fs-v3-windows", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("nodes")) {
      const store = db.createObjectStore("nodes", { keyPath: "path" });
      store.createIndex("by-parent", "parent");
    }
  },
});

/**
 * A hook providing a robust, Windows-like Virtual File System API.
 *
 * Features include:
 * - Drive letters (e.g., C:)
 * - Case-insensitive paths with '\' as the separator.
 * - File attributes (readOnly, hidden).
 * - Core operations: move, copy, read, write, delete.
 */
export function useWindowsFS() {
  /**
   * Initializes a drive if it doesn't exist (e.g., 'C:').
   * @param driveLetter - The letter of the drive to initialize.
   */
  async function initializeDrive(driveLetter: string) {
    const drivePath = `${driveLetter.toUpperCase()}:\\`;
    const db = await dbPromise;
    const existing = await db.get("nodes", drivePath);
    if (!existing) {
      await mkdir(drivePath);
    }
  }

  /**
   * Checks if a file or directory exists at a given path.
   * @param path - The path to check.
   * @returns True if the path exists, false otherwise.
   */
  async function exists(path: string): Promise<boolean> {
    const db = await dbPromise;
    const normalizedPath = normalizePath(path);
    const entry = await db.get("nodes", normalizedPath);
    return !!entry;
  }

  /**
   * Writes content to a specified file path.
   * Throws an error if the parent directory does not exist.
   * @param path - The full path of the file.
   * @param content - The content (ArrayBuffer) to write.
   */
  async function writeFile(path: string, content: ArrayBuffer) {
    const db = await dbPromise;
    const now = new Date();
    const { normalizedPath, parentPath, name } = parsePath(path);

    const parent = await db.get("nodes", parentPath);
    if (!parent || parent.type !== "directory") {
      throw new Error(`Parent directory '${parentPath}' does not exist.`);
    }

    const existing = (await db.get("nodes", normalizedPath)) as FSNode | undefined;
    const entry: FSNode = {
      path: normalizedPath,
      parent: parentPath,
      name,
      type: "file",
      content,
      createdAt: existing?.createdAt || now,
      modifiedAt: now,
      attributes: existing?.attributes || { readOnly: false, hidden: false },
    };

    await db.put("nodes", entry);
  }

  /**
   * Reads the content of a file.
   * @param path - The path of the file to read.
   * @returns The content of the file or undefined if not found.
   */
  async function readFile(path: string): Promise<ArrayBuffer | undefined> {
    const db = await dbPromise;
    const normalizedPath = normalizePath(path);
    const entry = (await db.get("nodes", normalizedPath)) as FSNode | undefined;
    return entry && entry.type === "file" ? entry.content : undefined;
  }

  /**
   * Creates a directory at the specified path.
   * @param path - The path of the directory to create.
   */
  async function mkdir(path: string) {
    const db = await dbPromise;
    const now = new Date();
    const { normalizedPath, parentPath, name } = parsePath(path);

    if (await exists(normalizedPath)) {
      throw new Error(`Path '${normalizedPath}' already exists.`);
    }

    // For non-root directories, ensure the parent exists.
    if (name !== "" && parentPath !== "") {
        const parent = await db.get("nodes", parentPath);
        if (!parent || parent.type !== "directory") {
            throw new Error(`Parent directory '${parentPath}' does not exist.`);
        }
    }

    const entry: FSNode = {
      path: normalizedPath,
      parent: parentPath,
      name,
      type: "directory",
      createdAt: now,
      modifiedAt: now,
      attributes: { readOnly: false, hidden: false },
    };
    await db.put("nodes", entry);
  }

  /**
   * Lists the contents of a given directory path.
   * @param path - The path of the directory to read.
   * @returns An array of FSNode objects.
   */
  async function readdir(path: string): Promise<FSNode[]> {
    const db = await dbPromise;
    const normalizedPath = normalizePath(path);
    return db.getAllFromIndex("nodes", "by-parent", normalizedPath);
  }

  /**
   * Deletes a file.
   * @param path - The path of the file to delete.
   */
  async function rm(path: string) {
    const db = await dbPromise;
    const normalizedPath = normalizePath(path);
    const entry = await db.get("nodes", normalizedPath);
    if (!entry || entry.type !== "file") {
      throw new Error(`'${path}' is not a file or does not exist.`);
    }
    await db.delete("nodes", normalizedPath);
  }

  /**
   * Deletes a directory, with an option for recursive deletion.
   * @param path - The path of the directory to delete.
   * @param recursive - If true, deletes all contents. Defaults to false.
   */
  async function rmdir(path: string, recursive = false) {
    const db = await dbPromise;
    const normalizedPath = normalizePath(path);
    const children = await readdir(normalizedPath);

    if (children.length > 0 && !recursive) {
      throw new Error(`Directory '${normalizedPath}' is not empty.`);
    }

    for (const child of children) {
      if (child.type === "directory") {
        await rmdir(child.path, true);
      } else {
        await rm(child.path);
      }
    }
    await db.delete("nodes", normalizedPath);
  }

  /**
   * Moves a file or directory from a source to a destination.
   * @param sourcePath - The original path.
   * @param destPath - The new path.
   */
  async function move(sourcePath: string, destPath: string) {
    const db = await dbPromise;
    const { normalizedPath: normSource } = parsePath(sourcePath);
    const { normalizedPath: normDest, parentPath: destParent, name: destName } = parsePath(destPath);
    
    const sourceNode = await db.get("nodes", normSource) as FSNode;
    if (!sourceNode) throw new Error("Source path does not exist.");
    if (await exists(normDest)) throw new Error("Destination path already exists.");

    // Update the node itself
    const tx = db.transaction("nodes", "readwrite");
    const now = new Date();

    // Delete the old entry first
    await tx.store.delete(normSource);

    // Create the new entry
    sourceNode.path = normDest;
    sourceNode.parent = destParent;
    sourceNode.name = destName;
    sourceNode.modifiedAt = now;
    await tx.store.put(sourceNode);

    // If it's a directory, move all children recursively
    if (sourceNode.type === "directory") {
        const allNodes = await db.getAll("nodes");
        for (const node of allNodes) {
            if (node.path.startsWith(normSource + '\\')) {
                const newPath = node.path.replace(normSource, normDest);
                const { parentPath } = parsePath(newPath);
                await tx.store.delete(node.path); // Delete old child
                node.path = newPath;
                node.parent = parentPath;
                await tx.store.put(node); // Add new child
            }
        }
    }
    await tx.done;
  }

  /**
   * Copies a file or directory recursively.
   * @param sourcePath - The path of the item to copy.
   * @param destPath - The path of the new copy.
   */
  async function copy(sourcePath: string, destPath: string) {
      const db = await dbPromise;
      const { normalizedPath: normSource } = parsePath(sourcePath);
      const { normalizedPath: normDest } = parsePath(destPath);

      const sourceNode = await db.get("nodes", normSource) as FSNode;
      if (!sourceNode) throw new Error("Source path does not exist.");
      if (await exists(normDest)) throw new Error("Destination path already exists.");

      if (sourceNode.type === 'file') {
          if (sourceNode.content) {
              await writeFile(normDest, sourceNode.content);
          }
      } else { // It's a directory
          await mkdir(normDest);
          const children = await readdir(normSource);
          for (const child of children) {
              const newDest = `${normDest}\\${child.name}`;
              await copy(child.path, newDest);
          }
      }
  }

  return { initializeDrive, exists, writeFile, readFile, mkdir, readdir, rm, rmdir, move, copy };
}

// --- Helper Functions ---

/**
 * Normalizes a path to be consistent (uppercase, backslashes, default drive).
 * @param path - The path string to normalize.
 * @returns A fully qualified, normalized path string.
 */
function normalizePath(path: string): string {
  let p = path.replace(/\//g, "\\"); // Use backslashes
  if (!/^[a-zA-Z]:\\/.test(p)) {
    p = "C:\\" + p.replace(/^\\+/, ""); // Default to C: drive
  }
  return p.toUpperCase(); // Case-insensitive
}

/**
 * Parses a full path into its constituent parts.
 * @param path - The path string to parse.
 * @returns An object with normalizedPath, parentPath, and name.
 */
function parsePath(path: string) {
  const normalizedPath = normalizePath(path);
  const lastSlashIndex = normalizedPath.lastIndexOf("\\");

  if (lastSlashIndex === -1 || lastSlashIndex === normalizedPath.length - 1) {
    // This is likely a root path like C:\
    return { normalizedPath, parentPath: "", name: "" };
  }

  const parentPath = normalizedPath.substring(0, lastSlashIndex);
  const name = normalizedPath.substring(lastSlashIndex + 1);

  // If parent is just 'C:', it should be 'C:\'
  return {
    normalizedPath,
    parentPath: parentPath.endsWith(":") ? parentPath + '\\' : parentPath,
    name,
  };
}
