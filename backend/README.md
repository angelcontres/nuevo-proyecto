# Backend Quarkus - Red Social Distribuida

Servicio orquestador lógico implementado con **Quarkus 3 (Java 21)**, integrando **Neo4j** para el grafo social, **MinIO (S3)** para contenido multimedia, **WebSockets** para mensajería directa y **Web Push (VAPID)** para alertas en segundo plano.

## Estructura del Código

```text
src/main/java/ec/edu/upse/redsocial/
├── model/           # Entidades (:Usuario, :Post, SugerenciaUsuario, MensajeChat)
├── repository/      # Repositorio Neo4j con las 5 consultas Cypher no triviales
├── resource/        # Endpoints REST (Feed, Post, UserGraph)
├── service/         # S3StorageService (MinIO), NotificationPushService (VAPID)
└── websocket/       # ChatWebSocket para mensajería 1 a 1 en tiempo real
```

## Ejecución Local en Modo Desarrollo

```bash
# Iniciar modo dev con Hot Reload
mvn quarkus:dev
```

- **Consola Dev UI:** `http://localhost:8080/q/dev`
- **Swagger / OpenAPI:** `http://localhost:8080/q/swagger-ui`
