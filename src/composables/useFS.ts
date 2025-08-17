import { openDB } from "idb";

const dbPromise = openDB("pseudo-os-fs", 1, {
  upgrade(db) {
    db.createObjectStore("files");
  }
});

export function useFS() {
  async function writeFile(path: string, content: string) {
    const db = await dbPromise;
    await db.put("files", content, path);
  }

  async function readFile(path: string) {
    const db = await dbPromise;
    return db.get("files", path);
  }

  async function readdir(prefix: string) {
    const db = await dbPromise;
    const tx = db.transaction("files");
    const store = tx.store;
    const keys: string[] = [];
    let cursor = await store.openCursor();
    while (cursor) {
      if ((cursor.key as string).startsWith(prefix)) {
        keys.push(cursor.key as string);
      }
      cursor = await cursor.continue();
    }
    return keys;
  }

  return { writeFile, readFile, readdir };
}
