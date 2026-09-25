# Guía Táctica del Backlog de Desarrollo (Developer Backlog Board)

```typescript
Equipo de Ingeniería:
- Paulo Orrala
- Carlos Patiño
- Angel Villon
```

> **Manual de Operaciones para Programadores:** Este documento contiene las tarjetas de desarrollo listas para ser copiadas y pegadas directamente en **Linear App**, **Jira** o **GitHub Projects / Issues**. Cada tarjeta incluye la especificación técnica exacta, clases a intervenir bajo Arquitectura Hexagonal, endpoints, consultas Cypher y comandos de prueba `cURL` para validar la historia en menos de 5 minutos.

---

## 0. Entorno de Desarrollo Rápido y Datos Semilla

### 1. Levantar Topología de Infraestructura
```bash
# Desde la raíz del proyecto:
docker compose up -d neo4j minio minio-init
```

### 2. Cargar Dataset Semilla en Neo4j (Cypher Shell)
Abre Neo4j Browser (`http://localhost:7474`, `neo4j / password123`) o ejecuta en terminal:
```bash
docker exec -i redsocial-neo4j cypher-shell -u neo4j -p password123 << 'EOF'
// Limpiar base de datos previa
MATCH (n) DETACH DELETE n;

// Crear Restricciones de Unicidad
CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:Usuario) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT unique_post_id IF NOT EXISTS FOR (p:Post) REQUIRE p.id IS UNIQUE;

// Crear Nodos de Usuario
CREATE (carlos:Usuario {id: 'carlos-patino', username: 'carlos', nombre: 'Carlos Patiño', email: 'carlos@upse.edu.ec', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'})
CREATE (paulo:Usuario {id: 'paulo-orrala', username: 'paulo', nombre: 'Paulo Orrala', email: 'paulo@upse.edu.ec', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'})
CREATE (angel:Usuario {id: 'angel-villon', username: 'angel', nombre: 'Angel Villon', email: 'angel@upse.edu.ec', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'})
CREATE (beatriz:Usuario {id: 'beatriz-silva', username: 'beatriz', nombre: 'Beatriz Silva', email: 'beatriz@upse.edu.ec', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'})
CREATE (david:Usuario {id: 'david-mendoza', username: 'david', nombre: 'David Mendoza', email: 'david@upse.edu.ec', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'})
CREATE (elena:Usuario {id: 'elena-vega', username: 'elena', nombre: 'Elena Vega', email: 'elena@upse.edu.ec', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'})

// Relaciones de Seguimiento:
// Carlos sigue a Beatriz y a Paulo
CREATE (carlos)-[:SIGUE {desde: 1727200000000}]->(beatriz)
CREATE (carlos)-[:SIGUE {desde: 1727201000000}]->(paulo)

// Beatriz y Paulo siguen a David (David es sugerencia perfecta para Carlos: 2 amigos mutuos)
CREATE (beatriz)-[:SIGUE {desde: 1727202000000}]->(david)
CREATE (paulo)-[:SIGUE {desde: 1727203000000}]->(david)

// Angel sigue a Beatriz y a Paulo (Beatriz y Paulo son seguidores en común entre Carlos y Angel)
CREATE (angel)-[:SIGUE {desde: 1727204000000}]->(beatriz)
CREATE (angel)-[:SIGUE {desde: 1727205000000}]->(paulo)

// Cadena de Camino Más Corto (Carlos -> Beatriz -> David -> Elena -> 3 saltos)
CREATE (david)-[:SIGUE {desde: 1727206000000}]->(elena)

// Publicaciones de Ejemplo
CREATE (postBeatriz:Post {id: 'post-b1', texto: '¡Bienvenidos a la Red Social Distribuida en UPSE! 🚀', mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', fechaCreacion: 1727260000000})
CREATE (beatriz)-[:PUBLICA]->(postBeatriz)

CREATE (postPaulo:Post {id: 'post-p1', texto: 'Backend con Quarkus y Neo4j corriendo de manera impecable ⚡', mediaUrl: '', fechaCreacion: 1727265000000})
CREATE (paulo)-[:PUBLICA]->(postPaulo)

CREATE (postDavid:Post {id: 'post-d1', texto: 'Este post es de David (Carlos NO debe verlo en su feed social directo)', mediaUrl: '', fechaCreacion: 1727268000000})
CREATE (david)-[:PUBLICA]->(postDavid)

// Reacciones
CREATE (carlos)-[:REACCIONA {tipo: 'LIKE', fecha: 1727269000000}]->(postBeatriz)
CREATE (angel)-[:REACCIONA {tipo: 'LIKE', fecha: 1727269500000}]->(postBeatriz);
EOF
```

