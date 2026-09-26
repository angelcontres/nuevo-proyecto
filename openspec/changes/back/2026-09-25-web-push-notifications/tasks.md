# Tasks: US-08 — Notificaciones Web Push (VAPID) ante publicaciones

**Change**: `2026-09-25-web-push-notifications`
**Story Linear**: TUX-60
**Working dir**: `backend`

---

## Phase 1: Modificaciones en el Grafo (Domain y Persistencia)

- [ ] **1.1** — En `GrafoPersistencePort.java`, definir método `List<String> obtenerSuscripcionesPushDeSeguidores(String autorId)`.
- [ ] **1.2** — Implementar el método en `Neo4jGrafoAdapter.java` usando la consulta Cypher obligatoria para extraer `pushSubscriptionJson` excluyendo nulos.
- [ ] **1.3** — Añadir el método en `GrafoPersistencePort` para registrar la suscripción: `void guardarSuscripcionPush(String userId, String json)`.
- [ ] **1.4** — Implementar dicho método en `Neo4jGrafoAdapter.java` (usando `SET u.pushSubscriptionJson = $json`).

## Phase 2: Adaptador Outbound y Lógica Asíncrona

- [ ] **2.1** — Crear la clase `WebPushNotificationAdapter.java` implementando `NotificationPushPort`.
- [ ] **2.2** — Configurar lectura de `application.properties` para `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` en el adaptador.
- [ ] **2.3** — Implementar la lógica del servicio web push cifrando el payload y disparando el request a los endpoints de VAPID.
- [ ] **2.4** — (Importante) Gestionar la excepción o status `410 Gone` para llamar a la BD y borrar el token inválido en el grafo.

## Phase 3: Casos de uso y Resources (Inbound)

- [ ] **3.1** — Modificar `PostApplicationService.java` para que, luego de persistir el post exitosamente con el port de base de datos, despache un hilo o llame de forma asíncrona a `NotificationPushPort`.
- [ ] **3.2** — Crear/Modificar `UserGraphResource.java` añadiendo el endpoint `@POST /api/users/{id}/push-subscription` para aceptar el JSON del cliente.

## Summary

La implementación debe asegurar el aislamiento: la respuesta de la creación de publicaciones no se verá afectada, ni en latencia ni en completitud, por el desempeño o las fallas de los servidores VAPID.
