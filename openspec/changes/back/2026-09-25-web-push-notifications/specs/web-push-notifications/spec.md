# Spec: US-08 — Notificaciones Web Push (VAPID) ante publicaciones

## Domain: web-push-notifications (NEW)

### Requirement: Registro de la suscripción VAPID
El sistema DEBE permitir a los usuarios almacenar su identificador único de suscripción Web Push en su nodo `(:Usuario)` dentro del grafo.

- Scenario: Registro Exitoso — GIVEN un usuario autenticado WHEN envía su suscripción generada por el Service Worker vía POST `/api/users/{id}/push-subscription` THEN se actualiza su nodo `(:Usuario)` con el JSON y responde 200 OK
- Scenario: Identidad Falsa — GIVEN un usuario autenticado con ID `userA` WHEN intenta sobreescribir la suscripción en `/api/users/userB/push-subscription` THEN la petición se rechaza (una vez implementada Auth)

### Requirement: Extracción de seguidores suscritos
Al publicarse nuevo contenido, el sistema DEBE aislar únicamente a los seguidores directos (1 salto) que tengan configurada la suscripción push.

- Scenario: Seguidores sin suscripción — GIVEN que "Carlos" tiene 10 seguidores, pero solo 2 enviaron su `pushSubscriptionJson` WHEN Carlos crea un post THEN la consulta Cypher retorna exactamente los 2 JSON de suscripción correspondientes, excluyendo al resto
- Scenario: Omisión del autor — GIVEN que Carlos (autor) publica un post y tiene configurado `pushSubscriptionJson` THEN Carlos no se notifica a sí mismo de su propia publicación

### Requirement: Despacho Asíncrono Resiliente
El proceso de envío de mensajes push al SO del usuario NUNCA DEBE frenar la creación del post.

- Scenario: Desacople Temporal — GIVEN una creación exitosa de Post THEN el endpoint responde al cliente instantáneamente (201 Created), mientras la notificación a los servidores de Google/Mozilla ocurre en un subproceso de Quarkus
- Scenario: Falla del servidor Push — GIVEN que los servidores VAPID de destino están caídos WHEN Quarkus intenta despachar el payload THEN se registra un log de error pero la publicación en Neo4j queda íntegra y disponible para el feed

### Requirement: Limpieza de tokens caducados
Los navegadores rotan los endpoints VAPID. Si el proveedor responde que el endpoint no existe, el grafo DEBE actualizarse.

- Scenario: Token Invalido (410 Gone) — GIVEN que un seguidor desinstaló la app o revocó el permiso WHEN el `WebPushNotificationAdapter` envía el payload y recibe 410 Gone THEN el sistema marca ese `pushSubscriptionJson` como nulo en el nodo `(:Usuario)` correspondiente, liberando el grafo de basura.