---

## 1. Tarjetas del Sprint 1: Fundamentos de Identidad, Grafo y Storage (7 SP)

---

### [TUX-01] US-01: Registro, Sesión y Perfil con Avatar en MinIO
* **Épica:** Identidad
* **Prioridad:** P0 (Must Have)
* **Estimación:** 2 Story Points
* **Rama Git:** `feature/US-01-auth-perfil`
* **Asignado recomendado:** Angel Villon / Paulo Orrala

#### 📝 Descripción
Como nuevo integrante de la red social, quiero registrar mis datos personales y subir mi imagen de avatar al object storage MinIO, para tener mi perfil activo y listo en el grafo social.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que el usuario envía su id, username, email, nombre y avatarUrl
Cuando invoca POST /api/users
Entonces el backend crea el nodo (:Usuario) en Neo4j mediante MERGE idempotente
Y responde con HTTP 201 Created y el payload del usuario.
```

#### 🛠️ Tareas de Desarrollo
1. **Backend (Quarkus Hexagonal):**
   - Verificar modelo `ec.edu.upse.redsocial.domain.model.Usuario`.
   - Inbound Adapter: `UserGraphResource.java` (`POST /api/users`).
   - Outbound Adapter: `Neo4jGrafoAdapter.java` (`guardarUsuario`).
   - Outbound S3 Adapter: `MinioS3StorageAdapter.java` (`subirArchivo`).
2. **Frontend (React + Tailwind):**
   - Interfaz de edición o visualización de perfil en `shared/components/Navbar.tsx`.
   - Manejo del estado del usuario logueado en `App.tsx` (`currentUserId`, `currentUsername`).

#### ⚡ Prueba cURL Inmediata
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "nuevo-programador",
    "username": "dev_upse",
    "email": "dev@upse.edu.ec",
    "nombre": "Programador Insano",
    "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  }'
```
*Respuesta esperada:* `HTTP 201 Created` con el JSON del usuario.

---

### [TUX-02] US-02: Grafo Social: Seguir y Dejar de Seguir
* **Épica:** Grafo Social
* **Prioridad:** P0 (Must Have)
* **Estimación:** 2 Story Points
* **Rama Git:** `feature/US-02-grafo-follow`
* **Asignado recomendado:** Carlos Patiño / Paulo Orrala

#### 📝 Descripción
Como usuario activo, quiero seguir y dejar de seguir a cualquier contacto con un solo clic, garantizando operaciones atómicas sobre las aristas `[:SIGUE]` de Neo4j.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que "carlos-patino" desea seguir a "angel-villon"
Cuando envía POST /api/users/carlos-patino/follow/angel-villon
Entonces se ejecuta el Cypher MERGE (a)-[r:SIGUE]->(b) con timestamp de creación
Y cuando envía DELETE /api/users/carlos-patino/follow/angel-villon
Entonces se ejecuta MATCH (a)-[r:SIGUE]->(b) DELETE r eliminando la relación.
```

#### 🛠️ Tareas de Desarrollo
1. **Backend (Quarkus Hexagonal):**
   - `UserGraphResource.java`: endpoints `POST /{seguidorId}/follow/{seguidoId}` y `DELETE /{seguidorId}/follow/{seguidoId}`.
   - `Neo4jGrafoAdapter.java`: métodos `seguirUsuario` y `dejarDeSeguir`.
2. **Frontend (React):**
   - Servicio `features/network/services/networkApi.ts` (`followUser`, `unfollowUser`).
   - Botón interactivo "Seguir / Dejar de seguir" en `features/network/components/UserSuggestionsCard.tsx`.

#### ⚡ Prueba cURL Inmediata
```bash
# Seguir:
curl -X POST http://localhost:8080/api/users/carlos-patino/follow/angel-villon

