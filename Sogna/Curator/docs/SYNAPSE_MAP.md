# 🧠 SYNAPSE_MAP - Enrutamiento Neuronal

Este mapa define los canales prioritarios entre enjambres y conjuntos de conocimiento técnico consolidado.

---

## 1. Orchestration agent_group

* **Agentes**: `orchestrator`, `processor`, `system-architect`.
* **Vías Rápidas de Skill**:
    * `architect-review`
    * `concise-planning`
    * `writing-plans`

---

## 2. Engineering agent_group

* **Agentes**: `eng-frontend`, `eng-backend`, `eng-api`.
* **Vías Rápidas de Skill**:
    * `angular-engineering`
    * `react-patterns`
    * `api-design-principles`

---

## 3. Operations agent_group

* **Agentes**: `ops-security`, `ops-sre`, `ops-cost`.
* **Vías Rápidas de Skill**:
    * `aws-cost-management`
    * `incident-management`
    * `vulnerability-scanner`

---

## 🔄 4. Interoperabilidad Cross-agent_group (Rutas Cruzadas)

* **Flujo A: Cambios de DB**
    * *Disparador*: `eng-backend` o `eng-database` realizan DDL/DML complejos.
    * *Acción Sináptica*: Carga prioritaria de `ops-security` (`vulnerability-scanner`).
* **Flujo B: Despliegue a Producción**
    * *Disparador*: `eng-infra` u `ops-devops` ejecutan despliegue.
    * *Acción Sináptica*: Invocar a `ops-sre` e `incident-management`.

---
*Configuración preferencial del motor RAG Sogna.*
