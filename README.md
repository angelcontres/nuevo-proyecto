```typescript
Desarrollado por:

- Paulo Orrala
- Carlos Patiño
- Angel Villon
```

// Prueba de conexion con kanban de linearapp

# **Red Social Distribuida \- Especificación de Arquitectura, Backlog y Ejecución**

Guía integral para el diseño, implementación, justificación técnica y despliegue del sistema distribuido conforme a los requerimientos de la actividad práctica.

## **1\. Diagrama y Flujo de la Arquitectura Distribuida**

                    ┌─────────────────────────┐
                    │      React Frontend     │
                    │   (SPA \+ ServiceWorker) │
                    └────────────┬────────────┘
                                 │
             HTTP REST (JSON)    │    WebSocket (WSS)
             Operaciones CRUD    │    Chat Bidireccional
                                 │
                    ┌────────────▼────────────┐
                    │  Quarkus Backend (Java) │
                    │   (Orquestador Lógico)  │
                    └───┬─────────────┬───────┘
                        │             │
       Cypher (Bolt:7687)│             │ S3 API (HTTP:9000)
       Grafo Social     │             │ Binarios Multimedia
                        │             │
                ┌───────▼──────┐    ┌─▼──────────────┐
                │    Neo4j     │    │  MinIO (S3)    │
                │ Base Grafos  │    │ Object Storage │
                └──────────────┘    └────────────────┘
                        │
                  Web Push (VAPID)
                        │
                ┌───────▼──────────────┐
                │ Navegador de Usuario │
                │   (OS Notification)  │
                └──────────────────────┘

### **Justificación de Tecnologías y Mecanismos de Comunicación**

| Necesidad del Sistema             | Mecanismo Implementado    | ¿Por qué esta tecnología?                                                                                         | ¿Qué problema resuelve?                                                                                                   |
| :-------------------------------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Operaciones Transaccionales**   | **REST / HTTP**           | Protocolo sin estado (_stateless_), semántica estándar (GET, POST, DELETE).                                       | Creación de cuentas, inicio de sesión, publicación y seguimiento sin sobrecoste de canal abierto.                         |
| **Chat en Vivo 1 a 1**            | **WebSockets**            | Conexión bidireccional TCP dúplex persistente con bajísima latencia.                                              | Elimina la sobrecarga de cabeceras HTTP y el consumo ineficiente de CPU del _polling_ periódico.                          |
| **Alertas fuera de la app**       | **Web Push (VAPID)**      | Estándar W3C soportado por el sistema operativo mediante _Service Workers_.                                       | Permite notificar a los usuarios aunque tengan la pestaña cerrada o la aplicación en segundo plano.                       |
| **Grafo Social y Recomendación**  | **Neo4j (Cypher)**        | _Index-free adjacency_: cada nodo almacena punteros directos a sus relaciones adyacentes (![][image1] por salto). | Evita costosos ![][image2] relacionales recursivos al consultar feeds, amigos en común o sugerencias de múltiples saltos. |
| **Multimedia de Publicaciones**   | **MinIO (S3 Compatible)** | Almacenamiento desacoplado orientado a objetos con metadata.                                                      | Mantiene la base de datos de grafos liviana, delegando la persistencia de binarios pesados a un sistema escalable.        |
| **Despliegue y Reproducibilidad** | **Docker & Compose**      | Empaquetado inmutable y redes virtuales puente (_bridge_).                                                        | Garantiza que la topología distribuida arranque con un solo comando sin discrepancias de entorno.                         |

## **2\. Modelo de Grafos en Neo4j**

### **Nodos y Propiedades**

- (:Usuario {id, username, email, nombre, avatarUrl, pushSubscriptionJson})
- (:Post {id, texto, mediaUrl, fechaCreacion})

### **Relaciones**

- (:Usuario)-\[:SIGUE {desde: timestamp}\]-\>(:Usuario)
- (:Usuario)-\[:PUBLICA\]-\>(:Post)
- (:Usuario)-\[:REACCIONA {tipo: 'LIKE', fecha: timestamp}\]-\>(:Post)

## **3\. Las 5 Consultas Cypher Obligatorias (No Triviales)**

### **1\. Feed Cronológico Filtrado por Grafo Social (2 Saltos)**

Obtiene únicamente las publicaciones creadas por los usuarios que el solicitante sigue:

