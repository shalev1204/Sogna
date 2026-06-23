---
name: technical-docs
description: "Documentacion tecnica util y verificada: README, ADR, docstrings en APIs exportadas, guias setup y changelogs de comportamiento publico. Usar en onboarding incompleto, API/CLI consumida por otros, decision arquitectonica a registrar, cambio breaking a documentar, o cuando el Operador pida documentar, README, ADR, como arranco. Proporcionalidad R7: no docs no pedidas. Ejecutar comandos documentados antes de entregar."
---
# Technical docs

Objetivo: cerrar huecos que impiden instalar, operar o extender el software sin friccion. Documentacion viva, verificada y proporcional; no volumen por volumen.

Documentacion buena responde: que es, como arranco, como verifico, que decisiones importan, que cambio rompe compatibilidad.

## Disparadores

| Necesidad | Entregable |
|-----------|------------|
| Onboarding | README raiz o paquete |
| API publica | Referencia endpoints, CLI flags, ejemplos |
| Decision estructural | ADR |
| Cambio comportamiento | Changelog, migration guide |
| Modulo complejo | Docstring/JSDoc en exports |

## Exclusiones

| Situacion | Razon |
|-----------|-------|
| Codigo autoexplicativo | Comentarios linea a linea (R1) |
| Docs no solicitadas | R7 proporcionalidad |
| Duplicar autogenerado | Enlazar OpenAPI, typedoc |
| Repetir CLAUDE.md entero | Enlace + delta |

## Principios

1. Audiencia explicita: contribuidor repo vs consumidor API vs Operador.
2. Accion antes teoria: install, run, test en primeras secciones.
3. Verificacion: todo comando copy-paste ejecutado o marcado no probado en este entorno.
4. Mismo PR que codigo cuando el cambio es breaking o publico.
5. Idioma del proyecto; override Capa 2 si CLAUDE.md lo fija (R6).

## Tipos de documento

### README (repo o paquete)

| Seccion | Contenido minimo |
|---------|------------------|
| Titulo + badges opcionales | Que es en una frase |
| Requisitos | Runtime, versiones, OS |
| Instalacion | Pasos copy-paste |
| Uso | Ejemplo minimo funcional |
| Desarrollo | dev, check, test, lint |
| Estructura | Solo si no obvia |
| Enlaces | Docs profundas, ADRs |

### ADR (Architecture Decision Record)

| Campo | Contenido |
|-------|-----------|
| Titulo | ADR-NNN: decision en imperativo |
| Estado | propuesto, aceptado, obsoleto, sustituido por ADR-XXX |
| Contexto | Problema y fuerzas |
| Decision | Que se elige |
| Consecuencias | Positivas y negativas |
| Alternativas | Descartadas y por que |

ADR valido registra decision real con trade-off; no para obviedades.

### Docstrings / JSDoc

| Export | Documentar |
|--------|------------|
| Funcion publica | Proposito, params no obvios, return, throws |
| Tipo complejo | Invariantes, unidades |
| Clase | Responsabilidad una frase |

No repetir nombre parametro como unica descripcion.

### Changelog / migration

| Cambio | Documentar |
|--------|------------|
| Breaking | Antes/despues, codigo migracion |
| Deprecation | Fecha sunset, reemplazo |
| Feature | Comportamiento nuevo |

## Protocolo

| Paso | Accion |
|------|--------|
| 1 | Identificar pregunta sin respuesta hoy |
| 2 | Elegir tipo (README patch, ADR, docstring) |
| 3 | Redactar en voz imperativa clara |
| 4 | Ejecutar comandos citados |
| 5 | Listar archivos tocados; deuda doc fuera scope en una linea |

## Calidad — checklist

| Criterio | Si / No |
|----------|---------|
| Comandos funcionan | |
| Sin rutas obsoletas | |
| Ejemplos minimos completos | |
| Enlaces relativos validos | |
| Sin secretos en ejemplos (R5) | |

## Salida obligatoria

```
Tipo documento
Audiencia
Archivos modificados
Resumen secciones nuevas o cambiadas
Comandos verificados (y resultado)
Deuda documental restante (opcional)
```

## Integracion

| Skill | Cuando |
|-------|--------|
| api-contract-design | OpenAPI + ejemplos |
| plan-before-build | ADR antes de implementacion grande |
| git-workflow | Changelog en PR body |
| explore-codebase | No duplicar mapa repo en README salvo pedido |

## Prohibiciones

- README con comandos rotos no verificados.
- ADR sin alternativas consideradas.
- Manual de 50 paginas no pedido (R7).
- Duplicar schema autogenerado manualmente.
