# Proposal: US-08 — Notificaciones Web Push (VAPID) ante publicaciones

## Intent

Una publicación nueva hoy no notifica a los seguidores de forma proactiva. Si el usuario no tiene la aplicación abierta en el navegador, no se entera hasta que decida entrar y revisar su feed.

Flujo objetivo:
1. El autor crea una publicación (nodo `(:Post)`)
2. Quarkus detecta los seguidores del autor en el grafo social (relación `[:SIGUE]`)
3. Se extrae la configuración de suscripción Web Push (`pushSubscriptionJson`) de los nodos `(:Usuario)` correspondientes
4. Se despacha el payload cifrado (VAPID) al servicio Push nativo de los navegadores de los seguidores

## Scope

### In Scope — Despacho asíncrono de alertas push
- Configurar las llaves VAPID en el entorno de Quarkus
- Implementar el envío a través de un servicio externo web push usando la librería VAPID correspondiente en Java
- Disparar el evento desde el caso de uso de creación de posts de manera asíncrona para no bloquear el request HTTP del autor

### In Scope — Almacenamiento de suscripciones en el grafo
- Añadir o actualizar la propiedad `pushSubscriptionJson` en el nodo `(:Usuario)` mediante un nuevo endpoint en el backend

### Out of Scope
- Notificaciones vía Email, Telegram o SMS.
- Gestión de notificaciones en base de datos (campana de notificaciones in-app). Esto se limita estrictamente a notificaciones push del OS.

## Capabilities

### New Capabilities
- `web-push-notifications`: Notificaciones fuera del navegador con Web Push y VAPID.

### Modified Capabilities
- `post-management`: `CrearPostUseCase` emite un evento asíncrono para despachar las notificaciones.

## Cambios en el grafo

- Propiedad nueva en `(:Usuario)`: `pushSubscriptionJson` (String JSON)
- Consulta Cypher requerida: Obtener todos los seguidores de un autor que tengan la propiedad `pushSubscriptionJson` definida y no nula:
  ```cypher
  MATCH (autor:Usuario {id: $autorId})<-[:SIGUE]-(seguidor:Usuario)
  WHERE seguidor.pushSubscriptionJson IS NOT NULL
  RETURN seguidor.pushSubscriptionJson
  ```

## Autenticación y autorización afectada

El registro de la suscripción (`POST /api/users/{id}/push-subscription`) requiere que el usuario esté autenticado con su JWT (cuando el mecanismo de auth esté implementado). Solo un usuario puede actualizar su propia suscripción.

## Domain Module Dependencies

- `backend/src/main/java/ec/edu/upse/redsocial/domain/port/out/` — `NotificationPushPort` y `GrafoPersistencePort`
- `backend/src/main/java/ec/edu/upse/redsocial/domain/port/in/` — `CrearPostUseCase`
- `backend/src/main/java/ec/edu/upse/redsocial/application/service/` — `PostApplicationService`
- `backend/src/main/java/ec/edu/upse/redsocial/infrastructure/adapter/out/` — `WebPushNotificationAdapter`, `Neo4jGrafoAdapter`

## Approach

El proceso de creación de la publicación no debe acoplarse sincrónicamente con el envío de Web Push. 
`PostApplicationService` llamará a `GrafoPersistencePort` para persistir el post, y luego despachará el evento a `NotificationPushPort` para que corra en un thread asíncrono (usando `@Asynchronous` o `ManagedExecutor` de Quarkus). Un fallo en el push de un seguidor particular no debe cancelar ni afectar la creación del post ni los mensajes a otros seguidores.

## Dependencies

- **Depende de**: US-01 (Identidad) y US-04 (Publicaciones).
- **Bloquea**: nada.

## Riesgos

- **Riesgo de bloqueo**: Si las notificaciones se envían de manera síncrona en el loop de `CrearPostUseCase`, el request del usuario puede hacer timeout. *Mitigación:* Envío estrictamente asíncrono.
- **Riesgo de carga en BD**: Extraer demasiados seguidores de golpe para un influencer puede generar picos de memoria. *Mitigación:* Dependiendo del tamaño del grafo, el resultado del Cypher se debe manejar por lotes (streaming) si la red crece.
