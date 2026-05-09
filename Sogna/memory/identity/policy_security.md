# SOGNA - SECURITY POLICY (IMMUNOLOGICAL LAYER)

Esta política define los estándares de seguridad y protocolos de protección del ecosistema Sogna. El cumplimiento es obligatorio para todos los agentes y servicios.

## 1. Protocolo de Auditoría

- **Consulta Obligatoria**: Cualquier lógica relacionada con autenticación, manejo de datos sensibles o acceso a la red DEBE ser consultada con el `@security-auditor`.
- **Sentinel Doctor**: Todas las sesiones deben concluir con una ejecución de `Sentinel Doctor` en los directorios modificados para detectar fugas de datos o vulnerabilidades de AST.
- **Zero-Error Policy**: No se permite el despliegue de código con advertencias de seguridad críticas no justificadas.

## 2. Manejo de Secretos y Credenciales

- **Prohibición de Hardcoding**: Nunca harcodees claves API, tokens o contraseñas en el código fuente.
- **Master Key**: El acceso a la `master_key` está restringido y su uso debe ser logueado en `incident_log.md`.
- **Varlock Integration**: Utiliza el skill `varlock` para la gestión segura de variables de entorno en sesiones locales.

## 3. Integridad de Módulos

- **Nativo Primero**: Prioriza el uso de módulos nativos de Node.js (`node:fs`, `node:path`) sobre librerías de terceros para reducir la superficie de ataque por cadena de suministro.
- **Sanitización**: Todas las entradas de usuario o de red deben ser sanitizadas antes de ser procesadas por motores de ejecución o bases de datos.

## 4. Lexicografía Institucional (Seguridad de Marca)

- **Prohibidos**: "soberano", "soberana", "sovereign", "apex", "supreme", "elite", "ultra", "divine", "maestro", "omnisciente".
- **Tono**: Profesional, técnico y directo. La grandilocuencia se considera un riesgo de integridad institucional.

---

*Referencia: `intelligence/security/intelligence.md`*