# Dejar de seguir:
curl -X DELETE http://localhost:8080/api/users/carlos-patino/follow/angel-villon
```

---

### [TUX-03] US-04: Crear Publicación con Multimedia Desacoplada en S3
* **Épica:** Contenido
* **Prioridad:** P0 (Must Have)
* **Estimación:** 3 Story Points
* **Rama Git:** `feature/US-04-crear-post-s3`
* **Asignado recomendado:** Angel Villon / Carlos Patiño

#### 📝 Descripción
Como creador de contenido, quiero publicar texto acompañado opcionalmente de imágenes almacenadas en MinIO S3, guardando la metadata y la relación `(:Usuario)-[:PUBLICA]->(:Post)` en Neo4j.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que el autor "carlos-patino" envía texto y una URL válida de imagen
Cuando se ejecuta POST /api/posts
Entonces se genera un UUID para el post, se crea el nodo (:Post) con fechaCreacion
Y se enlaza atómicamente al nodo (:Usuario) mediante la relación [:PUBLICA].
```

#### 🛠️ Tareas de Desarrollo
1. **Backend (Quarkus Hexagonal):**
   - Caso de Uso: `CrearPostUseCase.java` y `PostApplicationService.java`.
   - Inbound: `PostResource.java` (`POST /api/posts`).
   - Outbound: `MinioS3StorageAdapter.java` y `Neo4jGrafoAdapter.crearPost()`.
2. **Frontend (React + Tailwind):**
   - Componente `features/feed/components/CreatePostForm.tsx`.
   - Manejador de estado y preview de imagen multimedia.
   - Disparo del evento `onPostCreated` para refrescar el muro.

#### ⚡ Prueba cURL Inmediata
```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "autorId": "carlos-patino",
    "autorUsername": "carlos",
    "texto": "Probando arquitectura distribuida con MinIO y Neo4j 🚀",
    "mediaUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"
  }'
```

---

## 2. Tarjetas del Sprint 2: Feed Social, Interacciones y Analítica (13 SP)

---

### [TUX-04] US-05: Feed Cronológico Filtrado por Grafo Social (2 Saltos)
* **Épica:** Feed Social
* **Prioridad:** P0 (Must Have)
* **Estimación:** 5 Story Points
* **Rama Git:** `feature/US-05-feed-grafo`
* **Asignado recomendado:** Paulo Orrala / Angel Villon

#### 📝 Descripción
Como usuario de la red social, quiero visualizar en mi timeline únicamente las publicaciones generadas por los usuarios que sigo, calculando en tiempo real el total de likes y si ya he reaccionado a cada post.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que "carlos-patino" sigue a "beatriz" y "paulo", pero NO sigue a "david"
Cuando realiza una petición GET a "/api/feed/carlos-patino"
Entonces la respuesta contiene los posts de "beatriz" y "paulo" ordenados descendentemente por fecha
Y excluye completamente la publicación de "david"
Y calcula "totalLikes" y "likedByMe" mediante la relación [:REACCIONA].
```

#### 🛠️ Tareas de Desarrollo
1. **Backend (Quarkus Hexagonal):**
   - Implementar consulta Cypher #1 obligatoria en `Neo4jGrafoAdapter.obtenerFeedCronologico()`.
   - Servicio `FeedApplicationService.java`.
   - Inbound: `FeedResource.java` (`GET /api/feed/{userId}`).
2. **Frontend (React):**
   - Servicio `features/feed/services/feedApi.ts` (`fetchFeedBySocialGraph`).
   - Componentes `FeedList.tsx` y `PostCard.tsx` con soporte para avatars, fecha formateada y badges.

#### ⚡ Prueba cURL Inmediata
```bash
curl -X GET http://localhost:8080/api/feed/carlos-patino
```
*Validación:* Debe retornar los posts `post-b1` y `post-p1`, omitiendo `post-d1`.

---

### [TUX-05] US-06: Reaccionar a Publicaciones (Likes Idempotentes)
* **Épica:** Contenido / Interacciones
* **Prioridad:** P1 (Should Have)
* **Estimación:** 2 Story Points
* **Rama Git:** `feature/US-06-reacciones-likes`
* **Asignado recomendado:** Carlos Patiño

#### 📝 Descripción
Como lector del feed, quiero dar "Me Gusta" a cualquier publicación, actualizando la relación `[:REACCIONA {tipo: 'LIKE'}]` en Neo4j de forma idempotente y reflejando el conteo de inmediato en pantalla.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado un post existente "post-b1"
Cuando el usuario envía POST /api/posts/post-b1/like con {"userId": "carlos-patino"}
Entonces se ejecuta MERGE (u)-[r:REACCIONA {tipo: 'LIKE'}]->(p)
Y el contador de likes en la UI cambia de estado a marcado (color rojo/corazón activo).
```

