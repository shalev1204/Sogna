# Walkthrough: Integración de git-crypt y Adaptación de Sentinel Veto

Este documento describe las modificaciones realizadas para habilitar la sincronización cifrada de secretos entre su ordenador de sobremesa (Windows) y su portátil (Mac), así como las pruebas que verifican su correcto funcionamiento.

---

## Cambios Realizados

### 1. Configuración de Git en la Raíz
* **[.gitignore](file:///c:/Users/carle/Desktop/Sogna/.gitignore)**: Se comentó la exclusión de los archivos de variables de entorno y claves sensibles (`.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`), permitiendo que Git rastree estos archivos. Se mantuvo la regla para excluir archivos locales específicos (`.env.local` y `.env.*.local`) para evitar que se sincronicen configuraciones propias de cada máquina.
* **[.gitattributes](file:///c:/Users/carle/Desktop/Sogna/.gitattributes)**: Se añadieron las directivas de `filter` y `diff` para delegar el cifrado y descifrado automático de estos secretos a `git-crypt`.

### 2. Blindaje y Paridad en Sentinel Veto
* **[sentinel-veto.js](file:///c:/Users/carle/Desktop/Sogna/Sogna/Sentinel/bin/sentinel-veto.js)**:
  * **Evasión de Falso Positivo**: Se implementó la función `isFileProtectedByGitCrypt(filePath)`, la cual ejecuta `git check-attr filter -- <file>` para comprobar si el archivo sensible está configurado con `git-crypt`.
  * Si el archivo sensible (como `.env`) cuenta con la protección de cifrado activa en Git, Sentinel **autoriza el commit** e informa de ello con un mensaje de canal seguro en la consola, saltándose la regla de "Archivo Prohibido" y evitando el bloqueo.
  * **Corrección de Bug en Git Staging**: Se corrigió el comando `git diff -cached -name-only` a `git diff --cached --name-only` para prevenir el fallo fatal de Git en consolas Windows, y se amplió el filtro para que Sentinel audite de verdad las variables de entorno y archivos de claves en staging.

---

## Resultados de las Pruebas de Verificación

Se realizaron pruebas locales en Windows añadiendo un archivo de variables de entorno sensible de test (`Sogna/.env.test`) que contenía una clave privada ficticia de Anthropic:

1. **Chequeo de Atributos de Git**:
   ```powershell
   git check-attr filter -- Sogna/.env.test
   # Resultado: Sogna/.env.test: filter: git-crypt (OK)
   ```
2. **Validación del Veto de Sentinel**:
   Al correr la vigilancia activa de Sentinel en staging:
   ```powershell
   node Sogna/Sentinel/bin/sentinel-veto.js --staged
   # Resultado:
   # 🛡️  [SENTINEL] Canal seguro verificado: Sogna/.env.test está protegido mediante cifrado de git-crypt.
   # ✅ [CLEAN] Dominio seguro. Sentinel autoriza el acceso. (OK)
   ```
3. **Verificación de Cifrado Real en Git**:
   Se comprobó la versión que Git guarda en su base de datos de objetos preparados para el commit:
   ```powershell
   git show :Sogna/.env.test
   # Resultado: GITCRYPT \u0000... [Datos binarios cifrados e ilegibles] (OK)
   ```
4. **Verificación en Disco Local**:
   En el disco local, el archivo sigue siendo completamente legible en texto plano para el desarrollo local:
   ```powershell
   Get-Content Sogna/.env.test
   # Resultado: # .env.test \n ANTHROPIC_API_KEY=sk-ant-api03-... (OK)
   ```

---

## Guía de Configuración para la Máquina Mac (Destino)

Para que su portátil Mac descifre los archivos automáticamente al hacer `git pull`, siga estos sencillos pasos:

### Paso 1: Copiar la Clave Simétrica al Mac
Copie de manera segura el archivo de clave simétrica que hemos generado y guardado en su perfil de Windows:
* **Ubicación en Windows**: `C:\Users\carle\sogna-git-crypt.key`
* **Destino en el Mac**: Cópielo en una ruta segura fuera del repositorio de Git (por ejemplo, en su carpeta personal del Mac: `/Users/[TuUsuario]/sogna-git-crypt.key`).
* > [!CAUTION]
  > **No añada esta clave al repositorio de Git ni la suba a GitHub.**

### Paso 2: Instalar `git-crypt` en macOS
Abra la aplicación Terminal en su Mac e instale `git-crypt` utilizando Homebrew:
```bash
brew install git-crypt
```

### Paso 3: Desbloquear el Repositorio en el Mac
Navegue al directorio de su proyecto en el Mac y ejecute el comando de desbloqueo apuntando a la ruta donde guardó la clave:
```bash
cd /ruta/a/tu/proyecto/Sogna
git-crypt unlock /Users/[TuUsuario]/sogna-git-crypt.key
```

### Paso 4: ¡Listo!
A partir de este momento:
* Cada vez que haga `git pull` en el Mac, las variables `.env` y claves se descifrarán de forma transparente y automática en su disco.
* Si edita las variables en el Mac y hace un `git commit` y `git push`, se cifrarán automáticamente antes de subirse.
* Al hacer `git pull` en Windows, se descifrarán de forma totalmente transparente.
