# protocolo de gobernanza de markdown: estándares sogna

este documento establece las reglas estrictas de formato para todos los archivos `.md` generados en el ecosistema sogna. antigravity debe consultar y seguir estas reglas para evitar advertencias del linter y mantener la excelencia visual.

## 📏 reglas de estructura (obligatorias)

### 1. espaciado de encabezados (md022)

* todos los encabezados (h1, h2, h3, etc.) **deben** estar rodeados por exactamente una línea en blanco arriba y una línea en blanco abajo.

### 2. espaciado de listas (md030, md032)

* las listas **deben** estar rodeadas por líneas en blanco.
* **importante**: tras el marcador de lista (`*`, `-` o `1.`), debe haber **exactamente un espacio**. nunca uses más de uno.

### 3. jerarquía (md001, md041)

* el documento debe comenzar siempre con un encabezado de nivel 1 (`#`).
* los niveles de encabezado no deben saltarse (ej: no pasar de h1 a h3 sin un h2 intermedio).

### 4. líneas en blanco consecutivas (md012)

* no se permiten múltiples líneas en blanco consecutivas. usa solo una para separar bloques de contenido.

## 🛠️ protocolo de aplicación para antigravity

1. **fase de lectura**: antes de crear o editar un archivo markdown, antigravity verificará este protocolo.
2. **fase de validación**: tras escribir el contenido, se realizará un escaneo mental de los marcadores de lista y líneas en blanco.
3. **corrección proactiva**: si el linter detecta un fallo, la corrección debe ser inmediata y total, no parcial.

---

*documento de cumplimiento obligatorio para la optimización al 100%.*
