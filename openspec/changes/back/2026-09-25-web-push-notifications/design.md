# Design: US-08 — Notificaciones Web Push (VAPID) ante publicaciones

## Technical Approach

El envío de notificaciones depende de la coordinación entre tres piezas de la Arquitectura Hexagonal en Quarkus:

1. **Obtención de Suscriptores**: Una consulta Cypher optimizada en Neo4j que busca seguidores que tengan `pushSubscriptionJson` configurado.
2. **Envío Asíncrono**: `WebPushNotificationAdapter` implementando el `NotificationPushPort`.
3. **Manejo de Llaves**: Variables de entorno inyectadas vía MicroProfile Config en Quarkus.

## Architecture Decisions

**D1 — Envío completamente asíncrono y en background.**
La creación de una publicación en `CrearPostUseCase` es una operación bloqueante que el cliente espera para confirmar el UI. Llamar de manera sincrónica al API VAPID por cada seguidor incrementaría la latencia linealmente y arriesgaría un timeout HTTP.
Se decide usar `@Asynchronous` en el adaptador push, o un canal de eventos en memoria usando el event bus interno de Quarkus para desacoplar el despacho.

**D2 — Propiedad en lugar de nodo separado para la suscripción.**
El objeto `pushSubscriptionJson` es pequeño y tiene una cardinalidad 1:1 (o a lo sumo 1:N por dispositivos, aunque aquí se tratará como JSON stringificado). Para mantener el grafo ágil y evitar *JOINs* (traversals extras), se almacena como una propiedad directamente en el nodo `(:Usuario)`.

**D3 — Las claves VAPID viven en el entorno y nunca en el código.**
El `application.properties` las definirá referenciando variables de entorno (`${VAPID_PUBLIC_KEY}`, `${VAPID_PRIVATE_KEY}`).

**D4 — Fallo resiliente por destinatario.**
Si el servicio push del navegador (por ejemplo FCM o Mozilla Push Service) rechaza la petición por expiración del token (`410 Gone`), el sistema debe poder marcar o limpiar ese `pushSubscriptionJson` en Neo4j sin afectar a los demás seguidores en el bucle de envíos.

## Data Flow

**Registro de Suscripción:**
```
Frontend Service Worker obtiene suscripción
  → POST /api/users/{id}/push-subscription
  → UserGraphResource enruta
  → Neo4jGrafoAdapter ejecuta `MERGE/SET u.pushSubscriptionJson = $json`
```

**Envío ante Nueva Publicación:**
```
CrearPostUseCase ejecuta lógica
  → Neo4jGrafoAdapter.crearPost() persiste en Neo4j
  → Retorna éxito HTTP 201 al Frontend
  ────────────────────────────────────────────────
  → (Thread Asíncrono) NotificationPushPort.notificarPublicacion()
  → Cypher obtiene seguidores del autor con suscripciones activas
  → WebPushNotificationAdapter despacha payload cifrado al OS Push Service
```

## Archivos Afectados

| Archivo | Acción | Descripción |
|---|---|---|
| `backend/src/main/java/ec/edu/upse/redsocial/domain/port/out/NotificationPushPort.java` | Modificar | Agregar método de notificación masiva |
| `backend/src/main/java/ec/edu/upse/redsocial/domain/port/out/GrafoPersistencePort.java` | Modificar | Agregar método para obtener suscripciones de seguidores |
| `backend/src/main/java/ec/edu/upse/redsocial/application/service/PostApplicationService.java` | Modificar | Disparar evento push tras creación de post |
| `backend/src/main/java/ec/edu/upse/redsocial/infrastructure/adapter/out/WebPushNotificationAdapter.java` | Nuevo | Implementación del envío usando librería nl.martijndwars:web-push |
| `backend/src/main/java/ec/edu/upse/redsocial/infrastructure/adapter/out/Neo4jGrafoAdapter.java` | Modificar | Lógica de consulta Cypher de seguidores con push |

## Testing Strategy

(Nota: El runner de tests no existe, pero estas son las aserciones que gobernarán la funcionalidad cuando se implemente).

- **Guardado de Suscripción**: Verificar que un endpoint REST actualice la propiedad del nodo `Usuario` en Neo4j.
- **Consulta Cypher**: Validar que la query ignora seguidores con `pushSubscriptionJson IS NULL` y retorna solo a los configurados.
- **Independencia del API**: Validar que un retraso o fallo (excepción) al conectarse al proveedor de Web Push no impida que el POST principal retorne 201 Created.
- **Exclusión de Autor**: El autor de la publicación no debe recibir una alerta de su propia publicación.

## Riesgos y Mitigaciones

- **Riesgo**: Tokens expirados. El adaptador out de push debe manejar los HTTP 410 devueltos por Google/Mozilla para invocar una limpieza en `Neo4jGrafoAdapter` e invalidar la suscripción, evitando envíos fallidos recurrentes.