#### 🛠️ Tareas de Desarrollo
1. **Backend:**
   - Inbound: `PostResource.java` (`POST /api/posts/{postId}/like`).
   - Outbound: `Neo4jGrafoAdapter.alternarLike()`.
2. **Frontend:**
   - Botón de Like interactivo en `features/feed/components/PostCard.tsx`.
   - Actualización optimista de UI (`likedByMe` y `totalLikes + 1`).

#### ⚡ Prueba cURL Inmediata
```bash
curl -X POST http://localhost:8080/api/posts/post-p1/like \
  -H "Content-Type: application/json" \
  -d '{"userId": "carlos-patino"}'
```

---

### [TUX-06] US-03: Sugerencia Inteligente de Contactos (2do Grado)
* **Épica:** Grafo / Algoritmos
* **Prioridad:** P1 (Should Have)
* **Estimación:** 3 Story Points
* **Rama Git:** `feature/US-03-sugerencias-amigos`
* **Asignado recomendado:** Paulo Orrala

#### 📝 Descripción
Como usuario interesado en expandir mi red, quiero recibir sugerencias automáticas de contactos basadas en conexiones de segundo nivel ("amigos de amigos"), ponderadas por la cantidad de intermediarios que tenemos en común.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que "carlos-patino" sigue a "beatriz" y "paulo", y ambos siguen a "david"
Cuando "carlos-patino" solicita sugerencias en GET /api/users/carlos-patino/sugerencias
Entonces "david" aparece en la lista con conexionesEnComun = 2
Y seguidosEnComun = ["beatriz", "paulo"].
```

#### 🛠️ Tareas de Desarrollo
1. **Backend:**
   - Consulta Cypher #2 obligatoria en `Neo4jGrafoAdapter.obtenerSugerenciasUsuarios()`.
   - Inbound: `UserGraphResource.java` (`GET /{userId}/sugerencias`).
2. **Frontend:**
   - `UserSuggestionsCard.tsx` mostrando avatar, nombre, badge con amigos en común y botón directo de "Seguir".

#### ⚡ Prueba cURL Inmediata
```bash
curl -X GET http://localhost:8080/api/users/carlos-patino/sugerencias
```

---

### [TUX-07] US-09: Seguidores y Conexiones en Común entre Dos Perfiles
* **Épica:** Grafo / Analítica
* **Prioridad:** P1 (Should Have)
* **Estimación:** 3 Story Points
* **Rama Git:** `feature/US-09-amigos-en-comun`
* **Asignado recomendado:** Angel Villon / Carlos Patiño

#### 📝 Descripción
Como usuario que inspecciona el perfil de otro colega, quiero conocer qué personas seguimos en común para evaluar afinidad y comunidad compartida.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que "carlos-patino" y "angel-villon" siguen conjuntamente a "beatriz" y "paulo"
Cuando se consulta GET /api/users/comunes?userA=carlos-patino&userB=angel-villon
Entonces se ejecuta la consulta Cypher #3 obligatoria
Y retorna el listado de nodos Usuario correspondientes a "beatriz" y "paulo".
```

