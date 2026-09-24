# Especificación de Arquitectura, Backlog y Ejecución

```typescript
Desarrollado por:

- Paulo Orrala
- Carlos Patiño
- Angel Villon
```

Este documento consolida la arquitectura del sistema distribuido, el modelo de grafos, las consultas Cypher obligatorias, el backlog con estimación en Story Points y los criterios de aceptación en formato BDD/Gherkin.

---

## 1. Topología y Mecanismos de Comunicación

| Necesidad del Sistema | Mecanismo Implementado | ¿Por qué esta tecnología? | ¿Qué problema resuelve? |
| :--- | :--- | :--- | :--- |
| **Operaciones Transaccionales** | **REST / HTTP (JSON)** | Protocolo sin estado (*stateless*), semántica estándar (GET, POST, DELETE). | Creación de cuentas, inicio de sesión, publicación y seguimiento sin sobrecoste de canal abierto. |
| **Chat en Vivo 1 a 1** | **WebSockets** | Conexión bidireccional TCP dúplex persistente con bajísima latencia. | Elimina la sobrecarga de cabeceras HTTP y el consumo ineficiente de CPU del *polling* periódico. |
| **Alertas fuera de la app** | **Web Push (VAPID)** | Estándar W3C soportado por el sistema operativo mediante *Service Workers*. | Permite notificar a los usuarios aunque tengan la pestaña cerrada o la aplicación en segundo plano. |
| **Grafo Social y Recomendación** | **Neo4j (Cypher)** | *Index-free adjacency*: cada nodo almacena punteros directos a sus relaciones adyacentes ($O(1)$ por salto). | Evita costosos `JOIN`s relacionales recursivos al consultar feeds, amigos en común o sugerencias de múltiples saltos. |
| **Multimedia de Publicaciones** | **MinIO (S3 Compatible)** | Almacenamiento desacoplado orientado a objetos con metadata. | Mantiene la base de datos de grafos liviana, delegando la persistencia de binarios pesados a un sistema escalable. |
| **Despliegue y Reproducibilidad** | **Docker & Compose** | Empaquetado inmutable y redes virtuales puente (*bridge*). | Garantiza que la topología distribuida arranque con un solo comando sin discrepancias de entorno. |

---

## 2. Modelo de Grafos en Neo4j

### Nodos y Propiedades
- **`(:Usuario)`**: `{id, username, email, nombre, avatarUrl, pushSubscriptionJson}`
- **`(:Post)`**: `{id, texto, mediaUrl, fechaCreacion}`

### Relaciones
- `(:Usuario)-[:SIGUE {desde: timestamp}]->(:Usuario)`
- `(:Usuario)-[:PUBLICA]->(:Post)`
- `(:Usuario)-[:REACCIONA {tipo: 'LIKE', fecha: timestamp}]->(:Post)`

---

## 3. Catálogo de Consultas Cypher Obligatorias (No Triviales)

### 1. Feed Cronológico Filtrado por Grafo Social (2 Saltos)
Obtiene únicamente las publicaciones creadas por los usuarios que el solicitante sigue:
```cypher
MATCH (u:Usuario {id: $userId})-[:SIGUE]->(amigo:Usuario)-[:PUBLICA]->(p:Post)
OPTIONAL MATCH (p)<-[r:REACCIONA]-(:Usuario)
RETURN p.id AS id, 
       p.texto AS texto, 
       p.mediaUrl AS mediaUrl, 
       p.fechaCreacion AS fecha,
       amigo.id AS autorId, 
       amigo.username AS autorUsername, 
       amigo.avatarUrl AS autorAvatar,
       count(r) AS totalLikes,
       EXISTS((u)-[:REACCIONA]->(p)) AS likedByMe
ORDER BY p.fechaCreacion DESC
LIMIT 20;
```

### 2. Algoritmo de Sugerencia de Usuarios (Red Social de Segundo Nivel)
Calcula recomendaciones basadas en conexiones mutuas ("amigos de amigos" que aún no sigue):
```cypher
MATCH (u:Usuario {id: $userId})-[:SIGUE]->(intermedio:Usuario)-[:SIGUE]->(sugerido:Usuario)
WHERE u <> sugerido AND NOT (u)-[:SIGUE]->(sugerido)
RETURN sugerido.id AS id, 
       sugerido.username AS username, 
       sugerido.nombre AS nombre, 
       sugerido.avatarUrl AS avatar,
       count(intermedio) AS conexionesEnComun,
       collect(intermedio.username) AS seguidosEnComun
ORDER BY conexionesEnComun DESC
LIMIT 5;
```

### 3. Seguidores y Conexiones en Común entre Dos Perfiles
Identifica la intersección de seguimiento entre dos perfiles analizados:
```cypher
MATCH (u1:Usuario {id: $userA})<-[:SIGUE]-(comun:Usuario)-[:SIGUE]->(u2:Usuario {id: $userB})
RETURN comun.id AS id, 
       comun.username AS username, 
       comun.nombre AS nombre, 
       comun.avatarUrl AS avatar;
```