MATCH (u:Usuario {id: \$userId})-\[:SIGUE\]-\>(amigo:Usuario)-\[:PUBLICA\]-\>(p:Post)  
OPTIONAL MATCH (p)\<-\[r:REACCIONA\]-(:Usuario)  
RETURN p.id AS id,  
p.texto AS texto,  
p.mediaUrl AS mediaUrl,  
p.fechaCreacion AS fecha,  
amigo.id AS autorId,  
amigo.username AS autorUsername,  
amigo.avatarUrl AS autorAvatar,  
count(r) AS totalLikes,  
EXISTS((u)-\[:REACCIONA\]-\>(p)) AS likedByMe  
ORDER BY p.fechaCreacion DESC  
LIMIT 20;

### **2\. Algoritmo de Sugerencia de Usuarios (Red Social de Segundo Nivel)**

Calcula recomendaciones basadas en conexiones mutuas ("amigos de amigos" que aún no sigue):

MATCH (u:Usuario {id: \$userId})-\[:SIGUE\]-\>(intermedio:Usuario)-\[:SIGUE\]-\>(sugerido:Usuario)  
WHERE u \<\> sugerido AND NOT (u)-\[:SIGUE\]-\>(sugerido)  
RETURN sugerido.id AS id,  
sugerido.username AS username,  
sugerido.nombre AS nombre,  
sugerido.avatarUrl AS avatar,  
count(intermedio) AS conexionesEnComun,  
collect(intermedio.username) AS seguidosEnComun  
ORDER BY conexionesEnComun DESC  
LIMIT 5;

### **3\. Seguidores y Conexiones en Común entre Dos Perfiles**

Identifica la intersección de seguimiento entre dos perfiles analizados:

MATCH (u1:Usuario {id: \\(userA})\<-\[:SIGUE\]-(comun:Usuario)-\[:SIGUE\]-\>(u2:Usuario {id:\\)userB})  
RETURN comun.id AS id,  
comun.username AS username,  
comun.nombre AS nombre,  
comun.avatarUrl AS avatar;

### **4\. Grado de Separación y Camino Más Corto (Shortest Path)**

Calcula la cadena de conexiones mínimas que unen a dos usuarios distantes:

MATCH p \= shortestPath((origen:Usuario {id: \\(origenId})-\[:SIGUE\*..6\]-\>(destino:Usuario {id:\\)destinoId}))  
WHERE origen \<\> destino  
RETURN \[n IN nodes(p) | n.username\] AS rutaConexion,  
length(p) AS saltosTotales;

### **5\. Tendencias en la Red Extendida (Posts con más interacción a 1 y 2 saltos)**

Detecta publicaciones populares generadas dentro de la red cercana del usuario:

MATCH (u:Usuario {id: \$userId})-\[:SIGUE\*1..2\]-\>(autor:Usuario)-\[:PUBLICA\]-\>(p:Post)  
WHERE p.fechaCreacion \>= datetime() \- duration('P7D')  
MATCH (reactor:Usuario)-\[:REACCIONA\]-\>(p)  
RETURN p.id AS id,  
p.texto AS texto,  
autor.username AS autor,  
count(reactor) AS totalReacciones  
ORDER BY totalReacciones DESC  
LIMIT 10;

## **4. Product Backlog Priorizado y Matriz de Decisión**

Consenso de Planning Poker aplicando la secuencia Fibonacci, priorización matemática con algoritmo **RICE** y categorización **MoSCoW**:

| ID | Épica | Historia de Usuario | MoSCoW | RICE | Estimación | Sprint | Rama Git Sugerida |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **US-01** | Identidad | Registro, sesión y perfil con avatar en MinIO | **Must** | **150.0** | **2 SP** | Sprint 1 | `feature/US-01-auth-perfil` |
| **US-02** | Grafo | Seguir, dejar de seguir y consultar red | **Must** | **140.0** | **2 SP** | Sprint 1 | `feature/US-02-grafo-follow` |
| **US-04** | Contenido | Crear publicación con multimedia S3 | **Must** | **90.0** | **3 SP** | Sprint 1 | `feature/US-04-crear-post-s3` |
| **US-05** | Feed | Feed generado por grafo social (2 saltos) | **Must** | **60.0** | **5 SP** | Sprint 2 | `feature/US-05-feed-grafo` |
| **US-06** | Contenido | Reaccionar a publicaciones (Likes) | **Should** | **75.0** | **2 SP** | Sprint 2 | `feature/US-06-reacciones-likes` |
| **US-03** | Grafo | Sugerencia inteligente de contactos (2do grado) | **Should** | **53.3** | **3 SP** | Sprint 2 | `feature/US-03-sugerencias-amigos` |
| **US-09** | Grafo | Conexiones y seguidores en común | **Should** | **40.0** | **3 SP** | Sprint 2 | `feature/US-09-amigos-en-comun` |
| **US-07** | Chat | Mensajería instantánea 1 a 1 (WebSockets) | **Must** | **40.0** | **5 SP** | Sprint 3 | `feature/US-07-chat-websocket` |
| **US-08** | Alertas | Notificaciones Web Push (VAPID) | **Should** | **32.0** | **5 SP** | Sprint 3 | `feature/US-08-push-notifications` |
| **US-10** | Grafo | Camino más corto (Shortest Path 6 grados) | **Could** | **20.0** | **3 SP** | Sprint 3 | `feature/US-10-shortest-path` |
| **US-11** | Métricas | Tendencias y viralidad en red extendida | **Could** | **20.0** | **3 SP** | Sprint 3 | `feature/US-11-tendencias-red` |

