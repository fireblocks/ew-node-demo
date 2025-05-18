import { IStorageProvider } from "@fireblocks/ncw-js-sdk";
import * as fs from "fs/promises";
import * as path from "path";
export class FileSystemStorageProvider implements IStorageProvider {
  private storageDir: string;
  protected prefix: string;

  constructor(storageDir: string) {
    this.storageDir = storageDir;
    this.prefix = "PUBLIC_";
  }

  async get(key: string): Promise<string | null> {
    try {
      const filePath = path.join(this.storageDir, key);
      const data = await fs.readFile(filePath, "utf-8");
      return data;
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async set(key: string, data: string): Promise<void> {
    const filePath = path.join(this.storageDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data, "utf-8");
  }

  async clear(key: string): Promise<void> {
    const filePath = path.join(this.storageDir, key);
    await fs.unlink(filePath).catch(error => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
  }

  async getAllKeys(): Promise<string[]> {
    const files = await fs.readdir(this.storageDir);
    return files;
  }
}

export class FileSystemSecureStorageProvider extends FileSystemStorageProvider {
  constructor(storageDir: string) {
    super(storageDir);
    this.prefix = "SECURE_";
  }
  async getAccess() {
    return async () => {};
  }
}