### 4. Grado de Separación y Camino Más Corto (Shortest Path)
Calcula la cadena de conexiones mínimas que unen a dos usuarios distantes:
```cypher
MATCH p = shortestPath((origen:Usuario {id: $origenId})-[:SIGUE*..6]->(destino:Usuario {id: $destinoId}))
WHERE origen <> destino
RETURN [n IN nodes(p) | n.username] AS rutaConexion, 
       length(p) AS saltosTotales;
```

### 5. Tendencias en la Red Extendida (Posts con más interacción a 1 y 2 saltos)
Detecta publicaciones populares generadas dentro de la red cercana del usuario:
```cypher
MATCH (u:Usuario {id: $userId})-[:SIGUE*1..2]->(autor:Usuario)-[:PUBLICA]->(p:Post)
WHERE p.fechaCreacion >= datetime() - duration('P7D')
MATCH (reactor:Usuario)-[:REACCIONA]->(p)
RETURN p.id AS id, 
       p.texto AS texto, 
       autor.username AS autor, 
       count(reactor) AS totalReacciones
ORDER BY totalReacciones DESC
LIMIT 10;
```

---

## 4. Product Backlog y Consenso de Estimación

Consenso de Planning Poker aplicando la secuencia Fibonacci:

| ID | Épica | Historia de Usuario | Consenso | Criterio de Aceptación Principal |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Identidad | Registro, login y perfil con foto | **2 SP** | Autenticación JWT, subida de avatar a MinIO y persistencia de nodo (:Usuario) en Neo4j. |
| **US-02** | Grafo | Seguir, dejar de seguir y consultar red | **2 SP** | Creación/destrucción atómica de la relación [:SIGUE]. |
| **US-03** | Grafo | Sugerencia inteligente de contactos | **3 SP** | Implementación de Cypher recursivo de 2do grado ponderado por amigos mutuos. |
| **US-04** | Contenido | Crear publicación con multimedia S3 | **3 SP** | Separación estricta: binario a MinIO, URL y metadata a nodo (:Post) con relación [:PUBLICA]. |
| **US-05** | Feed | Feed generado por grafo social | **5 SP** | Recorrido (u)-[:SIGUE]->()-[:PUBLICA]->(p) ordenado cronológicamente. |
| **US-06** | Contenido | Reaccionar a publicaciones (Likes) | **2 SP** | Gestión idempotente de la relación [:REACCIONA {tipo: 'LIKE'}]. |
| **US-07** | Chat | Mensajería instantánea 1 a 1 | **5 SP** | Comunicación bidireccional mediante WebSocket en Quarkus sin polling. |
| **US-08** | Alertas | Notificaciones Web Push al publicar | **5 SP** | Disparo de eventos hacia la suscripción del Service Worker del navegador ante nuevos posts. |

---

## 5. Especificaciones en Formato BDD / Gherkin

### US-05: Feed Basado en Grafo Social
```gherkin
Característica: Generación del feed a partir de relaciones de seguimiento

  Escenario: Usuario visualiza publicaciones de sus seguidos
    Dado que el usuario "Carlos" sigue a "Beatriz" en el grafo
    Y "Beatriz" ha publicado un post hace 1 hora
    Y "David" (a quien "Carlos" NO sigue) ha publicado un post hace 5 minutos
    Cuando "Carlos" solicita su feed principal
    Entonces la consulta Cypher recorre (:Usuario {username: 'Carlos'})-[:SIGUE]->()-[:PUBLICA]->(:Post)
    Y el feed muestra la publicación de "Beatriz"
    Y la publicación de "David" es excluida del resultado.
```

### US-07: Chat en Tiempo Real por WebSockets
```gherkin
Característica: Mensajería bidireccional en tiempo real

  Escenario: Envío instantáneo de mensaje entre usuarios conectados
    Dado que "Usuario 1" y "Usuario 2" tienen una sesión WebSocket abierta en Quarkus
    Cuando "Usuario 1" transmite un paquete de texto dirigido a "Usuario 2"
    Entonces el socket enruta el mensaje directamente a la sesión activa del destinatario
    Y el mensaje aparece en la pantalla del "Usuario 2" sin que este realice peticiones HTTP de sondeo (polling).
```

### US-08: Notificación Web Push ante Nueva Publicación
```gherkin
Característica: Notificación fuera del navegador con Web Push

  Escenario: Notificar a un seguidor cuando se genera contenido nuevo
    Dado que "Anthony" sigue a "Carlos" en el grafo social
    Y "Anthony" tiene suscripción Web Push activa registrada en su nodo
    Cuando "Carlos" crea una nueva publicación vía REST
    Entonces el backend detecta los seguidores suscritos mediante Cypher
    Y Quarkus envía la carga útil cifrada con llaves VAPID al servicio Push del navegador
    Y el Service Worker de "Anthony" despliega una notificación nativa del sistema operativo.
```
