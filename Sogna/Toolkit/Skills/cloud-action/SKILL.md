---
name: cloud-action
description: Automated cloud deployment and state synchronization capabilities. Use when the project needs to be deployed to staging or production (Vercel) or when external cloud resources (Supabase, n8n) need to be configured from the local project.
id: skill-cloud-action
owner: [[orchestrator]]
---


# ☁️ Habilidad: Acción en la Nube

Esta habilidad permite que el proyecto local actúe sobre infraestructuras externas de forma automatizada y segura.

## 🚀 Despliegue en Vercel

Utiliza esta capacidad para:
- Desplegar la capa web del proyecto (Next.js/React).
- Sincronizar variables de entorno del proyecto local con el dashboard de Vercel.
- Gestionar previsualizaciones de cambios en ramas.

### Protocolo de Despliegue:
1.  **Auditoría Previa:** Ejecuta un escaneo de `Sentinel` para asegurar que el despliegue no contiene secretos expuestos.
2.  **Preparación de Build:** Valida que el `npm run build` sea exitoso localmente.
3.  **Ejecución:** Usa la CLI de Vercel integrada (inyectada en el nuevo proyecto).

## 🔗 Sincronización n8n & Supabase

Capacidad de interactuar con las infraestructuras creadas durante el `Sognatore init`.

### Protocolo de Sincronización:
- **Supabase:** Aplicar migraciones locales al entorno de nube usando la `supabase-cli`.
- **n8n:** Exportar/Importar flujos de trabajo desde la carpeta local `n8n/` hacia la instancia de automatización.

## 🚨 Configuración Soberana

> [!CAUTION]
> Estas capacidades **requieren configuración local** en el nuevo proyecto:
> - Instalar `vercel` y `supabase` CLIs localmente.
> - Configurar tokens de acceso en el `.env` (e.g., `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN`).

El agente responsable de la nube (`devops-engineer` o `orchestrator`) debe guiar al usuario en la configuración de estas herramientas tras la clonación del proyecto.
