# Documentación del Proyecto - Red Social Distribuida

Bienvenido al directorio de documentación técnica del sistema de **Red Social Distribuida**.

## Índice de Documentos

1. [**Diseño del Sistema - Modelo C4 (c4-model.md)**](./c4-model.md):
   - **Nivel 1: Contexto del Sistema (System Context):** Actores externos y límites del sistema.
   - **Nivel 2: Diagrama de Contenedores (Containers):** React SPA, Service Worker PWA, Nginx, Quarkus Backend, Neo4j, MinIO S3 y Web Push.
   - **Nivel 3: Diagrama de Componentes (Components):** Estructura interna del backend Quarkus (Resources, Repositorios Cypher, Servicios S3/Push, WebSockets).
   - **Nivel 4: Diagrama de Despliegue (Deployment):** Topología de contenedores en red Docker bridge, puertos y volúmenes persistentes.
   - **Registro de Decisiones de Arquitectura (ADRs):** Justificaciones técnicas de grafos vs relacional, almacenamiento S3 vs BLOBs, WebSockets vs Polling y Web Push.

2. [**Especificación de Arquitectura, Backlog y Ejecución (architecture-and-backlog.md)**](./architecture-and-backlog.md):
   - Justificación de tecnologías y matriz de protocolos de comunicación.
   - Modelo de grafos en Neo4j (Nodos `:Usuario`, `:Post` y relaciones `:SIGUE`, `:PUBLICA`, `:REACCIONA`).
   - Las 5 consultas Cypher obligatorias (Feed por grafo, sugerencias de segundo grado, intersecciones, shortest path, tendencias).
   - Product Backlog priorizado mediante modelo matemático RICE y MoSCoW (11 historias completas).
   - Planificación de Sprints (1, 2 y 3) con grafo de dependencias en Mermaid y reglas DoR / DoD.
   - Criterios de aceptación detallados en formato BDD/Gherkin para las 11 historias.
   - Matriz de trazabilidad técnica integral.

3. [**Guía Táctica del Backlog para Programadores (backlog-programadores.md)**](./backlog-programadores.md):
   - Tarjetas de desarrollo listas para copiar a Linear / Jira (`TUX-01` a `TUX-11`).
   - Tareas técnicas exactas por capa hexagonal (Domain, Inbound, Outbound Neo4j/S3/Push).
   - Contratos JSON y comandos de prueba `cURL` para cada endpoint.
   - Dataset semilla en Cypher (`docker/neo4j-seed.cql`) con validación inmediata.

4. [**Flujo de Trabajo Git - GitFlow Lite (git-workflow.md)**](./git-workflow.md):
   - Topología de ramas (`develop` como rama principal única, ramas `feature/`, `fix/`, `docs/`).
   - Ciclo de vida estandarizado del desarrollo paso a paso.
   - Convención de mensajes de commit (Conventional Commits).
   - Plantilla de Pull Request y proceso de revisión en equipo.