#### 🛠️ Tareas de Desarrollo
1. **Backend:**
   - Consulta Cypher #3 obligatoria en `Neo4jGrafoAdapter.obtenerSeguidoresEnComun()`.
   - Inbound: `UserGraphResource.java` (`GET /api/users/comunes`).
2. **Frontend:**
   - Integrar modal o sección de conexiones mutuas en el módulo de red social (`features/network`).

#### ⚡ Prueba cURL Inmediata
```bash
curl -X GET "http://localhost:8080/api/users/comunes?userA=carlos-patino&userB=angel-villon"
```

---

## 3. Tarjetas del Sprint 3: Tiempo Real, Web Push y Métricas (16 SP)

---

### [TUX-08] US-07: Chat Instantáneo 1 a 1 por WebSockets
* **Épica:** Chat en Vivo
* **Prioridad:** P0 (Must Have)
* **Estimación:** 5 Story Points
* **Rama Git:** `feature/US-07-chat-websocket`
* **Asignado recomendado:** Paulo Orrala / Angel Villon

#### 📝 Descripción
Como usuario conectado, quiero enviar y recibir mensajes instantáneos en privado con otro contacto en tiempo real mediante un canal WebSocket TCP dúplex sin sobrecarga de HTTP polling.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que "carlos-patino" y "paulo-orrala" se conectan a ws://localhost:8080/chat/{userId}
Cuando "carlos-patino" transmite el mensaje JSON {"destinatarioId": "paulo-orrala", "contenido": "¡Hola Paulo!"}
Entonces Quarkus despacha el mensaje inmediatamente al canal de "paulo-orrala"
Y se renderiza en la burbuja de chat en menos de 100 milisegundos.
```

#### 🛠️ Tareas de Desarrollo
1. **Backend (Quarkus WebSocket):**
   - Clase `@ServerEndpoint("/chat/{userId}")` en `ChatWebSocket.java`.
   - Manejo concurrente de sesiones mediante `ConcurrentHashMap<String, Session>`.
2. **Frontend (React):**
   - Servicio `features/chat/services/chatSocket.ts` con reconexión automática.
   - Componente flotante `features/chat/components/ChatWidget.tsx` con listado de mensajes e indicador de estado de conexión verde/rojo.

#### ⚡ Prueba WebSocket en Consola del Navegador (F12)
```javascript
// Abrir socket como Carlos
const wsCarlos = new WebSocket("ws://localhost:8080/chat/carlos-patino");
wsCarlos.onmessage = (e) => console.log("Mensaje recibido en Carlos:", JSON.parse(e.data));

// En otra pestaña o cliente como Paulo:
const wsPaulo = new WebSocket("ws://localhost:8080/chat/paulo-orrala");
wsPaulo.onopen = () => {
  wsPaulo.send(JSON.stringify({
    destinatarioId: "carlos-patino",
    contenido: "Probando WebSocket dúplex en Quarkus 🚀",
    timestamp: Date.now()
  }));
};
```

---

### [TUX-09] US-08: Notificación Web Push Asíncrona (VAPID) ante Publicaciones
* **Épica:** Alertas Fuera de la App
* **Prioridad:** P1 (Should Have)
* **Estimación:** 5 Story Points
* **Rama Git:** `feature/US-08-push-notifications`
* **Asignado recomendado:** Carlos Patiño / Paulo Orrala

#### 📝 Descripción
Como seguidor de un perfil, quiero recibir una notificación nativa en mi sistema operativo cuando publiquen nuevo contenido, incluso si no tengo abierta la pestaña del navegador.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado que "carlos-patino" tiene suscripción Web Push guardada en su nodo de Neo4j
Y sigue a "beatriz"
Cuando "beatriz" crea un nuevo post
Entonces el backend recupera las suscripciones push de los seguidores mediante Cypher
Y dispara el payload cifrado VAPID hacia el endpoint de FCM/Push Service
Y el Service Worker "sw.js" despliega la notificación nativa OS.
```

#### 🛠️ Tareas de Desarrollo
1. **Backend:**
   - Inyección de llaves VAPID en `application.properties`.
   - Outbound Adapter: `WebPushNotificationAdapter.java`.
   - Consulta Cypher en `Neo4jGrafoAdapter.obtenerSuscripcionesPushDeSeguidores()`.
