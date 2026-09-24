# Diseño del Sistema - Modelo C4

Este documento describe la arquitectura de la **Red Social Distribuida** empleando el **Modelo C4** (Contexto, Contenedores, Componentes y Despliegue), permitiendo visualizar el sistema a diferentes niveles de abstracción.

---

## Nivel 1: Diagrama de Contexto del Sistema (System Context)

El diagrama de contexto ilustra cómo los usuarios interactúan con la plataforma de la Red Social Distribuida y su relación con sistemas y servicios externos (como los proveedores de Web Push de los navegadores y el sistema operativo).

```mermaid
flowchart TD
    user["👤 Usuario de la Red Social<br/>(Navega en la plataforma, crea publicaciones,<br/>chatea y recibe recomendaciones)"]
    
    subgraph SystemBoundary [" Plataforma Red Social Distribuida "]
        system["🌐 Sistema de Red Social Distribuida<br/>(Gestión de identidad, grafo de relaciones,<br/>feed social, mensajería en vivo y almacenamiento)"]
    end
    
    pushService["☁️ Servicio Web Push Externo<br/>(Google FCM / Apple APNs / Mozilla Push Service)<br/>Entrega notificaciones nativas push al SO"]

    user -->|"Interactúa vía web (HTTPS/WSS)"| system
    system -->|"Despacha alertas cifradas VAPID"| pushService
    pushService -->|"Muestra notificación del sistema operativo"| user
```

### Elementos del Contexto:
- **Usuario:** Usuario autenticado que publica contenido multimedia, reacciona a posts, sigue a otros integrantes, mantiene conversaciones por chat y recibe recomendaciones en base a sus amigos mutuos.
- **Sistema de Red Social Distribuida:** Núcleo de la plataforma distribuida compuesto por frontend reactivo, orquestador backend, base de datos orientada a grafos y almacenamiento de objetos S3.
- **Servicio Web Push Externo:** Red de mensajería nativa estándar del navegador (Mozilla, Google Chrome, Safari) que entrega notificaciones al sistema operativo del usuario aunque la pestaña esté cerrada.

---

## Nivel 2: Diagrama de Contenedores (Containers)

El diagrama de contenedores desglosa la aplicación en aplicaciones ejecutables, almacenes de datos y protocolos de comunicación que componen la topología distribuida.

```mermaid
flowchart TB
    user["👤 Usuario"]

    subgraph ClientLayer [" Capa de Cliente (Navegador Web) "]
        spa["💻 Single Page Application (SPA)<br/><b>[React 18 + TypeScript + Vite]</b><br/>Interfaz reactiva, renderizado del feed, chat en vivo y muro"]
        sw["⚙️ Service Worker<br/><b>[JavaScript PWA]</b><br/>Gestión de notificaciones push en segundo plano y caché"]
    end

    subgraph ServerLayer [" Capa de Servidor (Docker Bridge Network) "]
        nginx["🔀 Reverse Proxy / Web Server<br/><b>[Nginx Alpine]</b><br/>Sirve assets estáticos y enruta peticiones API / WebSocket"]
        backend["⚡ Orquestador Lógico Backend<br/><b>[Quarkus 3 (Java 21)]</b><br/>Lógica de negocio, controladores REST, chat WebSocket y cliente S3"]
    end

    subgraph DataLayer [" Capa de Persistencia y Almacenamiento "]
        neo4j[("🕸️ Base de Datos de Grafos<br/><b>[Neo4j 5.20 Community]</b><br/>Almacena nodos (:Usuario, :Post) y relaciones [:SIGUE, :PUBLICA, :REACCIONA]")]
        minio[("📦 Object Storage Compatible S3<br/><b>[MinIO RELEASE.2024]</b><br/>Almacena binarios multimedia (imágenes, avatares)")]
    end

    pushProvider["☁️ Proveedor Web Push (VAPID)"]

    user -->|"Accede a la UI (HTTP :3000)"| spa
    spa -->|"Registra suscripción"| sw
    spa -->|"Peticiones HTTP REST (JSON)"| nginx
    spa -->|"Canal WebSocket dúplex (WSS)"| nginx

    nginx -->|"Proxy /api/* (:8080)"| backend
    nginx -->|"Proxy /chat/* (:8080)"| backend

    backend -->|"Consultas Cypher (Bolt :7687)"| neo4j
    backend -->|"PutObject / GetObject (HTTP :9000)"| minio
    backend -->|"Dispara alertas Web Push (VAPID)"| pushProvider
    pushProvider -->|"Envía evento Push"| sw
    sw -->|"Lanza notificación nativa OS"| user
    spa -->|"Carga multimedia directa"| minio
```

