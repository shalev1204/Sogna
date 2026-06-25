import os
import re
from pathlib import Path

def purify_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    for i, line in enumerate(lines):
# 1. Normalizar espacios en marcadores de lista (*, -, 1.)
# Busca marcadores al inicio de línea con múltiples espacios
        line = re.sub(r'^(\s*[*+-]|\s*\d+\.)\s{2,}', r'\1 ', line)
        
# 2. Asegurar líneas en blanco alrededor de encabezados
        if re.match(r'^#{1,6}\s', line):
            if new_lines and new_lines[-1].strip() != "":
                new_lines.append("\n")
            new_lines.append(line)
            if i + 1 < len(lines) and lines[i+1].strip() != "":
                new_lines.append("\n")
            continue

# 3. Asegurar líneas en blanco alrededor de listas
        is_list = re.match(r'^(\s*[*+-]|\s*\d+\.)\s', line)
        if is_list:
            if new_lines and not re.match(r'^(\s*[*+-]|\s*\d+\.)\s', new_lines[-1]) and new_lines[-1].strip() != "":
                new_lines.append("\n")
            new_lines.append(line)
            if i + 1 < len(lines) and not re.match(r'^(\s*[*+-]|\s*\d+\.)\s', lines[i+1]) and lines[i+1].strip() != "":
                new_lines.append("\n")
            continue

        new_lines.append(line)

# 4. Eliminar líneas en blanco consecutivas (MD012)
    content = "".join(new_lines)
    content = re.sub(r'\n{3,}', '\n\n', content)
    
# 5. Asegurar H1 al principio si no existe (Opcional, pero recomendado por MD041)
# Por ahora solo limpiamos lo existente para no alterar el contenido semántico.

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + "\n")
    print(f"[v] Purificado: {file_path}")

def main():
    import argparse
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    
    parser = argparse.ArgumentParser(description="Purificador Global de Markdown Sogna")
    parser.add_argument("--files", nargs="+", help="Archivos específicos para purificar")
    parser.add_argument("--root", default=default_root, help="Directorio raíz para escaneo")
    
    args = parser.parse_args()
    
    if args.files:
        print(f"[*] Purificando {len(args.files)} archivos específicos...")
        for file in args.files:
            try:
                purify_markdown(Path(file))
            except Exception as e:
                print(f"[!] Error en {file}: {e}")
        return

    root_dir = Path(args.root)
    exclude = {"node_modules", ".git", "legacy", "dist", "build"}
    
    print(f"[*] Iniciando Purga Global de Markdown en {root_dir}...")
    
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in exclude]
        for file in files:
            if file.endswith(".md"):
                full_path = Path(root) / file
                try:
                    purify_markdown(full_path)
                except Exception as e:
                    print(f"[!] Error purificando {full_path}: {e}")

if __name__ == "__main__":
    main()