2. **Frontend:**
   - `public/sw.js` (Event listener `push` y `notificationclick`).
   - `features/notifications/services/pushService.ts` (Solicitud de permisos y registro de suscripción).

---

### [TUX-10] US-10: Grado de Separación y Camino Más Corto (Shortest Path)
* **Épica:** Grafo Avanzado
* **Prioridad:** P2 (Could Have)
* **Estimación:** 3 Story Points
* **Rama Git:** `feature/US-10-shortest-path`
* **Asignado recomendado:** Angel Villon

#### 📝 Descripción
Como analista de red, quiero conocer el camino mínimo de relaciones de seguimiento que me une con cualquier otro usuario distante de la plataforma (hasta 6 grados de separación).

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado el origen "carlos-patino" y el destino "elena-vega"
Cuando se consulta GET /api/users/camino-corto?origen=carlos-patino&destino=elena-vega
Entonces Neo4j ejecuta shortestPath((origen)-[:SIGUE*..6]->(destino))
Y retorna el array de usernames que forman la cadena y la cantidad de saltos totales.
```

#### 🛠️ Tareas de Desarrollo
1. **Backend:**
   - Consulta Cypher #4 obligatoria en `Neo4jGrafoAdapter.obtenerCaminoMasCorto()`.
   - Inbound: `UserGraphResource.java` (`GET /api/users/camino-corto`).
2. **Frontend:**
   - Botón de "Calcular distancia" en perfiles o tarjeta de sugerencias.

#### ⚡ Prueba cURL Inmediata
```bash
curl -X GET "http://localhost:8080/api/users/camino-corto?origen=carlos-patino&destino=elena-vega"
```
*Respuesta esperada:* `{"rutaConexion": ["carlos", "beatriz", "david", "elena"], "saltosTotales": 3}`.

---

### [TUX-11] US-11: Tendencias en la Red Extendida a 1 y 2 Saltos
* **Épica:** Métricas / Grafo
* **Prioridad:** P2 (Could Have)
* **Estimación:** 3 Story Points
* **Rama Git:** `feature/US-11-tendencias-red`
* **Asignado recomendado:** Carlos Patiño / Paulo Orrala

#### 📝 Descripción
Como usuario de la comunidad, quiero ver las 10 publicaciones más populares (mayor número de reacciones) generadas en los últimos 7 días dentro de mi círculo social extendido a 1 y 2 saltos.

#### 🎯 Criterios de Aceptación (Gherkin)
```gherkin
Dado el usuario "carlos-patino"
Cuando solicita GET /api/posts/tendencias/carlos-patino
Entonces se ejecuta la consulta Cypher #5 obligatoria
Y retorna las publicaciones con más interacciones ocurridas en los últimos 7 días.
```

#### 🛠️ Tareas de Desarrollo
1. **Backend:**
   - Consulta Cypher #5 obligatoria en `Neo4jGrafoAdapter.obtenerTendenciasRedExtendida()`.
   - Inbound: `PostResource.java` (`GET /api/posts/tendencias/{userId}`).
2. **Frontend:**
   - Componente widget de Tendencias en la barra lateral derecha.

#### ⚡ Prueba cURL Inmediata
```bash
curl -X GET http://localhost:8080/api/posts/tendencias/carlos-patino
```

---

## 4. Matriz de Comandos Git para los Desarrolladores

Para tomar una tarjeta e iniciar el desarrollo:

```bash
# 1. Asegurar la última versión de develop
git checkout develop
git pull origin develop

# 2. Crear la rama de la historia seleccionada (ejemplo US-05)
git checkout -b feature/US-05-feed-grafo

# 3. Realizar commits convencionales atómicos
git add .
git commit -m "feat(feed): implement Cypher 2-hop traversal in Neo4j adapter"

# 4. Publicar rama en GitHub
git push -u origin feature/US-05-feed-grafo

# 5. Abrir Pull Request hacia 'develop' y solicitar revisión a Paulo, Carlos o Angel.
```