> 📌 **Documentación Completa para Desarrolladores:**
> - [**Especificación Integral BDD/Gherkin y Matriz de Trazabilidad (docs/architecture-and-backlog.md)**](./docs/architecture-and-backlog.md)
> - [**Guía Táctica con Tarjetas Linear/Jira y Comandos cURL (docs/backlog-programadores.md)**](./docs/backlog-programadores.md)
> - [**Dataset Semilla Cypher (docker/neo4j-seed.cql)**](./docker/neo4j-seed.cql)


## **6\. Infraestructura de Contenedores (docker-compose.yml)**

Guarda este archivo en la raíz del proyecto para orquestar la arquitectura completa:

version: '3.8'

services:  
\# Base de Datos de Grafos  
neo4j:  
image: neo4j:5.20-community  
container\_name: redsocial-neo4j  
ports:  
\- "7474:7474" \# Web Browser UI  
\- "7687:7687" \# Protocolo Bolt  
environment:  
\- NEO4J\_AUTH=neo4j/password123  
\- NEO4J\_PLUGINS=\["apoc"\]  
volumes:  
\- neo4j\_data:/data  
networks:  
\- red-distribuida  
healthcheck:  
test: \["CMD", "cypher-shell", "-u", "neo4j", "-p", "password123", "RETURN 1"\]  
interval: 10s  
timeout: 5s  
retries: 5

\# Object Storage compatible con S3  
minio:  
image: minio/minio:RELEASE.2024-05-10T01-41-38Z  
container\_name: redsocial-minio  
ports:  
\- "9000:9000" \# API S3  
\- "9001:9001" \# Consola Web  
environment:  
\- MINIO\_ROOT\_USER=minioadmin  
\- MINIO\_ROOT\_PASSWORD=minioadmin  
command: server /data \--console-address ":9001"  
volumes:  
\- minio\_data:/data  
networks:  
\- red-distribuida

\# Inicializador automático del Bucket en MinIO  
minio-init:  
image: minio/mc:latest  
depends\_on:  
\- minio  
networks:  
\- red-distribuida  
entrypoint: \>  
/bin/sh \-c "  
/usr/bin/mc alias set local <http://minio:9000> minioadmin minioadmin;  
/usr/bin/mc mb local/redsocial-media \--ignore-existing;  
/usr/bin/mc anonymous set download local/redsocial-media;  
exit 0;  
"

\# Backend Quarkus (Java)  
backend:  
build:  
context: ./backend  
dockerfile: Dockerfile.jvm  
container\_name: redsocial-backend  
ports:  
\- "8080:8080"  
environment:  
\- QUARKUS\_NEO4J\_URI=bolt://neo4j:7687  
\- QUARKUS\_NEO4J\_AUTHENTICATION\_USERNAME=neo4j  
\- QUARKUS\_NEO4J\_AUTHENTICATION\_PASSWORD=password123  
\- S3\_ENDPOINT=<http://minio:9000>  
\- S3\_BUCKET=redsocial-media  
\- S3\_ACCESS\_KEY=minioadmin  
\- S3\_SECRET\_KEY=minioadmin  
\- VAPID\_PUBLIC\_KEY=BGw-ejemploClavePublicaVAPID...  
\- VAPID\_PRIVATE\_KEY=ejemploClavePrivadaVAPID...  
\- VAPID\_SUBJECT=mailto:<admin@redsocial.edu.ec>  
depends\_on:  
neo4j:  
condition: service\_healthy  
minio:  
condition: service\_started  
networks:  
\- red-distribuida

