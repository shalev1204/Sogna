---
name: secure-by-default
description: "Seguridad en codigo y diseno: validacion input, auth authZ, secretos, SQL XSS CSRF, JWT, rate limit, dependencias CVE, PII en logs. Usar en login, APIs, forms, uploads, permisos, tokens, deps audit fallido, datos sensibles, o cuando el Operador pida security review ligero, revisar seguridad, es seguro. Complementa review-security nativa. R5 secretos. Escalar PCI HIPAA a humano experto."
---
# Secure by default

Objetivo: reducir superficie de ataque en codigo nuevo y cambios sensibles aplicando controles estandar en el borde confiable. Seguridad por diseno, no parche posterior. Complementa review-security; no sustituye auditoria formal.

Superficie sensible: auth, input externo, persistencia, red, ficheros, dependencias, logs, multi-tenant.

## Disparadores

| Area | Ejemplos |
|------|----------|
| AuthN/AuthZ | Login, JWT, sesiones, RBAC, API keys |
| Input | Forms, query params, JSON body, uploads |
| Datos | PII, pagos, credenciales, health data |
| Persistencia | SQL, NoSQL, path filesystem |
| Red | SSRF, webhooks salientes, CORS |
| Supply chain | npm audit, pip audit, Dependabot |
| Exposicion | Error messages, logs, responses |

## Principios

1. Minimo privilegio: default deny en authZ.
2. No confiar en cliente: validar en servidor siempre.
3. Secretos fuera codigo y git (R5): env, vault, CI secrets.
4. Defensa profundidad: validacion + encode + CSP + rate limit segun contexto.
5. Fail secure: error no otorga acceso extra.

## Modelo de amenazas rapido

| Pregunta | Si si → control |
|----------|-----------------|
| Input controlado por atacante? | Validacion estricta, allowlist |
| Ejecuta codigo/SQL dinamico? | Parametrizacion, sandbox |
| Muestra datos de otro usuario? | AuthZ por recurso |
| Sale a red usuario-controlled URL? | SSRF blocklist |
| Almacena secretos? | Cifrado reposo, no log |

## Checklist por categoria

### Input y salida

| Control | Detalle |
|---------|---------|
| Validacion | Tipo, longitud, formato, rango; allowlist > denylist |
| SQL | Prepared statements; ORM parametrizado |
| XSS | Context-aware escape (HTML, attr, JS, URL) |
| Path | Canonicalize; no user path en join directo |
| Upload | Tipo MIME real, tamano max, store fuera webroot |
| Deserializacion | No pickle/user JSON a objetos arbitrarios |

### Autenticacion

| Control | Detalle |
|---------|---------|
| Passwords | bcrypt/argon2/scrypt; nunca plain |
| Sesion | HttpOnly, Secure, SameSite; rotacion |
| JWT | Verificar firma, exp, iss, aud; rechazar alg none |
| MFA | Requerir en admin si politica |
| Rate limit | Login, reset password, OTP |

### Autorizacion

| Control | Detalle |
|---------|---------|
| Por recurso | user_id del token vs owner record |
| Por accion | create/read/update/delete explicito |
| Admin | Rol separado; audit log |
| IDOR | No confiar en id sin check ownership |

### Secretos y datos R5

| Control | Detalle |
|---------|---------|
| Repo | .env gitignored; pre-commit si existe |
| Logs | Enmascarar PII, tokens |
| Errores | Generic 500 al cliente |
| Ejemplos | YOUR_API_KEY, REDACTED |

### Dependencias

| Control | Detalle |
|---------|---------|
| Audit | npm audit, pip-audit, osv-scanner |
| Pin | Lockfile committeado |
| CVE | Evaluar severidad; patch o mitigacion documentada |

### HTTP / API

| Control | Detalle |
|---------|---------|
| CORS | Origenes explicitos; no * con credentials |
| CSRF | Token en cookie session |
| Headers | HSTS, CSP, X-Frame-Options segun app |
| HTTPS | Obligatorio prod |

## Protocolo en un cambio

| Paso | Accion |
|------|--------|
| 1 | Clasificar superficie: public, auth, admin, internal |
| 2 | Threat sketch 5 preguntas arriba |
| 3 | Checklist aplicable |
| 4 | Corregir Critical y Major antes entregar |
| 5 | Documentar riesgo residual aceptado |

## Severidades seguridad

| Nivel | Ejemplo | Accion |
|-------|---------|--------|
| Critical | SQLi, RCE, auth bypass | Bloquear merge |
| Major | Missing authZ path, secret in repo | Corregir antes entregar |
| Minor | Header faltante low risk | Backlog |
| Info | Hardening opcional | Documentar |

## Salida obligatoria

```
Superficie evaluada
Threat sketch (breve)
Hallazgos por severidad
Correcciones aplicadas
Riesgo residual
Follow-up recomendado
```

## Integracion

| Skill | Cuando |
|-------|--------|
| api-contract-design | Auth, rate limit, errores |
| code-review | Vista seguridad en PR |
| commit-prepare | Bloquear si secret en diff |
| review-security (nativa) | Escaneo profundo |

## Condiciones de parada

| Situacion | Accion |
|-----------|--------|
| Compliance PCI/HIPAA/SOC2 | Escalar experto humano |
| Vuln activa prod | Fix urgente + aviso Operador |
| 0-day upstream | Mitigacion + pin; monitor advisory |

## Prohibiciones

- eval/exec con input usuario.
- JWT decode sin verify.
- Security through obscurity unica capa.
- Repetir secretos en chat o diff (R5).
- Desactivar CSP/CORS permisivo para cerrar ticket rapido sin analisis.
