---
name: meaningful-tests
description: "Diseno e implementacion de tests con valor real: reglas de negocio, regresion, integracion critica. Usar cuando CI falle, falte cobertura util, bug corregido necesite ancla, Operador pida TDD, que testeamos, tests de regresion, o evaluar si un test aporta. Omitir getters triviales y smoke vacios. Piramide pragmatica, determinismo, nombres como especificacion. Verify suite paquete (R3)."
---
# Meaningful tests

Objetivo: proteger comportamiento que importa al negocio y al mantenedor con tests legibles, deterministicos y rapidos. Cobertura es medio; confianza en cambios es fin.

Un test valioso falla cuando se rompe un comportamiento que un usuario o consumidor notaria.

## Disparadores

| Situacion | Accion esperada |
|-----------|-----------------|
| CI rojo | Diagnosticar; corregir codigo o test obsoleto con criterio |
| Bugfix | Regresion que reproduce el fallo original |
| Feature logica | Casos happy, borde, error |
| Refactor riesgo | Test caracterizacion previo (safe-refactor) |
| Pregunta alcance | Matriz que testear / omitir |

## Exclusiones (omitir o postergar)

| Caso | Motivo |
|------|--------|
| Getter/setter sin logica | Cero valor regresion |
| Codigo generado | Probar integracion minima si acaso |
| UI cosmetica | ROI bajo salvo design system critico |
| Prototipo desechable | Acuerdo Operador |
| Framework boot | assert true / render sin asercion |

## Piramide pragmatica

| Capa | Proposito | Cuando priorizar |
|------|-----------|------------------|
| Unit | Logica pura, reglas, validacion | Siempre en dominio |
| Integration | DB, API, cola con testcontainers o mocks acotados | Contratos I/O |
| E2E | Flujo usuario critico | Pocos, lentos, alto valor |
| Contract | API productor/consumidor | Microservicios, SDK |

No invertir piramide: cientos de E2E lentos y cero unit en reglas de negocio.

## Principios

1. Comportamiento observable, no implementacion interna.
2. Nombre = especificacion: deberia X cuando Y.
3. Determinismo: controlar tiempo (fake timers), red (mock), random (seed).
4. Un concepto principal por test; asserts multiples solo si mismo comportamiento.
5. Mantenimiento: factories solo si reducen ruido real (R1).

## Protocolo

### Fase 1 — Identificar comportamientos

| Fuente | Extraer |
|--------|---------|
| Requisito Operador | Casos aceptacion |
| Bug report | Pasos que fallaron |
| Codigo | Ramas if, throws, estados |
| API contrato | Validacion, errores |

Listar: happy path, bordes, errores esperados, no-go (input invalido).

### Fase 2 — Priorizar

| Prioridad | Que | Ejemplo |
|-----------|-----|---------|
| P0 | Reglas negocio, auth, dinero, datos irreversibles | Calculo precio, permiso admin |
| P1 | Regresion bug reciente | Test del ticket |
| P2 | Integracion critica | Repo + DB |
| P3 | Snapshot UI amplio | Solo componentes complejos |

### Fase 3 — Escribir

Estructura Arrange → Act → Assert.

```
describe('Modulo')
  describe('funcion')
    it('deberia [resultado] cuando [condicion]')
```

| Regla | Detalle |
|-------|---------|
| Datos | Minimos; builders solo si claridad |
| Mocks | Solo frontera externa; no mock objeto bajo test |
| Async | await expect(...).rejects si error |
| Flaky | Prohibido merge; arreglar o cuarentena temporal con issue |

TDD (si acordado): red → green → refactor en alcance minimo.

### Fase 4 — Ejecutar (R3)

| Alcance | Comando |
|---------|---------|
| Modulo | test path/to/module |
| Paquete | npm test, pytest, go test ./... |
| CI local | Mismo job que falla en pipeline |

Registrar comando y resultado en respuesta al Operador.

## Matriz que no testear

| Patron | Alternativa |
|--------|-------------|
| Detalle privado | Test via API publica |
| Orden llamadas internas | Test output final |
| Libreria estandar | Confianza en vendor |
| Config estatica | Smoke integracion |

## Salida obligatoria

```
Comportamientos cubiertos (lista)
Casos omitidos y motivo
Archivos test tocados
Comandos ejecutados
Resultado (pass/fail)
Huecos restantes (si riesgo aceptado)
```

## Integracion

| Skill | Relacion |
|-------|----------|
| systematic-debug | Regresion post bugfix |
| safe-refactor | Caracterizacion pre-refactor |
| api-contract-design | Tests contrato HTTP |
| code-review | Evaluar calidad tests en PR |
| commit-prepare | Verify verde antes commit |

## Prohibiciones

- expect(true).toBe(true) y variantes.
- Mock excesivo que no prueba nada real.
- Tests duplicados mismo comportamiento.
- Tests que dependen de orden de ejecucion global.
- Afirmar CI verde sin ejecutar (R3).
