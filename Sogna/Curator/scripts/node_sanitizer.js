import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Inicialización de constantes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../'); // Apunta a la raíz de Sogna

console.log("\n🧹 [Sogna Sanitizer] Iniciando purga de ruido en ecosistema node_modules...");

// Directorios objetivo (la raíz)
const targetDirs = [
  path.join(ROOT_DIR, 'node_modules')
];

// Patrones de basura (Case-insensitive)
const patternsToDelete = [
  /^license/i,
  /^readme/i,
  /^changelog/i,
  /^history/i,
  /^contributors/i,
  /^authors/i,
  /^patrons/i,
  /\.md$/i,
  /\.txt$/i,
  /\.yaml$/i,
  /\.yml$/i,
];

// Directorios de idiomas a purgar (redundantes en TypeScript y otros)
const localeDirsToDelete = ['cs', 'de', 'fr', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'tr', 'zh-cn', 'zh-tw'];

// Directorios a ignorar por seguridad
const skipDirs = ['.bin', '.cache', '.vite'];

// Contadores
let deletedCount = 0;
let deletedDirs = 0;
let bytesSaved = 0;

function isMatch(filename) {
  return patternsToDelete.some(regex => regex.test(filename));
}

function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        const stats = fs.statSync(curPath);
        bytesSaved += stats.size;
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
    deletedDirs++;
  }
}

function sanitizeDir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) {
        continue;
      }
      
      // Si es un directorio de idioma basura, lo aniquilamos recursivamente
      if (localeDirsToDelete.includes(entry.name.toLowerCase())) {
        try {
          deleteFolderRecursive(fullPath);
          continue; // No seguir escaneando dentro
        } catch (err) {}
      }

      // Si no es basura, escaneamos dentro
      sanitizeDir(fullPath);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      if (isMatch(entry.name)) {
        try {
          const stats = fs.statSync(fullPath);
          bytesSaved += stats.size;
          fs.unlinkSync(fullPath);
          deletedCount++;
        } catch (err) {}
      }
    }
  }
}

// Ejecutar purga
targetDirs.forEach(dir => sanitizeDir(dir));

const megabytesSaved = (bytesSaved / 1024 / 1024).toFixed(2);
console.log(`✅ [Sogna Sanitizer v2] Purga Avanzada completada con éxito.`);
console.log(`🗑️ Archivos basura eliminados: ${deletedCount}`);
console.log(`📂 Carpetas de idiomas (Locales) eliminadas: ${deletedDirs}`);
console.log(`💾 Espacio real recuperado: ${megabytesSaved} MB\n`);
