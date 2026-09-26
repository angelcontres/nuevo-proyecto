# Roadmap — Ejecución y Arquitectura de Red Social Distribuida

> **Punto de entrada para sesiones nuevas.** Este archivo fija el orden, las decisiones ya cerradas y los hechos verificados del código, para que nadie los vuelva a discutir ni los redescubra.
>
> Fecha: 2026-09-25 · Artefactos SDD: `openspec/changes/` · Tickets: Linear `TUX-52`..`TUX-62` (`US-01`..`US-11`)

---

## Contexto en una línea

El sistema es una Red Social Distribuida apoyada en Neo4j, Quarkus y MinIO; el frontend usa React + Vite + Tailwind, sin embargo, faltan pruebas, linting y la implementación real de autenticación.

---

## Estado real del código

El esqueleto de la arquitectura hexagonal (Quarkus) y la estructura de features (React) ya existen, con puertos y adaptadores definidos. 
Lo que está implementado (al menos como interfaces o componentes base):
- Los adaptadores hacia Neo4j, MinIO y Web Push.
- Componentes de interfaz de usuario, recursos REST y el WebSocket del Chat.
Lo que NO está implementado:
- Cero código de pruebas (no hay runner).
- Autenticación JWT (definido en diseño, pero no construido en el código).

---

## Orden de ejecución

```
 Sprint 1 ──► Sprint 2 ──► Sprint 3
 US-01        US-05        US-07
 US-02        US-06        US-08
 US-04        US-03        US-10
              US-09        US-11
```

Dependencias reales y críticas:
- **US-01 antes que todo:** Sin la entidad Usuario no puede existir el grafo.
- **US-02 antes que US-05:** El feed depende inherentemente de la relación `SIGUE`.
- **US-04 antes que US-05:** No puede haber feed si no existen posts creados.

---

## Qué hace cada historia

| Sprint | Ticket Linear | Historia | SP | MoSCoW | Criterio de Éxito / Qué hace |
|---|---|---|---|---|---|
| Sprint 1 | TUX-52 | US-01 | 2 | Must | Registro, sesión y perfil con avatar en MinIO |
| Sprint 1 | TUX-53 | US-02 | 2 | Must | Seguir, dejar de seguir y consultar red social |
| Sprint 1 | TUX-54 | US-04 | 3 | Must | Crear publicación con multimedia S3 |
| Sprint 2 | TUX-55 | US-05 | 5 | Must | Feed generado por grafo social (2 saltos) |
| Sprint 2 | TUX-56 | US-06 | 2 | Should | Reaccionar a publicaciones (Likes) |
| Sprint 2 | TUX-57 | US-03 | 3 | Should | Sugerencia inteligente de contactos (2do grado) |
| Sprint 2 | TUX-58 | US-09 | 3 | Should | Conexiones y seguidores en común |
| Sprint 3 | TUX-59 | US-07 | 5 | Must | Mensajería instantánea 1 a 1 (WebSockets) |
| Sprint 3 | TUX-60 | US-08 | 5 | Should | Notificaciones Web Push (VAPID) |
| Sprint 3 | TUX-61 | US-10 | 3 | Could | Camino más corto (Shortest Path 6 grados) |
| Sprint 3 | TUX-62 | US-11 | 3 | Could | Tendencias y viralidad en red extendida |

---

## Decisiones cerradas — NO reabrir

| Tema | Decisión |
|---|---|
| Grafo vs Relacional | Grafo (Neo4j) por *index-free adjacency*. Evita consultas recursivas lentas. |
| Multimedia | S3 / MinIO para mantener el grafo ligero. |
| Chat | WebSockets sobre polling HTTP por menor sobrecarga. |
| Alertas | Web Push sobre long polling para soporte background. |
| Despliegue | Docker Compose para asegurar reproducibilidad. |
| Repositorio | GitFlow Lite con la rama por defecto `develop`. |
| Autenticación | JWT Stateless. |

---

## Hechos verificados del código

Comprobados en `backend/src/main/java/ec/edu/upse/redsocial/`:
- **4 nodos del dominio:** `Usuario`, `Post`, `MensajeChat`, `SugerenciaUsuario`.
- **3 puertos de salida:** `GrafoPersistencePort`, `NotificationPushPort`, `StorageMultimediaPort`.
- **3 clases de caso de uso (ports in):** `ObtenerFeedUseCase`, `CrearPostUseCase`, `GestionarGrafoSocialUseCase`.
- **3 Resources REST:** `FeedResource`, `PostResource`, `UserGraphResource`.
- **El ChatWebSocket:** Actúa como adaptador in en `infrastructure/adapter/in/websocket/ChatWebSocket`.
- **4 adaptadores out/in:** `Neo4jGrafoAdapter`, `MinioS3StorageAdapter`, `WebPushNotificationAdapter`, y el `ChatWebSocket`.

---

## Defectos abiertos

| Defecto | Dónde | Estado / Solución Planificada |
|---|---|---|
| Drift en fuente de verdad canónica | `openspec/specs/spec.md` | Corregir relaciones inventadas y aclarar falta de tests/JWT |
| Autenticación no existe | `backend/src` | Falsa declaración de bcrypt/JWT en la spec; por implementar en US-01 |

---

## Deuda con dueño asignado

| Tarea de Deuda | Dueño asignado |
|---|---|
| Decidir framework de Testing y configurar runner (JUnit/Vitest) | Equipo de Arquitectura |
| Agregar configuración y script para el Linter (ESLint) en frontend | Angel Villon / Paulo Orrala |
| Migrar propuestas obsoletas (`proposals/`) al formato correcto | opencode (bot) |
