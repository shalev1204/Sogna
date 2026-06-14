import sys
import re
import json
import os

class IdentitySentinel:
    def __init__(self):
        self.forbidden_words = [
            'independent', 'apex', 'supreme', 'elite'
        ]
        self.required_address = 'usted'
        self.forbidden_address = 'tú'
        self.errors = []

    def audit_text(self, text):
        """
        Audita un bloque de texto buscando desviaciones identitarias.
        """
        # 1. Verificar léxico prohibido
        for word in self.forbidden_words:
            if re.search(rf'\b{word}\b', text, re.IGNORECASE):
                self.errors.append(f"VIOLACIÓN_LÉXICA: Uso del término prohibido '{word}'.")

        # 2. Verificar tratamiento informal
        if re.search(rf'\b{self.forbidden_address}\b', text, re.IGNORECASE):
            self.errors.append("VIOLACIÓN_JERÁRQUICA: Uso de 'tú' detectado. El Operador requiere tratamiento de 'usted'.")

        # 3. Verificar tono (Heurística simple: exceso de adjetivos)
        adjectives = ['maravilloso', 'increíble', 'espectacular', 'fantástico']
        for adj in adjectives:
            if adj in text.lower():
                self.errors.append(f"VIOLACIÓN_DE_TONO: Adjetivo grandilocuente detectado '{adj}'. Mantenga el tono industrial.")

        return len(self.errors) == 0

    def report(self):
        if not self.errors:
            print("✅ IDENTIDAD_CONFIRMADA: Cumplimiento total de protocolos Sogna.")
            return 0
        else:
            print("❌ FALLO_DE_INTEGRIDAD_IDENTITARIA:")
            for err in self.errors:
                print(f"  - {err}")
            return 1

if __name__ == "__main__":
    # Forzar salida en UTF-8 para evitar errores en terminales Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    
    sentinel = IdentitySentinel()
    
    # Si se pasa un archivo como argumento, auditarlo
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                sentinel.audit_text(content)
    
    sys.exit(sentinel.report())
