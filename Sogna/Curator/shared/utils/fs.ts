import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';

/**
 * ============================================================================
 * FILESYSTEM
 * ============================================================================
 * Esta librería reemplaza a `fs-extra` usando exclusivamente APIs nativas de
 * Node.js (v20+). Garantiza eficiencia, cero dependencias transitivas
 * y control del código.
 */

export const FS = {
  ...fs,
  ...fsPromises,
  // --------------------------------------------------------------------------
  // ASYNC METHODS (Promises) - Preferred
  // --------------------------------------------------------------------------

  /**
   * Crea un directorio de forma recursiva si no existe.
   */
  async ensureDir(targetPath: string): Promise<void> {
    await fsPromises.mkdir(targetPath, { recursive: true });
  },

  /**
   * Elimina archivos o directorios de forma recursiva y forzada.
   */
  async remove(targetPath: string): Promise<void> {
    await fsPromises.rm(targetPath, { recursive: true, force: true });
  },

  /**
   * Copia archivos o directorios de forma recursiva.
   */
  async copy(src: string, dest: string, options: any = {}): Promise<void> {
    await fsPromises.cp(src, dest, { recursive: true, ...options });
  },

  /**
   * Mueve archivos o directorios.
   */
  async move(src: string, dest: string, options: any = {}): Promise<void> {
    if (options.overwrite && await this.pathExists(dest)) {
      await this.remove(dest);
    }
await fsPromises.rename(src, dest);
  },

  /**
   * Lee y parsea un archivo JSON de forma segura.
   */
  async readJson<T = any>(targetPath: string): Promise<T> {
    const data = await fsPromises.readFile(targetPath, 'utf8');
    return JSON.parse(data);
  },

  /**
   * Escribe un objeto como archivo JSON con indentación automática.
   */
  async writeJson(targetPath: string, obj: any, options: number | { spaces?: number } = 2): Promise<void> {
    const spaces = typeof options === 'number' ? options : (options?.spaces ?? 2);
    await fsPromises.writeFile(targetPath, JSON.stringify(obj, null, spaces), 'utf8');
  },

  /**
   * Verifica si un archivo o directorio existe de forma asíncrona.
   */
  async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fsPromises.access(targetPath);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Vacía el contenido de un directorio sin borrar el directorio en sí.
   */
  async emptyDir(targetPath: string): Promise<void> {
    if (await this.pathExists(targetPath)) {
      const entries = await fsPromises.readdir(targetPath);
      for (const entry of entries) {
        await this.remove(path.join(targetPath, entry));
      }
    } else {
      await this.ensureDir(targetPath);
    }
  },

  // --------------------------------------------------------------------------
  // SYNC METHODS (For use in specific blockers or CLI setup)
  // --------------------------------------------------------------------------

  ensureDirSync(targetPath: string): void {
    fs.mkdirSync(targetPath, { recursive: true });
  },

  ensureFileSync(targetPath: string): void {
this.ensureDirSync(path.dirname(targetPath));
    try {
      fs.closeSync(fs.openSync(targetPath, 'a'));
    } catch (e) {
      // Ignorar si ya existe u otro error menor en este punto
    }
  },

  removeSync(targetPath: string): void {
    fs.rmSync(targetPath, { recursive: true, force: true });
  },

  copySync(src: string, dest: string, options: any = {}): void {
    fs.cpSync(src, dest, { recursive: true, ...options });
  },

  moveSync(src: string, dest: string, options: any = {}): void {
    if (options.overwrite && this.pathExistsSync(dest)) {
      this.removeSync(dest);
    }
fs.renameSync(src, dest);
  },

  readJsonSync<T = any>(targetPath: string): T {
    const data = fs.readFileSync(targetPath, 'utf8');
    return JSON.parse(data);
  },

  writeJsonSync(targetPath: string, obj: any, options: number | { spaces?: number } = 2): void {
    const spaces = typeof options === 'number' ? options : (options?.spaces ?? 2);
    fs.writeFileSync(targetPath, JSON.stringify(obj, null, spaces), 'utf8');
  },

  pathExistsSync(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  },

  emptyDirSync(targetPath: string): void {
    if (this.pathExistsSync(targetPath)) {
      const entries = fs.readdirSync(targetPath);
      for (const entry of entries) {
        this.removeSync(path.join(targetPath, entry));
      }
    } else {
      this.ensureDirSync(targetPath);
    }
  }
};