\# Frontend React  
frontend:  
build:  
context: ./frontend  
dockerfile: Dockerfile  
container\_name: redsocial-frontend  
ports:  
\- "3000:80"  
depends\_on:  
\- backend  
networks:  
\- red-distribuida

networks:  
red-distribuida:  
driver: bridge

volumes:  
neo4j\_data:  
minio\_data:

## **7. Guía de Despliegue Local y Desarrollo para Programadores**

Para un manual detallado paso a paso con diagramas y solución de problemas, consulta: [**docs/guia-desarrollo-local.md**](./docs/guia-desarrollo-local.md).

---

### **Modo 1: Desarrollo Ágil con Hot-Reload (Recomendado para Programar) ⚡**

Permite modificar el código de Java (Quarkus) y React (Vite) con recarga automática en milisegundos sin reconstruir imágenes Docker.

#### **Paso 1: Levantar los servicios de datos en Docker**
```bash
docker compose up -d neo4j minio minio-init
```

#### **Paso 2: Cargar el dataset de prueba en Neo4j (Datos Semilla)**
Inyecta los 6 usuarios de prueba, relaciones sociales y publicaciones para validar todos los endpoints:
- **Windows (PowerShell):**
  ```powershell
  Get-Content docker\neo4j-seed.cql | docker exec -i redsocial-neo4j cypher-shell -u neo4j -p password123
  ```
- **Linux / macOS / Git Bash:**
  ```bash
  cat docker/neo4j-seed.cql | docker exec -i redsocial-neo4j cypher-shell -u neo4j -p password123
  ```

#### **Paso 3: Iniciar Backend Quarkus en modo Dev**
Abre una terminal:
```bash
cd backend
mvn quarkus:dev
```
- API REST & WebSockets: `http://localhost:8080`
- Swagger UI interactivo: `http://localhost:8080/q/swagger-ui`
- Quarkus Dev UI: `http://localhost:8080/q/dev`

#### **Paso 4: Iniciar Frontend React con Vite**
Abre otra terminal:
```bash
cd frontend
npm install
npm run dev
```
- Interfaz Web SPA: `http://localhost:3000` (con proxy automático a Quarkus `:8080` sin problemas de CORS).

---

### **Modo 2: Despliegue Completo en Contenedores (Demo / Producción) 🐳**

Para arrancar la arquitectura completa 100% contenerizada en una red bridge:

```bash
# 1. Construir y levantar todo en segundo plano:
docker compose up --build -d

# 2. Cargar datos semilla en el contenedor:
docker exec -i redsocial-neo4j cypher-shell -u neo4j -p password123 < docker/neo4j-seed.cql

# 3. Ver logs en tiempo real:
docker compose logs -f
```

---

### **Directorio de Puertos y Consolas de Monitoreo**