### Contenedores y Roles:
1. **React SPA:** Interfaz de usuario empaquetada con TypeScript y Vite. Muestra el feed generado por grafos y gestiona la sesión WebSocket.
2. **Service Worker:** Script en segundo plano del navegador que atiende eventos `push` y muestra notificaciones toast en el sistema operativo.
3. **Nginx Reverse Proxy:** Servidor web perimetral que unifica el origen web y redirige tráfico HTTP y WebSockets al backend.
4. **Quarkus Backend:** Microservicio Java de alto rendimiento con tiempo de arranque ultra rápido y bajo consumo de memoria. Expone APIs REST y maneja WebSockets dúplex.
5. **Neo4j:** Base de datos NoSQL de grafos nativos (*Index-Free Adjacency*). Ejecuta consultas Cypher avanzadas para feeds, sugerencias y caminos mínimos.
6. **MinIO:** Servidor de objetos compatible con AWS S3 que desacopla la carga de archivos binarios pesados fuera de la base de datos transaccional.

---

## Nivel 3: Diagrama de Componentes (Components - Backend Quarkus)

Este nivel detalla la arquitectura interna del contenedor **Quarkus Backend**, mostrando sus clases y responsabilidades.

```mermaid
flowchart TD
    subgraph QuarkusBackend [" Contenedor Backend Quarkus (Java 21) "]
        feedRes["FeedResource<br/><i>[JAX-RS / RESTEasy]</i><br/>GET /api/feed/{userId}"]
        postRes["PostResource<br/><i>[JAX-RS / RESTEasy]</i><br/>POST /api/posts<br/>POST /api/posts/{id}/like"]
        userRes["UserGraphResource<br/><i>[JAX-RS / RESTEasy]</i><br/>POST /api/users<br/>POST /api/users/{id}/follow"]
        chatWs["ChatWebSocket<br/><i>[ServerEndpoint]</i><br/>/chat/{userId}<br/>Enrutador de mensajes 1 a 1"]

        grafoRepo["GrafoRepository<br/><i>[ApplicationScoped]</i><br/>Ejecutor de las 5 consultas Cypher obligatorias en Neo4j"]
        s3Service["S3StorageService<br/><i>[ApplicationScoped]</i><br/>Gestor de subida de imágenes a MinIO"]
        pushService["NotificationPushService<br/><i>[ApplicationScoped]</i><br/>Cifrado de payload VAPID y despacho Push"]
    end

    neo4jDb[("Neo4j Bolt:7687")]
    minioApi[("MinIO HTTP:9000")]
    webPushApi["Web Push Gateway"]

    feedRes -->|"Consulta feed de 2 saltos"| grafoRepo
    postRes -->|"Crea nodo Post y relación PUBLICA"| grafoRepo
    postRes -->|"Sube imagen adjunta"| s3Service
    postRes -->|"Dispara notificación a seguidores"| pushService
    userRes -->|"Gestiona relaciones SIGUE y sugerencias"| grafoRepo
    chatWs -->|"Transmite mensaje entre sesiones en memoria"| chatWs

    grafoRepo -->|"Driver oficial Bolt"| neo4jDb
    s3Service -->|"AWS S3 SDK Client"| minioApi
    pushService -->|"HTTP Push Request"| webPushApi
```

