import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import dotenv from 'dotenv';

export class ProjectManager {
  private currentDir: string;

  constructor(dir: string = process.cwd()) {
    this.currentDir = dir;
    dotenv.config();
  }

  /**
   * Inicializa un nuevo proyecto Loki clonando el motor actual.
   */
  async initProject(targetName: string) {
    const targetPath = path.resolve(this.currentDir, targetName);

    if (fs.existsSync(targetPath)) {
      throw new Error(`La carpeta ${targetName} ya existe.`);
    }

    console.log(chalk.blue(`\n🚀 Inicializando nuevo ecosistema Loki en: ${targetPath}`));

    // 1. Crear estructura básica
    await fs.ensureDir(targetPath);

    // 2. Definir qué copiar (Opción B: Clonación Total)
    const itemsToCopy = [
      'src',
      'package.json',
      'tsconfig.json',
      'README.md',
      'GUIDE.md',
      '.gitignore'
    ];

    for (const item of itemsToCopy) {
      const source = path.join(this.currentDir, item);
      const dest = path.join(targetPath, item);
      if (fs.existsSync(source)) {
        await fs.copy(source, dest);
        console.log(chalk.dim(`   + Copiado: ${item}`));
      }
    }

    // 3. Crear carpeta de configuración de usuario inicial si no existe
    const resourcesSource = path.join(this.currentDir, 'resources');
    const resourcesDest = path.join(targetPath, 'resources');
    await fs.copy(resourcesSource, resourcesDest);

    // 4. Crear metadatos del proyecto
    const lokiMeta = path.join(targetPath, '.loki');
    await fs.ensureDir(lokiMeta);
    await fs.writeFile(
      path.join(lokiMeta, 'master_path'),
      this.currentDir
    );

    console.log(chalk.green(`\n✔ Proyecto ${targetName} creado con éxito.`));
    console.log(`Próximos pasos:\n1. cd ${targetName}\n2. npm install\n3. npm run start -- setup\n`);
  }

  /**
   * Actualiza el núcleo del proyecto actual desde el maestro.
   */
  async upgrade() {
    const masterPath = process.env.LOKI_MASTER_PATH;
    if (!masterPath || !fs.existsSync(masterPath)) {
      throw new Error('No se ha definido LOKI_MASTER_PATH en el .env o la ruta no existe.');
    }

    console.log(chalk.blue(`\n🔄 Sincronizando con el "Loki Maestro": ${masterPath}`));

    // 1. Crear Backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.currentDir, '.loki', 'backups', timestamp);
    await fs.ensureDir(backupDir);

    console.log(chalk.yellow(`\n📦 Creando backup de seguridad en: .loki/backups/${timestamp}`));
    await fs.copy(path.join(this.currentDir, 'src'), path.join(backupDir, 'src'));
    await fs.copy(path.join(this.currentDir, 'package.json'), path.join(backupDir, 'package.json'));

    // 2. Intentar Backup en la Nube (Git)
    try {
      if (fs.existsSync(path.join(this.currentDir, '.git'))) {
        console.log(chalk.dim('   ☁ Subiendo backup a la nube (Git)...'));
        await execa('git', ['add', '.loki/backups/'], { cwd: this.currentDir });
        await execa('git', ['commit', '-m', `Backup pre-upgrade: ${timestamp}`], { cwd: this.currentDir });
        await execa('git', ['push'], { cwd: this.currentDir });
        console.log(chalk.green('   ✔ Backup en la nube completado.'));
      }
    } catch (e) {
      console.log(chalk.red('   ⚠ Falló el backup en la nube (Git), pero el backup local es seguro.'));
    }

    // 3. Ejecutar Actualización (Sobrescribir Core)
    const coreItems = ['src', 'package.json', 'tsconfig.json'];
    for (const item of coreItems) {
      const source = path.join(masterPath, item);
      const dest = path.join(this.currentDir, item);
      if (fs.existsSync(source)) {
        await fs.copy(source, dest, { overwrite: true });
        console.log(chalk.dim(`   ⚡ Sincronizado: ${item}`));
      }
    }

    console.log(chalk.green('\n✔ Actualización del motor completada con éxito.'));
    console.log(chalk.bold('Recuerda ejecutar `npm install` si han cambiado las dependencias.\n'));
  }
}
