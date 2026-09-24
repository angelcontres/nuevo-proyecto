# Backend Quarkus - Red Social Distribuida (Arquitectura Hexagonal)

Servicio orquestador lógico implementado con **Quarkus 3 (Java 21)** siguiendo los principios de la **Arquitectura Hexagonal (Ports & Adapters)**, desacoplando el núcleo de negocio de los detalles de infraestructura (**Neo4j**, **MinIO S3**, **WebSockets** y **Web Push VAPID**).

## Estructura Hexagonal del Código

```text
src/main/java/ec/edu/upse/redsocial/
├── domain/                          # Núcleo del Dominio (Puro Java, sin frameworks)
│   ├── model/                       # Entidades: Usuario, Post, SugerenciaUsuario, MensajeChat
│   └── port/                        # Interfaces que definen los contratos del sistema
│       ├── in/                      # Puertos de Entrada / Casos de Uso (ObtenerFeedUseCase, CrearPostUseCase, etc.)
│       └── out/                     # Puertos de Salida / SPI (GrafoPersistencePort, StorageMultimediaPort, etc.)
│
├── application/                     # Capa de Aplicación
│   └── service/                     # Implementación de Casos de Uso (FeedApplicationService, PostApplicationService, etc.)
│
└── infrastructure/                  # Capa de Infraestructura (Adaptadores)
    └── adapter/
        ├── in/                      # Adaptadores de Entrada (Driving / Primarios)
        │   ├── rest/                # Endpoints JAX-RS / RESTEasy Reactive (FeedResource, PostResource, UserGraphResource)
        │   └── websocket/           # Endpoint WebSocket Server (ChatWebSocket)
        │
        └── out/                     # Adaptadores de Salida (Driven / Secundarios)
            ├── neo4j/               # Neo4jGrafoAdapter (Las 5 consultas Cypher obligatorias vía Bolt)
            ├── s3/                  # MinioS3StorageAdapter (Cliente AWS SDK S3 para multimedia)
            └── push/                # WebPushNotificationAdapter (Cifrado y despacho VAPID)
```

## Ejecución Local en Modo Desarrollo

```bash
# Iniciar modo dev con Hot Reload
mvn quarkus:dev
```

- **Consola Dev UI:** `http://localhost:8080/q/dev`
- **Swagger / OpenAPI:** `http://localhost:8080/q/swagger-ui`