### Componentes Clave:
- **`FeedResource`:** Resuelve la solicitud de feed del usuario invocando la consulta de 2 saltos en Neo4j.
- **`PostResource`:** Recibe las publicaciones, coordina el almacenamiento de la imagen en MinIO mediante `S3StorageService`, persiste los nodos en Neo4j y gatilla `NotificationPushService`.
- **`UserGraphResource`:** Expone endpoints para crear conexiones `[:SIGUE]`, calcular amigos sugeridos de 2º nivel y calcular el camino más corto (*shortest path*).
- **`ChatWebSocket`:** Mantiene un registro de sesiones activas concurrentes para enrutar mensajes directamente de emisor a receptor sin latencia.
- **`GrafoRepository`:** Centraliza las 5 consultas Cypher no triviales utilizando transacciones administradas del driver oficial de Neo4j.

---

## Nivel 4: Diagrama de Despliegue (Deployment)

Describe la infraestructura física y virtual orquestada mediante Docker Compose.

```mermaid
flowchart TD
    subgraph HostMachine [" Máquina Anfitriona (Host Docker Engine) "]
        subgraph DockerNetwork [" Docker Bridge Network: red-distribuida "]
            
            subgraph ContFrontend [" Contenedor: redsocial-frontend "]
                nginxProc["Nginx Web Server (:80)<br/>Mapeado a host :3000"]
            end

            subgraph ContBackend [" Contenedor: redsocial-backend "]
                quarkusProc["Quarkus JVM Runtime (:8080)<br/>Mapeado a host :8080"]
            end

            subgraph ContNeo4j [" Contenedor: redsocial-neo4j "]
                neo4jProc["Neo4j Engine (:7474 HTTP, :7687 Bolt)"]
                neo4jVol[("Volumen Persistente:<br/>neo4j_data (/data)")]
                neo4jProc --- neo4jVol
            end

            subgraph ContMinio [" Contenedor: redsocial-minio "]
                minioProc["MinIO S3 Server (:9000 API, :9001 Console)"]
                minioVol[("Volumen Persistente:<br/>minio_data (/data)")]
                minioProc --- minioVol
            end

            subgraph ContInit [" Contenedor: minio-init "]
                mcClient["MinIO Client (mc)<br/>Crea bucket 'redsocial-media' y aplica política pública"]
            end
        end
    end

    nginxProc -->|"HTTP / REST & WSS"| quarkusProc
    quarkusProc -->|"Bolt TCP :7687"| neo4jProc
    quarkusProc -->|"HTTP API :9000"| minioProc
    mcClient -->|"Configura bucket"| minioProc
```

---

## Resumen de Decisiones de Arquitectura (ADR)

1. **Neo4j para el Grafo Social:**
   - *Decisión:* Usar Neo4j en lugar de tablas intermedias relacionales SQL con múltiples `JOIN`s recursivos.
   - *Justificación:* Ofrece complejidad temporal $O(k)$ por salto mediante *Index-Free Adjacency*, optimizando consultas como "amigos de mis amigos" y caminos más cortos.

2. **MinIO S3 para Multimedia:**
   - *Decisión:* Separar binarios en Object Storage en lugar de BLOBs en base de datos.
   - *Justificación:* Evita sobrecargar la memoria de la base de datos de grafos y permite distribución estática escalable con URLs pre-firmadas o directas.

3. **WebSockets para Chat en Vivo:**
   - *Decisión:* Conexión dúplex persistente en Quarkus en lugar de HTTP Polling.
   - *Justificación:* Reduce la sobrecarga de cabeceras HTTP a casi cero y provee tiempos de respuesta inferiores a 100 ms.

4. **Web Push con VAPID:**
   - *Decisión:* Notificaciones estándar W3C con Service Worker.
   - *Justificación:* Alerta a los usuarios sobre nuevas publicaciones de personas a quienes siguen incluso cuando no tienen el sitio abierto en primer plano.
