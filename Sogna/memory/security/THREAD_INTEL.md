# 🛡️ Sogna Threat Intelligence

Este es el registro evolutivo de amenazas detectadas y neutralizadas por el motor **Sentinel**.

## Histórico de Entrenamiento

### Fase 1: Fundamentos (Rondas 1-4)

- **T001 (DLP)**: Prevención de secretos hardcodeados (Regex).
- **T002 (Injection)**: Detección de `exec` con entradas de usuario.
- **T003 (SCA)**: Auditoría contra la base de datos de OSV.
- **T004 (Obfuscation)**: Detección de backdoors con `eval` ofuscado.

### Fase 2: Alta Hostilidad (Rondas 5-8)

- **T005 (Entropy)**: Identificación de fragmentos de llaves en cadenas de alta entropía.
- **T006 (IDOR Check)**: Auditoría de lógica de negocio en endpoints de Express (Ownership).
- **T007 (SCA Confusion)**: Bloqueo de versiones específicas comprometidas de librerías comunes.
- **T008 (Adversarial AI)**: Detección de acceso dinámico a miembros prohibidos para bypass de seguridad.

### Fase 3: Nivel Hacker Externo (Rondas 9-12)

- **T009 (Dependency Confusion)**: Neutralizado mediante la política de **Trusted Scopes** (@sogna).
- **T010 (Logic Bomb)**: Detectado por análisis de flujo temporal (Date.now()).
- **T011 (Prototype Pollution)**: Bloqueado por auditoría de estructura de bucles for...in inseguros.
- **T012 (Exfiltration)**: Neutralizado por el **Firewall AST** (Lista Blanca de Dominios).

---
*Sogna es ahora un ecosistema soberano con defensa inmunológica proactiva.*