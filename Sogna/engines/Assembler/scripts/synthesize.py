import os
import re
import sys
import subprocess

def extract_tokens(master_path):
    """Extrae los tokens de diseño (variables CSS) de MASTER.md."""
    tokens = {}
    if not os.path.exists(master_path):
        print(f"WARNING: {master_path} no encontrado.")
        return tokens

    with open(master_path, 'r', encoding='utf-8') as f:
        content = f.read()
        # Buscar variables CSS como --color-primary: #hex;
        css_vars = re.findall(r'(--[\w-]+):\s*([^;]+);', content)
        for var, val in css_vars:
            # Convertir a formato amigable para templates (e.g., SOGNA_COLOR_PRIMARY)
            key = var.replace('--', 'SOGNA_').replace('-', '_').upper()
            tokens[key] = val.strip()
    
    return tokens

def run_guardian(target_path):
    """Ejecuta el motor Guardian para validar la calidad del código sintetizado."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
    guardian_path = os.path.join(base_dir, "toolkit/engines/Stylist/scripts/guardian.py")
    
    if not os.path.exists(guardian_path):
        print(f"WARNING: Guardian no encontrado en {guardian_path}. Saltando validación.")
        return

    print(f"\n[Guardian] Iniciando auditoría de calidad en: {target_path}...")
    try:
        # Ejecutar guardian.py sobre el directorio de salida
        result = subprocess.run([sys.executable, guardian_path, target_path], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"[Guardian Error] {result.stderr}")
    except Exception as e:
        print(f"[Guardian Failed] Error al ejecutar: {e}")

def process_template(template_name, template_dir, output_dir, tokens_re, tokens):
    template_path = os.path.join(template_dir, template_name)
    output_path = os.path.join(output_dir, template_name)

    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # regex-based token replacement
        content = tokens_re.sub(lambda m: tokens.get(m.group(1), m.group(0)), content)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"[OK] Sintetizado: {template_name}"
    except Exception as e:
        return f"[ERROR] {template_name}: {e}"

def synthesize():
    """Ejecuta la síntesis de componentes con optimización paralela."""
    from concurrent.futures import ThreadPoolExecutor
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
    master_path = os.path.join(base_dir, "memory/designs/MASTER.md")
    template_dir = os.path.join(base_dir, "toolkit/engines/Assembler/templates")
    output_dir = os.path.join(base_dir, "src/components/sogna")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"--- [OPTIMIZED] Iniciando Síntesis Sogna (Assembler) ---")
    tokens = extract_tokens(master_path)
    
    # Pre-compile regex for tokens
    if tokens:
        pattern = '|'.join([r'\{\{(' + re.escape(key) + r')\}\}' for key in tokens.keys()])
        tokens_re = re.compile(pattern)
    else:
        tokens_re = re.compile(r'\{\{(.*?)\}\}')

    templates = [t for t in os.listdir(template_dir) if t.endswith(('.tsx', '.ts'))]
    
    with ThreadPoolExecutor() as executor:
        results = list(executor.map(
            lambda t: process_template(t, template_dir, output_dir, tokens_re, tokens), 
            templates
        ))
    
    for res in results:
        print(res)

    # Ejecutar validación independiente
    run_guardian(output_dir)

    print(f"--- Síntesis Completada ---")

if __name__ == "__main__":
    synthesize()