| Servicio | URL Local | Credenciales por Defecto | Propósito / Funcionalidad |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:3000](http://localhost:3000) | N/A | SPA con muro social, sugerencias y chat. |
| **Quarkus Dev UI** | [http://localhost:8080/q/dev](http://localhost:8080/q/dev) | N/A | Monitoreo de extensiones, logs y métricas. |
| **Swagger UI** | [http://localhost:8080/q/swagger-ui](http://localhost:8080/q/swagger-ui) | N/A | Prueba interactiva de endpoints JAX-RS. |
| **Neo4j Browser** | [http://localhost:7474](http://localhost:7474) | `neo4j` / `password123` | Explorador visual del grafo e interprete Cypher. |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | `minioadmin` / `minioadmin` | Administrador visual de objetos y buckets S3. |
| **API S3 MinIO** | [http://localhost:9000](http://localhost:9000) | `minioadmin` / `minioadmin` | Endpoint S3 para subida de binarios multimedia. |
| **Protocolo Bolt** | `bolt://localhost:7687` | `neo4j` / `password123` | Conexión directa TCP del backend al grafo. |


[image1]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAWCAYAAACsR+4DAAAC1ElEQVR4Xr1WO2gUURSdIQYUREFdJezOezu72yjYONhpI7FIYRMEC0sLrf0gClZWgoUEq8UmhQhiIViIYiGpRNtACpsogYC9RVCznvs+M/fd+QbEA4+ZOfe+886777MbRS2IJSEQxtuy/yP2amWv+f8I7cPKCrf3KCPWWt9SSr3G8wPaAxYqXhmDnCnlyliBcj8C71ed4aC1uoDEDZh6h+e14XD4SGn9A+8vB4PBEZnvQBPZQnzCqOI1MgZu93q9gwEJjEajwxhjLcuyeRkzIFF0XkfSPXzOyTj4zzA4i8SI6HcA/d6kaXpC8KdJD22G9hvtG9oCz7GIo8RqfB2Px0kQItckQM6DgIH1gQqeQ84v5FznUXBPYXiHcxbefxxppe5iJWqMWSC2ifaJc7QMD9HxDwa/WLcpEcuQ9xPtGeed4BfOSShjrK5iFoi90nyCbsYzPK+yvBIgfknbqq5ynjgaWO4pjtCYzLPfiC25rWKBSm058VFOVgA59ykPbUXwxC1zTkJWTFoj+BXJDwiMkXDhNEfpVG27yp70HImQGInyXAlprArwsaB4jptxB2P5BPZ57lijsaJ/81JaUCwwT4MFa1ux+ZGzTHnYX0+4cFgx2atAt4q1GguBu+W4tvfbGl0rPAZuP2K7uA4WC7ZssIsx2uPwsZ36+xDiN8iYMleFhZd2l+cMbcPHJMzEzKmsRxdjiC2RVk5k2Zl5EFOl9PckSc56HmKnUtz2dD1MJpNDxJVrYQR3MbHnkgfmqNrQuQyN98jbQbtD5uzJC7cM+Ju5MR6gZYHIIplEW+n3+0dZ2MDmy0OhX/ibv8p4PUo6m2gfA7IZhUAoZb/qfivb4dVir7FOFQ5S6iArUFUxArbAedqr9qt8quvg82h/o/+VINgdxQyrnm4LNPwf8ygt4VSZfl2n04CqJaX/UxjkMb7zC7gZ+YTeNvzPq0L7DNozukHq/AWfKbw8dTTLQQAAAABJRU5ErkJggg==
[image2]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAXCAYAAABEQGxzAAADtklEQVR4Xs1WPWhUQRB+RyKoiCgaxbvL7Xt3hxAipDgUBG3EQkGsBe0stEhloWilhYVgFbQJEVEQEexCQDBISolFLAyKGEhASRFEFAxqIOc3t7N5s/P2nTHcoR8M73a++dmdnTfvouifoKAVAc16EPAKqAQcq58pspqNIT/DBuEHWn/YsGWq1fxG86wPbeLFcbxD6wjaRa7hc8IYcxfyDnKv0WhsEnQGpVJpV8QhXJxisbg1tbBArH1O2MdDrVbb0zYXgu6G8yykqWRM2xLq9fp2cCOQTzjULTzPQ55DvlYqlVPantEbiE+yII0Qb7PiVyVPkLyidP1bSZ9C5svlcilg0YMNX0bS9+DrPhVF4M5REjwHfSaNAu4Ib+amMMgA/Fljb77Z399/QO+0gtuD/rRS+xA3NUGV0jwdhhIkSWI0R4B+L/i3kDtRphYW4C7xgU5KvTY2tgOGsfEm9nJd0a3CQKpa7wGOFygZDI9rjm6ENzKeptfbaMV4AJtvONyQ5vjAc7JgemjQGvwAZJYUVBzKC/sz0hC6R2IdBhmRs2s3AWrFMcgqDQJJ6KPZA1W+oygNqSdwu62YQLvJOMa22xStKQ7tCc9nzpY6CTc349aRrosDHJfpilONrRhdOQUNbcTCxsNEKsPmI+QzZEAZUXx6P2lzmVaRO0K+afl+UCHJz5lxJ00EzyFVvOnQVJlkzut7HZBalZO/wu+dmsfNzfE7kXk/JeD/Wh4a65ecP+E1dZItbuBMEWupL8lpXuq5BRaYy1RdgpKw3YjVpNlsnAq1mx61GcBmqq+vb5tYD3PcYV7PhN5zgUKEKz6IhNQOVzRrbAs1ZZIQDLcGffQChXPfoUVNSNDNBsaxNxxMzhT2wH25Qi+u5gzfkG2jMOiwvOElzRESO+GIn9ScBOyGzFonpGWB7jD7v4BcWyOY/ElktVrdT2tKVrHfj8dY9nrGUXrlcsLJG4D/IfBf4ji5imWPoNZgvO9P4P4sCijafa10MNwBNHyshuNwYBrPW2iNjV6kNa76qHOWoP9O4N9Axp2PBPRL5J///6rg/oEs+hPOP1iSxK0Ps6cUMDwcMu0G5W3ID+7Hh3h3PuB5jLjc2kWtg09zwCd4jkJ+QZbpv522JRjbJq1ukBKrL3+OHXWLB+gSyJzWEwo1tBvIUQS/EapszsEKsI/JjwTVHgz5dgN2P3bq/gX8Mds5dCvuH9G9dHmR8/QW7dkuwCXsVOL8OLmMT+SadQydyhcuXZt4YSqs/R/gdvYbnFMROAr4wSIAAAAASUVORK5CYII=
[image3]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAZCAYAAAC1ken9AAAE1ElEQVR4Xu2Yz4scRRTHZ1gFfxIE1zX7o2tnVl0wgsHFH4eQkxFBxUOUCHryYP4AITmLNwWRPQZFchAxetBDjAcR8ZCLoggRRRNIJJrDokFhc0hM4vc7VTX9+nVVd9VML4LmA4/tevXqW69eV1f3bK9XoV9tXiOR5LolB/5H6Wr9QqcrSU/Xepqu9Nt0fL/92xbdAalTVBOrE/OnUh0/udrkIzMJTNQfDAa7tdMSiK7TX15efsUYc6goimfn5uZu1gGJSJ1HcX2DDmgD63gM456WvpXhcBt8O5NWokAuL9t8THRdwQ2AQW/A/oBdhl3Fgg5W4hLh5LDPRftd6sH2yjhJaKGY/x3Yp76N8a+6vPbIuDpVNYxZd/NL+7YSlADzh53z7cXFxRsLY97CDXxIxun5x+COPozknxkOhxhnzkxR4E0IvOjbKysrS/D9DDsLG8jYJhD7O4vBhbC9tLT0INoXYB+ieZ0Kj8J1YMxFV1huoCfgntFxbWDcd7omKO4c/O/12vKRNceA7aZS4MgdieAWclU+zmg/T5/XTFFE/DGO6bnkMXYX2pdgR3OOCs6J+MPan4KqyyZ0fir9fWrfVubTsKrmAueBsb/CLihfpcCWhoQcMgJnHncib9xzwj2iSSm/wGE1zH3OrYFH1CgIuvtC+TSSX+BwQh73GP0AO4Hj4g7d3waOhvuQy0tcHOx12dc8s8UdEadg6zwC8fckbFPHtYGjcxvGfeDyoG1C74WmLII9JlrgYHgrboG887t0XwoY94ux5/cxvid0f0k4Pzf/+bJtdqC9MRi/nMLjQszPz980WsuowAWfpo91DPGKQWUMjBQ4HyzC8E4b+2KZCrzs7oLOb7Aja2tr1+v+HIz9suAOXJP+YEEciP9E3KgZU744855ME93BebhH6jO+/XXfJPBFAr2j2ABXcP247s9BPFVP6b4QLDzir9gjwbKwsLDI9VHHn8NNN2hMVwU29nv4lG/Pzs7eQpMxOiHZxvx78ATcL1ws8mG3a9alvwljd9o30lctsM6iDvNG/Gk8RQult+/9Wfk0FpipYGfew8XrPkEf/QdQjDulE5pfyR2D4u3WBfS4HJg4P9NG8FeTKXfMfu9v0iFOZ0O4+sb++Kl8lzfpFPZz7HucwbfrPvgvyXxacYsLFpig7zIP+V7k49rYXzw4dwvuYGHFX+LM4yK58HEBJfxx4fo3/A7j7kH7NOxsURamUYeg74TceQP3VYOivNkrt29Ap7Kz2c+jaZ90Ov8G1rVD+ev4xyZgZ2DbfRyuj3MyUawKgfHevpBHBNp/wv7Wx4YH+k8yBn8/MvYmUeOkjqvrlIXhlTsrj1MHBXrf6RwZBznqOlUwdpk6sB9hb8POwy721J0I0h5RZXV19dZYgXPgCzC2IMKvBSziNdghrO+RByJfD206PfvWH+nwp7vu9MR0RH1mePxRh8dd7J89U1PYt2nwiEiFxRtgR+kdF6cf7KcOd6b25zKJTiifOmlRYwb22/br0pMp4IDGXizoy/p43W6m1CnJU7CEdDST6GaD3XvvtB/6BC+eu+1V6g4ukXGlznTUdVKz+RfpJsWYSsw/PVunHEFPqNtVmnv/P3RWh86EHLl6sfiYP53pFYKkyqbG1bEj4+PjPVvJ1s36DxMkUNxa70r+AAAAAElFTkSuQmCC

